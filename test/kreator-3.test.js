import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// C3 (26.10): kreator na 3 ekrany – 1) ogłoszenie i pakiet („Samo CV” domyślnie), 2) dane (plik CV albo e-mail i jedno stanowisko; reszta zwinięta),
// 3) podsumowanie z podglądem, wyglądem i płatnością. Sekcje 1, 2, 6 – walidacja, analityka i szkice zgodne wstecz.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html');
const sec = (n) => { const i = html.indexOf(`<section data-step="${n}"`); return html.slice(i, html.indexOf('</section>', i)); };
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

test('Trzy ekrany: sekcje 1, 2 i 6; kroki 3–5 usunięte; stepper „Krok X z 3”', () => {
  assert.deepEqual([...html.matchAll(/<section data-step="(\d)"/g)].map((m) => m[1]), ['1', '2', '6', '7']);
  assert.match(app, /const ORDER = \[1, 2, 6\];/);
  assert.match(app, /const STEPS = \['Ogłoszenie i pakiet', 'Twoje dane', [^\]]+'Podsumowanie i płatność'\];/);
  assert.match(app, /\$\('#wizKicker'\)\.textContent = n <= 6 \? `Krok \$\{idx \+ 1\} z \$\{ORDER\.length\}`/);
  assert.doesNotMatch(app, /ORDER_B/);
});

test('Ekran 1: ogłoszenie, potem sam pakiet („Samo CV” zaznaczone); bez dodatków, tłumaczeń i szablonów', () => {
  const s1 = sec(1);
  assert.ok(s1.indexOf('<div id="ads"></div>') < s1.indexOf('id="pkgOpts"'), 'ogłoszenie nad pakietem');
  assert.match(s1, /<input type="radio" name="pkg" value="cv" checked>/); assert.doesNotMatch(s1, /value="cv_letter" checked/);
  for (const id of ['adInterview', 'adSim', 'adMessages', 'adLinkedin', 'adDocx', 'langPick', 'wizDesign']) assert.ok(!s1.includes(`id="${id}"`), id);
  for (const id of ['trust1', 'saveLater', 'passUse', 'profEx']) assert.ok(s1.includes(`id="${id}"`), id);
});

test('Ekran 2: plik CV na górze, imię i e-mail, jedno stanowisko; reszta od razu widoczna jako „Pozostałe dane (opcjonalnie)” (29.10)', () => {
  const s2 = sec(2), more = s2.slice(s2.indexOf('<div class="optbox more-data" id="moreData"><h3 class="sh">Pozostałe dane <span class="h">(opcjonalnie)</span></h3>'));
  assert.ok(s2.indexOf('id="importBox"') < s2.indexOf('id="name"') && s2.indexOf('id="email"') < s2.indexOf('id="exp"'));
  assert.ok(s2.indexOf('id="exp"') < s2.indexOf('id="moreData"'), 'doświadczenie widoczne');
  assert.ok(more.length > 100 && !/<details class="optbox more-data"/.test(s2), 'bez rozwijania');
  for (const id of ['phone', 'city', 'link', 'birth', 'headline', 'summary', 'photoFile', 'careerOn', 'edu', 'skills', 'languages', 'certificates', 'interests', 'notes']) assert.ok(more.includes(`id="${id}"`), id);
  assert.match(app, /if \(n === 2 && !imported && !rows\('exp'\)\.some\(\(e\) => e\.title \|\| e\.company\) && !rows\('edu'\)\.some\(\(e\) => e\.school\)\) return 'Wgraj swoje CV albo dodaj co najmniej jedno stanowisko/);
  assert.match(app, /if \(n === 2\) \{ if \(!v\('name'\)\) return 'Podaj imię i nazwisko\.'; if \(!\/\^\\S\+@\\S\+\\\.\\S\+\$\/\.test\(v\('email'\)\)\) return 'Podaj poprawny adres e-mail\.'; \}/);
  assert.match(app, /\$\('#importBox'\)\.classList\.add\('small'\); track\('cvimport'\);/, 'po imporcie dane z pliku od razu widoczne');
});

test('Ekran 3 (29.10): wygląd → podgląd → dopasowanie → dodatki i tłumaczenie (zwinięte, otwarte gdy coś wybrano) → płatność → kod → zgody; zmiana wyglądu tylko przerysowuje podgląd', () => {
  const s6 = sec(6), at = (id) => s6.indexOf(`id="${id}"`);
  const order = ['wizDesign', 'pvBox', 'wizMatch', 'moreOpts', 'gwBox', 'codeBox', 'consentBox'];
  order.slice(1).forEach((id, i) => assert.ok(at(order[i]) > -1 && at(order[i]) < at(id), `${order[i]} przed ${id}`));
  assert.match(s6, /<details class="optbox" id="moreOpts"><summary>Dodatki i tłumaczenie/);
  assert.match(app, /\$\('#moreOpts'\)\.open \|\|= Object\.values\(addons\(\)\)\.some\(Boolean\) \|\| extraLangs\(\)\.length > 0;/);
  assert.match(app, /\(d\) => \{ design = d; saveDraft\(\); if \(step === 6\) drawSummary\(\); \}/);
  assert.match(app, /const imgSig = \(\) => JSON\.stringify\(\[design, orderPkg\(\)\]\);/);
});

test('Walidacja ogłoszenia i pakietu na ekranie 1; szkice i linki ze starymi krokami 3–5 trafiają na właściwy ekran', () => {
  assert.match(app, /if \(n === 1\) for \(const \[i, a\] of rows\('ads'\)\.entries\(\)\)/);
  assert.match(app, /if \(n === 1 && !passOn\(\) && nAds\(\) > PKG_ADS\[pkg\(\)\]\)/);
  assert.match(app, /const stepOf = \(n\) => \(ORDER\.includes\(n\) \? n : n === 5 \? 1 : n === 3 \|\| n === 4 \? 2 : n === 7 \? 6 : ORDER\[0\]\);/);
  const stepOf = eval(app.match(/const stepOf = (\(n\) => [^;]+);/)[1].replace(/ORDER/g, '[1, 2, 6]'));
  assert.deepEqual([1, 2, 3, 4, 5, 6, 0, 9].map(stepOf), [1, 2, 2, 2, 1, 6, 1, 1]);
  assert.match(app, /if \(n !== 7\) n = stepOf\(n\);/);
  for (const l of ['en', 'de', 'uk']) for (const k of ['Ogłoszenie i pakiet', 'Podsumowanie i płatność', 'Pakiet', 'Więcej danych', 'Dodatki i tłumaczenie', 'Wgraj swoje CV albo dodaj co najmniej jedno stanowisko (szkołę dodasz w „Więcej danych”).']) assert.ok(dict(l)[k], `${l}: ${k}`);
});
