import PDFDocument from 'pdfkit';
import { COLORS, cleanDesign } from './designs.js';

const F = new URL('../fonts/', import.meta.url).pathname;
const INK = '#16233A', MUTE = '#546178', LINE = '#D9E0EC', W = 595.28, H = 841.89, WHITE = '#FFFFFF';

function make(margins, fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins, info: { Title: 'Dokument aplikacyjny' } });
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    // Caladea nie ma cyrylicy, więc dla ukraińskiego szeryfowy krój to DejaVu Serif.
    if (T.cyr) { doc.registerFont('sr', F + 'DejaVuSerif.ttf'); doc.registerFont('sb', F + 'DejaVuSerif-Bold.ttf'); }
    else { doc.registerFont('sr', F + 'Caladea-Regular.ttf'); doc.registerFont('sb', F + 'Caladea-Bold.ttf'); }
    const chunks = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    try { fn(doc); doc.end(); } catch (e) { reject(e); }
  });
}
export const LBL = {
  pl: { summary: 'Profil zawodowy', exp: 'Doświadczenie zawodowe', edu: 'Wykształcenie', skills: 'Umiejętności', langs: 'Języki', certs: 'Certyfikaty i kursy', certsShort: 'Certyfikaty', interests: 'Zainteresowania', contact: 'Kontakt', profile: 'Profil', expShort: 'Doświadczenie', locale: 'pl-PL' },
  de: { summary: 'Profil', exp: 'Berufserfahrung', edu: 'Ausbildung', skills: 'Kenntnisse', langs: 'Sprachen', certs: 'Zertifikate und Kurse', certsShort: 'Zertifikate', interests: 'Interessen', contact: 'Kontakt', profile: 'Profil', expShort: 'Erfahrung', locale: 'de-DE' },
  uk: { summary: 'Професійний профіль', exp: 'Досвід роботи', edu: 'Освіта', skills: 'Навички', langs: 'Мови', certs: 'Сертифікати та курси', certsShort: 'Сертифікати', interests: 'Інтереси', contact: 'Контакти', profile: 'Профіль', expShort: 'Досвід', locale: 'uk-UA', cyr: true },
  es: { summary: 'Perfil profesional', exp: 'Experiencia laboral', edu: 'Formación', skills: 'Habilidades', langs: 'Idiomas', certs: 'Certificados y cursos', certsShort: 'Certificados', interests: 'Intereses', contact: 'Contacto', profile: 'Perfil', expShort: 'Experiencia', locale: 'es-ES' },
  fr: { summary: 'Profil professionnel', exp: 'Expérience professionnelle', edu: 'Formation', skills: 'Compétences', langs: 'Langues', certs: 'Certifications et formations', certsShort: 'Certifications', interests: "Centres d'intérêt", contact: 'Contact', profile: 'Profil', expShort: 'Expérience', locale: 'fr-FR' },
  en: { summary: 'Professional summary', exp: 'Work experience', edu: 'Education', skills: 'Skills', langs: 'Languages', certs: 'Certifications', certsShort: 'Certifications', interests: 'Interests', contact: 'Contact', profile: 'Profile', expShort: 'Experience', locale: 'en-GB' },
};
// Rysowanie jest synchroniczne, więc etykiety i zdjęcie bieżącego dokumentu trzymamy w module.
let T = LBL.pl, PHOTO = null;
const photoBuf = (p) => { const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(p || ''); return m ? Buffer.from(m[2], 'base64') : null; };
// Zdjęcie przycięte do koła (r) lub kwadratu (square) w miejscu monogramu.
function drawPhoto(doc, cx, cy, r, square = false) {
  doc.save(); (square ? doc.rect(cx - r, cy - r, 2 * r, 2 * r) : doc.circle(cx, cy, r)).clip();
  doc.image(PHOTO, cx - r, cy - r, { width: 2 * r, height: 2 * r }); doc.restore();
}
const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
// Kolor akcentu rozjaśniony do bieli (t = udział akcentu).
const tint = (hex, t) => '#' + [1, 3, 5].map((i) => Math.round(255 - (255 - parseInt(hex.slice(i, i + 2), 16)) * t).toString(16).padStart(2, '0')).join('');
const contactOf = (c) => (c.contact || []).filter(Boolean);
const ensure = (doc, need = 80) => { if (doc.y > H - doc.page.margins.bottom - need) doc.addPage(); };

// Treść jednej pozycji (praca / szkoła) w kolumnie x..x+w.
function entry(doc, { x, w, title, period, org, orgColor, bullets, R, B, fs, showPeriod = true, showOrg = true }) {
  const y = doc.y;
  doc.font(B).fontSize(fs).fillColor(INK).text(title || '', x, y, { width: showPeriod ? w - 105 : w });
  const yEnd = doc.y;
  if (showPeriod && period) doc.font(R).fontSize(fs - 1).fillColor(MUTE).text(period, x, y + 1, { width: w, align: 'right' });
  doc.y = Math.max(yEnd, doc.y);
  if (showOrg && org) doc.font(R).fontSize(fs - 0.5).fillColor(orgColor).text(org, x, undefined, { width: w });
  (bullets || []).forEach((b) => doc.font(R).fontSize(fs).fillColor(INK).text('•  ' + b, x + 8, undefined, { width: w - 8, lineGap: 1.5 }));
}

// Standardowy przebieg treści w jednej kolumnie (klasyczny, elegancki, nowoczesny, geometria).
function flow(doc, c, { x, w, acc, heading, serif, side = false, R = serif ? 'sr' : 'r', B = serif ? 'sb' : 'b', fs = serif ? 10.5 : 10 }) {
  const para = (t, color = INK) => doc.font(R).fontSize(fs).fillColor(color).text(t, x, undefined, { width: w, lineGap: 2 });
  if (c.summary) { heading(T.summary); para(c.summary); }
  if (c.experience?.length) {
    heading(T.exp);
    c.experience.forEach((e) => { ensure(doc, 60); entry(doc, { x, w, title: e.title, period: e.period, org: e.company, orgColor: acc, bullets: e.bullets, R, B, fs }); doc.moveDown(0.6); });
  }
  if (c.education?.length) {
    heading(T.edu);
    c.education.forEach((e) => { ensure(doc, 40); entry(doc, { x, w, title: e.school, period: e.period, org: e.degree, orgColor: MUTE, R, B, fs }); doc.moveDown(0.4); });
  }
  if (!side) {
    const block = (t, items) => { if (items?.length) { heading(t); para(items.join('  ·  ')); } };
    block(T.skills, c.skills); block(T.langs, c.languages); block(T.certs, c.certificates);
    if (c.interests) block(T.interests, [c.interests]);
  }
  clause(doc, c, x, w, serif);
}
const clause = (doc, c, x, w, serif) => { if (c.clause) doc.moveDown(1.2).font(serif ? 'sr' : 'r').fontSize(7).fillColor(MUTE).text(c.clause, x, undefined, { width: w }); };

const lineHeading = (doc, x, w, acc) => (t) => {
  ensure(doc, 50);
  doc.moveDown(0.9).font('b').fontSize(8).fillColor(acc).text(t.toUpperCase(), x, undefined, { width: w, characterSpacing: 1.2 });
  doc.moveTo(x, doc.y + 2).lineTo(x + w, doc.y + 2).lineWidth(0.6).strokeColor(LINE).stroke(); doc.moveDown(0.5);
};

// Lista w panelu bocznym (Nowoczesny, Geometria).
function sideLists(doc, c, { x, w, y, color, rule, headColor = color }) {
  const sh = (t) => {
    doc.font('b').fontSize(8).fillColor(headColor).text(t.toUpperCase(), x, y, { width: w, characterSpacing: 1.2 });
    y = doc.y + 3; doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.5).strokeColor(rule).stroke(); y += 6;
  };
  const st = (t) => { doc.font('r').fontSize(8.5).fillColor(color).text(t, x, y, { width: w, lineGap: 1.5 }); y = doc.y + 3; };
  const list = (t, items) => { if (!items?.length) return; sh(t); items.forEach(st); y += 10; };
  list(T.contact, contactOf(c)); list(T.skills, c.skills); list(T.langs, c.languages); list(T.certsShort, c.certificates);
  if (c.interests) list(T.interests, [c.interests]);
  return y;
}

const TEMPLATES = {
  klasyczny(c, acc) {
    return make(50, (doc) => {
      const x = 50, w = W - 100, tw = PHOTO ? w - 92 : w;
      if (PHOTO) drawPhoto(doc, x + w - 36, 86, 36);
      doc.font('b').fontSize(24).fillColor(INK).text(c.name || '', x, PHOTO ? 62 : 50, { width: tw });
      if (c.headline) doc.font('b').fontSize(12).fillColor(acc).text(c.headline, x, undefined, { width: tw });
      doc.font('r').fontSize(9).fillColor(MUTE).text(contactOf(c).join('   ·   '), x, undefined, { width: tw });
      if (PHOTO) doc.y = Math.max(doc.y, 128);
      flow(doc, c, { x, w, acc, heading: lineHeading(doc, x, w, acc) });
    });
  },

  nowoczesny(c, acc) {
    const SW = 178;
    return make({ top: 44, bottom: 44, left: SW + 30, right: 40 }, (doc) => {
      const side = () => doc.save().rect(0, 0, SW, H).fill(acc).restore();
      side(); doc.on('pageAdded', side);
      doc.circle(SW / 2, 80, 38).fill(WHITE);
      if (PHOTO) drawPhoto(doc, SW / 2, 80, 35);
      else doc.font('b').fontSize(22).fillColor(acc).text(initials(c.name), 0, 68, { width: SW, align: 'center' });
      sideLists(doc, c, { x: 22, w: SW - 44, y: 136, color: WHITE, rule: tint(acc, 0.55) });
      const x = SW + 30, w = W - x - 40;
      doc.font('b').fontSize(24).fillColor(INK).text(c.name || '', x, 50, { width: w });
      if (c.headline) doc.font('b').fontSize(12).fillColor(acc).text(c.headline, x, undefined, { width: w });
      doc.rect(x, doc.y + 8, 34, 3).fill(acc); doc.y += 12;
      flow(doc, c, { x, w, acc, side: true, heading: lineHeading(doc, x, w, acc) });
    });
  },

  os(c, acc) {
    return make(50, (doc) => {
      const x = 50, w = W - 100, L = 104, lx = x + L + 14, cx = lx + 16, cw = x + w - cx;
      const px = PHOTO ? 76 : 0;
      if (PHOTO) { doc.circle(x + 31, 78, 33).fill(acc); doc.circle(x + 31, 78, 31).fill(WHITE); drawPhoto(doc, x + 31, 78, 29); }
      doc.font('b').fontSize(26).fillColor(INK).text(c.name || '', x + px, PHOTO ? 58 : 50, { width: w * 0.6 - px });
      if (c.headline) doc.font('b').fontSize(12).fillColor(acc).text(c.headline, x + px, undefined, { width: w * 0.6 - px });
      if (PHOTO) doc.y = Math.max(doc.y, 112);
      const yL = doc.y;
      doc.font('r').fontSize(8.5).fillColor(MUTE).text(contactOf(c).join('\n'), x + w * 0.55, 52, { width: w * 0.45, align: 'right', lineGap: 2 });
      let y = Math.max(yL, doc.y) + 10;
      doc.rect(x, y, w, 2.5).fill(acc); doc.y = y + 16;
      const heading = (t) => { ensure(doc, 60); doc.moveDown(0.6).font('b').fontSize(8).fillColor(acc).text(t.toUpperCase(), x, undefined, { width: w, characterSpacing: 1.2 }); doc.moveDown(0.6); };
      if (c.summary) {
        const h = doc.font('r').fontSize(10.5).heightOfString(c.summary, { width: w - 14, lineGap: 2 });
        doc.rect(x, doc.y, 2.5, h).fill(acc);
        doc.font('r').fontSize(10.5).fillColor('#2A3750').text(c.summary, x + 14, doc.y, { width: w - 14, lineGap: 2 }); doc.moveDown(0.4);
      }
      const timeline = (items) => items.forEach((e, i) => {
        ensure(doc, 60);
        const y0 = doc.y, p0 = doc.page;
        doc.font('b').fontSize(9).fillColor(acc).text(e.period || '', x, y0, { width: L, align: 'right' });
        if (e.org) doc.font('r').fontSize(8.5).fillColor(MUTE).text(e.org, x, undefined, { width: L, align: 'right' });
        const yLeft = doc.y;
        doc.font('b').fontSize(10.5).fillColor(INK).text(e.title || '', cx, y0, { width: cw });
        (e.bullets || []).forEach((b) => doc.font('r').fontSize(10).fillColor(INK).text('•  ' + b, cx + 6, undefined, { width: cw - 6, lineGap: 1.5 }));
        const yEnd = Math.max(yLeft, doc.y) + (i < items.length - 1 ? 12 : 4);
        if (doc.page === p0) {
          doc.moveTo(lx, y0 + 6).lineTo(lx, yEnd).lineWidth(1.5).strokeColor(tint(acc, 0.3)).stroke();
          doc.circle(lx, y0 + 6, 4.5).fill(WHITE).circle(lx, y0 + 6, 4.5).lineWidth(2.2).strokeColor(acc).stroke();
        }
        doc.y = yEnd;
      });
      if (c.experience?.length) { heading(T.exp); timeline(c.experience.map((e) => ({ period: e.period, org: e.company, title: e.title, bullets: e.bullets }))); }
      if (c.education?.length) { heading(T.edu); timeline(c.education.map((e) => ({ period: e.period, org: e.degree, title: e.school }))); }
      const cols = [[T.skills, c.skills, 0.42], [T.langs, c.languages, 0.29], [T.certs, c.certificates, 0.29]].filter((k) => k[1]?.length);
      if (cols.length) {
        ensure(doc, 90); doc.moveDown(1); const y0 = doc.y; let cx2 = x, yMax = y0;
        const tot = cols.reduce((a, k) => a + k[2], 0);
        cols.forEach(([t, items, f]) => {
          const cw2 = (w - 16 * (cols.length - 1)) * (f / tot);
          doc.font('b').fontSize(8).fillColor(acc).text(t.toUpperCase(), cx2, y0, { width: cw2, characterSpacing: 1.2 });
          doc.moveDown(0.4).font('r').fontSize(9.5).fillColor(INK).text(items.join('\n'), cx2, undefined, { width: cw2, lineGap: 2 });
          yMax = Math.max(yMax, doc.y); cx2 += cw2 + 16;
        });
        doc.y = yMax;
      }
      if (c.interests) { heading(T.interests); doc.font('r').fontSize(10).fillColor(INK).text(c.interests, x, undefined, { width: w }); }
      clause(doc, c, x, w);
    });
  },

  szwajcarski(c, acc) {
    return make(52, (doc) => {
      const x = 54, w = W - 108, L = 104, cx = x + L + 20, cw = x + w - cx;
      doc.rect(x, 52, 13, 13).fill(acc);
      const [first = '', ...rest] = String(c.name || '').split(/\s+/);
      doc.font('b').fontSize(40).fillColor(INK).text(first, x, 80, { width: w * 0.62, lineGap: -8, characterSpacing: -1 });
      if (rest.length) doc.text(rest.join(' '), x, undefined, { width: w * 0.62, lineGap: -8, characterSpacing: -1 });
      if (c.headline) doc.moveDown(0.3).font('b').fontSize(12).fillColor(acc).text(c.headline, x, undefined, { width: w * 0.62, characterSpacing: 0 });
      const yL = doc.y;
      if (PHOTO) drawPhoto(doc, x + w - 40, 92, 40, true);
      doc.font('r').fontSize(8.5).fillColor(MUTE).text(contactOf(c).join('\n'), x + w * 0.55, PHOTO ? 140 : 84, { width: w * 0.45, align: 'right', lineGap: 2 });
      doc.y = Math.max(yL, doc.y) + 18;
      const row = (label, draw) => {
        ensure(doc, 60);
        const y0 = doc.y + 4;
        doc.moveTo(x, y0).lineTo(x + w, y0).lineWidth(1.1).strokeColor(INK).stroke();
        doc.rect(x, y0 + 12, 5, 5).fill(acc);
        doc.font('b').fontSize(7.5).fillColor(INK).text(label.toUpperCase(), x + 11, y0 + 10, { width: L - 11, characterSpacing: 1.1 });
        const yLab = doc.y; doc.y = y0 + 9; draw(); doc.y = Math.max(doc.y, yLab) + 10;
      };
      const para = (t) => doc.font('r').fontSize(10).fillColor(INK).text(t, cx, doc.y, { width: cw, lineGap: 2 });
      if (c.summary) row(T.profile, () => doc.font('r').fontSize(11).fillColor(INK).text(c.summary, cx, doc.y, { width: cw, lineGap: 2.5 }));
      if (c.experience?.length) row(T.expShort, () => c.experience.forEach((e, i) => { if (i) doc.moveDown(0.7); entry(doc, { x: cx, w: cw, title: e.title, period: e.period, org: e.company, orgColor: acc, bullets: e.bullets, R: 'r', B: 'b', fs: 10 }); }));
      if (c.education?.length) row(T.edu, () => c.education.forEach((e, i) => { if (i) doc.moveDown(0.5); entry(doc, { x: cx, w: cw, title: e.school, period: e.period, org: e.degree, orgColor: MUTE, R: 'r', B: 'b', fs: 10 }); }));
      if (c.skills?.length) row(T.skills, () => para(c.skills.join('  ·  ')));
      if (c.languages?.length) row(T.langs, () => para(c.languages.join('  ·  ')));
      if (c.certificates?.length) row(T.certsShort, () => para(c.certificates.join('  ·  ')));
      if (c.interests) row(T.interests, () => para(c.interests));
      clause(doc, c, x, w);
    });
  },

  geometria(c, acc) {
    return make({ top: 50, bottom: 50, left: 50, right: 50 }, (doc) => {
      doc.polygon([0, 0], [W, 0], [W, 168], [0, 118]).fill(tint(acc, 0.3));
      doc.polygon([0, 0], [W, 0], [W, 112], [0, 150]).fill(acc);
      const x = 50, w = W - 100, R0 = 36, mx = W - 50 - R0;
      doc.circle(mx, 62, R0 + 5).fill(tint(acc, 0.55)).circle(mx, 62, R0).fill(WHITE);
      if (PHOTO) drawPhoto(doc, mx, 62, R0 - 2);
      else doc.font('b').fontSize(22).fillColor(acc).text(initials(c.name), mx - R0, 50, { width: R0 * 2, align: 'center' });
      doc.font('b').fontSize(26).fillColor(WHITE).text(c.name || '', x, 38, { width: w - 100 });
      if (c.headline) doc.font('b').fontSize(12).fillColor(WHITE).text(c.headline, x, undefined, { width: w - 100 });
      const pw = 168, px = W - 50 - pw, top = 180;
      doc.roundedRect(px, top, pw, H - top - 50, 10).fill(tint(acc, 0.09));
      // panel boczny
      const hd = (t, xx, ww) => {
        const y = doc.y; doc.polygon([xx + 3, y + 2], [xx + 13, y + 2], [xx + 10, y + 8], [xx, y + 8]).fill(acc);
        doc.font('b').fontSize(8).fillColor(acc).text(t.toUpperCase(), xx + 18, y, { width: ww - 18, characterSpacing: 1.1 }); doc.moveDown(0.5);
      };
      let y = top + 16;
      const list = (t, items) => { if (!items?.length) return; doc.y = y; hd(t, px + 14, pw - 28); doc.font('r').fontSize(8.5).fillColor(INK).text(items.join('\n'), px + 14, undefined, { width: pw - 28, lineGap: 2 }); y = doc.y + 12; };
      list(T.contact, contactOf(c)); list(T.skills, c.skills); list(T.langs, c.languages); list(T.certsShort, c.certificates);
      if (c.interests) list(T.interests, [c.interests]);
      const mw = px - x - 22;
      doc.y = top + 6;
      flow(doc, c, { x, w: mw, acc, side: true, heading: (t) => { ensure(doc, 50); doc.moveDown(0.9); hd(t, x, mw); } });
    });
  },

  elegancki(c, acc) {
    return make(56, (doc) => {
      const x = 58, w = W - 116, cx = W / 2;
      doc.rect(cx - 21, 50, 42, 42).lineWidth(0.7).strokeColor(acc).stroke();
      doc.rect(cx - 24.5, 46.5, 49, 49).lineWidth(0.7).strokeColor(acc).stroke();
      if (PHOTO) drawPhoto(doc, cx, 71, 19.5, true);
      else doc.font('sb').fontSize(14).fillColor(acc).text(initials(c.name), cx - 21, 63, { width: 42, align: 'center', characterSpacing: 1 });
      doc.font('sb').fontSize(28).fillColor(INK).text(c.name || '', x, 110, { width: w, align: 'center' });
      if (c.headline) doc.font('sr').fontSize(10).fillColor(acc).text(c.headline.toUpperCase(), x, undefined, { width: w, align: 'center', characterSpacing: 2.4 });
      doc.moveDown(0.4).font('sr').fontSize(9.5).fillColor(MUTE).text(contactOf(c).join('   ·   '), x, undefined, { width: w, align: 'center' });
      const y = doc.y + 10;
      doc.moveTo(x, y).lineTo(x + w, y).moveTo(x, y + 3).lineTo(x + w, y + 3).lineWidth(0.7).strokeColor(acc).stroke(); doc.y = y + 8;
      const heading = (t) => {
        ensure(doc, 50); doc.moveDown(1);
        const label = t.toUpperCase(); doc.font('sb').fontSize(9);
        const tw = doc.widthOfString(label, { characterSpacing: 2.2 }), yy = doc.y + 5;
        doc.moveTo(x, yy).lineTo(cx - tw / 2 - 12, yy).moveTo(cx + tw / 2 + 12, yy).lineTo(x + w, yy).lineWidth(0.6).strokeColor(tint(acc, 0.4)).stroke();
        doc.fillColor(acc).text(label, x, doc.y, { width: w, align: 'center', characterSpacing: 2.2 }); doc.moveDown(0.5);
      };
      flow(doc, c, { x, w, acc, serif: true, heading });
    });
  },

  // Monogram: wyśrodkowany nagłówek z inicjałami w okręgu, sekcje w wierszach (etykieta po lewej).
  monogram(c, acc) {
    return make(50, (doc) => {
      const x = 54, w = W - 108, cx = W / 2, L = 104, tx = x + L + 18, tw = x + w - tx;
      doc.circle(cx, 78, 28).lineWidth(1.1).strokeColor(acc).stroke();
      if (PHOTO) drawPhoto(doc, cx, 78, 25);
      else doc.font('sr').fontSize(17).fillColor(acc).text(initials(c.name), cx - 28, 68, { width: 56, align: 'center', characterSpacing: 1 });
      doc.font('sb').fontSize(25).fillColor(INK).text(c.name || '', x, 118, { width: w, align: 'center' });
      if (c.headline) doc.font('b').fontSize(8.5).fillColor(acc).text(c.headline.toUpperCase(), x, undefined, { width: w, align: 'center', characterSpacing: 2 });
      doc.moveDown(0.3).font('r').fontSize(8.5).fillColor(MUTE).text(contactOf(c).join('   ·   '), x, undefined, { width: w, align: 'center' });
      doc.y += 10; doc.moveTo(x, doc.y).lineTo(x + w, doc.y).lineWidth(0.7).strokeColor(LINE).stroke(); doc.y += 6;
      const row = (label, draw) => {
        ensure(doc, 60);
        const y0 = doc.y + 8;
        doc.font('b').fontSize(7.5).fillColor(acc).text(label.toUpperCase(), x, y0, { width: L, characterSpacing: 1.3 });
        const yl = doc.y; doc.y = y0; draw(); doc.y = Math.max(doc.y, yl) + 8;
        doc.moveTo(x, doc.y).lineTo(x + w, doc.y).lineWidth(0.5).strokeColor('#EEF0F3').stroke();
      };
      const para = (t) => doc.font('r').fontSize(10).fillColor(INK).text(t, tx, doc.y, { width: tw, lineGap: 2 });
      if (c.summary) row(T.profile, () => para(c.summary));
      if (c.experience?.length) row(T.expShort, () => c.experience.forEach((e, i) => { if (i) doc.moveDown(0.6); entry(doc, { x: tx, w: tw, title: e.title, period: e.period, org: e.company, orgColor: acc, bullets: e.bullets, R: 'r', B: 'b', fs: 10 }); }));
      if (c.education?.length) row(T.edu, () => c.education.forEach((e, i) => { if (i) doc.moveDown(0.4); entry(doc, { x: tx, w: tw, title: e.school, period: e.period, org: e.degree, orgColor: MUTE, R: 'r', B: 'b', fs: 10 }); }));
      if (c.skills?.length) row(T.skills, () => para(c.skills.join('  ·  ')));
      if (c.languages?.length) row(T.langs, () => para(c.languages.join('  ·  ')));
      if (c.certificates?.length) row(T.certsShort, () => para(c.certificates.join('  ·  ')));
      if (c.interests) row(T.interests, () => para(c.interests));
      clause(doc, c, x, w);
    });
  },

  // Kreatywny: ukośny kolorowy nagłówek, treść po lewej, umiejętności i języki w kolumnie po prawej.
  kreatywny(c, acc) {
    return make({ top: 50, bottom: 50, left: 46, right: 46 }, (doc) => {
      const GOLD = '#F2B705';
      doc.polygon([0, 0], [W, 0], [W, 128], [0, 166]).fill(acc);
      const x = 46, w = W - 92, pw = 162, px = x + w - pw, mw = w - pw - 26;
      if (PHOTO) { doc.circle(W - 46 - 38, 74, 40).fill(WHITE); drawPhoto(doc, W - 46 - 38, 74, 37); }
      const hw = PHOTO ? w - 100 : w;
      doc.font('b').fontSize(28).fillColor(WHITE).text(c.name || '', x, 40, { width: hw, characterSpacing: -0.4 });
      if (c.headline) doc.font('r').fontSize(12).fillColor(WHITE).text(c.headline, x, undefined, { width: hw });
      doc.moveDown(0.3).font('r').fontSize(8.5).fillColor(WHITE).fillOpacity(0.85).text(contactOf(c).join('   ·   '), x, undefined, { width: hw }).fillOpacity(1);
      const hd = (t, xx, ww) => { const y = doc.y; doc.roundedRect(xx, y + 3.5, 14, 3, 1.5).fill(GOLD); doc.font('b').fontSize(10.5).fillColor(acc).text(t, xx + 20, y, { width: ww - 20 }); doc.moveDown(0.35); };
      let y = 186;
      const list = (t, items, chip) => {
        if (!items?.length) return; doc.y = y; hd(t, px, pw);
        doc.font('r').fontSize(8.8).fillColor(INK).text(items.join(chip ? '  ·  ' : '\n'), px, undefined, { width: pw, lineGap: 2 }); y = doc.y + 14;
      };
      list(T.skills, c.skills, true); list(T.langs, c.languages); list(T.certsShort, c.certificates);
      if (c.interests) list(T.interests, [c.interests]);
      doc.y = 182;
      flow(doc, c, { x, w: mw, acc, side: true, heading: (t) => { ensure(doc, 50); doc.moveDown(0.8); hd(t, x, mw); } });
    });
  },

  // Kompetencje: jasna kolumna po prawej z kontaktem, umiejętnościami i poziomem języków (z oznaczeń A1–C2).
  kompetencje(c, acc) {
    const SW = 176;
    return make({ top: 46, bottom: 46, left: 46, right: SW + 26 }, (doc) => {
      const sx = W - SW, side = () => doc.save().rect(sx, 0, SW, H).fill(tint(acc, 0.08)).restore();
      side(); doc.on('pageAdded', side);
      const x = 46, w = sx - x - 26, px = sx + 20, pw = SW - 40;
      let y = 46;
      if (PHOTO) { drawPhoto(doc, sx + SW / 2, 86, 40); y = 140; }
      const sh = (t) => { doc.font('b').fontSize(8.3).fillColor(acc).text(t.toUpperCase(), px, y, { width: pw, characterSpacing: 1 }); y = doc.y + 3; doc.moveTo(px, y).lineTo(px + pw, y).lineWidth(1.2).strokeColor(acc).stroke(); y += 7; };
      const ct = contactOf(c);
      if (ct.length) { sh(T.contact); ct.forEach((t) => { doc.font('r').fontSize(8.5).fillColor(INK).text(t, px, y, { width: pw }); y = doc.y + 3; }); y += 10; }
      if (c.skills?.length) { sh(T.skills); c.skills.forEach((t) => { doc.rect(px, y + 3.2, 4, 4).fill(acc); doc.font('r').fontSize(8.5).fillColor(INK).text(t, px + 10, y, { width: pw - 10 }); y = doc.y + 3; }); y += 10; }
      if (c.languages?.length) {
        sh(T.langs);
        const LV = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 };
        c.languages.forEach((t) => {
          doc.font('r').fontSize(8.5).fillColor(INK).text(t, px, y, { width: pw }); y = doc.y + 2;
          const m = /\b([ABC][12])\b/i.exec(t), n = m ? LV[m[1].toUpperCase()] : /ojczyst|native|rodzim|muttersprach|рідн/i.test(t) ? 5 : 0;
          if (n) { for (let i = 0; i < 5; i++) doc.roundedRect(px + i * 19, y, 16, 4, 2).fill(i < n ? acc : tint(acc, 0.22)); y += 10; } else y += 2;
        });
        y += 8;
      }
      if (c.certificates?.length) { sh(T.certsShort); c.certificates.forEach((t) => { doc.font('r').fontSize(8.5).fillColor(INK).text(t, px, y, { width: pw }); y = doc.y + 3; }); y += 10; }
      if (c.interests) { sh(T.interests); doc.font('r').fontSize(8.5).fillColor(INK).text(c.interests, px, y, { width: pw }); }
      doc.font('b').fontSize(25).fillColor(INK).text(c.name || '', x, 50, { width: w });
      if (c.headline) doc.font('b').fontSize(11.5).fillColor(acc).text(c.headline, x, undefined, { width: w });
      doc.y += 4;
      flow(doc, c, { x, w, acc, side: true, heading: (t) => { ensure(doc, 50); doc.moveDown(0.9).font('b').fontSize(8.5).fillColor(INK).text(t.toUpperCase(), x, undefined, { width: w, characterSpacing: 1.1 }); const yy = doc.y + 2; doc.moveTo(x, yy).lineTo(x + w, yy).lineWidth(1.3).strokeColor(acc).stroke(); doc.moveDown(0.55); } });
    });
  },

  // Wstęga: kolorowy pas u góry, zdjęcie lub inicjały na jego krawędzi, wyśrodkowane nagłówki sekcji, daty w osobnej kolumnie.
  wstega(c, acc) {
    return make(50, (doc) => {
      const x = 54, w = W - 108, cx = W / 2, D = 92, dx = x + D + 14, dw = x + w - dx;
      doc.rect(0, 0, W, 112).fill(acc);
      doc.circle(cx, 112, 46).fill(WHITE);
      if (PHOTO) drawPhoto(doc, cx, 112, 41);
      else { doc.circle(cx, 112, 41).fill(tint(acc, 0.14)); doc.font('b').fontSize(24).fillColor(acc).text(initials(c.name), cx - 41, 99, { width: 82, align: 'center' }); }
      doc.font('b').fontSize(24).fillColor(INK).text(c.name || '', x, 170, { width: w, align: 'center' });
      if (c.headline) doc.font('b').fontSize(11.5).fillColor(acc).text(c.headline, x, undefined, { width: w, align: 'center' });
      doc.moveDown(0.3).font('r').fontSize(8.5).fillColor(MUTE).text(contactOf(c).join('   ·   '), x, undefined, { width: w, align: 'center' });
      const heading = (t) => {
        ensure(doc, 60); doc.moveDown(1);
        const label = t.toUpperCase(); doc.font('b').fontSize(8.5);
        const lw = doc.widthOfString(label, { characterSpacing: 1.6 }), yy = doc.y + 5;
        doc.moveTo(x, yy).lineTo(cx - lw / 2 - 12, yy).moveTo(cx + lw / 2 + 12, yy).lineTo(x + w, yy).lineWidth(0.6).strokeColor(tint(acc, 0.35)).stroke();
        doc.fillColor(acc).text(label, x, doc.y, { width: w, align: 'center', characterSpacing: 1.6 }); doc.moveDown(0.6);
      };
      const center = (t) => doc.font('r').fontSize(10).fillColor(INK).text(t, x, undefined, { width: w, align: 'center', lineGap: 2 });
      const rows = (items) => items.forEach((e) => {
        ensure(doc, 50);
        const y0 = doc.y;
        doc.font('r').fontSize(8.5).fillColor(MUTE).text(e.period || '', x, y0 + 1, { width: D });
        const yl = doc.y;
        doc.font('b').fontSize(10.3).fillColor(INK).text(e.title + (e.org ? ', ' + e.org : ''), dx, y0, { width: dw });
        (e.bullets || []).forEach((b) => doc.font('r').fontSize(10).fillColor(INK).text('•  ' + b, dx + 6, undefined, { width: dw - 6, lineGap: 1.5 }));
        doc.y = Math.max(yl, doc.y) + 8;
      });
      if (c.summary) { heading(T.profile); center(c.summary); }
      if (c.experience?.length) { heading(T.expShort); rows(c.experience.map((e) => ({ period: e.period, title: e.title, org: e.company, bullets: e.bullets }))); }
      if (c.education?.length) { heading(T.edu); rows(c.education.map((e) => ({ period: e.period, title: e.school, org: e.degree }))); }
      if (c.skills?.length) { heading(T.skills); center(c.skills.join('  ·  ')); }
      if (c.languages?.length) { heading(T.langs); center(c.languages.join('  ·  ')); }
      if (c.certificates?.length) { heading(T.certsShort); center(c.certificates.join('  ·  ')); }
      if (c.interests) { heading(T.interests); center(c.interests); }
      clause(doc, c, x, w);
    });
  },
};

const setDoc = (res, photo) => { T = LBL[res.lang] || LBL.pl; PHOTO = photoBuf(photo); };
export const renderCv = (res, design, photo) => { const d = cleanDesign(design); setDoc(res, photo); return TEMPLATES[d.tpl](res.cv, COLORS[d.color]); };

// Przygotowanie do rozmowy: wypowiedź „o sobie”, mocne strony, pytania z przykładowymi odpowiedziami, braki, pytania do pracodawcy, wynagrodzenie, lista kontrolna.
export const renderInterview = (res, design) => {
  setDoc(res, null);
  const acc = COLORS[cleanDesign(design).color], soft = tint(acc, 0.08), pr = res.prep || null;
  return make(56, (doc) => {
    const x = 56, w = W - 112;
    const head = (t) => { ensure(doc, 90); doc.moveDown(0.6); doc.font('b').fontSize(9).fillColor(acc).text(t.toUpperCase(), x, undefined, { width: w, characterSpacing: 1.2 }); doc.moveDown(0.4); };
    const bullets = (list) => list.forEach((t) => { ensure(doc, 30); const y = doc.y; doc.circle(x + 3, y + 5.5, 2).fill(acc); doc.font('r').fontSize(10).fillColor('#2A3750').text(t, x + 12, y, { width: w - 12, lineGap: 2 }); doc.moveDown(0.3); });
    const box = (text) => {
      doc.font('r').fontSize(10.5); const hh = doc.heightOfString(text, { width: w - 28, lineGap: 2.5 }) + 24;
      ensure(doc, hh + 10); const y = doc.y;
      doc.roundedRect(x, y, w, hh, 8).fill(soft); doc.rect(x, y, 3, hh).fill(acc);
      doc.font('r').fontSize(10.5).fillColor(INK).text(text, x + 16, y + 12, { width: w - 28, lineGap: 2.5 }); doc.y = y + hh + 4;
    };
    doc.font('b').fontSize(9).fillColor(acc).text('PRZYGOTOWANIE DO ROZMOWY', x, 56, { width: w, characterSpacing: 1.4 });
    doc.font('b').fontSize(20).fillColor(INK).text(res.position || '', x, undefined, { width: w });
    doc.font('r').fontSize(10).fillColor(MUTE).text('Pytania, które mogą paść przy tym ogłoszeniu, przykładowe odpowiedzi oparte na Twoim doświadczeniu i plan przygotowań.', x, undefined, { width: w });
    if (pr?.pitch) { head('Opowiedz o sobie (ok. 60 sekund)'); box(pr.pitch); }
    if (pr?.strengths?.length) { head('Twoje mocne strony pod to ogłoszenie'); bullets(pr.strengths); }
    head(`Pytania i przykładowe odpowiedzi (${(res.interview || []).length})`);
    let cat = '';
    (res.interview || []).forEach((it, i) => {
      ensure(doc, 90);
      if (it.cat && it.cat !== cat) { cat = it.cat; doc.moveDown(0.3).font('b').fontSize(10).fillColor(MUTE).text(cat, x, undefined, { width: w }).moveDown(0.3); }
      const y = doc.y; doc.circle(x + 9, y + 8, 9).fill(acc);
      doc.font('b').fontSize(9).fillColor(WHITE).text(String(i + 1), x, y + 3.5, { width: 18, align: 'center' });
      doc.font('b').fontSize(11).fillColor(INK).text(it.q, x + 28, y, { width: w - 28 });
      if (it.why) doc.font('r').fontSize(9).fillColor(MUTE).text(`Co sprawdza rekruter: ${it.why}`, x + 28, undefined, { width: w - 28 });
      doc.moveDown(0.2).font('r').fontSize(10).fillColor('#2A3750').text(it.a, x + 28, undefined, { width: w - 28, lineGap: 2 }).moveDown(0.8);
    });
    if (pr?.gaps?.length) { head('Czego może brakować i jak o tym mówić'); bullets(pr.gaps.map((g) => `${g.gap}: ${g.how}`)); }
    if (pr?.ask?.length) { head('Pytania, które zadasz pracodawcy'); bullets(pr.ask); }
    if (pr?.salary) { head('Rozmowa o wynagrodzeniu'); box(pr.salary); }
    if (pr?.checklist?.length) {
      head('Lista kontrolna');
      pr.checklist.forEach((t) => { ensure(doc, 30); const y = doc.y; doc.roundedRect(x, y + 1, 10, 10, 2).lineWidth(1).strokeColor(acc).stroke(); doc.font('r').fontSize(10).fillColor('#2A3750').text(t, x + 18, y, { width: w - 18, lineGap: 2 }); doc.moveDown(0.35); });
    }
  });
};

export const renderLetter = (res, design) => {
  setDoc(res, null);
  const d = cleanDesign(design), acc = COLORS[d.color], serif = d.tpl === 'elegancki';
  const R = serif ? 'sr' : 'r', B = serif ? 'sb' : 'b';
  return make(56, (doc) => {
    const x = 56, w = W - 112, c = res.cv, city = c.contact?.[2], ct = contactOf(c).join('   ·   ');
    const rule = (th = 0.8, color = acc) => { const y = doc.y + 10; doc.moveTo(x, y).lineTo(x + w, y).lineWidth(th).strokeColor(color).stroke(); doc.y = y + 20; };
    if (d.tpl === 'geometria') {
      doc.polygon([0, 0], [W, 0], [W, 128], [0, 92]).fill(tint(acc, 0.3));
      doc.polygon([0, 0], [W, 0], [W, 86], [0, 112]).fill(acc);
      doc.font(B).fontSize(20).fillColor(WHITE).text(c.name || '', x, 30, { width: w });
      doc.font(R).fontSize(9).fillColor(WHITE).text(ct, x, undefined, { width: w });
      doc.y = 150;
    } else if (d.tpl === 'szwajcarski') {
      doc.rect(x, 52, 11, 11).fill(acc);
      doc.font('b').fontSize(30).fillColor(INK).text(c.name || '', x, 74, { width: w, characterSpacing: -0.6 });
      doc.font('r').fontSize(9).fillColor(MUTE).text(ct, x, undefined, { width: w }); rule(1.1, INK);
    } else if (d.tpl === 'os') {
      doc.font('b').fontSize(22).fillColor(INK).text(c.name || '', x, 56, { width: w });
      doc.font('r').fontSize(9).fillColor(MUTE).text(ct, x, undefined, { width: w }); rule(2.5);
    } else if (d.tpl === 'kreatywny' || d.tpl === 'wstega') {
      if (d.tpl === 'kreatywny') doc.polygon([0, 0], [W, 0], [W, 80], [0, 104]).fill(acc); else doc.rect(0, 0, W, 86).fill(acc);
      doc.font('b').fontSize(20).fillColor(WHITE).text(c.name || '', x, 30, { width: w, align: d.tpl === 'wstega' ? 'center' : 'left' });
      doc.font('r').fontSize(9).fillColor(WHITE).text(ct, x, undefined, { width: w, align: d.tpl === 'wstega' ? 'center' : 'left' });
      doc.y = 136;
    } else if (d.tpl === 'monogram') {
      const cx = W / 2;
      doc.circle(cx, 66, 20).lineWidth(1).strokeColor(acc).stroke();
      doc.font('sr').fontSize(12).fillColor(acc).text(initials(c.name), cx - 20, 59, { width: 40, align: 'center' });
      doc.font('sb').fontSize(22).fillColor(INK).text(c.name || '', x, 96, { width: w, align: 'center' });
      doc.font('r').fontSize(9).fillColor(MUTE).text(ct, x, undefined, { width: w, align: 'center' }); rule(0.7, LINE);
    } else if (serif) {
      const cx = W / 2;
      doc.rect(cx - 18, 46, 36, 36).lineWidth(0.7).strokeColor(acc).stroke();
      doc.font('sb').fontSize(12).fillColor(acc).text(initials(c.name), cx - 18, 57, { width: 36, align: 'center' });
      doc.font('sb').fontSize(22).fillColor(INK).text(c.name || '', x, 94, { width: w, align: 'center' });
      doc.font('sr').fontSize(9).fillColor(MUTE).text(ct, x, undefined, { width: w, align: 'center' });
      const y = doc.y + 10; doc.moveTo(x, y).lineTo(x + w, y).moveTo(x, y + 3).lineTo(x + w, y + 3).lineWidth(0.7).strokeColor(acc).stroke(); doc.y = y + 22;
    } else {
      if (d.tpl === 'nowoczesny') doc.rect(0, 0, 10, H).fill(acc);
      if (d.tpl === 'kompetencje') doc.rect(W - 10, 0, 10, H).fill(tint(acc, 0.35));
      doc.font(B).fontSize(20).fillColor(acc).text(c.name || '', x, 56, { width: w });
      doc.font(R).fontSize(9).fillColor(MUTE).text(ct, x, undefined, { width: w }); rule();
    }
    doc.font(R).fontSize(10).fillColor(MUTE).text(`${city ? city + ', ' : ''}${new Date().toLocaleDateString(T.locale)}`, x, undefined, { width: w, align: 'right' }).moveDown(1.4);
    String(res.letter || '').split(/\n\n+/).forEach((p) => doc.font(R).fontSize(serif ? 11 : 10.5).fillColor(INK).text(p, x, undefined, { width: w, lineGap: 3 }).moveDown(0.9));
  });
};
