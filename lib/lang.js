// Szybkie rozpoznanie języka ogłoszenia (bez AI): litery charakterystyczne dla języka + najczęstsze krótkie słowa.
// Ta sama funkcja jest w public/app.js, żeby kreator wiedział, który język jest w cenie.
const W = (s) => new RegExp(`(?<!\\p{L})(${s})(?!\\p{L})`, 'gu');
const HINTS = {
  pl: [/[ąćęłńśźż]/g, W('i|w|z|na|do|się|oraz|jest|dla|od|nie|lub|pracy|oferujemy|wymagania|doświadczenie')],
  en: [null, W('the|and|of|to|with|for|you|we|are|is|our|in|will|experience|skills')],
  de: [/[äöüß]/g, W('und|der|die|das|mit|für|wir|sie|ist|bei|ein|eine|zu|erfahrung')],
  es: [/[ñ¿¡]/g, W('el|la|los|las|de|y|con|para|en|un|una|ofrecemos|experiencia')],
  fr: [/[àâçèêëîôûœ]/g, W('le|la|les|et|des|pour|avec|vous|nous|est|une|du|expérience')],
};
export function detectLang(text = '') {
  const t = String(text).toLowerCase();
  if ((t.match(/[а-яіїєґ]/g) || []).length > 20) return 'uk';
  let best = 'pl', top = 0;
  for (const [l, [chars, words]] of Object.entries(HINTS)) {
    const s = (chars ? (t.match(chars) || []).length * 2 : 0) + (t.match(words) || []).length;
    if (s > top) { best = l; top = s; }
  }
  return best;
}
export const mainLang = (ad) => (ad.lang && ad.lang !== 'auto' ? ad.lang : detectLang(ad.text));
// Tłumaczenie na język, w którym i tak powstaną wszystkie dokumenty, nie ma sensu — nie liczymy go.
export const usefulExtraLangs = (langs, ads) => langs.filter((l) => !ads.length || !ads.every((a) => mainLang(a) === l));
