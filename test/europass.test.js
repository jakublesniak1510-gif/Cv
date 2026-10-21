import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import express from 'express';
import { DIGITAL, DRIVING, EU_LBL, splitEuropass } from '../lib/europass.js';
import { renderCv } from '../lib/pdf.js';
import { seoRoutes } from '../lib/seo.js';
import { officialRoutes, OFFICIAL } from '../lib/official.js';

const base = 'https://example.test';
let srv, U;
before(() => { const app = express(); seoRoutes(app, base); officialRoutes(app, base); srv = app.listen(0); U = `http://127.0.0.1:${srv.address().port}`; });
after(() => srv.close());
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const cv = { name: 'Anna Nowak', headline: 'Asystentka projektu', contact: ['+48 600 100 200', 'anna@example.com', 'Kraków'], summary: 'Koordynuję dokumentację projektów.',
  experience: [{ title: 'Asystentka projektu', company: 'Fundacja Rozwoju', period: '03.2021 – obecnie', bullets: ['Prowadziłam dokumentację projektu Erasmus+.'] }],
  education: [{ school: 'Uniwersytet Jagielloński', degree: 'Europeistyka, magister', period: '2015 – 2020' }],
  skills: ['Excel (tabele przestawne)', 'MS Office', 'organizacja spotkań', 'prawo jazdy kat. B', 'obsługa komputera'], languages: ['angielski C1', 'niemiecki B1'],
  certificates: ['Kurs zarządzania projektami (2022)', 'Prawo jazdy kat. B'], clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a RODO (UE) 2016/679.' };

test('Europass: umiejętności cyfrowe i prawo jazdy wydzielone z danych klienta, bez fałszywych trafień', () => {
  const e = splitEuropass(cv);
  assert.deepEqual(e.digital, ['Excel (tabele przestawne)', 'MS Office', 'obsługa komputera']);
  assert.deepEqual(e.skills, ['organizacja spotkań']);
  assert.deepEqual(e.driving, ['prawo jazdy kat. B', 'Prawo jazdy kat. B']);
  assert.deepEqual(e.certs, ['Kurs zarządzania projektami (2022)']);
  for (const s of ['wordpress', 'Kat. C+E', 'Führerschein Klasse B']) assert.ok(DIGITAL.test(s) || DRIVING.test(s), s);
  for (const s of ['słowo honoru', 'kreatywność', 'katering', 'sapper', 'praca w zespole']) assert.ok(!DIGITAL.test(s) && !DRIVING.test(s), s);
});

test('Podgląd w przeglądarce używa tych samych wyrażeń i dopisków co PDF', () => {
  const app = read('public/app.js');
  assert.ok(app.includes(`const EU_DIGITAL = ${DIGITAL};`) && app.includes(`const EU_DRIVING = ${DRIVING};`), 'te same wyrażenia');
  for (const l of Object.values(EU_LBL)) assert.ok(app.includes(l.note) && app.includes(l.digital), l.note);
  // Dopisek w każdym języku szablonu: „wzorowany na”, nie „zgodny z” (bez sugerowania certyfikacji), i że to nie jest oficjalny dokument.
  const NOT = { pl: 'To nie jest oficjalny dokument Europass.', en: 'This is not an official Europass document.', de: 'Dies ist kein offizielles Europass-Dokument.', uk: 'Це не офіційний документ Europass.', es: 'No es un documento oficial de Europass.', fr: 'Ce n’est pas un document officiel Europass.' };
  for (const [l, t] of Object.entries(NOT)) { assert.ok(EU_LBL[l].note.endsWith(t), l); assert.doesNotMatch(EU_LBL[l].note, /zgodn|conforme|compliant|entspricht|відповідає|conforme/i, l); }
  assert.match(app, /\['europass', 'W układzie Europass', '[^']*To nie jest oficjalny dokument Europass\.'\]/);
  assert.match(app, /k\.eLangs\(\), \.\.\.k\.eRest\(\), k\.intr\(\), k\.clause\(\), k\.euNote\(\)/);
  assert.match(app, /q\.get\('szablon'\)/, 'kreator przyjmuje ?szablon=');
});

test('PDF „W układzie Europass”: kolejność sekcji jak w Europass, tabela CEFR, dopisek; bez logo UE', async () => {
  for (const [lang, digital, note] of [['pl', 'UMIEJĘTNOŚCI CYFROWE', 'Układ wzorowany na Europass, przygotowany w cvpodogloszenie.pl. To nie jest oficjalny dokument Europass.'], ['en', 'DIGITAL SKILLS', 'This is not an official Europass document.']]) {
    const pdf = await renderCv({ lang, cv }, { tpl: 'europass', color: 'niebieski' }, null);
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'eu-')), 'cv.pdf'); fs.writeFileSync(f, pdf);
    const t = execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' }).replace(/\s+/g, ' ');
    const at = (s) => { const i = t.indexOf(s); assert.ok(i >= 0, `${lang}: brak „${s}”`); return i; };
    const order = lang === 'pl' ? ['DOŚWIADCZENIE ZAWODOWE', 'WYKSZTAŁCENIE', 'JĘZYKI', digital, 'UMIEJĘTNOŚCI', 'PRAWO JAZDY', 'CERTYFIKATY'] : ['WORK EXPERIENCE', 'EDUCATION', 'LANGUAGES', digital, 'SKILLS', 'DRIVING LICENCE', 'CERTIFICATIONS'];
    const pos = order.map((s, i) => (i === 4 ? t.indexOf(s, at(digital) + digital.length) : at(s)));
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${lang}: kolejność sekcji`);
    assert.ok(t.includes('(CEFR)'), 'tabela języków z poziomem CEFR'); assert.ok(t.includes(note), 'dopisek');
    assert.equal(t.split('Prawo jazdy kat. B').length + t.split('prawo jazdy kat. B').length - 2, 2, 'prawo jazdy tylko w swojej sekcji');
  }
  assert.doesNotMatch(read('lib/pdf.js').slice(read('lib/pdf.js').indexOf('europass(c, acc)')), /image\([^)]*(eu|flag|logo)/i, 'bez obrazów/logo');
});

test('Strony /cv-europass i /cv-do-urzedu: źródła, autor, FAQ, CTA z szablonem, w mapie strony; bez obietnic', async () => {
  const sm = await (await fetch(`${U}/sitemap.xml`)).text();
  for (const x of OFFICIAL) {
    const r = await fetch(`${U}/${x.slug}`), h = await r.text();
    assert.equal(r.status, 200);
    assert.ok(h.includes(`<h1>${x.title}</h1>`)); assert.match(h, /class="byline"/); assert.match(h, /"@type":"FAQPage"/);
    assert.ok(h.includes(`href="/?zamow=1&szablon=${x.tpl}"`), 'CTA z wybranym szablonem');
    for (const [, u] of x.sources) assert.ok(h.includes(`href="${u}"`), u);
    assert.ok(sm.includes(`${base}/${x.slug}</loc>`), `${x.slug} w mapie strony`);
    // procenty tylko jako ustawowy próg z ogłoszeń (6% osób z niepełnosprawnościami), bez statystyk bez źródła
    assert.doesNotMatch(JSON.stringify(x).replace('niższy niż 6%', ''), /gwarant|na pewno dostaniesz|\d+\s?%/i);
  }
  for (const x of OFFICIAL) {
    const h = await (await fetch(`${U}/${x.slug}`)).text();
    assert.doesNotMatch(h, /oficjalny szablon|zgodny z Europass|gwarant/i, `${x.slug}: bez sugerowania oficjalności i obietnic`);
    assert.ok(h.includes('https://europass.europa.eu/pl') && h.includes('https://nabory.kprm.gov.pl'), `${x.slug}: oba oficjalne linki`);
    assert.match(h, /Stan na: październik 2026/); assert.match(h, /href="\/zasady-redakcyjne"/);
  }
  const eu = await (await fetch(`${U}/cv-europass`)).text();
  assert.ok(eu.includes('https://europass.europa.eu/pl')); assert.match(eu, /To nie jest oficjalny dokument Europass i nie ma logo ani flagi Unii Europejskiej/); assert.match(eu, /interakcja ustna, produkcja ustna/);
  const ur = await (await fetch(`${U}/cv-do-urzedu`)).text();
  assert.ok(ur.includes('https://nabory.kprm.gov.pl')); assert.match(ur, /Biuletynie Informacji Publicznej/);
  for (const t of ['część ogłoszeń dopuszcza obywateli UE lub innych państw', 'na stanowiskach urzędniczych', 'pełnej zdolności do czynności prawnych', 'niższy niż 6%', 'art. 22¹ Kodeksu pracy', 'art. 22¹a Kodeksu pracy', 'EZD RP', 'tylko w odniesieniu do tego, co faktycznie znasz']) assert.ok(ur.includes(t), t);
});
