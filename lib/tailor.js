// Proste dopasowanie CV do ogłoszenia (bez AI). Używane w trybie zapasowym serwera
// i w podglądzie. Produkcyjnie dokumenty pisze Claude (lib/generate.js).
export function tailor({ profile: p, ad, withLetter, addons = {} }) {
  const norm = (s) => String(s || '').toLowerCase();
  const list = (s) => String(s || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  const adL = norm(ad.text);
  const words = (s) => norm(s).split(/[^a-ząćęłńóśźż0-9+#]+/).filter((w) => w.length >= 3);
  const stem = (x) => x.slice(0, x.length >= 6 ? 5 : Math.max(3, x.length - 1));
  const inText = (phrase, text) => { const w = words(phrase); return w.length > 0 && w.every((x) => text.includes(stem(x))); };
  const inAd = (phrase) => inText(phrase, adL);

  const first = (ad.text.split(/[.\n]/).find((l) => l.trim()) || 'Stanowisko').trim();
  const position = (ad.title || first).slice(0, 70);
  const skills = list(p.skills);
  const matched = skills.filter(inAd);
  const ordered = [...matched, ...skills.filter((s) => !matched.includes(s))];

  const score = (b) => words(b).filter((w) => w.length >= 5 && adL.includes(w.slice(0, 5))).length;
  const experience = (p.experience || []).filter((e) => e.title || e.company).map((e) => ({
    title: e.title, company: e.company, period: [e.from, e.to].filter(Boolean).join(' – '),
    bullets: String(e.description || '').split('\n').map((x) => x.trim()).filter(Boolean).map((b, i) => ({ b, i, s: score(b) }))
      .sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.b),
  }));

  const lead = `Aplikuję na stanowisko: ${position}.` + (matched.length ? ` Wnoszę praktyczne doświadczenie w obszarach: ${matched.slice(0, 4).join(', ')}.` : '');
  const cv = {
    name: p.name, headline: ad.title || p.headline || '',
    contact: [p.phone, p.email, p.city, p.link].filter(Boolean),
    summary: [lead, p.summary].filter(Boolean).join(' '),
    experience,
    education: (p.education || []).filter((e) => e.school).map((e) => ({ school: e.school, degree: e.degree, period: [e.from, e.to].filter(Boolean).join(' – ') })),
    skills: ordered, languages: list(p.languages), certificates: list(p.certificates), interests: p.interests || '',
    clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.',
  };

  // Raport: wymagania to fragmenty zdań po słowach "wymagamy/wymagania/oczekujemy" i "mile widziane".
  const facts = norm([p.skills, p.languages, p.certificates, p.summary, p.notes, ...(p.experience || []).map((e) => `${e.title} ${e.description}`), ...(p.education || []).map((e) => `${e.school} ${e.degree}`)].join(' '));
  const reqText = ad.text.split(/(?<=[^\s.]{4,}[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])|\n+/).filter((x) => /wymaga|oczekuj|mile widzian|zakres|szukamy os[óo]b/i.test(x)).join(', ');
  const reqs = [...new Set(reqText.replace(/(wymaga\w*|oczekuj\w*|mile widzian\w*|zakres\w*)( obowiązków)?:?/gi, ',').split(/[,;]|\.\s*$| i (?=\p{L})/u).map((x) => x.trim().replace(/^(min\.|minimum)\s*/i, '').replace(/\.$/, '')).filter((x) => x.length > 3 && x.length < 60))].slice(0, 12);
  // Wymaganie spełnione, gdy w faktach jest większość jego znaczących słów.
  const covers = (r, text) => { const w = words(r).filter((x) => x.length >= 4); return w.length > 0 && w.filter((x) => text.includes(stem(x))).length / w.length >= 0.5; };
  const found = [...new Set([...matched, ...reqs.filter((r) => covers(r, facts) && !matched.some((m) => inText(m, norm(r))))])].slice(0, 12);
  const missing = reqs.filter((r) => !covers(r, facts) && !found.some((f) => inText(f, norm(r)))).map((r) => ({ keyword: r, hint: `Jeśli masz doświadczenie lub kwalifikacje w zakresie „${r}”, dopisz je w kreatorze, a pojawią się w CV.` }));

  const e0 = experience[0];
  const letter = withLetter ? [
    'Szanowni Państwo,',
    `z dużym zainteresowaniem odpowiadam na ogłoszenie na stanowisko ${position}.` + (e0 ? ` Obecnie pracuję jako ${e0.title}${e0.company ? ' w firmie ' + e0.company : ''}, gdzie ${(e0.bullets[0] || 'zdobywam doświadczenie istotne dla tej roli').replace(/^./, (c) => c.toLowerCase())}.` : ''),
    matched.length ? `Wymagania z ogłoszenia dobrze odpowiadają moim kompetencjom: ${matched.slice(0, 5).join(', ')}. Na co dzień łączę je z rzetelnością i dbałością o rezultat.` : 'Chętnie przedstawię, jak moje dotychczasowe doświadczenie przełoży się na potrzeby Państwa zespołu.',
    'Będę wdzięczny/a za możliwość rozmowy, podczas której opowiem o swoich osiągnięciach i oczekiwaniach.',
    `Z poważaniem,\n${p.name}`,
  ].join('\n\n') : '';

  const interview = addons.interview ? [
    ['Proszę opowiedzieć o sobie.', `Zacznij od obecnej pracy${e0 ? ` (${e0.title}${e0.company ? ', ' + e0.company : ''})` : ''} i powiedz w 2-3 zdaniach, co z niej łączy się z tym stanowiskiem.`],
    [`Dlaczego interesuje Pana/Panią stanowisko ${position}?`, 'Nawiąż do konkretnych obowiązków z ogłoszenia i pokaż, które z nich już wykonywałeś.'],
    ...matched.slice(0, 3).map((s) => [`Jakie ma Pan/Pani doświadczenie w obszarze: ${s}?`, `Podaj jeden konkretny przykład z pracy, w której używałeś umiejętności „${s}”, i jego efekt.`]),
    ['Jak radzi sobie Pan/Pani w trudnej sytuacji z klientem lub współpracownikiem?', 'Opowiedz krótką historię: sytuacja, Twoje działanie, rezultat.'],
    ...missing.slice(0, 1).map((m) => [`W ogłoszeniu wymagamy: ${m.keyword}. Jak to wygląda u Pana/Pani?`, 'Odpowiedz uczciwie. Jeśli tego nie masz, powiedz, jak szybko możesz się nauczyć i co już robisz w tym kierunku.']),
    ['Jakie ma Pan/Pani pytania do nas?', 'Przygotuj 2 pytania o zespół, wdrożenie lub typowy dzień pracy.'],
  ].map(([q, a]) => ({ q, a })) : [];

  const messages = addons.messages ? {
    linkedin: `Dzień dobry, zauważyłem/am ogłoszenie na stanowisko ${position}. ${e0 ? `Pracuję jako ${e0.title}` : 'Mam doświadczenie'}${matched.length ? ` i na co dzień zajmuję się: ${matched.slice(0, 3).join(', ')}` : ''}. Wysłałem/am aplikację i chętnie porozmawiam o tej roli. Pozdrawiam, ${p.name}`.slice(0, 600),
    email: { subject: `Aplikacja na stanowisko ${position} – ${p.name}`, body: `Dzień dobry,\n\nw załączniku przesyłam CV${withLetter ? ' i list motywacyjny' : ''} w odpowiedzi na ogłoszenie na stanowisko ${position}.${matched.length ? ` Moje doświadczenie obejmuje m.in.: ${matched.slice(0, 3).join(', ')}.` : ''}\n\nChętnie odpowiem na pytania i spotkam się na rozmowie.\n\nZ poważaniem,\n${p.name}${p.phone ? '\n' + p.phone : ''}` },
  } : null;

  // Bez AI treść zostaje po polsku; przy innym języku zmieniają się tylko etykiety szablonu.
  const lang = ['en', 'de', 'uk', 'es', 'fr'].includes(ad.lang) ? ad.lang : 'pl';
  return { lang, untranslated: lang !== 'pl' || undefined, position, company: '', keywords: matched, match: { found, missing }, cv, letter, interview, messages };
}

// Uproszczone poprawki bez AI (podgląd i tryb bez klucza).
export function reviseFallback({ result, doc, instruction }) {
  const ins = String(instruction || '').toLowerCase();
  if (doc === 'letter') {
    let paras = String(result.letter || '').split(/\n\n+/);
    if (/skr[óo]/.test(ins) && paras.length > 4) paras = [...paras.slice(0, 2), ...paras.slice(-2)];
    return { letter: paras.join('\n\n'), note: /skr[óo]/.test(ins) ? 'Skrócono list o jeden akapit.' : 'W trybie bez AI można tylko skracać. Pełne poprawki działają po dodaniu klucza AI.' };
  }
  const cv = JSON.parse(JSON.stringify(result.cv));
  const fact = /nowy fakt o sobie: "([^"]+)"/i.exec(String(instruction || ''))?.[1];
  if (fact) { cv.skills = [...cv.skills, fact]; return { cv, note: 'Dopisano do umiejętności. Z kluczem AI fakt trafi też w odpowiednie miejsce opisu doświadczenia.' }; }
  if (/skr[óo]/.test(ins)) cv.experience.forEach((e) => (e.bullets = e.bullets.slice(0, 2)));
  return { cv, note: /skr[óo]/.test(ins) ? 'Zostawiono po 2 najważniejsze punkty przy każdym stanowisku.' : 'W trybie bez AI można tylko skracać. Pełne poprawki działają po dodaniu klucza AI.' };
}

// Bez AI: wymagania z ogłoszenia i to, które z nich widać w tekście CV (darmowy skaner).
export function scanFallback({ cvText, adText }) {
  const r = tailor({ profile: { name: '', skills: '', notes: cvText, experience: [], education: [] }, ad: { text: adText }, withLetter: false });
  return { found: r.match.found, missing: r.match.missing };
}

// Bez AI nie tłumaczymy: zwracamy kopię oznaczoną jako nieprzetłumaczona (etykiety sekcji i tak zmieniają się w szablonie).
export const translateFallback = (result, lang) => ({ ...JSON.parse(JSON.stringify(result)), lang, untranslated: true });

// Bez AI: odpowiedzi asystenta z krótkiej bazy wiedzy.
const KB = [
  [/przerw|luk/, 'Przerwę w pracy najlepiej opisać krótko i uczciwie, np. „2021–2022: opieka nad dzieckiem” albo „kurs Excel w trakcie przerwy”. Nie ukrywaj jej, bo rekruter i tak zauważy daty. W kreatorze możesz dopisać to w polu „Uwagi dla autora”.'],
  [/zdj[eę]c/, 'Zdjęcie w CV nie jest obowiązkowe, ale w Polsce wielu pracodawców go oczekuje. Wybierz aktualne, wyraźne zdjęcie twarzy na jasnym tle. W kreatorze dodasz je w kroku „Twoje dane”.'],
  [/rodo|klauzul|zgod/, 'Klauzulę o przetwarzaniu danych warto dodać, zwłaszcza gdy ogłoszenie o nią prosi. Dodajemy ją automatycznie na końcu każdego CV. Jeśli pracodawca podaje własne brzmienie, użyj jego wersji.'],
  [/d[łl]ugo|stron/, 'Najlepiej, żeby CV zmieściło się na jednej stronie, a przy dłuższym doświadczeniu na dwóch. Liczą się konkrety pod ogłoszenie, nie liczba stron.'],
  [/list motywac/, 'List motywacyjny warto dołączyć, gdy ogłoszenie o niego prosi albo gdy zmieniasz branżę. Powinien mieć 3-4 akapity i odnosić się do konkretnych wymagań z ogłoszenia.'],
  [/ats|system/, 'Systemy ATS odczytują tekst z CV. Pomaga prosty układ, standardowe nazwy sekcji i słowa kluczowe z ogłoszenia, jeśli są prawdziwe. Najbezpieczniejszy jest szablon „Klasyczny ATS”.'],
  [/umiej[eę]tno|kompeten/, 'Wpisz umiejętności, które wymienia ogłoszenie i które naprawdę masz, w takim samym brzmieniu. Twarde umiejętności (programy, uprawnienia) są ważniejsze niż ogólne cechy.'],
  [/cen|koszt|ile/, 'CV kosztuje 39 zł, CV z listem 49 zł, a Pakiet 3 (trzy CV pod ten sam zawód i list do każdego) 79 zł. W cenie są raport dopasowania i darmowa poprawka, a po zakupie dostajesz swój kod −10 zł na kolejne zamówienie, który możesz też dać znajomym.'],
];
export function assistantFallback(question) {
  const q = String(question || '').toLowerCase();
  const hit = KB.find(([re]) => re.test(q));
  return hit ? hit[1] : 'Dobre pytanie. Bez połączenia z AI odpowiadam tylko na najczęstsze pytania (przerwa w pracy, zdjęcie, RODO, długość CV, list motywacyjny, ATS, ceny). Napisz o jednym z tych tematów albo zajrzyj do FAQ i poradnika.';
}

