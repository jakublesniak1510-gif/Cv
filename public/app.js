(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k.filter((x) => x != null && x !== false)); return e; };
let PRICE = { cv: 39, cv_letter: 49, pack3: 79, interview: 50, messages: 9, linkedin: 19, sim: 29, docx: 9, extraLang: 5, bundleOff: 19 };
const ADDON_KEYS = { interview: ['#adInterview', 'Przygotowanie do rozmowy'], messages: ['#adMessages', 'Wiadomość do rekrutera i e-mail z aplikacją'], linkedin: ['#adLinkedin', 'Profil LinkedIn'], sim: ['#adSim', 'Symulator rozmowy kwalifikacyjnej'], docx: ['#adDocx', 'Wersja Word (.docx)'] };
const PKG_ADS = { cv: 1, cv_letter: 1, pack3: 3 };
// Odmiana po liczebniku (jak lib/plural.js): 1 dopasowanie, 2 dopasowania, 5 dopasowań.
const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const PKG_NAME = { cv: 'CV', cv_letter: 'CV + list motywacyjny', pack3: 'Pakiet 3 CV + listy motywacyjne' };
let promo = null; // zastosowany kod rabatowy: { code, discount, label }
let data; // bieżące zamówienie na stronie wyniku
const STEPS = ['Pakiet i wygląd CV', 'Twoje dane', 'Doświadczenie', 'Wykształcenie i umiejętności', 'Ogłoszenia', 'Podsumowanie'];
// Test A/B „wizard_order” (lib/ab.js, data-order="b" od serwera): najpierw ogłoszenie, potem dane, doświadczenie, wykształcenie,
// a pakiet, dodatki, języki i wygląd w podsumowaniu. Kroki zachowują numery sekcji (walidacja, analityka), zmienia się kolejność.
const ORDER_B = document.getElementById('wiz')?.dataset.order === 'b';
const ORDER = ORDER_B ? [5, 2, 3, 4, 6] : [1, 2, 3, 4, 5, 6];
if (ORDER_B) {
  const s1 = document.querySelector('#wiz section[data-step="1"]'), s5 = document.querySelector('#wiz section[data-step="5"]'), s6 = document.querySelector('#wiz section[data-step="6"]');
  const keep = ['saveLater', 'draftNote', 'fill'].map((id) => document.getElementById(id)).filter(Boolean); // zostają w pierwszym kroku
  s5.append(...keep);
  const head = document.createElement('h3'); head.className = 'sh'; head.textContent = 'Twoje zamówienie';
  s6.prepend(...[...s1.childNodes], head);
  s1.remove();
}
const STEP_TITLE = (n) => (ORDER_B && n === 5 ? 'Od jakiego ogłoszenia zaczynamy?' : ORDER_B && n === 6 ? 'Pakiet, wygląd i podsumowanie' : STEPS[n - 1]);
let pendingDraft = ''; // ogłoszenie z rozszerzenia Chrome czekające na formularz skanera
let cfg = { demo: false, maxAds: 5, noPrint: false, maxRevisions: 5, loading: true };
// Statystyki bez cookies: zbiorcze odsłony i kroki kreatora (serwer nie zapisuje IP ani identyfikatorów).
const trackLater = []; // zdarzenia sprzed wczytania konfiguracji (np. powrót z płatności), wysyłane po „pv”
function track(e, x = {}) {
  if (cfg.loading) { if (trackLater.length < 10) trackLater.push([e, x]); return; }
  if (cfg.preview || !navigator.sendBeacon) return;
  try { navigator.sendBeacon('/api/t', JSON.stringify({ e, p: location.pathname, r: document.referrer, u: new URLSearchParams(location.search).get('utm_source') || '', l: (document.documentElement.lang || 'pl').slice(0, 2), ...x })); } catch {}
}
// Szablony i kolory: muszą zgadzać się z lib/designs.js.
const TPLS = [
  ['nowoczesny', 'Nowoczesny', 'Kolorowy pasek boczny z monogramem, kontaktem i umiejętnościami.'],
  ['os', 'Oś czasu', 'Doświadczenie na osi czasu. Rekruter od razu widzi Twoją ścieżkę.'],
  ['szwajcarski', 'Szwajcarski', 'Siatka jak w magazynie: duże nazwisko, równe kolumny, zero ozdobników.'],
  ['geometria', 'Geometria', 'Skośny kolorowy nagłówek i panel boczny. Wyróżnia się w stosie CV.'],
  ['elegancki', 'Elegancki', 'Szeryfowa typografia i monogram. Na stanowiska biurowe i kierownicze.'],
  ['klasyczny', 'Klasyczny ATS', 'Jedna kolumna, którą najlepiej odczytują systemy rekrutacyjne.'],
  ['monogram', 'Monogram', 'Wyśrodkowany nagłówek z inicjałami w okręgu i sekcje w wierszach. Do biur i finansów.'],
  ['kreatywny', 'Kreatywny', 'Ukośny kolorowy nagłówek i żółte akcenty. Do marketingu, sprzedaży i branż kreatywnych.'],
  ['kompetencje', 'Kompetencje', 'Jasna kolumna z umiejętnościami i poziomem języków. Do IT, logistyki i pracy technicznej.'],
  ['wstega', 'Wstęga', 'Kolorowa wstęga u góry, zdjęcie na jej krawędzi i wyśrodkowane sekcje.'],
  ['lebenslauf', 'Lebenslauf', 'Niemiecki układ: dane osobowe w tabeli, zdjęcie, daty w kolumnie, miejsce, data i podpis. Do pracy w Niemczech i Austrii.'],
  ['europass', 'Europass', 'Układ wzorowany na unijnym CV Europass, z tabelą języków. Do ofert z UE i pracy za granicą.'],
];
const LEGACY = { wyrazisty: 'geometria' };
const COLORS = { niebieski: '#2548E8', granat: '#1E3A5F', morski: '#0F766E', bordo: '#9F1239', fiolet: '#6D28D9', grafit: '#374151' };
const COLOR_NAMES = { niebieski: 'niebieski', granat: 'granatowy', morski: 'morski', bordo: 'bordowy', fiolet: 'fioletowy', grafit: 'grafitowy' };
let design = { tpl: 'nowoczesny', color: 'niebieski' };
const tplName = (t) => (TPLS.find((x) => x[0] === t) || TPLS[0])[1];
const ro = new ResizeObserver((es) => es.forEach((e) => e.target.style.setProperty('--s', e.contentRect.width / 794)));
// Miniatura to podgląd wizualny (obok jest nazwa szablonu i opis), więc czytniki ekranu ją pomijają.
const thumb = (r, d, on = false, photo = '') => { const t = el('div', { className: 'thumb' }, cvNode(r, on, d, photo)); t.setAttribute('aria-hidden', 'true'); ro.observe(t); return t; };
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
// Etykiety szablonów Lebenslauf i Europass (dane osobowe, miejsce i data, podpis, poziom języka).
const LBL2 = {
  pl: { cvTitle: 'Życiorys', personal: 'Dane osobowe', phone: 'Telefon', email: 'E-mail', city: 'Miejsce zamieszkania', web: 'Profil', more: 'Umiejętności i języki', native: 'ojczysty', placeDate: 'Miejscowość, data', sign: 'Podpis', level: 'Poziom' },
  en: { cvTitle: 'Curriculum Vitae', personal: 'Personal details', phone: 'Phone', email: 'Email', city: 'Location', web: 'Profile', more: 'Skills and languages', native: 'native', placeDate: 'Place, date', sign: 'Signature', level: 'Level' },
  de: { cvTitle: 'Lebenslauf', personal: 'Persönliche Daten', phone: 'Telefon', email: 'E-Mail', city: 'Wohnort', web: 'Profil', more: 'Kenntnisse und Fähigkeiten', native: 'Muttersprache', placeDate: 'Ort, Datum', sign: 'Unterschrift', level: 'Niveau' },
  uk: { cvTitle: 'Резюме', personal: 'Особисті дані', phone: 'Телефон', email: 'E-mail', city: 'Місце проживання', web: 'Профіль', more: 'Навички та мови', native: 'рідна', placeDate: 'Місто, дата', sign: 'Підпис', level: 'Рівень' },
  es: { cvTitle: 'Currículum vitae', personal: 'Datos personales', phone: 'Teléfono', email: 'Correo', city: 'Residencia', web: 'Perfil', more: 'Habilidades e idiomas', native: 'nativo', placeDate: 'Lugar y fecha', sign: 'Firma', level: 'Nivel' },
  fr: { cvTitle: 'Curriculum vitae', personal: 'Informations personnelles', phone: 'Téléphone', email: 'E-mail', city: 'Domicile', web: 'Profil', more: 'Compétences et langues', native: 'langue maternelle', placeDate: 'Lieu, date', sign: 'Signature', level: 'Niveau' },
};
// Rodzaj pozycji kontaktowej (do tabel danych osobowych) i podział „język + poziom CEFR”.
const contactKind = (x) => (/@/.test(x) ? 'email' : /^\+?[\d\s()./-]{7,}$/.test(x) ? 'phone' : /https?:|www\.|\.(com|pl|de|io|net|org|eu)\b|linkedin|github/i.test(x) ? 'web' : 'city');
const NATIVE = /\s*[(,–-]?\s*(język ojczysty|ojczysty|native( speaker)?|muttersprache|рідна( мова)?|nativo|langue maternelle)\)?\s*/i;
const langLevel = (t, M) => { const m = /^(.*?)[\s,–-]*\b([ABC][12])\b(.*)$/i.exec(t); return m ? [(m[1] + m[3]).trim(), m[2].toUpperCase()] : NATIVE.test(t) ? [t.replace(NATIVE, ' ').trim(), M?.native || ''] : [t, '']; };
const LANGS = { pl: 'polski', en: 'angielski', de: 'niemiecki', uk: 'ukraiński', es: 'hiszpański', fr: 'francuski' };
// Rozpoznanie języka ogłoszenia — kopia lib/lang.js (serwer liczy cenę tą samą metodą).
const W = (s) => new RegExp(`(?<!\\p{L})(${s})(?!\\p{L})`, 'gu');
const HINTS = {
  pl: [/[ąćęłńśźż]/g, W('i|w|z|na|do|się|oraz|jest|dla|od|nie|lub|pracy|oferujemy|wymagania|doświadczenie')],
  en: [null, W('the|and|of|to|with|for|you|we|are|is|our|in|will|experience|skills')],
  de: [/[äöüß]/g, W('und|der|die|das|mit|für|wir|sie|ist|bei|ein|eine|zu|erfahrung')],
  es: [/[ñ¿¡]/g, W('el|la|los|las|de|y|con|para|en|un|una|ofrecemos|experiencia')],
  fr: [/[àâçèêëîôûœ]/g, W('le|la|les|et|des|pour|avec|vous|nous|est|une|du|expérience')],
};
function detectLang(text = '') {
  const t = String(text).toLowerCase();
  if ((t.match(/[а-яіїєґ]/g) || []).length > 20) return 'uk';
  let best = 'pl', top = 0;
  for (const [l, [chars, words]] of Object.entries(HINTS)) {
    const s = (chars ? (t.match(chars) || []).length * 2 : 0) + (t.match(words) || []).length;
    if (s > top) { best = l; top = s; }
  }
  return best;
}
const mainLang = (ad) => (ad.lang && ad.lang !== 'auto' ? ad.lang : detectLang(ad.text));
// Tłumaczenie na język, w którym i tak powstaną wszystkie dokumenty, nie ma sensu — nie liczymy go.
const usefulExtraLangs = (langs, ads) => langs.filter((l) => !ads.length || !ads.every((a) => mainLang(a) === l));
function parts(c, kw, lang = 'pl', photo = '') {
  const L = LBL[lang] || LBL.pl, M = LBL2[lang] || LBL2.pl;
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
    // Języki z poziomem: paski z oznaczeń A1–C2 (bez oznaczenia sam tekst, niczego nie zgadujemy).
    langsLv: () => (c.languages?.length ? sec(L.langs, ...c.languages.map((t) => {
      const m = /\b([ABC][12])\b/i.exec(t), n = m ? { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 }[m[1].toUpperCase()] : /ojczyst|native|rodzim|muttersprach|рідн/i.test(t) ? 5 : 0;
      return el('div', { className: 'lv' }, el('span', { textContent: t }), n ? el('div', { className: 'dots', ariaHidden: 'true' }, ...[1, 2, 3, 4, 5].map((i) => el('i', { className: i <= n ? 'f' : '' }))) : null);
    })) : null),
    contactSec: () => sec(L.contact, el('ul', { className: 'clist' }, ...contact.map((x) => el('li', { textContent: x })))),
    // Lebenslauf: dane osobowe w tabeli, daty w lewej kolumnie, miejsce/data/podpis na końcu.
    persData: () => (contact.length ? sec(M.personal, el('dl', { className: 'kv' }, ...contact.flatMap((x) => [el('dt', { textContent: M[contactKind(x)] }), el('dd', { textContent: x })]))) : null),
    tRows: (items, titleOf, orgOf) => items.map((e) => el('div', { className: 'row' }, el('div', { className: 'd', textContent: e.period || '' }),
      el('div', { className: 'c' }, el('b', { textContent: titleOf(e) || '' }), orgOf(e) ? el('div', { className: 'co', textContent: orgOf(e) }) : null,
        e.bullets?.length ? el('ul', {}, ...e.bullets.map((b) => el('li', {}, hl(b, kw)))) : null))),
    tExp: function () { return c.experience?.length ? sec(L.exp, ...this.tRows(c.experience, (e) => e.title, (e) => e.company)) : null; },
    tEdu: function () { return c.education?.length ? sec(L.edu, ...this.tRows(c.education, (e) => e.school, (e) => e.degree)) : null; },
    tMore: () => {
      const rows = [[L.skills, c.skills], [L.langs, c.languages], [L.certsShort || L.certs, c.certificates], [L.interests, c.interests ? [c.interests] : []]].filter(([, v]) => v?.length);
      return rows.length ? sec(M.more, el('dl', { className: 'kv' }, ...rows.flatMap(([t, v]) => [el('dt', { textContent: t }), el('dd', {}, hl(v.join(', '), kw))]))) : null;
    },
    sign: () => el('div', { className: 'sign' }, el('div', {}, el('span', { textContent: `${contact.find((x) => contactKind(x) === 'city') || ''}${contact.some((x) => contactKind(x) === 'city') ? ', ' : ''}${new Date().toLocaleDateString(L.locale || 'pl-PL')}` }), el('small', { textContent: M.placeDate })),
      el('div', {}, el('span', { className: 'line' }), el('small', { textContent: M.sign }))),
    kicker: () => el('div', { className: 'kick', textContent: M.cvTitle }),
    // Europass: dane kontaktowe z etykietami, wpisy z datą nad stanowiskiem, tabela języków z poziomem.
    persLine: () => el('ul', { className: 'pl' }, ...contact.map((x) => el('li', {}, el('small', { textContent: M[contactKind(x)] + ': ' }), x))),
    eRows: (items, titleOf, orgOf) => items.map((e) => el('div', { className: 'ent' }, e.period ? el('div', { className: 'dt', textContent: e.period }) : null,
      el('div', { className: 'ttl', textContent: titleOf(e) || '' }), orgOf(e) ? el('div', { className: 'co', textContent: orgOf(e) }) : null,
      e.bullets?.length ? el('ul', {}, ...e.bullets.map((b) => el('li', {}, hl(b, kw)))) : null)),
    eExp: function () { return c.experience?.length ? sec(L.exp, ...this.eRows(c.experience, (e) => e.title, (e) => e.company)) : null; },
    eEdu: function () { return c.education?.length ? sec(L.edu, ...this.eRows(c.education, (e) => e.degree || e.school, (e) => (e.degree ? e.school : ''))) : null; },
    eLangs: () => (c.languages?.length ? sec(L.langs, el('table', { className: 'lt' }, el('tr', {}, el('th', { textContent: L.langs }), el('th', { textContent: M.level + ' (CEFR)' })),
      ...c.languages.map((t) => { const [n, lv] = langLevel(t, M); return el('tr', {}, el('td', { textContent: n }), el('td', { textContent: lv || '—' })); }))) : null),
  };
}
const CV_LAYOUT = {
  nowoczesny: (k) => [el('div', { className: 'side' }, k.mono(), k.contactSec(), k.skills(), k.langs(), k.certs(), k.intr()),
    el('div', { className: 'mainc' }, el('header', { className: 'top' }, k.name(), k.head()), k.summary(), k.exp(), k.edu(), k.clause())],
  os: (k) => [el('header', { className: 'top' }, k.pic(), el('div', { className: 'who' }, k.name(), k.head()), k.clist()), k.summary(), k.exp(), k.edu(),
    el('div', { className: 'grid3' }, k.skills(), k.langs(), k.certs()), k.intr(), k.clause()],
  szwajcarski: (k) => [el('header', { className: 'top' }, el('div', { className: 'sq' }), el('div', { className: 'split' }, el('div', { className: 'who' }, k.name(), k.head()), k.clist(), k.pic())),
    k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  geometria: (k) => [el('header', { className: 'band' }, el('div', {}, k.name(), k.head()), k.mono()),
    el('div', { className: 'body' }, el('div', { className: 'mainc' }, k.summary(), k.exp(), k.edu(), k.clause()),
      el('div', { className: 'panel' }, k.contactSec(), k.skills(), k.langs(), k.certs(), k.intr()))],
  elegancki: (k) => [el('header', { className: 'top' }, k.mono(), k.name(), k.head(), k.ct(), k.rule()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  klasyczny: (k) => [el('header', { className: 'top' }, el('div', { className: 'who' }, k.name(), k.head(), k.ct()), k.pic()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  monogram: (k) => [el('header', { className: 'top' }, k.mono(), k.name(), k.head(), k.ct()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  kreatywny: (k) => [el('header', { className: 'band' }, el('div', { className: 'who' }, k.name(), k.head(), k.ct()), k.pic()),
    el('div', { className: 'body' }, el('div', { className: 'mainc' }, k.summary(), k.exp(), k.edu(), k.clause()), el('div', { className: 'panel' }, k.skills(), k.langs(), k.certs(), k.intr()))],
  kompetencje: (k) => [el('div', { className: 'mainc' }, el('header', { className: 'top' }, k.name(), k.head()), k.summary(), k.exp(), k.edu(), k.clause()),
    el('div', { className: 'side' }, k.pic(), k.contactSec(), k.skills(), k.langsLv(), k.certs(), k.intr())],
  wstega: (k) => [el('div', { className: 'band' }, k.mono()), el('header', { className: 'top' }, k.name(), k.head(), k.ct()), k.summary(), k.exp(), k.edu(), k.skills(), k.langs(), k.certs(), k.intr(), k.clause()],
  lebenslauf: (k) => [el('header', { className: 'top' }, el('div', { className: 'who' }, k.kicker(), k.name(), k.head()), k.pic()), k.persData(), k.summary(), k.tExp(), k.tEdu(), k.tMore(), k.clause(), k.sign()],
  europass: (k) => [el('header', { className: 'top' }, k.pic(), el('div', { className: 'who' }, k.name(), k.head(), k.persLine())), k.summary(), k.eExp(), k.eEdu(), k.eLangs(), k.skills(), k.certs(), k.intr(), k.clause()],
};
const LETTER_HEAD = {
  geometria: (k) => el('header', { className: 'band' }, el('div', {}, k.name(), k.ct()), k.mono()),
  elegancki: (k) => el('header', { className: 'top lhead' }, k.mono(), k.name(), k.ct(), k.rule()),
  szwajcarski: (k) => el('header', { className: 'top lhead' }, el('div', { className: 'sq' }), k.name(), k.ct(), k.rule()),
  os: (k) => el('header', { className: 'top lhead' }, el('div', { className: 'split' }, k.name(), k.clist()), k.rule()),
  monogram: (k) => el('header', { className: 'top lhead' }, k.mono(), k.name(), k.ct(), k.rule()),
  kreatywny: (k) => el('header', { className: 'band' }, el('div', {}, k.name(), k.ct())),
  wstega: (k) => el('header', { className: 'band' }, el('div', {}, k.name(), k.ct())),
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
let step = ORDER[0], orderId = null;

// Zwraca fragment, w którym wskazane słowa są owinięte w <mark> (bez innerHTML).
function hl(text, kws) {
  const words = (kws || []).filter(Boolean).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const frag = document.createDocumentFragment();
  if (!words.length) { frag.append(text); return frag; }
  String(text).split(new RegExp('(' + words.join('|') + ')', 'gi')).forEach((part, i) => frag.append(i % 2 ? el('mark', { textContent: part }) : part));
  return frag;
}

fetch('/api/config').then((r) => r.json()).then((c) => {
  cfg = c; if (c.chromeExt) { $('#chromeExt').href = c.chromeExt; $('#chromeExtBox').hidden = false; } window.CONSENT?.init(c.ads); track('pv'); trackLater.splice(0).forEach(([e, x]) => track(e, x)); drawLists(); if (c.prices) PRICE = { ...PRICE, ...c.prices }; refresh(); $$('.linkbox').forEach((l) => { if (c.fakeFetch && !$('.hint', l)) l.append(el('p', { className: 'hint', textContent: 'Podgląd: link nie jest naprawdę pobierany, wstawiamy przykładowe ogłoszenie.' })); }); $('#demoBar').hidden = !c.demo; drawPromo(c.promo); if (c.salesClosed) $('#demoBar').textContent = 'Strona w przygotowaniu – zamówienia ruszą za kilka dni.'; $('#soonNote').hidden = !c.salesClosed; $('#fill').hidden = !c.demo; $('#printNote').hidden = !c.noPrint; $('#simNote').hidden = !c.demo;
}).catch(() => drawLists().catch(() => {})); // bez internetu (aplikacja na telefonie): treści z pamięci

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
// Przykład (Anna Nowak) w języku strony: na wersji EN, UA i DE szablony, podgląd i sekcja „Przykład” pokazują dokumenty po angielsku / ukraińsku.
const EX_LOC = {
  en: {
    base: {
      contact: ['+48 600 100 200', 'anna.nowak@example.com', 'Kraków', 'linkedin.com/in/anna-nowak'],
      jobs: [{ title: 'Customer Service Specialist', company: 'Nova Serwis Sp. z o.o.', period: '03.2022 – present' }, { title: 'Sales Assistant / Cashier', company: 'Market Dom', period: '06.2019 – 02.2022' }],
      edu: [{ school: 'Cracow University of Economics', degree: 'Management, BA', period: '2016 – 2019' }],
      skills: 'customer service, cash register handling, communication skills, shift work, CRM, complaint handling, ticket handling, Excel, stocktaking',
      langs: ['English B2', 'German A2'], certs: ['B2B Customer Service Course'],
      facts: ['Handling 40–50 customer tickets a day in a CRM system', 'Resolving customer complaints', 'Contact with international clients in English', 'Operating the cash register and end-of-shift cash-up', 'Customer service and complaints at the checkout', 'Stocktaking', 'Shift work in a team of 8'],
      clause: 'I hereby consent to the processing of my personal data for the purposes of the recruitment process in accordance with Art. 6(1)(a) of Regulation (EU) 2016/679 (GDPR).',
    },
    ex: [
      { tab: 'Cashier / Sales Assistant', title: 'Cashier / Sales Assistant', company: 'Zielony Rynek Supermarket',
        ad: 'We are looking for a person to provide customer service and operate the cash register in our supermarket. We require good communication skills, honesty and readiness for shift work. We offer an employment contract and a benefits package.',
        kws: ['customer service', 'cash register', 'communication skills', 'shift work'],
        sum: 'Applying for the position of Cashier / Sales Assistant. For almost three years I operated the cash register and served customers at Market Dom, working shifts in a team of 8. I have good communication skills and experience in stocktaking.',
        skills: ['customer service', 'cash register handling', 'communication skills', 'shift work', 'stocktaking', 'CRM', 'Excel'],
        changes: ['Headline changed to “Cashier / Sales Assistant”.', 'Skills from the ad come first: cash register handling and shift work.', 'In the Market Dom job, the cash register comes first, because that is what the offer is about.', 'The point about contact in English was left out, as the offer does not require it.'],
        letter: `Dear Hiring Manager,

I am writing to apply for the position of Cashier / Sales Assistant at Zielony Rynek Supermarket. I started working in retail in 2019 at Market Dom, where for almost three years I operated the cash register, cashed up at the end of each shift and talked to customers every day.

You are looking for someone with good communication skills who is ready to work shifts. I worked shifts in a team of eight and also handled complaints at the checkout and stocktaking.

I currently work in customer service at Nova Serwis, where I resolve complaints and handle tickets in a CRM system.

I would be glad to tell you more about my experience at an interview. Thank you for considering my application.

Yours faithfully,
Anna Nowak` },
      { tab: 'Customer Service Specialist', title: 'Customer Service Specialist', company: 'Telko Group',
        ad: 'We are looking for a specialist to join our customer service office. Responsibilities: ticket handling, resolving complaints, working in a CRM system. We require at least 2 years of experience and knowledge of English. We offer an employment contract and flexible hours.',
        kws: ['ticket handling', 'tickets', 'complaints', 'CRM', 'English', 'customer service'],
        sum: 'Applying for the position of Customer Service Specialist. Since 2022 I have been handling customer tickets and complaints in a CRM system, and I speak English with international clients.',
        skills: ['CRM', 'complaint handling', 'ticket handling', 'customer service', 'English B2', 'Excel'],
        changes: ['Headline changed to “Customer Service Specialist”.', 'CRM, complaints and tickets at the top of the skills list, just like in the offer.', 'English highlighted in the profile and in the current job.', 'From the shop job, only the points about customers and shifts remain.'],
        letter: `Dear Hiring Manager,

I am writing to apply for the position of Customer Service Specialist at Telko Group. Since March 2022 I have been working as a Customer Service Specialist at Nova Serwis, where every day I handle 40–50 tickets in a CRM system and resolve customer complaints. This is exactly the scope of duties described in your advertisement.

You require knowledge of English. In my current job I communicate in English with international clients at B2 level. Before that, at Market Dom, I worked directly with customers for almost three years and handled complaints.

I would be glad to present my experience at an interview and learn more about the team. Thank you for considering my application.

Yours faithfully,
Anna Nowak` },
      { tab: 'Warehouse Operative', title: 'Warehouse Operative', company: 'Sigma Wholesale',
        ad: 'We are looking for a warehouse operative to work in our wholesale warehouse. Responsibilities: receiving and dispatching goods, stocktaking, working with warehouse documentation. We require reliability and readiness for shift work. A forklift licence is an advantage.',
        kws: ['stocktaking', 'shift work'],
        sum: 'Applying for the position of Warehouse Operative. I have hands-on experience in stocktaking and shift work in a team of 8. I know Excel and CRM systems.',
        skills: ['stocktaking', 'shift work', 'Excel', 'CRM', 'customer service'],
        changes: ['Headline changed to “Warehouse Operative”.', 'Stocktaking and shift work at the top, because that is what the offer is looking for.', 'Only one point remains from the current job; the rest is about customer service.'],
        notAdded: 'a forklift licence, because it was not provided. If you have one, add it in the order form and it will appear in your CV.',
        letter: `Dear Hiring Manager,

I am writing to apply for the position of Warehouse Operative at Sigma Wholesale. You require reliability and readiness for shift work. At Market Dom, between 2019 and 2022, I worked shifts in a team of eight and was responsible for stocktaking, which is directly related to part of the duties described in your advertisement.

You also mention working with warehouse documentation. I work with documents and data every day: I cashed up at the checkout, and I now handle tickets in a CRM system and use Excel.

I would be glad to tell you more about my experience at an interview. Thank you for considering my application.

Yours faithfully,
Anna Nowak` },
    ],
  },
  uk: {
    base: {
      contact: ['+48 600 100 200', 'anna.nowak@example.com', 'Краків', 'linkedin.com/in/anna-nowak'],
      jobs: [{ title: 'Спеціалістка з обслуговування клієнтів', company: 'Nova Serwis Sp. z o.o.', period: '03.2022 – дотепер' }, { title: 'Продавчиня-касирка', company: 'Market Dom', period: '06.2019 – 02.2022' }],
      edu: [{ school: 'Краківський економічний університет', degree: 'Менеджмент, бакалавр', period: '2016 – 2019' }],
      skills: 'обслуговування клієнтів, робота з касовим апаратом, комунікабельність, змінна робота, CRM, розгляд скарг, обробка звернень, Excel, інвентаризація',
      langs: ['англійська B2', 'німецька A2'], certs: ['Курс обслуговування клієнтів B2B'],
      facts: ['Обробка 40–50 звернень щодня в системі CRM', 'Розгляд скарг клієнтів', 'Спілкування з іноземними клієнтами англійською', 'Робота з касовим апаратом і закриття зміни', 'Обслуговування клієнтів і скарги на касі', 'Інвентаризація товару', 'Змінна робота в команді з 8 осіб'],
      clause: 'Я даю згоду на обробку моїх персональних даних для цілей процесу рекрутингу відповідно до ст. 6 ч. 1 п. a Регламенту (ЄС) 2016/679 (GDPR).',
    },
    ex: [
      { tab: 'Касир / Продавець', title: 'Касир / Продавець', company: 'Супермаркет Zielony Rynek',
        ad: 'Шукаємо людину для обслуговування клієнтів і роботи з касовим апаратом у супермаркеті. Вимагаємо комунікабельності, чесності та готовності до змінної роботи. Пропонуємо трудовий договір і пакет бенефітів.',
        kws: ['обслуговування клієнтів', 'касовим апаратом', 'комунікабельності', 'комунікабельність', 'змінної роботи', 'змінна робота'],
        sum: 'Претендую на посаду: Касир / Продавець. Майже три роки працювала з касовим апаратом і обслуговувала клієнтів у Market Dom, працюючи позмінно в команді з 8 осіб. Я комунікабельна і маю досвід інвентаризації товару.',
        skills: ['обслуговування клієнтів', 'робота з касовим апаратом', 'комунікабельність', 'змінна робота', 'інвентаризація', 'CRM', 'Excel'],
        changes: ['Заголовок змінено на «Касир / Продавець».', 'На початку навички з оголошення: робота з касовим апаратом і змінна робота.', 'У роботі в Market Dom на першому місці каса, бо саме про неї йдеться в оголошенні.', 'Пропущено пункт про спілкування англійською, бо оголошення цього не вимагає.'],
        letter: `Шановні пані та панове,

з цікавістю відповідаю на оголошення на посаду касира / продавця в супермаркеті Zielony Rynek. Я почала працювати в торгівлі у 2019 році в Market Dom, де майже три роки працювала з касовим апаратом, закривала зміни та щодня спілкувалася з клієнтами.

Ви шукаєте комунікабельну людину, готову до змінної роботи. Я працювала позмінно в команді з восьми осіб, а також займалася скаргами на касі та інвентаризацією товару.

Зараз я працюю в обслуговуванні клієнтів у компанії Nova Serwis, де розглядаю скарги та веду звернення в системі CRM.

Із задоволенням розповім про свій досвід на співбесіді. Дякую за розгляд моєї кандидатури.

З повагою,
Anna Nowak` },
      { tab: 'Спеціаліст з обслуговування клієнтів', title: 'Спеціаліст з обслуговування клієнтів', company: 'Telko Group',
        ad: 'Шукаємо спеціаліста до відділу обслуговування клієнтів. Обов’язки: обробка звернень, розгляд скарг, робота в системі CRM. Вимагаємо щонайменше 2 роки досвіду та знання англійської мови. Пропонуємо трудовий договір і гнучкий графік.',
        kws: ['обробка звернень', 'звернень', 'скарг', 'CRM', 'англійської', 'англійською', 'англійська', 'обслуговування клієнтів'],
        sum: 'Претендую на посаду: Спеціаліст з обслуговування клієнтів. З 2022 року обробляю звернення та скарги в системі CRM, а з іноземними клієнтами спілкуюся англійською.',
        skills: ['CRM', 'розгляд скарг', 'обробка звернень', 'обслуговування клієнтів', 'англійська B2', 'Excel'],
        changes: ['Заголовок змінено на «Спеціаліст з обслуговування клієнтів».', 'CRM, скарги та звернення на початку навичок, як в оголошенні.', 'Англійську виділено в профілі та в поточній роботі.', 'З роботи в магазині залишилися лише пункти про клієнтів і зміни.'],
        letter: `Шановні пані та панове,

відповідаю на оголошення на посаду спеціаліста з обслуговування клієнтів у Telko Group. З березня 2022 року я працюю спеціалісткою з обслуговування клієнтів у Nova Serwis, де щодня обробляю 40–50 звернень у системі CRM і розглядаю скарги клієнтів. Це саме той обсяг обов’язків, який описано у вашому оголошенні.

Ви вимагаєте знання англійської мови. На поточній роботі я спілкуюся англійською з іноземними клієнтами на рівні B2. Раніше, у Market Dom, я майже три роки працювала безпосередньо з клієнтами та займалася скаргами.

Із задоволенням представлю свій досвід на співбесіді та дізнаюся більше про команду. Дякую за розгляд моєї кандидатури.

З повагою,
Anna Nowak` },
      { tab: 'Комірник', title: 'Комірник', company: 'Оптовий склад Sigma',
        ad: 'Шукаємо комірника для роботи на оптовому складі. Обов’язки: приймання та видача товару, інвентаризація, робота зі складською документацією. Вимагаємо сумлінності та готовності до змінної роботи. Посвідчення водія навантажувача буде перевагою.',
        kws: ['інвентаризація', 'інвентаризації', 'змінної роботи', 'змінна робота'],
        sum: 'Претендую на посаду: Комірник. Маю практичний досвід інвентаризації товару та змінної роботи в команді з 8 осіб. Знаю Excel і систему CRM.',
        skills: ['інвентаризація', 'змінна робота', 'Excel', 'CRM', 'обслуговування клієнтів'],
        changes: ['Заголовок змінено на «Комірник».', 'На початку інвентаризація та змінна робота, бо саме це шукає роботодавець.', 'З поточної роботи залишився один пункт, решта стосується обслуговування клієнтів.'],
        notAdded: 'посвідчення водія навантажувача, бо його не вказано. Якщо воно у вас є, додайте його у формі замовлення, і воно з’явиться в резюме.',
        letter: `Шановні пані та панове,

з цікавістю відповідаю на оголошення на посаду комірника на оптовому складі Sigma. Ви вимагаєте сумлінності та готовності до змінної роботи. У Market Dom у 2019–2022 роках я працювала позмінно в команді з восьми осіб і займалася інвентаризацією товару, що безпосередньо пов’язано з частиною обов’язків, описаних в оголошенні.

Ви також згадуєте роботу зі складською документацією. Я щодня працюю з документами та даними: закривала зміни на касі, а зараз веду звернення в системі CRM і користуюся Excel.

Із задоволенням розповім про свій досвід на співбесіді. Дякую за розгляд моєї кандидатури.

З повагою,
Anna Nowak` },
    ],
  },
  de: {
    base: {
      contact: ['+48 600 100 200', 'anna.nowak@example.com', 'Krakau', 'linkedin.com/in/anna-nowak'],
      jobs: [{ title: 'Kundenservice-Spezialistin', company: 'Nova Serwis Sp. z o.o.', period: '03.2022 – heute' }, { title: 'Verkäuferin / Kassiererin', company: 'Market Dom', period: '06.2019 – 02.2022' }],
      edu: [{ school: 'Wirtschaftsuniversität Krakau', degree: 'Management, Bachelor', period: '2016 – 2019' }],
      skills: 'Kundenservice, Kassenbedienung, Kommunikationsstärke, Schichtarbeit, CRM, Reklamationsbearbeitung, Ticketbearbeitung, Excel, Inventur',
      langs: ['Englisch B2', 'Deutsch A2'], certs: ['Kurs Kundenservice B2B'],
      facts: ['Bearbeitung von 40–50 Tickets pro Tag im CRM-System', 'Bearbeitung von Reklamationen der Kunden', 'Kontakt mit internationalen Kunden auf Englisch', 'Kassenbedienung und Kassenabrechnung zum Schichtende', 'Kundenservice und Reklamationen an der Kasse', 'Inventur', 'Schichtarbeit in einem Team von 8 Personen'],
      clause: 'Ich willige in die Verarbeitung meiner personenbezogenen Daten für die Zwecke des Bewerbungsverfahrens gemäß Art. 6 Abs. 1 lit. a der Verordnung (EU) 2016/679 (DSGVO) ein.',
    },
    ex: [
      { tab: 'Kassierer/in / Verkäufer/in', title: 'Kassierer/in / Verkäufer/in', company: 'Supermarkt Zielony Rynek',
        ad: 'Wir suchen eine Person für den Kundenservice und die Kassenbedienung in unserem Supermarkt. Wir erwarten Kommunikationsstärke, Ehrlichkeit und Bereitschaft zur Schichtarbeit. Wir bieten einen Arbeitsvertrag und ein Benefit-Paket.',
        kws: ['Kundenservice', 'Kassenbedienung', 'Kommunikationsstärke', 'Schichtarbeit'],
        sum: 'Bewerbung als Kassierer/in / Verkäufer/in. Fast drei Jahre lang habe ich bei Market Dom die Kasse bedient und Kunden betreut, im Schichtbetrieb in einem Team von 8 Personen. Ich bringe Kommunikationsstärke und Erfahrung mit Inventuren mit.',
        skills: ['Kundenservice', 'Kassenbedienung', 'Kommunikationsstärke', 'Schichtarbeit', 'Inventur', 'CRM', 'Excel'],
        changes: ['Überschrift geändert in „Kassierer/in / Verkäufer/in“.', 'Fähigkeiten aus der Anzeige stehen vorne: Kassenbedienung und Schichtarbeit.', 'Bei Market Dom steht die Kasse an erster Stelle, weil es in der Anzeige darum geht.', 'Der Punkt zum Kontakt auf Englisch wurde weggelassen, weil die Anzeige ihn nicht verlangt.'],
        letter: `Sehr geehrte Damen und Herren,

mit Interesse bewerbe ich mich auf Ihre Anzeige als Kassiererin / Verkäuferin im Supermarkt Zielony Rynek. Im Handel habe ich 2019 bei Market Dom angefangen, wo ich fast drei Jahre lang die Kasse bedient, Schichten abgerechnet und täglich mit Kunden gesprochen habe.

Sie suchen eine kommunikationsstarke Person, die zur Schichtarbeit bereit ist. Ich habe im Schichtbetrieb in einem Team von acht Personen gearbeitet und mich außerdem um Reklamationen an der Kasse und um Inventuren gekümmert.

Derzeit arbeite ich im Kundenservice bei Nova Serwis, wo ich Reklamationen bearbeite und Tickets im CRM-System betreue.

Gerne erzähle ich Ihnen in einem persönlichen Gespräch mehr über meine Erfahrung. Vielen Dank für die Berücksichtigung meiner Bewerbung.

Mit freundlichen Grüßen
Anna Nowak` },
      { tab: 'Kundenservice-Spezialist/in', title: 'Kundenservice-Spezialist/in', company: 'Telko Group',
        ad: 'Für unser Kundenservice-Büro suchen wir eine/n Spezialist/in. Aufgaben: Ticketbearbeitung, Bearbeitung von Reklamationen, Arbeit im CRM-System. Wir erwarten mindestens 2 Jahre Erfahrung und Englischkenntnisse. Wir bieten einen Arbeitsvertrag und flexible Arbeitszeiten.',
        kws: ['Ticketbearbeitung', 'Tickets', 'Reklamationen', 'CRM', 'Englisch', 'Kundenservice'],
        sum: 'Bewerbung als Kundenservice-Spezialist/in. Seit 2022 bearbeite ich Tickets und Reklamationen von Kunden im CRM-System und spreche mit internationalen Kunden Englisch.',
        skills: ['CRM', 'Reklamationsbearbeitung', 'Ticketbearbeitung', 'Kundenservice', 'Englisch B2', 'Excel'],
        changes: ['Überschrift geändert in „Kundenservice-Spezialist/in“.', 'CRM, Reklamationen und Tickets stehen oben in den Fähigkeiten, wie in der Anzeige.', 'Englisch im Profil und in der aktuellen Stelle hervorgehoben.', 'Aus dem Job im Geschäft sind nur die Punkte zu Kunden und Schichten geblieben.'],
        letter: `Sehr geehrte Damen und Herren,

hiermit bewerbe ich mich als Kundenservice-Spezialistin bei Telko Group. Seit März 2022 arbeite ich als Kundenservice-Spezialistin bei Nova Serwis, wo ich täglich 40–50 Tickets im CRM-System bearbeite und Kundenreklamationen löse. Das entspricht genau den Aufgaben aus Ihrer Anzeige.

Sie erwarten Englischkenntnisse. In meiner aktuellen Stelle kommuniziere ich auf Englisch mit internationalen Kunden, auf Niveau B2. Zuvor habe ich bei Market Dom fast drei Jahre direkt mit Kunden gearbeitet und Reklamationen bearbeitet.

Gerne stelle ich Ihnen meine Erfahrung in einem Gespräch vor und erfahre mehr über das Team. Vielen Dank für die Berücksichtigung meiner Bewerbung.

Mit freundlichen Grüßen
Anna Nowak` },
      { tab: 'Lagermitarbeiter/in', title: 'Lagermitarbeiter/in', company: 'Großhandel Sigma',
        ad: 'Wir suchen eine/n Lagermitarbeiter/in für unseren Großhandel. Aufgaben: Warenannahme und -ausgabe, Inventur, Arbeit mit Lagerdokumenten. Wir erwarten Zuverlässigkeit und Bereitschaft zur Schichtarbeit. Ein Staplerschein ist von Vorteil.',
        kws: ['Inventur', 'Schichtarbeit'],
        sum: 'Bewerbung als Lagermitarbeiter/in. Ich habe praktische Erfahrung mit Inventuren und Schichtarbeit in einem Team von 8 Personen. Ich kenne Excel und CRM-Systeme.',
        skills: ['Inventur', 'Schichtarbeit', 'Excel', 'CRM', 'Kundenservice'],
        changes: ['Überschrift geändert in „Lagermitarbeiter/in“.', 'Inventur und Schichtarbeit stehen oben, weil die Anzeige danach sucht.', 'Aus der aktuellen Stelle ist ein Punkt geblieben, der Rest betrifft den Kundenservice.'],
        notAdded: 'einen Staplerschein, weil er nicht angegeben wurde. Wenn Sie einen haben, tragen Sie ihn im Bestellformular ein, dann erscheint er im Lebenslauf.',
        letter: `Sehr geehrte Damen und Herren,

mit Interesse bewerbe ich mich auf Ihre Anzeige als Lagermitarbeiterin im Großhandel Sigma. Sie erwarten Zuverlässigkeit und Bereitschaft zur Schichtarbeit. Bei Market Dom habe ich von 2019 bis 2022 im Schichtbetrieb in einem Team von acht Personen gearbeitet und war für Inventuren zuständig, was direkt zu einem Teil der beschriebenen Aufgaben passt.

Sie erwähnen auch die Arbeit mit Lagerdokumenten. Ich arbeite täglich mit Dokumenten und Daten: An der Kasse habe ich Schichten abgerechnet, heute betreue ich Tickets im CRM-System und arbeite mit Excel.

Gerne erzähle ich Ihnen in einem persönlichen Gespräch mehr über meine Erfahrung. Vielen Dank für die Berücksichtigung meiner Bewerbung.

Mit freundlichen Grüßen
Anna Nowak` },
    ],
  },
};
const EX_UI = { pl: ['Ogłoszenie', 'Słowa kluczowe, których szuka rekruter'], en: ['Job ad', 'Keywords the recruiter is looking for'], uk: ['Оголошення', 'Ключові слова, які шукає рекрутер'], de: ['Stellenanzeige', 'Schlüsselwörter, nach denen der Recruiter sucht'] };
const EX_LANG = EX_LOC[window.I18N?.lang] ? window.I18N.lang : 'pl';
if (EX_LANG !== 'pl') { Object.assign(BASE, EX_LOC[EX_LANG].base); EX_LOC[EX_LANG].ex.forEach((x, i) => Object.assign(EX[i], x)); }
const exResult = (i) => {
  const e = EX[i];
  return { position: e.title, lang: EX_LANG, keywords: e.kws, letter: e.letter, cv: {
    name: BASE.name, headline: e.title, contact: BASE.contact, summary: e.sum,
    experience: BASE.jobs.map((j, k) => ({ ...j, bullets: e.bullets[k].map((n) => BASE.facts[n]) })),
    education: BASE.edu, skills: e.skills, languages: BASE.langs, certificates: BASE.certs, interests: '',
    clause: BASE.clause || 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.' } };
};
const changesList = (e) => [el('h3', { textContent: 'Co zmieniliśmy w tym CV' }), el('ul', {}, ...e.changes.map((c) => el('li', { textContent: c }))), e.notAdded && el('p', { className: 'notadded' }, el('b', { textContent: 'Czego nie dopisaliśmy: ' }), e.notAdded)].filter(Boolean);
function drawEx(i) {
  const e = EX[i], r = exResult(i), job = r.cv.experience[1];
  const isKw = (x) => e.kws.some((k) => x.toLowerCase().includes(k.toLowerCase()));
  $$('#exTabs button').forEach((b, j) => b.setAttribute('aria-selected', j === i));
  $('#exAd').replaceChildren(
    el('div', { className: 'ad-top' }, el('span', { className: 'ad-logo', textContent: e.company.split(/\s+/).map((w) => w[0]).join('').slice(0, 2) }), el('div', {}, el('small', { textContent: EX_UI[EX_LANG][0] }), el('b', { textContent: e.company }))),
    el('h4', { textContent: e.title, ariaLevel: '3' }), el('p', { className: 'ad-txt' }, hl(e.ad, e.kws)),
    el('div', { className: 'ad-kws' }, el('small', { textContent: EX_UI[EX_LANG][1] }), el('div', {}, ...[...new Map(e.kws.map((k) => [k.toLowerCase().split(/\s+/).map((w) => w.slice(0, Math.max(3, Math.min(5, w.length - 1)))).join(' '), k])).values()].map((k) => el('span', { textContent: k })))));
  $('#exCv').replaceChildren(
    el('div', { className: 'mcv-head' }, el('span', { className: 'mcv-ini', textContent: 'AN' }), el('div', {}, el('b', { textContent: 'Anna Nowak' }), el('span', { textContent: e.title }))),
    el('div', { className: 'mcv-sec' }, el('h5', { textContent: LBL[EX_LANG].summary }), el('p', {}, hl(e.sum, e.kws))),
    el('div', { className: 'mcv-sec' }, el('h5', { textContent: LBL[EX_LANG].skills }), el('div', { className: 'mcv-chips' }, ...e.skills.map((x) => el('span', { className: isKw(x) ? 'kw' : '', textContent: x })))),
    el('div', { className: 'mcv-sec' }, el('h5', { textContent: LBL[EX_LANG].exp }), el('div', { className: 'mcv-job' }, el('b', { textContent: job.title }), el('span', { textContent: `${job.company} · ${job.period}` })),
      el('ul', {}, ...job.bullets.map((b) => el('li', {}, hl(b, e.kws))))));
  $('#exChg').replaceChildren(...changesList(e));
}
// Sekcje niżej na stronie rysujemy dopiero, gdy użytkownik się do nich zbliża (szybsze pierwsze wyświetlenie na telefonie).
function whenNear(sel, fn) {
  const e = $(sel); if (!e || !('IntersectionObserver' in window)) return fn();
  const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '800px 0px' });
  io.observe(e);
}
EX.forEach((e, i) => $('#exTabs').append(el('button', { type: 'button', role: 'tab', textContent: e.tab, onclick: () => drawEx(i) })));
whenNear('#przyklad', () => drawEx(0));

/* galeria szablonów i hero */
const gal = { tpl: 'nowoczesny', color: 'niebieski', all: false };
// Na stronie głównej pokazujemy 3 najbardziej różne szablony; pozostałe po kliknięciu „Zobacz wszystkie”.
const GAL_FEATURED = ['nowoczesny', 'szwajcarski', 'klasyczny'];
// Przykładowe CV w PDF ze znakiem wodnym (fikcyjna osoba) w danym szablonie i kolorze.
const sampleLink = (d, text, cls = 'btn ghost sm') => el('a', { className: cls, href: `/api/sample.pdf?tpl=${d.tpl}&color=${d.color}&lang=${window.I18N?.lang || 'pl'}`, download: '', textContent: text,
  onclick: (e) => { if (cfg.preview) { e.preventDefault(); flash('W podglądzie pobieranie PDF jest wyłączone. Na działającej stronie pobierzesz przykładowe CV ze znakiem wodnym „PRZYKŁAD”.'); } else track('sample', { tpl: d.tpl }); } });
// Formularz „Dla firm i instytucji”.
$('#b2bForm')?.addEventListener('submit', async (e) => {
  e.preventDefault(); const out = $('#bMsgOut'), btn = $('#b2bForm button[type=submit]');
  out.className = 'fstatus'; btn.disabled = true;
  try {
    const r = await fetch('/api/b2b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ org: $('#bOrg').value, name: $('#bName').value, email: $('#bEmail').value, phone: $('#bPhone').value, count: $('#bCount').value, msg: $('#bMsg').value, consent: $('#bConsent').checked, uiLang: window.I18N?.lang || 'pl' }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    e.target.reset(); out.classList.add('good'); out.textContent = 'Dziękujemy! Odpowiemy e-mailem, zwykle w ciągu 1–2 dni roboczych.'; track('b2b');
  } catch (x) { out.classList.add('bad'); out.textContent = x.message; }
  btn.disabled = false;
});
function drawGallery() {
  const sample = exResult(1);
  $('#galColors').replaceChildren(el('span', { className: 'dp-lbl', textContent: 'Kolor:' }), ...Object.entries(COLORS).map(([id, hex]) => el('button', { type: 'button', className: 'sw', title: COLOR_NAMES[id], ariaLabel: `Kolor ${COLOR_NAMES[id]}`, ariaPressed: String(gal.color === id), style: `--c:${hex}`, onclick: () => { gal.color = id; drawGallery(); } })));
  const list = gal.all ? [...GAL_FEATURED.map((f) => TPLS.find((t) => t[0] === f)), ...TPLS.filter((t) => !GAL_FEATURED.includes(t[0]))] : GAL_FEATURED.map((f) => TPLS.find((t) => t[0] === f));
  $('#galGrid').replaceChildren(...list.map(([id, name, desc]) => el('div', { className: 'gal-card' },
    el('button', { type: 'button', className: 'gal-thumb', ariaLabel: `Podgląd szablonu ${name}`, onclick: () => openEx(1, { tpl: id, color: gal.color }) }, thumb(sample, { tpl: id, color: gal.color })),
    el('div', { className: 'gal-meta' }, el('b', { textContent: name }), el('span', { textContent: desc })),
    el('button', { type: 'button', className: 'btn ghost sm', textContent: 'Wybierz ten szablon', onclick: () => { design = { tpl: id, color: gal.color }; drawWizDesign(); saveDraft(); openWiz(); } }))));
  const more = $('#galMore');
  more.textContent = gal.all ? 'Pokaż mniej szablonów' : `Zobacz wszystkie ${TPLS.length} szablonów`;
  more.className = gal.all ? 'btn ghost lg' : 'btn lg';
  more.setAttribute('aria-expanded', String(gal.all));
  $('#galSample').replaceChildren(sampleLink(gal, 'Pobierz przykładowe CV w PDF'), el('span', { className: 'hint', textContent: ' Fikcyjna osoba, ze znakiem wodnym. Twoje CV będzie z Twoimi danymi i pod Twoje ogłoszenie.' }));
}
$('#galMore').addEventListener('click', () => {
  gal.all = !gal.all; drawGallery();
  // Po rozwinięciu fokus na pierwszym nowym szablonie; po zwinięciu wracamy do nagłówka sekcji, żeby strona nie „uciekła”.
  if (gal.all) $$('#galGrid .gal-thumb')[GAL_FEATURED.length]?.focus({ preventScroll: true });
  else $('#szablony h2').scrollIntoView({ block: 'start' });
});
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
    el('div', { className: 'doc ad' }, el('div', { className: 'tagline', textContent: window.I18N?.t('Treść ogłoszenia') || 'Treść ogłoszenia' }), el('p', {}, hl(e.ad, e.kws))));
  $('#exDocTabs').replaceChildren(...[['cv', 'CV'], ['letter', 'List motywacyjny']].map(([k, t]) => el('button', { type: 'button', role: 'tab', ariaSelected: String(k === exDoc), textContent: t, onclick: () => { exDoc = k; drawExView(); } })));
  $('#exPaper').replaceChildren(exDoc === 'cv' ? cvNode(r, true, exDesign) : letterNode(r, exDesign));
  $('#exChanges').replaceChildren(...changesList(e));
  $('#exSample').replaceChildren(sampleLink(exDesign, 'Pobierz przykładowe CV (PDF)'));
}
function openEx(i = 0, d) { exI = i; exDoc = 'cv'; if (d) Object.assign(exDesign, d); designPicker($('#exDesign'), exDesign, () => drawExView(), { thumbs: false }); drawExView(); modal(true); $('#exview').hidden = false; $('.exv-body').scrollTop = 0; setTimeout(() => $('#exClose').focus(), 0); }
const closeEx = () => { $('#exview').hidden = true; modal(false); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-example]'); if (b) openEx(+b.dataset.example || 0); });
$('#exClose').onclick = closeEx;
$('#exCta').onclick = () => { closeEx(); lastFocus = null; openWiz(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#exview').hidden) closeEx(); });
whenNear('#szablony', drawGallery);

/* ---------- Kreator ---------- */
const rowT = {
  exp: () => `<div class="grid4"><label class="f">Stanowisko<input type="text" data-k="title"></label><label class="f">Firma<input type="text" data-k="company"></label><label class="f">Od<input type="text" data-k="from" placeholder="03.2021"></label><label class="f">Do<input type="text" data-k="to" placeholder="obecnie"></label></div><label class="f">Obowiązki i osiągnięcia <span class="h">każdy punkt w nowej linii</span><textarea data-k="description"></textarea></label>`,
  edu: () => `<div class="grid4"><label class="f">Szkoła<input type="text" data-k="school"></label><label class="f">Kierunek / tytuł<input type="text" data-k="degree"></label><label class="f">Od<input type="text" data-k="from"></label><label class="f">Do<input type="text" data-k="to"></label></div>`,
  ads: () => `<div class="seg modes" role="tablist"><button type="button" role="tab" data-mode="link">Link do ogłoszenia</button><button type="button" role="tab" data-mode="photo">Zdjęcie ogłoszenia</button><button type="button" role="tab" data-mode="paste">Wklej treść</button></div>
<div class="photobox" hidden><b class="flabel">Zdjęcie lub zrzut ekranu ogłoszenia</b><label class="btn ghost filebtn"><span>Wybierz zdjęcie</span><input type="file" class="adphoto" accept="image/*"></label><p class="hint">Zrób zdjęcie ogłoszenia albo wgraj zrzut ekranu, np. z Facebooka, OLX lub grupy z ofertami. Odczytamy z niego treść.</p><div class="pstatus" role="status"></div></div>
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
  // Na telefonie domyślnie „Wklej treść” (kopiowanie z aplikacji z ogłoszeniami jest tam łatwiejsze niż link).
  if (box === 'ads' || box === 'fuAds') initAd(e, v.text || matchMedia('(max-width: 640px)').matches ? 'paste' : 'link');
  renum(box); refresh();
}
// Zmniejszenie zdjęcia przed wysłaniem (telefony robią zdjęcia po kilka MB).
function shrinkImage(f, max) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nie udało się otworzyć tego pliku jako zdjęcia.')); };
    img.src = url;
  });
}
function setMode(e, mode) {
  e.dataset.mode = mode;
  $$('.modes button', e).forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === mode));
  $('.linkbox', e).hidden = mode !== 'link';
  $('.photobox', e).hidden = mode !== 'photo';
  $('.adfields', e).hidden = (mode === 'link' || mode === 'photo') && !e.dataset.fetched;
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
  // Zdjęcie ogłoszenia: zmniejszamy w przeglądarce (max 1600 px, JPEG), serwer odczytuje treść.
  const ps = $('.pstatus', e), file = $('.adphoto', e);
  file.onchange = async () => {
    const f = file.files[0]; if (!f) return;
    ps.className = 'pstatus'; ps.textContent = 'Odczytuję ogłoszenie ze zdjęcia…';
    try {
      const image = await shrinkImage(f, 1600);
      const r = await fetch('/api/ad-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      $('[data-k=title]', e).value = j.title || ''; $('[data-k=text]', e).value = j.text;
      e.dataset.fetched = '1'; setMode(e, 'photo'); refresh();
      ps.replaceChildren(el('span', { textContent: 'Odczytano ogłoszenie ze zdjęcia.' }), ' ', el('span', { textContent: 'Sprawdź treść poniżej i popraw, jeśli coś się nie zgadza.' }), j.demo ? el('span', { textContent: ' Podgląd: wstawiamy przykładowe ogłoszenie.' }) : '');
      ps.classList.add('good');
    } catch (x) { ps.replaceChildren(el('span', { textContent: x.message || 'Nie udało się odczytać zdjęcia.' }), ' ', el('span', { textContent: 'Możesz też wkleić treść ogłoszenia.' })); ps.classList.add('bad'); }
    file.value = '';
  };
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
const addons = () => Object.fromEntries(Object.entries(ADDON_KEYS).map(([k, [sel]]) => [k, $(sel).checked]));
const extraLangs = () => $$('#langPick input:checked').map((i) => i.value);
// Pakiet „Pewna rozmowa”: list + przygotowanie do rozmowy + symulator razem taniej (tak samo liczy serwer, lib/pricing.js).
const bundleOn = () => pkg() !== 'cv' && addons().interview && addons().sim;
const addonsTotal = () => Object.entries(addons()).reduce((s, [k, on]) => s + (on ? PRICE[k] : 0), 0) + PRICE.extraLang * extraLangs().length - (bundleOn() ? PRICE.bundleOff : 0);
const discount = () => (promo?.voucher ? Math.min(PRICE[pkg()], PRICE[promo.voucher]) : promo ? Math.min(promo.percent ? Math.round((PRICE[pkg()] + addonsTotal()) * promo.percent) / 100 : promo.discount, PRICE[pkg()] - 2) : 0);
// Karnet (lib/passes.js): zalogowany klient z aktywnym karnetem płaci karnetem; kwotę do dopłaty liczy serwer (/api/passes/quote).
let myPass = null, passQuote = null, passQT;
const passOn = () => !!myPass && $('#usePass').checked;
const orderPkg = () => (passOn() ? (nAds() > 1 ? 'pack3' : 'cv_letter') : pkg());
const total = () => (passOn() ? (passQuote ? passQuote.total / 100 : 0) : PRICE[pkg()] + addonsTotal() - discount());
function quotePass() {
  clearTimeout(passQT); if (!passOn()) return;
  passQT = setTimeout(async () => {
    try { const r = await fetch('/api/passes/quote', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ads: nAds(), addons: addons(), extraLangs: extraLangs() }) }); const j = await r.json(); passQuote = r.ok ? j : null; if (!r.ok) $('#werr').textContent = j.error; }
    catch { passQuote = null; }
    $('#total').textContent = total() + ' zł'; if (step === 6) drawSummary();
  }, 250);
}
// Sprawdzane przy starcie i przy każdym otwarciu kreatora (klient mógł się zalogować w międzyczasie, np. po zakupie karnetu).
const loadMyPass = () => fetch('/api/passes/mine', { credentials: 'same-origin' }).then((r) => r.json()).then(({ active }) => {
  myPass = active && active.left.matches > 0 ? active : null;
  $('#passUse').hidden = !myPass;
  if (myPass) $('#passUseTxt').textContent = `Użyj karnetu „${myPass.name}” (${plural(myPass.left.matches, 'zostało', 'zostały', 'zostało')} ${myPass.left.matches} ${plural(myPass.left.matches, 'dopasowanie', 'dopasowania', 'dopasowań')}, ważny do ${new Date(myPass.expires).toLocaleDateString('pl-PL')})`;
  refresh();
}).catch(() => {});
loadMyPass();
$('#usePass').onchange = () => refresh();

const DKEY = 'cvpo-draft-v1', FIELDS = ['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'];
let saveT, restoring = false;
const draftData = () => ({ design, photo, addons: addons(), langs: extraLangs(), pkg: pkg(), f: Object.fromEntries(FIELDS.map((k) => [k, $('#' + k).value])), exp: rows('exp'), edu: rows('edu'), ads: rows('ads') });
// Szkic na serwerze („Wyślij mi link do dokończenia”, lib/wizard-drafts.js): po wysłaniu linku formularz synchronizuje się z nim (bez zdjęcia).
const SKEY = 'cvpo-srv-draft';
const srvToken = () => { try { return localStorage.getItem(SKEY) || ''; } catch { return ''; } };
let srvT;
const syncSrvDraft = () => {
  const t = srvToken(); if (!t) return;
  clearTimeout(srvT);
  srvT = setTimeout(() => fetch(`/api/wizard-draft/${encodeURIComponent(t)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: draftData() }) })
    .then((r) => { if (r.status === 404) try { localStorage.removeItem(SKEY); } catch {} }).catch(() => {}), 3000);
};
function saveDraft() {
  if (restoring) return;
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(DKEY, JSON.stringify(draftData())); } catch {} syncSrvDraft(); }, 300);
}
const clearDraft = () => { try { localStorage.removeItem(DKEY); localStorage.removeItem(SKEY); } catch {} };
function restoreDraft(from) {
  let d = from; if (!d) try { d = JSON.parse(localStorage.getItem(DKEY)); } catch {}
  if (!d || !d.f || !(d.f.name || d.f.email || d.exp?.some((e) => e.title) || d.ads?.some((a) => a.text))) return false;
  restoring = true;
  const r = $(`input[name=pkg][value="${d.pkg}"]`); if (r) r.checked = true;
  if (d.design && LEGACY[d.design.tpl]) d.design.tpl = LEGACY[d.design.tpl];
  if (d.design && COLORS[d.design.color] && TPLS.some((t) => t[0] === d.design.tpl)) design = { ...d.design };
  FIELDS.forEach((k) => ($('#' + k).value = d.f[k] || ''));
  if (d.addons) Object.entries(ADDON_KEYS).forEach(([k, [sel]]) => ($(sel).checked = !!d.addons[k]));
  (d.langs || []).forEach((l) => { const i = $(`#langPick input[value="${l}"]`); if (i) i.checked = true; });
  setPhoto(d.photo || '');
  ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); (d[b]?.length ? d[b] : [{}]).forEach((v) => addRow(b, v)); });
  restoring = false; refresh();
  return true;
}
function refresh() {
  if ($('#langPick').children.length) syncLangPick();
  saveDraft();
  $('#total').textContent = total() + ' zł'; if (step === 6) payTrust(6);
  $('#bundleTip').textContent = pkg() === 'cv' ? '' : bundleOn() ? `Masz pakiet „Pewna rozmowa”: ${PRICE.bundleOff} zł taniej.` : `Pakiet „Pewna rozmowa”: zaznacz przygotowanie do rozmowy i symulator, a zapłacisz ${PRICE.bundleOff} zł mniej.`;
  $('#bundleTip').hidden = pkg() === 'cv';
  $('#brk').textContent = [addonsTotal() ? `dodatki ${addonsTotal()} zł` : '', discount() ? `rabat −${discount()} zł` : ''].filter(Boolean).join(' · ');
  $$('.opt b[data-price]').forEach((b) => (b.textContent = `+${PRICE[b.dataset.price]} zł`));
  $('#pkgOpts').hidden = passOn();
  quotePass();
  const maxA = passOn() ? Math.min(3, myPass.left.matches) : PKG_ADS[pkg()];
  $('#addAd').hidden = maxA === 1; $('#addAd').disabled = nAds() >= maxA;
  $('#packTip').hidden = maxA !== 1;
}
$$('input[name=pkg]').forEach((r) => (r.onchange = refresh));
Object.values(ADDON_KEYS).forEach(([sel]) => ($(sel).onchange = refresh));
$('#langPick').replaceChildren(...Object.entries(LANGS).map(([k, n]) => el('label', { className: 'chk' }, el('input', { type: 'checkbox', value: k, onchange: refresh }), ` ${n}`, el('small', { className: 'incl', hidden: true, textContent: 'w cenie' }))));
// Język, w którym i tak powstaną dokumenty (z ogłoszeń; zanim ktoś je wklei — polski na polskiej wersji strony), jest w cenie: nie da się go dokupić.
function syncLangPick() {
  const ads = rows('ads').filter((a) => (a.text || '').length >= 80);
  const free = usefulExtraLangs(Object.keys(LANGS), ads.length ? ads : (window.I18N?.lang || 'pl') === 'pl' ? [{ lang: 'pl' }] : []);
  $$('#langPick label').forEach((lb) => {
    const i = $('input', lb), inPrice = !free.includes(i.value);
    if (inPrice) i.checked = false;
    i.disabled = inPrice; lb.classList.toggle('off', inPrice); $('.incl', lb).hidden = !inPrice;
  });
}
// Tabela porównania: na telefonie każdy wiersz to karta, więc każda komórka dostaje podpis kolumny.
{
  const heads = $$('.cmp thead th').map((th) => th.textContent);
  $$('.cmp tbody tr').forEach((tr) => $$('td', tr).forEach((td, i) => {
    const v = el('span', { className: 'v ' + [...td.classList].filter((c) => c === 'yes' || c === 'no').join(' ') }, ...td.childNodes);
    td.classList.remove('yes', 'no');
    td.replaceChildren(el('span', { className: 'cl', textContent: heads[i + 1] }), v);
  }));
}
$('#ads').addEventListener('input', refresh);
$('#ads').addEventListener('change', refresh);

/* kod rabatowy */
const REF_KEY = 'cvpo-ref';
// Przed i po: suwak (range) przesuwa granicę między zwykłym CV a CV pod ogłoszenie.
// „Przed i po”: na telefonie przełącznik Przed / Po (na szerokim ekranie oba fragmenty obok siebie).
for (const b of document.querySelectorAll('.ba-tabs [role=tab]')) b.addEventListener('click', () => {
  b.closest('section').querySelector('.ba2').dataset.show = b.id.slice(5);
  for (const x of document.querySelectorAll('.ba-tabs [role=tab]')) x.setAttribute('aria-selected', String(x === b));
});
// Pasek promocji z kalendarza (lib/promos.js): kod wpisuje się sam w kreatorze.
// Omnibus: przy obniżce pokazujemy najniższą cenę z 30 dni przed nią (dla każdego pakietu). Dane z /api/config i /api/code.
// Kwoty w złotych z przecinkiem (np. 29,25), bez zbędnych zer (39).
const zlFmt = (v) => Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
function lowestNote(lowest, cls = 'lowest', only) {
  if (!lowest) return null;
  const items = Object.entries(lowest).filter(([k]) => !only || k === only).flatMap(([k, v], i) => [i ? ', ' : ' ', el('span', { textContent: PKG_NAME[k] }), ' ', el('span', { textContent: `${zlFmt(v)} zł` })]);
  return el('span', { className: cls }, el('span', { textContent: 'Najniższa cena z 30 dni przed obniżką:' }), ...items, '.');
}
// W cenniku pod kwotą każdego pakietu, tylko w czasie promocji z kalendarza.
function drawPriceLowest(p) {
  $$('#cennik .price-card .lowest').forEach((e) => e.remove());
  if (!p?.lowest) return;
  for (const [k, v] of Object.entries(p.lowest)) {
    const card = $(`#cennik .price-card [data-pkg="${k}"]`)?.closest('.price-card'); if (!card) continue;
    card.querySelector('.amt').after(el('div', { className: 'lowest' }, el('span', { textContent: `−${p.percent}% z kodem ${p.code}` }), el('br'), el('span', { textContent: 'Najniższa cena z 30 dni przed obniżką:' }), ' ', el('span', { textContent: `${zlFmt(v)} zł` })));
  }
}
function drawPromo(p) {
  const bar = $('#promoBar'); bar.hidden = !p; if (!p) return;
  const until = new Date(p.until - 3600_000).toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' });
  bar.replaceChildren(el('span', { textContent: `${p.label}: −${p.percent}% z kodem ${p.code} do ${until}.` }), lowestNote(p.lowest, 'promo-low'), el('button', { type: 'button', className: 'btn sm', textContent: 'Zamów z rabatem', onclick: () => { $('#codeInput').value = p.code; openWiz(); } }));
  drawPriceLowest(p);
  if (!$('#codeInput').value) $('#codeInput').value = p.code;
}
async function applyCode(raw, quiet) {
  const code = String(raw || '').trim().toUpperCase(), st = $('#codeMsg');
  if (!code) { promo = null; refresh(); st.textContent = ''; return; }
  try {
    const r = await fetch(`/api/code/${encodeURIComponent(code)}?email=${encodeURIComponent($('#email').value)}`);
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    promo = j; st.className = 'fstatus good'; st.textContent = j.voucher ? `${j.label}: ${PKG_NAME[j.voucher]} bez opłaty` : `${j.label}: −${j.percent ? j.percent + '%' : j.discount + ' zł'}`;
  } catch (x) { promo = null; if (!quiet) { st.className = 'fstatus bad'; st.textContent = x.message; } }
  refresh(); if (step === 6) { drawSummary(); nextLabel(); }
}
$('#codeApply').onclick = () => applyCode($('#codeInput').value);
$('#toPack').onclick = () => { $('input[name=pkg][value=pack3]').checked = true; refresh(); $('#werr').textContent = ''; };
{
  const ref = new URLSearchParams(location.search).get('ref');
  try { if (ref) localStorage.setItem(REF_KEY, ref); } catch {}
  let saved = ref; try { saved = saved || localStorage.getItem(REF_KEY); } catch {}
  if (saved) { $('#codeInput').value = saved; $('#refBanner').hidden = false; if (/^WITAJ-/i.test(saved)) $('#refBanner').textContent = 'Masz kod powitalny −10 zł. Wpiszemy go automatycznie w podsumowaniu zamówienia.'; }
}
$('#wizForm').addEventListener('input', saveDraft);
$('#addExp').onclick = () => addRow('exp');
$('#addEdu').onclick = () => addRow('edu');
$('#addAd').onclick = () => addRow('ads');

// Pod przyciskiem płatności: metody faktycznie włączone u operatora (/api/config → pay), bezpieczeństwo, czas i e-mail.
function payTrust(n) {
  const box = $('#payTrust'), on = n === 6 && total() > 0;
  $('.wiz-foot').classList.toggle('pay', n === 6);
  box.hidden = !on; if (!on) return;
  const parts = [...(cfg.pay?.methods || []).map((m, i, a) => [el('span', { textContent: m }), i < a.length - 1 ? ', ' : '']).flat()];
  const items = [parts.length ? parts : null, cfg.pay ? [el('span', { textContent: `bezpieczna płatność przez ${cfg.pay.provider}` })] : null, [el('span', { textContent: 'dokumenty zwykle gotowe w kilka minut' })], [el('span', { textContent: 'PDF także na e-mail' })]].filter(Boolean);
  box.replaceChildren(...items.flatMap((x, i) => (i ? [' · ', ...x] : x)));
}
const nextLabel = () => ($('#next').textContent = step === 6 ? (total() === 0 ? 'Zamów bez opłaty' : cfg.demo ? `Przejdź do płatności · ${total()} zł` : `Zapłać ${total()} zł`) : 'Dalej');
function go(n) {
  refresh();
  step = n; if (!$('#wiz').hidden) track('step', { s: n });
  $$('#wiz section[data-step]').forEach((s) => (s.hidden = +s.dataset.step !== n));
  const idx = n === 7 ? ORDER.length : ORDER.indexOf(n);
  $('#stepper').replaceChildren(...ORDER.map((_, i) => el('li', { className: i < idx ? 'done' : i === idx ? 'cur' : '' })));
  $('#wizKicker').textContent = n <= 6 ? `Krok ${idx + 1} z ${ORDER.length}` : 'Płatność';
  $('#wizTitle').textContent = n <= 6 ? STEP_TITLE(n) : 'Zapłać za zamówienie';
  $('#back').hidden = idx === 0 || n === 7;
  $('#next').hidden = n === 7;
  nextLabel(); payTrust(n);
  if (n === 6) { if ($('#codeInput').value && !promo) applyCode($('#codeInput').value, true); drawSummary(); }
  $('#werr').textContent = '';
  $('.wiz-body').scrollTop = 0;
}
// Podgląd przed płatnością: na prośbę klienta, raz na sesję kreatora; reszta CV jako rozmazany szkielet z fikcyjnym tekstem.
let pvSid = '', pvShown = null;
const PV_FAKE = ['Doświadczenie zawodowe', 'Stanowisko, nazwa firmy · 2021 – obecnie', 'Punkt opisujący zakres obowiązków i rezultaty pracy', 'Kolejny punkt dopasowany do wymagań z ogłoszenia', 'Wykształcenie', 'Nazwa szkoły, kierunek · rok ukończenia', 'Umiejętności', 'Umiejętność, umiejętność, umiejętność, umiejętność'];
const pvSig = () => JSON.stringify([['headline', 'summary', 'skills'].map((k) => $('#' + k).value), rows('exp'), rows('edu'), rows('ads')[0]?.text || '']);
function drawPreview(r) {
  $('#pvOut').replaceChildren(el('div', { className: 'pv-doc' },
    el('div', { className: 'pv-name', textContent: $('#name').value }), el('div', { className: 'pv-hl', textContent: r.headline }),
    el('p', { textContent: r.summary }),
    el('div', { className: 'pv-kw' }, el('span', { className: 'hint', textContent: 'Słowa kluczowe z ogłoszenia w Twoim CV:' }), ...r.keywords.map((k) => el('span', { className: 'chip', textContent: k }))),
    el('div', { className: 'pv-blur', ariaHidden: 'true' }, ...PV_FAKE.map((t, i) => el(i % 4 === 0 ? 'b' : 'p', { textContent: t }))),
    el('p', { className: 'hint', textContent: 'Pełne CV, dopasowane do ogłoszenia, dostaniesz po płatności. Nagłówek i podsumowanie będą spójne z tym podglądem.' })));
  $('#pvBtn').hidden = true;
}
$('#pvBtn').onclick = async () => {
  const b = $('#pvBtn'), ad = rows('ads')[0], v = (id) => $('#' + id).value;
  if (!ad?.text) return;
  b.disabled = true; b.textContent = 'Przygotowuję podgląd…';
  try {
    const profile = { ...Object.fromEntries(['headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), experience: rows('exp'), education: rows('edu') };
    const r = await (await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: pvSid, profile, ad }) })).json();
    if (r.off || !r.summary) { $('#pvOut').replaceChildren(el('p', { className: 'hint', textContent: r.reason === 'limit' ? 'Limit podglądów został wykorzystany. Możesz od razu przejść do zamówienia.' : 'Podgląd jest chwilowo niedostępny. Możesz od razu przejść do zamówienia.' })); b.hidden = true; return; }
    pvShown = { ...r, sig: pvSig() }; drawPreview(r); // zdarzenie preview_shown liczy serwer
  } catch { $('#pvOut').replaceChildren(el('p', { className: 'hint', textContent: 'Podgląd jest chwilowo niedostępny. Możesz od razu przejść do zamówienia.' })); b.hidden = true; }
  finally { b.disabled = false; b.textContent = 'Pokaż podgląd'; }
};
function drawSummary() {
  $('#pvBox').hidden = !cfg.aiPreview || !rows('ads')[0]?.text;
  if (pvShown && pvShown.sig !== pvSig()) pvShown = null; // dane zmienione po podglądzie: podgląd nieaktualny
  if (!pvShown) { $('#pvOut').replaceChildren(); $('#pvBtn').hidden = false; }
  const ads = rows('ads');
  if (passOn()) {
    const q = passQuote, u = q?.use || { matches: nAds(), sim: 0, interview: 0 };
    $('#sum').replaceChildren(
      el('div', { className: 'sumrow' }, el('span', { textContent: `Karnet „${myPass.name}”: ${u.matches} ${plural(u.matches, 'dopasowanie', 'dopasowania', 'dopasowań')} (CV + list)${u.sim ? ', symulator' : ''}${u.interview ? ', przygotowanie do rozmowy' : ''}` }), el('span', { textContent: 'z karnetu' })),
      el('div', { className: 'sumrow' }, el('span', { textContent: `Wygląd: ${tplName(design.tpl)}, kolor ${COLOR_NAMES[design.color]}` }), el('span', { textContent: 'w cenie' })),
      ...ads.map((a, i) => el('div', { className: 'sumrow' }, el('span', { textContent: `Ogłoszenie ${i + 1}: ${a.title}` }), el('span', { textContent: 'z karnetu' }))),
      ...(q?.items || []).map((it) => el('div', { className: 'sumrow' }, el('span', { textContent: it.name }), el('span', { textContent: '+' + it.amount / 100 + ' zł' }))),
      el('div', { className: 'sumrow' }, el('span', { textContent: 'Do zapłaty' }), el('span', { textContent: total() + ' zł' })));
    return;
  }
  $('#sum').replaceChildren(
    el('div', { className: 'sumrow' }, el('span', { textContent: PKG_NAME[pkg()] }), el('span', { textContent: PRICE[pkg()] + ' zł' })),
    el('div', { className: 'sumrow' }, el('span', { textContent: `Wygląd: ${tplName(design.tpl)}, kolor ${COLOR_NAMES[design.color]}` }), el('span', { textContent: 'w cenie' })),
    el('div', { className: 'sumrow' }, el('span', { textContent: addons().docx ? 'Format: PDF i Word (.docx)' : 'W cenie: PDF. Wersja Word (.docx) to dodatek' }), el('span', { textContent: addons().docx ? 'PDF w cenie' : `+${PRICE.docx} zł` })),
    ...ads.map((a, i) => el('div', { className: 'sumrow' }, el('span', { textContent: `Ogłoszenie ${i + 1}: ${a.title}${a.lang === 'en' ? ' (po angielsku)' : ''}` }), el('span', { textContent: 'w cenie' }))),
    ...Object.entries(addons()).filter(([, on]) => on).map(([k]) => el('div', { className: 'sumrow' }, el('span', { textContent: ADDON_KEYS[k][1] }), el('span', { textContent: '+' + PRICE[k] + ' zł' }))),
    ...extraLangs().map((l) => el('div', { className: 'sumrow' }, el('span', { textContent: `Tłumaczenie: ${LANGS[l]}` }), el('span', { textContent: '+' + PRICE.extraLang + ' zł' }))),
    ...(bundleOn() ? [el('div', { className: 'sumrow' }, el('span', { textContent: 'Pakiet „Pewna rozmowa”' }), el('span', { textContent: '−' + PRICE.bundleOff + ' zł' }))] : []),
    ...(discount() ? [el('div', { className: 'sumrow' }, el('span', {}, el('span', { textContent: promo.label }), ' ' + promo.code), el('span', { textContent: '−' + discount() + ' zł' }))] : []),
    ...(discount() && promo.calendar && promo.lowest ? [el('div', { className: 'sumrow lowest' }, lowestNote(promo.lowest, 'lowest', pkg()))] : []),
    el('div', { className: 'sumrow' }, el('span', { textContent: 'Razem' }), el('span', { textContent: total() + ' zł' })));
}
const nipOk = (n) => /^\d{10}$/.test(n) && [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((s, w, i) => s + w * +n[i], 0) % 11 === +n[9];
// Oferty pracy na e-mail przy zamówieniu: zawód z pierwszego ogłoszenia, miasto z danych kandydata.
$('#wantAlerts').onchange = () => {
  $('#alertBox').hidden = !$('#wantAlerts').checked; if (!$('#wantAlerts').checked) return;
  if (!$('#alJob').value) $('#alJob').value = (rows('ads')[0]?.title || $('#headline').value || '').split(/\s*[/|,(]\s*/)[0].trim();
  if (!$('#alCity').value) $('#alCity').value = $('#city').value.trim();
};
$('#wantInv').onchange = () => { $('#invBox').hidden = !$('#wantInv').checked; if ($('#wantInv').checked) $('#invName').focus(); };
function validate(n) {
  const v = (id) => $('#' + id).value.trim();
  if (n === 2) { if (!v('name')) return 'Podaj imię i nazwisko.'; if (!/^\S+@\S+\.\S+$/.test(v('email'))) return 'Podaj poprawny adres e-mail.'; }
  if (n === 4 && !rows('exp').some((e) => e.title || e.company) && !rows('edu').some((e) => e.school)) return 'Dodaj co najmniej jedno stanowisko (krok 3) lub szkołę.';
  if ((n === 5 || (ORDER_B && n === 6)) && passOn() && nAds() > Math.min(3, myPass.left.matches)) return `W karnecie ${plural(myPass.left.matches, 'zostało', 'zostały', 'zostało')} ${myPass.left.matches} ${plural(myPass.left.matches, 'dopasowanie', 'dopasowania', 'dopasowań')}. Usuń dodatkowe ogłoszenia albo odznacz „Użyj karnetu”.`;
  // Wariant B: pakietu jeszcze nie wybrano – przy kilku ogłoszeniach zaznaczamy Pakiet 3 (można zmienić w podsumowaniu).
  if (n === 5 && ORDER_B && !passOn() && nAds() > PKG_ADS[pkg()]) { $('input[name=pkg][value=pack3]').checked = true; refresh(); }
  if ((n === 5 || (ORDER_B && n === 6)) && !passOn() && nAds() > PKG_ADS[pkg()]) return 'Wybrany pakiet obejmuje jedno ogłoszenie. Usuń dodatkowe ogłoszenia albo wybierz Pakiet 3 za 79 zł.';
  if (n === 5) for (const [i, a] of rows('ads').entries()) {
    if (!a.text) return `Ogłoszenie ${i + 1}: kliknij „Pobierz” przy linku albo wklej treść oferty.`;
    if (!a.title) return `Ogłoszenie ${i + 1}: podaj nazwę stanowiska.`;
    if (a.text.length < 80) return `Ogłoszenie ${i + 1}: wklej pełną treść oferty (min. 80 znaków).`;
  }
  if (n === 6 && $('#wantInv').checked) {
    const nip = $('#invNip').value.replace(/^PL/i, '').replace(/[\s-]/g, '');
    if ($('#invName').value.trim().length < 3 || $('#invAddr').value.trim().length < 5) return 'Do faktury podaj nazwę (albo imię i nazwisko) oraz adres.';
    if (nip && !nipOk(nip)) return 'Sprawdź NIP do faktury – powinien mieć 10 cyfr.';
  }
  if (n === 6 && $('#wantAlerts').checked && $('#alJob').value.trim().length < 2) return 'Wpisz zawód do ofert pracy na e-mail albo odznacz tę opcję.';
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
  loadMyPass();
  if (p) { $(`input[name=pkg][value=${p}]`).checked = true; refresh(); }
  if (!$('#wizDesign').children.length) drawWizDesign();
  if (!pvSid) { const r = new Uint8Array(12); crypto.getRandomValues(r); pvSid = [...r].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  track('start'); modal(true); $('#wiz').hidden = false; $('#mcta').hidden = true; document.body.classList.remove('mcta-on'); go(step === 7 ? 6 : step);
  setTimeout(() => $('#wizClose').focus(), 0);
};
const closeWiz = () => { $('#wiz').hidden = true; modal(false); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (!b) return; e.preventDefault(); if (b.dataset.addon) { b.dataset.addon.split(',').forEach((a) => ($('#ad' + a).checked = true)); saveDraft(); } openWiz(b.dataset.pkg); });
$('#wizClose').onclick = closeWiz;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#wiz').hidden) closeWiz(); });
$('#back').onclick = () => go(ORDER[ORDER.indexOf(step) - 1] ?? ORDER[0]);

$('#wizForm').onsubmit = async (e) => {
  e.preventDefault();
  const err = validate(step);
  if (err) return ($('#werr').textContent = err);
  if (ORDER.indexOf(step) < ORDER.length - 1) return go(ORDER[ORDER.indexOf(step) + 1]);
  const v = (id) => $('#' + id).value;
  const body = {
    draftToken: srvToken() || undefined,
    usePass: passOn(), design, addons: addons(), extraLangs: extraLangs(), code: passOn() ? '' : promo?.code || '', reminder: $('#reminder').checked, outcomeAsk: $('#outcomeAsk').checked, followUp: $('#followUp').checked, jobAlerts: $('#wantAlerts').checked ? { job: $('#alJob').value, city: $('#alCity').value } : null, reviewAsk: $('#reviewAsk').checked, payReminder: $('#payRem').checked, invoice: $('#wantInv').checked ? { name: $('#invName').value, address: $('#invAddr').value, nip: $('#invNip').value } : null, createAccount: $('#createAccount').checked, uiLang: window.I18N?.lang || 'pl', pkg: orderPkg(), consent: $('#consent').checked && $('#waiver').checked, ads: rows('ads'),
    profile: { ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), experience: rows('exp'), education: rows('edu'), photo },
  };
  // Zgoda na cookies reklamowe (baner): tylko wtedy serwer zgłosi zakup do Meta (Conversions API) z identyfikatorami piksela.
  try { if (localStorage.getItem('cvpo-consent') === 'granted') { const ck = (n) => (document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')) || [])[1]; Object.assign(body, { adConsent: true, fbp: ck('_fbp'), fbc: ck('_fbc') }); } } catch {}
  $('#next').disabled = true;
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    orderId = j.id;
    if (!j.free) track('checkout');
    if (j.free) { closeWiz(); startResult(j.id); } else if (j.demo) go(7); else location.href = j.url;
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

/* darmowy skaner CV (na stronie głównej i na podstronie /narzedzia/skaner-cv) */
let scanData = null;
// Tekst CV wklejony zamiast pliku: wysyłamy go jak plik TXT (ten sam import i skaner po stronie serwera).
const textB64 = (t) => { const b = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
function bindScan(ui) {
  ui.file.onchange = () => (ui.fileName.textContent = ui.file.files[0]?.name || 'nie wybrano pliku');
  // Zakładki „Wybierz plik” / „Wklej tekst CV”.
  const row = ui.file.closest('.filerow'), cvText = el('textarea', { rows: 5, placeholder: 'Wklej tekst swojego CV', hidden: true });
  cvText.setAttribute('aria-label', 'Tekst CV');
  let mode = 'file';
  const tabs = [['file', 'Wybierz plik'], ['text', 'Wklej tekst CV']].map(([m, t]) => el('button', { type: 'button', textContent: t, onclick: () => {
    mode = m; row.hidden = m !== 'file'; cvText.hidden = m !== 'text';
    tabs.forEach((b, i) => b.setAttribute('aria-selected', String((i === 0) === (m === 'file'))));
  } }));
  tabs.forEach((b, i) => { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0)); });
  const seg = el('div', { className: 'seg scan-mode' }, ...tabs); seg.setAttribute('role', 'tablist'); seg.setAttribute('aria-label', 'Jak dodać CV');
  row.before(seg); row.after(cvText);
  ui.form.onsubmit = async (e) => {
    e.preventDefault();
    const msg = ui.msg, file = mode === 'file' ? ui.file.files[0] : null, pasted = mode === 'text' ? cvText.value.trim() : '';
    let ad = ui.ad.value.trim(), title = '';
    msg.className = 'fstatus';
    const fail = (t) => { msg.className = 'fstatus bad'; msg.textContent = t; };
    if (mode === 'file' && !file) return fail('Wybierz plik ze swoim CV albo wklej jego tekst.');
    if (mode === 'text' && pasted.length < 60) return fail('Wklej cały tekst swojego CV.');
    if (file && file.size > 5 * 1024 * 1024) return fail('Plik musi mieć do 5 MB.');
    if (!ad) return fail('Wklej link do ogłoszenia albo jego treść.');
    ui.btn.disabled = true;
    try {
      if (/^https?:\/\/\S+$/i.test(ad)) {
        msg.textContent = 'Pobieram ogłoszenie…';
        const r = await fetch('/api/fetch-ad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ad }) });
        const j = await r.json(); if (!r.ok) throw new Error(`${j.error} Wklej treść ogłoszenia zamiast linku.`);
        ad = j.text; title = j.title;
      }
      if (ad.length < 80) throw new Error('Wklej pełną treść ogłoszenia (min. 80 znaków).');
      msg.textContent = 'Porównujemy Twoje CV z ogłoszeniem…';
      const b64 = file ? await fileB64(file) : textB64(pasted);
      const r = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: b64, adText: ad }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      // Nazwa stanowiska: z linku, z oceny AI albo z pierwszego zdania ogłoszenia.
      const guess = ad.split(/[.\n]/)[0].replace(/^(poszukujemy|szukamy|zatrudnimy|zatrudni[mę]?)\s+/i, '').trim().slice(0, 60);
      scanData = { b64, adText: ad, title: title || j.position || guess.charAt(0).toUpperCase() + guess.slice(1) };
      msg.textContent = ''; renderScan(j, ui.result);
    } catch (x) { fail(x.message); }
    ui.btn.disabled = false;
  };
}
bindScan({ form: $('#scanForm'), file: $('#scanFile'), fileName: $('#scanFileName'), ad: $('#scanAd'), btn: $('#scanBtn'), msg: $('#scanMsg'), result: $('#scanResult') });
// Formularz skanera na podstronie narzędzia: te same pola co na stronie głównej, wynik pod formularzem.
function toolScan(box) {
  const file = el('input', { type: 'file', accept: '.pdf,.docx,.txt', hidden: true }), fileName = el('span', { className: 'hint', textContent: 'nie wybrano pliku' });
  const ad = el('textarea', { rows: 4, placeholder: 'Wklej link (https://…) albo całą treść ogłoszenia' }), btn = el('button', { className: 'btn', type: 'submit', textContent: 'Sprawdź za darmo' });
  const msg = el('p', { className: 'fstatus', role: 'status' }), result = el('div', { className: 'scan-result', hidden: true });
  const form = el('form', { className: 'scan-card', noValidate: true },
    el('div', { className: 'f' }, '1. Twoje CV ', el('span', { className: 'h', textContent: 'PDF, Word lub TXT, do 5 MB' }), el('div', { className: 'filerow' }, el('label', { className: 'btn ghost sm filebtn' }, 'Wybierz plik', file), fileName)),
    el('label', { className: 'f' }, '2. Link do ogłoszenia albo jego treść', ad), btn, msg, el('p', { className: 'hint small', textContent: 'Nie zapisujemy ani pliku, ani wyniku.' }));
  if (pendingDraft) ad.value = pendingDraft;
  bindScan({ form, file, fileName, ad, btn, msg, result });
  box.classList.remove('tool-box'); box.append(form, result);
  if (cfg.chromeExt) box.append(el('p', { className: 'chrome-ext' }, el('a', { className: 'btn ghost sm', href: cfg.chromeExt, target: '_blank', rel: 'noopener', textContent: 'Dodaj do Chrome' }), ' ', el('span', { className: 'hint', textContent: 'Skaner jednym kliknięciem na stronie ogłoszenia.' })));
}
function renderScan(j, box = $('#scanResult')) {
  const total = j.found.length + j.missing.length, pct = j.score ?? 0;
  box.replaceChildren(
    el('div', { className: 'ring-col' }, el('div', { className: 'ring', style: `--p:${pct}` }, el('b', { textContent: `${pct}%` })),
      el('button', { type: 'button', className: 'btn sm scan-cta', onclick: fromScan }, el('span', { textContent: 'Zrób CV dopasowane do tego ogłoszenia – od' }), ` ${PRICE.cv} zł`)),
    el('div', { className: 'mcol ok' }, el('h3', { textContent: `Spełniasz ${j.found.length} z ${total} wymagań${j.position ? ': ' + j.position : ''}` }), el('ul', {}, ...j.found.map((x) => el('li', { textContent: x })))),
    el('div', { className: 'mcol miss' }, el('h3', { textContent: j.missing.length ? 'Czego nie widać w Twoim CV' : 'Niczego nie brakuje' }), el('ul', {}, ...j.missing.map((m) => el('li', {}, el('b', { textContent: m.keyword }), el('small', { textContent: m.hint }))))),
    j.tips?.length ? el('div', { className: 'tips' }, el('h3', { textContent: 'Co poprawić' }), el('ol', {}, ...j.tips.map((t) => el('li', { textContent: t })))) : null,
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Zrób CV pisane pod to ogłoszenie' }), el('p', { className: 'hint', textContent: 'Uzupełnimy formularz danymi z Twojego pliku, ułożymy CV pod te wymagania, a brakujące rzeczy, które masz, dopiszesz jednym kliknięciem. Od 39 zł, z darmową poprawką.' })),
      el('button', { type: 'button', className: 'btn', textContent: 'Zrób CV pod to ogłoszenie', onclick: fromScan })),
    j.scanId ? scanShare(j.scanId) : null, j.scanId ? scanMailForm(j.scanId) : null);
  box.hidden = false; box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
}
// Karta wyniku do udostępnienia (/wynik/<id>): procent bierze serwer z zapamiętanego wyniku (scanId), z przeglądarki idzie tylko
// opcjonalne stanowisko i język. Na karcie nie ma treści CV ani ogłoszenia; link działa 30 dni.
function scanShare(scanId) {
  const open = el('button', { type: 'button', className: 'btn ghost', textContent: 'Udostępnij wynik' });
  const title = el('input', { type: 'text', maxLength: 60, placeholder: 'np. magazynier', autocomplete: 'off' }), make = el('button', { type: 'submit', className: 'btn', textContent: 'Utwórz link' });
  const msg = el('p', { className: 'fstatus', role: 'status' }), links = el('div', { className: 'share-btns', hidden: true });
  const form = el('form', { className: 'scan-share-form', hidden: true, noValidate: true },
    el('label', { className: 'f' }, 'Stanowisko na karcie (opcjonalnie)', el('div', { className: 'filerow' }, title, make)),
    el('p', { className: 'hint small', textContent: 'Na karcie pokażemy tylko procent dopasowania, to stanowisko i datę. Bez treści CV i ogłoszenia. Link działa 30 dni.' }), msg, links);
  open.onclick = () => { open.hidden = true; form.hidden = false; title.focus(); };
  const out = (text, href) => el('a', { className: 'btn ghost sm', href, target: '_blank', rel: 'noopener', textContent: text });
  form.onsubmit = async (e) => {
    e.preventDefault(); make.disabled = true; msg.className = 'fstatus'; msg.textContent = '';
    try {
      const r = await fetch('/api/scan/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanId, title: title.value.trim(), lang: window.I18N?.lang || 'pl' }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Nie udało się utworzyć linku.');
      title.value = j.title; // po usunięciu adresów, e-maili i telefonów
      const u = encodeURIComponent(j.shareUrl), link = el('input', { type: 'text', readOnly: true, value: j.shareUrl, className: 'share-link', ariaLabel: 'Link do karty wyniku' });
      const copy = el('button', { type: 'button', className: 'btn ghost sm', textContent: 'Kopiuj link', onclick: async () => {
        try { await navigator.clipboard.writeText(j.shareUrl); } catch { link.select(); document.execCommand?.('copy'); }
        msg.className = 'fstatus ok'; msg.textContent = 'Skopiowano link';
      } });
      // Na telefonie systemowe „Udostępnij” (Web Share API), jeśli przeglądarka je ma.
      const native = navigator.share && matchMedia('(pointer:coarse)').matches ? el('button', { type: 'button', className: 'btn sm', textContent: 'Udostępnij', onclick: () => navigator.share({ text: j.text, url: j.shareUrl }).catch(() => {}) }) : null;
      links.replaceChildren(...[link, native].filter(Boolean), out('WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${j.text} ${j.shareUrl}`)}`), out('Telegram', `https://t.me/share/url?url=${u}&text=${encodeURIComponent(j.text)}`),
        out('Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`), copy, out('Zobacz kartę', j.url));
      links.hidden = false; msg.className = 'fstatus ok'; msg.textContent = 'Link gotowy. Wyślij go znajomym albo wstaw w mediach społecznościowych.';
    } catch (x) { msg.className = 'fstatus err'; msg.textContent = x.message; }
    make.disabled = false;
  };
  return el('div', { className: 'scan-share' }, open, form);
}
// Wynik skanera na e-mail (usługa na prośbę, bez zgody marketingowej); newsletter tylko po osobnym, niezaznaczonym polu.
function scanMailForm(scanId) {
  const email = el('input', { type: 'email', required: true, autocomplete: 'email', placeholder: 'twoj@email.pl', maxLength: 160 });
  const nl = el('input', { type: 'checkbox' }), msg = el('p', { className: 'fstatus', role: 'status' });
  const btn = el('button', { type: 'submit', className: 'btn ghost', textContent: 'Wyślij' });
  const form = el('form', { className: 'scan-mail', noValidate: true },
    el('label', { className: 'f' }, 'Wyślij mi wynik i listę braków na e-mail', el('div', { className: 'filerow' }, email, btn)),
    el('label', { className: 'check' }, nl, el('span', { textContent: 'Chcę też newsletter z poradami (potwierdzisz zapis w e-mailu, wypis w każdej chwili)' })), msg,
    el('p', { className: 'hint small', textContent: 'Wynik wyślemy jednorazowo. Nie zapisujemy treści CV ani adresu, chyba że zaznaczysz newsletter.' }));
  form.onsubmit = async (e) => {
    e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { msg.className = 'fstatus err'; msg.textContent = 'Podaj poprawny adres e-mail.'; return; }
    btn.disabled = true; msg.className = 'fstatus'; msg.textContent = '';
    try {
      const r = await fetch('/api/scan/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanId, email: email.value.trim(), newsletter: nl.checked, lang: window.I18N?.lang === 'uk' ? 'uk' : 'pl' }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Nie udało się wysłać.');
      msg.className = 'fstatus ok'; msg.textContent = j.newsletter ? 'Wysłane. Sprawdź też e-mail z linkiem potwierdzającym zapis do newslettera.' : 'Wysłane. Sprawdź skrzynkę (także Spam).';
    } catch (x) { msg.className = 'fstatus err'; msg.textContent = x.message; btn.disabled = false; }
  };
  return form;
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
  $('input[name=pkg][value=pack3]').checked = true; refresh();
  addRow('ads', { title: EX[0].title, text: 'Kasjer / Sprzedawca. ' + EX[0].ad + ' Oferujemy umowę o pracę i pakiet benefitów.' });
  addRow('ads', { title: EX[1].title, text: 'Specjalista ds. obsługi klienta. ' + EX[1].ad + ' Oferujemy umowę o pracę i elastyczne godziny.' });
  $('#werr').textContent = 'Wstawiono dane przykładowe. Kliknij „Dalej”, aby przejść przez kroki.';
};

/* ---------- Generowanie i wynik ---------- */
let curAd = 0, curDoc = 'cv', timer;
function landing(show) { ['landing', 'nav', 'foot'].forEach((i) => ($('#' + i).hidden = !show)); }
let pendingPolls = 0;
function startResult(id) {
  orderId = id; pendingPolls = 0; $('#payAgain').hidden = true; landing(false); $('#result').hidden = true; $('#gen').hidden = false; $('#retry').hidden = true;
  $('#genTitle').textContent = 'Piszemy Twoje dokumenty'; window.scrollTo(0, 0);
  clearTimeout(timer); poll();
}
async function poll() {
  let r; try { r = await fetch(`/api/orders/${orderId}`); } catch { r = null; }
  if (!r || !r.ok) { $('#genTitle').textContent = 'Nie znaleziono zamówienia'; $('#genMsg').textContent = 'Sprawdź link lub wróć na stronę główną.'; return; }
  data = await r.json();
  data.design = data.design || { ...design };
  // Zakup do statystyk reklam (tylko za zgodą na cookie, raz na zamówienie, tuż po płatności).
  if (data.status !== 'pending' && data.total > 0 && data.paidAt && Date.now() - data.paidAt < 864e5) window.CONSENT?.purchase(data.id, data.total / 100);
  if (data.status === 'done') { $('#gen').hidden = true; return showResult(); }
  if (data.status === 'paid') { $('#genTitle').textContent = 'Dokumenty są w przygotowaniu'; $('#genMsg').textContent = 'Mamy chwilowe opóźnienie. Płatność jest zachowana, a gotowe dokumenty wyślemy na Twój e-mail, zwykle w ciągu kilku godzin. Możesz zamknąć tę stronę albo spróbować ponownie.'; $('#retry').hidden = false; timer = setTimeout(poll, 60000); return; }
  if (data.status === 'pending' && data.canPay && ++pendingPolls >= 4) { $('#genTitle').textContent = 'Płatność nie jest jeszcze potwierdzona'; $('#genMsg').textContent = 'Jeśli przerwałeś płatność albo zamknąłeś okno banku, możesz ją dokończyć. Jeśli zapłaciłeś, poczekaj chwilę: potwierdzenie może przyjść z opóźnieniem.'; $('#payAgain').hidden = false; timer = setTimeout(poll, 5000); return; }
  $('#genMsg').textContent = data.status === 'pending' ? 'Czekamy na potwierdzenie płatności…' : 'To zajmie około minuty. Nie zamykaj tej strony. Gotowe dokumenty wyślemy też na Twój e-mail.';
  timer = setTimeout(poll, cfg.demo ? 800 : 2500);
}
$('#payAgain').onclick = async () => { $('#payAgain').disabled = true; try { const r = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST' }); const j = await r.json(); if (!r.ok) throw new Error(j.error); location.href = j.url; } catch (x) { $('#genMsg').textContent = x.message || 'Nie udało się otworzyć płatności.'; $('#payAgain').disabled = false; } };
$('#retry').onclick = async () => { await fetch(`/api/orders/${orderId}/retry`, { method: 'POST' }); startResult(orderId); };

function drawInvoice() {
  let b = $('#invNote');
  if (!data.invoice) { if (b) b.hidden = true; return; }
  if (!b) { b = el('p', { id: 'invNote', className: 'mailnote noprint good' }); $('#mailNote').after(b); }
  b.hidden = false;
  b.replaceChildren(el('span', { textContent: 'Faktura' }), ' ', el('b', { textContent: data.invoice.number }), ' · ', el('a', { href: `/api/orders/${orderId}/invoice.pdf`, target: '_blank', rel: 'noopener', textContent: 'Pobierz fakturę (PDF)' }));
}
function drawMail() {
  drawInvoice();
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
const DOCS = { cv: 'CV', letter: 'List motywacyjny', interview: 'Rozmowa', sim: 'Symulator rozmowy', messages: 'Wiadomości', linkedin: 'LinkedIn' };
const docsOf = (r) => ['cv', ...(data.pkg !== 'cv' ? ['letter'] : []), ...(r.interview?.length ? ['interview'] : []), ...(data.addons?.sim ? ['sim'] : []), ...(r.messages ? ['messages'] : []), ...(r.linkedin ? ['linkedin'] : [])];
let editing = null; // kopia dokumentu w trakcie ręcznej edycji
let curLang = null; // aktywna dodatkowa wersja językowa (null = główny język)
const cur = () => { const b = data.results[curAd]; return (curLang && b.variants?.[curLang]) || b; };

// Symulator rozmowy: przebieg zapisany w przeglądarce (osobno dla każdego ogłoszenia), żeby odświeżenie strony go nie kasowało.
const simKey = () => `cvpo-sim-${orderId}-${curAd}`;
const simLoad = () => { try { return JSON.parse(localStorage.getItem(simKey())) || null; } catch { return null; } };
const simSave = (s) => { try { localStorage.setItem(simKey(), JSON.stringify(s)); } catch {} };
function simNode() {
  let s = simLoad() || { turns: [], q: null, summary: null };
  const box = el('div', { className: 'sim' }), log = el('div', { className: 'sim-log', ariaLive: 'polite' });
  const ans = el('textarea', { className: 'sim-in', placeholder: 'Twoja odpowiedź – tak jak powiedział(a)byś na rozmowie', rows: 5 });
  const send = el('button', { type: 'button', className: 'btn', textContent: 'Wyślij odpowiedź' }), end = el('button', { type: 'button', className: 'btn ghost', textContent: 'Zakończ i podsumuj' });
  const status = el('p', { className: 'hint sim-st', role: 'status' });
  const score = (n) => el('span', { className: 'sim-score', ariaLabel: `${n}/5` }, ...[1, 2, 3, 4, 5].map((i) => el('i', { className: i <= n ? 'f' : '' })), el('b', { textContent: ` ${n}/5` }));
  const fb = (f) => el('div', { className: 'sim-fb' }, el('div', { className: 'sim-fb-h' }, el('span', { textContent: 'Ocena odpowiedzi' }), score(f.score)),
    f.good ? el('p', {}, el('b', { textContent: 'Dobrze: ' }), f.good) : null, f.improve ? el('p', {}, el('b', { textContent: 'Do poprawy: ' }), f.improve) : null,
    f.better ? el('p', { className: 'sim-better' }, el('b', { textContent: 'Lepiej: ' }), f.better) : null);
  const paint = () => {
    log.replaceChildren(...[...s.turns.flatMap((t) => [el('div', { className: 'sim-msg q' }, el('small', { textContent: 'Rekruter' }), t.q), el('div', { className: 'sim-msg a' }, el('small', { textContent: 'Ty' }), t.a), t.fb ? fb(t.fb) : null]),
      s.q ? el('div', { className: 'sim-msg q' }, el('small', { textContent: 'Rekruter' }), s.q) : null,
      s.summary ? el('div', { className: 'sim-sum' }, el('h3', { textContent: 'Podsumowanie rozmowy' }), score(s.summary.score),
        s.summary.strengths?.length ? el('div', {}, el('b', { textContent: 'Mocne strony' }), el('ul', {}, ...s.summary.strengths.map((x) => el('li', { textContent: x })))) : null,
        s.summary.improve?.length ? el('div', {}, el('b', { textContent: 'Nad czym popracować' }), el('ul', {}, ...s.summary.improve.map((x) => el('li', { textContent: x })))) : null,
        s.summary.tip ? el('p', { className: 'sim-better' }, el('b', { textContent: 'Rada na koniec: ' }), s.summary.tip) : null) : null].filter(Boolean));
    const active = !!s.q && !s.summary;
    ans.hidden = send.hidden = end.hidden = !active; start.hidden = active;
    start.textContent = s.turns.length || s.summary ? 'Zacznij nową rozmowę' : 'Zacznij rozmowę';
  };
  const call = async (body) => {
    status.textContent = 'Rekruter czyta Twoją odpowiedź…'; send.disabled = end.disabled = start.disabled = true;
    try {
      const r = await fetch(`/api/orders/${orderId}/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ i: curAd, ...body }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      status.textContent = ''; return j;
    } catch (x) { status.textContent = x.message || 'Symulator jest chwilowo niedostępny. Spróbuj za chwilę.'; return null; }
    finally { send.disabled = end.disabled = start.disabled = false; }
  };
  const answer = async (finish) => {
    const a = ans.value.trim();
    if (!finish && !a) { status.textContent = 'Napisz odpowiedź na pytanie.'; return; }
    const history = [...s.turns.map((t) => ({ q: t.q, a: t.a })), ...(a ? [{ q: s.q, a }] : [])];
    const j = await call({ history, finish }); if (!j) return;
    if (a) s.turns.push({ q: s.q, a, fb: j.feedback }); else if (j.feedback && s.turns.length) s.turns[s.turns.length - 1].fb ||= j.feedback;
    s.q = j.question; s.summary = j.summary || (!j.question ? s.summary : null);
    if (!j.question && !j.summary) { const k = await call({ history, finish: true }); if (k) s.summary = k.summary; }
    ans.value = ''; simSave(s); paint(); log.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const start = el('button', { type: 'button', className: 'btn', onclick: async () => {
    s = { turns: [], q: null, summary: null };
    const j = await call({ history: [] }); if (!j) return;
    s.q = j.question; simSave(s); paint(); ans.focus();
  } });
  send.onclick = () => answer(false); end.onclick = () => answer(true);
  ans.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) answer(false); };
  box.append(el('div', { className: 'sim-intro' }, el('h2', { textContent: 'Symulator rozmowy kwalifikacyjnej' }),
    el('p', { textContent: 'Rekruter zada Ci do 8 pytań do tego ogłoszenia, po jednym. Po każdej odpowiedzi dostaniesz ocenę i wskazówki, a na końcu podsumowanie. Odpowiadaj tak, jak mówił(a)byś na prawdziwej rozmowie.' })),
    log, el('div', { className: 'sim-form' }, ans, el('div', { className: 'sim-btns' }, send, end, start)), status);
  paint();
  return box;
}

function interviewNode(r, d) {
  const p = paperEl('extra', { tpl: 'klasyczny', color: d.color }), pr = r.prep || null;
  const sec = (t, ...kids) => el('section', { className: 'iv-sec' }, el('h3', { textContent: t }), ...kids);
  const ul = (list, cls = '') => el('ul', { className: 'iv-list ' + cls }, ...list.map((t) => el('li', { textContent: t })));
  let cat = '';
  const qa = el('div', { className: 'qa' }, ...r.interview.flatMap((x, i) => {
    const head = x.cat && x.cat !== cat ? [el('div', { className: 'iv-cat', textContent: (cat = x.cat) })] : [];
    return [...head, el('div', { className: 'q' }, el('span', { textContent: i + 1 }), el('div', {}, el('b', { textContent: x.q }), ...(x.why ? [el('small', { textContent: 'Co sprawdza rekruter: ' + x.why })] : []), el('p', { textContent: x.a })))];
  }));
  p.append(el('div', { className: 'pg' }, el('header', { className: 'top lhead' }, el('h1', { textContent: 'Przygotowanie do rozmowy' }), el('div', { className: 'ct', textContent: r.position }), el('div', { className: 'rule' })),
    ...(pr?.pitch ? [sec('Opowiedz o sobie (ok. 60 sekund)', el('div', { className: 'iv-box', textContent: pr.pitch }))] : []),
    ...(pr?.strengths?.length ? [sec('Twoje mocne strony pod to ogłoszenie', ul(pr.strengths))] : []),
    sec(`Pytania i przykładowe odpowiedzi (${r.interview.length})`, qa),
    ...(pr?.gaps?.length ? [sec('Czego może brakować i jak o tym mówić', ul(pr.gaps.map((g) => `${g.gap}: ${g.how}`)))] : []),
    ...(pr?.ask?.length ? [sec('Pytania, które zadasz pracodawcy', ul(pr.ask))] : []),
    ...(pr?.salary ? [sec('Rozmowa o wynagrodzeniu', el('div', { className: 'iv-box', textContent: pr.salary }))] : []),
    ...(pr?.checklist?.length ? [sec('Lista kontrolna', ul(pr.checklist, 'check'))] : [])));
  return p;
}
function copyBtn(text) {
  return el('button', { type: 'button', className: 'link copy noprint', textContent: 'Kopiuj', onclick: async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = 'Skopiowano'; } catch { e.target.textContent = 'Zaznacz tekst i skopiuj'; }
  } });
}
function linkedinNode(r, d) {
  const l = r.linkedin, p = paperEl('extra', { tpl: 'klasyczny', color: d.color });
  const block = (title, text) => [el('h3', { textContent: title }), copyBtn(text), el('div', { className: 'msgbox', textContent: text })];
  p.append(el('div', { className: 'pg' }, el('header', { className: 'top lhead' }, el('h1', { textContent: 'Profil LinkedIn' }), el('div', { className: 'ct', textContent: r.position }), el('div', { className: 'rule' })),
    ...block('Nagłówek', l.headline), ...block('Informacje', l.about), ...block('Umiejętności (w tej kolejności)', (l.skills || []).join(', ')),
    ...(l.experience || []).flatMap((e) => block(`Doświadczenie: ${e.title}${e.company ? ', ' + e.company : ''}`, e.text)),
    ...(l.tips?.length ? [el('h3', { textContent: 'Ustawienia profilu' }), el('ul', { className: 'iv-list' }, ...l.tips.map((t) => el('li', { textContent: t })))] : [])));
  return p;
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
  const node = { cv: () => cvNode(r, undefined, d), letter: () => letterNode(r, d), interview: () => interviewNode(r, d), sim: () => simNode(), messages: () => messagesNode(r, d), linkedin: () => linkedinNode(r, d) }[curDoc];
  $('#paper').replaceChildren(node());
}

// Kolejne zamówienie: 3 pakiety + „Pewna rozmowa” (CV z listem, przygotowanie do rozmowy i symulator, taniej o PRICE.bundleOff).
const FU_NAME = (k) => (k === 'bundle' ? 'Pewna rozmowa' : PKG_NAME[k]);
const FU_PRICE = (k) => (k === 'bundle' ? PRICE.cv_letter + PRICE.interview + PRICE.sim - PRICE.bundleOff : PRICE[k]);
const FU_ADS = (k) => (k === 'bundle' ? 1 : PKG_ADS[k]);
function drawFollowup() {
  const box = $('#followup');
  box.hidden = false;
  if (box.dataset.ready === orderId) return;
  box.dataset.ready = orderId;
  let fpkg = 'cv_letter';
  const pick = el('div', { className: 'fupick seg', role: 'tablist' });
  const drawPick = () => {
    pick.replaceChildren(...['cv', 'cv_letter', 'pack3', 'bundle'].map((k) => el('button', { type: 'button', role: 'tab', ariaSelected: String(k === fpkg), onclick: () => { fpkg = k; drawPick(); } }, el('span', { textContent: FU_NAME(k) }), ' · ', el('span', { textContent: `${FU_PRICE(k)} zł` }))));
    const n = $('#fuAds')?.children.length || 0;
    if ($('#fuAdd')) { $('#fuAdd').hidden = FU_ADS(fpkg) === 1; $('#fuAdd').disabled = n >= FU_ADS(fpkg); }
    if ($('#fuPay')) $('#fuPay').textContent = `Zamów za ${FU_PRICE(fpkg)} zł`;
    if ($('#fuInfo')) $('#fuInfo').textContent = fpkg === 'bundle' ? 'CV i list motywacyjny, przygotowanie do rozmowy (12 pytań z odpowiedziami) i symulator rozmowy.' : '';
  };
  box.replaceChildren(el('h3', { textContent: 'Masz kolejne ogłoszenia?' }),
    el('p', { className: 'hint' }, el('span', { textContent: 'Twoje dane już mamy, więc nie wpisujesz ich ponownie. Dokumenty powstaną w tym samym wyglądzie.' }), data.myCode && !data.myCode.usedByMe ? el('span', { textContent: ` Twój kod ${data.myCode.code} obniży cenę o ${data.myCode.mine} zł.` }) : ''),
    pick, el('p', { className: 'hint', id: 'fuInfo' }), el('div', { id: 'fuAds' }),
    el('button', { type: 'button', className: 'btn ghost sm', id: 'fuAdd', textContent: '+ Dodaj ogłoszenie (w pakiecie do 3)', onclick: () => { addRow('fuAds'); drawPick(); } }),
    el('label', { className: 'f fucode' }, 'Kod rabatowy ', el('input', { type: 'text', id: 'fuCode', placeholder: 'opcjonalnie', autocomplete: 'off', value: data.myCode && !data.myCode.usedByMe ? data.myCode.code : '' })),
    el('p', {}, el('button', { type: 'button', className: 'btn', id: 'fuPay', textContent: '', onclick: async (e) => {
      const ads = rows('fuAds'), err = $('#fuErr'), code = $('#fuCode').value.trim();
      if (ads.length > FU_ADS(fpkg)) { err.textContent = 'Ten pakiet obejmuje jedno ogłoszenie. Usuń dodatkowe albo wybierz Pakiet 3.'; return; }
      const bad = ads.find((a) => !a.title || a.text.length < 80);
      if (bad) { err.textContent = 'Podaj nazwę stanowiska i pełną treść ogłoszenia (min. 80 znaków).'; return; }
      e.target.disabled = true; err.textContent = '';
      try {
        const r = await fetch(`/api/orders/${orderId}/followup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkg: fpkg === 'bundle' ? 'cv_letter' : fpkg, addons: fpkg === 'bundle' ? { interview: true, sim: true } : {}, ads, code }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        if (j.free) { delete box.dataset.ready; startResult(j.id); } else if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); delete box.dataset.ready; startResult(j.id); } else location.href = j.url;
      } catch (x) { err.textContent = x.message; e.target.disabled = false; }
    } }), cfg.demo ? el('span', { className: 'hint', textContent: '  Podgląd: płatność jest symulowana.' }) : null),
    el('p', { className: 'err', id: 'fuErr' }));
  addRow('fuAds'); drawPick();
}

// Dodatki po zakupie: osobna płatność tylko za dodatek, potem dodatek pojawia się w tym zamówieniu.
let upsellTimer = null;
const UPSELL_PART = { letter: 'list motywacyjny', interview: 'przygotowanie do rozmowy', sim: 'symulator rozmowy' };
const UPSELL_HINT = { letter: 'List motywacyjny do każdego CV z tego zamówienia, pod to samo ogłoszenie.', interview: 'Pytania z tego ogłoszenia z przykładowymi odpowiedziami, autoprezentacja i lista rzeczy do przygotowania.', sim: 'Rozmowa z AI w roli rekrutera pod to stanowisko, z oceną odpowiedzi.', bundle: 'Wszystko, czego brakuje do rozmowy: list, przygotowanie i symulator razem taniej.' };
function drawUpsell() {
  const box = $('#upsell'), offers = data.upsells || [];
  clearTimeout(upsellTimer);
  if (data.upsellBusy) { box.hidden = false; box.replaceChildren(el('h3', { textContent: 'Przygotowujemy dokupiony dodatek…' }), el('p', { className: 'hint', textContent: 'To zwykle trwa do 2 minut. Strona odświeży się sama, a dokumenty wyślemy też e-mailem.' })); upsellTimer = setTimeout(() => startResult(orderId), 8000); return; }
  box.hidden = !offers.length || data.status !== 'done';
  if (box.hidden) return;
  box.replaceChildren(el('h3', { textContent: 'Dodaj do zamówienia' }), el('p', { className: 'hint', textContent: 'Płacisz tylko za dodatek. Przygotujemy go do tych samych ogłoszeń i dodamy na tej stronie.' }),
    el('div', { className: 'upsell-list' }, ...offers.map((o) => el('div', { className: 'upsell-item' },
      el('div', {}, el('b', { textContent: o.name }), el('p', { className: 'hint', textContent: o.key === 'bundle' ? `Razem taniej: ${(o.includes || []).map((k) => UPSELL_PART[k]).join(', ')}.` : UPSELL_HINT[o.key] || '' })),
      el('button', { type: 'button', className: 'btn sm', textContent: `Dodaj za ${o.price} zł`, onclick: async (e) => {
        const b = e.currentTarget; if (b.disabled) return; b.disabled = true; b.textContent = 'Przechodzę do płatności…';
        try {
          const r = await fetch(`/api/orders/${orderId}/upsell`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: o.key }) }); const j = await r.json();
          if (!r.ok) throw new Error(j.error || 'Nie udało się otworzyć płatności.');
          if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); return startResult(orderId); }
          location.href = j.url;
        } catch (x) { flash(x.message); b.disabled = false; b.textContent = `Dodaj za ${o.price} zł`; }
      } })))));
}
// Kod klienta: −10 zł dla niego na kolejne zamówienie i dla znajomych (każda osoba raz).
function drawMyCode() {
  const box = $('#referral'), k = data.myCode;
  box.hidden = !k;
  if (!k) return;
  const link = cfg.preview ? `https://twojadomena.pl/?ref=${k.code}` : `${location.origin}/?ref=${k.code}`;
  const uk = (window.I18N?.lang || document.documentElement.lang) === 'uk';
  const share = uk ? `У мене резюме під конкретну вакансію з cvpodogloszenie.pl – з моїм кодом ${k.code} у тебе на ${k.discount} зл дешевше: ${link}` : `Mam CV dopasowane do konkretnego ogłoszenia z cvpodogloszenie.pl – z moim kodem ${k.code} masz ${k.discount} zł taniej: ${link}`;
  box.replaceChildren(el('h3', { textContent: `Polecaj i zbieraj ${k.discount} zł za każdego znajomego` }),
    el('p', { className: 'hint', textContent: `Twój kod ${k.code}: znajomi płacą z nim ${k.discount} zł mniej, a Ty za każdego, kto zapłaci, dostajesz ${k.discount} zł na kolejne zamówienia (saldo do 50 zł). Każda osoba może użyć kodu raz. Ważny do ${new Date(k.expires).toLocaleDateString('pl-PL')}.` }),
    el('div', { className: 'refstats' },
      el('div', {}, el('b', { textContent: String(k.referrals || 0) }), el('span', { textContent: 'poleconych znajomych' })),
      el('div', {}, el('b', { textContent: `${k.credit || 0} zł` }), el('span', { textContent: 'saldo do wykorzystania' })),
      el('div', {}, el('b', { textContent: `${k.mine || 0} zł` }), el('span', { textContent: 'mniej przy Twoim kolejnym zamówieniu' }))),
    el('div', { className: 'refrow' }, el('code', { textContent: k.code }), el('input', { type: 'text', readOnly: true, value: link, ariaLabel: 'Link z kodem dla znajomych', onfocus: (e) => e.target.select() }),
      el('button', { type: 'button', className: 'btn sm', textContent: 'Kopiuj link', onclick: async (e) => { track('refshare'); try { await navigator.clipboard.writeText(link); e.target.textContent = 'Skopiowano'; } catch { e.target.previousSibling.select(); e.target.textContent = 'Zaznaczono, skopiuj'; } } })),
    el('div', { className: 'refshare', onclick: (e) => { if (e.target.closest('a,button')) track('refshare'); } },
      navigator.share ? el('button', { type: 'button', className: 'btn ghost sm', textContent: 'Udostępnij', onclick: () => navigator.share({ title: 'CV Pod Ogłoszenie', text: share, url: link }).catch(() => {}) }) : null,
      el('a', { className: 'btn ghost sm', href: `https://wa.me/?text=${encodeURIComponent(share)}`, target: '_blank', rel: 'noopener', textContent: 'WhatsApp' }),
      // Messenger tylko na telefonie (link otwiera aplikację); SMS z gotową treścią (iOS i Android rozumieją ?&body=).
      matchMedia('(pointer: coarse)').matches ? el('a', { className: 'btn ghost sm', href: `fb-messenger://share/?link=${encodeURIComponent(link)}`, textContent: 'Messenger' }) : null,
      el('a', { className: 'btn ghost sm', href: `sms:?&body=${encodeURIComponent(share)}`, textContent: 'SMS' }),
      el('a', { className: 'btn ghost sm', href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(share.replace(link, '').trim())}`, target: '_blank', rel: 'noopener', textContent: 'Telegram' }),
      el('a', { className: 'btn ghost sm', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, target: '_blank', rel: 'noopener', textContent: 'Facebook' }),
      el('a', { className: 'btn ghost sm', href: `mailto:?subject=${encodeURIComponent('CV pod ogłoszenie taniej o ' + k.discount + ' zł')}&body=${encodeURIComponent(share)}`, textContent: 'E-mail' }),
      el('button', { type: 'button', className: 'btn ghost sm', textContent: 'Kopiuj wiadomość', onclick: async (e) => { try { await navigator.clipboard.writeText(share); e.target.textContent = 'Skopiowano'; } catch { e.target.textContent = share; } } }),
      pageLink('program-polecen', { className: 'link', textContent: 'Zasady programu' })));
}

// Konto jest opcjonalne: po zakupie można je założyć jednym kliknięciem (albo założy się samo, jeśli klient zaznaczył to w zamówieniu).
async function drawAcctOffer() {
  const box = $('#acctOffer'); box.hidden = true;
  const link = el('a', { className: 'btn ghost sm', href: '/konto', textContent: 'Przejdź do konta' }); link.dataset.acct = '';
  const done = (t) => { box.replaceChildren(el('h3', { textContent: t }), el('p', { className: 'hint', textContent: 'Zamówienie i dokumenty znajdziesz w zakładce „Moje konto”. Tam też poprowadzisz listę aplikacji z przypomnieniem przed rozmową.' }), link); box.hidden = false; };
  try { const a = await accApi(); if (a.email === data.email?.toLowerCase()) return done('To zamówienie jest na Twoim koncie'); } catch {}
  const create = async () => { try { await accApi('/from-order', { method: 'POST', body: JSON.stringify({ orderId }) }); done('Konto założone'); } catch (x) { flash(x.message, true); } };
  if (data.createAccount) return create();
  const btn = el('button', { className: 'btn sm', type: 'button', textContent: 'Załóż konto jednym kliknięciem', onclick: create });
  box.replaceChildren(el('h3', { textContent: 'Załóż darmowe konto (opcjonalnie)' }),
    el('p', { className: 'hint', textContent: `Bez hasła, na adres ${data.email || 'z zamówienia'}. Zobaczysz tam wszystkie zamówienia i poprowadzisz listę aplikacji z przypomnieniem dzień przed rozmową. Konto możesz usunąć w każdej chwili.` }), btn);
  box.hidden = false;
}

// Ocena po zamówieniu: gwiazdki obowiązkowe, komentarz i zgoda na publikację opcjonalne.
// Link do opinii w Google widzi każdy klient, niezależnie od oceny (Google zabrania zapraszania tylko zadowolonych).
const googleReview = () => (cfg.googleReview ? el('p', { className: 'hint' }, 'Możesz też wystawić opinię w Google: ', el('a', { href: cfg.googleReview, target: '_blank', rel: 'noopener', textContent: 'oceń nas w Google' }), '.') : null);
function drawRate() {
  const box = $('#rate');
  if (data.review) { box.replaceChildren(el('h3', { textContent: 'Dziękujemy za opinię' }), el('p', { className: 'hint', textContent: `Twoja ocena: ${'★'.repeat(data.review.rating)}${'☆'.repeat(5 - data.review.rating)}. Pomaga innym wybrać, a nam poprawiać dokumenty.` }), googleReview() || ''); box.hidden = false; return; }
  let rating = 0;
  const pick = el('div', { className: 'starpick', role: 'radiogroup', ariaLabel: 'Ocena' }, ...[1, 2, 3, 4, 5].map((n) => el('button', { type: 'button', role: 'radio', ariaLabel: `${n} na 5`, ariaChecked: 'false', textContent: '★', onclick: () => { rating = n; $$('button', pick).forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-checked', String(i === n - 1)); }); } })));
  const text = el('textarea', { maxLength: 500, placeholder: 'Co Ci się podobało, a co możemy poprawić? (opcjonalnie)', ariaLabel: 'Komentarz' });
  const name = el('input', { type: 'text', maxLength: 40, placeholder: 'Podpis, np. Anna, magazynierka z Poznania', ariaLabel: 'Podpis' });
  const pub = el('input', { type: 'checkbox' });
  const msg = el('p', { className: 'err', role: 'alert' });
  const send = el('button', { type: 'button', className: 'btn sm', textContent: 'Wyślij opinię', onclick: async () => {
    if (!rating) { msg.textContent = 'Wybierz liczbę gwiazdek.'; return; }
    send.disabled = true; msg.textContent = '';
    try {
      const r = await fetch(`/api/orders/${orderId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, text: text.value, name: name.value, publish: pub.checked }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Nie udało się wysłać opinii.');
      data.review = { rating, text: text.value }; drawRate();
    } catch (x) { msg.textContent = x.message; send.disabled = false; }
  } });
  box.replaceChildren(el('h3', { textContent: 'Jak oceniasz swoje dokumenty?' }), pick, text, name,
    el('label', { className: 'check' }, pub, el('span', { textContent: 'Zgadzam się na publikację opinii z podpisem na stronie (bez nazwiska i e-maila).' })), msg, el('div', {}, send), googleReview() || '');
  box.hidden = false;
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
    $('#print').textContent = `Pobierz PDF: ${{ cv: 'CV', letter: 'list', interview: 'pytania', messages: 'wiadomości', linkedin: 'profil LinkedIn', sim: '' }[curDoc]}`;
    $('#print').hidden = curDoc === 'sim';
    const editable = curDoc === 'cv' || curDoc === 'letter';
    $('#docxBtn').hidden = !(data.addons?.docx && editable);
    $('#docxBtn').href = `/api/orders/${orderId}/docx/${curAd}?doc=${curDoc}${curLang ? '&lang=' + curLang : ''}`;
    $('#docxBtn').onclick = cfg.preview ? (e) => { e.preventDefault(); flash('W podglądzie pobieranie pliku Word jest wyłączone. Na działającej stronie pobierzesz edytowalny plik .docx.'); } : null;
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
  drawFollowup(); drawUpsell(); drawMyCode(); drawRate(); drawAcctOffer();
  draw();
  if (location.hash === '#ocena') setTimeout(() => $('#rate').scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  if (location.hash === '#kolejne') setTimeout(() => $('#followup').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}
$('#newOrder').onclick = () => {
  try { history.replaceState(null, '', location.pathname); } catch {}
  $('#result').hidden = true; landing(true); route();
  resetWizard(); window.scrollTo(0, 0);
};
function resetWizard() { design = { tpl: 'nowoczesny', color: 'niebieski' }; drawWizDesign(); setPhoto(''); restoring = true; $('#wizForm').reset(); ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); addRow(b); }); restoring = false; refresh(); go(ORDER[0]); }

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
async function loadReviews() {
  try {
    const r = await (await fetch('/api/reviews')).json();
    if (!r.list?.length) return;
    $('#rvAvg').replaceChildren(el('b', { textContent: String(r.avg).replace('.', ',') }), el('span', { className: 'stars', textContent: '★'.repeat(Math.round(r.avg)) + '☆'.repeat(5 - Math.round(r.avg)) }), ` średnia z ${r.count} ${r.count === 1 ? 'oceny' : 'ocen'}`);
    $('#rvGrid').replaceChildren(...r.list.map((x) => el('figure', { className: 'rv' }, el('span', { className: 'stars', textContent: '★'.repeat(x.rating) + '☆'.repeat(5 - x.rating), ariaLabel: `${x.rating} na 5` }), el('blockquote', { style: 'margin:0' }, el('p', { textContent: x.text })), el('figcaption', {}, el('small', { textContent: `${x.name} · ${x.pkg} · ${new Date(x.date).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}` })))));
    $('#opinie').hidden = false;
    // Skrót oceny pod przyciskami w nagłówku strony (link do sekcji opinii).
    const st = '★'.repeat(Math.round(r.avg)) + '☆'.repeat(5 - Math.round(r.avg));
    $('#heroRating').replaceChildren(el('span', { className: 'stars', textContent: st, ariaHidden: 'true' }), ' ', el('b', { textContent: String(r.avg).replace('.', ',') }), ' / 5 · ', el('span', { textContent: `${r.count} ${r.count === 1 ? 'opinia' : r.count % 10 >= 2 && r.count % 10 <= 4 && (r.count % 100 < 10 || r.count % 100 >= 20) ? 'opinie' : 'opinii'} klientów` }));
    $('#heroRating').hidden = false;
  } catch {}
}
loadReviews();
(async () => { try { const s = await (await fetch('/api/public-stats')).json(); if (s.cvs) { $('#cvCounter').replaceChildren(el('b', { textContent: s.cvs.toLocaleString('pl-PL') }), ' CV przygotowanych pod konkretne ogłoszenia'); $('#cvCounter').hidden = false; }
  // Wyniki klientów z ankiety: serwer zwraca je dopiero od OUTCOMES_MIN odpowiedzi (lib/outcomes.js), wcześniej nic nie pokazujemy.
  const o = s.outcome; if (o) { $('#outcomeStat').replaceChildren(`${o.pct}% klientów, którzy odpowiedzieli na naszą ankietę i wysłali CV, dostało co najmniej jedno zaproszenie na rozmowę (n=${o.n}, okres ${o.from}–${o.to}).`, ' ', el('a', { href: '/jak-liczymy', textContent: 'Jak liczymy' })); $('#wyniki').hidden = false; }
} catch {} })();

// Pasek „Zacznij” na telefonie: po przewinięciu strony, gdy nie jest otwarte okno ani wynik.
addEventListener('scroll', () => { const show = scrollY > 500 && $('#result').hidden && ($('#account')?.hidden ?? true) && $('#wiz').hidden && document.body.style.overflow !== 'hidden'; $('#mcta').hidden = !show; document.body.classList.toggle('mcta-on', show); }, { passive: true });

async function loadContent() {
  if (!CONTENT) {
    try { CONTENT = await (await fetch('/content.json')).json(); } catch { CONTENT = { INDEX: [], POPULAR: [], ARTICLES: [], CITIES: [] }; }
    // Kafelki narzędzi i linki w stopce: adresy w języku strony (serwer robi to samo dla wersji /en, /uk, /de).
    const l = window.I18N?.lang;
    if (l && l !== 'pl') $$('a[href="/regulamin"]:not([data-lang]),a[href="/polityka-prywatnosci"]:not([data-lang])').forEach((a) => a.setAttribute('href', legalUrl(a.getAttribute('href') === '/regulamin' ? 'regulamin' : 'prywatnosc', l)));
    if (TOOL_SEG[l]) $$('a[data-page^="narzedzia/"]').forEach((a) => { const k = a.dataset.page.slice(10), ts = CONTENT.TOOLS?.[k]?.slugs?.[l]; if (ts) a.setAttribute('href', `/${l}/${TOOL_SEG[l]}/${ts}`); });
  }
  // Poradnik w języku strony (EN / UA / DE): tłumaczenia artykułów ładujemy tylko dla tego języka.
  const l = window.I18N?.lang;
  if (ART_SEG[l] && !CONTENT.artLang) {
    CONTENT.artLang = l;
    try { const tr = await (await fetch(`/content/articles-${l}.json`)).json(); CONTENT.ARTICLES = CONTENT.ARTICLES.map((a) => ({ ...a, ...(tr[a.slug] || {}) })); } catch {}
    // Zawody i miasta w języku strony: nazwy i adresy w indeksie, pełne dane popularnych zawodów, miasta i wzory zdań.
    try {
      const pr = await (await fetch(`/content/prof-${l}.json`)).json();
      CONTENT.prof = pr;
      CONTENT.INDEX = CONTENT.INDEX.map((p) => (pr.index[p.slug] ? { ...p, ...pr.index[p.slug] } : p));
      CONTENT.POPULAR = CONTENT.POPULAR.map((p) => pr.popular[p.slug] || p);
      CONTENT.CITIES = (CONTENT.CITIES || []).map((c) => pr.cities[c.slug] || c);
    } catch {}
  }
  return CONTENT;
}
// Pełna treść artykułu (w języku strony, jeśli jest tłumaczenie); lista w content.json ma tylko tytuły i opisy.
// Treść strony narzędzia w języku strony (tytuł, wstęp, „o narzędziu”, FAQ); same narzędzia działają tak samo.
let TOOLS_TR = null;
async function loadTool(slug, C) {
  const l = window.I18N?.lang, t = C.TOOLS[slug];
  if (!TOOL_SEG[l] || !t.slugs?.[l]) return t;
  if (!TOOLS_TR) { try { TOOLS_TR = await (await fetch(`/content/tools-${l}.json`)).json(); } catch { TOOLS_TR = {}; } }
  return TOOLS_TR[slug] ? { ...t, seoTitle: undefined, ...TOOLS_TR[slug] } : t;
}
async function loadArticle(meta) {
  try { const r = await fetch(`/content/art/${meta.slug}.json${meta.slugLang && CONTENT.artLang ? '?lang=' + CONTENT.artLang : ''}`); if (r.ok) return { ...meta, ...(await r.json()) }; } catch {}
  return { ...meta, sections: [] };
}
async function loadProf(slug) {
  const C = await loadContent(), p = C.POPULAR.find((x) => x.slug === slug);
  if (p) return p;
  try { const r = await fetch(`/content/cv/${slug}.json${C.prof ? '?lang=' + C.artLang : ''}`); if (r.ok) return await r.json(); } catch {}
  return null;
}
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const profResult = (p) => ({ position: p.sample.headline, lang: p.lang || 'pl', keywords: [], cv: {
  name: p.sample.name, headline: p.sample.headline, contact: p.sample.contact, summary: p.sample.summary,
  experience: p.sample.jobs.map((j) => ({ title: j.title, company: j.company, period: j.period, bullets: j.bullets })),
  education: [p.sample.education], skills: p.sample.skills, languages: p.sample.languages || [], certificates: [], interests: '', clause: CLAUSE } });
// Podstrony bez danych z content.json: treść w <template id="pg-…"> w index.html (serwer renderuje ją też dla wyszukiwarek).
const STATIC_PAGES = ['jak-to-dziala', 'dla-firm', 'program-polecen'];
const HOME_TITLE = 'CV pod ogłoszenie i list motywacyjny od 39 zł';
// Publiczny adres podstrony: na wersjach EN / UA / DE strona główna to /<język>, a przetłumaczone artykuły mają własne adresy.
const ART_SEG = { de: 'ratgeber', en: 'guides', uk: 'porady' }, PROF_SEG = { de: 'lebenslauf', en: 'cv', uk: 'rezyume' }, TOOL_SEG = { de: 'tools', en: 'tools', uk: 'instrumenty' };
// Regulamin i polityka prywatności: pełne strony w języku (SSR); stare kotwice #regulamin / #prywatnosc przekierowują.
const LEGAL_URLS = { regulamin: { pl: '/regulamin', en: '/en/terms', uk: '/uk/pravyla', de: '/de/agb' }, prywatnosc: { pl: '/polityka-prywatnosci', en: '/en/privacy-policy', uk: '/uk/polityka-konfidentsiinosti', de: '/de/datenschutz' } };
const legalUrl = (name, l) => LEGAL_URLS[name][l] || LEGAL_URLS[name].pl;
const isLegalPath = (p) => Object.values(LEGAL_URLS).some((m) => Object.values(m).includes(p.replace(/\/$/, '') || '/'));
const pubPath = (r) => {
  const l = window.I18N?.lang;
  if (!ART_SEG[l]) return r;
  if (!r) return l;
  const m = /^poradnik\/([\w-]+)$/.exec(r), a = m && CONTENT?.ARTICLES.find((x) => x.slug === m[1]);
  if (a?.slugLang) return `${l}/${ART_SEG[l]}/${a.slugLang}`;
  const tm = /^narzedzia\/([\w-]+)$/.exec(r), ts = tm && CONTENT?.TOOLS?.[tm[1]]?.slugs?.[l];
  if (ts) return `${l}/${TOOL_SEG[l]}/${ts}`;
  const pm = /^cv\/([\w-]+)(?:\/([\w-]+))?$/.exec(r), P = CONTENT?.prof, ps = pm && P?.index[pm[1]]?.slugLang, cs = pm?.[2] && P?.cities[pm[2]]?.slugLang;
  return ps && (!pm[2] || cs) ? `${l}/${P.seg}/${ps}${cs ? '/' + cs : ''}` : r;
};
const pageHref = (r) => (cfg.preview ? (r ? '#/' + r : '#top') : '/' + pubPath(r));
const pageLink = (r, props, ...kids) => { const a = el('a', { href: pageHref(r), ...props }, ...kids); a.dataset.page = r; return a; };
const openBtn = (t, cls = 'btn') => { const b = el('button', { type: 'button', className: cls, textContent: t }); b.dataset.open = ''; return b; };

async function drawLists() {
  const C = await loadContent();
  $('#profGrid').replaceChildren(...C.POPULAR.map((p, k) => pageLink(`cv/${p.slug}`, { className: 'prof-card' },
    thumb(profResult(p), { tpl: TPLS[k % TPLS.length][0], color: Object.keys(COLORS)[k % 6] }), el('b', { textContent: p.name }))));
  $('#artAll').replaceChildren(...C.ARTICLES.map((a) => pageLink(`poradnik/${a.slug}`, { textContent: a.title })));
  $$('.tool-card[data-page]').forEach((a) => (a.href = pageHref(a.dataset.page)));
  $('#artGrid').replaceChildren(...C.ARTICLES.slice(0, 6).map((a) => pageLink(`poradnik/${a.slug}`, { className: 'art-card' }, el('small', { textContent: `${a.readMinutes} min czytania` }), el('b', { textContent: a.title }), el('span', { textContent: a.lead }))));
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

// Zdania z miastem w języku strony (wzory przychodzą z serwera razem z tłumaczeniem zawodów).
const fillT = (s, p, c) => s.replace(/\{(\w+)\}/g, (_, k) => ({ name: p?.name, low: p?.name?.toLowerCase(), loc: c?.loc, gen: c?.gen, city: c?.name, near: (c?.near || []).join(', ') })[k] ?? '');
// Tłumaczenie elementów strony zawodu, gdy zawód ma tłumaczenie (p.lang); w przeciwnym razie zostaje po polsku.
const pT = (p) => (s) => (p.lang ? window.I18N.t(s) : s);
const kwChips = (p) => el('div', { className: 'kw' }, ...p.keywords.map((k, i) => el('span', {}, k, p.kwPl?.[i] ? el('small', { textContent: p.kwPl[i] }) : null)));
// Odnośnik do powiadomień o ofertach z wpisanym zawodem (i miastem).
const alertLink = (p, c, T) => el('p', { className: 'alert-link' }, '🔔 ', pageLink('narzedzia/oferty-pracy-na-maila', { textContent: T('Dostawaj co tydzień linki do nowych ofert na e-mail'), onclick: () => { window.__alertPrefill = { job: p.name.split(' / ')[0], city: c?.name || '' }; } }), el('span', { className: 'hint', textContent: ' · ' + T('za darmo, 12 tygodni') }));
// Artykuły powiązane z zawodem (pole related w artykułach) + ogólne poradniki; to samo liczy serwer (lib/seo.js).
const articlesFor = (slug, C) => { const own = C.ARTICLES.filter((a) => a.related?.includes(slug)); return [...own, ...C.ARTICLES.filter((a) => ['jak-dopasowac-cv-do-ogloszenia', 'czym-jest-ats', 'jak-napisac-list-motywacyjny'].includes(a.slug) && !own.includes(a))].slice(0, 5); };
function profPage(p, C) {
  const d = { tpl: 'nowoczesny', color: 'niebieski' }, r = profResult(p), T = pT(p), PT = p.lang && C.prof?.tpl;
  const side = el('div', { className: 'side-thumb' }), full = el('div', { className: 'side-full' });
  const paint = () => { side.replaceChildren(thumb(r, d, false, '')); full.replaceChildren(cvNode(r, false, d, '')); };
  const picker = el('div'); designPicker(picker, d, paint, { thumbs: false }); paint();
  return el('div', { className: 'inner', lang: p.lang || 'pl' },
    el('nav', { className: 'crumbs', ariaLabel: T('Ścieżka') }, pageLink('', { textContent: T('Strona główna') }), '›', el('a', { href: '#zawody', textContent: T('CV dla zawodów') }), '›', el('span', { textContent: p.name })),
    el('h1', { textContent: p.title }), el('p', { className: 'lead', textContent: p.intro }),
    el('div', { className: 'page-grid' },
      el('div', {},
        el('h2', { textContent: T('Słowa kluczowe z ogłoszeń') }), el('p', { className: 'hint', textContent: T('Te sformułowania często pojawiają się w ofertach. Jeśli to prawda o Tobie, użyj ich w CV w takim samym brzmieniu.') + (PT ? ' ' + PT.kwPl : '') }),
        kwChips(p),
        el('h2', { textContent: T('Wskazówki do CV') }), el('ol', { className: 'tips' }, ...p.tips.map((t) => el('li', { textContent: t }))),
        el('h2', { textContent: T('Przykładowe CV') }), el('p', { className: 'hint', textContent: T('Dane w przykładzie są fikcyjne. Szablon i kolor zmienisz w panelu obok.') }), full,
        el('h2', { textContent: T('Pytania') }), ...p.faq.map((f) => el('details', {}, el('summary', { textContent: f.q }), el('p', { textContent: f.a }))),
        el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: T('Masz konkretne ogłoszenie?') }), el('p', { className: 'hint', textContent: T('Wklej link, a przygotujemy CV pisane pod nie. Od 39 zł, z darmową poprawką.') })), openBtn(T('Zamów CV'))),
        alertLink(p, null, T),
        ...(C.POPULAR.some((x) => x.slug === p.slug) && C.CITIES?.length ? [el('h2', { textContent: PT ? fillT(PT.inCity, p) : `${p.name} w Twoim mieście` }), el('div', { className: 'more' }, ...C.CITIES.map((x) => pageLink(`cv/${p.slug}/${x.slug}`, { textContent: x.name })))] : []),
        el('h2', { textContent: T('Przeczytaj w poradniku') }), el('div', { className: 'more' }, ...articlesFor(p.slug, C).map((x) => pageLink(`poradnik/${x.slug}`, { textContent: x.title }))),
        el('h2', { textContent: T('Podobne zawody') }), el('div', { className: 'more' }, ...C.INDEX.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => pageLink(`cv/${x.slug}`, { textContent: x.name })), el('a', { href: '#zawody', textContent: T('Wszystkie zawody') }))),
      el('aside', { className: 'side-card' }, el('b', { textContent: p.lang ? T(`Przykład: ${p.sample.name}`) : `Przykład: ${p.sample.name}` }), side, picker, openBtn(T('Zamów CV pod swoje ogłoszenie')), el('p', { className: 'hint', textContent: T('Raport dopasowania, darmowa poprawka, PDF w e-mailu.') }))));
}
// --- Darmowe narzędzia ---
const CLAUSES = {
  pl: ['Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji{FIRMA} zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.', 'Wyrażam również zgodę na przetwarzanie moich danych osobowych{FIRMA} w celu przyszłych procesów rekrutacyjnych.', ' przez {X}'],
  en: ['I hereby consent to the processing of my personal data{FIRMA} for the purposes of the recruitment process in accordance with Art. 6(1)(a) of Regulation (EU) 2016/679 (GDPR).', 'I also consent to the processing of my personal data{FIRMA} for the purposes of future recruitment processes.', ' by {X}'],
  de: ['Ich willige in die Verarbeitung meiner personenbezogenen Daten{FIRMA} für die Zwecke des Bewerbungsverfahrens gemäß Art. 6 Abs. 1 lit. a der Verordnung (EU) 2016/679 (DSGVO) ein.', 'Ich willige außerdem in die Verarbeitung meiner personenbezogenen Daten{FIRMA} für zukünftige Bewerbungsverfahren ein.', ' durch {X}'],
};
const money = (v) => v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
// Umowa o pracę, zasady od 2022 r.: składki pracownika 13,71%, zdrowotna 9% (bez odliczenia), PIT 12% minus 300 zł/mies., koszty 250 lub 300 zł.
function netOf(gross, { young = false, commute = false } = {}) {
  const r = (x) => Math.round(x * 100) / 100;
  const zus = { em: r(gross * 0.0976), re: r(gross * 0.015), ch: r(gross * 0.0245) }, zusSum = r(zus.em + zus.re + zus.ch);
  const health = r((gross - zusSum) * 0.09), base = Math.max(0, Math.round(gross - zusSum - (commute ? 300 : 250)));
  const pit = young ? 0 : Math.max(0, Math.round(base * 0.12 - 300));
  return { zus, zusSum, health, pit, net: r(gross - zusSum - health - pit), yearly: gross * 12 };
}
// --- Wypowiedzenie umowy o pracę (art. 34 i 36 KP) ---
const dPL = (d) => d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const parseD = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
const isoD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Okres w tygodniach kończy się w sobotę, w miesiącach ostatniego dnia miesiąca (art. 30 § 2¹ KP).
function noticeOf(kind, from, letter, trial) {
  if (kind === 'proba') return trial === 'short' ? { text: '3 dni robocze', end: null } : trial === 'mid' ? { text: '1 tydzień', weeks: 1 } : { text: '2 tygodnie', weeks: 2 };
  const months = from && letter ? (letter.getFullYear() - from.getFullYear()) * 12 + (letter.getMonth() - from.getMonth()) - (letter.getDate() < from.getDate() ? 1 : 0) : 0;
  return months < 6 ? { text: '2 tygodnie', weeks: 2 } : months < 36 ? { text: '1 miesiąc', months: 1 } : { text: '3 miesiące', months: 3 };
}
function noticeEnd(n, letter) {
  if (!letter || (!n.weeks && !n.months)) return null;
  if (n.months) return new Date(letter.getFullYear(), letter.getMonth() + n.months + 1, 0);
  const d = new Date(letter); d.setDate(d.getDate() + 7 * n.weeks); while (d.getDay() !== 6) d.setDate(d.getDate() + 1); return d;
}
const printText = (title, text) => {
  const w = window.open('', '_blank'); if (!w) return alert('Przeglądarka zablokowała okno wydruku. Skopiuj tekst i wklej go do edytora.');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{font:12pt/1.6 Georgia,serif;margin:2.5cm;white-space:pre-wrap}</style>`); w.document.body.textContent = text; w.document.close(); w.focus(); w.print();
};
function toolNotice(box, out, field) {
  const today = isoD(new Date());
  const v = { name: el('input', { type: 'text', placeholder: 'Anna Kowalska', autocomplete: 'name' }), addr: el('input', { type: 'text', placeholder: 'ul. Lipowa 5, 65-001 Zielona Góra (opcjonalnie)' }), place: el('input', { type: 'text', placeholder: 'Zielona Góra' }), date: el('input', { type: 'date', value: today }),
    firm: el('input', { type: 'text', placeholder: 'ABC Sp. z o.o.' }), firmAddr: el('input', { type: 'text', placeholder: 'ul. Przemysłowa 1, 65-001 Zielona Góra (opcjonalnie)' }),
    kind: el('select', {}, ...[['nieokreslony', 'na czas nieokreślony'], ['okreslony', 'na czas określony'], ['proba', 'na okres próbny'], ['porozumienie', 'za porozumieniem stron (wniosek)']].map(([a, b]) => el('option', { value: a, textContent: b }))),
    signed: el('input', { type: 'date' }), since: el('input', { type: 'date' }), trial: el('select', {}, ...[['short', 'do 2 tygodni'], ['mid', 'dłuższy niż 2 tygodnie'], ['long', '3 miesiące']].map(([a, b]) => el('option', { value: a, textContent: b }))),
    endAgreed: el('input', { type: 'date' }), leave: el('input', { type: 'checkbox' }), shorten: el('input', { type: 'checkbox' }) };
  const fSince = field('Pracuję u tego pracodawcy od', v.since), fTrial = field('Okres próbny trwa', v.trial), fEnd = field('Proponowana data rozwiązania umowy', v.endAgreed);
  const info = el('p', { className: 'perk small' }), cShorten = el('label', { className: 'check' }, v.shorten, el('span', { textContent: 'Zaproponuj pracodawcy skrócenie okresu wypowiedzenia (porozumienie stron)' })), cLeave = el('label', { className: 'check' }, v.leave, el('span', { textContent: 'Poproś o wykorzystanie zaległego urlopu w okresie wypowiedzenia' }));
  const draw = () => {
    const k = v.kind.value, letter = parseD(v.date.value), since = parseD(v.since.value) || parseD(v.signed.value), agreed = k === 'porozumienie';
    fSince.hidden = agreed || k === 'proba'; fTrial.hidden = k !== 'proba'; fEnd.hidden = !agreed && !v.shorten.checked; cShorten.hidden = agreed; cLeave.hidden = agreed;
    const n = noticeOf(k, since, letter, v.trial.value), end = noticeEnd(n, letter), signed = parseD(v.signed.value);
    info.textContent = agreed ? 'Rozwiązanie za porozumieniem stron wymaga zgody pracodawcy: umowa kończy się w dniu, na który się zgodzicie.' : `Okres wypowiedzenia: ${n.text}${end ? `, koniec umowy: ${dPL(end)}` : ''}.${k !== 'proba' ? ' Liczy się cały staż u tego pracodawcy, także na wcześniejszych umowach.' : ''}`;
    const kindTxt = { nieokreslony: 'na czas nieokreślony', okreslony: 'na czas określony', proba: 'na okres próbny', porozumienie: '' }[k];
    const head = [`${v.place.value.trim() || '[miejscowość]'}, ${letter ? dPL(letter) : '[data]'}`, '', v.name.value.trim() || '[imię i nazwisko]', v.addr.value.trim(), '', '', v.firm.value.trim() || '[nazwa pracodawcy]', v.firmAddr.value.trim(), ''].filter((x, i, a) => x !== '' || a[i - 1] !== '');
    const contract = `umowy o pracę zawartej w dniu ${signed ? dPL(signed) : '[data zawarcia umowy]'}`;
    const endAgreed = parseD(v.endAgreed.value) ? dPL(parseD(v.endAgreed.value)) : '[data]';
    const body = agreed
      ? ['Wniosek o rozwiązanie umowy o pracę za porozumieniem stron', '', `Zwracam się z prośbą o rozwiązanie ${contract} za porozumieniem stron z dniem ${endAgreed}.`]
      : ['Wypowiedzenie umowy o pracę', '', `Niniejszym wypowiadam umowę o pracę ${kindTxt} zawartą w dniu ${signed ? dPL(signed) : '[data zawarcia umowy]'}, z zachowaniem okresu wypowiedzenia wynoszącego ${n.text}${end ? `, który upływa w dniu ${dPL(end)}` : ''}.`,
        ...(v.leave.checked ? ['', 'Proszę o udzielenie mi przysługującego urlopu wypoczynkowego w okresie wypowiedzenia.'] : []),
        ...(v.shorten.checked ? ['', `Jednocześnie proponuję rozwiązanie umowy za porozumieniem stron z dniem ${endAgreed}.`] : [])];
    out.textContent = [...head, ...body, '', '', '', '.................................................', '(podpis pracownika)', '', '', 'Potwierdzam odbiór w dniu ........................', '', '.................................................', '(podpis i pieczęć pracodawcy)'].join('\n');
  };
  Object.values(v).forEach((i) => i.addEventListener('input', draw)); draw();
  box.append(el('div', { className: 'tool-form' }, field('Imię i nazwisko', v.name), field('Twój adres', v.addr), field('Miejscowość', v.place), field('Data pisma', v.date), field('Pracodawca', v.firm), field('Adres pracodawcy', v.firmAddr), field('Rodzaj umowy', v.kind), field('Data zawarcia umowy', v.signed), fSince, fTrial, fEnd),
    cShorten, cLeave, info, out, el('div', { className: 'tool-btns' }, copyBtn2(out), el('button', { type: 'button', className: 'btn sm', textContent: 'Drukuj', onclick: () => printText('Wypowiedzenie umowy o pracę', out.textContent) })),
    el('p', { className: 'hint', textContent: 'Złóż pismo w dwóch egzemplarzach i poproś o potwierdzenie odbioru na Twojej kopii albo wyślij je listem poleconym. Okres wypowiedzenia liczy się od dnia, w którym pracodawca odebrał pismo. Wzór ma charakter informacyjny i nie zastępuje porady prawnej; w razie wątpliwości zapytaj w kadrach albo w Państwowej Inspekcji Pracy.' }));
}

// --- Ocena zdjęcia do CV (AI, zdjęcia nie zapisujemy) ---
function toolPhoto(box, out) {
  const prev = el('div', { className: 'ph-prev', hidden: true }), status = el('p', { className: 'fstatus', role: 'status' });
  const file = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
  out.hidden = true;
  file.onchange = async () => {
    const f = file.files[0]; if (!f) return;
    status.className = 'fstatus'; status.textContent = 'Oceniamy zdjęcie…'; out.hidden = true;
    try {
      const img = await shrinkImage(f, 1000);
      prev.hidden = false; prev.replaceChildren(el('img', { src: img, alt: 'Twoje zdjęcie' }));
      const r = await fetch('/api/tools/photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: img, lang: window.I18N?.lang || 'pl' }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      status.textContent = '';
      out.hidden = false;
      out.replaceChildren(el('div', { className: 'net-big' }, el('small', { textContent: 'Ocena zdjęcia do CV' }), el('b', { textContent: `${j.score}/10` })), el('p', { textContent: j.verdict }),
        j.good.length ? el('div', {}, el('b', { textContent: 'Co jest dobrze' }), el('ul', {}, ...j.good.map((t) => el('li', { textContent: t })))) : '',
        j.improve.length ? el('div', {}, el('b', { textContent: 'Co poprawić' }), el('ul', {}, ...j.improve.map((t) => el('li', { textContent: t })))) : '');
    } catch (e) { status.className = 'fstatus bad'; status.textContent = e.message; }
    file.value = '';
  };
  box.append(el('div', { className: 'ph-row' }, prev, el('div', {}, el('label', { className: 'btn filebtn' }, 'Wgraj zdjęcie', file), el('p', { className: 'hint', textContent: 'JPG, PNG lub WebP. Zdjęcie jest oceniane i od razu odrzucane, nie zapisujemy go. Limit: 5 ocen na godzinę.' }))), status, out,
    el('details', { className: 'tips-more' }, el('summary', { textContent: 'Jak zrobić dobre zdjęcie do CV telefonem' }), el('ol', { className: 'tips' }, ...['Stań przodem do okna, w dzień, bez lampy błyskowej.', 'Tło: jasna, gładka ściana albo drzwi.', 'Poproś kogoś o zdjęcie z odległości ok. 1,5 m, telefon na wysokości oczu (nie selfie z ręki).', 'Kadr: głowa i ramiona, wzrok w obiektyw, lekki uśmiech.', 'Strój jak na rozmowę w tej branży: gładka koszula, bluzka lub sweter.', 'Bez filtrów i retuszu: zdjęcie ma Cię przypominać na rozmowie.'].map((t) => el('li', { textContent: t })))));
}

// --- Pytania rekrutera (AI): przykładowa odpowiedź pod stanowisko ---
function toolAnswer(box, out, field, questions) {
  const q = el('select', {}, ...questions.map((x) => el('option', { value: x, textContent: x }))), pos = el('input', { type: 'text', placeholder: 'np. magazynier, sprzedawca, księgowa' }), facts = el('textarea', { rows: 4, placeholder: 'np. 3 lata pracy w hurtowni, kompletacja zamówień ze skanerem, uprawnienia UDT; chcę pracować bliżej domu' });
  const status = el('p', { className: 'fstatus', role: 'status' }), go = el('button', { type: 'button', className: 'btn', textContent: 'Pokaż przykładową odpowiedź' });
  out.hidden = true;
  go.onclick = async () => {
    status.className = 'fstatus'; status.textContent = 'Piszemy odpowiedź…'; go.disabled = true;
    try {
      const r = await fetch('/api/tools/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.value, position: pos.value, facts: facts.value, lang: window.I18N?.lang || 'pl' }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      status.textContent = ''; out.hidden = false;
      out.replaceChildren(el('p', { className: 'hint', textContent: `Co sprawdza rekruter: ${j.why}` }), el('p', { textContent: j.answer }), j.tips.length ? el('div', {}, el('b', { textContent: 'Czego unikać' }), el('ul', {}, ...j.tips.map((t) => el('li', { textContent: t })))) : '');
    } catch (e) { status.className = 'fstatus bad'; status.textContent = e.message; }
    go.disabled = false;
  };
  box.append(el('div', { className: 'tool-form' }, field('Pytanie rekrutera', q), field('Stanowisko', pos)), field('Kilka faktów o Tobie (opcjonalnie)', facts), el('div', {}, go), status, out,
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Chcesz komplet odpowiedzi pod konkretne ogłoszenie?' }), el('p', { className: 'hint', textContent: 'Przygotowanie do rozmowy: 12 pytań, które mogą paść przy Twoim ogłoszeniu, z odpowiedziami z Twojego doświadczenia. Dodatek do CV.' })), (() => { const b = openBtn('Zamów z przygotowaniem'); b.dataset.pkg = 'cv_letter'; b.dataset.addon = 'Interview'; return b; })()));
}

// --- Quiz „Jaki zawód do mnie pasuje?” ---
// Cechy: P ludzie, S sprzedaż, C opieka, H praca fizyczna i ręczna, M ruch i teren, T technologie, O porządek i liczby, K kreatywność, L kierowanie.
const TRAITS = { P: 'praca z ludźmi', S: 'sprzedaż i negocjacje', C: 'pomaganie innym', H: 'praca fizyczna i ręczna', M: 'praca w ruchu i w terenie', T: 'technologie i komputer', O: 'dokładność i porządek', K: 'kreatywność', L: 'kierowanie zespołem' };
const PROF_T = { kasjer: 'P2O1', sprzedawca: 'P2S1', 'obsluga-klienta': 'P2T1', 'przedstawiciel-handlowy': 'S2M2P1', 'kierownik-sklepu': 'L2P1S1', merchandiser: 'M1K1H1', 'konsultant-call-center': 'P1S1T1', 'doradca-bankowy': 'P1S1O1', 'agent-nieruchomosci': 'S2M1P1',
  magazynier: 'H2O1', kierowca: 'M2H1', 'operator-wozka-widlowego': 'H2O1', kurier: 'M2H1', spedytor: 'O1T1P1', 'kierownik-magazynu': 'L2O1', 'specjalista-zakupow': 'O1S1T1',
  pielegniarka: 'C2O1', 'opiekun-osob-starszych': 'C2H1', fizjoterapeuta: 'C2H1', 'ratownik-medyczny': 'C2M1', 'technik-farmaceutyczny': 'O2C1', 'opiekunka-dziecieca': 'C2K1',
  ksiegowa: 'O2T1', recepcjonistka: 'P2O1', 'asystentka-biura': 'O2P1', 'specjalista-kadr-i-plac': 'O2T1', rekruter: 'P2S1', programista: 'T2O1', 'analityk-danych': 'T2O2', 'tester-oprogramowania': 'T2O1', 'kierownik-projektu': 'L2T1', 'specjalista-helpdesk': 'T2P1',
  elektryk: 'H2T1', hydraulik: 'H2M1', 'pracownik-budowlany': 'H2M1', 'inzynier-budowy': 'L1T1H1O1', fryzjer: 'K2P1H1', 'pracownik-sprzatajacy': 'H2O1', 'pracownik-ochrony': 'M1O1', nauczyciel: 'P2C1L1',
  kucharz: 'K1H2', kelner: 'P2H1', barista: 'P1K1H1', pokojowka: 'H2O1', 'pracownik-produkcji': 'H2O1', spawacz: 'H2T1', 'mechanik-samochodowy': 'H2T1', grafik: 'K2T1', 'specjalista-marketingu': 'K1S1T1', 'social-media-manager': 'K2T1P1' };
const QUIZ = [
  ['Co daje Ci najwięcej satysfakcji w pracy?', [['Rozmowa z ludźmi i pomoc im', 'P1C1'], ['Coś, co zrobiłem własnymi rękami', 'H2'], ['Rozwiązany problem na komputerze', 'T2'], ['Coś, co sam wymyśliłem i zaprojektowałem', 'K2']]],
  ['Gdzie wolisz pracować?', [['W biurze, przy biurku', 'O1T1'], ['W ruchu, w terenie, za kółkiem', 'M2'], ['Wśród ludzi: sklep, restauracja, recepcja', 'P2'], ['W warsztacie, magazynie lub na budowie', 'H2']]],
  ['Jak podchodzisz do liczb i dokumentów?', [['Lubię, kiedy wszystko zgadza się co do grosza', 'O2'], ['Mogą być, ale bez przesady', 'O1'], ['Wolę ich unikać', 'H1P1']]],
  ['Klient jest niezadowolony. Co robisz?', [['Spokojnie przekonuję go do rozwiązania', 'S2P1'], ['Cierpliwie słucham i pomagam', 'C2P1'], ['Wolę pracę bez kontaktu z klientami', 'H1T1O1']]],
  ['Czy chcesz kierować innymi?', [['Tak, lubię organizować pracę zespołu', 'L2'], ['Może kiedyś', 'L1'], ['Nie, wolę robić swoje', 'H1T1']]],
  ['Jak podchodzisz do pracy fizycznej?', [['Lubię być w ruchu i się zmęczyć', 'H2'], ['Trochę ruchu jest w porządku', 'M1H1'], ['Wolę pracę siedzącą', 'T1O1']]],
  ['Jak radzisz sobie z nowymi technologiami?', [['Świetnie, sam się uczę nowych programów', 'T2'], ['Obsługuję to, czego potrzebuję', 'T1'], ['Wolę pracę, w której ich nie potrzebuję', 'H1C1']]],
  ['Co jest dla Ciebie najważniejsze?', [['Pomaganie i sens pracy', 'C2'], ['Wynik, cel i premia za sprzedaż', 'S2'], ['Spokój i przewidywalność', 'O2'], ['Możliwość tworzenia', 'K2']]],
  ['Ile chcesz się uczyć, zanim zaczniesz pracę?', [['Chcę zacząć od razu i uczyć się na miejscu', 'H1P1'], ['Kurs lub uprawnienia, kilka tygodni', 'M1H1'], ['Mogę uczyć się dłużej, np. w szkole lub na studiach', 'T1C1O1']]],
  ['Które zdanie najlepiej Cię opisuje?', [['Jestem dokładny i systematyczny', 'O2'], ['Jestem towarzyski i łatwo nawiązuję kontakty', 'P1S1'], ['Jestem zaradny i dobrze mi idzie praca rękami', 'H2'], ['Jestem kreatywny i mam dobre oko', 'K2']]],
];
const traitVec = (s) => { const v = {}; for (const [, k, n] of String(s).matchAll(/([A-Z])(\d)/g)) v[k] = (v[k] || 0) + +n; return v; };
function toolQuiz(box, out, C) {
  const picked = new Array(QUIZ.length).fill(null), status = el('p', { className: 'fstatus', role: 'status' });
  out.hidden = true;
  const qs = QUIZ.map(([q, answers], i) => el('fieldset', { className: 'quiz-q' }, el('legend', { textContent: `${i + 1}. ${q}` }),
    ...answers.map(([a, t], j) => el('label', { className: 'check' }, el('input', { type: 'radio', name: `quiz${i}`, value: j, onchange: () => { picked[i] = t; status.textContent = ''; } }), el('span', { textContent: a })))));
  const show = () => {
    if (picked.some((x) => !x)) { status.className = 'fstatus bad'; status.textContent = `Odpowiedz na wszystkie pytania (brakuje: ${picked.filter((x) => !x).length}).`; return; }
    const me = {}; picked.forEach((t) => Object.entries(traitVec(t)).forEach(([k, n]) => (me[k] = (me[k] || 0) + n)));
    const norm = (v) => Math.sqrt(Object.values(v).reduce((s, n) => s + n * n, 0)) || 1;
    const ranked = (C.INDEX || []).filter((p) => PROF_T[p.slug]).map((p) => { const v = traitVec(PROF_T[p.slug]); return { p, v, s: Object.entries(v).reduce((s, [k, n]) => s + n * (me[k] || 0), 0) / norm(v) / norm(me) }; }).sort((a, b) => b.s - a.s).slice(0, 3);
    const mine = Object.entries(me).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => TRAITS[k]);
    out.hidden = false;
    out.replaceChildren(el('p', {}, el('b', { textContent: 'Twoje mocne preferencje: ' }), mine.join(', ') + '.'),
      el('div', { className: 'quiz-res' }, ...ranked.map(({ p, v, s }, i) => el('div', { className: 'quiz-card' }, el('small', { textContent: `${i + 1}. dopasowanie ${Math.round(s * 100)}%` }), el('b', { textContent: p.name }),
        el('p', { className: 'hint', textContent: 'Ten zawód to: ' + Object.keys(v).map((k) => TRAITS[k]).join(', ') + '.' }), pageLink(`cv/${p.slug}`, { className: 'btn ghost sm', textContent: 'Jak napisać CV' })))),
      el('p', { className: 'hint', textContent: 'Wynik to podpowiedź, a nie test psychologiczny. Sprawdź ogłoszenia w tych zawodach i wybierz to, co Cię ciekawi.' }));
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  box.append(...qs, el('div', {}, el('button', { type: 'button', className: 'btn', textContent: 'Pokaż wynik', onclick: show })), status, out);
}

// --- Oferty pracy na e-mail (lib/alerts.js): zapis z podwójną zgodą ---
function toolAlerts(box, out, field) {
  const pre = window.__alertPrefill || {}; window.__alertPrefill = null;
  const job = el('input', { type: 'text', placeholder: 'np. magazynier', value: pre.job || '' }), city = el('input', { type: 'text', placeholder: 'np. Zielona Góra (opcjonalnie)', value: pre.city || '' }), email = el('input', { type: 'email', autocomplete: 'email', placeholder: 'twoj@email.pl' });
  const consent = el('input', { type: 'checkbox' }), trap = el('input', { type: 'text', name: 'website', tabIndex: -1, autocomplete: 'off', className: 'hp', ariaHidden: 'true' }), status = el('p', { className: 'fstatus', role: 'status' });
  const go = el('button', { type: 'button', className: 'btn', textContent: 'Włącz powiadomienia' });
  out.hidden = true;
  go.onclick = async () => {
    status.className = 'fstatus'; status.textContent = 'Zapisujemy…'; go.disabled = true;
    try {
      const r = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job: job.value, city: city.value, email: email.value, consent: consent.checked, website: trap.value, lang: window.I18N?.lang || 'pl' }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      status.className = 'fstatus good'; status.textContent = 'Sprawdź skrzynkę i kliknij link w e-mailu, żeby włączyć powiadomienia. Bez potwierdzenia nic nie wyślemy.';
      if (j.demoLink) status.append(' ', el('a', { href: j.demoLink, textContent: '(podgląd: potwierdź)' }));
    } catch (e) { status.className = 'fstatus bad'; status.textContent = e.message; }
    go.disabled = false;
  };
  box.append(el('div', { className: 'tool-form' }, field('Zawód lub stanowisko', job), field('Miasto', city), field('E-mail', email)), trap,
    el('label', { className: 'check' }, consent, el('span', { textContent: 'Chcę dostawać raz w tygodniu e-mail z linkami do ofert pracy dla wybranego zawodu i miasta oraz wskazówkami o CV, przez 12 tygodni. Zgodę mogę wycofać w każdej chwili linkiem w każdej wiadomości.' })),
    el('div', {}, go), status,
    el('p', { className: 'perk small', textContent: 'Po potwierdzeniu zapisu dostaniesz kod −10 zł na CV.' }),
    el('p', { className: 'hint', textContent: 'Nie pobieramy ofert z portali: w e-mailu są linki do aktualnych wyników wyszukiwania na Pracuj.pl, OLX i Indeed, ustawione na Twój zawód i miasto. Możesz mieć do 3 takich powiadomień.' }));
}
// --- thankYouText: treść podziękowania po rozmowie (czysta funkcja; test/thanks.test.js wczytuje ten fragment) ---
// Kropka na końcu zdania tylko wtedy, gdy wpisany tekst sam się nią nie kończy (np. „Sp. z o.o.”).
const endDot = (s) => (/[.!?…]$/.test(s) ? s : s + '.');
function thankYouText(v) {
  const t = (x) => String(x || '').trim();
  const p = t(v.pos) || '[stanowisko]', f = t(v.firm) || '[firma]', n = t(v.name) || '[imię i nazwisko]', who = t(v.who), topic = t(v.topic);
  const g = v.gender === 'f' ? ['przekonana', 'chciałabym'] : v.gender === 'm' ? ['przekonany', 'chciałbym'] : ['przekonany/a', 'chciałbym/chciałabym'];
  return `Temat: Podziękowanie za rozmowę – ${p}

${who ? 'Szanowna ' + who.replace(/^szanown[ya]\s+/i, '') + ',' : 'Dzień dobry,'}

${endDot(`dziękuję za dzisiejszą rozmowę i czas poświęcony na przedstawienie stanowiska ${p} w ${f}`)}${topic ? ' ' + endDot(`Szczególnie zainteresowała mnie rozmowa o ${topic}`) : ''} Po spotkaniu jestem jeszcze bardziej ${g[0]}, że ${g[1]} dołączyć do Państwa zespołu.

Jeśli potrzebują Państwo dodatkowych informacji lub dokumentów, chętnie je prześlę.

Z poważaniem,
${n}`;
}
// --- koniec thankYouText ---
function toolPage(slug, C, item) {
  const t = item || C.TOOLS[slug], box = el('div', { className: 'tool-box' });
  // Generowane dokumenty są po polsku (do polskiego pracodawcy): w wersjach obcych mówimy to nad wynikiem.
  const plNote = () => ((window.I18N?.lang || 'pl') !== 'pl' && ['podziekowanie-po-rozmowie', 'wypowiedzenie-umowy-o-prace'].includes(slug) ? el('p', { className: 'pl-note' }, el('span', { textContent: 'To dokument po polsku, do polskiego pracodawcy. Skopiuj go i wyślij bez tłumaczenia.' })) : null);
  const out = el('div', { className: 'msgbox tool-out' });
  // Wynik to interfejs (liczby, etykiety, odpowiedź AI w języku strony), więc tłumaczy się; dokumenty po polsku zostają po polsku.
  if (!['klauzula-rodo', 'podziekowanie-po-rozmowie', 'wypowiedzenie-umowy-o-prace'].includes(slug)) out.setAttribute('data-i18n', '');
  const field = (label, input) => el('label', { className: 'f' }, label, input);
  if (slug === 'klauzula-rodo') {
    const firm = el('input', { type: 'text', placeholder: 'np. ABC Sp. z o.o. (opcjonalnie)' }), lang = el('select', {}, ...[['pl', 'polski'], ['en', 'angielski'], ['de', 'niemiecki']].map(([v, n]) => el('option', { value: v, textContent: n })));
    const future = el('input', { type: 'checkbox' });
    const draw = () => { const c = CLAUSES[lang.value], f = firm.value.trim() ? c[2].replace('{X}', firm.value.trim()) : ''; out.textContent = c[0].replace('{FIRMA}', f) + (future.checked ? ' ' + c[1].replace('{FIRMA}', f) : ''); };
    [firm, lang, future].forEach((i) => i.addEventListener('input', draw)); draw();
    box.append(el('div', { className: 'tool-form' }, field('Nazwa firmy', firm), field('Język', lang)), el('label', { className: 'check' }, future, el('span', { textContent: 'Dodaj zgodę na udział w przyszłych rekrutacjach tej firmy' })), out, copyBtn2(out),
      el('p', { className: 'hint', textContent: 'Klauzulę umieść na samym dole CV, małą czcionką. Jeśli ogłoszenie podaje inne brzmienie, skopiuj to z ogłoszenia.' }));
  } else if (slug === 'kalkulator-wynagrodzen') {
    const gross = el('input', { type: 'number', min: 0, step: 100, value: 6000, inputMode: 'decimal' }), young = el('input', { type: 'checkbox' }), commute = el('input', { type: 'checkbox' });
    const draw = () => {
      const g = Math.max(0, +gross.value || 0), x = netOf(g, { young: young.checked, commute: commute.checked });
      out.replaceChildren(...[el('div', { className: 'net-big' }, el('small', { textContent: 'Na rękę (netto) miesięcznie' }), el('b', { textContent: money(x.net) })),
        el('dl', { className: 'net-rows' }, ...[['Brutto', g], ['Emerytalna 9,76%', -x.zus.em], ['Rentowa 1,5%', -x.zus.re], ['Chorobowa 2,45%', -x.zus.ch], ['Zdrowotna 9%', -x.health], ['Zaliczka na PIT', -x.pit]].flatMap(([k, v]) => [el('dt', { textContent: k }), el('dd', { textContent: money(v) })])),
        x.yearly > 120000 && !young.checked ? el('p', { className: 'hint', textContent: 'Po przekroczeniu 120 000 zł dochodu w roku nadwyżkę obejmuje stawka 32%, więc w ostatnich miesiącach roku netto będzie niższe.' }) : null].filter(Boolean));
    };
    [gross, young, commute].forEach((i) => i.addEventListener('input', draw)); draw();
    box.append(el('div', { className: 'tool-form' }, field('Wynagrodzenie brutto miesięcznie (zł)', gross)),
      el('label', { className: 'check' }, young, el('span', { textContent: 'Mam mniej niż 26 lat (ulga dla młodych, bez PIT do limitu rocznego)' })),
      el('label', { className: 'check' }, commute, el('span', { textContent: 'Dojeżdżam z innej miejscowości (koszty 300 zł zamiast 250 zł)' })), out,
      el('p', { className: 'hint', textContent: 'Wynik szacunkowy dla umowy o pracę, według zasad podatkowych obowiązujących od 2022 r. (skala 12% i 32%, kwota wolna 30 000 zł). Nie uwzględnia PPK, limitu składek ZUS przy bardzo wysokich zarobkach ani innych ulg. Przed decyzją sprawdź aktualne przepisy lub zapytaj pracodawcę.' }));
  } else if (slug === 'wypowiedzenie-umowy-o-prace') toolNotice(box, out, field);
  else if (slug === 'skaner-cv') toolScan(box);
  else if (slug === 'zdjecie-do-cv') toolPhoto(box, out);
  else if (slug === 'odpowiedzi-na-pytania-rekrutera') toolAnswer(box, out, field, t.questions || []);
  else if (slug === 'jaki-zawod-dla-mnie') toolQuiz(box, out, C);
  else if (slug === 'oferty-pracy-na-maila') toolAlerts(box, out, field);
  else {
    const name = el('input', { type: 'text', placeholder: 'Anna Kowalska' }), pos = el('input', { type: 'text', placeholder: 'Specjalista ds. obsługi klienta' }), firm = el('input', { type: 'text', placeholder: 'ABC Sp. z o.o.' }), who = el('input', { type: 'text', placeholder: 'np. Pani Magdaleno (opcjonalnie)' }), topic = el('input', { type: 'text', placeholder: 'np. wdrożeniu nowego systemu CRM (opcjonalnie)' });
    const gender = el('select', {}, el('option', { value: '', textContent: 'obie formy (przekonany/a)' }), el('option', { value: 'f', textContent: 'żeńska (przekonana)' }), el('option', { value: 'm', textContent: 'męska (przekonany)' }));
    const draw = () => { out.textContent = thankYouText({ name: name.value, pos: pos.value, firm: firm.value, who: who.value, topic: topic.value, gender: gender.value }); };
    [name, pos, firm, who, topic, gender].forEach((i) => i.addEventListener('input', draw)); gender.addEventListener('change', draw); draw();
    box.append(el('div', { className: 'tool-form' }, field('Twoje imię i nazwisko', name), field('Forma', gender), field('Stanowisko', pos), field('Firma', firm), field('Zwrot do rekrutera', who), field('Temat z rozmowy, który zapamiętałeś', topic)), out, copyBtn2(out),
      el('p', { className: 'hint', textContent: 'Wyślij wiadomość w ciągu doby od rozmowy. Wybierz formę (żeńską albo męską), żeby w tekście nie było ukośników. Nie dopisuj nowych argumentów, tylko krótko podziękuj.' }));
  }
  // data-i18n: interfejs narzędzia tłumaczy się słownikiem (wynik w .tool-out zostaje po polsku).
  const root = el('div', { className: 'inner narrow' },
    el('nav', { className: 'crumbs', ariaLabel: 'Ścieżka' }, pageLink('', { textContent: 'Strona główna' }), '›', el('a', { href: '#poradnik', textContent: 'Darmowe narzędzia' }), '›', el('span', { textContent: t.title })),
    el('h1', { textContent: t.title }), el('p', { className: 'lead', textContent: t.lead }), plNote(), box,
    ...(t.about || []).map((x) => el('p', { textContent: x })),
    ...(t.faq?.length ? [el('h2', { textContent: 'Pytania' }), ...t.faq.map((f) => el('details', {}, el('summary', { textContent: f.q }), el('p', { textContent: f.a })))] : []),
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Masz już ogłoszenie?' }), el('p', { className: 'hint', textContent: 'Przygotujemy CV i list pisane pod nie, z raportem dopasowania. Od 39 zł, bez abonamentu.' })), openBtn('Zamów CV')),
    el('h2', { textContent: 'Inne darmowe narzędzia' }), el('div', { className: 'more' }, ...Object.entries(C.TOOLS).filter(([k]) => k !== slug).map(([k, x]) => pageLink(`narzedzia/${k}`, { textContent: TOOLS_TR?.[k]?.title || x.title })), pageLink('narzedzia/skaner-cv', { textContent: 'Skaner CV' })));
  root.setAttribute('data-i18n', '');
  return root;
}
const copyBtn2 = (node) => el('button', { type: 'button', className: 'btn sm', textContent: 'Kopiuj', onclick: async (e) => { try { await navigator.clipboard.writeText(node.textContent); e.target.textContent = 'Skopiowano'; } catch { e.target.textContent = 'Zaznacz tekst i skopiuj'; } } });

// Strona zawodu w konkretnym mieście: dane zawodu + lokalny rynek pracy.
const cityMeta = (p, c) => ({ title: `${p.name} ${c.loc}: CV pod lokalne ogłoszenia`, seoTitle: `${p.name} ${c.loc}: CV pod ogłoszenie`, metaDescription: `Jak napisać CV na stanowisko ${p.name.toLowerCase()} ${c.loc}: słowa kluczowe z ogłoszeń, wskazówki dla rynku pracy ${c.gen} i przykładowe CV. CV pod ogłoszenie od 39 zł.` });
function cityPage(p, c, C) {
  const d = { tpl: 'nowoczesny', color: 'niebieski' }, r = profResult(p), T = pT(p), PT = p.lang && C.prof?.tpl;
  const F = (k, pl) => (PT ? fillT(PT[k], p, c) : pl);
  return el('div', { className: 'inner', lang: p.lang || 'pl' },
    el('nav', { className: 'crumbs', ariaLabel: T('Ścieżka') }, pageLink('', { textContent: T('Strona główna') }), '›', pageLink(`cv/${p.slug}`, { textContent: p.name }), '›', el('span', { textContent: c.name })),
    el('h1', { textContent: F('title', cityMeta(p, c).title) }), el('p', { className: 'lead', textContent: `${c.intro}` }),
    el('div', { className: 'page-grid' },
      el('div', {},
        el('h2', { textContent: F('seek', `Szukasz pracy jako ${p.name.toLowerCase()} ${c.loc}?`) }), el('p', { textContent: p.intro }),
        el('h2', { textContent: F('market', `Wskazówki dla rynku pracy ${c.gen}`) }), el('ol', { className: 'tips' }, ...c.tips.map((t) => el('li', { textContent: t }))),
        c.near?.length ? el('p', { className: 'hint', textContent: F('near', `Szukając ofert, sprawdź też okolice: ${c.near.join(', ')}. Jeśli możesz dojeżdżać, napisz to w CV.`) }) : null,
        el('h2', { textContent: T('Słowa kluczowe z ogłoszeń') }), PT ? el('p', { className: 'hint', textContent: PT.kwPl }) : null, kwChips(p),
        el('h2', { textContent: T('Wskazówki do CV') }), el('ol', { className: 'tips' }, ...p.tips.map((t) => el('li', { textContent: t }))),
        el('h2', { textContent: T('Przykładowe CV') }), el('p', { className: 'hint', textContent: T('Dane w przykładzie są fikcyjne.') }), cvNode(r, false, d, ''),
        el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: F('cta', `Masz ogłoszenie ${c.loc}?`) }), el('p', { className: 'hint', textContent: T('Wklej link, a przygotujemy CV pisane pod nie. Od 39 zł, z darmową poprawką.') })), openBtn(T('Zamów CV'))),
        alertLink(p, c, T),
        el('h2', { textContent: T('Przeczytaj w poradniku') }), el('div', { className: 'more' }, ...articlesFor(p.slug, C).map((x) => pageLink(`poradnik/${x.slug}`, { textContent: x.title }))),
        el('h2', { textContent: F('otherCities', `${p.name} w innych miastach`) }), el('div', { className: 'more' }, ...(C.CITIES || []).filter((x) => x.slug !== c.slug).map((x) => pageLink(`cv/${p.slug}/${x.slug}`, { textContent: x.name }))),
        el('h2', { textContent: F('otherProf', `Inne zawody ${c.loc}`) }), el('div', { className: 'more' }, ...C.POPULAR.filter((x) => x.slug !== p.slug).map((x) => pageLink(`cv/${x.slug}/${c.slug}`, { textContent: x.name })))),
      el('aside', { className: 'side-card' }, el('b', { textContent: F('side', `CV: ${p.name}, ${c.name}`) }), el('div', { className: 'side-thumb' }, thumb(r, d, false, '')), openBtn(T('Zamów CV pod swoje ogłoszenie')), el('p', { className: 'hint', textContent: T('Raport dopasowania, darmowa poprawka, PDF w e-mailu.') }))));
}
function articlePage(a, C) {
  // Przetłumaczony artykuł (EN / UA / DE): tłumaczymy też elementy wokół niego (reszta podstron zostaje po polsku).
  const L = a.slugLang ? window.I18N.lang : 'pl', T = (s) => (L === 'pl' ? s : window.I18N.t(s));
  return el('div', { className: 'inner narrow article', lang: L },
    el('nav', { className: 'crumbs', ariaLabel: T('Ścieżka') }, pageLink('', { textContent: T('Strona główna') }), '›', el('a', { href: L !== 'pl' && !cfg.preview ? `/${L}#poradnik` : '#poradnik', textContent: T('Poradnik'), onclick: (e) => { e.preventDefault(); showHome(true); $('#poradnik').scrollIntoView(); } }), '›', el('span', { textContent: a.title })),
    el('h1', { textContent: a.title }), el('p', { className: 'meta', textContent: T(`${a.readMinutes} min czytania`) }), el('p', { className: 'lead', textContent: a.lead }),
    ...a.sections.flatMap((sec) => [el('h2', { textContent: sec.h }), ...sec.p.map((t) => el('p', { textContent: t }))]),
    ...(a.templates ? [el('h2', { textContent: T('Wzory CV do pobrania (PDF)') }), el('p', { textContent: T('Przykładowe CV w każdym szablonie, ze znakiem wodnym PRZYKŁAD. Pobierz, porównaj i wybierz wygląd, a treść dopasujemy do Twojego ogłoszenia.') }),
      el('div', { className: 'more' }, ...TPLS.map(([k, n]) => el('a', { href: `/api/sample.pdf?tpl=${k}&lang=${L}`, rel: 'nofollow', download: '', textContent: `${T('Wzór CV')}: ${T(tplName(k))}` })))] : []),
    ...(a.faq?.length ? [el('h2', { textContent: T('Pytania i odpowiedzi') }), ...a.faq.map((f) => el('details', {}, el('summary', { textContent: f.q }), el('p', { textContent: f.a })))] : []),
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: T('Zrób CV pod swoje ogłoszenie') }), el('p', { className: 'hint', textContent: T('Wklejasz link, dostajesz CV z raportem dopasowania. Od 39 zł.') })), openBtn(T('Zamów CV'))),
    ...(a.related?.length ? [el('h2', { textContent: T('CV dla zawodów') }), el('div', { className: 'more' }, ...a.related.map((x) => C.INDEX.find((p) => p.slug === x)).filter(Boolean).map((p) => pageLink(`cv/${p.slug}`, { textContent: p.name })))] : []),
    el('h2', { textContent: T('Przeczytaj też') }), el('div', { className: 'more' }, ...C.ARTICLES.filter((x) => x.slug !== a.slug).map((x) => pageLink(`poradnik/${x.slug}`, { textContent: x.title })), ...C.POPULAR.slice(0, 4).map((x) => pageLink(`cv/${x.slug}`, { textContent: T(`CV: ${x.name}`) }))));
}
function setMeta(desc) { let m = document.querySelector('meta[name=description]'); if (!m) { m = el('meta', { name: 'description' }); document.head.append(m); } m.content = desc; }
function navTo(r) {
  try {
    if (cfg.preview) history.pushState(null, '', r ? '#/' + r : '#top');
    else history.pushState(null, '', '/' + pubPath(r));
  } catch {}
}
async function showPage(r, push = true) {
  if (r.startsWith('art/')) { const a = (await loadContent()).ARTICLES.find((x) => x.slugLang === r.slice(4)); r = a ? 'poradnik/' + a.slug : ''; }
  if (r.startsWith('prof/')) {
    const C0 = await loadContent(), [, ps, cs] = r.split('/'), pl = Object.keys(C0.prof?.index || {}).find((k) => C0.prof.index[k].slugLang === ps), city = cs && C0.CITIES.find((c) => c.slugLang === cs);
    r = pl && (!cs || city) ? `cv/${pl}${city ? '/' + city.slug : ''}` : '';
  }
  if (r.startsWith('tool/')) { const C0 = await loadContent(), l = window.I18N?.lang, k = Object.keys(C0.TOOLS || {}).find((x) => C0.TOOLS[x].slugs?.[l] === r.slice(5)); r = k ? 'narzedzia/' + k : ''; }
  const C = await loadContent(), [kind, slug, sub] = r.split('/');
  let item = null, node = null;
  if (kind === 'cv') {
    const p = await loadProf(slug), city = sub && (C.CITIES || []).find((c) => c.slug === sub);
    if (p && sub && city && C.POPULAR.some((x) => x.slug === p.slug)) { item = p.lang && C.prof ? { title: fillT(C.prof.tpl.title, p, city), seoTitle: C.prof.tpl.seo && fillT(C.prof.tpl.seo, p, city), metaDescription: fillT(C.prof.tpl.desc, p, city) } : cityMeta(p, city); node = () => cityPage(p, city, C); }
    else if (p && !sub) { item = p; node = () => profPage(p, C); }
  } else if (kind === 'poradnik') { item = C.ARTICLES.find((a) => a.slug === slug); if (item) { item = await loadArticle(item); node = () => articlePage(item, C); } }
  else if (kind === 'narzedzia' && C.TOOLS?.[slug]) { item = await loadTool(slug, C); node = () => toolPage(slug, C, item); }
  else if (!slug && STATIC_PAGES.includes(kind)) { const t = $('#pg-' + kind); item = { title: t.dataset.title, metaDescription: t.dataset.desc }; node = () => { const d = el('div', {}, t.content.cloneNode(true)); d.setAttribute('data-i18n', ''); return d; }; }
  if (!item) return showHome(push);
  $('#landing').hidden = true; $('#account').hidden = true;
  $('#page').hidden = false; $('#pageNote').hidden = (window.I18N?.lang || 'pl') === 'pl' || (kind === 'poradnik' && !!item.slugLang) || (kind === 'cv' && !!C.prof) || (kind === 'narzedzia' && !!item.slugLang) || STATIC_PAGES.includes(kind);
  // Przełącznik języka prowadzi do tej samej strony w innym języku (narzędzia mają adresy w każdym języku).
  $$('.langsw a').forEach((a) => { const L = a.dataset.lang; a.setAttribute('href', kind === 'narzedzia' && TOOL_SEG[L] && item.slugs?.[L] ? `/${L}/${TOOL_SEG[L]}/${item.slugs[L]}` : L === 'pl' && kind === 'narzedzia' ? `/narzedzia/${slug}` : L === 'pl' ? '/' : '/' + L); });
  $('#page').replaceChildren(node()); $('#page').dataset.ssr = '';
  // Ten sam tytuł co z serwera: nazwę serwisu dopisujemy tylko, gdy całość mieści się w ok. 60 znakach (Google ucina dłuższe).
  try { const t = STATIC_PAGES.includes(kind) ? window.I18N.t(item.title) : item.seoTitle || item.title; document.title = t.length <= 40 ? `${t} | CV Pod Ogłoszenie` : t; } catch {}
  setMeta(item.metaDescription);
  if (push) { navTo(r); track('pv'); }
  const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
  if (target && $('#page').contains(target)) target.scrollIntoView(); else window.scrollTo(0, 0);
}
const resetLangSw = () => $$('.langsw a').forEach((a) => a.setAttribute('href', a.dataset.lang === 'pl' ? '/' : '/' + a.dataset.lang));
function showHome(push) {
  resetLangSw();
  $('#page').hidden = $('#pageNote').hidden = true; $('#account').hidden = true; $('#landing').hidden = false;
  try { document.title = HOME_TITLE; } catch {}
  if (push) navTo('');
  window.scrollTo(0, 0);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-page]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  if (!$('#result').hidden) { location.href = cfg.preview ? '#top' : '/' + pubPath(a.dataset.page); return; }
  // Link do miejsca na podstronie (np. /dla-firm#zapytanie): po wyrenderowaniu przewijamy do niego.
  const anchor = a.hash && a.pathname === '/' + a.dataset.page ? a.hash.slice(1) : '';
  (a.dataset.page ? showPage(a.dataset.page) : Promise.resolve(showHome(true))).then(() => { if (anchor) document.getElementById(anchor)?.scrollIntoView(); });
});
window.addEventListener('popstate', () => route());

// Formularze: kontakt, zapytanie firmy / uczelni i zapis do newslettera (podwójna zgoda: potwierdzenie linkiem z e-maila).
document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-lead]'); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.lead, st = $('.fstatus', f), btn = $('button[type=submit]', f), v = (n) => f.elements[n]?.value ?? '';
  let body = { kind, name: v('name'), email: v('email'), topic: v('topic'), message: v('message'), website: v('website'), consent: !!f.elements.consent?.checked };
  if (kind === 'newsletter') Object.assign(body, { source: $('#page').hidden ? 'strona główna' : location.pathname.slice(1) || 'podstrona', lang: window.I18N?.lang });
  // Zapytanie organizacji trafia tam, gdzie formularz „Dla firm” ze strony głównej (zakładka Firmy w panelu).
  if (kind === 'firma') { const t = f.elements.orgType; body = { org: v('org'), name: v('name'), email: v('email'), phone: v('phone'), count: v('count'), msg: [t ? `[${t.options[t.selectedIndex].text}]` : '', v('message')].filter(Boolean).join(' '), consent: body.consent, uiLang: window.I18N?.lang }; }
  st.className = 'fstatus'; st.textContent = 'Wysyłanie…'; btn.disabled = true;
  try {
    const r = await fetch(kind === 'newsletter' ? '/api/newsletter' : kind === 'firma' ? '/api/b2b' : '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Nie udało się wysłać. Spróbuj ponownie.');
    st.className = 'fstatus good';
    st.textContent = kind === 'newsletter' ? 'Prawie gotowe: sprawdź skrzynkę i kliknij link potwierdzający zapis.' : kind === 'firma' ? 'Dziękujemy! Odpowiemy z propozycją, zwykle w ciągu jednego dnia roboczego.' : 'Dziękujemy! Odpowiemy na podany adres e-mail.';
    if (j.demoLink) st.append(' ', el('a', { href: j.demoLink, textContent: 'Tryb DEMO: potwierdź zapis tym linkiem' }));
    f.reset();
  } catch (x) { st.className = 'fstatus bad'; st.textContent = x.message; }
  btn.disabled = false;
});

// --- Konto klienta: logowanie linkiem, zamówienia, lista aplikacji z przypomnieniem o rozmowie ---
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-acct]'); if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); try { history.pushState(null, '', cfg.preview ? '#konto' : '/konto'); } catch {} if ($('#result').hidden) showAccount(); else location.href = cfg.preview ? '#konto' : '/konto';
});
const accApi = async (path = '', opts = {}) => {
  const r = await fetch('/api/account' + path, { ...opts, headers: { 'Content-Type': 'application/json', 'X-Acc': '1' }, credentials: 'same-origin' }).catch(() => ({ ok: false, status: 0, json: async () => ({}) }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.'); e.status = r.status; throw e; }
  return j;
};
const STATUS_CLS = { 'wysłane': 'st-sent', rozmowa: 'st-int', oferta: 'st-ok', odmowa: 'st-no', 'brak odpowiedzi': 'st-none' };
const dtLocal = (t) => (t ? new Date(t - new Date(t).getTimezoneOffset() * 60e3).toISOString().slice(0, 16) : '');
async function showAccount() {
  $('#landing').hidden = true; $('#page').hidden = $('#pageNote').hidden = true;
  const box = $('#account'); box.hidden = false; window.scrollTo(0, 0);
  try { document.title = 'Moje konto – CV Pod Ogłoszenie'; } catch {}
  // Powrót z płatności za karnet: płatność może dotrzeć kilka sekund później, więc kilka prób.
  const kar = new URLSearchParams(location.search).get('karnet');
  if (kar) {
    box.replaceChildren(el('div', { className: 'inner narrow' }, el('h1', { textContent: 'Aktywujemy karnet…' }), el('p', { className: 'hint', textContent: 'Sprawdzamy płatność, to potrwa chwilę.' })));
    let err = '';
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`/api/passes/${encodeURIComponent(kar)}/login`, { method: 'POST', credentials: 'same-origin' }).catch(() => null), j = r ? await r.json().catch(() => ({})) : {};
      if (r?.ok) { err = ''; break; }
      err = j.error || 'Nie udało się sprawdzić płatności.'; if (!j.pending) break;
      await new Promise((ok) => setTimeout(ok, 2000));
    }
    try { history.replaceState(null, '', '/konto'); } catch {}
    if (err) flash(err, true); else flash('Karnet jest aktywny. Link do logowania wysłaliśmy też e-mailem.');
  }
  const t = new URLSearchParams(location.search).get('t');
  if (t) {
    try { await accApi('/login', { method: 'POST', body: JSON.stringify({ token: t }) }); } catch (x) { box.replaceChildren(accLogin(x.message)); return; }
    try { history.replaceState(null, '', '/konto'); } catch {}
  }
  let d;
  try { d = await accApi(); } catch (x) { box.replaceChildren(accLogin(x.status === 401 ? '' : x.message)); return; }
  box.replaceChildren(accDash(d));
}
function accLogin(err) {
  const email = el('input', { type: 'email', required: true, autocomplete: 'email', placeholder: 'adres z zamówienia' }), msg = el('p', { className: err ? 'err' : 'hint', role: 'status', textContent: err || '' });
  const btn = el('button', { className: 'btn', type: 'submit', textContent: 'Wyślij link do logowania' });
  const form = el('form', { className: 'acct-login' }, el('label', { className: 'f' }, 'E-mail', email), btn, msg);
  form.onsubmit = async (e) => {
    e.preventDefault(); btn.disabled = true; msg.className = 'hint'; msg.textContent = '';
    try {
      const r = await accApi('/link', { method: 'POST', body: JSON.stringify({ email: email.value, lang: window.I18N?.lang || 'pl' }) });
      msg.replaceChildren(`Wysłaliśmy link na ${email.value}. Sprawdź skrzynkę (także folder Oferty i Spam). Link działa 20 minut.`);
      if (r.demoLink) msg.append(' ', el('a', { href: r.demoLink, textContent: 'Tryb DEMO: zaloguj się tym linkiem', onclick: cfg.preview ? async (ev) => { ev.preventDefault(); await accApi('/login', { method: 'POST', body: JSON.stringify({ token: new URL(r.demoLink).searchParams.get('t') }) }); showAccount(); } : null }));
    } catch (x) { msg.className = 'err'; msg.textContent = x.message; } finally { btn.disabled = false; }
  };
  return el('div', { className: 'inner narrow' }, el('h1', { textContent: 'Moje konto' }),
    el('p', { className: 'lead', textContent: 'Zaloguj się albo załóż darmowe konto. Bez hasła: wpisz e-mail, a wyślemy Ci link. Jeśli nie masz jeszcze konta, założy się przy pierwszym logowaniu.' }),
    el('p', { className: 'hint', textContent: 'Konto nie jest potrzebne do zakupu. Na koncie zobaczysz swoje zamówienia i poprowadzisz listę aplikacji z przypomnieniem przed rozmową.' }), form);
}
function accDash(d) {
  const wrap = el('div', { className: 'inner' });
  const appsBox = el('div');
  const reload = async () => { try { const n = await accApi(); d.apps = n.apps; drawApps(); } catch {} };
  const counts = () => d.statuses.map((s) => [s, d.apps.filter((a) => a.status === s).length]).filter(([, n]) => n);
  function appForm(pre = {}) {
    const f = { company: el('input', { type: 'text', value: pre.company || '', placeholder: 'Firma' }), position: el('input', { type: 'text', value: pre.position || '', placeholder: 'Stanowisko' }), link: el('input', { type: 'url', placeholder: 'Link do ogłoszenia (opcjonalnie)' }), applied: el('input', { type: 'date', value: new Date().toISOString().slice(0, 10) }) };
    const msg = el('span', { className: 'err' }), btn = el('button', { className: 'btn sm', type: 'submit', textContent: 'Dodaj aplikację' });
    const form = el('form', { className: 'app-form' }, ...Object.entries(f).map(([k, i]) => el('label', { className: 'f' }, { company: 'Firma', position: 'Stanowisko', link: 'Link', applied: 'Wysłano' }[k], i)), el('div', {}, btn, msg));
    form.onsubmit = async (e) => {
      e.preventDefault(); btn.disabled = true; msg.textContent = '';
      try { await accApi('/apps', { method: 'POST', body: JSON.stringify({ ...Object.fromEntries(Object.entries(f).map(([k, i]) => [k, i.value])), orderId: pre.orderId, resultIndex: pre.resultIndex }) }); f.company.value = f.position.value = f.link.value = ''; await reload(); flash('Dodano do Twoich aplikacji.'); }
      catch (x) { msg.textContent = x.message; } finally { btn.disabled = false; }
    };
    return form;
  }
  function drawApps() {
    const put = async (a, patch) => { try { Object.assign(a, await accApi('/apps/' + a.id, { method: 'PUT', body: JSON.stringify(patch) })); drawApps(); } catch (x) { flash(x.message, true); } };
    const rows = d.apps.map((a) => {
      const st = el('select', { ariaLabel: 'Status', className: STATUS_CLS[a.status] || '' }, ...d.statuses.map((s) => el('option', { value: s, textContent: s, selected: s === a.status })));
      st.onchange = () => put(a, { status: st.value });
      const when = el('input', { type: 'datetime-local', value: dtLocal(a.interviewAt), ariaLabel: 'Termin rozmowy' });
      when.onchange = () => put(a, { interviewAt: when.value ? new Date(when.value).toISOString() : '', status: when.value && a.status === 'wysłane' ? 'rozmowa' : a.status });
      const rem = el('input', { type: 'checkbox', checked: !!a.remind, disabled: !a.interviewAt });
      rem.onchange = () => put(a, { remind: rem.checked, interviewAt: a.interviewAt ? new Date(a.interviewAt).toISOString() : '' });
      const del = el('button', { className: 'link', type: 'button', textContent: 'Usuń' });
      del.onclick = async () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; return; } await accApi('/apps/' + a.id, { method: 'DELETE' }).catch(() => {}); reload(); };
      return el('div', { className: 'app-row' },
        el('div', { className: 'app-main' }, el('b', { textContent: a.position || '—' }), el('span', { textContent: a.company || '' }), a.link ? el('a', { href: a.link, target: '_blank', rel: 'noopener noreferrer', textContent: 'ogłoszenie ↗' }) : null, el('small', { textContent: `wysłano ${new Date(a.applied).toLocaleDateString('pl-PL')}` })),
        el('label', { className: 'f' }, 'Status', st),
        el('label', { className: 'f' }, 'Rozmowa', when),
        el('label', { className: 'check' }, rem, el('span', { textContent: a.reminded ? 'Przypomnienie wysłane' : 'Przypomnij dzień wcześniej (e-mail)' })),
        del);
    });
    appsBox.replaceChildren(
      counts().length ? el('div', { className: 'app-stats' }, ...counts().map(([s, n]) => el('span', { className: STATUS_CLS[s], textContent: `${s}: ${n}` }))) : null,
      ...(rows.length ? rows : [el('p', { className: 'hint', textContent: 'Nie masz jeszcze żadnych aplikacji. Dodaj pierwszą powyżej albo z listy zamówień.' })]));
  }
  const out = el('button', { className: 'btn ghost sm', type: 'button', textContent: 'Wyloguj' });
  out.onclick = async () => { await accApi('/logout', { method: 'POST' }).catch(() => {}); showAccount(); };
  const delAcc = el('button', { className: 'link', type: 'button', textContent: 'Usuń konto i listę aplikacji' });
  delAcc.onclick = async () => { if (delAcc.dataset.sure !== '1') { delAcc.dataset.sure = '1'; delAcc.textContent = 'Kliknij jeszcze raz, aby usunąć na zawsze'; return; } await accApi('', { method: 'DELETE' }).catch(() => {}); showAccount(); };
  const addBox = el('div', { className: 'acct-card' }, el('h2', { textContent: 'Dodaj aplikację' }), appForm());
  // Karnet: stan, ważność i historia zużycia (karta widoczna tylko, gdy klient ma albo miał karnet).
  const passBox = el('div', { className: 'acct-card', hidden: true });
  fetch('/api/passes/mine', { credentials: 'same-origin' }).then((r) => r.json()).then(({ active, all }) => {
    if (!all?.length) return;
    const day = (t) => new Date(t).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    const STATE = { used: 'wykorzystane', reserved: 'zarezerwowane (czeka na płatność)' }, STATUS = { expired: 'wygasł', refunded: 'zwrócony', active: 'aktywny' };
    const hist = all.flatMap((p) => p.used.map((u) => ({ ...u, name: p.name }))).sort((a, b) => b.at - a.at).slice(0, 30);
    passBox.hidden = false;
    passBox.replaceChildren(...[el('h2', { textContent: 'Twój karnet' }),
      active ? el('p', {}, el('b', { textContent: active.name }), ` – zostało ${active.left.matches} z ${active.plan.matches} dopasowań (CV + list), ${active.left.sim} z ${active.plan.sim} symulatorów, ${active.left.interview} z ${active.plan.interview} przygotowań do rozmowy. Ważny do ${day(active.expires)}.`)
        : el('p', { className: 'hint', textContent: 'Nie masz aktywnego karnetu.' }),
      active ? el('p', {}, el('button', { className: 'btn sm', type: 'button', textContent: 'Zamów CV z karnetu', onclick: () => { $('#account').hidden = true; $('#landing').hidden = false; openWiz(); } })) : null,
      el('p', { className: 'hint', textContent: 'Karnet nie odnawia się. Po terminie ważności niewykorzystane dopasowania przepadają.' }),
      ...all.filter((p) => !active || p.id !== active.id).map((p) => el('p', { className: 'hint', textContent: `${p.name}: ${STATUS[p.status] || p.status}${p.expires ? `, ważny do ${day(p.expires)}` : ''}.` })),
      hist.length ? el('div', { className: 'tbl-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ['Kiedy', 'Karnet', 'Dopasowania', 'Symulator', 'Przygotowanie', 'Stan'].map((h) => el('th', { textContent: h })))),
        el('tbody', {}, hist.map((u) => el('tr', {}, el('td', { textContent: new Date(u.at).toLocaleString('pl-PL') }), el('td', { textContent: u.name }), el('td', { textContent: String(u.matches) }), el('td', { textContent: String(u.sim) }), el('td', { textContent: String(u.interview) }), el('td', { textContent: STATE[u.state] || u.state })))))) : null].filter(Boolean));
  }).catch(() => {});
  wrap.append(
    el('div', { className: 'acct-head' }, el('div', {}, el('h1', { textContent: 'Moje konto' }), el('p', { className: 'hint', textContent: d.email })), out),
    passBox,
    el('div', { className: 'acct-card' }, el('h2', { textContent: 'Twoje zamówienia' }), el('p', { className: 'hint', textContent: 'Zamówienia z ostatnich 30 dni (starsze usuwamy automatycznie razem z dokumentami).' }),
      ...(d.orders.length ? d.orders.map((o) => el('div', { className: 'acct-order' },
        el('div', {}, el('b', { textContent: o.pkg }), el('small', { textContent: ` · ${new Date(o.created).toLocaleDateString('pl-PL')}` })),
        el('div', { className: 'acct-pos' }, ...o.positions.map((p, i) => el('span', {}, p.position, ' ', el('button', { className: 'link', type: 'button', textContent: '+ do aplikacji', onclick: () => { addBox.replaceChildren(el('h2', { textContent: 'Dodaj aplikację' }), appForm({ position: p.position, company: p.company, orderId: o.id, resultIndex: i })); addBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); } })))),
        el('a', { className: 'btn ghost sm', href: `/?id=${o.id}`, textContent: 'Otwórz dokumenty', onclick: cfg.preview ? (ev) => { ev.preventDefault(); $('#account').hidden = true; startResult(o.id); } : null })))
        : [el('p', { className: 'hint', textContent: 'Nie ma zamówień z ostatnich 30 dni na ten adres.' })])),
    addBox,
    el('div', { className: 'acct-card' }, el('h2', { textContent: 'Moje aplikacje' }), el('p', { className: 'hint', textContent: 'Zapisuj, gdzie wysłałeś CV. Gdy wpiszesz termin rozmowy i zaznaczysz przypomnienie, dzień wcześniej dostaniesz e-mail z krótką listą kontrolną (i linkiem do przygotowania do rozmowy, jeśli je zamówiłeś).' }), appsBox),
    el('p', { className: 'hint' }, 'Konto nieużywane przez 12 miesięcy usuwamy automatycznie. ', delAcc));
  drawApps();
  return wrap;
}

// Przełącznik języka strony (PL / EN / UA / DE).
$$('.langsw a').forEach((a) => {
  a.classList.toggle('on', a.dataset.lang === (window.I18N?.lang || 'pl'));
  a.onclick = (e) => { e.preventDefault(); window.I18N?.set(a.dataset.lang); if (cfg.preview) location.reload(); else location.href = a.getAttribute('href'); };
});

const LEGAL = { '#regulamin': 'regulamin', '#prywatnosc': 'prywatnosc' };
function route() {
  // Stare adresy /#regulamin i /#prywatnosc → pełne strony w języku użytkownika.
  if (LEGAL[location.hash]) return location.replace(legalUrl(LEGAL[location.hash], window.I18N?.lang));
  // Strona prawna z serwera zostaje, dopóki ktoś nie kliknie linku do sekcji strony głównej.
  const la = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
  // Strony tylko z serwera (zamówienie paczki kodów, program partnerski, raporty): po powrocie przyciskiem wstecz wczytujemy je od nowa.
  if (window.__SSRPATH && location.pathname === window.__SSRPATH && !(la && la.closest('#landing'))) { if ($('#page').dataset.ssr !== '1') location.reload(); return; }
  if (isLegalPath(location.pathname) && !(la && la.closest('#landing'))) return;
  // Strona 404 z serwera zostaje, dopóki ktoś nie kliknie linku do sekcji strony głównej.
  if (window.__NOTFOUND && !location.hash) return;
  window.__NOTFOUND = 0;
  if (!$('#result').hidden || !$('#gen').hidden) return;
  // Z konta link do sekcji strony głównej (#szablony, #cennik…): wracamy na stronę główną zamiast odświeżać konto.
  const ha = location.hash.length > 1 && location.hash !== '#konto' && document.getElementById(location.hash.slice(1));
  if (location.pathname === '/konto' && ha && ha.closest('#landing')) { try { history.replaceState(null, '', '/' + location.hash); } catch {} }
  else if (location.pathname === '/konto' || location.hash === '#konto') return showAccount();
  $('#account').hidden = true;
  const h = location.hash, hm = /^#\/((?:cv|poradnik|narzedzia)\/[\w-]+(?:\/[\w-]+)?|jak-to-dziala|dla-firm|program-polecen)$/.exec(h), pm = /^\/((?:cv|poradnik|narzedzia)\/[\w-]+(?:\/[\w-]+)?|jak-to-dziala|dla-firm|program-polecen)\/?$/.exec(location.pathname);
  if (hm) return showPage(hm[1], false);
  const anchor = h.length > 1 && document.getElementById(h.slice(1));
  if (pm && !(anchor && anchor.closest('#landing'))) return showPage(pm[1], false);
  const dm = /^\/(de|en|uk)\/(\w+)\/([\w-]+)(?:\/([\w-]+))?\/?$/.exec(location.pathname);
  if (dm && !(anchor && anchor.closest('#landing'))) {
    if (ART_SEG[dm[1]] === dm[2] && !dm[4]) return showPage('art/' + dm[3], false);
    if (PROF_SEG[dm[1]] === dm[2]) return showPage('prof/' + dm[3] + (dm[4] ? '/' + dm[4] : ''), false);
    if (TOOL_SEG[dm[1]] === dm[2] && !dm[4]) return showPage('tool/' + dm[3], false);
  }
  $('#page').hidden = $('#pageNote').hidden = true; resetLangSw();
  $('#landing').hidden = false;
  try { document.title = HOME_TITLE; } catch {} const t = location.hash.length > 1 && document.getElementById(location.hash.slice(1)); if (t) settleScroll(t);
}
// Skok do sekcji (np. /#cennik z innej podstrony): sekcje wyżej dorysowują się dopiero przy przewijaniu (whenNear)
// i zmieniają wysokość strony, więc poprawiamy pozycję, aż sekcja zostanie na swoim miejscu.
function settleScroll(t, n = 0) {
  t.scrollIntoView({ behavior: n ? 'instant' : 'auto' });
  if (n < 6) setTimeout(() => { if (Math.abs(t.getBoundingClientRect().top - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)) > 4) settleScroll(t, n + 1); }, 250);
}
window.addEventListener('hashchange', route); route();
// „Przejdź do treści”: fokus na widocznej treści głównej (strona główna, podstrona, konto albo dokument prawny).
$('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  const m = [...document.querySelectorAll('main, [role=main]')].find((x) => !x.hidden); if (!m) return;
  m.tabIndex = -1; m.focus({ preventScroll: true }); m.scrollIntoView();
});

addRow('exp'); addRow('edu'); addRow('ads');
if (restoreDraft()) $('#draftNote').hidden = false;
refresh(); go(ORDER[0]);
$('#clearDraft').onclick = () => { clearDraft(); resetWizard(); $('#draftNote').hidden = true; };
const q = new URLSearchParams(location.search);
if (window.__ROUTE?.startsWith('legal/')) $$('.langsw a').forEach((a) => a.setAttribute('href', legalUrl(window.__ROUTE.slice(6), a.dataset.lang)));
else if (window.__ROUTE) showPage(window.__ROUTE, false);
// ?draft=<id>: ogłoszenie przysłane przez rozszerzenie Chrome → do skanera (strona narzędzia) albo do kreatora.
async function loadDraft(id) {
  try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
  let d; try { const r = await fetch(`/api/ad-draft/${encodeURIComponent(id)}`); d = await r.json(); if (!r.ok) throw new Error(d.error); } catch (x) { alert(x.message || 'Nie udało się wczytać ogłoszenia.'); return; }
  const text = d.text;
  if (/^\/(?:[a-z]{2}\/)?(?:narzedzia|tools|instrumenty)\/(?:skaner|cv-scanner|lebenslauf|skaner-rezyume)/.test(location.pathname)) {
    // Formularz skanera na stronie narzędzia powstaje po wczytaniu treści strony: oddajemy mu szkic przy tworzeniu.
    // Strona narzędzia może się przy starcie narysować ponownie, więc szkic zostaje do wzięcia przez kilka sekund.
    pendingDraft = text; setTimeout(() => (pendingDraft = ''), 20000);
    const t = $('#page form.scan-card textarea'); if (t) t.value = text;
    return;
  }
  const first = $('#ads .entry');
  if (first) { $('[data-k=title]', first).value = d.title || ''; $('[data-k=text]', first).value = text; first.dataset.fetched = '1'; setMode(first, 'paste'); }
  if ($('#scanAd')) $('#scanAd').value = text;
  openWiz();
}
// ?zamow=1 (przycisk „Zamów” z lekkiej podstrony): kreator z wybranym pakietem i dodatkami.
// ?jezyk=de|en|… (strony „CV za granicę”): dodatkowo język dokumentów dla pierwszego ogłoszenia.
if ((q.get('zamow') || LANGS[q.get('jezyk')]) && !q.get('id') && !q.get('draft')) {
  try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
  (q.get('dodatki') || '').split(',').filter((a) => /^\w+$/.test(a)).forEach((a) => { const c = $('#ad' + a); if (c) c.checked = true; });
  const s = LANGS[q.get('jezyk')] && $('#ads .entry [data-k=lang]'); if (s) { s.value = q.get('jezyk'); refresh(); }
  openWiz(['cv', 'cv_letter', 'pack3'].includes(q.get('pkg')) ? q.get('pkg') : undefined);
  // ?zawod=<slug> (przycisk na stronie zawodu): nazwa zawodu jako ogólne stanowisko, jeśli pole jest puste.
  const zaw = q.get('zawod') || '';
  if (/^[a-z0-9-]{2,60}$/.test(zaw)) loadContent().then((C) => { const p = C.INDEX?.find((x) => x.slug === zaw); if (p && !$('#headline').value.trim()) { $('#headline').value = p.name; saveDraft(); } }).catch(() => {});
}
// „Wyślij mi link do dokończenia” (krok 1): jeden e-mail z linkiem; przypomnienie tylko z osobnym, niezaznaczonym polem.
{
  const st = $('#slStatus'), send = $('#slSend'), em = $('#slEmail');
  $('#saveLater').addEventListener('toggle', () => { if ($('#saveLater').open && !em.value) em.value = $('#email').value; });
  em.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send.click(); } });
  send.onclick = async () => {
    st.className = 'fstatus'; send.disabled = true; st.textContent = 'Wysyłam…';
    try {
      const r = await fetch('/api/wizard-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em.value, remind: $('#slRemind').checked, lang: window.I18N?.lang || 'pl', data: draftData() }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      try { localStorage.setItem(SKEY, j.token); } catch {}
      st.classList.add('good'); st.textContent = 'Wysłaliśmy link. Szkic będzie się aktualizował, gdy dalej wypełniasz formularz.';
      if (j.demoLink) st.append(' ', el('a', { href: j.demoLink, textContent: 'Podgląd linku' }));
    } catch (x) { st.classList.add('bad'); st.textContent = x.message || 'Nie udało się wysłać linku.'; }
    send.disabled = false;
  };
}
// ?szkic=<token> (link z e-maila): dane ze szkicu na serwerze, dalsze zmiany zapisują się w tym samym szkicu.
async function loadSrvDraft(t) {
  try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
  let d; try { const r = await fetch(`/api/wizard-draft/${encodeURIComponent(t)}`); d = await r.json(); if (!r.ok) throw new Error(d.error); } catch (x) { openWiz(); flash(x.message || 'Nie udało się wczytać szkicu.', true); return; }
  try { localStorage.setItem(SKEY, t); } catch {}
  restoreDraft(d.data); $('#draftNote').hidden = true;
  openWiz(); flash('Wczytaliśmy zapisany szkic. Możesz dokończyć zamówienie.');
}
if (q.get('szkic') && !q.get('id')) loadSrvDraft(q.get('szkic'));

// ?oferta=<id> (przycisk „Dopasuj CV do tej oferty” z e-maila z ofertami): tytuł i link oferty w pierwszym ogłoszeniu,
// treść pobieramy jak przy wklejonym linku; gdy się nie da, zostaje opis oferty z serwisu partnerskiego do uzupełnienia.
async function loadOffer(id) {
  try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
  let d; try { const r = await fetch(`/api/job-offer/${encodeURIComponent(id)}`); d = await r.json(); if (!r.ok) throw new Error(d.error); } catch (x) { openWiz(); flash(x.message || 'Nie udało się wczytać oferty.'); return; }
  const first = $('#ads .entry');
  if (first) {
    $('[data-k=title]', first).value = d.title || ''; $('[data-k=url]', first).value = d.url || ''; $('[data-k=text]', first).value = d.text || '';
    setMode(first, 'link'); if (d.url) $('.fetchbtn', first).click();
  }
  openWiz();
}
if (q.get('oferta') && !q.get('draft') && !q.get('id')) loadOffer(q.get('oferta'));
if (q.get('draft')) loadDraft(q.get('draft'));
if (q.get('id')) startResult(q.get('id'));
else if (q.has('canceled')) { try { history.replaceState(null, '', location.pathname); } catch {} openWiz(); go(6); $('#werr').textContent = 'Płatność została anulowana. Twoje dane są zachowane, możesz spróbować ponownie.'; }
/* aplikacja na telefon (PWA) */
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {});
{
  let ask = null; const btn = $('#installApp');
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ask = e; btn.hidden = false; });
  addEventListener('appinstalled', () => { ask = null; btn.hidden = true; });
  if (ios) btn.hidden = false;
  btn.onclick = async (e) => {
    e.preventDefault();
    if (ask) { ask.prompt(); await ask.userChoice.catch(() => {}); ask = null; btn.hidden = true; }
    else alert(window.I18N.t('Na iPhonie: stuknij „Udostępnij” w Safari, a potem „Do ekranu początkowego”.'));
  };
  const net = () => ($('#offline').hidden = navigator.onLine);
  addEventListener('online', net); addEventListener('offline', net); net();
}
/* menu na telefonie */
{
  const btn = $('#menuBtn'), menu = $('#mnav');
  const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); document.body.classList.toggle('menu-open', open); };
  btn.onclick = (e) => { e.stopPropagation(); set(menu.hidden); };
  menu.addEventListener('click', (e) => { if (e.target.closest('a,button')) set(false); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#mnav,#menuBtn')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1000 && !menu.hidden) set(false); });
}
})();
