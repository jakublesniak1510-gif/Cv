import { makeStore } from './store.js';
import { PROFESSIONS } from './content.js';
import { logEvent } from './events.js';

// Anonimowe statystyki wymagań z ogłoszeń (do raportów o rynku pracy).
// Zapisujemy WYŁĄCZNIE liczniki: miesiąc → zawód → { n, keywords: { wymaganie: { seen, inCv } } }.
// Nigdy: treści ogłoszenia ani CV, imion, adresów IP, numerów zamówień.
export const statsAgg = makeStore('stats-agg.json');
export const MIN_N = 30, TOP_KW = 200, OTHER = 'inne';

export const norm = (s) => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9а-яіїєґё+#]+/g, ' ').trim();

// Warianty nazw zawodów: „Kasjer / Kasjerka” → kasjer, kasjerka; bez nawiasów; plus slug.
const VARIANTS = PROFESSIONS.flatMap((p) => [...String(p.name).replace(/\([^)]*\)/g, ' ').split('/'), p.slug.replace(/-/g, ' ')]
  .map(norm).filter((v) => v.replace(/ /g, '').length >= 3 && !/^(\S{1,2}( |$))+$/.test(v)).map((v) => ({ v, slug: p.slug })));
const PROF_NAME = Object.fromEntries(PROFESSIONS.map((p) => [p.slug, p.name]));
export const professionName = (slug) => PROF_NAME[slug] || 'Inne';

// Tytuł ogłoszenia → slug zawodu: najwcześniejsze trafienie w tytule, przy remisie dłuższe (np. „kierownik magazynu” przed „magazynier”).
export function professionOf(title) {
  const t = ` ${norm(title)} `; if (t.trim().length < 3) return OTHER;
  const words = t.trim().split(' ');
  let best = null;
  for (const { v, slug } of VARIANTS) {
    let at = t.indexOf(` ${v} `);
    // odmiana jednego słowa: „magazyniera”, „kasjerki” (temat min. 5 znaków)
    if (at < 0 && !v.includes(' ') && v.length >= 5) { const i = words.findIndex((w) => w.startsWith(v)); if (i >= 0) at = t.indexOf(` ${words[i]} `); }
    if (at >= 0 && (!best || at < best.at || (at === best.at && v.length > best.len))) best = { at, len: v.length, slug };
  }
  return best ? best.slug : OTHER;
}

const COMPANY_STOP = new Set(['sp', 'z', 'o', 'oo', 'zoo', 's', 'a', 'sa', 'sc', 'spolka', 'spolka z', 'group', 'grupa', 'polska', 'poland', 'firma', 'company', 'gmbh', 'ltd', 'inc', 'the']);
const companyWords = (c) => norm(c).split(' ').filter((w) => w.length >= 3 && !COMPANY_STOP.has(w));

// Wymaganie → znormalizowana fraza albo null, gdy to dane kontaktowe, liczby lub nazwa firmy.
export function cleanKeyword(k, company = []) {
  const raw = String((k && typeof k === 'object' ? k.keyword : k) || '').trim();
  if (!raw || /https?:|www\.|\b[\w-]+\.(pl|com|eu|net|org|io|de|uk|info|biz)\b|@/i.test(raw)) return null;
  if ((raw.match(/\+?\d[\d\s().-]{7,}\d/g) || []).some((x) => x.replace(/\D/g, '').length >= 9) || /^[\d\s.,:;%+\-/()]+$/.test(raw)) return null;
  const kw = raw.toLowerCase().replace(/\s+/g, ' ').slice(0, 60).trim();
  if (kw.length < 2) return null;
  const words = ` ${norm(kw)} `;
  if (company.some((w) => words.includes(` ${w} `))) return null;
  return kw;
}

export const monthKey = (t = Date.now()) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 7);

const prune = (kws) => {
  const e = Object.entries(kws); if (e.length <= TOP_KW) return kws;
  return Object.fromEntries(e.sort((a, b) => b[1].seen - a[1].seen || b[1].inCv - a[1].inCv || (a[0] < b[0] ? -1 : 1)).slice(0, TOP_KW));
};

// found: wymagania widoczne w CV, missing: niewidoczne (stringi albo {keyword}). Tytuł i firma służą tylko do kategorii/filtra.
export async function recordStats({ title, company, found = [], missing = [], now = Date.now() }) {
  const comp = [].concat(company || []).flatMap(companyWords), prof = professionOf(title), seen = new Map();
  for (const [list, inCv] of [[found, true], [missing, false]]) for (const k of Array.isArray(list) ? list : []) {
    const kw = cleanKeyword(k, comp); if (kw && !seen.has(kw)) seen.set(kw, inCv);
  }
  const m = monthKey(now);
  await statsAgg.upsert(m, (prev = {}) => {
    const p = prev[prof] || { n: 0, keywords: {} }, keywords = { ...p.keywords };
    for (const [kw, inCv] of seen) { const c = keywords[kw] || { seen: 0, inCv: 0 }; keywords[kw] = { seen: c.seen + 1, inCv: c.inCv + (inCv ? 1 : 0) }; }
    return { ...prev, [prof]: { n: p.n + 1, keywords: prune(keywords) } };
  });
}

// Bezpieczne wywołanie z formularza skanera / generowania: nigdy nie rzuca i nie czeka.
export function recordStatsSafe(x) {
  try { recordStats(x).catch((e) => logEvent('statystyki', e.message)); } catch (e) { console.error('Statystyki', e.message); }
}

// --- Panel → Dane ---
const lastMonths = (k, now = Date.now()) => { const d = new Date(`${monthKey(now)}-15T12:00:00Z`); return Array.from({ length: k }, (_, i) => { const x = new Date(d); x.setUTCMonth(d.getUTCMonth() - i); return x.toISOString().slice(0, 7); }); };
export async function statsFor(month, now = Date.now()) {
  const all = await statsAgg.all(), months = Object.keys(all).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort().reverse();
  const pick = month === 'last3' ? lastMonths(3, now) : [/^\d{4}-\d{2}$/.test(month || '') ? month : months[0] || monthKey(now)];
  const agg = {};
  for (const m of pick) for (const [prof, v] of Object.entries(all[m] || {})) {
    if (!v || typeof v !== 'object' || !v.keywords) continue;
    const a = (agg[prof] ||= { n: 0, keywords: {} }); a.n += v.n || 0;
    for (const [kw, c] of Object.entries(v.keywords)) { const t = (a.keywords[kw] ||= { seen: 0, inCv: 0 }); t.seen += c.seen || 0; t.inCv += c.inCv || 0; }
  }
  const professions = Object.entries(agg).map(([slug, v]) => ({ slug, name: professionName(slug), n: v.n, ok: v.n >= MIN_N,
    keywords: Object.entries(v.keywords).map(([kw, c]) => ({ kw, seen: c.seen, inCv: c.inCv, pct: c.seen ? Math.round((1000 * c.inCv) / c.seen) / 10 : 0 })).sort((a, b) => b.seen - a.seen || (a.kw < b.kw ? -1 : 1)) }))
    .sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1));
  return { months, month: month === 'last3' ? 'last3' : pick[0], label: month === 'last3' ? `${pick.at(-1)} – ${pick[0]}` : pick[0], minN: MIN_N, professions };
}

const csvCell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return /[";\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s; };
export function statsCsv(d) {
  const rows = [['miesiąc', 'zawód', 'n', 'wymaganie', 'wystąpienia', 'odsetek_w_cv']];
  for (const p of d.professions.filter((x) => x.n >= MIN_N)) for (const k of p.keywords) rows.push([d.label, p.name, p.n, k.kw, k.seen, String(k.pct).replace('.', ',')]);
  return '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export function statsAdmin(api) {
  api.get('/stats-agg', async (req, res) => {
    const d = await statsFor(String(req.query.month || ''));
    res.json({ ...d, professions: d.professions.map((p) => ({ ...p, keywords: p.keywords.slice(0, 15) })) });
  });
  api.get('/stats-agg.csv', async (req, res) => {
    const d = await statsFor(String(req.query.month || ''));
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="wymagania-${d.month}.csv"` }).send(statsCsv(d));
  });
}
