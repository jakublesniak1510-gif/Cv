import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totp, verifyTotp } from '../lib/totp.js';

test('TOTP: wektor z RFC 6238 i tolerancja jednego kroku', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // "12345678901234567890" w base32
  assert.equal(totp(secret, 59_000), '287082');
  assert.ok(verifyTotp(secret, totp(secret)));
  assert.ok(verifyTotp(secret, totp(secret, Date.now() - 30_000)));
  assert.ok(!verifyTotp(secret, totp(secret, Date.now() - 120_000)) || totp(secret, Date.now() - 120_000) === totp(secret));
});
