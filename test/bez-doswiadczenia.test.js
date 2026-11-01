import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 2.11: w kroku „Dane” checkbox „Nie mam jeszcze doświadczenia zawodowego” – spełnia warunek kroku (jak szkoła), chowa pola
// stanowisk, pokazuje podpowiedź i prowadzi do szkoły, kursów i umiejętności; zapisany w szkicu. Wymagania bez zmian.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const html = read('public/index.html'), app = read('public/app.js');

test('Checkbox „Nie mam jeszcze doświadczenia zawodowego”: pod stanowiskami, podpowiedź, warunek kroku 2, szkic, tłumaczenia', () => {
  const s2 = html.slice(html.indexOf('<section data-step="2"'), html.indexOf('<section data-step="3"'));
  assert.match(s2, /id="addExp">\+ Dodaj stanowisko<\/button>\n<label class="check noexp-on"><input type="checkbox" id="noExp"> <span>Nie mam jeszcze doświadczenia zawodowego<\/span><\/label><p class="hint" id="noExpHint" hidden>CV oprzemy na wykształceniu i umiejętnościach\. Uzupełnij szkołę, kursy i umiejętności poniżej\.<\/p>/);
  assert.match(app, /if \(n === 2 && !imported && !\$\('#noExp'\)\.checked && !rows\('exp'\)/, 'zaznaczenie spełnia warunek jak szkoła');
  assert.match(app, /if \(!v\('name'\)\) return 'Podaj imię i nazwisko\.'/, 'imię i e-mail dalej wymagane');
  assert.match(app, /\$\('#exp'\)\.hidden = on; \$\('#addExp'\)\.hidden = on;/);
  assert.match(app, /noExp: \$\('#noExp'\)\.checked \}\);/); assert.match(app, /\$\('#noExp'\)\.checked = !!d\.noExp; noExpSync\(\);/);
  for (const l of ['en', 'uk', 'de']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Nie mam jeszcze doświadczenia zawodowego'], l);
  assert.ok(Buffer.byteLength(html) <= 90e3);
});
