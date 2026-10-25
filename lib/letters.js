import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// Listy papierowe do instytucji (pierwszy kontakt bez zgody na e-mail/telefon: art. 398 PKE).
// Jeden PDF, każdy list na osobnej stronie A4; adres odbiorcy w polu okienka koperty DL po prawej
// (A4 złożone na trzy: okno ok. 90×45 mm, 20 mm od prawej krawędzi, ok. 45 mm od góry).
const F = new URL('../fonts/', import.meta.url).pathname;
const mm = (v) => (v * 72) / 25.4;
const WHO = { uczelnia: 'studentów', szkola: 'uczniów', firma: 'pracowników', agencja: 'kandydatów' };
// Agencje pracy dostają w liście adres i QR strony /dla-agencji zamiast /dla-doradcow.
const INFO = (c) => (c.segment === 'agencja' ? ['dla-agencji', 'dla agencji'] : ['dla-doradcow', 'dla doradców']);
export const letterAudience = (segment) => WHO[segment] || 'podopiecznych';
export const letterText = (c) => `Szanowni Państwo,

nazywam się Jakub Leśniak i prowadzę serwis cvpodogloszenie.pl, który pomaga przygotować CV i list motywacyjny dopasowane do konkretnej oferty pracy (interfejs także po ukraińsku).

Dla ${letterAudience(c.segment)} Państwa ${c.segment === 'agencja' ? 'agencji' : 'instytucji'} proponujemy, bez żadnych kosztów:
• własny kod zniżkowy z plakatem z kodem QR,
• raport online z liczbą użyć kodu (bez danych osobowych),
${c.segment === 'agencja' ? '• bezpłatny skaner CV pod ogłoszenie, do podlinkowania w Państwa ogłoszeniach.' : '• darmowy scenariusz zajęć „CV pod konkretne ogłoszenie” (45 min) i bezpłatne narzędzia, np. skaner CV.'}

${c.segment === 'agencja' ? 'Agencje, które chcą opłacić usługę za kandydatów,' : 'Instytucje, które chcą opłacić usługę za swoich podopiecznych,'} mogą zamówić paczkę kodów (faktura bez VAT).

Szczegóły i zgłoszenie (2 minuty): cvpodogloszenie.pl/${INFO(c)[0]} oraz cvpodogloszenie.pl/dla-instytucji/zamow (kody QR obok).

Jeśli wolą Państwo rozmowę, proszę o wiadomość na kontakt@cvpodogloszenie.pl — chętnie oddzwonię.`;
export const LETTER_RODO = 'Administratorem danych adresowych jest Jakub Leśniak (NIP 9731085406). Dane pochodzą z Państwa oficjalnej strony i są wykorzystane jednorazowo do tej korespondencji (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO). Informacje i sprzeciw: kontakt@cvpodogloszenie.pl, cvpodogloszenie.pl/polityka-prywatnosci.';
// Adres: organizacja, dział, a potem pole „adres” (przecinki/średniki = kolejne wiersze); bez adresu – miasto.
export const addressLines = (c) => [c.org, c.dept, ...(c.address ? String(c.address).split(/\s*[;,\n]\s*/) : [c.city])].map((x) => String(x || '').trim()).filter(Boolean).slice(0, 6);

function qr(doc, text, x, y, size, color) {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' }), n = q.modules.size, cell = size / (n + 2);
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.modules.get(r, k)) doc.rect(x + (k + 1) * cell, y + (r + 1) * cell, cell + 0.15, cell + 0.15).fill(color);
}
export function renderLetters(list, { base = 'https://cvpodogloszenie.pl', now = Date.now() } = {}) {
  const date = new Date(now).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric' });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, info: { Title: 'Listy CV Pod Ogłoszenie' } });
    const out = []; doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', MUTE = '#546178', L = mm(25), W = mm(160);
    for (const c of list) {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.fillColor('#2447D8').font('b').fontSize(11).text('CV Pod Ogłoszenie', L, mm(18));
      doc.fillColor(MUTE).font('r').fontSize(8.5).text('Jakub Leśniak · Winiary 2, 66-010 Nowogród Bobrzański · kontakt@cvpodogloszenie.pl · cvpodogloszenie.pl', L, mm(24), { width: mm(95) });
      // pole adresowe pod okienkiem koperty DL (prawe)
      doc.fillColor(INK).font('r').fontSize(10.5).text(addressLines(c).join('\n'), mm(105), mm(50), { width: mm(85), height: mm(38), lineGap: 1.5 });
      doc.fillColor(MUTE).fontSize(9.5).text(`Nowogród Bobrzański, ${date}`, mm(105), mm(96), { width: mm(85), align: 'right' });
      // treść
      doc.fillColor(INK).font('r').fontSize(10.5).text(letterText(c), L, mm(110), { width: mm(125), lineGap: 2.5, paragraphGap: 4 });
      const endY = doc.y;
      // kody QR obok treści
      const qx = mm(155), qs = mm(30);
      qr(doc, `${base}/${INFO(c)[0]}`, qx, mm(150), qs, INK); doc.fillColor(MUTE).fontSize(7.5).text(INFO(c)[1], qx, mm(150) + qs + 2, { width: qs, align: 'center' });
      qr(doc, `${base}/dla-instytucji/zamow`, qx, mm(195), qs, INK); doc.fillColor(MUTE).fontSize(7.5).text('zamów kody', qx, mm(195) + qs + 2, { width: qs, align: 'center' });
      doc.fillColor(INK).font('r').fontSize(10.5).text('Z poważaniem', L, Math.max(endY, mm(225)) + mm(6));
      doc.font('b').text('Jakub Leśniak, CV Pod Ogłoszenie', L, doc.y + 2);
      doc.fillColor(MUTE).font('r').fontSize(7).text(LETTER_RODO, L, mm(275), { width: W, lineGap: 1 });
    }
    if (!list.length) doc.addPage();
    doc.end();
  });
}
