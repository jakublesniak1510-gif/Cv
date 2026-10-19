import PDFDocument from 'pdfkit';
import { PACKAGES, B2B_PKGS, B2B_TIERS, B2B_MIN, b2bTable } from './pricing.js';
import { seller } from './invoice.js';

// Oferta dla instytucji w PDF (/oferta-dla-instytucji.pdf i załącznik do e-maili z mini-CRM).
// Ceny liczone z B2B_TIERS, więc zawsze aktualne. Bez obietnic zatrudnienia i bez liczb skuteczności.
const F = new URL('../fonts/', import.meta.url).pathname;
export function renderOffer(base = 'https://cvpodogloszenie.pl') {
  const host = base.replace(/^https?:\/\//, ''), s = seller(), t = b2bTable(), contact = process.env.CONTACT_EMAIL || 'kontakt@cvpodogloszenie.pl';
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'CV Pod Ogłoszenie – oferta dla instytucji' } });
    const out = []; doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', BRAND = '#2447D8', MUTE = '#546178', LINE = '#D9E0EC', L = 50, W = 495;
    const h2 = (txt) => { doc.moveDown(0.8).fillColor(INK).font('b').fontSize(14).text(txt, L, doc.y, { width: W }); doc.moveDown(0.25); };
    const p = (txt) => doc.fillColor(INK).font('r').fontSize(10.5).text(txt, L, doc.y, { width: W, lineGap: 2 });
    const li = (txt) => { const y = doc.y; doc.circle(L + 4, y + 6, 2.2).fill(BRAND); doc.fillColor(INK).font('r').fontSize(10.5).text(txt, L + 14, y, { width: W - 14, lineGap: 2 }); doc.moveDown(0.15); };
    doc.rect(0, 0, 595.28, 8).fill(BRAND);
    doc.fillColor(BRAND).font('b').fontSize(12).text('CV Pod Ogłoszenie', L, 34);
    doc.fillColor(INK).font('b').fontSize(22).text('CV pod konkretne ogłoszenie dla Waszych podopiecznych', L, 54, { width: W });
    doc.moveDown(0.3).fillColor(MUTE).font('r').fontSize(11).text('Oferta dla uczelni, szkół, urzędów pracy, fundacji i firm', { width: W });
    h2('Czym jest usługa');
    p('Piszemy CV i listy motywacyjne dopasowane do konkretnego ogłoszenia o pracę: ze słowami kluczowymi z ogłoszenia (tylko prawdziwymi) i raportem, które wymagania kandydat spełnia, a których w CV brakuje. Każda osoba zamawia sama, kiedy znajdzie ogłoszenie. Strona i dokumenty po polsku, ukraińsku, angielsku i niemiecku.');
    h2('Dwa modele współpracy');
    li('Partner (0 zł): bezpłatny kod zniżkowy dla podopiecznych, link i plakat z kodem QR, prywatny raport wykorzystania.');
    li('Opłaca organizacja: paczka kodów na wybrany pakiet. Każdy kod to jedna osoba, która nic nie płaci. Płacicie tylko za kupione kody.');
    h2('Ceny paczek kodów (za jeden kod)');
    const cols = [L, L + 215, L + 310, L + 405], head = ['Pakiet', ...B2B_TIERS.map((x, i) => `${x.min}${B2B_TIERS[i + 1] ? `–${B2B_TIERS[i + 1].min - 1}` : '+'} kodów`)];
    let y = doc.y + 4;
    doc.font('b').fontSize(9.5).fillColor(MUTE); head.forEach((h, i) => doc.text(h, cols[i], y, { width: i ? 90 : 210 }));
    y += 16; doc.moveTo(L, y).lineTo(L + W, y).strokeColor(LINE).stroke(); y += 6;
    for (const k of B2B_PKGS) {
      doc.font('r').fontSize(10.5).fillColor(INK).text(PACKAGES[k].name, cols[0], y, { width: 210 });
      t[k].forEach((v, i) => doc.text(`${v} zł`, cols[i + 1], y, { width: 90 }));
      y += 20; doc.moveTo(L, y - 4).lineTo(L + W, y - 4).strokeColor(LINE).stroke();
    }
    doc.y = y + 2; doc.fillColor(MUTE).font('r').fontSize(9.5).text(`Minimum ${B2B_MIN} kodów. Kody ważne 12 miesięcy. Ceny bez VAT: sprzedawca zwolniony podmiotowo (art. 113 ust. 1 ustawy o VAT), faktura bez VAT.`, L, doc.y, { width: W });
    h2('Jak to działa');
    li(`Zamówienie online: ${host}/dla-instytucji/zamow (karta, BLIK albo faktura z terminem 14 dni).`);
    li('Od razu e-mailem: kod, link do przekazania uczestnikom, faktura i plakat A4 z kodem QR (z instrukcją po ukraińsku).');
    li('Raport wykorzystania kodów bez danych osobowych uczestników: tylko liczby, aktualizowane na bieżąco.');
    li('Dane uczestników usuwamy automatycznie po 30 dniach. Nie przekazujemy ich organizacji.');
    h2('Kontakt');
    p(`${s.name}, ${s.brand}, ${s.address}, NIP ${s.nip}`);
    p(`E-mail: ${contact}  ·  ${host}  ·  bezpłatny scenariusz zajęć dla doradców: ${host}/dla-doradcow`);
    doc.end();
  });
}
