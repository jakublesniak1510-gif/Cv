import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Pinterest (2.11): grafika 1000×1500 dla każdej strony zawodu i poradnika PL pod /og/pin/<slug>.png (tytuł, podtytuł, logo,
// kolory strony), jako drugi og:image po 1200×630; generowana przy pierwszym wejściu i trzymana w pamięci; treść stron bez zmian.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-pin-'));
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { pinSvg, pinData, pinPng } = await import('../lib/pin-img.js');
const { PROFESSIONS, ARTICLES } = await import('../lib/content.js');
const { PROF_LANGS } = await import('../lib/professions-i18n.js');
const size = (b) => [b.readUInt32BE(16), b.readUInt32BE(20)]; // nagłówek IHDR PNG
const SLUGS = [...PROFESSIONS.map((p) => p.slug), ...ARTICLES.map((a) => a.slug)];

test('Dla każdej strony zawodu i poradnika: dane grafiki, podtytuł nie nachodzi na przycisk, bez kolizji slugów', () => {
  assert.equal(new Set(SLUGS).size, SLUGS.length, 'slugi zawodów i poradników się nie powtarzają');
  for (const s of SLUGS) {
    const d = pinData(s); assert.ok(d?.title && d.sub && d.kind && d.cta, s);
    const svg = pinSvg(d), ys = [...svg.matchAll(/<text x="80" y="([\d.]+)" font-family="Inter" font-size="38"/g)].map((m) => +m[1]);
    assert.ok(ys.length >= 1 && Math.max(...ys) <= 1500 - 250 - 40, `${s}: podtytuł nad przyciskiem`);
  }
  assert.equal(pinData('nie-ma'), null);
  assert.equal(pinData('magazynier').title, 'CV magazyniera', 'tytuł bez „: wzór i wskazówki”');
  const png = pinPng('magazynier'); assert.deepEqual(size(png), [1000, 1500]); assert.equal(pinPng('magazynier'), png, 'z pamięci');
});

test('Trasa /og/pin/<slug>.png i drugi og:image (1000×1500) na stronach PL; nie na EN; 404 dla nieznanych', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const s of ['magazynier', 'portier', 'jak-dopasowac-cv-do-ogloszenia']) {
      const r = await fetch(`${U}/og/pin/${s}.png`); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/png');
      assert.match(r.headers.get('cache-control'), /max-age=604800/); assert.deepEqual(size(Buffer.from(await r.arrayBuffer())), [1000, 1500]);
    }
    for (const u of ['/og/pin/nie-ma.png', '/og/pin/magazynier.jpg', '/og/pin/..%2Fserver.png']) assert.equal((await fetch(U + u)).status, 404, u);
    for (const [u, s] of [['/cv/magazynier', 'magazynier'], ['/poradnik/cv-dla-ucznia', 'cv-dla-ucznia']]) {
      const h = await (await fetch(U + u)).text(), imgs = [...h.matchAll(/<meta property="og:image" content="([^"]+)">/g)].map((m) => m[1]);
      assert.deepEqual(imgs, ['https://example.test/og.png', `https://example.test/og/pin/${s}.png`], `${u}: pierwszy 1200×630, drugi pin`);
      assert.match(h, new RegExp(`og/pin/${s}\\.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1000"><meta property="og:image:height" content="1500">`));
    }
    const en = await (await fetch(`${U}/en/${PROF_LANGS.en.seg}/${PROF_LANGS.en.prof.magazynier.slugLang}`)).text();
    assert.doesNotMatch(en, /og\/pin\//, 'tylko strony PL');
    assert.doesNotMatch(await (await fetch(`${U}/`)).text(), /og\/pin\//, 'strona główna bez zmian');
  } finally { srv.close(); }
});
