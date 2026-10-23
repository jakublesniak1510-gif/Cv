import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { EXT } from '../lib/content-ext.js';
import { ART_LANGS } from '../lib/articles-i18n.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { TOOL_LANGS, toolUrl } from '../lib/tools-i18n.js';

// Wzmocnione strony DE/EN (seo-data/ext-*.json): 1 200–1 800 słów, FAQ w FAQPage, źródła, link do skanera w języku strony.
const PAGES = {
  de: ['article:cv-do-pracy-w-polsce', 'tool:klauzula-rodo', 'prof:nauczyciel-przedszkola', 'prof:kierownik-sprzedazy', 'article:podsumowanie-zawodowe-w-cv'],
  en: ['article:klauzula-rodo-w-cv', 'article:cv-po-angielsku', 'article:jak-przejsc-przez-ats', 'article:cv-po-urlopie-macierzynskim', 'prof:tlumacz'],
};
const urlOf = (l, key) => { const [k, s] = key.split(':'); return '/' + (k === 'article' ? `${l}/${ART_LANGS[l].seg}/${ART_LANGS[l].data[s].slugLang}` : k === 'prof' ? `${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[s].slugLang}` : toolUrl(l, s)); };
const words = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

test('Dane: 5 stron DE i 5 EN, sekcje, nowe pytania i źródła (https, oficjalne), bez obietnic i liczb wymyślonych', () => {
  for (const [l, keys] of Object.entries(PAGES)) {
    assert.deepEqual(Object.keys(EXT[l]).sort(), [...keys].sort(), l);
    for (const k of keys) {
      const e = EXT[l][k], txt = JSON.stringify(e);
      assert.ok(e.sections.length >= 3 && e.faq.length >= 3 && e.sources.length >= 2, `${l} ${k}: części`);
      for (const s of e.sources) assert.match(s.u, /^https:\/\/[^\s"<>]+$/, `${l} ${k}: ${s.u}`);
      assert.doesNotMatch(txt, /garantiert|Garantie|\bbeste[nrs]?\b|guarantee|\bbest\b|75 ?%/i, `${l} ${k}: bez obietnic i „75%”`);
      assert.doesNotMatch(e.sections.flatMap((x) => x.p).join(' '), /https?:\/\//, `${l} ${k}: bez adresów w tekście`);
    }
  }
});

test('Strony: 1 200–1 800 słów treści (limit 2 000 z linkami „Przeczytaj też”), sekcje i źródła w HTML, FAQ w FAQPage, link do skanera w języku strony', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const [l, keys] of Object.entries(PAGES)) for (const k of keys) {
      const u = urlOf(l, k), r = await fetch(U + u), h = await r.text(), e = EXT[l][k];
      assert.equal(r.status, 200, u);
      const main = h.slice(h.indexOf('<h1>'), h.indexOf('</section>', h.indexOf('<h1>')));
      const n = words(main.slice(0, main.indexOf('class="sources"')));
      assert.ok(n >= 1200 && n <= 2000, `${u}: ${n} słów`);
      for (const s of e.sections) assert.ok(h.includes(`<h2>${s.h.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h2>`), `${u}: ${s.h}`);
      assert.ok(h.includes('<ul class="sources">') && e.sources.every((s) => h.includes(`href="${s.u.replace(/&/g, '&amp;')}"`)), `${u}: źródła`);
      assert.ok(h.includes(`href="/${toolUrl(l, 'skaner-cv')}"`), `${u}: skaner w języku strony`);
      const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'FAQPage');
      if (!k.startsWith('tool:')) for (const f of e.faq) assert.ok(ld?.mainEntity.some((q) => q.name === f.q), `${u}: FAQPage ${f.q}`);
    }
    const t = await (await fetch(`${U}/content/tools-de.json`)).json();
    assert.ok(t['klauzula-rodo'].sections.length && t['klauzula-rodo'].sources.length, 'skrypt strony narzędzia dostaje te same sekcje');
  } finally { srv.close(); }
});
