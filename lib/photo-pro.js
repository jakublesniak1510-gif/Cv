import fs from 'node:fs';

// Zdjęcie do CV (D1, 27.10): tło usuwane lokalnie na serwerze – model MODNet (portrait matting, licencja Apache-2.0,
// models/modnet.onnx, onnxruntime-web/WASM, działa też na Alpine) – bez AI w chmurze i bez kosztu za zdjęcie.
// Tylko kadr, tło i światło: nie zmieniamy rysów twarzy ani wyglądu (bez retuszu, wygładzania, filtrów upiększających).
export const BGS = { jasne: '#F3F4F6', szare: '#D3D7DD', niebieskie: '#D4E3F6' };
export const CROPS = { '3:4': [3, 4], '1:1': [1, 1] };
export const PHOTO_SUM = 'sha256:07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9';
const MODEL = new URL('../models/modnet.onnx', import.meta.url).pathname;
const MAX_IN = 2400;
let lib = null, sess = null, queue = Promise.resolve();

async function load() {
  if (lib) return lib;
  const [ort, canvas] = await Promise.all([import('onnxruntime-web'), import('@napi-rs/canvas')]);
  ort.env.wasm.numThreads = 1;
  canvas.GlobalFonts.registerFromPath(new URL('../fonts/Inter-SemiBold.otf', import.meta.url).pathname, 'InterPh'); // polskie znaki w znaku wodnym
  return (lib = { ort, ...canvas });
}
async function session() {
  const { ort } = await load();
  return (sess ||= ort.InferenceSession.create(fs.readFileSync(MODEL)));
}
// Jedno zdjęcie naraz (CPU i pamięć serwera); kolejne czekają w kolejce.
const serial = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };

export class PhotoError extends Error {}

// Maska sylwetki (0–1) w rozdzielczości ok. 512 px na krótszym boku (wielokrotność 32, jak wymaga model).
async function matte(img) {
  const { ort, createCanvas } = await load(), s = await session();
  const k = 512 / Math.min(img.width, img.height), w = Math.max(32, Math.round((img.width * k) / 32) * 32), h = Math.max(32, Math.round((img.height * k) / 32) * 32);
  const c = createCanvas(w, h), x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, f = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) for (let ch = 0; ch < 3; ch++) f[ch * w * h + i] = (d[i * 4 + ch] / 255 - 0.5) / 0.5;
  const out = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', f, [1, 3, h, w]) });
  return { m: out[s.outputNames[0]].data, w, h, px: d };
}

// Kadr: głowa i ramiona. Szerokość sylwetki rząd po rzędzie – ramiona zaczynają się tam, gdzie sylwetka robi się wyraźnie
// szersza niż głowa; głowa z szyją zajmuje ok. połowy wysokości zdjęcia, nad głową ok. 10% wolnego miejsca. Kadr nie wychodzi
// poza boki zdjęcia (inaczej przy ramionach uciętych na brzegu widać pionową krawędź).
export function cropBox({ m, w, h }, ratio, imgW, imgH) {
  const rows = [], on = (i) => m[i] > 0.5;
  for (let y = 0; y < h; y++) { let n = 0, sx = 0, a = -1, b = -1; for (let x = 0; x < w; x++) if (on(y * w + x)) { n++; sx += x; if (a < 0) a = x; b = x; } rows.push({ n, cx: n ? sx / n : 0, a, b }); }
  const top = rows.findIndex((r) => r.n > w * 0.02); if (top < 0) return null;
  let bottom = h - 1; while (bottom > top && rows[bottom].n <= w * 0.02) bottom--;
  let headMax = 0, shoulders = -1;
  for (let y = top; y <= bottom; y++) {
    const r = rows[y];
    if (y - top > (bottom - top) * 0.12 && headMax && r.n > headMax * 1.6) { shoulders = y; break; }
    headMax = Math.max(headMax, r.n);
  }
  const head = (shoulders > 0 ? shoulders : bottom) - top, sy = imgH / h, sx = imgW / w;
  const headRows = rows.slice(top, top + Math.max(1, Math.round(head * 0.7))).filter((r) => r.n), cx = (headRows.reduce((s, r) => s + r.cx, 0) / headRows.length) * sx;
  let H = (head * sy) / 0.5;
  if (top * sy - H * 0.1 + H > imgH) H = (imgH - top * sy) / 0.9; // nie dokładamy tła pod ramionami
  if ((H * ratio[0]) / ratio[1] > imgW) H = (imgW * ratio[1]) / ratio[0];
  const W = (H * ratio[0]) / ratio[1], x = Math.min(Math.max(0, cx - W / 2), imgW - W);
  return { x, y: top * sy - H * 0.1, w: W, h: H };
}

// Wynik: zdjęcie z jednolitym tłem, w kadrze CV, z wyrównaną jasnością. watermark – darmowy podgląd (mały, ze znakiem „PODGLĄD”).
export function processPhoto(buf, { bg = 'jasne', crop = '3:4', width = 1200, watermark = '', format = 'jpeg' } = {}) {
  return serial(async () => {
    const { createCanvas, loadImage } = await load();
    let img; try { img = await loadImage(buf); } catch { throw new PhotoError('Nie udało się odczytać zdjęcia. Wgraj JPG, PNG lub WebP.'); }
    if (img.width < 200 || img.height < 200) throw new PhotoError('Zdjęcie jest za małe. Wgraj zdjęcie o boku co najmniej 200 px.');
    if (Math.max(img.width, img.height) > MAX_IN) { const k = MAX_IN / Math.max(img.width, img.height), c = createCanvas(Math.round(img.width * k), Math.round(img.height * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); img = c; }
    // Kadr zawsze 3:4 (głowa i ramiona); kwadrat to ten sam kadr na środku, z tłem po bokach – bez dodatkowego przybliżenia.
    const mt = await matte(img), ratio = CROPS[crop] || CROPS['3:4'];
    const box = cropBox(mt, CROPS['3:4'], img.width, img.height);
    if (!box) throw new PhotoError('Nie widać na zdjęciu osoby. Wgraj zdjęcie twarzy na wprost.');
    // Jasność: średnia luminancja sylwetki do ok. 0,5 (tylko światło, bez zmian koloru i rysów), w granicach 0,9–1,25.
    let lum = 0, n = 0;
    for (let i = 0; i < mt.w * mt.h; i++) if (mt.m[i] > 0.5) { lum += (0.299 * mt.px[i * 4] + 0.587 * mt.px[i * 4 + 1] + 0.114 * mt.px[i * 4 + 2]) / 255; n++; }
    const gain = Math.min(1.25, Math.max(0.9, 0.5 / ((lum / n) || 0.5)));
    const mc = createCanvas(mt.w, mt.h), mx = mc.getContext('2d'), md = mx.createImageData(mt.w, mt.h);
    for (let i = 0; i < mt.w * mt.h; i++) { md.data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, mt.m[i])) * 255); }
    mx.putImageData(md, 0, 0);
    const W = Math.round(width), H = Math.round((width * ratio[1]) / ratio[0]), cw = Math.round((H * 3) / 4), k = cw / box.w, ox = (W - cw) / 2;
    const fg = createCanvas(W, H), fx = fg.getContext('2d');
    fx.filter = `brightness(${gain.toFixed(3)})`;
    fx.drawImage(img, ox - box.x * k, -box.y * k, img.width * k, img.height * k);
    fx.filter = 'none'; fx.globalCompositeOperation = 'destination-in';
    fx.drawImage(mc, ox - box.x * k, -box.y * k, img.width * k, img.height * k);
    const out = createCanvas(W, H), o = out.getContext('2d');
    o.fillStyle = BGS[bg] || BGS.jasne; o.fillRect(0, 0, W, H); o.drawImage(fg, 0, 0);
    if (watermark) {
      const fs2 = Math.round(W * 0.09);
      o.save(); o.font = `${fs2}px InterPh`; o.fillStyle = 'rgba(37,72,232,.30)'; o.textAlign = 'center'; o.translate(W / 2, H / 2); o.rotate(-Math.PI / 6);
      for (let y = -H; y <= H; y += fs2 * 2.4) o.fillText(watermark, 0, y);
      o.restore();
    }
    return format === 'png' ? out.encode('png') : out.encode('jpeg', 92);
  });
}
// Darmowy podgląd: 300 px szerokości, JPEG, znak wodny.
export const photoPreview = (buf, opts = {}) => processPhoto(buf, { ...opts, width: 300, watermark: 'PODGLĄD', format: 'jpeg' });
// Pełna wersja: 1200 px szerokości (3:4 → 1200×1600, kwadrat 1200×1200), PNG i JPG.
export const photoFull = (buf, opts = {}) => processPhoto(buf, { ...opts, width: 1200 });
