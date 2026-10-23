import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { checkCv } from '../lib/cv-check.js';
import { caseScores, CASE } from '../lib/landing.js';
import { TOOLS } from '../lib/tools.js';
import { TOOL_LANGS, toolUrl } from '../lib/tools-i18n.js';

// PR C1: „Sprawdź CV” i „Test CV pod ATS” (bez ogłoszenia), /kreator-cv, case study „Jedno CV, dwa ogłoszenia”.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const CV = `Anna Przykładowa\nanna@example.com · +48 600 000 000\nPodsumowanie\nSpecjalistka obsługi klienta.\nDoświadczenie zawodowe\nKonsultantka, sklep internetowy, 03.2021 – obecnie\nObsługa klientów przez czat i e-mail, reklamacje i zwroty, praca w systemie CRM.\nWykształcenie\nLiceum ogólnokształcące, 2014 – 2018\nUmiejętności\nCRM, Excel, obsługa klienta\nJęzyki\nangielski B2\n${'Opis obowiązków i efektów pracy w zespole obsługi klienta. '.repeat(20)}\nWyrażam zgodę na przetwarzanie moich danych osobowych (RODO).`;
const port = 4600 + Math.floor(Math.random() * 200), U = `http://localhost:${port}`;
let srv;
before(async () => {
  srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-c1-')), BASE_URL: U, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' }, stdio: 'ignore' });
  for (let i = 0; i < 150; i++) { try { await fetch(`${U}/health`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => srv?.kill());

test('Sprawdzenie CV bez ogłoszenia: sekcje, kontakt, daty, RODO i ostrzeżenia z samego tekstu', () => {
  const r = checkCv(CV);
  assert.deepEqual(r.sections.map((s) => [s.key, s.found]), [['summary', true], ['experience', true], ['education', true], ['skills', true], ['languages', true]]);
  assert.ok(r.email && r.phone && r.rodo && r.dates >= 2);
  assert.deepEqual(r.issues, []);
  const bad = checkCv('Jan\n★★★★☆ Excel\n☎ tel\n' + Array.from({ length: 30 }, (_, i) => `słowo${i}`).join('\n'), 600e3);
  for (const k of ['little_text', 'columns', 'no_email', 'icons', 'no_experience', 'few_dates', 'too_short']) assert.ok(bad.issues.includes(k), k);
});

test('/api/cv-check: tekst z pliku i wynik bez zapisywania (no-store); błędne pliki', async () => {
  const post = (data) => fetch(`${U}/api/cv-check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
  const r = await post(Buffer.from(CV).toString('base64')), j = await r.json();
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.ok(j.text.includes('Doświadczenie zawodowe') && j.words > 150 && j.rodo);
  assert.equal((await post('')).status, 400);
  // skan / CV z obrazków (prawie brak tekstu): wynik testu z ostrzeżeniem, nie błąd pliku
  const sc = await post(Buffer.from('za krótko').toString('base64')), sj = await sc.json();
  assert.equal(sc.status, 200); assert.equal(sj.scan, true); assert.deepEqual(sj.issues, ['little_text']); assert.equal(sc.headers.get('cache-control'), 'no-store');
  assert.equal((await post(Buffer.from('PK\x03\x04 uszkodzony').toString('base64'))).status, 422, 'uszkodzony Word nadal 422');
});

test('Recenzja #69: osobny limit sprawdzeń, tłumaczenia komunikatów, prywatność przy ogłoszeniu, linki do kreatora i case study', async () => {
  const srv = read('server.js'), app = read('public/app.js');
  assert.match(srv, /cvCheckLimit = limiter\(12, 3600_000\)/); assert.match(srv, /app\.post\('\/api\/cv-check'[^\n]*\n  if \(!cvCheckLimit\(req\)\)/);
  const keys = ['Wykorzystano limit darmowych sprawdzeń na godzinę. Spróbuj później.', 'Plik Word jest uszkodzony albo za duży.', 'Zrób CV w kreatorze',
    ...[...app.matchAll(/'(To wygląda na skan[^']+|Nie zapisujemy pliku ani tekstu CV[^']+)'/g)].map((m) => m[1])];
  assert.equal(keys.length, 5);
  for (const l of ['en', 'uk', 'de']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of keys) assert.ok(d[k], `${l}: ${k.slice(0, 40)}`); }
  assert.ok(TOOLS['test-cv-ats'].faq.some((f) => /przez godzinę sam wynik porównania/.test(f.a) && /bez treści CV/.test(f.a)), 'FAQ o pamięci 1 h');
  for (const l of ['en', 'uk', 'de']) assert.equal(TOOL_LANGS[l].data['test-cv-ats'].faq.length, TOOLS['test-cv-ats'].faq.length, `${l}: FAQ`);
  for (const k of ['sprawdz-cv', 'test-cv-ats']) {
    const h = await (await fetch(`${U}/narzedzia/${k}`)).text();
    assert.ok(h.includes('href="/kreator-cv"') && h.includes('href="/poradnik/jedno-cv-dwa-ogloszenia"'), `${k}: linki zwrotne`);
  }
});

test('Narzędzia w 4 językach: własne adresy, tytuły ≤ 60 i różne od skanera, FAQ; skrypt strony obsługuje oba tryby', async () => {
  for (const k of ['sprawdz-cv', 'test-cv-ats']) {
    const pl = await fetch(`${U}/narzedzia/${k}`); assert.equal(pl.status, 200, k);
    const h = await pl.text(); assert.ok(h.includes(`<title>${TOOLS[k].seoTitle}`), `${k}: tytuł`);
    for (const l of ['en', 'uk', 'de']) {
      const d = TOOL_LANGS[l].data[k], r = await fetch(`${U}/${toolUrl(l, k)}`), x = await r.text();
      assert.equal(r.status, 200, `${l} ${k}`); assert.ok(x.includes(`<html lang="${l}"`) && x.includes(`<title>${d.seoTitle}`), `${l} ${k}: tytuł`);
      assert.ok(d.seoTitle.length <= 60 && d.metaDescription.length <= 155 && d.seoTitle !== TOOL_LANGS[l].data['skaner-cv'].title);
    }
  }
  const app = read('public/app.js');
  assert.match(app, /else if \(slug === 'sprawdz-cv'\) toolCheck\(box, false\);\n  else if \(slug === 'test-cv-ats'\) toolCheck\(box, true\);/);
  assert.match(app, /fetch\('\/api\/cv-check'/);
  for (const l of ['en', 'uk', 'de']) for (const key of ['Odczytaliśmy {0} słów.', 'Tak widzi Twoje CV program do rekrutacji', 'Test kopiowania: tekst odczytany z pliku']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[key], `${l}: ${key}`);
});

test('/kreator-cv i case study: SSR, FAQPage, w mapie strony, klaster linków, liczby ze skanera, bez „za darmo” przy CV', async () => {
  const k = await (await fetch(`${U}/kreator-cv`)).text();
  assert.match(k, /<title>Kreator CV online pod ogłoszenie – bez logowania, od 39 zł<\/title>/);
  assert.match(k, /<form class="wiz-ad paste-ad"/); assert.match(k, /"@type":"FAQPage"/);
  for (const u of ['/narzedzia/skaner-cv', '/narzedzia/sprawdz-cv', '/narzedzia/test-cv-ats', '/poradnik/jedno-cv-dwa-ogloszenia']) assert.ok(k.includes(`href="${u}"`), u);
  assert.doesNotMatch(k, /gwarant|najlepsz/i);
  const c = await (await fetch(`${U}/poradnik/jedno-cv-dwa-ogloszenia`)).text(), sc = caseScores();
  for (const [i, s] of sc.entries()) { assert.ok(c.includes(`<h3>CV pod ogłoszenie ${s.key}</h3><p class="small">${s.tailored.score}% – wynik skanera słów kluczowych; prosty algorytm, przykład poglądowy</p>`), `wynik ${s.key}`); assert.ok(!c.includes(CASE.ads[i].key) || !/<h[1-3][^>]*>[^<]*\d+%/.test(c), 'bez procentów w nagłówkach'); assert.ok(s.tailored.score > s.generic.score, `dopasowanie podnosi wynik ${s.key}`); }
  assert.match(c, /dane fikcyjne/); assert.doesNotMatch(c.match(/<meta property="og:[^>]+>/g).join(' '), /\d+%/, 'bez procentów w OG'); assert.match(c, /"@type":"FAQPage"/);
  const sm = await (await fetch(`${U}/sitemap.xml`)).text();
  for (const u of ['kreator-cv', 'poradnik/jedno-cv-dwa-ogloszenia', 'narzedzia/sprawdz-cv', 'narzedzia/test-cv-ats']) assert.ok(sm.includes(`${U}/${u}</loc>`), u);
  assert.match(read('public/lite.js'), /sessionStorage\.setItem\('cvpo-wiz-ad'/); assert.match(read('public/app.js'), /sessionStorage\.getItem\('cvpo-wiz-ad'\)/);
});
