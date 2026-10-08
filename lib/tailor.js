// Proste dopasowanie CV do ogłoszenia (bez AI). Używane w trybie zapasowym serwera
// i w podglądzie. Produkcyjnie dokumenty pisze Claude (lib/generate.js).
export function tailor({ profile: p, ad, withLetter }) {
  const norm = (s) => String(s || '').toLowerCase();
  const list = (s) => String(s || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  const adL = norm(ad.text);
  const words = (s) => norm(s).split(/[^a-ząćęłńóśźż0-9+#]+/).filter((w) => w.length >= 3);
  const inAd = (phrase) => { const w = words(phrase); return w.length > 0 && w.every((x) => adL.includes(x.slice(0, x.length >= 6 ? 5 : Math.max(3, x.length - 1)))); };

  const first = (ad.text.split(/[.\n]/).find((l) => l.trim()) || 'Stanowisko').trim();
  const position = (ad.title || first).slice(0, 70);
  const skills = list(p.skills);
  const matched = skills.filter(inAd);
  const ordered = [...matched, ...skills.filter((s) => !matched.includes(s))];

  const score = (b) => words(b).filter((w) => w.length >= 5 && adL.includes(w.slice(0, 5))).length;
  const experience = (p.experience || []).map((e) => ({
    title: e.title, company: e.company, period: [e.from, e.to].filter(Boolean).join(' – '),
    bullets: list(String(e.description || '').replace(/\n/g, ';')).map((b, i) => ({ b, i, s: score(b) }))
      .sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.b),
  }));

  const lead = `Aplikuję na stanowisko ${position}.` + (matched.length ? ` Wnoszę praktyczne doświadczenie w obszarach: ${matched.slice(0, 4).join(', ')}.` : '');
  const cv = {
    name: p.name, headline: ad.title || p.headline || '',
    contact: [p.phone, p.email, p.city, p.link].filter(Boolean),
    summary: [lead, p.summary].filter(Boolean).join(' '),
    experience,
    education: (p.education || []).map((e) => ({ school: e.school, degree: e.degree, period: [e.from, e.to].filter(Boolean).join(' – ') })),
    skills: ordered, languages: list(p.languages), certificates: list(p.certificates), interests: p.interests || '',
    clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.',
  };

  const e0 = experience[0];
  const letter = withLetter ? [
    'Szanowni Państwo,',
    `z dużym zainteresowaniem odpowiadam na ogłoszenie na stanowisko ${position}.` + (e0 ? ` Obecnie pracuję jako ${e0.title}${e0.company ? ' w firmie ' + e0.company : ''}, gdzie ${(e0.bullets[0] || 'zdobywam doświadczenie istotne dla tej roli').replace(/^./, (c) => c.toLowerCase())}.` : ''),
    matched.length ? `Wymagania z ogłoszenia dobrze odpowiadają moim kompetencjom: ${matched.slice(0, 5).join(', ')}. Na co dzień łączę je z rzetelnością i dbałością o rezultat.` : 'Chętnie przedstawię, jak moje dotychczasowe doświadczenie przełoży się na potrzeby Państwa zespołu.',
    'Będę wdzięczny/a za możliwość rozmowy, podczas której opowiem o swoich osiągnięciach i oczekiwaniach.',
    `Z poważaniem,\n${p.name}`,
  ].join('\n\n') : '';

  return { position, company: '', keywords: matched, cv, letter };
}
