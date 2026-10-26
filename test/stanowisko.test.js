import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// C6 (26.10): stanowisko z treści ogłoszenia – pole wypełnia się samo (hero, /kreator-cv, krok 1, link/zdjęcie bez tytułu),
// a puste nie blokuje „Dalej”: serwer uzupełnia je z treści (cleanAds), AI ustala stanowisko z ogłoszenia.
const { guessTitle } = await import('../lib/ad-title.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), server = read('server.js');

test('guessTitle: pierwsza sensowna linia, bez „Ogłoszenie:”, portali, „Szukamy”, do 60 znaków; skróty nie kończą zdania', () => {
  for (const [t, want] of [
    ['Ogłoszenie: Magazynier – Poznań\nSzukamy osoby do kompletacji', 'Magazynier – Poznań'],
    ['Oferta pracy: Kasjer / Sprzedawca\nOpis stanowiska', 'Kasjer / Sprzedawca'],
    ['pracuj.pl\n\nSpecjalista ds. obsługi klienta\nFirma XYZ', 'Specjalista ds. obsługi klienta'],
    ['OLX Praca | Pomoc kuchenna | Kraków', 'Pomoc kuchenna | Kraków'],
    ['  \n• pracownik produkcji', 'Pracownik produkcji'],
    ['Magazynier. Firma ABC zatrudni osobę na magazyn.', 'Magazynier'],
    ['12345\n---\nKelner', 'Kelner'],
    ['', ''],
  ]) assert.equal(guessTitle(t), want, t);
  assert.ok(guessTitle('Stanowisko: ' + 'a'.repeat(100)).length <= 60);
});

test('Ta sama funkcja w kreatorze; wypełnianie przy wklejeniu, z hero, z /kreator-cv i po pobraniu linku bez tytułu', () => {
  const body = (src) => src.slice(src.indexOf('function guessTitle(text) {'), src.indexOf('\n}\n', src.indexOf('function guessTitle(text) {')));
  assert.equal(body(app), body(read('lib/ad-title.js')), 'public/app.js i lib/ad-title.js – identyczna logika');
  assert.match(app, /else if \(ev\.target\.matches\('\[data-k=text\]'\)\) fillTitle\(e\);/);
  assert.match(app, /if \(!t\.value\.trim\(\) \|\| t\.dataset\.auto\) \{ const g = guessTitle\(text\);/, 'ręcznie wpisane stanowisko zostaje');
  assert.match(app, /\$\('\[data-k=text\]', first\)\.value = v\.slice\(0, 10000\); fillTitle\(first\); \}/, 'hero');
  assert.match(app, /ta\.value = ad; setMode\(first, 'paste'\); fillTitle\(first\);/, '/kreator-cv');
  assert.equal((app.match(/\$\('\[data-k=text\]', e\)\.value = j\.text; if \(!j\.title\) fillTitle\(e\);/g) || []).length, 2, 'link i zdjęcie');
});

test('Puste stanowisko nie blokuje „Dalej” (podpowiedź zamiast błędu); serwer uzupełnia je z treści', () => {
  assert.doesNotMatch(app, /podaj nazwę stanowiska/);
  assert.match(app, /<p class="hint title-auto" hidden>Uzupełnimy stanowisko z ogłoszenia\.<\/p>/);
  assert.match(server, /title: str\(a\?\.title, 100\) \|\| guessTitle\(str\(a\?\.text, 10000\)\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Uzupełnimy stanowisko z ogłoszenia.'], l);
});
