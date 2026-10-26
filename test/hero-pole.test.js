import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// C4 (26.10): hero z jednym polem „Wklej link albo treść ogłoszenia” → kreator z tym ogłoszeniem; linia z warunkami pod przyciskiem.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-c4-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, funnelRange, funnelText } = await import('../lib/analytics.js');
const { EXPERIMENTS } = await import('../lib/ab.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

test('Hero: pole na ogłoszenie i przycisk zaraz pod nagłówkiem, linia warunków, skaner niżej jako druga ścieżka', () => {
  const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('</section>', html.indexOf('<section class="hero"')));
  assert.match(hero, /<p class="lead">[^<]+<\/p>\s*<form class="hero-ad" id="heroAd" novalidate><textarea id="heroAdIn" rows="2" aria-label="Link albo treść ogłoszenia" placeholder="Wklej link albo treść ogłoszenia"><\/textarea><button class="btn lg" type="submit">Zrób CV pod to ogłoszenie – 39 zł<\/button><p class="hero-line">39 zł jednorazowo · bez abonamentu · BLIK w 10 sekund · 5 poprawek w cenie<\/p><\/form>/);
  assert.ok(hero.indexOf('id="heroAd"') < hero.indexOf('hero-scan'), 'skaner pod polem');
  assert.doesNotMatch(hero, /data-open>Zamów CV od 39 zł/, 'jeden główny przycisk');
  assert.ok(html.indexOf('id="skaner"') > html.indexOf('id="heroAd"'));
});

test('Wysłanie: kreator „Samo CV”, link → pobranie jak w kreatorze, treść → pierwsze ogłoszenie; puste pole → fokus', () => {
  assert.match(app, /if \(!v\) \{ ta\.focus\(\); ta\.classList\.add\('err'\); return; \}/);
  assert.match(app, /openWiz\('cv'\); track\('heroad'\);/);
  assert.match(app, /setMode\(first, 'link'\); \$\('\[data-k=url\]', first\)\.value = v; \$\('\.fetchbtn', first\)\.click\(\);/);
  assert.match(app, /setMode\(first, 'paste'\); \$\('\[data-k=text\]', first\)\.value = v\.slice\(0, 10000\);/);
  for (const l of ['en', 'de', 'uk']) for (const k of ['Wklej link albo treść ogłoszenia', 'Link albo treść ogłoszenia', 'Zrób CV pod to ogłoszenie – 39 zł', '39 zł jednorazowo · bez abonamentu · BLIK w 10 sekund · 5 poprawek w cenie']) assert.ok(dict(l)[k], `${l}: ${k}`);
});

test('Test A/B „cta”: wariant B zamiast pola prowadzi do skanera', () => {
  const b = EXPERIMENTS.cta.apply(html);
  assert.ok(!b.includes('id="heroAd"') && b.includes('<div class="cta"><a class="btn lg" href="#skaner">Sprawdź za darmo, potem zrób CV</a></div>'));
});

test('Zdarzenie hero_ad_submit w raporcie lejka', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const ua of ['Mozilla/5.0 H1', 'Mozilla/5.0 H1', 'Mozilla/5.0 H2']) await fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify({ e: 'heroad' }) });
    await new Promise((r) => setTimeout(r, 300));
    const d = Object.values(await analyticsDays())[0];
    assert.equal(d.events.hero_ad_submit, 2);
    assert.match(funnelText(await funnelRange(d.id, d.id)), /Pole ogłoszenia na stronie głównej → kreator: 2\./);
  } finally { srv.close(); }
});
