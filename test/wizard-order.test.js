import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXPERIMENTS, abHome, activeExperiments } from '../lib/ab.js';

// Test A/B „wizard_order”: domyślnie stara kolejność; wariant B oznacza kreator atrybutem data-order="b",
// a app.js zmienia tylko kolejność wyświetlania kroków (numery sekcji, walidacja i analityka bez zmian).
test('wizard_order: wariant B wstawiany przez serwer, domyślnie wyłączony', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.ok(EXPERIMENTS.wizard_order);
  assert.deepEqual(activeExperiments(''), {}, 'bez EXPERIMENTS – stara kolejność');
  assert.match(EXPERIMENTS.wizard_order.apply(html), /<div id="wiz" class="wiz" data-order="b" hidden/);
  const req = (ip) => ({ ip, headers: { 'user-agent': 'test', 'accept-language': 'pl' }, get: () => '' });
  const seen = new Set();
  for (let i = 0; i < 60; i++) seen.add(abHome(req(`10.0.0.${i}`), html, '{"wizard_order":50}').html.includes('data-order="b"'));
  assert.deepEqual([...seen].sort(), [false, true], 'oba warianty');
});

test('wizard_order: kolejność w app.js – ogłoszenie, dane, doświadczenie, wykształcenie, podsumowanie z pakietem; szkic, karnet, podgląd bez zmian', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.match(app, /const ORDER = ORDER_B \? \[5, 2, 3, 4, 6\] : \[1, 2, 3, 4, 5, 6\];/);
  assert.match(app, /Od jakiego ogłoszenia zaczynamy\?/);
  assert.match(app, /\['saveLater', 'draftNote', 'fill'\]/, '„Wyślij mi link” zostaje w pierwszym kroku');
  assert.match(app, /s6\.prepend\(\.\.\.\[\.\.\.s1\.childNodes\], head\)/, 'pakiet, dodatki, języki, wygląd i karnet w podsumowaniu');
  assert.match(app, /\$\('#back'\)\.onclick = \(\) => go\(ORDER\[ORDER\.indexOf\(step\) - 1\]/);
  assert.match(app, /const last = ORDER\.indexOf\(step\) === ORDER\.length - 1;[\s\S]{0,200}if \(!last\) return go\(ORDER\[ORDER\.indexOf\(step\) \+ 1\]\);/);
  assert.match(app, /\(n === 5 \|\| \(ORDER_B && n === 6\)\) && !passOn\(\) && nAds\(\) > PKG_ADS\[pkg\(\)\]/, 'pakiet a liczba ogłoszeń sprawdzane też w podsumowaniu');
  assert.doesNotMatch(app, /go\(1\)/, 'bez sztywnego kroku 1');
});
