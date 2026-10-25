// „Skąd nas znasz?” (PR O): jedno kliknięcie po płatności, opcjonalne. Odpowiedź przy zamówieniu (znika razem z nim po 30 dniach),
// licznik bez danych osobowych w statystykach dnia (zdarzenie heard:<źródło>). Nie jest to zgoda marketingowa.
export const HEARD = { google: 'Google', reklama: 'Reklama (Facebook, Instagram)', tiktok_youtube: 'TikTok / YouTube', znajomy: 'Od znajomego', pinterest: 'Pinterest', inne: 'Inne' };
export const HEARD_TEXT_MAX = 80;
export function heardInput(b) {
  const src = String(b?.src || '');
  if (!HEARD[src]) throw new Error('Wybierz jedną z odpowiedzi.');
  return { src, text: String(b?.text || '').replace(/\s+/g, ' ').trim().slice(0, HEARD_TEXT_MAX) };
}
// Zestawienie do panelu: liczby z dni (wszystkie dane), dopiski z zamówień, które jeszcze są (bez e-maili i nazwisk).
export function heardSummary(events = {}, orders = []) {
  const counts = Object.keys(HEARD).map((k) => ({ k, label: HEARD[k], n: events[`heard:${k}`] || 0 }));
  const total = counts.reduce((s, x) => s + x.n, 0);
  const texts = orders.filter((o) => o.heard?.text).sort((a, b) => b.heard.at - a.heard.at).slice(0, 30).map((o) => ({ at: o.heard.at, label: HEARD[o.heard.src], text: o.heard.text }));
  return { counts: counts.map((x) => ({ ...x, pct: total ? Math.round((1000 * x.n) / total) / 10 : 0 })), total, texts };
}
