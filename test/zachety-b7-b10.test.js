import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Blok B (26.10), B7–B10: pasek zaufania w kroku 1, okno „Zanim wyjdziesz” (raz na 7 dni), przypomnienie o szkicu (już było), przykład CV dla zawodu.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-b710-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, funnelRange, funnelText } = await import('../lib/analytics.js');
const { wizardDraftRoutes, REMIND_AFTER } = await import('../lib/wizard-drafts.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html'), server = read('server.js');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

test('B7: pasek zaufania w kroku 1 – metody z bramek, faktura, 30 dni, poprawki, link „Dane firmy” do /kontakt (bez nazwiska i NIP, 27.10)', () => {
  assert.match(html, /<\/div>\n<p class="trust1" id="trust1" hidden><\/p>/);
  assert.doesNotMatch(server, /seller: \{ name: seller\(\)\.name/, 'dane właściciela nie trafiają do /api/config');
  assert.match(app, /payGateways\(\)\.flatMap\(\(g\) => g\.methods \|\| \[\]\)/);
  for (const t of ["'faktura na życzenie'", "'dane usuwane po 30 dniach'", "plural(rev, 'poprawka w cenie', 'poprawki w cenie', 'poprawek w cenie')", "el('a', { href: '/kontakt', textContent: 'Dane firmy' })"]) assert.ok(app.includes(t), t);
  assert.match(app, /drawPromo\(c\.promo\); drawTrust1\(\);/);
});

test('B8: „Zanim wyjdziesz” – skaner, bez rabatu i odliczania, raz na 7 dni; komputer (kursor w górę) i „wstecz” z kreatora na telefonie', () => {
  const box = app.slice(app.indexOf('function exitBox()'), app.indexOf('function exitOffer('));
  assert.match(box, /Zanim wyjdziesz: sprawdź za darmo, ile wymagań z ogłoszenia spełnia Twoje CV/);
  assert.doesNotMatch(box, /rabat|zniżk|%|kod|odlicz|tylko dziś|zł/i);
  assert.match(app, /const EXIT_KEY = 'cvpo-exit', EXIT_EVERY = 7 \* 864e5/);
  assert.match(app, /if \(!touchUi && !e\.relatedTarget && e\.clientY <= 0 /);
  assert.match(app, /history\.pushState\(\{ \.\.\.\(history\.state \|\| \{\}\), wiz: 1 \}, '', location\.href\)/);
  assert.match(app, /if \(wizPushed && !\$\('#wiz'\)\.hidden && !e\.state\?\.wiz\) \{ wizPushed = false; e\.stopImmediatePropagation\(\); closeWiz\(\); exitOffer\('back'\); return; \}/);
  assert.ok(app.indexOf("exitOffer('back')") < app.indexOf("window.addEventListener('popstate', () => route());"), 'obsługa „wstecz” przed routerem');
  assert.match(app, /track\('exitoffer', \{ t: src \}\)/);
  assert.match(app, /\$\('#skaner'\)\.scrollIntoView/);
});

test('B9: przypomnienie o szkicu już działa – tylko z osobną zgodą, raz, po 2 h; nowe zdarzenie reminder_optin', async () => {
  assert.equal(REMIND_AFTER, 2 * 3600e3);
  assert.match(html, /<input type="checkbox" id="slRemind">/, 'pole niezaznaczone');
  const a = express(); wizardDraftRoutes(a, { BASE_URL: 'https://example.test', DEMO: true });
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const remind of [true, false]) {
      const r = await fetch(U + '/api/wizard-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `a${remind}@example.com`, remind, lang: 'pl', data: { step: 2 } }) });
      assert.equal(r.status, 200, await r.clone().text());
    }
    await new Promise((r) => setTimeout(r, 200));
    const d = Object.values(await analyticsDays())[0];
    assert.equal(d.events.draft_saved, 2); assert.equal(d.events.reminder_optin, 1);
    assert.match(funnelText(await funnelRange(d.id, d.id)), /zgody na przypomnienie 1/);
  } finally { srv.close(); }
});

test('B10: przykład CV dla zawodu w kroku 1 – lista zawodów, okno ze znakiem wodnym, „Zrób takie dla mojego ogłoszenia” wraca do kreatora', () => {
  assert.match(html, /<div class="prof-ex" id="profEx" hidden><label class="f">Zobacz przykład CV dla Twojego zawodu/);
  assert.match(app, /exProf = await loadProf\(slug\); if \(!exProf\?\.sample\) throw new Error\(\);/);
  assert.match(app, /if \(exProf\) return profResult\(exProf\);/);
  assert.match(app, /function openEx\(i = 0, d\) \{ \$\('#exPaper'\)\.style\.setProperty\('--wm', wmUrl\(tr\('PRZYKŁAD'\)\)\);/, 'znak wodny jak w przykładach (A5)');
  assert.match(app, /'Zrób takie dla mojego ogłoszenia'/);
  assert.match(app, /if \(fromProf && !\$\('#wiz'\)\.hidden\) \{/);
});

test('Zdarzenia exit_offer (komputer / „wstecz”), klik w skaner i prof_example – raz na osobę, w raporcie lejka; i18n', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, b) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(b) });
  try {
    for (const b of [{ e: 'exitoffer', t: 'desk' }, { e: 'exitoffer', t: 'desk' }, { e: 'exitclick' }, { e: 'profex' }]) await t('Mozilla/5.0 X1', b);
    await t('Mozilla/5.0 X2', { e: 'exitoffer', t: 'back' });
    await new Promise((r) => setTimeout(r, 300));
    const d = Object.values(await analyticsDays())[0];
    assert.equal(d.events.exit_offer, 2); assert.equal(d.events['exit_offer:desk'], 1); assert.equal(d.events['exit_offer:back'], 1); assert.equal(d.events.exit_offer_click, 1); assert.equal(d.events.prof_example, 1);
    assert.match(funnelText(await funnelRange(d.id, d.id)), /Zanim wyjdziesz: pokazane 2 \(komputer 1, „wstecz” na telefonie 1\), klik w skaner 1\. Przykład CV dla zawodu \(krok 1\): 1\./);
  } finally { srv.close(); }
  for (const l of ['en', 'de', 'uk']) for (const k of ['dane usuwane po 30 dniach', 'Zobacz przykład CV dla Twojego zawodu', 'Wybierz zawód', 'Zrób takie dla mojego ogłoszenia', 'Zanim wyjdziesz: sprawdź za darmo, ile wymagań z ogłoszenia spełnia Twoje CV', 'Sprawdź moje CV za darmo', 'Nie, dziękuję', 'Przykład CV dla Twojego zawodu']) assert.ok(dict(l)[k], `${l}: ${k}`);
});
