import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, overlap, words } from '../scripts/content-uniq.mjs';

// Regresja SEO: podstrony treściowe to lekkie strony (bez ukrytej strony głównej i kreatora w HTML), więc treść główna
// stanowi większość tekstu, a strony tego samego typu nie pokrywają się. Narzędzia działają w przeglądarce (pełna aplikacja)
// i na razie są poza tym progiem.
test('Unikalność treści: udział treści głównej ≥ 60%, pokrycie 6-gramów między stronami tego samego typu < 40%', { timeout: 120000 }, async () => {
  const r = await measure();
  for (const [type, x] of Object.entries(r)) {
    if (type === 'narzedzia') continue;
    assert.ok(x.pages.length >= 2, `${type}: za mało stron w próbce`);
    assert.ok(x.minShare >= 0.6, `${type}: udział treści głównej ${Math.round(x.minShare * 100)}% (< 60%)`);
    assert.ok(x.maxOverlap < 0.4, `${type}: pokrycie ${Math.round(x.maxOverlap * 100)}% (≥ 40%)`);
  }
});

test('Miara pokrycia 6-gramów', () => {
  const a = words('jeden dwa trzy cztery pięć sześć siedem osiem'), b = words('jeden dwa trzy cztery pięć sześć inne słowa tutaj');
  assert.equal(overlap(a, a), 1); assert.equal(overlap(a, words('zupełnie inny tekst bez wspólnych ciągów słów')), 0);
  assert.ok(overlap(a, b) > 0 && overlap(a, b) < 1);
});
