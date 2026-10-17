import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { toolUrl } from '../lib/tools-i18n.js';

const T = {
  pl: { title: 'Nie znaleziono strony', home: '/', scan: '/narzedzia/skaner-cv', btn: 'Strona główna' },
  en: { title: 'Page not found', home: '/en', scan: '/en/tools/cv-scanner', btn: 'Home' },
  uk: { title: 'Сторінку не знайдено', home: '/uk', scan: '/uk/instrumenty/skaner-rezyume', btn: 'Головна' },
  de: { title: 'Seite nicht gefunden', home: '/de', scan: '/de/tools/lebenslauf-scanner', btn: 'Startseite' },
};

test('404: tytuł, opis, og, H1, przyciski i link do skanera w języku z adresu; status 404 + noindex; html lang', async () => {
  const app = express(); const base = 'https://example.test';
  seoRoutes(app, base);
  app.use((req, res) => sendNotFound(req, res, base));
  const srv = app.listen(0); const port = srv.address().port;
  const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, text: await r.text() }; };
  try {
    for (const [l, w] of Object.entries(T)) {
      const { status, text } = await get(l === 'pl' ? '/nie-ma-takiej-strony' : `/${l}/nie-ma-takiej-strony`);
      assert.equal(status, 404, l);
      assert.ok(text.includes(`<html lang="${l}">`), `${l}: html lang`);
      assert.ok(text.includes(`<title>${w.title} | CV Pod Ogłoszenie</title>`), `${l}: tytuł`);
      assert.ok(text.includes(`<meta property="og:title" content="${w.title}">`), `${l}: og:title`);
      assert.ok(text.includes(`<h1>${w.title}</h1>`), `${l}: H1`);
      assert.ok(text.includes(`<a class="btn" href="${w.home}">${w.btn}</a>`), `${l}: strona główna`);
      assert.ok(text.includes(`href="${w.scan}"`), `${l}: link do skanera`);
      assert.ok(text.includes('<meta name="robots" content="noindex">'), `${l}: noindex`);
      assert.ok(!text.includes('rel="canonical"'), `${l}: bez canonical`);
      if (l !== 'pl') {
        assert.ok(!text.includes('Nie znaleziono strony'), `${l}: bez polskiego tytułu`);
        assert.ok(text.includes(`window.__LANG="${l}"`), `${l}: język skryptu`);
        assert.equal(w.scan, '/' + toolUrl(l, 'skaner-cv'));
      }
    }
    // Zwykłe podstrony w językach mają poprawny html lang i status 200.
    for (const [l, p] of [['pl', '/narzedzia/skaner-cv'], ['en', '/en'], ['uk', '/uk/instrumenty/skaner-rezyume'], ['de', '/de/tools/lebenslauf-scanner']]) {
      const { status, text } = await get(p);
      assert.equal(status, 200, p);
      assert.ok(text.includes(`<html lang="${l}">`), `${p}: html lang`);
    }
  } finally { srv.close(); }
});
