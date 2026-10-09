import { PROF_EN, CITIES_EN } from './professions-en.js';
import { PROF_UK, CITIES_UK } from './professions-uk.js';
import { PROF_DE, CITIES_DE } from './professions-de.js';

// Tłumaczenia podstron zawodów i miast: /<język>/<segment>/<zawód>[/<miasto>].
export const PROF_LANGS = {
  en: { seg: 'cv', prof: PROF_EN, cities: CITIES_EN },
  uk: { seg: 'rezyume', prof: PROF_UK, cities: CITIES_UK },
  de: { seg: 'lebenslauf', prof: PROF_DE, cities: CITIES_DE },
};
