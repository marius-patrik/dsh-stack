import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface AgentPresetResource {
  readonly id: string
  readonly composition: string
}

export interface AgentPresetPack {
  readonly id: string
  readonly presets: readonly AgentPresetResource[]
}

export const codingPreset: AgentPresetResource = {
  id: 'coding',
  composition: `# Stack coding preset\n# DSH mounts this composition per agent scope.\n- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n    text: You are a software engineering agent working in the current Stack workspace.\n`,
}

export const defaultPreset: AgentPresetResource = {
  id: 'default',
  composition: `# Stack default preset\n- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n    text: You are a general-purpose Stack agent.\n`,
}

export const agentPresetPack: AgentPresetPack = {
  id: 'stack.agents',
  presets: [defaultPreset, codingPreset],
}

/**
 * Materialize the pack directly into a DSH agent-preset root.
 * `root` is expected to be configured as one of the DSH preset discovery roots;
 * each preset therefore lives at `<root>/<preset-id>/agent.cordis.yml`.
 */
export async function materializeAgentPresetPack(
  root: string,
  pack: AgentPresetPack = agentPresetPack,
): Promise<string> {
  await mkdir(root, { recursive: true })
  for (const preset of pack.presets) {
    const dir = join(root, preset.id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'agent.cordis.yml'), preset.composition, 'utf8')
  }
  return root
}
