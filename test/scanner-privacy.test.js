import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TOOLS } from '../lib/tools.js';
import { TOOL_LANGS } from '../lib/tools-i18n.js';
import { legalBody } from '../lib/legal.js';

// Skaner trzyma sam wynik (procent, słowa kluczowe, wskazówki – bez treści CV) do 1 h w pamięci serwera (rememberScan,
// karta wyniku, wysyłka e-mailem), więc przy skanerze nie wolno pisać, że „nie zapisujemy wyniku”.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const BAD = /ani wyniku|pliku ani wyniku|nor the result|or the result|noch das Ergebnis|noch Ergebnis|und Ergebnis speichern|ні результат|чи результату|і результат не зберігаємо/;

test('Skaner: bez zdań „nie zapisujemy wyniku” w 4 językach; jest informacja o 1 h w pamięci', () => {
  const sk = TOOLS['skaner-cv'];
  assert.doesNotMatch(JSON.stringify(sk), BAD, 'PL');
  for (const l of ['en', 'uk', 'de']) assert.doesNotMatch(JSON.stringify(TOOL_LANGS[l].data['skaner-cv']), BAD, l);
  assert.match(sk.faq.find((f) => f.q === 'Co się dzieje z moim plikiem?').a, /w pamięci serwera do godziny/);
  const html = read('public/index.html'), scan = /<form[^>]*id="scanForm"[\s\S]*?<\/form>/.exec(html)?.[0] || html.slice(0, html.indexOf('</section>', html.indexOf('scanForm')));
  assert.doesNotMatch(scan, BAD); assert.match(scan, /Sam wynik jest w pamięci serwera do godziny\./);
  assert.doesNotMatch(html, /nie zapisuje ani pliku, ani wyniku|nie zapisuje pliku ani wyniku/);
  const app = read('public/app.js'), tool = app.slice(app.indexOf('2. Link do ogłoszenia albo jego treść'), app.indexOf('2. Link do ogłoszenia albo jego treść') + 300);
  assert.match(tool, /Sam wynik jest w pamięci serwera do godziny\./);
  for (const l of ['en', 'uk', 'de']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    assert.ok(d['Nie zapisujemy pliku ani treści CV. Sam wynik jest w pamięci serwera do godziny.'], l);
    for (const [k, v] of Object.entries(d)) if (/Skaner jest bezpłatny/.test(k)) assert.doesNotMatch(v, BAD, `${l}: ${k.slice(0, 40)}`);
  }
});

test('Polityka prywatności (4 języki): wynik skanera do godziny w pamięci, nowa data i wpis w historii', () => {
  for (const [l, re, date] of [['pl', /najwyżej godzinę, żeby można było go udostępnić/, /obowiązuje od 23 października 2026/], ['en', /for up to one hour so that you can share it/, /effective from 23 October 2026/], ['de', /höchstens eine Stunde im Serverspeicher, damit Sie es teilen/, /gilt ab dem 23\. Oktober 2026/], ['uk', /щонайбільше годину, щоб ним можна було поділитися/, /діє з 23 жовтня 2026/]]) {
    const b = legalBody('prywatnosc', l);
    assert.match(b, re, l); assert.match(b, date, l); assert.match(b, /<li>23[ .]/, `${l}: historia`);
  }
});
