import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Zwrot P24 z panelu: prawdziwy powód odrzucenia trafia do komunikatu i do „Zdarzeń”; po próbie bez odpowiedzi
// (zerwane połączenie) ponowne kliknięcie w ciągu 10 min najpierw sprawdza listę zwrotów i nie zleca drugiego zwrotu.
const CRC = 'testcrc123', MERCHANT = 111222, KEY = 'apikey';
const sha = (o) => crypto.createHash('sha384').update(JSON.stringify(o)).digest('hex');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('Zwrot P24: powód odrzucenia w komunikacie i Zdarzeniach; ponowienie po zerwanej próbie bez drugiego POST', { timeout: 90_000 }, async () => {
  const calls = []; let mode = 'reject409', list = [];
  const p24 = http.createServer(async (req, res) => {
    let raw = ''; for await (const c of req) raw += c;
    const b = raw ? JSON.parse(raw) : {}; calls.push({ method: req.method, url: req.url, b });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/v1/transaction/register') return res.end(JSON.stringify({ data: { token: 'T1' } }));
    if (req.url === '/api/v1/transaction/verify') return res.end(JSON.stringify({ data: { status: b.sign === sha({ sessionId: b.sessionId, orderId: b.orderId, amount: b.amount, currency: 'PLN', crc: CRC }) ? 'success' : 'error' } }));
    if (req.url === '/api/v1/transaction/refund') {
      if (mode === 'reject409') { res.statusCode = 409; return res.end(JSON.stringify({ error: [{ ...b.refunds[0], status: false, message: 'Insufficient funds available' }], code: 409 })); }
      if (mode === 'reject201') { res.statusCode = 201; return res.end(JSON.stringify({ data: [{ ...b.refunds[0], status: false, message: 'Transaction in wrong status - cannot refund' }], responseCode: 0 })); }
      if (mode === 'drop') return req.socket.destroy();
      res.statusCode = 201; return res.end(JSON.stringify({ data: [{ ...b.refunds[0], status: true, message: 'success' }], responseCode: 0 }));
    }
    if (req.url.startsWith('/api/v1/refund/by/orderId/')) { if (!list.length) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'Not found', code: 404 })); } return res.end(JSON.stringify({ data: { orderId: 4242, refunds: list }, responseCode: 0 })); }
    if (req.url.startsWith('/api/v1/transaction/by/sessionId/')) return res.end(JSON.stringify({ data: { status: 0 } }));
    res.statusCode = 404; res.end('{}');
  }).listen(0);
  const port = 5100 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-p24r-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', SALES_OPEN: '1', PAY_PROVIDER: 'p24', ADMIN_PASSWORD: 'tajne-haslo-testowe',
    STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: String(MERCHANT), P24_CRC: CRC, P24_API_KEY: KEY, P24_BASE_URL: `http://localhost:${p24.address().port}` };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  const U = `http://localhost:${port}`;
  const call = async (meth, p, b, h = {}) => { const r = await fetch(U + p, { method: meth, headers: { 'Content-Type': 'application/json', ...h }, body: b && JSON.stringify(b) }); return { status: r.status, j: await r.json().catch(() => ({})), r }; };
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return {}; } };
  const posts = () => calls.filter((c) => c.url === '/api/v1/transaction/refund').length;
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const o = await call('POST', '/api/orders', { pkg: 'cv', consent: true, waiver: true, gateway: 'p24', profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'X', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(o.status, 200, JSON.stringify(o.j));
    const n = { merchantId: MERCHANT, posId: MERCHANT, sessionId: `${o.j.id}.1`, amount: 3900, originAmount: 3900, currency: 'PLN', orderId: 4242, methodId: 154, statement: 'p24' };
    await fetch(U + '/api/p24/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...n, sign: sha({ ...n, crc: CRC }) }) });
    let x; for (let i = 0; i < 80; i++) { x = (await call('GET', `/api/orders/${o.j.id}`)).j; if (x.status === 'done') break; await wait(150); }
    assert.equal(x.status, 'done');
    const login = await fetch(U + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, body: JSON.stringify({ password: 'tajne-haslo-testowe' }) });
    const A = (pth, b) => call('POST', `/api/admin${pth}`, b, { cookie: login.headers.get('set-cookie').split(';')[0], 'X-Admin': '1' });
    const evs = () => Object.values(read('events.json')).filter((e) => e.type === 'zwrot').map((e) => e.message);

    // 1) 409 z listą błędów: powód z error[].message w komunikacie i w Zdarzeniach; próba rozstrzygnięta (bez refundAttempt)
    let r = await A(`/orders/${o.j.id}/refund`, {});
    assert.equal(r.status, 502); assert.match(r.j.error, /Przelewy24 409: Insufficient funds available/);
    await wait(200); assert.ok(evs().some((m) => /^Zwrot nieudany \(Przelewy24\): Przelewy24 409: Insufficient funds available/.test(m)), JSON.stringify(evs()));
    assert.equal(read('orders.json')[o.j.id].refundAttempt, null);
    // 2) 201 ze status:false: powód z data[0].message
    mode = 'reject201'; r = await A(`/orders/${o.j.id}/refund`, {});
    assert.equal(r.status, 502); assert.match(r.j.error, /odrzuciło zwrot: Transaction in wrong status - cannot refund/);
    // nowe identyfikatory przy każdej próbie, w limitach dokumentacji P24
    const reqs = calls.filter((c) => c.url === '/api/v1/transaction/refund').map((c) => c.b);
    assert.notEqual(reqs[0].requestId, reqs[1].requestId); assert.notEqual(reqs[0].refundsUuid, reqs[1].refundsUuid);
    for (const q of reqs) assert.ok(q.requestId.length <= 45 && q.refundsUuid.length <= 35 && q.refunds[0].description.length <= 35 && Number.isInteger(q.refunds[0].amount));

    // 3) zerwane połączenie: próba zostaje do sprawdzenia; ponowne kliknięcie → GET listy, zwrot jest → bez drugiego POST
    mode = 'drop'; r = await A(`/orders/${o.j.id}/refund`, {});
    assert.equal(r.status, 502);
    const att = read('orders.json')[o.j.id].refundAttempt; assert.ok(att?.uuid && att.amount === 3900, 'refundAttempt zapisany');
    const before = posts(); list = [{ batchId: 1, requestId: 'x', amount: 3900, status: 2 }];
    r = await A(`/orders/${o.j.id}/refund`, {});
    assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(posts(), before, 'bez drugiego zlecenia');
    assert.ok(calls.some((c) => c.method === 'GET' && c.url === '/api/v1/refund/by/orderId/4242'));
    const ord = read('orders.json')[o.j.id];
    assert.equal(ord.refunded, 3900); assert.equal(ord.refundAttempt, null); assert.equal(ord.refunds.at(-1).id, att.uuid);
  } finally { srv.kill(); p24.close(); }
});
