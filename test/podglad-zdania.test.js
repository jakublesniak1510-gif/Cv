import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Błąd z nagrania demo (25.10): podgląd w kroku 6 zaczynał podsumowanie od „2021 w hurtowni, obejmującym…”,
// bo wyrażenie „zdanie = tekst do kropki ze spacją” pomijało początek z datą „01.2021”.
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const src = app.match(/function firstSentences\(t, n\) \{[^\n]+\}/)[0];
const firstSentences = new Function(`${src}; return firstSentences;`)();
const SUMMARY = 'Magazynier z doświadczeniem od 01.2021 w hurtowni, obejmującym przyjęcia i wydania towaru. Obsługuję wózek widłowy (UDT) i skaner WMS. Pracuję dokładnie, także w systemie zmianowym. Szukam stałej pracy w Poznaniu.';

test('Podgląd „Tak zacznie się Twoje CV”: pierwsze 3 zdania od początku podsumowania (daty z kropką nie ucinają tekstu)', () => {
  const old = (SUMMARY.match(/[^.!?]+[.!?]+(\s|$)/g) || [SUMMARY]).slice(0, 3).join('').trim();
  assert.match(old, /^2021 w hurtowni/, 'stary kod odtwarza błąd');
  const r = firstSentences(SUMMARY, 3);
  assert.ok(r.startsWith('Magazynier z doświadczeniem od 01.2021 w hurtowni'), r);
  assert.ok(r.endsWith('w systemie zmianowym.')); assert.doesNotMatch(r, /Poznaniu/);
  assert.equal(firstSentences('Bez kropki na końcu', 3), 'Bez kropki na końcu');
  assert.equal(firstSentences('Ok. 5 lat w logistyce, m.in. w DHL. Drugie zdanie!', 1), 'Ok. 5 lat w logistyce, m.in. w DHL.', 'skróty nie kończą zdania');
  assert.equal(firstSentences('', 3), '');
  assert.doesNotMatch(app, /r\.summary\.match\(/, 'podgląd nie używa już starego wyrażenia');
});
