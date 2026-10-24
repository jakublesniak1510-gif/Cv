import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Zwrot P24 ponowiony z tymi samymi identyfikatorami: P24 odpowiada 400 „Request already exists”. Wtedy sprawdzamy
// listę zwrotów transakcji (GET /refund/by/orderId) i uznajemy zwrot za zlecony, jeśli jest; bez listy (404/403) też.
process.env.DATA_DIR ||= fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-p24r-'));
const { p24Refund } = await import('../lib/p24.js');

function mock(listReply) {
  const calls = [];
  const srv = http.createServer(async (req, res) => {
    let b = ''; for await (const c of req) b += c;
    calls.push({ method: req.method, url: req.url, b: b ? JSON.parse(b) : null });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/v1/transaction/refund') { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Request already exists', code: 400 })); }
    if (req.url.startsWith('/api/v1/refund/by/orderId/')) { const [code, body] = listReply(calls); res.statusCode = code; return res.end(JSON.stringify(body)); }
    res.statusCode = 404; res.end('{}');
  }).listen(0);
  Object.assign(process.env, { P24_MERCHANT_ID: '123', P24_CRC: 'crc', P24_API_KEY: 'key', P24_BASE_URL: `http://localhost:${srv.address().port}` });
  return { srv, calls };
}
const args = { orderId: 'ecec67e4-0000', sessionId: 'ecec67e4-0000.1', p24OrderId: '777', amount: 3900, already: 0 };

test('„Request already exists” + zwrot tej kwoty na liście → sukces (idempotentnie), bez drugiego zlecenia', async () => {
  const m = mock(() => [200, { data: { orderId: 777, refunds: [{ requestId: 'inny', amount: 3900, status: 0 }] } }]);
  try {
    const r = await p24Refund(args);
    assert.equal(r.status, 'requested'); assert.equal(r.existing, true); assert.match(r.id, /^[0-9a-f]{8}-[0-9a-f]{4}-/);
    assert.equal(m.calls.filter((c) => c.url === '/api/v1/transaction/refund').length, 1);
    assert.equal(m.calls.find((c) => c.url.startsWith('/api/v1/refund/by/orderId/')).url, '/api/v1/refund/by/orderId/777');
  } finally { m.srv.close(); }
});

test('Zgodny requestId na liście też wystarcza; brak zwrotu tej kwoty → czytelny błąd', async () => {
  let m = mock((calls) => [200, { data: { refunds: [{ requestId: calls[0].b.requestId, amount: 1 }] } }]);
  try { assert.equal((await p24Refund(args)).existing, true); } finally { m.srv.close(); }
  m = mock(() => [200, { data: { refunds: [{ requestId: 'inny', amount: 1000 }] } }]);
  try { await assert.rejects(p24Refund(args), /na liście zwrotów transakcji nie ma zwrotu tej kwoty/); } finally { m.srv.close(); }
});

test('Lista zwrotów niedostępna: 404/403 → uznany za zlecony; 500 → błąd z prośbą o sprawdzenie w panelu P24', async () => {
  for (const code of [404, 403]) {
    const m = mock(() => [code, { error: 'Not found' }]);
    try { assert.equal((await p24Refund(args)).existing, true, String(code)); } finally { m.srv.close(); }
  }
  const m = mock(() => [500, { error: 'Server error' }]);
  try { await assert.rejects(p24Refund(args), /Sprawdź zwrot w panelu Przelewy24/); } finally { m.srv.close(); }
});

test('Inny błąd 400 przy zwrocie nie jest maskowany', async () => {
  const calls = [];
  const srv = http.createServer((req, res) => { calls.push(req.url); res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'Invalid amount' })); }).listen(0);
  process.env.P24_BASE_URL = `http://localhost:${srv.address().port}`;
  try { await assert.rejects(p24Refund(args), /Przelewy24 400: Invalid amount/); assert.ok(!calls.some((u) => u.includes('/refund/by/'))); }
  finally { srv.close(); for (const k of ['P24_MERCHANT_ID', 'P24_CRC', 'P24_API_KEY', 'P24_BASE_URL']) delete process.env[k]; }
});
