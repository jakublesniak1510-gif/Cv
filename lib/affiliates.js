import fs from 'node:fs';

// Polecane kursy (linki partnerskie webePartners): dane w seo-data/affiliates.json (edycja bez kodu). Sekcja tylko na polskich
// stronach zawodu (/cv/<slug>), wzoru CV (/wzor-cv/<slug>) i poradnika z zawodem w „related” – pod treścią, nigdy w hero,
// kreatorze ani kasie. Najwyżej 2 kursy, bez cen i obietnic, z dopiskiem o prowizji; link rel="sponsored nofollow noopener".
// Kliknięcie: zdarzenie „aff” (id kursu + strona, bez danych osobowych) → lib/analytics.js → panel SEO.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const FILE = new URL('../seo-data/affiliates.json', import.meta.url);
export const AFF_NOTE = 'Linki partnerskie: jeśli kupisz kurs, otrzymamy prowizję. Cena dla Ciebie się nie zmienia.';
export const MAX_AFF = 2;
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')).kursy || []; } catch { return []; } };
// Tylko kursy z poprawnym linkiem https (kurs „do potwierdzenia” ma pusty link i się nie wyświetla).
export const AFFILIATES = load().filter((k) => /^[a-z0-9-]{2,40}$/.test(k.id) && /^https:\/\/[\w.-]+\/[\w/?=&.-]*$/.test(k.url_partnerski || '') && k.nazwa && Array.isArray(k.zawody));
export const AFF_IDS = new Set(AFFILIATES.map((k) => k.id));
const matches = (pattern, slug) => (pattern.endsWith('*') ? slug.startsWith(pattern.slice(0, -1)) : pattern === slug);
// Kursy dla zawodów (kolejność: najpierw pierwszy zawód, w kolejności z pliku), bez powtórzeń, najwyżej MAX_AFF.
export function coursesFor(slugs) {
  const out = [];
  for (const s of [].concat(slugs || [])) for (const k of AFFILIATES) if (out.length < MAX_AFF && !out.includes(k) && k.zawody.some((z) => matches(z, s))) out.push(k);
  return out;
}
// Sekcja HTML (data-pl: znika w wersjach EN/UK/DE – stripPl w lib/seo.js). page – strona do statystyki kliknięć.
export function affHtml(slugs, page) {
  const ks = coursesFor(slugs);
  if (!ks.length) return '';
  return `<section class="aff" data-pl aria-labelledby="aff-h"><h2 id="aff-h">Kursy, które mogą przydać się w tym zawodzie</h2><p class="aff-note">${esc(AFF_NOTE)}</p><div class="aff-cards">${ks.map((k) => `<div class="aff-card"><b>${esc(k.nazwa)}</b><p>${esc(k.opis || 'Kurs online z certyfikatem ukończenia.')}</p><a class="btn ghost sm" href="${esc(k.url_partnerski)}" rel="sponsored nofollow noopener" target="_blank" data-aff="${esc(k.id)}" data-aff-page="${esc(page)}">Zobacz kurs</a></div>`).join('')}</div></section>`;
}
// Panel SEO i raport: kliknięcia w kursy (zdarzenia aff_click:<id>, aff_page:<id>|<strona>) – od najczęściej klikanych.
export function affSummary(events = {}) {
  const name = Object.fromEntries(load().map((k) => [k.id, k.nazwa]));
  return Object.entries(events).filter(([k]) => k.startsWith('aff_click:')).map(([k, n]) => {
    const id = k.slice(10), pages = Object.entries(events).filter(([p]) => p.startsWith(`aff_page:${id}|`)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, c]) => `${p.slice(10 + id.length)} (${c})`);
    return { id, name: name[id] || id, clicks: n, pages: pages.join(', ') };
  }).sort((a, b) => b.clicks - a.clicks);
}
