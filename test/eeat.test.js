import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { templateRoutes } from '../lib/templates.js';
import { employerRoutes } from '../lib/employers.js';
import { PROFESSIONS, ARTICLES } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { ART_LANGS } from '../lib/articles-i18n.js';
import { TEMPLATES } from '../lib/templates-content/index.js';
import { EMPLOYERS } from '../lib/employers-data.js';

// E-E-A-T: autor i prawdziwa data ostatniej zmiany treści (seo-data/content-dates.json z historii gita, nie data wdrożenia).
const D = JSON.parse(fs.readFileSync('seo-data/content-dates.json', 'utf8')), ISO = /^20\d\d-\d\d-\d\d$/;

test('Daty treści: każda strona (zawód, poradnik, wzór, pracodawca; EN/UK/DE) ma datę – po dodaniu treści: node scripts/content-dates.mjs', () => {
  const today = new Date().toISOString().slice(0, 10), ok = (d, k) => assert.ok(ISO.test(d || '') && d <= today, `${k}: ${d}`);
  for (const p of PROFESSIONS) ok(D.prof[p.slug], `prof ${p.slug}`);
  for (const a of ARTICLES) ok(D.art[a.slug], `art ${a.slug}`);
  for (const t of Object.values(TEMPLATES)) ok(D.tpl[t.slug], `tpl ${t.slug}`);
  for (const e of EMPLOYERS) ok(D.emp[e.slug], `emp ${e.slug}`);
  for (const l of ['en', 'uk', 'de']) {
    for (const k of Object.keys(PROF_LANGS[l].prof)) ok(D[`prof-${l}`][k], `prof-${l} ${k}`);
    for (const k of Object.keys(ART_LANGS[l].data)) ok(D[`art-${l}`][k], `art-${l} ${k}`);
  }
});

test('Podpis „Autor · Zaktualizowano”, author (Person) i dateModified z danych; strony autora i zasad; lastmod w mapie strony', async () => {
  const B = 'https://example.test', app = express(); seoRoutes(app, B); templateRoutes(app, B); employerRoutes(app, B);
  const s = app.listen(0), U = `http://127.0.0.1:${s.address().port}`, get = async (p) => (await fetch(U + p)).text();
  const dmy = (iso) => iso.split('-').reverse().join('.');
  try {
    const t = Object.values(TEMPLATES)[0], e = EMPLOYERS[0], a = ARTICLES[0], p = PROFESSIONS[0];
    const pages = [[`/poradnik/${a.slug}`, D.art[a.slug], 'Autor', 'Zaktualizowano'], [`/cv/${p.slug}`, D.prof[p.slug], 'Autor', 'Zaktualizowano'], [`/wzor-cv/${t.slug}`, D.tpl[t.slug], 'Autor', 'Zaktualizowano'],
      [`/list-motywacyjny/${t.slug}`, D.tpl[t.slug], 'Autor', 'Zaktualizowano'], [`/praca-w/${e.slug}`, D.emp[e.slug], 'Autor', 'Zaktualizowano'],
      [`/en/cv/${PROF_LANGS.en.prof[p.slug].slugLang}`, D['prof-en'][p.slug], 'Author', 'Updated'], [`/de/${ART_LANGS.de.seg}/${ART_LANGS.de.data[a.slug].slugLang}`, D['art-de'][a.slug], 'Autor', 'Aktualisiert']];
    for (const [path, d, au, up] of pages) {
      const h = await get(path);
      assert.ok(h.includes(`<p class="byline">${au}: <a href="/autor/jakub-lesniak" rel="author">Jakub Leśniak</a> · ${up}: <time datetime="${d}">${dmy(d)}</time></p>`), `${path}: podpis`);
      assert.ok(h.includes(`"dateModified":"${d}"`), `${path}: dateModified`);
      assert.ok(h.includes(`"author":{"@type":"Person","@id":"${B}/autor/jakub-lesniak#osoba","name":"Jakub Leśniak","url":"${B}/autor/jakub-lesniak"}`), `${path}: author`);
    }
    const home = await get('/');
    assert.match(home, /"founder":\{"@type":"Person","@id":"https:\/\/example\.test\/autor\/jakub-lesniak#osoba"/, 'Organization → Person (founder)');
    const au = await get('/autor/jakub-lesniak'), zr = await get('/zasady-redakcyjne'), about = await get('/o-serwisie');
    assert.match(au, /<h1>Jakub Leśniak<\/h1>/); assert.match(au, /"@type":"ProfilePage"/); assert.match(au, /"worksFor":\{"@id":"https:\/\/example\.test\/#organizacja"\}/);
    assert.match(au, /href="\/zasady-redakcyjne"/);
    // Bez wymyślonych kwalifikacji i doświadczenia: tylko fakty z /o-serwisie.
    assert.doesNotMatch(au + zr, /lat doświadczenia|certyfik|ekspert|specjalista HR|rekruter z|doradca kariery z/i);
    for (const h2 of ['Źródła', 'Rola AI', 'Aktualizacje', 'Zgłoś błąd']) assert.ok(zr.includes(`<h2>${h2}</h2>`), h2);
    assert.match(about, /href="\/autor\/jakub-lesniak"/); assert.match(about, /href="\/zasady-redakcyjne"/);
    const sm = await get('/sitemap.xml');
    assert.ok(sm.includes(`<loc>${B}/cv/${p.slug}</loc><lastmod>${D.prof[p.slug]}</lastmod>`), 'lastmod strony zawodu');
    assert.ok(sm.includes(`<loc>${B}/autor/jakub-lesniak</loc>`) && sm.includes(`<loc>${B}/zasady-redakcyjne</loc>`));
  } finally { s.close(); }
});
