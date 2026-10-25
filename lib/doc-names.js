// Nazwy plików dokumentów: „Imię_Nazwisko_CV_Stanowisko.pdf” (ASCII, bez polskich znaków, maks. 80 znaków z rozszerzeniem).
// Ta sama nazwa w załącznikach e-maila, w pobieraniu Word i w radzie „Zanim wyślesz” (public/app.js ma kopię docBase do druku).
const UK = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '' };
export const asciiWords = (s) => String(s || '')
  .replace(/[Ѐ-ӿ]/g, (c) => { const l = c.toLowerCase(), t = UK[l] ?? ''; return c !== l && t ? t[0].toUpperCase() + t.slice(1) : t; })
  .replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
export const DOC_KIND = { cv: 'CV', letter: 'List_motywacyjny', interview: 'Przygotowanie_do_rozmowy' };
export function docFile(kind, name, position, lang, ext = 'pdf') {
  const head = [asciiWords(name) || 'Dokument', DOC_KIND[kind] || 'CV'].join('_'), tail = lang && lang !== 'pl' ? `_${lang.toUpperCase()}` : '';
  const room = 80 - head.length - tail.length - ext.length - 2, pos = asciiWords(position).slice(0, Math.max(0, room)).replace(/_+$/, '');
  return `${head}${pos ? `_${pos}` : ''}${tail}.${ext}`;
}
