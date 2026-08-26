import path from "node:path";
import { writePrivateFile } from "../../files.js";
import {
  boolean,
  optional,
  required,
  VaultCliError,
  type ParsedArguments,
} from "../argument-parsing.js";
import { fingerprintsOf, revealField } from "../material-from-input.js";
import { formatFingerprint } from "../fingerprint.js";
import type { VaultCliIo } from "../io.js";
import { openVault } from "../vault-location.js";

/** getCommand implementation. */
// jscpd:ignore-start -- mirrors vault/cli/commands/totp.ts's small option-parsing shape for a different subcommand
export async function getCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const id = required(args, "id");
  const { store } = await openVault(io);
  const record_ = await store.get(id);
  if (!record_) throw new VaultCliError(`no such record: ${id}`);
  const out = optional(args, "out");
// jscpd:ignore-end
  if (!boolean(args, "reveal")) {
    io.err(
      `refusing to reveal ${id}: pass --reveal to confirm.\n` +
        (io.isTty
          ? "stdout is a terminal, so the value would land in your scrollback and possibly your terminal's history.\n"
          : "") +
        `${record_.type} for ${record_.purpose}: ${fingerprintsOf(record_.material).map(formatFingerprint).join(" ")}\n`,
    );
    return 2;
  }
  const value = revealField(record_, optional(args, "field"));
  if (out) {
    await writePrivateFile(path.resolve(out), value);
    io.err(`wrote ${id} to ${path.resolve(out)} with owner-only permissions\n`);
    return 0;
  }
  io.out(value.endsWith("\n") ? value : `${value}\n`);
  return 0;
}
