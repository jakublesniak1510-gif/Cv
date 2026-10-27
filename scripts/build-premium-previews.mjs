// Podglądy szablonów premium (D2) na stronę /szablony-premium: DOCX → PDF (LibreOffice) → strona 1 jako JPG 520 px
// ze znakiem wodnym „PODGLĄD”. Uruchamiane ręcznie po zmianie szablonów (potrzebny soffice); wynik w public/media/szablony-premium.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { PREMIUM, premiumDocx } from '../lib/premium-templates.js';

const OUT = new URL('../public/media/szablony-premium/', import.meta.url).pathname, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prem-'));
fs.mkdirSync(OUT, { recursive: true });
GlobalFonts.registerFromPath(new URL('../fonts/Inter-SemiBold.otf', import.meta.url).pathname, 'InterPv');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
for (const t of PREMIUM) {
  const docx = path.join(tmp, `${t.slug}.docx`);
  fs.writeFileSync(docx, await premiumDocx(t));
  execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', tmp, docx], { stdio: 'ignore' });
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(tmp, `${t.slug}.pdf`))), isEvalSupported: false, verbosity: 0 }).promise;
  const page = await doc.getPage(1), W = 520, vp = page.getViewport({ scale: W / page.getViewport({ scale: 1 }).width }), H = Math.round(vp.height);
  const c = createCanvas(W, H), o = c.getContext('2d');
  o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
  await page.render({ canvasContext: o, viewport: vp }).promise;
  o.save(); o.font = '26px InterPv'; o.fillStyle = 'rgba(37,72,232,.22)'; o.textAlign = 'center'; o.translate(W / 2, H / 2); o.rotate(-Math.PI / 6);
  for (let y = -H; y <= H; y += 90) o.fillText('PODGLĄD · cvpodogloszenie.pl', 0, y);
  o.restore();
  fs.writeFileSync(path.join(OUT, `${t.slug}.jpg`), await c.encode('jpeg', 78));
  await doc.destroy();
  console.log(t.slug, W, H);
}
fs.rmSync(tmp, { recursive: true, force: true });
