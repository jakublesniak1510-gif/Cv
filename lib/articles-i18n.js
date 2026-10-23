import { ARTICLES_DE } from './articles-de.js';
import { ARTICLES_EN } from './articles-en.js';
import { ARTICLES_UK } from './articles-uk.js';
import { NEW_ART_I18N as N } from './content-more.js';
import { C3_ARTS, C3_DROP } from './articles-c3.js';

// Tłumaczenia poradnika: każdy artykuł ma w danym języku własny adres /<język>/<segment>/<slugLang>.
const drop = (o, keys = []) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
export const ART_LANGS = {
  de: { seg: 'ratgeber', data: drop({ ...ARTICLES_DE, ...N.de, ...C3_ARTS.de }, C3_DROP.de) },
  en: { seg: 'guides', data: { ...ARTICLES_EN, ...N.en, ...C3_ARTS.en } },
  uk: { seg: 'porady', data: { ...ARTICLES_UK, ...N.uk } },
};
