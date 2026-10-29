import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// „Oznacz jako test” (28.10): opłacone zamówienie właściciela wypada z lejka sprzedaży i kreatora („Opłacone”), raportu A/B,
// statystyk przychodu i rozliczeń kodu; faktura i wpis w rejestrze sprzedaży zostają (tylko flaga). „Cofnij” przywraca wszystko.
// Zamówienia z kodem TEST-… dają w raportach ten sam wynik (od początku poza nimi).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-testorder-'));
const { saveOrder, getOrder, codes } = await import('../lib/store.js');
const { funnelPaid, funnelOrder, funnelRange, wizardFunnel, analyticsDays, analyticsRoutes } = await import('../lib/analytics.js');
const express = (await import('express')).default;
const { recordSale, sales, salesReport, syncSales } = await import('../lib/ops.js');
const { setTestMark, isTestOrder } = await import('../lib/test-orders.js');
const { REF_REWARD } = await import('../lib/referral.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const day = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

const now = Date.now(), visit = { src: 'google', lang: 'pl', ab: { checkout: 'B' } };
const base = (id, extra = {}) => ({ id, pkg: 'cv', status: 'done', created: now - 3600e3, paidAt: now - 1800e3, total: 3900, discount: 0, profile: { email: `${id}@test.pl`, name: 'T' }, ads: [{ title: 'Kasjer', text: 'x'.repeat(100) }], addons: {}, extraLangs: [], visit, ...extra });

async function snapshot() {
  // zakres kilku dni: płatność mogła być tuż przed północą (czas polski)
  const f = await funnelRange(day(now - 2 * 864e5), day(now + 864e5)), paid = f.stages.find((s) => s.k === 'paid');
  const all = wizardFunnel(Object.values(await analyticsDays())).find((g) => g.group === 'all');
  const rep = await salesReport('30', now + 1000);
  return { paid: paid.n, google: paid.src.google || 0, wizPaid: all?.rows.find((r) => r.label === 'Opłacone').n ?? 0, abPaid: f.ab['checkout:B']?.paid || 0, abOrders: f.ab['checkout:B']?.order_created || 0, revenue: rep.total.revenue, orders: rep.total.orders };
}

test('Oznacz jako test i Cofnij: lejek, lejek kreatora, A/B, przychód, prowizja partnera i nagroda za polecenie; rejestr sprzedaży zostaje', async () => {
  await codes.save({ id: 'PART-1', commission: 20, sales: 1, revenue: 3900, due: 780, expires: now + 864e5 });
  await codes.save({ id: 'KOD-AAAA', ownerHash: 'h', amount: 1000, credit: REF_REWARD, earned: REF_REWARD, referrals: 1, rewarded: ['o-ref'], expires: now + 864e5 });
  // lejek kreatora pokazuje się, gdy ktoś otworzył kreator (zdarzenie „start”)
  const app = express(); analyticsRoutes(app, 'https://example.test'); const srv = app.listen(0);
  await fetch(`http://127.0.0.1:${srv.address().port}/api/t`, { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Mozilla/5.0 T' }, body: JSON.stringify({ e: 'start' }) }); srv.close();
  const orders = [base('o-real'), base('o-part', { code: 'PART-1' }), base('o-ref', { code: 'KOD-AAAA', total: 2900, discount: 1000 })];
  for (const o of orders) { await saveOrder(o); await funnelOrder(o, o.created); await funnelPaid(o, o.paidAt); await recordSale(o); }
  await wait(100);
  const before = await snapshot();
  assert.deepEqual(before, { paid: 3, google: 3, wizPaid: 3, abPaid: 3, abOrders: 3, revenue: 107, orders: 3 });

  for (const id of ['o-part', 'o-ref']) assert.deepEqual(await setTestMark(id, true, now), { ok: true, changed: true });
  assert.deepEqual(await setTestMark('o-part', true), { ok: true, changed: false }, 'drugi raz nic nie zmienia');
  await wait(50);
  assert.deepEqual(await snapshot(), { paid: 1, google: 1, wizPaid: 1, abPaid: 1, abOrders: 1, revenue: 39, orders: 1 });
  const part = await codes.get('PART-1'), ref = await codes.get('KOD-AAAA');
  assert.deepEqual([part.sales, part.revenue, part.due], [0, 0, 0], 'prowizja partnera cofnięta');
  assert.deepEqual([ref.credit, ref.earned, ref.referrals, ref.rewarded], [0, 0, 0, []], 'nagroda za polecenie cofnięta');
  const s = await sales.get('o-part'); assert.equal(s.test, true); assert.equal(s.total, 3900, 'wpis w rejestrze zostaje');
  assert.equal(Object.keys(await sales.all()).length, 3);
  assert.ok(isTestOrder(await getOrder('o-part'))); assert.equal((await getOrder('o-part')).testMark.code.kind, 'commission');

  for (const id of ['o-part', 'o-ref']) assert.deepEqual(await setTestMark(id, false), { ok: true, changed: true });
  await wait(50);
  assert.deepEqual(await snapshot(), before, 'Cofnij przywraca wszystko');
  const part2 = await codes.get('PART-1'), ref2 = await codes.get('KOD-AAAA');
  assert.deepEqual([part2.sales, part2.revenue, part2.due], [1, 3900, 780]); assert.deepEqual([ref2.credit, ref2.earned, ref2.referrals, ref2.rewarded], [REF_REWARD, REF_REWARD, 1, ['o-ref']]);
  assert.equal((await sales.get('o-part')).test, false); assert.ok(!(await getOrder('o-part')).testMark);

  await saveOrder(base('o-pending', { status: 'pending', paidAt: undefined }));
  assert.match((await setTestMark('o-pending', true)).error, /tylko opłacone/);
  assert.match((await setTestMark('nie-ma', true)).error, /Nie ma takiego/);
});

test('Kod TEST-… i „Oznacz jako test” – ten sam wynik w raportach: poza przychodem, lejkiem i rejestrem uzupełnianym przez syncSales', async () => {
  const t = base('o-code', { product: 'templates', pkg: 'templates', total: 0, discount: 1900, testCode: 'TEST-AAAA-BBBB', invoice: null });
  await saveOrder(t); assert.ok(isTestOrder(t));
  assert.match((await setTestMark('o-code', true)).error, /kod.*testow/i);
  await syncSales(); assert.equal(await sales.get('o-code'), null, 'syncSales nie dopisuje zamówień z kodem testowym');
  const src = read('lib/admin.js');
  assert.match(src, /const paid = orders\.filter\(\(o\) => PAID\.includes\(o\.status\) && !isTestOrder\(o\)\);/, '/stats bez testów');
  assert.match(src, /PAID\.includes\(o\.status\) && !isTestOrder\(o\) && now - paidAt\(o\)/, '/traffic: konwersja bez testów');
  assert.match(read('lib/ops.js'), /list = Object\.values\(await sales\.all\(\)\)\.filter\(\(x\) => !x\.test\)/, 'dzienne podsumowanie bez testów');
});

test('Panel: endpoint tylko po zalogowaniu, przycisk „Oznacz jako test” / „Cofnij” i znacznik „test”; strona klienta bez zmian', async () => {
  const port = 7400 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-testorder-srv-'));
  fs.writeFileSync(path.join(dir, 'orders.json'), JSON.stringify({ 'o-srv': base('o-srv', { visit: null }) }));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', ADMIN_PASSWORD: 'tajne-haslo-testowe' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    let up = false; for (let i = 0; i < 200 && !up; i++) { try { await fetch(U + '/api/config'); up = true; } catch { await wait(150); } }
    if (!up) throw new Error('serwer nie wystartował');
    const call = (m, p, b, h = {}) => fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...h }, ...(b ? { body: JSON.stringify(b) } : {}) }).then(async (r) => ({ status: r.status, j: await r.json() }));
    assert.equal((await call('POST', '/api/admin/orders/o-srv/test', { test: true }, { 'X-Admin': '1' })).status, 401);
    const login = await fetch(U + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, body: JSON.stringify({ password: 'tajne-haslo-testowe' }) });
    const A = { cookie: login.headers.get('set-cookie').split(';')[0], 'X-Admin': '1' };
    const stats = async () => (await call('GET', '/api/admin/stats', null, A)).j.d30;
    assert.deepEqual(await stats(), { revenue: 39, orders: 1, avg: 39 });
    assert.equal((await call('POST', '/api/admin/orders/o-srv/test', { test: true }, A)).j.changed, true);
    assert.deepEqual(await stats(), { revenue: 0, orders: 0, avg: 0 });
    assert.equal((await call('GET', '/api/admin/orders/o-srv', null, A)).j.test, 'mark');
    assert.equal((await call('POST', '/api/admin/orders/o-srv/test', { test: false }, A)).j.changed, true);
    assert.deepEqual(await stats(), { revenue: 39, orders: 1, avg: 39 });
    assert.equal((await call('POST', '/api/admin/orders/nie-ma/test', { test: true }, A)).status, 404);
  } finally { srv.kill(); }
  const adm = read('public/admin.js');
  assert.match(adm, /textContent: o\.test \? 'Cofnij oznaczenie testu' : 'Oznacz jako test'/); assert.match(adm, /post\(`\/orders\/\$\{id\}\/test`, \{ test: true \}\)/);
  assert.match(adm, /o\.test \? el\('span', \{ className: 'tag', textContent: 'test'/);
  assert.doesNotMatch(read('public/app.js'), /testMark/, 'strona klienta bez zmian');
});
