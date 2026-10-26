import crypto from 'node:crypto';
import { visitorId, abExpose } from './analytics.js';

// Testy A/B strony głównej (PL) bez plików cookie i bez danych osobowych: wariant wynika ze skrótu odwiedzającego
// z lib/analytics.js (IP + przeglądarka + sól zmieniana codziennie, tylko w pamięci), więc jest stały w ciągu dnia,
// a między dniami nie da się nikogo powiązać. Włączanie: EXPERIMENTS w Render, np. {"hero":50,"cta":50} (% ruchu w wariancie B);
// pusta zmienna → bez eksperymentów. Wariant trafia do lejka (analytics.json → ab) i do zamówienia (visit.ab).
export const EXPERIMENTS = {
  hero: {
    name: 'Nagłówek strony głównej',
    A: 'Jedno ogłoszenie. Jedno CV pisane właśnie pod nie.',
    B: 'CV dopasowane do ogłoszenia w kilka minut – sprawdź za darmo, ile pasujesz',
    apply: (h) => h.replace('<h1>Jedno ogłoszenie. Jedno CV pisane właśnie pod nie.</h1>', '<h1>CV dopasowane do ogłoszenia w kilka minut – sprawdź za darmo, ile pasujesz</h1>'),
  },
  cta: {
    name: 'Przycisk główny',
    A: 'Pole na ogłoszenie + „Zrób CV pod to ogłoszenie – 39 zł” (otwiera kreator z ogłoszeniem)',
    B: 'Sprawdź za darmo, potem zrób CV (prowadzi do skanera)',
    // C4 (26.10): w wariancie A pole na ogłoszenie w hero; B bez zmian – zamiast pola przycisk do skanera.
    apply: (h) => h.replace(/<form class="hero-ad" id="heroAd" novalidate>[\s\S]*?<\/form>/, '<div class="cta"><a class="btn lg" href="#skaner">Sprawdź za darmo, potem zrób CV</a></div>'),
  },
  // Test „wizard_order” (kolejność kreatora) zakończony 26.10: kreator na 3 ekrany (C3) zastępuje oba warianty; historia zostaje w raporcie lejka.
  // Ostatni krok kreatora (public/app.js: CHECKOUT_B): cena na górze, metody płatności jako ikony, zgody kompaktowo –
  // nadal dwa osobne pola (regulamin; zgoda z art. 38 pkt 13 osobno). Zgody marketingowe bez zmian: osobno, odznaczone, zwinięte. Ocena: ostatni krok → opłacone.
  checkout: {
    name: 'Ostatni krok kreatora',
    A: 'Podsumowanie, metody płatności w tekście',
    B: 'Cena na górze, zgody kompaktowo (nadal dwa osobne pola), metody płatności jako ikony',
    apply: (h) => h.replace('<div id="wiz" class="wiz"', '<div id="wiz" class="wiz" data-checkout="b"'),
  },
  // Wynik darmowego skanera (/api/scan: strona główna, /narzedzia/skaner-cv i wersje EN/DE/UK). Wariant przypisuje serwer przy skanie,
  // a w B obcina wynik już w odpowiedzi (scanForVariant), nie tylko w widoku. Lejek: skan → klik „Zrób CV” → zamówienie → opłacone.
  scanner: {
    name: 'Wynik skanera',
    A: 'Pełny wynik: wszystkie braki i wskazówki',
    B: '3 pierwsze braki + „kolejne uwzględnimy w CV”, wskazówki dopiero w CV pod ogłoszenie',
    scope: 'scan',
    stages: ['scan_done', 'cta_click', 'order_created', 'paid'],
  },
};

// {"hero":50} / {"hero":true} / ["hero"] → { hero: 50 } (procent ruchu w wariancie B, domyślnie 50).
export function activeExperiments(raw = process.env.EXPERIMENTS) {
  let v; try { v = JSON.parse(raw || '{}'); } catch { return {}; }
  if (Array.isArray(v)) v = Object.fromEntries(v.map((k) => [k, 50]));
  if (!v || typeof v !== 'object') return {};
  const out = {};
  for (const [k, s] of Object.entries(v)) {
    if (!EXPERIMENTS[k] || s === false || s === 0) continue;
    const n = s === true ? 50 : Number(s);
    if (n > 0 && n < 100) out[k] = n;
  }
  return out;
}

export const variantOf = (id, vid, splitB = 50) => (parseInt(crypto.createHash('sha256').update(`${id}|${vid}`).digest('hex').slice(0, 8), 16) / 0xffffffff * 100 < splitB ? 'B' : 'A');

// Strona główna: warianty wstawione po stronie serwera (bez migania), ekspozycja liczona w lejku.
export function abHome(req, html, raw = process.env.EXPERIMENTS) {
  const act = activeExperiments(raw), ids = Object.keys(act).filter((k) => !EXPERIMENTS[k].scope); // „scanner” przypisuje /api/scan
  if (!ids.length) return { html, assign: null };
  const vid = visitorId(req), assign = Object.fromEntries(ids.map((k) => [k, variantOf(k, vid, act[k])]));
  for (const [k, v] of Object.entries(assign)) if (v === 'B') html = EXPERIMENTS[k].apply(html);
  abExpose(req, assign).catch(() => {});
  return { html, assign };
}

// Wariant testu „scanner” dla odwiedzającego (null, gdy test wyłączony) i wynik do pokazania: w B tylko 3 pierwsze braki,
// liczba pozostałych (missingMore) i bez wskazówek. Ten sam obcięty wynik trafia do pamięci (e-mail, karta, obrazki).
export function scannerVariant(req, raw = process.env.EXPERIMENTS) {
  const act = activeExperiments(raw);
  return act.scanner ? variantOf('scanner', visitorId(req), act.scanner) : null;
}
export function scanForVariant(result, v) {
  if (v !== 'B') return result;
  const missing = result.missing || [];
  return { ...result, missing: missing.slice(0, 3), missingMore: Math.max(0, missing.length - 3), tips: [] };
}

// Test z dla dwóch proporcji (dwustronny): czy konwersja B różni się od A. p < 0,05 → różnica istotna.
const phi = (z) => { const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2); return 0.5 * (1 + Math.sign(z) * y); };
export function zTest(xa, na, xb, nb) {
  if (!na || !nb) return { z: null, p: null };
  const p = (xa + xb) / (na + nb), se = Math.sqrt(p * (1 - p) * (1 / na + 1 / nb));
  if (!se) return { z: 0, p: 1 };
  const z = (xb / nb - xa / na) / se;
  return { z: Math.round(z * 100) / 100, p: Math.round(2 * (1 - phi(Math.abs(z))) * 1000) / 1000 };
}

// Wyniki z lejka (funnelRange → ab): wejścia, start kreatora, płatność rozpoczęta, opłacone; konwersja wejście → opłacone i wejście → start.
const STAGES = ['visit', 'start', 'last', 'checkout', 'paid'];
// Test „scanner”: własne etapy (EXPERIMENTS.scanner.stages), konwersje liczone od skanu.
const scannerRow = (id, ab, active) => {
  const st = EXPERIMENTS[id].stages, v = (x) => ({ variant: x, label: EXPERIMENTS[id][x], ...Object.fromEntries(st.map((s) => [s, ab[`${id}:${x}`]?.[s] || 0])) });
  const A = v('A'), B = v('B'), rate = (r, k) => (r.scan_done ? Math.round((1000 * r[k]) / r.scan_done) / 10 : null);
  for (const r of [A, B]) { r.ctaRate = rate(r, 'cta_click'); r.orderRate = rate(r, 'order_created'); r.paidRate = rate(r, 'paid'); }
  return { id, name: EXPERIMENTS[id].name, stages: st, active: !!active[id], splitB: active[id] || null, variants: [A, B], cta: zTest(A.cta_click, A.scan_done, B.cta_click, B.scan_done), order: zTest(A.order_created, A.scan_done, B.order_created, B.scan_done), paid: zTest(A.paid, A.scan_done, B.paid, B.scan_done) };
};
export function abReport(ab = {}, active = activeExperiments()) {
  const ids = [...new Set([...Object.keys(ab).map((k) => k.split(':')[0]), ...Object.keys(active)])].filter((k) => EXPERIMENTS[k]);
  return ids.map((id) => {
    if (EXPERIMENTS[id].stages) return scannerRow(id, ab, active);
    const v = (x) => ({ variant: x, label: EXPERIMENTS[id][x], ...Object.fromEntries(STAGES.map((s) => [s, ab[`${id}:${x}`]?.[s] || 0])) });
    const A = v('A'), B = v('B'), rate = (r, k) => (r.visit ? Math.round((1000 * r[k]) / r.visit) / 10 : null);
    for (const r of [A, B]) { r.startRate = rate(r, 'start'); r.paidRate = rate(r, 'paid'); r.lastPaidRate = r.last ? Math.round((1000 * r.paid) / r.last) / 10 : null; }
    // ostatni krok → opłacone: główna miara testu „checkout” (wariant widzą tylko osoby, które doszły do ostatniego kroku)
    return { id, name: EXPERIMENTS[id].name, active: !!active[id], splitB: active[id] || null, variants: [A, B], paid: zTest(A.paid, A.visit, B.paid, B.visit), start: zTest(A.start, A.visit, B.start, B.visit), lastPaid: zTest(A.paid, A.last, B.paid, B.last) };
  });
}
const pTxt = (t) => `${t.p ?? '–'}${t.p != null && t.p < 0.05 ? ' – różnica istotna' : ''}`;
export const abText = (rows) => rows.map((e) => (e.stages ? `Test A/B „${e.name}”${e.active ? '' : ' (zakończony)'}: ${e.variants.map((r) => `${r.variant} ${r.scan_done} skanów, klik „Zrób CV” ${r.cta_click} (${r.ctaRate ?? '–'}%), zamówienia ${r.order_created} (${r.orderRate ?? '–'}%), opłacone ${r.paid} (${r.paidRate ?? '–'}%)`).join('; ')}; p (klik) = ${pTxt(e.cta)}; p (opłacone) = ${pTxt(e.paid)}.` : `Test A/B „${e.name}”${e.active ? '' : ' (zakończony)'}: ${e.variants.map((r) => `${r.variant} ${r.visit} wejść, start ${r.start} (${r.startRate ?? '–'}%), opłacone ${r.paid} (${r.paidRate ?? '–'}%)${e.id === 'checkout' ? `, ostatni krok ${r.last} → opłacone ${r.lastPaidRate ?? '–'}%` : ''}`).join('; ')}; p (opłacone) = ${e.paid.p ?? '–'}${e.paid.p != null && e.paid.p < 0.05 ? ' – różnica istotna' : ''}${e.id === 'checkout' ? `; p (ostatni krok → opłacone) = ${e.lastPaid.p ?? '–'}${e.lastPaid.p != null && e.lastPaid.p < 0.05 ? ' – różnica istotna' : ''}` : ''}.`)).join('\n');
