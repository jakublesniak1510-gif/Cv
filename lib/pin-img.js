import { Resvg } from '@resvg/resvg-js';
import { PROFESSIONS, ARTICLES } from './content.js';

// Grafiki do Pinteresta (2.11): 1000×1500 dla każdej strony zawodu i poradnika PL pod /og/pin/<slug>.png, jako drugi og:image
// (po 1200×630). Tytuł strony, podtytuł (opis strony), logo i kolory serwisu; treść stron bez zmian. Generowane przy pierwszym
// wejściu i trzymane w pamięci (obrazek zależy tylko od treści, która zmienia się przy wdrożeniu).
const F = new URL('../fonts/', import.meta.url).pathname;
const FONT = { fontFiles: [F + 'Inter-Regular.otf', F + 'Inter-SemiBold.otf'], loadSystemFonts: false, defaultFontFamily: 'Inter' };
const C = { bg: '#2548E8', bg2: '#1B37C4', ink: '#0E1C34', paper: '#FFFFFF', accent: '#FFE45C', soft: '#DCE4FF' };
const W = 1000, H = 1500, PAD = 80;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// resvg nie łamie tekstu: łamanie po słowach według liczby znaków; za długi tekst kończymy wielokropkiem.
const wrap = (s, n, max) => {
  const lines = String(s || '').split(/\s+/).filter(Boolean).reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= n) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);
  return lines.length > max ? [...lines.slice(0, max - 1), lines[max - 1].replace(/[\s,.;:–-]*$/, '') + '…'] : lines;
};
// Logo serwisu (public/logo.svg) jako grupa – bez zewnętrznych plików.
const logo = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 32})"><rect width="32" height="32" rx="8" fill="${C.paper}"/><path d="M10 6.5h8.5l5.5 5.5v13.5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-17a2 2 0 0 1 2-2z" fill="${C.bg}"/><rect x="10.5" y="14.5" width="11" height="3.2" rx="1" fill="${C.accent}"/><rect x="10.5" y="20" width="8" height="1.8" rx=".9" fill="${C.paper}" opacity=".7"/><rect x="10.5" y="10" width="5" height="1.8" rx=".9" fill="${C.paper}" opacity=".7"/></g>`;

export const pinData = (slug) => {
  const p = PROFESSIONS.find((x) => x.slug === slug);
  if (p) return { kind: 'Wzór CV i słowa kluczowe', title: p.title.replace(/:\s*wzór( i wskazówki)?$/i, ''), sub: p.metaDescription, cta: 'Zrób CV pod ogłoszenie' };
  const a = ARTICLES.find((x) => x.slug === slug);
  if (a) return { kind: 'Poradnik', title: a.title, sub: a.metaDescription || a.lead, cta: 'Przeczytaj poradnik' };
  return null;
};

export function pinSvg({ kind, title, sub, cta }) {
  const t = wrap(title, 17, 6), fs = t.length > 4 ? 76 : 88, lh = fs * 1.12, ty = 470;
  // podtytuł: tyle linii, ile mieści się nad przyciskiem (dół ostatniej linii ≥ 40 px nad przyciskiem)
  const sy = ty + t.length * lh + 70, s = wrap(sub, 34, Math.max(1, Math.min(6, Math.floor((H - 250 - 40 - (sy + 40)) / 52) + 1)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="${W - 60}" cy="140" r="220" fill="${C.paper}" opacity=".06"/><circle cx="80" cy="${H - 180}" r="260" fill="${C.paper}" opacity=".05"/>
${logo(PAD, PAD, 88)}<text x="${PAD + 112}" y="${PAD + 58}" font-family="Inter" font-weight="600" font-size="38" fill="${C.paper}">CV Pod Ogłoszenie</text>
<rect x="${PAD}" y="330" width="${kind.length * 17 + 56}" height="64" rx="32" fill="${C.accent}"/><text x="${PAD + 28}" y="373" font-family="Inter" font-weight="600" font-size="28" fill="${C.ink}">${esc(kind)}</text>
${t.map((l, i) => `<text x="${PAD}" y="${ty + (i + 1) * lh - lh * 0.2}" font-family="Inter" font-weight="600" font-size="${fs}" fill="${C.paper}">${esc(l)}</text>`).join('')}
<rect x="${PAD}" y="${sy - 38}" width="120" height="8" rx="4" fill="${C.accent}"/>
${s.map((l, i) => `<text x="${PAD}" y="${sy + 40 + i * 52}" font-family="Inter" font-size="38" fill="${C.soft}">${esc(l)}</text>`).join('')}
<rect x="${PAD}" y="${H - 250}" width="${W - 2 * PAD}" height="120" rx="60" fill="${C.paper}"/>
<text x="${W / 2}" y="${H - 175}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="40" fill="${C.bg}">${esc(cta)} →</text>
<text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="34" fill="${C.paper}" opacity=".9">cvpodogloszenie.pl</text>
</svg>`;
}

const cache = new Map();
export function pinPng(slug) {
  if (cache.has(slug)) return cache.get(slug);
  const d = pinData(slug); if (!d) return null;
  const png = new Resvg(pinSvg(d), { font: FONT, fitTo: { mode: 'width', value: W } }).render().asPng();
  cache.set(slug, png);
  return png;
}
export const pinPath = (slug) => `og/pin/${slug}.png`;
