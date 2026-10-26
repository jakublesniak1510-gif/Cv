import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { EXPERIMENTS } from '../lib/ab.js';

// PR L: jedna linijka „Aplikujesz dziś?” pod CTA na stronie głównej i w kreatorze (krok 1); tekst zatwierdzony, bez widełek minut.
const L = 'Aplikujesz dziś? CV i list będą gotowe zwykle w kilka minut.';
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('„Aplikujesz dziś?”: pod CTA i w kroku 1 kreatora, 4 języki, bez powtórzenia „kilka minut” w hero', async () => {
  const h = read('public/index.html'), hero = h.slice(h.indexOf('<section class="hero"'), h.indexOf('</section>', h.indexOf('<section class="hero"')));
  assert.match(hero, new RegExp(`</form>\\n    <p class="hero-today">${L.replace('?', '\\?')}</p>`), 'zaraz pod przyciskami');
  assert.equal(hero.match(/kilka minut/g).length, 1, 'jedna wzmianka o czasie w hero');
  const s1 = h.slice(h.indexOf('<section data-step="1">'), h.indexOf('id="pkgOpts"'));
  assert.ok(s1.includes(`<p class="wiz-today">${L}</p>`), 'krok 1 kreatora, nad pakietami');
  assert.doesNotMatch(hero + s1, /5[–-]10 minut/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); assert.ok(d[L] && d['BLIK lub karta · bez subskrypcji'], l); }
  for (const k of ['hero', 'cta']) assert.notEqual(EXPERIMENTS[k].apply(h), h, k);
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try { assert.ok((await (await fetch(`${U}/`)).text()).includes(`<p class="hero-today">${L}</p>`)); } finally { srv.close(); }
});
