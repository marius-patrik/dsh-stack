import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path of this package's root directory. */
export function packageDir(importMetaUrl: string): string {
  // src/paths.ts -> package root is one level up; lib/paths.js likewise.
  return dirname(dirname(fileURLToPath(importMetaUrl)));
}

/**
 * Locate the harness checkout: the DSH_HARNESS env var wins, else the
 * `harness/` submodule of the enclosing dsh-stack checkout. Returns null when
 * no checkout is present (verbs that don't need the harness still work).
 */
export function findHarnessDir(env: NodeJS.ProcessEnv, pkgDir: string): string | null {
  const fromEnv = env.DSH_HARNESS;
  if (fromEnv !== undefined && fromEnv.length > 0 && existsSync(fromEnv)) return fromEnv;
  const sibling = join(pkgDir, "..", "..", "..", "harness");
  return existsSync(join(sibling, "apps")) ? sibling : null;
}

/**
 * Pick the harness CLI entrypoint: the TypeScript source run through tsx when
 * present (dev checkout), else the built lib/bin.js. Returns null when the
 * harness checkout has neither.
 */
export function harnessCli(harnessDir: string): { bin: string; tsx: boolean } | null {
  const tsBin = join(harnessDir, "apps", "cli", "src", "bin.ts");
  if (existsSync(tsBin)) return { bin: tsBin, tsx: true };
  const jsBin = join(harnessDir, "apps", "cli", "lib", "bin.js");
  if (existsSync(jsBin)) return { bin: jsBin, tsx: false };
  return null;
}

/**
 * Package-owned verb CLIs the launcher routes to, resolved as sibling
 * canonical packages of this one. The historical bash launcher pointed at a
 * `plugins/dsh-*` tree that no longer exists; these are the canonical owners.
 */
const VERB_BINS: Record<string, string> = {
  accounts: join("credential-vault", "bin", "accounts.mjs"),
  theme: join("themes", "bin", "theme.mjs"),
  lsp: join("lsp", "bin", "lsp.mjs"),
  formatter: join("formatters", "bin", "formatter.mjs"),
  agents: join("agents", "bin", "agents.mjs"),
};

/** Resolve the CLI bin owning a package verb, or null when it isn't installed. */
export function verbBin(pkgDir: string, verb: string): string | null {
  const rel = VERB_BINS[verb];
  if (rel === undefined) return null;
  const bin = join(pkgDir, "..", rel);
  return existsSync(bin) ? bin : null;
}
