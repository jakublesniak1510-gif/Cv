import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-seo-report-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const express = (await import('express')).default;
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = { client_email: 'raport@proj.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), token_uri: 'https://oauth2.example/token' };
const gsc = await import('../lib/gsc.js');
const rep = await import('../lib/seo-report.js');
const an = await import('../lib/analytics.js');
const BASE = 'https://example.test';
// Poniedziałek 20.10.2025, 7:00 czasu polskiego (5:00 UTC).
const MON = Date.UTC(2025, 9, 20, 5, 0);

function fakeGoogle(calls) {
  return async (url, o = {}) => {
    calls.push({ url, body: o.body });
    const json = (j) => ({ ok: true, status: 200, json: async () => j, text: async () => '' });
    if (url === SA.token_uri) return json({ access_token: 'tok', expires_in: 3600 });
    if (url.endsWith('/sitemap.xml')) return { ok: true, text: async () => Array.from({ length: 100 }, (_, i) => `<url><loc>${BASE}/p${i}</loc></url>`).join('') };
    if (url.includes('urlInspection')) { const u = JSON.parse(o.body).inspectionUrl; return json({ inspectionResult: { indexStatusResult: { coverageState: /p1\d$/.test(u) ? 'Crawled - currently not indexed' : u.endsWith('/p42') ? 'Duplicate, Google chose different canonical than user' : 'Submitted and indexed', verdict: 'PASS', userCanonical: u, googleCanonical: u.endsWith('/p42') ? `${BASE}/p7` : u } } }); }
    const b = JSON.parse(o.body), prev = b.startDate < '2025-09-01';
    if (!b.dimensions.length) return json({ rows: [{ clicks: prev ? 50 : 80, impressions: prev ? 2000 : 3000, ctr: prev ? 0.025 : 0.0267, position: prev ? 21.3 : 18.4 }] });
    if (b.dimensions[0] === 'query') return json({ rows: [
      { keys: ['wzór cv'], clicks: 30, impressions: 900, ctr: 0.033, position: 6.2 },
      { keys: ['cv kasjer'], clicks: 3, impressions: 120, ctr: 0.025, position: 11.4 },
      { keys: ['list motywacyjny magazynier'], clicks: 0, impressions: 15, ctr: 0, position: 12 },
      { keys: ['cv kucharz'], clicks: prev ? 2 : 1, impressions: 40, ctr: 0.025, position: 19.9 },
    ] });
    return json({ rows: [
      { keys: [`${BASE}/`], clicks: 40, impressions: 1000, ctr: 0.04, position: 9 },
      { keys: [`${BASE}/cv/kasjer`], clicks: 10, impressions: 400, ctr: 0.025, position: 12 },
      { keys: [`${BASE}/cv/kasjer/warszawa`], clicks: 0, impressions: 300, ctr: 0, position: 25 },
      { keys: [`${BASE}/en/cv/cashier`], clicks: 2, impressions: 50, ctr: 0.04, position: 15 },
      { keys: [`${BASE}/poradnik/wzor-cv-2026`], clicks: 0, impressions: 80, ctr: 0, position: 30 },
      { keys: [`${BASE}/uk/instrumenty/skaner`], clicks: 1, impressions: 20, ctr: 0.05, position: 8 },
      { keys: [`${BASE}/cv/fotograf`], clicks: 0, impressions: 70, ctr: 0, position: 7.4 },
    ] });
  };
}

test('GSC: JWT RS256 dla konta serwisowego (podpis weryfikowalny kluczem publicznym)', () => {
  const jwt = gsc.signJwt(SA, MON), [h, c, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'RS256', typ: 'JWT' });
  const claim = JSON.parse(Buffer.from(c, 'base64url'));
  assert.equal(claim.iss, SA.client_email); assert.equal(claim.aud, SA.token_uri); assert.match(claim.scope, /webmasters\.readonly/); assert.equal(claim.exp - claim.iat, 3600);
  assert.ok(crypto.createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s, 'base64url')));
});

test('Typy i języki stron z adresu', () => {
  assert.deepEqual(rep.classify(`${BASE}/`), { lang: 'pl', type: 'strona główna' });
  assert.deepEqual(rep.classify(`${BASE}/cv/kasjer`), { lang: 'pl', type: 'zawód' });
  assert.deepEqual(rep.classify(`${BASE}/cv/kasjer/warszawa`), { lang: 'pl', type: 'zawód + miasto' });
  assert.deepEqual(rep.classify(`${BASE}/uk/rezyume/kasyr/kyiv`), { lang: 'uk', type: 'zawód + miasto' });
  assert.deepEqual(rep.classify(`${BASE}/de/ratgeber/x`), { lang: 'de', type: 'poradnik' });
  assert.deepEqual(rep.classify(`${BASE}/en/tools/scanner`), { lang: 'en', type: 'narzędzia' });
  assert.deepEqual(rep.classify(`${BASE}/wzor-cv/kasjer`), { lang: 'pl', type: 'wzory' });
});

test('Termin: poniedziałek od 6:30 czasu polskiego, identyfikator tygodnia = poniedziałek', () => {
  assert.equal(rep.dueNow(Date.UTC(2025, 9, 20, 4, 29)), false, '6:29');
  assert.equal(rep.dueNow(Date.UTC(2025, 9, 20, 4, 30)), true, '6:30');
  assert.equal(rep.dueNow(Date.UTC(2025, 9, 21, 5)), false, 'wtorek');
  assert.equal(rep.weekId(Date.UTC(2025, 9, 23, 12)), '2025-10-20'); assert.equal(rep.weekId(MON), '2025-10-20');
  assert.equal(rep.weekId(Date.UTC(2025, 9, 26, 21)), '2025-10-20', 'niedziela 23:00 PL');
});

test('Lejek: etapy raz na osobę, język, źródło; raport tekstowy', async () => {
  const app = express(); app.set('trust proxy', true); an.analyticsRoutes(app, BASE); app.post('/zamowienie', (req, res) => res.json(an.visitInfo(req)));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const send = (ip, b) => fetch(`${U}/api/t`, { method: 'POST', headers: { 'X-Forwarded-For': ip, 'User-Agent': 'Mozilla/5.0 Test' }, body: JSON.stringify(b) });
  try {
    // źródło i język z pierwszego wejścia; kolejne zdarzenia (np. po powrocie z płatności, bez referrera) dziedziczą je po stronie serwera
    for (const b of [{ e: 'pv', r: 'https://www.google.com/', l: 'pl' }, { e: 'pv', r: 'https://checkout.stripe.com/' }, { e: 'start' }, { e: 'step', s: 6 }, { e: 'checkout' }, { e: 'checkout' }, { e: 'paid', o: 'zam1' }]) await send('1.1.1.1', b);
    // „Opłacone” liczy serwer przy płatności: źródło zapisane w zamówieniu przy jego tworzeniu; zdarzenie „paid” z przeglądarki jest ignorowane
    const visit = await (await fetch(`${U}/zamowienie`, { method: 'POST', headers: { 'X-Forwarded-For': '1.1.1.1', 'User-Agent': 'Mozilla/5.0 Test' } })).json();
    assert.deepEqual(visit, { src: 'google', lang: 'pl' });
    await an.funnelPaid({ visit });
    for (const b of [{ e: 'pv', u: 'tiktok', l: 'uk' }, { e: 'start', l: 'pl' }, { e: 'step', s: 3 }]) await send('2.2.2.2', b);
    await send('3.3.3.3', { e: 'pv', l: 'de' });
    await send('4.4.4.4', { e: 'pv', src: 'google', r: 'https://l.instagram.com/', l: 'xx' });
    await new Promise((r) => setTimeout(r, 300));
    const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }), f = await an.funnelRange(day, day);
    assert.deepEqual(f.stages.map((s) => s.n), [4, 2, 1, 1, 1]);
    assert.deepEqual(f.stages[0].src, { google: 1, tiktok: 1, direct: 1, instagram: 1 }, 'źródło liczy serwer z adresu odsyłającego, nie z treści zdarzenia');
    assert.deepEqual(f.stages[4].src, { google: 1 }, 'opłacenie przypisane do źródła pierwszego wejścia');
    await an.funnelPaid({});
    const f2 = await an.funnelRange(day, day); assert.equal(f2.stages[4].n, 2); assert.equal(f2.stages[4].src.inne, 1, 'zamówienie bez źródła → „inne”');
    assert.deepEqual(f.stages[1].lang, { pl: 1, uk: 1 }, 'język z pierwszego wejścia');
    assert.deepEqual(f.stages[0].lang, { pl: 2, uk: 1, de: 1 });
    assert.equal(f.stages[1].rate, 50); assert.equal(f.stages[4].rate, 100);
    assert.equal(an.sourceOf('m.facebook.com', ''), 'facebook'); assert.equal(an.sourceOf('', 'fb'), 'facebook'); assert.equal(an.sourceOf('youtube.com', ''), 'youtube'); assert.equal(an.sourceOf('bing.com', ''), 'inne'); assert.equal(an.sourceOf('', ''), 'direct');
    assert.equal(an.sourceOf('l.facebook.com', 'share'), 'share', 'link z karty wyniku (utm_source=share) ma własne źródło'); assert.ok(an.SOURCES.includes('share'));
    const t = an.funnelText(f);
    assert.match(t, /Wejścia: 4 → Start kreatora: 2 \(50%\) → Ostatni krok: 1 \(50%\) → Płatność rozpoczęta: 1 \(100%\) → Opłacone: 1 \(100%\)/);
    assert.match(t, /tiktok: 1 → 1 → 0 → 0 → 0/);
  } finally { srv.close(); }
});

test('Raport tygodniowy: Search Console, próbka indeksowania, zapis, e-mail raz na tydzień, link tylko do odczytu', async () => {
  delete process.env.GSC_SA_JSON;
  let r = await rep.buildReport(BASE, { now: MON, fetchFn: fakeGoogle([]) });
  assert.match(r.gscError, /nie jest skonfigurowane/); assert.equal(r.gsc, null); assert.ok(r.funnel.stages.length === 5);
  Object.assign(process.env, { GSC_SA_JSON: JSON.stringify(SA), GSC_SITE: 'sc-domain:example.test' });
  gsc.resetGscToken();
  const calls = [];
  r = await rep.seoWeekly(BASE, { now: MON, fetchFn: fakeGoogle(calls) });
  const g = r.gsc;
  assert.deepEqual(g.period, { start: '2025-09-20', end: '2025-10-17', prevStart: '2025-08-23', prevEnd: '2025-09-19' });
  assert.deepEqual(g.totals.cur, { clicks: 80, impressions: 3000, ctr: 2.7, position: 18.4 });
  assert.equal(g.totals.prev.clicks, 50);
  assert.deepEqual(g.queries.map((q) => q.key), ['wzór cv', 'cv kasjer', 'cv kucharz', 'list motywacyjny magazynier']);
  assert.deepEqual(g.nearFirstPage.map((q) => q.key), ['cv kasjer', 'cv kucharz'], 'poz. 8–20 i co najmniej 20 wyświetleń');
  assert.equal(g.queries.find((q) => q.key === 'cv kucharz').prevClicks, 2);
  assert.deepEqual(g.zeroClickPages.map((p) => p.key.replace(BASE, '')), ['/cv/kasjer/warszawa', '/poradnik/wzor-cv-2026', '/cv/fotograf']);
  assert.deepEqual(g.fixTitles.map((p) => p.key.replace(BASE, '')), ['/cv/fotograf'], 'pozycja 3–20 i CTR 0% (poz. 25 i 30 – nie)');
  assert.deepEqual(g.byType.map((x) => x.key), ['strona główna', 'zawód', 'zawód + miasto', 'poradnik', 'narzędzia']);
  assert.deepEqual(Object.fromEntries(g.byLang.map((x) => [x.key, x.clicks])), { pl: 50, en: 2, uk: 1 });
  assert.equal(g.inspection.sample, 40); assert.equal(Object.values(g.inspection.states).reduce((a, b) => a + b, 0), 40);
  const sampled = calls.filter((c) => c.url.includes('urlInspection')).map((c) => JSON.parse(c.body).inspectionUrl);
  assert.equal(new Set(sampled).size, 40);
  assert.ok(calls.filter((c) => c.url.includes('urlInspection')).every((c) => JSON.parse(c.body).siteUrl === 'sc-domain:example.test'));
  // rotacja: tydzień później inna próbka
  const next = []; await rep.buildReport(BASE, { now: MON + 7 * 864e5, fetchFn: fakeGoogle(next) });
  const sampled2 = next.filter((c) => c.url.includes('urlInspection')).map((c) => JSON.parse(c.body).inspectionUrl);
  assert.notDeepEqual(sampled2, sampled);
  // raz na tydzień: drugi przebieg w ten sam poniedziałek nic nie robi, wtorek też nie
  assert.equal(await rep.seoWeekly(BASE, { now: MON + 3600e3, fetchFn: fakeGoogle([]) }), null);
  assert.equal(await rep.seoWeekly(BASE, { now: MON + 864e5, fetchFn: fakeGoogle([]) }), null);
  assert.ok(await rep.seoReports.get('2025-10-20'));
  const txt = rep.reportText(r, BASE, 'L');
  assert.match(txt, /kliknięcia 80 \(\+60%\)/); assert.match(txt, /Pozycja 3–20, CTR 0% – do poprawy tytułu \(1\):\n- \/cv\/fotograf: poz\. 7\.4, 70 wyśw\./);
  if (sampled.includes(`${BASE}/p42`)) assert.match(txt, /Google wybrał inną stronę główną niż nasza:\n- https:\/\/example\.test\/p42 → https:\/\/example\.test\/p7/);
  assert.ok(r.gsc.inspection.rows.every((x) => 'googleCanonical' in x)); assert.match(txt, /Blisko pierwszej strony[\s\S]*cv kasjer: poz\. 11\.4/); assert.match(txt, /Indeksowanie \(próbka 40/);
  // przechowujemy 12 ostatnich tygodni
  for (let i = 1; i <= 13; i++) await rep.seoReports.save({ ...r, id: `2024-01-${String(i).padStart(2, '0')}` });
  await rep.seoWeekly(BASE, { now: MON, force: true, fetchFn: fakeGoogle([]), mail: false });
  assert.equal(Object.keys(await rep.seoReports.all()).length, 12);

  // link tylko do odczytu
  const app = express(); rep.seoReportRoutes(app); app.use((_q, s) => s.status(404).send('nie ma'));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    process.env.SEO_REPORT_TOKEN = 'krotki';
    assert.equal((await fetch(`${U}/raport-seo/krotki`)).status, 404, 'token krótszy niż 32 znaki = wyłączone');
    const T = 'a'.repeat(40); process.env.SEO_REPORT_TOKEN = T;
    assert.equal((await fetch(`${U}/raport-seo/${'b'.repeat(40)}`)).status, 404);
    assert.equal((await fetch(`${U}/raport-seo/${T.slice(1)}`)).status, 404);
    const h = await fetch(`${U}/raport-seo/${T}`);
    assert.equal(h.status, 200); assert.equal(h.headers.get('x-robots-tag'), 'noindex, nofollow'); assert.equal(h.headers.get('cache-control'), 'no-store');
    const html = await h.text(); assert.match(html, /<h2>Pozycja 3–20, CTR 0% – do poprawy tytułów<\/h2>/); assert.match(html, /<meta name="robots" content="noindex,nofollow">/); assert.match(html, /Blisko pierwszej strony/); assert.match(html, /Lejek sprzedaży/);
    const j = await (await fetch(`${U}/raport-seo/${T}?format=json`)).json();
    assert.equal(j.id, '2025-10-20'); assert.equal(j.gsc.totals.cur.clicks, 80);
    assert.equal(rep.reportLink(BASE), `${BASE}/raport-seo/${T}`);
  } finally { srv.close(); delete process.env.SEO_REPORT_TOKEN; }
});

test('Panel → SEO: ręczne generowanie w tle, raz na godzinę, błąd Search Console widoczny', async () => {
  let t = MON, done; const gate = new Promise((r) => { done = r; });
  const app = express(), api = express.Router(); app.use(express.json()); rep.seoAdmin(api, { BASE_URL: BASE, now: () => t, run: async () => { await gate; return { gscError: 'Search Console: User does not have sufficient permission' }; } }); app.use('/api/admin', api);
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}/api/admin`;
  const post = () => fetch(`${U}/seo/run`, { method: 'POST' }), get = async () => (await fetch(`${U}/seo`)).json();
  try {
    assert.deepEqual(await (await post()).json(), { ok: true, started: true });
    assert.equal((await get()).manual.running, true);
    assert.deepEqual(await (await post()).json(), { ok: true, running: true }, 'drugie kliknięcie w trakcie nic nie uruchamia');
    done(); await new Promise((r) => setTimeout(r, 20));
    const d = await get(); assert.equal(d.manual.running, false); assert.match(d.manual.error, /sufficient permission/);
    t += 30 * 60e3; const r = await post(); assert.equal(r.status, 429); assert.match((await r.json()).error, /raz na godzinę.*30 min/);
    t += 31 * 60e3; assert.equal((await (await post()).json()).started, true, 'po godzinie znowu można');
  } finally { srv.close(); }
});

test('CTR po zmianie tytułów: tyle samo dni przed i po ostatniej zmianie, grupy zapytań, sekcja w e-mailu i raporcie', async () => {
  const ch = rep.titleChanges();
  assert.ok(ch.length && ch.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.pages.length), 'seo-data/title-changes.json');
  const calls = [];
  const q = async (dims, s, e) => {
    calls.push([s, e]); const after = s >= '2026-10-24';
    return [
      { keys: ['cvpodogloszenie.pl'], clicks: after ? 9 : 5, impressions: 20, position: 1.2 },
      { keys: ['CV pod ogłoszenie'], clicks: after ? 4 : 2, impressions: 100, position: 6 },
      { keys: ['jak dopasować cv do ogłoszenia'], clicks: 1, impressions: 50, position: 9 },
      { keys: ['skaner cv za darmo'], clicks: after ? 3 : 1, impressions: 60, position: 7 },
      { keys: ['wzór cv'], clicks: 30, impressions: 900, position: 6 },
    ];
  };
  const changes = [{ date: '2026-09-01', pages: ['/'] }, { date: '2026-10-23', note: 'tytuły', pages: ['/'], variantB: { title: 'Wariant B', consider: '2026-11-20', status: 'do rozważenia – nie wdrożone' } }];
  assert.equal(await rep.titleCtr('2026-08-30', q, changes), null, 'przed pierwszą zmianą: brak sekcji');
  const early = await rep.titleCtr('2026-10-23', q, changes);
  assert.equal(early.days, 0); assert.match(rep.ctrText(early), /za mało danych[\s\S]*\nWariant B do rozważenia \(od 2026-11-20\): „Wariant B” – do rozważenia – nie wdrożone\./);
  assert.equal(rep.titleChanges().at(-1).variantB.title, 'Dopasuj CV do ogłoszenia – darmowy skaner CV i list motywacyjny');
  const t = await rep.titleCtr('2026-10-30', q, changes);
  assert.equal(t.change, '2026-10-23'); assert.equal(t.days, 7);
  assert.deepEqual([t.before, t.after], [{ start: '2026-10-16', end: '2026-10-22' }, { start: '2026-10-24', end: '2026-10-30' }]);
  assert.deepEqual(calls.slice(-2), [['2026-10-16', '2026-10-22'], ['2026-10-24', '2026-10-30']]);
  const g = Object.fromEntries(t.groups.map((x) => [x.key, x]));
  assert.deepEqual(Object.keys(g), ['marka', 'cv-pod-ogloszenie', 'dopasuj-cv', 'skaner-cv']);
  assert.deepEqual([g.marka.before.clicks, g.marka.after.clicks, g.marka.after.ctr], [5, 9, 45]);
  assert.deepEqual([g['cv-pod-ogloszenie'].before.impressions, g['cv-pod-ogloszenie'].after.ctr], [100, 4], 'wielkość liter i polskie znaki bez znaczenia; sama domena tylko w „marce”');
  assert.equal(g['dopasuj-cv'].after.impressions, 50); assert.equal(g['skaner-cv'].after.clicks, 3);
  assert.equal((await rep.titleCtr('2027-03-01', q, changes)).days, 28, 'najwyżej 28 dni');
  const txt = rep.ctrText(t);
  assert.match(txt, /CTR po zmianie tytułów \(zmiana 2026-10-23; 7 dni przed vs 7 dni po\)/); assert.match(txt, /Marka \(cvpodogloszenie\): CTR 25% → 45%, kliknięcia 5 → 9/);
  const html = rep.reportHtml({ id: '2026-11-02', created: Date.now(), funnel: { stages: [], from: '', to: '' }, gsc: { period: { start: 'a', end: 'b' }, totals: { cur: {}, prev: {} }, queries: [], nearFirstPage: [], pages: [], zeroClickPages: [], byLang: [], byType: [], inspection: { sample: 0, states: {}, rows: [] }, titleCtr: t } });
  assert.match(html, /<h2>CTR po zmianie tytułów<\/h2><p>Zmiana 2026-10-23 \(tytuły\): 7 dni przed/); assert.match(html, /<td>„skaner cv”<\/td><td>1\.7<\/td><td>5<\/td>/);
  assert.match(html, /<p>Wariant B do rozważenia \(od 2026-11-20\)/);
  const adm = fs.readFileSync(new URL('../public/admin.js', import.meta.url), 'utf8');
  assert.match(adm, /\$\('#seoCtr'\)\.replaceChildren/); assert.match(adm, /\$\('#seoFix'\)\.replaceChildren\(simpleTable\(g\?\.fixTitles/); assert.match(adm, /Wariant B do rozważenia/);
});
