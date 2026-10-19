// Pakuje folder /extension do extension.zip (do wgrania w Chrome Web Store). Bez zależności: ZIP z kompresją deflate.
// Pomija pliki dla sklepu (store/, STORE.md), których nie ma być w paczce rozszerzenia.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = new URL('../extension/', import.meta.url).pathname, OUT = new URL('../extension.zip', import.meta.url).pathname;
const SKIP = new Set(['store', 'STORE.md']);
const files = [];
(function walk(dir, rel = '') { for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { if (!rel && SKIP.has(e.name)) continue; const p = path.join(dir, e.name), r = rel ? `${rel}/${e.name}` : e.name; e.isDirectory() ? walk(p, r) : files.push([r, fs.readFileSync(p)]); } })(ROOT);
const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const parts = [], central = []; let off = 0;
for (const [name, data] of files) {
  const nb = Buffer.from(name), comp = zlib.deflateRawSync(data, { level: 9 }), crc = crc32(data);
  const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8); h.writeUInt16LE(0, 10); h.writeUInt16LE(0x21, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26); h.writeUInt16LE(0, 28);
  parts.push(h, nb, comp);
  const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
  central.push(c, nb); off += 30 + nb.length + comp.length;
}
const cd = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
fs.writeFileSync(OUT, Buffer.concat([...parts, cd, end]));
console.log(`extension.zip: ${files.length} plików, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
