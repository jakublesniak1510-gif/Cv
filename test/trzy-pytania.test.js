import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.SMTP_URL = 'json'; process.env.ANTHROPIC_API_KEY = '';
const { generateFreeQs } = await import('../lib/generate.js');
const { sendOrderMail } = await import('../lib/mail.js');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cv = { name: 'Jan Test', headline: '', contact: [], summary: '', experience: [], education: [], skills: [] };
const qs = [{ q: 'Pytanie A?', why: 'Doświadczenie.' }, { q: 'Pytanie B?', why: 'Postawę.' }, { q: 'Pytanie C?', why: 'Braki.' }];
const order = (x = {}) => ({ id: 'abc', pkg: 'cv_letter', addons: {}, profile: { name: 'Jan Test', email: 'j@x.pl' }, results: [{ position: 'Kasjer', lang: 'pl', letter: 'x', cv, freeQs: qs }], ads: [{}], uiLang: 'pl', ...x });
const mail = async (o) => JSON.parse((await sendOrderMail(o, 'https://x.pl')).message);

// PR R: 3 pytania rekrutacyjne za darmo w mailu z CV; link do pełnego przygotowania (50 zł) najwyżej raz.
test('Bez AI: 3 pytania z „po co”, bez odpowiedzi', async () => {
  const r = await generateFreeQs({ profile: { name: 'Jan', experience: [{ title: 'Magazynier', company: 'ABC', period: '2020', bullets: ['inwentaryzacja'] }] }, ad: { title: 'Magazynier', text: 'Wymagania: obsługa wózka widłowego, uprawnienia UDT, WMS.' }, result: { lang: 'pl' } });
  assert.equal(r.length, 3); for (const x of r) { assert.ok(x.q && x.why); assert.deepEqual(Object.keys(x), ['q', 'why']); }
});

test('Mail: CV z listem – blok zastępuje propozycję przygotowania; samo CV – propozycja listu + link tekstowy; z dodatkiem/karnetem – brak bloku', async () => {
  const a = await mail(order());
  assert.match(a.text, /TRZY PYTANIA, KTÓRE MOGĄ PAŚĆ NA ROZMOWIE\n1\. Pytanie A\?\n   Rekruter sprawdza: Doświadczenie\./);
  assert.equal(a.text.match(/– 50 zł/g).length, 1, 'link do przygotowania raz'); assert.doesNotMatch(a.text, /Przygotowanie do rozmowy pod to ogłoszenie – 50 zł\. Dokupisz/);
  assert.match(a.html, /<b>Trzy pytania, które mogą paść na rozmowie<\/b>/);
  const b = await mail(order({ pkg: 'cv', results: [{ position: 'Kasjer', lang: 'pl', letter: '', cv, freeQs: qs }] }));
  assert.match(b.text, /Dodaj list motywacyjny pod to samo ogłoszenie – 10 zł/); assert.match(b.text, /Pełne przygotowanie do rozmowy pod to ogłoszenie \(12 pytań[^)]*\) – 50 zł: https:\/\/x\.pl\/\?id=abc#upsell/);
  assert.ok(b.text.indexOf('Dodaj list') < b.text.indexOf('TRZY PYTANIA'), 'główna propozycja nad blokiem');
  for (const o of [order({ addons: { interview: true } }), order({ pass: { id: 'p' } }), order({ results: [{ position: 'Kasjer', lang: 'pl', letter: 'x', cv }] })]) assert.doesNotMatch((await mail(o)).text, /TRZY PYTANIA/);
  assert.match((await mail(order({ uiLang: 'en' }))).text, /THREE QUESTIONS YOU MAY BE ASKED AT THE INTERVIEW\n1\. Pytanie A\?\n   The recruiter is checking:/);
});

test('Serwer: pytania zapisane w zamówieniu tylko przy pierwszym ogłoszeniu i bez dodatku przygotowania', async () => {
  const port = 5300 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-qs-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = (t) => ({ title: t, text: `Szukamy: ${t}. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. `.repeat(2) });
    const make = async (pkg, addons) => {
      const o = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg, addons, consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: pkg === 'pack3' ? [ad('Magazynier'), ad('Kierowca')] : [ad('Magazynier')] }) })).json();
      await fetch(`${U}/api/orders/${o.id}/demo-pay`, { method: 'POST' });
      for (let i = 0; i < 40; i++) { const x = await (await fetch(`${U}/api/orders/${o.id}`)).json(); if (x.status === 'done') return x; await wait(200); }
    };
    const a = await make('pack3', {});
    assert.equal(a.results[0].freeQs.length, 3); assert.equal(a.results[1].freeQs, undefined);
    const b = await make('cv_letter', { interview: true });
    assert.equal(b.results[0].freeQs, undefined);
  } finally { srv.kill(); }
});
