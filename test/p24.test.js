import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Pełna ścieżka płatności na atrapie Przelewy24: rejestracja → powiadomienie z podpisem → verify → dokumenty.
const CRC = 'testcrc123', MERCHANT = 111222, KEY = 'apikey';
const sha = (o) => crypto.createHash('sha384').update(JSON.stringify(o)).digest('hex');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('Przelewy24: rejestracja, powiadomienie, weryfikacja', { timeout: 30_000 }, async () => {
  const calls = [];
  const mock = http.createServer((req, res) => {
    let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
      const b = body ? JSON.parse(body) : {};
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, b });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/v1/transaction/register') {
        const ok = b.sign === sha({ sessionId: b.sessionId, merchantId: MERCHANT, amount: b.amount, currency: 'PLN', crc: CRC });
        return res.end(JSON.stringify(ok ? { data: { token: 'TOKEN1' }, responseCode: 0 } : { error: 'bad sign' }));
      }
      if (req.url === '/api/v1/transaction/verify') {
        const ok = b.sign === sha({ sessionId: b.sessionId, orderId: b.orderId, amount: b.amount, currency: 'PLN', crc: CRC });
        return res.end(JSON.stringify({ data: { status: ok ? 'success' : 'error' } }));
      }
      if (req.url.startsWith('/api/v1/transaction/by/sessionId/')) return res.end(JSON.stringify({ data: { status: 0 } }));
      res.statusCode = 404; res.end('{}');
    });
  }).listen(0);
  const mockPort = mock.address().port, port = 3990 + Math.floor(Math.random() * 9);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-p24-'));
  const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', P24_MERCHANT_ID: String(MERCHANT), P24_CRC: CRC, P24_API_KEY: KEY, P24_BASE_URL: `http://localhost:${mockPort}` }, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 40; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const cfg = await (await fetch(U + '/api/config')).json();
    assert.equal(cfg.demo, false);
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const r = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv', consent: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'X' }] }, ads: [{ title: 'Magazynier', text: ad }] }) })).json();
    assert.equal(r.url, `http://localhost:${mockPort}/trnRequest/TOKEN1`);
    const reg = calls.find((c) => c.url.endsWith('/register'));
    assert.equal(reg.auth, 'Basic ' + Buffer.from(`${MERCHANT}:${KEY}`).toString('base64'));
    assert.equal(reg.b.amount, 3900);
    assert.equal(reg.b.sessionId, `${r.id}.1`);
    assert.match(reg.b.description, new RegExp(r.id));

    const n = { merchantId: MERCHANT, posId: MERCHANT, sessionId: reg.b.sessionId, amount: 3900, originAmount: 3900, currency: 'PLN', orderId: 987654, methodId: 154, statement: 'p24-test' };
    // Fałszywy podpis: odrzucone.
    assert.equal((await fetch(U + '/api/p24/status', { method: 'POST', headers: H, body: JSON.stringify({ ...n, sign: 'x'.repeat(96) }) })).status, 400);
    n.sign = sha({ ...n, crc: CRC });
    assert.equal((await fetch(U + '/api/p24/status', { method: 'POST', headers: H, body: JSON.stringify(n) })).status, 200);
    let o;
    for (let i = 0; i < 40; i++) { o = await (await fetch(`${U}/api/orders/${r.id}`)).json(); if (o.status === 'done') break; await wait(200); }
    assert.equal(o.status, 'done');
    assert.ok(calls.some((c) => c.url.endsWith('/verify') && c.b.orderId === 987654));
  } finally { srv.kill(); mock.close(); }
});
