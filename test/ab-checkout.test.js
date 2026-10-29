import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { EXPERIMENTS, activeExperiments, abReport, abText } from '../lib/ab.js';

// Test A/B „checkout”: wariant B ostatniego kroku kreatora (tylko kod; włączenie zmienną EXPERIMENTS).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => h.replace(/<[^>]+>/g, '');

test('Eksperyment „checkout”: włączany EXPERIMENTS, wariant B oznacza kreator; „wizard_order” zakończony (C3)', () => {
  assert.deepEqual(activeExperiments('{"checkout":50}'), { checkout: 50 });
  assert.deepEqual(activeExperiments(''), {}, 'domyślnie wyłączony');
  const html = read('public/index.html');
  assert.match(EXPERIMENTS.checkout.apply(html), /<div id="wiz" class="wiz" data-checkout="b" hidden/);
  assert.equal(EXPERIMENTS.wizard_order, undefined, 'kreator na 3 ekrany zastąpił test kolejności');
  assert.deepEqual(activeExperiments('{"wizard_order":50,"checkout":50}'), { checkout: 50 }, 'stara wartość w EXPERIMENTS jest pomijana');
});

test('Wariant B: zgody kompaktowo (29.10: bez górnej ramki „Do zapłaty” w obu wariantach), ale nadal DWA osobne pola (art. 38 pkt 13 osobno, odznaczone), marketing bez zmian', () => {
  const html = read('public/index.html'), app = read('public/app.js'), srv = read('server.js');
  assert.ok(!html.includes('consentAll'), 'bez połączonego pola');
  const consent = /<label class="check"><input type="checkbox" id="consent">[\s\S]*?<\/label>/.exec(html)[0], waiver = /<label class="check"><input type="checkbox" id="waiver"> <span>([^<]+)<\/span><\/label>/.exec(html);
  assert.ok(waiver, 'osobne pole zgody z art. 38 pkt 13');
  assert.equal(waiver[1], /const WAIVER = '([^']+)';/.exec(srv)[1], 'treść w formularzu = treść zapisywana');
  assert.ok(!/checked/.test(consent) && !/id="waiver" checked/.test(html), 'odznaczone');
  assert.doesNotMatch(consent, /odstąpienia/, 'regulamin bez zgody na utratę prawa odstąpienia');
  assert.doesNotMatch(html, /id="sumTop"|id="totalTop"/, 'kwota tylko na dole przy „Razem”');
  const opt = /<div class="mail-box" id="optMail">([\s\S]*?)<\/div>\n<\/div>\n<\/section>/.exec(html)[1];
  for (const id of ['reviewAsk', 'outcomeAsk', 'payRem', 'reminder', 'wantAlerts', 'followUp']) assert.match(opt, new RegExp(`<input type="checkbox" id="${id}">`), id);
  assert.match(app, /const CHECKOUT_B = document\.getElementById\('wiz'\)\?\.dataset\.checkout === 'b';/);
  assert.match(app, /for \(const id of \['consent', 'waiver'\]\) \$\('#' \+ id\)\.closest\('label'\)\.classList\.add\('compact'\)/);
  assert.doesNotMatch(app, /\$\('#consent'\)\.checked = \$\('#waiver'\)\.checked/, 'jedno kliknięcie nie zaznacza obu zgód');
  assert.match(app, /\.\.\.\(CHECKOUT_B \? \{ consentForm: 'compact' \} : \{\}\)/);
  assert.match(app, /className: 'payico'/, 'metody płatności jako ikony');
});

test('Raport A/B: konwersja ostatni krok → opłacone per wariant i test istotności', () => {
  const ab = { 'checkout:A': { visit: 400, start: 100, last: 50, checkout: 40, paid: 20 }, 'checkout:B': { visit: 400, start: 100, last: 50, checkout: 45, paid: 32 } };
  const [e] = abReport(ab, { checkout: 50 });
  assert.equal(e.id, 'checkout'); assert.deepEqual(e.variants.map((r) => r.lastPaidRate), [40, 64]);
  assert.ok(e.lastPaid.p < 0.05, `p=${e.lastPaid.p}`);
  assert.match(abText([e]), /ostatni krok 50 → opłacone 40%[\s\S]*ostatni krok 50 → opłacone 64%[\s\S]*p \(ostatni krok → opłacone\) = /);
  assert.match(read('public/admin.js'), /'% ostatni krok → opłacone'/);
});

test('Zamówienie: ta sama treść zgody z art. 38 pkt 13 w obu wariantach, w B oznaczony formularz „compact”', async () => {
  const port = 4400 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-abco-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const order = (extra) => fetch(U + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }], ...extra }) }).then((r) => r.json());
    const b = await order({ consentForm: 'compact' }), a = await order({}), x = await order({ consentForm: 'combined' });
    await wait(300);
    const all = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8')), get = (id) => all[id] || Object.values(all).find((o) => o.id === id);
    const W = /const WAIVER = '([^']+)';/.exec(read('server.js'))[1];
    assert.equal(get(b.id).waiver.text, W); assert.equal(get(b.id).waiver.form, 'compact');
    assert.equal(get(a.id).waiver.text, W); assert.equal(get(a.id).waiver.form, undefined);
    assert.equal(get(x.id).waiver.text, W); assert.equal(get(x.id).waiver.form, undefined, 'nieznana wartość pomijana');
  } finally { srv.kill(); }
});
