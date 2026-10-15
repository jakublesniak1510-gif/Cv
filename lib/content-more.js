// Rozbudowa treści: nowe zawody (lib/prof-more/batch-*.js) i artykuły (lib/articles-more/a-*.js) w czterech językach,
// plus powiązania artykuł ↔ zawody do linkowania wewnętrznego.
import fs from 'node:fs';

const load = async (dir, key) => {
  const url = new URL(`./${dir}/`, import.meta.url);
  const files = fs.readdirSync(url).filter((f) => f.endsWith('.js')).sort();
  // Uszkodzony plik nie może położyć strony: pomijamy go z ostrzeżeniem w logach.
  const mods = await Promise.all(files.map(async (f) => { try { return (await import(new URL(f, url)))[key]; } catch (e) { console.error(`Treść ${dir}/${f} pominięta:`, e.message); return null; } }));
  return mods.filter(Boolean);
};
const batches = await load('prof-more', 'BATCH'), arts = await load('articles-more', 'ARTS');
const merge = (list, l) => Object.assign({}, ...list.map((b) => b[l] || {}));

export const MORE_PROFESSIONS = batches.flatMap((b) => b.pl);
export const MORE_PROF_I18N = { en: merge(batches, 'en'), uk: merge(batches, 'uk'), de: merge(batches, 'de') };
export const NEW_ARTICLES = arts.flatMap((a) => a.pl);
export const NEW_ART_I18N = { en: merge(arts, 'en'), uk: merge(arts, 'uk'), de: merge(arts, 'de') };

// Zawody powiązane z wcześniejszymi artykułami (nowe artykuły mają własne pole "related").
export const ART_RELATED = {
  'jak-dopasowac-cv-do-ogloszenia': ['magazynier', 'sprzedawca', 'ksiegowa', 'programista', 'kierowca', 'pielegniarka'],
  'czym-jest-ats': ['specjalista-kadr-i-plac', 'rekruter', 'analityk-danych', 'programista', 'specjalista-marketingu', 'ksiegowa'],
  'jak-napisac-list-motywacyjny': ['asystentka-biura', 'nauczyciel', 'specjalista-marketingu', 'recepcjonistka', 'doradca-bankowy', 'pracownik-biurowy'],
  'przerwa-w-zatrudnieniu-w-cv': ['pracownik-biurowy', 'sprzedawca', 'opiekun-osob-starszych', 'pracownik-produkcji', 'kasjer', 'recepcjonistka'],
  'cv-bez-doswiadczenia': ['kasjer', 'kelner', 'barista', 'pracownik-fast-food', 'magazynier', 'konsultant-call-center', 'pomoc-kuchenna'],
  'cv-po-angielsku': ['programista', 'tester-oprogramowania', 'analityk-danych', 'pokojowka', 'kierowca', 'opiekun-osob-starszych'],
  'ile-stron-powinno-miec-cv': ['kierownik-projektu', 'inzynier-budowy', 'ksiegowa', 'kierownik-sklepu', 'lekarz'],
  'umiejetnosci-miekkie-i-twarde-w-cv': ['obsluga-klienta', 'przedstawiciel-handlowy', 'elektryk', 'spawacz', 'rekruter', 'nauczyciel'],
  'zdjecie-w-cv': ['recepcjonistka', 'kelner', 'kosmetyczka', 'fryzjer', 'sprzedawca', 'doradca-bankowy'],
  'klauzula-rodo-w-cv': ['kasjer', 'magazynier', 'pracownik-produkcji', 'ksiegowa', 'pielegniarka'],
  'podsumowanie-zawodowe-w-cv': ['kierownik-sklepu', 'specjalista-marketingu', 'programista', 'przedstawiciel-handlowy', 'grafik'],
  'jak-przygotowac-sie-do-rozmowy-kwalifikacyjnej': ['konsultant-call-center', 'sprzedawca', 'pielegniarka', 'kierowca', 'kucharz', 'magazynier'],
  'pytania-na-rozmowie-kwalifikacyjnej-metoda-star': ['kierownik-projektu', 'rekruter', 'obsluga-klienta', 'kierownik-magazynu', 'specjalista-helpdesk'],
  'email-z-aplikacja-i-podziekowanie-po-rozmowie': ['asystentka-biura', 'specjalista-marketingu', 'ksiegowa', 'grafik', 'office-manager'],
  'jak-przejsc-przez-ats': ['programista', 'analityk-danych', 'specjalista-kadr-i-plac', 'ksiegowa', 'tester-oprogramowania'],
};
