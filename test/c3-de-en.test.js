import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { landingRoutes, reqHits } from '../lib/landing.js';
import { adKeywords } from '../lib/ad-keywords.js';
import { C3_ARTS, C3_CASE, C3_301 } from '../lib/articles-c3.js';
import { ART_LANGS } from '../lib/articles-i18n.js';
import { toolUrl } from '../lib/tools-i18n.js';

// PR C3: poradniki DE/EN pod frazy ATS i dopasowania CV, case study „jedno CV, dwa ogłoszenia” po niemiecku i angielsku,
// wyciągacz słów kluczowych z ogłoszeń EN/DE, połączenie dwóch artykułów DE w /de/ratgeber/ats-lebenslauf (301).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = express(); seoRoutes(app, 'https://example.test'); landingRoutes(app, 'https://example.test');
const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
test.after(() => srv.close());
const get = async (p) => { const r = await fetch(U + p, { redirect: 'manual' }); return { status: r.status, loc: r.headers.get('location'), h: await r.text() }; };
const main = (h) => /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>\s*(?:<\/main>|<footer|<section)/.exec(h)?.[1] || h;
const PROMISE = /gwarant|garant|guarant|najlepsz|\bbest\b|\bbeste[nrs]?\b|75\s?%/i;

test('Wyciągacz słów z ogłoszeń EN/DE: wymagania z sekcji „Requirements” / „Ihr Profil”, bez zwrotów o firmie i wynagrodzeniu', () => {
  const en = adKeywords('Warehouse Operative\nWe are looking for a reliable person to join our team.\nRequirements: forklift licence, experience in a warehouse, stock control and ability to work shifts.\nDesirable: SAP experience, health and safety awareness.\nSalary: £24,000.', 'en');
  assert.deepEqual(en, ['forklift licence', 'experience in a warehouse', 'stock control', 'ability to work shifts', 'SAP experience', 'health and safety awareness']);
  const de = adKeywords('Lagermitarbeiter (m/w/d)\nIhr Profil: Staplerschein, Erfahrung in der Lagerlogistik, Schichtbereitschaft und Zuverlässigkeit.\nSAP-Kenntnisse von Vorteil.\nWir bieten: 30 Tage Urlaub.', 'de');
  assert.deepEqual(de, ['Staplerschein', 'Erfahrung in der Lagerlogistik', 'Schichtbereitschaft', 'Zuverlässigkeit', 'SAP-Kenntnisse']);
  assert.deepEqual(adKeywords('Join our friendly team. Great benefits.', 'en'), []);
  const srvJs = read('server.js');
  assert.match(srvJs, /if \(lang !== 'pl'\) return res\.set\('Cache-Control', 'no-store'\)\.json\(\{ keywords: adKeywords\(adText, lang\) \}\)/);
  assert.match(read('public/lite.js'), /lang: f\.dataset\.lang \|\| 'pl'/);
});

test('Połączony artykuł DE: /de/ratgeber/ats-lebenslauf z tabelą i linkiem do testu ATS, stare adresy 301, poza mapą strony', async () => {
  for (const [from, to] of Object.entries(C3_301)) { const r = await get(from); assert.equal(r.status, 301, from); assert.equal(r.loc, to); }
  assert.equal(ART_LANGS.de.data['czym-jest-ats'], undefined, 'stare tłumaczenie usunięte');
  const r = await get('/de/ratgeber/ats-lebenslauf'), m = main(r.h);
  assert.equal(r.status, 200); assert.match(r.h, /<html lang="de"/);
  assert.match(m, /<table class="cmp">[\s\S]*Foto[\s\S]*Unterschrift[\s\S]*<\/table>/);
  assert.ok(m.includes(`href="/${toolUrl('de', 'test-cv-ats')}"`), 'link do Lebenslauf-ATS-Test');
  assert.match(r.h, /hreflang="pl" href="https:\/\/example\.test\/poradnik\/jak-przejsc-przez-ats"/);
  const map = (await get('/sitemap.xml')).h;
  for (const old of Object.keys(C3_301)) assert.ok(!map.includes(`example.test${old}<`), `bez ${old} w mapie`);
  for (const u of ['de/ratgeber/ats-lebenslauf', 'de/ratgeber/schluesselwoerter-im-lebenslauf', 'en/guides/cv-keywords', 'en/guides/tailor-cv-with-ai', 'de/ratgeber/ein-lebenslauf-zwei-stellenanzeigen', 'en/guides/one-cv-two-job-ads']) assert.ok(map.includes(`example.test/${u}<`), `${u} w mapie`);
});

test('Słowa kluczowe DE (15 zawodów) i EN (20 zawodów): wyciągacz w języku strony, listy linkują do stron zawodów, bez polskich wtrąceń', async () => {
  for (const [url, l, n] of [['/de/ratgeber/schluesselwoerter-im-lebenslauf', 'de', 15], ['/en/guides/cv-keywords', 'en', 20]]) {
    const r = await get(url), m = main(r.h);
    assert.equal(r.status, 200, url);
    assert.match(m, new RegExp(`<form class="kw-extract paste-ad" method="post" data-lang="${l}"`));
    const w = /<section class="widget" data-widget="keywords">([\s\S]*?)<\/section>/.exec(m)[1];
    assert.equal((w.match(/<h3><a href="\/[a-z]{2}\/[^"]+">/g) || []).length, n, `${url}: ${n} zawodów`);
    assert.doesNotMatch(w, /[ąćęłńśźż]/i, `${url}: bez polskich znaków w widżecie`);
  }
});

test('Teksty C3: tytuły ≤ 60, opisy ≤ 155, źródła przy każdym artykule, bez obietnic i bez „75%”', () => {
  const all = [...Object.values(C3_ARTS.de), ...Object.values(C3_ARTS.en), C3_CASE.de, C3_CASE.en];
  assert.equal(all.length, 6);
  for (const a of all) {
    assert.ok(a.seoTitle.length <= 60, a.seoTitle); assert.ok(a.metaDescription.length <= 155, a.metaDescription);
    assert.doesNotMatch(JSON.stringify(a), PROMISE, a.title);
  }
  for (const a of [...Object.values(C3_ARTS.de), ...Object.values(C3_ARTS.en)]) {
    assert.ok(a.sources?.length && a.sources.every((s) => /^https:\/\//.test(s.u)), `${a.title}: źródła`);
    assert.ok(a.faq.length >= 4, `${a.title}: FAQ`);
  }
  const ai = C3_ARTS.en['cv-pod-ai'];
  assert.match(JSON.stringify(ai), /22A/); assert.ok(ai.sources.some((s) => s.u.includes('legislation.gov.uk')), 'UK: DUA Act 2025');
  const tl = ART_LANGS.en.data['jak-dopasowac-cv-do-ogloszenia'], ext = JSON.parse(read('seo-data/c3-en.json'))['tailor-ext'];
  assert.ok(ext.sections.length >= 3 && ext.sections.every((s) => tl.sections.includes(s) || tl.sections.some((x) => x.h === s.h)), 'rozbudowa tailor-cv-to-job-ad');
});

test('Case study DE/EN: te same fakty, w obu ogłoszeniach CV pod ofertę pokazuje więcej wymagań niż ogólne, brakujące zostają brakujące', async () => {
  for (const [l, url] of [['de', '/de/ratgeber/ein-lebenslauf-zwei-stellenanzeigen'], ['en', '/en/guides/one-cv-two-job-ads']]) {
    const c = C3_CASE[l], text = (x) => [x.summary, ...x.bullets].join('\n').replace(/\[\[|\]\]/g, '');
    for (const a of c.ads) {
      assert.equal(a.reqs.length, 5); for (const k of a.reqs) assert.ok(a.text.includes(k), `${l} ${a.key}: „${k}” z treści ogłoszenia`);
      const g = reqHits(a.reqs, text(c.generic)).filter((x) => x.hit).length, t = reqHits(a.reqs, text(a.cv)).filter((x) => x.hit).length;
      assert.ok(t > g, `${l} ${a.key}: ${g} → ${t}`);
    }
    assert.ok(c.ads.some((a) => reqHits(a.reqs, text(a.cv)).some((x) => !x.hit)), `${l}: wymaganie, którego kandydatka nie spełnia, zostaje brakujące`);
    const r = await get(url), m = main(r.h);
    assert.equal(r.status, 200, url); assert.match(r.h, new RegExp(`<html lang="${l}"`));
    assert.equal((m.match(/class="ad-col"/g) || []).length, 4);
    assert.match(m, l === 'de' ? /\d von 5 Anforderungen im Text sichtbar/ : /\d of 5 requirements visible in the text/);
    assert.doesNotMatch(r.h.slice(r.h.indexOf('<h1>'), r.h.indexOf('class="more"', r.h.indexOf('<h1>'))), /\d+\s?%/, 'bez procentów (skaner liczy po polsku)');
    assert.match(r.h, /"@type":"FAQPage"/);
    for (const h of ['pl', 'de', 'en']) assert.match(r.h, new RegExp(`hreflang="${h}"`));
  }
  const pl = await get('/poradnik/jedno-cv-dwa-ogloszenia');
  assert.match(pl.h, /hreflang="de" href="https:\/\/example\.test\/de\/ratgeber\/ein-lebenslauf-zwei-stellenanzeigen"/);
  assert.match(pl.h, /hreflang="en" href="https:\/\/example\.test\/en\/guides\/one-cv-two-job-ads"/);
});

test('Recenzja #74: formularz wyciągacza EN/DE bez wysyłki GET, stałe zwroty bez dzielenia, bez HTML, źródło BA', async () => {
  for (const url of ['/de/ratgeber/schluesselwoerter-im-lebenslauf', '/en/guides/cv-keywords']) {
    const f = /<form class="kw-extract paste-ad"[^>]*>[\s\S]*?<\/form>/.exec((await get(url)).h)[0];
    assert.match(f, /method="post"/); assert.match(f, /<button class="btn" type="submit" hidden>/); assert.match(f, /<noscript><p class="hint small">[^<]*JavaScript/);
  }
  assert.deepEqual(adKeywords('Anforderungen: Deutsch in Wort und Schrift, Kundenservice per Chat und E-Mail, <b>Team</b>.', 'de'), ['Deutsch in Wort und Schrift', 'Kundenservice per Chat und E-Mail']);
  assert.deepEqual(adKeywords('Requirements: live chat and email support, handling returns and complaints.', 'en'), ['live chat and email support', 'handling returns and complaints']);
  assert.match(read('public/lite.js'), /throw new Error\(f\.dataset\.linkerr \|\| `\$\{j\.error\} Wklej/);
  assert.ok(C3_ARTS.de['jak-przejsc-przez-ats'].sources.some((s) => s.u === 'https://www.arbeitsagentur.de/bildung/bewerbung/lebenslauf'));
});
