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

test('Daty treści: każda strona (zawód, poradnik, wzór, pracodawca; EN/UK/DE) ma datę i aktualny skrót treści', async () => {
  const { contentPages, contentHash } = await import('../lib/content-keys.js');
  const today = new Date().toISOString().slice(0, 10), pages = contentPages(), stale = [];
  assert.equal(Object.keys(D).length, pages.length, 'liczba stron jak w content-dates.json – uruchom node scripts/content-dates.mjs');
  for (const [url, , , , data] of pages) {
    const e = D[url];
    assert.ok(e && ISO.test(e.date) && e.date <= today, `${url}: brak daty – uruchom node scripts/content-dates.mjs`);
    if (e.hash !== contentHash(data)) stale.push(url);
  }
  assert.deepEqual(stale, [], `Treść tych stron zmieniła się bez aktualizacji daty – uruchom node scripts/content-dates.mjs: ${stale.slice(0, 10).join(', ')}`);
});

test('Podpis „Autor: Redakcja CV Pod Ogłoszenie · Zaktualizowano”, author (Organization) i dateModified z danych; dawna strona autora → 301 na zasady; lastmod w mapie strony', async () => {
  const B = 'https://example.test', app = express(); seoRoutes(app, B); templateRoutes(app, B); employerRoutes(app, B);
  const s = app.listen(0), U = `http://127.0.0.1:${s.address().port}`, get = async (p) => (await fetch(U + p)).text();
  const dmy = (iso) => iso.split('-').reverse().join('.'), dt = (u) => D[u].date;
  try {
    const t = Object.values(TEMPLATES)[0], e = EMPLOYERS[0], a = ARTICLES[0], p = PROFESSIONS[0];
    const enP = `en/cv/${PROF_LANGS.en.prof[p.slug].slugLang}`, deA = `de/${ART_LANGS.de.seg}/${ART_LANGS.de.data[a.slug].slugLang}`;
    const R = 'Redakcja CV Pod Ogłoszenie';
    const pages = [[`/poradnik/${a.slug}`, dt(`poradnik/${a.slug}`), 'Autor', 'Zaktualizowano', R], [`/cv/${p.slug}`, dt(`cv/${p.slug}`), 'Autor', 'Zaktualizowano', R], [`/wzor-cv/${t.slug}`, dt(`wzor-cv/${t.slug}`), 'Autor', 'Zaktualizowano', R],
      [`/list-motywacyjny/${t.slug}`, dt(`list-motywacyjny/${t.slug}`), 'Autor', 'Zaktualizowano', R], [`/praca-w/${e.slug}`, dt(`praca-w/${e.slug}`), 'Autor', 'Zaktualizowano', R],
      [`/${enP}`, dt(enP), 'Author', 'Updated', 'CV Pod Ogłoszenie editorial team'], [`/${deA}`, dt(deA), 'Autor', 'Aktualisiert', 'Redaktion CV Pod Ogłoszenie']];
    for (const [path, d, au, up, who] of pages) {
      const h = await get(path);
      assert.ok(h.includes(`<p class="byline">${au}: <a href="/zasady-redakcyjne" rel="author">${who}</a> · ${up}: <time datetime="${d}">${dmy(d)}</time></p>`), `${path}: podpis`);
      assert.ok(!h.includes('Leśniak'), `${path}: bez nazwiska właściciela`);
      assert.ok(h.includes(`"dateModified":"${d}"`), `${path}: dateModified`);
      assert.ok(h.includes(`"author":{"@type":"Organization","@id":"${B}/#organizacja","name":"CV Pod Ogłoszenie","url":"${B}/"}`), `${path}: author`);
    }
    const home = await get('/');
    assert.doesNotMatch(home, /"founder"|"taxID"|"legalName"/, 'Organization bez danych właściciela');
    const r = await fetch(U + '/autor/jakub-lesniak', { redirect: 'manual' });
    assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/zasady-redakcyjne');
    const zr = await get('/zasady-redakcyjne'), about = await get('/o-serwisie');
    // Bez wymyślonych kwalifikacji i doświadczenia: tylko fakty z /o-serwisie.
    assert.doesNotMatch(zr, /lat doświadczenia|certyfik|ekspert|specjalista HR|rekruter z|doradca kariery z/i);
    assert.match(zr, /Za treści odpowiada redakcja serwisu CV Pod Ogłoszenie \(dane firmy: <a href="\/kontakt">Kontakt<\/a>\)/); assert.ok(!zr.includes('Leśniak'));
    for (const h2 of ['Źródła', 'Rola AI', 'Aktualizacje', 'Zgłoś błąd']) assert.ok(zr.includes(`<h2>${h2}</h2>`), h2);
    assert.match(zr, /Przed publikacją fakty są sprawdzane ze źródłami, a treść jest poprawiana po każdym zgłoszeniu błędu/); assert.doesNotMatch(zr, /czyta człowiek|sprawdzana i poprawiana, a za jej/);
    assert.doesNotMatch(about, /autor\/jakub-lesniak/); assert.match(about, /przygotowuje redakcja serwisu/); assert.match(about, /href="\/zasady-redakcyjne"/);
    const sm = await get('/sitemap.xml');
    assert.ok(sm.includes(`<loc>${B}/cv/${p.slug}</loc><lastmod>${dt(`cv/${p.slug}`)}</lastmod>`), 'lastmod strony zawodu');
    assert.ok(!sm.includes('autor/jakub-lesniak') && sm.includes(`<loc>${B}/zasady-redakcyjne</loc>`));
  } finally { s.close(); }
});
