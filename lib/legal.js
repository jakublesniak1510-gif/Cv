import fs from 'node:fs';

// Regulamin i polityka prywatności jako pełne, indeksowane strony w 4 językach.
// Teksty pochodzą z public/legal/<nazwa>.html (blok .legal-pl i bloki .legal-tr[lang]).
export const LEGAL_PAGES = {
  regulamin: {
    pl: { path: 'regulamin', title: 'Regulamin serwisu CV Pod Ogłoszenie', desc: 'Regulamin serwisu CV Pod Ogłoszenie: zasady zamawiania CV i listu motywacyjnego pod ogłoszenie, płatności, dostawy, reklamacji i odstąpienia od umowy.' },
    en: { path: 'en/terms', title: 'Terms of Service', desc: 'Terms of Service of CV Pod Ogłoszenie: how ordering a tailored CV and cover letter works, payments, delivery, complaints and the right of withdrawal.' },
    uk: { path: 'uk/pravyla', title: 'Правила користування сервісом', desc: 'Правила користування сервісом CV Pod Ogłoszenie: замовлення резюме та супровідного листа, оплата, доставка, рекламації та відмова від договору.' },
    de: { path: 'de/agb', title: 'Allgemeine Geschäftsbedingungen (AGB)', desc: 'AGB des Dienstes CV Pod Ogłoszenie: Bestellung von Lebenslauf und Anschreiben zur Stellenanzeige, Zahlung, Lieferung, Reklamation und Widerruf.' },
  },
  prywatnosc: {
    pl: { path: 'polityka-prywatnosci', title: 'Polityka prywatności', desc: 'Polityka prywatności serwisu CV Pod Ogłoszenie: jakie dane zbieramy, w jakim celu, jak długo je przechowujemy, komu je powierzamy i jakie masz prawa.' },
    en: { path: 'en/privacy-policy', title: 'Privacy Policy', desc: 'Privacy Policy of CV Pod Ogłoszenie: what data we collect, why, how long we keep it, who processes it for us and what rights you have.' },
    uk: { path: 'uk/polityka-konfidentsiinosti', title: 'Політика конфіденційності', desc: 'Політика конфіденційності CV Pod Ogłoszenie: які дані ми збираємо, з якою метою, скільки зберігаємо, кому передаємо та які у вас права.' },
    de: { path: 'de/datenschutz', title: 'Datenschutzerklärung', desc: 'Datenschutzerklärung von CV Pod Ogłoszenie: welche Daten wir erheben, wozu, wie lange wir sie speichern, wer sie für uns verarbeitet und Ihre Rechte.' },
  },
};
export const LEGAL_LANGS = ['pl', 'en', 'uk', 'de'];
// ścieżka (bez początkowego „/”) → { name, lang }
export const LEGAL_BY_PATH = Object.fromEntries(Object.entries(LEGAL_PAGES).flatMap(([name, v]) => Object.entries(v).map(([lang, x]) => [x.path, { name, lang }])));
export const legalPath = (name, l) => LEGAL_PAGES[name][l].path;

const files = {};
const fileOf = (name) => (files[name] ??= fs.readFileSync(new URL(`../public/legal/${name}.html`, import.meta.url), 'utf8'));
// Treść dokumentu w jednym języku (bez nagłówka „wróć” i notki o wersji polskiej).
export function legalBody(name, l) {
  const h = fileOf(name);
  const m = l === 'pl' ? /<div class="legal-pl">\n([\s\S]*?)\n<\/div>\n<div class="legal-tr"/.exec(h) : new RegExp(`<div class="legal-tr" lang="${l}">\\n([\\s\\S]*?)\\n</div>\\n(?=<div class="legal-tr"|</div>)`).exec(h);
  if (!m) throw new Error(`Brak wersji ${l} dokumentu ${name}`);
  return m[1];
}
