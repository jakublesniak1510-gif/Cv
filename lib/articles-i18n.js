import { ARTICLES_DE } from './articles-de.js';
import { ARTICLES_EN } from './articles-en.js';
import { ARTICLES_UK } from './articles-uk.js';
import { NEW_ART_I18N as N } from './content-more.js';
import { C3_ARTS, C3_DROP, C3_TAILOR_EXT } from './articles-c3.js';

// Tłumaczenia poradnika: każdy artykuł ma w danym języku własny adres /<język>/<segment>/<slugLang>.
// Rozbudowa /en/guides/tailor-cv-to-job-ad (C3): dodatkowe sekcje, pytania i źródła na końcu artykułu.
const tailorExt = (en) => { const a = en['jak-dopasowac-cv-do-ogloszenia'], e = C3_TAILOR_EXT; return a && e ? { 'jak-dopasowac-cv-do-ogloszenia': { ...a, sections: [...a.sections, ...e.sections], faq: [...(a.faq || []), ...(e.faq || [])], sources: [...(a.sources || []), ...(e.sources || [])] } } : {}; };
const drop = (o, keys = []) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
export const ART_LANGS = {
  de: { seg: 'ratgeber', data: drop({ ...ARTICLES_DE, ...N.de, ...C3_ARTS.de }, C3_DROP.de) },
  en: { seg: 'guides', data: drop({ ...ARTICLES_EN, ...N.en, ...C3_ARTS.en, ...tailorExt(ARTICLES_EN) }, C3_DROP.en) },
  uk: { seg: 'porady', data: { ...ARTICLES_UK, ...N.uk } },
};
