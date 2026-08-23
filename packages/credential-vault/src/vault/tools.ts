/**
 * Capability tools: the only vault surface an LLM-driven agent is ever handed.
 *
 * The rule this module exists to enforce is one sentence long — *a secret value
 * never leaves the vault* — and it is worth being blunt about why the previous
 * shape could not enforce it. An agent that can call `secret()` receives
 * material into agent-visible space, and agent-visible space is a prompt, a
 * transcript, a log line, a tool argument, and an outbound request to a third
 * party. There is no discipline an agent can apply that makes a retrieved
 * secret un-retrieved. A retrievable secret is an exfiltrated secret.
 *
 * So the vault stops answering "what is the credential?" and starts answering
 * "here is the result of using it". The agent says *do this authenticated
 * thing*; the vault decides whether it may, attaches the credential itself, and
 * hands back only an outcome. Five capabilities cover what the agent actually
 * needed the material for:
 *
 * - `authenticatedFetch` — an HTTP call with the credential applied the way the
 *   provider descriptor says it should be applied.
 * - `currentTotpCode` — a live six-to-eight digit code. A code is single-use and
 *   dies in thirty seconds; the seed is forever.
 * - `runAuthenticatedProcess`, and `gitPush`/`gitFetch` over it — a child
 *   process that receives the credential through its own environment, which the
 *   parent never echoes and the result never carries.
 * - `signWith` — a signature, not a signing key.
 * - `describeCredential` — metadata, so an agent can reason about what it has
 *   without holding any of it.
 *
 * Three properties hold across all of them, and each is load-bearing.
 *
 * *The host allow-list is the centre of the design.* Attaching a credential to
 * an agent-chosen URL is the whole exfiltration path: one GitHub-authenticated
 * request to `evil.com` and the token is gone, with the vault's own hands on the
 * wheel. So every request's host is checked against a list derived from the
 * provider descriptor and from the record itself, an empty list denies
 * everything, and redirects are never followed — a 302 to another origin is
 * reported back rather than chased, because the chase would carry the header
 * across a boundary the allow-list just enforced.
 *
 * *The agent cannot participate in authentication.* An agent-supplied
 * `Authorization` header — or `Cookie`, or `x-api-key`, or the descriptor's own
 * header, or a credential in the URL's userinfo — is a refusal, not an
 * overwrite. Otherwise "let the vault attach auth" quietly becomes "let the
 * agent choose what auth is attached", and a stolen-from-somewhere-else token
 * gets laundered through a vault-audited request.
 *
 * *No return type can carry material.* `MaterialFree<T>` is a compile-time proof
 * obligation: a result type that contains a `SecretValue`, a `SecretRecord`, a
 * `SecretMaterial`, `TotpParameters`, or any function that could close over one
 * collapses to `never`, and the tool that tries to return it stops compiling.
 * That is the type system doing the work rather than a reviewer remembering to.
 * Belt and braces on top: every string that crosses back — response body,
 * response headers, stdout, stderr, error text — is scrubbed of the material
 * that was injected, because a remote endpoint that echoes its own
 * `Authorization` header would otherwise hand the agent the token by proxy.
 */

import { spawn } from "node:child_process";
import { createPrivateKey, createPublicKey, sign as cryptoSign, type KeyObject } from "node:crypto";
import { findProviderDescriptor } from "./provider-descriptor.js";
import type { SecretValue } from "./secret.js";
import type { AuditSink } from "./agent.js";
import {
  descriptorOf,
  scopeAllows,
  type AgentIdentity,
  type SecretMaterial,
  type SecretRecord,
  type SecretType,
} from "./record.js";
import type { VaultStore } from "./store.js";
import type { CredentialState, ReauthStrategy, ReauthSupervisor } from "./supervisor.js";
import { generateTotp, type TotpParameters } from "./totp.js";

const REDACTED = "[redacted]";

/** Tag namespaces. Tags are the record's free-form channel; see `cli.ts`. */
const HOST_TAG = "host:";
const AUTH_TAG = "auth:";
const EXEC_TAG = "exec:";
const ACCOUNT_TAG = "account:";

/** Environment variable the git credential helper reads the secret out of. */
const GIT_SECRET_ENV = "ANDROMEDA_VAULT_SECRET";
const GIT_USER_ENV = "ANDROMEDA_VAULT_USER";

const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

const METHODS: ReadonlySet<string> = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const BODY_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const LOOPBACK: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Headers an agent may never set. Every one of them is a channel for presenting
 * a credential the vault did not choose, and `set-cookie` is on the response
 * side of the same problem.
 */
const FORBIDDEN_REQUEST_HEADERS: ReadonlySet<string> = new Set([
  "authorization",
  "proxy-authorization",
  "authentication",
  "cookie",
  "cookie2",
  "x-api-key",
  "api-key",
  "apikey",
  "x-goog-api-key",
  "x-amz-security-token",
  "x-auth-token",
  "x-access-token",
  "x-vault-token",
  "private-token",
  "x-csrf-token",
]);

/** Response headers that would hand the agent a *new* credential. */
const STRIPPED_RESPONSE_HEADERS: ReadonlySet<string> = new Set(["set-cookie", "set-cookie2"]);

const FORBIDDEN_QUERY_PARAMETERS: ReadonlySet<string> = new Set([
  "access_token",
  "api_key",
  "apikey",
  "auth_token",
]);

/* -------------------------------------------------------------------------- */
/* Structural proof that nothing returned can carry material                   */
/* -------------------------------------------------------------------------- */

/** Everything in this codebase that is, or transitively holds, secret material. */
type SecretBearing = SecretValue | SecretRecord | SecretMaterial | TotpParameters;

/**
 * Whether `T` can carry secret material anywhere inside it. Functions count:
 * a closure is a perfectly good way to smuggle a `reveal()` past a shape check.
 */
export type CarriesMaterial<T> = [T] extends [never]
  ? false
  : T extends SecretBearing
    ? true
    : T extends (...args: never[]) => unknown
      ? true
      : T extends readonly (infer Element)[]
        ? CarriesMaterial<Element>
        : T extends object
          ? true extends { [K in keyof T]-?: CarriesMaterial<T[K]> }[keyof T]
            ? true
            : false
          : false;

/**
 * `T`, but only when nothing in it can hold material; `never` otherwise.
 *
 * Every tool declares its return type through this, so adding a secret-bearing
 * field to a result is a compile error at the `return` statement rather than a
 * leak somebody notices in a transcript six weeks later.
 */
export type MaterialFree<T> = CarriesMaterial<T> extends false ? T : never;

/* -------------------------------------------------------------------------- */
/* Outcomes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Why a capability was refused.
 *
 * "there is no such credential" and "that credential is not yours" are both
 * `out_of_scope`, deliberately and for the same reason `agent.ts` gives them one
 * message: an agent must not be able to map the vault by probing purposes. The
 * audit trail, which the agent never reads, keeps the distinction.
 */
export const VAULT_DENIALS = [
  "out_of_scope",
  "wrong_credential_type",
  "auth_placement_unknown",
  "no_allowed_hosts",
  "host_not_allowed",
  "agent_supplied_auth",
  "insecure_scheme",
  "url_credentials",
  "malformed_url",
  "method_not_allowed",
  "body_not_allowed",
  "rate_limited",
  "command_not_permitted",
  "capability_unavailable",
  "human_presence_required",
  "transport_failure",
  "invalid_argument",
] as const;

export type VaultDenialReason = (typeof VAULT_DENIALS)[number];

export interface VaultToolDenial {
  ok: false;
  denial: VaultDenialReason;
  /** Plain explanation. Never contains material, and never distinguishes a miss from a denial. */
  detail: string;
}

/** Every tool answers with this shape. The failure arm carries no material either. */
export type VaultToolResult<T> = ({ ok: true } & T) | VaultToolDenial;

/** The capability that ran. Doubles as the audit vocabulary. */
export type VaultToolOperation =
  | "authenticated_fetch"
  | "totp_code"
  | "authenticated_process"
  | "sign"
  | "describe_credential";

/* -------------------------------------------------------------------------- */
/* Injected seams                                                              */
/* -------------------------------------------------------------------------- */

export interface VaultTransportRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface VaultTransportResponse {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Egress for `authenticatedFetch`. This is the one place the credential is
 * visible after it leaves the record, which is why it is injected by the
 * runtime that owns the vault and never by the agent: it sits inside the trust
 * boundary the same way the cipher in `store.ts` does.
 */
export type VaultTransport = (request: VaultTransportRequest) => Promise<VaultTransportResponse>;

export interface ProcessSpec {
  command: string;
  args: readonly string[];
  cwd: string | null;
  /** Complete child environment. Not merged with the parent's — see `runAuthenticatedProcess`. */
  env: Record<string, string>;
}

export interface ProcessOutcome {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Child-process seam, injected for the same reason as the transport. */
export type ProcessRunner = (spec: ProcessSpec) => Promise<ProcessOutcome>;

/* -------------------------------------------------------------------------- */
/* Requests and results                                                        */
/* -------------------------------------------------------------------------- */

export interface AuthenticatedFetchRequest {
  url: string;
  method?: string;
  headers?: Readonly<Record<string, string>>;
  body?: string | null;
  /** Disambiguates when several in-scope credentials share a purpose. */
  credentialId?: string;
}

export interface CredentialHealthSummary {
  state: CredentialState;
  strategy: ReauthStrategy;
  selfHealing: boolean;
  humanPresenceRequired: boolean;
  nextRefreshAt: string | null;
  attempts: number;
}

/** Everything an agent may know about a credential. Material is not on the list. */
export interface CredentialSummary {
  id: string;
  type: SecretType;
  purpose: string;
  label: string;
  /** Provider descriptor id when the purpose names one, else null. */
  provider: string | null;
  /** Login name, TOTP account, or passkey user. Never a secret in this model. */
  account: string | null;
  expiresAt: string | null;
  updatedAt: string;
  allowedHosts: readonly string[];
  tags: readonly string[];
  health: CredentialHealthSummary | null;
}

export interface AuthenticatedFetchOk {
  status: number;
  statusText: string;
  /** Response headers, scrubbed of anything that would hand back a credential. */
  headers: Readonly<Record<string, string>>;
  body: string;
  /** Host the credential was actually presented to. */
  host: string;
  /**
   * Location of a redirect that was deliberately not followed. Re-issuing
   * against it costs another allow-list check, which is the point.
   */
  redirectedTo: string | null;
  credential: CredentialSummary;
}

export interface TotpCodeOk {
  /** Six to eight digits. Valid for one step and then worthless. */
  code: string;
  digits: number;
  validUntil: string;
  remainingMs: number;
  credentialId: string;
  purpose: string;
}

export interface AuthenticatedProcessRequest {
  command: string;
  args?: readonly string[];
  cwd?: string;
  /** Extra environment for the child. Cannot name the credential variable. */
  env?: Readonly<Record<string, string>>;
  /** Variable the credential is bound to inside the child. Default `ANDROMEDA_VAULT_SECRET`. */
  credentialEnv?: string;
  credentialId?: string;
}

export interface AuthenticatedProcessOk {
  exitCode: number;
  /** Scrubbed of the injected credential, in case the child echoed it. */
  stdout: string;
  stderr: string;
  command: string;
  credentialId: string;
}

export interface GitRequest {
  /** Must be an absolute https URL: a bare remote name has no host to check. */
  remote: string;
  refspec?: string;
  cwd?: string;
  credentialId?: string;
}

export interface SignRequest {
  payload: string;
  encoding?: "utf8" | "base64";
  credentialId?: string;
}

export interface SignOk {
  /** Base64url detached signature. */
  signature: string;
  algorithm: string;
  /** The published half. Not material — it travels in the clear by design. */
  publicKey: string;
  keyFingerprint: string | null;
  credentialId: string;
}

export interface DescribeCredentialOk {
  purpose: string;
  credentials: readonly CredentialSummary[];
}

export interface VaultToolUsage {
  purpose: string;
  /** Every call, granted or refused, since this toolset was constructed. */
  calls: number;
  denials: number;
  /** Calls inside the current rate-limit window. */
  inWindow: number;
  lastAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Host allow-list                                                             */
/* -------------------------------------------------------------------------- */

/** The provider descriptor id a purpose names, if any. `aws/production` -> `aws`. */
export function providerIdForPurpose(purpose: string): string {
  return purpose.split("/")[0] ?? purpose;
}

/**
 * Hosts this credential may be presented to.
 *
 * Three sources, in this order and no others:
 *
 * 1. the provider descriptor the purpose names — its base URL, its catalog
 *    endpoint, and every OAuth endpoint it declares, because those are exactly
 *    the hosts the descriptor says this credential is *for*;
 * 2. the material's own origins — a password's login URL, a cookie jar's
 *    origin, a token's endpoint;
 * 3. `host:` tags on the record, which is how the owner writes down a host for
 *    a purpose that is not a model provider at all.
 *
 * An empty result denies every request. A bare `*` is discarded rather than
 * honoured: a credential permitted everywhere is the exfiltration path this
 * whole module exists to close, so there is deliberately no way to spell it.
 */
export function allowedHostsFor(record: SecretRecord): string[] {
  const hosts = new Set<string>();
  const addUrl = (value: string | null | undefined): void => {
    if (!value) return;
    const host = hostOf(value);
    if (host) hosts.add(host);
  };

  const descriptor = findProviderDescriptor(providerIdForPurpose(record.purpose));
  if (descriptor) {
    addUrl(descriptor.baseUrl);
    if (descriptor.modelCatalog.kind === "list_endpoint") addUrl(descriptor.modelCatalog.url);
    const auth = descriptor.auth;
    if (auth?.method === "oauth_pkce") {
      addUrl(auth.authorizeUrl);
      addUrl(auth.tokenUrl);
      addUrl(auth.revokeUrl);
      addUrl(auth.discoveryUrl);
    } else if (auth?.method === "oauth_device") {
      addUrl(auth.deviceAuthorizationUrl);
      addUrl(auth.tokenUrl);
    }
  }

  switch (record.material.type) {
    case "password":
      addUrl(record.material.origin);
      addUrl(record.material.loginUrl);
      break;
    case "cookie_jar":
      addUrl(record.material.origin);
      break;
    case "oauth_token":
      addUrl(record.material.tokenEndpoint);
      break;
    case "passkey":
      hosts.add(record.material.relyingPartyId.toLowerCase());
      break;
    default:
      break;
  }

  for (const tag of record.tags) {
    if (!tag.startsWith(HOST_TAG)) continue;
    const pattern = tag.slice(HOST_TAG.length).trim().toLowerCase();
    // `*` alone, an empty pattern, and a pattern that is only a suffix marker
    // are all "everywhere". None of them are a host.
    if (!pattern || pattern === "*" || pattern === "*." || pattern.includes("/")) continue;
    hosts.add(pattern);
  }

  return [...hosts].sort();
}

/**
 * Whether `hostname` matches the allow-list. Exact match, or a `*.example.com`
 * pattern which covers subdomains and deliberately does *not* cover the bare
 * domain — a wildcard that silently widened to its own parent would be a
 * surprise in the one direction that matters.
 */
export function hostAllowed(patterns: readonly string[], hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host) return false;
  return patterns.some((raw) => {
    const pattern = normalizeHost(raw);
    if (!pattern) return false;
    if (pattern === host) return true;
    if (!pattern.startsWith("*.")) return false;
    const suffix = pattern.slice(1);
    return host.endsWith(suffix) && host.length > suffix.length;
  });
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function hostOf(value: string): string | null {
  try {
    return normalizeHost(new URL(value).hostname);
  } catch {
    // A bare host in a tag or an origin field is still a host.
    const bare = normalizeHost(value);
    return /^[a-z0-9.*-]+$/.test(bare) && bare.includes(".") ? bare : null;
  }
}

/* -------------------------------------------------------------------------- */
/* Auth placement                                                              */
/* -------------------------------------------------------------------------- */

/** Where the credential goes on the wire. */
export type AuthPlacement =
  | { kind: "header"; header: string; prefix: string }
  | { kind: "query"; parameter: string }
  | { kind: "basic" }
  | { kind: "cookie" };

/**
 * How this credential is presented, from the descriptor unless the record says
 * otherwise. `auth:` tags are the override, for the many credentials whose
 * purpose is not a model provider: `auth:bearer`, `auth:header:X-Token`,
 * `auth:prefix:Token `, `auth:query:key`, `auth:basic`.
 *
 * Null means "the vault does not know where this goes", and the request is
 * refused. Guessing is the wrong direction: a key put in the wrong header is a
 * credential sent somewhere it was never meant to appear.
 */
export function authPlacementFor(record: SecretRecord): AuthPlacement | null {
  const tags = record.tags
    .filter((tag) => tag.startsWith(AUTH_TAG))
    .map((tag) => tag.slice(AUTH_TAG.length));
  const prefixTag = tags.find((tag) => tag.startsWith("prefix:"));
  const prefix = prefixTag ? prefixTag.slice("prefix:".length) : null;
  for (const tag of tags) {
    if (tag === "bearer")
      return { kind: "header", header: "Authorization", prefix: prefix ?? "Bearer " };
    if (tag === "basic") return { kind: "basic" };
    if (tag === "cookie") return { kind: "cookie" };
    if (tag.startsWith("header:")) {
      const header = tag.slice("header:".length).trim();
      if (header) return { kind: "header", header, prefix: prefix ?? "" };
    }
    if (tag.startsWith("query:")) {
      const parameter = tag.slice("query:".length).trim();
      if (parameter) return { kind: "query", parameter };
    }
  }

  const descriptor = findProviderDescriptor(providerIdForPurpose(record.purpose));
  const descriptorAuth =
    descriptor && descriptor.auth?.method === "api_key" ? descriptor.auth : null;

  if (record.material.type === "api_key") {
    const header = record.material.header ?? descriptorAuth?.header ?? null;
    if (!header) return null;
    const descriptorPrefix =
      descriptorAuth && descriptorAuth.header.toLowerCase() === header.toLowerCase()
        ? descriptorAuth.prefix
        : null;
    return {
      kind: "header",
      header,
      prefix:
        prefix ?? descriptorPrefix ?? (header.toLowerCase() === "authorization" ? "Bearer " : ""),
    };
  }
  // RFC 6750: an OAuth access token is a bearer token. That is not a guess.
  if (record.material.type === "oauth_token")
    return { kind: "header", header: "Authorization", prefix: "Bearer " };
  if (record.material.type === "cookie_jar") return { kind: "cookie" };
  if (record.material.type === "password") return { kind: "basic" };
  return null;
}

/* -------------------------------------------------------------------------- */
/* Redaction                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every form the material could plausibly take in something coming back: the
 * value itself, its percent-encoding, its base64, and the base64 of
 * `user:password` for basic auth. Short values are dropped — scrubbing a
 * three-character token out of a response would destroy the response and
 * disclose nothing.
 */
function redactionTokens(record: SecretRecord): string[] {
  const plain: string[] = [];
  const material = record.material;
  switch (material.type) {
    case "api_key":
      plain.push(material.apiKey.reveal());
      break;
    case "oauth_token":
      plain.push(material.accessToken.reveal());
      if (material.refreshToken) plain.push(material.refreshToken.reveal());
      break;
    case "password":
      plain.push(material.password.reveal());
      plain.push(
        Buffer.from(`${material.username}:${material.password.reveal()}`, "utf8").toString(
          "base64",
        ),
      );
      break;
    case "cookie_jar":
      plain.push(material.jar.reveal());
      break;
    case "totp_seed":
      plain.push(material.parameters.secret.reveal());
      break;
    case "passkey":
      plain.push(material.privateKey.reveal());
      break;
    case "ssh_key":
      plain.push(material.privateKey.reveal());
      if (material.passphrase) plain.push(material.passphrase.reveal());
      break;
    case "recovery_codes":
      for (const code of material.codes) plain.push(code.reveal());
      break;
    case "generic_note":
      plain.push(material.note.reveal());
      break;
  }
  const tokens = new Set<string>();
  for (const value of plain) {
    if (value.length < 4) continue;
    tokens.add(value);
    tokens.add(encodeURIComponent(value));
    tokens.add(Buffer.from(value, "utf8").toString("base64"));
  }
  // Longest first, so a token that contains another is replaced whole.
  return [...tokens]
    .filter((token) => token.length >= 4)
    .sort((left, right) => right.length - left.length);
}

function redact(value: string, tokens: readonly string[]): string {
  let out = value;
  for (const token of tokens) {
    if (out.includes(token)) out = out.split(token).join(REDACTED);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Toolset                                                                     */
/* -------------------------------------------------------------------------- */

export interface VaultToolLimits {
  /** Calls per purpose inside `windowMs` before refusal. */
  maxCallsPerWindow?: number;
  windowMs?: number;
}

export interface VaultToolsetOptions {
  vault: VaultStore;
  identity: AgentIdentity;
  audit?: AuditSink;
  /** Present when `describeCredential` should report health. */
  supervisor?: ReauthSupervisor;
  transport?: VaultTransport;
  /** Absent means `runAuthenticatedProcess` and the git helpers are unavailable. */
  runProcess?: ProcessRunner;
  now?: () => number;
  limits?: VaultToolLimits;
}

interface UsageState {
  calls: number;
  denials: number;
  window: number[];
  lastAt: number | null;
}

/**
 * The object handed to an agent.
 *
 * It holds a `VaultStore` rather than a `PrivilegedVaultCustodian` on purpose:
 * nothing here is built on the retrieval API, so the day that API is deleted
 * outright this module does not change. Scope checking, auditing and rate
 * limiting are done here because `VaultStore` has no idea who is calling, and
 * one place to make an authorization decision is the only number that works.
 */
export class VaultToolset {
  readonly #vault: VaultStore;
  readonly #identity: AgentIdentity;
  readonly #audit: AuditSink | null;
  readonly #supervisor: ReauthSupervisor | null;
  readonly #transport: VaultTransport | null;
  readonly #runProcess: ProcessRunner | null;
  readonly #now: () => number;
  readonly #maxCallsPerWindow: number;
  readonly #windowMs: number;
  readonly #usage = new Map<string, UsageState>();

  constructor(options: VaultToolsetOptions) {
    this.#vault = options.vault;
    this.#identity = { workspace: options.identity.workspace, agent: options.identity.agent };
    this.#audit = options.audit ?? null;
    this.#supervisor = options.supervisor ?? null;
    this.#transport = options.transport ?? null;
    this.#runProcess = options.runProcess ?? null;
    this.#now = options.now ?? (() => Date.now());
    this.#maxCallsPerWindow = options.limits?.maxCallsPerWindow ?? 60;
    this.#windowMs = options.limits?.windowMs ?? 60_000;
  }

  get identity(): AgentIdentity {
    return { ...this.#identity };
  }

  /** Per-purpose call counts, so a runaway agent is visible to the owner. */
  usage(): MaterialFree<readonly VaultToolUsage[]> {
    return [...this.#usage.entries()].map(([purpose, state]) => ({
      purpose,
      calls: state.calls,
      denials: state.denials,
      inWindow: state.window.filter((at) => at > this.#now() - this.#windowMs).length,
      lastAt: state.lastAt === null ? null : new Date(state.lastAt).toISOString(),
    }));
  }

  /* ---------------------------------------------------------------------- */

  /**
   * Perform an authenticated HTTP request. The agent chooses the method, URL,
   * headers and body; the vault chooses the credential, where it goes, and
   * whether the destination is allowed to see it.
   */
  async authenticatedFetch(
    purpose: string,
    request: AuthenticatedFetchRequest,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedFetchOk>>> {
    const gate = await this.#begin("authenticated_fetch", purpose);
    if (!gate.ok) return gate.denial;

    if (!this.#transport) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        null,
        null,
        "capability_unavailable",
        "no transport is configured for this agent",
      );
    }

    const found = await this.#credentialFor(purpose, request.credentialId, [
      "oauth_token",
      "api_key",
      "cookie_jar",
      "password",
    ]);
    if (!found.ok) return this.#denyFound("authenticated_fetch", purpose, null, found);
    const record = found.record;

    const placement = authPlacementFor(record);
    if (!placement) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        null,
        "auth_placement_unknown",
        `the vault does not know how ${record.type} material for ${purpose} is presented; tag the record with auth:bearer, auth:header:<name>, auth:query:<name>, or auth:basic`,
      );
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        null,
        "malformed_url",
        "the request url is not a url",
      );
    }
    if (url.username || url.password) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "url_credentials",
        "the request url carries userinfo credentials",
      );
    }
    const insecure =
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && LOOPBACK.has(url.hostname.toLowerCase()));
    if (insecure) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "insecure_scheme",
        `credentials are only presented over https, not ${url.protocol.replace(":", "")}`,
      );
    }

    const allowed = allowedHostsFor(record);
    if (allowed.length === 0) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "no_allowed_hosts",
        `no host is allow-listed for ${purpose}; add a host: tag to the record`,
      );
    }
    if (!hostAllowed(allowed, url.hostname)) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "host_not_allowed",
        `${url.hostname} is not an allowed host for ${purpose}`,
      );
    }

    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(request.headers ?? {})) {
      const lower = name.trim().toLowerCase();
      if (
        FORBIDDEN_REQUEST_HEADERS.has(lower) ||
        (placement.kind === "header" && lower === placement.header.toLowerCase())
      ) {
        return this.#deny(
          "authenticated_fetch",
          purpose,
          record,
          url.hostname,
          "agent_supplied_auth",
          `an agent may not set the ${lower} header; the vault attaches authentication itself`,
        );
      }
      if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name.trim())) {
        return this.#deny(
          "authenticated_fetch",
          purpose,
          record,
          url.hostname,
          "invalid_argument",
          `malformed header name: ${name.trim()}`,
        );
      }
      headers[name.trim()] = value;
    }
    for (const parameter of url.searchParams.keys()) {
      const lower = parameter.toLowerCase();
      if (
        FORBIDDEN_QUERY_PARAMETERS.has(lower) ||
        (placement.kind === "query" && lower === placement.parameter.toLowerCase())
      ) {
        return this.#deny(
          "authenticated_fetch",
          purpose,
          record,
          url.hostname,
          "agent_supplied_auth",
          `an agent may not set the ${lower} query parameter; the vault attaches authentication itself`,
        );
      }
    }

    const method = (request.method ?? "GET").trim().toUpperCase();
    if (!METHODS.has(method)) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "method_not_allowed",
        `unsupported method: ${method}`,
      );
    }
    const body = request.body ?? null;
    if (body !== null && !BODY_METHODS.has(method)) {
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "body_not_allowed",
        `${method} does not carry a body`,
      );
    }

    applyAuth(placement, record, url, headers);

    const tokens = redactionTokens(record);
    let response: VaultTransportResponse;
    try {
      response = await this.#transport({ method, url: url.toString(), headers, body });
    } catch (error) {
      // The thrown value may have been built from the request, headers and all.
      return this.#deny(
        "authenticated_fetch",
        purpose,
        record,
        url.hostname,
        "transport_failure",
        redact(error instanceof Error ? error.message : String(error), tokens),
      );
    }

    const responseHeaders: Record<string, string> = {};
    for (const [name, value] of Object.entries(response.headers ?? {})) {
      if (STRIPPED_RESPONSE_HEADERS.has(name.toLowerCase())) continue;
      responseHeaders[name] = redact(value, tokens);
    }
    const location = response.headers
      ? (Object.entries(response.headers).find(
          ([name]) => name.toLowerCase() === "location",
        )?.[1] ?? null)
      : null;
    const redirected = response.status >= 300 && response.status < 400 ? location : null;

    await this.#log(
      "authenticated_fetch",
      record,
      url.hostname,
      `granted: http ${response.status}`,
      purpose,
    );
    return {
      ok: true,
      status: response.status,
      statusText: response.statusText ?? "",
      headers: responseHeaders,
      body: redact(response.body ?? "", tokens),
      host: url.hostname.toLowerCase(),
      redirectedTo: redirected === null ? null : redact(redirected, tokens),
      credential: await this.#summarize(record),
    };
  }

  /* ---------------------------------------------------------------------- */

  /**
   * A live TOTP code. This is the whole argument for capability tools in one
   * call: the agent gets something that authenticates once and expires in
   * seconds, instead of a seed that authenticates forever.
   */
  async currentTotpCode(
    purpose: string,
    credentialId?: string,
  ): Promise<MaterialFree<VaultToolResult<TotpCodeOk>>> {
    const gate = await this.#begin("totp_code", purpose);
    if (!gate.ok) return gate.denial;

    const found = await this.#credentialFor(purpose, credentialId, ["totp_seed"]);
    if (!found.ok) return this.#denyFound("totp_code", purpose, null, found);
    const record = found.record;
    if (record.material.type !== "totp_seed") {
      return this.#deny(
        "totp_code",
        purpose,
        record,
        null,
        "wrong_credential_type",
        `${record.id} is a ${record.type}`,
      );
    }

    const nowMs = this.#now();
    const generated = generateTotp(record.material.parameters, nowMs);
    // The code is a bearer credential for its window, so it is not logged either.
    await this.#log(
      "totp_code",
      record,
      null,
      `granted: valid for ${Math.max(0, generated.remainingMs)}ms`,
      purpose,
    );
    return {
      ok: true,
      code: generated.code,
      digits: record.material.parameters.digits,
      validUntil: new Date(generated.validUntilMs).toISOString(),
      remainingMs: generated.remainingMs,
      credentialId: record.id,
      purpose: record.purpose,
    };
  }

  /* ---------------------------------------------------------------------- */

  /**
   * Run a child process with the credential in its environment.
   *
   * The child's environment is *built*, not inherited: the parent's own
   * variables — which on an agent host include other people's tokens — do not
   * cross into a process the agent named. The environment is never returned,
   * never logged, and scrubbed out of anything the child printed.
   *
   * Arbitrary execution needs an explicit grant, so the record must carry an
   * `exec:<command>` tag. Scope alone is not enough authority to run code.
   */
  async runAuthenticatedProcess(
    purpose: string,
    request: AuthenticatedProcessRequest,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedProcessOk>>> {
    const gate = await this.#begin("authenticated_process", purpose);
    if (!gate.ok) return gate.denial;
    if (!this.#runProcess) {
      return this.#deny(
        "authenticated_process",
        purpose,
        null,
        null,
        "capability_unavailable",
        "no process runner is configured for this agent",
      );
    }

    const found = await this.#credentialFor(purpose, request.credentialId, [
      "api_key",
      "oauth_token",
      "password",
      "generic_note",
    ]);
    if (!found.ok) return this.#denyFound("authenticated_process", purpose, null, found);
    const record = found.record;

    const command = request.command.trim();
    if (!command) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        null,
        "invalid_argument",
        "no command given",
      );
    }
    if (!record.tags.includes(`${EXEC_TAG}${command}`)) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        null,
        "command_not_permitted",
        `${purpose} does not permit running ${command}; add an exec:${command} tag to the record`,
      );
    }

    const credentialEnv = (request.credentialEnv ?? GIT_SECRET_ENV).trim();
    if (!ENV_NAME.test(credentialEnv)) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        null,
        "invalid_argument",
        `malformed environment variable name: ${credentialEnv}`,
      );
    }
    const secret = credentialSecret(record);
    if (!secret) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        null,
        "wrong_credential_type",
        `${record.type} material cannot be injected into a process`,
      );
    }
    for (const name of Object.keys(request.env ?? {})) {
      if (name === credentialEnv) {
        return this.#deny(
          "authenticated_process",
          purpose,
          record,
          null,
          "agent_supplied_auth",
          `an agent may not set ${credentialEnv}; the vault fills it`,
        );
      }
    }

    return this.#spawn(
      "authenticated_process",
      purpose,
      record,
      {
        command,
        args: request.args ?? [],
        cwd: request.cwd ?? null,
        env: { ...(request.env ?? {}), [credentialEnv]: secret.reveal() },
      },
      null,
    );
  }

  /** Push to an allow-listed https remote with the credential supplied by helper. */
  async gitPush(
    purpose: string,
    request: GitRequest,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedProcessOk>>> {
    return this.#git(purpose, "push", request);
  }

  /** Fetch from an allow-listed https remote with the credential supplied by helper. */
  async gitFetch(
    purpose: string,
    request: GitRequest,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedProcessOk>>> {
    return this.#git(purpose, "fetch", request);
  }

  /* ---------------------------------------------------------------------- */

  /** Sign a payload with a stored key. The signature comes back; the key does not. */
  async signWith(
    purpose: string,
    request: SignRequest,
  ): Promise<MaterialFree<VaultToolResult<SignOk>>> {
    const gate = await this.#begin("sign", purpose);
    if (!gate.ok) return gate.denial;

    const found = await this.#credentialFor(purpose, request.credentialId, ["ssh_key", "passkey"]);
    if (!found.ok) return this.#denyFound("sign", purpose, null, found);
    const record = found.record;

    if (typeof request.payload !== "string" || request.payload.length === 0) {
      return this.#deny("sign", purpose, record, null, "invalid_argument", "a payload is required");
    }
    const payload = Buffer.from(request.payload, request.encoding === "base64" ? "base64" : "utf8");
    if (payload.byteLength === 0) {
      return this.#deny(
        "sign",
        purpose,
        record,
        null,
        "invalid_argument",
        "the payload decoded to no bytes",
      );
    }

    let key: KeyObject;
    let published: string;
    let fingerprint: string | null;
    if (record.material.type === "ssh_key") {
      const passphrase = record.material.passphrase;
      try {
        key = createPrivateKey(
          passphrase
            ? { key: record.material.privateKey.reveal(), passphrase: passphrase.reveal() }
            : record.material.privateKey.reveal(),
        );
      } catch {
        // The thrown message can quote the key body, so it does not travel.
        return this.#deny(
          "sign",
          purpose,
          record,
          null,
          "invalid_argument",
          `the private key in ${record.id} cannot be loaded`,
        );
      }
      published = record.material.publicKey;
      fingerprint = record.material.fingerprint;
    } else if (record.material.type === "passkey") {
      if (record.material.userVerificationRequired) {
        return this.#deny(
          "sign",
          purpose,
          record,
          null,
          "human_presence_required",
          `${record.material.relyingPartyId} requires user verification, which is a gesture no automation produces`,
        );
      }
      try {
        key = createPrivateKey(privateKeyInput(record.material.privateKey.reveal()));
        // Derived from the private half rather than stored beside it, so the
        // two cannot disagree — the same rule `discovery/identity.ts` follows.
        const pem = key.export({ type: "pkcs8", format: "pem" }) as string;
        published = (
          createPublicKey(pem).export({ type: "spki", format: "der" }) as Buffer
        ).toString("base64");
      } catch {
        return this.#deny(
          "sign",
          purpose,
          record,
          null,
          "invalid_argument",
          `the private key in ${record.id} cannot be loaded`,
        );
      }
      fingerprint = record.material.credentialId;
    } else {
      return this.#deny(
        "sign",
        purpose,
        record,
        null,
        "wrong_credential_type",
        `${record.id} is a ${record.type}`,
      );
    }

    const algorithm = key.asymmetricKeyType ?? "unknown";
    let signature: Buffer;
    try {
      signature = cryptoSign(
        algorithm === "ed25519" || algorithm === "ed448" ? null : "sha256",
        payload,
        key,
      );
    } catch {
      return this.#deny(
        "sign",
        purpose,
        record,
        null,
        "invalid_argument",
        `${algorithm} signing failed for ${record.id}`,
      );
    }

    await this.#log(
      "sign",
      record,
      null,
      `granted: ${algorithm} over ${payload.byteLength} bytes`,
      purpose,
    );
    return {
      ok: true,
      signature: signature.toString("base64url"),
      algorithm,
      publicKey: published,
      keyFingerprint: fingerprint,
      credentialId: record.id,
    };
  }

  /* ---------------------------------------------------------------------- */

  /** What the agent is allowed to know about a purpose. Metadata, never material. */
  async describeCredential(
    purpose: string,
  ): Promise<MaterialFree<VaultToolResult<DescribeCredentialOk>>> {
    const gate = await this.#begin("describe_credential", purpose);
    if (!gate.ok) return gate.denial;

    const records = await this.#inScope(purpose);
    if (records.length === 0) {
      return this.#deny(
        "describe_credential",
        purpose,
        null,
        null,
        "out_of_scope",
        `no credential for ${purpose} is available to this agent`,
      );
    }
    const credentials: CredentialSummary[] = [];
    for (const record of records) credentials.push(await this.#summarize(record));
    await this.#log(
      "describe_credential",
      records[0] ?? null,
      null,
      `granted: ${credentials.length} credentials`,
      purpose,
    );
    return { ok: true, purpose, credentials };
  }

  /* ---------------------------------------------------------------------- */
  /* Internals                                                               */
  /* ---------------------------------------------------------------------- */

  async #git(
    purpose: string,
    subcommand: "push" | "fetch",
    request: GitRequest,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedProcessOk>>> {
    const gate = await this.#begin("authenticated_process", purpose);
    if (!gate.ok) return gate.denial;
    if (!this.#runProcess) {
      return this.#deny(
        "authenticated_process",
        purpose,
        null,
        null,
        "capability_unavailable",
        "no process runner is configured for this agent",
      );
    }

    const found = await this.#credentialFor(purpose, request.credentialId, [
      "api_key",
      "oauth_token",
      "password",
    ]);
    if (!found.ok) return this.#denyFound("authenticated_process", purpose, null, found);
    const record = found.record;

    let remote: URL;
    try {
      remote = new URL(request.remote);
    } catch {
      // A bare remote name resolves inside the repository, where the vault
      // cannot see which host the credential would be handed to.
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        null,
        "malformed_url",
        "the remote must be an absolute https url so its host can be checked",
      );
    }
    if (remote.protocol !== "https:") {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        remote.hostname,
        "insecure_scheme",
        `git credentials are only presented over https, not ${remote.protocol.replace(":", "")}`,
      );
    }
    if (remote.username || remote.password) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        remote.hostname,
        "url_credentials",
        "the remote url carries userinfo credentials",
      );
    }
    const allowed = allowedHostsFor(record);
    if (allowed.length === 0) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        remote.hostname,
        "no_allowed_hosts",
        `no host is allow-listed for ${purpose}; add a host: tag to the record`,
      );
    }
    if (!hostAllowed(allowed, remote.hostname)) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        remote.hostname,
        "host_not_allowed",
        `${remote.hostname} is not an allowed host for ${purpose}`,
      );
    }

    const secret = credentialSecret(record);
    if (!secret) {
      return this.#deny(
        "authenticated_process",
        purpose,
        record,
        remote.hostname,
        "wrong_credential_type",
        `${record.type} material cannot authenticate git`,
      );
    }
    const username =
      record.material.type === "password" ? record.material.username : "x-access-token";

    // The helper reads the secret out of the child's environment. It is not on
    // the command line, so it is not in `ps`, not in a shell history, and not in
    // the process table of a machine the agent may also be able to read.
    const helper = `!f() { test "$1" = get && printf 'username=%s\\npassword=%s\\n' "$${GIT_USER_ENV}" "$${GIT_SECRET_ENV}"; }; f`;
    const args = [
      "-c",
      `credential.helper=${helper}`,
      "-c",
      "credential.useHttpPath=true",
      subcommand,
      remote.toString(),
      ...(request.refspec ? [request.refspec] : []),
    ];

    return this.#spawn(
      "authenticated_process",
      purpose,
      record,
      {
        command: "git",
        args,
        cwd: request.cwd ?? null,
        env: {
          [GIT_USER_ENV]: username,
          [GIT_SECRET_ENV]: secret.reveal(),
          // No terminal, no askpass helper: if the stored credential is refused,
          // git must fail rather than stop and wait for a human who is not there.
          GIT_TERMINAL_PROMPT: "0",
        },
      },
      remote.hostname,
    );
  }

  async #spawn(
    operation: VaultToolOperation,
    purpose: string,
    record: SecretRecord,
    spec: {
      command: string;
      args: readonly string[];
      cwd: string | null;
      env: Record<string, string>;
    },
    targetHost: string | null,
  ): Promise<MaterialFree<VaultToolResult<AuthenticatedProcessOk>>> {
    const runner = this.#runProcess;
    if (!runner) {
      return this.#deny(
        operation,
        purpose,
        record,
        targetHost,
        "capability_unavailable",
        "no process runner is configured for this agent",
      );
    }
    const tokens = redactionTokens(record);
    // PATH is the only inherited variable: without it a command name cannot be
    // resolved, and with the rest of the parent environment the child would
    // inherit every other secret this process holds.
    const env: Record<string, string> = { PATH: process.env.PATH ?? "", ...spec.env };
    let outcome: ProcessOutcome;
    try {
      outcome = await runner({ command: spec.command, args: [...spec.args], cwd: spec.cwd, env });
    } catch (error) {
      // Spawn errors habitually quote the whole spawn descriptor, environment
      // included, so nothing from this message survives unscrubbed.
      return this.#deny(
        operation,
        purpose,
        record,
        targetHost,
        "transport_failure",
        redact(error instanceof Error ? error.message : String(error), tokens),
      );
    }
    await this.#log(
      operation,
      record,
      targetHost,
      `granted: ${spec.command} exited ${outcome.exitCode}`,
      purpose,
    );
    return {
      ok: true,
      exitCode: outcome.exitCode,
      stdout: redact(outcome.stdout, tokens),
      stderr: redact(outcome.stderr, tokens),
      command: spec.command,
      credentialId: record.id,
    };
  }

  /** Rate limit and count. Runs before any record is even looked up. */
  async #begin(
    operation: VaultToolOperation,
    purpose: string,
  ): Promise<{ ok: true } | { ok: false; denial: VaultToolDenial }> {
    const state = this.#usageFor(purpose);
    const nowMs = this.#now();
    state.calls += 1;
    state.lastAt = nowMs;
    state.window = state.window.filter((at) => at > nowMs - this.#windowMs);
    state.window.push(nowMs);
    if (state.window.length > this.#maxCallsPerWindow) {
      const denial = await this.#deny(
        operation,
        purpose,
        null,
        null,
        "rate_limited",
        `${purpose} has been used ${state.window.length} times in the last ${this.#windowMs}ms`,
      );
      return { ok: false, denial };
    }
    return { ok: true };
  }

  #usageFor(purpose: string): UsageState {
    const existing = this.#usage.get(purpose);
    if (existing) return existing;
    const created: UsageState = { calls: 0, denials: 0, window: [], lastAt: null };
    this.#usage.set(purpose, created);
    return created;
  }

  /** Records for this purpose that this agent may act with. Nothing else exists. */
  async #inScope(purpose: string): Promise<SecretRecord[]> {
    const records: SecretRecord[] = [];
    for (const id of await this.#vault.list()) {
      const record = await this.#vault.get(id);
      if (!record || record.purpose !== purpose) continue;
      if (!scopeAllows(record.scope, this.#identity)) continue;
      records.push(record);
    }
    return records;
  }

  async #credentialFor(
    purpose: string,
    credentialId: string | undefined,
    preference: readonly SecretType[],
  ): Promise<
    | { ok: true; record: SecretRecord }
    | { ok: false; reason: VaultDenialReason; audit: string; agentDetail: string }
  > {
    const inScope = await this.#inScope(purpose);
    if (credentialId) {
      const exact = inScope.find((record) => record.id === credentialId);
      if (!exact) {
        // Whether the id is unknown, another purpose's, or simply not this
        // agent's is one answer to the agent and three in the audit trail.
        const existsAnywhere = (await this.#vault.list()).includes(credentialId);
        return {
          ok: false,
          reason: "out_of_scope",
          audit: existsAnywhere
            ? "record exists but is not usable by this agent for this purpose"
            : "no such record",
          agentDetail: `no credential for ${purpose} is available to this agent`,
        };
      }
      if (!preference.includes(exact.type)) {
        return {
          ok: false,
          reason: "wrong_credential_type",
          audit: `wrong type: ${exact.type}`,
          agentDetail: `${exact.id} is a ${exact.type}`,
        };
      }
      return { ok: true, record: exact };
    }
    for (const type of preference) {
      const match = inScope.find((record) => record.type === type);
      if (match) return { ok: true, record: match };
    }
    return {
      ok: false,
      reason: "out_of_scope",
      audit:
        inScope.length === 0
          ? "no record in scope for this purpose"
          : `in scope but no ${preference.join("/")} credential`,
      agentDetail: `no credential for ${purpose} is available to this agent`,
    };
  }

  async #denyFound(
    operation: VaultToolOperation,
    purpose: string,
    targetHost: string | null,
    found: { ok: false; reason: VaultDenialReason; audit: string; agentDetail: string },
  ): Promise<VaultToolDenial> {
    await this.#log(
      operation,
      null,
      targetHost,
      `denied: ${found.reason} (${found.audit})`,
      purpose,
    );
    this.#usageFor(purpose).denials += 1;
    return { ok: false, denial: found.reason, detail: found.agentDetail };
  }

  async #deny(
    operation: VaultToolOperation,
    purpose: string,
    record: SecretRecord | null,
    targetHost: string | null,
    reason: VaultDenialReason,
    detail: string,
  ): Promise<VaultToolDenial> {
    await this.#log(operation, record, targetHost, `denied: ${reason} (${detail})`, purpose);
    this.#usageFor(purpose).denials += 1;
    return { ok: false, denial: reason, detail };
  }

  async #summarize(record: SecretRecord): Promise<CredentialSummary> {
    const descriptor = descriptorOf(record);
    const provider = findProviderDescriptor(providerIdForPurpose(record.purpose));
    let health: CredentialHealthSummary | null = null;
    if (this.#supervisor) {
      const entry = (await this.#supervisor.health()).find(
        (candidate) => candidate.id === record.id,
      );
      if (entry) {
        health = {
          state: entry.state,
          strategy: entry.strategy,
          selfHealing: entry.selfHealing,
          humanPresenceRequired: entry.humanPresenceRequired,
          nextRefreshAt: entry.nextRefreshAt,
          attempts: entry.attempts,
        };
      }
    }
    return {
      id: descriptor.id,
      type: descriptor.type,
      purpose: descriptor.purpose,
      label: descriptor.label,
      provider: provider ? provider.id : null,
      account: accountOf(record),
      expiresAt: descriptor.expiresAt,
      updatedAt: descriptor.updatedAt,
      allowedHosts: allowedHostsFor(record),
      tags: descriptor.tags,
      health,
    };
  }

  async #log(
    operation: VaultToolOperation,
    record: SecretRecord | null,
    targetHost: string | null,
    outcome: string,
    purpose: string,
  ): Promise<void> {
    if (!this.#audit) return;
    await this.#audit.record({
      at: new Date(this.#now()).toISOString(),
      actor: { ...this.#identity },
      action: auditActionFor(operation),
      recordId: record ? record.id : null,
      purpose: record ? record.purpose : purpose,
      auditRef: record ? record.auditRef : null,
      outcome,
      targetHost,
      use: this.#usageFor(purpose).calls,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function auditActionFor(
  operation: VaultToolOperation,
): "tool_fetch" | "tool_totp" | "tool_process" | "tool_sign" | "tool_describe" {
  switch (operation) {
    case "authenticated_fetch":
      return "tool_fetch";
    case "totp_code":
      return "tool_totp";
    case "authenticated_process":
      return "tool_process";
    case "sign":
      return "tool_sign";
    case "describe_credential":
      return "tool_describe";
  }
}

/** The single string that authenticates this record, or null when there is none. */
function credentialSecret(record: SecretRecord): SecretValue | null {
  switch (record.material.type) {
    case "api_key":
      return record.material.apiKey;
    case "oauth_token":
      return record.material.accessToken;
    case "password":
      return record.material.password;
    case "cookie_jar":
      return record.material.jar;
    case "generic_note":
      return record.material.note;
    default:
      return null;
  }
}

function accountOf(record: SecretRecord): string | null {
  const tag = record.tags.find((entry) => entry.startsWith(ACCOUNT_TAG));
  if (tag) return tag.slice(ACCOUNT_TAG.length) || null;
  switch (record.material.type) {
    case "password":
      return record.material.username;
    case "totp_seed":
      return record.material.parameters.account;
    case "passkey":
      return record.material.userName;
    default:
      return null;
  }
}

/**
 * Put the credential on the request. The only function in this module that
 * moves material, and it writes into structures that never come back to the
 * agent: the transport's header map and the transport's URL.
 */
function applyAuth(
  placement: AuthPlacement,
  record: SecretRecord,
  url: URL,
  headers: Record<string, string>,
): void {
  const secret = credentialSecret(record);
  if (!secret) return;
  switch (placement.kind) {
    case "header":
      headers[placement.header] = `${placement.prefix}${secret.reveal()}`;
      return;
    case "query":
      url.searchParams.set(placement.parameter, secret.reveal());
      return;
    case "basic": {
      const username = record.material.type === "password" ? record.material.username : "";
      headers.Authorization = `Basic ${Buffer.from(`${username}:${secret.reveal()}`, "utf8").toString("base64")}`;
      return;
    }
    case "cookie":
      headers.Cookie = secret.reveal();
      return;
  }
}

/** PEM as-is; anything else is treated as base64 PKCS#8 DER. */
function privateKeyInput(value: string): string | { key: Buffer; format: "der"; type: "pkcs8" } {
  if (value.includes("-----BEGIN")) return value;
  return { key: Buffer.from(value, "base64"), format: "der", type: "pkcs8" };
}

/* -------------------------------------------------------------------------- */
/* Default seams                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Egress over the platform `fetch`, with redirects deliberately not followed.
 *
 * Following a redirect is how an allow-listed host hands a credential to one
 * that is not: the runtime would re-send the `Authorization` header to whatever
 * `Location` said. The agent gets the location back instead and may re-issue,
 * which costs it another allow-list check.
 */
export function defaultVaultTransport(): VaultTransport {
  return async (request) => {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      ...(request.body ? { body: request.body } : {}),
      redirect: "manual",
    });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body: await response.text(),
    };
  };
}

/**
 * Child processes over `node:child_process`, with the environment taken exactly
 * as given. `shell` is never enabled: the arguments are passed as an array so
 * nothing an agent supplies can become shell syntax.
 */
export function nodeProcessRunner(options: { maxOutputBytes?: number } = {}): ProcessRunner {
  const limit = options.maxOutputBytes ?? 1_000_000;
  return async (spec) =>
    new Promise<ProcessOutcome>((resolve, reject) => {
      const child = spawn(spec.command, [...spec.args], {
        cwd: spec.cwd ?? undefined,
        env: spec.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < limit) stdout += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < limit) stderr += chunk.toString("utf8");
      });
      // The error is rebuilt rather than forwarded: a spawn failure from Node
      // carries the whole spawn descriptor, and the descriptor holds the
      // credential this runner was given.
      child.on("error", () => reject(new Error(`could not run ${spec.command}`)));
      child.on("close", (code) => resolve({ exitCode: code ?? -1, stdout, stderr }));
    });
}
