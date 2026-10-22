import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.ANTHROPIC_API_KEY = '';
const { LI, clampLinkedin, cutWords } = await import('../lib/linkedin.js');
const { checkResult, QA_LABELS } = await import('../lib/qa.js');
const { generateForAd, generateLinkedin } = await import('../lib/generate.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const profile = { name: 'Jan Test', email: 'jan@x.test', summary: 'Magazynier z doświadczeniem w kompletacji zamówień.', skills: 'kompletacja zamówień, skaner, WMS, wózek widłowy, inwentaryzacja, BHP, praca zmianowa, Excel, obsługa dokumentów WZ/PZ, rozładunek, załadunek, sortowanie',
  experience: [{ title: 'Magazynier', company: 'Lidl Polska', period: '2020 – 2024', desc: 'Kompletacja zamówień skanerem, przyjęcia towaru.' }, { title: 'Pracownik sortowni', company: 'InPost', period: '2018 – 2020' }] };
const ad = { title: 'Magazynier', text: 'Szukamy magazyniera. Wymagania: kompletacja zamówień, obsługa skanera i WMS, uprawnienia UDT, praca zmianowa, dokładność.', lang: 'pl' };

test('Limity LinkedIna: nagłówek ≤ 220 (cięcie na słowie), „Informacje” ≤ 2600 (na zdaniu), 10–15 umiejętności bez powtórzeń, maks. 3 stanowiska', () => {
  const long = Array.from({ length: 60 }, (_, i) => `słowo${i}`).join(' ');
  const about = Array.from({ length: 80 }, (_, i) => `To jest zdanie numer ${i} o mojej pracy w magazynie.`).join(' ');
  const l = clampLinkedin({ headline: long, about, skills: [...Array.from({ length: 20 }, (_, i) => `Umiejętność ${i}`), 'umiejętność 1'], experience: Array.from({ length: 5 }, (_, i) => ({ title: `S${i}`, company: 'Lidl', text: 'Opis.' })), tips: Array(9).fill('Rada') });
  assert.ok(l.headline.length <= LI.headline && long.startsWith(l.headline) && long[l.headline.length] === ' ', 'nagłówek to początek tekstu, ucięty na całym słowie');
  assert.ok(l.about.length <= LI.about && l.about.endsWith('.'), '„Informacje” kończą się pełnym zdaniem');
  assert.equal(l.skills.length, 15); assert.equal(new Set(l.skills.map((s) => s.toLowerCase())).size, 15);
  assert.equal(l.experience.length, 3); assert.equal(l.tips.length, 6);
  assert.equal(cutWords('krótki', 220), 'krótki'); assert.equal(clampLinkedin(null), null);
});

test('Kontrola jakości profilu: brak zamówionego profilu, firmy spoza danych klienta, mało umiejętności', () => {
  const r = { lang: 'pl', cv: { summary: 'x', skills: ['a'], clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia (UE) 2016/679.' } };
  const codes = (x, o = {}) => checkResult(x, { profile, ad, ...o }).flags.map((f) => `${f.code}:${f.level}`);
  assert.ok(codes(r, { linkedin: true }).includes('li_brak:critical'), 'zamówiony, a brak profilu');
  assert.ok(!codes(r).some((c) => c.startsWith('li_')), 'bez dodatku nic nie sprawdzamy');
  const li = { headline: 'Magazynier | WMS', about: 'O mnie.', skills: ['WMS', 'skaner'], experience: [{ title: 'Magazynier', company: 'Lidl', text: 'Opis.' }, { title: 'Kierownik', company: 'Amazon Fulfillment', text: 'Opis.' }], tips: [] };
  const c = codes({ ...r, linkedin: li }, { linkedin: true });
  assert.ok(c.includes('li_firma_spoza_profilu:critical'), 'Amazon nie występuje w danych klienta'); assert.ok(c.includes('li_umiejetnosci:warn'));
  assert.ok(!c.includes('li_brak:critical'));
  for (const k of ['li_brak', 'li_dlugosc', 'li_umiejetnosci', 'li_firma_spoza_profilu']) assert.ok(QA_LABELS[k], k);
});

test('Generowanie bez AI (tryb zapasowy) i profil do gotowego CV mieszczą się w limitach; wersja EN tylko na życzenie', async () => {
  const r = await generateForAd({ profile, ad, withLetter: false, addons: { linkedin: true } });
  const l = r.linkedin;
  assert.ok(l.headline.length <= 220 && l.about.length <= 2600 && l.skills.length >= 10 && l.skills.length <= 15 && l.experience.length <= 3);
  assert.equal(r.linkedinEn, undefined);
  assert.ok(!checkResult(r, { profile, ad, linkedin: true }).flags.some((f) => f.code.startsWith('li_') && f.level === 'critical'), 'bez krytycznych flag LinkedIn');
  const solo = await generateLinkedin({ profile, ad, result: r, lang: 'pl' });
  assert.ok(solo.headline && solo.about.length <= 2600);
  assert.equal((await generateForAd({ profile, ad, withLetter: false, addons: {} })).linkedin, null);
});

test('Kreator, prompt i e-mail: opcja EN tylko z dodatkiem, limity w poleceniu dla modelu, wersja EN w e-mailu', () => {
  const html = read('public/index.html'), srv = read('server.js'), gen = read('lib/generate.js'), app = read('public/app.js'), mail = read('lib/mail.js');
  assert.match(html, /id="liEnBox" hidden><input type="checkbox" id="adLinkedinEn">/);
  assert.match(html, /do 220 znaków\), sekcja „Informacje” \(do 2600 znaków\), do 15 umiejętności, opisy do 3 stanowisk/, 'opis nie obiecuje więcej niż dostanie klient z jednym stanowiskiem');
  assert.match(html, /LinkedIn jest znakiem towarowym LinkedIn Corp\.; serwis nie jest z nim powiązany\./);
  assert.match(app, /linkedinEn: \$\('#adLinkedinEn'\)\.checked \}/, 'szkic kreatora pamięta wersję EN'); assert.match(app, /s\.setAttribute\('data-i18n', ''\)/, 'licznik znaków tłumaczony mimo .paper');
  for (const l of ['en', 'uk', 'de']) assert.ok(!Object.keys(JSON.parse(read(`public/i18n/${l}.json`))).some((k) => k.startsWith('Nagłówek, sekcja „Informacje”, 15 umiejętności')), `${l}: bez starego klucza`);
  assert.match(srv, /a\.linkedin && a\.linkedinEn \? \{ linkedinEn: true \}/, 'EN tylko razem z dodatkiem');
  assert.match(gen, /maks\. \$\{LI\.about\} znaków/); assert.match(gen, /\$\{LI\.skillsMin\}-\$\{LI\.skillsMax\} umiejętności/); assert.match(gen, /WYŁĄCZNIE z faktów kandydata/);
  assert.match(app, /linkedinEn: \$\('#adLinkedin'\)\.checked && \$\('#adLinkedinEn'\)\.checked/); assert.match(app, /\/\$\{max\} znaków/);
  assert.match(mail, /LinkedIn \(English\)/);
});

test('Tłumaczenie wariantu: wersja EN bez zmian, bez wyniku QA, profil w limitach', async () => {
  const { translateResult } = await import('../lib/generate.js');
  const en = { headline: 'Warehouse Operative | WMS', about: 'I work in a warehouse.', skills: ['WMS'], experience: [], tips: [] };
  const long = Array.from({ length: 90 }, (_, i) => `Zdanie numer ${i} o pracy w magazynie.`).join(' ');
  const v = await translateResult({ lang: 'pl', cv: { name: 'Jan' }, linkedin: { headline: 'Magazynier', about: long, skills: ['WMS'] }, linkedinEn: en, qa: { score: 90, flags: [] } }, 'de');
  assert.deepEqual(v.linkedinEn, en, 'angielski profil nie trafia do tłumaczenia i zostaje bez zmian');
  assert.equal(v.qa, undefined); assert.ok(v.linkedin.about.length <= 2600);
});

test('Dokupiony profil: krytyczna flaga → jedna ponowna generacja, potem bad (alert); li_en_brak i firmsMissing', async () => {
  const { linkedinChecked } = await import('../lib/generate.js');
  const result = { lang: 'pl', cv: { summary: 'x', skills: ['a'] } };
  const good = { headline: 'Magazynier | WMS', about: 'Pracuję w magazynie.', skills: Array.from({ length: 10 }, (_, i) => `u${i}`), experience: [{ title: 'Magazynier', company: 'Lidl Polska', text: 'Kompletacja.' }], tips: [] };
  const fake = { ...good, experience: [{ title: 'Kierownik', company: 'Amazon Fulfillment', text: 'Wymyślone.' }] };
  let calls = 0;
  let r = await linkedinChecked({ profile, ad, result, gen: async () => (++calls === 1 ? fake : good) });
  assert.equal(calls, 2); assert.equal(r.bad, false); assert.equal(r.li.experience[0].company, 'Lidl Polska');
  calls = 0; r = await linkedinChecked({ profile, ad, result, gen: async () => (++calls, fake) });
  assert.equal(calls, 2, 'tylko jedna ponowna generacja'); assert.equal(r.bad, true, 'błąd został → alert do właściciela');
  calls = 0; r = await linkedinChecked({ profile, ad, result, gen: async () => (++calls, good) });
  assert.equal(calls, 1, 'bez błędów bez ponawiania');
  // klient nie podał firmy przy każdym stanowisku → tylko ostrzeżenie (bez ponownej generacji)
  const partial = { ...profile, experience: [{ title: 'Magazynier', company: '' }] };
  calls = 0; r = await linkedinChecked({ profile: partial, ad, result, gen: async () => (++calls, fake) });
  assert.equal(calls, 1); assert.ok(r.qa.flags.some((f) => f.code === 'li_firma_spoza_profilu' && f.level === 'warn'));
  const base = { lang: 'pl', cv: { summary: 'x', skills: ['a'] }, linkedin: good };
  assert.ok(checkResult(base, { profile, ad, linkedin: true, linkedinEn: true }).flags.some((f) => f.code === 'li_en_brak' && f.level === 'warn'), 'zamówiona wersja EN, której brak');
  assert.ok(!checkResult({ ...base, linkedinEn: good }, { profile, ad, linkedin: true, linkedinEn: true }).flags.some((f) => f.code === 'li_en_brak'));
  assert.ok(!checkResult({ ...base, lang: 'en' }, { profile, ad, linkedin: true, linkedinEn: true }).flags.some((f) => f.code === 'li_en_brak'), 'CV po angielsku nie potrzebuje osobnej wersji EN');
});

test('Regulamin PL/DE/EN/UK: wersja EN profilu bez dopłaty, dokupione dodatki osobno po opłaceniu, art. 38 pkt 13, historia zmian', () => {
  const r = read('public/legal/regulamin.html');
  for (const t of ['wersję profilu w języku angielskim', 'englische Version des Profils', 'English version of the profile', 'версію профілю англійською', 'art. 38 pkt 13', 'Art. 38 Nr. 13', 'Article 38(13)', 'ст. 38 п. 13', '21 października 2026 r. – dodatki dokupione', '21. Oktober 2026 – hinzugekaufte Zusatzleistungen', '21 October 2026 – add-ons purchased', '21 жовтня 2026 р. – додаткові послуги']) assert.ok(r.includes(t), t);
  assert.match(read('public/app.js'), /body: JSON\.stringify\(\{ key: o\.key, waiver: true, gateway: gwValue\(\$\('#upGw'\)\) \}\)/);
});
