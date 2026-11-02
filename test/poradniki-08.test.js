import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 2.11: dwa poradniki PL (a-08) – CV po powrocie z pracy za granicą, CV do pracy w Norwegii (NL i IE mają już strony);
// 1200–1800 słów, FAQ, źródła oficjalne, bez liczb bez źródła i obietnic, linki wewnętrzne do istniejących stron.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-art08-'));
const express = (await import('express')).default;
const { seoRoutes, ART_TOPICS } = await import('../lib/seo.js');
const { ARTICLES, PROFESSIONS } = await import('../lib/content.js');
const { ABROAD_URLS } = await import('../lib/abroad-content.js');
const { letterRoutes } = await import('../lib/letter-landing.js');
const D = JSON.parse(fs.readFileSync(new URL('../seo-data/content-dates.json', import.meta.url), 'utf8'));
const NEW = ['cv-po-powrocie-z-pracy-za-granica', 'cv-do-pracy-w-norwegii'];
const words = (a) => [...a.sections.flatMap((s) => s.p), ...a.faq.flatMap((f) => [f.q, f.a])].join(' ').split(/\s+/).length;
const SLUGS = new Set(PROFESSIONS.map((p) => p.slug));

test('Nowe poradniki: temat „za granicą”, data, długość 1200–1800, FAQ, źródła, bez liczb bez źródła i obietnic', () => {
  const topic = ART_TOPICS.find(([t]) => t === 'Praca w Polsce i za granicą')[1];
  for (const slug of NEW) {
    const a = ARTICLES.find((x) => x.slug === slug); assert.ok(a, slug);
    assert.ok(topic.includes(slug), slug);
    assert.equal(D[`poradnik/${slug}`].date, '2026-11-02');
    const w = words(a); assert.ok(w >= 1200 && w <= 1800, `${slug}: ${w} słów`);
    assert.ok(a.title.length <= 70 && a.metaDescription.length <= 155 && a.faq.length >= 5 && a.sections.length >= 8, slug);
    assert.ok(a.related.length === 8 && a.related.every((s) => SLUGS.has(s)), `${slug}: related`);
    assert.ok(a.sources.length >= 3 && a.sources.every((s) => /^https:\/\/(www\.)?(nawa\.gov\.pl|ec\.europa\.eu|europass\.europa\.eu|workinnorway\.no|udi\.no|skatteetaten\.no|eures\.europa\.eu)/.test(s.u)), slug);
    const txt = JSON.stringify(a);
    assert.doesNotMatch(txt, /\d+\s?%|\d[\d\s]*(zł|€|euro|funt|NOK|koron)|gwarant|na pewno|zwiększa\w* szans|statystyk|badania pokazują|!|&amp;/i, slug);
  }
  // Holandia i Irlandia mają już strony – nie dublujemy ich poradnikiem
  assert.ok(ABROAD_URLS.includes('praca-w-holandii-cv') && ABROAD_URLS.includes('praca-w-irlandii-cv'));
  assert.ok(!ARTICLES.some((a) => /holandi|irlandi/.test(a.slug)));
});

test('Strony: 200, H1, FAQPage, źródła, sitemap, linki „CV do pracy za granicą”; linki wewnętrzne prowadzą do istniejących stron', async () => {
  const app = express(); seoRoutes(app, 'https://example.test'); letterRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const sm = await (await fetch(`${U}/sitemap.xml`)).text(), links = new Set();
    for (const slug of NEW) {
      const r = await fetch(`${U}/poradnik/${slug}`), h = await r.text(), a = ARTICLES.find((x) => x.slug === slug);
      assert.equal(r.status, 200, slug); assert.ok(h.includes(`<h1>${a.title}</h1>`), slug); assert.match(h, /"@type":"FAQPage"/, slug);
      assert.ok(sm.includes(`/poradnik/${slug}<`), `${slug} w sitemap`);
      for (const s of a.sources) assert.ok(h.includes(s.u), `${slug}: źródło ${s.u}`);
      for (const m of h.matchAll(/<a href="(\/[^"#?]*)">cvpodogloszenie\.pl/g)) links.add(m[1]);
    }
    assert.match(await (await fetch(`${U}/poradnik/cv-do-pracy-w-norwegii`)).text(), /<h2>CV do pracy za granicą<\/h2>.*href="\/praca-w-holandii-cv"/s);
    assert.ok(links.size >= 15, `linków: ${links.size}`);
    for (const l of links) assert.equal((await fetch(U + l, { redirect: 'manual' })).status, 200, l);
  } finally { srv.close(); }
});
