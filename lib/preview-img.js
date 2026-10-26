import { Resvg } from '@resvg/resvg-js';

// Podgląd przed płatnością jako obrazek (blok A, 26.10): serwer nie oddaje tekstu podsumowania, tylko PNG 1000 px szerokości
// z imieniem, nagłówkiem, pierwszymi 2 zdaniami podsumowania (reszta jako rozmyte linie), 5 słowami kluczowymi i ukośnym
// znakiem wodnym „PODGLĄD · cvpodogloszenie.pl”. Pełny wynik zostaje w pamięci podglądów (lib/preview.js) do użycia po płatności.
const F = new URL('../fonts/', import.meta.url).pathname;
const FONT = { fontFiles: [F + 'Inter-Regular.otf', F + 'Inter-SemiBold.otf'], loadSystemFonts: false, defaultFontFamily: 'Inter' };
const C = { ink: '#0E1C34', mute: '#546178', brand: '#2548E8', chip: '#EEF2FF', line: '#D6DCE8', mark: '#2548E8' };
// Szerokość 1000 px; na telefonie (narrow) 600 px z większym tekstem względem szerokości, żeby był czytelny po przeskalowaniu.
const SIZE = { wide: { W: 1000, PAD: 48, wrap: 72, f: 1 }, narrow: { W: 600, PAD: 28, wrap: 38, f: 1.12 } };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Pierwsze n zdań bez gubienia początku: granica po kropce/!/? ze spacją, skróty (ok., np., m.in.) nie kończą zdania.
export function firstSentences(t, n) {
  return String(t || '').trim().split(/(?<=[.!?])\s+/).reduce((a, x) => (a.length && /(^|\s)(ok|np|m\.in|tj|tzw|ds|ul|nr|dr|mgr|inż|godz|r|z\.o\.o|e\.g|i\.e|z\.B|bzw|ca)\.$/i.test(a[a.length - 1]) ? [...a.slice(0, -1), `${a[a.length - 1]} ${x}`] : [...a, x]), []).slice(0, n).join(' ');
}
// Łamanie po słowach (resvg nie łamie tekstu); szerokość w znakach dobrana do rozmiaru fontu.
const wrap = (s, n) => String(s || '').split(/\s+/).filter(Boolean).reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= n) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);
const T = {
  pl: { foot: 'Pełne CV po płatności', mark: 'PODGLĄD · cvpodogloszenie.pl', kw: 'Słowa kluczowe z ogłoszenia w Twoim CV' },
  en: { foot: 'Full CV after payment', mark: 'PREVIEW · cvpodogloszenie.pl', kw: 'Keywords from the job ad in your CV' },
  uk: { foot: 'Повне резюме після оплати', mark: 'ПЕРЕГЛЯД · cvpodogloszenie.pl', kw: 'Ключові слова з вакансії у вашому резюме' },
  de: { foot: 'Vollständiger Lebenslauf nach der Zahlung', mark: 'VORSCHAU · cvpodogloszenie.pl', kw: 'Schlüsselwörter aus der Anzeige in Ihrem Lebenslauf' },
};

export function previewSvg({ name = '', headline = '', summary = '', keywords = [] }, lang = 'pl', size = 'wide') {
  const t = T[lang] || T.pl, { W, PAD, wrap: wn, f } = SIZE[size] || SIZE.wide, fs = (n) => Math.round(n * f);
  const lines = wrap(firstSentences(summary, 2), wn).slice(0, 7);
  let y = PAD + 34, body = '';
  body += `<text x="${PAD}" y="${y}" font-size="${fs(34)}" font-weight="600" fill="${C.ink}">${esc(String(name).slice(0, 60))}</text>`; y += fs(38);
  body += `<text x="${PAD}" y="${y}" font-size="${fs(22)}" font-weight="600" fill="${C.brand}">${esc(String(headline).slice(0, 70))}</text>`; y += fs(46);
  for (const l of lines) { body += `<text x="${PAD}" y="${y}" font-size="${fs(21)}" fill="${C.ink}">${esc(l)}</text>`; y += fs(31); }
  // Dalsza część podsumowania i CV: tylko rozmyte, szare paski (bez tekstu).
  for (const w of [0.92, 0.84, 0.6]) { body += `<rect x="${PAD}" y="${y - 15}" width="${Math.round((W - 2 * PAD) * w)}" height="14" rx="7" fill="${C.line}" filter="url(#b)"/>`; y += 28; }
  y += 14;
  body += `<text x="${PAD}" y="${y}" font-size="16" fill="${C.mute}">${esc(t.kw)}</text>`; y += 16;
  let x = PAD, row = y;
  for (const k of keywords.slice(0, 5).map((s) => String(s).slice(0, 40))) {
    const w = Math.round(k.length * 10.2 * f + 28);
    if (x + w > W - PAD) { x = PAD; row += 46; }
    body += `<rect x="${x}" y="${row}" width="${w}" height="36" rx="18" fill="${C.chip}"/><text x="${x + 14}" y="${row + 24}" font-size="${fs(17)}" fill="${C.ink}">${esc(k)}</text>`; x += w + 10;
  }
  y = row + 36 + 40;
  body += `<text x="${PAD}" y="${y}" font-size="18" font-weight="600" fill="${C.brand}">${esc(t.foot)}</text>`;
  const H = y + PAD - 10;
  // Znak wodny: ukośne, powtarzane napisy na całej powierzchni (półprzezroczyste, nad treścią).
  let wm = '';
  for (let yy = -200; yy < H + 300; yy += 130) for (let xx = -300; xx < W + 300; xx += 520) wm += `<text x="${xx}" y="${yy}" font-size="26" font-weight="600" fill="${C.mark}" fill-opacity="0.13" transform="rotate(-24 ${xx} ${yy})">${esc(t.mark)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs><rect width="${W}" height="${H}" rx="18" fill="#fff"/>${body}${wm}</svg>`;
}
export const previewPng = (data, lang, size = 'wide') => new Resvg(previewSvg(data, lang, size), { font: FONT, fitTo: { mode: 'width', value: (SIZE[size] || SIZE.wide).W } }).render().asPng();
export const previewDataUrl = (data, lang, size) => `data:image/png;base64,${Buffer.from(previewPng(data, lang, size)).toString('base64')}`;
