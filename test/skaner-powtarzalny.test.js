import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Błąd z nagrania demo (25.10): skaner dawał 9/10/12 wymagań dla tych samych plików. Bez `temperature` (Opus 5.5 zwraca 400):
// lista wymagań z ogłoszenia i wynik dla pary CV + ogłoszenie zapamiętane na 1 h.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-scan-det-'));
const { scanCv, clearScanCache, fitToReqs, SCAN_CACHE_MS } = await import('../lib/generate.js');
const { buildRequest } = await import('../lib/ai.js');
const CV = 'Paweł Przykładowy. Magazynier, 2021–2026: przyjęcia i wydania towaru, wózek widłowy UDT, skaner WMS, praca zmianowa.';
const AD = 'Magazynier. Wymagania: uprawnienia UDT na wózki widłowe, obsługa skanera, znajomość WMS, gotowość do pracy zmianowej, prawo jazdy kat. B, j. angielski komunikatywny, Excel, inwentaryzacje.';
const POOL = ['uprawnienia UDT', 'obsługa skanera', 'WMS', 'praca zmianowa', 'prawo jazdy kat. B', 'j. angielski', 'Excel', 'inwentaryzacje', 'dokładność', 'praca w zespole', 'kompletacja zamówień', 'BHP'];
// Model „losowy”: za każdym razem inna liczba wymagań (9, 10, 12…), jak na produkcji.
function flakyModel() {
  let i = 0; const calls = [];
  const ask = async (_sys, user) => {
    calls.push(user);
    const n = [9, 12, 10, 11][i++ % 4], list = /<wymagania>/.test(user) ? [...user.matchAll(/^- (.+)$/gm)].map((m) => m[1]).reverse() : POOL.slice(0, n);
    return { position: 'Magazynier', company: '', found: list.filter((_, k) => k % 2 === 0), missing: list.filter((_, k) => k % 2).map((keyword) => ({ keyword, hint: `Dopisz ${keyword}` })).concat(/<wymagania>/.test(user) ? [{ keyword: 'Nowe wymaganie spoza listy', hint: '' }] : []), tips: ['a', 'b', 'c'] };
  };
  return { ask, calls };
}

test('Te same pliki → ten sam wynik (pamięć 1 h); inne CV pod to samo ogłoszenie → ta sama liczba wymagań', async () => {
  clearScanCache(); const m = flakyModel(), t0 = Date.parse('2026-10-25T12:00:00Z');
  const a = await scanCv({ cvText: CV, adText: AD }, { ask: m.ask, ai: true, now: t0 });
  const b = await scanCv({ cvText: CV, adText: `  ${AD}\n` }, { ask: m.ask, ai: true, now: t0 + 60e3 });
  assert.deepEqual(b, a, 'identyczny wynik'); assert.equal(m.calls.length, 1, 'drugi skan bez zapytania do AI');
  const n = a.found.length + a.missing.length; assert.equal(n, 9);
  const c = await scanCv({ cvText: `${CV} Excel, inwentaryzacje.`, adText: AD }, { ask: m.ask, ai: true, now: t0 + 120e3 });
  assert.equal(m.calls.length, 2); assert.match(m.calls[1], /<wymagania>\n- uprawnienia UDT/, 'stała lista wymagań w zapytaniu');
  assert.equal(c.found.length + c.missing.length, n, 'ta sama liczba wymagań mimo „losowego” modelu');
  assert.ok(!c.missing.some((x) => /spoza listy/.test(x.keyword)), 'wymagania spoza listy odrzucone');
  for (let k = 0; k < 5; k++) { const x = await scanCv({ cvText: `${CV} wersja ${k}`, adText: AD }, { ask: m.ask, ai: true, now: t0 + 180e3 + k }); assert.equal(x.found.length + x.missing.length, n); }
  // Po godzinie lista wygasa (nowa ocena ogłoszenia).
  const d = await scanCv({ cvText: CV, adText: AD }, { ask: m.ask, ai: true, now: t0 + SCAN_CACHE_MS + 1 });
  assert.doesNotMatch(m.calls[m.calls.length - 1], /<wymagania>/); assert.ok(d.score != null);
  a.found.push('zmiana'); assert.notDeepEqual((await scanCv({ cvText: CV, adText: AD }, { ask: m.ask, ai: true, now: t0 + SCAN_CACHE_MS + 2 })).found.at(-1), 'zmiana', 'kopia, nie wspólny obiekt');
});

test('fitToReqs: każde wymaganie dokładnie raz, wskazówki zachowane; bez temperature w zapytaniu (400 na Opus 5.5)', () => {
  const r = fitToReqs({ found: ['wms'], missing: [{ keyword: 'Excel', hint: 'Dopisz Excel' }, { keyword: 'Inne', hint: 'x' }] }, ['WMS', 'Excel', 'BHP']);
  assert.deepEqual(r.found, ['WMS']); assert.deepEqual(r.missing, [{ keyword: 'Excel', hint: 'Dopisz Excel' }, { keyword: 'BHP', hint: '' }]);
  const q = buildRequest('s', 'u', { effort: 'low', maxTokens: 4000 });
  assert.ok(!('temperature' in q) && !('top_p' in q));
});
