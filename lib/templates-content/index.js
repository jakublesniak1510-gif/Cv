import fs from 'node:fs';

// Treści darmowych wzorów (wspólne dla lib/templates.js i mapy strony / linkowania w lib/seo.js).
export const TEMPLATE_ORDER = ['kasjer', 'sprzedawca', 'magazynier', 'kierowca-kat-c', 'kelner', 'kucharz', 'recepcjonista', 'opiekun-osob-starszych', 'pielegniarka', 'ksiegowa', 'specjalista-obslugi-klienta', 'pracownik-produkcji', 'operator-wozka-widlowego', 'fryzjer', 'kosmetyczka', 'nauczyciel', 'programista', 'grafik', 'przedstawiciel-handlowy', 'pracownik-biurowy', 'asystentka', 'elektryk', 'spawacz', 'mechanik-samochodowy', 'student-bez-doswiadczenia'];
const DIR = new URL('./', import.meta.url);
export const TEMPLATE_LIST = await Promise.all(TEMPLATE_ORDER.filter((s) => fs.existsSync(new URL(`${s}.js`, DIR))).map(async (s) => (await import(new URL(`${s}.js`, DIR))).default));
export const TEMPLATES = Object.fromEntries(TEMPLATE_LIST.map((t) => [t.slug, t]));
export const templateFor = (profSlug) => TEMPLATE_LIST.find((t) => t.profSlug === profSlug) || null;
export const TEMPLATE_URLS = TEMPLATE_LIST.length ? ['wzor-cv', 'list-motywacyjny', ...TEMPLATE_LIST.flatMap((t) => [`wzor-cv/${t.slug}`, `list-motywacyjny/${t.slug}`])] : [];
