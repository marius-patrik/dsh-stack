/**
 * `dsh-actions`: explicit per-session actions (formerly session modes) with
 * durable state, executor policy, request routing, a file-defined vocabulary
 * under `.agents/actions`, and the reload actions (soft client reload and the
 * hard server self-restart).
 * @module dsh-actions
 */

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { BUILT_IN_ACTIONS, DEFAULT_ACTION, type ActionRoute, type ActionSpec } from './action.js'
import { ActionCatalog } from './catalog.js'
import { ACTION_SELECTED, ActionsController } from './controller.js'
import { createReloadHandler } from './reload.js'

export { ACTIONS, BUILT_IN_ACTIONS, DEFAULT_ACTION, MODES, parseAction, sanitizeId } from './action.js'
export type { ActionRoute, ActionSpec, BuiltInAction } from './action.js'
export { ActionCatalog } from './catalog.js'
export type { ActionCatalogConfig } from './catalog.js'
export { ACTION_SELECTED, LEGACY_MODE_SELECTED, ActionsController, ModesController, foldAction } from './controller.js'
export type { ActionState } from './controller.js'
export * from './reload.js'

export const name = 'dsh-actions'
export const inject = ['commands', 'systemPrompt', 'webServer']

declare module '@deepseek-ai/cordis' {
  interface Context {
    actions: ActionsController
    /** @deprecated compat alias for the pre-rename service name. */
    sessionModes: ActionsController
  }
}

/** @deprecated compat alias for the pre-rename type name. */
export type SessionMode = string

export interface Config {
  /** The action a fresh session runs on. */
  defaultAction?: string
  /** @deprecated compat alias for {@link Config.defaultAction}. */
  defaultMode?: string
  /** Per-action provider/model routing. */
  routes?: Record<string, ActionRoute>
  /** Per-action tool allowlists. */
  tools?: Record<string, readonly string[]>
  /** The authoring root for file-defined actions (default: <DSH_HOME>/actions). */
  actionsRoot?: string
}

/** The DSH home root, matching the launcher's resolution. */
function dshHome(): string {
  return resolve(process.env.DSH_HOME ?? join(homedir(), '.agents'))
}

export function apply(ctx: Context, config: Config = {}): void {
  const root = config.actionsRoot ?? join(dshHome(), 'actions')
  const catalog = new ActionCatalog({ root })
  const defaultAction = config.defaultAction ?? config.defaultMode ?? DEFAULT_ACTION
  const controller = new ActionsController(defaultAction, (id) => catalog.ids().includes(id))

  const provider = ctx as unknown as { provide(name: string, value: unknown): unknown }
  provider.provide('actions', controller)
  provider.provide('sessionModes', controller)

  void catalog.load()

  const eventContext = ctx as unknown as { on(name: string, listener: (...args: any[]) => any): unknown }

  // Commit a queued action at the next accepted in-turn step, and append the
  // durable selection event (new name; the fold accepts the legacy name too).
  eventContext.on('agent/pre-step', async (payload: any, next: () => Promise<any>) => {
    const decision = await next()
    if (decision?.kind === 'enter' && !payload.signal?.aborted) {
      const pending = controller.get(payload.agent).pending
      if (pending !== undefined) {
        controller.commit(payload.agent)
        const session = payload.agent?.session as { append?: (type: string, data: unknown) => unknown } | undefined
        session?.append?.(ACTION_SELECTED, { action: pending, mode: pending })
      }
    }
    return decision
  })

  // Executor policy: the active action's allowlist gates every tool call.
  eventContext.on('tools/pre-execute', async (exec: any, next: () => Promise<any>) => {
    const active = controller.get(exec.agent).active
    const allow = config.tools?.[active] ?? catalog.get(active)?.tools
    if (allow !== undefined && !allow.includes(exec.name)) {
      return { kind: 'deny', reason: `Tool ${exec.name} is unavailable in the ${catalog.nameOf(active)} action.` }
    }
    return next()
  })

  // Request routing: the active action may pin a provider/model.
  eventContext.on('agent/request', async (payload: any, next: () => Promise<any>) => {
    const request = await next()
    const active = controller.get(payload.agent).active
    const route = config.routes?.[active] ?? catalog.get(active)?.route
    return route === undefined ? request : { ...request, ...route }
  })

  const prompts = (ctx as unknown as { systemPrompt?: { section(definition: unknown): unknown } }).systemPrompt
  prompts?.section({
    name: 'action:policy',
    order: 50,
    text: ({ agent }: { agent?: object }) => {
      if (agent === undefined) return ''
      const active = controller.get(agent).active
      const policy = catalog.get(active)?.policy ?? ''
      return `Current session action: ${catalog.nameOf(active)}.${policy === '' ? '' : ` ${policy}`}`
    },
  })

  const commands = (ctx as unknown as { commands?: { register(definition: unknown): () => void } }).commands
  const selectHandler = ({ agent, rawInput }: { agent: object; rawInput: string }) => {
    const id = rawInput.trim()
    if (!catalog.ids().includes(id)) return { kind: 'error', text: `Unknown action: ${id}` }
    const result = controller.set(agent, id)
    return { kind: 'success', text: result === 'noop' ? `Action already ${id}` : `Action queued: ${id}` }
  }
  commands?.register({
    name: 'action',
    description: 'Select the session action',
    input: { hint: `[${catalog.ids().join('|')}]` },
    handler: selectHandler,
  })
  // Compat: the pre-rename command name keeps working.
  commands?.register({
    name: 'mode',
    description: 'Select the session action (alias of /action)',
    input: { hint: `[${catalog.ids().join('|')}]` },
    handler: selectHandler,
  })

  ;(ctx as unknown as { inject(services: string[], callback: (sub: unknown) => void): void }).inject?.(
    ['webServer'],
    (sub) => {
      const webCtx = sub as unknown as {
        webServer: {
          register(definition: {
            kind: 'exact' | 'prefix'
            method?: string
            path: string
            handler: (req: any, res: any) => Promise<void> | void
          }): () => void
        }
      }
      const json = (res: any, status: number, body: unknown): void => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(body))
      }
      const describe = (action: ActionSpec) => ({
        id: action.id,
        name: action.name ?? action.id,
        description: action.description ?? null,
        tools: action.tools ?? null,
        route: action.route ?? null,
        source: action.source ?? null,
        builtIn: BUILT_IN_ACTIONS.some((builtIn) => builtIn.id === action.id),
      })

      // The action vocabulary (built-ins + file-defined) — also the run palette's data.
      const listHandler = async (_req: unknown, res: any) => {
        await catalog.load()
        json(res, 200, {
          defaultAction,
          root,
          actions: catalog.list().map(describe),
          commands: [
            { id: 'reload-app', name: 'Reload App', description: 'Reload the browser UI; server-side agents keep running and reattach.', kind: 'soft' },
            { id: 'force-reload', name: 'Force Reload', description: 'Restart the dsh web server itself, then reload the UI.', kind: 'force' },
          ],
        })
      }
      webCtx.webServer.register({ kind: 'exact', path: '/actions', handler: listHandler })
      // Compat: the pre-rename route.
      webCtx.webServer.register({ kind: 'exact', path: '/session-modes', handler: listHandler })

      // The hard path: server self-restart that answers before it exits.
      webCtx.webServer.register({
        kind: 'exact',
        method: 'POST',
        path: '/actions/api/reload',
        handler: createReloadHandler(),
      })
    },
  )
}
