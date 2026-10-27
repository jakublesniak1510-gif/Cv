// Proces potomny „Zdjęcie do CV” (D1): jeden plik i koniec procesu (lib/photo-pro.js → inWorker).
// Wejście: { buf, frame, job: { crop, width, watermark, format } }; wyjście: { out: Buffer } albo { error, photo }.
// Pamięć: zdjęcie rysujemy raz – tylko kadr, najwyżej 1200×1600 – i z tej kopii robimy plik; po wysłaniu proces się kończy.
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { CROPS, cleanFrame } from './photo-pro.js';

class Bad extends Error {}
const FULL = 1200;

process.once('message', async ({ buf, frame, job }) => {
  try {
    const { crop = '3:4', width = FULL, watermark = '', format = 'jpeg' } = job || {};
    let img; try { img = await loadImage(Buffer.from(buf)); } catch { throw new Bad('Nie udało się odczytać zdjęcia. Wgraj JPG lub PNG.'); }
    if (img.width < 200 || img.height < 200) throw new Bad('Zdjęcie jest za małe. Wgraj zdjęcie o boku co najmniej 200 px.');
    // Kadr 3:4 z oryginału, nie większy niż w oryginale (bez sztucznego powiększania) i nie większy niż 1200×1600.
    const b = cleanFrame(frame, img.width, img.height), bw = Math.round(Math.min(FULL, Math.max(b.w, 300))), base = createCanvas(bw, Math.round((bw * 4) / 3));
    base.getContext('2d').drawImage(img, b.x, b.y, b.w, b.h, 0, 0, base.width, base.height);
    img = null; buf = null;
    // Jasność: średnia luminancja środka kadru (twarz) do ok. 0,5 – tylko światło, bez zmian koloru i rysów, w granicach 0,9–1,25.
    const s = createCanvas(64, 64), sx = s.getContext('2d');
    sx.drawImage(base, base.width * 0.25, base.height * 0.15, base.width * 0.5, base.height * 0.45, 0, 0, 64, 64);
    const d = sx.getImageData(0, 0, 64, 64).data; let lum = 0;
    for (let i = 0; i < d.length; i += 4) lum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const gain = Math.min(1.25, Math.max(0.9, 0.5 / (lum / 4096 || 0.5)));
    // Plik: kadr 3:4 albo kwadrat (górna część kadru 3:4: głowa i ramiona).
    const ratio = CROPS[crop] || CROPS['3:4'], sh = (base.width * ratio[1]) / ratio[0];
    const W = Math.round(Math.min(width, base.width)), H = Math.round((W * ratio[1]) / ratio[0]);
    const out = createCanvas(W, H), o = out.getContext('2d');
    o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
    o.filter = `brightness(${gain.toFixed(3)})`;
    o.drawImage(base, 0, 0, base.width, sh, 0, 0, W, H);
    o.filter = 'none';
    if (watermark) {
      GlobalFonts.registerFromPath(new URL('../fonts/Inter-SemiBold.otf', import.meta.url).pathname, 'InterPh'); // polskie znaki w znaku wodnym
      const fs2 = Math.round(W * 0.09);
      o.save(); o.font = `${fs2}px InterPh`; o.fillStyle = 'rgba(37,72,232,.30)'; o.textAlign = 'center'; o.translate(W / 2, H / 2); o.rotate(-Math.PI / 6);
      for (let y = -H; y <= H; y += fs2 * 2.4) o.fillText(watermark, 0, y);
      o.restore();
    }
    process.send({ out: await (format === 'png' ? out.encode('png') : out.encode('jpeg', 92)) }, () => process.exit(0));
  } catch (e) {
    process.send({ error: e instanceof Bad ? e.message : `Obróbka zdjęcia: ${e.message}`, photo: e instanceof Bad }, () => process.exit(0));
  }
});
