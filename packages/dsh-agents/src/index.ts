/**
 * `dsh-agents`: custom agents as JSON/Markdown persona files for the dsh
 * harness. A persona file in the authoring directory (default `<dshHome>/agents`)
 * is materialized as an agent preset under the harness's user preset root, so
 * it appears in every preset picker without a restart. The materialized preset
 * is the base preset's composition (default `standard`) with a neutral persona
 * row — the agent keeps the base's capabilities, and the live persona comes
 * from the `persona:policy` prompt section, which resolves the session's
 * persona from the runtime catalog.
 *
 * Live persona switching mirrors the harness's own plan-mode pattern: a
 * durable `persona/selected` session-log event folded on read, selections kept
 * pending during an open turn and committed at the next accepted in-turn
 * pre-step, a `/persona` command, and a `persona` session projection the web
 * client folds into its composer badge and switcher. Switching changes session
 * state only — never the mounted composition (blank-session-locked) — so it
 * works mid-conversation.
 * @module dsh-agents
 */

import type { Context } from '@deepseek-ai/cordis'
import { watch } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import {
  NS, AgentSettings, authoringRoot, defaultBase, defaultPersona,
  type AgentSettings as AgentSettingsType,
} from './settings.js'
import { basePresetDir, syncPersonas } from './sync.js'
import { PersonaCatalog } from './catalog.js'
import { PERSONA_SELECTED, PersonaController, foldPersona } from './controller.js'
import type { HostAgent, HostSessionEvent, PreStepDecision } from './types.js'

export type * from './settings.js'
export type * from './persona.js'
export type * from './compose.js'
export type * from './sync.js'
export type * from './catalog.js'
export type * from './controller.js'
export type * from './types.js'

export const name = 'dsh-agents'
export const inject: string[] = []

/** Deployment configuration: the same fields the settings section carries. */
export const Config: z<AgentSettingsType> = AgentSettings

/** How long a burst of authoring-directory events is debounced before a sync. */
const WATCH_DEBOUNCE_MS = 250

/** The narrow prompt-section context: the assembling agent, when scoped. */
interface SectionContext {
  agent?: HostAgent
}

/** The session-projection registry face the `persona` unit registers with. */
interface ProjectionFace {
  register(definition: {
    key: string
    schema: unknown
    init: () => { personaId: string; pending: boolean }
    apply: (state: { personaId: string; pending: boolean }, event: HostSessionEvent) => { personaId: string; pending: boolean }
    view: (state: { personaId: string; pending: boolean }) => { personaId: string; pending: boolean }
    stateVersion: number
  }): () => void
}

/** The command registry face the `/persona` command registers with. */
interface CommandFace {
  register(definition: {
    name: string
    description: string
    input?: { hint: string }
    handler: (payload: { agent: HostAgent; rawInput: string }) =>
      { kind: 'success'; text: string } | { kind: 'error'; text: string }
  }): () => void
}

/** The harness event hub face the pre-step listener registers with. */
interface EventHub {
  on(
    event: string,
    listener: (payload: { agent: HostAgent; signal: AbortSignal }, next: () => Promise<PreStepDecision>) => Promise<PreStepDecision>,
  ): unknown
}

/**
 * The `persona:policy` section text for one assembly: the live persona (a
 * pending selection or the last committed `persona/selected`) wins; without
 * one, the session's composed preset persona (`header.agentPreset`) applies;
 * then the configured `defaultPersona`. A persona only renders when the
 * runtime catalog knows it — otherwise the deployment persona stands.
 */
export function personaPolicyText(
  context: SectionContext,
  controller: PersonaController,
  catalog: PersonaCatalog,
  fallback: string | undefined,
): string {
  const agent = context.agent
  if (agent === undefined) return ''
  const live = controller.pendingOf(agent) ?? foldPersona(agent.session.events)
  const livePersona = live !== '' ? catalog.get(live) : undefined
  if (livePersona !== undefined) return livePersona.prompt
  const headerId = agent.session.header?.agentPreset
  const headerPersona = headerId !== undefined ? catalog.get(headerId) : undefined
  if (headerPersona !== undefined) return headerPersona.prompt
  const fallbackPersona = fallback !== undefined ? catalog.get(fallback) : undefined
  return fallbackPersona?.prompt ?? ''
}

/**
 * Best-effort materialization: never fails a boot over an authoring problem
 * (a persona file out of date with the plugin, a read error, a full disk).
 * @returns whether the sync produced no failed files.
 */
async function syncOnce(ctx: Context, home: string, root: string, baseDir: string | undefined): Promise<boolean> {
  try {
    const report = await syncPersonas(home, root, baseDir)
    if (report.failed.length > 0) {
      for (const failure of report.failed) ctx.logger.warn(`dsh-agents: ${failure}`)
    }
    if (report.materialized.length > 0 || report.pruned.length > 0) {
      ctx.logger.info(
        `dsh-agents: ${report.materialized.map((m) => m.id).join(', ') || 'no presets'} materialized; `
        + `${report.pruned.join(', ') || 'nothing'} pruned`,
      )
    }
    return report.failed.length === 0
  } catch (error) {
    ctx.logger.warn(`dsh-agents: sync failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Install the plugin: register the `dsh-agents` settings section, then (once
 * the settings service is live) resolve the authoring directory, load the
 * runtime catalog, sync once at boot, re-sync debounced whenever the
 * authoring directory changes, and mount the live-persona surface — the
 * `persona:policy` section, the `persona` projection unit, the `/persona`
 * command, and the pending-commit pre-step listener.
 */
export function apply(ctx: Context, config: AgentSettingsType): void {
  installSettingsSection(ctx, NS, AgentSettings, { root: undefined, defaultBase: undefined, defaultPersona: undefined }, {
    setSource: () => {},
    onChange: () => {},
  })

  ctx.inject(['settings'], (sctx) => {
    const settings = sctx.settings.get(NS) as AgentSettingsType | undefined
    const home = resolveDshHome()
    const root = authoringRoot(home, settings, config)
    const base = defaultBase(settings, config)
    const fallback = defaultPersona(settings, config)
    const baseDir = basePresetDir()

    const catalog = new PersonaCatalog({ root })
    const controller = new PersonaController({ resolve: (personaId) => catalog.get(personaId) !== undefined })
    ;(sctx as unknown as { provide(name: string, value: unknown): unknown }).provide('personaController', controller)
    ;(sctx as unknown as { provide(name: string, value: unknown): unknown }).provide('personaCatalog', catalog)

    const events = sctx as unknown as EventHub
    events.on('agent/pre-step', async (payload, next): Promise<PreStepDecision> => {
      const decision = await next()
      if (decision.kind === 'reject' || payload.signal.aborted) return decision
      const pending = controller.pendingOf(payload.agent)
      if (pending === undefined) return decision
      try {
        controller.commitPending(payload.agent.session)
      } catch (error) {
        ctx.logger.warn('dsh-agents: failed to append selected persona at step start: %o', error)
      }
      return decision
    })

    sctx.inject(['systemPrompt'], (pctx) => {
      const systemPrompt = pctx as unknown as {
        systemPrompt: { section(definition: { name: string; order: number; text: (context: SectionContext) => string }): () => void }
      }
      pctx.effect(() => systemPrompt.systemPrompt.section({
        name: 'persona:policy',
        order: 45,
        text: (context) => personaPolicyText(context, controller, catalog, fallback),
      }), 'dsh-agents: persona:policy section')
    })

    sctx.inject(['sessionProjections'], (pctx) => {
      const projections = pctx as unknown as { sessionProjections: ProjectionFace }
      const personaSchema = z.object({ personaId: z.string(), pending: z.boolean() })
      type PersonaState = { personaId: string; pending: boolean }
      const projectionSchema = Object.assign((v: unknown) => personaSchema(v as PersonaState), {
        parse: (v: unknown) => personaSchema(v as PersonaState),
      })
      pctx.effect(() => projections.sessionProjections.register({
        key: 'persona',
        schema: projectionSchema,
        init: () => ({ personaId: '', pending: false }),
        apply: (state, event) => {
          if (event.type === 'command/run' && event.data?.name === 'persona') {
            const args = event.data.args
            if (typeof args !== 'string' || args.trim() === '') return state
            const personaId = args.trim()
            return personaId === state.personaId ? state : { personaId, pending: true }
          }
          if (event.type === PERSONA_SELECTED) {
            const personaId = event.data?.personaId
            if (typeof personaId !== 'string') return state
            return { personaId, pending: false }
          }
          return state
        },
        view: (state) => state,
        stateVersion: 1,
      }), 'dsh-agents: persona projection')
    })

    sctx.inject(['commands'], (cctx) => {
      const commands = cctx as unknown as { commands: CommandFace }
      cctx.effect(() => commands.commands.register({
        name: 'persona',
        description: 'Switch the active persona',
        input: { hint: '[<personaId>]' },
        handler: ({ agent, rawInput }) => {
          const personaId = rawInput.trim()
          if (personaId === '') {
            const current = controller.pendingOf(agent) ?? foldPersona(agent.session.events)
            if (current !== '') return { kind: 'success', text: `Current persona: ${current}` }
            const headerId = agent.session.header?.agentPreset
            if (headerId !== undefined && catalog.get(headerId) !== undefined) return { kind: 'success', text: `Current persona: ${headerId}` }
            if (fallback !== undefined && catalog.get(fallback) !== undefined) return { kind: 'success', text: `Current persona: ${fallback}` }
            return { kind: 'success', text: 'No persona selected (deployment default).' }
          }
          try {
            const outcome = controller.set(agent, personaId)
            const text = outcome === 'committed'
              ? `Persona switched to ${personaId}.`
              : outcome === 'queued'
                ? `Switching to ${personaId} (applies from the next step).`
                : outcome === 'cancelled'
                  ? 'Persona switch cancelled; the logged persona already matches.'
                  : `Persona is already ${personaId}.`
            return { kind: 'success', text }
          } catch (error) {
            return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
          }
        },
      }), 'dsh-agents: /persona command')
    })

    void mkdir(root, { recursive: true })
      .then(() => {
        void catalog.load()
        void syncOnce(sctx, home, root, baseDir)
        let timer: ReturnType<typeof setTimeout> | undefined
        const watcher = watch(root, () => {
          if (timer !== undefined) clearTimeout(timer)
          timer = setTimeout(() => {
            void catalog.load()
            void syncOnce(sctx, home, root, baseDir)
          }, WATCH_DEBOUNCE_MS)
        })
        watcher.on('error', (error) => ctx.logger.warn(`dsh-agents: watching ${root} failed: ${error.message}`))
        watcher.unref()
        sctx.effect(() => () => {
          if (timer !== undefined) clearTimeout(timer)
          watcher.close()
        }, 'dsh-agents.watch()')
      })
      .catch(() => {})
  })
}
