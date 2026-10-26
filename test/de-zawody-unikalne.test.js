import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Decyzja koordynatora 26.10 (po PR #126 dla EN): 20 zawodów DE z własnym wstępem, sekcją „worauf achten” (DE/AT/CH, ze źródłami)
// i zdaniami do CV; self-canonical i hreflang bez zmian.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-de-plus-'));
const express = (await import('express')).default;
const { PROF_DE_PLUS } = await import('../lib/prof-de-plus.js');
const { PROF_EN_PLUS } = await import('../lib/prof-en-plus.js');
const { PROF_LANGS } = await import('../lib/professions-i18n.js');
const { seoRoutes } = await import('../lib/seo.js');
const words = (s) => s.split(/\s+/).filter(Boolean).length;

test('20 zawodów DE: te same co EN, wstęp ≥ 80 słów, tytuł ≤ 60, opis ≤ 155, sekcja i 3 zdania, źródła https, bez powtórzeń i obietnic', () => {
  assert.deepEqual(Object.keys(PROF_DE_PLUS).sort(), Object.keys(PROF_EN_PLUS).sort());
  const seen = new Set();
  for (const [k, x] of Object.entries(PROF_DE_PLUS)) {
    assert.ok(PROF_LANGS.de.prof[k], k);
    assert.ok(words(x.lead) >= 80, `${k}: wstęp ${words(x.lead)} słów`); assert.notEqual(x.lead, PROF_LANGS.de.prof[k].intro);
    assert.ok(x.seoTitle.length <= 60 && x.metaDescription.length <= 155, k);
    assert.ok(x.uk.length >= 2 && x.lines.length === 3 && x.sources.length >= 1, k);
    for (const s of x.sources) assert.match(s.u, /^https:\/\/[\w.-]+\.(de|at|ch|gv\.at|admin\.ch|com)\//, `${k}: ${s.u}`);
    for (const t of [x.lead, x.seoTitle, x.metaDescription, ...x.lines]) { assert.ok(!seen.has(t), `powtórzony tekst: ${t.slice(0, 40)}`); seen.add(t); }
    assert.doesNotMatch([x.lead, ...x.uk, ...x.lines, x.metaDescription].join(' '), /garantiert|\bder beste|\bdie beste|\d+\s?%/i, `${k}: bez obietnic i procentów`);
  }
});

test('Strona /de/lebenslauf/pflegefachkraft: wstęp, sekcje po niemiecku, źródła, tytuł, canonical i hreflang', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const slug = PROF_LANGS.de.prof.pielegniarka.slugLang, x = PROF_DE_PLUS.pielegniarka, name = PROF_LANGS.de.prof.pielegniarka.name;
    const h = await (await fetch(`${U}/de/lebenslauf/${slug}`)).text();
    assert.ok(h.includes(`<title>${x.seoTitle}`)); assert.ok(h.includes(`<p class="lead">${x.lead}</p>`));
    assert.ok(h.includes(`<h2>${name}: worauf Sie in Deutschland, Österreich und der Schweiz achten sollten</h2>`));
    assert.ok(h.includes(`<h2>Formulierungen für Ihren Lebenslauf: ${name}</h2>`));
    assert.ok(h.includes('href="https://gbr-public.ehealth.gv.at/"'));
    assert.ok(h.includes(`<link rel="canonical" href="https://example.test/de/lebenslauf/${slug}">`));
    for (const l of ['pl', 'en', 'uk', 'de', 'x-default']) assert.ok(h.includes(`hreflang="${l}"`), l);
    const en = await (await fetch(`${U}/en/cv/nurse`)).text();
    assert.match(en, /<h2>Nurse jobs in the UK and Ireland: what to check<\/h2>/, 'EN bez zmian');
  } finally { srv.close(); }
});
