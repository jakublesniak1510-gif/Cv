import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { LEGAL_PAGES, LEGAL_BY_PATH, LEGAL_LANGS, legalBody } from '../lib/legal.js';
import { seoRoutes, sendNotFound } from '../lib/seo.js';

process.env.CONTACT_EMAIL ||= 'kontakt@example.test';

const H1 = {
  regulamin: { pl: 'Regulamin serwisu CV Pod Ogłoszenie', en: 'Terms of Service of CV Pod Ogłoszenie', uk: 'Правила користування сервісом CV Pod Ogłoszenie', de: 'Allgemeine Geschäftsbedingungen des Dienstes CV Pod Ogłoszenie' },
  prywatnosc: { pl: 'Polityka prywatności', en: 'Privacy Policy', uk: 'Політика конфіденційності', de: 'Datenschutzerklärung' },
};

test('Dokumenty prawne: 8 adresów, każdy z jedną wersją językową tekstu, tytuł do 60 i opis do 155 znaków', () => {
  assert.equal(Object.keys(LEGAL_BY_PATH).length, 8);
  for (const [name, v] of Object.entries(LEGAL_PAGES)) for (const l of LEGAL_LANGS) {
    const x = v[l], body = legalBody(name, l);
    assert.ok(x.title.length <= 60, `${x.path}: tytuł ${x.title.length}`);
    assert.ok(x.desc.length <= 155, `${x.path}: opis ${x.desc.length}`);
    assert.equal((body.match(/<h1>/g) || []).length, 1, `${x.path}: jeden H1`);
    assert.ok(body.includes(`<h1>${H1[name][l]}</h1>`), `${x.path}: H1`);
    assert.ok(!body.includes('class="legal-tr"') && !body.includes('class="back"'), `${x.path}: bez obcych bloków`);
    assert.match(x.path, l === 'pl' ? /^[a-z-]+$/ : new RegExp(`^${l}/[a-z-]+$`));
  }
});

test('SSR: strony prawne zwracają 200 z tytułem, lang, canonical, hreflang na 4 wersje, bez noindex; są w sitemapie; stare kotwice w stopce zamienione', async () => {
  const app = express(); const base = 'https://example.test';
  seoRoutes(app, base);
  app.use((req, res) => sendNotFound(req, res, base));
  const srv = app.listen(0); const port = srv.address().port;
  const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, text: await r.text() }; };
  try {
    const sitemap = (await get('/sitemap.xml')).text;
    for (const [path, { name, lang }] of Object.entries(LEGAL_BY_PATH)) {
      const x = LEGAL_PAGES[name][lang], { status, text } = await get('/' + path);
      assert.equal(status, 200, path);
      assert.ok(text.includes(`<html lang="${lang}">`), `${path}: html lang`);
      assert.ok(text.includes(`<title>${x.title} | CV Pod Ogłoszenie</title>`), `${path}: tytuł`);
      assert.ok(text.includes(`<meta name="description" content="${x.desc}">`), `${path}: opis`);
      assert.ok(text.includes(`<link rel="canonical" href="${base}/${path}">`), `${path}: canonical`);
      assert.ok(!text.includes('name="robots" content="noindex"'), `${path}: indeksowana`);
      for (const l of LEGAL_LANGS) assert.ok(text.includes(`hreflang="${l}" href="${base}/${LEGAL_PAGES[name][l].path}"`), `${path}: hreflang ${l}`);
      assert.ok(text.includes(`hreflang="x-default" href="${base}/${LEGAL_PAGES[name].pl.path}"`), `${path}: x-default`);
      assert.ok(text.includes(`<h1>${H1[name][lang]}</h1>`), `${path}: H1`);
      const sec = /<section class="page" id="page" role="main">([\s\S]*?)<\/section>/.exec(text)?.[1] || '';
      assert.equal((sec.match(/<h1>/g) || []).length, 1, `${path}: jeden H1 w treści`);
      assert.ok(!sec.includes('[E-MAIL]'), `${path}: bez znacznika e-maila`);
      assert.ok(text.includes(`window.__ROUTE="legal/${name}"`), `${path}: trasa dla skryptu`);
      assert.ok(sitemap.includes(`<loc>${base}/${path}</loc>`), `${path}: sitemap`);
      if (lang !== 'pl') assert.ok(text.includes(`href="/${LEGAL_PAGES.regulamin[lang].path}"`) && text.includes(`href="/${LEGAL_PAGES.prywatnosc[lang].path}"`), `${path}: linki w stopce w języku`);
    }
    // Strona główna w językach: stopka prowadzi do wersji językowej dokumentów.
    for (const l of ['en', 'uk', 'de']) {
      const { text } = await get('/' + l);
      assert.ok(text.includes(`href="/${LEGAL_PAGES.regulamin[l].path}"`) && text.includes(`href="/${LEGAL_PAGES.prywatnosc[l].path}"`), `/${l}: linki w stopce`);
      assert.ok(!text.includes('href="/regulamin"'), `/${l}: bez polskiego linku`);
    }
    assert.equal((await get('/en/nie-ma')).status, 404);
  } finally { srv.close(); }
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(!/href="\/?#(regulamin|prywatnosc)"/.test(html), 'index.html bez starych kotwic');
  assert.ok(html.includes('href="/regulamin"') && html.includes('href="/polityka-prywatnosci"'));
});
