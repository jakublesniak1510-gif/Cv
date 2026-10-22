import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Tryb PAY_PROVIDER=both na atrapach Stripe i Przelewy24: wybór bramki, zmiana bramki przy ponownej płatności,
// starsza sesja P24, zła kwota/podpis, wpłata P24 do zamówienia opłaconego już przez Stripe, kolejne zamówienie
// i dodatek przez P24, błąd rejestracji P24 (zwolnienie rezerwacji), zwrot przez API P24.
const CRC = 'testcrc123', MERCHANT = 111222, KEY = 'apikey';
const sha = (o) => crypto.createHash('sha384').update(JSON.stringify(o)).digest('hex');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const body = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => ok(b)); });

function mocks() {
  const calls = [], stripeSessions = {};
  let tok = 0;
  const p24 = http.createServer(async (req, res) => {
    const raw = await body(req), b = raw ? JSON.parse(raw) : {};
    calls.push({ to: 'p24', method: req.method, url: req.url, b });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/v1/transaction/register') {
      if (b.email === 'blad@test.pl') { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Invalid' })); }
      const ok = b.sign === sha({ sessionId: b.sessionId, merchantId: MERCHANT, amount: b.amount, currency: 'PLN', crc: CRC });
      return res.end(JSON.stringify(ok ? { data: { token: `T${++tok}` } } : { error: 'bad sign' }));
    }
    if (req.url === '/api/v1/transaction/verify') {
      const ok = b.sign === sha({ sessionId: b.sessionId, orderId: b.orderId, amount: b.amount, currency: 'PLN', crc: CRC });
      return res.end(JSON.stringify({ data: { status: ok ? 'success' : 'error' } }));
    }
    if (req.url === '/api/v1/transaction/refund') return res.end(JSON.stringify({ data: [{ ...b.refunds[0], status: true, message: 'success' }], responseCode: 0 }));
    if (req.url.startsWith('/api/v1/transaction/by/sessionId/')) return res.end(JSON.stringify({ data: { status: 0 } }));
    res.statusCode = 404; res.end('{}');
  }).listen(0);
  const stripe = http.createServer(async (req, res) => {
    const raw = await body(req), b = Object.fromEntries(new URLSearchParams(raw));
    calls.push({ to: 'stripe', method: req.method, url: req.url, b });
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'POST' && req.url === '/checkout/sessions') {
      const id = `cs_${Object.keys(stripeSessions).length + 1}`;
      stripeSessions[id] = { id, url: `https://stripe.test/${id}`, client_reference_id: b.client_reference_id, amount_total: Number(b['line_items[0][price_data][unit_amount]']), currency: 'pln', payment_status: 'unpaid', payment_intent: `pi_${id}` };
      return res.end(JSON.stringify(stripeSessions[id]));
    }
    const m = /^\/checkout\/sessions\/(cs_\d+)(\/expire)?$/.exec(req.url);
    if (m) { if (m[2]) stripeSessions[m[1]].expired = true; return res.end(JSON.stringify(stripeSessions[m[1]] || {})); }
    if (req.url.startsWith('/payment_method_configurations')) return res.end(JSON.stringify({ data: [] }));
    res.statusCode = 404; res.end('{}');
  }).listen(0);
  return { calls, stripeSessions, p24, stripe };
}

test('PAY_PROVIDER=both: wybór bramki, zmiana bramki, sesje P24, wpłata po Stripe, followup/dodatek przez P24, błąd rejestracji, zwrot', { timeout: 90_000 }, async () => {
  const m = mocks(), port = 4700 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-both-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', SALES_OPEN: '1', PAY_PROVIDER: 'both',
    P24_MERCHANT_ID: String(MERCHANT), P24_CRC: CRC, P24_API_KEY: KEY, P24_BASE_URL: `http://localhost:${m.p24.address().port}`,
    STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x', STRIPE_API_BASE: `http://localhost:${m.stripe.address().port}` };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
  const post = async (p, b) => { const r = await fetch(U + p, { method: 'POST', headers: H, body: JSON.stringify(b || {}) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
  const get = async (id) => { const r = await fetch(`${U}/api/orders/${id}`); return r.status === 404 ? null : r.json(); };
  const until = async (id, ok) => { let o; for (let i = 0; i < 80; i++) { o = await get(id); if (o && ok(o)) return o; await wait(150); } return o; };
  const notify = (sessionId, amount, orderId) => { const n = { merchantId: MERCHANT, posId: MERCHANT, sessionId, amount, originAmount: amount, currency: 'PLN', orderId, methodId: 154, statement: 'p24' }; return fetch(U + '/api/p24/status', { method: 'POST', headers: H, body: JSON.stringify({ ...n, sign: sha({ ...n, crc: CRC }) }) }); };
  const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
  const order = (extra = {}) => post('/api/orders', { pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'X', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }], ...extra });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const cfg = await (await fetch(U + '/api/config')).json();
    assert.deepEqual(cfg.pay.gateways.map((g) => g.id), ['stripe', 'p24']); assert.equal(cfg.pay.id, 'stripe', 'domyślnie Stripe'); assert.equal(cfg.pay.p24Sandbox, false);

    // 1) wybór bramki: brak pola → Stripe, p24 → Przelewy24, nieznana → 400
    const s1 = await order(); assert.match(s1.j.url, /^https:\/\/stripe\.test\/cs_/);
    assert.equal((await order({ gateway: 'paypal' })).status, 400);
    const p1 = await order({ gateway: 'p24' }); assert.match(p1.j.url, /\/trnRequest\/T\d+$/);
    const reg1 = m.calls.filter((c) => c.url.endsWith('/register')).at(-1).b; assert.equal(reg1.sessionId, `${p1.j.id}.1`);

    // 2) zmiana bramki: porzucony P24 → Stripe → znowu P24 (stara sesja Stripe zamknięta); wpłata ze STARSZEJ sesji P24 jest rozpoznana
    const toStripe = await post(`/api/orders/${p1.j.id}/pay`, { gateway: 'stripe' }); assert.match(toStripe.j.url, /stripe\.test\/(cs_\d+)/);
    const cs = /stripe\.test\/(cs_\d+)/.exec(toStripe.j.url)[1];
    const back = await post(`/api/orders/${p1.j.id}/pay`, { gateway: 'p24' }); assert.match(back.j.url, /trnRequest/);
    assert.ok(m.stripeSessions[cs].expired, 'otwarta sesja Stripe zamknięta przy powrocie do P24');
    assert.equal((await post(`/api/orders/${p1.j.id}/pay`, { gateway: 'x' })).status, 400);
    // zła kwota: bez potwierdzenia; zły podpis: 400
    await notify(`${p1.j.id}.1`, 100, 555); await wait(300);
    assert.equal((await get(p1.j.id)).status, 'pending', 'zła kwota nie potwierdza');
    assert.equal((await fetch(U + '/api/p24/status', { method: 'POST', headers: H, body: JSON.stringify({ merchantId: MERCHANT, sessionId: `${p1.j.id}.1`, amount: 3900, sign: 'x'.repeat(96) }) })).status, 400);
    await notify(`${p1.j.id}.1`, 3900, 555);
    let o = await until(p1.j.id, (x) => x.status === 'done');
    assert.equal(o.status, 'done', 'wpłata ze starszej sesji P24 opłaca zamówienie');
    assert.ok(m.calls.some((c) => c.url.endsWith('/verify') && c.b.sessionId === `${p1.j.id}.1` && c.b.orderId === 555));

    // 3) zamówienie opłacone przez Stripe, potem wpłata P24 do jego wcześniejszej sesji → ignorowana (bez verify) + log
    const p2 = await order({ gateway: 'p24' }); const sStripe = await post(`/api/orders/${p2.j.id}/pay`, { gateway: 'stripe' });
    const cs2 = /stripe\.test\/(cs_\d+)/.exec(sStripe.j.url)[1]; m.stripeSessions[cs2].payment_status = 'paid';
    o = await until(p2.j.id, (x) => x.status === 'done'); assert.equal(o.status, 'done');
    const verifies = m.calls.filter((c) => c.url.endsWith('/verify')).length;
    assert.equal((await notify(`${p2.j.id}.1`, 3900, 777)).status, 200); await wait(400);
    assert.equal(m.calls.filter((c) => c.url.endsWith('/verify')).length, verifies, 'bez verify dla opłaconego zamówienia');
    const ev = JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, 'events.json'), 'utf8')));
    assert.match(ev, /do zamówienia już opłaconego/);

    // 4) kolejne zamówienie i dodatek przez P24
    const fu = await post(`/api/orders/${p1.j.id}/followup`, { pkg: 'cv', ads: [{ title: 'Kierowca', text: ad }], waiver: true, gateway: 'p24' });
    assert.equal(fu.status, 200); assert.match(fu.j.url, /trnRequest/);
    await notify(`${fu.j.id}.1`, 3900, 901); assert.equal((await until(fu.j.id, (x) => x.status === 'done')).status, 'done');
    const up = await post(`/api/orders/${p1.j.id}/upsell`, { key: 'letter', waiver: true, gateway: 'p24' });
    assert.equal(up.status, 200); assert.match(up.j.url, /trnRequest/);
    const upOrder = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))[up.j.id];
    await notify(`${up.j.id}.1`, upOrder.total, 902);
    o = await until(p1.j.id, (x) => x.pkg === 'cv_letter' && !x.upsellBusy); assert.equal(o.pkg, 'cv_letter', 'dodatek opłacony przez P24 dopisany');

    // 5) błąd rejestracji P24: 502, zamówienie usunięte (rezerwacje zwolnione); Stripe dalej działa
    const bad = await post('/api/orders', { pkg: 'cv', consent: true, waiver: true, gateway: 'p24', profile: { name: 'Jan Test', email: 'blad@test.pl', experience: [{ title: 'Magazynier', company: 'X' }] }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(bad.status, 502); assert.match(bad.j.error, /wybierz inną metodę płatności/);
    const all = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'));
    assert.ok(!Object.values(all).some((x) => x.profile?.email === 'blad@test.pl'), 'nieudane zamówienie usunięte');
  } finally { srv.kill(); m.p24.close(); m.stripe.close(); }

  // 6) zwrot przez API P24: kwota, numer transakcji, sesja; ten sam zwrot = te same identyfikatory (bez podwójnego zlecenia)
  Object.assign(process.env, { P24_MERCHANT_ID: String(MERCHANT), P24_CRC: CRC, P24_API_KEY: KEY });
  const m2 = mocks(); process.env.P24_BASE_URL = `http://localhost:${m2.p24.address().port}`;
  try {
    const { p24Refund } = await import('../lib/p24.js');
    const a = await p24Refund({ orderId: 'abc-123', sessionId: 'abc-123.1', p24OrderId: '555', amount: 1500, already: 0 });
    const b = await p24Refund({ orderId: 'abc-123', sessionId: 'abc-123.1', p24OrderId: '555', amount: 1500, already: 0 });
    const r = m2.calls.filter((c) => c.url === '/api/v1/transaction/refund');
    assert.equal(r.length, 2); assert.equal(r[0].b.refunds[0].orderId, 555); assert.equal(r[0].b.refunds[0].amount, 1500); assert.equal(r[0].b.refunds[0].sessionId, 'abc-123.1');
    assert.equal(r[0].b.requestId, r[1].b.requestId); assert.equal(a.id, b.id, 'idempotentne identyfikatory');
    assert.notEqual((await p24Refund({ orderId: 'abc-123', sessionId: 'abc-123.1', p24OrderId: '555', amount: 500, already: 1500 })).id, a.id);
  } finally { m2.p24.close(); m2.stripe.close(); for (const k of ['P24_MERCHANT_ID', 'P24_CRC', 'P24_API_KEY', 'P24_BASE_URL']) delete process.env[k]; }
});

test('Panel admina: zwrot dla P24 i baner sandboxa; karnety i paczki kodów z informacją o Stripe; dokumenty i instrukcja', () => {
  const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  assert.match(read('lib/admin.js'), /o\.payment\?\.provider === 'przelewy24'\) return refundP24/); assert.match(read('lib/admin.js'), /p24Sandbox: isAdmin\(req\) && p24Enabled\(\) && p24Sandbox\(\)/);
  assert.match(read('public/admin.html'), /id="p24SandboxNote" hidden/);
  assert.match(read('lib/passes.js'), /Karnet opłacisz online przez Stripe/); assert.match(read('lib/b2b.js'), /płatność online przez Stripe/);
  const reg = read('public/legal/regulamin.html');
  for (const t of ['PayPro S.A. z siedzibą w Poznaniu (ul. Pastelowa 8, 60-198 Poznań, KRS 0000347935, NIP 7792369887)', 'Klient wybiera jedną z nich przed płatnością', '22 października 2026 r. – dwie bramki płatności']) assert.ok(reg.includes(t), t);
  const doc = read('docs/P24.md');
  for (const t of ['P24_MERCHANT_ID', 'P24_POS_ID', 'P24_CRC', 'P24_API_KEY', '/api/p24/status', 'P24_SANDBOX=1', 'PAY_PROVIDER=both']) assert.ok(doc.includes(t), t);
  assert.match(read('public/app.js'), /gateway: gwValue\(\$\('#gwBox'\)\)/);
});
