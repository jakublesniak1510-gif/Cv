// Wersja ATS .txt (PR Q): czysty tekst CV do formularzy portali, w których PDF się nie wczytuje – te same dane i kolejność
// co w PDF, standardowe nazwy sekcji w języku CV (LBL z lib/pdf.js), bez tabel, kolumn i grafiki. Końce linii CRLF (Notatnik).
import { LBL } from './pdf.js';
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export function cvToText(r) {
  const c = r?.cv || {}, L = LBL[r?.lang] || LBL.pl, out = [], sec = (title, lines) => { const l = lines.filter((x) => typeof x === 'string'); if (l.some(Boolean)) out.push('', title.toUpperCase(), ...l); };
  out.push(clean(c.name).toUpperCase());
  if (clean(c.headline)) out.push(clean(c.headline));
  const contact = (c.contact || []).map(clean).filter(Boolean); if (contact.length) out.push(contact.join(' | '));
  sec(L.summary, [clean(c.summary)]);
  sec(L.exp, (c.experience || []).flatMap((e, i) => [i ? '' : null, [clean(e.title), clean(e.company)].filter(Boolean).join(', ') + (clean(e.period) ? ` (${clean(e.period)})` : ''), ...(e.bullets || []).map(clean).filter(Boolean).map((b) => `- ${b}`)]));
  sec(L.edu, (c.education || []).map((e) => [clean(e.degree), clean(e.school)].filter(Boolean).join(', ') + (clean(e.period) ? ` (${clean(e.period)})` : '')));
  sec(L.skills, [(c.skills || []).map(clean).filter(Boolean).join(', ')]);
  sec(L.langs, (c.languages || []).map(clean));
  sec(L.certs, (c.certificates || []).map(clean));
  sec(L.interests, [clean(c.interests)]);
  if (clean(c.clause)) out.push('', clean(c.clause));
  return out.join('\r\n').replace(/(\r\n){3,}/g, '\r\n\r\n') + '\r\n';
}
