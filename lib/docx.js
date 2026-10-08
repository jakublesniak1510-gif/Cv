import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType } from 'docx';
import { LBL } from './pdf.js';
import { COLORS, cleanDesign } from './designs.js';

// Edytowalne CV i list w formacie Word: prosty, czytelny dla systemów ATS układ w kolorze wybranego szablonu.
const FONT = 'Calibri';
const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: FONT, size: 21, ...o });
const para = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 80 }, ...o });

function cvDoc(res, acc) {
  const T = LBL[res.lang] || LBL.pl, c = res.cv || {};
  const head = (t) => new Paragraph({
    children: [run(t.toUpperCase(), { bold: true, size: 20, color: acc, characterSpacing: 20 })],
    spacing: { before: 260, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: acc, space: 2 } },
  });
  const bullet = (t) => new Paragraph({ children: [run(t)], bullet: { level: 0 }, spacing: { after: 40 } });
  const out = [
    para(run(c.name, { bold: true, size: 40 }), { spacing: { after: 40 } }),
    c.headline ? para(run(c.headline, { size: 24, color: acc })) : null,
    (c.contact || []).length ? para(run(c.contact.join('  •  '), { size: 19, color: '546178' }), { spacing: { after: 120 } }) : null,
  ];
  if (c.summary) out.push(head(T.summary), para(run(c.summary)));
  if (c.experience?.length) {
    out.push(head(T.exp));
    for (const e of c.experience) {
      out.push(new Paragraph({ children: [run(e.title, { bold: true }), run(e.company ? `, ${e.company}` : ''), run(`\t${e.period || ''}`, { color: '546178', size: 19 })], tabStops: [{ type: TabStopType.RIGHT, position: 9600 }], spacing: { before: 120, after: 40 } }));
      (e.bullets || []).forEach((b) => out.push(bullet(b)));
    }
  }
  if (c.education?.length) {
    out.push(head(T.edu));
    for (const e of c.education) out.push(new Paragraph({ children: [run(e.school, { bold: true }), run(e.degree ? `, ${e.degree}` : ''), run(`\t${e.period || ''}`, { color: '546178', size: 19 })], tabStops: [{ type: TabStopType.RIGHT, position: 9600 }], spacing: { after: 60 } }));
  }
  if (c.skills?.length) out.push(head(T.skills), para(run(c.skills.join(', '))));
  if (c.languages?.length) out.push(head(T.langs), para(run(c.languages.join(', '))));
  if (c.certificates?.length) { out.push(head(T.certs)); c.certificates.forEach((x) => out.push(bullet(x))); }
  if (c.interests) out.push(head(T.interests), para(run(c.interests)));
  if (c.clause) out.push(para(run(c.clause, { size: 16, color: '6B7890', italics: true }), { spacing: { before: 360 } }));
  return out.filter(Boolean);
}

function letterDoc(res, acc) {
  const c = res.cv || {};
  return [
    para(run(c.name, { bold: true, size: 32 }), { spacing: { after: 40 } }),
    para(run((c.contact || []).join('  •  '), { size: 19, color: '546178' }), { border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: acc, space: 6 } }, spacing: { after: 360 } }),
    para(run(new Date().toLocaleDateString((LBL[res.lang] || LBL.pl).locale || 'pl-PL')), { alignment: AlignmentType.RIGHT, spacing: { after: 360 } }),
    ...String(res.letter || '').split(/\n{2,}/).map((p) => new Paragraph({ children: p.split('\n').flatMap((line, i) => (i ? [new TextRun({ break: 1 }), run(line)] : [run(line)])), spacing: { after: 200, line: 300 } })),
  ];
}

export async function renderDocx(res, doc, design) {
  const acc = COLORS[cleanDesign(design).color].replace('#', '');
  const d = new Document({
    creator: 'CV Pod Ogłoszenie', title: doc === 'letter' ? 'List motywacyjny' : 'CV',
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: doc === 'letter' ? letterDoc(res, acc) : cvDoc(res, acc) }],
  });
  return Packer.toBuffer(d);
}
