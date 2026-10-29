import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Zapytania GSC (29.10): 5 nowych poradników PL (a-07) i „E-mail z CV – 4 wzory” w istniejącym poradniku;
// bez liczb bez źródła, przepisy z artykułami i źródłami, linki wewnętrzne do istniejących stron.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-art07-'));
const express = (await import('express')).default;
const { seoRoutes, ART_TOPICS } = await import('../lib/seo.js');
const { ARTICLES, PROFESSIONS } = await import('../lib/content.js');
const { ART_SEO, CTR_SEO } = await import('../lib/seo-titles.js');
const D = JSON.parse(fs.readFileSync(new URL('../seo-data/content-dates.json', import.meta.url), 'utf8'));
const NEW = { 'podziekowanie-za-przeslanie-cv-co-oznacza': 'List motywacyjny i rozmowa', 'klauzula-rodo-po-angielsku-i-niemiecku': 'Jak napisać CV', 'cv-dla-ucznia': 'Sytuacje szczególne', 'cv-po-zwolnieniu': 'Sytuacje szczególne', 'zakres-obowiazkow-w-cv-30-zawodow': 'Jak napisać CV' };
const words = (a) => [...a.sections.flatMap((s) => s.p), ...a.faq.flatMap((f) => [f.q, f.a])].join(' ').split(/\s+/).length;
const SLUGS = new Set(PROFESSIONS.map((p) => p.slug));

test('Nowe poradniki: temat hubu, data treści, długość, FAQ, powiązane zawody; bez liczb bez źródła, obietnic i presji', () => {
  for (const [slug, topic] of Object.entries(NEW)) {
    const a = ARTICLES.find((x) => x.slug === slug); assert.ok(a, slug);
    assert.ok(ART_TOPICS.find(([t]) => t === topic)[1].includes(slug), `${slug} w „${topic}”`);
    assert.equal(D[`poradnik/${slug}`].date, '2026-10-29');
    const w = words(a); assert.ok(w >= 900 && w <= 1400, `${slug}: ${w} słów`);
    assert.ok(a.title.length <= 70 && a.metaDescription.length <= 155 && a.faq.length >= 5 && a.sections.length >= 8, slug);
    assert.ok(a.related.length === 8 && a.related.every((s) => SLUGS.has(s)), `${slug}: related`);
    const txt = JSON.stringify(a);
    assert.doesNotMatch(txt, /\d+\s?%|\d[\d\s]*zł|gwarant|na pewno|zwiększa\w* szans|statystyk|badania pokazują|!|&amp;/i, slug);
    // liczby z przepisów tylko z artykułem i źródłem
    if (/\d+ godzin/.test(txt)) { assert.match(txt, /art\. 202/); assert.ok(a.sources?.some((s) => s.u.includes('isap.sejm.gov.pl')), slug); }
  }
  const rodo = JSON.stringify(ARTICLES.find((x) => x.slug === 'klauzula-rodo-po-angielsku-i-niemiecku'));
  for (const c of ['I hereby consent to the processing of my personal data for the purposes of the recruitment process in accordance with Art. 6(1)(a) of Regulation (EU) 2016/679 (GDPR).', 'Ich willige in die Verarbeitung meiner personenbezogenen Daten für die Zwecke des Bewerbungsverfahrens gemäß Art. 6 Abs. 1 lit. a der Verordnung (EU) 2016/679 (DSGVO) ein.']) assert.ok(rodo.includes(c), 'brzmienie jak w generatorze');
});

test('E-mail z CV: H2 „E-mail z CV – 4 wzory” w istniejącym poradniku, tytuł SEO ≤ 60 z „E-mail z CV”, link do nowego poradnika', () => {
  const a = ARTICLES.find((x) => x.slug === 'email-z-aplikacja-i-podziekowanie-po-rozmowie'), s = a.sections.find((x) => x.h === 'E-mail z CV – 4 wzory');
  assert.ok(s); assert.deepEqual(s.p.slice(1).map((p) => /^Wzór (\d)/.exec(p)[1]), ['1', '2', '3', '4']);
  for (const t of [ART_SEO.pl[a.slug], CTR_SEO[`poradnik/${a.slug}`].title]) { assert.match(t, /^E-mail z CV/); assert.ok(t.length <= 60); }
  assert.ok(JSON.stringify(a).includes('cvpodogloszenie.pl/poradnik/podziekowanie-za-przeslanie-cv-co-oznacza'));
});

test('Strony: 200, H1, FAQPage, źródła, sitemap; każdy link wewnętrzny z treści prowadzi do istniejącej strony', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const sm = await (await fetch(`${U}/sitemap.xml`)).text(), links = new Set();
    for (const slug of [...Object.keys(NEW), 'email-z-aplikacja-i-podziekowanie-po-rozmowie']) {
      const r = await fetch(`${U}/poradnik/${slug}`), h = await r.text(), a = ARTICLES.find((x) => x.slug === slug);
      assert.equal(r.status, 200, slug); assert.ok(h.includes(`<h1>${a.title}</h1>`), slug); assert.match(h, /"@type":"FAQPage"/, slug);
      assert.ok(sm.includes(`/poradnik/${slug}<`), `${slug} w sitemap`);
      for (const s of a.sources || []) assert.ok(h.includes(s.u), `${slug}: źródło ${s.u}`);
      for (const m of h.matchAll(/<a href="(\/[^"#?]*)">cvpodogloszenie\.pl/g)) links.add(m[1]);
    }
    assert.ok(links.size > 40, `linków: ${links.size}`);
    for (const l of links) assert.equal((await fetch(U + l, { redirect: 'manual' })).status, 200, l);
  } finally { srv.close(); }
});
