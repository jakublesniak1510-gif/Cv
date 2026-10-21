import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

// /api/config (też health check Rendera) nie może czekać na Stripe: metody płatności z pamięci, odświeżanie w tle (limit 3 s).
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('/api/config odpowiada od razu, gdy API Stripe wisi; metody uzupełniają się w tle', async () => {
  let mode = 'hang';
  const mock = http.createServer((req, res) => {
    if (mode === 'hang') return; // brak odpowiedzi
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: [{ is_default: true, active: true, blik: { available: true, display_preference: { value: 'on' } }, card: { available: true, display_preference: { value: 'on' } } }] }));
  }).listen(0);
  const port = 5900 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-pm-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', P24_MERCHANT_ID: '', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x', STRIPE_API_BASE: `http://localhost:${mock.address().port}`, SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/health'); break; } catch { await wait(150); } }
    const t = Date.now(), c = await (await fetch(U + '/api/config')).json();
    assert.ok(Date.now() - t < 1000, `odpowiedź w ${Date.now() - t} ms`);
    assert.deepEqual(c.pay, { provider: 'Stripe', methods: [] });
  } finally { srv.kill(); mock.close(); mock.closeAllConnections?.(); }

  // W procesie: odświeżenie (z limitem 3 s) wypełnia listę, a stripeMethods() zwraca ją bez czekania.
  mode = 'ok';
  const ON = { available: true, display_preference: { value: 'on' } };
  const m2 = http.createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ data: [{ is_default: true, active: true, blik: ON, card: ON, apple_pay: ON, google_pay: ON, p24: { available: false, display_preference: { value: 'on' } }, link: { available: true, display_preference: { value: 'off' } } }] })); }).listen(0);
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'; process.env.STRIPE_API_BASE = `http://localhost:${m2.address().port}`;
  try {
    const { stripeMethods, refreshStripeMethods } = await import('../lib/stripe.js');
    assert.deepEqual(stripeMethods(), [], 'pierwsze wywołanie nie czeka');
    assert.deepEqual(await refreshStripeMethods(), ['BLIK', 'karta', 'Apple Pay / Google Pay']);
    assert.deepEqual(stripeMethods(), ['BLIK', 'karta', 'Apple Pay / Google Pay']);
  } finally { m2.close(); delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_API_BASE; }
  assert.match(fs.readFileSync('lib/stripe.js', 'utf8'), /call\('GET', '\/payment_method_configurations\?limit=20', null, \{\}, 3000\)/, 'limit 3 s');
});
