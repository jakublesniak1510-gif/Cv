import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import express from 'express';
import { profReqs, profAdText, findProfession, PROF_NOTE } from '../lib/prof-ad.js';
import { seoRoutes } from '../lib/seo.js';
import { legalBody } from '../lib/legal.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';

// „CV pod zawód”: CV bez konkretnego ogłoszenia, pod typowe wymagania zawodu z danych serwisu (39 zł, jedno CV bez listu).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (s) => s.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();

test('Wymagania zawodu: z zakresu obowiązków i słów kluczowych, bez powtórzeń; zawód spoza listy bez listy', () => {
  for (const q of ['magazynier', 'Kasjerka', 'cv/kasjer', 'spawacz']) assert.ok(findProfession(q), q);
  const k = profReqs('kasjer');
  assert.equal(k.slug, 'kasjer'); assert.ok(k.reqs.length >= 8 && k.reqs.length <= 14); assert.ok(k.duties.length >= 3);
  assert.equal(new Set(k.reqs.map(key)).size, k.reqs.length, 'bez powtórzeń');
  const p = profReqs('programista'); assert.equal(p.slug, 'programista'); assert.ok(p.reqs.length >= 5);
  const x = profReqs('pilot balonu'); assert.equal(x.slug, null); assert.deepEqual(x.reqs, []); assert.equal(x.name, 'pilot balonu');
  const t = profAdText(k);
  assert.ok(t.length >= 80); assert.match(t, /^CV pod zawód: Kasjer \/ Kasjerka \(bez konkretnego ogłoszenia/); assert.match(t, /Typowe obowiązki: obsługa kasy fiskalnej/);
  assert.match(profAdText(x), /dobierz najczęstsze wymagania w ogłoszeniach dla zawodu „pilot balonu”/);
  // generator i podgląd dostają uwagę, że to nie jest konkretna oferta (bez nazwy firmy)
  for (const f of ['lib/generate.js', 'lib/preview.js']) assert.match(read(f), /ad\.kind === 'profession' \? `[^`]*\$\{PROF_NOTE\}/, f);
  assert.match(PROF_NOTE, /company = ""/);
  // kreator: zakładka „Bez ogłoszenia”, ten sam układ tekstu co na serwerze, walidacja jednego CV bez listu
  const app = read('public/app.js');
  assert.match(app, /data-mode="prof">Bez ogłoszenia<\/button>/); assert.match(app, /fetch\(`\/api\/prof-reqs\?q=\$\{encodeURIComponent\(v\)\}`\)/);
  assert.match(app, /CV pod zawód: \$\{name\} \(bez konkretnego ogłoszenia – typowe wymagania tego zawodu\)\./);
  assert.match(app, /q\.get\('tryb'\) === 'zawod'/);
  for (const l of ['en', 'de', 'uk']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const s of ['Bez ogłoszenia', 'Pokaż wymagania', 'Nie masz jeszcze ogłoszenia?', 'Zrób CV pod typowe wymagania tego zawodu – {X}', 'CV pod zawód (bez ogłoszenia) zamawiasz jako jedno CV bez listu. Gdy znajdziesz ogłoszenie, zamów CV z listem pod tę ofertę.']) assert.ok(d[s], `${l}: ${s}`);
  }
});

test('Strony zawodów: link „CV pod typowe wymagania tego zawodu” do kreatora w trybie bez ogłoszenia (4 języki)', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/cv/magazynier`)).text();
    assert.match(h, /<p class="small prof-nojob">Nie masz jeszcze ogłoszenia\? <a href="\/\?zamow=1&amp;pkg=cv&amp;zawod=magazynier&amp;tryb=zawod">Zrób CV pod typowe wymagania tego zawodu – 39 zł<\/a><\/p>/);
    for (const [l, txt] of [['en', 'Don&#39;t have a job ad yet?'], ['de', 'Noch keine Stellenanzeige?'], ['uk', 'Ще не маєте оголошення?']]) {
      const x = await (await fetch(`${U}/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof.magazynier.slugLang}`)).text();
      assert.ok(x.includes(`${txt} <a href="/${l}?zamow=1&amp;pkg=cv&amp;zawod=magazynier&amp;tryb=zawod">`), l);
    }
  } finally { srv.close(); }
});

test('Regulamin (4 języki): CV pod zawód w §2, wyjątek w §3, data 24.10.2026 i historia zmian', () => {
  for (const [l, re] of [['pl', /CV pod zawód”\): CV przygotowane pod typowe wymagania wybranego zawodu/], ['de', /Lebenslauf für einen Beruf“\)/], ['en', /CV for a job type”\): a CV prepared/], ['uk', /резюме під професію»\): резюме/]]) {
    const b = legalBody('regulamin', l);
    assert.match(b, re, l); assert.match(b, /24[ .]/, l);
  }
  assert.match(legalBody('regulamin', 'pl'), /obowiązuje od 24 października 2026 r\. Historia zmian: 24 października 2026 r\. – CV bez konkretnego ogłoszenia/);
});

test('API: /api/prof-reqs; zamówienie CV pod zawód tylko jako jedno CV bez listu; rodzaj zapisany w zamówieniu', { timeout: 60_000 }, async () => {
  const port = 5300 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-prof-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const r = await (await fetch(`${U}/api/prof-reqs?q=magazynier`)).json();
    assert.equal(r.slug, 'magazynier'); assert.ok(r.reqs.length >= 8);
    const ad = { kind: 'profession', title: r.name, text: profAdText(r) };
    const order = (extra) => fetch(U + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ...extra }) }).then(async (x) => ({ status: x.status, j: await x.json() }));
    for (const bad of [{ pkg: 'cv_letter', ads: [ad] }, { pkg: 'pack3', ads: [ad, { title: 'Magazynier', text: 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność.' }] }]) {
      const b = await order(bad); assert.equal(b.status, 400); assert.match(b.j.error, /CV pod zawód \(bez ogłoszenia\) zamawiasz jako jedno CV bez listu/);
    }
    const ok = await order({ pkg: 'cv', ads: [ad] });
    assert.equal(ok.status, 200, JSON.stringify(ok.j));
    await wait(300);
    const all = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8')), o = all[ok.j.id] || Object.values(all).find((x) => x.id === ok.j.id);
    assert.equal(o.ads[0].kind, 'profession'); assert.equal(o.pkg, 'cv'); assert.equal(o.total, 3900);
    // zwykłe ogłoszenie bez pola kind dalej działa i nie dostaje rodzaju
    const n = await order({ pkg: 'cv_letter', ads: [{ title: 'Magazynier', text: 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność.' }] });
    assert.equal(n.status, 200);
  } finally { srv.kill(); }
});

test('Panel i raport sprzedaży rozróżniają CV pod zawód; kreator mówi, że CV nie jest pod konkretnego pracodawcę', async () => {
  const app = read('public/app.js'), adm = read('public/admin.js');
  assert.match(app, /To CV nie jest dopasowane do konkretnego pracodawcy – gdy znajdziesz ogłoszenie, zamów CV pod ofertę\./);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['To CV nie jest dopasowane do konkretnego pracodawcy – gdy znajdziesz ogłoszenie, zamów CV pod ofertę.'], l);
  assert.match(read('lib/admin.js'), /prof: \(o\.ads \|\| \[\]\)\.some\(\(a\) => a\.kind === 'profession'\)/);
  assert.match(adm, /o\.prof \? el\('span', \{ className: 'tag', textContent: 'pod zawód'/);
  const ops = read('lib/ops.js');
  assert.match(ops, /prof: \(o\.ads \|\| \[\]\)\.some\(\(a\) => a\.kind === 'profession'\)/); assert.match(ops, /s\.prof \? 'cv_prof' : s\.pkg/);
});

test('Strona główna: wysoko w hero informacja o zwykłym CV bez ogłoszenia, otwiera kreator w trybie „Bez ogłoszenia” (4 języki)', () => {
  const h = read('public/index.html'), hero = h.slice(h.indexOf('<section class="hero"'), h.indexOf('</section>', h.indexOf('<section class="hero"')));
  assert.match(hero, /<p class="hero-noad">Nie masz jeszcze ogłoszenia\? <a href="\/\?zamow=1&amp;pkg=cv&amp;tryb=zawod" data-open data-pkg="cv" data-prof>Zrób zwykłe CV pod swój zawód – 39 zł<\/a><\/p>/);
  const app = read('public/app.js');
  assert.match(app, /if \('prof' in b\.dataset\) profStart\(\);/);
  assert.match(app, /if \(q\.get\('tryb'\) === 'zawod' && !q\.get\('zawod'\)\) profStart\(\);/);
  assert.match(app, /function profStart\(\) \{[\s\S]*?setMode\(first, 'prof'\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Zrób zwykłe CV pod swój zawód – 39 zł'], l);
});
