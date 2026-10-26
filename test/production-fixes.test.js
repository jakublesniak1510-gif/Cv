import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-fixes-'));
const { seoRoutes } = await import('../lib/seo.js');
const { PROF_LANGS } = await import('../lib/professions-i18n.js');
const { passRoutes } = await import('../lib/passes.js');

// Poprawki z testu produkcyjnego: przycisk zamówienia w treści stron zawodów (4 języki), pasek „Zacznij” na lekkich
// stronach, link do pojedynczego CV na /karnety, baner cookies nad stopką kreatora, przekierowanie /dla-instytucji.
test('Strony zawodów: po wstępie „Masz ogłoszenie?” (skaner), potem przyciski skaner → „Zrób CV pod ogłoszenie – od 39 zł”, w 4 językach', async () => {
  const app = express(); seoRoutes(app, 'https://example.test'); passRoutes(app, { BASE_URL: 'https://example.test' });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, get = async (p) => (await fetch(U + p)).text();
  try {
    const pages = { pl: ['/cv/kasjer', '/?zamow=1&amp;zawod=kasjer', 'Zrób CV pod ogłoszenie – od 39 zł'] };
    for (const [l, txt] of [['en', 'from 39 zł'], ['uk', 'від 39 zł'], ['de', 'ab 39 zł']]) pages[l] = [`/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof.kasjer.slugLang}`, `/${l}?zamow=1&amp;zawod=kasjer`, txt];
    for (const [l, [url, href, txt]] of Object.entries(pages)) {
      const h = await get(url), ctas = [...h.matchAll(/<p class="prof-cta">(?:<a class="btn ghost" href="[^"]+">[^<]+<\/a> )?<a class="btn" href="([^"]+)">([^<]+)<\/a><\/p>/g)];
      assert.equal(ctas.length, 2, `${l}: dwa przyciski`);
      for (const [, a, t] of ctas) { assert.equal(a, href, `${l}: link do kreatora`); assert.ok(t.includes(txt), `${l}: ${t}`); }
      assert.ok(h.indexOf('class="paste-ad"') > h.indexOf('class="lead"') && h.indexOf('class="paste-ad"') < h.indexOf('prof-cta'), `${l}: najpierw „Masz ogłoszenie?” po wstępie`);
      assert.ok(h.includes('id="mcta"'), `${l}: pasek „Zacznij”`);
    }
    const k = await get('/karnety');
    assert.match(k, /<a href="\/\?zamow=1">albo zamów pojedyncze CV<\/a>/);
  } finally { srv.close(); }
});

test('Lekkie strony: lite.js pokazuje pasek „Zacznij” po przewinięciu; kreator kończy się nad banerem cookies', () => {
  const lite = fs.readFileSync('public/lite.js', 'utf8'), css = fs.readFileSync('public/style.css', 'utf8'), consent = fs.readFileSync('public/consent.js', 'utf8');
  assert.match(lite, /#mcta[\s\S]*mcta-on[\s\S]*scrollY >= 0\.4 \* Math\.max/, 'B1: pasek po 40% strony zawodu');
  assert.match(css, /\.wiz\{padding-bottom:calc\(16px \+ var\(--consent-h,0px\)\)\}/);
  assert.match(css, /@media\(max-width:640px\)\{\.wiz\{padding:0 0 var\(--consent-h,0px\)\}\}/);
  assert.match(css, /body:has\(\.wiz:not\(\[hidden\]\)\) \.consent p span\{display:none\}/);
  assert.match(consent, /--consent-h/); assert.match(consent, /removeProperty\('--consent-h'\)/);
  assert.match(consent, /data-c="denied"/, 'wybór „Tylko niezbędne” zostaje (bez wymuszania zgody)');
});

test('/dla-instytucji → 301 /dla-firm (bez zmiany /dla-instytucji/zamow)', () => {
  const s = fs.readFileSync('server.js', 'utf8');
  assert.match(s, /app\.get\('\/dla-instytucji', \(_req, res\) => res\.redirect\(301, '\/dla-firm'\)\)/);
});
