import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';

// Nowe sekcje muszą być osiągalne ze strony głównej i z każdej podstrony (stopka, menu, „Darmowe materiały”);
// linki do stron tylko po polsku znikają z wersji EN/UK/DE.
test('Nawigacja: strona główna i lekka podstrona linkują do /targi-pracy, /praca-w, /wzor-cv, /karnety; EN/UK/DE bez linków tylko po polsku', async () => {
  const app = express(); seoRoutes(app, 'https://example.test'); app.use((req, res) => sendNotFound(req, res, 'https://example.test'));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, get = async (p) => (await fetch(U + p)).text();
  try {
    const home = await get('/'), lite = await get('/cv/kasjer');
    for (const [name, h] of [['strona główna', home], ['lekka strona', lite]]) {
      for (const href of ['/targi-pracy', '/praca-w', '/wzor-cv', '/list-motywacyjny', '/karnety', '/praca-w-niemczech-cv', '/dla-doradcow', '/program-partnerski']) assert.ok(h.includes(`href="${href}"`), `${name}: ${href}`);
    }
    assert.ok(/<script src="\/lite\.js/.test(lite), 'lekka strona');
    assert.ok(home.includes('id="materialy"') && home.includes('Darmowe materiały'), 'sekcja „Darmowe materiały”');
    const navDesk = /<nav>([\s\S]*?)<\/nav>/.exec(home)[1], navMob = /<nav class="mnav"[\s\S]*?<\/nav>/.exec(home)[0];
    assert.ok(navDesk.includes('href="/wzor-cv"') && navDesk.includes('href="/targi-pracy"'), 'menu: Wzory CV i Targi pracy');
    assert.ok(navMob.includes('href="/wzor-cv"') && navMob.includes('href="/targi-pracy"'), 'menu na telefonie');
    for (const p of ['/en', '/uk', '/de', '/en/cv/cashier']) {
      const h = await get(p);
      assert.ok(!/data-pl/.test(h), `${p}: bez elementów tylko po polsku`);
      for (const href of ['/targi-pracy', '/praca-w', '/wzor-cv', '/karnety']) assert.ok(!h.includes(`href="${href}"`), `${p}: bez ${href}`);
      assert.ok(h.includes('Dla instytucji'), `${p}: stopka „Dla instytucji” zostaje (tłumaczona w przeglądarce)`);
    }
  } finally { srv.close(); }
});
