import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Zadanie 4 (26.10): poradniki a-05 (obowiązki w CV) i a-06 (list motywacyjny bez doświadczenia) od koordynatora;
// w poradnikach adresy cvpodogloszenie.pl/… w akapitach jako klikalne linki względne (autoLink).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-art56-'));
const express = (await import('express')).default;
const { seoRoutes, ART_TOPICS, autoLink } = await import('../lib/seo.js');
const { ARTICLES } = await import('../lib/content.js');
const D = JSON.parse(fs.readFileSync(new URL('../seo-data/content-dates.json', import.meta.url), 'utf8'));
const NEW = { 'jak-opisac-obowiazki-w-cv': 'Jak napisać CV', 'list-motywacyjny-bez-doswiadczenia': 'List motywacyjny i rozmowa' };

test('Nowe poradniki: w ARTICLES, w temacie hubu, data treści 2026-10-26, bez podwójnie escapowanego &', () => {
  for (const [slug, topic] of Object.entries(NEW)) {
    const a = ARTICLES.find((x) => x.slug === slug); assert.ok(a, slug);
    assert.ok(ART_TOPICS.find(([t]) => t === topic)[1].includes(slug), `${slug} w „${topic}”`);
    assert.equal(D[`poradnik/${slug}`].date, '2026-10-26');
    assert.doesNotMatch(JSON.stringify(a), /&amp;/, 'w danych zwykłe „&”');
    assert.ok(a.faq.length >= 5 && a.sections.length >= 8 && a.related.length >= 8);
  }
});

test('autoLink: tylko własna domena, adres względny, kropka i nawias poza linkiem, &amp; zachowane', () => {
  assert.equal(autoLink('skanerze (cvpodogloszenie.pl/narzedzia/skaner-cv).'), 'skanerze (<a href="/narzedzia/skaner-cv">cvpodogloszenie.pl/narzedzia/skaner-cv</a>).');
  assert.equal(autoLink('(cvpodogloszenie.pl/?zamow=1&amp;pkg=cv)'), '(<a href="/?zamow=1&amp;pkg=cv">cvpodogloszenie.pl/?zamow=1&amp;pkg=cv</a>)');
  assert.equal(autoLink('Wejdź na cvpodogloszenie.pl.'), 'Wejdź na <a href="/">cvpodogloszenie.pl</a>.');
  assert.equal(autoLink('example.com/cvpodogloszenie i www.pracuj.pl/x'), 'example.com/cvpodogloszenie i www.pracuj.pl/x');
});

test('Strony poradników: linki w treści, FAQPage, sitemap i hub /poradnik', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/poradnik/list-motywacyjny-bez-doswiadczenia`)).text();
    assert.match(h, /<h1>List motywacyjny bez doświadczenia: co napisać i wzór<\/h1>/);
    assert.ok(h.includes('<a href="/narzedzia/skaner-cv">cvpodogloszenie.pl/narzedzia/skaner-cv</a>'));
    assert.ok(h.includes('<a href="/?zamow=1&amp;pkg=cv">cvpodogloszenie.pl/?zamow=1&amp;pkg=cv</a>'));
    assert.doesNotMatch(h, /&amp;amp;|&lt;a /); assert.match(h, /"@type":"FAQPage"/);
    const o = await (await fetch(`${U}/poradnik/jak-opisac-obowiazki-w-cv`)).text();
    assert.match(o, /<h2>Schemat dobrego punktu: czasownik, co, czym, w jakiej skali<\/h2>/);
    const sm = await (await fetch(`${U}/sitemap.xml`)).text(), hub = await (await fetch(`${U}/poradnik`)).text();
    for (const s of Object.keys(NEW)) { assert.ok(sm.includes(`https://example.test/poradnik/${s}<`), `sitemap: ${s}`); assert.ok(hub.includes(`href="/poradnik/${s}"`), `hub: ${s}`); }
  } finally { srv.close(); }
});
