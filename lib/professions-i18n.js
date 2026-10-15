import { PROF_EN, CITIES_EN } from './professions-en.js';
import { PROF_UK, CITIES_UK } from './professions-uk.js';
import { PROF_DE, CITIES_DE } from './professions-de.js';
import { MORE_PROF_I18N as M } from './content-more.js';

// Tłumaczenia podstron zawodów i miast: /<język>/<segment>/<zawód>[/<miasto>].
export const PROF_LANGS = {
  en: { seg: 'cv', prof: { ...PROF_EN, ...M.en }, cities: CITIES_EN },
  uk: { seg: 'rezyume', prof: { ...PROF_UK, ...M.uk }, cities: CITIES_UK },
  de: { seg: 'lebenslauf', prof: { ...PROF_DE, ...M.de }, cities: CITIES_DE },
};
