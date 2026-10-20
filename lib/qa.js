// Kontrola jakości dokumentów po każdej generacji (lokalnie, bez wysyłania danych gdziekolwiek):
// słowa kluczowe z ogłoszenia w CV, długość, placeholdery, firmy i szkoły spoza profilu, język, klauzula RODO.
// Wynik: qa { score 0–100, flags [{ code, level, n? }] } – same kody i liczby, bez treści CV (bezpieczne do alertu i statystyk).
import { makeStore } from './store.js';
import { detectLang } from './lang.js';

export const qaStats = makeStore('qa-stats.json');
export const QA_LABELS = {
  placeholder: 'Placeholder / nawias do uzupełnienia', firma_spoza_profilu: 'Pracodawca spoza danych klienta', szkola_spoza_profilu: 'Szkoła spoza danych klienta',
  jezyk: 'Język dokumentu inny niż wybrany', klauzula: 'Brak lub zła klauzula RODO', pusty: 'Puste CV', brak_listu: 'Brak zamówionego listu',
  dlugosc: 'CV dłuższe niż 2 strony', list_dlugi: 'List dłuższy niż strona', slowa_kluczowe: 'Mało słów kluczowych z ogłoszenia w CV',
};
const CRITICAL = new Set(['placeholder', 'firma_spoza_profilu', 'jezyk', 'klauzula', 'pusty', 'brak_listu']);

const plain = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();
const LEGAL = /\b(sp\.? ?z ?o\.? ?o\.?|sp\.? ?k\.?|s\.? ?a\.?|s\.? ?c\.?|gmbh|ag|kg|ltd|limited|llc|inc|plc|bv|b\.v\.|sro|s\.r\.o\.|group|grupa|polska|poland)\b/g;
const tokens = (s) => plain(s).replace(LEGAL, ' ').split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2);
// Nazwa z CV pasuje do którejś z profilu: zawieranie po normalizacji albo co najmniej połowa słów wspólna.
export function sameName(a, list) {
  const A = tokens(a); if (!A.length) return true;
  const aj = A.join(' ');
  return list.some((b) => { const B = tokens(b); if (!B.length) return false; const bj = B.join(' '); if (aj.includes(bj) || bj.includes(aj)) return true; const common = A.filter((t) => B.includes(t)).length; return common / Math.min(A.length, B.length) >= 0.5; });
}

const PLACEHOLDER = [/\[[^\]\n]{1,60}\]/, /\{\{?[^}\n]{1,60}\}?\}/, /\b(lorem ipsum|todo|tbd)\b/i, /\bx{3,}\b/i, /(nazwa firmy|nazwa stanowiska|twoje imi[eę]|imi[eę] i nazwisko kandydata|your name|company name|name of the company|ihr name|firmenname)/i];
const cvText = (cv = {}) => [cv.headline, cv.summary, ...(cv.experience || []).flatMap((e) => [e.title, e.company, ...(e.bullets || [])]), ...(cv.education || []).flatMap((e) => [e.school, e.degree]), ...(cv.skills || []), ...(cv.languages || []), ...(cv.certificates || []), cv.interests].filter(Boolean).join('\n');

export function checkResult(r, { profile = {}, ad = {}, withLetter = false, pages = null } = {}) {
  const flags = [], add = (code, n) => flags.push({ code, level: CRITICAL.has(code) ? 'critical' : 'warn', ...(n != null ? { n } : {}) });
  const cv = r?.cv || {}, text = cvText(cv), letter = String(r?.letter || ''), lang = r?.lang || 'pl';

  if (!cv.summary && !(cv.experience || []).length && !(cv.skills || []).length) add('pusty');
  const ph = [text, letter, cv.clause || ''].reduce((n, t) => n + PLACEHOLDER.filter((re) => re.test(t)).length, 0);
  if (ph) add('placeholder', ph);

  // Firmy i szkoły: tylko te, które klient podał (nazw firm i szkół model nie tłumaczy).
  const firms = (profile.experience || []).map((e) => e.company).filter(Boolean), schools = (profile.education || []).map((e) => e.school).filter(Boolean);
  const badFirms = (cv.experience || []).filter((e) => e.company && !sameName(e.company, firms)).length;
  if (badFirms) add('firma_spoza_profilu', badFirms);
  const badSchools = (cv.education || []).filter((e) => e.school && !sameName(e.school, schools)).length;
  if (badSchools) add('szkola_spoza_profilu', badSchools);

  // Język: wybrany w kreatorze (gdy nie „auto”) = język wyniku = język tekstu (sprawdzany na prozie: podsumowanie, punkty, list).
  const prose = [cv.summary, ...(cv.experience || []).flatMap((e) => e.bullets || []), letter].filter(Boolean).join('\n');
  if ((ad.lang && ad.lang !== 'auto' && ad.lang !== lang) || (prose.length >= 300 && detectLang(prose) !== lang)) add('jezyk');

  // Klauzula RODO: zawsze z numerem rozporządzenia; po polsku dodatkowo zgoda na rekrutację (w innych językach tylko ostrzeżenie).
  const cl = String(cv.clause || '');
  const clauseOk = /2016\/679/.test(cl) && (lang !== 'pl' || /rekrutac/i.test(cl));
  if (!clauseOk) { if (lang === 'pl') add('klauzula'); else flags.push({ code: 'klauzula', level: 'warn' }); }

  if (withLetter && letter.trim().length < 200) add('brak_listu');
  if (letter && letter.split(/\s+/).length > 450) add('list_dlugi');
  if (pages && pages > 2) add('dlugosc', pages);

  // Słowa kluczowe: te, które model zadeklarował jako użyte w CV, muszą tam być; wymagania „found” – choć jedno słowo w CV.
  const low = plain(text), kw = (r?.keywords || []).filter(Boolean);
  const kwIn = kw.filter((k) => low.includes(plain(k))).length;
  const found = (r?.match?.found || []).filter(Boolean), fIn = found.filter((f) => tokens(f).filter((t) => t.length >= 4).some((t) => low.includes(t.slice(0, 5)))).length;
  const coverage = kw.length ? Math.round((100 * kwIn) / kw.length) : null;
  if ((kw.length >= 3 && kwIn / kw.length < 0.6) || (found.length >= 3 && fIn / found.length < 0.5)) add('slowa_kluczowe', coverage);

  const crit = flags.filter((f) => f.level === 'critical').length, warn = flags.length - crit;
  return { score: Math.max(0, 100 - 30 * crit - 10 * warn), flags, coverage };
}
export const hasCritical = (qa) => !!qa?.flags?.some((f) => f.level === 'critical');

// Statystyki tygodniowe (tydzień od poniedziałku, czas polski): liczba dokumentów, średni wynik, krytyczne, ponowienia, kody flag.
export const weekOf = (t = Date.now()) => { const d = new Date(new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
export async function recordQa(list, at = Date.now()) {
  await qaStats.upsert(weekOf(at), (p = {}) => {
    const x = { docs: 0, scoreSum: 0, critical: 0, retried: 0, fixed: 0, flags: {}, ...p };
    for (const q of list) {
      x.docs++; x.scoreSum += q.score; if (hasCritical(q)) x.critical++; if (q.retried) x.retried++; if (q.retried && !hasCritical(q)) x.fixed++;
      for (const f of q.flags) x.flags[f.code] = (x.flags[f.code] || 0) + 1;
    }
    return x;
  });
}
export async function qaWeeks(n = 12) {
  return Object.values(await qaStats.all()).sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, n)
    .map((w) => ({ id: w.id, docs: w.docs, avg: w.docs ? Math.round(w.scoreSum / w.docs) : null, critical: w.critical, retried: w.retried, fixed: w.fixed, flags: w.flags }));
}
