import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'node:crypto';

export const VAULT_VERSION = 1;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const AUTH_TAG_BYTES = 16;
const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export type CredentialKind =
  | 'api-key'
  | 'password'
  | 'totp'
  | 'oauth'
  | 'ssh-key'
  | 'certificate'
  | 'recovery-codes'
  | 'passkey'
  | 'secret';

export interface ApiKeySecret {
  readonly kind: 'api-key';
  readonly value: string;
  readonly label?: string;
}

export interface PasswordSecret {
  readonly kind: 'password';
  readonly username?: string;
  readonly password: string;
}

export interface TotpSecret {
  readonly kind: 'totp';
  readonly secret: string;
  readonly algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  readonly digits?: 6 | 7 | 8;
  readonly period?: number;
  readonly issuer?: string;
  readonly account?: string;
}

export interface OAuthSecret {
  readonly kind: 'oauth';
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly tokenType?: string;
  readonly expiresAt?: number;
  readonly scope?: string;
}

export interface SshKeySecret {
  readonly kind: 'ssh-key';
  readonly privateKey: string;
  readonly publicKey?: string;
  readonly passphrase?: string;
  readonly username?: string;
  readonly host?: string;
}

export interface CertificateSecret {
  readonly kind: 'certificate';
  readonly certificate: string;
  readonly privateKey?: string;
  readonly chain?: readonly string[];
}

export interface RecoveryCodesSecret {
  readonly kind: 'recovery-codes';
  readonly codes: readonly string[];
}

export interface PasskeySecret {
  readonly kind: 'passkey';
  readonly credentialId: string;
  readonly publicKey: string;
  readonly rpId: string;
  readonly signCount: number;
  readonly userHandle?: string;
  readonly transports?: readonly ('usb' | 'nfc' | 'ble' | 'internal' | 'hybrid')[];
}

export interface GenericSecret {
  readonly kind: 'secret';
  readonly value: string;
}

export type CredentialSecret =
  | ApiKeySecret
  | PasswordSecret
  | TotpSecret
  | OAuthSecret
  | SshKeySecret
  | CertificateSecret
  | RecoveryCodesSecret
  | PasskeySecret
  | GenericSecret;

export interface VaultEnvelope {
  readonly version: typeof VAULT_VERSION;
  readonly salt: string;
  readonly nonce: string;
  readonly authTag: string;
  readonly ciphertext: string;
}

export class VaultLockedError extends Error {
  constructor() {
    super('Credential vault is locked');
    this.name = 'VaultLockedError';
  }
}

export function deriveVaultKey(passphrase: string, salt: Buffer): Buffer {
  if (passphrase.length === 0) throw new Error('Vault passphrase must not be empty');
  return scryptSync(passphrase, salt, KEY_BYTES, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 128 * SCRYPT_N * SCRYPT_R + 1024 * 1024,
  });
}

export function encryptSecret(secret: CredentialSecret, passphrase: string, associatedData?: string): VaultEnvelope {
  const salt = randomBytes(SALT_BYTES);
  const key = deriveVaultKey(passphrase, salt);
  try {
    return encryptWithKey(secret, key, salt, associatedData);
  } finally {
    key.fill(0);
  }
}

export function decryptSecret<T extends CredentialSecret = CredentialSecret>(
  envelope: VaultEnvelope,
  passphrase: string,
  associatedData?: string,
): T {
  assertEnvelope(envelope);
  const salt = Buffer.from(envelope.salt, 'base64url');
  const key = deriveVaultKey(passphrase, salt);
  try {
    return decryptWithKey<T>(envelope, key, associatedData);
  } finally {
    key.fill(0);
  }
}

export class UnlockedVault {
  private readonly key: Buffer;

  private constructor(key: Buffer) {
    this.key = key;
  }

  static unlock(passphrase: string, salt: Buffer): UnlockedVault {
    return new UnlockedVault(deriveVaultKey(passphrase, salt));
  }

  encrypt(secret: CredentialSecret, associatedData?: string): VaultEnvelope {
    const salt = randomBytes(SALT_BYTES);
    return encryptWithKey(secret, this.key, salt, associatedData);
  }

  decrypt<T extends CredentialSecret = CredentialSecret>(envelope: VaultEnvelope, associatedData?: string): T {
    assertEnvelope(envelope);
    return decryptWithKey<T>(envelope, this.key, associatedData);
  }

  lock(): void {
    this.key.fill(0);
  }
}

function encryptWithKey(secret: CredentialSecret, key: Buffer, salt: Buffer, associatedData?: string): VaultEnvelope {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  if (associatedData) cipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const plaintext = Buffer.from(JSON.stringify(secret), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    version: VAULT_VERSION,
    salt: salt.toString('base64url'),
    nonce: nonce.toString('base64url'),
    authTag: authTag.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
  };
}

function decryptWithKey<T extends CredentialSecret>(envelope: VaultEnvelope, key: Buffer, associatedData?: string): T {
  const nonce = Buffer.from(envelope.nonce, 'base64url');
  const authTag = Buffer.from(envelope.authTag, 'base64url');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64url');
  if (nonce.length !== NONCE_BYTES || authTag.length !== AUTH_TAG_BYTES) throw new Error('Invalid vault envelope');

  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  if (associatedData) decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const parsed: unknown = JSON.parse(plaintext.toString('utf8'));
  assertCredentialSecret(parsed);
  return parsed as T;
}

function assertEnvelope(envelope: VaultEnvelope): void {
  if (!envelope || envelope.version !== VAULT_VERSION) throw new Error(`Unsupported vault envelope version: ${String(envelope?.version)}`);
  for (const field of ['salt', 'nonce', 'authTag', 'ciphertext'] as const) {
    if (typeof envelope[field] !== 'string' || envelope[field].length === 0) throw new Error(`Invalid vault envelope field: ${field}`);
  }
}

function assertCredentialSecret(value: unknown): asserts value is CredentialSecret {
  if (!value || typeof value !== 'object' || !('kind' in value)) throw new Error('Invalid credential secret payload');
  const kind = (value as { kind: unknown }).kind;
  const supported: readonly CredentialKind[] = ['api-key', 'password', 'totp', 'oauth', 'ssh-key', 'certificate', 'recovery-codes', 'passkey', 'secret'];
  if (!supported.includes(kind as CredentialKind)) throw new Error(`Unsupported credential kind: ${String(kind)}`);
}

export function generateRecoveryCodes(count = 10, bytes = 8): string[] {
  if (count <= 0 || bytes <= 0) throw new Error('Recovery code parameters must be positive');
  const result = new Set<string>();
  while (result.size < count) {
    result.add(randomBytes(bytes).toString('hex').toUpperCase());
  }
  return [...result];
}

export function normalizeBase32(secret: string): string {
  return secret.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
}

export function totpCode(secret: string, timestampMs = Date.now(), options: Pick<TotpSecret, 'algorithm' | 'digits' | 'period'> = {}): string {
  const normalized = normalizeBase32(secret);
  const algorithm = options.algorithm ?? 'SHA1';
  const digits = options.digits ?? 6;
  const period = options.period ?? 30;
  const counter = Math.floor(timestampMs / 1000 / period);
  const key = decodeBase32(normalized);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac(algorithm.toLowerCase() as 'sha1' | 'sha256' | 'sha512', key).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code = ((digest[offset]! & 0x7f) << 24)
    | ((digest[offset + 1]! & 0xff) << 16)
    | ((digest[offset + 2]! & 0xff) << 8)
    | (digest[offset + 3]! & 0xff);
  return String(code % (10 ** digits)).padStart(digits, '0');
}

export function otpauthUri(secret: TotpSecret): string {
  const algorithm = secret.algorithm ?? 'SHA1';
  const digits = secret.digits ?? 6;
  const period = secret.period ?? 30;
  const account = secret.account ?? 'account';
  const label = secret.issuer ? `${secret.issuer}:${account}` : account;
  const query = new URLSearchParams({ secret: normalizeBase32(secret.secret), algorithm, digits: String(digits), period: String(period) });
  if (secret.issuer) query.set('issuer', secret.issuer);
  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`;
}

function decodeBase32(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let buffer = 0;
  const output: number[] = [];
  for (const character of value) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error(`Invalid base32 TOTP secret: ${character}`);
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}
