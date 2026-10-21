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

test('Strona główna: sekcja „Kontakt” z danymi firmy, menu i stopka prowadzą do /kontakt', async () => {
  const h = await (await fetch(`${U}/`)).text(), sec = h.slice(h.indexOf('id="kontakt"'), h.indexOf('id="newsletter"'));
  assert.ok(sec.includes('Dane firmy'));
  for (const t of MUST) assert.ok(sec.includes(t), `sekcja Kontakt: ${t}`);
  assert.doesNotMatch(h, /<!--dane-firmy-->/); assert.ok(!h.includes('href="/#kontakt">Kontakt</a>'));
  assert.ok((h.match(/href="\/kontakt">Kontakt<\/a>/g) || []).length >= 2, 'menu i stopka');
  const about = await (await fetch(`${U}/o-serwisie`)).text();
  for (const t of ['522084292', '+48 577 151 435', 'href="/kontakt"']) assert.ok(about.includes(t), t);
});
