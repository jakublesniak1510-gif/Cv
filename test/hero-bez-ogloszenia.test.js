import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 29.10: wyraźna opcja CV bez ogłoszenia w hero – przycisk „ghost” pod głównym przyciskiem (zwykły hero, hero „z reklamy”,
// oba warianty A/B, EN/UK/DE), kreator w trybie zawodu; w hero „z reklamy” wpisane stanowisko trafia od razu do trybu zawodu;
// zdarzenie hero_noad_click z wariantem (normal/ad).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-noad-'));
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { adHeroInner } = await import('../lib/ad-hero.js');
const { EXPERIMENTS } = await import('../lib/ab.js');
const { analyticsRoutes, analyticsDays } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const BTN = (v) => `<a class="btn ghost lg hero-noad-btn" href="/?zamow=1&amp;pkg=cv&amp;tryb=zawod" data-open data-pkg="cv" data-prof data-noad="${v}">Nie mam ogłoszenia – zwykłe CV pod zawód – 39 zł</a>`;

test('Przycisk w obu hero, zaraz pod głównym przyciskiem; zostaje w wariancie B testu hero; tłumaczenia; bez tekstowego linku', async () => {
  const html = read('public/index.html');
  assert.ok(html.includes(`<button class="btn lg" type="submit">Zrób CV pod to ogłoszenie – 39 zł</button>${BTN('normal')}`));
  assert.ok(adHeroInner().includes(`<button class="btn lg" type="submit">Pokaż moje CV za darmo</button>${BTN('ad')}`));
  assert.doesNotMatch(html, /class="hero-noad"/, 'stary link usunięty');
  assert.ok(EXPERIMENTS.cta.apply(html).includes(BTN('normal')), 'wariant B');
  for (const l of ['en', 'uk', 'de']) assert.match(JSON.parse(read(`public/i18n/${l}.json`))['Nie mam ogłoszenia – zwykłe CV pod zawód – 39 zł'], /39/, l);
  assert.ok(Buffer.byteLength(html) <= 90e3);
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    assert.ok((await (await fetch(U + '/?utm_source=google')).text()).includes(BTN('ad')));
    assert.ok((await (await fetch(U + '/en')).text()).includes(BTN('normal')), 'EN: ten sam przycisk (tłumaczony w przeglądarce)');
  } finally { srv.close(); }
  const js = read('public/app.js');
  assert.match(js, /if \(b\.dataset\.noad\) heroNoad\(b\.dataset\.noad\);/);
  assert.match(js, /function heroNoad\(v\) \{ track\('heronoad', \{ v \}\); const q = v === 'ad' \? \$\('#heroAdIn'\)\?\.value\.trim\(\) : ''; if \(q && q\.length < 60 && !\/\\n\/\.test\(q\)\) \$\('#ads \.entry'\)\?\.profRun\?\.\(q\); \}/);
  assert.match(read('public/style.css'), /\.hero-noad-btn\{border:2px solid var\(--brand\)\}/);
});

test('Zdarzenie hero_noad_click z wariantem, raz na osobę dziennie', async () => {
  const app = express(); analyticsRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, v) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': `Mozilla/5.0 ${ua}` }, body: JSON.stringify({ e: 'heronoad', v }) });
  try {
    await t('A', 'normal'); await t('A', 'normal'); await t('B', 'ad'); await t('C', 'cokolwiek');
    await new Promise((r) => setTimeout(r, 300));
    const ev = Object.values(await analyticsDays())[0].events;
    assert.deepEqual([ev.hero_noad_click, ev['hero_noad_click:normal'], ev['hero_noad_click:ad']], [3, 2, 1]);
  } finally { srv.close(); }
});
