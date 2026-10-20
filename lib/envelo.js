import { xlsx } from './xlsx.js';
import { zip } from './zip.js';
import { renderLetters } from './letters.js';

// Paczka do envelo (Poczta Polska, neoList masowy): ZIP bez folderów, osobny PDF na list (list-01.pdf…)
// i plik sterujący XLSX w głównym katalogu. Adres rozbijamy z pola „adres” (linie albo przecinki):
// [dział/organizacja…], „ul. X 12[/3][ lok. 4]”, [pok./bud. …], „00-000 Miasto”.
export const ENVELO_GROUPS = [[0, 'Odbiorca'], [11, 'Produkt'], [18, 'Parametry druku'], [25, 'Dodatkowe dane']];
export const ENVELO_HEAD = ['Zwrot grzecznościowy', 'Envelo ID', 'Imię', 'Nazwisko', 'Nazwa firmy', 'Ulica lub skrytka pocztowa', 'Nr budynku', 'Nr lokalu', 'Kod pocztowy', 'Miasto', 'Kraj', 'Typ produktu', 'Przesyłka rejestrowana', 'Wycofane (Przesyłka priorytetowa)', 'ZPO', 'ID szablonu papeterii listu', 'ID szablonu treści listu', 'Wskazanie nazwy pliku PDF', 'Kolor', 'Duplex', 'Nadruk adresu na osobnej kartce', 'Generowanie strony adresowej', 'Tekst ZPO', 'Identyfikator insertu', 'Identyfikator papieru', 'Pole informacyjne nadawcy'];
const MAX_ZIP = 50 * 1024 * 1024;
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const POSTAL = /^(\d{2}-\d{3})\s+(.+)$/;
const STREET = /^(.*?\S)\s+(\d+[a-zA-Z]?(?:\s*[/-]\s*\d+[a-zA-Z]?)?)(?:\s*(?:lok\.?|m\.)\s*([0-9a-zA-Z/]+))?$/;
const EXTRA = /^(pok\.|pokój|bud\.|budynek|piętro|p\.|lok\.)/i;

// Fragment wyglądający jak adres (ulica z numerem, kod pocztowy) – nie trafia do nazwy adresata.
const ADDR_LIKE = /^(ul\.|al\.|pl\.|os\.|plac\b|aleja\b|rynek\b|wybrzeże\b)|\d{2}-\d{3}/i;
const dedupe = (list) => { const seen = new Set(); return list.filter((x) => { const k = x.toLowerCase(); if (!x || seen.has(k)) return false; seen.add(k); return true; }); };

// { company, street, building, flat, postal, city } albo { error }.
// Nawiasy „(bud. H-14, pok. 407)” wycinamy przed podziałem po przecinkach; ich treść to dopisek do nazwy adresata.
// Nazwa adresata: części adresu przed ulicą, a gdy adres zaczyna się od ulicy – dział i organizacja z kontaktu.
export function parseAddress(c) {
  const notes = [];
  const addr = String(c.address || '').replace(/\(([^()]*)\)/g, (_, x) => { notes.push(...x.split(/\s*[;,]\s*/).map(clean)); return ' '; });
  const parts = addr.split(/\s*[\n;,]\s*/).map(clean).filter(Boolean);
  const pi = parts.findIndex((x) => POSTAL.test(x));
  if (pi < 0) return { error: 'brak kodu pocztowego' };
  const [, postal, cityRaw] = parts[pi].match(POSTAL), city = clean(cityRaw);
  let si = -1, m = null;
  for (let i = pi - 1; i >= 0; i--) { if (EXTRA.test(parts[i])) continue; const mm = parts[i].match(STREET); if (mm) { si = i; m = mm; } break; }
  if (si < 0) return { error: 'nie da się rozpoznać ulicy i numeru' };
  let flat = m[3] || '';
  const extras = [];
  for (const x of parts.slice(si + 1, pi)) { const l = x.match(/^lok\.?\s*(\S+)$/i); if (l && !flat) flat = l[1]; else extras.push(x); }
  const before = parts.slice(0, si).filter((x) => !ADDR_LIKE.test(x));
  const name = before.length ? before : [c.dept, c.org].map(clean);
  const company = dedupe([...name, ...notes, ...extras].filter((x) => x && !ADDR_LIKE.test(x))).join(', ');
  const street = clean(m[1]), building = m[2].replace(/\s+/g, '');
  if (!company) return { error: 'brak nazwy odbiorcy' };
  if (company.length > 150) return { error: 'nazwa odbiorcy dłuższa niż 150 znaków' };
  if (street.length > 35) return { error: 'ulica dłuższa niż 35 znaków' };
  if (building.length > 10 || flat.length > 10) return { error: 'numer budynku lub lokalu za długi' };
  if (city.length > 30) return { error: 'miasto dłuższe niż 30 znaków' };
  return { company, street, building, flat, postal, city };
}

export function enveloRow(a, file, tag) {
  return ['', '', '', '', a.company, a.street, a.building, a.flat, a.postal, a.city, 'Polska', 1, 'N', '', 'N', 1, '', file, 'N', 'S', 'Y', 'Y', '', '', '', tag];
}

// Zwraca { zip, ok: [kontakty w paczce], skipped: [{ name, reason }] }.
export async function buildEnvelo(list, { base, now = Date.now() } = {}) {
  const ok = [], skipped = [], rows = [], files = [];
  const g = Array(ENVELO_HEAD.length).fill(''); for (const [i, t] of ENVELO_GROUPS) g[i] = t;
  const day = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }), tag = `CVPO-${day}`;
  const parsed = list.map((c) => [c, parseAddress(c)]).filter(([c, a]) => (a.error ? (skipped.push({ name: c.org || c.email || c.id, reason: a.error }), false) : true));
  const pad = String(parsed.length).length < 2 ? 2 : String(parsed.length).length;
  for (const [c, a] of parsed) {
    const file = `list-${String(ok.length + 1).padStart(pad, '0')}.pdf`;
    files.push([file, await renderLetters([c], { base, now })]);
    rows.push(enveloRow(a, file, tag)); ok.push(c);
  }
  if (!ok.length) return { zip: null, ok, skipped, day };
  const out = zip([[`envelo-${day}.xlsx`, xlsx([g, ENVELO_HEAD, ...rows])], ...files]);
  if (out.length > MAX_ZIP) throw new Error('Paczka przekracza 50 MB – zaznacz mniej kontaktów.');
  return { zip: out, ok, skipped, day };
}
