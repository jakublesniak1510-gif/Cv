import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-wel-'));
const { welcomeCode } = await import('../lib/welcome.js');
const { codes } = await import('../lib/store.js');

test('Kod powitalny: jeden na adres (newsletter i oferty), jednorazowy −10 zł na 30 dni', async () => {
  const a = await welcomeCode('Anna@Test.pl', 'newsletter');
  assert.match(a.code, /^WITAJ-[0-9A-F]{6}$/); assert.equal(a.amount, 10);
  const c = await codes.get(a.code);
  assert.equal(c.amount, 1000); assert.equal(c.maxUses, 1); assert.ok(c.expires - Date.now() > 29 * 864e5);
  assert.equal((await welcomeCode('anna@test.pl', 'oferty')).code, a.code, 'ten sam kod przy drugim zapisie');
  await codes.update(a.code, { usedBy: ['x'] });
  assert.equal(await welcomeCode('anna@test.pl', 'oferty'), null, 'po użyciu nie ma nowego kodu');
  assert.notEqual((await welcomeCode('jan@test.pl', 'oferty')).code, a.code);
});
