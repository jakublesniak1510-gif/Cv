import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Zapytania GSC innym słowem niż nazwa strony (29.10): synonim w tytule, H1, opisie i treści istniejącej strony;
// potoczne adresy (/cv/sprzataczka…) → 301 na tę stronę, bez duplikatów w mapie strony.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-syn-'));
const express = (await import('express')).default;
const { seoRoutes, PROF_301 } = await import('../lib/seo.js');
const { PROFESSIONS } = await import('../lib/content.js');
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const CASES = [
  ['/cv/pracownik-sprzatajacy', 'sprzątaczk', /^CV sprzątaczki 2026/, /^CV pracownika sprzątającego: wzór CV sprzątaczki$/],
  ['/cv/przedstawiciel-handlowy', 'handlowc', /^CV handlowca 2026/, /^CV przedstawiciela handlowego: wzór CV handlowca$/],
  ['/cv/pracownik-budowlany', 'budowlań', /^CV budowlańca 2026/, /^CV pracownika budowlanego: wzór CV budowlańca$/],
  ['/cv/nauczyciel-przedszkola', 'przedszkolank', /^CV przedszkolanki 2026/, /^CV nauczyciela przedszkola: wzór CV przedszkolanki/],
  ['/poradnik/cv-dla-studenta', 'CV studenta', /^CV studenta i CV dla studenta/, /^CV dla studenta/],
  ['/poradnik/zdjecie-w-cv', 'CV ze zdjęciem czy bez', /^CV ze zdjęciem czy bez\?/, /ze zdjęciem czy bez/],
  ['/poradnik/podsumowanie-zawodowe-w-cv', 'Podsumowanie CV', /^Podsumowanie CV i podsumowanie zawodowe/, /^Podsumowanie w CV/],
];

test('Synonim w tytule (≤ 60), H1, opisie (≤ 155) i treści; potoczne adresy → 301 bez duplikatów w sitemap', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const [u, syn, title, h1] of CASES) {
      const h = await (await fetch(U + u)).text(), t = /<title>([^<]*)<\/title>/.exec(h)[1], d = /<meta name="description" content="([^"]*)">/.exec(h)[1];
      assert.match(t, title, u); assert.ok(t.length <= 60 && d.length <= 155, `${u}: ${t.length}/${d.length}`);
      assert.match(/<h1>([^<]*)<\/h1>/.exec(h)[1], h1, u);
      assert.ok(d.toLowerCase().includes(syn.toLowerCase()), `${u} opis: ${d}`);
      const main = text(h.slice(h.indexOf('</h1>'))); assert.ok(main.toLowerCase().includes(syn.toLowerCase()), `${u}: synonim w treści`);
    }
    assert.deepEqual(Object.keys(PROF_301), ['/cv/sprzataczka', '/cv/handlowiec', '/cv/budowlaniec', '/cv/przedszkolanka']);
    for (const [from, to] of Object.entries(PROF_301)) {
      const r = await fetch(U + from, { redirect: 'manual' }); assert.equal(r.status, 301, from); assert.equal(new URL(r.headers.get('location'), U).pathname, to);
      assert.ok(PROFESSIONS.some((p) => `/cv/${p.slug}` === to) && !PROFESSIONS.some((p) => `/cv/${p.slug}` === from), 'cel istnieje, synonim nie jest osobną stroną');
    }
    const sm = await (await fetch(U + '/sitemap.xml')).text();
    for (const from of Object.keys(PROF_301)) assert.doesNotMatch(sm, new RegExp(`${from}<`), from);
  } finally { srv.close(); }
  // odmiana z H1 (do „{zawodu}” w widżetach i dopasowaniu) bez zmian
  for (const [s, n] of [['pracownik-sprzatajacy', 'pracownika sprzątającego'], ['przedstawiciel-handlowy', 'przedstawiciela handlowego'], ['pracownik-budowlany', 'pracownika budowlanego'], ['nauczyciel-przedszkola', 'nauczyciela przedszkola']]) assert.equal(/^CV (.+?):/.exec(PROFESSIONS.find((p) => p.slug === s).title)[1], n);
});
