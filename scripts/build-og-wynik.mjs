// Jednorazowo (przy zmianie wyglądu): tła obrazka OG karty wyniku skanera (1200×630, 4 języki) i cyfry „0–9%” do wstawiania wyniku.
// Rysuje Chromium z Playwrighta (narzędzie programisty, nie zależność serwisu); serwer tylko skleja gotowe PNG (lib/share.js).
// Uruchom: node scripts/build-og-wynik.mjs  (Playwright: PLAYWRIGHT=/ścieżka/do/playwright/index.mjs, domyślnie globalny).
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs');
const OUT = new URL('../lib/og-wynik/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const LOGO = fs.readFileSync(new URL('../public/logo.svg', import.meta.url), 'utf8').replace(/width="512" height="512"/, 'width="56" height="56"');
const T = {
  pl: { tag: 'Wynik skanera CV', head: 'Moje CV pasuje do oferty w', cta: 'Sprawdź swoje CV za darmo' },
  en: { tag: 'CV scanner result', head: 'How well my CV matches the job offer:', cta: 'Check your CV for free' },
  uk: { tag: 'Результат сканера резюме', head: 'Моє резюме відповідає вакансії на', cta: 'Перевірте своє резюме безкоштовно' },
  de: { tag: 'Ergebnis des Lebenslauf-Scanners', head: 'So gut passt mein Lebenslauf zur Stelle:', cta: 'Prüfen Sie Ihren Lebenslauf kostenlos' },
};
const page = (t) => `<!doctype html><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#2548E8;color:#fff;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.brand{position:absolute;left:80px;top:72px;display:flex;align-items:center;gap:18px;font:600 34px Inter}.logo{width:68px;height:68px;border:3px solid #fff;border-radius:16px;display:grid;place-items:center;overflow:hidden}
.col{position:absolute;left:80px;top:188px;bottom:80px;width:620px;display:flex;flex-direction:column;align-items:flex-start}
.tag{font:600 24px Inter;color:#C9D4FF;letter-spacing:.01em;margin-bottom:14px}
h1{font:800 54px/1.12 Inter;letter-spacing:-.02em}
.cta{margin-top:auto;background:#FFE45C;color:#0E1C34;font:700 26px Inter;padding:14px 24px;border-radius:14px;white-space:nowrap}
.dom{position:absolute;right:80px;bottom:28px;font:500 22px Inter;color:#C9D4FF}</style>
<div class="brand"><span class="logo">${LOGO}</span>CV Pod Ogłoszenie</div><div class="col"><div class="tag">${t.tag}</div><h1>${t.head}</h1><div class="cta">${t.cta} →</div></div><div class="dom">cvpodogloszenie.pl</div>`;

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const [l, t] of Object.entries(T)) { await p.setContent(page(t)); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${OUT}${l}.png` }); }
// Cyfry: białe na przezroczystym tle, każda w osobnej komórce; szerokości z measureText (bez kerningu).
const glyphs = await p.evaluate(async () => {
  await document.fonts.load('800 96px Inter');
  const CH = '0123456789%', SIZE = 96, CELL = 100, H = 120, BASE = 100, c = document.createElement('canvas'); c.width = CELL * CH.length; c.height = H;
  const x = c.getContext('2d'); x.font = `800 ${SIZE}px Inter`; x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
  const adv = [...CH].map((ch, i) => { x.fillText(ch, i * CELL, BASE); return Math.round(x.measureText(ch).width); });
  return { png: c.toDataURL('image/png'), meta: { chars: CH, cell: CELL, height: H, baseline: BASE, capHeight: Math.round(x.measureText('0').actualBoundingBoxAscent), advances: adv } };
});
fs.writeFileSync(`${OUT}digits.png`, Buffer.from(glyphs.png.split(',')[1], 'base64'));
fs.writeFileSync(`${OUT}digits.json`, JSON.stringify(glyphs.meta) + '\n');
await browser.close();
console.log('lib/og-wynik: pl/en/uk/de.png + digits.png/json', glyphs.meta);
