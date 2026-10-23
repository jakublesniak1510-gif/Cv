// Wyciągacz wymagań z ogłoszenia po angielsku i niemiecku (widżet „Keyword extractor” w poradnikach EN/DE).
// Polskie ogłoszenia obsługuje scanFallback (lib/tailor.js). Tu bez AI: szukamy fragmentów po nagłówkach typu
// „Requirements:” / „Ihr Profil:” i dzielimy je na krótkie frazy. Nic nie jest zapisywane.
const MARK = {
  en: /\b(requirements?|essential( criteria| skills)?|desirable( criteria| skills)?|nice to have|you (will )?(have|bring|need)|what you('ll| will) need|skills( and experience)?|qualifications?|person specification|experience (of|in|with)|must have)\b/i,
  de: /(anforderungen|ihr profil|dein profil|das bringen sie mit|das bringst du mit|sie bringen mit|wir erwarten|voraussetzungen|qualifikation(en)?|kenntnisse|von vorteil|wünschenswert|erfahrung (in|mit|im))/i,
};
const HEAD = {
  en: /^(requirements?|essential( criteria| skills)?|desirable( criteria| skills)?|nice to have|you (will )?(have|bring|need)|what you('ll| will) need|skills( and experience)?|qualifications?|person specification|must have)\s*:?\s*/i,
  de: /^(anforderungen|ihr profil|dein profil|das bringen sie mit|das bringst du mit|sie bringen mit|wir erwarten|voraussetzungen|qualifikation(en)?|wünschenswert)\s*:?\s*/i,
};
const SPLIT = { en: /[,;•·]|\s+(?:and|or)\s+(?=\p{L})|\.\s|\n/u, de: /[,;•·]|\s+(?:und|oder|sowie)\s+(?=\p{L})|\.\s|\n/u };
const TRIM = { en: /^(a|an|the|good|strong|proven|excellent|some|any)\s+/i, de: /^(gute|guter|gutes|sehr gute|erste|einschlägige|idealerweise|mehrjährige)\s+/i };
// Stałe zwroty z „and”/„und”, których nie dzielimy.
const KEEP = /\b(health and safety|terms and conditions|chat and email|returns and complaints|Arbeits- und Gesundheitsschutz|Wareneingang und -ausgang|Wareneingang und Warenausgang|in Wort und Schrift|Chat und E-Mail)\b/gi;
const NOISE = { en: /^(we|you|our|the role|this role|apply|salary|benefits?)\b/i, de: /^(wir|sie|du|unser|bewerben|gehalt|benefits?)\b/i };

export function adKeywords(text, lang) {
  const l = lang === 'de' ? 'de' : 'en', t = String(text || '').replace(/\r/g, '');
  const parts = t.split(/\n+|(?<=[.!?])\s+(?=\p{Lu})/u).filter((x) => MARK[l].test(x));
  const out = [];
  for (const p of parts) {
    const body = p.includes(':') ? p.slice(p.indexOf(':') + 1) : p.replace(HEAD[l], '');
    for (let x of body.replace(KEEP, (m) => m.replace(/ /g, '\u0001')).split(SPLIT[l])) {
      x = x.replace(/\u0001/g, ' ').replace(/^[\s\-–*]+|[\s.:!]+$/g, '').replace(HEAD[l], '').replace(TRIM[l], '').replace(/\s+(von vorteil|wünschenswert|is desirable|is essential|desirable|essential)$/i, '').replace(/\s*\((m\/w\/d|w\/m\/d|m\/f\/d)\)\s*/gi, ' ').trim();
      if (x.length > 2 && x.length < 60 && !/[<>]/.test(x) && !NOISE[l].test(x) && !out.some((o) => o.toLowerCase() === x.toLowerCase())) out.push(x);
    }
  }
  return out.slice(0, 20);
}
