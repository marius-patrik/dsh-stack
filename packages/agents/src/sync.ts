/**
 * Materialization: the persona authoring directory (`<dshHome>/agents`, or a
 * configured root) to the harness's user preset root (`<dshHome>/.agent-presets`).
 *
 * The harness discovers presets live on every roster read, so writing a
 * preset directory IS the integration point — no harness service is required,
 * and dsh-agents composes nothing itself. A materialized preset carries the
 * base composition with a neutral persona row; the live persona is resolved
 * by the `persona:policy` prompt section, never by embedded text. Each
 * materialized preset is marked
 * with a `.dsh-agents-source` file naming its persona file; sync prunes ONLY
 * marked presets whose source is gone, so a hand-authored preset in the same
 * root is never touched.
 *
 * The base composition comes from the shipped preset directories beside the
 * installed harness (overridable with `DSH_AGENTS_BASE_DIR`); when the
 * harness checkout is not reachable, materialization degrades to the bare
 * persona row.
 * @module dsh-agents/sync
 */

import { mkdir, readdir, readFile, rm, writeFile, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { composeComposition, composeMetadata } from "./compose.js";
import { parsePersona, type Persona } from "./persona.js";

/** The user preset root the harness scans for locally authored presets. */
export const PRESET_ROOT = ".agent-presets";

/** Marker naming the persona file a materialized preset was derived from. */
export const SOURCE_MARKER = ".dsh-agents-source";

/** The authoring file extensions dsh-agents turns into presets. */
const PERSONA_EXTENSIONS = new Set([".md", ".json"]);

/** One materialized preset's report entry. */
export interface Materialized {
  id: string;
  /** Absolute path of the persona file it was derived from. */
  source: string;
  /** Base preset id composed from, or undefined for the bare persona row. */
  base: string | undefined;
}

/** The summary `syncPersonas` resolves with. */
export interface SyncReport {
  materialized: Materialized[];
  pruned: string[];
  failed: string[];
}

/**
 * The shipped preset root: `DSH_AGENTS_BASE_DIR` when set, else the
 * `harness/apps/cli/config/agent-presets` tree beside this package's
 * checkout (three levels up from `lib/`). Returns undefined when neither
 * resolves, which degrades materialization to the bare persona row.
 */
export function basePresetDir(): string | undefined {
  if (process.env.DSH_AGENTS_BASE_DIR !== undefined && process.env.DSH_AGENTS_BASE_DIR !== "") {
    return process.env.DSH_AGENTS_BASE_DIR;
  }
  return new URL("../../../harness/apps/cli/config/agent-presets", import.meta.url).pathname;
}

/** Read a base preset's composition text, or undefined when unreadable. */
export async function readBaseComposition(
  baseDir: string,
  base: string,
): Promise<string | undefined> {
  try {
    return await readFile(join(baseDir, base, "agent.cordis.yml"), "utf8");
  } catch {
    return undefined;
  }
}

/** Write one file atomically (tmp + rename) so the roster never reads half a preset. */
async function atomicWrite(target: string, content: string): Promise<void> {
  const tmp = `${target}.tmp-${randomBytes(4).toString("hex")}`;
  await writeFile(tmp, content);
  await rename(tmp, target);
}

/**
 * Materialize one persona as an agent preset under `<home>/.agent-presets/`.
 * The preset directory is written atomically (composition, metadata, then the
 * source marker, which is what makes it eligible for pruning).
 * @param home - the dsh home (the preset root lives beneath it).
 * @param persona - the parsed persona.
 * @param source - the persona file it was parsed from (recorded for pruning).
 * @param baseDir - the shipped preset root; absent uses the bare persona row.
 */
export async function materializePreset(
  home: string,
  persona: Persona,
  source: string,
  baseDir: string | undefined,
): Promise<Materialized> {
  const baseId = persona.base ?? "standard";
  const baseComposition =
    baseDir !== undefined ? await readBaseComposition(baseDir, baseId) : undefined;
  const directory = join(home, PRESET_ROOT, persona.id);
  await mkdir(directory, { recursive: true });
  await atomicWrite(join(directory, "agent.cordis.yml"), composeComposition(baseComposition));
  await atomicWrite(join(directory, "preset.yml"), composeMetadata(persona));
  await atomicWrite(join(directory, SOURCE_MARKER), `${source}\n`);
  return { id: persona.id, source, base: baseComposition !== undefined ? baseId : undefined };
}

/**
 * Synchronize the authoring directory into the user preset root: materialize
 * every parseable persona file, and prune materialized presets whose marked
 * source file no longer exists. Unparsable files are reported, never fatal.
 * @param home - the dsh home.
 * @param root - the authoring directory.
 * @param baseDir - the shipped preset root; absent uses the bare persona row.
 */
export async function syncPersonas(
  home: string,
  root: string,
  baseDir: string | undefined,
): Promise<SyncReport> {
  const report: SyncReport = { materialized: [], pruned: [], failed: [] };
  let files: string[];
  try {
    files = await readdir(root);
  } catch {
    return report;
  }

  for (const file of files) {
    const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
    if (!PERSONA_EXTENSIONS.has(extension)) continue;
    const source = join(root, file);
    let persona: Persona;
    try {
      persona = parsePersona(source, await readFile(source, "utf8"));
    } catch (error) {
      report.failed.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    report.materialized.push(await materializePreset(home, persona, source, baseDir));
  }

  const presetRoot = join(home, PRESET_ROOT);
  try {
    for (const id of await readdir(presetRoot)) {
      const marker = join(presetRoot, id, SOURCE_MARKER);
      let source: string;
      try {
        source = (await readFile(marker, "utf8")).trim();
      } catch {
        continue;
      }
      if (await pathExists(source)) continue;
      await rm(join(presetRoot, id), { recursive: true, force: true });
      report.pruned.push(id);
    }
  } catch {
    // No preset root yet: nothing to prune.
  }
  return report;
}

/** Whether a path exists on disk. */
async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf8");
    return true;
  } catch {
    return false;
  }
}
