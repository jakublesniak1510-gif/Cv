import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { templateRoutes } from '../lib/templates.js';
import { abroadRoutes, ABROAD, wizardUrl } from '../lib/abroad.js';
import { LANGS, PRICES } from '../lib/pricing.js';

// Strony „Polacy za granicą”: 6 stron tylko z serwera, treść (długość, FAQ, zakazane sformułowania), SEO, CTA do kreatora z językiem.
const base = 'https://example.test';
let srv, port;
before(() => { const app = express(); seoRoutes(app, base); templateRoutes(app, base); abroadRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base)); srv = app.listen(0); port = srv.address().port; });
after(() => srv.close());
const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, html: await r.text() }; };
const main = (html) => /<section class="page" id="page" role="main"[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1] || '';
const lds = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const words = (s) => String(s || '').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
const BAD = /gwarant|zagwarant|\d+\s?%|na pewno dostaniesz|\*\*|^#|`|\[[^\]]+\]\(/im;
const SLUGS = ['cv-po-niemiecku', 'cv-po-angielsku', 'praca-w-niemczech-cv', 'praca-w-uk-cv', 'praca-w-holandii-cv', 'praca-w-irlandii-cv'];
const price = `${PRICES.cv / 100} zł`;

test('Treści: 6 stron, ≥ 800 słów (krótsze ≥ 500), 4–6 FAQ, meta, bez obietnic, procentów i Markdownu, bez powtórzonych zdań', () => {
  assert.deepEqual(ABROAD.map((a) => a.slug).sort(), [...SLUGS].sort());
  const seen = new Map();
  for (const a of ABROAD) {
    const body = [a.intro, ...a.sections.flatMap((s) => [s.h, ...s.p, ...(s.list || [])])];
    const n = words(body.join(' ')), min = a.short ? 500 : 800;
    assert.ok(n >= min, `${a.slug}: ${n} słów (min. ${min})`);
    assert.ok(a.faq.length >= 4 && a.faq.length <= 6, `${a.slug}: FAQ ${a.faq.length}`);
    for (const f of a.faq) assert.ok(f.q.endsWith('?') && words(f.a) >= 15, `${a.slug}: FAQ „${f.q}”`);
    assert.ok(a.seoTitle.length <= 65, `${a.slug}: seoTitle ${a.seoTitle.length}`);
    assert.ok(a.metaDescription.length >= 110 && a.metaDescription.length <= 160, `${a.slug}: metaDescription ${a.metaDescription.length}`);
    assert.ok(LANGS[a.lang], `${a.slug}: język dokumentów ${a.lang}`);
    for (const s of [...body, a.title, a.seoTitle, a.metaDescription, ...a.faq.flatMap((f) => [f.q, f.a])]) assert.doesNotMatch(s, BAD, `${a.slug}: „${s.slice(0, 80)}”`);
    for (const s of body.join(' ').split(/(?<=[.!?])\s+/).map((z) => z.trim().toLowerCase()).filter((z) => words(z) >= 8)) {
      assert.ok(!seen.has(s) || seen.get(s) === a.slug, `${a.slug}: zdanie powtórzone z ${seen.get(s)}: „${s.slice(0, 70)}”`); seen.set(s, a.slug);
    }
  }
});

test('Strony: 200, jeden H1 w treści, canonical, FAQPage i BreadcrumbList, CTA z ceną i językiem, skaner, linki między stronami', async () => {
  for (const a of ABROAD) {
    const r = await get(`/${a.slug}`), h = r.html, m = main(h);
    assert.equal(r.status, 200, a.slug);
    assert.equal((m.match(/<h1>/g) || []).length, 1, `${a.slug}: jeden H1`);
    assert.ok(h.includes(`<link rel="canonical" href="${base}/${a.slug}">`), `${a.slug}: canonical`);
    assert.doesNotMatch(h, /<meta name="robots" content="noindex">/);
    assert.ok(/<script src="\/lite\.js\?v=/.test(h) && !h.includes('id="wiz"'), 'lekka strona (bez kreatora w kodzie)');
    const data = lds(h), faq = data.find((x) => x['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, a.faq.length);
    assert.ok(data.some((x) => x['@type'] === 'BreadcrumbList'));
    const inLang = a.lang === 'de' ? 'po niemiecku' : 'po angielsku';
    assert.ok(m.includes(`Zrób CV ${inLang} pod konkretne ogłoszenie – od ${price}`), `${a.slug}: CTA`);
    assert.ok(m.includes(`href="${wizardUrl(a.lang)}"`) && wizardUrl(a.lang) === `/?zamow=1&jezyk=${a.lang}`);
    assert.ok(m.includes('href="/narzedzia/skaner-cv"'));
    for (const o of SLUGS.filter((s) => s !== a.slug)) assert.ok(m.includes(`href="/${o}"`), `${a.slug} → ${o}`);
  }
  assert.ok(main((await get('/praca-w-niemczech-cv')).html).includes('href="/poradnik/cv-do-pracy-w-niemczech"'));
});

test('Mapa strony, link z artykułu cv-do-pracy-w-niemczech i z huba /wzor-cv', async () => {
  const sm = (await get('/sitemap.xml')).html;
  for (const s of SLUGS) assert.ok(sm.includes(`<loc>${base}/${s}</loc>`), `sitemap: ${s}`);
  const art = main((await get('/poradnik/cv-do-pracy-w-niemczech')).html), hub = main((await get('/wzor-cv')).html);
  for (const s of SLUGS) { assert.ok(art.includes(`href="/${s}"`), `artykuł → ${s}`); assert.ok(hub.includes(`href="/${s}"`), `/wzor-cv → ${s}`); }
  assert.match(hub, /<h2>CV za granicę<\/h2>/);
});

test('Kreator: parametr ?jezyk= ustawia język dokumentów pierwszego ogłoszenia (public/app.js)', () => {
  const js = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(js, /LANGS\[q\.get\('jezyk'\)\]/);
  assert.match(js, /\$\('#ads \.entry \[data-k=lang\]'\)[^\n]*s\.value = q\.get\('jezyk'\)/);
  for (const l of ['de', 'en']) assert.match(js, new RegExp(`<option value="${l}">`));
});
