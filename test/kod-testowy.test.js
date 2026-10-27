import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Kod testowy 100% (27.10): panel admina → jednorazowy kod na jedną wybraną usługę (dotacja, oferta na zlecenie, tłumaczenie…),
// ważny 7 dni; nie działa na inne usługi; zamówienie za 0 zł bez płatności i faktury; wygenerowanie i użycie w dzienniku zdarzeń.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-tc-'));
const T = await import('../lib/test-codes.js');
const { events } = await import('../lib/store.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('Generowanie i użycie: jedna usługa, jedno użycie, 7 dni, wpisy w dzienniku', async () => {
  await assert.rejects(T.createTestCode('outplacement'), /Wybierz usługę/);
  for (const k of ['grantplan', 'grantfull', 'offer', 'translation']) assert.ok(T.TEST_PRODUCTS[k], k);
  const t0 = Date.now(), c = await T.createTestCode('offer', t0);
  assert.match(c.id, /^TEST-[A-Z2-9]{4}-[A-Z2-9]{4}$/); assert.equal(c.expires - t0, 7 * 864e5); assert.equal(c.usedBy, null);
  assert.match((await T.useTestCode(c.id, 'translation', 'o0', t0)).error, /tylko na usługę: Oferta na zlecenie/);
  assert.match((await T.useTestCode(c.id, 'offer', 'o1', t0 + 7 * 864e5 + 1)).error, /wygasł/);
  assert.deepEqual(await T.useTestCode(` ${c.id.toLowerCase()} `, 'offer', 'o2', t0), { ok: true, code: c.id });
  assert.match((await T.useTestCode(c.id, 'offer', 'o3', t0)).error, /już wykorzystany/);
  assert.match((await T.useTestCode('TEST-2222-2222', 'offer', 'o4')).error, /Nieprawidłowy/); assert.match((await T.useTestCode('ABC', 'offer', 'o4')).error, /Nieprawidłowy/);
  assert.equal((await T.testCodes.get(c.id)).usedBy, 'o2');
  await wait(50);
  const log = Object.values(await events.all()).filter((e) => e.type === 'kod testowy').map((e) => e.message);
  assert.ok(log.some((m) => m.startsWith(`Wygenerowano ${c.id} (100%) na usługę: Oferta na zlecenie`)), 'wygenerowanie w dzienniku');
  assert.ok(log.some((m) => m === `Użyto ${c.id} na usługę: Oferta na zlecenie`), 'użycie w dzienniku');
  assert.ok(log.some((m) => /Nieudane użycie/.test(m)), 'nieudane próby też w dzienniku');
});

test('Serwer: panel admina generuje kod, zakup usługi z ?kod= za 0 zł bez płatności i faktury; inna usługa i drugi raz – odmowa', async () => {
  const port = 7100 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-tc-srv-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1', ADMIN_PASSWORD: 'tajne-haslo-testowe' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 200; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const call = (m, p, b, h = {}) => fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...h }, ...(b ? { body: JSON.stringify(b) } : {}) }).then(async (r) => ({ status: r.status, j: await r.json() }));
    assert.equal((await call('POST', '/api/admin/test-codes', { product: 'templates' }, { 'X-Admin': '1' })).status, 401, 'tylko po zalogowaniu');
    const login = await fetch(U + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, body: JSON.stringify({ password: 'tajne-haslo-testowe' }) });
    const A = { cookie: login.headers.get('set-cookie').split(';')[0], 'X-Admin': '1' };
    assert.equal((await call('POST', '/api/admin/test-codes', { product: 'nic' }, A)).status, 400);
    const c = (await call('POST', '/api/admin/test-codes', { product: 'templates' }, A)).j;
    assert.match(c.id, /^TEST-/); assert.equal(c.link, `${U}/szablony-premium?kod=${c.id}`);
    const other = (await call('POST', '/api/admin/test-codes', { product: 'offer' }, A)).j;
    const buy = (code) => call('POST', '/api/products/templates', { email: 'wlasciciel@test.pl', terms: true, waiver: true, testCode: code, invoice: { name: 'Firma', address: 'ul. Testowa 1, Kraków' } });
    assert.match((await buy(other.id)).j.error, /tylko na usługę: Oferta na zlecenie/, 'kod innej usługi nie działa');
    const o = await buy(c.id); assert.equal(o.status, 200); assert.deepEqual(Object.keys(o.j).sort(), ['free', 'id']);
    let st; for (let i = 0; i < 60 && st?.status !== 'done'; i++) { await wait(200); st = (await call('GET', `/api/products/${o.j.id}`)).j; }
    assert.equal(st.status, 'done'); assert.equal(st.total, 0);
    assert.equal((await fetch(`${U}/api/products/${o.j.id}/szablony-cv-premium.zip`)).status, 200, 'pliki od razu');
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === o.j.id);
    assert.equal(saved.total, 0); assert.equal(saved.invoice, null); assert.equal(saved.testCode, c.id); assert.ok(!saved.stripe && !saved.p24, 'bez płatności');
    assert.match((await buy(c.id)).j.error, /już wykorzystany/, 'jedno użycie');
    const sales = fs.existsSync(path.join(dir, 'sales.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'sales.json'), 'utf8')) : {};
    assert.equal(sales[o.j.id], undefined, 'zamówienie testowe poza rejestrem sprzedaży');
    const list = (await call('GET', '/api/admin/test-codes', null, A)).j.list;
    assert.equal(list.find((x) => x.id === c.id).usedBy, o.j.id); assert.equal(list.find((x) => x.id === other.id).usedBy, null);
  } finally { srv.kill(); }
});

test('Panel i strony usług: karta w panelu, ?kod= wysyłany przy zakupie, zamówienie „free” bez płatności', () => {
  assert.match(read('public/admin.html'), /id="tcForm"/); assert.match(read('public/admin.js'), /post\('\/test-codes'/);
  for (const f of ['dotacja.js', 'oferta.js', 'ogloszenie.js', 'selekcja.js', 'tlumaczenie.js', 'szablony.js', 'app.js']) {
    const s = read(`public/${f}`); assert.match(s, /testCode: new URLSearchParams\(location\.search\)\.get\('kod'\)/, f); assert.match(s, /if \(j\.free\)/, f);
  }
});
