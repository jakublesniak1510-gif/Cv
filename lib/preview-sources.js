// Dane, z których powstaje każdy podgląd (scripts/previews.mjs): przy zmianie tych danych obrazek trzeba wygenerować ponownie.
// Skrót zapisany w seo-data/previews.json ([szer, wys, skrót]) porównuje test/previews.test.js.
import { TEMPLATES } from './templates-content/index.js';
import { PROFESSIONS } from './content.js';
export { contentHash } from './content-keys.js';

export const previewSources = () => [
  ...Object.values(TEMPLATES).flatMap((t) => [[`wzor-cv-${t.slug}`, t.slug, t.cv], [`list-motywacyjny-${t.slug}`, t.slug, { letter: t.letter, sample: t.cv.sample }]]),
  ...PROFESSIONS.map((p) => [`cv-${p.slug}`, p.slug, p.sample]),
];
