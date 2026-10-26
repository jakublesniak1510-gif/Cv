import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Decyzje koordynatora 26.10 po PR #124: zgody nad przyciskiem w ramce, kod rabatowy zwinięty, „Dostajesz” nad przyciskiem,
// przykład CV, gdy podgląd AI niedostępny. Warianty testu „checkout” bez zmian w różnicach.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const html = read('public/index.html'), app = read('public/app.js'), css = read('public/style.css');
const step6 = html.slice(html.indexOf('<section data-step="6"'), html.indexOf('<section data-step="7"'));

test('Zgody w jednej ramce na końcu kroku 6 (teksty bez zmian), kod rabatowy w zwiniętym <details>', () => {
  assert.match(step6, /<div class="consent-box" id="consentBox">\s*<label class="check"><input type="checkbox" id="consent">[\s\S]*?<input type="checkbox" id="waiver">[\s\S]*?<\/label>\s*<\/div>\s*<\/section>/, 'ramka ze zgodami tuż przed końcem kroku (nad stopką z przyciskiem)');
  assert.ok(step6.includes('Akceptuję <a href="/regulamin" target="_blank" rel="noopener">Regulamin</a> i <a href="/polityka-prywatnosci" target="_blank" rel="noopener">Politykę prywatności</a>. Wiem, że moje dane trafią do dostawcy AI wyłącznie w celu przygotowania dokumentów.'));
  assert.ok(step6.includes('Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.'));
  assert.ok(step6.indexOf('id="payTrustList"') < step6.indexOf('id="consentBox"') && step6.indexOf('id="gwBox"') < step6.indexOf('id="consentBox"'));
  assert.match(step6, /<details class="codebox" id="codeBox"><summary>Mam kod rabatowy<\/summary>[\s\S]*?id="codeInput"[\s\S]*?<\/details>/);
  assert.match(app, /\$\('#codeBox'\)\.open \|\|= !!\$\('#codeInput'\)\.value\.trim\(\) \|\| !!promo;/, 'kod z linku polecającego lub promocji: pole rozwinięte');
  assert.match(css, /\.consent-box\{[^}]*border:2px solid var\(--brand\)/);
  assert.match(app, /for \(const id of \['consent', 'waiver'\]\) \$\('#' \+ id\)\.closest\('label'\)\.classList\.add\('compact'\);/, 'wariant B (zgody kompaktowo) bez zmian');
});

test('„Dostajesz” nad przyciskiem zależnie od pakietu i dodatku Word; przykład CV w modalu, gdy podgląd AI niedostępny', () => {
  assert.match(html, /<div class="wiz-foot"><p class="werr-foot" id="werrFoot" aria-hidden="true" hidden><\/p><p class="get-line" id="getLine" hidden><\/p>/);
  for (const s of ['CV pod Twój zawód', 'CV z listami motywacyjnymi, każde pod swoje ogłoszenie', 'CV i list motywacyjny pod to ogłoszenie', 'CV pod to ogłoszenie', 'w PDF i Word', 'poprawki w cenie', 'faktura na życzenie']) {
    assert.ok(app.includes(`'${s}'`), s);
    for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[s], `${l}: ${s}`);
  }
  assert.match(app, /function payTrust\(n\) \{\n  const box = \$\('#payTrust'\), on = n === 6 && total\(\) > 0;\n  getLine\(on\);/);
  assert.doesNotMatch(app.match(/function getLine[\s\S]*?\n}\n/)[0], /gwarant|najlepsz|zaproszen/i, 'bez obietnic');
  assert.match(step6, /<p class="pv-ex" id="pvEx" hidden><button type="button" class="btn ghost sm" data-example="0">Zobacz przykład gotowego CV<\/button>/);
  assert.match(app, /\$\('#pvEx'\)\.hidden = !\$\('#pvBox'\)\.hidden;/);
  assert.match(app, /const closeEx = \(\) => \{ \$\('#exview'\)\.hidden = true; if \(\$\('#wiz'\)\.hidden\) modal\(false\); else lastFocus\?\.focus\?\.\(\); \};/, 'zamknięcie przykładu nie odblokowuje tła pod kreatorem');
  for (const l of ['en', 'de', 'uk']) for (const k of ['Mam kod rabatowy', 'Zobacz przykład gotowego CV', 'Dostajesz:']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[k], `${l}: ${k}`);
});
