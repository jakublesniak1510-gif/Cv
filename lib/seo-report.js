import crypto from 'node:crypto';
import fs from 'node:fs';
import { makeStore } from './store.js';
import { mailEnabled, sendOwnerMail } from './mail.js';
import { logEvent } from './events.js';
import { gscEnabled, gscSite, searchAnalytics, inspectUrl } from './gsc.js';
import { funnelRange, funnelText, SOURCES, analyticsDays, wizardFunnel } from './analytics.js';
import { abReport, abText } from './ab.js';

// Tygodniowy raport SEO (Search Console) i lejka: co poniedziałek od 6:30 (czas polski), raz na tydzień.
// Zapis w seo-reports.json (12 ostatnich tygodni), e-mail do właściciela, panel → SEO i prywatny link /raport-seo/<token>.
// Search Console nie zwraca danych osobowych; lejek to same liczby.
export const seoReports = makeStore('seo-reports.json');
const KEEP = 12, SAMPLE = 40, DAY = 864e5;
const tz = (d, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', ...o }).format(d);
export const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
// Identyfikator tygodnia = data poniedziałku (czas polski).
export const weekId = (t) => { const wd = (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(tz(t, { weekday: 'short' })) + 7) % 7; return dayKey(t - wd * DAY); };
export const dueNow = (t) => tz(t, { weekday: 'short' }) === 'Mon' && +tz(t, { hour: 'numeric', hourCycle: 'h23' }) * 60 + +tz(t, { minute: 'numeric' }) >= 6 * 60 + 30;

// Typ i język strony z adresu (PL bez prefiksu, /en, /uk, /de).
const SEG = { cv: 'zawód', rezyume: 'zawód', lebenslauf: 'zawód', poradnik: 'poradnik', guides: 'poradnik', porady: 'poradnik', ratgeber: 'poradnik', narzedzia: 'narzędzia', tools: 'narzędzia', instrumenty: 'narzędzia', 'wzor-cv': 'wzory', 'list-motywacyjny': 'wzory' };
export function classify(url) {
  let p; try { p = new URL(url).pathname; } catch { p = String(url || ''); }
  const parts = p.split('/').filter(Boolean), lang = ['en', 'uk', 'de'].includes(parts[0]) ? parts.shift() : 'pl';
  const t = SEG[parts[0]];
  const type = !parts.length ? 'strona główna' : t === 'zawód' ? (parts.length >= 3 ? 'zawód + miasto' : parts.length === 2 ? 'zawód' : 'lista zawodów') : t || 'inne';
  return { lang, type };
}

const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 1000) / 10;
const row = (x, prev) => ({ key: x.keys?.[0] || '', clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: r2(x.ctr || 0), position: r1(x.position || 0), ...(prev ? { prevClicks: prev.clicks || 0, prevImpressions: prev.impressions || 0, prevPosition: r1(prev.position || 0) } : {}) });
const total = (rows) => { const c = rows.reduce((a, x) => a + (x.clicks || 0), 0), i = rows.reduce((a, x) => a + (x.impressions || 0), 0), pos = i ? rows.reduce((a, x) => a + (x.position || 0) * (x.impressions || 0), 0) / i : 0; return { clicks: c, impressions: i, ctr: i ? r2(c / i) : 0, position: r1(pos) }; };
const group = (rows, key) => Object.entries(rows.reduce((o, x) => { const k = key(x); const g = (o[k] ||= { clicks: 0, impressions: 0 }); g.clicks += x.clicks || 0; g.impressions += x.impressions || 0; return o; }, {})).map(([k, v]) => ({ key: k, ...v, ctr: v.impressions ? r2(v.clicks / v.impressions) : 0 })).sort((a, b) => b.impressions - a.impressions);

async function sitemapUrls(base, fetchFn) {
  const r = await fetchFn(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(20e3) });
  return [...String(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// CTR po zmianie tytułów: daty zmian w seo-data/title-changes.json ([{ date, note, pages }]). Porównujemy tyle samo dni
// przed i po ostatniej zmianie (najwyżej 28) dla grup zapytań: marka, „cv pod ogłoszenie”, „dopasuj cv”, „skaner cv”.
export const TITLE_CHANGES = new URL('../seo-data/title-changes.json', import.meta.url);
export const titleChanges = () => { try { return JSON.parse(fs.readFileSync(TITLE_CHANGES, 'utf8')).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a, b) => (a.date < b.date ? -1 : 1)); } catch { return []; } };
const plain = (q) => String(q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
export const CTR_GROUPS = [
  ['marka', 'Marka (cvpodogloszenie)', (q) => /cv ?pod ?ogloszenie ?\.? ?pl|cvpodogloszenie/.test(q)],
  ['cv-pod-ogloszenie', '„cv pod ogłoszenie”', (q) => /cv pod ogloszeni/.test(q)],
  ['dopasuj-cv', '„dopasuj cv”', (q) => /dopasow\w* cv|dopasuj\w* cv|cv dopasow/.test(q)],
  ['skaner-cv', '„skaner cv”', (q) => /skaner\w* cv|cv skaner/.test(q)],
];
const DAYS = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY) + 1;
const shift = (d, n) => new Date(Date.parse(d) + n * DAY).toISOString().slice(0, 10);
export async function titleCtr(end, q, changes = titleChanges()) {
  const c = changes.filter((x) => x.date <= end).pop();
  if (!c) return null;
  const n = Math.min(28, DAYS(c.date, end) - 1); // dzień zmiany pomijamy (część dnia ze starym tytułem)
  const variantB = c.variantB?.title ? { title: c.variantB.title, consider: c.variantB.consider || '', status: c.variantB.status || '' } : null;
  if (n < 1) return { change: c.date, note: c.note || '', days: 0, groups: [], variantB };
  const after = { start: shift(c.date, 1), end: shift(c.date, n) }, before = { start: shift(c.date, -n), end: shift(c.date, -1) };
  const [rb, ra] = await Promise.all([q(['query'], before.start, before.end, 5000), q(['query'], after.start, after.end, 5000)]);
  const sum = (rows, test) => total(rows.filter((x) => test(plain(x.keys?.[0]))));
  return { change: c.date, note: c.note || '', days: n, before, after, variantB, groups: CTR_GROUPS.map(([key, label, test]) => ({ key, label, before: sum(rb, test), after: sum(ra, test) })) };
}

async function gscPart(base, now, fetchFn) {
  const end = dayKey(now - 3 * DAY), start = dayKey(now - 30 * DAY), pEnd = dayKey(now - 31 * DAY), pStart = dayKey(now - 58 * DAY);
  const q = (dimensions, s, e, rowLimit) => searchAnalytics({ startDate: s, endDate: e, dimensions, rowLimit }, fetchFn);
  const [tCur, tPrev, qCur, qPrev, pCur, pPrev] = await Promise.all([q([], start, end, 1), q([], pStart, pEnd, 1), q(['query'], start, end, 1000), q(['query'], pStart, pEnd, 1000), q(['page'], start, end, 5000), q(['page'], pStart, pEnd, 5000)]);
  const by = (rows) => new Map(rows.map((x) => [x.keys?.[0], x]));
  const qp = by(qPrev), pp = by(pPrev);
  const pages = pCur.map((x) => ({ ...row(x, pp.get(x.keys?.[0])), ...classify(x.keys?.[0]) }));
  // Próbka adresów z mapy strony, co tydzień inna (rotacja po numerze tygodnia).
  let inspection = { sample: 0, states: {}, rows: [], error: null };
  try {
    const urls = await sitemapUrls(base, fetchFn);
    if (urls.length) {
      const off = (Math.floor(now / (7 * DAY)) * SAMPLE) % urls.length, pick = Array.from({ length: Math.min(SAMPLE, urls.length) }, (_, i) => urls[(off + i) % urls.length]);
      for (const u of pick) { try { inspection.rows.push(await inspectUrl(u, fetchFn)); } catch (e) { inspection.rows.push({ url: u, coverage: 'błąd', verdict: e.message.slice(0, 100) }); } }
      inspection.sample = pick.length;
      for (const x of inspection.rows) inspection.states[x.coverage] = (inspection.states[x.coverage] || 0) + 1;
    }
  } catch (e) { inspection.error = e.message; }
  return {
    site: gscSite(), period: { start, end, prevStart: pStart, prevEnd: pEnd },
    totals: { cur: total(tCur), prev: total(tPrev) },
    queries: qCur.slice().sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 50).map((x) => row(x, qp.get(x.keys?.[0]))),
    nearFirstPage: qCur.filter((x) => x.position >= 8 && x.position <= 20 && x.impressions >= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 50).map((x) => row(x, qp.get(x.keys?.[0]))),
    pages: pages.slice().sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 50),
    zeroClickPages: pages.filter((x) => x.impressions > 0 && !x.clicks).sort((a, b) => b.impressions - a.impressions).slice(0, 50),
    // Do poprawy tytułu: Google pokazuje stronę na pozycji 3–20, ale nikt nie klika (CTR 0%).
    fixTitles: pages.filter((x) => x.impressions > 0 && !x.clicks && x.position >= 3 && x.position <= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 50),
    byLang: group(pages, (x) => x.lang), byType: group(pages, (x) => x.type),
    titleCtr: await titleCtr(end, q).catch((e) => ({ error: e.message })),
    inspection,
  };
}

export async function buildReport(base, { now = Date.now(), fetchFn = fetch } = {}) {
  const lastMon = dayKey(now - 7 * DAY), lastSun = dayKey(now - DAY);
  const rep = { id: weekId(now), created: now, funnel: await funnelRange(lastMon, lastSun), gsc: null, gscError: null };
  if (!gscEnabled()) rep.gscError = 'Search Console nie jest skonfigurowane (GSC_SA_JSON, GSC_SITE).';
  else { try { rep.gsc = await gscPart(base, now, fetchFn); } catch (e) { rep.gscError = e.message; } }
  return rep;
}

const n = (x) => Number(x || 0).toLocaleString('pl-PL');
const diff = (a, b) => (b ? ` (${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%)` : '');
const variantLine = (t) => (t?.variantB ? `\nWariant B do rozważenia${t.variantB.consider ? ` (od ${t.variantB.consider})` : ''}: „${t.variantB.title}” – ${t.variantB.status || 'nie wdrożone'}.` : '');
export function ctrText(t) {
  if (!t) return '';
  return ctrBody(t) + variantLine(t);
}
function ctrBody(t) {
  if (t.error) return `CTR po zmianie tytułów: ${t.error}`;
  if (!t.days) return `CTR po zmianie tytułów (zmiana ${t.change}): za mało danych – Search Console podaje dane z kilkudniowym opóźnieniem.`;
  return `CTR po zmianie tytułów (zmiana ${t.change}; ${t.days} dni przed vs ${t.days} dni po):\n${t.groups.map((x) => `- ${x.label}: CTR ${x.before.ctr}% → ${x.after.ctr}%, kliknięcia ${n(x.before.clicks)} → ${n(x.after.clicks)}, wyświetlenia ${n(x.before.impressions)} → ${n(x.after.impressions)}, poz. ${x.before.position} → ${x.after.position}`).join('\n')}`;
}
export function reportText(rep, base, link) {
  const g = rep.gsc, out = [`Raport SEO za tydzień od ${rep.id}`];
  if (g) {
    const c = g.totals.cur, p = g.totals.prev;
    out.push(`Google (${g.period.start} – ${g.period.end} vs poprzednie 28 dni): kliknięcia ${n(c.clicks)}${diff(c.clicks, p.clicks)}, wyświetlenia ${n(c.impressions)}${diff(c.impressions, p.impressions)}, CTR ${c.ctr}%, średnia pozycja ${c.position} (było ${p.position}).`);
    if (g.queries.length) out.push(`Najwięcej kliknięć:\n${g.queries.slice(0, 10).map((x) => `- ${x.key}: ${x.clicks} klik., ${x.impressions} wyśw., poz. ${x.position}`).join('\n')}`);
    if (g.nearFirstPage.length) out.push(`Blisko pierwszej strony (pozycja 8–20, co najmniej 20 wyświetleń):\n${g.nearFirstPage.slice(0, 10).map((x) => `- ${x.key}: poz. ${x.position}, ${x.impressions} wyśw.`).join('\n')}`);
    if (g.fixTitles?.length) out.push(`Pozycja 3–20, CTR 0% – do poprawy tytułu (${g.fixTitles.length}):\n${g.fixTitles.slice(0, 10).map((x) => `- ${x.key.replace(/^https?:\/\/[^/]+/, '') || '/'}: poz. ${x.position}, ${n(x.impressions)} wyśw.`).join('\n')}`);
    if (g.zeroClickPages.length) out.push(`Strony z wyświetleniami bez kliknięć: ${g.zeroClickPages.length} (najwięcej: ${g.zeroClickPages.slice(0, 3).map((x) => x.key.replace(/^https?:\/\/[^/]+/, '') || '/').join(', ')}).`);
    out.push(`Według typu stron: ${g.byType.map((x) => `${x.key} ${n(x.clicks)}/${n(x.impressions)}`).join(', ') || 'brak'} (kliknięcia/wyświetlenia).`);
    const tc = ctrText(g.titleCtr); if (tc) out.push(tc);
    out.push(`Według języka: ${g.byLang.map((x) => `${x.key} ${n(x.clicks)}/${n(x.impressions)}`).join(', ') || 'brak'}.`);
    if (g.inspection.sample) out.push(`Indeksowanie (próbka ${g.inspection.sample} adresów z mapy strony): ${Object.entries(g.inspection.states).map(([k, v]) => `${k}: ${v}`).join(', ')}.`);
    const other = g.inspection.rows.filter((x) => x.googleCanonical && x.userCanonical && x.googleCanonical !== x.userCanonical);
    if (other.length) out.push(`Google wybrał inną stronę główną niż nasza:\n${other.map((x) => `- ${x.url} → ${x.googleCanonical}`).join('\n')}`);
    else if (g.inspection.error) out.push(`Indeksowanie: ${g.inspection.error}`);
  } else out.push(`Search Console: ${rep.gscError}`);
  out.push(funnelText(rep.funnel));
  const ab = abText(abReport(rep.funnel.ab));
  if (ab) out.push(ab);
  out.push(`Szczegóły: ${base}/admin#seo${link ? `\nLink tylko do odczytu: ${link}` : ''}`);
  return out.join('\n\n');
}

const reportToken = () => { const t = String(process.env.SEO_REPORT_TOKEN || '').trim(); return t.length >= 32 ? t : ''; };
export const reportLink = (base) => (reportToken() ? `${base}/raport-seo/${reportToken()}` : '');

let running = null;
// force: z panelu („Wygeneruj teraz”) – niezależnie od dnia i od tego, czy raport tego tygodnia już jest.
export async function seoWeekly(base, { now = Date.now(), force = false, fetchFn = fetch, mail = true } = {}) {
  if (!force && (!dueNow(now) || (await seoReports.get(weekId(now))))) return null;
  if (running) return running;
  running = (async () => {
    const rep = await buildReport(base, { now, fetchFn });
    await seoReports.save(rep);
    const ids = Object.keys(await seoReports.all()).sort();
    for (const id of ids.slice(0, Math.max(0, ids.length - KEEP))) await seoReports.remove(id);
    if (mail && mailEnabled()) await sendOwnerMail(`Raport SEO: tydzień od ${rep.id}${rep.gsc ? `, ${n(rep.gsc.totals.cur.clicks)} kliknięć z Google` : ''}`, reportText(rep, base, reportLink(base))).catch((e) => logEvent('e-mail', `Raport SEO: ${e.message}`));
    return rep;
  })().finally(() => { running = null; });
  return running;
}
export const latestReport = async () => Object.values(await seoReports.all()).sort((a, b) => (a.id < b.id ? 1 : -1))[0] || null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function table(rows, cols) {
  if (!rows?.length) return '<p>Brak danych.</p>';
  return `<table><thead><tr>${cols.map(([, h]) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map(([k]) => `<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
const QCOLS = [['key', 'Zapytanie'], ['clicks', 'Klik.'], ['impressions', 'Wyśw.'], ['ctr', 'CTR %'], ['position', 'Poz.'], ['prevClicks', 'Klik. wcześniej'], ['prevPosition', 'Poz. wcześniej']];
const PCOLS = [['key', 'Strona'], ['type', 'Typ'], ['lang', 'Język'], ['clicks', 'Klik.'], ['impressions', 'Wyśw.'], ['ctr', 'CTR %'], ['position', 'Poz.']];
export const ctrRows = (t) => (t?.groups || []).map((x) => ({ label: x.label, ctrB: x.before.ctr, ctrA: x.after.ctr, clicksB: x.before.clicks, clicksA: x.after.clicks, imprB: x.before.impressions, imprA: x.after.impressions, posB: x.before.position, posA: x.after.position }));
const CTRCOLS = [['label', 'Zapytania'], ['ctrB', 'CTR % przed'], ['ctrA', 'CTR % po'], ['clicksB', 'Klik. przed'], ['clicksA', 'Klik. po'], ['imprB', 'Wyśw. przed'], ['imprA', 'Wyśw. po'], ['posB', 'Poz. przed'], ['posA', 'Poz. po']];
const ctrHtml = (t) => (t ? `<h2>CTR po zmianie tytułów</h2>${t.days ? `<p>Zmiana ${esc(t.change)}${t.note ? ` (${esc(t.note)})` : ''}: ${t.days} dni przed (${esc(t.before.start)} – ${esc(t.before.end)}) vs ${t.days} dni po (${esc(t.after.start)} – ${esc(t.after.end)}).</p>${table(ctrRows(t), CTRCOLS)}` : `<p>${esc(ctrBody(t))}</p>`}${t.variantB ? `<p>${esc(variantLine(t).trim())}</p>` : ''}` : '');
export function reportHtml(rep) {
  const g = rep.gsc, f = rep.funnel;
  const fun = `<table><thead><tr><th>Etap</th><th>Liczba</th><th>% z poprzedniego</th>${['pl', 'en', 'uk', 'de'].map((l) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${f.stages.map((s) => `<tr><td>${esc(s.label)}</td><td>${s.n}</td><td>${s.rate ?? '–'}</td>${['pl', 'en', 'uk', 'de'].map((l) => `<td>${s.lang[l] || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const src = `<table><thead><tr><th>Źródło</th>${f.stages.map((s) => `<th>${esc(s.label)}</th>`).join('')}</tr></thead><tbody>${SOURCES.map((k) => `<tr><td>${k}</td>${f.stages.map((s) => `<td>${s.src[k] || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const body = g ? `<h2>Podsumowanie (${esc(g.period.start)} – ${esc(g.period.end)})</h2>${table([{ k: 'Ostatnie 28 dni', ...g.totals.cur }, { k: 'Poprzednie 28 dni', ...g.totals.prev }], [['k', 'Okres'], ['clicks', 'Kliknięcia'], ['impressions', 'Wyświetlenia'], ['ctr', 'CTR %'], ['position', 'Śr. pozycja']])}
<h2>Top 50 zapytań</h2>${table(g.queries, QCOLS)}<h2>Blisko pierwszej strony (poz. 8–20, ≥ 20 wyświetleń)</h2>${table(g.nearFirstPage, QCOLS)}
<h2>Top 50 stron</h2>${table(g.pages, PCOLS)}<h2>Pozycja 3–20, CTR 0% – do poprawy tytułów</h2>${table(g.fixTitles, PCOLS)}<h2>Wyświetlenia bez kliknięć</h2>${table(g.zeroClickPages, PCOLS)}
${ctrHtml(g.titleCtr)}<h2>Języki</h2>${table(g.byLang, [['key', 'Język'], ['clicks', 'Klik.'], ['impressions', 'Wyśw.'], ['ctr', 'CTR %']])}<h2>Typy stron</h2>${table(g.byType, [['key', 'Typ'], ['clicks', 'Klik.'], ['impressions', 'Wyśw.'], ['ctr', 'CTR %']])}
<h2>Indeksowanie – próbka ${g.inspection.sample} adresów</h2>${table(Object.entries(g.inspection.states).map(([k, v]) => ({ k, v })), [['k', 'Stan'], ['v', 'Adresów']])}${table(g.inspection.rows, [['url', 'Adres'], ['coverage', 'Stan'], ['googleCanonical', 'Kanoniczny wg Google'], ['lastCrawl', 'Ostatnie pobranie']])}`
    : `<p>Search Console: ${esc(rep.gscError)}</p>`;
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Raport SEO ${esc(rep.id)}</title>
<style>body{font:14px/1.45 system-ui,sans-serif;margin:16px;color:#16233a;background:#fff}h1{font-size:20px}h2{font-size:16px;margin-top:24px}table{border-collapse:collapse;width:100%;margin:8px 0;display:block;overflow-x:auto}th,td{border:1px solid #dde3ee;padding:4px 6px;text-align:left;white-space:nowrap}th{background:#f3f6fb}</style></head>
<body><h1>Raport SEO – tydzień od ${esc(rep.id)}</h1><p>Wygenerowano: ${esc(new Date(rep.created).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }))}. Format JSON: dodaj <code>?format=json</code>.</p>${body}
<h2>Lejek sprzedaży ${esc(f.from)} – ${esc(f.to)}</h2>${fun}<h3>Według źródła</h3>${src}</body></html>`;
}

// Prywatny link tylko do odczytu: /raport-seo/<SEO_REPORT_TOKEN> (min. 32 znaki), bez indeksowania.
export function seoReportRoutes(app) {
  app.get('/raport-seo/:token', async (req, res, next) => {
    const t = reportToken(), got = String(req.params.token || '');
    res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    const ok = t && got.length === t.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(t));
    if (!ok) return next();
    const rep = await latestReport();
    if (req.query.format === 'json') return res.json(rep || { error: 'Brak raportu.' });
    if (!rep) return res.type('html').send('<!doctype html><meta name="robots" content="noindex"><p>Brak raportu. Pierwszy powstanie w poniedziałek po 6:30.</p>');
    res.type('html').send(reportHtml(rep));
  });
}

// Panel → SEO. „Wygeneruj raport teraz”: w tle (sprawdzanie adresów trwa), najwyżej raz na godzinę.
export function seoAdmin(api, { BASE_URL, now = () => Date.now(), run = (o) => seoWeekly(BASE_URL, o) }) {
  const manual = { at: 0, running: false, done: 0, error: null };
  api.get('/seo', async (_req, res) => {
    const all = Object.values(await seoReports.all()).sort((a, b) => (a.id < b.id ? 1 : -1));
    // Testy A/B: wyniki na żywo ze wszystkich zapisanych dni (lejek trzymamy 400 dni).
    const ab = abReport((await funnelRange('0000-00-00', '9999-99-99')).ab);
    // Lejek kreatora z ostatnich 28 dni (razem i dla wariantów testów).
    const from = new Date(now() - 27 * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
    const wizard = wizardFunnel(Object.values(await analyticsDays()).filter((x) => x.id >= from));
    res.json({ ab, wizard, enabled: gscEnabled(), link: reportLink(BASE_URL), manual, latest: all[0] || null, weeks: all.map((r) => ({ id: r.id, clicks: r.gsc?.totals.cur.clicks ?? null, impressions: r.gsc?.totals.cur.impressions ?? null, paid: r.funnel.stages.at(-1).n, visits: r.funnel.stages[0].n })) });
  });
  api.post('/seo/run', (_req, res) => {
    if (manual.running) return res.json({ ok: true, running: true });
    const wait = manual.at + 3600e3 - now();
    if (wait > 0) return res.status(429).json({ error: `Raport można wygenerować ręcznie raz na godzinę. Spróbuj ponownie za ${Math.ceil(wait / 60e3)} min.` });
    Object.assign(manual, { at: now(), running: true, error: null });
    Promise.resolve().then(() => run({ force: true })).then((r) => { manual.error = r?.gscError || r?.gsc?.inspection?.error || null; }).catch((e) => { manual.error = e.message; logEvent('seo', `Raport SEO (ręcznie): ${e.message}`); })
      .finally(() => { manual.running = false; manual.done = now(); });
    res.json({ ok: true, started: true });
  });
}
