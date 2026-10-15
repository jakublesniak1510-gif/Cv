import { ARTICLES_DE } from './articles-de.js';
import { ARTICLES_EN } from './articles-en.js';
import { ARTICLES_UK } from './articles-uk.js';
import { NEW_ART_I18N as N } from './content-more.js';

// Tłumaczenia poradnika: każdy artykuł ma w danym języku własny adres /<język>/<segment>/<slugLang>.
export const ART_LANGS = {
  de: { seg: 'ratgeber', data: { ...ARTICLES_DE, ...N.de } },
  en: { seg: 'guides', data: { ...ARTICLES_EN, ...N.en } },
  uk: { seg: 'porady', data: { ...ARTICLES_UK, ...N.uk } },
};
