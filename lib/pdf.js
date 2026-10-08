import PDFDocument from 'pdfkit';

const F = new URL('../fonts/', import.meta.url).pathname;
const INK = '#16233A', MUTE = '#546178', BLUE = '#2548E8', LINE = '#D9E0EC';

function make(fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Dokument aplikacyjny' } });
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const chunks = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    try { fn(doc, doc.page.width - 100); doc.end(); } catch (e) { reject(e); }
  });
}

export const renderCv = (res) => make((doc, w) => {
  const c = res.cv;
  const heading = (t) => {
    doc.moveDown(0.9).font('b').fontSize(8).fillColor(BLUE).text(t.toUpperCase(), { characterSpacing: 1.2 });
    doc.moveTo(50, doc.y + 2).lineTo(50 + w, doc.y + 2).lineWidth(0.6).strokeColor(LINE).stroke(); doc.moveDown(0.5);
  };
  const row = (left, right) => {
    const y = doc.y;
    doc.font('b').fontSize(10).fillColor(INK).text(left || '', 50, y, { width: w - 110 });
    const yEnd = doc.y;
    doc.font('r').fontSize(9).fillColor(MUTE).text(right || '', 50, y + 1, { width: w, align: 'right' });
    doc.y = Math.max(yEnd, doc.y);
  };
  doc.font('b').fontSize(24).fillColor(INK).text(c.name || '');
  if (c.headline) doc.font('b').fontSize(12).fillColor(BLUE).text(c.headline);
  doc.font('r').fontSize(9).fillColor(MUTE).text((c.contact || []).filter(Boolean).join('   ·   '), { lineGap: 2 });
  if (c.summary) { heading('Profil zawodowy'); doc.font('r').fontSize(10).fillColor(INK).text(c.summary, { lineGap: 2 }); }
  if (c.experience?.length) {
    heading('Doświadczenie zawodowe');
    c.experience.forEach((e) => {
      row(e.title, e.period);
      if (e.company) doc.font('r').fontSize(9.5).fillColor(MUTE).text(e.company);
      (e.bullets || []).forEach((b) => doc.font('r').fontSize(10).fillColor(INK).text('•  ' + b, 58, undefined, { width: w - 8, lineGap: 1.5 }));
      doc.x = 50; doc.moveDown(0.6);
    });
  }
  if (c.education?.length) {
    heading('Wykształcenie');
    c.education.forEach((e) => { row(e.school, e.period); if (e.degree) doc.font('r').fontSize(9.5).fillColor(MUTE).text(e.degree, 50); doc.moveDown(0.4); });
  }
  const block = (t, items, sep = '  ·  ') => { if (items?.length) { heading(t); doc.font('r').fontSize(10).fillColor(INK).text(items.join(sep), 50, undefined, { width: w, lineGap: 2 }); } };
  block('Umiejętności', c.skills); block('Języki', c.languages); block('Certyfikaty i kursy', c.certificates);
  if (c.interests) block('Zainteresowania', [c.interests]);
  if (c.clause) doc.moveDown(1.2).font('r').fontSize(7).fillColor(MUTE).text(c.clause, 50, undefined, { width: w });
});

export const renderLetter = (res) => make((doc, w) => {
  const city = res.cv.contact?.[2];
  doc.font('r').fontSize(10).fillColor(MUTE).text(`${city ? city + ', ' : ''}${new Date().toLocaleDateString('pl-PL')}`, { align: 'right' });
  doc.moveDown(1.5).font('b').fontSize(11).fillColor(INK).text(res.cv.name || '').moveDown(1.5);
  String(res.letter || '').split(/\n\n+/).forEach((p) => doc.font('r').fontSize(10.5).fillColor(INK).text(p, 50, undefined, { width: w, lineGap: 3 }).moveDown(0.9));
});
