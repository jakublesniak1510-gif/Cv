import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { TOOLS } from '../lib/tools.js';
import { TOOL_LANGS, TOOL_BY, toolUrl } from '../lib/tools-i18n.js';
import { ART_LANGS } from '../lib/articles-i18n.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { seoRoutes } from '../lib/seo.js';

const LANGS = ['en', 'uk', 'de'];

test('Każde narzędzie ma wersję EN/UK/DE: unikalne slugi, tytuł do 60 i opis do 155 znaków, segment bez kolizji', () => {
  for (const l of LANGS) {
    const { seg, data } = TOOL_LANGS[l];
    assert.notEqual(seg, ART_LANGS[l].seg); assert.notEqual(seg, PROF_LANGS[l].seg);
    assert.deepEqual(Object.keys(data).sort(), Object.keys(TOOLS).sort(), `komplet narzędzi: ${l}`);
    const slugs = Object.values(data).map((d) => d.slugLang);
    assert.equal(new Set(slugs).size, slugs.length, `unikalne slugi: ${l}`);
    for (const [k, d] of Object.entries(data)) {
      assert.match(d.slugLang, /^[a-z0-9-]+$/, `${l}/${k}: slug`);
      assert.ok(d.title.length <= 60, `${l}/${k}: tytuł ${d.title.length}`);
      assert.ok(d.metaDescription.length <= 155, `${l}/${k}: opis ${d.metaDescription.length}`);
      assert.ok(d.lead && d.about?.length >= 2 && d.faq?.length >= 2, `${l}/${k}: treść`);
      assert.equal(TOOL_BY[l][d.slugLang], k);
    }
  }
  assert.equal(TOOL_LANGS.en.seg, TOOL_LANGS.de.seg, 'EN i DE: wspólny segment „tools”');
  assert.match(TOOL_LANGS.en.data['kalkulator-wynagrodzen'].title + TOOL_LANGS.de.data['kalkulator-wynagrodzen'].title, /Poland.*Polen/s);
});

test('SSR: adresy narzędzi w językach zwracają 200 z własnym tytułem, canonical i hreflang na 4 wersje; sitemap je zawiera', async () => {
  const app = express(); const base = 'https://example.test';
  seoRoutes(app, base);
  const srv = app.listen(0); const port = srv.address().port;
  const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, text: await r.text() }; };
  try {
    for (const l of LANGS) for (const k of Object.keys(TOOLS)) {
      const u = toolUrl(l, k), { status, text } = await get('/' + u), d = TOOL_LANGS[l].data[k];
      assert.equal(status, 200, u);
      assert.ok(text.includes(`<title>${d.title}`), `${u}: tytuł`);
      assert.ok(text.includes(`<link rel="canonical" href="${base}/${u}">`), `${u}: canonical`);
      assert.ok(text.includes(`<html lang="${l}">`), `${u}: lang`);
      assert.ok(text.includes(`hreflang="pl" href="${base}/narzedzia/${k}"`), `${u}: hreflang pl`);
      for (const l2 of LANGS) assert.ok(text.includes(`hreflang="${l2}" href="${base}/${toolUrl(l2, k)}"`), `${u}: hreflang ${l2}`);
      assert.ok(text.includes('"@type":"FAQPage"'), `${u}: FAQ`);
    }
    const pl = await get('/narzedzia/skaner-cv');
    assert.ok(pl.text.includes(`hreflang="en" href="${base}/en/tools/cv-scanner"`), 'polska strona linkuje wersje językowe');
    assert.equal((await get('/en/tools/nie-ma')).status, 404);
    const sm = (await get('/sitemap.xml')).text;
    for (const l of LANGS) for (const k of Object.keys(TOOLS)) assert.ok(sm.includes(`<loc>${base}/${toolUrl(l, k)}</loc>`), `sitemap: ${toolUrl(l, k)}`);
    const home = (await get('/de')).text;
    assert.ok(home.includes('href="/de/tools/lebenslauf-scanner"') && !home.includes('href="/narzedzia/skaner-cv"'), 'kafelki na /de prowadzą do wersji DE');
    const cj = JSON.parse((await get('/content.json')).text);
    assert.deepEqual(cj.TOOLS['skaner-cv'].slugs, { en: 'cv-scanner', uk: 'skaner-rezyume', de: 'lebenslauf-scanner' });
  } finally { srv.close(); }
});
