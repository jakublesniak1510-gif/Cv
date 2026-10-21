// Autor i data aktualizacji treści (E-E-A-T): podpis „Autor · Zaktualizowano” na poradnikach, stronach zawodów,
// wzorach i pracodawcach oraz author/dateModified w danych strukturalnych. Daty to dni ostatniej zmiany treści
// danej strony (seo-data/content-dates.json: { adres: { hash, date } }, scripts/content-dates.mjs), nie data wdrożenia.
import fs from 'node:fs';
import { seller } from './invoice.js';

const DATES = (() => { try { return JSON.parse(fs.readFileSync(new URL('../seo-data/content-dates.json', import.meta.url), 'utf8')); } catch (e) { console.error('Daty treści: nie wczytano seo-data/content-dates.json –', e.message); return {}; } })();
export const AUTHOR_PATH = 'autor/jakub-lesniak';
export const authorName = () => seller().name;
// path: adres strony bez ukośnika na początku, np. cv/kasjer, en/cv/cashier, wzor-cv/kasjer.
export const dateOf = (path) => DATES[path]?.date || null;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dmy = (iso) => iso.split('-').reverse().join('.');
export const personLd = (base) => ({ '@type': 'Person', '@id': `${base}/${AUTHOR_PATH}#osoba`, name: authorName(), url: `${base}/${AUTHOR_PATH}` });
export function byline(path, t = (x) => x) {
  const d = dateOf(path);
  return `<p class="byline">${esc(t('Autor'))}: <a href="/${AUTHOR_PATH}" rel="author">${esc(authorName())}</a>${d ? ` · ${esc(t('Zaktualizowano'))}: <time datetime="${d}">${dmy(d)}</time>` : ''}</p>`;
}
// Strona (WebPage) z autorem i datą zmiany treści; poradniki mają Article (lib/seo.js).
export function pageLd(base, path, name, l = 'pl') {
  const d = dateOf(path);
  return { '@context': 'https://schema.org', '@type': 'WebPage', name, url: `${base}/${path}`, inLanguage: l, author: personLd(base), publisher: { '@id': `${base}/#organizacja` }, ...(d ? { dateModified: d } : {}) };
}
