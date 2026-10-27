// Autor i data aktualizacji treści (E-E-A-T): podpis „Autor: Redakcja CV Pod Ogłoszenie · Zaktualizowano” na poradnikach,
// stronach zawodów, wzorach i pracodawcach oraz author (Organization) i dateModified w danych strukturalnych. Imię i nazwisko
// właściciela tylko na /kontakt i w dokumentach, które tego wymagają (regulamin, polityka prywatności, faktury) – prośba z 27.10. Daty to dni ostatniej zmiany treści
// danej strony (seo-data/content-dates.json: { adres: { hash, date } }, scripts/content-dates.mjs), nie data wdrożenia.
import fs from 'node:fs';

const DATES = (() => { try { return JSON.parse(fs.readFileSync(new URL('../seo-data/content-dates.json', import.meta.url), 'utf8')); } catch (e) { console.error('Daty treści: nie wczytano seo-data/content-dates.json –', e.message); return {}; } })();
// Dawna strona autora: przekierowanie 301 na zasady redakcyjne (lib/seo.js).
export const OLD_AUTHOR_PATH = 'autor/jakub-lesniak';
export const AUTHOR_NAME = 'Redakcja CV Pod Ogłoszenie';
export const AUTHOR_URL = 'zasady-redakcyjne';
// path: adres strony bez ukośnika na początku, np. cv/kasjer, en/cv/cashier, wzor-cv/kasjer.
export const dateOf = (path) => DATES[path]?.date || null;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dmy = (iso) => iso.split('-').reverse().join('.');
export const authorLd = (base) => ({ '@type': 'Organization', '@id': `${base}/#organizacja`, name: 'CV Pod Ogłoszenie', url: `${base}/` });
export function byline(path, t = (x) => x) {
  const d = dateOf(path);
  return `<p class="byline">${esc(t('Autor'))}: <a href="/${AUTHOR_URL}" rel="author">${esc(t(AUTHOR_NAME))}</a>${d ? ` · ${esc(t('Zaktualizowano'))}: <time datetime="${d}">${dmy(d)}</time>` : ''}</p>`;
}
// Strona (WebPage) z autorem i datą zmiany treści; poradniki mają Article (lib/seo.js).
export function pageLd(base, path, name, l = 'pl') {
  const d = dateOf(path);
  return { '@context': 'https://schema.org', '@type': 'WebPage', name, url: `${base}/${path}`, inLanguage: l, author: authorLd(base), publisher: { '@id': `${base}/#organizacja` }, ...(d ? { dateModified: d } : {}) };
}
