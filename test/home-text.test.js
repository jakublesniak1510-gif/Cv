import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { PRICES } from '../lib/pricing.js';

// Strona główna dla fraz ogólnych: sekcja tekstowa „CV pod ogłoszenie, a nie kolejny szablon” i 5 nowych pytań w FAQ (FAQPage).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const html = read('public/index.html');
const sec = /<section class="sec" id="cv-pod-ogloszenie">([\s\S]*?)<\/section>/.exec(html)?.[1] || '';
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const NEW_Q = ['Czym CV pod ogłoszenie różni się od szablonu CV?', 'Czy to generator CV online?', 'Ile kosztuje CV pod ogłoszenie?', 'Co sprawdza darmowy skaner CV?', 'Jak sprawdzić dopasowanie CV do oferty pracy?'];
const zl = (gr) => `${gr / 100} zł`;

test('Sekcja tekstowa: 300–650 słów razem z nowymi pytaniami, frazy naturalnie, ceny z cennika, bez obietnic', () => {
  assert.ok(sec, 'sekcja jest');
  const faq = NEW_Q.map((q) => new RegExp(`<details><summary>${q.replace(/\?/g, '\\?')}</summary><p>([^<]+)</p></details>`).exec(html)?.[1]);
  assert.ok(faq.every(Boolean), 'pytania w FAQ');
  const all = `${text(sec)} ${NEW_Q.join(' ')} ${faq.join(' ')}`, n = all.split(' ').length;
  assert.ok(n >= 400 && n <= 650, `słów: ${n}`);
  for (const k of [/generator CV/i, /CV online/i, /kreator/i, /CV pod ogłoszenie/i, /dopasowanie CV do oferty/i]) assert.match(all, k);
  // bez upychania: każda fraza najwyżej 4 razy
  for (const k of [/generator CV/gi, /CV online/gi, /dopasowanie CV do oferty/gi]) assert.ok((all.match(k) || []).length <= 4, String(k));
  for (const [k, gr] of [['cv', PRICES.cv], ['cv_letter', PRICES.cv_letter], ['pack3', PRICES.pack3], ['docx', PRICES.docx], ['extraLang', PRICES.extraLang]]) assert.ok(all.includes(zl(gr)), `${k}: ${zl(gr)} z cennika`);
  assert.match(all, /PDF/); assert.match(all, /Word/);
  // budżet rozmiaru zamiast Lighthouse w CI: strona główna (HTML bez kompresji) do 90 kB (przed sekcją 79 kB)
  assert.ok(Buffer.byteLength(html) <= 90e3, `index.html: ${Buffer.byteLength(html)} B`);
  assert.doesNotMatch(all, /gwarant|najlepsz|zatrudnien|dostaniesz pracę/i);
});

test('FAQPage na stronie głównej zawiera nowe pytania; jedno FAQPage; tłumaczenia każdego tekstu w EN/UK/DE', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0);
  try {
    const h = await (await fetch(`http://127.0.0.1:${srv.address().port}/`)).text();
    const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const faq = ld.filter((x) => x['@type'] === 'FAQPage');
    assert.equal(faq.length, 1, 'jedno FAQPage');
    const qs = faq[0].mainEntity.map((x) => x.name);
    for (const q of NEW_Q) assert.ok(qs.includes(q), q);
  } finally { srv.close(); }
  const nodes = [...sec.matchAll(/<(h2|h3|p)>([^<]+)<\/\1>/g)].map((m) => m[2]);
  const faqTexts = NEW_Q.flatMap((q) => [q, new RegExp(`<summary>${q.replace(/\?/g, '\\?')}</summary><p>([^<]+)</p>`).exec(html)[1]]);
  for (const l of ['en', 'uk', 'de']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const t of [...nodes, ...faqTexts]) { assert.ok(d[t], `${l}: ${t.slice(0, 50)}`); assert.doesNotMatch(d[t], /ogłosz|zł\b/, `${l}: bez polskich słów`); }
  }
});
