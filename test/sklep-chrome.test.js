import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Chrome Web Store (odrzucenie Yellow Argon, 24.10.2026): w opisie i tekstach rozszerzenia bez nazw innych portali i marek.
// Selektory stron w popup.js zostają – to kod do czytania treści ogłoszenia, nie opis w sklepie.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const BRANDS = /pracuj|olx|justjoin|no ?fluff|indeed|linkedin|jooble|gowork|aplikuj|infopraca|facebook/i;

test('STORE.md i komunikaty rozszerzenia (4 języki) bez nazw innych portali; uwaga o odrzuceniu', () => {
  const store = read('extension/STORE.md');
  assert.doesNotMatch(store.replace(/\*\*Uwaga:\*\*[^\n]*/, ''), BRANDS);
  assert.match(store, /1\. Otwórz dowolne ogłoszenie o pracę w przeglądarce\./);
  assert.match(store, /1\. Open any job ad in your browser\./);
  assert.match(store, /bez nazw innych portali i marek w opisie i na zrzutach \(odrzucenie Yellow Argon, 24\.10\.2026\)/);
  for (const l of ['pl', 'en', 'uk', 'de']) assert.doesNotMatch(read(`extension/_locales/${l}/messages.json`), BRANDS, l);
  assert.doesNotMatch(read('extension/manifest.json'), BRANDS);
});
