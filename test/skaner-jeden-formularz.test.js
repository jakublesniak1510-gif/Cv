import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Alert 3.11: /narzedzia/skaner-cv miało dwa formularze skanera (ukryty #scanForm ze strony głównej i kopię bez id na
// stronie narzędzia, tworzoną przy każdym rysowaniu strony). Rozszerzenie Chrome (?draft=) wklejało ogłoszenie do złej kopii,
// a ponowne rysowanie strony czyściło pole. Teraz strona narzędzia przenosi jedyny formularz #scanForm.
// Przebieg w przeglądarce (Playwright, 390/1280): ?draft= → pole wypełnione → „Tylko niezbędne” → treść zostaje.
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const fn = (name) => { const i = app.indexOf(`function ${name}(`); assert.ok(i >= 0, name); return app.slice(i, app.indexOf('\n}\n', i)); };

test('jeden formularz skanera z id w index.html', () => {
  assert.equal((html.match(/id="scanForm"/g) || []).length, 1);
  assert.equal((html.match(/id="scanAd"/g) || []).length, 1);
});

test('strona narzędzia przenosi #scanForm zamiast tworzyć kopię', () => {
  const t = fn('toolScan');
  assert.match(t, /box\.append\(\$\('#scanForm'\), \$\('#scanResult'\)\)/);
  assert.doesNotMatch(t, /el\('form'|el\('textarea'|bindScan\(/);
  assert.match(t, /pendingDraft && !ad\.value\.trim\(\)/); // szkic nie nadpisuje tego, co już jest w polu
  assert.equal((app.match(/bindScan\(\{/g) || []).length, 1);
});

test('formularz wraca na stronę główną przed przerysowaniem i przy powrocie na stronę główną', () => {
  assert.match(app, /const homeScan = \(\) =>/);
  assert.match(app, /homeScan\(\); \$\('#page'\)\.replaceChildren\(node\(\)\)/);
  assert.match(fn('showHome'), /homeScan\(\)/);
  assert.match(fn('route'), /homeScan\(\)/);
});

test('szkic z rozszerzenia trafia do #scanAd (jedyne pole), nie do pierwszego formularza w #page', () => {
  const d = fn('loadDraft');
  assert.match(d, /\$\('#scanAd'\)\.value = text/);
  assert.doesNotMatch(d, /form\.scan-card textarea/);
});
