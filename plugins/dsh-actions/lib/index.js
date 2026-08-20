/**
 * `dsh-actions`: explicit per-session actions (formerly session modes) with
 * durable state, executor policy, request routing, a file-defined vocabulary
 * under `.agents/actions`, and the reload actions (soft client reload and the
 * hard server self-restart).
 * @module dsh-actions
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { BUILT_IN_ACTIONS, DEFAULT_ACTION } from './action.js';
import { ActionCatalog } from './catalog.js';
import { ACTION_SELECTED, ActionsController } from './controller.js';
import { createReloadHandler } from './reload.js';
export { ACTIONS, BUILT_IN_ACTIONS, DEFAULT_ACTION, MODES, parseAction, sanitizeId } from './action.js';
export { ActionCatalog } from './catalog.js';
export { ACTION_SELECTED, LEGACY_MODE_SELECTED, ActionsController, ModesController, foldAction } from './controller.js';
export * from './reload.js';
export const name = 'dsh-actions';
export const inject = ['commands', 'systemPrompt', 'webServer'];
/** The DSH home root, matching the launcher's resolution. */
function dshHome() {
    return resolve(process.env.DSH_HOME ?? join(homedir(), '.agents'));
}
export function apply(ctx, config = {}) {
    const root = config.actionsRoot ?? join(dshHome(), 'actions');
    const catalog = new ActionCatalog({ root });
    const defaultAction = config.defaultAction ?? config.defaultMode ?? DEFAULT_ACTION;
    const controller = new ActionsController(defaultAction, (id) => catalog.ids().includes(id));
    const provider = ctx;
    provider.provide('actions', controller);
    provider.provide('sessionModes', controller);
    void catalog.load();
    const eventContext = ctx;
    // Commit a queued action at the next accepted in-turn step, and append the
    // durable selection event (new name; the fold accepts the legacy name too).
    eventContext.on('agent/pre-step', async (payload, next) => {
        const decision = await next();
        if (decision?.kind === 'enter' && !payload.signal?.aborted) {
            const pending = controller.get(payload.agent).pending;
            if (pending !== undefined) {
                controller.commit(payload.agent);
                const session = payload.agent?.session;
                session?.append?.(ACTION_SELECTED, { action: pending, mode: pending });
            }
        }
        return decision;
    });
    // Executor policy: the active action's allowlist gates every tool call.
    eventContext.on('tools/pre-execute', async (exec, next) => {
        const active = controller.get(exec.agent).active;
        const allow = config.tools?.[active] ?? catalog.get(active)?.tools;
        if (allow !== undefined && !allow.includes(exec.name)) {
            return { kind: 'deny', reason: `Tool ${exec.name} is unavailable in the ${catalog.nameOf(active)} action.` };
        }
        return next();
    });
    // Request routing: the active action may pin a provider/model.
    eventContext.on('agent/request', async (payload, next) => {
        const request = await next();
        const active = controller.get(payload.agent).active;
        const route = config.routes?.[active] ?? catalog.get(active)?.route;
        return route === undefined ? request : { ...request, ...route };
    });
    const prompts = ctx.systemPrompt;
    prompts?.section({
        name: 'action:policy',
        order: 50,
        text: ({ agent }) => {
            if (agent === undefined)
                return '';
            const active = controller.get(agent).active;
            const policy = catalog.get(active)?.policy ?? '';
            return `Current session action: ${catalog.nameOf(active)}.${policy === '' ? '' : ` ${policy}`}`;
        },
    });
    const commands = ctx.commands;
    const selectHandler = ({ agent, rawInput }) => {
        const id = rawInput.trim();
        if (!catalog.ids().includes(id))
            return { kind: 'error', text: `Unknown action: ${id}` };
        const result = controller.set(agent, id);
        return { kind: 'success', text: result === 'noop' ? `Action already ${id}` : `Action queued: ${id}` };
    };
    commands?.register({
        name: 'action',
        description: 'Select the session action',
        input: { hint: `[${catalog.ids().join('|')}]` },
        handler: selectHandler,
    });
    // Compat: the pre-rename command name keeps working.
    commands?.register({
        name: 'mode',
        description: 'Select the session action (alias of /action)',
        input: { hint: `[${catalog.ids().join('|')}]` },
        handler: selectHandler,
    });
    ctx.inject?.(['webServer'], (sub) => {
        const webCtx = sub;
        const json = (res, status, body) => {
            res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
            res.end(JSON.stringify(body));
        };
        const describe = (action) => ({
            id: action.id,
            name: action.name ?? action.id,
            description: action.description ?? null,
            tools: action.tools ?? null,
            route: action.route ?? null,
            source: action.source ?? null,
            builtIn: BUILT_IN_ACTIONS.some((builtIn) => builtIn.id === action.id),
        });
        // The action vocabulary (built-ins + file-defined) — also the run palette's data.
        const listHandler = async (_req, res) => {
            await catalog.load();
            json(res, 200, {
                defaultAction,
                root,
                actions: catalog.list().map(describe),
                commands: [
                    { id: 'reload-app', name: 'Reload App', description: 'Reload the browser UI; server-side agents keep running and reattach.', kind: 'soft' },
                    { id: 'force-reload', name: 'Force Reload', description: 'Restart the dsh web server itself, then reload the UI.', kind: 'force' },
                ],
            });
        };
        webCtx.webServer.register({ kind: 'exact', path: '/actions', handler: listHandler });
        // Compat: the pre-rename route.
        webCtx.webServer.register({ kind: 'exact', path: '/session-modes', handler: listHandler });
        // The hard path: server self-restart that answers before it exits.
        webCtx.webServer.register({
            kind: 'exact',
            method: 'POST',
            path: '/actions/api/reload',
            handler: createReloadHandler(),
        });
    });
}
