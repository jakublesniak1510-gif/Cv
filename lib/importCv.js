import zlib from 'node:zlib';
import mammoth from 'mammoth';
import { parseCvText } from './generate.js';

export class ImportError extends Error { constructor(message, code) { super(message); this.code = code; } }

async function pdfText(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useSystemFonts: true }).promise;
  let out = '';
  for (let i = 1; i <= Math.min(doc.numPages, 8); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    let lastY = null;
    for (const it of c.items) { const y = it.transform?.[5]; out += (lastY !== null && Math.abs(y - lastY) > 2 ? '\n' : ' ') + it.str; lastY = y; }
    out += '\n';
  }
  return out;
}

// Ochrona przed „zip bomb” w DOCX: mammoth rozpakowuje pliki w całości do pamięci, więc przed nim czytamy
// centralny katalog ZIP i odrzucamy plik, gdy deklarowana suma rozmiarów po rozpakowaniu przekracza 20 MB
// albo stosunek do rozmiaru pliku 50. Rozmiary w katalogu mogą kłamać, więc każdy wpis rozpakowujemy
// też na próbę z twardym limitem wyjścia (maxOutputLength) – bez alokacji ponad limit.
export const ZIP_MAX = 20 * 1024 * 1024, ZIP_RATIO = 50;
const ZIP_BAD = 'Plik Word jest uszkodzony albo za duży.';
export function zipCheck(buf) {
  const bad = () => new ImportError(ZIP_BAD);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw bad();
  const n = buf.readUInt16LE(eocd + 10), cdOff = buf.readUInt32LE(eocd + 16);
  if (n === 0xffff || cdOff === 0xffffffff || n > 5000) throw bad(); // ZIP64 i tysiące wpisów nie występują w zwykłym CV
  let p = cdOff, declared = 0, real = 0;
  for (let k = 0; k < n; k++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw bad();
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commLen = buf.readUInt16LE(p + 32), loc = buf.readUInt32LE(p + 42);
    declared += usize;
    if (declared > ZIP_MAX || declared > buf.length * ZIP_RATIO) throw bad();
    if (loc + 30 > buf.length || buf.readUInt32LE(loc) !== 0x04034b50) throw bad();
    const start = loc + 30 + buf.readUInt16LE(loc + 26) + buf.readUInt16LE(loc + 28);
    if (start + csize > buf.length) throw bad();
    if (method === 8) {
      try { real += zlib.inflateRawSync(buf.subarray(start, start + csize), { maxOutputLength: ZIP_MAX - real + 1 }).length; } catch { throw bad(); }
    } else if (method === 0) real += csize;
    else throw bad();
    if (real > ZIP_MAX || real > buf.length * ZIP_RATIO) throw bad();
    p += 46 + nameLen + extraLen + commLen;
  }
}

// Zwraca tekst ze starego CV (PDF, DOCX lub TXT).
export async function extractText(buf) {
  const head = buf.subarray(0, 5).toString('latin1');
  let text;
  if (head.startsWith('%PDF')) text = await pdfText(buf);
  else if (head.startsWith('PK')) { zipCheck(buf); text = (await mammoth.extractRawText({ buffer: buf })).value; }
  else text = buf.toString('utf8');
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 60) throw new ImportError('Nie udało się odczytać tekstu. Jeśli to skan lub zdjęcie, wpisz dane ręcznie.', 'no_text');
  return text;
}

// Bez AI: wyciągamy tylko pewne dane kontaktowe.
function basic(text) {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '';
  const phone = text.match(/(\+?48[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}/)?.[0] || '';
  const link = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] || '';
  const name = text.split('\n').map((l) => l.trim()).find((l) => /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+){1,2}$/.test(l)) || '';
  return { name, email, phone, link };
}

export async function importCv(buf) {
  const text = await extractText(buf);
  const ai = await parseCvText(text);
  return ai ? { profile: ai, ai: true } : { profile: basic(text), ai: false };
}
