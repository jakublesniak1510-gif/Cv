import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRICES } from '../lib/pricing.js';

// Pakiet 3: „CV pod trzy różne ogłoszenia, każde X zł” (dokładnie cena pakietu / 3, bez przekreśleń);
// drugi język dokumentów (+5 zł) zaraz pod wyborem pakietu w kroku 1, przed dodatkami.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const each = `${(PRICES.pack3 / 100 / 3).toFixed(2).replace('.', ',')} zł`;

test('Pakiet 3: cena za jedno ogłoszenie z cennika w kreatorze i w cenniku strony głównej', () => {
  assert.equal(each, '26,33 zł');
  const h = read('public/index.html'), app = read('public/app.js');
  assert.ok(h.includes(`<span>CV pod trzy różne ogłoszenia, każde</span> <span id="pack3Each">${each}</span>`));
  assert.ok(h.includes(`<li>CV pod trzy różne ogłoszenia, każde ${each}</li>`));
  assert.match(app, /\$\('#pack3Each'\)\.textContent = `\$\{\(PRICE\.pack3 \/ 3\)\.toFixed\(2\)\.replace\('\.', ','\)\} zł`/);
  assert.doesNotMatch(h, /<s>|<del>|line-through/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); assert.ok(d['CV pod trzy różne ogłoszenia, każde'] && d['CV pod trzy różne ogłoszenia, każde {0} zł'], l); }
});

test('Krok 1: wybór drugiego języka (+5 zł) zaraz pod pakietem, przed dodatkami', () => {
  const h = read('public/index.html'), s1 = h.slice(h.indexOf('<section data-step="1">'), h.indexOf('<section data-step="2"'));
  const pkg = s1.indexOf('id="pkgOpts"'), lang = s1.indexOf('id="langPick"'), add = s1.indexOf('<h3 class="sh">Dodatki');
  assert.ok(pkg > 0 && pkg < lang && lang < add, `pakiet ${pkg} < język ${lang} < dodatki ${add}`);
  assert.equal((h.match(/id="langPick"/g) || []).length, 1);
  assert.ok(s1.includes(`(+${PRICES.extraLang / 100} zł za każdy język, dla wszystkich ogłoszeń)`));
});
