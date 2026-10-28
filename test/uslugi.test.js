import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { servicesPageRoutes } from '../lib/services-page.js';
import { SERVICES, zl } from '../lib/services.js';
import { PRICES, OUT_TIERS } from '../lib/pricing.js';

// Usługi (28.10): strona /uslugi (PL, sitemap, canonical), „Usługi” w menu i stopce, pasek „Inne usługi” pod cennikiem,
// linijka po zakupie CV (zdjęcie i tłumaczenie). Ceny tylko z lib/pricing.js.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const B = 'https://example.test';
async function serve(f) {
  const app = express(); seoRoutes(app, B); servicesPageRoutes(app, B);
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try { return await f((p) => fetch(U + p).then(async (r) => ({ status: r.status, h: await r.text() }))); } finally { srv.close(); }
}
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('/uslugi: karty z cenami z cennika, dwie grupy, canonical, w sitemapie; selekcja tylko przy SELECTION_ENABLED', async () => {
  delete process.env.SELECTION_ENABLED;
  await serve(async (get) => {
    const { status, h } = await get('/uslugi'); assert.equal(status, 200);
    assert.match(h, new RegExp(`<link rel="canonical" href="${B}/uslugi">`)); assert.doesNotMatch(h, /name="robots" content="noindex/);
    const page = /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>/.exec(h)[1], t = text(page);
    assert.match(page, /<h1>Usługi/); assert.match(t, /Dla osób szukających pracy/); assert.match(t, /Dla firm/);
    const want = [['/#cennik', zl(PRICES.cv)], ['/narzedzia/zdjecie-do-cv', zl(PRICES.photo)], ['/szablony-premium', zl(PRICES.templates)], ['/tlumaczenie-cv', zl(PRICES.translation)],
      ['/uslugi/dotacja-z-urzedu-pracy', `${zl(PRICES.grantplan)} / ${zl(PRICES.grantfull)}`], ['/uslugi/oferta-na-zlecenie', `${zl(PRICES.offer)} / 5 za ${zl(PRICES.offerpack)}`],
      ['/dla-firm/sprawdz-ogloszenie', zl(PRICES.adcheck)], ['/dla-firm/outplacement', `od ${zl(Math.min(...OUT_TIERS.map((x) => x.unit)))}/os.`]];
    for (const [url, price] of want) assert.match(page, new RegExp(`<a class="svc-card" href="${url.replace(/[/#]/g, '\\$&')}"><h3>[^<]+</h3><p class="svc-price">${price.replace(/\//g, '\\/')}</p>`), url);
    assert.equal((page.match(/class="svc-card"/g) || []).length, 8); assert.doesNotMatch(page, /selekcja-cv/);
    assert.doesNotMatch(t, /najlepsz|gwarant|tylko dziś|ostatnia szansa|zatrudnien/i); assert.doesNotMatch(page, /<s>|<del>|line-through/);
    assert.match((await get('/sitemap.xml')).h, new RegExp(`<loc>${B}/uslugi</loc>`));
  });
  process.env.SELECTION_ENABLED = '1';
  try { assert.ok(SERVICES().some((s) => s.url === '/dla-firm/selekcja-cv' && s.price === `${zl(PRICES.selection20)} / ${zl(PRICES.selection50)}`)); } finally { delete process.env.SELECTION_ENABLED; }
});

test('Menu, stopka i pasek „Inne usługi” pod cennikiem – tylko po polsku', async () => {
  const idx = read('public/index.html');
  const nav = /<header class="nav"[\s\S]*?<\/header>/.exec(idx)[0], foot = /<footer class="foot"[\s\S]*?<\/footer>/.exec(idx)[0];
  assert.equal((nav.match(/<a href="\/uslugi" data-pl>Usługi<\/a>/g) || []).length, 2, 'menu desktop i mobilne');
  assert.match(foot, /<a href="\/uslugi" data-pl>Wszystkie usługi<\/a>/);
  await serve(async (get) => {
    const pl = (await get('/')).h, cen = /<section class="sec" id="cennik">([\s\S]*?)<\/section>/.exec(pl)[1];
    const bar = /<nav class="svc-bar"[\s\S]*?<\/nav>/.exec(cen)?.[0]; assert.ok(bar, 'pasek w cenniku');
    const links = [...bar.matchAll(/<a href="([^"]+)">/g)].map((m) => m[1]); assert.ok(links.length >= 5 && links.length <= 7, String(links.length));
    for (const u of ['/narzedzia/zdjecie-do-cv', '/szablony-premium', '/tlumaczenie-cv', '/uslugi/dotacja-z-urzedu-pracy', '/uslugi/oferta-na-zlecenie', '/uslugi']) assert.ok(links.includes(u), u);
    assert.match(bar, new RegExp(`Zdjęcie do CV <span>${zl(PRICES.photo)}</span>`)); assert.match(bar, new RegExp(`Dotacja z urzędu pracy <span>od ${zl(PRICES.grantplan)}</span>`));
    for (const l of ['en', 'uk', 'de']) { const h = (await get(`/${l}`)).h; assert.doesNotMatch(h, /svc-bar|href="\/uslugi"/, l); }
  });
  assert.ok(Buffer.byteLength(idx) <= 90e3, `index.html: ${Buffer.byteLength(idx)} B`);
});

test('Po zakupie CV: jedna linijka ze zdjęciem i tłumaczeniem, ceny z /api/config, bez okienek', () => {
  const app = read('public/app.js'), f = /function drawXsell\(\) \{[\s\S]*?\n\}/.exec(app)?.[0];
  assert.ok(f); assert.match(app, /drawUpsell\(\); drawXsell\(\);/);
  assert.match(f, /PRICE\.photo/); assert.match(f, /PRICE\.translation/); assert.match(f, /'\/narzedzia\/zdjecie-do-cv'/); assert.match(f, /'\/tlumaczenie-cv'/);
  assert.doesNotMatch(f, /\d+ zł/, 'bez cen na sztywno'); assert.doesNotMatch(f, /dialog|modal|setTimeout|alert/);
  for (const l of ['en', 'uk', 'de']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Przyda się też:'], l);
});
