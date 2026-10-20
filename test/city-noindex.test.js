import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, sendNotFound, cityIndexable } from '../lib/seo.js';
import { CITIES } from '../lib/cities.js';
import { POPULAR_SLUGS } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';

// Adresy zawodu i zawód × miasto w każdym języku (pl: /cv/<zawód>[/<miasto>], en/uk/de: /<język>/<segment>/<zawód>[/<miasto>]).
const url = (l, p, c) => (l === 'pl' ? `cv/${p}${c ? '/' + c : ''}` : `${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[p].slugLang}${c ? '/' + PROF_LANGS[l].cities[c].slugLang : ''}`);
const LANGS = ['pl', 'en', 'uk', 'de'];
const serve = () => {
  const app = express(), base = 'https://example.test'; seoRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base));
  const srv = app.listen(0), port = srv.address().port;
  const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}/${p}`); return { status: r.status, text: await r.text(), robots: r.headers.get('x-robots-tag') }; };
  return { base, srv, get };
};

test('Zawód × miasto bez danych lokalnych: 200, noindex,follow (meta + nagłówek), canonical do strony zawodu w tym języku, bez hreflang', async () => {
  const { base, srv, get } = serve();
  try {
    assert.ok(!POPULAR_SLUGS.some((p) => CITIES.some((c) => cityIndexable(p, c.slug))), 'dziś żadna para nie ma danych lokalnych');
    for (const l of LANGS) for (const [p, c] of [[POPULAR_SLUGS[0], 'warszawa'], [POPULAR_SLUGS.at(-1), CITIES.at(-1).slug]]) {
      const u = url(l, p, c), { status, text, robots } = await get(u);
      assert.equal(status, 200, u);
      assert.ok(text.includes('<meta name="robots" content="noindex,follow">'), `${u}: meta robots`);
      assert.equal(robots, 'noindex, follow', `${u}: X-Robots-Tag`);
      assert.ok(text.includes(`<link rel="canonical" href="${base}/${url(l, p)}">`), `${u}: canonical do zawodu`);
      assert.equal((text.match(/rel="canonical"/g) || []).length, 1, `${u}: jeden canonical`);
      assert.ok(!/<link rel="alternate" hreflang=/.test(text), `${u}: bez hreflang`);
      // Linki do innych miast zostają (follow): użytkownik i robot mogą po nich przejść.
      const other = CITIES.find((x) => x.slug !== c).slug;
      assert.ok(text.includes(`href="/${url(l, p, other)}"`) && !/rel="nofollow"[^>]*href="\/(cv|en|uk|de)\//.test(text), `${u}: linki do innych miast`);
    }
  } finally { srv.close(); }
});

test('Strony zawodów zostają indeksowane i w mapie strony; mapa strony bez adresów zawód × miasto (pl/en/uk/de)', async () => {
  const { base, srv, get } = serve();
  try {
    const sm = (await get('sitemap.xml')).text;
    for (const l of LANGS) for (const p of POPULAR_SLUGS) {
      assert.ok(sm.includes(`<loc>${base}/${url(l, p)}</loc>`), `sitemap: ${url(l, p)}`);
      for (const c of CITIES) assert.ok(!sm.includes(`<loc>${base}/${url(l, p, c.slug)}</loc>`), `sitemap bez ${url(l, p, c.slug)}`);
    }
    for (const l of LANGS) {
      const u = url(l, POPULAR_SLUGS[0]), { status, text, robots } = await get(u);
      assert.equal(status, 200, u); assert.equal(robots, null, `${u}: bez X-Robots-Tag`);
      assert.ok(!text.includes('name="robots"'), `${u}: indeksowana`);
      assert.ok(text.includes(`<link rel="canonical" href="${base}/${u}">`), `${u}: własny canonical`);
      for (const x of LANGS) assert.ok(text.includes(`hreflang="${x}" href="${base}/${url(x, POPULAR_SLUGS[0])}"`), `${u}: hreflang ${x}`);
      for (const x of LANGS) assert.ok(!text.includes(`href="${base}/${url(x, POPULAR_SLUGS[0], 'warszawa')}"`), `${u}: hreflang bez miast`);
    }
  } finally { srv.close(); }
});

test('Para z prawdziwymi danymi lokalnymi (widełki ze źródłem) jest indeksowana, z hreflang i w mapie strony', async () => {
  const c = CITIES[0], p = POPULAR_SLUGS[0];
  c.local = { [p]: { salary: { min: 5000, max: 6500, source: 'przykładowe źródło' } } };
  const { base, srv, get } = serve();
  try {
    assert.ok(cityIndexable(p, c.slug)); assert.ok(!cityIndexable(POPULAR_SLUGS[1], c.slug));
    const sm = (await get('sitemap.xml')).text;
    for (const l of LANGS) {
      const u = url(l, p, c.slug), { text, robots } = await get(u);
      assert.ok(sm.includes(`<loc>${base}/${u}</loc>`), `sitemap: ${u}`);
      assert.equal(robots, null); assert.ok(!text.includes('name="robots"'), `${u}: indeksowana`);
      assert.ok(text.includes(`<link rel="canonical" href="${base}/${u}">`), `${u}: własny canonical`);
      assert.ok(text.includes(`hreflang="pl" href="${base}/${url('pl', p, c.slug)}"`), `${u}: hreflang`);
    }
  } finally { srv.close(); delete c.local; }
});
