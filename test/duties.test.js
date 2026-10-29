import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import { seoRoutes } from '../lib/seo.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_EXTRA } from '../lib/prof-extra/index.js';
import { DUTIES, DUTIES_INDEX, dutiesPath } from '../lib/duties.js';

// „Zakres obowiązków” dla 30 zawodów z rozbudowaną stroną CV i malarza budowlanego (zapytanie GSC 29.10): kompletne sekcje, zasady redakcyjne jak przy stronach zawodów.
test('Treść: 30 zawodów z rozbudowaną stroną CV + malarz budowlany, kompletne sekcje, bez liczb, obietnic i form rodzajowych, bez powtórzeń', () => {
  assert.deepEqual(Object.keys(DUTIES).sort(), [...Object.keys(PROF_EXTRA), 'malarz-budowlany'].sort());
  const seen = new Set();
  for (const [s, d] of Object.entries(DUTIES)) {
    const p = PROFESSIONS.find((x) => x.slug === s);
    assert.ok(p, s);
    assert.ok(d.nazwaD && d.intro.length > 80 && d.obowiazki.length >= 8 && d.obowiazki.length <= 12 && d.wymagania.niezbedne.length >= 4 && d.wymagania.mile_widziane.length >= 3 && d.warunki.length >= 3 && d.jak_w_cv.length >= 3 && d.dla_firm.length > 40, `${s}: sekcje`);
    // odmiana z nagłówka strony CV; wyjątki: nagłówki bez nazwy osoby („CV w obsłudze klienta”, „CV w kadrach i płacach”)
    if (!['obsluga-klienta', 'specjalista-kadr-i-plac'].includes(s)) assert.ok(p.title.toLowerCase().includes(d.nazwaD.toLowerCase().split(' ')[0]), `${s}: odmiana „${d.nazwaD}” zgodna z „${p.title}”`);
    const txt = JSON.stringify(d);
    assert.doesNotMatch(txt, /\d+\s?%|\d[\d\s]*zł|gwarant|najlepsz|na pewno|zwiększa(ją)? szans|średnio \d|statystyki|badania pokazują/i, `${s}: bez liczb bez źródła i obietnic`);
    assert.deepEqual(txt.match(/[a-ząćęłńóśźż]+(łeś|łaś)(?=[\s,.;:!?)–-]|$)/gi), null, `${s}: formy rodzajowe`);
    if (txt.includes('UDT')) assert.match(txt, /I{1,2} WJO/, `${s}: UDT z kategorią`);
    // pokrewne zawody (sprzedawca – kierownik sklepu) mogą mieć wspólne obowiązki, ale nie więcej niż 2
    const dup = d.obowiazki.filter((x) => seen.has(x.toLowerCase()));
    assert.ok(dup.length <= 2, `${s}: obowiązki powtórzone z innych zawodów: ${dup.join('; ')}`);
    for (const x of d.obowiazki) seen.add(x.toLowerCase());
  }
});

test('Strony: 200, indeksowane (bez noindex), w mapie strony, linki do CV pod ogłoszenie i oferty dla firm, wejście z /poradnik', async () => {
  assert.equal(DUTIES_INDEX, true, 'po drugiej kontroli językowej (#75)');
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const [s, d] of Object.entries(DUTIES)) {
      const r = await fetch(`${U}/${dutiesPath(s)}`), h = await r.text();
      assert.equal(r.status, 200, s); assert.equal(r.headers.get('x-robots-tag'), null, s);
      assert.doesNotMatch(h, /<meta name="robots" content="noindex/, s);
      assert.ok(h.includes(`<h1>Zakres obowiązków ${d.nazwaD}</h1>`) && h.includes(`href="/cv/${s}"`) && h.includes('href="/dla-firm"') && h.includes(`zamow=1&amp;zawod=${s}`), s);
    }
    assert.equal((await fetch(`${U}/zawod/nie-ma/zakres-obowiazkow`)).status, 404);
    const hub = await fetch(`${U}/zawod/zakres-obowiazkow`), hh = await hub.text();
    assert.equal(hub.headers.get('x-robots-tag'), null); assert.doesNotMatch(hh, /<meta name="robots" content="noindex/); assert.equal((hh.match(/href="\/zawod\/[\w-]+\/zakres-obowiazkow"/g) || []).length, 31, 'lista 31 stron');
    const cv = await (await fetch(`${U}/cv/kasjer`)).text(); assert.ok(cv.includes('href="/zawod/kasjer/zakres-obowiazkow"'), 'link ze strony CV');
    assert.match(fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8'), /<template id="pg-dla-firm"[\s\S]*href="\/zawod\/zakres-obowiazkow"[\s\S]*<\/template>/, 'link z /dla-firm');
    assert.match(await (await fetch(`${U}/${dutiesPath('kasjer')}`)).text(), /<title>Obowiązki i wymagania kasjera/);
    const map = await (await fetch(`${U}/sitemap.xml`)).text();
    for (const s of Object.keys(DUTIES)) assert.ok(map.includes(`/${dutiesPath(s)}<`), `${s} w mapie strony`);
    assert.ok(map.includes('/zawod/zakres-obowiazkow<'), 'lista w mapie strony');
    assert.ok((await (await fetch(`${U}/poradnik`)).text()).includes('href="/zawod/zakres-obowiazkow"'), 'wejście z /poradnik');
    assert.match(DUTIES.kierowca.jak_w_cv[0], /kod 95[\s\S]*ważny 5 lat i odnawia się go szkoleniem okresowym/);
  } finally { srv.close(); }
});
