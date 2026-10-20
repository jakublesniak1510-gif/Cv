import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';

// Statystyki odwiedzin bez plików cookie i bez zapisywania IP. Unikalnych odwiedzających liczymy skrótem
// (IP + przeglądarka + losowa sól zmieniana codziennie, trzymana tylko w pamięci), więc nie da się nikogo śledzić między dniami.
const days = makeStore('analytics.json');
const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
let salt = { day: '', value: '' }, seen = new Set(), info = new Map(); // info: źródło i język wejścia odwiedzającego (tylko w pamięci, do końca dnia)
const visitor = (req) => {
  const d = dayKey();
  if (salt.day !== d) { salt = { day: d, value: crypto.randomBytes(16).toString('hex') }; seen = new Set(); info = new Map(); }
  return crypto.createHash('sha256').update(`${salt.value}|${req.ip}|${req.get('user-agent') || ''}`).digest('hex').slice(0, 16);
};
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios/i;
const clean = (s, n) => String(s || '').slice(0, n).replace(/[^\w\-./ąćęłńóśźż]/gi, '');
const inc = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };

// Lejek sprzedaży: każdy etap liczony raz na odwiedzającego dziennie, z podziałem na język strony i źródło wejścia.
export const FUNNEL = [['visit', 'Wejścia'], ['start', 'Start kreatora'], ['last', 'Ostatni krok'], ['checkout', 'Płatność rozpoczęta'], ['paid', 'Opłacone']];
export const SOURCES = ['google', 'youtube', 'facebook', 'instagram', 'tiktok', 'share', 'direct', 'inne'];
const LANGS = ['pl', 'en', 'uk', 'de'];
const LAST_STEP = 6;
export function sourceOf(ref, utm) {
  if (String(utm || '').toLowerCase() === 'share') return 'share'; // link z karty wyniku skanera (/wynik/…), także gdy przyszedł z Facebooka
  const t = `${utm || ''} ${ref || ''}`.toLowerCase().trim();
  if (!t) return 'direct';
  return /google/.test(t) ? 'google' : /youtu/.test(t) ? 'youtube' : /facebook|\bfb\b|fb\./.test(t) ? 'facebook' : /instagram|\big\b/.test(t) ? 'instagram' : /tiktok/.test(t) ? 'tiktok' : 'inne';
}
const stageOf = (ev, b) => (ev === 'pv' ? 'visit' : ev === 'start' ? 'start' : ev === 'step' && parseInt(b.s, 10) === LAST_STEP ? 'last' : ev === 'checkout' || ev === 'preview' ? ev : null);

export function analyticsRoutes(app, BASE_URL) {
  const own = (() => { try { return new URL(BASE_URL).hostname; } catch { return ''; } })();
  app.post('/api/t', express.text({ type: '*/*', limit: '2kb' }), async (req, res) => {
    res.status(204).end();
    if (req.get('DNT') === '1' || req.get('Sec-GPC') === '1' || BOT.test(req.get('user-agent') || '')) return;
    let b; try { b = JSON.parse(req.body || '{}'); } catch { return; }
    const v = visitor(req), d = dayKey(), first = !seen.has(v), ev = ['pv', 'step', 'start', 'checkout', 'refshare'].includes(b.e) ? b.e : null; // „paid” i „preview” liczy serwer (funnelPaid, funnelPreview)
    if (!ev) return;
    const stepKey = ev === 'step' ? `${v}:s${parseInt(b.s, 10)}` : ev === 'start' ? `${v}:start` : ev !== 'pv' ? `${v}:${ev}` : null;
    if (stepKey && seen.has(stepKey)) return;
    if (stepKey) seen.add(stepKey);
    if (ev === 'pv') seen.add(v);
    let ref = ''; try { ref = b.r ? new URL(b.r).hostname.replace(/^www\./, '') : ''; } catch {}
    if (ref === own) ref = '';
    const utm = clean(b.u, 40);
    if (ev === 'pv' && first) info.set(v, { src: sourceOf(ref, utm), lang: LANGS.includes(b.l) ? b.l : 'pl' });
    const stage = stageOf(ev, b), fl = info.get(v)?.lang || (LANGS.includes(b.l) ? b.l : 'pl'), fs = info.get(v)?.src || sourceOf(ref, utm);
    const countStage = stage && (stage !== 'visit' || first);
    await days.upsert(d, (p = {}) => {
      const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p };
      if (ev === 'refshare') inc((x.events ||= {}), 'referral_share_click');
      if (countStage) { const f = (x.funnel ||= {}), st = (f[stage] ||= { n: 0, lang: {}, src: {} }); st.n++; inc(st.lang, fl); inc(st.src, fs); }
      if (ev === 'pv') {
        x.views++; if (first) { x.visitors++; inc(x.refs, utm ? `kampania: ${utm}` : ref || 'bezpośrednio'); inc(x.devices, /Mobi|Android/i.test(req.get('user-agent') || '') ? 'telefon' : 'komputer'); }
        inc(x.pages, clean(b.p, 80) || '/');
      } else if (ev === 'start') inc(x.steps, 'start');
      else if (ev === 'step') { const s = parseInt(b.s, 10); if (s >= 1 && s <= 7) inc(x.steps, String(s)); }
      return x;
    }).catch(() => {});
  });
}
// Źródło i język wejścia odwiedzającego (z pamięci dnia), zapisywane w zamówieniu do lejka – bez identyfikatorów.
export const visitInfo = (req) => { try { const x = info.get(visitor(req)); return x ? { src: x.src, lang: x.lang } : null; } catch { return null; } };
// Etap „Opłacone”: raz na zamówienie, w dniu płatności; źródło z zamówienia, inaczej „inne”.
export async function funnelPaid(o, at = Date.now()) {
  const src = SOURCES.includes(o.visit?.src) ? o.visit.src : 'inne', lang = LANGS.includes(o.visit?.lang) ? o.visit.lang : 'pl';
  await days.upsert(dayKey(at), (p = {}) => { const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p }, st = ((x.funnel ||= {}).paid ||= { n: 0, lang: {}, src: {} }); st.n++; inc(st.lang, lang); inc(st.src, src); return x; });
}
// Podgląd przed płatnością pokazany (zdarzenie preview_shown): liczy serwer po udanym /api/preview, raz na odwiedzającego dziennie.
export async function funnelPreview(req) {
  let v; try { v = visitor(req); } catch { return; }
  if (seen.has(`${v}:preview`)) return; seen.add(`${v}:preview`);
  const x0 = info.get(v), src = x0?.src || 'inne', lang = x0?.lang || 'pl';
  await days.upsert(dayKey(), (p = {}) => { const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p }, st = ((x.funnel ||= {}).preview ||= { n: 0, lang: {}, src: {} }); st.n++; inc(st.lang, lang); inc(st.src, src); return x; });
}
// Utworzona karta wyniku skanera (zdarzenie share_created): liczy serwer przy każdym nowym linku, z językiem karty.
export async function funnelShare(req, lang = 'pl') {
  let src = 'inne'; try { src = info.get(visitor(req))?.src || 'inne'; } catch {}
  const l = LANGS.includes(lang) ? lang : 'pl';
  await days.upsert(dayKey(), (p = {}) => { const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p }, st = ((x.funnel ||= {}).share_created ||= { n: 0, lang: {}, src: {} }); st.n++; inc(st.lang, l); inc(st.src, src); return x; });
}
// Zdarzenia liczone na serwerze (same liczby na dzień): upsell_shown, upsell_paid…
export const countEvent = (name, at = Date.now()) => days.upsert(dayKey(at), (p = {}) => { const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p }; inc((x.events ||= {}), name); return x; });
export const analyticsDays = () => days.all();
export const cleanupAnalytics = () => days.deleteWhere((x) => Date.now() - Date.parse(x.id) > 400 * 864e5);

// Lejek za dni od..do (YYYY-MM-DD, włącznie): etapy, % przejścia, podział na język i źródło. Same liczby.
export async function funnelRange(from, to) {
  const list = Object.values(await days.all()).filter((x) => x.id >= from && x.id <= to);
  const sum = (stage, k) => list.reduce((o, x) => { const st = x.funnel?.[stage]; if (st) for (const [a, n] of Object.entries(st[k] || {})) o[a] = (o[a] || 0) + n; return o; }, {});
  const stages = FUNNEL.map(([k, label]) => ({ k, label, n: list.reduce((a, x) => a + (x.funnel?.[k]?.n || 0), 0), lang: sum(k, 'lang'), src: sum(k, 'src') }));
  stages.forEach((s, i) => { s.rate = i && stages[i - 1].n ? Math.round((1000 * s.n) / stages[i - 1].n) / 10 : null; });
  const preview = list.reduce((a, x) => a + (x.funnel?.preview?.n || 0), 0), shares = list.reduce((a, x) => a + (x.funnel?.share_created?.n || 0), 0);
  const events = list.reduce((o, x) => { for (const [k, n] of Object.entries(x.events || {})) o[k] = (o[k] || 0) + n; return o; }, {});
  return { from, to, stages, preview, shares, events };
}
const pct = (x) => (x == null ? '–' : `${String(x).replace('.', ',')}%`);
export function funnelText(f) {
  const line = f.stages.map((s, i) => `${s.label}: ${s.n}${i ? ` (${pct(s.rate)})` : ''}`).join(' → ');
  const split = (k, keys) => keys.map((x) => [x, f.stages.map((s) => s[k][x] || 0)]).filter(([, a]) => a[0] || a.at(-1)).map(([x, a]) => `  ${x}: ${a.join(' → ')}`).join('\n');
  const ev = f.events || {}, extra = ev.upsell_shown || ev.upsell_paid || ev.referral_share_click ? `\nDodatki po zakupie: pokazane ${ev.upsell_shown || 0}, opłacone ${ev.upsell_paid || 0}. Udostępnienia kodu polecającego: ${ev.referral_share_click || 0}.` : '';
  return [`Lejek ${f.from === f.to ? f.from : `${f.from} – ${f.to}`}: ${line}${extra}`, `Według języka:\n${split('lang', LANGS) || '  brak danych'}`, `Według źródła:\n${split('src', SOURCES) || '  brak danych'}`, f.shares ? `Udostępnione wyniki skanera: ${f.shares}` : ''].filter(Boolean).join('\n');
}
