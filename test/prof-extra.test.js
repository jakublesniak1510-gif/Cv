import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_EXTRA } from '../lib/prof-extra/index.js';
import { profWords } from '../scripts/prof-words.mjs';

// Rozbudowa 30 najważniejszych stron zawodów PL do ≥ 600 słów treści własnej (scripts/prof-words.mjs).
test('30 rozbudowanych stron zawodów: ≥ 600 słów, kompletne sekcje, bez liczb bez źródła i obietnic', () => {
  const slugs = Object.keys(PROF_EXTRA);
  assert.equal(slugs.length, 30);
  for (const s of slugs) {
    const p = PROFESSIONS.find((x) => x.slug === s), e = PROF_EXTRA[s];
    assert.ok(p, `${s}: istnieje strona zawodu`);
    assert.ok(profWords(p) >= 600, `${s}: ${profWords(p)} słów`);
    assert.ok(e.rekruter.length > 150 && e.wymagania.length >= 5 && e.zdania.length >= 5 && e.bledy.length >= 4 && e.faq.length >= 3 && e.faq.length <= 4, `${s}: sekcje`);
    const txt = JSON.stringify(e);
    assert.doesNotMatch(txt, /\d+\s?%|\d[\d\s]*zł|gwarant|na pewno dostaniesz|zapewniamy zatrudnienie|średnio \d|badania pokazują|statystyki/i, `${s}: bez liczb bez źródła i obietnic`);
    assert.equal(new Set(p.faq.map((f) => f.q)).size, p.faq.length, `${s}: pytania FAQ bez powtórzeń`);
    assert.doesNotMatch(txt, /zwiększa(ją)? szans[eęy] na zatrudnienie|skraca(ją)? zatrudnienie/i, `${s}: bez obietnic zatrudnienia`);
    // Wskazówki i FAQ bezosobowo: bez form „-łeś/-łaś” (przykładowe zdania mogą mieć rodzaj).
    const hints = [e.rekruter, ...e.wymagania.flat(), ...e.bledy, ...e.faq.flatMap((f) => [f.q, f.a])].join('\n');
    assert.deepEqual(hints.match(/[a-ząćęłńóśźż]+(łeś|łaś)(?=[\s,.;:!?)–-]|$)/gi), null, `${s}: formy rodzajowe we wskazówkach`);
    if (txt.includes('UDT')) assert.match(txt, /[I]{1,2} WJO/, `${s}: UDT z kategorią (I/II WJO)`);
  }
  // Pytania FAQ nie powtarzają się między zawodami po podmianie nazwy zawodu.
  const kw = Object.values(PROF_EXTRA).flatMap((e) => e.faq.map((f) => f.q)).filter((q) => /^Jakie słowa kluczowe pasują do CV/.test(q));
  assert.ok(kw.length <= 3, `zróżnicowane pytania o słowa kluczowe (${kw.length})`);
});

test('Strona zawodu: nowe sekcje w treści i dodatkowe pytania w FAQPage', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0);
  try {
    const h = await (await fetch(`http://127.0.0.1:${srv.address().port}/cv/magazynier`)).text(), e = PROF_EXTRA.magazynier;
    for (const t of ['Na co zwraca uwagę rekruter', 'Typowe wymagania z ogłoszeń i jak je pokazać w CV', 'Przykładowe zdania do opisu doświadczenia', 'Najczęstsze błędy w CV']) assert.ok(h.includes(`<h2>${t}</h2>`), t);
    assert.ok(h.includes(`<dt>${e.wymagania[0][0]}</dt>`));
    const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'FAQPage');
    for (const f of e.faq) assert.ok(ld.mainEntity.some((q) => q.name === f.q), `FAQPage: ${f.q}`);
    const plain = await (await fetch(`http://127.0.0.1:${srv.address().port}/cv/${PROFESSIONS.find((p) => !PROF_EXTRA[p.slug]).slug}`)).text();
    assert.ok(!plain.includes('Na co zwraca uwagę rekruter'), 'inne strony bez zmian');
  } finally { srv.close(); }
});
