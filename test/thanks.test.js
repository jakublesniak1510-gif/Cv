import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Generator działa w przeglądarce (public/app.js); test wczytuje wydzielony fragment z czystą funkcją thankYouText.
const src = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const m = /\/\/ --- thankYouText:[\s\S]*?\/\/ --- koniec thankYouText ---/.exec(src);
assert.ok(m, 'fragment thankYouText w app.js');
const thankYouText = vm.runInNewContext(`${m[0]}\nthankYouText`, {});

test('Podziękowanie: bez podwójnej kropki po „Sp. z o.o.” i po temacie zakończonym kropką', () => {
  const t = thankYouText({ name: 'Anna', pos: 'Magazynier', firm: 'Logistyka Plus Sp. z o.o.', topic: 'wdrożeniu systemu WMS.' });
  assert.doesNotMatch(t, /\.\./);
  assert.match(t, /w Logistyka Plus Sp\. z o\.o\. Szczególnie/);
  assert.match(t, /o wdrożeniu systemu WMS\. Po spotkaniu/);
  assert.match(thankYouText({ firm: 'ABC' }), /w ABC\. Po spotkaniu/);
});

test('Podziękowanie: forma żeńska, męska albo obie', () => {
  assert.match(thankYouText({ gender: 'f' }), /bardziej przekonana, że chciałabym/);
  assert.match(thankYouText({ gender: 'm' }), /bardziej przekonany, że chciałbym/);
  assert.match(thankYouText({}), /przekonany\/a, że chciałbym\/chciałabym/);
  assert.doesNotMatch(thankYouText({ gender: 'f' }), /\//);
});
