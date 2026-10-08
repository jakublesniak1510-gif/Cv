(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k.filter((x) => x != null && x !== false)); return e; };
let PRICE = { cv: 39, cv_letter: 49, extra: 20, interview: 15, messages: 9, extraLang: 5 };
let promo = null; // zastosowany kod rabatowy/polecający: { code, discount, label }
let data; // bieżące zamówienie na stronie wyniku
const STEPS = ['Pakiet i wygląd CV', 'Twoje dane', 'Doświadczenie', 'Wykształcenie i umiejętności', 'Ogłoszenia', 'Podsumowanie'];
let cfg = { demo: false, maxAds: 5, noPrint: false, maxRevisions: 10 };
// Szablony i kolory: muszą zgadzać się z lib/designs.js.
const TPLS = [
  ['nowoczesny', 'Nowoczesny', 'Kolorowy pasek boczny z monogramem, kontaktem i umiejętnościami.'],
  ['os', 'Oś czasu', 'Doświadczenie na osi czasu. Rekruter od razu widzi Twoją ścieżkę.'],
  ['szwajcarski', 'Szwajcarski', 'Siatka jak w magazynie: duże nazwisko, równe kolumny, zero ozdobników.'],
  ['geometria', 'Geometria', 'Skośny kolorowy nagłówek i panel boczny. Wyróżnia się w stosie CV.'],
  ['elegancki', 'Elegancki', 'Szeryfowa typografia i monogram. Na stanowiska biurowe i kierownicze.'],
  ['klasyczny', 'Klasyczny ATS', 'Jedna kolumna, którą najlepiej odczytują systemy rekrutacyjne.'],
];
const LEGACY = { wyrazisty: 'geometria' };
const COLORS = { niebieski: '#2548E8', granat: '#1E3A5F', morski: '#0F766E', bordo: '#9F1239', fiolet: '#6D28D9', grafit: '#374151' };
const COLOR_NAMES = { niebieski: 'niebieski', granat: 'granatowy', morski: 'morski', bordo: 'bordowy', fiolet: 'fioletowy', grafit: 'grafitowy' };
let design = { tpl: 'nowoczesny', color: 'niebieski' };
const tplName = (t) => (TPLS.find((x) => x[0] === t) || TPLS[0])[1];
const ro = new ResizeObserver((es) => es.forEach((e) => e.target.style.setProperty('--s', e.contentRect.width / 794)));
const thumb = (r, d, on = false, photo = '') => { const t = el('div', { className: 'thumb' }, cvNode(r, on, d, photo)); ro.observe(t); return t; };
function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''); }
function paperEl(cls, d) { const p = el('div', { className: `paper t-${d.tpl} ${cls}` }); p.style.setProperty('--acc', COLORS[d.color] || COLORS.niebieski); return p; }
// Wspólne klocki dokumentu; każdy szablon składa je po swojemu (węzeł DOM można wstawić tylko raz).
const LBL = {
  pl: { summary: 'Profil zawodowy', exp: 'Doświadczenie zawodowe', edu: 'Wykształcenie', skills: 'Umiejętności', langs: 'Języki', certs: 'Certyfikaty i kursy', interests: 'Zainteresowania', contact: 'Kontakt', locale: 'pl-PL' },
  en: { summary: 'Professional summary', exp: 'Work experience', edu: 'Education', skills: 'Skills', langs: 'Languages', certs: 'Certifications', interests: 'Interests', contact: 'Contact', locale: 'en-GB' },
  de: { summary: 'Profil', exp: 'Berufserfahrung', edu: 'Ausbildung', skills: 'Kenntnisse', langs: 'Sprachen', certs: 'Zertifikate und Kurse', interests: 'Interessen', contact: 'Kontakt', locale: 'de-DE' },
  uk: { summary: 'Професійний профіль', exp: 'Досвід роботи', edu: 'Освіта', skills: 'Навички', langs: 'Мови', certs: 'Сертифікати та курси', interests: 'Інтереси', contact: 'Контакти', locale: 'uk-UA' },
  es: { summary: 'Perfil profesional', exp: 'Experiencia laboral', edu: 'Formación', skills: 'Habilidades', langs: 'Idiomas', certs: 'Certificados y cursos', interests: 'Intereses', contact: 'Contacto', locale: 'es-ES' },
  fr: { summary: 'Profil professionnel', exp: 'Expérience professionnelle', edu: 'Formation', skills: 'Compétences', langs: 'Langues', certs: 'Certifications et formations', interests: "Centres d'intérêt", contact: 'Contact', locale: 'fr-FR' },
};
const LANGS = { pl: 'polski', en: 'angielski', de: 'niemiecki', uk: 'ukraiński', es: 'hiszpański', fr: 'francuski' };
function parts(c, kw, lang = 'pl', photo = '') {
  const L = LBL[lang] || LBL.pl;
  const contact = (c.contact || []).filter(Boolean);
  const [first = '', ...rest] = String(c.name || '').split(/\s+/);
  const sec = (t, ...k) => el('section', {}, el('h3', { textContent: t }), el('div', { className: 'cnt' }, ...k));
  const job = (title, period, org, orgCls, bullets) => el('div', { className: 'job' },
    el('div', { className: 'when' }, el('b', { textContent: period || '' }), org ? el('span', { textContent: org }) : null),
    el('div', { className: 'what' }, el('div', { className: 'role' }, el('span', { textContent: title }), el('em', { textContent: period || '' })),
      org ? el('div', { className: orgCls, textContent: org }) : null,
      bullets?.length ? el('ul', {}, ...bullets.map((b) => el('li', {}, hl(b, kw)))) : null));
  return {
    name: () => el('h1', {}, el('span', { textContent: first }), ' ', el('span', { textContent: rest.join(' ') })),
    head: () => (c.headline ? el('div', { className: 'hl', textContent: c.headline }) : null),
    ct: () => el('div', { className: 'ct', textContent: contact.join('  ·  ') }),
    clist: () => el('ul', { className: 'clist' }, ...contact.map((x) => el('li', { textContent: x }))),
    mono: () => (photo ? el('div', { className: 'ini photo', role: 'img', ariaLabel: c.name, style: `background-image:url(${photo})` }) : el('div', { className: 'ini', textContent: initials(c.name) })),
    rule: () => el('div', { className: 'rule' }),
    pic: () => (photo ? el('div', { className: 'pic', role: 'img', ariaLabel: c.name, style: `background-image:url(${photo})` }) : null),
    summary: () => (c.summary ? sec(L.summary, el('div', { className: 'summ' }, hl(c.summary, kw))) : null),
    exp: () => (c.experience?.length ? sec(L.exp, ...c.experience.map((e) => job(e.title, e.period, e.company, 'co', e.bullets))) : null),
    edu: () => (c.education?.length ? sec(L.edu, ...c.education.map((e) => job(e.school, e.period, e.degree, 'deg'))) : null),
    skills: () => (c.skills?.length ? sec(L.skills, el('div', { className: 'chips' }, ...c.skills.map((x) => el('span', {}, hl(x, kw))))) : null),
    langs: () => (c.languages?.length ? sec(L.langs, el('div', { textContent: c.languages.join(' · ') })) : null),
    certs: () => (c.certificates?.length ? sec(L.certs, el('div', { textContent: c.certificates.join(' · ') })) : null),
    intr: () => (c.interests ? sec(L.interests, el('div', { textContent: c.interests })) : null),
    clause: () => (c.clause ? el('div', { className: 'clause', textContent: c.clause }) : null),
    contactSec: () => sec(L.contact, el('ul', { className: 'clist' }, ...contact.map((x) => el('li', { textContent: x })))),
  };
}
const CV_LAYOUT = {
  nowoczesny: (k) => [el('aside', { className: 'side' }, k.mono(), k.contactSec(), k.skills(), k.langs(), k.certs(), k.intr()),
    el('div', { className: 'mainc' }, el('header', { className: 'top' }, k.name(), k.head()), k.summary(), k.exp(), k.edu(), k.clause())],
  os: (k) => [el('header', { className: 'top' }, k.pic(), el('div', { className: 'who' }, k.name(), k.head()), k.clist()), k.summary(), k.exp(), k.edu(),
    el('div', { className: 'grid3' }, k.skills(), k.langs(), k.certs()), k.intr(), k.clause()],
  szwajcarski: (k) => [el('header', { className: 'top' }, el('div', { className: 'sq' }), el('div', { className: 'split' }, el('div', { className: 'who' }, k.name(), k.head()), k.clist(), k.pic())),
    k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  geometria: (k) => [el('header', { className: 'band' }, el('div', {}, k.name(), k.head()), k.mono()),
    el('div', { className: 'body' }, el('div', { className: 'mainc' }, k.summary(), k.exp(), k.edu(), k.clause()),
      el('aside', { className: 'panel' }, k.contactSec(), k.skills(), k.langs(), k.certs(), k.intr()))],
  elegancki: (k) => [el('header', { className: 'top' }, k.mono(), k.name(), k.head(), k.ct(), k.rule()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  klasyczny: (k) => [el('header', { className: 'top' }, el('div', { className: 'who' }, k.name(), k.head(), k.ct()), k.pic()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
};
const LETTER_HEAD = {
  geometria: (k) => el('header', { className: 'band' }, el('div', {}, k.name(), k.ct()), k.mono()),
  elegancki: (k) => el('header', { className: 'top lhead' }, k.mono(), k.name(), k.ct(), k.rule()),
  szwajcarski: (k) => el('header', { className: 'top lhead' }, el('div', { className: 'sq' }), k.name(), k.ct(), k.rule()),
  os: (k) => el('header', { className: 'top lhead' }, el('div', { className: 'split' }, k.name(), k.clist()), k.rule()),
};
function cvNode(r, on, d, photo) {
  d = d || (data && data.design) || design;
  if (photo === undefined) photo = (data && data.photo) || '';
  const p = paperEl((on ?? $('#hlTog').checked) ? '' : 'nohl', d);
  p.append(el('div', { className: 'pg' }, ...(CV_LAYOUT[d.tpl] || CV_LAYOUT.nowoczesny)(parts(r.cv, r.keywords || [], r.lang, photo))));
  return p;
}
function letterNode(r, d) {
  d = d || (data && data.design) || design;
  const c = r.cv, p = paperEl('letter', d), k = parts(c, [], r.lang);
  const date = el('div', { className: 'date', textContent: `${c.contact?.[2] ? c.contact[2] + ', ' : ''}${new Date().toLocaleDateString((LBL[r.lang] || LBL.pl).locale)}` });
  const head = (LETTER_HEAD[d.tpl] || ((x) => el('header', { className: 'top lhead' }, x.name(), x.ct(), x.rule())))(k);
  p.append(el('div', { className: 'pg' }, head, el('div', { className: 'body' }, date, ...(r.letter || '').split(/\n\n+/).map((x) => el('p', { textContent: x })))));
  return p;
}
// Wybór szablonu i koloru; thumbs: miniatury z przykładowym CV.
function designPicker(box, d, onChange, { thumbs = true } = {}) {
  const draw = () => {
    const sample = exResult(1);
    box.replaceChildren(
      el('div', { className: 'dp-tpls' + (thumbs ? '' : ' compact') }, !thumbs && el('span', { className: 'dp-lbl', textContent: 'Szablon:' }), ...TPLS.map(([id, name, desc]) => el('button', {
        type: 'button', className: 'dp-tpl', ariaPressed: String(d.tpl === id), onclick: () => { d.tpl = id; onChange(d); draw(); },
      }, thumbs && thumb(sample, { tpl: id, color: d.color }), el('b', { textContent: name }), thumbs && el('span', { textContent: desc })))),
      el('div', { className: 'dp-colors', role: 'group', ariaLabel: 'Kolor' }, el('span', { className: 'dp-lbl', textContent: 'Kolor:' }),
        ...Object.entries(COLORS).map(([id, hex]) => el('button', { type: 'button', className: 'sw', title: COLOR_NAMES[id], ariaLabel: `Kolor ${COLOR_NAMES[id]}`, ariaPressed: String(d.color === id), style: `--c:${hex}`, onclick: () => { d.color = id; onChange(d); draw(); } }))));
  };
  draw();
}
let step = 1, orderId = null;

// Zwraca fragment, w którym wskazane słowa są owinięte w <mark> (bez innerHTML).
function hl(text, kws) {
  const words = (kws || []).filter(Boolean).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const frag = document.createDocumentFragment();
  if (!words.length) { frag.append(text); return frag; }
  String(text).split(new RegExp('(' + words.join('|') + ')', 'gi')).forEach((part, i) => frag.append(i % 2 ? el('mark', { textContent: part }) : part));
  return frag;
}

fetch('/api/config').then((r) => r.json()).then((c) => {
  cfg = c; drawLists(); if (c.prices) PRICE = { cv: c.prices.cv, cv_letter: c.prices.cv_letter, extra: c.prices.extraAd, interview: c.prices.interview, messages: c.prices.messages, extraLang: c.prices.extraLang }; refresh(); $$('.linkbox').forEach((l) => { if (c.fakeFetch && !$('.hint', l)) l.append(el('p', { className: 'hint', textContent: 'Podgląd: link nie jest naprawdę pobierany, wstawiamy przykładowe ogłoszenie.' })); }); $('#demoBar').hidden = !c.demo; $('#fill').hidden = !c.demo; $('#printNote').hidden = !c.noPrint; $('#simNote').hidden = !c.demo;
});

/* ---------- Przykład dopasowania ---------- */
const BASE = {
  name: 'Anna Nowak', contact: ['+48 600 100 200', 'anna.nowak@example.com', 'Kraków', 'linkedin.com/in/anna-nowak'],
  jobs: [{ title: 'Specjalistka ds. obsługi klienta', company: 'Nova Serwis Sp. z o.o.', period: '03.2022 – obecnie' }, { title: 'Sprzedawca / kasjer', company: 'Market Dom', period: '06.2019 – 02.2022' }],
  edu: [{ school: 'Uniwersytet Ekonomiczny w Krakowie', degree: 'Zarządzanie, licencjat', period: '2016 – 2019' }],
  skills: 'obsługa klienta, obsługa kasy fiskalnej, komunikatywność, praca zmianowa, CRM, rozwiązywanie reklamacji, obsługa zgłoszeń, Excel, inwentaryzacja',
  langs: ['angielski B2', 'niemiecki A2'], certs: ['Kurs obsługi klienta B2B'],
  facts: ['Obsługa 40–50 zgłoszeń dziennie w systemie CRM', 'Rozwiązywanie reklamacji klientów', 'Kontakt z klientami zagranicznymi po angielsku', 'Obsługa kasy fiskalnej i rozliczanie zmiany', 'Obsługa klienta, reklamacje przy kasie', 'Inwentaryzacja towaru', 'Praca zmianowa w zespole 8 osób'],
};
const EX = [
  { tab: 'Kasjer / Sprzedawca', title: 'Kasjer / Sprzedawca', company: 'Supermarket Zielony Rynek',
    ad: 'Szukamy osoby do obsługi klienta i obsługi kasy fiskalnej w supermarkecie. Wymagamy komunikatywności, uczciwości i gotowości do pracy zmianowej. Oferujemy umowę o pracę i pakiet benefitów.',
    kws: ['obsługi klienta', 'obsługa klienta', 'kasy fiskalnej', 'kasa fiskalna', 'komunikatywności', 'komunikatywność', 'pracy zmianowej', 'praca zmianowa'],
    sum: 'Aplikuję na stanowisko: Kasjer / Sprzedawca. Przez prawie trzy lata obsługiwałam kasę fiskalną i klientów w Market Dom, pracując zmianowo w zespole 8 osób. Jestem komunikatywna i znam inwentaryzację towaru.',
    skills: ['obsługa klienta', 'obsługa kasy fiskalnej', 'komunikatywność', 'praca zmianowa', 'inwentaryzacja', 'CRM', 'Excel'],
    bullets: [[1, 0], [3, 4, 6, 5]],
    changes: ['Nagłówek zmieniony na „Kasjer / Sprzedawca”.', 'Na początku umiejętności z ogłoszenia: obsługa kasy fiskalnej i praca zmianowa.', 'W pracy w Market Dom na górze obsługa kasy, bo o nią chodzi w ofercie.', 'Pominięty punkt o kontakcie po angielsku, bo oferta go nie wymaga.'],
    letter: `Szanowni Państwo,

z zainteresowaniem odpowiadam na ogłoszenie na stanowisko Kasjera / Sprzedawcy w Supermarkecie Zielony Rynek. Pracę w handlu zaczynałam w 2019 roku w Market Dom, gdzie przez prawie trzy lata obsługiwałam kasę fiskalną, rozliczałam zmiany i codziennie rozmawiałam z klientami.

Szukają Państwo osoby komunikatywnej i gotowej do pracy zmianowej. Pracowałam zmianowo w zespole ośmiu osób, zajmowałam się też reklamacjami przy kasie oraz inwentaryzacją towaru.

Obecnie pracuję w obsłudze klienta w firmie Nova Serwis, gdzie rozwiązuję reklamacje i prowadzę zgłoszenia w systemie CRM.

Chętnie opowiem o swoim doświadczeniu na rozmowie. Dziękuję za rozważenie mojej kandydatury.

Z poważaniem,
Anna Nowak` },
  { tab: 'Specjalista ds. obsługi klienta', title: 'Specjalista ds. obsługi klienta', company: 'Telko Group',
    ad: 'Do biura obsługi poszukujemy specjalisty. Zakres: obsługa zgłoszeń, rozwiązywanie reklamacji, praca w systemie CRM. Wymagamy min. 2 lat doświadczenia i znajomości angielskiego. Oferujemy umowę o pracę i elastyczne godziny.',
    kws: ['obsługa zgłoszeń', 'obsługi zgłoszeń', 'reklamacji', 'reklamacje', 'CRM', 'angielskiego', 'angielski', 'obsługi klienta', 'obsługa klienta'],
    sum: 'Aplikuję na stanowisko: Specjalista ds. obsługi klienta. Od 2022 roku obsługuję zgłoszenia i reklamacje w systemie CRM, a z klientami zagranicznymi rozmawiam po angielsku.',
    skills: ['CRM', 'rozwiązywanie reklamacji', 'obsługa zgłoszeń', 'obsługa klienta', 'angielski B2', 'Excel'],
    bullets: [[0, 1, 2], [4, 6]],
    changes: ['Nagłówek zmieniony na „Specjalista ds. obsługi klienta”.', 'CRM, reklamacje i zgłoszenia na początku umiejętności, tak jak w ofercie.', 'Angielski wyeksponowany w profilu i w obecnej pracy.', 'Z pracy w sklepie zostały tylko punkty o kliencie i zmianach.'],
    letter: `Szanowni Państwo,

odpowiadam na ogłoszenie na stanowisko Specjalisty ds. obsługi klienta w Telko Group. Od marca 2022 roku pracuję jako Specjalistka ds. obsługi klienta w Nova Serwis, gdzie codziennie obsługuję 40–50 zgłoszeń w systemie CRM i rozwiązuję reklamacje klientów. To dokładnie ten zakres obowiązków, który opisują Państwo w ogłoszeniu.

Wymagają Państwo znajomości angielskiego. W obecnej pracy kontaktuję się po angielsku z klientami zagranicznymi, na poziomie B2. Wcześniej, w Market Dom, przez prawie trzy lata pracowałam bezpośrednio z klientami i zajmowałam się reklamacjami.

Chętnie przedstawię swoje doświadczenie na rozmowie i dowiem się więcej o zespole. Dziękuję za rozważenie mojej kandydatury.

Z poważaniem,
Anna Nowak` },
  { tab: 'Magazynier', title: 'Magazynier', company: 'Hurtownia Sigma',
    ad: 'Poszukujemy magazyniera do pracy w hurtowni. Zakres: przyjmowanie i wydawanie towaru, inwentaryzacja, praca z dokumentacją magazynową. Wymagamy rzetelności i gotowości do pracy zmianowej. Mile widziane uprawnienia na wózki widłowe.',
    kws: ['inwentaryzacja', 'inwentaryzacji', 'pracy zmianowej', 'praca zmianowa'],
    sum: 'Aplikuję na stanowisko: Magazynier. Mam praktykę w inwentaryzacji towaru i w pracy zmianowej w zespole 8 osób. Znam Excel i system CRM.',
    skills: ['inwentaryzacja', 'praca zmianowa', 'Excel', 'CRM', 'obsługa klienta'],
    bullets: [[0], [5, 6, 3]],
    changes: ['Nagłówek zmieniony na „Magazynier”.', 'Na górze inwentaryzacja i praca zmianowa, bo tego szuka oferta.', 'Z obecnej pracy został jeden punkt, reszta dotyczy obsługi klienta.'],
    notAdded: 'uprawnień na wózki widłowe, bo nie zostały podane. Jeśli je masz, wpisz je w kreatorze, a trafią do CV.',
    letter: `Szanowni Państwo,

z zainteresowaniem odpowiadam na ogłoszenie na stanowisko Magazyniera w Hurtowni Sigma. Wymagają Państwo rzetelności i gotowości do pracy zmianowej. W Market Dom, w latach 2019–2022, pracowałam zmianowo w zespole ośmiu osób i zajmowałam się inwentaryzacją towaru, co wiąże się bezpośrednio z częścią obowiązków opisanych w ogłoszeniu.

Wymieniają Państwo także pracę z dokumentacją magazynową. Na co dzień pracuję z dokumentami i danymi: rozliczałam zmiany przy kasie, a obecnie prowadzę zgłoszenia w systemie CRM i korzystam z Excela.

Chętnie opowiem o swoim doświadczeniu na rozmowie. Dziękuję za rozważenie mojej kandydatury.

Z poważaniem,
Anna Nowak` },
];
const exResult = (i) => {
  const e = EX[i];
  return { position: e.title, keywords: e.kws, letter: e.letter, cv: {
    name: BASE.name, headline: e.title, contact: BASE.contact, summary: e.sum,
    experience: BASE.jobs.map((j, k) => ({ ...j, bullets: e.bullets[k].map((n) => BASE.facts[n]) })),
    education: BASE.edu, skills: e.skills, languages: BASE.langs, certificates: BASE.certs, interests: '',
    clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.' } };
};
const changesList = (e) => [el('h3', { textContent: 'Co zmieniliśmy w tym CV' }), el('ul', {}, ...e.changes.map((c) => el('li', { textContent: c }))), e.notAdded && el('p', { className: 'notadded' }, el('b', { textContent: 'Czego nie dopisaliśmy: ' }), e.notAdded)].filter(Boolean);
function drawEx(i) {
  const e = EX[i], r = exResult(i);
  $$('#exTabs button').forEach((b, j) => b.setAttribute('aria-selected', j === i));
  $('#exAd').replaceChildren(el('div', { className: 'tagline', textContent: `Ogłoszenie · ${e.company}` }), el('h4', { textContent: e.title }), el('p', {}, hl(e.ad, e.kws)));
  $('#exCv').replaceChildren(el('div', { className: 'tagline', textContent: 'CV Anny Nowak pod to ogłoszenie' }), el('h4', { textContent: 'Anna Nowak' }), el('div', { className: 'sub', textContent: e.title }),
    el('p', {}, hl(e.sum, e.kws)), el('p', { className: 'h', textContent: 'Umiejętności' }), el('p', {}, hl(e.skills.join(' · '), e.kws)),
    el('p', { className: 'h', textContent: `${r.cv.experience[1].title}, ${r.cv.experience[1].company}` }), ...r.cv.experience[1].bullets.map((b) => el('p', {}, '• ', hl(b, e.kws))));
  $('#exChg').replaceChildren(...changesList(e));
}
EX.forEach((e, i) => $('#exTabs').append(el('button', { type: 'button', role: 'tab', textContent: e.tab, onclick: () => drawEx(i) })));
drawEx(0);

/* galeria szablonów i hero */
const gal = { tpl: 'nowoczesny', color: 'niebieski' };
function drawGallery() {
  const sample = exResult(1);
  $('#galColors').replaceChildren(el('span', { className: 'dp-lbl', textContent: 'Kolor:' }), ...Object.entries(COLORS).map(([id, hex]) => el('button', { type: 'button', className: 'sw', title: COLOR_NAMES[id], ariaLabel: `Kolor ${COLOR_NAMES[id]}`, ariaPressed: String(gal.color === id), style: `--c:${hex}`, onclick: () => { gal.color = id; drawGallery(); } })));
  $('#galGrid').replaceChildren(...TPLS.map(([id, name, desc]) => el('div', { className: 'gal-card' },
    el('button', { type: 'button', className: 'gal-thumb', ariaLabel: `Podgląd szablonu ${name}`, onclick: () => openEx(1, { tpl: id, color: gal.color }) }, thumb(sample, { tpl: id, color: gal.color })),
    el('div', { className: 'gal-meta' }, el('b', { textContent: name }), el('span', { textContent: desc })),
    el('button', { type: 'button', className: 'btn ghost sm', textContent: 'Wybierz ten szablon', onclick: () => { design = { tpl: id, color: gal.color }; drawWizDesign(); saveDraft(); openWiz(); } }))));
}
const drawWizDesign = () => designPicker($('#wizDesign'), design, (d) => { design = d; saveDraft(); });
/* animowane demo w nagłówku: słowa z ogłoszenia zapalają się w ogłoszeniu i w CV */
EX[0].groups = [['obsługi klienta', 'obsługa klienta'], ['kasy fiskalnej', 'kasa fiskalna'], ['komunikatywności', 'komunikatywność'], ['pracy zmianowej', 'praca zmianowa']];
EX[1].groups = [['obsługa zgłoszeń', 'obsługi zgłoszeń'], ['reklamacji', 'reklamacje'], ['CRM'], ['angielskiego', 'angielski']];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let demoI = 0, demoT = null, demoOn = false;
function tagMarks(root, groups) { $$('mark', root).forEach((m) => { const t = m.textContent.toLowerCase(), g = groups.findIndex((v) => v.some((x) => x.toLowerCase() === t)); if (g >= 0) m.dataset.g = g; }); }
function runDemo() {
  clearTimeout(demoT);
  const i = demoI++ % 2, e = EX[i], n = e.groups.length;
  $('#demoTitle').textContent = e.title;
  $('#demoAd').replaceChildren(hl(e.ad, e.groups.flat()));
  $('#heroThumb').replaceChildren(thumb(exResult(i), { tpl: 'nowoczesny', color: 'niebieski' }, true));
  tagMarks($('#demo'), e.groups);
  const set = (g) => { $('#demoScore').textContent = `${g} / ${n}`; $('#demoFill').style.width = `${(100 * g) / n}%`; };
  if (reduceMotion) { $$('#demo mark[data-g]').forEach((m) => m.classList.add('on')); set(n); return; }
  set(0);
  let g = 0;
  const step = () => {
    if (!demoOn) return;
    if (g < n) { $$(`#demo mark[data-g="${g}"]`).forEach((m) => m.classList.add('on')); set(++g); demoT = setTimeout(step, 750); }
    else demoT = setTimeout(runDemo, 3800);
  };
  demoT = setTimeout(step, 900);
}
// Animacja działa tylko wtedy, gdy nagłówek jest widoczny.
new IntersectionObserver(([en]) => { const on = en.isIntersecting && !document.hidden; if (on && !demoOn) { demoOn = true; runDemo(); } else if (!on) { demoOn = false; clearTimeout(demoT); } }).observe($('#demo'));
runDemo();

/* pełny podgląd przykładu (okno) */
let exI = 0, exDoc = 'cv';
const exDesign = { tpl: 'nowoczesny', color: 'niebieski' };
function drawExView() {
  const e = EX[exI], r = exResult(exI);
  $('#exSide').replaceChildren(
    el('details', { className: 'exdet', open: matchMedia('(min-width: 901px)').matches }, el('summary', { textContent: '1. Dane, które podajesz raz' }), el('div', { className: 'exbase' }, el('b', { textContent: BASE.name }), el('div', { textContent: BASE.contact.join(' · ') }),
      ...BASE.jobs.map((j) => el('div', {}, el('b', { textContent: j.title }), ` · ${j.company} (${j.period})`)),
      el('div', {}, el('b', { textContent: 'Umiejętności: ' }), BASE.skills), el('div', {}, el('b', { textContent: 'Języki: ' }), BASE.langs.join(', ')))),
    el('h3', { textContent: '2. Ogłoszenie (wybierz)' }),
    el('div', { className: 'adlist' }, ...EX.map((x, i) => el('button', { type: 'button', ariaPressed: String(i === exI), onclick: () => { exI = i; exDoc = 'cv'; drawExView(); } }, el('b', { textContent: x.title }), el('span', { textContent: x.company })))),
    el('div', { className: 'doc ad' }, el('div', { className: 'tagline', textContent: 'Treść ogłoszenia' }), el('p', {}, hl(e.ad, e.kws))));
  $('#exDocTabs').replaceChildren(...[['cv', 'CV'], ['letter', 'List motywacyjny']].map(([k, t]) => el('button', { type: 'button', role: 'tab', ariaSelected: String(k === exDoc), textContent: t, onclick: () => { exDoc = k; drawExView(); } })));
  $('#exPaper').replaceChildren(exDoc === 'cv' ? cvNode(r, true, exDesign) : letterNode(r, exDesign));
  $('#exChanges').replaceChildren(...changesList(e));
}
function openEx(i = 0, d) { exI = i; exDoc = 'cv'; if (d) Object.assign(exDesign, d); designPicker($('#exDesign'), exDesign, () => drawExView(), { thumbs: false }); drawExView(); modal(true); $('#exview').hidden = false; $('.exv-body').scrollTop = 0; setTimeout(() => $('#exClose').focus(), 0); }
const closeEx = () => { $('#exview').hidden = true; modal(false); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-example]'); if (b) openEx(+b.dataset.example || 0); });
$('#exClose').onclick = closeEx;
$('#exCta').onclick = () => { closeEx(); lastFocus = null; openWiz(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#exview').hidden) closeEx(); });
drawGallery();

/* ---------- Kreator ---------- */
const rowT = {
  exp: () => `<div class="grid4"><label class="f">Stanowisko<input type="text" data-k="title"></label><label class="f">Firma<input type="text" data-k="company"></label><label class="f">Od<input type="text" data-k="from" placeholder="03.2021"></label><label class="f">Do<input type="text" data-k="to" placeholder="obecnie"></label></div><label class="f">Obowiązki i osiągnięcia <span class="h">każdy punkt w nowej linii</span><textarea data-k="description"></textarea></label>`,
  edu: () => `<div class="grid4"><label class="f">Szkoła<input type="text" data-k="school"></label><label class="f">Kierunek / tytuł<input type="text" data-k="degree"></label><label class="f">Od<input type="text" data-k="from"></label><label class="f">Do<input type="text" data-k="to"></label></div>`,
  ads: () => `<div class="seg modes" role="tablist"><button type="button" role="tab" data-mode="link">Link do ogłoszenia</button><button type="button" role="tab" data-mode="paste">Wklej treść</button></div>
<div class="linkbox"><label class="f">Adres ogłoszenia<span class="urlrow"><input type="text" data-k="url" inputmode="url" placeholder="https://…"><button type="button" class="btn sm fetchbtn">Pobierz</button></span></label><div class="fstatus" role="status"></div></div>
<div class="adfields"><label class="adlang">Język dokumentów <select data-k="lang"><option value="auto">jak w ogłoszeniu</option><option value="pl">polski</option><option value="en">angielski</option><option value="de">niemiecki</option><option value="uk">ukraiński</option><option value="es">hiszpański</option><option value="fr">francuski</option></select></label><label class="f">Nazwa stanowiska<input type="text" data-k="title" placeholder="np. Kasjer / Sprzedawca"></label><label class="f">Treść ogłoszenia <span class="h">sprawdź i w razie potrzeby popraw</span><textarea data-k="text" style="min-height:150px"></textarea></label></div>`,
};
const label = { exp: 'Stanowisko', edu: 'Szkoła', ads: 'Ogłoszenie', fuAds: 'Ogłoszenie' };
function addRow(box, v = {}) {
  const e = el('div', { className: 'entry' });
  e.innerHTML = `<div class="etop"><span></span><button type="button" class="rm">Usuń</button></div>` + rowT[box === 'fuAds' ? 'ads' : box]();
  $('.rm', e).onclick = () => { e.remove(); renum(box); refresh(); };
  $('#' + box).append(e);
  Object.entries(v).forEach(([k, val]) => { const i = $(`[data-k="${k}"]`, e); if (i) i.value = val; });
  if (box === 'ads' || box === 'fuAds') initAd(e, v.text ? 'paste' : 'link');
  renum(box); refresh();
}
function setMode(e, mode) {
  e.dataset.mode = mode;
  $$('.modes button', e).forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === mode));
  $('.linkbox', e).hidden = mode !== 'link';
  $('.adfields', e).hidden = mode === 'link' && !e.dataset.fetched;
}
function initAd(e, mode) {
  $$('.modes button', e).forEach((b) => (b.onclick = () => setMode(e, b.dataset.mode)));
  const status = $('.fstatus', e), btn = $('.fetchbtn', e);
  const run = async () => {
    const url = $('[data-k=url]', e).value.trim();
    status.className = 'fstatus';
    if (!url) { status.textContent = 'Wklej link do ogłoszenia.'; status.classList.add('bad'); return; }
    btn.disabled = true; status.textContent = 'Pobieram ogłoszenie…';
    try {
      const r = await fetch('/api/fetch-ad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      $('[data-k=title]', e).value = j.title || ''; $('[data-k=text]', e).value = j.text;
      e.dataset.fetched = '1'; setMode(e, 'link');
      status.textContent = `Pobrano${j.title ? ': „' + j.title + '”' : ''}${j.company ? ' (' + j.company + ')' : ''}, ${j.text.length} znaków. Sprawdź treść poniżej.`;
      status.classList.add('good');
    } catch (x) {
      e.dataset.fetched = '1'; $('.adfields', e).before(status); setMode(e, 'paste');
      status.textContent = `${x.message} Wklej treść ogłoszenia poniżej.`; status.classList.add('bad');
    }
    btn.disabled = false;
  };
  btn.onclick = run;
  $('[data-k=url]', e).onkeydown = (k) => { if (k.key === 'Enter') { k.preventDefault(); run(); } };
  if (cfg.fakeFetch) $('.linkbox', e).append(el('p', { className: 'hint', textContent: 'Podgląd: link nie jest naprawdę pobierany, wstawiamy przykładowe ogłoszenie.' }));
  setMode(e, mode);
}
function renum(box) {
  const rows = $('#' + box).children;
  [...rows].forEach((e, i) => { $('.etop span', e).textContent = `${label[box]} ${i + 1}`; $('.rm', e).hidden = (box === 'ads' || box === 'fuAds') && rows.length === 1; });
}
const rows = (box) => $$('#' + box + ' .entry').map((e) => Object.fromEntries($$('[data-k]', e).map((i) => [i.dataset.k, i.value.trim()])));
const pkg = () => $('input[name=pkg]:checked').value;
const nAds = () => Math.max(1, $('#ads').children.length);
const addons = () => ({ interview: $('#adInterview').checked, messages: $('#adMessages').checked });
const extraLangs = () => $$('#langPick input:checked').map((i) => i.value);
const addonsTotal = () => (addons().interview ? PRICE.interview : 0) + (addons().messages ? PRICE.messages : 0) + PRICE.extraLang * extraLangs().length;
const discount = () => (promo ? Math.min(promo.discount, PRICE[pkg()] - 2) : 0);
const total = () => PRICE[pkg()] + PRICE.extra * (nAds() - 1) + addonsTotal() - discount();

const DKEY = 'cvpo-draft-v1', FIELDS = ['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'];
let saveT, restoring = false;
function saveDraft() {
  if (restoring) return;
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(DKEY, JSON.stringify({ design, photo, addons: addons(), langs: extraLangs(), pkg: pkg(), f: Object.fromEntries(FIELDS.map((k) => [k, $('#' + k).value])), exp: rows('exp'), edu: rows('edu'), ads: rows('ads') })); } catch {} }, 300);
}
const clearDraft = () => { try { localStorage.removeItem(DKEY); } catch {} };
function restoreDraft() {
  let d; try { d = JSON.parse(localStorage.getItem(DKEY)); } catch {}
  if (!d || !d.f || !(d.f.name || d.f.email || d.exp?.some((e) => e.title) || d.ads?.some((a) => a.text))) return false;
  restoring = true;
  const r = $(`input[name=pkg][value="${d.pkg}"]`); if (r) r.checked = true;
  if (d.design && LEGACY[d.design.tpl]) d.design.tpl = LEGACY[d.design.tpl];
  if (d.design && COLORS[d.design.color] && TPLS.some((t) => t[0] === d.design.tpl)) design = { ...d.design };
  FIELDS.forEach((k) => ($('#' + k).value = d.f[k] || ''));
  if (d.addons) { $('#adInterview').checked = !!d.addons.interview; $('#adMessages').checked = !!d.addons.messages; }
  (d.langs || []).forEach((l) => { const i = $(`#langPick input[value="${l}"]`); if (i) i.checked = true; });
  setPhoto(d.photo || '');
  ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); (d[b]?.length ? d[b] : [{}]).forEach((v) => addRow(b, v)); });
  restoring = false; refresh();
  return true;
}
function refresh() {
  saveDraft();
  $('#total').textContent = total() + ' zł';
  $('#brk').textContent = [nAds() > 1 ? `${PRICE[pkg()]} zł + ${nAds() - 1} × ${PRICE.extra} zł` : '', addonsTotal() ? `dodatki ${addonsTotal()} zł` : '', discount() ? `rabat −${discount()} zł` : ''].filter(Boolean).join(' · ');
  $$('.opt b[data-price]').forEach((b) => (b.textContent = `+${PRICE[b.dataset.price]} zł`));
  $('#addAd').disabled = nAds() >= cfg.maxAds;
  $('#addAd').title = nAds() >= cfg.maxAds ? `Maksymalnie ${cfg.maxAds} ogłoszeń w jednym zamówieniu` : '';
}
$$('input[name=pkg]').forEach((r) => (r.onchange = refresh));
$('#adInterview').onchange = $('#adMessages').onchange = refresh;
$('#langPick').replaceChildren(...Object.entries(LANGS).map(([k, n]) => el('label', { className: 'chk' }, el('input', { type: 'checkbox', value: k, onchange: refresh }), ` ${n}`)));

/* kod rabatowy lub polecający */
const REF_KEY = 'cvpo-ref';
async function applyCode(raw, quiet) {
  const code = String(raw || '').trim().toUpperCase(), st = $('#codeMsg');
  if (!code) { promo = null; refresh(); st.textContent = ''; return; }
  try {
    const r = await fetch(`/api/code/${encodeURIComponent(code)}?email=${encodeURIComponent($('#email').value)}`);
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    promo = j; st.className = 'fstatus good'; st.textContent = `${j.label}: −${j.discount} zł`;
  } catch (x) { promo = null; if (!quiet) { st.className = 'fstatus bad'; st.textContent = x.message; } }
  refresh(); if (step === 6) drawSummary();
}
$('#codeApply').onclick = () => applyCode($('#codeInput').value);
{
  const ref = new URLSearchParams(location.search).get('ref');
  try { if (ref) localStorage.setItem(REF_KEY, ref); } catch {}
  let saved = ref; try { saved = saved || localStorage.getItem(REF_KEY); } catch {}
  if (saved) { $('#codeInput').value = saved; $('#refBanner').hidden = false; }
}
$('#wizForm').addEventListener('input', saveDraft);
$('#addExp').onclick = () => addRow('exp');
$('#addEdu').onclick = () => addRow('edu');
$('#addAd').onclick = () => addRow('ads');

function go(n) {
  step = n;
  $$('#wiz section[data-step]').forEach((s) => (s.hidden = +s.dataset.step !== n));
  $('#stepper').replaceChildren(...STEPS.map((_, i) => el('li', { className: i + 1 < n ? 'done' : i + 1 === n ? 'cur' : '' })));
  $('#wizKicker').textContent = n <= 6 ? `Krok ${n} z 6` : 'Płatność';
  $('#wizTitle').textContent = n <= 6 ? STEPS[n - 1] : 'Zapłać za zamówienie';
  $('#back').hidden = n === 1 || n === 7;
  $('#next').hidden = n === 7;
  $('#next').textContent = n === 6 ? (cfg.demo ? `Przejdź do płatności · ${total()} zł` : `Zapłać ${total()} zł`) : 'Dalej';
  if (n === 6) { if ($('#codeInput').value && !promo) applyCode($('#codeInput').value, true); drawSummary(); }
  $('#werr').textContent = '';
  $('.wiz-body').scrollTop = 0;
}
function drawSummary() {
  const ads = rows('ads');
  $('#sum').replaceChildren(
    el('div', { className: 'sumrow' }, el('span', { textContent: pkg() === 'cv' ? 'CV' : 'CV + list motywacyjny' }), el('span', { textContent: PRICE[pkg()] + ' zł' })),
    el('div', { className: 'sumrow' }, el('span', { textContent: `Wygląd: ${tplName(design.tpl)}, kolor ${COLOR_NAMES[design.color]}` }), el('span', { textContent: 'w cenie' })),
    ...ads.map((a, i) => el('div', { className: 'sumrow' }, el('span', { textContent: `Ogłoszenie ${i + 1}: ${a.title}${a.lang === 'en' ? ' (po angielsku)' : ''}` }), el('span', { textContent: i === 0 ? 'w cenie' : '+' + PRICE.extra + ' zł' }))),
    ...(addons().interview ? [el('div', { className: 'sumrow' }, el('span', { textContent: 'Przygotowanie do rozmowy' }), el('span', { textContent: '+' + PRICE.interview + ' zł' }))] : []),
    ...(addons().messages ? [el('div', { className: 'sumrow' }, el('span', { textContent: 'Wiadomość do rekrutera i e-mail z aplikacją' }), el('span', { textContent: '+' + PRICE.messages + ' zł' }))] : []),
    ...extraLangs().map((l) => el('div', { className: 'sumrow' }, el('span', { textContent: `Dodatkowa wersja: ${LANGS[l]}` }), el('span', { textContent: '+' + PRICE.extraLang + ' zł' }))),
    ...(discount() ? [el('div', { className: 'sumrow' }, el('span', { textContent: `${promo.label} ${promo.code}` }), el('span', { textContent: '−' + discount() + ' zł' }))] : []),
    el('div', { className: 'sumrow' }, el('span', { textContent: 'Razem' }), el('span', { textContent: total() + ' zł' })));
}
function validate(n) {
  const v = (id) => $('#' + id).value.trim();
  if (n === 2) { if (!v('name')) return 'Podaj imię i nazwisko.'; if (!/^\S+@\S+\.\S+$/.test(v('email'))) return 'Podaj poprawny adres e-mail.'; }
  if (n === 4 && !rows('exp').some((e) => e.title || e.company) && !rows('edu').some((e) => e.school)) return 'Dodaj co najmniej jedno stanowisko (krok 3) lub szkołę.';
  if (n === 5) for (const [i, a] of rows('ads').entries()) {
    if (!a.text) return `Ogłoszenie ${i + 1}: kliknij „Pobierz” przy linku albo wklej treść oferty.`;
    if (!a.title) return `Ogłoszenie ${i + 1}: podaj nazwę stanowiska.`;
    if (a.text.length < 80) return `Ogłoszenie ${i + 1}: wklej pełną treść oferty (min. 80 znaków).`;
  }
  if (n === 6 && !$('#consent').checked) return 'Zaakceptuj Regulamin i Politykę prywatności.';
  if (n === 6 && !$('#waiver').checked) return 'Zaznacz zgodę na wykonanie usługi od razu po płatności.';
  return '';
}
let lastFocus = null;
const modal = (open) => {
  ['nav', 'landing', 'foot', 'demoBar'].forEach((i) => { const n = $('#' + i); if (n) n.inert = open; });
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) lastFocus = document.activeElement; else if (lastFocus?.focus) lastFocus.focus();
};
const openWiz = (p) => {
  if (p) { $(`input[name=pkg][value=${p}]`).checked = true; refresh(); }
  modal(true); $('#wiz').hidden = false; go(step === 7 ? 6 : step);
  setTimeout(() => $('#wizClose').focus(), 0);
};
const closeWiz = () => { $('#wiz').hidden = true; modal(false); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); openWiz(b.dataset.pkg); } });
$('#wizClose').onclick = closeWiz;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#wiz').hidden) closeWiz(); });
$('#back').onclick = () => go(step - 1);

$('#wizForm').onsubmit = async (e) => {
  e.preventDefault();
  const err = validate(step);
  if (err) return ($('#werr').textContent = err);
  if (step < 6) return go(step + 1);
  const v = (id) => $('#' + id).value;
  const body = {
    design, addons: addons(), extraLangs: extraLangs(), code: promo?.code || '', reminder: $('#reminder').checked, pkg: pkg(), consent: $('#consent').checked && $('#waiver').checked, ads: rows('ads'),
    profile: { ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), experience: rows('exp'), education: rows('edu'), photo },
  };
  $('#next').disabled = true;
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    orderId = j.id;
    if (j.demo) go(7); else location.href = j.url;
  } catch (x) { $('#werr').textContent = x.message; }
  $('#next').disabled = false;
};
const demoPay = async () => { await fetch(`/api/orders/${orderId}/demo-pay`, { method: 'POST' }); closeWiz(); startResult(orderId); };
$('#payBlik').onclick = $('#payCard').onclick = demoPay;

/* zdjęcie: przycinamy do kwadratu 480 px po stronie przeglądarki */
let photo = '';
function setPhoto(p) {
  photo = p || '';
  $('#photoPrev').style.backgroundImage = photo ? `url(${photo})` : '';
  $('#photoPrev').classList.toggle('has', !!photo); $('#photoDel').hidden = !photo;
}
$('#photoFile').onchange = (e) => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) return ($('#werr').textContent = 'Zdjęcie jest za duże (maks. 15 MB).');
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const S = 480, side = Math.min(img.width, img.height), c = document.createElement('canvas');
    c.width = c.height = S;
    c.getContext('2d').drawImage(img, (img.width - side) / 2, Math.max(0, (img.height - side) / 2 - side * 0.08), side, side, 0, 0, S, S);
    URL.revokeObjectURL(url); setPhoto(c.toDataURL('image/jpeg', 0.85)); saveDraft();
  };
  img.onerror = () => ($('#werr').textContent = 'Nie udało się wczytać zdjęcia. Użyj pliku JPG lub PNG.');
  img.src = url;
};
$('#photoDel').onclick = () => { setPhoto(''); saveDraft(); };

/* import starego CV */
const fileB64 = (file) => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = no; fr.readAsDataURL(file); });
$('#importFile').onchange = async (e) => {
  const file = e.target.files[0]; e.target.value = '';
  const st = $('#importStatus'); st.className = 'fstatus';
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { st.textContent = 'Plik musi mieć do 5 MB.'; st.classList.add('bad'); return; }
  importData(await fileB64(file));
};
async function importData(b64) {
  const st = $('#importStatus'); st.className = 'fstatus';
  st.textContent = 'Czytam Twoje CV…';
  try {
    const r = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: b64 }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    const p = j.profile || {};
    FIELDS.forEach((k) => { if (p[k] && !$('#' + k).value.trim()) $('#' + k).value = p[k]; });
    const empty = (b) => !rows(b).some((x) => Object.values(x).some(Boolean));
    if (p.experience?.length && empty('exp')) { $('#exp').replaceChildren(); p.experience.forEach((x) => addRow('exp', x)); }
    if (p.education?.length && empty('edu')) { $('#edu').replaceChildren(); p.education.forEach((x) => addRow('edu', x)); }
    saveDraft();
    st.textContent = j.ai ? 'Gotowe. Uzupełniliśmy formularz danymi z CV (także w kolejnych krokach). Sprawdź je i popraw, jeśli trzeba.' : 'Odczytaliśmy dane kontaktowe. Resztę uzupełnij ręcznie.';
    if (cfg.preview) st.textContent += ' Podgląd: zamiast odczytu pliku wstawiamy przykładowe dane.';
    st.classList.add('good');
  } catch (x) { st.textContent = x.message || 'Nie udało się odczytać pliku.'; st.classList.add('bad'); }
}

/* darmowy skaner CV */
let scanData = null;
$('#scanFile').onchange = (e) => ($('#scanFileName').textContent = e.target.files[0]?.name || 'nie wybrano pliku');
$('#scanForm').onsubmit = async (e) => {
  e.preventDefault();
  const msg = $('#scanMsg'), file = $('#scanFile').files[0];
  let ad = $('#scanAd').value.trim(), title = '';
  msg.className = 'fstatus';
  const fail = (t) => { msg.className = 'fstatus bad'; msg.textContent = t; };
  if (!file) return fail('Wybierz plik ze swoim CV.');
  if (file.size > 5 * 1024 * 1024) return fail('Plik musi mieć do 5 MB.');
  if (!ad) return fail('Wklej link do ogłoszenia albo jego treść.');
  $('#scanBtn').disabled = true;
  try {
    if (/^https?:\/\/\S+$/i.test(ad)) {
      msg.textContent = 'Pobieram ogłoszenie…';
      const r = await fetch('/api/fetch-ad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ad }) });
      const j = await r.json(); if (!r.ok) throw new Error(`${j.error} Wklej treść ogłoszenia zamiast linku.`);
      ad = j.text; title = j.title;
    }
    if (ad.length < 80) throw new Error('Wklej pełną treść ogłoszenia (min. 80 znaków).');
    msg.textContent = 'Porównujemy Twoje CV z ogłoszeniem…';
    const b64 = await fileB64(file);
    const r = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: b64, adText: ad }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    // Nazwa stanowiska: z linku, z oceny AI albo z pierwszego zdania ogłoszenia.
    const guess = ad.split(/[.\n]/)[0].replace(/^(poszukujemy|szukamy|zatrudnimy|zatrudni[mę]?)\s+/i, '').trim().slice(0, 60);
    scanData = { b64, adText: ad, title: title || j.position || guess.charAt(0).toUpperCase() + guess.slice(1) };
    msg.textContent = ''; renderScan(j);
  } catch (x) { fail(x.message); }
  $('#scanBtn').disabled = false;
};
function renderScan(j) {
  const box = $('#scanResult'), total = j.found.length + j.missing.length, pct = j.score ?? 0;
  box.replaceChildren(
    el('div', { className: 'ring', style: `--p:${pct}` }, el('b', { textContent: `${pct}%` })),
    el('div', { className: 'mcol ok' }, el('h3', { textContent: `Spełniasz ${j.found.length} z ${total} wymagań${j.position ? ': ' + j.position : ''}` }), el('ul', {}, ...j.found.map((x) => el('li', { textContent: x })))),
    el('div', { className: 'mcol miss' }, el('h3', { textContent: j.missing.length ? 'Czego nie widać w Twoim CV' : 'Niczego nie brakuje' }), el('ul', {}, ...j.missing.map((m) => el('li', {}, el('b', { textContent: m.keyword }), el('small', { textContent: m.hint }))))),
    j.tips?.length ? el('div', { className: 'tips' }, el('h3', { textContent: 'Co poprawić' }), el('ol', {}, ...j.tips.map((t) => el('li', { textContent: t })))) : null,
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Zrób CV pisane pod to ogłoszenie' }), el('p', { className: 'hint', textContent: 'Uzupełnimy formularz danymi z Twojego pliku, ułożymy CV pod te wymagania, a brakujące rzeczy, które masz, dopiszesz jednym kliknięciem. Od 39 zł, z darmową poprawką.' })),
      el('button', { type: 'button', className: 'btn', textContent: 'Zrób CV pod to ogłoszenie', onclick: fromScan })));
  box.hidden = false; box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
}
function fromScan() {
  if (!scanData) return;
  const first = $('#ads .entry');
  if (first && !$('[data-k=text]', first).value.trim()) {
    $('[data-k=title]', first).value = scanData.title || ''; $('[data-k=text]', first).value = scanData.adText;
    first.dataset.fetched = '1'; setMode(first, 'paste');
  }
  openWiz(); go(2); importData(scanData.b64);
}

/* dane przykładowe (tryb DEMO) */
$('#fill').onclick = () => {
  const set = { name: 'Anna Nowak', email: 'anna.nowak@example.com', phone: '+48 600 100 200', city: 'Kraków', link: 'linkedin.com/in/anna-nowak', headline: 'Specjalistka ds. obsługi klienta', summary: 'Pracuję z klientem od ponad pięciu lat, najpierw w handlu, potem w biurze obsługi.', skills: 'obsługa klienta, obsługa kasy fiskalnej, komunikatywność, praca zmianowa, CRM, rozwiązywanie reklamacji, obsługa zgłoszeń, Excel, inwentaryzacja', languages: 'angielski B2, niemiecki A2', certificates: 'Kurs obsługi klienta B2B', interests: 'bieganie, podróże' };
  Object.entries(set).forEach(([k, val]) => ($('#' + k).value = val));
  ['exp', 'edu', 'ads'].forEach((b) => ($('#' + b).replaceChildren()));
  addRow('exp', { title: 'Specjalistka ds. obsługi klienta', company: 'Nova Serwis Sp. z o.o.', from: '03.2022', to: 'obecnie', description: 'Obsługa 40–50 zgłoszeń dziennie w systemie CRM\nRozwiązywanie reklamacji klientów\nKontakt z klientami zagranicznymi po angielsku' });
  addRow('exp', { title: 'Sprzedawca / kasjer', company: 'Market Dom', from: '06.2019', to: '02.2022', description: 'Obsługa kasy fiskalnej i rozliczanie zmiany\nObsługa klienta, reklamacje przy kasie\nInwentaryzacja towaru\nPraca zmianowa w zespole 8 osób' });
  addRow('edu', { school: 'Uniwersytet Ekonomiczny w Krakowie', degree: 'Zarządzanie, licencjat', from: '2016', to: '2019' });
  addRow('ads', { title: EX[0].title, text: 'Kasjer / Sprzedawca. ' + EX[0].ad + ' Oferujemy umowę o pracę i pakiet benefitów.' });
  addRow('ads', { title: EX[1].title, text: 'Specjalista ds. obsługi klienta. ' + EX[1].ad + ' Oferujemy umowę o pracę i elastyczne godziny.' });
  $('#werr').textContent = 'Wstawiono dane przykładowe. Kliknij „Dalej”, aby przejść przez kroki.';
};

/* ---------- Generowanie i wynik ---------- */
let curAd = 0, curDoc = 'cv', timer;
function landing(show) { ['landing', 'nav', 'foot'].forEach((i) => ($('#' + i).hidden = !show)); }
function startResult(id) {
  orderId = id; landing(false); $('#result').hidden = true; $('#gen').hidden = false; $('#retry').hidden = true;
  $('#genTitle').textContent = 'Piszemy Twoje dokumenty'; window.scrollTo(0, 0);
  clearTimeout(timer); poll();
}
async function poll() {
  let r; try { r = await fetch(`/api/orders/${orderId}`); } catch { r = null; }
  if (!r || !r.ok) { $('#genTitle').textContent = 'Nie znaleziono zamówienia'; $('#genMsg').textContent = 'Sprawdź link lub wróć na stronę główną.'; return; }
  data = await r.json();
  data.design = data.design || { ...design };
  if (data.status === 'done') { $('#gen').hidden = true; return showResult(); }
  if (data.status === 'paid') { $('#genTitle').textContent = 'Coś poszło nie tak'; $('#genMsg').textContent = data.error || 'Generowanie nie powiodło się. Płatność jest zachowana.'; $('#retry').hidden = false; return; }
  $('#genMsg').textContent = data.status === 'pending' ? 'Czekamy na potwierdzenie płatności…' : 'To zajmie około minuty. Nie zamykaj tej strony. Gotowe dokumenty wyślemy też na Twój e-mail.';
  timer = setTimeout(poll, cfg.demo ? 800 : 2500);
}
$('#retry').onclick = async () => { await fetch(`/api/orders/${orderId}/retry`, { method: 'POST' }); startResult(orderId); };

function drawMail() {
  const m = data.mail, n = $('#mailNote');
  n.hidden = !m || m.status === 'skipped';
  if (n.hidden) return;
  const ok = m.status === 'sent';
  n.className = 'mailnote noprint ' + (ok ? 'good' : 'bad');
  n.replaceChildren(el('span', { textContent: ok ? `Wysłaliśmy dokumenty (PDF) na adres ${m.to}. Sprawdź też folder Spam.${cfg.fakeFetch ? ' Podgląd: e-mail nie jest naprawdę wysyłany.' : ''}` : `Nie udało się wysłać e-maila na adres ${m.to}. Pobierz dokumenty poniżej albo spróbuj ponownie.` }), ' ',
    el('button', { type: 'button', className: 'link', textContent: ok ? 'Wyślij ponownie' : 'Spróbuj ponownie', onclick: async (ev) => {
      ev.target.disabled = true;
      const r = await fetch(`/api/orders/${orderId}/resend`, { method: 'POST' }); const j = await r.json().catch(() => ({}));
      if (r.status === 429) { ev.target.textContent = j.error; return; }
      if (j.mail) data.mail = j.mail; drawMail();
    } }));
}
const DOCS = { cv: 'CV', letter: 'List motywacyjny', interview: 'Rozmowa', messages: 'Wiadomości' };
const docsOf = (r) => ['cv', ...(data.pkg === 'cv_letter' ? ['letter'] : []), ...(r.interview?.length ? ['interview'] : []), ...(r.messages ? ['messages'] : [])];
let editing = null; // kopia dokumentu w trakcie ręcznej edycji
let curLang = null; // aktywna dodatkowa wersja językowa (null = główny język)
const cur = () => { const b = data.results[curAd]; return (curLang && b.variants?.[curLang]) || b; };

function interviewNode(r, d) {
  const p = paperEl('extra', { tpl: 'klasyczny', color: d.color });
  p.append(el('div', { className: 'pg' }, el('header', { className: 'top lhead' }, el('h1', { textContent: 'Przygotowanie do rozmowy' }), el('div', { className: 'ct', textContent: r.position }), el('div', { className: 'rule' })),
    el('div', { className: 'qa' }, ...r.interview.map((x, i) => el('div', { className: 'q' }, el('span', { textContent: i + 1 }), el('div', {}, el('b', { textContent: x.q }), el('p', { textContent: x.a })))))));
  return p;
}
function copyBtn(text) {
  return el('button', { type: 'button', className: 'link copy noprint', textContent: 'Kopiuj', onclick: async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = 'Skopiowano'; } catch { e.target.textContent = 'Zaznacz tekst i skopiuj'; }
  } });
}
function messagesNode(r, d) {
  const m = r.messages, p = paperEl('extra', { tpl: 'klasyczny', color: d.color });
  p.append(el('div', { className: 'pg' }, el('header', { className: 'top lhead' }, el('h1', { textContent: 'Wiadomości do rekrutera' }), el('div', { className: 'ct', textContent: r.position }), el('div', { className: 'rule' })),
    el('h3', { textContent: 'Wiadomość na LinkedIn' }), copyBtn(m.linkedin), el('div', { className: 'msgbox', textContent: m.linkedin }),
    el('h3', { textContent: 'E-mail z aplikacją' }), copyBtn(`${m.email.subject}\n\n${m.email.body}`),
    el('div', { className: 'msgbox' }, el('b', { textContent: `Temat: ${m.email.subject}` }), '\n\n', m.email.body)));
  return p;
}

function drawMatch(r) {
  const box = $('#matchBox'), m = r.match;
  box.hidden = curDoc !== 'cv' || !m;
  if (box.hidden) return;
  const pct = m.score ?? 100;
  box.replaceChildren(
    el('div', { className: 'ring', style: `--p:${pct}`, title: 'Odsetek wymagań z ogłoszenia, które pokazuje Twoje CV' }, el('b', { textContent: `${pct}%` })),
    el('div', { className: 'mcol ok' }, el('h3', { textContent: `Raport dopasowania: spełniasz ${m.found.length} z ${m.found.length + m.missing.length} wymagań` }), el('ul', {}, ...m.found.map((x) => el('li', { textContent: x })))),
    el('div', { className: 'mcol miss' }, el('h3', { textContent: m.missing.length ? 'Brakuje w CV' : 'Niczego nie brakuje' }),
      m.missing.length ? el('ul', {}, ...m.missing.map((x) => {
        const inp = el('input', { type: 'text', placeholder: 'Mam to: np. kiedy i gdzie', ariaLabel: `Opisz: ${x.keyword}` });
        return el('li', {}, el('b', { textContent: x.keyword }), el('small', { textContent: x.hint }),
          el('div', { className: 'addf' }, inp, el('button', { type: 'button', className: 'btn sm', textContent: 'Dopisz', onclick: (e) => {
            if (inp.value.trim().length < 3) return inp.focus();
            revise('cv', `Kandydat podaje nowy fakt o sobie: "${inp.value.trim()}". Dodaj go w odpowiednim miejscu CV, bo odpowiada wymaganiu z ogłoszenia: ${x.keyword}.`, x.keyword, e.target);
          } })));
      })) : el('p', { className: 'hint', textContent: 'Wszystkie główne wymagania z ogłoszenia są pokazane w Twoim CV.' })));
}

async function revise(doc, instruction, resolves, btn) {
  if (btn) btn.disabled = true;
  const out = $('#reviseMsg');
  if (out) { out.className = 'hint'; out.textContent = 'Poprawiamy dokument…'; }
  try {
    const r = await fetch(`/api/orders/${orderId}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ i: curAd, lang: curLang, doc, instruction, resolves }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    data.results[curAd] = j.result; data.revisionsLeft = j.revisionsLeft;
    redraw();
    const o = $('#reviseMsg'); if (o) { o.className = 'ok'; o.textContent = `Gotowe. ${j.note || ''}`; }
    else flash(`Gotowe. ${j.note || ''}`);
  } catch (x) {
    const o = $('#reviseMsg'); if (o) { o.className = 'err'; o.textContent = x.message; } else flash(x.message, true);
  }
  if (btn) btn.disabled = false;
}
function flash(t, bad) { const n = el('div', { className: 'toast' + (bad ? ' bad' : ''), role: 'status', textContent: t }); document.body.append(n); setTimeout(() => n.remove(), 5000); }

function openRevise() {
  const box = $('#reviseBox'), doc = curDoc === 'letter' ? 'letter' : 'cv';
  $('#editor').hidden = true;
  const chips = doc === 'cv' ? ['Skróć do jednej strony', 'Bardziej formalnie', 'Prostszy język', 'Mocniej podkreśl doświadczenie z ogłoszenia', 'Popraw błędy językowe'] : ['Skróć', 'Bardziej formalnie', 'Cieplejszy ton', 'Dodaj konkretny przykład z mojej pracy', 'Popraw błędy językowe'];
  const ta = el('textarea', { placeholder: 'Opisz, co zmienić, np. „przenieś kurs B2B wyżej” albo „dodaj, że mam prawo jazdy kat. B”.', rows: 3, ariaLabel: 'Co zmienić' });
  box.replaceChildren(el('h3', { textContent: `Darmowa poprawka: ${doc === 'cv' ? 'CV' : 'list motywacyjny'}` }),
    el('p', { className: 'hint', textContent: 'Wybierz gotową prośbę albo opisz zmianę własnymi słowami. Nowe fakty o sobie możesz dopisać tutaj.' }),
    el('div', { className: 'chipsel' }, ...chips.map((c) => el('button', { type: 'button', textContent: c, onclick: () => { ta.value = c; ta.focus(); } }))),
    el('div', { className: 'row' }, ta),
    el('p', {}, el('button', { type: 'button', className: 'btn', textContent: 'Popraw bez dopłaty', onclick: (e) => { if (ta.value.trim().length < 3) return ta.focus(); revise(doc, ta.value.trim(), null, e.target); } }), ' ', el('button', { type: 'button', className: 'btn ghost', textContent: 'Zamknij', onclick: () => (box.hidden = true) })),
    el('p', { id: 'reviseMsg', className: 'hint' }));
  box.hidden = false; ta.focus();
}

function openEditor() {
  const box = $('#editor'), r = cur(), doc = curDoc === 'letter' ? 'letter' : 'cv';
  $('#reviseBox').hidden = true;
  editing = { doc, cv: JSON.parse(JSON.stringify(r.cv)), letter: r.letter };
  const fld = (label, value, on, rowsN) => { const i = rowsN ? el('textarea', { value, rows: rowsN }) : el('input', { type: 'text', value }); i.oninput = () => { on(i.value); drawPaper(); }; return el('label', { className: 'f' }, label, i); };
  const list = (v) => v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
  const c = editing.cv;
  const body = doc === 'letter' ? [fld('Treść listu', editing.letter, (v) => (editing.letter = v), 16)] : [
    fld('Nagłówek', c.headline, (v) => (c.headline = v)), fld('Profil zawodowy', c.summary, (v) => (c.summary = v), 4),
    ...c.experience.map((e) => fld(`${e.title}${e.company ? ', ' + e.company : ''}: punkty (każdy w nowej linii)`, e.bullets.join('\n'), (v) => (e.bullets = v.split('\n').map((x) => x.trim()).filter(Boolean)), Math.max(3, e.bullets.length + 1))),
    fld('Umiejętności (po przecinku)', c.skills.join(', '), (v) => (c.skills = list(v)), 2),
    fld('Języki', c.languages.join(', '), (v) => (c.languages = list(v))),
    fld('Certyfikaty i kursy', c.certificates.join(', '), (v) => (c.certificates = list(v))),
    fld('Zainteresowania', c.interests || '', (v) => (c.interests = v)),
  ];
  box.replaceChildren(el('h3', { textContent: doc === 'cv' ? 'Edytuj CV' : 'Edytuj list motywacyjny' }), el('p', { className: 'hint', textContent: 'Zmiany widzisz od razu w dokumencie poniżej.' }), el('div', { className: 'editor-grid' }, ...body),
    el('p', {}, el('button', { type: 'button', className: 'btn', textContent: 'Zapisz zmiany', onclick: async (e) => {
      e.target.disabled = true;
      const r2 = await fetch(`/api/orders/${orderId}/results/${curAd}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: curLang, ...(doc === 'cv' ? { cv: editing.cv } : { letter: editing.letter }) }) });
      const j = await r2.json().catch(() => ({}));
      if (r2.ok) { data.results[curAd] = j.result; editing = null; box.hidden = true; redraw(); flash('Zapisano zmiany.'); } else { e.target.disabled = false; flash(j.error || 'Nie udało się zapisać.', true); }
    } }), ' ', el('button', { type: 'button', className: 'btn ghost', textContent: 'Anuluj', onclick: () => { editing = null; box.hidden = true; drawPaper(); } })));
  box.hidden = false;
}

function drawPaper() {
  const base = cur(), r = editing ? { ...base, cv: editing.cv, letter: editing.letter } : base, d = data.design;
  const node = { cv: () => cvNode(r, undefined, d), letter: () => letterNode(r, d), interview: () => interviewNode(r, d), messages: () => messagesNode(r, d) }[curDoc];
  $('#paper').replaceChildren(node());
}

function drawFollowup() {
  const box = $('#followup');
  box.hidden = false;
  if (box.dataset.ready === orderId) return;
  box.dataset.ready = orderId;
  const doc = data.pkg === 'cv' ? 'CV' : 'CV i list';
  box.replaceChildren(el('h3', { textContent: 'Masz kolejne ogłoszenie?' }),
    el('p', { className: 'hint', textContent: `Twoje dane już mamy. ${doc} pod nowe ogłoszenie kosztuje ${PRICE.extra} zł, w tym samym wyglądzie.` }),
    el('div', { id: 'fuAds' }),
    el('label', { className: 'f fucode' }, 'Kod rabatowy (np. nagroda za polecenie) ', el('input', { type: 'text', id: 'fuCode', placeholder: 'opcjonalnie', autocomplete: 'off' })),
    el('p', {}, el('button', { type: 'button', className: 'btn', id: 'fuPay', textContent: `Zamów za ${PRICE.extra} zł`, onclick: async (e) => {
      const ads = rows('fuAds'), err = $('#fuErr'), code = $('#fuCode').value.trim();
      const bad = ads.find((a) => !a.title || a.text.length < 80);
      if (bad) { err.textContent = 'Podaj nazwę stanowiska i pełną treść ogłoszenia (min. 80 znaków).'; return; }
      e.target.disabled = true; err.textContent = '';
      try {
        const r = await fetch(`/api/orders/${orderId}/followup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ads, code }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); delete box.dataset.ready; startResult(j.id); } else location.href = j.url;
      } catch (x) { err.textContent = x.message; e.target.disabled = false; }
    } }), cfg.demo ? el('span', { className: 'hint', textContent: '  Podgląd: płatność jest symulowana.' }) : null),
    el('p', { className: 'err', id: 'fuErr' }));
  addRow('fuAds');
}

function drawReferral() {
  const box = $('#referral'), r = data.referral;
  box.hidden = !r;
  if (!r) return;
  const link = cfg.preview ? `https://twojadomena.pl/?ref=${r.code}` : `${location.origin}/?ref=${r.code}`;
  box.replaceChildren(el('h3', { textContent: `Poleć nas i zyskaj ${r.discount} zł` }),
    el('p', { className: 'hint', textContent: `Znajomy z Twoim kodem zapłaci ${r.discount} zł mniej, a Ty dostaniesz kod na ${r.discount} zł rabatu za każde jego zamówienie.` }),
    el('div', { className: 'refrow' }, el('code', { textContent: r.code }), el('input', { type: 'text', readOnly: true, value: link, ariaLabel: 'Link polecający', onfocus: (e) => e.target.select() }),
      el('button', { type: 'button', className: 'btn sm', textContent: 'Kopiuj link', onclick: async (e) => { try { await navigator.clipboard.writeText(link); e.target.textContent = 'Skopiowano'; } catch { e.target.previousSibling.select(); e.target.textContent = 'Zaznaczono, skopiuj'; } } })),
    el('p', { className: 'hint', textContent: r.uses ? `Z Twojego kodu skorzystało osób: ${r.uses}.` : 'Nikt jeszcze nie użył Twojego kodu.' }),
    ...(r.rewards?.length ? [el('p', { className: 'rewards' }, el('b', { textContent: 'Twoje kody nagród: ' }), r.rewards.join(', '), ' (wpisz przy kolejnym ogłoszeniu poniżej)')] : []));
}

let redraw = () => {};
function showResult() {
  clearDraft(); try { localStorage.removeItem(REF_KEY); } catch {}
  $('#result').hidden = false; window.scrollTo(0, 0);
  curAd = Math.min(curAd, data.results.length - 1);
  const draw = () => {
    const base = data.results[curAd], vl = Object.keys(base.variants || {});
    if (curLang && !vl.includes(curLang)) curLang = null;
    const r = cur(), docs = docsOf(r);
    $('#langTabs').replaceChildren(...[null, ...vl].map((l) => el('button', { type: 'button', role: 'tab', ariaSelected: String(l === curLang), textContent: (l || base.lang || 'pl').toUpperCase(), title: LANGS[l || base.lang || 'pl'], onclick: () => { curLang = l; editing = null; $('#editor').hidden = $('#reviseBox').hidden = true; draw(); } })));
    $('#langTabs').hidden = !vl.length;
    $('#untrNote').hidden = !r.untranslated;
    if (!docs.includes(curDoc)) curDoc = 'cv';
    $('#adTabs').replaceChildren(...data.results.map((x, i) => el('button', { type: 'button', role: 'tab', textContent: `${i + 1}. ${(x.position || '').slice(0, 32)}${x.lang === 'en' ? ' (EN)' : ''}`, onclick: () => { curAd = i; curLang = null; editing = null; $('#editor').hidden = $('#reviseBox').hidden = true; draw(); } })));
    $$('#adTabs button').forEach((b, i) => b.setAttribute('aria-selected', i === curAd));
    $('#adTabs').hidden = data.results.length < 2;
    $('#docTabs').replaceChildren(...docs.map((k) => el('button', { type: 'button', role: 'tab', textContent: DOCS[k], onclick: () => { curDoc = k; editing = null; $('#editor').hidden = $('#reviseBox').hidden = true; draw(); } })));
    $$('#docTabs button').forEach((b, i) => b.setAttribute('aria-selected', docs[i] === curDoc));
    $('#docTabs').hidden = docs.length < 2;
    $('#print').textContent = `Pobierz PDF: ${{ cv: 'CV', letter: 'list', interview: 'pytania', messages: 'wiadomości' }[curDoc]}`;
    const editable = curDoc === 'cv' || curDoc === 'letter';
    $('#resActions').hidden = !editable;
    $('#revLeft').textContent = `Pozostało poprawek: ${data.revisionsLeft ?? cfg.maxRevisions}`;
    $('#hlTog').parentElement.hidden = curDoc !== 'cv';
    drawMatch(r); drawPaper();
    try { document.title = `${DOCS[curDoc]} ${r.cv.name} – ${r.position}`; } catch {}
  };
  redraw = draw;
  drawMail();
  designPicker($('#resDesign'), data.design, (d) => { data.design = d; draw(); fetch(`/api/orders/${orderId}/design`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).catch(() => {}); }, { thumbs: false });
  $('#hlTog').onchange = draw;
  $('#print').hidden = !!cfg.noPrint;
  $('#print').onclick = () => window.print();
  $('#editBtn').onclick = openEditor;
  $('#reviseBtn').onclick = openRevise;
  $('#editor').hidden = $('#reviseBox').hidden = true; editing = null;
  if (data.expires) $('#retention').textContent = `Dane tego zamówienia, w tym dokumenty${data.photo ? ' i zdjęcie' : ''}, usuniemy automatycznie ${new Date(data.expires).toLocaleDateString('pl-PL')}. Zapisz PDF-y u siebie.`;
  drawFollowup(); drawReferral();
  draw();
}
$('#newOrder').onclick = () => {
  try { history.replaceState(null, '', location.pathname); } catch {}
  $('#result').hidden = true; landing(true); route();
  resetWizard(); window.scrollTo(0, 0);
};
function resetWizard() { design = { tpl: 'nowoczesny', color: 'niebieski' }; drawWizDesign(); setPhoto(''); restoring = true; $('#wizForm').reset(); ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); addRow(b); }); restoring = false; refresh(); go(1); }

/* ---------- Asystent na stronie ---------- */
const chat = { history: [], started: false };
const SUGG = ['Jak opisać przerwę w pracy?', 'Czy dodać zdjęcie do CV?', 'Jak długie powinno być CV?', 'Co to jest ATS?'];
function chatMsg(role, text) { const m = el('div', { className: `msg ${role === 'user' ? 'me' : 'bot'}`, textContent: text }); $('#chatLog').append(m); $('#chatLog').scrollTop = 1e9; return m; }
function toggleChat(open) {
  $('#chat').hidden = !open; $('#chatFab').setAttribute('aria-expanded', String(open));
  if (!open) return $('#chatFab').focus();
  if (!chat.started) {
    chat.started = true;
    chatMsg('assistant', 'Cześć! Pomogę Ci z CV, listem motywacyjnym i rozmową o pracę. O co chcesz zapytać?');
    $('#chatSugg').replaceChildren(...SUGG.map((q) => el('button', { type: 'button', textContent: q, onclick: () => askChat(q) })));
    if (cfg.preview) $('.chat-head span').textContent = 'Podgląd: odpowiedzi z krótkiej bazy, bez AI.';
  }
  $('#chatInput').focus();
}
async function askChat(q) {
  q = String(q || '').trim(); if (!q) return;
  $('#chatSugg').replaceChildren(); chatMsg('user', q); chat.history.push({ role: 'user', content: q });
  const w = chatMsg('assistant', 'Piszę odpowiedź…'); w.classList.add('wait');
  try {
    const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: chat.history.slice(-12) }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    w.textContent = j.answer; chat.history.push({ role: 'assistant', content: j.answer });
  } catch (x) { w.textContent = x.message; chat.history.pop(); }
  w.classList.remove('wait'); $('#chatLog').scrollTop = 1e9;
}
$('#chatFab').onclick = () => toggleChat($('#chat').hidden);
$('#chatClose').onclick = () => toggleChat(false);
$('#chatForm').onsubmit = (e) => { e.preventDefault(); const v = $('#chatInput').value; $('#chatInput').value = ''; askChat(v); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#chat').hidden && $('#wiz').hidden && $('#exview').hidden) toggleChat(false); });

/* ---------- Podstrony: zawody i poradnik ---------- */
let CONTENT = null;
const CLAUSE = 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.';
async function loadContent() {
  if (!CONTENT) { try { CONTENT = await (await fetch('/content.json')).json(); } catch { CONTENT = { INDEX: [], POPULAR: [], ARTICLES: [] }; } }
  return CONTENT;
}
async function loadProf(slug) {
  const C = await loadContent(), p = C.POPULAR.find((x) => x.slug === slug);
  if (p) return p;
  try { const r = await fetch(`/content/cv/${slug}.json`); if (r.ok) return await r.json(); } catch {}
  return null;
}
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const profResult = (p) => ({ position: p.sample.headline, lang: 'pl', keywords: [], cv: {
  name: p.sample.name, headline: p.sample.headline, contact: p.sample.contact, summary: p.sample.summary,
  experience: p.sample.jobs.map((j) => ({ title: j.title, company: j.company, period: j.period, bullets: j.bullets })),
  education: [p.sample.education], skills: p.sample.skills, languages: p.sample.languages || [], certificates: [], interests: '', clause: CLAUSE } });
const pageHref = (r) => (cfg.preview ? '#' + (r ? r.replace('/', '-') : 'top') : '/' + r);
const pageLink = (r, props, ...kids) => { const a = el('a', { href: pageHref(r), ...props }, ...kids); a.dataset.page = r; return a; };
const openBtn = (t, cls = 'btn') => { const b = el('button', { type: 'button', className: cls, textContent: t }); b.dataset.open = ''; return b; };

async function drawLists() {
  const C = await loadContent();
  $('#profGrid').replaceChildren(...C.POPULAR.map((p, k) => pageLink(`cv/${p.slug}`, { className: 'prof-card' },
    thumb(profResult(p), { tpl: TPLS[k % TPLS.length][0], color: Object.keys(COLORS)[k % 6] }), el('b', { textContent: p.name }))));
  $('#artGrid').replaceChildren(...C.ARTICLES.map((a) => pageLink(`poradnik/${a.slug}`, { className: 'art-card' }, el('small', { textContent: `${a.readMinutes} min czytania` }), el('b', { textContent: a.title }), el('span', { textContent: a.lead }))));
  $('#footProf').replaceChildren(...C.POPULAR.slice(0, 6).map((p) => pageLink(`cv/${p.slug}`, { textContent: p.name })));
  const cats = [...new Set(C.INDEX.map((p) => p.category))];
  $('#profAll').replaceChildren(...cats.map((c) => el('div', { className: 'cat' }, el('b', { textContent: c }), el('div', {}, ...C.INDEX.filter((p) => p.category === c).map((p) => pageLink(`cv/${p.slug}`, { textContent: p.name }))))));
  $('.allprof summary').textContent = `Wszystkie zawody (${C.INDEX.length})`;
}

/* wyszukiwarka zawodów; gdy brak wyniku, zachęcamy do stworzenia CV samodzielnie w kreatorze */
let searchT;
$('#profSearch').addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(runSearch, 150); });
async function runSearch() {
  const raw = $('#profSearch').value.trim(), q = fold(raw), box = $('#profResults');
  if (q.length < 2) { box.hidden = true; return; }
  const C = await loadContent();
  const hits = C.INDEX.map((p) => ({ p, name: fold(p.name).includes(q), any: fold(`${p.name} ${p.category} ${p.keywords.join(' ')}`).includes(q) }))
    .filter((x) => x.any).sort((a, b) => b.name - a.name).slice(0, 12);
  box.hidden = false;
  if (hits.length) { box.replaceChildren(...hits.map(({ p }) => pageLink(`cv/${p.slug}`, {}, el('b', { textContent: p.name }), el('small', { textContent: p.category })))); return; }
  box.replaceChildren(el('div', { className: 'notfound' },
    el('p', {}, el('b', { textContent: `Nie mamy jeszcze strony dla „${raw}”. ` }), 'To nie problem: CV pod konkretne ogłoszenie przygotujemy dla każdego zawodu. Stwórz je samodzielnie w kreatorze: wpisz swoje doświadczenie i wklej ogłoszenie, a resztą zajmiemy się my.'),
    el('button', { type: 'button', className: 'btn', textContent: 'Stwórz CV samodzielnie', onclick: () => { if (!$('#headline').value.trim()) $('#headline').value = raw; openWiz(); } })));
}

function profPage(p, C) {
  const d = { tpl: 'nowoczesny', color: 'niebieski' }, r = profResult(p);
  const side = el('div', { className: 'side-thumb' }), full = el('div', { className: 'side-full' });
  const paint = () => { side.replaceChildren(thumb(r, d, false, '')); full.replaceChildren(cvNode(r, false, d, '')); };
  const picker = el('div'); designPicker(picker, d, paint, { thumbs: false }); paint();
  return el('div', { className: 'inner' },
    el('nav', { className: 'crumbs', ariaLabel: 'Ścieżka' }, pageLink('', { textContent: 'Strona główna' }), '›', el('a', { href: '#zawody', textContent: 'CV dla zawodów' }), '›', el('span', { textContent: p.name })),
    el('h1', { textContent: p.title }), el('p', { className: 'lead', textContent: p.intro }),
    el('div', { className: 'page-grid' },
      el('div', {},
        el('h2', { textContent: 'Słowa kluczowe z ogłoszeń' }), el('p', { className: 'hint', textContent: 'Te sformułowania często pojawiają się w ofertach. Jeśli to prawda o Tobie, użyj ich w CV w takim samym brzmieniu.' }),
        el('div', { className: 'kw' }, ...p.keywords.map((k) => el('span', { textContent: k }))),
        el('h2', { textContent: 'Wskazówki do CV' }), el('ol', { className: 'tips' }, ...p.tips.map((t) => el('li', { textContent: t }))),
        el('h2', { textContent: 'Przykładowe CV' }), el('p', { className: 'hint', textContent: 'Dane w przykładzie są fikcyjne. Szablon i kolor zmienisz w panelu obok.' }), full,
        el('h2', { textContent: 'Pytania' }), ...p.faq.map((f) => el('details', {}, el('summary', { textContent: f.q }), el('p', { textContent: f.a }))),
        el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Masz konkretne ogłoszenie?' }), el('p', { className: 'hint', textContent: 'Wklej link, a przygotujemy CV pisane pod nie. Od 39 zł, z darmową poprawką.' })), openBtn('Zamów CV')),
        el('h2', { textContent: 'Podobne zawody' }), el('div', { className: 'more' }, ...C.INDEX.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => pageLink(`cv/${x.slug}`, { textContent: x.name })), el('a', { href: '#zawody', textContent: 'Wszystkie zawody' }))),
      el('aside', { className: 'side-card' }, el('b', { textContent: `Przykład: ${p.sample.name}` }), side, picker, openBtn('Zamów CV pod swoje ogłoszenie'), el('p', { className: 'hint', textContent: 'Raport dopasowania, darmowa poprawka, PDF w e-mailu.' }))));
}
function articlePage(a, C) {
  return el('div', { className: 'inner narrow article' },
    el('nav', { className: 'crumbs', ariaLabel: 'Ścieżka' }, pageLink('', { textContent: 'Strona główna' }), '›', el('a', { href: '#poradnik', textContent: 'Poradnik' }), '›', el('span', { textContent: a.title })),
    el('h1', { textContent: a.title }), el('p', { className: 'meta', textContent: `${a.readMinutes} min czytania` }), el('p', { className: 'lead', textContent: a.lead }),
    ...a.sections.flatMap((sec) => [el('h2', { textContent: sec.h }), ...sec.p.map((t) => el('p', { textContent: t }))]),
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Zrób CV pod swoje ogłoszenie' }), el('p', { className: 'hint', textContent: 'Wklejasz link, dostajesz CV z raportem dopasowania. Od 39 zł.' })), openBtn('Zamów CV')),
    el('h2', { textContent: 'Przeczytaj też' }), el('div', { className: 'more' }, ...C.ARTICLES.filter((x) => x.slug !== a.slug).map((x) => pageLink(`poradnik/${x.slug}`, { textContent: x.title })), ...C.POPULAR.slice(0, 4).map((x) => pageLink(`cv/${x.slug}`, { textContent: `CV: ${x.name}` }))));
}
function setMeta(desc) { let m = document.querySelector('meta[name=description]'); if (!m) { m = el('meta', { name: 'description' }); document.head.append(m); } m.content = desc; }
function navTo(r) {
  try {
    if (cfg.preview) history.pushState(null, '', r ? '#' + r.replace('/', '-') : '#top');
    else history.pushState(null, '', '/' + r);
  } catch {}
}
async function showPage(r, push = true) {
  const C = await loadContent(), [kind, slug] = r.split('/');
  const item = kind === 'cv' ? await loadProf(slug) : C.ARTICLES.find((a) => a.slug === slug);
  if (!item) return showHome(push);
  $('#landing').hidden = true; Object.values(LEGAL).forEach((l) => ($('#' + l).hidden = true));
  $('#page').hidden = false;
  $('#page').replaceChildren(kind === 'cv' ? profPage(item, C) : articlePage(item, C));
  try { document.title = `${item.title} | CV Pod Ogłoszenie`; } catch {}
  setMeta(item.metaDescription);
  if (push) navTo(r);
  window.scrollTo(0, 0);
}
function showHome(push) {
  $('#page').hidden = true; Object.values(LEGAL).forEach((l) => ($('#' + l).hidden = true)); $('#landing').hidden = false;
  try { document.title = 'CV Pod Ogłoszenie'; } catch {}
  if (push) navTo('');
  window.scrollTo(0, 0);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-page]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  if (!$('#result').hidden) { location.href = cfg.preview ? '#top' : '/' + a.dataset.page; return; }
  a.dataset.page ? showPage(a.dataset.page) : showHome(true);
});
window.addEventListener('popstate', () => route());

const LEGAL = { '#regulamin': 'legal-regulamin', '#prywatnosc': 'legal-prywatnosc' };
function route() {
  if (!$('#result').hidden || !$('#gen').hidden) return;
  const h = location.hash, hm = /^#(cv|poradnik)-([\w-]+)$/.exec(h), pm = /^\/(cv|poradnik)\/([\w-]+)\/?$/.exec(location.pathname);
  if (hm) return showPage(`${hm[1]}/${hm[2]}`, false);
  const anchor = h.length > 1 && document.getElementById(h.slice(1));
  if (pm && !LEGAL[h] && !(anchor && anchor.closest('#landing'))) return showPage(`${pm[1]}/${pm[2]}`, false);
  $('#page').hidden = true;
  const id = LEGAL[h];
  $('#landing').hidden = !!id;
  Object.values(LEGAL).forEach((l) => ($('#' + l).hidden = l !== id));
  if (id) { window.scrollTo(0, 0); try { document.title = location.hash === '#regulamin' ? 'Regulamin – CV Pod Ogłoszenie' : 'Polityka prywatności – CV Pod Ogłoszenie'; } catch {} }
  else { try { document.title = 'CV Pod Ogłoszenie'; } catch {} const t = location.hash.length > 1 && document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}
window.addEventListener('hashchange', route); route();

addRow('exp'); addRow('edu'); addRow('ads');
if (restoreDraft()) $('#draftNote').hidden = false;
refresh(); go(1); drawWizDesign();
$('#clearDraft').onclick = () => { clearDraft(); resetWizard(); $('#draftNote').hidden = true; };
const q = new URLSearchParams(location.search);
if (window.__ROUTE) showPage(window.__ROUTE, false);
if (q.get('id')) startResult(q.get('id'));
else if (q.has('canceled')) { try { history.replaceState(null, '', location.pathname); } catch {} openWiz(); go(6); $('#werr').textContent = 'Płatność została anulowana. Twoje dane są zachowane, możesz spróbować ponownie.'; }
})();
