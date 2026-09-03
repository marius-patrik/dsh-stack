/**
 * Headless profile composition and configuration manager.
 * Ensures the headless profile in DSH_HOME composes @dsh-stack/pack-bundle-headless,
 * has local Stack package symlinks in node_modules, and populates cordis.patch.yml
 * with base config for llm-pi-ai from settings.yaml providers.custom.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

/**
 * Options for configuring and ensuring the headless profile.
 */
export interface HeadlessProfileOptions {
  /** The DSH_HOME root path. */
  home: string;
  /** Root directory of the @dsh-stack/launcher package. */
  pkgDir: string;
}

/**
 * Normalizes custom provider configurations to conform to the upstream harness schema.
 * Aligns non-standard API protocols (e.g. mistral-conversations, google-generative-ai)
 * to openai-completions with appropriate base URLs.
 *
 * @param providers - Raw provider configurations parsed from settings.yaml.
 * @returns Array of normalized provider configurations safe for harness validation.
 */
export function normalizeCustomProviders(providers: unknown[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const item of providers) {
    if (!item || typeof item !== "object") continue;
    const provider = { ...(item as Record<string, unknown>) };
    if (provider.api === "mistral-conversations") {
      provider.api = "openai-completions";
      if (!provider.baseURL) {
        provider.baseURL = "https://api.mistral.ai/v1";
      }
    } else if (provider.api === "google-generative-ai") {
      provider.api = "openai-completions";
      if (!provider.baseURL) {
        provider.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
      }
    }
    result.push(provider);
  }
  return result;
}

/**
 * Ensure the headless profile's package.json exists and declares
 * `@dsh-stack/pack-bundle-headless` in both dependencies and dsh.profile.bundles.
 */
function ensureHeadlessPackageJson(profileDir: string): void {
  const pkgJsonPath = join(profileDir, "package.json");
  let pkgData: Record<string, unknown> = {
    name: "dsh-profile-headless",
    version: "0.1.0",
    type: "module",
    dependencies: {},
    dsh: {
      profile: {
        bundles: [],
      },
    },
  };

  if (existsSync(pkgJsonPath)) {
    try {
      pkgData = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as Record<string, unknown>;
    } catch {
      // Use defaults if unparseable
    }
  }

  const deps = (
    pkgData.dependencies && typeof pkgData.dependencies === "object"
      ? { ...(pkgData.dependencies as Record<string, unknown>) }
      : {}
  ) as Record<string, string>;
  deps["@dsh-stack/pack-bundle-headless"] = "^0.1.0";
  pkgData.dependencies = deps;

  const dsh = (
    pkgData.dsh && typeof pkgData.dsh === "object"
      ? { ...(pkgData.dsh as Record<string, unknown>) }
      : {}
  ) as Record<string, unknown>;
  const profile = (
    dsh.profile && typeof dsh.profile === "object"
      ? { ...(dsh.profile as Record<string, unknown>) }
      : {}
  ) as Record<string, unknown>;
  const bundles = Array.isArray(profile.bundles) ? [...profile.bundles] : [];
  if (!bundles.includes("@dsh-stack/pack-bundle-headless")) {
    bundles.push("@dsh-stack/pack-bundle-headless");
  }
  profile.bundles = bundles;
  dsh.profile = profile;
  pkgData.dsh = dsh;

  writeFileSync(pkgJsonPath, `${JSON.stringify(pkgData, null, 2)}\n`, "utf8");
}

/**
 * Ensure symlinks to Stack packages from the monorepo exist under
 * `<profileDir>/node_modules/@dsh-stack/` so harness bundle resolution succeeds.
 */
function ensureStackSymlinks(profileDir: string, pkgDir: string): void {
  const repoRoot = join(pkgDir, "..", "..", "..");
  const nodeModulesDir = join(profileDir, "node_modules", "@dsh-stack");
  mkdirSync(nodeModulesDir, { recursive: true });

  const scanDirs = [
    join(repoRoot, "publish", "packs"),
    join(repoRoot, "publish", "extensions"),
    join(repoRoot, "src", "packages"),
  ];

  for (const scanDir of scanDirs) {
    if (!existsSync(scanDir)) continue;
    let entries: string[] = [];
    try {
      entries = readdirSync(scanDir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = join(scanDir, entry);
      const pkgJsonPath = join(entryPath, "package.json");
      if (!existsSync(pkgJsonPath)) continue;
      try {
        const pkgData = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as { name?: string };
        const pkgName = pkgData.name;
        if (typeof pkgName === "string" && pkgName.startsWith("@dsh-stack/")) {
          const suffix = pkgName.slice("@dsh-stack/".length);
          const linkTarget = join(nodeModulesDir, suffix);
          let linkValid = false;
          try {
            const stat = lstatSync(linkTarget);
            if (stat.isSymbolicLink()) {
              linkValid = true;
            } else {
              rmSync(linkTarget, { recursive: true, force: true });
            }
          } catch {
            // Does not exist
          }
          if (!linkValid) {
            try {
              symlinkSync(entryPath, linkTarget, "dir");
            } catch {
              // Ignore concurrency race
            }
          }
        }
      } catch {
        // Skip unparseable package.json
      }
    }
  }
}

/**
 * Ensure cordis.patch.yml in the headless profile directory supplies base config
 * for llm-pi-ai with custom providers from settings.yaml.
 */
function ensureHeadlessCordisPatch(profileDir: string, settingsPath: string): void {
  if (!existsSync(settingsPath)) return;
  let customProviders: Record<string, unknown>[] = [];
  try {
    const rawSettings = readFileSync(settingsPath, "utf8");
    const settingsDoc = YAML.parse(rawSettings) as { providers?: { custom?: unknown[] } };
    if (settingsDoc && typeof settingsDoc === "object") {
      const providersSection = settingsDoc.providers;
      if (providersSection && Array.isArray(providersSection.custom)) {
        customProviders = normalizeCustomProviders(providersSection.custom);
      }
    }
  } catch {
    return;
  }

  if (customProviders.length === 0) return;

  const patchPath = join(profileDir, "cordis.patch.yml");
  let patchDoc: Record<string, unknown>[] = [];
  if (existsSync(patchPath)) {
    try {
      const rawPatch = readFileSync(patchPath, "utf8");
      const parsed = YAML.parse(rawPatch);
      if (Array.isArray(parsed)) {
        patchDoc = parsed as Record<string, unknown>[];
      }
    } catch {
      patchDoc = [];
    }
  }

  const existingIndex = patchDoc.findIndex(
    (item) => item && typeof item === "object" && item.id === "llm-pi-ai",
  );

  if (existingIndex >= 0) {
    const existing = { ...patchDoc[existingIndex] };
    const cfg =
      existing.config && typeof existing.config === "object"
        ? { ...(existing.config as Record<string, unknown>) }
        : {};
    cfg.providers = customProviders;
    existing.config = cfg;
    patchDoc[existingIndex] = existing;
  } else {
    patchDoc.push({
      id: "llm-pi-ai",
      config: {
        providers: customProviders,
      },
    });
  }

  writeFileSync(patchPath, YAML.stringify(patchDoc), "utf8");
}

/**
 * Ensures that the headless profile directory, package.json composition,
 * stack package symlinks, and cordis.patch.yml base config are all properly
 * configured and synchronized from settings.yaml.
 *
 * @param options - Configuration options specifying home and pkgDir.
 */
export function ensureHeadlessProfile(options: HeadlessProfileOptions): void {
  const { home, pkgDir } = options;
  const profileDir = join(home, "profiles", "headless");
  mkdirSync(profileDir, { recursive: true });
  ensureHeadlessPackageJson(profileDir);
  ensureStackSymlinks(profileDir, pkgDir);
  ensureHeadlessCordisPatch(profileDir, join(home, "settings.yaml"));
}
