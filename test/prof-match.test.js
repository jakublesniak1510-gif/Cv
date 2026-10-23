import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { toolUrl } from '../lib/tools-i18n.js';
import { twoAds, profGen } from '../lib/prof-match.js';

const KEYS = ['Masz ogłoszenie na to stanowisko?', 'Wklej treść albo link. Darmowy skaner porówna ogłoszenie z Twoim CV i pokaże, których wymagań w nim nie widać.', 'Treść lub link do ogłoszenia', 'Sprawdź CV z tym ogłoszeniem', 'Ogłoszenie przekażemy do skanera w tej przeglądarce. CV wgrasz w następnym kroku.', 'Jedno CV, dwa ogłoszenia', 'To samo przykładowe CV i dwa ogłoszenia na to stanowisko z innymi wymaganiami. Zaznaczyliśmy, co CV już pokazuje i co trzeba by dopisać – tylko jeśli naprawdę masz takie doświadczenie.', 'Ogłoszenie A', 'Ogłoszenie B', 'Wymagania z ogłoszenia:', 'widać w CV', 'nie widać w CV', 'Na górę CV pod to ogłoszenie:', 'Przykładowe CV nie pokazuje tych wymagań. Dopisz je, jeśli masz takie doświadczenie.', 'Czego szukają rekruterzy w CV {0}', 'Słowa kluczowe, które często pojawiają się w ogłoszeniach dla tego zawodu. Lista z aktualizacji strony: {0}.', 'Sprawdź CV za darmo'];
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const SCAN = { pl: '/narzedzia/skaner-cv', en: `/${toolUrl('en', 'skaner-cv')}`, uk: `/${toolUrl('uk', 'skaner-cv')}`, de: `/${toolUrl('de', 'skaner-cv')}` };

test('„Jedno CV, dwa ogłoszenia”: wymagania z danych zawodu, zaznaczenia tylko w gotowych zdaniach przykładowego CV', () => {
  const p = PROFESSIONS.find((x) => x.slug === 'hydraulik'), [a, b] = twoAds(p);
  assert.deepEqual([...a.reqs, ...b.reqs].map((r) => r.k), p.keywords.slice(0, 10), 'wymagania A = słowa 1–5, B = 6–10');
  assert.ok(a.reqs.find((r) => r.k === 'uprawnienia SEP G3').hit, 'SEP G3 jest w przykładowym CV');
  const plain = (h) => h.replace(/<\/?mark>/g, '').replace(/&amp;/g, '&');
  const pool = [...p.sample.summary.split(/(?<=\.)\s+/), ...p.sample.skills, ...p.sample.jobs.flatMap((j) => j.bullets)];
  for (const l of [...a.lines, ...b.lines]) assert.ok(pool.includes(plain(l)), `zdanie z przykładowego CV: ${l}`);
  assert.ok(a.lines.every((l) => l.includes('<mark>')));
  // „widać w CV” nie z samego wspólnego słowa: wymaganie z kilkoma słowami potrzebuje większości z nich
  const k = twoAds({ keywords: ['obsługa wózka widłowego', 'obsługa klienta'], sample: { summary: 'Obsługa klienta w sklepie.', skills: [], jobs: [] } });
  assert.deepEqual(k[0].reqs.map((r) => r.hit), [false]); assert.deepEqual(k[1].reqs.map((r) => r.hit), [true]);
  assert.equal(twoAds({ keywords: ['<b>x</b> test'], sample: { summary: 'Test <b>x</b> testowy.', skills: [], jobs: [] } })[0].lines[0].includes('<b>'), false, 'HTML escapowany');
  assert.equal(profGen(p), 'hydraulika'); assert.equal(profGen({ ...p, ...PROF_LANGS.en.prof.hydraulik }, 'en'), 'plumber');
  assert.equal(profGen({ title: 'Key Account Manager CV: example and tips' }, 'en'), 'Key Account Manager');
});

test('Wszystkie strony zawodów w 4 językach: „Masz ogłoszenie?” do skanera, dwa ogłoszenia, słowa kluczowe z datą, skaner → kreator', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const l of ['pl', 'en', 'uk', 'de']) {
      for (const p of PROFESSIONS) {
        const url = l === 'pl' ? `/cv/${p.slug}` : `/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[p.slug].slugLang}`;
        const h = await (await fetch(U + url)).text();
        assert.ok(h.includes(`<form class="paste-ad" data-scan="${SCAN[l]}" novalidate>`) && /<form class="paste-ad"[\s\S]*?<textarea name="ad"/.test(h), `${url}: blok „Masz ogłoszenie?”`);
        assert.ok(h.indexOf('class="paste-ad"') > h.indexOf('class="lead"') && h.indexOf('class="paste-ad"') < h.indexOf('class="tips"'), `${url}: na górze strony`);
        const two = /<div class="two-ads">([\s\S]*?)<\/div><\/div><p class="prof-cta">/.exec(h)?.[1];
        assert.ok(two && (two.match(/class="ad-col"/g) || []).length === 2, `${url}: dwa ogłoszenia`);
        for (const j of p.sample.jobs) assert.ok(!two.includes(j.company), `${url}: bez nazw firm z przykładu`);
        assert.match(h, /<p class="small">[^<]*(?:Lista z aktualizacji strony:|List from the page update:|Liste aus der Aktualisierung der Seite:|Список з оновлення сторінки:) \d{2}\.\d{2}\.\d{4}\.<\/p>/, `${url}: data słów kluczowych`);
        const cta = /<p class="prof-cta"><a class="btn ghost" href="([^"]+)">[^<]+<\/a> <a class="btn" href="([^"]+)">/.exec(h);
        assert.ok(Buffer.byteLength(h) < 40e3, `${url}: budżet rozmiaru HTML 40 kB (${Buffer.byteLength(h)})`);
        assert.ok(cta && cta[1] === SCAN[l] && cta[2].includes(`zamow=1&amp;zawod=${p.slug}`), `${url}: skaner, potem kreator`);
      }
    }
  } finally { srv.close(); }
});

test('Ogłoszenie trafia do skanera przez pamięć karty przeglądarki (bez wysyłki), tłumaczenia bloków', () => {
  const lite = read('public/lite.js'), app = read('public/app.js');
  assert.match(lite, /form\.paste-ad\[data-scan\]/); assert.match(lite, /sessionStorage\.setItem\('cvpo-scan-ad'/); assert.doesNotMatch(lite.slice(lite.indexOf('form.paste-ad'), lite.indexOf('Formularz „Dla firm')), /fetch\(/);
  assert.match(app, /sessionStorage\.getItem\('cvpo-scan-ad'\)[\s\S]{0,80}sessionStorage\.removeItem\('cvpo-scan-ad'\)/);
  for (const l of ['en', 'uk', 'de']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of ['Masz ogłoszenie na to stanowisko?', 'Jedno CV, dwa ogłoszenia', 'Czego szukają rekruterzy w CV {0}', 'widać w CV', 'nie widać w CV', 'Sprawdź CV za darmo']) assert.ok(d[k], `${l}: ${k}`);
    assert.ok(d['Czego szukają rekruterzy w CV {0}'].includes('{0}'));
    // stałe teksty bloków bez obietnic (słowa kluczowe zawodów mogą zawierać np. „naprawy gwarancyjne” – to nie obietnica)
    for (const k of KEYS) { assert.ok(d[k], `${l}: ${k}`); assert.doesNotMatch(`${k} ${d[k]}`, /gwarant|garant|guarant|гарант|najlepsz|best\b|beste/i, k); }
  }
});
