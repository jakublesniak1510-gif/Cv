import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-ux1-'));
const { seoRoutes } = await import('../lib/seo.js');
const { passRoutes } = await import('../lib/passes.js');
const { plural } = await import('../lib/plural.js');
const { methodNames } = await import('../lib/stripe.js');
const read = (f) => fs.readFileSync(f, 'utf8');
const html = read('public/index.html'), css = read('public/style.css'), app = read('public/app.js');

// Poprawki z przeglądu UX zakupu na telefonie i audytu wydajności.
test('Formularze i zgody na telefonie: pola 16px, checkbox 22px, cele dotykowe 44px, opcjonalne e-maile zwinięte', () => {
  assert.match(css, /input:not\(\[type=checkbox\]\)[^{]*,select,textarea\{font-size:16px!important\}/);
  assert.match(css, /\.check input\[type=checkbox\],\.check input\[type=radio\]\{width:22px;height:22px/);
  assert.match(css, /\.check\{min-height:44px/);
  for (const r of [/details>summary\{min-height:44px/, /\.rm\{min-height:44px/, /#toPack\{min-height:44px\}/, /\.chipsel button,\.more a,\.prof-results a\{min-height:44px\}/, /\.foot-cols a\{display:flex;align-items:center;min-height:44px\}/]) assert.match(css, r);
  const step6 = /<section data-step="6"[\s\S]*?<\/section>/.exec(html)[0], opt = /<details class="optbox" id="optMail">[\s\S]*?<\/details>/.exec(step6)[0];
  assert.match(opt, /<summary>Powiadomienia e-mail \(opcjonalnie\)<\/summary>/);
  for (const id of ['reviewAsk', 'payRem', 'reminder', 'wantAlerts', 'followUp']) assert.ok(opt.includes(`id="${id}"`), `${id} w zwiniętej sekcji`);
  for (const id of ['wantInv', 'consent', 'waiver']) assert.ok(step6.includes(`id="${id}"`) && !opt.includes(`id="${id}"`), `${id} na wierzchu`);
  assert.match(step6, /Akceptuję <a href="\/regulamin"[^>]*>Regulamin<\/a> i <a href="\/polityka-prywatnosci"[^>]*>Politykę prywatności<\/a>\./);
  assert.match(step6, /raz w tygodniu/); assert.doesNotMatch(html, /co poniedziałek|zapoznałem|zapomniałeś wpisać/);
});

test('Płatność: linia zaufania z metodami włączonymi w Stripe, „Zapłać” w jednej linii', () => {
  const ON = { available: true, display_preference: { value: 'on' } };
  assert.deepEqual(methodNames({ blik: ON, card: ON, apple_pay: ON, google_pay: ON, p24: { available: false, display_preference: { value: 'on' } } }), ['BLIK', 'karta', 'Apple Pay / Google Pay'], 'P24 „Ineligible” pominięte');
  assert.deepEqual(methodNames({ card: ON, blik: { available: true, display_preference: { value: 'off' } } }), ['karta'], 'wyłączona w panelu pominięta');
  assert.deepEqual(methodNames(null), []);
  assert.match(html, /<button type="submit" class="btn" id="next">Dalej<\/button><p class="paytrust" id="payTrust" hidden><\/p>/);
  assert.match(app, /bezpieczna płatność przez \$\{g\.provider\}/); assert.match(app, /dokumenty zwykle gotowe w kilka minut/); assert.match(app, /PDF także na e-mail/);
  assert.match(css, /#next\{white-space:nowrap\}/); assert.match(css, /\.wiz-foot\.pay #back\{font-size:0/);
});

test('Baner cookies kompaktowy wszędzie (1 linia + 2 przyciski), bez wymuszania zgody', () => {
  const c = read('public/consent.js');
  assert.match(css, /\.consent\{bottom:calc\(8px[^}]*padding:8px 12px/);
  assert.match(css, /\.consent p span\{display:none\}\.consent-btns\{flex:1\}\.consent-btns \.btn\{flex:1\}/);
  assert.match(c, /data-c="denied">Tylko niezbędne/);
  assert.match(c, /<span>Google i Meta do pomiaru reklam – tylko za Twoją zgodą\.<\/span>/);
});

test('Strona główna: „Przed i po” jako druga sekcja, nowy podtytuł i mikrotekst hero, UA hero, „Zobacz więcej przykładów”, Word w „Jak to działa”', async () => {
  const srv = express(); seoRoutes(srv, 'https://example.test');
  const s = srv.listen(0), U = `http://127.0.0.1:${s.address().port}`;
  try {
    const h = await (await fetch(U + '/')).text();
    const secs = [...h.matchAll(/<section class="[^"]*" id="([\w-]+)"/g)].map((m) => m[1]);
    assert.deepEqual(secs.slice(0, 3), ['top', 'przed-po', 'skaner']);
    assert.match(h, /<p class="lead">Wklejasz ogłoszenie i swoje doświadczenie – dostajesz CV i list ze słowami, których szuka rekruter\.<\/p>/);
    assert.match(h, /<p class="hero-micro">BLIK lub karta · bez subskrypcji<\/p>/);
    assert.match(h, /<p class="eyebrow">Zobacz więcej przykładów<\/p>\s*<h2>To samo doświadczenie, trzy różne CV/);
    assert.match(h, /W cenie: PDF\. Wersja Word \(\.docx\): \+9 zł\./);
    // Słownik UA: hero po ukraińsku zgodnie z ustaleniem.
    assert.equal(JSON.parse(read('public/i18n/uk.json'))['Wklejasz ogłoszenie i swoje doświadczenie – dostajesz CV i list ze słowami, których szuka rekruter.'], 'Заповнюєте українською – отримуєте резюме польською, під конкретне оголошення.');
    // Wydajność: skrypty z defer, słownik z wersją i preload, gotowy HTML z pamięci (ten sam przy kolejnym wejściu).
    assert.match(h, /<script src="\/consent\.js\?v=\w+" defer><\/script>\n<script src="\/app\.js\?v=\w+" defer><\/script>/);
    const en = await (await fetch(U + '/en')).text();
    assert.match(en, /<link rel="preload" href="\/i18n\/en\.json\?v=\w+" as="fetch" crossorigin><script>window\.__LANG="en";window\.__I18N_V="\w+"<\/script><script src="\/i18n\.js/);
    assert.equal(await (await fetch(U + '/en')).text(), en);
    const { PROF_LANGS } = await import('../lib/professions-i18n.js');
    const sub = await (await fetch(`${U}/de/${PROF_LANGS.de.seg}/${PROF_LANGS.de.prof.kasjer.slugLang}`)).text();
    assert.match(sub, /<link rel="preload" href="\/i18n\/de\.json\?v=\w+" as="fetch" crossorigin><script>window\.__LANG="de";window\.__I18N_V=/, 'podstrona w języku też z preload');
  } finally { s.close(); }
  assert.match(read('public/i18n.js'), /fetch\(`\/i18n\/\$\{lang\}\.json\$\{window\.__I18N_V \? `\?v=\$\{window\.__I18N_V\}` : ''\}`\)/);
});

test('Skaner: zakładka „Wklej tekst CV” i CTA pod wynikiem; ogłoszenie w kreatorze na telefonie domyślnie „Wklej treść”; ?zawod', () => {
  assert.match(app, /\[\['file', 'Wybierz plik'\], \['text', 'Wklej tekst CV'\]\]/);
  assert.match(app, /const b64 = file \? await fileB64\(file\) : textB64\(pasted\);/);
  assert.match(app, /className: 'btn sm scan-cta', onclick: scanCta \}, el\('span', \{ textContent: 'Zrób CV dopasowane do tego ogłoszenia – od' \}\)/);
  assert.match(app, /matchMedia\('\(max-width: 640px\)'\)\.matches \? 'paste' : 'link'/);
  assert.match(html, /Jeśli link się nie wczyta, wklej treść ogłoszenia – zajmie to chwilę\./);
  assert.match(app, /const zaw = q\.get\('zawod'\)/);
  // Tekst CV jako TXT w base64 (ten sam import i skaner na serwerze), także z polskimi znakami.
  const textB64 = (t) => { const b = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
  assert.equal(Buffer.from(textB64('Zażółć gęślą jaźń'), 'base64').toString('utf8'), 'Zażółć gęślą jaźń');
});

test('Odmiana liczebników i /karnety: h2 przed h3, „3 symulatory”, „1 przygotowanie”, „2 przygotowania”, „10 symulatorów”', async () => {
  assert.equal(plural(1, 'symulator', 'symulatory', 'symulatorów'), 'symulator');
  assert.equal(plural(3, 'symulator', 'symulatory', 'symulatorów'), 'symulatory');
  assert.equal(plural(10, 'symulator', 'symulatory', 'symulatorów'), 'symulatorów');
  assert.equal(plural(12, 'przygotowanie', 'przygotowania', 'przygotowań'), 'przygotowań');
  assert.equal(plural(22, 'przygotowanie', 'przygotowania', 'przygotowań'), 'przygotowania');
  const srv = express(); passRoutes(srv, { BASE_URL: 'https://example.test' });
  const s = srv.listen(0);
  try {
    const h = await (await fetch(`http://127.0.0.1:${s.address().port}/karnety`)).text();
    const heads = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
    for (let i = 1; i < heads.length; i++) assert.ok(heads[i] <= heads[i - 1] + 1, `nagłówki bez przeskoku: ${heads.join(',')}`);
    assert.doesNotMatch(h, /\b[2-4] symulatorów|\b[2-4] przygotowań|\b1 przygotowania|\b1 symulatorów/);
  } finally { s.close(); }
});
