import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-outcomes-'));
Object.assign(process.env, { SMTP_URL: 'json' });
const express = (await import('express')).default;
const oc = await import('../lib/outcomes.js');
const { sendOutcomeAsk } = await import('../lib/mail.js');
const BASE = 'https://example.test', D = 864e5;
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const serve = async (fn) => {
  const app = express(); oc.outcomeRoutes(app, { BASE_URL: BASE });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try { await fn(U); } finally { srv.close(); }
};
const form = (U, p, body) => fetch(U + p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });

test('Ankieta: GET tylko pokazuje formularz, zapis dopiero POST-em; liczba zaproszeń tylko przy „tak”; wypis usuwa wpis', async () => {
  const r = await oc.startOutcome({ id: 'o1', pkg: 'standard', uiLang: 'pl', profile: { email: 'k@x.test' } });
  assert.equal(r.email, undefined, 'bez e-maila w magazynie ankiet');
  assert.deepEqual(Object.keys(r).sort(), ['answer', 'answeredAt', 'id', 'invites', 'lang', 'orderId', 'pkg', 'sentAt', 'token'].sort());
  const L = oc.outcomeLinks(BASE, r);
  await serve(async (U) => {
    const g = await (await fetch(U + new URL(L.yes).pathname + new URL(L.yes).search)).text();
    assert.match(g, /value="yes" checked/); assert.match(g, /name="invites"/); assert.match(g, /noindex/);
    assert.equal((await oc.outcomes.get(r.id)).answer, null, 'samo otwarcie linku (np. skaner poczty) nie zapisuje odpowiedzi');
    await form(U, `/wyniki/odpowiedz?t=${r.token}`, { a: 'not_yet', invites: '3' });
    let x = await oc.outcomes.get(r.id); assert.equal(x.answer, 'not_yet'); assert.equal(x.invites, null);
    await form(U, `/wyniki/odpowiedz?t=${r.token}`, { a: 'yes', invites: '2' });
    x = await oc.outcomes.get(r.id); assert.equal(x.answer, 'yes'); assert.equal(x.invites, 2); assert.ok(x.answeredAt);
    assert.match(await (await form(U, `/wyniki/odpowiedz?t=${r.token}`, { a: 'zle' })).text(), /Link nieaktualny/);
    assert.match(await (await fetch(`${U}/wyniki/odpowiedz?t=xxxxxxxxxxxxxxxxxxxxxxxxxxxx&a=yes`)).text(), /Link nieaktualny/);
    // wypis: GET pyta, POST usuwa pytanie i odpowiedź
    await fetch(`${U}/wyniki/wypisz?t=${r.token}`); assert.ok(await oc.outcomes.get(r.id));
    assert.match(await (await form(U, `/wyniki/wypisz?t=${r.token}`, {})).text(), /Usunęliśmy pytanie i odpowiedź/);
    assert.equal(await oc.outcomes.get(r.id), null);
    // strona odpowiedzi w języku klienta
    const u = await oc.startOutcome({ id: 'o2', pkg: 'start', uiLang: 'uk' });
    assert.match(await (await fetch(`${U}/wyniki/odpowiedz?t=${u.token}&a=not_applied`)).text(), /Я ще не надсилав\(-ла\) резюме/);
    await oc.outcomes.remove(u.id);
  });
});

test('Anonimizacja po 30 dniach od pytania: bez numeru zamówienia i tokenu, link przestaje działać', async () => {
  const r = await oc.startOutcome({ id: 'o3', pkg: 'standard', uiLang: 'de' });
  await oc.outcomes.update(r.id, { answer: 'yes', answeredAt: Date.now(), invites: 1 });
  assert.equal(await oc.anonymizeOutcomes(Date.now() + 29 * D), 0);
  assert.equal(await oc.anonymizeOutcomes(Date.now() + 30 * D + 1000), 1);
  const a = await oc.outcomes.get(r.id);
  assert.equal(a.orderId, undefined); assert.equal(a.token, undefined); assert.equal(a.sentAt, undefined); assert.equal(a.answeredAt, undefined);
  assert.equal(a.answer, 'yes'); assert.equal(a.pkg, 'standard'); assert.equal(a.lang, 'de'); assert.match(a.answerDay, /^\d{4}-\d{2}-\d{2}$/);
  await serve(async (U) => assert.match(await (await fetch(`${U}/wyniki/odpowiedz?t=${r.token}&a=yes`)).text(), /Link nieaktualny/));
  await oc.outcomes.remove(r.id);
});

test('Statystyka: „tak” wśród tych, którzy aplikowali; na stronie dopiero od OUTCOMES_MIN, w ustalonym brzmieniu', async () => {
  const rec = (answer, day) => ({ answer, answerDay: answer ? day : null, pkg: 'standard', lang: 'pl', sentDay: day });
  const list = [rec('yes', '2026-09-01'), rec('yes', '2026-09-20'), rec('not_yet', '2026-09-10'), rec('not_applied', '2026-08-01'), rec(null, '2026-09-02')];
  const s = oc.outcomeStats(list);
  assert.deepEqual([s.sent, s.answered, s.yes, s.notYet, s.notApplied, s.applied, s.pctYes, s.from, s.to], [5, 4, 2, 1, 1, 3, 67, '2026-09-01', '2026-09-20']);
  for (const [i, x] of list.entries()) await oc.outcomes.save({ id: `s${i}`, anon: true, ...x });
  assert.equal(await oc.publicOutcome({}), null, 'domyślny próg 50');
  assert.equal(await oc.publicOutcome({ OUTCOMES_MIN: '4' }), null, '3 osoby, które aplikowały, to za mało');
  const p = await oc.publicOutcome({ OUTCOMES_MIN: '3' });
  assert.deepEqual(p, { pct: 67, n: 3, from: '01.09.2026', to: '20.09.2026' });
  assert.equal(oc.outcomeSentence(p), '67% klientów, którzy odpowiedzieli na naszą ankietę i wysłali CV, dostało co najmniej jedno zaproszenie na rozmowę (n=3, okres 01.09.2026–20.09.2026).');
  await serve(async (U) => {
    const h = await (await fetch(`${U}/jak-liczymy`)).text();
    assert.match(h, /<meta name="robots" content="noindex">/, 'bez wyniku strona metodologii nie jest indeksowana');
    assert.match(h, /Do tego czasu nie pokazujemy żadnych liczb/); assert.match(h, /samodzielne deklaracje/); assert.match(h, /nie jest gwarancją/); assert.match(h, /dobrowolna/);
    assert.doesNotMatch(h, /67%/);
  });
  for (const i of list.keys()) await oc.outcomes.remove(`s${i}`);
});

test('E-mail ankiety: 3 przyciski, wypis (także List-Unsubscribe), bez obietnic', async () => {
  const r = await oc.startOutcome({ id: 'o4', pkg: 'standard', uiLang: 'en' });
  const L = oc.outcomeLinks(BASE, r), m = JSON.parse((await sendOutcomeAsk('k@x.test', oc.OT.en, L)).message);
  for (const k of ['yes', 'not_yet', 'not_applied', 'unsub']) assert.ok(m.html.includes(L[k].replace(/&/g, '&amp;')) && m.text.includes(L[k]), k);
  assert.match(m.subject, /interview/); assert.equal(m.list.unsubscribe.url, L.unsub); assert.equal(m.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  for (const l of Object.keys(oc.OT)) { assert.deepEqual(Object.keys(oc.OT[l]).sort(), Object.keys(oc.OT.pl).sort(), l); assert.doesNotMatch(JSON.stringify(oc.OT[l]), /gwarant|guarant|garant/i); }
  await oc.outcomes.remove(r.id);
});

test('Zgoda w zamówieniu: osobna, odznaczona, z zapisem treści i czasu; wysyłka po 14 dniach; polityka prywatności w 4 językach', () => {
  const html = read('public/index.html'), srv = read('server.js'), app = read('public/app.js');
  const box = html.match(/<input type="checkbox" id="outcomeAsk"[^>]*>/)?.[0];
  assert.ok(box && !/checked/.test(box), 'pole jest domyślnie odznaczone');
  assert.ok(html.includes(oc.OUTCOME_CONSENT), 'treść zgody w formularzu = zapisywana treść');
  assert.match(app, /outcomeAsk: \$\('#outcomeAsk'\)\.checked/);
  assert.match(srv, /outcomeAsk === true \? \{ consent: true, text: OUTCOME_CONSENT, at: Date\.now\(\), sent: false \}/);
  assert.match(srv, /Date\.now\(\) - o\.created < OUTCOME_AFTER/); assert.equal(oc.OUTCOME_AFTER, 14 * D); assert.equal(oc.ANON_AFTER, 30 * D);
  assert.match(srv, /anonymizeOutcomes\(\)/); assert.match(srv, /outcome: await publicOutcome\(\)/);
  const pp = read('public/legal/prywatnosc.html');
  for (const t of ['ankieta „Wyniki klientów”', 'Umfrage „Ergebnisse unserer Kunden“', '“Customer results” survey', 'опитування «Результати клієнтів»']) assert.ok(pp.includes(t), t);
  // Każda zmiana polityki: nowa data obowiązywania i wpis w historii zmian, w każdym języku.
  for (const t of ['<h2>13. Historia zmian</h2>', '<h2>13. Änderungshistorie</h2>', '<h2>13. Change history</h2>', '<h2>13. Історія змін</h2>', '21 października 2026 r. – dodano jednorazową ankietę', '21. Oktober 2026 – einmalige Umfrage', '21 October 2026 – added the one-time', '21 жовтня 2026 р. – додано одноразове']) assert.ok(pp.includes(t), t);
  for (const l of ['en', 'uk', 'de']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of [oc.OUTCOME_CONSENT, 'Jak liczymy', '{0}% klientów, którzy odpowiedzieli na naszą ankietę i wysłali CV, dostało co najmniej jedno zaproszenie na rozmowę (n={1}, okres {2}–{3}).']) assert.ok(d[k], `${l}: ${k}`);
  }
  assert.match(read('public/admin.html'), /data-view="outcomes"/); assert.match(read('lib/admin.js'), /api\.get\('\/outcomes'/);
});
