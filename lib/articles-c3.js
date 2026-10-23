// Poradniki DE/EN pod frazy ATS i dopasowania CV (PR C3): treść w seo-data/c3-de.json i c3-en.json.
// Artykuły trafiają do ART_LANGS pod kluczem polskiego odpowiednika (hreflang), case study „jedno CV, dwa ogłoszenia”
// renderuje lib/landing.js. /de/ratgeber/ats-lebenslauf łączy dwa wcześniejsze artykuły (stare adresy: 301).
import fs from 'node:fs';
const load = (l) => { try { return JSON.parse(fs.readFileSync(new URL(`../seo-data/c3-${l}.json`, import.meta.url), 'utf8')); } catch { return {}; } };
const DE = load('de'), EN = load('en');
const art = (o, slugLang, extra = {}) => (o ? { slugLang, ...extra, ...o } : null);
const pick = (m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v));
export const C3_ARTS = {
  de: pick({ 'jak-przejsc-przez-ats': art(DE['ats-lebenslauf'], 'ats-lebenslauf', { widget: 'scan' }), 'slowa-kluczowe-ats-wedlug-zawodu': art(DE['schluesselwoerter-im-lebenslauf'], 'schluesselwoerter-im-lebenslauf') }),
  en: pick({ 'slowa-kluczowe-ats-wedlug-zawodu': art(EN['cv-keywords'], 'cv-keywords'), 'cv-pod-ai': art(EN['tailor-cv-with-ai'], 'tailor-cv-with-ai') }),
};
// Usunięte tłumaczenia (treść weszła do połączonego artykułu) i przekierowania starych adresów.
// Słowa kluczowe: ten sam adres (cv-keywords / schluesselwoerter-im-lebenslauf) dostaje rozbudowaną treść odpowiadającą
// polskiemu „Słowa kluczowe ATS według zawodu”; wcześniejsze krótsze tłumaczenie „slowa-kluczowe-w-cv” znika z tego adresu.
export const C3_DROP = { de: ['czym-jest-ats', 'slowa-kluczowe-w-cv'], en: ['slowa-kluczowe-w-cv'] };
export const C3_301 = { '/de/ratgeber/was-ist-ein-ats': '/de/ratgeber/ats-lebenslauf', '/de/ratgeber/lebenslauf-durch-ats-checkliste': '/de/ratgeber/ats-lebenslauf' };
export const C3_CASE = { de: DE.case || null, en: EN.case || null };
export const C3_TAILOR_EXT = EN['tailor-ext'] || null;
// Adresy case study (jeśli jest treść w danym języku).
export const C3_CASE_URL = pick({ de: C3_CASE.de && 'de/ratgeber/ein-lebenslauf-zwei-stellenanzeigen', en: C3_CASE.en && 'en/guides/one-cv-two-job-ads' });
