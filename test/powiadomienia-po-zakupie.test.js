import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Krótszy krok 3 (29.10): w kreatorze tylko 2 powiadomienia (przypomnienie o płatności, oferty pracy); 5 pozostałych
// na stronie dokumentów po zakupie (osobne, odznaczone, zapis od razu); bez powtórzeń „kilka minut” i „faktura”; „W cenie: PDF”.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('Krok 3: dwa powiadomienia, bez powtórzeń; „W cenie: PDF” (Word w dodatkach)', () => {
  const html = read('public/index.html'), app = read('public/app.js');
  const s6 = /<section data-step="6"[\s\S]*?<\/section>/.exec(html)[0], opt = /<div class="mail-box" id="optMail">[\s\S]*?<\/div>\n<\/div>/.exec(s6)[0];
  assert.deepEqual([...opt.matchAll(/<input type="checkbox" id="(\w+)">/g)].map((m) => m[1]), ['payRem', 'wantAlerts']);
  assert.doesNotMatch(s6, /checked/);
  assert.match(app, /const parts = \[what, addons\(\)\.docx \? 'w PDF i Word' : 'w PDF'\]\.map\(tr\);/, '„Dostajesz” bez poprawek i faktury');
  assert.match(app, /box\.hidden = true; \$\('#payTrustList'\)\.hidden = !on;/, 'bez linii pod przyciskiem');
  assert.equal((app.match(/Gotowe zwykle w kilka minut/g) || []).length, 1); assert.equal((app.match(/'Faktura na życzenie'/g) || []).length, 1);
  assert.match(app, /addons\(\)\.docx \? 'Format: PDF i Word \(\.docx\)' : 'W cenie: PDF' \}\)/); assert.doesNotMatch(app, /Wersja Word \(\.docx\) to dodatek/);
});

test('Strona dokumentów: 5 powiadomień do zaznaczenia; zapis /api/orders/:id/notify; stan w zamówieniu; wysyłka bez zmian', async () => {
  const port = 7700 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-notify-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    let up = false; for (let i = 0; i < 200 && !up; i++) { try { await fetch(U + '/api/config'); up = true; } catch { await wait(150); } }
    if (!up) throw new Error('serwer nie wystartował');
    const call = (m, p, b) => fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) }).then(async (r) => ({ status: r.status, j: await r.json().catch(() => ({})) }));
    const P = { name: 'T', email: 't@example.com', experience: [{ title: 'Magazynier', company: 'B' }] }, AD = [{ title: 'Magazynier', text: 'Hurtownia zatrudni magazyniera. Wymagania: doświadczenie, wózki widłowe, praca zmianowa, dokładność i rzetelność.' }];
    const o = (await call('POST', '/api/orders', { consent: true, terms: true, waiver: true, pkg: 'cv', profile: P, ads: AD, reviewAsk: true })).j;
    assert.ok(o.id, JSON.stringify(o));
    assert.equal((await call('POST', `/api/orders/${o.id}/notify`, { key: 'followUp', on: true })).status, 404, 'przed opłaceniem – nie');
    await call('POST', `/api/orders/${o.id}/demo-pay`);
    let st; for (let i = 0; i < 80 && st?.status !== 'done'; i++) { await wait(200); st = (await call('GET', `/api/orders/${o.id}`)).j; }
    assert.equal(st.status, 'done');
    assert.deepEqual(st.notify, { reviewAsk: true, outcomeAsk: false, reminder: false, followUp: false, deleteNotice: false }, 'zgoda z kreatora (stare zamówienia) nadal działa');
    for (const k of ['outcomeAsk', 'followUp', 'deleteNotice']) assert.deepEqual((await call('POST', `/api/orders/${o.id}/notify`, { key: k, on: true })).j, { ok: true, key: k, on: true });
    assert.equal((await call('POST', `/api/orders/${o.id}/notify`, { key: 'reviewAsk', on: false })).j.on, false);
    assert.deepEqual((await call('GET', `/api/orders/${o.id}`)).j.notify, { reviewAsk: false, outcomeAsk: true, reminder: false, followUp: true, deleteNotice: true });
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))[o.id];
    assert.equal(saved.outcomeAsk.text, 'Zapytajcie mnie za 14 dni, czy dostałem(-am) zaproszenie na rozmowę (1 wiadomość).'); assert.ok(saved.outcomeAsk.at);
    assert.deepEqual([saved.followUp.consent, saved.followUp.sent, saved.deleteNotice.off], [true, false, false]);
    assert.equal((await call('POST', `/api/orders/${o.id}/notify`, { key: 'payReminder', on: true })).status, 400, 'tylko 5 powiadomień po zakupie');
    assert.equal((await call('POST', `/api/orders/${o.id}/notify`, { key: 'followUp', on: 'tak' })).status, 400);
  } finally { srv.kill(); }
  const app = read('public/app.js');
  assert.match(app, /drawUpsell\(\); drawXsell\(\); drawNotify\(\);/);
  for (const k of ['reviewAsk', 'outcomeAsk', 'reminder', 'followUp', 'deleteNotice']) assert.match(app, new RegExp(`\\['${k}', "`));
});
