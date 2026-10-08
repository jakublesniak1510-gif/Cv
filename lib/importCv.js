import mammoth from 'mammoth';
import { parseCvText } from './generate.js';

export class ImportError extends Error {}

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

// Zwraca tekst ze starego CV (PDF, DOCX lub TXT).
export async function extractText(buf) {
  const head = buf.subarray(0, 5).toString('latin1');
  let text;
  if (head.startsWith('%PDF')) text = await pdfText(buf);
  else if (head.startsWith('PK')) text = (await mammoth.extractRawText({ buffer: buf })).value;
  else text = buf.toString('utf8');
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 60) throw new ImportError('Nie udało się odczytać tekstu. Jeśli to skan lub zdjęcie, wpisz dane ręcznie.');
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
