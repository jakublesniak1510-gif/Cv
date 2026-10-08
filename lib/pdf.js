import PDFDocument from 'pdfkit';
import { COLORS, cleanDesign } from './designs.js';

const F = new URL('../fonts/', import.meta.url).pathname;
const INK = '#16233A', MUTE = '#546178', LINE = '#D9E0EC', W = 595.28, H = 841.89;

function make(margins, fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins, info: { Title: 'Dokument aplikacyjny' } });
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    doc.registerFont('sr', F + 'Caladea-Regular.ttf'); doc.registerFont('sb', F + 'Caladea-Bold.ttf');
    const chunks = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    try { fn(doc); doc.end(); } catch (e) { reject(e); }
  });
}
const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Wspólne bloki treści; x i w to kolumna, w której piszemy.
function body(doc, c, { x, w, acc, serif, heading, skillsInBody = true }) {
  const R = serif ? 'sr' : 'r', B = serif ? 'sb' : 'b', fs = serif ? 10.5 : 10;
  const row = (left, right) => {
    const y = doc.y;
    doc.font(B).fontSize(fs).fillColor(INK).text(left || '', x, y, { width: w - 105 });
    const yEnd = doc.y;
    doc.font(R).fontSize(fs - 1).fillColor(MUTE).text(right || '', x, y + 1, { width: w, align: 'right' });
    doc.y = Math.max(yEnd, doc.y);
  };
  const para = (t) => doc.font(R).fontSize(fs).fillColor(INK).text(t, x, undefined, { width: w, lineGap: 2 });
  if (c.summary) { heading('Profil zawodowy'); para(c.summary); }
  if (c.experience?.length) {
    heading('Doświadczenie zawodowe');
    c.experience.forEach((e) => {
      row(e.title, e.period);
      if (e.company) doc.font(R).fontSize(fs - 0.5).fillColor(acc).text(e.company, x, undefined, { width: w });
      (e.bullets || []).forEach((b) => doc.font(R).fontSize(fs).fillColor(INK).text('•  ' + b, x + 8, undefined, { width: w - 8, lineGap: 1.5 }));
      doc.moveDown(0.6);
    });
  }
  if (c.education?.length) {
    heading('Wykształcenie');
    c.education.forEach((e) => { row(e.school, e.period); if (e.degree) doc.font(R).fontSize(fs - 0.5).fillColor(MUTE).text(e.degree, x, undefined, { width: w }); doc.moveDown(0.4); });
  }
  if (skillsInBody) {
    const block = (t, items) => { if (items?.length) { heading(t); para(items.join('  ·  ')); } };
    block('Umiejętności', c.skills); block('Języki', c.languages); block('Certyfikaty i kursy', c.certificates);
    if (c.interests) block('Zainteresowania', [c.interests]);
  }
  if (c.clause) doc.moveDown(1.2).font(R).fontSize(7).fillColor(MUTE).text(c.clause, x, undefined, { width: w });
}

function lineHeading(doc, x, w, acc, serif) {
  return (t) => {
    doc.moveDown(0.9).font(serif ? 'sb' : 'b').fontSize(serif ? 9 : 8).fillColor(acc).text(t.toUpperCase(), x, undefined, { width: w, characterSpacing: serif ? 2 : 1.2 });
    doc.moveTo(x, doc.y + 2).lineTo(x + w, doc.y + 2).lineWidth(0.6).strokeColor(serif ? acc : LINE).stroke(); doc.moveDown(0.5);
  };
}

const TEMPLATES = {
  klasyczny(c, acc) {
    return make(50, (doc) => {
      const x = 50, w = W - 100;
      doc.font('b').fontSize(24).fillColor(INK).text(c.name || '', x);
      if (c.headline) doc.font('b').fontSize(12).fillColor(acc).text(c.headline);
      doc.font('r').fontSize(9).fillColor(MUTE).text((c.contact || []).filter(Boolean).join('   ·   '));
      body(doc, c, { x, w, acc, heading: lineHeading(doc, x, w, acc) });
    });
  },
  wyrazisty(c, acc) {
    return make({ top: 50, bottom: 50, left: 50, right: 50 }, (doc) => {
      const x = 50, w = W - 100;
      doc.rect(0, 0, W, 118).fill(acc);
      doc.font('b').fontSize(26).fillColor('#FFFFFF').text(c.name || '', x, 36, { width: w });
      if (c.headline) doc.font('b').fontSize(12).fillColor('#FFFFFF').fillOpacity(0.85).text(c.headline, x, undefined, { width: w }).fillOpacity(1);
      doc.font('r').fontSize(9).fillColor('#FFFFFF').text((c.contact || []).filter(Boolean).join('   ·   '), x, undefined, { width: w });
      doc.y = 140;
      const heading = (t) => {
        doc.moveDown(0.9); const y = doc.y;
        doc.rect(x, y + 1, 4, 11).fill(acc);
        doc.font('b').fontSize(10).fillColor(INK).text(t, x + 12, y, { width: w - 12 }); doc.moveDown(0.4); doc.x = x;
      };
      body(doc, c, { x, w, acc, heading });
    });
  },
  nowoczesny(c, acc) {
    const SW = 178;
    return make({ top: 44, bottom: 44, left: SW + 28, right: 40 }, (doc) => {
      const side = () => doc.save().rect(0, 0, SW, H).fill(acc).restore();
      side(); doc.on('pageAdded', side);
      // pasek boczny (tylko pierwsza strona)
      const sx = 22, sw = SW - 44;
      doc.circle(SW / 2, 78, 34).fill('#FFFFFF');
      doc.font('b').fontSize(22).fillColor(acc).text(initials(c.name), 0, 66, { width: SW, align: 'center' });
      let y = 132;
      const sh = (t) => { doc.font('b').fontSize(8).fillColor('#FFFFFF').text(t.toUpperCase(), sx, y, { width: sw, characterSpacing: 1.2 }); y = doc.y + 3; doc.moveTo(sx, y).lineTo(sx + sw, y).lineWidth(0.5).strokeColor('#FFFFFF').strokeOpacity(0.4).stroke().strokeOpacity(1); y += 6; };
      const st = (t) => { doc.font('r').fontSize(8.5).fillColor('#FFFFFF').text(t, sx, y, { width: sw, lineGap: 1.5 }); y = doc.y + 3; };
      const list = (t, items) => { if (!items?.length) return; sh(t); items.forEach(st); y += 10; };
      list('Kontakt', (c.contact || []).filter(Boolean));
      list('Umiejętności', c.skills); list('Języki', c.languages); list('Certyfikaty', c.certificates);
      if (c.interests) list('Zainteresowania', [c.interests]);
      // kolumna główna
      const x = SW + 28, w = W - x - 40;
      doc.font('b').fontSize(24).fillColor(INK).text(c.name || '', x, 48, { width: w });
      if (c.headline) doc.font('b').fontSize(12).fillColor(acc).text(c.headline, x, undefined, { width: w });
      body(doc, c, { x, w, acc, heading: lineHeading(doc, x, w, acc), skillsInBody: false });
    });
  },
  elegancki(c, acc) {
    return make(56, (doc) => {
      const x = 56, w = W - 112;
      doc.font('sb').fontSize(28).fillColor(INK).text(c.name || '', x, 56, { width: w, align: 'center' });
      if (c.headline) doc.font('sr').fontSize(10.5).fillColor(acc).text(c.headline.toUpperCase(), x, undefined, { width: w, align: 'center', characterSpacing: 2.2 });
      doc.moveDown(0.4).font('sr').fontSize(9.5).fillColor(MUTE).text((c.contact || []).filter(Boolean).join('   ·   '), x, undefined, { width: w, align: 'center' });
      const y = doc.y + 10;
      doc.moveTo(x, y).lineTo(x + w, y).moveTo(x, y + 3).lineTo(x + w, y + 3).lineWidth(0.7).strokeColor(acc).stroke(); doc.y = y + 6;
      body(doc, c, { x, w, acc, serif: true, heading: lineHeading(doc, x, w, acc, true) });
    });
  },
};

export const renderCv = (res, design) => { const d = cleanDesign(design); return TEMPLATES[d.tpl](res.cv, COLORS[d.color]); };

export const renderLetter = (res, design) => {
  const d = cleanDesign(design), acc = COLORS[d.color], serif = d.tpl === 'elegancki';
  const R = serif ? 'sr' : 'r', B = serif ? 'sb' : 'b';
  return make(56, (doc) => {
    const x = 56, w = W - 112, c = res.cv, city = c.contact?.[2];
    if (d.tpl === 'wyrazisty') {
      doc.rect(0, 0, W, 92).fill(acc);
      doc.font(B).fontSize(20).fillColor('#FFFFFF').text(c.name || '', x, 30, { width: w });
      doc.font(R).fontSize(9).fillColor('#FFFFFF').text((c.contact || []).filter(Boolean).join('   ·   '), x, undefined, { width: w });
      doc.y = 120;
    } else {
      if (d.tpl === 'nowoczesny') doc.rect(0, 0, 8, H).fill(acc);
      const al = serif ? 'center' : 'left';
      doc.font(B).fontSize(20).fillColor(serif ? INK : acc).text(c.name || '', x, 56, { width: w, align: al });
      doc.font(R).fontSize(9).fillColor(MUTE).text((c.contact || []).filter(Boolean).join('   ·   '), x, undefined, { width: w, align: al });
      const y = doc.y + 10; doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.8).strokeColor(acc).stroke(); doc.y = y + 18;
    }
    doc.font(R).fontSize(10).fillColor(MUTE).text(`${city ? city + ', ' : ''}${new Date().toLocaleDateString('pl-PL')}`, x, undefined, { width: w, align: 'right' }).moveDown(1.4);
    String(res.letter || '').split(/\n\n+/).forEach((p) => doc.font(R).fontSize(serif ? 11 : 10.5).fillColor(INK).text(p, x, undefined, { width: w, lineGap: 3 }).moveDown(0.9));
  });
};
