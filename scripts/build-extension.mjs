// Pakuje folder /extension do extension.zip (do wgrania w Chrome Web Store). Bez zależności: ZIP z kompresją deflate.
// Pomija pliki dla sklepu (store/, STORE.md), których nie ma być w paczce rozszerzenia.
import fs from 'node:fs';
import path from 'node:path';
import { zip } from '../lib/zip.js';

const ROOT = new URL('../extension/', import.meta.url).pathname, OUT = new URL('../extension.zip', import.meta.url).pathname;
const SKIP = new Set(['store', 'STORE.md']);
const files = [];
(function walk(dir, rel = '') { for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { if (!rel && SKIP.has(e.name)) continue; const p = path.join(dir, e.name), r = rel ? `${rel}/${e.name}` : e.name; e.isDirectory() ? walk(p, r) : files.push([r, fs.readFileSync(p)]); } })(ROOT);
fs.writeFileSync(OUT, zip(files));
console.log(`extension.zip: ${files.length} plików, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
