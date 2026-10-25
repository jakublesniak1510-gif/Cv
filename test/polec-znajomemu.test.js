import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.SMTP_URL = 'json';
const { sendOrderMail } = await import('../lib/mail.js');
const { myCodeView } = await import('../lib/referral.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PR S: „Znajomy też szuka pracy?” nad istniejącymi przyciskami poleceń (mail, strona dokumentów) i karta kodu na /konto.
test('Mail: nagłówek nad przyciskami (tekst i HTML), 4 języki; widok kodu bez wygasłych', async () => {
  const cv = { name: 'Jan', headline: '', contact: [], summary: '', experience: [], education: [], skills: [] };
  const o = (l) => ({ id: 'abc', pkg: 'cv', addons: {}, myCode: 'KOD-AB12', profile: { name: 'Jan', email: 'j@x.pl' }, results: [{ position: 'Kasjer', lang: 'pl', letter: '', cv }], uiLang: l });
  const m = JSON.parse((await sendOrderMail(o('pl'), 'https://x.pl')).message);
  assert.match(m.text, /Znajomy też szuka pracy\? https:\/\/x\.pl\/\?ref=KOD-AB12/); assert.match(m.html, /<b>Znajomy też szuka pracy\?<\/b><\/p><p>Wyślij link znajomym:/);
  assert.match(JSON.parse((await sendOrderMail(o('en'), 'https://x.pl')).message).text, /Is a friend looking for a job too\?/);
  assert.equal(myCodeView({ id: 'K', amount: 1000, expires: 1 }, 'a@b.pl'), null);
  assert.equal(myCodeView({ id: 'K', amount: 1000, expires: Date.now() + 1e6 }, 'a@b.pl').code, 'K');
});

test('/api/account: myCode z ostatniego gotowego zamówienia; UI: wspólna karta refCard na stronie dokumentów i /konto', async () => {
  const port = 5600 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-friend-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const o = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, createAccount: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] }) })).json();
    await fetch(`${U}/api/orders/${o.id}/demo-pay`, { method: 'POST' });
    let x; for (let i = 0; i < 40; i++) { x = await (await fetch(`${U}/api/orders/${o.id}`)).json(); if (x.status === 'done') break; await wait(200); }
    const login = await fetch(U + '/api/account/from-order', { method: 'POST', headers: { ...H, 'X-Acc': '1' }, body: JSON.stringify({ orderId: o.id }) });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const acc = await (await fetch(U + '/api/account', { headers: { Cookie: cookie, 'X-Acc': '1' } })).json();
    assert.equal(acc.myCode.code, x.myCode.code); assert.equal(acc.myCode.discount, 10);
  } finally { srv.kill(); }
  const app = read('public/app.js');
  assert.match(app, /function drawMyCode\(\) \{ refCard\(\$\('#referral'\), data\.myCode\); \}/);
  assert.match(app, /d\.myCode \? refCard\(el\('section', \{ className: 'referral acct-card' \}\), d\.myCode\) : null/);
  assert.match(app, /el\('b', \{ textContent: 'Znajomy też szuka pracy\?' \}\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Znajomy też szuka pracy?'], l);
});
