import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { scanFallback } from '../lib/tailor.js';
import { scoreOf } from '../lib/generate.js';
import { BA, baScores } from '../lib/before-after.js';

// „Przed i po”: procent na stronie = wynik naszego skanera dla tekstów widocznych w kartach; dane fikcyjne, bez AI.
const text = (h) => h.replace(/<\/(div|p|li)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\n+/g, '\n').trim();

test('Przed i po: procent w sekcji = wynik skanera dla tych tekstów, etykieta „dane fikcyjne”, zaznaczone słowa z ogłoszenia, CTA', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const p of ['/', '/en', '/uk', '/de']) {
      const h = await (await fetch(U + p)).text(), sec = /<section class="sec" id="przed-po">[\s\S]*?<\/section>/.exec(h)?.[0];
      assert.ok(sec, `${p}: sekcja`);
      if (p !== '/') continue;
      assert.ok(h.indexOf('id="top"') < h.indexOf('id="przed-po"') && h.indexOf('id="przed-po"') < h.indexOf('id="skaner"'), 'druga sekcja: pod hero, przed skanerem');
      assert.match(sec, /nie gwarancja zaproszenia na rozmowę/);
      assert.match(sec, /Przykład – dane fikcyjne/);
      const s = baScores();
      for (const side of ['before', 'after']) {
        const card = new RegExp(`<article class="ba-card ba-${side}"[\\s\\S]*?</article>`).exec(sec)[0];
        const cv = text(card.replace(/<div class="ba-tag[\s\S]*?<\/div>/, '')); // bez plakietki z wynikiem
        const shown = Number(new RegExp(`<div class="ba-tag[^"]*"><span>[^<]+</span> · (\\d+)%`).exec(card)[1]);
        assert.equal(shown, scoreOf(scanFallback({ cvText: cv, adText: BA.ad })), `${side}: plakietka = skaner na widocznym tekście`);
        assert.equal(shown, s[side].score);
      }
      assert.ok(s.after.score > s.before.score);
      assert.match(sec, new RegExp(`przed</span> <b>${s.before.score}%</b>, <span>po</span> <b>${s.after.score}%</b>`));
      const before = /<article class="ba-card ba-before"[\s\S]*?<\/article>/.exec(sec)[0], after = /<article class="ba-card ba-after"[\s\S]*?<\/article>/.exec(sec)[0];
      assert.ok(!before.includes('<mark>'), 'przed: bez słów z ogłoszenia');
      for (const k of ['UDT', 'skaner', 'zmianow', 'e-commerce']) assert.match(after, new RegExp(`<mark>[^<]*${k}`), `po: zaznaczone ${k}`);
      assert.match(sec, /<button class="btn" data-open><span>Zrób takie CV pod swoje ogłoszenie – od<\/span> 39 zł<\/button>/);
      assert.match(sec, /href="\/narzedzia\/skaner-cv">Sprawdź za darmo, ile pasujesz/);
      assert.doesNotMatch(sec, /gwarantuj|zapewniamy|na pewno dostaniesz/i, 'bez obietnic zatrudnienia');
      assert.match(sec, /role="tablist"[\s\S]*Przed[\s\S]*Po/, 'przełącznik na telefonie');
    }
  } finally { srv.close(); }
});
