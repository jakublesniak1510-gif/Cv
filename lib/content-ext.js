// Rozbudowane wersje wybranych stron EN/DE (seo-data/ext-<język>.json): dodatkowe sekcje, pytania i źródła.
// Klucz: „article:<slug PL>”, „prof:<slug PL>”, „tool:<slug PL>”. Fakty i liczby tylko ze źródłami z pola sources.
import fs from 'node:fs';
const load = (l) => { try { return JSON.parse(fs.readFileSync(new URL(`../seo-data/ext-${l}.json`, import.meta.url), 'utf8')); } catch { return {}; } };
export const EXT = { en: load('en'), de: load('de') };
export const extOf = (l, key) => EXT[l]?.[key] || null;
// Dane strony z dołączonym rozszerzeniem (sekcje i pytania na końcu, źródła osobno).
export function withExt(l, key, o) {
  const e = extOf(l, key);
  return e && o ? { ...o, sections: [...(o.sections || []), ...(e.sections || [])], faq: [...(o.faq || []), ...(e.faq || [])], sources: e.sources || [] } : o;
}
