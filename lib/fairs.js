import fs from 'node:fs';
import { logEvent } from './events.js';
import { ssrPage, escHtml as esc } from './seo.js';

// Targi pracy (/targi-pracy i /targi-pracy/<miasto>): dane w seo-data/targi.json (jeden plik, aktualizowany co tydzień;
// pola: nazwa, miasto, data, potwierdzona, ostatnia_edycja, miejsce, organizator, dla_kogo, bezplatne, url).
// Potwierdzone wydarzenia mają datę (RRRR-MM-DD, zakres „RRRR-MM-DD – RRRR-MM-DD” albo seria DD.MM.RRRR); po terminie
// przechodzą do „Minione”. Niepotwierdzone: „termin do potwierdzenia” + ostatnia edycja. Schema Event tylko dla potwierdzonych.
// Miasto bez nadchodzących wydarzeń: noindex i poza mapą strony.
// Poza katalogiem data/ (wykluczony w .dockerignore i zasłonięty dyskiem /data na Renderze).
const FILE = new URL('../seo-data/targi.json', import.meta.url);
const plain = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
export const citySlug = (m) => plain(m).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Miasta bez wydarzeń w danych też mają stronę (noindex), żeby link z poradnika nie prowadził do 404.
const EXTRA_CITIES = ['Bydgoszcz', 'Toruń'];
const today = (now) => new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
const pl = (iso) => { const [y, m, d] = iso.split('-'); return `${+d}.${m}.${y}`; };

// Terminy wydarzenia potwierdzonego: [{ start, end }] (ISO), z pola „data”.
export function datesOf(e) {
  const t = String(e.data || '');
  const range = /^(\d{4}-\d{2}-\d{2})(?:\s*[–-]\s*(\d{4}-\d{2}-\d{2}))?$/.exec(t.trim());
  if (range) return [{ start: range[1], end: range[2] || range[1] }];
  return [...t.matchAll(/\b(\d{2})\.(\d{2})\.(\d{4})\b/g)].map(([, d, m, y]) => ({ start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}` }));
}
// Brak albo błąd pliku nie może zatrzymać startu serwera: wtedy pusta lista i wpis w logu.
const readRaw = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { console.error('Targi pracy: nie wczytano seo-data/targi.json –', e.message); Promise.resolve(logEvent('dane', `Targi pracy: nie wczytano seo-data/targi.json – ${e.message}`)).catch(() => {}); return []; } };
export function loadFairs(raw = readRaw()) {
  return raw.filter((e) => e && e.nazwa && e.miasto).map((e) => ({ ...e, slug: citySlug(e.miasto), dates: e.potwierdzona ? datesOf(e) : [] }));
}
let FAIRS = loadFairs();
export const fairs = () => FAIRS;
export const setFairs = (list) => { FAIRS = loadFairs(list); }; // testy
export const cities = () => { const m = new Map(); for (const e of FAIRS) if (!m.has(e.slug)) m.set(e.slug, e.miasto); for (const c of EXTRA_CITIES) if (!m.has(citySlug(c))) m.set(citySlug(c), c); return m; };

// Podział na nadchodzące (potwierdzone z przyszłym terminem + do potwierdzenia) i minione (potwierdzone, wszystkie terminy minęły).
export function split(list, now = Date.now()) {
  const d = today(now), up = [], tbc = [], past = [];
  for (const e of list) {
    if (!e.potwierdzona || !e.dates.length) { tbc.push(e); continue; }
    const next = e.dates.filter((x) => x.end >= d);
    if (next.length) up.push({ ...e, next }); else past.push(e);
  }
  up.sort((a, b) => (a.next[0].start < b.next[0].start ? -1 : 1));
  past.sort((a, b) => (a.dates.at(-1).end > b.dates.at(-1).end ? -1 : 1));
  return { up, tbc, past };
}
const when = (x) => (x.start === x.end ? pl(x.start) : `${pl(x.start)} – ${pl(x.end)}`);
const free = (e) => (/^(tak|nie)\b/i.test(e.bezplatne || '') && !/^nie podano/i.test(e.bezplatne) ? `<br>Wstęp: ${esc(e.bezplatne)}` : '');
const src = (e) => (e.url ? ` <a href="${esc(e.url)}" rel="nofollow noopener" target="_blank">Źródło i zapisy</a>` : '');
const meta = (e) => [e.miejsce && `Miejsce: ${esc(e.miejsce)}`, e.organizator && `Organizator: ${esc(e.organizator)}`, e.dla_kogo && `Dla kogo: ${esc(e.dla_kogo)}`].filter(Boolean).join('<br>');
const card = (e, kind, showCity) => `<div class="fair"><h3>${esc(e.nazwa)}</h3><p><b>${kind === 'up' ? (e.next.length > 1 ? `Terminy: ${e.next.slice(0, 6).map(when).join(', ')}${e.next.length > 6 ? '…' : ''}` : `Termin: ${when(e.next[0])}`) : kind === 'past' ? `Odbyło się: ${e.dates.map(when).slice(-2).join(', ')}` : `Termin do potwierdzenia${e.data && !/^termin do potwierdzenia/i.test(e.data) ? ` (${esc(e.data)})` : ''}`}</b>${showCity ? ` · ${esc(e.miasto)}` : ''}${kind === 'tbc' && e.ostatnia_edycja ? `<br>Ostatnia edycja: ${esc(e.ostatnia_edycja)}` : ''}</p><p class="hint">${meta(e)}${free(e)}${src(e)}</p></div>`;
const section = (title, items, kind, showCity) => (items.length ? `<h2>${title}</h2>${items.map((e) => card(e, kind, showCity)).join('')}` : '');

// Schema Event tylko dla potwierdzonych, nadchodzących (każdy termin serii osobno, najwyżej 6).
const isFree = (e) => /^tak\b/i.test(e.bezplatne || '') && !/do potwierdzenia|nie precyzuje/i.test(e.bezplatne);
export const eventsLd = (up, base) => up.flatMap((e) => e.next.slice(0, 6).map((x) => ({ '@context': 'https://schema.org', '@type': 'Event', name: e.nazwa, startDate: x.start, endDate: x.end,
  eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: /online/i.test(`${e.nazwa} ${e.miejsce || ''}`) ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'Place', name: e.miejsce || e.miasto, address: { '@type': 'PostalAddress', addressLocality: e.miasto.split('/')[0], addressCountry: 'PL' } },
  ...(e.organizator ? { organizer: { '@type': 'Organization', name: e.organizator, ...(e.url ? { url: e.url } : {}) } } : {}), ...(e.url ? { url: e.url } : {}), ...(isFree(e) ? { isAccessibleForFree: true } : {}), description: `Targi pracy: ${e.nazwa} (${e.miasto}).`, inLanguage: 'pl' })));

const GUIDE = `<h2 id="cv-na-targi">Jak przygotować CV na targi pracy</h2>
<p>Na targach rozmawiasz z rekruterem kilka minut, a CV często trafia na stos kilkudziesięciu innych. Dlatego dokument musi bronić się sam: po jednym spojrzeniu ma być jasne, kim jesteś, czego szukasz i co potrafisz.</p>
<ol class="tips"><li><b>Przejrzyj listę wystawców przed wydarzeniem.</b> Organizatorzy publikują ją zwykle kilka dni wcześniej. Wybierz 5–8 firm, sprawdź ich aktualne oferty i przygotuj CV pod te stanowiska, zamiast jednej ogólnej wersji dla wszystkich.</li>
<li><b>Na górze CV napisz, czego szukasz.</b> Jedno zdanie pod imieniem i nazwiskiem, np. „Student III roku automatyki, szukam praktyk w utrzymaniu ruchu od lipca”. Rekruter od razu wie, do którego działu Cię skierować.</li>
<li><b>Jedna strona, czytelny układ.</b> Na stoisku nikt nie czyta trzech stron. Zostaw najważniejsze: wykształcenie, praktyki, projekty, umiejętności i języki. Daty i nazwy uczelni czy firm muszą być łatwe do znalezienia.</li>
<li><b>Projekty i koła naukowe zamiast pustej sekcji doświadczenia.</b> Jeśli nie masz jeszcze pracy w zawodzie, opisz projekt zaliczeniowy, hackathon, wolontariat albo pracę dorywczą – z konkretnym efektem i narzędziami, których używasz.</li>
<li><b>Słowa z ogłoszeń wystawców.</b> Firmy po targach często proszą o aplikację przez system rekrutacyjny, który szuka słów kluczowych. Użyj w CV nazw narzędzi, programów i umiejętności dokładnie w brzmieniu z ich ogłoszeń.</li>
<li><b>Wydrukuj kilka kopii i miej wersję PDF w telefonie.</b> Część wystawców nie przyjmuje papieru i prosi o zeskanowanie kodu QR albo wysłanie CV mailem – wtedy plik musi być gotowy od ręki, z rozsądną nazwą (np. imie-nazwisko-cv.pdf).</li>
<li><b>Dodaj aktualną zgodę na przetwarzanie danych.</b> Polscy pracodawcy wciąż często jej oczekują. Jeśli chcesz, by CV trafiło także do przyszłych rekrutacji, dopisz zgodę na przyszłe procesy.</li>
<li><b>Po rozmowie zanotuj imię rekrutera i ustalenia.</b> W ciągu 1–2 dni wyślij krótką wiadomość z CV dopasowanym do konkretnej oferty i nawiązaniem do rozmowy na stoisku.</li></ol>`;
const CTA = `<div class="cta-box"><div><b>Sprawdź CV przed targami</b><p class="hint">Darmowy skaner pokaże, jak Twoje CV pasuje do ogłoszenia wystawcy i czego w nim brakuje. Gdy wybierzesz konkretną ofertę, przygotujemy CV pod nią w kilka minut.</p></div><div class="cta"><a class="btn" href="/narzedzia/skaner-cv">Darmowy skaner CV</a> <a class="btn ghost" href="/?zamow=1">Zrób CV pod ogłoszenie</a></div></div>`;
const NOTE = '<p class="note">Terminy zbieramy z oficjalnych stron organizatorów i aktualizujemy co tydzień. Przed wyjazdem sprawdź szczegóły i zapisy na stronie wydarzenia (link „Źródło i zapisy”).</p>';

export function hubHtml(now = Date.now()) {
  const { up, tbc } = split(FAIRS, now), cs = [...cities()].map(([slug, name]) => [slug, name, split(FAIRS.filter((e) => e.slug === slug), now)]);
  return `<div class="inner narrow"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Targi pracy</span></nav>
<h1>Targi pracy w Polsce – kalendarz i jak się przygotować</h1>
<p class="lead">Kalendarz targów pracy, dni kariery i akademickich targów w największych miastach: potwierdzone terminy, organizatorzy i linki do zapisów. Poniżej praktyczne wskazówki, jak przygotować CV, żeby rozmowa na stoisku zakończyła się zaproszeniem na rekrutację.</p>
${NOTE}
<h2>Targi pracy według miast</h2><div class="more">${cs.filter(([, , s]) => s.up.length + s.tbc.length).map(([slug, name, s]) => `<a href="/targi-pracy/${slug}">Targi pracy ${esc(name)} (${s.up.length + s.tbc.length})</a>`).join('')}</div>
${section('Najbliższe potwierdzone terminy', up, 'up', true)}
${GUIDE}${CTA}
${section('Zapowiedziane – termin do potwierdzenia', tbc, 'tbc', true)}</div>`;
}
export function cityHtml(slug, now = Date.now()) {
  const name = cities().get(slug), { up, tbc, past } = split(FAIRS.filter((e) => e.slug === slug), now);
  return `<div class="inner narrow"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/targi-pracy">Targi pracy</a> › <span>${esc(name)}</span></nav>
<h1>Targi pracy ${esc(name)} – terminy i zapisy</h1>
<p class="lead">${up.length + tbc.length ? `Nadchodzące targi pracy i dni kariery: ${esc(name)}. Przy każdym wydarzeniu podajemy organizatora, miejsce i link do oficjalnej strony z zapisami.` : `Nie mamy teraz zapowiedzianych targów pracy: ${esc(name)}. Sprawdź kalendarz w innych miastach albo wróć za kilka dni – listę aktualizujemy co tydzień.`}</p>
${NOTE}
${section('Potwierdzone terminy', up, 'up', false)}${section('Zapowiedziane – termin do potwierdzenia', tbc, 'tbc', false)}
<p><a href="/targi-pracy#cv-na-targi">Jak przygotować CV na targi pracy</a> · <a href="/targi-pracy">Targi pracy w innych miastach</a></p>
${CTA}${section('Minione', past, 'past', false)}</div>`;
}

export function fairRoutes(app, base) {
  const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${base}/${p}` })) });
  app.get('/targi-pracy', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    ssrPage(res, base, 'targi-pracy', { title: 'Targi pracy w Polsce: kalendarz i jak przygotować CV', metaDescription: 'Kalendarz targów pracy i dni kariery w Warszawie, Krakowie, Poznaniu, Wrocławiu i innych miastach oraz wskazówki, jak przygotować CV na targi.' }, hubHtml(),
      { data: [crumbs([['Strona główna', ''], ['Targi pracy', 'targi-pracy']]), ...eventsLd(split(FAIRS).up, base)] });
  });
  app.get('/targi-pracy/:city', (req, res, next) => {
    const slug = req.params.city, name = cities().get(slug); if (!name) return next();
    const { up, tbc } = split(FAIRS.filter((e) => e.slug === slug));
    res.set('Cache-Control', 'public, max-age=3600');
    ssrPage(res, base, `targi-pracy/${slug}`, { title: `Targi pracy ${name}: terminy i zapisy`, metaDescription: `Targi pracy i dni kariery: ${name}. Potwierdzone terminy, organizatorzy, linki do zapisów i wskazówki, jak przygotować CV na targi.` }, cityHtml(slug),
      { noindex: !(up.length + tbc.length), data: [crumbs([['Strona główna', ''], ['Targi pracy', 'targi-pracy'], [name, `targi-pracy/${slug}`]]), ...eventsLd(up, base)] });
  });
}
// Mapa strony: hub i miasta z nadchodzącymi wydarzeniami.
export const fairUrls = (now = Date.now()) => ['targi-pracy', ...[...cities().keys()].filter((s) => { const x = split(FAIRS.filter((e) => e.slug === s), now); return x.up.length + x.tbc.length; }).map((s) => `targi-pracy/${s}`)];
