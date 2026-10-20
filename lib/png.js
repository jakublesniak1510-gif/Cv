import zlib from 'node:zlib';

// Minimalny PNG bez zależności: odczyt 8-bitowych RGB/RGBA bez przeplotu (takie zapisuje Chromium) i zapis RGB.
// Wystarcza do sklejania obrazka OG karty wyniku z gotowego tła i cyfr (lib/share.js).
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), len = Buffer.alloc(4), crc = Buffer.alloc(4); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]); };

// → { width, height, channels (3|4), data: Buffer RGB(A) wiersz po wierszu }
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('To nie jest PNG');
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || ![2, 6].includes(ct) || d[12]) throw new Error('Nieobsługiwany PNG'); }
    else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
  }
  const ch = ct === 6 ? 4 : 3, stride = w * ch, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, o = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? out[o + i - ch] : 0, b = y ? out[o + i - stride] : 0, c = y && i >= ch ? out[o + i - stride - ch] : 0, x = raw[src + i];
      let v;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[o + i] = v & 255;
    }
  }
  return { width: w, height: h, channels: ch, data: out };
}

export function encodePng(width, height, rgb) {
  const stride = width * 3, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 1; const o = y * stride, r = y * (stride + 1) + 1; for (let i = 0; i < stride; i++) raw[r + i] = (rgb[o + i] - (i >= 3 ? rgb[o + i - 3] : 0)) & 255; } // filtr Sub
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
