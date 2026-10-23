import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import { seoRoutes } from '../lib/seo.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_EXTRA } from '../lib/prof-extra/index.js';
import { DUTIES, DUTIES_INDEX, dutiesPath } from '../lib/duties.js';

// „Zakres obowiązków” dla 30 zawodów: kompletne sekcje, zasady redakcyjne jak przy stronach zawodów, noindex do przeglądu.
test('Treść: 30 zawodów z rozbudowaną stroną CV, kompletne sekcje, bez liczb, obietnic i form rodzajowych, bez powtórzeń', () => {
  assert.deepEqual(Object.keys(DUTIES).sort(), Object.keys(PROF_EXTRA).sort());
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

test('Strony: 200, noindex,follow (meta i nagłówek), poza mapą strony, linki do CV pod ogłoszenie i oferty dla firm', async () => {
  assert.equal(DUTIES_INDEX, false, 'do czasu przeglądu językowego');
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const [s, d] of Object.entries(DUTIES)) {
      const r = await fetch(`${U}/${dutiesPath(s)}`), h = await r.text();
      assert.equal(r.status, 200, s); assert.equal(r.headers.get('x-robots-tag'), 'noindex, follow');
      assert.match(h, /<meta name="robots" content="noindex,follow">/);
      assert.ok(h.includes(`<h1>Zakres obowiązków ${d.nazwaD}</h1>`) && h.includes(`href="/cv/${s}"`) && h.includes('href="/dla-firm"') && h.includes(`zamow=1&amp;zawod=${s}`), s);
    }
    assert.equal((await fetch(`${U}/zawod/nie-ma/zakres-obowiazkow`)).status, 404);
    const hub = await fetch(`${U}/zawod/zakres-obowiazkow`), hh = await hub.text();
    assert.equal(hub.headers.get('x-robots-tag'), 'noindex, follow'); assert.equal((hh.match(/href="\/zawod\/[\w-]+\/zakres-obowiazkow"/g) || []).length, 30, 'lista 30 stron');
    const cv = await (await fetch(`${U}/cv/kasjer`)).text(); assert.ok(cv.includes('href="/zawod/kasjer/zakres-obowiazkow"'), 'link ze strony CV');
    assert.match(fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8'), /<template id="pg-dla-firm"[\s\S]*href="\/zawod\/zakres-obowiazkow"[\s\S]*<\/template>/, 'link z /dla-firm');
    assert.match(await (await fetch(`${U}/${dutiesPath('kasjer')}`)).text(), /<title>Obowiązki i wymagania kasjera/);
    assert.ok(!(await (await fetch(`${U}/sitemap.xml`)).text()).includes('zakres-obowiazkow'), 'poza mapą strony');
  } finally { srv.close(); }
});
