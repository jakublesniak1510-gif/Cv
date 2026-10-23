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

test('Eksperyment „checkout”: włączany EXPERIMENTS, wariant B oznacza kreator (także razem z „wizard_order”)', () => {
  assert.deepEqual(activeExperiments('{"checkout":50}'), { checkout: 50 });
  assert.deepEqual(activeExperiments(''), {}, 'domyślnie wyłączony');
  const html = read('public/index.html');
  assert.match(EXPERIMENTS.checkout.apply(html), /<div id="wiz" class="wiz" data-checkout="b" hidden/);
  const both = EXPERIMENTS.checkout.apply(EXPERIMENTS.wizard_order.apply(html));
  assert.match(both, /<div id="wiz" class="wiz" data-checkout="b" data-order="b" hidden/);
});

test('Wariant B: cena na górze, jedno pole zgód z pełną treścią art. 38 pkt 13, zgody marketingowe osobno i odznaczone', () => {
  const html = read('public/index.html'), app = read('public/app.js'), srv = read('server.js');
  const combined = strip(/<label class="check" id="consentAllBox" hidden><input type="checkbox" id="consentAll"> <span>([\s\S]*?)<\/span><\/label>/.exec(html)[1]);
  const server = /const CONSENT_COMBINED = '([^']+)';/.exec(srv)[1];
  assert.equal(combined, server, 'treść w formularzu = treść zapisywana przy zamówieniu');
  assert.ok(server.includes('Akceptuję Regulamin') && server.includes('Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.'), 'obie zgody w pełnym brzmieniu');
  assert.doesNotMatch(/id="consentAll"[^>]*>/.exec(html)[0], /checked/, 'odznaczone');
  assert.match(html, /<div class="sum-top" id="sumTop" hidden>/);
  // marketing: osobne pola, odznaczone, zwinięte – bez zmian w wariancie B
  const opt = /<details class="optbox" id="optMail">([\s\S]*?)<\/details>/.exec(html)[1];
  for (const id of ['reviewAsk', 'outcomeAsk', 'payRem', 'reminder', 'wantAlerts', 'followUp']) assert.match(opt, new RegExp(`<input type="checkbox" id="${id}">`), id);
  assert.match(app, /const CHECKOUT_B = document\.getElementById\('wiz'\)\?\.dataset\.checkout === 'b';/);
  assert.match(app, /\$\('#consentAll'\)\.addEventListener\('change', \(e\) => \{ \$\('#consent'\)\.checked = \$\('#waiver'\)\.checked = e\.target\.checked; \}\)/);
  assert.match(app, /\.\.\.\(CHECKOUT_B \? \{ consentForm: 'combined' \} : \{\}\)/);
  assert.match(app, /className: 'payico'/, 'metody płatności jako ikony');
  for (const l of ['en', 'uk', 'de']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[server.replace(/^Akceptuję Regulamin i Politykę prywatności/, '')], `${l}: tłumaczenie`);
});

test('Raport A/B: konwersja ostatni krok → opłacone per wariant i test istotności', () => {
  const ab = { 'checkout:A': { visit: 400, start: 100, last: 50, checkout: 40, paid: 20 }, 'checkout:B': { visit: 400, start: 100, last: 50, checkout: 45, paid: 32 } };
  const [e] = abReport(ab, { checkout: 50 });
  assert.equal(e.id, 'checkout'); assert.deepEqual(e.variants.map((r) => r.lastPaidRate), [40, 64]);
  assert.ok(e.lastPaid.p < 0.05, `p=${e.lastPaid.p}`);
  assert.match(abText([e]), /ostatni krok 50 → opłacone 40%[\s\S]*ostatni krok 50 → opłacone 64%[\s\S]*p \(ostatni krok → opłacone\) = /);
  assert.match(read('public/admin.js'), /'% ostatni krok → opłacone'/);
});

test('Zamówienie z wariantu B zapisuje treść połączonej zgody; wariant A – dotychczasową', async () => {
  const port = 4400 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-abco-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const order = (extra) => fetch(U + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }], ...extra }) }).then((r) => r.json());
    const b = await order({ consentForm: 'combined' }), a = await order({}), x = await order({ consentForm: 'cokolwiek' });
    await wait(300);
    const all = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8')), get = (id) => all[id] || Object.values(all).find((o) => o.id === id);
    const combined = /const CONSENT_COMBINED = '([^']+)';/.exec(read('server.js'))[1];
    assert.equal(get(b.id).waiver.text, combined); assert.equal(get(b.id).waiver.form, 'combined');
    assert.match(get(a.id).waiver.text, /^Chcę, aby usługa/); assert.equal(get(a.id).waiver.form, undefined);
    assert.match(get(x.id).waiver.text, /^Chcę, aby usługa/, 'nieznana wartość → treść wariantu A');
  } finally { srv.kill(); }
});
