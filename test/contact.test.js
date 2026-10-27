import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.CONTACT_EMAIL = 'kontakt@example.test';
const { seoRoutes } = await import('../lib/seo.js');
const base = 'https://example.test';
let srv, U;
before(() => { const app = express(); seoRoutes(app, base); srv = app.listen(0); U = `http://127.0.0.1:${srv.address().port}`; });
after(() => srv.close());

// Wymóg weryfikacji operatora płatności (Przelewy24): zakładka „Kontakt” z pełną nazwą firmy, NIP, adresem, telefonem i e-mailem.
const MUST = ['Jakub Leśniak', 'jednoosobowa działalność gospodarcza', 'NIP', '9731085406', 'REGON', '522084292', 'Winiary 2, 66-010 Nowogród Bobrzański, Polska', '+48 577 151 435', 'href="tel:+48577151435"', 'href="mailto:kontakt@example.test"'];

test('/kontakt: pełne dane firmy, indeksowana strona w mapie strony, dane strukturalne ContactPage', async () => {
  const r = await fetch(`${U}/kontakt`), h = await r.text();
  assert.equal(r.status, 200);
  for (const t of MUST) assert.ok(h.includes(t), t);
  assert.ok(h.includes('<h1>Kontakt</h1>')); assert.doesNotMatch(h, /noindex/); assert.doesNotMatch(h, /\[E-MAIL\]/);
  assert.match(h, /"@type":"ContactPage"/); assert.match(h, /"taxID":"9731085406"/); assert.match(h, /"telephone":"\+48 577 151 435"/);
  assert.ok((await (await fetch(`${U}/sitemap.xml`)).text()).includes(`${base}/kontakt</loc>`));
});

test('Strona główna: sekcja „Kontakt” tylko z e-mailem i linkiem „Dane firmy i kontakt” (dane właściciela tylko na /kontakt, 27.10)', async () => {
  const h = await (await fetch(`${U}/`)).text(), sec = h.slice(h.indexOf('id="kontakt"'), h.indexOf('id="newsletter"'));
  assert.ok(sec.includes('<p class="firm-short">E-mail: <a href="mailto:kontakt@example.test">kontakt@example.test</a><br><a href="/kontakt">Dane firmy i kontakt</a></p>'));
  for (const t of ['Jakub Leśniak', '9731085406', '522084292', 'Winiary', '577 151 435']) assert.ok(!h.includes(t), `strona główna bez: ${t}`);
  assert.doesNotMatch(h, /<!--dane-firmy-->/); assert.ok(!h.includes('href="/#kontakt">Kontakt</a>'));
  assert.ok((h.match(/href="\/kontakt">Kontakt<\/a>/g) || []).length >= 2, 'menu i stopka');
  const about = await (await fetch(`${U}/o-serwisie`)).text();
  for (const t of ['522084292', '577 151 435', '9731085406', 'Leśniak']) assert.ok(!about.includes(t), t);
  assert.ok(about.includes('href="/kontakt"'));
});

test('Stopka (wszystkie strony, 4 języki): bez NIP i telefonu, link „Dane firmy” do /kontakt#dane-firmy obok „Kontakt”', async () => {
  for (const p of ['/', '/en', '/de', '/uk', '/cv/kierowca', '/kreator-cv', '/regulamin']) {
    const h = await (await fetch(U + p)).text(); if (!h.includes('<footer')) continue;
    const f = h.slice(h.indexOf('<footer'), h.indexOf('</footer>'));
    assert.doesNotMatch(f, /NIP|9731085406|577 151 435|Tel\. /, `${p}: stopka bez NIP i telefonu`);
    assert.ok(f.includes('<a href="/kontakt">Kontakt</a><a href="/kontakt#dane-firmy" data-i18n-key="Dane firmy (stopka)">Dane firmy</a>'), `${p}: link „Dane firmy”`);
  }
  const k = await (await fetch(`${U}/kontakt`)).text();
  assert.ok(k.includes('<h2 id="dane-firmy">Dane firmy</h2>'));
  for (const t of MUST) assert.ok(k.includes(t), `/kontakt: ${t}`);
  const fs = await import('node:fs');
  for (const [l, v] of [['en', 'Company details'], ['de', 'Impressum / Anbieterdaten'], ['uk', 'Дані компанії']]) assert.equal(JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8'))['Dane firmy (stopka)'], v, l);
});
