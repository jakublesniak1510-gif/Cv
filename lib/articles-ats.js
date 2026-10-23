// Poradniki o ATS i dopasowaniu CV (PR C2): treść w seo-data/articles-ats.json (z polem sources – fakty i liczby
// tylko ze źródłami), element interaktywny w polu widget (lib/widgets.js), powiązane zawody do „Powiązane”.
import fs from 'node:fs';
const RAW = (() => { try { return JSON.parse(fs.readFileSync(new URL('../seo-data/articles-ats.json', import.meta.url), 'utf8')); } catch { return {}; } })();
const EXTRA = {
  'ats-mity-i-fakty': { widget: 'scan', related: ['obsluga-klienta', 'magazynier', 'ksiegowa'] },
  'format-cv-pod-ats': { widget: 'copy-test', related: ['programista', 'ksiegowa', 'asystentka-biura'] },
  'czy-dopasowywac-cv-do-kazdej-oferty': { widget: 'time-calc', related: ['sprzedawca', 'kasjer', 'obsluga-klienta'] },
  'cv-pod-ai': { widget: 'scan', related: ['programista', 'specjalista-marketingu', 'obsluga-klienta'] },
  'slowa-kluczowe-ats-wedlug-zawodu': { widget: 'keywords', related: ['magazynier', 'kasjer', 'kierowca'] },
};
export const ATS_ARTICLES = Object.entries(RAW).map(([slug, a]) => ({ slug, ...a, ...EXTRA[slug] }));
