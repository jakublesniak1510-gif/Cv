import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkResult, qaFixNote, QA_LABELS } from '../lib/qa.js';

// Alert „Pracodawca spoza danych klienta” (28.10): firma z ogłoszenia w nagłówku/podsumowaniu to nie błąd; w doświadczeniu tylko
// pracodawcy z danych klienta (także z „Dodatkowych informacji”); firma z ogłoszenia w doświadczeniu – osobny kod krytyczny;
// ponowna generacja dostaje konkretny błąd do poprawienia.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const profile = { experience: [{ title: 'Kasjer', company: 'Biedronka', description: 'obsługa kasy' }, { title: 'Pracownik biurowy', company: 'Urząd Miasta Krakowa', description: '' }], notes: 'Wolontariat w Caritas Polska (2022).', education: [{ school: 'LO nr 5' }] };
const clause = 'Wyrażam zgodę na przetwarzanie danych osobowych dla potrzeb rekrutacji (2016/679).';
const E = (company) => ({ title: 'Stanowisko', company, bullets: ['Obsługiwałem klientów'] });
const res = (exp, extra = {}) => ({ lang: 'pl', company: 'Lidl Polska Sklepy Spożywcze', cv: { headline: 'Kasjer', summary: 'Doświadczony kasjer.', experience: exp, education: [{ school: 'LO nr 5' }], clause, ...extra } });
const firmFlags = (r) => checkResult(r, { profile, ad: { lang: 'auto' } }).flags.filter((f) => /^firma/.test(f.code));
const base = [E('Biedronka'), E('Urząd Miasta Krakowa')];

test('Fałszywy alarm: firma z ogłoszenia w nagłówku i podsumowaniu, pracodawca z „Dodatkowych informacji” – bez błędu', () => {
  assert.deepEqual(firmFlags(res(base, { headline: 'CV pod ogłoszenie Lidl', summary: 'Aplikuję do Lidl na stanowisko kasjera.' })), []);
  assert.deepEqual(firmFlags(res([...base, E('Caritas Polska')])), [], 'wolontariat z notatek klienta to jego dane');
  assert.deepEqual(firmFlags(res([E('Biedronka, Kraków'), E('Urząd Miasta Krakowa')])), []);
  assert.equal(checkResult(res(base), { profile }).score, 100);
});

test('Realne ryzyko: firma z ogłoszenia w doświadczeniu → „firma_z_ogloszenia” (krytyczny), inna obca firma → „firma_spoza_profilu”', () => {
  assert.deepEqual(firmFlags(res([...base, E('Lidl')])), [{ code: 'firma_z_ogloszenia', level: 'critical', n: 1 }]);
  assert.deepEqual(firmFlags(res([E('Biedronka'), E('Krakow City Hall')])), [{ code: 'firma_spoza_profilu', level: 'critical', n: 1 }], 'przetłumaczona nazwa');
  const q = checkResult(res([...base, E('Lidl Polska')]), { profile }); assert.equal(q.score, 70);
  assert.equal(QA_LABELS.firma_z_ogloszenia, 'Pracodawca z ogłoszenia wpisany do doświadczenia');
  // klient naprawdę pracował w firmie z ogłoszenia → bez błędu
  assert.deepEqual(checkResult(res([E('Lidl'), ...base]), { profile: { ...profile, experience: [...profile.experience, { title: 'Kasjer', company: 'Lidl' }] } }).flags.filter((f) => /^firma/.test(f.code)), []);
});

test('Ponowna generacja: konkretny błąd do usunięcia (firma z ogłoszenia, dozwolone nazwy), przekazany do modelu; prompt zabrania firmy z ogłoszenia w doświadczeniu', () => {
  const note = qaFixNote(res([...base, E('Lidl')]), profile);
  assert.match(note, /pracodawców, których kandydat nie podał: „Lidl”/); assert.match(note, /dokładnie w tym brzmieniu: „Biedronka”, „Urząd Miasta Krakowa”/); assert.match(note, /Firmy z ogłoszenia nigdy nie wpisuj do doświadczenia/);
  assert.equal(qaFixNote(res(base), profile), '', 'bez błędu – bez uwag');
  const gen = read('lib/generate.js'), srv = read('server.js');
  assert.match(gen, /Firmy z ogłoszenia NIGDY nie wpisuj do doświadczenia/); assert.match(gen, /\$\{fix \? `\\n\\n<do_poprawy>\\n\$\{fix\}\\n<\/do_poprawy>` : ''\}/);
  assert.match(srv, /const r2 = await gen\(qaFixNote\(r, o\.profile\)\)/); assert.match(srv, /async \(fix = ''\) => \{ const r = await generateForAd\(\{ profile: o\.profile, ad, withLetter, addons: o\.addons, fix,/);
});
