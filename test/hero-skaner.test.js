import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { EXPERIMENTS } from '../lib/ab.js';
import { toolUrl } from '../lib/tools-i18n.js';

// Pod przyciskami hero: mały link do darmowego skanera (w każdej wersji językowej do skanera w tym języku).
// Testy A/B „hero” i „cta” nadal znajdują swoje elementy.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('Hero: link „Nie wiesz, czy warto? Sprawdź CV za darmo” pod CTA, do skanera w języku strony', async () => {
  const h = read('public/index.html'), hero = h.slice(h.indexOf('<section class="hero"'), h.indexOf('</section>', h.indexOf('<section class="hero"')));
  assert.ok(hero.indexOf('class="cta"') < hero.indexOf('class="hero-scan"'), 'pod przyciskami');
  assert.match(hero, /<p class="hero-scan"><a href="\/narzedzia\/skaner-cv">Nie wiesz, czy warto\? Sprawdź CV za darmo<\/a><\/p>/);
  for (const k of ['hero', 'cta']) assert.notEqual(EXPERIMENTS[k].apply(h), h, k);
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    assert.match(await (await fetch(`${U}/`)).text(), /<p class="hero-scan"><a href="\/narzedzia\/skaner-cv">/);
    for (const l of ['en', 'de', 'uk']) {
      const x = await (await fetch(`${U}/${l}`)).text(), href = /<p class="hero-scan"><a href="([^"]+)"/.exec(x)?.[1];
      assert.equal(href, `/${toolUrl(l, 'skaner-cv')}`, l);
      assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Nie wiesz, czy warto? Sprawdź CV za darmo'], l);
    }
  } finally { srv.close(); }
});
