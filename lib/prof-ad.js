// „CV pod zawód” (bez konkretnego ogłoszenia): zamiast oferty generator dostaje typowe wymagania zawodu z danych serwisu
// (słowa kluczowe ze stron zawodów, a dla 30 zawodów także obowiązki i wymagania z „Zakresu obowiązków”). Klient widzi listę
// w kreatorze i odznacza to, czego nie dotyczy. Zawód spoza listy: tylko nazwa, typowe wymagania dobiera model.
import { PROFESSIONS } from './content.js';
import { DUTIES } from './duties.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, ' ').trim();
const key = (s) => norm(String(s).replace(/\s*\([^)]*\)/g, ''));
const uniq = (a) => a.filter((x, i) => x && a.findIndex((y) => key(y) === key(x)) === i);

// Zawód po nazwie lub adresie strony („magazynier”, „kasjerka”, „cv/kasjer”): dokładne dopasowanie, potem początek nazwy.
export function findProfession(q) {
  const n = norm(q).replace(/^cv /, ''); if (n.length < 3) return null;
  const all = PROFESSIONS.map((p) => ({ p, keys: [norm(p.slug.replace(/-/g, ' ')), norm(p.name), ...norm(p.name).split(' ')] }));
  return (all.find((x) => x.keys.slice(0, 2).includes(n)) || all.find((x) => x.keys.some((k) => k.startsWith(n) || n.startsWith(k) && k.length >= 5)))?.p || null;
}

// Lista do odznaczenia w kreatorze: wymagania niezbędne i mile widziane (gdy jest zakres obowiązków) i słowa kluczowe zawodu.
export function profReqs(q) {
  const p = findProfession(q), d = p && DUTIES[p.slug];
  if (!p) return { slug: null, name: String(q || '').trim().slice(0, 60), reqs: [], duties: [] };
  const reqs = uniq([...(d?.wymagania?.niezbedne || []), ...(p.keywords || []), ...(d?.wymagania?.mile_widziane || [])]).slice(0, 14);
  return { slug: p.slug, name: p.name, reqs, duties: (d?.obowiazki || []).slice(0, 6) };
}

// Tekst „ogłoszenia” dla generatora: nazwa zawodu, wybrane wymagania i typowe obowiązki, z wyraźną informacją,
// że to nie jest konkretna oferta (bez nazwy firmy i bez „Państwa firmy” w CV).
export function profAdText({ name, reqs = [], duties = [] }) {
  const n = String(name || '').trim().slice(0, 60) || 'wybrany zawód';
  return [`CV pod zawód: ${n} (bez konkretnego ogłoszenia – typowe wymagania tego zawodu).`,
    duties.length ? `Typowe obowiązki: ${duties.join('; ')}.` : '',
    reqs.length ? `Typowe wymagania: ${reqs.join('; ')}.` : `Typowe wymagania: dobierz najczęstsze wymagania w ogłoszeniach dla zawodu „${n}” w Polsce.`,
  ].filter(Boolean).join('\n');
}
export const PROF_NOTE = 'To NIE jest konkretne ogłoszenie, tylko typowe wymagania zawodu. Nie wpisuj nazwy firmy (company = "") ani zwrotów o „Państwa firmie”; nagłówek i podsumowanie napisz pod ten zawód. W raporcie dopasowania traktuj wymienione wymagania jak wymagania z ogłoszenia.';
