// Profil LinkedIn (dodatek 19 zł): limity pól LinkedIna i ich egzekwowanie po generacji (model czasem przekracza limit),
// oraz kontrola jakości profilu (lib/qa.js): długości, liczba umiejętności, firmy spoza danych klienta.
export const LI = { headline: 220, about: 2600, skillsMin: 10, skillsMax: 15, experience: 3, tips: 6, expText: 600 };

// Cięcie na granicy słowa (nagłówek) albo zdania/akapitu (tekst), bez urwanego wyrazu na końcu.
export function cutWords(s, max) {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1), i = cut.lastIndexOf(' ');
  return (i > max * 0.6 ? cut.slice(0, i) : s.slice(0, max)).replace(/[\s,;:|–-]+$/, '');
}
export function cutText(s, max) {
  s = String(s ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max), end = Math.max(cut.lastIndexOf('\n\n'), ...['. ', '! ', '? '].map((x) => cut.lastIndexOf(x) + 1));
  return (end > max * 0.6 ? cut.slice(0, end) : cutWords(cut, max - 1)).trim();
}

export function clampLinkedin(l) {
  if (!l || typeof l !== 'object') return null;
  const seen = new Set();
  const skills = (Array.isArray(l.skills) ? l.skills : []).map((x) => cutWords(x, 60)).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()));
  return {
    headline: cutWords(l.headline, LI.headline),
    about: cutText(l.about, LI.about),
    skills: skills.slice(0, LI.skillsMax),
    experience: (Array.isArray(l.experience) ? l.experience : []).filter((e) => e && e.text).slice(0, LI.experience)
      .map((e) => ({ title: cutWords(e.title, 100), company: cutWords(e.company, 100), text: cutText(e.text, LI.expText) })),
    tips: (Array.isArray(l.tips) ? l.tips : []).map((t) => cutWords(t, 200)).filter(Boolean).slice(0, LI.tips),
  };
}

// Kontrola jakości profilu: same kody i liczby (bez treści). sameName/inProfile przychodzą z lib/qa.js.
export function linkedinFlags(l, { ordered = false, firms = [], sameName, inProfile }) {
  const out = [];
  if (!l) return ordered ? [{ code: 'li_brak', level: 'critical' }] : out;
  if (!l.headline || !l.about) out.push({ code: 'li_brak', level: 'critical' });
  if ((l.headline || '').length > LI.headline || (l.about || '').length > LI.about) out.push({ code: 'li_dlugosc', level: 'warn' });
  if ((l.skills || []).length < LI.skillsMin) out.push({ code: 'li_umiejetnosci', level: 'warn', n: (l.skills || []).length });
  const bad = (l.experience || []).filter((e) => e.company && !sameName(e.company, firms) && !inProfile(e.company)).length;
  if (bad) out.push({ code: 'li_firma_spoza_profilu', level: firms.length ? 'critical' : 'warn', n: bad });
  return out;
}
