import { readFileSync } from "node:fs";

/** The `dsh-tweaks` settings section the launcher consumes. */
export interface DshTweaks {
  homeRoot?: string;
  command?: string;
}

/**
 * Read the `dsh-tweaks` section (`homeRoot`, `command`) of a settings.yaml
 * document. Line-based and tolerant by design — a missing or unparsable
 * document yields no tweaks, exactly like the bash launcher's embedded parser.
 */
export function readTweaks(settingsPath: string): DshTweaks {
  const out: DshTweaks = {};
  let lines: string[];
  try {
    lines = readFileSync(settingsPath, "utf8").split("\n");
  } catch {
    return out;
  }
  let inSection = false;
  for (const line of lines) {
    if (/^dsh-tweaks\s*:/.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && !/^\s/.test(line)) break;
    if (!inSection) continue;
    const match = line.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (match && (match[1] === "homeRoot" || match[1] === "command")) {
      const key = match[1] as "homeRoot" | "command";
      const raw = match[2] ?? "";
      out[key] = raw.trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
  return out;
}
