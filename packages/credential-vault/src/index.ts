/**
 * The dsh account manager (`ctx.accounts`): an encrypted vault that owns
 * provider secret values, layered over the harness credential seam.
 *
 * The vault is the Andromeda-parity record store (`EncryptedFileVault`): one
 * AES-256-GCM envelope per record under `<home>/vault/`, with a 32-byte master
 * key that comes from the macOS Keychain with the `<home>/accounts.key` file as
 * fallback — the same bootstrap the legacy document used. Records are addressed
 * through the seam by their canonical provider reference (a `ref:` tag), since
 * references like `CLAUDE_SUB_OAUTH_TOKEN` are not valid record ids.
 *
 * A legacy `<home>/accounts.vault` document (the v1 flat ref→value store) is
 * migrated into records on first boot, then retired to
 * `<home>/accounts.vault.v1-migrated` so nothing is silently destroyed.
 *
 * Consumers resolve a reference once per operation, vault first and the
 * harness credential seam second, so a secret imported or set here reaches the
 * very next operation without a restart while an ambient value keeps working
 * as a fallback. `set`/`unset` write the vault only — ambient values are read
 * through, never promoted.
 *
 * File-based importers move existing Claude Code and Cursor credentials into
 * the vault in one command; the harness owns login and obtaining for the
 * remaining providers.
 * @module dsh-credentials
 */

import { Service, type Context } from "@deepseek-ai/cordis";
import { credentialRef, type CredentialProvider } from "@deepseek-ai/dsh-credentials";
import z from "@deepseek-ai/schemastery";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { rename } from "node:fs/promises";
import { loadOrCreateKey, Vault } from "./vault.js";
import { exists } from "./vault/files.js";
import { EncryptedFileVault, vaultDirectory } from "./vault/store.js";
import type { MasterKeySource } from "./vault/masterkey.js";
import type { SecretRecord } from "./vault/record.js";
import { canonicalRefOf, recordForRef, refTag, revealFromRecord, slugRecordId } from "./refs.js";
import { claudeFileProvider, cursorFileProvider, githubFileProvider } from "./file-providers.js";
import { registerGithubCredentials } from "./github.js";
import { mountVaultWeb } from "./web.js";
import type { FileSecretProvider, ImportResult, ResolvedSecret } from "./types.js";

export { Vault } from "./vault.js";
export { claudeFileProvider, cursorFileProvider, githubFileProvider } from "./file-providers.js";
export {
  registerGithubCredentials,
  GITHUB_API_BASE,
  GITHUB_AUTHORIZE_URL,
  GITHUB_TOKEN_URL,
} from "./github.js";
export { VAULT_PREFIX, KNOWN_REF_NAMES, listRows, makeVaultHandler, mountVaultWeb } from "./web.js";
export type { VaultListRow } from "./web.js";
export type { FileSecretProvider, ImportResult, ResolvedSecret } from "./types.js";
export * from "./refs.js";

export const name = "dsh-credentials";
export const inject: string[] = [];

/** Resolve the agent home directory: config overrides `$DSH_HOME`, then `~/.agents`. */
function resolveHome(configHome: string | undefined): string {
  return resolve(configHome ?? process.env["DSH_HOME"] ?? join(homedir(), ".agents"));
}

/**
 * Plugin config, validated by the same-named schemastery schema. Everything
 * is optional: the home directory and the vault key file both default.
 */
export interface Config {
  /** Agent home directory holding `vault/` records (default `$DSH_HOME` or `~/.agents`). */
  home?: string;
  /** Vault key file, the Keychain fallback store (default `<home>/accounts.key`). */
  keyFile?: string;
  /** Public GitHub OAuth App client id; enables the OAuth refresh supplement. */
  githubClientId?: string;
  /** OAuth scopes for the GitHub App (defaults to `repo`, `workflow`). */
  githubScopes?: string[];
}

export const Config: z<Config> = z.object({
  home: z.string(),
  keyFile: z.string(),
  githubClientId: z.string(),
  githubScopes: z.array(z.string()),
});

/** The legacy v1 key bootstrap as a master-key source: Keychain first, key file second. */
class KeychainOrKeyFileMasterKey implements MasterKeySource {
  readonly description = "macOS Keychain (dsh.accounts) or 0600 key file";
  #key: Uint8Array | null = null;

  /** Constructs an instance. */
  constructor(private readonly keyFile: string) {}

  /** key implementation. */
  async key(): Promise<Uint8Array> {
    if (this.#key === null) this.#key = Uint8Array.from(await loadOrCreateKey(this.keyFile));
    return Uint8Array.from(this.#key);
  }
}

/** The path of the retired legacy document, kept after a successful migration. */
export function retiredLegacyVaultPath(home: string): string {
  return `${join(home, "accounts.vault")}.v1-migrated`;
}

/**
 * The account service. Subclassing {@link Service} with the `accounts` name
 * makes it available as `ctx.accounts` for the fiber's lifetime.
 */
export class AccountsService extends Service {
  private readonly vault: EncryptedFileVault;
  private readonly providers: Map<string, FileSecretProvider> = new Map();
  private readonly ready: Promise<void>;

  /** Constructs an instance. */
  constructor(
    ctx: Context,
    private readonly options: { home: string; keyFile: string },
  ) {
    super(ctx, "accounts");
    this.vault = new EncryptedFileVault({
      directory: vaultDirectory(options.home),
      masterKey: new KeychainOrKeyFileMasterKey(options.keyFile),
    });
    this.ready = this.migrateLegacyVault(options);
    this.registerFileProvider(claudeFileProvider);
    this.registerFileProvider(cursorFileProvider);
    this.registerFileProvider(githubFileProvider);
  }

  /** vaultPath implementation. */
  vaultPath(): string {
    return this.vault.directory;
  }

  /** registerFileProvider implementation. */
  registerFileProvider(provider: FileSecretProvider): void {
    this.providers.set(provider.id, provider);
  }

  /** getFileProviders implementation. */
  getFileProviders(): FileSecretProvider[] {
    return [...this.providers.values()];
  }

  /** resolve implementation. */
  async resolve(ref: string): Promise<ResolvedSecret | undefined> {
    return this.resolveFor(ref, undefined);
  }

  /**
   * Resolve a specific account's value for a canonical reference. When account
   * is undefined, resolves the default (no account tag) — preserving backward
   * compatibility with the 1:1 `resolve(ref)` contract.
   */
  async resolveFor(ref: string, account: string | undefined): Promise<ResolvedSecret | undefined> {
    await this.ready;
    const record = await this.recordForRef(ref, account);
    if (record !== null) {
      const value = revealFromRecord(record);
      if (value !== null) return { value, origin: "vault" };
    }
    // Only fall through to ambient credentials for the default (unscoped) case
    if (account === undefined) {
      const credentials = this.ctx.get("credentials") as CredentialProvider | undefined;
      if (credentials !== undefined) {
        const hit = await credentials.resolve(credentialRef(ref));
        if (hit !== undefined && hit.value.length > 0)
          return { value: hit.value, origin: "credentials" };
      }
    }
    return undefined;
  }

  /**
   * Return all stored records for a canonical reference across every account.
   * Each entry carries the account name (null for the default/unscoped record)
   * and the revealed value when the record type supports it.
   */
  async resolveAll(ref: string): Promise<
    Array<{
      ref: string;
      account: string | null;
      value: string | null;
      origin: "vault" | "credentials";
    }>
  > {
    await this.ready;
    const out: Array<{
      ref: string;
      account: string | null;
      value: string | null;
      origin: "vault" | "credentials";
    }> = [];
    for (const descriptor of await this.vault.describe()) {
      if (!descriptor.tags.includes(refTag(ref))) continue;
      const account =
        descriptor.tags.find((tag) => tag.startsWith("account:"))?.slice("account:".length) ?? null;
      const record = await this.vault.get(descriptor.id);
      if (record === null) continue;
      const value = revealFromRecord(record);
      out.push({ ref, account, value, origin: "vault" });
    }
    // Include ambient credential for the default case if no vault record found for default
    const hasDefault = out.some((e) => e.account === null);
    if (!hasDefault) {
      const credentials = this.ctx.get("credentials") as CredentialProvider | undefined;
      if (credentials !== undefined) {
        const hit = await credentials.resolve(credentialRef(ref));
        if (hit !== undefined && hit.value.length > 0) {
          out.push({ ref, account: null, value: hit.value, origin: "credentials" });
        }
      }
    }
    return out;
  }

  /** set implementation. */
  async set(ref: string, value: string, account?: string): Promise<void> {
    await this.ready;
    if (value.length === 0)
      throw new Error(`dsh-credentials: refusing to store an empty value for ${ref}`);
    await this.vault.put(recordForRef(ref, value, account !== undefined ? { account } : {}));
  }

  /** unset implementation. */
  async unset(ref: string, account?: string): Promise<void> {
    await this.ready;
    const record = await this.recordForRef(ref, account);
    if (record !== null) await this.vault.delete(record.id);
  }

  /** list implementation. */
  async list(): Promise<string[]> {
    await this.ready;
    const refs = new Set<string>();
    for (const descriptor of await this.vault.describe()) refs.add(canonicalRefOf(descriptor));
    return [...refs].sort();
  }

  /**
   * Every stored record's canonical reference and the account it belongs to,
   * material stripped. Named accounts arrive on records as `account:` tags,
   * most commonly from a scanned login.
   */
  async accounts(): Promise<
    Array<{
      ref: string;
      account: string | null;
      kind: string;
      purpose: string;
      label: string;
      expiresAt: string | null;
    }>
  > {
    await this.ready;
    const out: Array<{
      ref: string;
      account: string | null;
      kind: string;
      purpose: string;
      label: string;
      expiresAt: string | null;
    }> = [];
    for (const descriptor of await this.vault.describe()) {
      const account =
        descriptor.tags.find((tag) => tag.startsWith("account:"))?.slice("account:".length) ?? null;
      out.push({
        ref: canonicalRefOf(descriptor),
        account,
        kind: descriptor.type,
        purpose: descriptor.purpose,
        label: descriptor.label,
        expiresAt: descriptor.expiresAt,
      });
    }
    return out;
  }

  /** importFile implementation. */
  async importFile(path: string): Promise<ImportResult[]> {
    await this.ready;
    for (const provider of this.providers.values()) {
      if (!(await provider.detect(path))) continue;
      const secrets = await provider.read(path);
      const results: ImportResult[] = [];
      for (const [ref, value] of Object.entries(secrets)) {
        if (value.length === 0) continue;
        await this.vault.put(recordForRef(ref, value));
        results.push({ ref, provider: provider.id, source: path });
      }
      if (results.length === 0) {
        throw new Error(`dsh-credentials: ${path} holds no known secrets for ${provider.id}`);
      }
      return results;
    }
    throw new Error(`dsh-credentials: no file provider recognized ${path}`);
  }

  /**
   * The record a canonical reference resolves to in this vault, or null.
   * When account is provided, only matches records tagged with that account.
   */
  private async recordForRef(ref: string, account?: string): Promise<SecretRecord | null> {
    // Try direct slug lookup first (fast path)
    const direct = await this.vault.get(slugRecordId(ref, account));
    if (direct !== null) return direct;
    // Fall back to tag scan
    for (const descriptor of await this.vault.describe()) {
      if (!descriptor.tags.includes(refTag(ref))) continue;
      // If account is specified, filter by account tag
      if (account !== undefined && account.length > 0) {
        if (!descriptor.tags.includes(`account:${account}`)) continue;
      } else {
        // Default lookup: skip records that have an account tag (they're scoped)
        if (descriptor.tags.some((tag) => tag.startsWith("account:"))) continue;
      }
      const record = await this.vault.get(descriptor.id);
      if (record !== null) return record;
    }
    return null;
  }

  /**
   * One-time v1→v2 migration: when no record exists yet and the legacy
   * document does, every legacy ref is stored as a tagged record and the
   * document is retired rather than deleted. Failure is logged, never fatal —
   * a migration hiccup must not take the whole seam down.
   */
  private async migrateLegacyVault(options: { home: string; keyFile: string }): Promise<void> {
    const legacyFile = join(options.home, "accounts.vault");
    try {
      if (!(await exists(legacyFile))) return;
      if ((await this.vault.list()).length > 0) return;
      const legacy = new Vault(legacyFile, options.keyFile);
      for (const ref of await legacy.list()) {
        const value = await legacy.get(ref);
        if (value === undefined || value.length === 0) continue;
        await this.vault.put(recordForRef(ref, value));
      }
      await rename(legacyFile, retiredLegacyVaultPath(options.home));
    } catch (error) {
      this.ctx.logger.error("dsh-credentials: legacy vault migration failed");
      this.ctx.logger.error(error);
    }
  }
}

declare module "@deepseek-ai/cordis" {
  interface Context {
    accounts: AccountsService;
  }
}

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const home = resolveHome(config.home);
  const keyFile = config.keyFile ?? join(home, "accounts.key");
  const accounts = new AccountsService(ctx, { home, keyFile });
  registerGithubCredentials(config.githubClientId, config.githubScopes);
  mountVaultWeb(ctx, accounts);
}
