/**
 * The owner-facing command surface over the vault, and the scanner that seeds it
 * from credentials a machine already holds.
 *
 * `agent.ts` is the surface an *agent* gets: narrow, scoped, unable to enumerate.
 * This is the other half — the surface the *owner* gets, which is allowed to
 * enumerate, allowed to create, and allowed (once, loudly, with an explicit flag)
 * to reveal. Keeping them in separate files is the point: nothing here is
 * reachable from an agent's `VaultAgent`, so widening the owner's tools never
 * widens an agent's.
 *
 * Three rules shape every command below.
 *
 * *A secret value never arrives on argv.* `vault add` takes its material from
 * stdin or a file and has no `--value`. argv lands in shell history, in `ps`
 * output, and in any process listing the machine keeps, so an argv-carried secret
 * is leaked before the command has finished parsing it.
 *
 * *A secret value never leaves except through one door.* `vault get --reveal` is
 * the only path that prints material, and everything else — `list`, `status`,
 * `scan` — renders through `fingerprint()`, which keeps four characters and a
 * length. That is enough for an owner to recognise a credential they are looking
 * at and not enough to use it.
 *
 * *Discovery is read-only and reports by default.* `vault scan` opens files,
 * parses them, and prints an inventory; it writes nothing anywhere unless
 * `--import` is passed, and it never modifies the source. The failure it guards
 * against is a scanner that "helpfully" imports 40 stale tokens the first time it
 * is run, or rewrites a credential file it only meant to read.
 *
 * The scanner is a registry of `Detector`s over a `CredentialSource`. The source
 * abstraction is what makes "seed the vault from the machine over there" a
 * transport change rather than a second scanner: `LocalSource` reads the local
 * filesystem and the macOS keychain, `SshSource` runs the same reads over `ssh`,
 * and every detector is written against the interface, not against `node:fs`.
 */

import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile as readFileFromDisk, readdir } from "node:fs/promises";
import { SecretValue } from "./secret.js";
import { descriptorOf, createSecretRecord, effectiveExpiryMs, SECRET_TYPES, type SecretMaterial, type SecretRecord, type SecretScope, type SecretType } from "./record.js";
import { EncryptedFileVault, vaultDirectory, type VaultStore } from "./store.js";
import { KeyFileMasterKey, PassphraseMasterKey, type MasterKeySource } from "./masterkey.js";
import { createTotpParameters, formatOtpauthUri, generateTotp, parseOtpauthUri } from "./totp.js";
import { ReauthSupervisor, type CredentialHealth } from "./supervisor.js";
import { exists, writePrivateFile } from "./files.js";
import { parseGitHubHosts, type GitHubHostEntry } from "../file-providers.js";
import { canonicalRefsForPurpose } from "../refs.js";

/* -------------------------------------------------------------------------- */
/* Process seam                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Everything the commands touch outside the vault. Injected rather than reached
 * for, because half of what this module has to be trusted about — that it does
 * not print a secret, that it refuses a terminal — is only testable when the
 * terminal and the streams are supplied by the test.
 */
export interface VaultCliIo {
  out(text: string): void;
  err(text: string): void;
  /** Reads all of stdin. Rejects when stdin is a terminal: material must be piped. */
  readStdin(): Promise<string>;
  /** Whether `out` is going to a terminal, which is what `get` refuses to write to. */
  isTty: boolean;
  env: Record<string, string | undefined>;
  home: string;
  now(): number;
}

export function defaultVaultCliIo(): VaultCliIo {
  return {
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    readStdin: async () => {
      if (process.stdin.isTTY) throw new Error("secret material must be piped in, not typed at a terminal");
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks).toString("utf8");
    },
    isTty: Boolean(process.stdout.isTTY),
    env: { ...process.env },
    home: process.env.HOME ?? process.env.USERPROFILE ?? "",
    now: () => Date.now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Argument parsing                                                            */
/* -------------------------------------------------------------------------- */

export interface ParsedArguments {
  positional: readonly string[];
  /** Repeatable by design: `--agent` and `--tag` are lists. */
  options: ReadonlyMap<string, readonly string[]>;
  booleans: ReadonlySet<string>;
}

/**
 * `--name value`, `--name=value`, and bare `--name`. Deliberately small: the
 * commands here take no secret material on argv, so there is nothing subtle for
 * a parser to get wrong, and a hand-rolled twenty lines is easier to audit than
 * a dependency.
 */
export function parseVaultArguments(argv: readonly string[]): ParsedArguments {
  const positional: string[] = [];
  const options = new Map<string, string[]>();
  const booleans = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const body = token.slice(2);
    const equals = body.indexOf("=");
    if (equals !== -1) {
      push(options, body.slice(0, equals), body.slice(equals + 1));
      continue;
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      booleans.add(body);
      continue;
    }
    push(options, body, next);
    index += 1;
  }
  return { positional, options, booleans };
}

function push(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

function optional(args: ParsedArguments, name: string): string | null {
  return args.options.get(name)?.at(-1) ?? null;
}

function many(args: ParsedArguments, name: string): string[] {
  return [...(args.options.get(name) ?? [])];
}

function required(args: ParsedArguments, name: string): string {
  const value = optional(args, name);
  if (!value) throw new VaultCliError(`--${name} is required`);
  return value;
}

function boolean(args: ParsedArguments, name: string): boolean {
  return args.booleans.has(name) || optional(args, name) === "true";
}

/** A fault the owner can fix by retyping the command. Reported without a stack. */
export class VaultCliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultCliError";
  }
}

/* -------------------------------------------------------------------------- */
/* Redaction                                                                   */
/* -------------------------------------------------------------------------- */

export interface Fingerprint {
  /** Which field of the material this describes, for example `accessToken`. */
  field: string;
  /** First four characters. Enough to recognise, not enough to use. */
  prefix: string;
  length: number;
}

/**
 * The only shape in which unopened material is ever described. Four characters is
 * chosen because every credential family in the wild is self-labelling in its
 * first few bytes — `sk-a`, `gho_`, `ya29`, `eyJh`, `rt.1` — so the owner can
 * tell an Anthropic token from a GitHub one without either being usable.
 */
export function fingerprint(field: string, value: string): Fingerprint {
  return { field, prefix: value.slice(0, 4), length: value.length };
}

export function formatFingerprint(print: Fingerprint): string {
  return `${print.field}=${print.prefix}…(${print.length})`;
}

/* -------------------------------------------------------------------------- */
/* Vault location and unlocking                                                */
/* -------------------------------------------------------------------------- */

const CONFIG_FILE = "vault.json";
const CONFIG_SCHEMA_VERSION = 1;

export type MasterKeyKind = "key-file" | "passphrase";

export interface VaultConfig {
  schemaVersion: typeof CONFIG_SCHEMA_VERSION;
  masterKey: MasterKeyKind;
  createdAt: string;
}

/**
 * Where the vault lives, given the environment. Mirrors how `src/cli/state.ts`
 * resolves the state root without importing it: `src/engine` takes its authority
 * by injection and does not depend on the CLI layer, so the precedence is
 * restated here rather than shared.
 */
export function resolveVaultDirectory(env: Record<string, string | undefined>, home: string): string {
  const explicit = env.ANDROMEDA_VAULT_DIR?.trim();
  if (explicit) return path.resolve(explicit);
  const secrets = env.ANDROMEDA_SECRETS?.trim();
  if (secrets) return vaultDirectory(path.resolve(secrets));
  const agentsHome = env.ANDROMEDA_HOME?.trim();
  if (agentsHome) return vaultDirectory(path.join(path.resolve(agentsHome), "secrets"));
  if (!home) throw new VaultCliError("cannot locate a home directory; set ANDROMEDA_VAULT_DIR");
  return vaultDirectory(path.join(home, ".agents", "secrets"));
}

export function vaultConfigFile(directory: string): string {
  return path.join(directory, CONFIG_FILE);
}

async function readVaultConfig(directory: string): Promise<VaultConfig | null> {
  const file = vaultConfigFile(directory);
  if (!(await exists(file))) return null;
  let parsed: Partial<VaultConfig>;
  try {
    parsed = JSON.parse(await readFileFromDisk(file, "utf8")) as Partial<VaultConfig>;
  } catch {
    throw new VaultCliError(`vault configuration is malformed: ${file}`);
  }
  if (parsed.schemaVersion !== CONFIG_SCHEMA_VERSION || (parsed.masterKey !== "key-file" && parsed.masterKey !== "passphrase")) {
    throw new VaultCliError(`vault configuration is malformed: ${file}`);
  }
  return parsed as VaultConfig;
}

/**
 * The passphrase is read from the environment rather than prompted. A vault the
 * re-auth supervisor maintains has to be openable by an unattended process, and a
 * prompt in this path would be the exact thing the whole component exists to
 * remove. `KeyFileMasterKey` remains the default for that reason.
 */
function masterKeyFor(kind: MasterKeyKind, directory: string, io: VaultCliIo): MasterKeySource {
  if (kind === "key-file") return new KeyFileMasterKey({ directory });
  const passphrase = io.env.ANDROMEDA_VAULT_PASSPHRASE?.trim();
  if (!passphrase) throw new VaultCliError("this vault is passphrase-protected; set ANDROMEDA_VAULT_PASSPHRASE");
  return new PassphraseMasterKey({ directory, passphrase: new SecretValue(passphrase) });
}

export interface OpenedVault {
  directory: string;
  config: VaultConfig;
  store: EncryptedFileVault;
}

export async function openVault(io: VaultCliIo): Promise<OpenedVault> {
  const directory = resolveVaultDirectory(io.env, io.home);
  const config = await readVaultConfig(directory);
  if (!config) throw new VaultCliError(`no vault at ${directory}; run \`vault init\` first`);
  return { directory, config, store: new EncryptedFileVault({ directory, masterKey: masterKeyFor(config.masterKey, directory, io) }) };
}

/* -------------------------------------------------------------------------- */
/* Material construction                                                       */
/* -------------------------------------------------------------------------- */

export interface MaterialOptions {
  header?: string | null;
  username?: string | null;
  origin?: string | null;
  loginUrl?: string | null;
  publicKey?: string | null;
  issuer?: string | null;
  account?: string | null;
}

/**
 * Turn piped bytes into typed material. Two shapes are accepted for the compound
 * types — a JSON document with the named fields, or a bare string treated as the
 * single most important field — because an owner pasting a token should not have
 * to hand-write JSON, and a script feeding a full token response should not have
 * to take it apart.
 */
export function materialFromInput(type: SecretType, raw: string, options: MaterialOptions = {}): SecretMaterial {
  const text = raw.trim();
  if (!text) throw new VaultCliError("no secret material was supplied on stdin");
  switch (type) {
    case "api_key":
      return { type: "api_key", apiKey: new SecretValue(text), header: options.header ?? null };
    case "oauth_token": {
      const document = jsonObject(text);
      if (!document) return { type: "oauth_token", accessToken: new SecretValue(text), refreshToken: null, refreshTokenExpiresAt: null, scopes: [], subscriptionType: null, tokenEndpoint: null };
      const accessToken = stringField(document, "accessToken") ?? stringField(document, "access_token");
      if (!accessToken) throw new VaultCliError("oauth material needs an accessToken field");
      const refreshToken = stringField(document, "refreshToken") ?? stringField(document, "refresh_token");
      return {
        type: "oauth_token",
        accessToken: new SecretValue(accessToken),
        refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
        refreshTokenExpiresAt: stringField(document, "refreshTokenExpiresAt"),
        scopes: Array.isArray(document.scopes) ? document.scopes.filter((entry): entry is string => typeof entry === "string") : [],
        subscriptionType: stringField(document, "subscriptionType"),
        tokenEndpoint: stringField(document, "tokenEndpoint"),
      };
    }
    case "password": {
      const username = options.username?.trim();
      if (!username) throw new VaultCliError("--username is required for a password record");
      return { type: "password", username, password: new SecretValue(text), origin: options.origin ?? null, loginUrl: options.loginUrl ?? null };
    }
    case "totp_seed":
      return { type: "totp_seed", parameters: totpParametersFromInput(text, options) };
    case "passkey": {
      const document = jsonObject(text);
      if (!document) throw new VaultCliError("passkey material must be a JSON document");
      const privateKey = stringField(document, "privateKey");
      const credentialId = stringField(document, "credentialId");
      const relyingPartyId = stringField(document, "relyingPartyId");
      if (!privateKey || !credentialId || !relyingPartyId) {
        throw new VaultCliError("passkey material needs credentialId, relyingPartyId and privateKey");
      }
      return {
        type: "passkey",
        credentialId,
        relyingPartyId,
        userHandle: stringField(document, "userHandle") ?? "",
        userName: stringField(document, "userName") ?? "",
        coseAlgorithm: typeof document.coseAlgorithm === "number" ? document.coseAlgorithm : -7,
        privateKey: new SecretValue(privateKey),
        signCount: typeof document.signCount === "number" ? document.signCount : 0,
        transports: Array.isArray(document.transports) ? document.transports.filter((entry): entry is string => typeof entry === "string") : [],
        userVerificationRequired: document.userVerificationRequired === true,
      };
    }
    case "cookie_jar": {
      const origin = options.origin?.trim();
      if (!origin) throw new VaultCliError("--origin is required for a cookie_jar record");
      return { type: "cookie_jar", origin, jar: new SecretValue(text), sessionExpiresAt: null };
    }
    case "recovery_codes": {
      const codes = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (codes.length === 0) throw new VaultCliError("no recovery codes were supplied");
      return { type: "recovery_codes", codes: codes.map((code) => new SecretValue(code)), consumed: 0 };
    }
    case "ssh_key":
      return {
        type: "ssh_key",
        privateKey: new SecretValue(text),
        publicKey: options.publicKey?.trim() || "",
        passphrase: null,
        fingerprint: null,
        comment: null,
      };
    case "generic_note":
      return { type: "generic_note", note: new SecretValue(text) };
  }
}

/** An `otpauth://` URI or a bare base32 seed, whichever the owner pasted. */
export function totpParametersFromInput(raw: string, options: MaterialOptions = {}) {
  const text = raw.trim();
  if (text.toLowerCase().startsWith("otpauth://")) return parseOtpauthUri(text);
  return createTotpParameters({ secret: text, issuer: options.issuer ?? null, account: options.account ?? null });
}

function jsonObject(text: string): Record<string, unknown> | null {
  if (!text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function stringField(document: Record<string, unknown>, field: string): string | null {
  const value = document[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * The field `vault get` yields for each type, and the one every other command
 * refuses to touch. Centralised so a new secret type cannot quietly become
 * unreadable, or readable through an unintended field.
 */
export function revealField(record: SecretRecord, field: string | null): string {
  const material = record.material;
  switch (material.type) {
    case "api_key":
      return material.apiKey.reveal();
    case "oauth_token":
      if (field === "refreshToken") {
        if (!material.refreshToken) throw new VaultCliError(`${record.id} has no refresh token`);
        return material.refreshToken.reveal();
      }
      return material.accessToken.reveal();
    case "password":
      return field === "username" ? material.username : material.password.reveal();
    case "totp_seed":
      return field === "uri" ? formatOtpauthUri(material.parameters) : material.parameters.secret.reveal();
    case "passkey":
      return material.privateKey.reveal();
    case "cookie_jar":
      return material.jar.reveal();
    case "recovery_codes":
      return material.codes.map((code) => code.reveal()).join("\n");
    case "ssh_key":
      return field === "publicKey" ? material.publicKey : material.privateKey.reveal();
    case "generic_note":
      return material.note.reveal();
  }
}

/** Fingerprints for everything secret in a record, for `list` and `scan`. */
export function fingerprintsOf(material: SecretMaterial): Fingerprint[] {
  switch (material.type) {
    case "api_key":
      return [fingerprint("apiKey", material.apiKey.reveal())];
    case "oauth_token":
      return [
        fingerprint("accessToken", material.accessToken.reveal()),
        ...(material.refreshToken ? [fingerprint("refreshToken", material.refreshToken.reveal())] : []),
      ];
    case "password":
      return [fingerprint("password", material.password.reveal())];
    case "totp_seed":
      return [fingerprint("secret", material.parameters.secret.reveal())];
    case "passkey":
      return [fingerprint("privateKey", material.privateKey.reveal())];
    case "cookie_jar":
      return [fingerprint("jar", material.jar.reveal())];
    case "recovery_codes":
      return material.codes.slice(0, 1).map((code) => fingerprint("codes[0]", code.reveal()));
    case "ssh_key":
      return [fingerprint("privateKey", material.privateKey.reveal())];
    case "generic_note":
      return [fingerprint("note", material.note.reveal())];
  }
}

/* -------------------------------------------------------------------------- */
/* Credential sources                                                          */
/* -------------------------------------------------------------------------- */

export type SourcePlatform = "darwin" | "linux" | "win32";

export interface KeychainItem {
  service: string;
  account: string | null;
}

/**
 * One machine, as far as a detector is concerned. Every method is read-only —
 * there is deliberately no `write`, so no detector can modify a credential file
 * even by mistake — and every method answers "absent" rather than throwing, so a
 * scan of a machine missing half these tools still reports the other half.
 */
export interface CredentialSource {
  /** Machine identifier recorded as provenance on anything imported. */
  readonly machine: string;
  readonly platform: SourcePlatform;
  /** Home directory, always with forward slashes so detectors need one form. */
  readonly home: string;
  readFile(file: string): Promise<string | null>;
  listDirectory(directory: string): Promise<string[]>;
  /**
   * Every keychain item, **metadata only**: service, account, and the fact that
   * the item exists. Enumerating is not releasing, and an implementation of this
   * method may not prompt the owner — see `LocalSource.keychainItems` for why
   * that is achievable rather than aspirational. Empty where there is no
   * keychain.
   */
  keychainItems(): Promise<KeychainItem[]>;
  /**
   * **Release** one item's secret material. This is the consenting path: on macOS
   * it can put a modal dialog in front of the owner, once per item, and nothing
   * this process does can suppress it. No unattended scan may call it —
   * `readKeychainItem` is the gate that enforces that, and detectors go through
   * the gate, never here. Null when absent or when the OS refused.
   */
  keychainSecret(service: string, account: string | null): Promise<string | null>;
  environment(): Promise<Record<string, string>>;
}

export function joinSource(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}

/**
 * The exact argv that enumerates the macOS keychain. Named, exported and asserted
 * on in the suite because the invariant that matters is a *negative* one — no
 * `-d`, no `-w` — and a negative invariant buried in a call site is one refactor
 * away from being lost. Adding a data flag here would turn a silent metadata read
 * into one owner dialog per foreign item; the test is what makes that fail in CI
 * instead of in front of the owner.
 */
export const KEYCHAIN_ENUMERATION_ARGV: readonly string[] = ["dump-keychain"];

/** Argv flags that make `security` decrypt and emit an item's data. */
export const KEYCHAIN_RELEASE_FLAGS: readonly string[] = ["-d", "-w", "--data"];

/** The machine this process is running on. */
export class LocalSource implements CredentialSource {
  readonly machine: string;
  readonly platform: SourcePlatform;
  readonly home: string;
  readonly #env: Record<string, string | undefined>;
  readonly #keychainTimeoutMs: number;

  constructor(options: { machine?: string; home: string; platform?: SourcePlatform; env: Record<string, string | undefined>; keychainTimeoutMs?: number }) {
    this.machine = options.machine ?? "local";
    this.platform = options.platform ?? (process.platform as SourcePlatform);
    this.home = options.home.replace(/\\/g, "/");
    this.#env = options.env;
    // This deadline bounds one *release* (`keychainSecret`). A read that is going
    // to succeed returns effectively instantly — the item's ACL either lets
    // `security` through or it does not — so the multi-second wait only elapses
    // while a GUI prompt sits unanswered. Three seconds leaves room for an
    // already-authorised read on a busy machine without waiting on a human.
    //
    // What a deadline cannot do is make releasing safe to do in bulk. Killing the
    // child abandons *this* dialog; it does nothing to stop the next call raising
    // the next one, and on 2026-07-30 that is exactly what happened — roughly a
    // hundred dialogs, each one individually bounded. Bulk safety comes from not
    // asking, which is `readKeychainItem`'s job, not from asking with a stopwatch.
    this.#keychainTimeoutMs = options.keychainTimeoutMs ?? 3_000;
  }

  async readFile(file: string): Promise<string | null> {
    try {
      return await readFileFromDisk(file, "utf8");
    } catch {
      return null;
    }
  }

  async listDirectory(directory: string): Promise<string[]> {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  /**
   * Enumerate the keychain without releasing anything.
   *
   * A keychain item is two separable things: attributes (service, account,
   * timestamps), stored in the clear, and the data blob, encrypted and guarded by
   * an ACL. `dump-keychain` reads only attributes; `-d` additionally reads the
   * data. The absence of `-d` here is load-bearing rather than incidental, which
   * is why the argv is a named constant the suite asserts on.
   *
   * MEASURED, once, on macOS 26.5.2 (25F84), against a throwaway keychain holding
   * three generic passwords — two created with `-T ""`, an empty trusted-
   * application list — with the keychain then **locked**, so no data in it was
   * decryptable at all:
   *
   *     security dump-keychain <kc>                    rc=0, 93ms, all 3 items
   *     security find-generic-password -s <svc> <kc>   rc=0, 96ms, attributes
   *     …same, for a service that does not exist       rc=44, "could not be found"
   *
   * Attributes came back from a locked keychain in under a tenth of a second.
   * Succeeding against a keychain whose contents cannot be decrypted is the
   * substantive part: these commands cannot have read data they had no key for.
   *
   * ASSERTED, NOT VERIFIED — and deliberately left that way. That `-d` and `-w`
   * raise one owner dialog per foreign item is taken from Apple's documented
   * keychain ACL behaviour and from the incident recorded in `docs/PROGRAMME.md`
   * §5, *not* from an experiment here. Neither flag has been run against any
   * keychain in the course of this work. Confirming them would mean deliberately
   * raising the dialogs this change exists to prevent, on a machine whose owner
   * has already sat through about a hundred of them.
   *
   * Note also the reach of the measurement above: one macOS version, one throwaway
   * keychain, three items. It shows this argv returning attributes from a keychain
   * it demonstrably could not decrypt. It is not a general proof about every item
   * shape a real login keychain might hold.
   *
   * Treat that as the standing rule for this file. **Do not run `security` to
   * check a hypothesis about this code, on any keychain, including one you
   * created yourself.** The injectable `CredentialSource` below is how these paths
   * are tested, and it is sufficient — the property that matters is "the release
   * call is never made", which is observable at the seam without an OS in the loop.
   *
   * The tempting alternative — enumerate with `-d` so one pass both lists and
   * reads — is precisely the defect this replaced. It costs one owner dialog per
   * foreign item, and no timeout can buy that back.
   */
  async keychainItems(): Promise<KeychainItem[]> {
    if (this.platform !== "darwin") return [];
    const dump = await this.#security([...KEYCHAIN_ENUMERATION_ARGV], 20_000);
    return dump === null ? [] : parseKeychainDump(dump);
  }

  /**
   * Release one item's secret material — the consenting path, and the one that
   * costs the owner a dialog.
   *
   * `-w` writes the password to stdout, which means decrypting the data blob,
   * which means the OS evaluates the item's ACL. An item written by another
   * application is not on that ACL, so the owner is asked to approve it, once per
   * item. That mechanism is asserted from Apple's documented ACL behaviour and
   * from what the owner sat through on 2026-07-30 — it is deliberately not
   * re-confirmed by experiment, because the only experiment that would confirm it
   * is the one that hurts them.
   *
   * The bounded wait below is real but modest: it converts one unanswered dialog
   * into "present, needs the owner", a finding rather than a hang. It was
   * originally documented as if that were the whole hazard. It is not. A timeout
   * stops a hang; it does nothing about N prompts, because each abandoned call
   * leaves the next one free to raise the next dialog. Calling this in a loop is
   * the defect, not calling it slowly.
   *
   * So this method is not the place where safety lives. Safety is that an
   * unattended scan never reaches here at all — `readKeychainItem` refuses unless
   * a caller has explicitly said it can survive a prompt.
   */
  async keychainSecret(service: string, account: string | null): Promise<string | null> {
    if (this.platform !== "darwin") return null;
    const args = ["find-generic-password", "-s", service, ...(account ? ["-a", account] : []), "-w"];
    const value = await this.#security(args, this.#keychainTimeoutMs);
    return value === null ? null : value.trim();
  }

  async environment(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.#env)) if (typeof value === "string") out[key] = value;
    return out;
  }

  async #security(args: string[], timeoutMs: number): Promise<string | null> {
    return runCommand("security", args, timeoutMs);
  }
}

export interface SshSourceOptions {
  host: string;
  home: string;
  platform: SourcePlatform;
  machine?: string;
  timeoutMs?: number;
}

/**
 * Another machine, reached over `ssh`. The Windows path is the one that needed
 * care: the default remote shell is `cmd.exe`, which mangles quoting, and the
 * usual text tools are absent, so every read is a PowerShell script delivered as
 * `-EncodedCommand` (UTF-16LE base64) — one argument, no metacharacters, nothing
 * for `cmd` to reinterpret.
 *
 * Values fetched this way exist only in this process's memory on their way into
 * the encrypted vault. Nothing is written on either side.
 */
export class SshSource implements CredentialSource {
  readonly machine: string;
  readonly platform: SourcePlatform;
  readonly home: string;
  readonly #host: string;
  readonly #timeoutMs: number;

  constructor(options: SshSourceOptions) {
    this.#host = options.host;
    this.machine = options.machine ?? options.host;
    this.platform = options.platform;
    this.home = options.home.replace(/\\/g, "/").replace(/\/$/, "");
    this.#timeoutMs = options.timeoutMs ?? 30_000;
  }

  async readFile(file: string): Promise<string | null> {
    if (this.platform === "win32") {
      return this.#powershell(`$p = ${psLiteral(file)}\nif (Test-Path -LiteralPath $p) { [Console]::Out.Write([IO.File]::ReadAllText($p)) }`);
    }
    return this.#posix(["cat", "--", file]);
  }

  async listDirectory(directory: string): Promise<string[]> {
    const raw =
      this.platform === "win32"
        ? await this.#powershell(
            `$p = ${psLiteral(directory)}\nif (Test-Path -LiteralPath $p) { Get-ChildItem -Force -File -LiteralPath $p | ForEach-Object { [Console]::Out.WriteLine($_.Name) } }`,
          )
        : await this.#posix(["ls", "-1A", "--", directory]);
    if (raw === null) return [];
    return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  /** No remote keychain is spoken today; Windows credential-manager support would land here. */
  async keychainItems(): Promise<KeychainItem[]> {
    return [];
  }

  async keychainSecret(): Promise<string | null> {
    return null;
  }

  async environment(): Promise<Record<string, string>> {
    const raw =
      this.platform === "win32"
        ? await this.#powershell(
            `foreach ($scope in @('User','Machine')) { foreach ($e in [Environment]::GetEnvironmentVariables($scope).GetEnumerator()) { [Console]::Out.WriteLine($e.Key + '=' + $e.Value) } }`,
          )
        : await this.#posix(["env"]);
    const out: Record<string, string> = {};
    for (const line of (raw ?? "").split(/\r?\n/)) {
      const equals = line.indexOf("=");
      if (equals > 0) out[line.slice(0, equals)] = line.slice(equals + 1);
    }
    return out;
  }

  async #powershell(script: string): Promise<string | null> {
    const preamble = "$ProgressPreference='SilentlyContinue'; $ErrorActionPreference='SilentlyContinue';\n";
    const encoded = Buffer.from(preamble + script, "utf16le").toString("base64");
    return runCommand("ssh", ["-o", "BatchMode=yes", this.#host, `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`], this.#timeoutMs);
  }

  async #posix(args: string[]): Promise<string | null> {
    return runCommand("ssh", ["-o", "BatchMode=yes", this.#host, args.map(shellQuote).join(" ")], this.#timeoutMs);
  }
}

/** A source backed by literals. The fixture every detector test is written against. */
export class MemorySource implements CredentialSource {
  readonly machine: string;
  readonly platform: SourcePlatform;
  readonly home: string;
  readonly #files: Map<string, string>;
  readonly #keychain: Map<string, string>;
  readonly #items: KeychainItem[];
  readonly #env: Record<string, string>;

  constructor(options: {
    machine?: string;
    platform?: SourcePlatform;
    home?: string;
    files?: Record<string, string>;
    keychain?: Record<string, string>;
    keychainItems?: KeychainItem[];
    environment?: Record<string, string>;
  }) {
    this.machine = options.machine ?? "fixture";
    this.platform = options.platform ?? "darwin";
    this.home = (options.home ?? "/home/fixture").replace(/\/$/, "");
    this.#files = new Map(Object.entries(options.files ?? {}));
    this.#keychain = new Map(Object.entries(options.keychain ?? {}));
    this.#items = options.keychainItems ?? Object.keys(options.keychain ?? {}).map((service) => ({ service, account: null }));
    this.#env = options.environment ?? {};
  }

  async readFile(file: string): Promise<string | null> {
    return this.#files.get(file) ?? null;
  }

  async listDirectory(directory: string): Promise<string[]> {
    const prefix = `${directory.replace(/\/$/, "")}/`;
    return [...this.#files.keys()].filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes("/")).map((file) => file.slice(prefix.length));
  }

  async keychainItems(): Promise<KeychainItem[]> {
    return [...this.#items];
  }

  async keychainSecret(service: string): Promise<string | null> {
    return this.#keychain.get(service) ?? null;
  }

  async environment(): Promise<Record<string, string>> {
    return { ...this.#env };
  }
}

/**
 * Run a command with a hard deadline and no shell. Returns null on any failure,
 * because every caller's question is "is this credential readable?" and a
 * missing binary, a non-zero exit, and a blocked authorization dialog are all
 * answered the same way: no.
 *
 * Ported from Bun.spawn to node:child_process; behaviour is otherwise identical.
 */
async function runCommand(command: string, args: string[], timeoutMs: number): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => child.kill(9), timeoutMs);
    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? stdout : null);
    });
  });
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function psLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** `security dump-keychain` emits attribute lines; only service and account matter. */
export function parseKeychainDump(dump: string): KeychainItem[] {
  const items: KeychainItem[] = [];
  let service: string | null = null;
  let account: string | null = null;
  for (const line of dump.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("keychain:")) {
      if (service) items.push({ service, account });
      service = null;
      account = null;
      continue;
    }
    const svce = /^"svce"<blob>="(.*)"$/.exec(trimmed);
    if (svce) service = svce[1] ?? null;
    const acct = /^"acct"<blob>="(.*)"$/.exec(trimmed);
    if (acct) account = acct[1] ?? null;
  }
  if (service) items.push({ service, account });
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.service}${item.account ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * `go-keyring` — which the GitHub CLI, the Gemini CLI and Antigravity all use —
 * base64-wraps any value that is not clean UTF-8. Unwrapped here so detectors
 * see the same JSON they would have seen from a file.
 */
export function decodeKeychainPayload(value: string): string {
  const prefix = "go-keyring-base64:";
  if (!value.startsWith(prefix)) return value;
  try {
    return Buffer.from(value.slice(prefix.length), "base64").toString("utf8");
  } catch {
    return value;
  }
}

/**
 * What a detector learned about one keychain item.
 *
 * Three states rather than two, because "there is nothing here" and "there is
 * something here that I did not open" are different facts about the machine and
 * the owner needs to see the difference. Collapsing `withheld` into `absent`
 * would under-report the estate — the credential is real, named and findable.
 * Collapsing it into an error would make an unattended scan fail on a perfectly
 * healthy Mac.
 */
type KeychainRead = { state: "released"; value: string } | { state: "withheld" } | { state: "absent" };

/**
 * The gate every keychain detector reads through, and the single place that
 * decides whether this process is allowed to make the OS ask the owner for
 * something.
 *
 * Enumerating and releasing are different operations with different consent
 * requirements, and the previous code conflated them: every detector called
 * straight through to `keychainSecret`, so merely *looking* at the machine
 * demanded release of every item it recognised. Listing what exists is free —
 * demonstrated, not assumed, in `LocalSource.keychainItems`. Releasing is not: a
 * foreign item costs one modal dialog, so a scan that recognises a hundred items
 * costs a hundred of them, which is what the owner sat through on 2026-07-30.
 *
 * The tempting alternative was to keep releasing but make it cheaper, and the
 * previous code tried both halves of it: open the items concurrently, and bound
 * each read with a timeout. Neither helps, and the first actively hurts.
 * Concurrency turns a hundred sequential dialogs into a hundred stacked ones —
 * the old comment argued that was "a better failure than a scan that appears to
 * hang", which is true only if the alternatives are those two. A timeout merely
 * decides how quickly this process abandons a dialog it has already raised; the
 * dialog is raised either way. The prompt is the cost, and the only way not to
 * pay it is not to ask.
 *
 * The go-keyring unwrapping lives here rather than in `LocalSource` because it is
 * a property of the *convention* the storing application used, not of how this
 * process reached the keychain — so a fixture and a real keychain hand a detector
 * the same bytes.
 */
async function readKeychainItem(source: CredentialSource, context: ScanContext, service: string, account: string | null): Promise<KeychainRead> {
  if (!context.releaseSecrets) {
    // The load-bearing line of this whole change: `keychainSecret` is not called.
    // Presence comes from enumeration, which cannot prompt, so an unattended scan
    // still reports the item truthfully — it just does not demand it.
    return (await keychainItemPresent(source, service, account)) ? { state: "withheld" } : { state: "absent" };
  }
  const raw = await source.keychainSecret(service, account);
  if (raw !== null) return { state: "released", value: decodeKeychainPayload(raw.trim()) };
  // The caller consented to a prompt and the item still did not open: either it
  // is absent, or the owner declined or never answered. Enumeration separates the
  // two without asking a second time.
  return (await keychainItemPresent(source, service, account)) ? { state: "withheld" } : { state: "absent" };
}

/**
 * Whether an item exists, from metadata alone.
 *
 * The account comparison is deliberately asymmetric. A caller naming an account
 * wants that item; a caller passing null is asking about the service whatever the
 * account, which is how every single-service detector here is written. And
 * `dump-keychain` does not report `acct` for every item, so an item whose account
 * is unknown must not be excluded by an account the caller happened to name —
 * reporting a credential the owner really has as absent is the worse error of the
 * two.
 */
async function keychainItemPresent(source: CredentialSource, service: string, account: string | null): Promise<boolean> {
  const items = await source.keychainItems();
  return items.some((item) => item.service === service && (account === null || item.account === null || item.account === account));
}

/**
 * The note on every item that was found and deliberately not opened. One shared
 * string so the report reads the same whichever detector found the item, and so
 * the owner is told what to do about it rather than just that it happened.
 */
const KEYCHAIN_WITHHELD_NOTE =
  "present but not read: releasing it needs the owner to approve a keychain prompt, which an unattended scan will not raise; re-run `vault scan --release-secrets` with the owner present to import it";

/**
 * The finding for an item that is definitely there and was deliberately left
 * shut. This is a result, not a failure — it tells the owner precisely which
 * credential exists and that importing it is a decision they take in person.
 */
function withheldKeychainFinding(spec: {
  detector: string;
  provider: string;
  source: CredentialSource;
  context: ScanContext;
  suggestedId: string;
  label: string;
  purpose: string;
  service: string;
  account: string | null;
}): Finding {
  return {
    detector: spec.detector,
    provider: spec.provider,
    type: "generic_note",
    suggestedId: spec.suggestedId,
    label: spec.label,
    purpose: spec.purpose,
    account: spec.account,
    expiresAt: null,
    plan: "unknown",
    origin: origin(spec.source, "keychain", spec.account ? `${spec.service}/${spec.account}` : spec.service, spec.context),
    fingerprints: [],
    notes: [KEYCHAIN_WITHHELD_NOTE],
    material: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Findings                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How a credential is paid for. The distinction the owner asked to see: a
 * subscription login is a seat that expires and must be re-authenticated, a
 * metered key is a string that bills per call and usually never expires. They
 * fail differently and they cost differently.
 */
export type CredentialPlan = "subscription" | "metered_api_key" | "unknown";

export interface CredentialOrigin {
  machine: string;
  kind: "file" | "keychain" | "environment";
  /** File path, keychain service, or variable name. Never a value. */
  location: string;
  detectedAt: string;
}

export interface Finding {
  detector: string;
  provider: string;
  type: SecretType;
  suggestedId: string;
  label: string;
  purpose: string;
  /** Email, login, or account id — how the owner tells two logins apart. */
  account: string | null;
  expiresAt: string | null;
  plan: CredentialPlan;
  origin: CredentialOrigin;
  fingerprints: readonly Fingerprint[];
  notes: readonly string[];
  /**
   * The material, held only in memory and only until an import writes it. Never
   * serialized: `redactFinding` is the only thing that turns a finding into
   * something printable, and it drops this field.
   */
  material: SecretMaterial | null;
}

/** A finding with its material removed. The only shape that is ever printed. */
export type RedactedFinding = Omit<Finding, "material"> & { importable: boolean; expired: boolean };

export function redactFinding(finding: Finding, nowMs: number): RedactedFinding {
  const expiresAtMs = finding.expiresAt ? Date.parse(finding.expiresAt) : Number.NaN;
  return {
    detector: finding.detector,
    provider: finding.provider,
    type: finding.type,
    suggestedId: finding.suggestedId,
    label: finding.label,
    purpose: finding.purpose,
    account: finding.account,
    expiresAt: finding.expiresAt,
    plan: finding.plan,
    origin: { ...finding.origin },
    fingerprints: finding.fingerprints.map((print) => ({ ...print })),
    notes: [...finding.notes],
    importable: finding.material !== null,
    expired: Number.isFinite(expiresAtMs) && nowMs >= expiresAtMs,
  };
}

export interface ScanContext {
  now(): number;
  /**
   * Whether this scan may ask the OS to **release** secret material, accepting
   * that on macOS that can put a modal dialog in front of the owner once per
   * item. False in every scan that has not been told otherwise, because the
   * caller who can answer "is a human watching this?" is the one invoking the
   * command, and a default of true answers it wrongly and silently.
   *
   * Required rather than optional so that a future construction site has to
   * decide. An optional flag defaulting to false reads the same at the one call
   * site that exists today and fails open the moment someone spreads a partial
   * context.
   */
  readonly releaseSecrets: boolean;
}

/**
 * One credential source shape. Adding support for a new tool is a new `Detector`
 * in `DETECTORS` and nothing else: the reporting, the redaction, the import path
 * and the provenance stamping are all shared.
 */
export interface Detector {
  readonly name: string;
  readonly provider: string;
  detect(source: CredentialSource, context: ScanContext): Promise<Finding[]>;
}

function origin(source: CredentialSource, kind: CredentialOrigin["kind"], location: string, context: ScanContext): CredentialOrigin {
  return { machine: source.machine, kind, location, detectedAt: new Date(context.now()).toISOString() };
}

/** Record ids are `[a-z][a-z0-9-]*`; anything else is folded into that alphabet. */
export function slugify(...parts: (string | null | undefined)[]): string {
  const joined = parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = joined.replace(/^[^a-z]+/, "");
  return slug || "secret";
}

/** Non-secret JWT claims. Used for expiry and account identity, never for material. */
export function jwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function claimString(claims: Record<string, unknown> | null, key: string): string | null {
  const value = claims?.[key];
  return typeof value === "string" && value ? value : null;
}

function isoFromSeconds(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1_000).toISOString() : null;
}

function isoFromMilliseconds(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value).toISOString() : null;
}

function isoFromText(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/* -------------------------------------------------------------------------- */
/* Detectors                                                                   */
/* -------------------------------------------------------------------------- */

const OPENAI_TOKEN_ENDPOINT = "https://auth.openai.com/oauth/token";
const ANTHROPIC_TOKEN_ENDPOINT = "https://console.anthropic.com/v1/oauth/token";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * `~/.codex/auth.json`. Carries the ChatGPT OAuth triad and, when the owner
 * chose a metered key instead, `OPENAI_API_KEY`. Both are reported: they are
 * different products billed differently, and which one is present is exactly
 * what the owner is trying to find out.
 */
const codexAuthJson: Detector = {
  name: "codex-auth-json",
  provider: "openai",
  async detect(source, context) {
    const file = joinSource(source.home, ".codex/auth.json");
    const document = parseJson(await source.readFile(file));
    if (!document) return [];
    const findings: Finding[] = [];
    const tokens = record(document.tokens);
    const accessToken = tokens ? stringField(tokens, "access_token") : null;
    if (accessToken) {
      const idClaims = jwtClaims(stringField(tokens as Record<string, unknown>, "id_token") ?? "");
      const accessClaims = jwtClaims(accessToken);
      const auth = record(idClaims?.["https://api.openai.com/auth"]) ?? record(accessClaims?.["https://api.openai.com/auth"]);
      const plan = auth ? stringField(auth, "chatgpt_plan_type") : null;
      const account = claimString(idClaims, "email") ?? (tokens ? stringField(tokens, "account_id") : null);
      const refreshToken = tokens ? stringField(tokens, "refresh_token") : null;
      const material: SecretMaterial = {
        type: "oauth_token",
        accessToken: new SecretValue(accessToken),
        refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
        refreshTokenExpiresAt: null,
        scopes: [],
        subscriptionType: plan,
        tokenEndpoint: OPENAI_TOKEN_ENDPOINT,
      };
      findings.push({
        detector: this.name,
        provider: "openai",
        type: "oauth_token",
        suggestedId: slugify("openai", "chatgpt", source.machine),
        label: `OpenAI ChatGPT login (${plan ?? "unknown plan"}) on ${source.machine}`,
        purpose: "openai/chatgpt",
        account,
        expiresAt: isoFromSeconds(accessClaims?.exp),
        plan: "subscription",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: [
          `codex auth_mode=${stringField(document, "auth_mode") ?? "unknown"}`,
          ...(stringField(document, "last_refresh") ? [`last refreshed ${stringField(document, "last_refresh")}`] : []),
        ],
        material,
      });
    }
    const apiKey = stringField(document, "OPENAI_API_KEY");
    if (apiKey) {
      const material: SecretMaterial = { type: "api_key", apiKey: new SecretValue(apiKey), header: "Authorization" };
      findings.push({
        detector: this.name,
        provider: "openai",
        type: "api_key",
        suggestedId: slugify("openai", "api-key", source.machine),
        label: `OpenAI API key on ${source.machine}`,
        purpose: "openai",
        account: null,
        expiresAt: null,
        plan: "metered_api_key",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: ["metered: billed per token, does not expire"],
        material,
      });
    }
    return findings;
  },
};

/** The `claudeAiOauth` document, wherever it is stored. Shared by file and keychain. */
function claudeOauthFinding(
  detector: string,
  source: CredentialSource,
  context: ScanContext,
  kind: CredentialOrigin["kind"],
  location: string,
  document: Record<string, unknown>,
  suffix: string | null,
): Finding | null {
  const oauth = record(document.claudeAiOauth);
  const accessToken = oauth ? stringField(oauth, "accessToken") : null;
  if (!oauth || !accessToken) return null;
  const refreshToken = stringField(oauth, "refreshToken");
  const subscriptionType = stringField(oauth, "subscriptionType");
  const material: SecretMaterial = {
    type: "oauth_token",
    accessToken: new SecretValue(accessToken),
    refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
    refreshTokenExpiresAt: isoFromMilliseconds(oauth.refreshTokenExpiresAt),
    scopes: Array.isArray(oauth.scopes) ? oauth.scopes.filter((entry): entry is string => typeof entry === "string") : [],
    subscriptionType,
    tokenEndpoint: ANTHROPIC_TOKEN_ENDPOINT,
  };
  return {
    detector,
    provider: "anthropic",
    type: "oauth_token",
    suggestedId: slugify("anthropic", "claude-code", suffix, source.machine),
    label: `Anthropic Claude Code login (${subscriptionType ?? "unknown plan"}) on ${source.machine}`,
    purpose: suffix ? `anthropic/claude-code-${slugify(suffix)}` : "anthropic/claude-code",
    account: stringField(document, "organizationUuid"),
    expiresAt: isoFromMilliseconds(oauth.expiresAt),
    plan: "subscription",
    origin: origin(source, kind, location, context),
    fingerprints: fingerprintsOf(material),
    notes: [
      ...(material.type === "oauth_token" && material.refreshTokenExpiresAt ? [`refresh token expires ${material.refreshTokenExpiresAt}`] : []),
      ...(refreshToken ? [] : ["no refresh token: this login cannot self-heal"]),
    ],
    material,
  };
}

/** `~/.claude/.credentials.json`, which is where Claude Code stores outside macOS. */
const claudeCredentialsFile: Detector = {
  name: "claude-credentials-file",
  provider: "anthropic",
  async detect(source, context) {
    const file = joinSource(source.home, ".claude/.credentials.json");
    const document = parseJson(await source.readFile(file));
    if (!document) return [];
    const finding = claudeOauthFinding(this.name, source, context, "file", file, document, null);
    return finding ? [finding] : [];
  },
};

/**
 * macOS keeps Claude Code's login in the keychain, one item per profile, with a
 * hash suffix on the service name. Every item is walked because the suffixed
 * ones are previous logins the owner may still want — and, as it turns out, the
 * ones most likely to be long dead.
 */
const claudeKeychain: Detector = {
  name: "claude-keychain",
  provider: "anthropic",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    const services = (await source.keychainItems())
      .map((item) => item.service)
      .filter((service) => /^Claude Code-credentials/.test(service));
    const findings: Finding[] = [];
    for (const service of [...new Set(services)].sort()) {
      const suffix = service.slice("Claude Code-credentials".length).replace(/^-/, "") || null;
      const read = await readKeychainItem(source, context, service, null);
      if (read.state === "absent") continue;
      if (read.state === "withheld") {
        findings.push(
          withheldKeychainFinding({
            detector: this.name,
            provider: "anthropic",
            source,
            context,
            suggestedId: slugify("anthropic", "claude-code", suffix, source.machine),
            label: `Anthropic Claude Code login in the keychain${suffix ? ` (${suffix})` : ""} on ${source.machine}`,
            purpose: suffix ? `anthropic/claude-code-${slugify(suffix)}` : "anthropic/claude-code",
            service,
            account: null,
          }),
        );
        continue;
      }
      const document = parseJson(read.value);
      if (!document) continue;
      const finding = claudeOauthFinding(this.name, source, context, "keychain", service, document, suffix);
      if (finding) findings.push(finding);
    }
    return findings;
  },
};

/** `~/.grok/auth.json`: one entry per issuer, keyed `<issuer>::<client id>`. */
const grokAuthJson: Detector = {
  name: "grok-auth-json",
  provider: "xai",
  async detect(source, context) {
    const file = joinSource(source.home, ".grok/auth.json");
    const document = parseJson(await source.readFile(file));
    if (!document) return [];
    const findings: Finding[] = [];
    for (const [key, value] of Object.entries(document)) {
      const entry = record(value);
      const accessToken = entry ? stringField(entry, "key") : null;
      if (!entry || !accessToken) continue;
      const refreshToken = stringField(entry, "refresh_token");
      const material: SecretMaterial = {
        type: "oauth_token",
        accessToken: new SecretValue(accessToken),
        refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
        refreshTokenExpiresAt: null,
        scopes: typeof jwtClaims(accessToken)?.scope === "string" ? String(jwtClaims(accessToken)?.scope).split(/\s+/) : [],
        subscriptionType: null,
        tokenEndpoint: null,
      };
      findings.push({
        detector: this.name,
        provider: "xai",
        type: "oauth_token",
        suggestedId: slugify("xai", "grok-cli", source.machine),
        label: `xAI Grok CLI login on ${source.machine}`,
        purpose: "xai/grok-cli",
        account: stringField(entry, "email"),
        expiresAt: isoFromText(entry.expires_at) ?? isoFromSeconds(jwtClaims(accessToken)?.exp),
        plan: "subscription",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: [`issuer ${key.split("::")[0] ?? "unknown"}`, "token endpoint unknown: refresh needs the xAI OIDC discovery document"],
        material,
      });
    }
    return findings;
  },
};

/** `~/.gemini/oauth_creds.json`, written by the Gemini CLI's Google sign-in. */
const geminiOauthCreds: Detector = {
  name: "gemini-oauth-creds",
  provider: "google",
  async detect(source, context) {
    const file = joinSource(source.home, ".gemini/oauth_creds.json");
    const document = parseJson(await source.readFile(file));
    const accessToken = document ? stringField(document, "access_token") : null;
    if (!document || !accessToken) return [];
    const accounts = parseJson(await source.readFile(joinSource(source.home, ".gemini/google_accounts.json")));
    const refreshToken = stringField(document, "refresh_token");
    const material: SecretMaterial = {
      type: "oauth_token",
      accessToken: new SecretValue(accessToken),
      refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
      refreshTokenExpiresAt: null,
      scopes: (stringField(document, "scope") ?? "").split(/\s+/).filter(Boolean),
      subscriptionType: null,
      tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
    };
    return [
      {
        detector: this.name,
        provider: "google",
        type: "oauth_token",
        suggestedId: slugify("google", "gemini-cli", source.machine),
        label: `Google Gemini CLI login on ${source.machine}`,
        purpose: "google/gemini-cli",
        account: (accounts ? stringField(accounts, "active") : null) ?? claimString(jwtClaims(stringField(document, "id_token") ?? ""), "email"),
        expiresAt: isoFromMilliseconds(document.expiry_date),
        plan: "subscription",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: ["Google refresh tokens do not expire on a schedule; they are revoked"],
        material,
      },
    ];
  },
};

/**
 * Antigravity's Google login. On macOS it lives in the keychain under service
 * `gemini`, go-keyring wrapped; the token document sits under `token`.
 */
const antigravityKeychain: Detector = {
  name: "antigravity-keychain",
  provider: "google",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    const read = await readKeychainItem(source, context, "gemini", "antigravity");
    if (read.state === "absent") return [];
    if (read.state === "withheld") {
      return [
        withheldKeychainFinding({
          detector: this.name,
          provider: "google",
          source,
          context,
          suggestedId: slugify("google", "antigravity", source.machine),
          label: `Google Antigravity login in the keychain on ${source.machine}`,
          purpose: "google/antigravity",
          service: "gemini",
          account: "antigravity",
        }),
      ];
    }
    const document = parseJson(read.value);
    const token = document ? record(document.token) : null;
    const accessToken = token ? stringField(token, "access_token") : null;
    if (!document || !token || !accessToken) return [];
    const refreshToken = stringField(token, "refresh_token");
    const material: SecretMaterial = {
      type: "oauth_token",
      accessToken: new SecretValue(accessToken),
      refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
      refreshTokenExpiresAt: null,
      scopes: [],
      subscriptionType: stringField(document, "auth_method"),
      tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
    };
    return [
      {
        detector: this.name,
        provider: "google",
        type: "oauth_token",
        suggestedId: slugify("google", "antigravity", source.machine),
        label: `Google Antigravity login on ${source.machine}`,
        purpose: "google/antigravity",
        account: claimString(jwtClaims(stringField(document, "id_token") ?? ""), "email"),
        expiresAt: isoFromText(token.expiry),
        plan: "subscription",
        origin: origin(source, "keychain", "gemini/antigravity", context),
        fingerprints: fingerprintsOf(material),
        notes: [`auth method ${stringField(document, "auth_method") ?? "unknown"}`],
        material,
      },
    ];
  },
};

/**
 * Cursor splits its login across two keychain services. They are one credential
 * from the owner's point of view, so they are recomposed into one record rather
 * than filed as two halves that would each look unrefreshable.
 */
const cursorKeychain: Detector = {
  name: "cursor-keychain",
  provider: "cursor",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    const access = await readKeychainItem(source, context, "cursor-access-token", null);
    if (access.state === "absent") return [];
    if (access.state === "withheld") {
      return [
        withheldKeychainFinding({
          detector: this.name,
          provider: "cursor",
          source,
          context,
          suggestedId: slugify("cursor", source.machine),
          label: `Cursor login in the keychain on ${source.machine}`,
          purpose: "cursor",
          service: "cursor-access-token",
          account: null,
        }),
      ];
    }
    const accessToken = access.value;
    const refresh = await readKeychainItem(source, context, "cursor-refresh-token", null);
    // The refresh half staying shut is survivable where the access half opened:
    // the record is still importable, just not self-healing. Only the access half
    // decides whether there is a credential here at all.
    const refreshToken = refresh.state === "released" ? refresh.value : null;
    const config = parseJson(await source.readFile(joinSource(source.home, ".cursor/cli-config.json")));
    const authInfo = config ? record(config.authInfo) : null;
    const material: SecretMaterial = {
      type: "oauth_token",
      accessToken: new SecretValue(accessToken.trim()),
      refreshToken: refreshToken ? new SecretValue(refreshToken.trim()) : null,
      refreshTokenExpiresAt: null,
      scopes: typeof jwtClaims(accessToken)?.scope === "string" ? String(jwtClaims(accessToken)?.scope).split(/\s+/) : [],
      subscriptionType: null,
      tokenEndpoint: null,
    };
    return [
      {
        detector: this.name,
        provider: "cursor",
        type: "oauth_token",
        suggestedId: slugify("cursor", source.machine),
        label: `Cursor login on ${source.machine}`,
        purpose: "cursor",
        account: authInfo ? stringField(authInfo, "email") : null,
        expiresAt: isoFromSeconds(jwtClaims(accessToken)?.exp),
        plan: "subscription",
        origin: origin(source, "keychain", "cursor-access-token", context),
        fingerprints: fingerprintsOf(material),
        notes: ["access and refresh halves recomposed from two keychain services"],
        material,
      },
    ];
  },
};

/**
 * The GitHub CLI's `hosts.yml`, at both the XDG path and the Windows roaming
 * one. Parsed by hand rather than with a YAML library: the file is two levels of
 * `key: value`, and this module takes no new dependencies.
 */
const githubHosts: Detector = {
  name: "github-hosts",
  provider: "github",
  async detect(source, context) {
    const candidates = [
      joinSource(source.home, ".config/gh/hosts.yml"),
      joinSource(source.home, "AppData/Roaming/GitHub CLI/hosts.yml"),
    ];
    for (const file of candidates) {
      const raw = await source.readFile(file);
      if (!raw) continue;
      const hosts = parseGitHubHosts(raw);
      const findings: Finding[] = [];
      for (const host of hosts) {
        const material: SecretMaterial = { type: "api_key", apiKey: new SecretValue(host.token), header: "Authorization" };
        findings.push({
          detector: this.name,
          provider: "github",
          type: "api_key",
          suggestedId: slugify("github", host.host, source.machine),
          label: `GitHub CLI token for ${host.host} on ${source.machine}`,
          purpose: "github",
          account: host.user,
          expiresAt: null,
          plan: "unknown",
          origin: origin(source, "file", file, context),
          fingerprints: fingerprintsOf(material),
          notes: ["gh OAuth tokens do not carry an expiry; they are revoked or rotated by the owner"],
          material,
        });
      }
      if (findings.length > 0) return findings;
    }
    return [];
  },
};

export type { GitHubHostEntry } from "../file-providers.js";
export { parseGitHubHosts } from "../file-providers.js";
/** macOS keeps the same gh token in the keychain when the owner enabled it. */
const githubKeychain: Detector = {
  name: "github-keychain",
  provider: "github",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    const services = (await source.keychainItems()).map((item) => item.service).filter((service) => /^gh:/.test(service));
    const findings: Finding[] = [];
    for (const service of [...new Set(services)].sort()) {
      const read = await readKeychainItem(source, context, service, null);
      if (read.state === "absent") continue;
      if (read.state === "withheld") {
        findings.push(
          withheldKeychainFinding({
            detector: this.name,
            provider: "github",
            source,
            context,
            suggestedId: slugify("github", "keychain", service.slice(3), source.machine),
            label: `GitHub CLI keychain token for ${service.slice(3)} on ${source.machine}`,
            purpose: "github",
            service,
            account: null,
          }),
        );
        continue;
      }
      const token = read.value.trim();
      if (!token) continue;
      const material: SecretMaterial = { type: "api_key", apiKey: new SecretValue(token), header: "Authorization" };
      findings.push({
        detector: this.name,
        provider: "github",
        type: "api_key",
        suggestedId: slugify("github", "keychain", service.slice(3), source.machine),
        label: `GitHub CLI keychain token for ${service.slice(3)} on ${source.machine}`,
        purpose: "github",
        account: null,
        expiresAt: null,
        plan: "unknown",
        origin: origin(source, "keychain", service, context),
        fingerprints: fingerprintsOf(material),
        notes: ["likely the same token as hosts.yml; import one of the two"],
        material,
      });
    }
    return findings;
  },
};

/** The Agent OS state root's own secrets directory: `*.secret` files and PEMs. */
const agentOsSecrets: Detector = {
  name: "agent-os-secrets",
  provider: "andromeda",
  async detect(source, context) {
    const directory = joinSource(source.home, ".agents/secrets");
    const names = await source.listDirectory(directory);
    const findings: Finding[] = [];
    for (const name of names.sort()) {
      if (name === "registry.json" || name.startsWith(".")) continue;
      const file = joinSource(directory, name);
      const raw = (await source.readFile(file))?.trim();
      if (!raw) continue;
      const stem = name.replace(/\.(secret|pem|json)$/, "");
      const suggestedId = slugify("agents", stem, source.machine);
      const document = parseJson(raw);
      const accessToken = document ? stringField(document, "access_token") ?? stringField(document, "accessToken") : null;
      if (document && accessToken) {
        // Some tools drop a whole token response in here rather than a bare
        // key. Filing that as an `api_key` would hide an expiry and a refresh
        // token the supervisor could have used, which is the one mistake this
        // whole component exists to stop.
        const refreshToken = stringField(document, "refresh_token") ?? stringField(document, "refreshToken");
        const provider = stringField(document, "provider") ?? slugify(stem);
        const material: SecretMaterial = {
          type: "oauth_token",
          accessToken: new SecretValue(accessToken),
          refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
          refreshTokenExpiresAt: null,
          scopes: [],
          subscriptionType: null,
          tokenEndpoint: null,
        };
        findings.push({
          detector: this.name,
          provider,
          type: "oauth_token",
          suggestedId,
          label: `${provider} login stored in the Agent OS state root on ${source.machine}`,
          purpose: `${slugify(provider)}/${slugify(stem)}`,
          account: stringField(document, "email") ?? claimString(jwtClaims(accessToken), "email"),
          expiresAt: isoFromText(document.expires_at) ?? isoFromMilliseconds(document.expires_at) ?? isoFromSeconds(jwtClaims(accessToken)?.exp),
          plan: "subscription",
          origin: origin(source, "file", file, context),
          fingerprints: fingerprintsOf(material),
          notes: ["a full token response was stored here; the token endpoint is not recorded in the file"],
          material,
        });
        continue;
      }
      // A PEM or any other JSON document is a credential *bundle*, not a bearer
      // string: filing it as an `api_key` would tell the provider harness it
      // could send the whole file in an Authorization header.
      const structured = raw.startsWith("-----BEGIN") || document !== null;
      const type: SecretType = structured ? "generic_note" : "api_key";
      const material: SecretMaterial = structured
        ? { type: "generic_note", note: new SecretValue(raw) }
        : { type: "api_key", apiKey: new SecretValue(raw), header: null };
      findings.push({
        detector: this.name,
        provider: "andromeda",
        type,
        suggestedId,
        label: `Agent OS secret ${name} on ${source.machine}`,
        purpose: `andromeda/${slugify(stem)}`,
        account: null,
        expiresAt: null,
        plan: "unknown",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: structured ? ["stored as a note: it is a key bundle, not a bearer string"] : [],
        material,
      });
    }
    return findings;
  },
};

/**
 * Environment variables that name themselves as credentials. A denylist keeps
 * the obvious false positives out: a shell session key and a CI job token are
 * not credentials the owner needs kept alive.
 */
const CREDENTIAL_ENV = /_(API_KEY|TOKEN)$/;
const ENV_DENYLIST = new Set(["STARSHIP_SESSION_KEY", "GITHUB_ACTIONS_RUNTIME_TOKEN", "ACTIONS_RUNTIME_TOKEN", "ANDROMEDA_VAULT_PASSPHRASE"]);

const environmentVariables: Detector = {
  name: "environment-variables",
  provider: "environment",
  async detect(source, context) {
    const environment = await source.environment();
    const findings: Finding[] = [];
    for (const [name, value] of Object.entries(environment).sort(([left], [right]) => left.localeCompare(right))) {
      if (!CREDENTIAL_ENV.test(name) || ENV_DENYLIST.has(name) || !value.trim()) continue;
      const material: SecretMaterial = { type: "api_key", apiKey: new SecretValue(value.trim()), header: null };
      findings.push({
        detector: this.name,
        provider: providerFromEnvName(name),
        type: "api_key",
        suggestedId: slugify("env", name, source.machine),
        label: `${name} from the environment on ${source.machine}`,
        purpose: `env/${slugify(name)}`,
        account: null,
        expiresAt: null,
        plan: "metered_api_key",
        origin: origin(source, "environment", name, context),
        fingerprints: fingerprintsOf(material),
        notes: ["exported in the shell environment: readable by every process the owner runs"],
        material,
      });
    }
    return findings;
  },
};

function providerFromEnvName(name: string): string {
  const head = name.replace(/_(API_KEY|TOKEN)$/, "").toLowerCase();
  return head || "environment";
}

/**
 * The macOS keychain items the scanner will *try to read*, keyed by service. The
 * `macos-keychain-inventory` detector below reports every credential-shaped item
 * without opening it; this allowlist is the narrower set the owner named as worth
 * a deliberate read attempt — the developer-tool tokens (Codex, Tower, Supabase,
 * a GitHub PAT, a Microsoft OneAuth blob) that a re-auth supervisor would want as
 * a fallback.
 *
 * "Worth a deliberate read attempt" is the operative phrase, and it used to be
 * read as licence to attempt the read on every scan. It is not. Being on this
 * list makes an item eligible for release; it does not consent to one. A scan
 * enumerates these and reports them as present-but-not-read, and only a caller
 * that has said it can survive a prompt — `vault scan --release-secrets`, run
 * with the owner there — actually opens them.
 */
interface KeychainSecretSource {
  /** Matches the keychain service (`svce`) name. */
  service: RegExp;
  provider: string;
  /** Purpose for the imported record, given the item's account. */
  purpose: (account: string | null) => string;
}

const KEYCHAIN_SECRET_SOURCES: readonly KeychainSecretSource[] = [
  { service: /^Supabase CLI$/, provider: "supabase", purpose: () => "supabase" },
  { service: /^Codex Auth$/, provider: "openai", purpose: () => "openai/codex" },
  {
    service: /^Codex MCP Credentials$/,
    provider: "codex-mcp",
    // The account is `<mcp-server>|<hash>`; the server name is the purpose.
    purpose: (account) => `codex-mcp/${slugify(account?.split("|")[0] ?? "server")}`,
  },
  { service: /^Tower:.*:PersonalAccessToken$/, provider: "github", purpose: () => "github" },
  { service: /^OneAuthAccount$/, provider: "microsoft", purpose: () => "microsoft/oneauth" },
  { service: /^GitHub - https:\/\/api\.github\.com$/, provider: "github", purpose: () => "github" },
];

function keychainSecretSourceFor(service: string): KeychainSecretSource | null {
  return KEYCHAIN_SECRET_SOURCES.find((entry) => entry.service.test(service)) ?? null;
}

/**
 * Classify a keychain value that opened. A stored token response (JSON carrying
 * an access token) becomes a refreshable `oauth_token` so its expiry and refresh
 * half are not lost; anything else is an opaque bearer `api_key`. Passwords are
 * not synthesised here: every item on the allowlist is a machine token, and
 * guessing "password" for an opaque string would file it under a login it has no
 * username for.
 */
function keychainSecretMaterial(raw: string): SecretMaterial {
  const value = raw.trim();
  const document = parseJson(value);
  const accessToken = document ? stringField(document, "access_token") ?? stringField(document, "accessToken") : null;
  if (document && accessToken) {
    const refreshToken = stringField(document, "refresh_token") ?? stringField(document, "refreshToken");
    return {
      type: "oauth_token",
      accessToken: new SecretValue(accessToken),
      refreshToken: refreshToken ? new SecretValue(refreshToken) : null,
      refreshTokenExpiresAt: null,
      scopes: [],
      subscriptionType: null,
      tokenEndpoint: null,
    };
  }
  return { type: "api_key", apiKey: new SecretValue(value), header: null };
}

/**
 * Resolve one allowlisted keychain item into a finding.
 *
 * Both non-material outcomes land in the same place, and deliberately so. An item
 * this scan was not allowed to open and an item the owner declined to release are
 * the same fact from the report's point of view — the credential is there and the
 * vault does not have it — and the owner's next move is identical either way.
 * What changed is that the first outcome no longer costs a dialog to discover.
 */
async function openKeychainSecret(source: CredentialSource, context: ScanContext, item: KeychainItem, match: KeychainSecretSource): Promise<Finding> {
  const location = item.account ? `${item.service}/${item.account}` : item.service;
  const suggestedId = slugify("keychain", match.provider, item.account ?? item.service, source.machine);
  const read = await readKeychainItem(source, context, item.service, item.account);
  if (read.state !== "released") {
    return withheldKeychainFinding({
      detector: "macos-keychain-secrets",
      provider: match.provider,
      source,
      context,
      suggestedId,
      label: `keychain item ${location} on ${source.machine} (not read)`,
      purpose: `keychain/${slugify(item.service)}`,
      service: item.service,
      account: item.account,
    });
  }
  const value = read.value;
  const material = keychainSecretMaterial(value);
  return {
    detector: "macos-keychain-secrets",
    provider: match.provider,
    type: material.type,
    suggestedId,
    label: `${match.provider} ${material.type === "oauth_token" ? "login" : "token"} from keychain (${item.service}) on ${source.machine}`,
    purpose: match.purpose(item.account),
    account: item.account,
    expiresAt: material.type === "oauth_token" ? isoFromSeconds(jwtClaims(value)?.exp) : null,
    plan: material.type === "oauth_token" ? "subscription" : "metered_api_key",
    origin: origin(source, "keychain", location, context),
    fingerprints: fingerprintsOf(material),
    notes: ["read from the macOS keychain with the owner's approval"],
    material,
  };
}

const macosKeychainSecrets: Detector = {
  name: "macos-keychain-secrets",
  provider: "keychain",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    // Collect the allowlisted items, then resolve them concurrently.
    //
    // The concurrency used to be justified as latency control: a locked item costs
    // a full timeout, so opening them in series would make the scan's latency grow
    // with the number of locked items, and "several near-simultaneous 'allow?'
    // prompts are a better failure than a scan that appears to hang". That reasoned
    // about the wrong two options. Stacking the dialogs does not spare the owner
    // any of them — it delivers all of them at once, which is how a scan turns into
    // a wall of modal windows.
    //
    // It is safe to keep now only because the default path no longer releases
    // anything: with `releaseSecrets` false these resolve from enumeration alone,
    // so there is no prompt to multiply. Under an explicit `--release-secrets` the
    // owner has said they are present and expecting to approve things.
    const seen = new Set<string>();
    const targets: Array<{ item: KeychainItem; match: KeychainSecretSource }> = [];
    for (const item of await source.keychainItems()) {
      const match = keychainSecretSourceFor(item.service);
      if (!match) continue;
      const dedupe = `${item.service} ${item.account ?? ""}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      targets.push({ item, match });
    }
    return Promise.all(targets.map(({ item, match }) => openKeychainSecret(source, context, item, match)));
  },
};

/**
 * Everything else in the macOS keychain that names itself as a credential.
 * Reported without being read: an item another application owns makes the OS ask
 * the owner before releasing it, and a scan is exactly the wrong moment to raise
 * a modal dialog. So this detector says "there is a credential here" and leaves
 * importing it to a deliberate, attended `vault add`.
 *
 * This detector had the right instinct before the rest of the module did. What
 * was special-cased here — report it, do not demand it — is now what every
 * keychain detector does by default, via `readKeychainItem`.
 */
const KEYCHAIN_CREDENTIAL_HINT = /(token|credential|auth|api[-_ ]?key|oauth)/i;
const KEYCHAIN_IGNORED = /^(com\.apple\.|Chrome Safe Storage|.*Safe Storage$|AirPort|BluetoothGlobal|MobileBluetooth|WiFiAnalytics|iCloud$)/;

const macosKeychainInventory: Detector = {
  name: "macos-keychain-inventory",
  provider: "keychain",
  async detect(source, context) {
    if (source.platform !== "darwin") return [];
    const claimed = new Set(["gemini", "cursor-access-token", "cursor-refresh-token"]);
    const findings: Finding[] = [];
    for (const item of await source.keychainItems()) {
      const service = item.service;
      if (!service || KEYCHAIN_IGNORED.test(service) || claimed.has(service)) continue;
      if (/^Claude Code-credentials/.test(service) || /^gh:/.test(service)) continue;
      // The read-attempt detector above owns these; letting the inventory report
      // them too would file one item under two findings.
      if (keychainSecretSourceFor(service)) continue;
      if (!KEYCHAIN_CREDENTIAL_HINT.test(service)) continue;
      findings.push({
        detector: this.name,
        provider: "keychain",
        type: "generic_note",
        suggestedId: slugify("keychain", service, item.account, source.machine),
        label: `keychain item ${service}${item.account ? ` (${item.account})` : ""} on ${source.machine}`,
        purpose: `keychain/${slugify(service)}`,
        account: item.account,
        expiresAt: null,
        plan: "unknown",
        origin: origin(source, "keychain", item.account ? `${service}/${item.account}` : service, context),
        fingerprints: [],
        notes: ["reported only: reading it needs the owner to approve a keychain prompt"],
        material: null,
      });
    }
    return findings;
  },
};

/* -------------------------------------------------------------------------- */
/* SSH keys                                                                    */
/* -------------------------------------------------------------------------- */

/** A private-key PEM header, in any of the encodings `ssh-keygen` emits. */
const PRIVATE_KEY_HEADER = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/;

/** Files in `~/.ssh` that are never a private key, so they are not opened as one. */
const SSH_NON_KEY = /(\.pub$|^config$|^known_hosts|^authorized_keys$|^environment$|\.DS_Store$|\.ps1$|^id_[a-z0-9]+\.pub$)/i;

/**
 * Whether an OpenSSH-format private key is passphrase-protected, read from the
 * `ciphername` field rather than by trying to decrypt it — the point of a scan is
 * to never need the passphrase. `none` means unencrypted; anything else is a
 * cipher the private half is sealed with. Classic PEM keys announce it in the
 * clear with `Proc-Type`/`DEK-Info` or an `ENCRYPTED` header. `null` means the
 * format was not recognised and the honest answer is "unknown".
 */
export function sshKeyPassphraseState(pem: string): "none" | "encrypted" | "unknown" {
  if (/-----BEGIN OPENSSH PRIVATE KEY-----/.test(pem)) {
    const body = pem
      .split(/\r?\n/)
      .filter((line) => line && !line.includes("-----"))
      .join("");
    let bytes: Buffer;
    try {
      bytes = Buffer.from(body, "base64");
    } catch {
      return "unknown";
    }
    const magic = "openssh-key-v1\0";
    if (bytes.length < magic.length + 4 || bytes.subarray(0, magic.length).toString("latin1") !== magic) return "unknown";
    let offset = magic.length;
    const length = bytes.readUInt32BE(offset);
    offset += 4;
    if (offset + length > bytes.length) return "unknown";
    return bytes.subarray(offset, offset + length).toString("latin1") === "none" ? "none" : "encrypted";
  }
  if (/-----BEGIN ENCRYPTED PRIVATE KEY-----/.test(pem)) return "encrypted";
  if (/Proc-Type:\s*4,ENCRYPTED/i.test(pem) || /DEK-Info:/i.test(pem)) return "encrypted";
  if (PRIVATE_KEY_HEADER.test(pem)) return "none";
  return "unknown";
}

/** The OpenSSH SHA256 fingerprint of a `type base64 comment` public-key line. */
export function sshPublicKeyFingerprint(publicKey: string): string | null {
  const blob = publicKey.trim().split(/\s+/)[1];
  if (!blob || !/^[A-Za-z0-9+/]+=*$/.test(blob)) return null;
  try {
    return `SHA256:${createHash("sha256").update(Buffer.from(blob, "base64")).digest("base64").replace(/=+$/, "")}`;
  } catch {
    return null;
  }
}

/** The comment (third field) of a public-key line, which is where the key names itself. */
function sshPublicKeyComment(publicKey: string): string | null {
  const parts = publicKey.trim().split(/\s+/);
  return parts.length >= 3 ? parts.slice(2).join(" ") : null;
}

/**
 * Private keys under `~/.ssh`. An SSH key is the one credential family that
 * cannot be re-minted from a login screen — if it is lost the owner re-enrols a
 * new public key everywhere it was trusted — so it is exactly what a vault meant
 * to prevent lock-out has to hold. Only keys whose public half is on disk are
 * imported: the record model stores the public key alongside the private one, and
 * a key with no `.pub` cannot round-trip, so it is reported for the owner to
 * complete rather than stored broken. The passphrase itself is never captured;
 * `passphrase` stays null and its presence is recorded so the supervisor knows
 * whether the key can be used unattended.
 */
const sshKeys: Detector = {
  name: "ssh-keys",
  provider: "ssh",
  async detect(source, context) {
    const directory = joinSource(source.home, ".ssh");
    const names = await source.listDirectory(directory);
    const findings: Finding[] = [];
    for (const name of names.sort()) {
      if (SSH_NON_KEY.test(name)) continue;
      const file = joinSource(directory, name);
      const contents = await source.readFile(file);
      if (!contents || !PRIVATE_KEY_HEADER.test(contents)) continue;
      const passphrase = sshKeyPassphraseState(contents);
      const publicKeyLine = (await source.readFile(`${file}.pub`))?.trim() ?? null;
      const fingerprintValue = publicKeyLine ? sshPublicKeyFingerprint(publicKeyLine) : null;
      const comment = publicKeyLine ? sshPublicKeyComment(publicKeyLine) : null;
      const suggestedId = slugify("ssh", name, source.machine);
      const purpose = `ssh/${slugify(name)}`;
      if (!publicKeyLine) {
        findings.push({
          detector: this.name,
          provider: "ssh",
          type: "ssh_key",
          suggestedId,
          label: `SSH key ${name} on ${source.machine} (public half missing)`,
          purpose,
          account: comment,
          expiresAt: null,
          plan: "unknown",
          origin: origin(source, "file", file, context),
          fingerprints: [],
          notes: [`no ${name}.pub on disk: the record model needs the public half, so this key is reported rather than imported`],
          material: null,
        });
        continue;
      }
      const material: SecretMaterial = {
        type: "ssh_key",
        privateKey: new SecretValue(contents),
        publicKey: publicKeyLine,
        passphrase: null,
        fingerprint: fingerprintValue,
        comment,
      };
      findings.push({
        detector: this.name,
        provider: "ssh",
        type: "ssh_key",
        suggestedId,
        label: `SSH key ${name}${comment ? ` (${comment})` : ""} on ${source.machine}`,
        purpose,
        account: comment,
        expiresAt: null,
        plan: "unknown",
        origin: origin(source, "file", file, context),
        fingerprints: fingerprintsOf(material),
        notes: [
          passphrase === "encrypted"
            ? "passphrase-protected: the passphrase is not in the vault, so unattended use needs it added separately"
            : passphrase === "none"
              ? "no passphrase: usable unattended"
              : "passphrase state unrecognised",
          ...(fingerprintValue ? [`fingerprint ${fingerprintValue}`] : []),
        ],
        material,
      });
    }
    return findings;
  },
};

/* -------------------------------------------------------------------------- */
/* Password-manager and browser stores                                         */
/* -------------------------------------------------------------------------- */

/**
 * The saved-password stores a browser or password manager keeps. These are the
 * home of exactly the classes the vault most lacks — website passwords, and with
 * them the recovery paths behind a dead OAuth grant — but every one of them is
 * encrypted at rest under a key the vault must not attempt to recover: a browser
 * store behind the OS keychain, a manager behind a master passphrase. So this
 * detector does what the rules allow and no more — it establishes the store is
 * present, counts what it can from cleartext metadata, and reports what unlocking
 * would take. Nothing is decrypted; every finding is inventory, never material.
 */
interface PasswordStoreProbe {
  provider: string;
  /** Files that, if any is present, mean the store exists. */
  files: (home: string) => string[];
  unlock: string;
}

const PASSWORD_STORES: readonly PasswordStoreProbe[] = [
  {
    provider: "chrome",
    files: (home) => [joinSource(home, "Library/Application Support/Google/Chrome/Default/Login Data")],
    unlock: "encrypted under the 'Chrome Safe Storage' key in the login keychain; decrypting needs that key and the Chromium login DB format",
  },
  {
    provider: "bitwarden",
    files: (home) => [joinSource(home, "Library/Application Support/Bitwarden/data.json")],
    unlock: "locked under the account master password",
  },
  {
    provider: "1password",
    files: (home) => [joinSource(home, ".config/op/config")],
    unlock: "locked under the 1Password account; the app or `op signin` must unlock it",
  },
];

const passwordStores: Detector = {
  name: "password-stores",
  provider: "password-store",
  async detect(source, context) {
    const findings: Finding[] = [];
    const push = (provider: string, location: string, note: string, account: string | null = null) =>
      findings.push({
        detector: this.name,
        provider,
        type: "password",
        suggestedId: slugify("pwstore", provider, source.machine),
        label: `${provider} saved-password store on ${source.machine} (present, locked)`,
        purpose: `password-store/${slugify(provider)}`,
        account,
        expiresAt: null,
        plan: "unknown",
        origin: origin(source, "file", location, context),
        fingerprints: [],
        notes: [note],
        material: null,
      });

    for (const store of PASSWORD_STORES) {
      for (const file of store.files(source.home)) {
        // A missing file reads back as null locally and as an empty string over
        // the ssh transport; both mean "not here", so presence needs real bytes.
        if (!(await source.readFile(file))) continue;
        push(store.provider, file, `present but locked: ${store.unlock}. Not extracted (locked store).`);
        break;
      }
    }

    // Firefox names its profiles in a cleartext ini, so the store and the number
    // of logins in it are inventory metadata even though every login is sealed.
    const ini = await source.readFile(joinSource(source.home, "Library/Application Support/Firefox/profiles.ini"));
    if (ini) {
      for (const line of ini.split(/\r?\n/)) {
        const match = /^Path=(.+)$/.exec(line.trim());
        if (!match) continue;
        const logins = await source.readFile(joinSource(source.home, "Library/Application Support/Firefox", match[1]!.trim(), "logins.json"));
        if (!logins) continue;
        const count = (logins.match(/"encryptedUsername"/g) ?? []).length;
        push(
          "firefox",
          joinSource(source.home, "Library/Application Support/Firefox", match[1]!.trim(), "logins.json"),
          `present but locked: ${count} saved logins, each NSS-encrypted; decrypting needs the Firefox primary password (if set) via key4.db. Not extracted (locked store).`,
        );
      }
    }
    return findings;
  },
};

/**
 * The registry. Order is the report order, and adding a source is adding an
 * entry here — no other file changes.
 */
export const DETECTORS: readonly Detector[] = [
  codexAuthJson,
  claudeCredentialsFile,
  claudeKeychain,
  grokAuthJson,
  geminiOauthCreds,
  antigravityKeychain,
  cursorKeychain,
  githubHosts,
  githubKeychain,
  agentOsSecrets,
  environmentVariables,
  sshKeys,
  macosKeychainSecrets,
  macosKeychainInventory,
  passwordStores,
];

export interface ScanOptions {
  detectors?: readonly Detector[];
  /** Restrict to named detectors or providers. Empty means everything. */
  only?: readonly string[];
  now?: () => number;
  /**
   * Opt in to releasing secret material, knowing that on macOS this can raise one
   * "allow access" dialog per keychain item. Omitted means no: a scan is an
   * unattended operation until a caller says otherwise, and the caller is the only
   * party that knows whether the owner is sitting there.
   */
  releaseSecrets?: boolean;
}

/**
 * Run every applicable detector against one machine. Read-only throughout, and
 * silent by default — without `releaseSecrets` this will not ask the owner for
 * anything, so it is safe to run from a timer, a supervisor or an agent.
 */
export async function scanSource(source: CredentialSource, options: ScanOptions = {}): Promise<Finding[]> {
  const context: ScanContext = { now: options.now ?? (() => Date.now()), releaseSecrets: options.releaseSecrets === true };
  const only = new Set(options.only ?? []);
  const findings: Finding[] = [];
  for (const detector of options.detectors ?? DETECTORS) {
    if (only.size > 0 && !only.has(detector.name) && !only.has(detector.provider)) continue;
    findings.push(...(await detector.detect(source, context)));
  }
  return disambiguate(findings);
}

/**
 * Two credentials on one machine can slug to the same id — `GITHUB_TOKEN.secret`
 * and `github-token` both become `agents-github-token`. Left alone, importing
 * them would silently store one on top of the other, which is the worst possible
 * outcome for a tool whose job is to stop credentials going missing. So a
 * collision gets a numeric suffix and stays visible.
 */
function disambiguate(findings: readonly Finding[]): Finding[] {
  const used = new Map<string, number>();
  return findings.map((finding) => {
    const seen = used.get(finding.suggestedId) ?? 0;
    used.set(finding.suggestedId, seen + 1);
    if (seen === 0) return finding;
    return { ...finding, suggestedId: `${finding.suggestedId}-${seen + 1}`, notes: [...finding.notes, `id disambiguated: another source produced ${finding.suggestedId}`] };
  });
}

/* -------------------------------------------------------------------------- */
/* Import                                                                      */
/* -------------------------------------------------------------------------- */

export interface ImportOptions {
  scope: SecretScope;
  now(): number;
  /** Skip a finding whose id already exists rather than replacing it. */
  skipExisting?: boolean;
}

export type ImportOutcome =
  | { kind: "imported"; id: string; finding: RedactedFinding }
  | { kind: "skipped"; id: string; reason: string; finding: RedactedFinding };

/**
 * Provenance, as tags. Tags are the record's only free-form metadata channel and
 * they are already carried through `descriptorOf`, so an imported credential
 * answers "where did this come from and when" without a schema change and
 * without any risk of the answer travelling next to material.
 */
export function provenanceTags(finding: Finding, importedAt: string): string[] {
  return [
    `provenance:machine=${finding.origin.machine}`,
    `provenance:source=${finding.origin.kind}:${finding.origin.location}`,
    `provenance:detector=${finding.detector}`,
    `provenance:imported-at=${importedAt}`,
    `provider:${finding.provider}`,
    `plan:${finding.plan}`,
    ...(finding.account ? [`account:${finding.account}`] : []),
    ...canonicalRefsForPurpose(finding.purpose, finding.type).map((ref) => `ref:${ref}`),
  ];
}

export async function importFindings(vault: VaultStore, findings: readonly Finding[], options: ImportOptions): Promise<ImportOutcome[]> {
  const nowMs = options.now();
  const importedAt = new Date(nowMs).toISOString();
  const outcomes: ImportOutcome[] = [];
  for (const finding of findings) {
    const redacted = redactFinding(finding, nowMs);
    if (!finding.material) {
      outcomes.push({ kind: "skipped", id: finding.suggestedId, reason: "no readable material", finding: redacted });
      continue;
    }
    if (options.skipExisting && (await vault.get(finding.suggestedId))) {
      outcomes.push({ kind: "skipped", id: finding.suggestedId, reason: "a record with this id already exists", finding: redacted });
      continue;
    }
    await vault.put(
      createSecretRecord({
        id: finding.suggestedId,
        label: finding.label,
        purpose: finding.purpose,
        scope: options.scope,
        material: finding.material,
        expiresAt: finding.expiresAt,
        tags: provenanceTags(finding, importedAt),
        now: options.now,
      }),
    );
    outcomes.push({ kind: "imported", id: finding.suggestedId, finding: redacted });
  }
  return outcomes;
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */

function table(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return "";
  const widths: number[] = [];
  for (const row of rows) row.forEach((cell, index) => (widths[index] = Math.max(widths[index] ?? 0, cell.length)));
  return rows.map((row) => row.map((cell, index) => (index === row.length - 1 ? cell : cell.padEnd(widths[index] ?? 0))).join("  ").trimEnd()).join("\n");
}

export function renderScanReport(findings: readonly Finding[], nowMs: number): string {
  if (findings.length === 0) return "no credentials found\n";
  const rows: string[][] = [["PROVIDER", "TYPE", "ACCOUNT", "EXPIRY", "PLAN", "SOURCE", "FINGERPRINT", "ID"]];
  for (const finding of findings) {
    const redacted = redactFinding(finding, nowMs);
    rows.push([
      finding.provider,
      finding.type,
      finding.account ?? "-",
      finding.expiresAt ? `${finding.expiresAt}${redacted.expired ? " EXPIRED" : ""}` : "-",
      finding.plan,
      `${finding.origin.kind}:${finding.origin.location}`,
      finding.fingerprints.map(formatFingerprint).join(" ") || "(not read)",
      finding.suggestedId,
    ]);
  }
  const notes = findings.flatMap((finding) => finding.notes.map((note) => `  ${finding.suggestedId}: ${note}`));
  return `${table(rows)}\n${notes.length > 0 ? `\nnotes:\n${notes.join("\n")}\n` : ""}`;
}

/* -------------------------------------------------------------------------- */
/* Commands                                                                    */
/* -------------------------------------------------------------------------- */

const USAGE = `vault - agent-managed credential vault

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

function isSecretType(value: string): value is SecretType {
  return (SECRET_TYPES as readonly string[]).includes(value);
}

async function readMaterialInput(args: ParsedArguments, io: VaultCliIo): Promise<string> {
  const file = optional(args, "file");
  if (file) {
    if (!(await exists(file))) throw new VaultCliError(`no such file: ${file}`);
    return readFileFromDisk(file, "utf8");
  }
  if (!boolean(args, "stdin")) throw new VaultCliError("secret material must come from --stdin or --file, never from a command-line argument");
  return io.readStdin();
}

function scopeFrom(args: ParsedArguments): SecretScope {
  return { workspace: optional(args, "workspace") ?? "*", agents: many(args, "agent") };
}

function warnEmptyScope(scope: SecretScope, io: VaultCliIo): void {
  if (scope.agents.length === 0) io.err("warning: no --agent given, so no agent can read this record until it is re-scoped\n");
}

async function initCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const directory = resolveVaultDirectory(io.env, io.home);
  if (await readVaultConfig(directory)) throw new VaultCliError(`a vault already exists at ${directory}`);
  const masterKey: MasterKeyKind = boolean(args, "passphrase") ? "passphrase" : "key-file";
  const config: VaultConfig = { schemaVersion: CONFIG_SCHEMA_VERSION, masterKey, createdAt: new Date(io.now()).toISOString() };
  await writePrivateFile(vaultConfigFile(directory), `${JSON.stringify(config, null, 2)}\n`);
  // Forces the key source to mint its material now, so a misconfigured
  // passphrase fails at init rather than at the first write.
  const source = masterKeyFor(masterKey, directory, io);
  await source.key();
  if (boolean(args, "json")) io.out(`${JSON.stringify({ directory, masterKey, keySource: source.description })}\n`);
  else io.out(`vault initialised at ${directory}\nmaster key: ${source.description}\n`);
  return 0;
}

async function addCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const { store } = await openVault(io);
  const id = required(args, "id");
  const typeName = required(args, "type");
  if (!isSecretType(typeName)) throw new VaultCliError(`unknown secret type: ${typeName} (expected one of ${SECRET_TYPES.join(", ")})`);
  const raw = await readMaterialInput(args, io);
  const material = materialFromInput(typeName, raw, {
    header: optional(args, "header"),
    username: optional(args, "username"),
    origin: optional(args, "origin"),
    loginUrl: optional(args, "login-url"),
    publicKey: optional(args, "public-key"),
    issuer: optional(args, "issuer"),
    account: optional(args, "account"),
  });
  const scope = scopeFrom(args);
  warnEmptyScope(scope, io);
  const tags = many(args, "tag");
  const account = optional(args, "account");
  if (account != null && account.length > 0) {
    // Ensure account tag is always present when --account is given
    const accountTag = `account:${account}`;
    if (!tags.includes(accountTag)) tags.push(accountTag);
  }
  const record_ = createSecretRecord({
    id,
    label: required(args, "label"),
    purpose: required(args, "purpose"),
    scope,
    material,
    expiresAt: optional(args, "expires-at"),
    tags,
    now: io.now,
  });
  await store.put(record_);
  io.out(`added ${record_.id} (${record_.type}) for ${record_.purpose}: ${fingerprintsOf(material).map(formatFingerprint).join(" ")}\n`);
  return 0;
}

async function importTotpCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const { store } = await openVault(io);
  const raw = await readMaterialInput(args, io);
  const parameters = totpParametersFromInput(raw, { issuer: optional(args, "issuer"), account: optional(args, "account") });
  const scope = scopeFrom(args);
  warnEmptyScope(scope, io);
  const record_ = createSecretRecord({
    id: required(args, "id"),
    label: optional(args, "label") ?? `${parameters.issuer ?? "totp"} second factor`,
    purpose: required(args, "purpose"),
    scope,
    material: { type: "totp_seed", parameters },
    tags: many(args, "tag"),
    now: io.now,
  });
  await store.put(record_);
  const code = generateTotp(parameters, io.now());
  io.out(
    `imported ${record_.id} (totp_seed) for ${record_.purpose}: issuer=${parameters.issuer ?? "-"} account=${parameters.account ?? "-"} ` +
      `${parameters.algorithm}/${parameters.digits} digits/${parameters.period}s; a code is generating now (${Math.round(code.remainingMs / 1000)}s left in this step)\n`,
  );
  return 0;
}

async function healthById(store: VaultStore, io: VaultCliIo): Promise<Map<string, CredentialHealth>> {
  const supervisor = new ReauthSupervisor({ vault: store, now: io.now });
  const health = await supervisor.health();
  return new Map(health.map((entry) => [entry.id, entry]));
}

async function listCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const { store, directory } = await openVault(io);
  const descriptors = await store.describe();
  const health = await healthById(store, io);
  if (boolean(args, "json")) {
    io.out(`${JSON.stringify({ directory, records: descriptors.map((descriptor) => ({ ...descriptor, health: health.get(descriptor.id)?.state ?? "unknown" })) }, null, 2)}\n`);
    return 0;
  }
  if (descriptors.length === 0) {
    io.out(`no records in ${directory}\n`);
    return 0;
  }
  const rows: string[][] = [["ID", "TYPE", "ACCOUNT", "LABEL", "PURPOSE", "EXPIRES", "HEALTH"]];
  for (const descriptor of descriptors) {
    const entry = health.get(descriptor.id);
    const accountTag = descriptor.tags?.find((t: string) => t.startsWith('account:'));
    const account = accountTag ? accountTag.slice('account:'.length) : '-';
    rows.push([
      descriptor.id,
      descriptor.type,
      account,
      descriptor.label,
      descriptor.purpose,
      entry?.expiresAt ?? descriptor.expiresAt ?? "-",
      entry?.state ?? "unknown",
    ]);
  }
  io.out(`${table(rows)}\n`);
  return 0;
}

async function getCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const id = required(args, "id");
  const { store } = await openVault(io);
  const record_ = await store.get(id);
  if (!record_) throw new VaultCliError(`no such record: ${id}`);
  const out = optional(args, "out");
  if (!boolean(args, "reveal")) {
    io.err(
      `refusing to reveal ${id}: pass --reveal to confirm.\n` +
        (io.isTty ? "stdout is a terminal, so the value would land in your scrollback and possibly your terminal's history.\n" : "") +
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

async function totpCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const id = required(args, "id");
  const { store } = await openVault(io);
  const record_ = await store.get(id);
  if (!record_) throw new VaultCliError(`no such record: ${id}`);
  if (record_.material.type !== "totp_seed") throw new VaultCliError(`${id} is a ${record_.type}, not a totp_seed`);
  const code = generateTotp(record_.material.parameters, io.now());
  if (boolean(args, "json")) {
    io.out(`${JSON.stringify({ id, code: code.code, validUntil: new Date(code.validUntilMs).toISOString(), remainingSeconds: Math.round(code.remainingMs / 1000) })}\n`);
    return 0;
  }
  io.out(`${code.code}  (${Math.round(code.remainingMs / 1000)}s remaining)\n`);
  return 0;
}

async function statusCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const { store, directory, config } = await openVault(io);
  const supervisor = new ReauthSupervisor({ vault: store, now: io.now });
  const health = await supervisor.health();
  if (boolean(args, "json")) {
    io.out(`${JSON.stringify({ directory, masterKey: config.masterKey, checkedAt: new Date(io.now()).toISOString(), health }, null, 2)}\n`);
    return 0;
  }
  if (health.length === 0) {
    io.out(`no records in ${directory}\n`);
    return 0;
  }
  const rows: string[][] = [["ID", "PURPOSE", "STATE", "EXPIRES", "NEXT REFRESH", "SELF-HEALING", "STRATEGY"]];
  for (const entry of health) {
    rows.push([
      entry.id,
      entry.purpose,
      entry.state,
      entry.expiresAt ?? "-",
      entry.nextRefreshAt ?? "-",
      entry.selfHealing ? "yes" : "no",
      entry.strategy,
    ]);
  }
  const needsOwner = health.filter((entry) => entry.humanPresenceRequired && entry.state !== "healthy" && entry.state !== "no_expiry");
  const summary =
    `\n${health.filter((entry) => entry.selfHealing).length} of ${health.length} can renew themselves; ` +
    `${health.filter((entry) => entry.state === "expired").length} expired; ` +
    `${needsOwner.length} will need you.\n` +
    (needsOwner.length > 0 ? `${needsOwner.map((entry) => `  ${entry.id}: ${entry.strategy}`).join("\n")}\n` : "");
  io.out(`${table(rows)}\n${summary}`);
  return 0;
}

function sourceFromArguments(args: ParsedArguments, io: VaultCliIo): CredentialSource {
  const host = optional(args, "ssh");
  if (!host) {
    return new LocalSource({ machine: optional(args, "machine") ?? "local", home: io.home, env: io.env });
  }
  const platformName = optional(args, "remote-platform") ?? "linux";
  if (platformName !== "win32" && platformName !== "linux" && platformName !== "darwin") {
    throw new VaultCliError(`--remote-platform must be win32, linux or darwin, got ${platformName}`);
  }
  const home = optional(args, "remote-home");
  if (!home) throw new VaultCliError("--ssh requires --remote-home, the credential owner's home directory on that machine");
  return new SshSource({ host, home, platform: platformName, machine: optional(args, "machine") ?? host });
}

async function scanCommand(args: ParsedArguments, io: VaultCliIo): Promise<number> {
  const source = sourceFromArguments(args, io);
  // The one place a human can consent to being prompted. It is a flag rather than
  // a heuristic on purpose: "is a TTY attached" and "is the owner looking at this
  // screen" are different questions, and every agent in this system runs attached
  // to something that looks like a terminal.
  const releaseSecrets = boolean(args, "release-secrets");
  if (releaseSecrets) {
    io.err("--release-secrets: macOS will ask you to approve each keychain item another application owns. Expect one dialog per item.\n");
  }
  const findings = await scanSource(source, { only: many(args, "only"), now: io.now, releaseSecrets });
  const nowMs = io.now();
  const wantsImport = boolean(args, "import");

  if (!wantsImport) {
    if (boolean(args, "json")) io.out(`${JSON.stringify({ machine: source.machine, scannedAt: new Date(nowMs).toISOString(), findings: findings.map((finding) => redactFinding(finding, nowMs)) }, null, 2)}\n`);
    else io.out(renderScanReport(findings, nowMs));
    const withheld = findings.filter((finding) => finding.notes.includes(KEYCHAIN_WITHHELD_NOTE)).length;
    io.err(
      `report only: pass --import to bring ${findings.filter((finding) => finding.material).length} readable credentials into the vault\n` +
        (withheld > 0 && !releaseSecrets ? `${withheld} keychain item(s) found but not read; re-run with --release-secrets, with the owner present, to open them\n` : ""),
    );
    return 0;
  }

  const { store } = await openVault(io);
  const scope = scopeFrom(args);
  warnEmptyScope(scope, io);
  const outcomes = await importFindings(store, findings, { scope, now: io.now, skipExisting: boolean(args, "skip-existing") });
  if (boolean(args, "json")) {
    io.out(`${JSON.stringify({ machine: source.machine, importedAt: new Date(nowMs).toISOString(), outcomes }, null, 2)}\n`);
    return 0;
  }
  const rows: string[][] = [["RESULT", "ID", "PROVIDER", "TYPE", "ACCOUNT", "EXPIRY", "DETAIL"]];
  for (const outcome of outcomes) {
    rows.push([
      outcome.kind,
      outcome.id,
      outcome.finding.provider,
      outcome.finding.type,
      outcome.finding.account ?? "-",
      outcome.finding.expiresAt ? `${outcome.finding.expiresAt}${outcome.finding.expired ? " EXPIRED" : ""}` : "-",
      outcome.kind === "skipped" ? outcome.reason : outcome.finding.fingerprints.map(formatFingerprint).join(" "),
    ]);
  }
  io.out(`${table(rows)}\n`);
  return 0;
}

/**
 * The entry point. Returns an exit code rather than calling `process.exit`, so
 * a test can drive every command in-process and so an embedding CLI decides what
 * a failure means.
 */
export async function vaultCommand(argv: readonly string[], overrides: Partial<VaultCliIo> = {}): Promise<number> {
  const io: VaultCliIo = { ...defaultVaultCliIo(), ...overrides };
  const [subcommand = "help", ...rest] = argv;
  const args = parseVaultArguments(rest);
  try {
    switch (subcommand) {
      case "help":
      case "--help":
      case "-h":
        io.out(USAGE);
        return 0;
      case "init":
        return await initCommand(args, io);
      case "add":
        return await addCommand(args, io);
      case "import-totp":
        return await importTotpCommand(args, io);
      case "list":
        return await listCommand(args, io);
      case "get":
        return await getCommand(args, io);
      case "totp":
        return await totpCommand(args, io);
      case "status":
        return await statusCommand(args, io);
      case "scan":
        return await scanCommand(args, io);
      default:
        io.err(`unknown vault subcommand: ${subcommand}\n${USAGE}`);
        return 1;
    }
  } catch (error) {
    io.err(`vault: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

/** Re-exported so a caller wiring this in needs one import, not three. */
export { descriptorOf, effectiveExpiryMs };

// Standalone entry. The `dsh` launcher also routes the `accounts` verb here
// (see the plugin bin), so this guard is only for running `node lib/vault/cli.js`.
const runningEntry = typeof process !== "undefined" && process.argv[1] ? process.argv[1].replace(/\\/g, "/") : "";
if (runningEntry.endsWith("/cli.js") || runningEntry.endsWith("/cli.ts")) {
  vaultCommand(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
