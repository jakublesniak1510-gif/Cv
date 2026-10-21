// Daty ostatniej zmiany treści (seo-data/content-dates.json) dla „Zaktualizowano” i dateModified/lastmod:
// dla każdej strony (poradnik, zawód, wzór, pracodawca; także wersje EN/UK/DE) data ostatniego commita, który zmienił
// linie tego elementu w plikach z treścią (git blame). Uruchom po zmianie treści: node scripts/content-dates.mjs
// Plik jest w repozytorium, bo na serwerze (obraz Dockera) nie ma historii gita.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const today = day(Math.floor(Date.now() / 1000));
// Czas commita każdej linii (linie niezatwierdzone → dziś).
function lineTimes(file) {
  let out;
  try { out = execFileSync('git', ['blame', '--line-porcelain', '--', file], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n').map(() => null); } // plik jeszcze nie w gicie
  const times = []; let t = 0, uncommitted = false;
  for (const l of out.split('\n')) {
    if (/^[0-9a-f]{40} /.test(l)) uncommitted = l.startsWith('0000000000000000000000000000000000000000');
    else if (l.startsWith('committer-time ')) t = +l.slice(15);
    else if (l.startsWith('\t')) times.push(uncommitted ? null : t);
  }
  return times;
}
// Elementy pliku: początek przy dopasowaniu `re` (grupa 1 = klucz), koniec przed następnym początkiem albo końcem sekcji.
// Pliki z paczkami (lib/prof-more, lib/articles-more) mają sekcje „  pl: [” / „const en = {” itp.: section wybiera jedną z nich.
const SECTION = /^(?: {2}["']?(pl|en|uk|de)["']?: |const (pl|en|uk|de) = )[[{]/i;
// keys: dozwolone klucze (zagnieżdżone obiekty, np. "sample" czy miasta, nie dzielą elementu).
function itemDates(file, re, section = null, keys = null) {
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n'), times = lineTimes(file), starts = [];
  let cur = null;
  lines.forEach((l, i) => {
    const sec = SECTION.exec(l);
    if (sec) { cur = (sec[1] || sec[2]).toLowerCase(); starts.push([null, i]); return; }
    if (section && cur !== section) return;
    const m = re.exec(l), k = m && (m[1] || m[2]); if (k && (!keys || keys.has(k))) starts.push([k, i]);
  });
  const res = {};
  starts.forEach(([k, s], j) => {
    if (!k) return;
    const end = j + 1 < starts.length ? starts[j + 1][1] : lines.length, ts = times.slice(s, end);
    const d = ts.includes(null) ? today : day(Math.max(...ts));
    if (!res[k] || d > res[k]) res[k] = d;
  });
  return res;
}
const SLUG = /^\s*["']?slug["']?:\s*["']([a-z0-9-]+)["']/, KEY = /^ {1,4}(?:["']([a-z0-9-]+)["']|([a-z0-9]+)): \{\s*$/;
const ls = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.js')).map((f) => `${dir}/${f}`);
const merge = (...ms) => { const o = {}; for (const m of ms) for (const [k, d] of Object.entries(m)) if (!o[k] || d > o[k]) o[k] = d; return o; };

const { PROFESSIONS, ARTICLES } = await import(path.join(ROOT, 'lib/content.js'));
const { EMPLOYERS } = await import(path.join(ROOT, 'lib/employers-data.js'));
const PROF = new Set(PROFESSIONS.map((p) => p.slug)), ART = new Set(ARTICLES.map((a) => a.slug)), EMP = new Set(EMPLOYERS.map((e) => e.slug));
const plFiles = ['lib/content.js', 'lib/content-a.js', 'lib/content-b.js', 'lib/content-articles.js', ...ls('lib/prof-more'), ...ls('lib/articles-more')];
const more = [...ls('lib/prof-more'), ...ls('lib/articles-more')];
const pl = merge(...plFiles.map((f) => itemDates(f, SLUG, more.includes(f) ? 'pl' : null)));
const pick = (keys) => Object.fromEntries(keys.filter((k) => pl[k]).sort().map((k) => [k, pl[k]]));
const tpl = merge(...ls('lib/templates-content').filter((f) => !f.endsWith('index.js')).map((f) => itemDates(f, SLUG)));
const emp = merge(itemDates('lib/employers-content.js', KEY, null, EMP), itemDates('seo-data/pracodawcy.json', SLUG, null, EMP));
// Rozbudowa stron zawodów (lib/prof-extra) to też treść strony zawodu PL.
for (const [k, d] of Object.entries(merge(...ls('lib/prof-extra').filter((f) => !f.endsWith('index.js')).map((f) => itemDates(f, KEY, null, PROF))))) if (!pl[k] || d > pl[k]) pl[k] = d;
const out = { prof: pick(PROFESSIONS.map((p) => p.slug)), art: pick(ARTICLES.map((a) => a.slug)), tpl, emp };
for (const l of ['en', 'uk', 'de']) {
  out[`prof-${l}`] = merge(itemDates(`lib/professions-${l}.js`, KEY, null, PROF), ...ls('lib/prof-more').map((f) => itemDates(f, KEY, l, PROF)));
  out[`art-${l}`] = merge(itemDates(`lib/articles-${l}.js`, KEY, null, ART), ...ls('lib/articles-more').map((f) => itemDates(f, KEY, l, ART)));
}
fs.writeFileSync(path.join(ROOT, 'seo-data/content-dates.json'), JSON.stringify(out, null, 1) + '\n');
console.log(Object.entries(out).map(([k, v]) => `${k}: ${Object.keys(v).length}`).join(', '));
