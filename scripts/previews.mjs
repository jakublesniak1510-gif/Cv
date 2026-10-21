// Podglądy obrazkowe (WebP) do Google Grafika: pierwsza strona każdego wzoru CV i listu (/wzor-cv/*, /list-motywacyjny/*, 800 px)
// i miniatura przykładowego CV na stronach zawodów (/cv/*, 480 px). Renderujemy te same PDF-y co do pobrania (lib/templates.js)
// i przykład z danych zawodu, pierwszą stronę zamieniamy na PNG (pdftoppm), a potem na WebP (Chromium, jakość dobierana do limitu).
// Uruchamiane przy przygotowaniu wydania (w obrazie Dockera nie ma narzędzi do rasteryzacji), wynik w public/podglad/ i seo-data/previews.json.
//   node scripts/previews.mjs            # wszystkie
//   node scripts/previews.mjs kasjer     # tylko pliki z tym slugiem
//   node scripts/previews.mjs --zmienione  # tylko te, których treść zmieniła się od wygenerowania (skrót w manifeście)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname, OUT = path.join(ROOT, 'public/podglad'), arg = process.argv[2] || '';
const { templatePdf, TEMPLATES } = await import(path.join(ROOT, 'lib/templates.js'));
const { PROFESSIONS } = await import(path.join(ROOT, 'lib/content.js'));
const { renderCv } = await import(path.join(ROOT, 'lib/pdf.js'));
const { previewSources, contentHash } = await import(path.join(ROOT, 'lib/preview-sources.js'));
const HASH = Object.fromEntries(previewSources().map(([name, , data]) => [name, contentHash(data)]));
const { chromium } = await import(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright/index.mjs');
const DESIGN = { tpl: 'nowoczesny', color: 'granat' };
const profPdf = (p) => { const s = p.sample; return renderCv({ lang: 'pl', cv: { name: s.name, headline: s.headline, contact: s.contact || [], summary: s.summary, experience: (s.jobs || []).map((j) => ({ title: j.title, company: j.company, period: j.period, bullets: j.bullets })), education: s.education || [], skills: s.skills || [], languages: s.languages || [], certificates: [], interests: '' } }, DESIGN, '', 'PRZYKŁAD'); };

const manifestFile = path.join(ROOT, 'seo-data/previews.json'), manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const jobs = [
  ...Object.values(TEMPLATES).flatMap((t) => [[`wzor-cv-${t.slug}`, () => templatePdf(t, 'cv'), 800, 80], [`list-motywacyjny-${t.slug}`, () => templatePdf(t, 'letter'), 800, 80]]),
  ...PROFESSIONS.map((p) => [`cv-${p.slug}`, () => profPdf(p), 480, 40]),
].filter(([name]) => (arg === '--zmienione' ? manifest[name]?.[2] !== HASH[name] : !arg || name.endsWith(arg)));

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'podglad-'));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }), page = await b.newPage();
for (const [name, pdf, width, maxKb] of jobs) {
  const pdfFile = path.join(tmp, `${name}.pdf`); fs.writeFileSync(pdfFile, await pdf());
  execFileSync('pdftoppm', ['-png', '-f', '1', '-l', '1', '-singlefile', '-scale-to-x', String(width), '-scale-to-y', '-1', pdfFile, path.join(tmp, name)]);
  const png = fs.readFileSync(path.join(tmp, `${name}.png`)).toString('base64');
  const r = await page.evaluate(async ({ png, maxKb }) => {
    const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
    let q = 0.82, url; do { url = c.toDataURL('image/webp', q); q -= 0.06; } while (url.length * 0.75 > maxKb * 1000 && q > 0.3);
    return { w: c.width, h: c.height, data: url.split(',')[1] };
  }, { png, maxKb });
  const buf = Buffer.from(r.data, 'base64'); fs.writeFileSync(path.join(OUT, `${name}.webp`), buf);
  manifest[name] = [r.w, r.h, HASH[name]];
  console.log(name, `${r.w}×${r.h}`, `${Math.round(buf.length / 1000)} KB`);
}
await b.close();
fs.writeFileSync(manifestFile, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 0).replace(/\],/g, '],\n') + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
