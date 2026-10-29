import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Hero „z reklamy” także dla ruchu z naszych kanałów (29.10): utm_source yt/youtube/ig/instagram/fb/facebook/tiktok/pinterest
// albo utm_campaign „sprzedaz-…”; ten sam warunek po stronie serwera i w app.js; źródło w lejku jak dotąd (yt → youtube).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-herokan-'));
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { isAdHit } = await import('../lib/ad-hero.js');
const { sourceOf } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('Warunek: nasze kanały i kampanie „sprzedaz-…” włączają hero; inne źródła nie', async () => {
  for (const u of ['yt', 'YouTube', 'ig', 'instagram', 'fb', 'facebook', 'tiktok', 'pinterest', 'google', 'meta']) assert.ok(isAdHit({ utm_source: u }), u);
  assert.ok(isAdHit({ utm_campaign: 'sprzedaz-listopad' })); assert.ok(isAdHit({ utm_source: 'newsletter', utm_campaign: 'Sprzedaz-yt-1' }));
  for (const q of [{ utm_source: 'newsletter' }, { utm_source: 'share' }, { utm_source: 'youtube-shorts' }, { utm_campaign: 'promo-sprzedaz-1' }, {}]) assert.ok(!isAdHit(q), JSON.stringify(q));
  assert.deepEqual(['yt', 'youtube', 'ig', 'fb', 'tiktok', 'pinterest'].map((u) => sourceOf('', u)), ['youtube', 'youtube', 'instagram', 'facebook', 'tiktok', 'inne']);
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const q of ['?utm_source=yt', '?utm_source=tiktok&utm_medium=bio', '?utm_campaign=sprzedaz-31-10']) {
      const r = await fetch(U + '/' + q), h = await r.text();
      assert.match(h, /<section class="hero" id="top" data-adhero="1">/, q); assert.match(r.headers.get('cache-control') || '', /no-store/, q);
    }
    assert.doesNotMatch(await (await fetch(U + '/?utm_source=newsletter')).text(), /data-adhero/);
  } finally { srv.close(); }
  const app2 = read('public/app.js');
  assert.match(app2, /const AD_HIT = \/\^\(google\|meta\|yt\|youtube\|ig\|instagram\|fb\|facebook\|tiktok\|pinterest\)\$\/i\.test\(AD_Q\.get\('utm_source'\) \|\| ''\) \|\| \/\^sprzedaz-\/i\.test\(AD_Q\.get\('utm_campaign'\) \|\| ''\) \|\| AD_SRC;/, 'ten sam warunek co isAdHit');
  assert.match(read('lib/ad-hero.js'), /AD_SOURCE_RE = \/\^\(google\|meta\|yt\|youtube\|ig\|instagram\|fb\|facebook\|tiktok\|pinterest\)\$\/i, AD_CAMPAIGN_RE = \/\^sprzedaz-\/i/);
});
