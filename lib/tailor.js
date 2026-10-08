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

  // Przygotowanie do rozmowy (wersja bez AI): pytania w kategoriach, cel pytania, szkic odpowiedzi i plan przygotowań.
  const job = e0 ? `${e0.title}${e0.company ? ' w firmie ' + e0.company : ''}` : '';
  const proof = (s) => { const e = experience.find((x) => x.bullets.some((b) => inText(s, norm(b)))); const b = e?.bullets.find((x) => inText(s, norm(x))); return b ? `${b.replace(/\.$/, '')} (${e.title})` : ''; };
  const interview = addons.interview ? [
    ['Ogólne', 'Proszę opowiedzieć o sobie.', 'Czy potrafisz w minutę pokazać, że Twoje doświadczenie pasuje do tej roli.', 'Użyj gotowej wypowiedzi z sekcji „Opowiedz o sobie” powyżej. Mów o pracy, nie o życiu prywatnym, i skończ zdaniem, dlaczego aplikujesz właśnie tutaj.'],
    ['Ogólne', `Dlaczego interesuje Pana/Panią stanowisko ${position}?`, 'Motywację i to, czy przeczytałeś ogłoszenie.', `Odnieś się do 2 obowiązków z ogłoszenia, które już znasz z praktyki${matched.length ? ` (np. ${matched.slice(0, 2).join(', ')})` : ''}, i powiedz, co chcesz rozwijać w tej roli.`],
    ['Ogólne', 'Dlaczego chce Pan/Pani zmienić pracę?', 'Czy odchodzisz „do czegoś”, a nie „od czegoś”.', 'Mów o rozwoju i o tym, co daje nowa rola. Nie krytykuj obecnego pracodawcy.'],
    ...matched.slice(0, 3).map((m) => ['Doświadczenie', `Jakie ma Pan/Pani doświadczenie w obszarze: ${m}?`, 'Czy umiejętność z CV jest poparta praktyką.', proof(m) ? `Opowiedz o tym konkretnie: ${proof(m)}. Dodaj, jak często to robiłeś i jaki był efekt.` : `Podaj jeden konkretny przykład z pracy, w której używałeś umiejętności „${m}”, i jego efekt (liczba, czas, jakość).`]),
    ...(e0 ? [['Doświadczenie', `Jak wyglądał Pana/Pani typowy dzień jako ${e0.title}?`, 'Czy Twoje obowiązki są podobne do tych w ogłoszeniu.', `Opisz 3-4 główne zadania${e0.bullets[0] ? `, zaczynając od: ${e0.bullets[0].replace(/\.$/, '').toLowerCase()}` : ''}. Podkreśl te, które pokrywają się z ogłoszeniem.`]] : []),
    ['Sytuacyjne', 'Proszę opisać sytuację, w której popełnił Pan/Pani błąd. Co Pan/Pani zrobił(a)?', 'Odpowiedzialność i wyciąganie wniosków.', 'Schemat STAR: krótko sytuacja i zadanie, potem co zrobiłeś, żeby naprawić błąd, i czego się nauczyłeś. Wybierz prawdziwy, niewielki błąd z pracy.'],
    ['Sytuacyjne', 'Jak radzi sobie Pan/Pani w trudnej sytuacji z klientem lub współpracownikiem?', 'Komunikację i spokój pod presją.', 'Schemat STAR: sytuacja, Twoje działanie, rezultat. Pokaż, że słuchasz, szukasz rozwiązania i dotrzymujesz ustaleń.'],
    ['Sytuacyjne', 'Proszę opowiedzieć o sukcesie zawodowym, z którego jest Pan/Pani dumny/a.', 'Co uważasz za dobrą pracę i czy umiesz mówić o efektach.', experience.flatMap((e) => e.bullets).find((b) => /\d/.test(b)) ? `Dobry kandydat na tę historię: ${experience.flatMap((e) => e.bullets).find((b) => /\d/.test(b))}. Opowiedz ją w schemacie STAR i zakończ liczbą.` : 'Wybierz jeden konkretny efekt swojej pracy (np. szybciej, taniej, mniej błędów) i opowiedz go w schemacie STAR.'],
    ...missing.slice(0, 2).map((m) => ['Trudne', `W ogłoszeniu wymagamy: ${m.keyword}. Jak to wygląda u Pana/Pani?`, 'Jak podchodzisz do braków i czy szybko się uczysz.', 'Odpowiedz uczciwie. Powiedz, co już masz zbliżonego, i jak konkretnie uzupełnisz brak (kurs, praktyka, termin).']),
    ['Trudne', 'Jakie są Pana/Pani oczekiwania finansowe?', 'Czy mieścisz się w budżecie i znasz swoją wartość.', 'Podaj widełki netto lub brutto (powiedz które), oparte na stawkach dla tego stanowiska w Twoim mieście. Jeśli ogłoszenie podaje widełki, odnieś się do nich.'],
  ].slice(0, 12).map(([cat, q, why, a]) => ({ cat, q, why, a })) : [];
  const prep = addons.interview ? {
    pitch: [`Nazywam się ${p.name}${job ? ` i obecnie pracuję jako ${job}` : ''}.`, experience[1] ? `Wcześniej pracowałem/am jako ${experience[1].title}${experience[1].company ? ' w ' + experience[1].company : ''}.` : '', matched.length ? `Na co dzień zajmuję się m.in.: ${matched.slice(0, 3).join(', ')}, czyli tym, czego wymagacie w ogłoszeniu.` : '', e0?.bullets[0] ? `Przykład z mojej pracy: ${e0.bullets[0].replace(/\.$/, '').toLowerCase()}.` : '', `Aplikuję na stanowisko ${position}, bo chcę wykorzystać to doświadczenie i dalej rozwijać się w tej dziedzinie.`].filter(Boolean).join(' '),
    strengths: (matched.length ? matched : skills).slice(0, 3).map((m) => (proof(m) ? `${m}: ${proof(m)}` : m)),
    gaps: missing.slice(0, 3).map((m) => ({ gap: m.keyword, how: 'Nie udawaj. Powiedz, co masz zbliżonego, i jak szybko to uzupełnisz.' })),
    ask: ['Jak wygląda typowy dzień na tym stanowisku?', 'Po czym poznają Państwo, że nowa osoba dobrze się sprawdza po 3 miesiącach?', 'Jak wygląda wdrożenie i kto będzie moim przełożonym?', 'Z jakimi wyzwaniami mierzy się teraz zespół?', 'Jakie są kolejne etapy rekrutacji i kiedy mogę spodziewać się odpowiedzi?'],
    salary: 'Przed rozmową sprawdź stawki dla tego stanowiska w Twoim mieście i ustal widełki: minimum, które przyjmiesz, i kwotę, o którą poprosisz. Mów konkretnie i dodaj, czy to kwota netto czy brutto. Jeśli ogłoszenie podaje widełki, celuj w ich środek lub górę i uzasadnij to doświadczeniem.',
    checklist: ['Przeczytaj ogłoszenie jeszcze raz i zaznacz 3 najważniejsze wymagania.', 'Sprawdź stronę firmy: czym się zajmuje, gdzie działa, ostatnie wiadomości.', 'Przećwicz na głos „Opowiedz o sobie” (ok. 60 sekund).', 'Przygotuj 3 historie w schemacie STAR z liczbami lub efektami.', 'Wydrukuj CV i weź je ze sobą (albo miej pod ręką przy rozmowie online).', 'Sprawdź dojazd albo kamerę, mikrofon i link do rozmowy online.', 'Zapisz 2-3 pytania do pracodawcy.', 'Po rozmowie wyślij krótkie podziękowanie e-mailem.'],
  } : null;

  const messages = addons.messages ? {
    linkedin: `Dzień dobry, zauważyłem/am ogłoszenie na stanowisko ${position}. ${e0 ? `Pracuję jako ${e0.title}` : 'Mam doświadczenie'}${matched.length ? ` i na co dzień zajmuję się: ${matched.slice(0, 3).join(', ')}` : ''}. Wysłałem/am aplikację i chętnie porozmawiam o tej roli. Pozdrawiam, ${p.name}`.slice(0, 600),
    email: { subject: `Aplikacja na stanowisko ${position} – ${p.name}`, body: `Dzień dobry,\n\nw załączniku przesyłam CV${withLetter ? ' i list motywacyjny' : ''} w odpowiedzi na ogłoszenie na stanowisko ${position}.${matched.length ? ` Moje doświadczenie obejmuje m.in.: ${matched.slice(0, 3).join(', ')}.` : ''}\n\nChętnie odpowiem na pytania i spotkam się na rozmowie.\n\nZ poważaniem,\n${p.name}${p.phone ? '\n' + p.phone : ''}` },
  } : null;

  const linkedin = addons.linkedin ? {
    headline: [ad.title || position, ...(matched.length ? matched : skills).slice(0, 3)].filter(Boolean).join(' | ').slice(0, 220),
    about: [`${e0 ? `Pracuję jako ${e0.title}${e0.company ? ' w firmie ' + e0.company : ''}.` : 'Szukam pracy na stanowisku ' + position + '.'}${p.summary ? ' ' + p.summary : ''}`,
      (matched.length ? matched : skills).length ? `Na co dzień zajmuję się: ${(matched.length ? matched : skills).slice(0, 5).join(', ')}.` : '',
      `Jestem otwarty/a na nowe możliwości jako ${position}. Zapraszam do kontaktu.`].filter(Boolean).join('\n\n').slice(0, 1800),
    skills: ordered.slice(0, 15),
    experience: experience.map((e) => ({ title: e.title, company: e.company, text: e.bullets.slice(0, 3).join('. ').replace(/\.\./g, '.') })),
    tips: ['Włącz tryb „Otwarty na pracę” i wpisz stanowisko z ogłoszenia.', 'Dodaj aktualne, wyraźne zdjęcie i zdjęcie w tle związane z branżą.', 'Ustaw krótki adres profilu, np. linkedin.com/in/imie-nazwisko.', 'Poproś 2-3 osoby, z którymi pracowałeś, o polecenie.'],
  } : null;

  // Bez AI treść zostaje po polsku; przy innym języku zmieniają się tylko etykiety szablonu.
  const lang = ['en', 'de', 'uk', 'es', 'fr'].includes(ad.lang) ? ad.lang : 'pl';
  return { lang, untranslated: lang !== 'pl' || undefined, position, company: '', keywords: matched, match: { found, missing }, cv, letter, interview, prep, messages, linkedin };
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
  [/cen|koszt|ile/, 'CV kosztuje 39 zł, CV z listem 49 zł, a Pakiet 3 (trzy CV pod ten sam zawód i list do każdego) 79 zł. Dodatki: przygotowanie do rozmowy 50 zł, profil LinkedIn 19 zł, wersja Word 9 zł, wiadomość do rekrutera 9 zł. W cenie są raport dopasowania i darmowa poprawka, a po zakupie dostajesz swój kod −10 zł na kolejne zamówienie, który możesz też dać znajomym.'],
];
export function assistantFallback(question) {
  const q = String(question || '').toLowerCase();
  const hit = KB.find(([re]) => re.test(q));
  return hit ? hit[1] : 'Dobre pytanie. Bez połączenia z AI odpowiadam tylko na najczęstsze pytania (przerwa w pracy, zdjęcie, RODO, długość CV, list motywacyjny, ATS, ceny). Napisz o jednym z tych tematów albo zajrzyj do FAQ i poradnika.';
}

