import { test } from 'node:test';
import assert from 'node:assert/strict';

// Błąd z nagrania demo (25.10): podgląd zaczynał podsumowanie od „2021 w hurtowni…” (data „01.2021” ucinała początek).
// Od bloku A (26.10) zdania tnie serwer przy rysowaniu obrazka podglądu (lib/preview-img.js).
const { firstSentences } = await import('../lib/preview-img.js');
const SUMMARY = 'Magazynier z doświadczeniem od 01.2021 w hurtowni, obejmującym przyjęcia i wydania towaru. Obsługuję wózek widłowy (UDT) i skaner WMS. Pracuję dokładnie, także w systemie zmianowym. Szukam stałej pracy w Poznaniu.';

test('Podgląd: pierwsze zdania od początku podsumowania (daty z kropką i skróty nie ucinają tekstu)', () => {
  const old = (SUMMARY.match(/[^.!?]+[.!?]+(\s|$)/g) || [SUMMARY]).slice(0, 3).join('').trim();
  assert.match(old, /^2021 w hurtowni/, 'stary kod odtwarza błąd');
  const r = firstSentences(SUMMARY, 3);
  assert.ok(r.startsWith('Magazynier z doświadczeniem od 01.2021 w hurtowni'), r);
  assert.ok(r.endsWith('w systemie zmianowym.')); assert.doesNotMatch(r, /Poznaniu/);
  assert.equal(firstSentences(SUMMARY, 2), 'Magazynier z doświadczeniem od 01.2021 w hurtowni, obejmującym przyjęcia i wydania towaru. Obsługuję wózek widłowy (UDT) i skaner WMS.');
  assert.equal(firstSentences('Bez kropki na końcu', 3), 'Bez kropki na końcu');
  assert.equal(firstSentences('Ok. 5 lat w logistyce, m.in. w DHL. Drugie zdanie!', 1), 'Ok. 5 lat w logistyce, m.in. w DHL.', 'skróty nie kończą zdania');
  assert.equal(firstSentences('', 3), '');
});
