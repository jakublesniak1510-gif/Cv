import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, cityJobLinks } from '../lib/seo.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';

// PR W: na stronach zawód × miasto sekcja z linkami do wyników wyszukiwania ofert na 5 portalach (nofollow, nowa karta).
test('Linki do portali z zawodu i miasta (po polsku), OLX bez polskich znaków, CBOP – wyszukiwarka', () => {
  const l = Object.fromEntries(cityJobLinks('Magazynier', 'Poznań'));
  assert.equal(l['Pracuj.pl'], 'https://www.pracuj.pl/praca/magazynier;kw/Pozna%C5%84;wp');
  assert.equal(l['OLX Praca'], 'https://www.olx.pl/praca/poznan/q-magazynier/');
  assert.equal(l.Indeed, 'https://pl.indeed.com/jobs?q=magazynier&l=Pozna%C5%84');
  assert.equal(l.Jooble, 'https://pl.jooble.org/SearchResult?ukw=magazynier&rgns=Pozna%C5%84');
  assert.equal(l['Urzędy pracy (CBOP)'], 'https://oferty.praca.gov.pl/portal/lista-ofert');
  assert.equal(Object.fromEntries(cityJobLinks('Kierowca kat. C', 'Łódź'))['OLX Praca'], 'https://www.olx.pl/praca/lodz/q-kierowca-kat-c/');
});

test('Strona /cv/<zawód>/<miasto> i wersja językowa: sekcja z 5 linkami nofollow, zawód bez form „ / ”', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/cv/magazynier/poznan`)).text();
    assert.match(h, /<h2>Oferty pracy: magazynier \/ magazynierka w Poznaniu<\/h2>/);
    const links = [...h.matchAll(/<a href="([^"]+)" rel="nofollow noopener" target="_blank">/g)].map((m) => m[1]);
    assert.equal(links.length, 5); assert.ok(links[0].includes('/praca/magazynier;kw/'), 'pierwsza forma zawodu');
    assert.match(h, /Nie odpowiadamy za treść ogłoszeń\./);
    const en = PROF_LANGS.en, x = await (await fetch(`${U}/en/${en.seg}/${en.prof.magazynier.slugLang}/${en.cities.poznan.slugLang}`)).text();
    assert.match(x, /<h2>Job offers: /); assert.ok(x.includes('https://www.pracuj.pl/praca/magazynier;kw/Pozna%C5%84;wp'), 'zapytanie po polsku także w EN');
    assert.match(x, /We are not responsible for the content of the ads\./);
  } finally { srv.close(); }
});
