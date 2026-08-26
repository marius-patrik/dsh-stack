#!/usr/bin/env node
// jscpd:ignore-start -- per-package CLI entrypoint boilerplate (arg parsing, help text), duplicated by design across sibling CLI packages
/**
 * The `dsh formatter` command: the owner surface over the formatters
 * formatter table. It reads/writes the `formatters` section of
 * `settings.yaml` under the same agent home the harness boots (DSH_HOME); the
 * plugin mounts those commands on the next boot.
 *
 * Verbs:
 *   list                       — configured formatters (extension → command)
 *   add <ext> <command...>     — add a formatter (e.g. `dsh formatter add .ts npx prettier --write`)
 *   remove <ext>               — delete a formatter entry
 *   set-auto <on|off>          — toggle auto-format-on-edit
 */

import { homedir } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const home = resolve(process.env.DSH_HOME ?? join(homedir(), ".agents"));
const settingsPath = join(home, "settings.yaml");

/** readSection implementation. */
function* readSection(text, section) {
  let inSection = false;
  for (const line of text.split("\n")) {
    if (new RegExp(`^${section}\\s*:`).test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && !/^\s/.test(line)) break;
    if (!inSection) continue;
    const match = line.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (match) {
      yield [match[1], match[2].trim().replace(/^(['"])(.*)\1$/, "$2")];
    }
  }
}

/** parseJsonValue implementation. */
function parseJsonValue(raw) {
  if (raw === "" || raw === "null") return null;
  if (raw[0] === "{" || raw[0] === "[") {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through */
    }
  }
  if (raw === "true") return true;
  if (raw === "false") return false;
  const num = Number(raw);
  if (raw !== "" && Number.isFinite(num)) return num;
  return raw;
}

/** readSectionData implementation. */
async function readSectionData() {
  try {
    const text = await readFile(settingsPath, "utf8");
    const section = {};
    for (const [key, value] of readSection(text, "formatters")) {
      section[key] = parseJsonValue(value);
    }
    return section;
  } catch {
    /* no document yet */
  }
  return {};
}

/** writeSectionData implementation. */
async function writeSectionData(section) {
  let text = "";
  try {
    text = await readFile(settingsPath, "utf8");
  } catch {
    /* new file */
  }
  const pattern = /^formatters[^\n]*\n(?:[ \t][^\n]*\n)*/m;
  const block =
    `formatters:\n  autoFormatOnEdit: ${section.autoFormatOnEdit ?? true}\n` +
    `  formatters: ${JSON.stringify(section.formatters ?? {})}\n`;
  const without = text.replace(pattern, "");
  const rest = without.replace(/\n{3,}/g, "\n\n").trim();
  const out = `${rest}${rest.endsWith("\n") ? "" : "\n"}${block}`;
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, out, "utf8");
}

/** printHelp implementation. */
function printHelp() {
  process.stdout.write(`usage: dsh formatter <verb> [args]

verbs:
  list
  add <ext> <command...>      e.g. dsh formatter add .ts npx prettier --write
  remove <ext>
  set-auto <on|off>
`);
}

/** main implementation. */
async function main() {
  const verb = process.argv[2];
  const argv = process.argv.slice(3);

  if (verb === "list") {
    const section = await readSectionData();
    const entries = Object.entries(section.formatters ?? {});
    if (entries.length === 0) {
      process.stdout.write(
        `no formatters configured (auto-format-on-edit: ${section.autoFormatOnEdit ?? true})\n`,
      );
      return;
    }
    for (const [ext, cfg] of entries) {
      process.stdout.write(`${ext}    ${(cfg.argv ?? []).join(" ")}\n`);
    }
    return;
  }

  if (verb === "add") {
    const ext = argv[0];
    if (!ext?.startsWith(".") || argv.length < 2) {
      process.stderr.write("dsh formatter add: expected <ext> <command...>\n");
      process.exitCode = 1;
      return;
    }
    const section = await readSectionData();
    section.formatters ??= {};
    section.formatters[ext.toLowerCase()] = { argv: argv.slice(1) };
    await writeSectionData(section);
    process.stdout.write(`added formatter ${ext} -> ${argv.slice(1).join(" ")}\n`);
    return;
  }

  if (verb === "remove") {
    const ext = argv[0];
    if (!ext) {
      process.stderr.write("dsh formatter remove: missing <ext>\n");
      process.exitCode = 1;
      return;
    }
    const section = await readSectionData();
    if (section.formatters?.[ext] === undefined) {
      process.stderr.write(`dsh formatter remove: no formatter "${ext}"\n`);
      process.exitCode = 1;
      return;
    }
    delete section.formatters[ext];
    await writeSectionData(section);
    process.stdout.write(`removed formatter ${ext}\n`);
    return;
  }

  if (verb === "set-auto") {
    const value = argv[0];
    if (value !== "on" && value !== "off") {
      process.stderr.write("dsh formatter set-auto: expected on|off\n");
      process.exitCode = 1;
      return;
    }
    const section = await readSectionData();
    section.autoFormatOnEdit = value === "on";
    await writeSectionData(section);
    process.stdout.write(`auto-format-on-edit: ${value}\n`);
    return;
  }

  printHelp();
}

main().catch((err) => {
  process.stderr.write(`dsh formatter: ${err.message}\n`);
  process.exitCode = 1;
});

// jscpd:ignore-end
