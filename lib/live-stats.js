// Prawdziwe liczby na stronę (blok B, 26.10): tylko z zamówień, ukryte poniżej progów; bez zaokrąglania w górę i bez szacunków.
// B4: liczba CV z zamówień ukończonych w ostatnich 7 dniach (≥ 20) i mediana czasu od płatności do gotowych dokumentów z 30 dni (≤ 15 min).
// B5: najczęściej wybierany pakiet z opłaconych zamówień z 30 dni (co najmniej 10 zamówień, bez remisu).
// Liczymy tylko zamówienia z obiema datami (paidAt, doneAt) – starsze, bez doneAt, nie wchodzą do mediany. Dodatki dokupione później pomijamy.
export const LIVE_MIN_CVS = 20, LIVE_MAX_MEDIAN = 15, POPULAR_MIN = 10;
const DAY = 864e5, PKGS = ['cv', 'cv_letter', 'pack3'];
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export function liveStats(orders, now = Date.now()) {
  const done = orders.filter((o) => o.status === 'done' && !o.upsellOf && o.doneAt);
  const cvs = done.filter((o) => now - o.doneAt <= 7 * DAY).reduce((s, o) => s + (o.results?.length || 0), 0);
  const mins = done.filter((o) => o.paidAt && now - o.doneAt <= 30 * DAY && o.doneAt >= o.paidAt).map((o) => (o.doneAt - o.paidAt) / 60000);
  const med = median(mins), m = med == null ? null : Math.max(1, Math.round(med));
  const week = cvs >= LIVE_MIN_CVS && m != null && m <= LIVE_MAX_MEDIAN ? { cvs, minutes: m } : null;
  const paid = orders.filter((o) => o.paidAt && !o.upsellOf && PKGS.includes(o.pkg) && now - o.paidAt <= 30 * DAY && o.total > 0);
  const by = Object.fromEntries(PKGS.map((p) => [p, paid.filter((o) => o.pkg === p).length]));
  const top = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const popular = paid.length >= POPULAR_MIN && top[0][1] > top[1][1] ? top[0][0] : null;
  return { week, popular };
}
