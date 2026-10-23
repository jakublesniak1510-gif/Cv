// „Jedno CV, dwa ogłoszenia” na stronach zawodów: to samo przykładowe CV zestawione z dwoma zestawami wymagań
// (słowa kluczowe zawodu 1–5 i 6–10). Bez generowania nowych zdań: pokazujemy tylko gotowe, przejrzane teksty
// przykładowego CV (podsumowanie, umiejętności, punkty doświadczenia, bez nazw firm) i zaznaczamy w nich słowa z ogłoszenia.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WORD = /[\p{L}\d](?:[\p{L}\d+#/-]|\.(?=[\p{L}\d]))*/gu; // kropka tylko wewnątrz słowa (c.o.), nie na końcu zdania
const words = (s) => String(s).match(WORD) || [];
// Rdzeń słowa: pierwsze 5 liter (odmiana w PL/UK/DE zmienia głównie końcówki); krótkie słowa (≤ 3 litery) pomijamy.
const stem = (w) => w.toLowerCase().slice(0, 5);
const stems = (k) => words(k).filter((w) => w.length > 3).map(stem);

function mark(line, set) {
  let hits = 0;
  const html = String(line).split(/([\p{L}\d](?:[\p{L}\d+#/-]|\.(?=[\p{L}\d]))*)/u).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    if (part.length > 3 && set.has(stem(part))) { hits++; return `<mark>${esc(part)}</mark>`; }
    return esc(part);
  }).join('');
  return { html, hits };
}

export function twoAds(p) {
  const s = p.sample || {};
  const pool = [...String(s.summary || '').split(/(?<=\.)\s+/), ...(s.skills || []), ...(s.jobs || []).flatMap((j) => j.bullets || [])].filter(Boolean);
  const all = new Set(pool.flatMap((l) => words(l).filter((w) => w.length > 3).map(stem)));
  const kw = (p.keywords || []).slice(0, 10), half = Math.ceil(kw.length / 2);
  return [kw.slice(0, half), kw.slice(half)].map((ks) => {
    // „Widać w CV”: wszystkie znaczące słowa wymagania (przy dłuższych co najmniej 2/3), nie samo „montaż” czy „obsługa”.
    const reqs = ks.map((k) => { const st = stems(k), n = st.filter((x) => all.has(x)).length; return { k, hit: st.length > 0 && n >= (st.length <= 2 ? st.length : Math.ceil((st.length * 2) / 3)) }; });
    const set = new Set(reqs.filter((r) => r.hit).flatMap((r) => stems(r.k)));
    const lines = pool.map((l, i) => ({ i, ...mark(l, set) })).filter((x) => x.hits).sort((a, b) => b.hits - a.hits || a.i - b.i).slice(0, 3).map((x) => x.html);
    return { reqs, lines };
  });
}

// Odmiana nazwy zawodu z ręcznie napisanego nagłówka strony („CV hydraulika: …”, „Plumber CV: …”, „Lebenslauf X: …”, „Резюме X: …”).
const NAME = { pl: /^CV (.+?):/, en: /^(.+?) CV: /, de: /^Lebenslauf (.+?): /, uk: /^Резюме (.+?): / };
// EN w środku zdania małą literą („plumber CVs”), chyba że nazwa ma wielkie litery dalej („Key Account Manager”, „DevOps”).
export const profGen = (p, l = 'pl') => { const n = NAME[l]?.exec(p.title || '')?.[1] || p.name; return l === 'en' && /^[A-Z][a-z]+(?:[ -][a-z][\w-]*)*$/.test(n) ? n[0].toLowerCase() + n.slice(1) : n; };
