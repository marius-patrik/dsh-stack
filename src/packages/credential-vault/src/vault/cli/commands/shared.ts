import { readFile as readFileFromDisk } from "node:fs/promises";
import { SECRET_TYPES, type SecretScope, type SecretType } from "../../record.js";
import { exists } from "../../files.js";
import {
  boolean,
  many,
  optional,
  VaultCliError,
  type ParsedArguments,
} from "../argument-parsing.js";
import type { VaultCliIo } from "../io.js";

export const USAGE = `vault - agent-managed credential vault

Usage:
  vault init [--passphrase] [--json]
  vault add --id <id> --type <type> --label <label> --purpose <purpose>
            (--stdin | --file <path>) [--agent <id>...] [--workspace <name>]
            [--expires-at <iso>] [--tag <tag>...] [--header <h>] [--username <u>]
            [--origin <url>] [--login-url <url>] [--public-key <text>]
            [--account <a>]
  vault import-totp --id <id> --label <label> --purpose <purpose>
            (--stdin | --file <path>) [--agent <id>...] [--issuer <i>] [--account <a>]
  vault list [--json]
  vault get --id <id> --reveal [--field <name>] [--out <path>]
  vault totp --id <id> [--json]
  vault status [--json]
  vault scan [--json] [--import] [--only <detector-or-provider>...]
             [--ssh <host> --remote-home <path> --remote-platform win32|linux|darwin]
             [--machine <name>] [--agent <id>...] [--workspace <name>]
             [--release-secrets]

Secret material is never taken from argv: --stdin or --file only.
vault scan never prompts. Keychain items it cannot read without the owner are
reported as present-but-not-read. --release-secrets opts in to opening them, and
on macOS that means one approval dialog per item another application owns: pass
it only when the owner is at the machine.
Types: ${SECRET_TYPES.join(", ")}
`;

/** isSecretType implementation. */
export function isSecretType(value: string): value is SecretType {
  return (SECRET_TYPES as readonly string[]).includes(value);
}

/** readMaterialInput implementation. */
export async function readMaterialInput(args: ParsedArguments, io: VaultCliIo): Promise<string> {
  const file = optional(args, "file");
  if (file) {
    if (!(await exists(file))) throw new VaultCliError(`no such file: ${file}`);
    return readFileFromDisk(file, "utf8");
  }
  if (!boolean(args, "stdin"))
    throw new VaultCliError(
      "secret material must come from --stdin or --file, never from a command-line argument",
    );
  return io.readStdin();
}

/** scopeFrom implementation. */
export function scopeFrom(args: ParsedArguments): SecretScope {
  return { workspace: optional(args, "workspace") ?? "*", agents: many(args, "agent") };
}

/** warnEmptyScope implementation. */
export function warnEmptyScope(scope: SecretScope, io: VaultCliIo): void {
  if (scope.agents.length === 0)
    io.err("warning: no --agent given, so no agent can read this record until it is re-scoped\n");
}
