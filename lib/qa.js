// Kontrola jakości dokumentów po każdej generacji (lokalnie, bez wysyłania danych gdziekolwiek):
// słowa kluczowe z ogłoszenia w CV, długość, placeholdery, firmy i szkoły spoza profilu, język, klauzula RODO.
// Wynik: qa { score 0–100, flags [{ code, level, n? }] } – same kody i liczby, bez treści CV (bezpieczne do alertu i statystyk).
import { makeStore } from './store.js';
import { detectLang } from './lang.js';
import { linkedinFlags } from './linkedin.js';

export const qaStats = makeStore('qa-stats.json');
export const QA_LABELS = {
  placeholder: 'Placeholder / nawias do uzupełnienia', firma_spoza_profilu: 'Pracodawca spoza danych klienta', firma_z_ogloszenia: 'Pracodawca z ogłoszenia wpisany do doświadczenia', list_chronologia: 'List: kolejność czasowa przy stanowisku bez dat', szkola_spoza_profilu: 'Szkoła spoza danych klienta',
  jezyk: 'Język dokumentu inny niż wybrany', klauzula: 'Brak lub zła klauzula RODO', pusty: 'Puste CV', brak_listu: 'Brak zamówionego listu',
  dlugosc: 'CV dłuższe niż 2 strony', list_dlugi: 'List dłuższy niż strona', slowa_kluczowe: 'Mało słów kluczowych z ogłoszenia w CV',
  li_brak: 'Brak zamówionego profilu LinkedIn', li_dlugosc: 'LinkedIn: nagłówek > 220 albo „Informacje” > 2600 znaków', li_umiejetnosci: 'LinkedIn: mniej niż 10 umiejętności', li_firma_spoza_profilu: 'LinkedIn: pracodawca spoza danych klienta', li_en_brak: 'LinkedIn: brak zamówionej wersji angielskiej',
};
const CRITICAL = new Set(['placeholder', 'firma_spoza_profilu', 'firma_z_ogloszenia', 'jezyk', 'klauzula', 'pusty', 'brak_listu']);

const plain = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();
const LEGAL = /\b(sp\.? ?z ?o\.? ?o\.?|sp\.? ?k\.?|s\.? ?a\.?|s\.? ?c\.?|gmbh|ag|kg|ltd|limited|llc|inc|plc|bv|b\.v\.|sro|s\.r\.o\.|group|grupa|polska|poland)\b/g;
const tokens = (s) => plain(s).replace(LEGAL, ' ').split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2);
// Nazwa z CV pasuje do którejś z profilu: zawieranie po normalizacji albo co najmniej połowa słów wspólna.
export function sameName(a, list) {
  const A = tokens(a); if (!A.length) return true;
  const aj = A.join(' ');
  return list.some((b) => { const B = tokens(b); if (!B.length) return false; const bj = B.join(' '); if (aj.includes(bj) || bj.includes(aj)) return true; const common = A.filter((t) => B.includes(t)).length; return common / Math.min(A.length, B.length) >= 0.5; });
}

// Placeholdery: tylko nawiasy z typowym polem do uzupełnienia (nie „[2019–2021]” ani „[...]”), szablonowe {{pola}},
// lorem ipsum, TODO/TBD wielkimi literami (hiszpańskie „todo” to zwykłe słowo) i frazy typu „nazwa firmy”.
const FIELD = String.raw`imi[eę]|nazwisk\w*|firm\w*|stanowisk\w*|data|dat[ay]|adres\w*|telefon\w*|e-?mail|miast\w*|name|company|position|date|address|phone|city`;
const PLACEHOLDER = [new RegExp(String.raw`\[[^\]\n]{0,40}(?<!\p{L})(?:${FIELD})(?!\p{L})[^\]\n]{0,40}\]`, 'iu'), /\{\{[^}\n]{1,60}\}\}/, /\blorem ipsum\b/i, /\b(?:TODO|TBD)\b/, /\bX{3,}\b/, /(nazwa firmy|nazwa stanowiska|twoje imi[eę]|imi[eę] i nazwisko kandydata|your name|company name|name of the company|ihr name|firmenname)/i];
const cvText = (cv = {}) => [cv.headline, cv.summary, ...(cv.experience || []).flatMap((e) => [e.title, e.company, ...(e.bullets || [])]), ...(cv.education || []).flatMap((e) => [e.school, e.degree]), ...(cv.skills || []), ...(cv.languages || []), ...(cv.certificates || []), cv.interests].filter(Boolean).join('\n');

// Pracodawcy w doświadczeniu CV (28.10, alert „Pracodawca spoza danych klienta”). Sprawdzamy tylko pole „company” pozycji
// doświadczenia: firmę z ogłoszenia wolno wymienić w nagłówku, podsumowaniu i liście. Nazwa jest w porządku, gdy pasuje do firmy
// podanej przez klienta albo jej słowa są gdziekolwiek w jego danych (np. wolontariat w „Dodatkowych informacjach”).
// fromAd: pracodawca z ogłoszenia (r.company) wpisany do doświadczenia, choć klient u niego nie pracował – osobny kod krytyczny.
const profileText = (p = {}) => plain([p.headline, p.summary, p.skills, p.languages, p.certificates, p.interests, p.notes, p.career?.from, p.career?.fit,
  ...(p.experience || []).flatMap((e) => [e.title, e.company, e.desc, e.description, ...(e.bullets || [])]), ...(p.education || []).flatMap((e) => [e.school, e.degree])].filter(Boolean).join(' '));
// Samozatrudnienie (29.10, zamówienie 0db05527): ogólna etykieta zamiast nazwy firmy („Własna działalność gospodarcza”, JDG,
// freelancer…) nie jest obcym pracodawcą, gdy dane klienta wskazują na pracę na swoim (właściciel, prowadziłem firmę…).
const SELF_LABEL = /^(?:(?:wlasna )?dzialalnosc(?: gospodarcza)?|wlasna firma|jdg|samozatrudni\w*|freelanc\w*|wolny strzelec|zlecenia prywatne|prace na zlecenie|gospodarstwo (?:rodzinne|rolne)|self[ -]?employ\w*|freelance|own business|sole trader|selbststandig\w*|freiberuf\w*|einzelunternehm\w*|фоп|самозайнят\w*|приватний підприємець|власна справа|фриланс\w*)$/;
const OWN_WORK = /wlascicie\w*|prowadzil\w* (?:wlasn\w* )?(?:firm|dzialal|sklep|warsztat|gospodarstw)|na wlasny rachunek|wlasn\w* (?:firm|dzialal)|samozatrudn|jdg|freelanc|zlecenia prywatne|gospodarstw\w* rodzinn|self[ -]?employ|own business|owner|founder|selbststandig|inhaber|freiberuf|власник|фоп|самозайнят|підприєм/;
const selfLabel = (name) => SELF_LABEL.test(plain(name).replace(/[„”"'()]/g, '').replace(/\s+/g, ' ').trim());
export function firmIssues(r, profile = {}) {
  const firms = (profile.experience || []).map((e) => e.company).filter(Boolean), schools = (profile.education || []).map((e) => e.school).filter(Boolean);
  const all = profileText(profile), inProfile = (name) => { const T = tokens(name).filter((t) => t.length >= 3); return T.length > 0 && T.every((t) => all.includes(t)); };
  const firmsMissing = !firms.length || (profile.experience || []).some((e) => !e.company);
  const ownWork = OWN_WORK.test(all);
  const adFirm = String(r?.company || '').trim(), out = (r?.cv?.experience || []).map((e) => e.company).filter((c) => c && !sameName(c, firms) && !inProfile(c) && !(ownWork && selfLabel(c)));
  const fromAd = adFirm ? out.filter((c) => sameName(c, [adFirm])) : [];
  return { firms, schools, firmsMissing, inProfile, fromAd, bad: out.filter((c) => !fromAd.includes(c)) };
}
// Konkretny błąd dla ponownej generacji (server.js): nazwy idą tylko do modelu, nie do alertu ani statystyk.
export function qaFixNote(r, profile = {}) {
  const { firms, fromAd, bad } = firmIssues(r, profile), wrong = [...fromAd, ...bad];
  if (!wrong.length) return '';
  return [`Poprzednia wersja CV miała w doświadczeniu pracodawców, których kandydat nie podał: ${wrong.map((x) => `„${x}”`).join(', ')}. Usuń te pozycje albo popraw nazwę.`,
    firms.length ? `W polu "company" doświadczenia używaj wyłącznie nazw z danych kandydata, dokładnie w tym brzmieniu: ${firms.map((x) => `„${x}”`).join(', ')}.` : 'W polu "company" doświadczenia używaj wyłącznie nazw z danych kandydata; jeśli nie podał firmy, zostaw puste.',
    fromAd.length ? 'Firmy z ogłoszenia nigdy nie wpisuj do doświadczenia – kandydat dopiero do niej aplikuje (możesz ją wymienić w podsumowaniu).' : ''].filter(Boolean).join(' ');
}

const CHRONO = /(?<![\p{L}])(?:wczesniej|nastepnie|przedtem|potem|po czym|previously|before that|subsequently|afterwards|zuvor|davor|anschliessend|danach|раніше|потім|згодом)(?![\p{L}])/u;
export function checkResult(r, { profile = {}, ad = {}, withLetter = false, pages = null, linkedin = false, linkedinEn = false } = {}) {
  const flags = [], add = (code, n) => flags.push({ code, level: CRITICAL.has(code) ? 'critical' : 'warn', ...(n != null ? { n } : {}) });
  const cv = r?.cv || {}, text = cvText(cv), letter = String(r?.letter || ''), lang = r?.lang || 'pl';

  if (!cv.summary && !(cv.experience || []).length && !(cv.skills || []).length) add('pusty');
  const ph = [text, letter, cv.clause || ''].reduce((n, t) => n + PLACEHOLDER.filter((re) => re.test(t)).length, 0);
  if (ph) add('placeholder', ph);

  // Firmy i szkoły: tylko te, które klient podał (nazw firm i szkół model nie tłumaczy) – firmIssues niżej.
  const { firms, schools, firmsMissing, inProfile, bad, fromAd } = firmIssues(r, profile);
  if (fromAd.length) flags.push({ code: 'firma_z_ogloszenia', level: 'critical', n: fromAd.length });
  if (bad.length) flags.push({ code: 'firma_spoza_profilu', level: firmsMissing ? 'warn' : 'critical', n: bad.length });
  const badSchools = (cv.education || []).filter((e) => e.school && !sameName(e.school, schools)).length;
  if (badSchools) add('szkola_spoza_profilu', badSchools);

  // Język: wybrany w kreatorze (gdy nie „auto”) = język wyniku = język tekstu (sprawdzany na prozie: podsumowanie, punkty, list).
  const prose = [cv.summary, ...(cv.experience || []).flatMap((e) => e.bullets || []), letter].filter(Boolean).join('\n');
  if ((ad.lang && ad.lang !== 'auto' && ad.lang !== lang) || (prose.length >= 300 && detectLang(prose) !== lang)) add('jezyk');

  // Klauzula RODO: zawsze z numerem rozporządzenia; po polsku dodatkowo zgoda na rekrutację (w innych językach tylko ostrzeżenie).
  const cl = String(cv.clause || '');
  const clauseOk = /2016\/679|\bRODO\b|\bGDPR\b|DSGVO|27 kwietnia 2016/i.test(cl) && (lang !== 'pl' || /rekrutac|rekrutow/i.test(cl));
  if (!clauseOk) { if (lang === 'pl') add('klauzula'); else flags.push({ code: 'klauzula', level: 'warn' }); }

  if (withLetter && letter.trim().length < 200) add('brak_listu');
  // List: „wcześniej”, „następnie”… sugerują kolejność, której nie da się potwierdzić, gdy klient nie podał dat stanowiska (ostrzeżenie).
  const undated = (profile.experience || []).some((e) => (e.title || e.company) && !String(e.from || '').trim() && !String(e.to || '').trim());
  if (letter && undated && CHRONO.test(plain(letter))) add('list_chronologia');
  if (letter && letter.split(/\s+/).length > 450) add('list_dlugi');
  if (pages && pages > 2) add('dlugosc', pages);

  // Słowa kluczowe: te, które model zadeklarował jako użyte w CV, muszą tam być; wymagania „found” – choć jedno słowo w CV.
  const low = plain(text), kw = (r?.keywords || []).filter(Boolean);
  const kwIn = kw.filter((k) => low.includes(plain(k))).length;
  const found = (r?.match?.found || []).filter(Boolean), fIn = found.filter((f) => tokens(f).filter((t) => t.length >= 4).some((t) => low.includes(t.slice(0, 5)))).length;
  const coverage = kw.length ? Math.round((100 * kwIn) / kw.length) : null;
  if ((kw.length >= 3 && kwIn / kw.length < 0.6) || (found.length >= 3 && fIn / found.length < 0.5)) add('slowa_kluczowe', coverage);

  // Profil LinkedIn (dodatek): długości pól, liczba umiejętności i firmy tylko z danych klienta (też w wersji angielskiej).
  for (const l of [r?.linkedin, r?.linkedinEn].filter((x, i) => i === 0 || x)) flags.push(...linkedinFlags(l, { ordered: linkedin, firms, firmsMissing, sameName, inProfile }));
  // Zamówiona wersja angielska profilu, której nie udało się przygotować (generowanie EN nie zatrzymuje zamówienia).
  if (linkedin && linkedinEn && lang !== 'en' && r?.linkedin && !r?.linkedinEn) flags.push({ code: 'li_en_brak', level: 'warn' });

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
