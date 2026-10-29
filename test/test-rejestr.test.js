import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// „Oznacz jako test” na wpisie rejestru sprzedaży (29.10): działa też, gdy zamówienia już nie ma (testy właściciela usunięte
// z zakładki Zamówienia). Wpis zostaje, znika z przychodu i lejka („Opłacone”: suma i język), rozliczenie kodu cofnięte;
// z zamówieniem – oznacza oba (jak „Oznacz jako test” w zamówieniu). „Cofnij” przywraca wszystko.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-saletest-'));
const { saveOrder, getOrder, codes } = await import('../lib/store.js');
const { sales, salesReport, recordSale } = await import('../lib/ops.js');
const { funnelPaid, analyticsDays } = await import('../lib/analytics.js');
const { setSaleTestMark } = await import('../lib/test-orders.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const now = Date.now(), at = now - 3600e3;
const paidDay = async () => { const d = Object.values(await analyticsDays()).find((x) => x.funnel?.paid); return { n: d?.funnel.paid.n || 0, pl: d?.funnel.paid.lang?.pl || 0, google: d?.funnel.paid.src?.google || 0 }; };

test('Wpis bez zamówienia: test → poza przychodem i lejkiem, kod cofnięty; Cofnij przywraca; z zamówieniem – oba', async () => {
  await codes.save({ id: 'PART-9', commission: 20, sales: 2, revenue: 7800, due: 1560, expires: now + 864e5 });
  for (const [id, code] of [['del-1', 'PART-9'], ['del-2', null]]) {
    await sales.save({ id, at, day: new Date(at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }), pkg: 'cv', total: 3900, discount: 0, refunded: 0, uiLang: 'pl', code, test: false });
    await funnelPaid({ visit: { src: 'google', lang: 'pl' } }, at);
  }
  await wait(50);
  assert.deepEqual((await salesReport('30', now + 1000)).total.orders, 2); assert.deepEqual(await paidDay(), { n: 2, pl: 2, google: 2 });
  assert.deepEqual(await setSaleTestMark('del-1', true, now), { ok: true, changed: true, orphan: true });
  assert.deepEqual(await setSaleTestMark('del-1', true), { ok: true, changed: false }, 'drugi raz bez zmian');
  await wait(50);
  const r = await salesReport('30', now + 1000); assert.deepEqual([r.total.orders, r.total.revenue], [1, 39], 'poza przychodem');
  assert.deepEqual(await paidDay(), { n: 1, pl: 1, google: 2 }, 'Opłacone −1 (suma i język; źródła wpis nie zna)');
  const c = await codes.get('PART-9'); assert.deepEqual([c.sales, c.revenue, c.due], [1, 3900, 780], 'prowizja cofnięta');
  const s = await sales.get('del-1'); assert.equal(s.test, true); assert.equal(s.total, 3900, 'wpis zostaje');
  assert.deepEqual(await setSaleTestMark('del-1', false), { ok: true, changed: true, orphan: true }); await wait(50);
  assert.equal((await salesReport('30', now + 1000)).total.orders, 2); assert.deepEqual(await paidDay(), { n: 2, pl: 2, google: 2 });
  const c2 = await codes.get('PART-9'); assert.deepEqual([c2.sales, c2.revenue, c2.due], [2, 7800, 1560]); assert.equal((await sales.get('del-1')).testMark, undefined);
  // wpis z zamówieniem → oznacza oba (setTestMark)
  const o = { id: 'ord-1', pkg: 'cv', status: 'done', created: at, paidAt: at, total: 3900, discount: 0, profile: { email: 'a@b.pl' }, ads: [{ title: 'X', text: 'x'.repeat(80) }], addons: {}, extraLangs: [], visit: { src: 'google', lang: 'pl' } };
  await saveOrder(o); await recordSale(o);
  assert.deepEqual(await setSaleTestMark('ord-1', true, now), { ok: true, changed: true });
  assert.ok((await getOrder('ord-1')).testMark); assert.equal((await sales.get('ord-1')).test, true);
  assert.match((await setSaleTestMark('nie-ma', true)).error, /Nie ma takiego wpisu/);
});

test('Panel: endpointy tylko po zalogowaniu, lista wpisów z flagą „zamówienie usunięte”, przycisk z potwierdzeniem', async () => {
  const port = 7300 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-saletest-srv-'));
  fs.writeFileSync(path.join(dir, 'sales.json'), JSON.stringify({ 'gone-1': { id: 'gone-1', at: now - 864e5, day: '2026-10-24', pkg: 'cv', total: 3900, refunded: 0, uiLang: 'pl', test: false } }));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', ADMIN_PASSWORD: 'tajne-haslo-testowe' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    let up = false; for (let i = 0; i < 200 && !up; i++) { try { await fetch(U + '/api/config'); up = true; } catch { await wait(150); } }
    const call = (m, p, b, h = {}) => fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...h }, ...(b ? { body: JSON.stringify(b) } : {}) }).then(async (r) => ({ status: r.status, j: await r.json() }));
    assert.equal((await call('POST', '/api/admin/sales/gone-1/test', { test: true }, { 'X-Admin': '1' })).status, 401);
    const login = await fetch(U + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, body: JSON.stringify({ password: 'tajne-haslo-testowe' }) });
    const A = { cookie: login.headers.get('set-cookie').split(';')[0], 'X-Admin': '1' };
    assert.deepEqual((await call('GET', '/api/admin/sales/entries?range=30', null, A)).j, [{ id: 'gone-1', at: now - 864e5, total: 3900, refunded: 0, pkg: 'cv', code: null, test: false, order: false }]);
    assert.equal((await call('GET', '/api/admin/sales?range=30', null, A)).j.total.orders, 1);
    assert.equal((await call('POST', '/api/admin/sales/gone-1/test', { test: true }, A)).j.changed, true);
    assert.equal((await call('GET', '/api/admin/sales?range=30', null, A)).j.total.orders, 0);
    assert.equal((await call('GET', '/api/admin/sales/entries?range=30', null, A)).j[0].test, true, 'wpis zostaje na liście');
    assert.equal((await call('POST', '/api/admin/sales/nie-ma/test', { test: true }, A)).status, 404);
  } finally { srv.kill(); }
  const adm = read('public/admin.js');
  assert.match(adm, /drawEntries\(await api\('\/sales\/entries\?range=' \+ salesRange\)\)/);
  assert.match(adm, /textContent: x\.test \? 'Cofnij' : 'Oznacz jako test'/); assert.match(adm, /`Oznaczyć \$\{zl\(x\.total \/ 100\)\} jako test\? `/);
  assert.match(adm, /textContent: x\.order \? 'jest' : 'usunięte'/);
  assert.match(read('public/admin.html'), /<div class="tbl-wrap" id="salesEntries"><\/div>/);
});
