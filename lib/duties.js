// Strony „Zakres obowiązków” (/zawod/<slug>/zakres-obowiazkow) dla 30 zawodów z rozbudowaną stroną CV (lib/prof-extra).
// Treść w seo-data/zakres-obowiazkow.json. Do czasu przeglądu językowego strony mają noindex,follow i nie ma ich w mapie strony
// (DUTIES_INDEX = false); po przeglądzie wystarczy przełączyć flagę.
import fs from 'node:fs';
export const DUTIES = (() => { try { return JSON.parse(fs.readFileSync(new URL('../seo-data/zakres-obowiazkow.json', import.meta.url), 'utf8')); } catch { return {}; } })();
export const DUTIES_INDEX = false;
export const dutiesPath = (slug) => `zawod/${slug}/zakres-obowiazkow`;
