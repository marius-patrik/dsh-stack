import assert from 'node:assert/strict';
import { decryptSecret, encryptSecret, generateRecoveryCodes, otpauthUri, totpCode } from './lib/index.js';

const password = { kind: 'password', username: 'user@example.com', password: 'correct horse battery staple' };
const envelope = encryptSecret(password, 'vault-passphrase', 'test/provider');
const recovered = decryptSecret(envelope, 'vault-passphrase', 'test/provider');
assert.deepEqual(recovered, password);
assert.throws(() => decryptSecret(envelope, 'wrong-passphrase', 'test/provider'));
assert.notEqual(totpCode('JBSWY3DPEHPK3PXP', 0), '');
assert.match(otpauthUri({ kind: 'totp', secret: 'JBSWY3DPEHPK3PXP', issuer: 'Example', account: 'user@example.com' }), /^otpauth:\/\/totp\//);
assert.equal(new Set(generateRecoveryCodes(20)).size, 20);
console.log('Credential vault verification passed.');
