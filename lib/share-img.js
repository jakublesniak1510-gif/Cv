import { Resvg } from '@resvg/resvg-js';
import { SHARE_L, cleanTitle } from './share.js';
import { peekScan } from './growth.js';

// Obrazek wyniku skanera do udostępnienia (PNG 1080×1080 do posta, 1080×1920 do relacji): procent dopasowania i po 3 pozycje
// „co już mam / czego brakuje” – tylko ogólne nazwy wymagań z wyniku trzymanego godzinę w pamięci (rememberScan), bez treści CV,
// bez stanowiska i nazwy pracodawcy. Nic nie jest zapisywane. Tekst rysuje resvg z fontem Inter z repozytorium.
const F = new URL('../fonts/', import.meta.url).pathname;
const FONT = { fontFiles: [F + 'Inter-Regular.otf', F + 'Inter-SemiBold.otf'], loadSystemFonts: false, defaultFontFamily: 'Inter' };
export const SIZES = { square: [1080, 1080], story: [1080, 1920] };
const LANGS = ['pl', 'en', 'uk', 'de'];
const T = {
  pl: { have: 'Co już mam w CV', miss: 'Czego jeszcze brakuje' },
  en: { have: 'Already in my CV', miss: 'Still missing' },
  uk: { have: 'Що вже є в резюме', miss: 'Чого ще бракує' },
  de: { have: 'Schon im Lebenslauf', miss: 'Was noch fehlt' },
};
const C = { bg: '#2548E8', bg2: '#1B37B8', ink: '#0E1C34', mute: '#546178', mark: '#FFE45C', ok: '#0E7C5A', miss: '#B3261E', white: '#FFFFFF' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pctOf = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
// Pozycja na obrazek: bez adresów, e-maili i telefonów (cleanTitle), skrócona do jednej linii.
const item = (s, max) => { const t = cleanTitle(s); return t.length > max ? t.slice(0, max - 1).replace(/[\s,;–-]+\S*$/, '') + '…' : t; };
// Pozycje z nazwą pracodawcy z ogłoszenia (company ze skanera) pomijamy.
export function shareItems(r, company = '') {
  const co = String(company || '').toLowerCase().split(/[^\p{L}\d]+/u).filter((w) => w.length >= 3 && !/^(sp|spółka|z\.?o\.?o|s\.?a|gmbh|ltd|group|polska|poland)$/i.test(w));
  const ok = (x) => x.length > 1 && !co.some((w) => x.toLowerCase().includes(w));
  return { found: (r.found || []).map((x) => item(x, 40)).filter(ok).slice(0, 3), missing: (r.missing || []).map((m) => item(m?.keyword, 40)).filter(ok).slice(0, 3) };
}
// Łamanie nagłówka po słowach (resvg nie łamie tekstu sam); szerokość w znakach dobrana do rozmiaru fontu.
const wrap = (s, n) => s.split(' ').reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= n) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);

function ring(cx, cy, r, p) {
  const th = r * 0.2, rr = r - th / 2, len = 2 * Math.PI * rr, on = (len * p) / 100;
  return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="${th}"/>`
    + (p ? `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${C.mark}" stroke-width="${th}" stroke-linecap="${p < 100 ? 'round' : 'butt'}" stroke-dasharray="${on.toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>` : '')
    + `<text x="${cx}" y="${cy + r * 0.2}" text-anchor="middle" font-size="${Math.round(r * 0.58)}" font-weight="600" fill="#fff">${p}%</text>`;
}
const logo = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 32})"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M10 6.5h8.5l5.5 5.5v13.5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-17a2 2 0 0 1 2-2z" fill="${C.bg}"/><rect x="10.5" y="14.5" width="11" height="3.2" rx="1" fill="${C.mark}"/></g>`
  + `<text x="${x + s * 1.3}" y="${y + s * 0.74}" font-size="${Math.round(s * 0.72)}" font-weight="600" fill="#fff">CV<tspan fill="${C.mark}">Pod</tspan>Ogłoszenie</text>`;
// Biała karta z dwiema listami; zwraca SVG i wysokość.
function lists(x, y, w, t, it, fs) {
  const row = Math.round(fs * 1.55), head = Math.round(fs * 1.9), pad = Math.round(fs * 1.3);
  let out = '', yy = y + pad;
  const sec = (title, arr, color, sign) => {
    if (!arr.length) return;
    out += `<text x="${x + pad}" y="${yy + fs}" font-size="${Math.round(fs * 0.82)}" font-weight="600" fill="${C.mute}" letter-spacing="1">${esc(title.toUpperCase())}</text>`; yy += head;
    for (const a of arr) {
      out += `<circle cx="${x + pad + fs * 0.45}" cy="${yy + fs * 0.62}" r="${fs * 0.45}" fill="${color}"/><text x="${x + pad + fs * 0.45}" y="${yy + fs * 0.92}" text-anchor="middle" font-size="${Math.round(fs * 0.7)}" font-weight="600" fill="#fff">${sign}</text>`
        + `<text x="${x + pad + fs * 1.35}" y="${yy + fs * 0.98}" font-size="${fs}" fill="${C.ink}">${esc(a)}</text>`; yy += row;
    }
    yy += Math.round(fs * 0.6);
  };
  sec(t.have, it.found, C.ok, '✓'); sec(t.miss, it.missing, C.miss, '+');
  const h = yy - y + pad - Math.round(fs * 0.6);
  return { h, svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(fs * 0.9)}" fill="#fff"/>${out}` };
}

export function shareSvg(result, lang = 'pl', format = 'square', company = '') {
  const l = LANGS.includes(lang) ? lang : 'pl', L = SHARE_L[l], t = T[l], [W, H] = SIZES[format] || SIZES.square, story = format === 'story';
  const p = pctOf(result.score), it = shareItems(result, company), head = L.title(p), foot = `${L.cta} · cvpodogloszenie.pl`;
  let body;
  if (story) {
    const lines = wrap(head, 22), hy = 900;
    const card = it.found.length || it.missing.length ? lists(90, hy + (lines.length - 1) * 82 + 70, W - 180, t, it, 36) : { svg: '', h: 0 };
    body = logo(90, 140, 64) + `<text x="90" y="300" font-size="34" font-weight="600" fill="${C.mark}" letter-spacing="2">${esc(L.eyebrow.toUpperCase())}</text>` + ring(540, 560, 200, p)
      + lines.map((s, i) => `<text x="540" y="${hy + i * 82}" text-anchor="middle" font-size="70" font-weight="600" fill="#fff">${esc(s)}</text>`).join('') + card.svg;
  } else {
    const lines = wrap(head, 19), card = it.found.length || it.missing.length ? lists(70, 470, W - 140, t, it, 32) : { svg: '', h: 0 };
    body = logo(70, 64, 54) + ring(225, 300, 150, p) + `<text x="420" y="${300 - (lines.length - 1) * 31 - 14}" font-size="26" font-weight="600" fill="${C.mark}" letter-spacing="2">${esc(L.eyebrow.toUpperCase())}</text>`
      + lines.map((s, i) => `<text x="420" y="${300 - (lines.length - 1) * 31 + 40 + i * 62}" font-size="54" font-weight="600" fill="#fff">${esc(s)}</text>`).join('') + card.svg;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`
    + body + (story ? `<text x="${W / 2}" y="${H - 190}" text-anchor="middle" font-size="38" font-weight="600" fill="#fff">${esc(L.cta)}</text><text x="${W / 2}" y="${H - 135}" text-anchor="middle" font-size="38" fill="${C.mark}">cvpodogloszenie.pl</text>`
      : `<text x="${W / 2}" y="${H - 46}" text-anchor="middle" font-size="30" font-weight="600" fill="#fff">${esc(foot)}</text>`) + '</svg>';
}
export const sharePng = (result, lang, format, company) => new Resvg(shareSvg(result, lang, format, company), { font: FONT }).render().asPng();

// PNG 1080×1080 (f=square) lub 1080×1920 (f=story); po wygaśnięciu wyniku (1 h) 404. limit: limiter z server.js.
export function shareImgRoute(app, limit) {
  app.get('/api/scan/:id/share.png', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!limit(req)) return res.status(429).json({ error: 'Limit obrazków na godzinę. Spróbuj później.' });
    const s = peekScan(req.params.id);
    if (!s) return res.status(404).json({ error: 'Wynik wygasł. Sprawdź CV jeszcze raz.' });
    res.type('png').set('X-Robots-Tag', 'noindex').send(sharePng(s.result, String(req.query.lang || 'pl'), req.query.f === 'story' ? 'story' : 'square', s.company));
  });
}
