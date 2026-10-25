import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { portalRoutes, PORTALS, portalPath } from '../lib/portals.js';
import { portalDesc } from '../lib/portals.js';

// Strony „CV pod ogłoszenie z <portal>”: 3 kroki, własny schemat (bez logotypów), CTA do kreatora i skanera, informacja
// o niezależności, rozszerzenie Chrome tylko z CHROME_EXT_URL; mapa strony, link z poradnika i ze stopki.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const PROMISE = /gwarant|najlepsz|zatrudnieni[ae] w|pewn[aą] prac|75\s?%/i;

test('7 portali + hub: treść, tytuły wg szablonu, bez logotypów i obietnic, niezależność od portalu', async () => {
  assert.deepEqual(PORTALS.map((p) => p.slug), ['pracuj-pl', 'olx-praca', 'indeed', 'linkedin', 'nofluffjobs', 'justjoin-it', 'praca-pl']);
  const app = express(); seoRoutes(app, 'https://example.test'); portalRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const p of PORTALS) {
      const r = await fetch(`${U}/${portalPath(p.slug)}`), h = await r.text(), main = h.slice(h.indexOf('id="page"'));
      assert.equal(r.status, 200, p.slug);
      assert.match(h, new RegExp(`<title>CV pod ogłoszenie z ${p.name.replace('.', '\\.')} – wklej ofertę, odbierz CV`));
      assert.ok(portalDesc(p).length <= 155, `${p.slug}: opis ${portalDesc(p).length}`);
      assert.match(main, /<ol class="steps-num">/); assert.equal((main.match(/<li><b>/g) || []).length, 3, `${p.slug}: 3 kroki`);
      assert.match(main, /<svg viewBox="0 0 640 200" role="img"/); assert.doesNotMatch(main, /<img\b/, 'bez obrazków z logotypami');
      assert.match(main, /href="\/\?zamow=1"/); assert.match(main, /href="\/narzedzia\/skaner-cv"/);
      assert.ok(main.includes(`niezależny serwis, niepowiązany z ${p.name}`), `${p.slug}: niezależność`);
      assert.doesNotMatch(main, /chromewebstore/, 'bez CHROME_EXT_URL bez linku');
      assert.doesNotMatch(JSON.stringify(p), PROMISE, p.slug);
    }
    const hub = await (await fetch(`${U}/cv-pod-ogloszenie-z`)).text();
    for (const p of PORTALS) assert.ok(hub.includes(`href="/${portalPath(p.slug)}"`), `hub → ${p.slug}`);
    process.env.CHROME_EXT_URL = 'https://chromewebstore.google.com/detail/cv-pod-ogloszenie/abc';
    assert.match(await (await fetch(`${U}/${portalPath('pracuj-pl')}`)).text(), /href="https:\/\/chromewebstore\.google\.com\/detail\/cv-pod-ogloszenie\/abc"/);
    delete process.env.CHROME_EXT_URL;
    const map = await (await fetch(`${U}/sitemap.xml`)).text();
    for (const u of ['cv-pod-ogloszenie-z', ...PORTALS.map((p) => portalPath(p.slug))]) assert.ok(map.includes(`example.test/${u}<`), `${u} w mapie`);
    assert.match(await (await fetch(`${U}/poradnik`)).text(), /<a href="\/cv-pod-ogloszenie-z">CV pod ogłoszenie z portali pracy<\/a>/);
  } finally { srv.close(); }
  assert.match(read('public/index.html'), /<a href="\/cv-pod-ogloszenie-z">CV z portali pracy<\/a>/, 'stopka');
});
