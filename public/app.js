(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k.filter((x) => x != null && x !== false)); return e; };
let PRICE = { cv: 39, cv_letter: 49, pack3: 79, interview: 50, messages: 9, linkedin: 19, sim: 29, docx: 9, photo: 10, extraLang: 5, bundleOff: 19 };
const ADDON_KEYS = { interview: ['#adInterview', 'Przygotowanie do rozmowy'], messages: ['#adMessages', 'Wiadomość do rekrutera i e-mail z aplikacją'], linkedin: ['#adLinkedin', 'Profil LinkedIn'], sim: ['#adSim', 'Symulator rozmowy kwalifikacyjnej'], docx: ['#adDocx', 'Wersja Word (.docx)'] };
const PKG_ADS = { cv: 1, cv_letter: 1, pack3: 3 };
// Odmiana po liczebniku (jak lib/plural.js): 1 dopasowanie, 2 dopasowania, 5 dopasowań.
const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const PKG_NAME = { cv: 'CV', cv_letter: 'CV + list motywacyjny', pack3: 'Pakiet 3 CV + listy motywacyjne' };
let promo = null; // zastosowany kod rabatowy: { code, discount, label }
let data; // bieżące zamówienie na stronie wyniku
const STEPS = ['Ogłoszenie i pakiet', 'Twoje dane', 'Doświadczenie', 'Wykształcenie i umiejętności', 'Ogłoszenia', 'Podsumowanie i płatność'];
// Test A/B „checkout” (lib/ab.js, data-checkout="b" od serwera): cena na górze, metody płatności jako ikony,
// zgody w układzie kompaktowym – nadal dwa osobne pola (regulamin; osobno zgoda z art. 38 pkt 13), domyślnie odznaczone.
const CHECKOUT_B = document.getElementById('wiz')?.dataset.checkout === 'b';
// C3 (26.10): kreator na 3 ekrany – 1) ogłoszenie i pakiet, 2) dane (wgrane CV albo e-mail i jedno doświadczenie; reszta zwinięta),
// 3) podsumowanie z podglądem, wyglądem i płatnością. Sekcje zachowują numery 1, 2 i 6, więc walidacja, analityka (s1/s2/s6, summary_view)
// i szkice działają jak dotąd; kroki 3–5 ze starszych szkiców i linków trafiają na ekran z tymi polami (stepOf).
const ORDER = [1, 2, 6];
const stepOf = (n) => (ORDER.includes(n) ? n : n === 5 ? 1 : n === 3 || n === 4 ? 2 : n === 7 ? 6 : ORDER[0]);
const STEP_TITLE = (n) => STEPS[n - 1];
let pendingDraft = ''; // ogłoszenie z rozszerzenia Chrome czekające na formularz skanera
let pkgOpen = false; // krok 1: wybór pakietu rozwinięty („Zmień pakiet”)
// Wejście z reklamy (utm_source=google|meta, gclid, fbclid; lib/ad-hero.js): hero „z reklamy” na całą wizytę (sessionStorage).
// Pierwszą odsłonę serwer wysyła już podmienioną (data-adhero), przy kolejnych podmieniamy lewą kolumnę hero z szablonu.
const AD_Q = new URLSearchParams(location.search), AD_SRC = AD_Q.get('gclid') ? 'google' : AD_Q.get('fbclid') ? 'facebook' : '';
try { if (/^(google|meta)$/i.test(AD_Q.get('utm_source') || '') || AD_SRC) sessionStorage.setItem('cvpo-adhero', (AD_Q.get('utm_source') || AD_SRC).toLowerCase()); } catch {}
const adVisit = (() => { try { return sessionStorage.getItem('cvpo-adhero') || ''; } catch { return ''; } })();
(() => {
  const hero = $('#top.hero'), tpl = $('#adHeroTpl');
  if (!adVisit || location.pathname !== '/' || !hero || !tpl || hero.dataset.adhero) return;
  const col = $('.hero-grid > div', hero); if (!col) return;
  col.className = 'ad-hero-col'; col.replaceChildren(tpl.content.cloneNode(true)); hero.dataset.adhero = '1';
})();
// Ogłoszenie wklejone na stronie zawodu („Masz ogłoszenie?”, lite.js): jednorazowo z pamięci tej karty.
try { const a = sessionStorage.getItem('cvpo-scan-ad'); if (a) { sessionStorage.removeItem('cvpo-scan-ad'); pendingDraft = a; setTimeout(() => (pendingDraft = ''), 20000); } } catch {}
let cfg = { demo: false, maxAds: 5, noPrint: false, maxRevisions: 5, loading: true };
// Statystyki bez cookies: zbiorcze odsłony i kroki kreatora (serwer nie zapisuje IP ani identyfikatorów).
const trackLater = []; // zdarzenia sprzed wczytania konfiguracji (np. powrót z płatności), wysyłane po „pv”
function track(e, x = {}) {
  if (cfg.loading) { if (trackLater.length < 10) trackLater.push([e, x]); return; }
  if (cfg.preview || !navigator.sendBeacon) return;
  try { navigator.sendBeacon('/api/t', JSON.stringify({ e, p: location.pathname, r: document.referrer, u: new URLSearchParams(location.search).get('utm_source') || AD_SRC, l: (document.documentElement.lang || 'pl').slice(0, 2), ...x })); } catch {}
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
  ['europass', 'W układzie Europass', 'Kolejność sekcji jak w CV Europass: języki z poziomami CEFR, umiejętności cyfrowe, prawo jazdy. Do projektów UE, uczelni i staży za granicą. To nie jest oficjalny dokument Europass.'],
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
// „W układzie Europass”: te same wyrażenia i etykiety co lib/europass.js (zgodność pilnuje test/europass.test.js).
const EU_DIGITAL = /(^|[^\p{L}])(excel|word|powerpoint|outlook|ms office|microsoft office|office 365|pakiet office|google (docs|sheets|workspace)|sap|wms|erp|crm|photoshop|canva|autocad|python|javascript|sql|html|css|jira|power bi|tableau|wordpress|figma|salesforce|subiekt|optima|symfonia|płatnik|enova|comarch|windows|linux|komputer\p{L}*|computer|programowani\p{L}*|programming)(?![\p{L}])/iu;
const EU_DRIVING = /prawo jazdy|prawa jazdy|driving licen[cs]e|führerschein|fahrerlaubnis|водійськ|посвідчення водія|permis de conduire|permiso de conducir|carnet de conducir|(^|[^\p{L}])kat\.?\s?[ABCDET](\+E)?(?![\p{L}])/iu;
const EU_LBL = {
  pl: { digital: 'Umiejętności cyfrowe', driving: 'Prawo jazdy', note: 'Układ wzorowany na Europass, przygotowany w cvpodogloszenie.pl. To nie jest oficjalny dokument Europass.' },
  en: { digital: 'Digital skills', driving: 'Driving licence', note: 'Layout modelled on the Europass CV, prepared at cvpodogloszenie.pl. This is not an official Europass document.' },
  de: { digital: 'Digitale Kompetenzen', driving: 'Führerschein', note: 'Aufbau in Anlehnung an den Europass-Lebenslauf, erstellt auf cvpodogloszenie.pl. Dies ist kein offizielles Europass-Dokument.' },
  uk: { digital: 'Цифрові навички', driving: 'Посвідчення водія', note: 'Структура за зразком Europass, підготовлено на cvpodogloszenie.pl. Це не офіційний документ Europass.' },
  es: { digital: 'Competencias digitales', driving: 'Permiso de conducir', note: 'Formato inspirado en el CV Europass, preparado en cvpodogloszenie.pl. No es un documento oficial de Europass.' },
  fr: { digital: 'Compétences numériques', driving: 'Permis de conduire', note: 'Mise en page inspirée d’Europass, préparée sur cvpodogloszenie.pl. Ce n’est pas un document officiel Europass.' },
};
const LBL2 = {
  pl: { cvTitle: 'Życiorys', personal: 'Dane osobowe', phone: 'Telefon', email: 'E-mail', city: 'Miejsce zamieszkania', birth: 'Data urodzenia', web: 'Profil', more: 'Umiejętności i języki', native: 'ojczysty', placeDate: 'Miejscowość, data', sign: 'Podpis', level: 'Poziom' },
  en: { cvTitle: 'Curriculum Vitae', personal: 'Personal details', phone: 'Phone', email: 'Email', city: 'Location', birth: 'Date of birth', web: 'Profile', more: 'Skills and languages', native: 'native', placeDate: 'Place, date', sign: 'Signature', level: 'Level' },
  de: { cvTitle: 'Lebenslauf', personal: 'Persönliche Daten', phone: 'Telefon', email: 'E-Mail', city: 'Wohnort', birth: 'Geburtsdatum', web: 'Profil', more: 'Kenntnisse und Fähigkeiten', native: 'Muttersprache', placeDate: 'Ort, Datum', sign: 'Unterschrift', level: 'Niveau' },
  uk: { cvTitle: 'Резюме', personal: 'Особисті дані', phone: 'Телефон', email: 'E-mail', city: 'Місце проживання', birth: 'Дата народження', web: 'Профіль', more: 'Навички та мови', native: 'рідна', placeDate: 'Місто, дата', sign: 'Підпис', level: 'Рівень' },
  es: { cvTitle: 'Currículum vitae', personal: 'Datos personales', phone: 'Teléfono', email: 'Correo', city: 'Residencia', birth: 'Fecha de nacimiento', web: 'Perfil', more: 'Habilidades e idiomas', native: 'nativo', placeDate: 'Lugar y fecha', sign: 'Firma', level: 'Nivel' },
  fr: { cvTitle: 'Curriculum vitae', personal: 'Informations personnelles', phone: 'Téléphone', email: 'E-mail', city: 'Domicile', birth: 'Date de naissance', web: 'Profil', more: 'Compétences et langues', native: 'langue maternelle', placeDate: 'Lieu, date', sign: 'Signature', level: 'Niveau' },
};
// Rodzaj pozycji kontaktowej (do tabel danych osobowych) i podział „język + poziom CEFR”.
// Data urodzenia (29.10, lib/generate.js: withBirth) przychodzi jako „Etykieta: wartość” – rodzaj „birth”, a przy własnej etykiecie pokazujemy samą wartość.
const BIRTH_RE = /^(Data urodzenia|Date of birth|Geburtsdatum|Дата народження|Fecha de nacimiento|Date de naissance):\s*/;
const contactVal = (x) => String(x).replace(BIRTH_RE, '');
const contactKind = (x) => (BIRTH_RE.test(x) ? 'birth' : /@/.test(x) ? 'email' : /^\+?[\d\s()./-]{7,}$/.test(x) ? 'phone' : /https?:|www\.|\.(com|pl|de|io|net|org|eu)\b|linkedin|github/i.test(x) ? 'web' : 'city');
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
  const L = LBL[lang] || LBL.pl, M = LBL2[lang] || LBL2.pl, EL = EU_LBL[lang] || EU_LBL.pl;
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
    persData: () => (contact.length ? sec(M.personal, el('dl', { className: 'kv' }, ...contact.flatMap((x) => [el('dt', { textContent: M[contactKind(x)] }), el('dd', { textContent: contactVal(x) })]))) : null),
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
    persLine: () => el('ul', { className: 'pl' }, ...contact.map((x) => el('li', {}, el('small', { textContent: M[contactKind(x)] + ': ' }), contactVal(x)))),
    eRows: (items, titleOf, orgOf) => items.map((e) => el('div', { className: 'ent' }, e.period ? el('div', { className: 'dt', textContent: e.period }) : null,
      el('div', { className: 'ttl', textContent: titleOf(e) || '' }), orgOf(e) ? el('div', { className: 'co', textContent: orgOf(e) }) : null,
      e.bullets?.length ? el('ul', {}, ...e.bullets.map((b) => el('li', {}, hl(b, kw)))) : null)),
    eExp: function () { return c.experience?.length ? sec(L.exp, ...this.eRows(c.experience, (e) => e.title, (e) => e.company)) : null; },
    eEdu: function () { return c.education?.length ? sec(L.edu, ...this.eRows(c.education, (e) => e.degree || e.school, (e) => (e.degree ? e.school : ''))) : null; },
    eList: (title, items) => (items.length ? sec(title, el('div', { textContent: items.join(' · ') })) : null),
    eRest: function () {
      const isD = (s) => EU_DRIVING.test(s), sk = c.skills || [], ce = c.certificates || [];
      return [this.eList(EL.digital, sk.filter((s) => EU_DIGITAL.test(s) && !isD(s))), this.eList(L.skills, sk.filter((s) => !EU_DIGITAL.test(s) && !isD(s))),
        this.eList(EL.driving, [...sk, ...ce].filter(isD)), this.eList(L.certs, ce.filter((s) => !isD(s)))];
    },
    euNote: () => el('p', { className: 'eu-note', textContent: EL.note }),
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
  europass: (k) => [el('header', { className: 'top' }, k.pic(), el('div', { className: 'who' }, k.name(), k.head(), k.persLine())), k.summary(), k.eExp(), k.eEdu(), k.eLangs(), ...k.eRest(), k.intr(), k.clause(), k.euNote()],
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
  cfg = c; if (c.chromeExt) { $('#chromeExt').href = c.chromeExt; $('#chromeExtBox').hidden = false; } window.CONSENT?.init(c.ads); track('pv'); trackLater.splice(0).forEach(([e, x]) => track(e, x)); drawLists(); if (c.prices) PRICE = { ...PRICE, ...c.prices }; refresh(); if ($('#xsell')) drawXsell(); $$('.linkbox').forEach((l) => { if (c.fakeFetch && !$('.hint', l)) l.append(el('p', { className: 'hint', textContent: 'Podgląd: link nie jest naprawdę pobierany, wstawiamy przykładowe ogłoszenie.' })); }); $('#demoBar').hidden = !c.demo; drawPromo(c.promo); drawTrust1(); if (c.salesClosed) $('#demoBar').textContent = 'Strona w przygotowaniu – zamówienia ruszą za kilka dni.'; $('#soonNote').hidden = !c.salesClosed; $('#fill').hidden = !c.demo; $('#printNote').hidden = !c.noPrint; $('#simNote').hidden = !c.demo;
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
// Przykład dla zawodu (B10): gdy ustawiony (dane z /content/cv/<slug>.json), okno przykładu pokazuje CV fikcyjnej osoby z tego zawodu.
let exProf = null;
const exResult = (i) => {
  if (exProf) return profResult(exProf);
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
const drawWizDesign = () => designPicker($('#wizDesign'), design, (d) => { design = d; saveDraft(); if (step === 6) drawSummary(); }, { thumbs: false }); // C3: mały wybór (nazwy i kolory) pod podglądem na ekranie podsumowania
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
  $('#exview').classList.toggle('ex-prof', !!exProf);
  if (exProf) {
    $('#exSide').replaceChildren(el('h3', {}, el('span', { textContent: 'Przykład dla zawodu:' }), ' ', exProf.name), el('p', { className: 'hint', textContent: 'Fikcyjna osoba. Twoje CV powstanie z Twoich danych i zostanie dopasowane do wymagań z Twojego ogłoszenia.' }));
    $('#exDocTabs').replaceChildren(); $('#exChanges').replaceChildren(); $('#exSample').replaceChildren();
    $('#exPaper').replaceChildren(cvNode(r, true, exDesign));
    return;
  }
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
// Znak wodny „PRZYKŁAD” na przykładowych dokumentach (blok A, 26.10), jak w /api/sample.pdf: zrzut ekranu nie wygląda jak gotowe CV.
const wmUrl = (t) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='340' height='220'><text x='20' y='150' transform='rotate(-28 170 110)' font-family='Inter,Arial,sans-serif' font-size='44' font-weight='700' fill='#2548E8' fill-opacity='0.16'>${t}</text></svg>`)}")`;
function openEx(i = 0, d) { $('#exPaper').style.setProperty('--wm', wmUrl(tr('PRZYKŁAD'))); exI = i; exDoc = 'cv'; if (d) Object.assign(exDesign, d); designPicker($('#exDesign'), exDesign, () => drawExView(), { thumbs: false }); drawExView(); modal(true); $('#exview').hidden = false; $('.exv-body').scrollTop = 0; setTimeout(() => $('#exClose').focus(), 0); }
const closeEx = () => { $('#exview').hidden = true; if ($('#wiz').hidden) modal(false); else lastFocus?.focus?.(); }; // przykład otwarty z kreatora: kreator zostaje modalem
// Film demo („Jak to działa”): link nad filmem przewija do niego i uruchamia odtwarzanie (bez autoodtwarzania).
document.addEventListener('click', (e) => { if (!e.target.closest('#demoFilmLink')) return; e.preventDefault(); const v = $('#demoFilm'); v.scrollIntoView({ behavior: 'smooth', block: 'center' }); v.play().catch(() => {}); });
document.addEventListener('click', (e) => { const b = e.target.closest('[data-example]'); if (b) openEx(+b.dataset.example || 0); });
$('#exClose').onclick = () => closeEx();
// Po zamknięciu przykładu zawodu okno wraca do zwykłego przykładu (trzy ogłoszenia).
new MutationObserver(() => { if ($('#exview').hidden && exProf) { exProf = null; exHead(); } }).observe($('#exview'), { attributes: true, attributeFilter: ['hidden'] });
// Nagłówek i stopka okna: przykład zawodu ma własny tytuł i przycisk „Zrób takie dla mojego ogłoszenia” (wraca do kreatora).
const EX_HEAD = [$('#exview h2').textContent, $('.exv-cta-txt').textContent, $('#exCta').textContent];
function exHead() {
  $('#exview h2').textContent = tr(exProf ? 'Przykład CV dla Twojego zawodu' : EX_HEAD[0]);
  $('.exv-cta-txt').textContent = tr(exProf ? 'Twoje CV powstanie pod Twoje ogłoszenie, z Twoich danych.' : EX_HEAD[1]);
  $('#exCta').textContent = tr(exProf ? 'Zrób takie dla mojego ogłoszenia' : EX_HEAD[2]);
}
$('#exCta').onclick = () => { const fromProf = !!exProf; closeEx(); if (fromProf && !$('#wiz').hidden) { track('profexcta'); $('#profExSel').blur(); return; } lastFocus = null; openWiz(); };
// Krok 1 (B10): lista zawodów z content.json (tylko po polsku – przykłady CV zawodów są w języku polskim).
async function profExInit() {
  if ((window.I18N?.lang || 'pl') !== 'pl' || $('#profExSel').options.length > 1) return;
  const C = await loadContent().catch(() => null); if (!C?.INDEX?.length) return;
  $('#profExSel').append(...[...C.INDEX].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map((p) => el('option', { value: p.slug, textContent: p.name })));
  $('#profEx').hidden = false;
}
$('#profExGo').onclick = async () => {
  const slug = $('#profExSel').value; if (!slug) return $('#profExSel').focus();
  try {
    exProf = await loadProf(slug); if (!exProf?.sample) throw new Error();
    exHead(); lastFocus = $('#profExGo'); track('profex'); openEx(0);
  } catch { exProf = null; }
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#exview').hidden) closeEx(); });
whenNear('#szablony', drawGallery);

/* ---------- Kreator ---------- */
const rowT = {
  exp: () => `<div class="grid4"><label class="f">Stanowisko<input type="text" data-k="title"></label><label class="f">Firma<input type="text" data-k="company"></label><label class="f">Od<input type="text" data-k="from" placeholder="03.2021"></label><label class="f">Do<input type="text" data-k="to" placeholder="obecnie"></label></div><label class="f">Obowiązki i osiągnięcia <span class="h">każdy punkt w nowej linii</span><textarea data-k="description"></textarea></label>`,
  edu: () => `<div class="grid4"><label class="f">Szkoła<input type="text" data-k="school"></label><label class="f">Kierunek / tytuł<input type="text" data-k="degree"></label><label class="f">Od<input type="text" data-k="from"></label><label class="f">Do<input type="text" data-k="to"></label></div>`,
  ads: () => `<div class="seg modes" role="tablist"><button type="button" role="tab" data-mode="link">Link do ogłoszenia</button><button type="button" role="tab" data-mode="photo">Zdjęcie ogłoszenia</button><button type="button" role="tab" data-mode="paste">Wklej treść</button><button type="button" role="tab" data-mode="prof">Bez ogłoszenia</button></div>
<div class="profbox" hidden><p class="hint">Nie masz jeszcze ogłoszenia? Przygotujemy CV pod typowe wymagania zawodu. Odznacz to, czego nie dotyczy. Gdy znajdziesz ofertę, dopasuj CV do niej.</p><label class="f">Zawód<span class="urlrow"><input type="text" class="profq" list="profList" autocomplete="off" placeholder="np. magazynier, kasjerka"><button type="button" class="btn sm profbtn">Pokaż wymagania</button></span></label><div class="profreqs"></div><input type="hidden" data-k="kind"></div>
<div class="photobox" hidden><b class="flabel">Zdjęcie lub zrzut ekranu ogłoszenia</b><label class="btn ghost filebtn"><span>Wybierz zdjęcie</span><input type="file" class="adphoto" accept="image/*"></label><p class="hint">Zrób zdjęcie ogłoszenia albo wgraj zrzut ekranu, np. z Facebooka, OLX lub grupy z ofertami. Odczytamy z niego treść.</p><div class="pstatus" role="status"></div></div>
<div class="linkbox"><label class="f">Adres ogłoszenia<span class="urlrow"><input type="text" data-k="url" inputmode="url" placeholder="https://…"><button type="button" class="btn sm fetchbtn">Pobierz</button></span></label><div class="fstatus" role="status"></div></div>
<div class="adfields"><label class="adlang">Język dokumentów <select data-k="lang"><option value="auto">jak w ogłoszeniu</option><option value="pl">polski</option><option value="en">angielski</option><option value="de">niemiecki</option><option value="uk">ukraiński</option><option value="es">hiszpański</option><option value="fr">francuski</option></select></label><label class="f">Nazwa stanowiska<input type="text" data-k="title" placeholder="np. Kasjer / Sprzedawca"></label><p class="hint title-auto" hidden>Uzupełnimy stanowisko z ogłoszenia.</p><label class="f">Treść ogłoszenia <span class="h">sprawdź i w razie potrzeby popraw</span><textarea data-k="text" style="min-height:150px"></textarea></label></div>`,
};
const label = { exp: 'Stanowisko', edu: 'Szkoła', ads: 'Ogłoszenie', fuAds: 'Ogłoszenie' };
function addRow(box, v = {}) {
  const e = el('div', { className: 'entry' });
  e.innerHTML = `<div class="etop"><span></span><button type="button" class="rm">Usuń</button></div>` + rowT[box === 'fuAds' ? 'ads' : box]();
  $('.rm', e).onclick = () => { e.remove(); renum(box); refresh(); };
  $('#' + box).append(e);
  Object.entries(v).forEach(([k, val]) => { const i = $(`[data-k="${k}"]`, e); if (i) i.value = val; });
  // Na telefonie domyślnie „Wklej treść” (kopiowanie z aplikacji z ogłoszeniami jest tam łatwiejsze niż link).
  if (box === 'ads' || box === 'fuAds') {
    initAd(e, v.kind === 'profession' ? 'prof' : v.text || matchMedia('(max-width: 640px)').matches ? 'paste' : 'link');
    if (v.kind === 'profession') { $('.profq', e).value = v.title || ''; $('.profreqs', e).append(el('p', { className: 'hint', textContent: 'Zapisane wymagania zawodu. Kliknij „Pokaż wymagania”, żeby je zmienić.' })); }
  }
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
  $('.adfields', e).hidden = mode === 'prof' || ((mode === 'link' || mode === 'photo') && !e.dataset.fetched);
  $('.profbox', e).hidden = mode !== 'prof';
  // „CV pod zawód”: pole kind = profession, treść „ogłoszenia” to typowe wymagania zawodu; poza tym trybem zwykłe ogłoszenie.
  const kind = $('[data-k=kind]', e), was = kind.value;
  kind.value = mode === 'prof' ? 'profession' : '';
  if (was === 'profession' && mode !== 'prof') { $('[data-k=text]', e).value = ''; $('[data-k=title]', e).value = ''; }
  if (mode === 'prof') { profList(); if (!passOn() && pkg() !== 'cv') { $('input[name=pkg][value=cv]').checked = true; } }
  if ($('#noAdQ') && e === $('#ads .entry') && mode === 'prof' && !$('#noAdQ').value) $('#noAdQ').value = $('.profq', e)?.value || '';
  refresh();
}
// Lista zawodów do podpowiedzi (z danych stron zawodów) – raz na stronę.
let profListDone = false;
function profList() {
  if (profListDone) return; profListDone = true;
  loadContent().then((C) => { const d = el('datalist', { id: 'profList' }); d.append(...(C.INDEX || []).map((p) => el('option', { value: p.name }))); document.body.append(d); }).catch(() => (profListDone = false));
}
// Tekst dla generatora (taki sam układ jak lib/prof-ad.js profAdText): zawód, typowe obowiązki i zaznaczone wymagania.
const profText = (name, reqs, duties) => [`CV pod zawód: ${name} (bez konkretnego ogłoszenia – typowe wymagania tego zawodu).`, duties.length ? `Typowe obowiązki: ${duties.join('; ')}.` : '',
  reqs.length ? `Typowe wymagania: ${reqs.join('; ')}.` : `Typowe wymagania: dobierz najczęstsze wymagania w ogłoszeniach dla zawodu „${name}” w Polsce.`].filter(Boolean).join('\n');
function initProf(e) {
  const q = $('.profq', e), box = $('.profreqs', e), btn = $('.profbtn', e);
  const run = async () => {
    const v = q.value.trim(); box.replaceChildren();
    if (v.length < 3) { box.append(el('p', { className: 'fstatus bad', textContent: 'Wpisz nazwę zawodu, np. magazynier.' })); return; }
    btn.disabled = true;
    try {
      const r = await fetch(`/api/prof-reqs?q=${encodeURIComponent(v)}`), j = await r.json();
      const name = j.slug ? j.name : v, boxes = j.reqs.map((x) => el('input', { type: 'checkbox', value: x, checked: true }));
      const write = () => { $('[data-k=title]', e).value = name.slice(0, 100); $('[data-k=text]', e).value = profText(name, boxes.filter((c) => c.checked).map((c) => c.value), j.duties || []); saveDraft(); refresh(); };
      boxes.forEach((c) => c.addEventListener('change', write));
      box.append(el('p', { className: 'hint', textContent: j.slug ? `Typowe wymagania w ogłoszeniach: ${name}. Odznacz to, czego nie dotyczy – CV i tak pokaże tylko to, co wpiszesz o sobie.` : `Nie mamy listy dla „${v}”. Typowe wymagania tego zawodu dobierzemy przy pisaniu CV.` }),
        el('div', { className: 'kw-pick' }, ...boxes.map((c) => el('label', { className: 'check' }, c, ' ', c.value))),
        el('p', { className: 'note', textContent: 'CV pod zawód to jedno CV bez listu motywacyjnego, 39 zł. Gdy znajdziesz ogłoszenie, zamów CV z listem pod konkretną ofertę.' }), el('p', { className: 'hint small', textContent: 'To CV nie jest dopasowane do konkretnego pracodawcy – gdy znajdziesz ogłoszenie, zamów CV pod ofertę.' }));
      write();
    } catch { box.append(el('p', { className: 'fstatus bad', textContent: 'Nie udało się pobrać wymagań. Spróbuj ponownie.' })); }
    btn.disabled = false;
  };
  btn.onclick = run; q.onkeydown = (k) => { if (k.key === 'Enter') { k.preventDefault(); run(); } };
  e.profRun = (name) => { q.value = name; return run(); };
}
// „Zrób zwykłe CV pod swój zawód” (hero, ?tryb=zawod bez zawodu): pierwsze ogłoszenie w trybie „Bez ogłoszenia”, kursor w polu zawodu.
function profStart() {
  const first = $('#ads .entry'); if (!first || $('[data-k=text]', first).value.trim() && first.dataset.mode !== 'prof') return;
  setMode(first, 'prof'); setTimeout(() => $('.profq', first)?.focus(), 50);
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
      $('[data-k=title]', e).value = j.title || ''; $('[data-k=text]', e).value = j.text; if (!j.title) fillTitle(e);
      e.dataset.fetched = '1'; delete e.dataset.linkErr; setMode(e, 'link');
      status.textContent = `Pobrano${j.title ? ': „' + j.title + '”' : ''}${j.company ? ' (' + j.company + ')' : ''}, ${j.text.length} znaków. Sprawdź treść poniżej.`;
      status.classList.add('good');
    } catch (x) {
      e.dataset.fetched = '1'; e.dataset.linkErr = '1'; $('.adfields', e).before(status); setMode(e, 'paste');
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
      $('[data-k=title]', e).value = j.title || ''; $('[data-k=text]', e).value = j.text; if (!j.title) fillTitle(e);
      e.dataset.fetched = '1'; setMode(e, 'photo'); refresh();
      ps.replaceChildren(el('span', { textContent: 'Odczytano ogłoszenie ze zdjęcia.' }), ' ', el('span', { textContent: 'Sprawdź treść poniżej i popraw, jeśli coś się nie zgadza.' }), j.demo ? el('span', { textContent: ' Podgląd: wstawiamy przykładowe ogłoszenie.' }) : '');
      ps.classList.add('good');
    } catch (x) { ps.replaceChildren(el('span', { textContent: x.message || 'Nie udało się odczytać zdjęcia.' }), ' ', el('span', { textContent: 'Możesz też wkleić treść ogłoszenia.' })); ps.classList.add('bad'); }
    file.value = '';
  };
  $('[data-k=url]', e).onkeydown = (k) => { if (k.key === 'Enter') { k.preventDefault(); run(); } };
  initProf(e);
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
// Wersja angielska profilu LinkedIn: opcja widoczna tylko przy zaznaczonym dodatku.
$('#adLinkedin')?.addEventListener('change', () => { $('#liEnBox').hidden = !$('#adLinkedin').checked; });
const extraLangs = () => $$('#langPick input:checked').map((i) => i.value);
// Pakiet „Pewna rozmowa”: list + przygotowanie do rozmowy + symulator razem taniej (tak samo liczy serwer, lib/pricing.js).
const bundleOn = () => pkg() !== 'cv' && addons().interview && addons().sim;
const addonsTotal = () => Object.entries(addons()).reduce((s, [k, on]) => s + (on ? PRICE[k] : 0), 0) + PRICE.extraLang * extraLangs().length - (bundleOn() ? PRICE.bundleOff : 0);
// Kod outplacementowy (D7): pokrywa też dodatki z voucherAddons (zaznaczone); przy „Pewnej rozmowie” przygotowanie jest już tańsze o bundleOff.
const voucherAddonsOff = () => (promo?.voucherAddons || []).reduce((s, k) => s + (addons()[k] ? PRICE[k] - (k === 'interview' && bundleOn() ? PRICE.bundleOff : 0) : 0), 0);
const discount = () => (promo?.voucher ? Math.min(PRICE[pkg()], PRICE[promo.voucher]) + voucherAddonsOff() : promo ? Math.min(promo.percent ? Math.round((PRICE[pkg()] + addonsTotal()) * promo.percent) / 100 : promo.discount, PRICE[pkg()] - 2) : 0);
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

const DKEY = 'cvpo-draft-v1', FIELDS = ['name', 'email', 'phone', 'city', 'link', 'birth', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'];
let saveT, restoring = false;
const draftData = () => ({ step, design, photo, addons: { ...addons(), linkedinEn: $('#adLinkedinEn').checked }, langs: extraLangs(), pkg: pkg(), f: Object.fromEntries(FIELDS.map((k) => [k, $('#' + k).value])), exp: rows('exp'), edu: rows('edu'), ads: rows('ads') });
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
  if (d.addons) { Object.entries(ADDON_KEYS).forEach(([k, [sel]]) => ($(sel).checked = !!d.addons[k])); $('#adLinkedinEn').checked = !!d.addons.linkedinEn; $('#liEnBox').hidden = !$('#adLinkedin').checked; }
  (d.langs || []).forEach((l) => { const i = $(`#langPick input[value="${l}"]`); if (i) i.checked = true; });
  setPhoto(d.photo || '');
  ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); (d[b]?.length ? d[b] : [{}]).forEach((v) => addRow(b, v)); });
  restoring = false; refresh();
  return true;
}
// Linia „Pakiet: Samo CV – 39 zł · Zmień pakiet” zamiast nagłówka, zdania i trzech opcji (rozwijane na żądanie).
function drawPkgLine() {
  const line = $('#pkgLine'); if (!line) return;
  const today = $('#pkgOpts').previousElementSibling, head = today?.previousElementSibling, off = passOn() || !pkgOpen;
  if (today) today.hidden = off; if (head) head.hidden = off; line.hidden = passOn() || pkgOpen;
  $('#pkgLineName').textContent = `${PKG_LINE[pkg()] || PKG_LINE.cv} – ${PRICE[pkg()] ?? PRICE.cv} zł`;
}
function refresh() {
  if ($('#langPick').children.length) syncLangPick();
  $$('.pack3Unit').forEach((x) => (x.textContent = `${PRICE.pack3} zł = ${(PRICE.pack3 / 3).toFixed(2).replace('.', ',')} zł`)); // B6: cena za jedno CV w Pakiecie 3
  $('#letterDiff').textContent = `${PRICE.cv_letter - PRICE.cv} zł`; $('#nextPrice').textContent = `${PRICE.cv_next} zł`; $('#nextLetterPrice').textContent = `${PRICE.cv_next + PRICE.cv_letter - PRICE.cv} zł`; // „Polecany”: dopłata za list do tego samego ogłoszenia, z cennika
  saveDraft();
  $('#total').textContent = total() + ' zł'; if (step === 6) payTrust(6);
  $('#bundleTip').textContent = pkg() === 'cv' ? '' : bundleOn() ? `Masz pakiet „Pewna rozmowa”: ${PRICE.bundleOff} zł taniej.` : `Pakiet „Pewna rozmowa”: zaznacz przygotowanie do rozmowy i symulator, a zapłacisz ${PRICE.bundleOff} zł mniej.`;
  $('#bundleTip').hidden = pkg() === 'cv';
  // Na ostatnim kroku pod „Razem” małym drukiem: „jednorazowo, bez abonamentu” (29.10: zamiast górnej ramki „Do zapłaty”).
  $('#brk').textContent = [addonsTotal() ? `dodatki ${addonsTotal()} zł` : '', discount() ? `rabat −${discount()} zł` : '', step === 6 ? 'jednorazowo, bez abonamentu' : ''].filter(Boolean).join(' · ');
  $$('.opt b[data-price]').forEach((b) => (b.textContent = `+${PRICE[b.dataset.price]} zł`));
  $('#pkgOpts').hidden = passOn() || !pkgOpen; drawPkgLine();
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
// C6: stanowisko z treści ogłoszenia (ta sama funkcja co lib/ad-title.js). Pole wypełnione automatycznie zmienia się razem z treścią,
// wpisane ręcznie zostaje. Puste stanowisko nie blokuje „Dalej” – uzupełni je serwer (cleanAds) i AI z treści ogłoszenia.
function guessTitle(text) {
  const PORTALS = /\b(?:pracuj\.pl|olx praca|olx(?:\.pl)?|indeed(?:\.com)?|linkedin|jooble|gowork(?:\.pl)?|aplikuj\.pl|praca\.pl|infopraca(?:\.pl)?|nofluffjobs|justjoin\.it|theprotocol\.it|facebook)\b/gi;
  const PREFIX = /^(?:ogłoszenie|oferta pracy|oferta|praca|stanowisko|nazwa stanowiska|job title|position|stelle)\s*[:–-]\s*/i;
  for (const raw of String(text || '').split(/\r?\n/)) {
    let line = raw.replace(PORTALS, '').replace(/^[\s|•·:–-]+|[\s|•·:–-]+$/g, '').replace(PREFIX, '').replace(/^(?:poszukujemy|szukamy|zatrudnimy|zatrudni[mę]?|zatrudni)\s+/i, '').trim();
    line = line.split(/[.!?](?=\s+\p{Lu}\p{Ll})|[.!?]$/u)[0].trim(); // koniec zdania, nie skrót („ds. obsługi”, „kat. C”)
    if (line.length >= 3 && /\p{L}{2}/u.test(line)) return (line.charAt(0).toUpperCase() + line.slice(1)).slice(0, 60).trim();
  }
  return '';
}
function fillTitle(e) {
  const t = $('[data-k=title]', e), text = $('[data-k=text]', e)?.value || '';
  if (!t) return;
  if (!t.value.trim() || t.dataset.auto) { const g = guessTitle(text); t.value = g; if (g) t.dataset.auto = '1'; else delete t.dataset.auto; }
  const h = $('.title-auto', e); if (h) h.hidden = !!t.value.trim() || !text.trim();
}
$('#ads').addEventListener('input', (ev) => {
  const e = ev.target.closest('.entry'); if (!e) return;
  if (ev.target.matches('[data-k=title]')) { delete ev.target.dataset.auto; const h = $('.title-auto', e); if (h) h.hidden = !!ev.target.value.trim() || !$('[data-k=text]', e).value.trim(); }
  else if (ev.target.matches('[data-k=text]')) fillTitle(e);
});
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
    promo = j;
    // Kod z dodatkami w cenie: od razu pakiet i dodatki z kodu (klient może je odznaczyć).
    if (j.voucherAddons) { const r = $(`input[name=pkg][value=${j.voucher}]`); if (r) r.checked = true; for (const k of j.voucherAddons) { const sel = ADDON_KEYS[k]?.[0], b = sel && $(sel); if (b && !b.checked) { b.checked = true; b.dispatchEvent(new Event("change")); } } }
    st.className = 'fstatus good'; st.textContent = j.voucherAddons ? `${j.label}: ${PKG_NAME[j.voucher]} i dodatki bez opłaty` : j.voucher ? `${j.label}: ${PKG_NAME[j.voucher]} bez opłaty` : `${j.label}: −${j.percent ? j.percent + '%' : j.discount + ' zł'}`;
  } catch (x) { promo = null; if (!quiet) { st.className = 'fstatus bad'; st.textContent = x.message; } }
  refresh(); if (step === 6) { drawSummary(); nextLabel(); }
}
$('#codeApply').onclick = () => applyCode($('#codeInput').value);
$('#toPack').onclick = () => { $('input[name=pkg][value=pack3]').checked = true; refresh(); $('#werr').textContent = ''; };
// Krok 1 z mniejszą liczbą decyzji (28.10): pakiet domyślnie „Samo CV”, wybór zwinięty do linii „Zmień pakiet”;
// wyraźna opcja „Nie mam ogłoszenia – wpisz tylko stanowisko” (tryb „Bez ogłoszenia” pierwszego ogłoszenia, CV pod zawód).
const PKG_LINE = { cv: 'Samo CV', cv_letter: 'CV + list motywacyjny', pack3: 'Pakiet 3 CV + listy' };
$('#pkgOpts').previousElementSibling.previousElementSibling.before(el('p', { className: 'pkg-line', id: 'pkgLine' }, el('span', { textContent: 'Pakiet:' }), ' ', el('b', { id: 'pkgLineName' }), ' ', el('button', { type: 'button', className: 'link', id: 'pkgChange', textContent: 'Zmień pakiet', onclick: () => { pkgOpen = true; refresh(); $('#pkgOpts input:checked')?.focus(); } })));
// 29.10: „Nie mam ogłoszenia – wpisz stanowisko” na samym dole kroku 1, pod „Zobacz przykład CV dla Twojego zawodu”:
// pole zawodu z podpowiedziami (lista zawodów), a wymagania pokazujemy w pierwszym ogłoszeniu (tryb „Bez ogłoszenia”).
const noAdRun = () => {
  const first = $('#ads .entry'), q = $('#noAdQ').value.trim(); if (!first) return;
  if (q.length < 3) { $('#noAdQ').focus(); $('#noAdQ').classList.add('err'); return; }
  $('#noAdQ').classList.remove('err'); setMode(first, 'prof'); first.profRun?.(q); first.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
$('#profEx').after(el('div', { className: 'noad-box', id: 'noAdBox' }, el('label', { className: 'f', htmlFor: 'noAdQ' }, el('b', { textContent: 'Nie mam ogłoszenia – wpisz stanowisko' }), ' ', el('span', { className: 'h', textContent: 'zrobimy CV pod typowe wymagania zawodu' })),
  el('span', { className: 'urlrow' }, el('input', { type: 'text', id: 'noAdQ', autocomplete: 'off', placeholder: 'np. magazynier, kasjerka', onfocus: profList, onkeydown: (k) => { if (k.key === 'Enter') { k.preventDefault(); noAdRun(); } } }), el('button', { type: 'button', className: 'btn sm', id: 'noAdGo', textContent: 'Pokaż wymagania', onclick: noAdRun }))));
$('#noAdQ').setAttribute('list', 'profList');
{
  const ref = new URLSearchParams(location.search).get('ref');
  try { if (ref) localStorage.setItem(REF_KEY, ref); } catch {}
  let saved = ref; try { saved = saved || localStorage.getItem(REF_KEY); } catch {}
  if (saved) { $('#codeInput').value = saved; $('#refBanner').hidden = false; if (/^WITAJ-/i.test(saved)) $('#refBanner').textContent = 'Masz kod powitalny −10 zł. Wpiszemy go automatycznie w podsumowaniu zamówienia.'; }
}
$('#wizForm').addEventListener('input', saveDraft);
$('#gwBox').addEventListener('change', () => payTrust(step));
// 29.10: bez górnej ramki „Do zapłaty” (kwota tylko na dole przy „Razem”, tuż nad przyciskiem) – w obu wariantach testu.
if (CHECKOUT_B) {
  for (const id of ['consent', 'waiver']) $('#' + id).closest('label').classList.add('compact');
}
$('#addExp').onclick = () => addRow('exp');
$('#addEdu').onclick = () => addRow('edu');
$('#addAd').onclick = () => addRow('ads');

// Wybór bramki płatności (tryb „both”: Stripe i Przelewy24, /api/config → pay.gateways). Jedna bramka → bez wyboru.
// Etykiety neutralne: metody, nie nazwa operatora Stripe; Przelewy24 – nazwą (bez logo).
const payGateways = () => cfg.pay?.gateways || [];
// Etykieta Stripe: pojedyncze metody tłumaczone osobno (słownik i18n), składane dopiero po tłumaczeniu.
const tr = (s) => window.I18N?.t?.(s) ?? s;
const gwLabel = (g) => (g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / '));
function gwPicker(box, name, pick = payGateways()[0]?.id) {
  const gs = payGateways();
  box.hidden = gs.length < 2; if (box.hidden) return box.replaceChildren();
  box.replaceChildren(el('fieldset', { className: 'gw-pick' }, el('legend', { textContent: 'Metoda płatności' }),
    ...gs.map((g) => el('label', { className: 'check' }, el('input', { type: 'radio', name, value: g.id, checked: g.id === pick }), ' ', (() => { const s = el('span', { textContent: gwLabel(g) }); s.setAttribute('data-noi18n', ''); return s; })()))));
  return box;
}
const gwValue = (root) => root?.querySelector('input[type=radio]:checked')?.value || undefined;
// Pod przyciskiem płatności: metody faktycznie włączone u operatora (/api/config → pay), bezpieczeństwo, czas i e-mail.
// „Dostajesz” nad przyciskiem płatności (decyzja 26.10): co obejmuje zamówienie – z pakietu i dodatku Word, bez obietnic.
function getLine(on) {
  const g = $('#getLine'); g.hidden = !on; if (!on) return;
  const prof = rows('ads')[0]?.kind === 'profession', p = orderPkg();
  const what = prof ? 'CV pod Twój zawód' : p === 'pack3' ? 'CV z listami motywacyjnymi, każde pod swoje ogłoszenie' : p === 'cv_letter' ? 'CV i list motywacyjny pod to ogłoszenie' : 'CV pod to ogłoszenie';
  // 29.10: poprawki, czas i faktura są już na liście korzyści nad zgodami – tu tylko co i w jakim formacie (bez powtórzeń).
  const parts = [what, addons().docx ? 'w PDF i Word' : 'w PDF'].map(tr); // każdy kawałek osobno w słowniku i18n
  g.replaceChildren(el('b', { textContent: tr('Dostajesz:') }), ` ${parts[0]} ${parts[1]}. `, guarLink());
}
// Gwarancja dopasowania (C5): link do §7a regulaminu w języku strony.
const guarLink = () => el('a', { href: `${legalUrl('regulamin', window.I18N?.lang || 'pl')}#gwarancja`, textContent: tr('Nie pasuje po poprawkach? Zwracamy pieniądze.') });
// Krok 1 (B7): kompaktowy pasek zaufania – metody płatności z bramek (/api/config → pay), faktura, usuwanie danych, poprawki, link do danych firmy.
function drawTrust1() {
  const box = $('#trust1'), ms = [...new Set(payGateways().length ? payGateways().flatMap((g) => g.methods || []) : cfg.pay?.methods || [])].filter((m) => m !== 'Przelewy24');
  const rev = cfg.maxRevisions || 5;
  const items = [
    el('span', { textContent: (ms.length ? ms : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ') }),
    el('span', { textContent: 'faktura na życzenie' }),
    el('span', { textContent: 'dane usuwane po 30 dniach' }),
    el('span', {}, `${rev} `, el('span', { textContent: plural(rev, 'poprawka w cenie', 'poprawki w cenie', 'poprawek w cenie') })),
    el('a', { href: '/kontakt', textContent: 'Dane firmy' }), guarLink()].filter(Boolean);
  box.replaceChildren(...items.flatMap((x, i) => (i ? [' · ', x] : [x]))); box.hidden = false;
}
function payTrust(n) {
  const box = $('#payTrust'), on = n === 6 && total() > 0;
  getLine(on);
  $('.wiz-foot').classList.toggle('pay', n === 6);
  box.hidden = true; $('#payTrustList').hidden = !on; // linia pod przyciskiem powtarzała listę korzyści (29.10) – zostaje tylko lista
  if (n === 6 && total() > 0) { if (!$('#gwBox').childElementCount) gwPicker($('#gwBox'), 'gw'); } else $('#gwBox').hidden = true;
  if (!on) return;
  const g = payGateways().find((x) => x.id === gwValue($('#gwBox'))) || cfg.pay;
  const parts = CHECKOUT_B ? (g?.methods || []).map((m) => el('span', { className: 'payico', textContent: m })) : [...(g?.methods || []).map((m, i, a) => [el('span', { textContent: m }), i < a.length - 1 ? ', ' : '']).flat()];
  const items = [parts.length ? parts : null, g ? [el('span', { textContent: `bezpieczna płatność przez ${g.provider}` })] : null, [el('span', { textContent: 'dokumenty zwykle gotowe w kilka minut' })], [el('span', { textContent: 'PDF także na e-mail' })]].filter(Boolean);
  box.replaceChildren(...items.flatMap((x, i) => (i ? [' · ', ...x] : x)));
  // Blok zaufania nad przyciskiem płatności (tak samo w obu wariantach testu „checkout”): metody płatności tekstem (bez logotypów), poprawki, czas, dane, faktura.
  const rev = cfg.maxRevisions || 5;
  $('#payTrustList').replaceChildren(...[
    g?.methods?.length ? el('li', { className: 'pt-methods' }, ...g.methods.map((m) => el('span', { className: 'payico', textContent: m }))) : null,
    el('li', {}, `${rev} `, el('span', { textContent: plural(rev, 'poprawka w cenie', 'poprawki w cenie', 'poprawek w cenie') })),
    el('li', { textContent: 'Gotowe zwykle w kilka minut – e-mailem i na stronie' }),
    el('li', { textContent: 'Dane usuwane automatycznie po 30 dniach' }),
    el('li', { textContent: 'Faktura na życzenie' })].filter(Boolean));
}
const nextLabel = () => ($('#next').textContent = step === 6 ? (total() === 0 ? 'Zamów bez opłaty' : fullOn() ? `${tr('Odblokuj swoje CV –')} ${total()} zł` : cfg.demo ? `Przejdź do płatności · ${total()} zł` : `Zapłać ${total()} zł`) : 'Dalej');
function go(n) {
  if (n !== 7) n = stepOf(n); // C3: kroki 3–5 (stare szkice, linki) → ekran z tymi polami
  step = n; refresh(); if (!$('#wiz').hidden) track('step', { s: n }); // refresh po zmianie kroku: dopisek pod „Razem” na ostatnim kroku
  $$('#wiz section[data-step]').forEach((s) => (s.hidden = +s.dataset.step !== n));
  const idx = n === 7 ? ORDER.length : ORDER.indexOf(n);
  $('#stepper').replaceChildren(...ORDER.map((_, i) => el('li', { className: i < idx ? 'done' : i === idx ? 'cur' : '' })));
  $('#wizKicker').textContent = n <= 6 ? `Krok ${idx + 1} z ${ORDER.length}` : 'Płatność';
  $('#wizTitle').textContent = n <= 6 ? STEP_TITLE(n) : 'Zapłać za zamówienie';
  $('#back').hidden = idx === 0 || n === 7;
  $('#next').hidden = n === 7;
  nextLabel(); payTrust(n);
  if (n === 6) { if ($('#codeInput').value && !promo) applyCode($('#codeInput').value, true); $('#codeBox').open ||= !!$('#codeInput').value.trim() || !!promo; $('#moreOpts').open ||= Object.values(addons()).some(Boolean) || extraLangs().length > 0; drawSummary(); }
  $('#werr').textContent = '';
  $('.wiz-body').scrollTop = 0;
}
// Podgląd przed płatnością: na prośbę klienta, raz na sesję kreatora; reszta CV jako rozmazany szkielet z fikcyjnym tekstem.
let pvSid = '', pvShown = null, pvOff = false;
const pvSig = () => JSON.stringify([['headline', 'summary', 'skills'].map((k) => $('#' + k).value), rows('exp'), rows('edu'), rows('ads')[0]?.text || '']);
// Pełne CV przed płatnością (C1): po kliknięciu „Pokaż moje CV” (działanie na żądanie – dane idą do AI dopiero wtedy). Serwer generuje całe CV i oddaje tylko obrazek strony 1
// (górne 40% czytelne, reszta rozmyta). Generowanie trwa ok. minuty: serwer odpowiada „pending”, pytamy ponownie co 3 s.
// Po limicie (1 na sesję, 2 na IP dziennie, dzienny limit strony) albo błędzie – lekki podgląd poniżej (A1).
let fullPv = null, fullOff = false, fullRun = '';
// Podpis danych (nowa generacja) osobno od podpisu obrazka (wygląd, pakiet → cena w stopce): zmiana wyglądu na ekranie podsumowania
// tylko odświeża obrazek z wyniku zapisanego na serwerze (C3), bez nowej generacji i bez limitu.
const fullOn = () => !!fullPv && fullPv.sig === fullSig();
const fullSig = () => JSON.stringify([pvSig(), $('#rewriteMode').checked, ...['name', 'email', 'phone', 'city', 'link', 'birth'].map((k) => $('#' + k).value)]);
const imgSig = () => JSON.stringify([design, orderPkg()]);
const pvProfile = () => ({ ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'birth', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, $('#' + k).value])), experience: rows('exp'), education: rows('edu') });
const fullAvail = () => !fullOff && !!cfg.aiPreview && !!rows('ads')[0]?.text && (rows('exp').length > 0 || rows('edu').length > 0);
async function fullPreview() {
  const ad = rows('ads')[0], sig = fullSig(), isig = imgSig(), redraw = fullPv?.sig === sig;
  if ((!redraw && !fullAvail()) || fullRun === sig + isig) return;
  if (redraw && fullPv.isig === isig) return drawFull(fullPv);
  fullRun = sig + isig;
  $('#pvBox').hidden = false; $('#pvEx').hidden = true; $('#pvBtn').hidden = true; $('#pvTitle').textContent = tr('Twoje CV pod to ogłoszenie');
  if (!redraw) $('#pvHint').textContent = tr('Piszemy Twoje CV pod to ogłoszenie, zwykle około minuty. Twoje dane i ogłoszenie trafiają w tym celu do dostawcy AI, tak jak przy zamówieniu.');
  if (!redraw) $('#pvOut').replaceChildren(el('div', { className: 'pv-wait' }, el('span', { className: 'spinner sm', ariaHidden: 'true' }), el('span', { textContent: tr('Piszemy Twoje CV…') })));
  const body = JSON.stringify({ sid: pvSid, profile: pvProfile(), ad, lang: window.I18N?.lang || 'pl', narrow: matchMedia('(max-width: 640px)').matches, design, pkg: orderPkg(), mode: $('#rewriteMode').checked ? 'rewrite' : '' });
  try {
    for (let i = 0; i < 100; i++) {
      const r = await (await fetch('/api/preview-full', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).json();
      if (fullRun !== sig + isig) return; // dane zmienione w trakcie
      if (r.pending) { await new Promise((ok) => setTimeout(ok, 3000)); continue; }
      if (!r.full || !r.image) break;
      fullPv = { ...r, sig, isig }; fullRun = ''; drawFull(fullPv); nextLabel(); return;
    }
  } catch {}
  if (redraw) { fullRun = ''; return; } // nie udało się tylko przerysować: zostaje poprzedni obrazek
  // Limit albo błąd: od razu lekki podgląd (A1) – klient już poprosił o podgląd.
  fullOff = true; fullRun = ''; fullPv = null; pvHead(); nextLabel();
  if (!pvShown && step === 6) lightPreview();
}
function drawFull(r) {
  $('#pvBox').hidden = false; $('#pvEx').hidden = true; $('#pvBtn').hidden = true; $('#pvTitle').textContent = tr('Twoje CV pod to ogłoszenie');
  $('#pvHint').textContent = tr('Tak wygląda Twoje CV. Po płatności dostaniesz dokładnie to CV w PDF, bez znaku wodnego i rozmycia.');
  $('#pvOut').replaceChildren(el('img', { className: 'pv-img', src: r.image, alt: tr('Podgląd Twojego CV ze znakiem wodnym, dolna część rozmyta'), draggable: false }));
}
// Nagłówek bloku przed kliknięciem: pełne CV (z notką o AI) albo – po limicie / bez danych – lekki podgląd A1.
const PV_HEAD = [$('#pvTitle').textContent, $('#pvHint').textContent];
const pvHead = () => {
  const f = fullAvail();
  $('#pvTitle').textContent = tr(f ? 'Zobacz swoje CV przed płatnością' : PV_HEAD[0]);
  $('#pvHint').textContent = tr(f ? 'Twoje dane trafią do dostawcy AI tylko po to, żeby przygotować ten podgląd.' : PV_HEAD[1]);
  $('#pvBtn').textContent = tr(f ? 'Pokaż moje CV' : 'Pokaż podgląd'); $('#pvBtn').classList.toggle('ghost', !f); // pełny podgląd: wyraźny przycisk
};
// Podgląd jako obrazek z serwera (blok A, 26.10): tekst podsumowania nie trafia do DOM; obrazka nie da się zaznaczyć ani przeciągnąć.
function drawPreview(r) {
  $('#pvOut').replaceChildren(el('img', { className: 'pv-img', src: r.image, alt: tr('Podgląd początku CV ze znakiem wodnym'), draggable: false }),
    el('p', { className: 'hint', textContent: 'Pełne CV, dopasowane do ogłoszenia, dostaniesz po płatności. Nagłówek i podsumowanie będą spójne z tym podglądem.' }));
  $('#pvBtn').hidden = true;
}
['copy', 'cut', 'contextmenu', 'dragstart'].forEach((ev) => $('#pvOut').addEventListener(ev, (e) => e.preventDefault()));
$('#pvBtn').onclick = () => (fullAvail() ? fullPreview() : lightPreview());
async function lightPreview() {
  const b = $('#pvBtn'), ad = rows('ads')[0], v = (id) => $('#' + id).value;
  if (!ad?.text) return;
  b.disabled = true; b.textContent = 'Przygotowuję podgląd…';
  try {
    const profile = { ...Object.fromEntries(['name', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), experience: rows('exp'), education: rows('edu') };
    const r = await (await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: pvSid, profile, ad, lang: window.I18N?.lang || 'pl', narrow: matchMedia('(max-width: 640px)').matches }) })).json();
    if (r.off || !r.image) { pvOff = true; $('#pvBox').hidden = true; $('#pvEx').hidden = false; return; } // AI niedostępne albo limit: blok znika bez komunikatu o błędzie
    pvShown = { ...r, sig: pvSig() }; drawPreview(r); // zdarzenie preview_shown liczy serwer
  } catch { pvOff = true; $('#pvBox').hidden = true; $('#pvEx').hidden = false; }
  finally { b.disabled = false; b.textContent = tr('Pokaż podgląd'); }
}
// Podgląd dopasowania (krok podsumowania): wymagania z każdego ogłoszenia (silnik skanera bez AI, /api/wizard-match)
// i które z nich widać w danych z formularza; bez doświadczenia – sama liczba wymagań. Przy kilku ogłoszeniach zwinięte.
let matchSig = '';
// Niskie dopasowanie (29.10): pod „Twoje doświadczenie pokrywa X z N” 2–3 spokojne linijki z maks. 3 brakującymi wymaganiami
// i przyciskiem „Uzupełnij doświadczenie” (krok 2, kursor w opisie ostatniego stanowiska; nic nie wpisujemy za klienta).
// Po powrocie wynik liczy ten sam /api/wizard-match (bez AI); bez zmiany wyniku wskazówka się nie powtarza. Nic nie blokuje płatności.
let lowHint = null; // { ad, before, gain } po kliknięciu „Uzupełnij doświadczenie”
const LOW_MATCH = 40;
// do 3 słów; bez nawiasu (całego lub uciętego) i bez przecinka/myślnika na końcu: „praca zmianowa (3 zmiany)” → „praca zmianowa”
const shortKw = (k) => k.split(/\s+/).slice(0, 3).join(' ').replace(/\s*\(.*$/, '').replace(/[\s,;:.–—-]+$/, '') || k.replace(/[()]/g, '').split(/\s+/).slice(0, 3).join(' ');
function lowMatchEdit(ad, before) {
  lowHint = { ad, before }; track('lowedit'); go(2);
  const ta = $$('#exp .entry [data-k=description]').at(-1); if (!ta) return;
  setTimeout(() => { ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); }, 50);
}
async function drawWizMatch() {
  const box = $('#wizMatch'), ads = rows('ads').filter((a) => a.text);
  const cv = [$('#headline').value, $('#summary').value, $('#skills').value, $('#certificates').value, ...rows('exp').flatMap((e) => [e.title, e.company, e.description])].filter(Boolean).join('\n'), hasExp = rows('exp').some((e) => e.title || e.description);
  const sig = JSON.stringify([cv, hasExp, ads.map((a) => a.text), lowHint]);
  if (!ads.length) { box.hidden = true; matchSig = ''; return; }
  if (sig === matchSig) return; matchSig = sig;
  try {
    const r = await fetch('/api/wizard-match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv: hasExp ? cv : '', ads: ads.map((a) => a.text) }) });
    if (!r.ok) throw new Error(); const j = await r.json(); if (sig !== matchSig) return;
    const chips = (xs, c) => el('div', { className: 'pv-kw' }, ...xs.map((k) => el('span', { className: `chip ${c}`, textContent: k })));
    let hinted = false;
    const lowLines = (m, i) => {
      const pct = Math.round((100 * m.found.length) / m.n);
      if (lowHint?.ad === i && pct > lowHint.before && lowHint.gain == null) { lowHint.gain = pct; track('lowgain', { b: lowHint.before, a: pct }); }
      if (!hasExp || hinted || m.n < 3 || pct >= LOW_MATCH || !m.missing.length || (lowHint?.ad === i && pct <= lowHint.before)) return [];
      hinted = true; track('lowhint');
      const short = m.missing.slice(0, 3).map(shortKw);
      return [el('p', { className: 'hint low-hint' }, el('span', { textContent: 'Możesz podnieść dopasowanie. Ogłoszenie wymaga m.in.:' }), ' ', ...short.map((k) => el('span', { className: 'chip mute', textContent: k })), ' ',
        el('span', { textContent: 'Jeśli robiłeś(-aś) coś podobnego, dopisz to w opisie stanowiska – tylko to, co naprawdę robiłeś(-aś).' })),
        el('p', {}, el('button', { type: 'button', className: 'btn ghost sm', id: 'lowMatchEdit', textContent: 'Uzupełnij doświadczenie', onclick: () => lowMatchEdit(i, pct) }))];
    };
    const one = (m, i) => [el('p', {}, `Z ogłoszenia wyciągnęliśmy ${m.n} ${plural(m.n, 'wymaganie', 'wymagania', 'wymagań')}${hasExp ? '.' : m.n === 1 ? ', z którym dopasujemy CV.' : ', z którymi dopasujemy CV.'}`),
      ...(hasExp ? [el('p', {}, `Twoje doświadczenie pokrywa ${m.found.length} z nich:`), m.found.length ? chips(m.found, 'ok') : null] : []), ...lowLines(m, i)].filter(Boolean);
    const parts = j.ads.map((m, i) => (m && m.n ? [m, i] : null)).filter(Boolean);
    if (!parts.length) { box.hidden = true; return; }
    box.replaceChildren(el('h3', { className: 'sh', textContent: 'Dopasowanie do ogłoszenia' }),
      ...(parts.length === 1 && ads.length === 1 ? one(parts[0][0], parts[0][1]) : parts.map(([m, i]) => { const c = one(m, i); return el('details', { className: 'optbox', open: c.some((x) => x.querySelector?.('#lowMatchEdit')) }, el('summary', {}, `${i + 1}. ${ads[i].title || ''}`.trim()), ...c); })),
      el('p', { className: 'hint small', textContent: 'Wstępne porównanie tekstu z formularza z wymaganiami z ogłoszenia, bez AI. Nic nie zapisujemy.' }));
    box.hidden = false;
  } catch { box.hidden = true; matchSig = ''; }
}
function drawSummary() {
  $('#pvBox').hidden = !cfg.aiPreview || pvOff || !rows('ads')[0]?.text;
  $('#pvEx').hidden = !$('#pvBox').hidden; // bez podglądu AI: przykład gotowego CV w modalu (openEx)
  drawWizMatch();
  if (pvShown && pvShown.sig !== pvSig()) pvShown = null; // dane zmienione po podglądzie: podgląd nieaktualny
  if (fullOn()) fullPreview(); // ten sam wynik: rysunek albo – po zmianie wyglądu – nowy obrazek z pamięci serwera
  else if (!pvShown && !fullRun) { $('#pvOut').replaceChildren(); $('#pvBtn').hidden = false; pvHead(); }
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
    el('div', { className: 'sumrow' }, el('span', { textContent: addons().docx ? 'Format: PDF i Word (.docx)' : 'W cenie: PDF' }), el('span', { textContent: addons().docx ? 'PDF w cenie' : 'w cenie' })), // Word jest w „Dodatkach” (29.10)
    ...ads.map((a, i) => el('div', { className: 'sumrow' }, el('span', { textContent: `Ogłoszenie ${i + 1}: ${a.title}${a.lang === 'en' ? ' (po angielsku)' : ''}` }), el('span', { textContent: 'w cenie' }))),
    ...Object.entries(addons()).filter(([, on]) => on).map(([k]) => el('div', { className: 'sumrow' }, el('span', { textContent: ADDON_KEYS[k][1] }), el('span', { textContent: '+' + PRICE[k] + ' zł' }))),
    ...extraLangs().map((l) => el('div', { className: 'sumrow' }, el('span', { textContent: `Tłumaczenie: ${LANGS[l]}` }), el('span', { textContent: '+' + PRICE.extraLang + ' zł' }))),
    ...(bundleOn() ? [el('div', { className: 'sumrow' }, el('span', { textContent: 'Pakiet „Pewna rozmowa”' }), el('span', { textContent: '−' + PRICE.bundleOff + ' zł' }))] : []),
    ...(discount() ? [el('div', { className: 'sumrow' }, el('span', {}, el('span', { textContent: promo.label }), ' ' + promo.code), el('span', { textContent: '−' + discount() + ' zł' }))] : []),
    ...(discount() && promo.calendar && promo.lowest ? [el('div', { className: 'sumrow lowest' }, lowestNote(promo.lowest, 'lowest', pkg()))] : []));
  // 29.10: kwota „Razem” tylko na dole, tuż nad przyciskiem płatności (stopka kreatora), bez powtórzenia w liście pozycji.
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
  if (n === 2 && $('#rewriteMode').checked && !imported) return 'Wgraj swoje CV (PDF lub Word): w trybie „Mam już CV” zachowujemy jego treść i kolejność.';
  if (n === 2) { if (!v('name')) return 'Podaj imię i nazwisko.'; if (!/^\S+@\S+\.\S+$/.test(v('email'))) return 'Podaj poprawny adres e-mail.'; }
  // Ekran 2: wystarczy wgrane CV albo jedno stanowisko (szkoła z „Więcej danych” też wystarczy, np. dla uczniów i studentów).
  if (n === 2 && !imported && !rows('exp').some((e) => e.title || e.company) && !rows('edu').some((e) => e.school)) return 'Wgraj swoje CV albo dodaj co najmniej jedno stanowisko (szkołę dodasz w „Więcej danych”).';
  if (n === 2 && $('#careerOn').checked && !v('careerTo')) { return 'Wpisz docelową branżę albo odznacz „Zmieniam branżę”.'; }
  if (n === 1 && passOn() && nAds() > Math.min(3, myPass.left.matches)) return `W karnecie ${plural(myPass.left.matches, 'zostało', 'zostały', 'zostało')} ${myPass.left.matches} ${plural(myPass.left.matches, 'dopasowanie', 'dopasowania', 'dopasowań')}. Usuń dodatkowe ogłoszenia albo odznacz „Użyj karnetu”.`;
  if (n === 1 && !passOn() && nAds() > PKG_ADS[pkg()]) return 'Wybrany pakiet obejmuje jedno ogłoszenie. Usuń dodatkowe ogłoszenia albo wybierz Pakiet 3 za 79 zł.';
  if (n === 1) for (const [i, a] of rows('ads').entries()) {
    if (a.kind === 'profession' && !a.text) return `Ogłoszenie ${i + 1}: wpisz zawód i kliknij „Pokaż wymagania”.`;
    if (a.kind === 'profession' && (rows('ads').length > 1 || (!passOn() && pkg() !== 'cv'))) return 'CV pod zawód (bez ogłoszenia) to jedno CV bez listu. Usuń pozostałe ogłoszenia i wybierz pakiet „CV”.';
    if (!a.text) return `Ogłoszenie ${i + 1}: kliknij „Pobierz” przy linku albo wklej treść oferty.`;
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
  profExInit();
  if (!pvSid) { const r = new Uint8Array(12); crypto.getRandomValues(r); pvSid = [...r].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  if (touchUi && !wizPushed && !$('#landing').hidden && $('#page').hidden && $('#result').hidden) { try { history.pushState({ ...(history.state || {}), wiz: 1 }, '', location.href); wizPushed = true; } catch {} }
  track('start'); modal(true); $('#wiz').hidden = false; $('#mcta').hidden = true; document.body.classList.remove('mcta-on'); go(step === 7 ? 6 : step);
  setTimeout(() => $('#wizClose').focus(), 0);
};
// Wyjście z kreatora (lejek kreatora, PR N): zamknięcie albo opuszczenie strony na kroku; nie przy przejściu do płatności.
let leavingToPay = false;
// step1_exit (28.10): dlaczego ktoś odpada na kroku 1 – „noad” (wybrał „Nie mam ogłoszenia” albo wpisał mniej niż ogłoszenie),
// „link” (link się nie wczytał i nie wkleił treści), „empty” (zamknął, nic nie wpisując), „other” (miał ogłoszenie, a jednak wyszedł).
function step1Why() {
  const e = $('#ads .entry'); if (!e) return 'empty';
  const text = ($('[data-k=text]', e)?.value || '').trim(), url = ($('[data-k=url]', e)?.value || '').trim(), q = ($('.profq', e)?.value || '').trim();
  if (e.dataset.mode === 'prof') return 'noad';
  if (e.dataset.linkErr && text.length < 80) return 'link';
  if (!text && !url && !q) return 'empty';
  return text.length < 80 ? 'noad' : 'other';
}
const wizExit = () => { if (!$('#wiz').hidden && !leavingToPay && step >= 1 && step <= 6) track('wizexit', { s: step }); };
const step1Exit = () => { if (!$('#wiz').hidden && !leavingToPay && step === 1) track('step1exit', { why: step1Why() }); };
addEventListener('pagehide', wizExit); addEventListener('pagehide', step1Exit);
const closeWiz = () => { wizExit(); step1Exit(); $('#wiz').hidden = true; modal(false); };
document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (!b) return; e.preventDefault(); if (b.dataset.addon) { b.dataset.addon.split(',').forEach((a) => ($('#ad' + a).checked = true)); saveDraft(); } openWiz(b.dataset.pkg); if ('prof' in b.dataset) profStart(); });
// Zamknięcie przez użytkownika (×, Escape): na telefonie zdejmujemy też wpis historii dodany przy otwarciu kreatora (B8).
const userCloseWiz = () => { closeWiz(); if (wizPushed) { wizPushed = false; silentBack = true; history.back(); } };
$('#wizClose').onclick = userCloseWiz;
// C4: pole w hero – link albo treść ogłoszenia od razu do kreatora (pierwsze ogłoszenie, pakiet „Samo CV”). Link pobieramy jak w kreatorze.
// Hero „z reklamy” ma ten sam formularz (#heroAd); tam pole przyjmuje też samo stanowisko.
$('#heroAd')?.addEventListener('submit', (e) => {
  e.preventDefault(); const ta = $('#heroAdIn'), v = ta.value.trim();
  if (!v) { ta.focus(); ta.classList.add('err'); return; }
  ta.classList.remove('err');
  openWiz('cv'); track('heroad');
  const first = $('#ads .entry'); if (!first) return;
  if (/^https?:\/\/\S+$/i.test(v)) { setMode(first, 'link'); $('[data-k=url]', first).value = v; $('.fetchbtn', first).click(); }
  // Krótki wpis w jednej linii (np. „magazynier”) to stanowisko, nie ogłoszenie: CV pod zawód (tryb „Bez ogłoszenia”).
  else if (v.length < 60 && !/\n/.test(v)) { setMode(first, 'prof'); first.profRun?.(v); }
  else { setMode(first, 'paste'); $('[data-k=text]', first).value = v.slice(0, 10000); fillTitle(first); }
  saveDraft();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#wiz').hidden && ($('#exitOffer')?.hidden ?? true)) userCloseWiz(); });

// Exit-intent (B8): raz na 7 dni okno „Zanim wyjdziesz” z darmowym skanerem – bez rabatu i bez licznika czasu.
// Komputer: kursor wyjeżdża górą poza okno. Telefon: „wstecz” w przeglądarce z kreatora otwartego na stronie głównej
// (przy otwarciu kreatora dodajemy wpis historii, więc „wstecz” zamyka kreator zamiast opuszczać stronę).
const EXIT_KEY = 'cvpo-exit', EXIT_EVERY = 7 * 864e5, touchUi = matchMedia('(pointer: coarse)').matches;
let wizPushed = false, silentBack = false, exitShown = false;
const exitDue = () => { if (exitShown || !$('#result').hidden || scanData) return false; try { return Date.now() - (+localStorage.getItem(EXIT_KEY) || 0) > EXIT_EVERY; } catch { return true; } };
// Okno budujemy dopiero przy pierwszym pokazaniu (index.html ma budżet rozmiaru); teksty przez słownik i18n.
function exitBox() {
  if ($('#exitOffer')) return;
  const box = el('div', { id: 'exitOffer', className: 'exit-offer', hidden: true }, el('div', { className: 'eo-box' },
    el('button', { className: 'x', id: 'exitX', ariaLabel: tr('Zamknij'), textContent: '×' }),
    el('h2', { id: 'exitTitle', textContent: tr('Zanim wyjdziesz: sprawdź za darmo, ile wymagań z ogłoszenia spełnia Twoje CV') }),
    el('p', { textContent: tr('Wgraj obecne CV i wklej ogłoszenie. Skaner pokaże, które wymagania spełniasz i czego brakuje.') }),
    el('div', { className: 'eo-act' }, el('button', { type: 'button', className: 'btn', id: 'exitGo', textContent: tr('Sprawdź moje CV za darmo') }), el('button', { type: 'button', className: 'link', id: 'exitNo', textContent: tr('Nie, dziękuję') }))));
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'exitTitle');
  document.body.append(box);
  $('#exitX').onclick = exitClose; $('#exitNo').onclick = exitClose;
  box.addEventListener('click', (e) => { if (e.target === box) exitClose(); });
  $('#exitGo').onclick = () => {
    track('exitclick'); box.dataset.wiz = ''; exitClose(); if (!$('#wiz').hidden) userCloseWiz();
    $('#skaner').scrollIntoView({ block: 'start' }); setTimeout(() => $('#scanAd')?.focus({ preventScroll: true }), 0);
  };
}
function exitOffer(src) {
  if (!exitDue()) return;
  exitBox();
  exitShown = true; try { localStorage.setItem(EXIT_KEY, String(Date.now())); } catch {}
  const wizOpen = !$('#wiz').hidden; if (!wizOpen) modal(true);
  $('#exitOffer').hidden = false; $('#exitOffer').dataset.wiz = wizOpen ? '1' : ''; track('exitoffer', { t: src }); setTimeout(() => $('#exitGo').focus(), 0);
}
const exitClose = () => { $('#exitOffer').hidden = true; if (!$('#exitOffer').dataset.wiz) modal(false); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#exitOffer') && !$('#exitOffer').hidden) exitClose(); });
document.addEventListener('mouseout', (e) => { if (!touchUi && !e.relatedTarget && e.clientY <= 0 && !$('#landing').hidden && $('#page').hidden && $('#exview').hidden) exitOffer('desk'); });
window.addEventListener('popstate', (e) => {
  if (silentBack) { silentBack = false; e.stopImmediatePropagation(); return; }
  if (wizPushed && !$('#wiz').hidden && !e.state?.wiz) { wizPushed = false; e.stopImmediatePropagation(); closeWiz(); exitOffer('back'); return; }
  wizPushed = false;
});
$('#back').onclick = () => go(ORDER[ORDER.indexOf(step) - 1] ?? ORDER[0]);

// Błąd walidacji (raport 26.10): na telefonie komunikat był ~600 px pod przyciskiem, więc „Zapłać” wyglądał na martwy.
// Przewijamy do pola, którego dotyczy błąd (albo do komunikatu), zaznaczamy je i powtarzamy komunikat nad przyciskiem (#werrFoot).
const PAY_BLOCK = [[/Regulamin/, 'consent', '#consent'], [/wykonanie usługi/, 'waiver', '#waiver'], [/faktur|NIP/, 'invoice', '#invName'], [/ofert pracy/, 'alerts', '#alJob'], [/ogłosze|karnet|pakiet/i, 'ads', null]];
const payBlockOf = (err) => PAY_BLOCK.find(([re]) => re.test(err)) || [null, 'inne', null];
function showWizErr(err) {
  $('#werr').textContent = err;
  const [, , sel] = payBlockOf(err), f = sel && $(sel), box = f?.closest('label.check, label.f') || $('#werr');
  if (f) { box.classList.add('need'); f.addEventListener('change', () => box.classList.remove('need'), { once: true }); }
  box.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { f?.focus({ preventScroll: true }); } catch {}
}
new MutationObserver(() => { const t = $('#werr').textContent.trim(); $('#werrFoot').textContent = t; $('#werrFoot').hidden = !t; }).observe($('#werr'), { childList: true, characterData: true, subtree: true });
$('#wizForm').onsubmit = async (e) => {
  e.preventDefault();
  const last = ORDER.indexOf(step) === ORDER.length - 1;
  if (last) track('payclick');
  const err = validate(step);
  if (err) { if (last) track('payblock', { why: payBlockOf(err)[1] }); return showWizErr(err); }
  if (!last) return go(ORDER[ORDER.indexOf(step) + 1]);
  const v = (id) => $('#' + id).value;
  const body = {
    draftToken: srvToken() || undefined,
    ...($('#rewriteMode').checked ? { mode: 'rewrite' } : {}), usePass: passOn(), design, addons: { ...addons(), linkedinEn: $('#adLinkedin').checked && $('#adLinkedinEn').checked }, extraLangs: extraLangs(), code: passOn() ? '' : promo?.code || '', waiver: $('#waiver').checked, ...(CHECKOUT_B ? { consentForm: 'compact' } : {}), gateway: gwValue($('#gwBox')), jobAlerts: $('#wantAlerts').checked ? { job: $('#alJob').value, city: $('#alCity').value } : null, payReminder: $('#payRem').checked, invoice: $('#wantInv').checked ? { name: $('#invName').value, address: $('#invAddr').value, nip: $('#invNip').value } : null, uiLang: window.I18N?.lang || 'pl', pkg: orderPkg(), consent: $('#consent').checked && $('#waiver').checked, ads: rows('ads'),
    profile: { ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'birth', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), ...($('#careerOn').checked ? { career: { from: v('careerFrom'), to: v('careerTo'), fit: v('careerFit') } } : {}), experience: rows('exp'), education: rows('edu'), photo },
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
    if (j.free) { leavingToPay = true; closeWiz(); startResult(j.id); } else if (j.demo) go(7); else { leavingToPay = true; location.href = j.url; }
  } catch (x) { track('payerr'); showWizErr(x.message); }
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
// C2: duże pole „Masz już CV?” na górze kroku danych – także upuszczenie pliku; „Nie mam CV” zwija je i przechodzi do pól.
{
  const box = $('#importBox');
  ['dragenter', 'dragover'].forEach((ev) => box.addEventListener(ev, (e) => { e.preventDefault(); box.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => box.addEventListener(ev, () => box.classList.remove('drag')));
  box.addEventListener('drop', async (e) => {
    e.preventDefault(); const file = e.dataTransfer?.files?.[0]; if (!file) return;
    const st = $('#importStatus'); st.className = 'fstatus';
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) { st.textContent = 'Wgraj plik PDF, Word (.docx) albo TXT.'; st.classList.add('bad'); return; }
    if (file.size > 5 * 1024 * 1024) { st.textContent = 'Plik musi mieć do 5 MB.'; st.classList.add('bad'); return; }
    importData(await fileB64(file));
  });
  $('#importManual').onclick = () => { box.classList.add('small'); $('#name').focus(); };
}
// Tryb „Mam już CV” (PR T): wymaga wgranego CV; zamówienie z mode: 'rewrite' (generator zachowuje treść i kolejność).
let imported = false;
$('#careerOn').onchange = () => { $('#careerBox').hidden = !$('#careerOn').checked; };
$('#rewriteMode').onchange = () => { $('#rewriteNote').hidden = !$('#rewriteMode').checked; };
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
    saveDraft(); imported = true; $('#importBox').classList.add('small'); track('cvimport'); // C3: dane z pliku od razu widoczne do sprawdzenia (pola opcjonalne nie są zwinięte)
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
      scanData = { b64, adText: ad, title: title || j.position || guess.charAt(0).toUpperCase() + guess.slice(1), missing: (j.missing || []).map((m) => m.keyword) };
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
    el('label', { className: 'f' }, '2. Link do ogłoszenia albo jego treść', ad), btn, msg, el('p', { className: 'hint small', textContent: 'Nie zapisujemy pliku ani treści CV. Sam wynik jest w pamięci serwera do godziny.' }));
  if (pendingDraft) ad.value = pendingDraft;
  bindScan({ form, file, fileName, ad, btn, msg, result });
  box.classList.remove('tool-box'); box.append(form, result);
  if (cfg.chromeExt) box.append(el('p', { className: 'chrome-ext' }, el('a', { className: 'btn ghost sm', href: cfg.chromeExt, target: '_blank', rel: 'noopener', textContent: 'Dodaj do Chrome' }), ' ', el('span', { className: 'hint', textContent: 'Skaner jednym kliknięciem na stronie ogłoszenia.' })));
}
// „Sprawdź CV” (ats = false) i „Test CV pod ATS” (ats = true): /api/cv-check odczytuje tekst z pliku i sprawdza budowę CV
// bez ogłoszenia; w teście ATS opcjonalne ogłoszenie idzie dodatkowo do skanera (/api/scan). Nic nie jest zapisywane.
const CHECK_SEC = { summary: 'Podsumowanie / profil', experience: 'Doświadczenie', education: 'Wykształcenie', skills: 'Umiejętności', languages: 'Języki' };
const CHECK_ISSUE = {
  little_text: 'Mało tekstu jak na rozmiar pliku. To może być skan albo CV z obrazków – program może go nie odczytać.',
  columns: 'Tekst jest rozbity na wiele krótkich linii. To zwykle kolumny albo tabele – sprawdź w podglądzie, czy kolejność ma sens.',
  no_email: 'W odczytanym tekście nie ma adresu e-mail. Jeśli jest w CV, to pewnie w grafice albo w nagłówku pliku.',
  no_phone: 'W odczytanym tekście nie ma numeru telefonu.',
  icons: 'W tekście są ikony lub symbole (np. gwiazdki ocen). Program odczyta je jako znaki bez znaczenia – lepiej napisać to słowami.',
  no_experience: 'Nie rozpoznaliśmy sekcji z doświadczeniem. Użyj zwykłego nagłówka, np. „Doświadczenie zawodowe”.',
  few_dates: 'Mało dat. Przy każdym stanowisku i szkole podaj miesiąc i rok, np. 03.2021 – obecnie.',
  too_short: 'CV jest bardzo krótkie. Opisz obowiązki i efekty przy każdym stanowisku.',
  too_long: 'CV jest długie. Skróć starsze i mniej związane z ofertą doświadczenie.',
};
function toolCheck(box, ats) {
  const file = el('input', { type: 'file', accept: '.pdf,.docx,.txt', hidden: true }), fileName = el('span', { className: 'hint', textContent: 'nie wybrano pliku' });
  const ad = ats ? el('textarea', { rows: 4, placeholder: 'Opcjonalnie: wklej treść ogłoszenia' }) : null;
  const btn = el('button', { className: 'btn', type: 'submit', textContent: ats ? 'Pokaż CV oczami ATS' : 'Sprawdź CV za darmo' });
  const msg = el('p', { className: 'fstatus', role: 'status' }), result = el('div', { className: 'scan-result check-result', hidden: true }), scanBox = el('div', { className: 'scan-result', hidden: true });
  file.onchange = () => (fileName.textContent = file.files[0]?.name || 'nie wybrano pliku');
  const form = el('form', { className: 'scan-card', noValidate: true },
    el('div', { className: 'f' }, '1. Twoje CV ', el('span', { className: 'h', textContent: 'PDF, Word lub TXT, do 5 MB' }), el('div', { className: 'filerow' }, el('label', { className: 'btn ghost sm filebtn' }, 'Wybierz plik', file), fileName)),
    ...(ats ? [el('label', { className: 'f' }, '2. Ogłoszenie (opcjonalnie)', ad)] : []), btn, msg, el('p', { className: 'hint small', textContent: ats ? 'Nie zapisujemy pliku ani tekstu CV. Po wklejeniu ogłoszenia sam wynik porównania (bez treści CV) zostaje w pamięci serwera przez godzinę, żeby można było go udostępnić.' : 'Nie zapisujemy ani pliku, ani wyniku.' }));
  form.onsubmit = async (e) => {
    e.preventDefault(); msg.className = 'fstatus';
    const f = file.files[0], fail = (t) => { msg.className = 'fstatus bad'; msg.textContent = t; };
    if (!f) return fail('Wybierz plik ze swoim CV.');
    if (f.size > 5 * 1024 * 1024) return fail('Plik musi mieć do 5 MB.');
    btn.disabled = true; msg.textContent = 'Odczytujemy tekst z pliku…';
    try {
      const b64 = await fileB64(f), r = await fetch('/api/cv-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: b64 }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.scan) {
        result.replaceChildren(el('h3', { textContent: 'Wynik sprawdzenia' }), el('p', { className: 'fstatus bad', textContent: 'To wygląda na skan albo CV ze zdjęć: w pliku prawie nie ma tekstu. Program do rekrutacji (ATS) nie odczyta z niego Twoich danych. Zapisz CV jako PDF z edytora tekstu albo jako plik Word.' }),
          el('p', { className: 'prof-cta' }, el('a', { className: 'btn', href: '/kreator-cv', textContent: 'Zrób CV w kreatorze' })));
        result.hidden = false; msg.textContent = ''; btn.disabled = false; return;
      }
      const ok = (v) => el('span', { className: v ? 'ok' : 'no', textContent: v ? '✓' : '–' });
      result.replaceChildren(
        el('h3', { textContent: 'Wynik sprawdzenia' }), el('p', { textContent: `Odczytaliśmy ${j.words} słów.` }),
        el('h4', { textContent: 'Rozpoznane sekcje' }), el('ul', { className: 'reqs-list' }, ...j.sections.map((x) => el('li', {}, ok(x.found), ' ', CHECK_SEC[x.key]))),
        el('h4', { textContent: 'Dane i daty' }), el('ul', { className: 'reqs-list' }, el('li', {}, ok(j.email), ' ', 'Adres e-mail w tekście'), el('li', {}, ok(j.phone), ' ', 'Numer telefonu w tekście'), el('li', {}, ok(j.dates >= 2), ' ', 'Daty przy stanowiskach i szkołach'),
          el('li', {}, ok(j.rodo), ' ', j.rodo ? 'Klauzula RODO' : 'Brak klauzuli RODO – w Polsce wiele firm jej oczekuje. ', ...(j.rodo ? [] : [pageLink('narzedzia/klauzula-rodo', { textContent: 'Generator klauzuli RODO' })]))),
        ...(j.issues.filter((k) => CHECK_ISSUE[k] && !['no_email', 'no_phone'].includes(k)).length ? [el('h4', { textContent: 'Do poprawienia' }), el('ul', {}, ...j.issues.filter((k) => CHECK_ISSUE[k] && !['no_email', 'no_phone'].includes(k)).map((k) => el('li', { textContent: CHECK_ISSUE[k] })))] : []),
        el('h4', { textContent: ats ? 'Tak widzi Twoje CV program do rekrutacji' : 'Test kopiowania: tekst odczytany z pliku' }),
        (() => { const pre = el('pre', { className: 'ats-text', textContent: j.text }); pre.setAttribute('data-noi18n', ''); return pre; })(),
        el('p', { className: 'hint', textContent: 'Jeśli czegoś tu brakuje albo kolejność jest pomieszana, program do rekrutacji zobaczy to tak samo.' }),
        el('p', { className: 'prof-cta' }, pageLink('narzedzia/skaner-cv', { className: 'btn ghost', textContent: 'Sprawdź dopasowanie do ogłoszenia' }), ' ', el('a', { className: 'btn', href: '/?zamow=1', textContent: 'Zrób CV pod ogłoszenie' })));
      result.hidden = false; msg.textContent = '';
      const adText = ad?.value.trim() || '';
      if (ats && adText.length >= 80) {
        msg.textContent = 'Porównujemy CV z ogłoszeniem…';
        const s = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: b64, adText }) });
        const k = await s.json(); if (!s.ok) throw new Error(k.error);
        scanData = { b64, adText, title: k.position || '', missing: (k.missing || []).map((m) => m.keyword) }; renderScan(k, scanBox); scanBox.hidden = false; msg.textContent = '';
      } else if (ats && adText) fail('Wklej pełną treść ogłoszenia (min. 80 znaków), żeby porównać słowa kluczowe.');
    } catch (x) { fail(x.message); }
    btn.disabled = false;
  };
  box.classList.remove('tool-box'); box.append(form, result, scanBox);
}
// Test A/B „scanner” (lib/ab.js): w wariancie B serwer zwraca tylko 3 pierwsze braki (missingMore = reszta) i bez wskazówek.
const scanCta = () => { track('scancta'); track('scantowiz'); fromScan(); }; // scan_to_wiz (B3): przejście ze skanera do kreatora
const moreReqs = (n) => (n === 1 ? 'kolejne wymaganie uwzględnimy w CV pod to ogłoszenie' : n >= 2 && n <= 4 ? 'kolejne wymagania uwzględnimy w CV pod to ogłoszenie' : 'kolejnych wymagań uwzględnimy w CV pod to ogłoszenie');
function renderScan(j, box = $('#scanResult')) {
  const more = j.missingMore || 0, total = j.found.length + j.missing.length + more, pct = j.score ?? 0, b = j.variant === 'B';
  box.replaceChildren(...[ // null (brak wskazówek, brak scanId) pomijamy – replaceChildren wstawiłby tekst „null”
    el('div', { className: 'ring-col' }, el('div', { className: 'ring', style: `--p:${pct}` }, el('b', { textContent: `${pct}%` })),
      el('button', { type: 'button', className: 'btn sm scan-cta', onclick: scanCta }, el('span', { textContent: 'Zrób CV dopasowane do tego ogłoszenia – od' }), ` ${PRICE.cv} zł`)),
    el('div', { className: 'mcol ok' }, el('h3', { textContent: `Spełniasz ${j.found.length} z ${total} wymagań${j.position ? ': ' + j.position : ''}` }), el('ul', {}, ...j.found.map((x) => el('li', { textContent: x })))),
    el('div', { className: 'mcol miss' }, el('h3', { textContent: j.missing.length ? 'Czego nie widać w Twoim CV' : 'Niczego nie brakuje' }), el('ul', {}, ...j.missing.map((m) => el('li', {}, el('b', { textContent: m.keyword }), el('small', { textContent: m.hint })))),
      more ? el('p', { className: 'scan-more' }, `+${more} `, el('span', { textContent: moreReqs(more) })) : null),
    j.tips?.length ? el('div', { className: 'tips' }, el('h3', { textContent: 'Co poprawić' }), el('ol', {}, ...j.tips.map((t) => el('li', { textContent: t })))) : null,
    b ? el('div', { className: 'tips scan-tips-b' }, el('p', {}, el('span', { textContent: 'Wskazówki i gotowe sformułowania dostaniesz razem z CV pod to ogłoszenie – od' }), ` ${PRICE.cv} zł`), el('button', { type: 'button', className: 'btn sm scan-cta', onclick: scanCta }, el('span', { textContent: 'Zrób CV dopasowane do tego ogłoszenia – od' }), ` ${PRICE.cv} zł`)) : null,
    el('div', { className: 'cta-box' }, el('div', {}, el('b', { textContent: 'Zrób CV pisane pod to ogłoszenie' }), el('p', { className: 'hint', textContent: 'Uzupełnimy formularz danymi z Twojego pliku, ułożymy CV pod te wymagania, a brakujące rzeczy, które masz, dopiszesz jednym kliknięciem. Od 39 zł, z darmową poprawką.' })),
      el('button', { type: 'button', className: 'btn', onclick: scanCta }, el('span', { textContent: 'Zamów CV, które pokryje te wymagania –' }), ` ${PRICE.cv} zł`)),
    j.scanId ? scanShare(j.scanId) : null, j.scanId ? scanMailForm(j.scanId) : null].filter(Boolean));
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
    el('p', { className: 'hint small', textContent: 'Na karcie pokażemy procent dopasowania, to stanowisko, datę i po 3 ogólne wymagania z ogłoszenia (do obrazka). Bez treści CV i danych kontaktowych. Link działa 30 dni.' }), msg, links);
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
  return el('div', { className: 'scan-share' }, open, form, scanImg(scanId));
}
// Obrazek wyniku (PNG z serwera: procent i po 3 wymagania, bez treści CV): na telefonie systemowe „Udostępnij” z plikiem,
// a gdy przeglądarka nie udostępnia plików – pobranie obrazka.
function scanImg(scanId) {
  const msg = el('p', { className: 'fstatus', role: 'status' });
  const get = async (f, b) => {
    b.disabled = true; msg.className = 'fstatus'; msg.textContent = '';
    try {
      const r = await fetch(`/api/scan/${encodeURIComponent(scanId)}/share.png?f=${f}&lang=${window.I18N?.lang || 'pl'}`);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Nie udało się przygotować obrazka.');
      const blob = await r.blob(), file = new File([blob], `wynik-cv-${f === 'story' ? '1080x1920' : '1080x1080'}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }).catch(() => {}); }
      else { const a = el('a', { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); msg.className = 'fstatus ok'; msg.textContent = 'Obrazek zapisany. Dodaj go do posta albo relacji.'; }
    } catch (x) { msg.className = 'fstatus err'; msg.textContent = x.message; }
    b.disabled = false;
  };
  const btn = (f, t) => { const b = el('button', { type: 'button', className: 'btn ghost sm', textContent: t }); b.onclick = () => get(f, b); return b; };
  const share = !!navigator.canShare && matchMedia('(pointer:coarse)').matches;
  return el('div', { className: 'scan-img' }, el('p', { className: 'hint small', textContent: 'Obrazek z wynikiem: procent i po 3 wymagania z ogłoszenia, bez danych z Twojego CV.' }),
    el('div', { className: 'share-btns' }, btn('square', share ? 'Udostępnij obrazek (post)' : 'Pobierz obrazek (post)'), btn('story', share ? 'Udostępnij obrazek (relacja)' : 'Pobierz obrazek (relacja)')), msg);
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
  // B3 (26.10): wymagania, których skaner nie znalazł w CV, jako podpowiedź w kroku 3 (dopisz tylko to, co jest prawdą).
  const miss = (scanData.missing || []).filter(Boolean).slice(0, 8);
  $('#scanHint').hidden = !miss.length; if (miss.length) $('#scanHint').replaceChildren(el('b', { textContent: tr('Ogłoszenie wymaga:') }), ` ${miss.join(', ')} – `, el('span', { textContent: tr('dopisz, jeśli to prawda o Tobie.') }));
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
// „Skąd nas znasz?” (PR O, lib/heard.js): po płatności, jedno kliknięcie, opcjonalne; raz na zamówienie.
const HEARD = [['google', 'Google'], ['reklama', 'Reklama (Facebook, Instagram)'], ['tiktok_youtube', 'TikTok / YouTube'], ['znajomy', 'Od znajomego'], ['pinterest', 'Pinterest'], ['inne', 'Inne']];
function drawHeard(box) {
  const other = ['#heardGen', '#heardRes'].map((x) => $(x)).filter((x) => x && x !== box);
  if (!data || data.heard || data.status === 'pending' || data.upsellOf || cfg.preview) { box.hidden = true; return; }
  if (box.dataset.ready) { box.hidden = false; return; }
  box.dataset.ready = '1'; box.hidden = false; other.forEach((x) => { x.hidden = true; x.dataset.ready = ''; });
  const text = el('input', { type: 'text', maxLength: 80, placeholder: 'Dopisz, jeśli chcesz (opcjonalnie)', ariaLabel: 'Dopisek (opcjonalnie)' });
  const send = async (src) => {
    box.querySelectorAll('button').forEach((b) => (b.disabled = true));
    try { await fetch(`/api/orders/${orderId}/heard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ src, text: text.value }) }); } catch {}
    data.heard = true; box.replaceChildren(el('p', { className: 'hint', textContent: 'Dziękujemy za odpowiedź!' }));
  };
  box.replaceChildren(el('p', {}, el('b', { textContent: 'Skąd nas znasz?' }), ' ', el('span', { className: 'hint', textContent: 'Jedno kliknięcie, pytanie opcjonalne.' })),
    text, el('div', { className: 'heard-opts' }, ...HEARD.map(([k, t]) => el('button', { type: 'button', className: 'btn ghost sm', textContent: t, onclick: () => send(k) }))));
}
async function poll() {
  let r; try { r = await fetch(`/api/orders/${orderId}`); } catch { r = null; }
  if (!r || !r.ok) { $('#genTitle').textContent = 'Nie znaleziono zamówienia'; $('#genMsg').textContent = 'Sprawdź link lub wróć na stronę główną.'; return; }
  data = await r.json();
  data.design = data.design || { ...design };
  // Zakup do statystyk reklam (tylko za zgodą na cookie, raz na zamówienie, tuż po płatności).
  if (data.status !== 'pending' && data.total > 0 && data.paidAt && Date.now() - data.paidAt < 864e5) window.CONSENT?.purchase(data.id, data.total / 100);
  if (data.status === 'done') { $('#gen').hidden = true; return showResult(); }
  drawHeard($('#heardGen'));
  if (data.status === 'paid') { $('#genTitle').textContent = 'Dokumenty są w przygotowaniu'; $('#genMsg').textContent = 'Mamy chwilowe opóźnienie. Płatność jest zachowana, a gotowe dokumenty wyślemy na Twój e-mail, zwykle w ciągu kilku godzin. Możesz zamknąć tę stronę albo spróbować ponownie.'; $('#retry').hidden = false; timer = setTimeout(poll, 60000); return; }
  if (data.status === 'pending' && data.canPay && ++pendingPolls >= 4) { $('#genTitle').textContent = 'Płatność nie jest jeszcze potwierdzona'; $('#genMsg').textContent = 'Jeśli przerwałeś płatność albo zamknąłeś okno banku, możesz ją dokończyć. Jeśli zapłaciłeś, poczekaj chwilę: potwierdzenie może przyjść z opóźnieniem.'; $('#payAgain').hidden = false; if (!$('#payAgainGw').childElementCount) gwPicker($('#payAgainGw'), 'gwa', data.gateway || undefined); timer = setTimeout(poll, 5000); return; }
  $('#genMsg').textContent = data.status === 'pending' ? 'Czekamy na potwierdzenie płatności…' : 'To zajmie około minuty. Nie zamykaj tej strony. Gotowe dokumenty wyślemy też na Twój e-mail.';
  timer = setTimeout(poll, cfg.demo ? 800 : 2500);
}
$('#payAgain').onclick = async () => { $('#payAgain').disabled = true; try { const gw = gwValue($('#payAgainGw')); const r = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gw ? { gateway: gw } : {}) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); location.href = j.url; } catch (x) { $('#genMsg').textContent = x.message || 'Nie udało się otworzyć płatności.'; $('#payAgain').disabled = false; } };
$('#retry').onclick = async () => { await fetch(`/api/orders/${orderId}/retry`, { method: 'POST' }); startResult(orderId); };

// D1: link do usługi „Zdjęcie do CV” z wstawieniem zdjęcia do tego CV.
const PHOTO_NAMES = [['zdjecie-cv-3x4.jpg', 'JPG 3:4'], ['zdjecie-cv-3x4.png', 'PNG 3:4'], ['zdjecie-cv-kwadrat.jpg', 'JPG kwadrat'], ['zdjecie-cv-kwadrat.png', 'PNG kwadrat']];
function drawPhotoFiles() {
  let b = $('#photoNote');
  if (!b) { b = el('p', { id: 'photoNote', className: 'mailnote noprint' }); $('#mailNote').after(b); }
  b.replaceChildren(el('a', { href: `/narzedzia/zdjecie-do-cv?cv=${encodeURIComponent(orderId)}`, textContent: tr('Zdjęcie do CV: kadr i jasność, wstawione do tego CV – 10 zł') }));
}
function drawInvoice() {
  drawPhotoFiles();
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
  const p = paperEl('extra', { tpl: 'klasyczny', color: d.color });
  // Liczniki znaków pod limity LinkedIna (nagłówek 220, „Informacje” 2600).
  const block = (title, text, max) => [el('h3', { textContent: title }, max ? (() => { const s = el('small', { className: 'li-count', textContent: ` ${String(text || '').length}/${max} znaków` }); s.setAttribute('data-i18n', ''); return s; })() : null), copyBtn(text), el('div', { className: 'msgbox', textContent: text })];
  const prof = (l, en) => [
    ...(en ? [el('h2', { className: 'li-en-h', textContent: 'Wersja angielska (English)' })] : []),
    ...block(en ? 'Headline' : 'Nagłówek', l.headline, 220), ...block(en ? 'About' : 'Informacje', l.about, 2600), ...block(en ? 'Skills (in this order)' : 'Umiejętności (w tej kolejności)', (l.skills || []).join(', ')),
    ...(l.experience || []).flatMap((e) => block(`${en ? 'Experience' : 'Doświadczenie'}: ${e.title}${e.company ? ', ' + e.company : ''}`, e.text)),
    ...(l.tips?.length ? [el('h3', { textContent: en ? 'Profile settings' : 'Ustawienia profilu' }), el('ul', { className: 'iv-list' }, ...l.tips.map((t) => el('li', { textContent: t })))] : [])];
  p.append(el('div', { className: 'pg' }, el('header', { className: 'top lhead' }, el('h1', { textContent: 'Profil LinkedIn' }), el('div', { className: 'ct', textContent: r.position }), el('div', { className: 'rule' })),
    ...prof(r.linkedin, false), ...(r.linkedinEn ? prof(r.linkedinEn, true) : [])));
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
// Kolejne CV pod nowe ogłoszenie (cv_next) przez 30 dni od opłacenia zamówienia; list +różnica jak zwykle (lib/pricing.js: nextEligible).
const fuNext = () => !!data?.paidAt && Date.now() - data.paidAt <= 30 * 864e5 && !!PRICE.cv_next;
// Tylko CV i CV z listem (nie „Pewna rozmowa”), bez kodów rabatowych – pole kodu znika, kod nie jest wysyłany.
const fuIsNext = (k) => fuNext() && (k === 'cv' || k === 'cv_letter');
const fuBase = (k) => (fuIsNext(k) ? PRICE.cv_next + (k === 'cv' ? 0 : PRICE.cv_letter - PRICE.cv) : PRICE[k === 'bundle' ? 'cv_letter' : k]);
const FU_PRICE = (k) => (k === 'bundle' ? fuBase(k) + PRICE.interview + PRICE.sim - PRICE.bundleOff : fuBase(k));
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
    if ($('#fuCode')) $('#fuCode').closest('label').hidden = fuIsNext(fpkg);
    if ($('#fuInfo')) $('#fuInfo').textContent = fpkg === 'bundle' ? 'CV i list motywacyjny, przygotowanie do rozmowy (12 pytań z odpowiedziami) i symulator rozmowy.' : '';
  };
  box.replaceChildren(el('h3', { textContent: 'Masz kolejne ogłoszenia?' }),
    fuNext() ? el('p', { className: 'perk small' }, el('span', { textContent: 'Kolejne CV pod nowe ogłoszenie:' }), ` ${PRICE.cv_next} zł `, el('span', { textContent: '(z listem motywacyjnym' }), ` ${PRICE.cv_next + PRICE.cv_letter - PRICE.cv} zł) `, el('span', { textContent: 'przez 30 dni od opłacenia zamówienia. Bez łączenia z kodami rabatowymi i saldem poleceń.' })) : null,
    el('p', { className: 'hint' }, el('span', { textContent: 'Twoje dane już mamy, więc nie wpisujesz ich ponownie. Dokumenty powstaną w tym samym wyglądzie.' }), data.myCode && !data.myCode.usedByMe ? el('span', { textContent: ` Twój kod ${data.myCode.code} obniży cenę o ${data.myCode.mine} zł.` }) : ''),
    pick, el('p', { className: 'hint', id: 'fuInfo' }), el('div', { id: 'fuAds' }),
    el('button', { type: 'button', className: 'btn ghost sm', id: 'fuAdd', textContent: '+ Dodaj ogłoszenie (w pakiecie do 3)', onclick: () => { addRow('fuAds'); drawPick(); } }),
    el('label', { className: 'f fucode' }, 'Kod rabatowy ', el('input', { type: 'text', id: 'fuCode', placeholder: 'opcjonalnie', autocomplete: 'off', value: data.myCode && !data.myCode.usedByMe ? data.myCode.code : '' })),
    gwPicker(el('div', { className: 'gw-box', id: 'fuGw' }), 'fugw'),
    el('label', { className: 'check' }, el('input', { type: 'checkbox', id: 'fuWaiver' }), ' ', el('span', { textContent: 'Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.' })),
    el('p', {}, el('button', { type: 'button', className: 'btn', id: 'fuPay', textContent: '', onclick: async (e) => {
      const ads = rows('fuAds'), err = $('#fuErr'), code = fuIsNext(fpkg) ? '' : $('#fuCode').value.trim();
      if (ads.length > FU_ADS(fpkg)) { err.textContent = 'Ten pakiet obejmuje jedno ogłoszenie. Usuń dodatkowe albo wybierz Pakiet 3.'; return; }
      const bad = ads.find((a) => !a.title || a.text.length < 80);
      if (bad) { err.textContent = 'Podaj nazwę stanowiska i pełną treść ogłoszenia (min. 80 znaków).'; return; }
      if (!$('#fuWaiver').checked) { err.textContent = 'Zaznacz zgodę na wykonanie usługi od razu po płatności.'; return; }
      e.target.disabled = true; err.textContent = '';
      try {
        const r = await fetch(`/api/orders/${orderId}/followup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkg: fpkg === 'bundle' ? 'cv_letter' : fpkg, addons: fpkg === 'bundle' ? { interview: true, sim: true } : {}, ads, code, waiver: true, gateway: gwValue($('#fuGw')) }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        if (j.free) { delete box.dataset.ready; startResult(j.id); } else if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); delete box.dataset.ready; startResult(j.id); } else location.href = j.url;
      } catch (x) { err.textContent = x.message; e.target.disabled = false; }
    } }), cfg.demo ? el('span', { className: 'hint', textContent: '  Podgląd: płatność jest symulowana.' }) : null),
    el('p', { className: 'err', id: 'fuErr' }));
  addRow('fuAds'); drawPick();
}

// Dodatki po zakupie: osobna płatność tylko za dodatek, potem dodatek pojawia się w tym zamówieniu.
// Powiadomienia e-mail po zakupie (29.10): 5 opcjonalnych zgód przeniesionych z ostatniego kroku kreatora – każda osobno,
// odznaczona, zapis od razu (/api/orders/:id/notify). Zgody udzielone wcześniej w kreatorze są tu zaznaczone i można je wyłączyć.
const NOTIFY = [
  ['reviewAsk', "Poproś mnie raz o ocenę dokumentów (jeden e-mail po 4 dniach, opcjonalnie)."],
  ['outcomeAsk', "Zapytajcie mnie za 14 dni, czy dostałem(-am) zaproszenie na rozmowę (1 wiadomość)."],
  ['reminder', "Przypomnij mi raz po 7 dniach o możliwości zamówienia CV pod kolejne ogłoszenie (opcjonalnie, jedna wiadomość e-mail)."],
  ['followUp', "Zapytajcie mnie raz po miesiącu, jak poszła rekrutacja (jeden e-mail, opcjonalnie)."],
  ['deleteNotice', "Przypomnijcie mi 5 dni przed usunięciem moich danych i dokumentów (jeden e-mail, opcjonalnie)."],
];
function drawNotify() {
  let box = $('#notifyBox'); if (!box) { box = el('section', { className: 'notify noprint', id: 'notifyBox' }); $('#followup').after(box); }
  box.hidden = !data?.notify || !!cfg.preview; if (box.hidden) return;
  const st = el('p', { className: 'fstatus', role: 'status' });
  box.replaceChildren(el('h3', { textContent: 'Powiadomienia e-mail (opcjonalnie)' }), el('p', { className: 'hint', textContent: 'Zaznacz, jeśli chcesz. Każda wiadomość to jeden e-mail na adres z zamówienia.' }),
    ...NOTIFY.map(([k, label]) => {
      const c = el('input', { type: 'checkbox', checked: !!data.notify[k] });
      c.onchange = async () => {
        c.disabled = true;
        try { const r = await fetch(`/api/orders/${orderId}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k, on: c.checked }) }); if (!r.ok) throw new Error(); data.notify[k] = c.checked; st.className = 'fstatus good'; st.textContent = tr('Zapisano.'); }
        catch { c.checked = !c.checked; st.className = 'fstatus bad'; st.textContent = tr('Nie udało się zapisać. Spróbuj ponownie.'); }
        c.disabled = false;
      };
      return el('label', { className: 'check' }, c, ' ', el('span', { textContent: label }));
    }), st);
}
// Po zakupie CV jedna dyskretna linijka z usługami obok (28.10): zdjęcie do CV i tłumaczenie, ceny z /api/config (lib/pricing.js).
function drawXsell() {
  let p = $('#xsell'); if (!p) { p = el('p', { className: 'hint noprint xsell', id: 'xsell' }); $('#upsell').after(p); }
  p.hidden = !!cfg.preview || !PRICE.photo || !PRICE.translation;
  p.replaceChildren(el('span', { textContent: 'Przyda się też:' }), ' ', el('a', { href: '/narzedzia/zdjecie-do-cv' }, el('span', { textContent: 'Zdjęcie do CV' }), ` – ${PRICE.photo} zł`), ' · ', el('a', { href: '/tlumaczenie-cv' }, el('span', { textContent: 'Tłumaczenie CV' }), ` – ${PRICE.translation} zł`));
}
let upsellTimer = null;
const UPSELL_PART = { letter: 'list motywacyjny', interview: 'przygotowanie do rozmowy', sim: 'symulator rozmowy' };
const UPSELL_HINT = { messages: 'Wiadomość do rekrutera na LinkedIn i gotowy e-mail z aplikacją pod każde CV z tego zamówienia.', linkedin: 'Nagłówek, sekcja „Informacje”, do 15 umiejętności i opisy stanowisk spójne z Twoim CV, do skopiowania na LinkedIn.', letter: 'List motywacyjny do każdego CV z tego zamówienia, pod to samo ogłoszenie.', interview: 'Pytania z tego ogłoszenia z przykładowymi odpowiedziami, autoprezentacja i lista rzeczy do przygotowania.', sim: 'Rozmowa z AI w roli rekrutera pod to stanowisko, z oceną odpowiedzi.', bundle: 'Wszystko, czego brakuje do rozmowy: list, przygotowanie i symulator razem taniej.' };
// Kopia lib/doc-names.js (bez rozszerzenia): Imię_Nazwisko_CV_Stanowisko, ASCII, maks. 80 znaków z „.pdf”.
const UK_LAT = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '' };
const asciiWords = (s) => String(s || '').replace(/[\u0400-\u04FF]/g, (c) => { const l = c.toLowerCase(), t = UK_LAT[l] ?? ''; return c !== l && t ? t[0].toUpperCase() + t.slice(1) : t; })
  .replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const DOC_KIND = { cv: 'CV', letter: 'List_motywacyjny', interview: 'Przygotowanie_do_rozmowy' };
const docBase = (kind, name, position, lang) => {
  const head = `${asciiWords(name) || 'Dokument'}_${DOC_KIND[kind]}`, tail = lang && lang !== 'pl' ? `_${lang.toUpperCase()}` : '';
  const pos = asciiWords(position).slice(0, Math.max(0, 80 - head.length - tail.length - 5)).replace(/_+$/, '');
  return `${head}${pos ? `_${pos}` : ''}${tail}`;
};
function drawUpsell() {
  const box = $('#upsell'), offers = data.upsells || [];
  clearTimeout(upsellTimer);
  if (data.upsellBusy) { box.hidden = false; box.replaceChildren(el('h3', { textContent: 'Przygotowujemy dokupiony dodatek…' }), el('p', { className: 'hint', textContent: 'To zwykle trwa do 2 minut. Strona odświeży się sama, a dokumenty wyślemy też e-mailem.' })); upsellTimer = setTimeout(() => startResult(orderId), 8000); return; }
  box.hidden = !offers.length || data.status !== 'done';
  if (box.hidden) return;
  // Zgoda z art. 38 pkt 13 (jak w kreatorze): bez niej przycisk płatności za dodatek nie działa.
  const waive = el('input', { type: 'checkbox', id: 'upWaiver' });
  box.replaceChildren(el('h3', { textContent: 'Dodaj do zamówienia' }), el('p', { className: 'hint', textContent: 'Płacisz tylko za dodatek. Przygotujemy go do tych samych ogłoszeń i dodamy na tej stronie.' }),
    gwPicker(el('div', { className: 'gw-box', id: 'upGw' }), 'upgw'),
    el('label', { className: 'check' }, waive, ' ', el('span', { textContent: 'Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.' })),
    el('div', { className: 'upsell-list' }, ...offers.map((o) => el('div', { className: 'upsell-item' },
      el('div', {}, el('b', { textContent: o.name }), el('p', { className: 'hint', textContent: o.key === 'bundle' ? `Razem taniej: ${(o.includes || []).map((k) => UPSELL_PART[k]).join(', ')}.` : UPSELL_HINT[o.key] || '' })),
      el('button', { type: 'button', className: 'btn sm', textContent: `Dodaj za ${o.price} zł`, onclick: async (e) => {
        const b = e.currentTarget; if (b.disabled) return;
        if (!waive.checked) { flash('Zaznacz zgodę na wykonanie usługi od razu po płatności.', true); waive.focus(); return; }
        b.disabled = true; b.textContent = 'Przechodzę do płatności…';
        try {
          const r = await fetch(`/api/orders/${orderId}/upsell`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: o.key, waiver: true, gateway: gwValue($('#upGw')) }) }); const j = await r.json();
          if (!r.ok) throw new Error(j.error || 'Nie udało się otworzyć płatności.');
          if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); return startResult(orderId); }
          location.href = j.url;
        } catch (x) { flash(x.message); b.disabled = false; b.textContent = `Dodaj za ${o.price} zł`; }
      } })))));
}
// Kod klienta: −10 zł dla niego na kolejne zamówienie i dla znajomych (każda osoba raz).
function drawMyCode() { refCard($('#referral'), data.myCode); }
// Karta poleceń (strona dokumentów i /konto, PR S).
function refCard(box, k) {
  box.hidden = !k;
  if (!k) return box;
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
    el('p', { className: 'ref-friend' }, el('b', { textContent: 'Znajomy też szuka pracy?' }), ' ', el('span', { className: 'hint', textContent: 'Wyślij mu gotową wiadomość z Twoim kodem.' })),
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
  return box;
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
  $('#rewriteDone').hidden = data.mode !== 'rewrite';
  // Pytanie na stronie dokumentów tylko w pierwszej dobie po płatności (później nie wraca).
  if (data.paidAt && Date.now() - data.paidAt < 864e5) drawHeard($('#heardRes')); else $('#heardRes').hidden = true;
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
    // Wersja ATS .txt: przy CV, bezpłatna (PR Q).
    $('#txtBtn').hidden = curDoc !== 'cv';
    $('#txtBtn').href = `/api/orders/${orderId}/txt/${curAd}${curLang ? '?lang=' + curLang : ''}`;
    $('#txtBtn').onclick = cfg.preview ? (e) => { e.preventDefault(); flash('W podglądzie pobieranie pliku .txt jest wyłączone.'); } : null;
    $('#docxBtn').onclick = cfg.preview ? (e) => { e.preventDefault(); flash('W podglądzie pobieranie pliku Word jest wyłączone. Na działającej stronie pobierzesz edytowalny plik .docx.'); } : null;
    $('#resActions').hidden = !editable;
    $('#revLeft').textContent = `Pozostało poprawek: ${data.revisionsLeft ?? cfg.maxRevisions}`;
    $('#hlTog').parentElement.hidden = curDoc !== 'cv';
    drawMatch(r); drawPaper();
    // Tytuł strony = domyślna nazwa pliku przy „Zapisz jako PDF” (ta sama co załącznik w mailu: lib/doc-names.js).
    try { document.title = DOC_KIND[curDoc] ? docBase(curDoc, r.cv.name, r.position, r.lang) : `${DOCS[curDoc]} ${r.cv.name} – ${r.position}`; } catch {}
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
  drawFollowup(); drawUpsell(); drawXsell(); drawNotify(); drawMyCode(); drawRate(); drawAcctOffer();
  draw();
  if (location.hash === '#ocena') setTimeout(() => $('#rate').scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  if (location.hash === '#kolejne') setTimeout(() => $('#followup').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  // Linki z e-maila z gotowym CV: propozycja dodatku i założenia konta.
  if (['#upsell', '#acctOffer'].includes(location.hash)) setTimeout(() => { const t = $(location.hash); if (t && !t.hidden) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
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
// B4/B5 (26.10): prawdziwe liczby z zamówień (serwer zwraca je dopiero powyżej progów) i odznaka najczęściej wybieranego pakietu.
function drawLive(s) {
  for (const id of ['liveStats', 'liveStats6']) {
    const b = $('#' + id); if (!b) continue; b.hidden = !s.week; if (!s.week) continue;
    b.replaceChildren(el('span', { textContent: tr('CV przygotowanych w ostatnich 7 dniach:') }), ' ', el('b', { textContent: String(s.week.cvs) }), ' · ', el('span', { textContent: tr('Typowy czas dostarczenia:') }), ' ', el('b', { textContent: `${s.week.minutes} min` }));
  }
  const lab = s.popular && $(`input[name=pkg][value="${s.popular}"]`)?.closest('label');
  if (lab && !$('.badge-rec', lab)) { lab.classList.add('rec'); $('.o-t', lab).after(el('span', { className: 'badge-rec', textContent: tr('Najczęściej wybierany') })); }
}
(async () => { try { const s = await (await fetch('/api/public-stats')).json(); drawLive(s); if (s.cvs) { $('#cvCounter').replaceChildren(el('b', { textContent: s.cvs.toLocaleString('pl-PL') }), ' CV przygotowanych pod konkretne ogłoszenia'); $('#cvCounter').hidden = false; }
  // Wyniki klientów z ankiety: serwer zwraca je dopiero od OUTCOMES_MIN odpowiedzi (lib/outcomes.js), wcześniej nic nie pokazujemy.
  const o = s.outcome; if (o) { $('#outcomeStat').replaceChildren(`${o.pct}% klientów, którzy odpowiedzieli na naszą ankietę i wysłali CV, dostało co najmniej jedno zaproszenie na rozmowę (n=${o.n}, okres ${o.from}–${o.to}).`, ' ', el('a', { href: '/jak-liczymy', textContent: 'Jak liczymy' })); $('#wyniki').hidden = false; }
} catch {} })();

// Pasek „Zacznij” na telefonie: po przewinięciu strony, gdy nie jest otwarte okno ani wynik.
// B1 (26.10): pasek „CV pod to ogłoszenie” na telefonie po przewinięciu 40% strony głównej; zamknięty (×) nie wraca przez 24 h.
const MCTA_KEY = 'cvpo-mcta-x', mctaOff = () => { try { return Date.now() - Number(localStorage.getItem(MCTA_KEY) || 0) < 864e5; } catch { return false; } };
const scrolled40 = () => scrollY >= 0.4 * Math.max(1, document.documentElement.scrollHeight - innerHeight);
const mctaShow = (show) => { $('#mcta').hidden = !show; document.body.classList.toggle('mcta-on', show); };
addEventListener('scroll', () => mctaShow(!mctaOff() && scrolled40() && !$('#landing').hidden && $('#page').hidden && $('#result').hidden && ($('#account')?.hidden ?? true) && $('#wiz').hidden && document.body.style.overflow !== 'hidden'), { passive: true });
$('#mctaX').onclick = () => { try { localStorage.setItem(MCTA_KEY, String(Date.now())); } catch {} mctaShow(false); };

async function loadContent() {
  if (!CONTENT) {
    try { CONTENT = await (await fetch('/content.json')).json(); } catch { CONTENT = { INDEX: [], POPULAR: [], ARTICLES: [], CITIES: [] }; }
    // Kafelki narzędzi i linki w stopce: adresy w języku strony (serwer robi to samo dla wersji /en, /uk, /de).
    const l = window.I18N?.lang;
    if (l && l !== 'pl') $$('a[href="/regulamin"]:not([data-lang]),a[href^="/regulamin#"]:not([data-lang]),a[href="/polityka-prywatnosci"]:not([data-lang])').forEach((a) => { const [h, hash] = a.getAttribute('href').split('#'); a.setAttribute('href', legalUrl(h === '/regulamin' ? 'regulamin' : 'prywatnosc', l) + (hash ? `#${hash}` : '')); });
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
      // zawody bez tłumaczenia (np. tylko po polsku) nie trafiają do indeksu strony w innym języku
      CONTENT.INDEX = CONTENT.INDEX.filter((p) => pr.index[p.slug]).map((p) => ({ ...p, ...pr.index[p.slug] }));
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
const HOME_TITLE = 'Dopasuj CV do ogłoszenia – darmowy skaner CV, od 39 zł';
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

// --- Zdjęcie do CV (D1, 10 zł): kadr (ramka 3:4 ustawiana na zdjęciu) i jasność; darmowy podgląd 300 px ze znakiem wodnym, pliki po płatności ---
function photoPro() {
  const q = new URLSearchParams(location.search), forOrder = q.get('cv') || '', paidId = q.get('zamowienie') || '';
  let src = '', iw = 0, ih = 0, fr = { x: 0, y: 0, w: 1 };
  const radios = (name, opts) => el('div', { className: 'seg', role: 'radiogroup' }, ...opts.map(([v, t], i) => el('label', { className: 'chk' }, el('input', { type: 'radio', name, value: v, checked: !i }), ` ${tr(t)}`)));
  const crop = radios('phCrop', [['3:4', 'kadr 3:4'], ['1:1', 'kwadrat']]);
  // Ramka kadru: przeciągasz ją po zdjęciu, suwak zmienia wielkość. Ułamki szerokości/wysokości zdjęcia, jak w lib/photo-pro.js (cleanFrame).
  const pic = el('img', { alt: tr('Twoje zdjęcie – ustaw ramkę kadru'), draggable: false }), frameBox = el('div', { className: 'ph-box' }), zoom = el('input', { type: 'range', min: 35, max: 100, value: 100, ariaLabel: tr('Wielkość kadru') });
  const editor = el('div', { className: 'ph-edit', hidden: true }, el('div', { className: 'ph-frame' }, pic, frameBox), el('label', { className: 'f ph-zoom' }, tr('Wielkość kadru'), zoom), el('p', { className: 'hint', textContent: tr('Przesuń ramkę tak, żeby głowa i ramiona były w środku, z niewielkim marginesem nad głową.') }));
  const maxW = () => Math.min(1, (ih * 3) / 4 / iw), fh = () => (fr.w * iw * 4) / 3 / ih;
  const clampFr = () => { fr.x = Math.min(Math.max(0, fr.x), 1 - fr.w); fr.y = Math.min(Math.max(0, fr.y), 1 - fh()); };
  const drawFr = () => { clampFr(); Object.assign(frameBox.style, { left: `${fr.x * 100}%`, top: `${fr.y * 100}%`, width: `${fr.w * 100}%`, height: `${fh() * 100}%` }); img.replaceChildren(); buyBox.hidden = true; };
  zoom.oninput = () => { const cx = fr.x + fr.w / 2, cy = fr.y + fh() / 2; fr.w = (maxW() * zoom.value) / 100; fr.x = cx - fr.w / 2; fr.y = cy - fh() / 2; drawFr(); };
  frameBox.onpointerdown = (e) => {
    e.preventDefault(); frameBox.setPointerCapture(e.pointerId);
    const r = pic.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = fr.x, oy = fr.y;
    frameBox.onpointermove = (m) => { fr.x = ox + (m.clientX - sx) / r.width; fr.y = oy + (m.clientY - sy) / r.height; drawFr(); };
    frameBox.onpointerup = frameBox.onpointercancel = () => (frameBox.onpointermove = null);
  };
  const val = (g) => g.querySelector('input:checked').value;
  const img = el('div', { className: 'ph-pro-img' }), st = el('p', { className: 'fstatus', role: 'status' });
  const email = el('input', { type: 'email', autocomplete: 'email', placeholder: 'twoj@email.pl', maxLength: 160 });
  const terms = el('input', { type: 'checkbox' }), waiver = el('input', { type: 'checkbox' }), wantInv = el('input', { type: 'checkbox' });
  const invName = el('input', { type: 'text', maxLength: 200 }), invAddr = el('input', { type: 'text', maxLength: 250 }), invNip = el('input', { type: 'text', maxLength: 16, inputMode: 'numeric' });
  const inv = el('div', { className: 'invbox', hidden: true }, el('label', { className: 'f' }, tr('Nazwa firmy albo imię i nazwisko'), invName), el('label', { className: 'f' }, tr('Adres'), invAddr), el('label', { className: 'f' }, tr('NIP (pomiń, jeśli kupujesz prywatnie)'), invNip));
  wantInv.onchange = () => (inv.hidden = !wantInv.checked);
  const gw = el('div', { className: 'gw-box' }), show = el('button', { type: 'button', className: 'btn ghost', textContent: tr('Pokaż podgląd za darmo') }), buy = el('button', { type: 'button', className: 'btn', textContent: `${tr('Kup zdjęcie do CV –')} ${PRICE.photo} zł` });
  const buyBox = el('div', { className: 'ph-buy', hidden: true }, el('label', { className: 'f' }, tr('E-mail – wyślemy na niego zdjęcie'), email),
    el('label', { className: 'check' }, wantInv, el('span', { textContent: tr('Potrzebuję faktury (bez VAT – sprzedawca jest zwolniony z VAT).') })), inv,
    el('label', { className: 'check' }, terms, el('span', {}, tr('Akceptuję'), ' ', el('a', { href: '/regulamin', target: '_blank', textContent: tr('Regulamin') }), ' ', tr('i'), ' ', el('a', { href: '/polityka-prywatnosci', target: '_blank', textContent: tr('Politykę prywatności') }), '.')),
    el('label', { className: 'check' }, waiver, el('span', { textContent: tr('Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.') })), gw, buy);
  const box = el('section', { className: 'ph-pro' }, el('h2', { textContent: tr('Zdjęcie gotowe do CV – 10 zł') }),
    el('p', { textContent: tr('Kadrujemy zdjęcie do CV (3:4 i kwadrat) i wyrównujemy jasność. Tła nie zmieniamy, nie retuszujemy twarzy i nie zmieniamy wyglądu. Dostajesz pliki JPG i PNG w wysokiej rozdzielczości, a jeśli masz u nas CV – wstawimy zdjęcie także do niego.') }),
    el('p', { className: 'hint', textContent: tr('Wgraj zdjęcie powyżej. Darmowy podgląd jest mały i ze znakiem wodnym. Zdjęcie do zamówienia przechowujemy 30 dni, potem je usuwamy.') }),
    editor, el('div', { className: 'ph-opts' }, crop), el('div', { className: 'tool-btns' }, show), img, st, buyBox);
  if (forOrder) box.append(el('p', { className: 'hint', textContent: tr('Po płatności wstawimy zdjęcie do Twojego CV z tego zamówienia.') }));
  show.disabled = true;
  show.onclick = async () => {
    st.className = 'fstatus'; st.textContent = tr('Przygotowujemy podgląd…'); show.disabled = true;
    try {
      const r = await fetch('/api/photo/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: src, frame: fr, crop: val(crop) }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      img.replaceChildren(el('img', { src: j.image, alt: tr('Podgląd zdjęcia do CV ze znakiem wodnym'), draggable: false })); st.textContent = '';
      buyBox.hidden = false; if (!gw.childElementCount) gwPicker(gw, 'phGw');
    } catch (e) { st.className = 'fstatus bad'; st.textContent = e.message; }
    show.disabled = false;
  };
  buy.onclick = async () => {
    st.className = 'fstatus'; buy.disabled = true;
    try {
      const body = { testCode: new URLSearchParams(location.search).get('kod') || undefined, image: src, frame: fr, crop: val(crop), email: email.value, terms: terms.checked, waiver: waiver.checked, gateway: gwValue(gw), uiLang: window.I18N?.lang || 'pl', ...(forOrder ? { forOrder } : {}), ...(wantInv.checked ? { invoice: { name: invName.value, address: invAddr.value, nip: invNip.value } } : {}) };
      const r = await fetch('/api/products/photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.free) return paid(j.id); // kod testowy właściciela: bez płatności
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); return paid(j.id); }
      location.href = j.url;
    } catch (e) { st.className = 'fstatus bad'; st.textContent = e.message; buy.disabled = false; }
  };
  // Powrót z płatności (?zamowienie=<id>): czekamy na potwierdzenie, potem linki do plików.
  async function paid(id) {
    buyBox.hidden = true; st.className = 'fstatus'; st.textContent = tr('Przygotowujemy Twoje zdjęcie…');
    for (let i = 0; i < 60; i++) {
      const j = await (await fetch(`/api/products/${encodeURIComponent(id)}`)).json().catch(() => ({}));
      if (j.status === 'done') {
        st.className = 'fstatus good'; st.replaceChildren(el('b', { textContent: tr('Gotowe. Pobierz zdjęcie:') }), ' ', ...PHOTO_NAMES.flatMap(([f, t], k) => [k ? ' · ' : '', el('a', { href: `/api/products/${encodeURIComponent(id)}/${f}`, download: f, textContent: t })]),
          ...(j.inserted ? [el('br'), tr('Zdjęcie jest też w Twoim CV – pobierz PDF jeszcze raz na stronie dokumentów.')] : []), ...(j.mailed ? [el('br'), tr('Pliki wysłaliśmy też na e-mail.')] : []));
        return;
      }
      if (j.error) { st.className = 'fstatus bad'; st.textContent = j.error; return; }
      await new Promise((ok) => setTimeout(ok, 2500));
    }
    st.textContent = tr('Płatność jeszcze się potwierdza. Pliki wyślemy na e-mail, gdy będą gotowe.');
  }
  if (paidId) setTimeout(() => paid(paidId), 0);
  crop.onchange = () => { img.replaceChildren(); buyBox.hidden = true; };
  return { box, set: (d) => {
    src = d; show.disabled = true;
    pic.onload = () => { iw = pic.naturalWidth; ih = pic.naturalHeight; fr.w = maxW(); fr.x = (1 - fr.w) / 2; fr.y = (1 - fh()) * 0.3; zoom.value = 100; editor.hidden = false; drawFr(); show.disabled = false; };
    pic.src = d;
  } };
}

// --- Ocena zdjęcia do CV (AI, zdjęć nie zapisujemy) ---
function toolPhoto(box, out) {
  const pro = photoPro();
  const prev = el('div', { className: 'ph-prev', hidden: true }), status = el('p', { className: 'fstatus', role: 'status' });
  const file = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
  out.hidden = true;
  file.onchange = async () => {
    const f = file.files[0]; if (!f) return;
    status.className = 'fstatus'; status.textContent = 'Oceniamy zdjęcie…'; out.hidden = true;
    try {
      const img = await shrinkImage(f, 1000);
      pro.set(await shrinkImage(f, 1600)); // D1: wersja do przygotowania zdjęcia (pliki mają najwyżej 1200×1600)
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
  box.append(el('div', { className: 'ph-row' }, prev, el('div', {}, el('label', { className: 'btn filebtn' }, 'Wgraj zdjęcie', file), el('p', { className: 'hint', textContent: 'JPG, PNG lub WebP. Zdjęcie jest oceniane i od razu odrzucane, nie zapisujemy go. Limit: 5 ocen na godzinę.' }))), status, out, pro.box,
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
    window.__toolCtx?.(ranked[0]?.p); // najlepiej dopasowany zawód → blok „Sprawdź też swoje CV”
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
// PR H: blok „Sprawdź też swoje CV” na narzędziach (poza skanerem i narzędziami do CV, które mają własne linki).
// Zawód znany z narzędzia (quiz „Jaki zawód”) trafia do skanera (?zawod=) i daje link do strony zawodu. Klik → beacon „toolscan”.
const NO_SCAN_BLOCK = new Set(['skaner-cv', 'sprawdz-cv', 'test-cv-ats']);
function toolScanBlock(slug) {
  const links = el('p', { className: 'prof-cta' });
  const draw = (p) => links.replaceChildren(
    el('a', { className: 'btn ghost', href: pageHref('narzedzia/skaner-cv') + (p ? `?zawod=${encodeURIComponent(p.slug)}` : ''), textContent: 'Sprawdź CV za darmo', onclick: () => track('toolscan', { t: slug }) }),
    ...(p ? [' ', pageLink(`cv/${p.slug}`, { className: 'btn ghost', textContent: `CV dla zawodu: ${p.name}` })] : []));
  draw(null);
  window.__toolCtx = draw;
  return el('div', { className: 'cta-box tool-scan' }, el('div', {}, el('b', { textContent: 'Sprawdź też swoje CV' }), el('p', { className: 'hint', textContent: 'Darmowy skaner porówna Twoje CV z ogłoszeniem o pracę i pokaże, których wymagań z ogłoszenia nie widać w CV.' })), links);
}
// Skaner otwarty z narzędzia z zawodem (?zawod=<slug>): tylko podpowiedź i link do strony zawodu, skanowanie bez zmian.
function scanCtxHint(C) {
  const z = new URLSearchParams(location.search).get('zawod'), p = z && (C.INDEX || []).find((x) => x.slug === z);
  return p ? el('p', { className: 'tool-ctx' }, 'Skanujesz CV na: ', el('b', { textContent: p.name }), ' · ', pageLink(`cv/${p.slug}`, { textContent: 'Jak napisać CV dla tego zawodu' })) : null;
}
// Skaner z ?partner=<KOD> (PR Y): nagłówek z nazwą uczelni/szkoły z zatwierdzonego zgłoszenia; kod zapisany jak ?ref=.
function partnerHead() {
  const code = new URLSearchParams(location.search).get('partner');
  if (!code || !/^[A-Za-z0-9-]{3,30}$/.test(code)) return null;
  const box = el('p', { className: 'tool-ctx partner-head', hidden: true });
  fetch(`/api/partner/${encodeURIComponent(code)}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j) return;
    try { localStorage.setItem(REF_KEY, j.code); } catch {}
    box.replaceChildren(el('b', { textContent: `${j.uni ? 'Skaner CV dla studentów' : 'Skaner CV dla uczestników'}: ${j.org}` }), ' · ', el('span', { className: 'hint', textContent: `kod ${j.code} wpisze się sam przy zamówieniu` }));
    box.hidden = false;
  }).catch(() => {});
  return box;
}
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
  else if (slug === 'sprawdz-cv') toolCheck(box, false);
  else if (slug === 'test-cv-ats') toolCheck(box, true);
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
    el('h1', { textContent: t.title }), el('p', { className: 'lead', textContent: t.lead }), plNote(), ...(slug === 'skaner-cv' ? [partnerHead(), scanCtxHint(C)].filter(Boolean) : []), box,
    ...(NO_SCAN_BLOCK.has(slug) ? [] : [toolScanBlock(slug)]),
    ...(t.about || []).map((x) => el('p', { textContent: x })),
    // rozszerzone wersje EN/DE (seo-data/ext-*.json): te same sekcje i źródła co w wersji z serwera
    ...(t.sections || []).flatMap((s) => [el('h2', { textContent: s.h }), ...s.p.map((x) => el('p', { textContent: x }))]),
    ...(t.faq?.length ? [el('h2', { textContent: 'Pytania' }), ...t.faq.map((f) => el('details', {}, el('summary', { textContent: f.q }), el('p', { textContent: f.a })))] : []),
    ...(t.sources?.length ? [el('h2', { textContent: 'Źródła' }), el('ul', { className: 'sources' }, ...t.sources.map((x) => el('li', {}, el('a', { href: x.u, rel: 'noopener', target: '_blank', textContent: x.t }))))] : []),
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
const STATUS_CLS = { przygotowane: 'st-prep', 'wysłane': 'st-sent', rozmowa: 'st-int', oferta: 'st-ok', odmowa: 'st-no', 'brak odpowiedzi': 'st-none' };
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
      st.onchange = () => put(a, { status: st.value, ...(a.status === 'przygotowane' && st.value === 'wysłane' ? { applied: new Date().toISOString().slice(0, 10) } : {}) });
      const when = el('input', { type: 'datetime-local', value: dtLocal(a.interviewAt), ariaLabel: 'Termin rozmowy' });
      when.onchange = () => put(a, { interviewAt: when.value ? new Date(when.value).toISOString() : '', status: when.value && a.status === 'wysłane' ? 'rozmowa' : a.status });
      const rem = el('input', { type: 'checkbox', checked: !!a.remind, disabled: !a.interviewAt });
      rem.onchange = () => put(a, { remind: rem.checked, interviewAt: a.interviewAt ? new Date(a.interviewAt).toISOString() : '' });
      // Przypomnienie o follow-up: e-mail w wybranym dniu (domyślna propozycja: 7 dni po wysłaniu).
      const fol = el('input', { type: 'date', value: a.followAt || '', min: new Date().toISOString().slice(0, 10), ariaLabel: 'Przypomnienie o follow-up' });
      fol.onchange = () => put(a, { followAt: fol.value || '' });
      const plus7 = el('button', { className: 'link', type: 'button', textContent: '+7 dni', hidden: !!a.followAt || a.status !== 'wysłane' });
      plus7.onclick = () => { const t = Math.max(Date.parse(a.applied) + 7 * 864e5, Date.now() + 864e5); put(a, { followAt: new Date(t).toISOString().slice(0, 10) }); };
      const note = el('input', { type: 'text', value: a.note || '', maxLength: 500, placeholder: 'np. kontakt: p. Anna, HR', ariaLabel: 'Notatka' });
      note.onchange = () => put(a, { note: note.value });
      const fit = el('button', { className: 'btn ghost sm', type: 'button', textContent: 'Dopasuj CV do tej oferty', hidden: !a.hasAd && !a.link });
      fit.onclick = () => fitToApp(a);
      const del = el('button', { className: 'link', type: 'button', textContent: 'Usuń' });
      del.onclick = async () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; return; } await accApi('/apps/' + a.id, { method: 'DELETE' }).catch(() => {}); reload(); };
      return el('div', { className: 'app-row' },
        el('div', { className: 'app-main' }, el('b', { textContent: a.position || '—' }), el('span', { textContent: a.company || '' }), a.link ? el('a', { href: a.link, target: '_blank', rel: 'noopener noreferrer', textContent: 'ogłoszenie ↗' }) : null, el('small', { textContent: `${a.status === 'przygotowane' ? 'przygotowano' : 'wysłano'} ${new Date(a.applied).toLocaleDateString('pl-PL')}` })),
        el('label', { className: 'f' }, 'Status', st),
        el('label', { className: 'f' }, 'Rozmowa', when),
        el('label', { className: 'check' }, rem, el('span', { textContent: a.reminded ? 'Przypomnienie wysłane' : 'Przypomnij dzień wcześniej (e-mail)' })),
        el('label', { className: 'f' }, a.followSent ? 'Follow-up (przypomnienie wysłane)' : 'Przypomnij o follow-up', el('span', { className: 'app-fol' }, fol, plus7)),
        el('label', { className: 'f app-note' }, 'Notatka', note),
        el('div', { className: 'app-act' }, fit, del));
    });
    appsBox.replaceChildren(
      el('div', { className: 'app-tools' }, el('span', { className: 'hint', textContent: `${d.apps.length} z ${d.max || 500} pozycji` }),
        d.apps.length ? el('a', { className: 'btn ghost sm', href: '/api/account/apps.csv', download: '', textContent: 'Pobierz CSV' }) : null,
        el('label', { className: 'check' }, (() => { const c = el('input', { type: 'checkbox', checked: !d.followOff }); c.onchange = async () => { try { await accApi('/follow-off', { method: 'POST', body: JSON.stringify({ off: !c.checked }) }); d.followOff = !c.checked; } catch (x) { flash(x.message, true); } }; return c; })(), el('span', { textContent: 'Wysyłaj przypomnienia o follow-up' }))),
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
    d.myCode ? refCard(el('section', { className: 'referral acct-card' }), d.myCode) : null,
    el('div', { className: 'acct-card' }, el('h2', { textContent: 'Twoje zamówienia' }), el('p', { className: 'hint', textContent: 'Zamówienia z ostatnich 30 dni (starsze usuwamy automatycznie razem z dokumentami).' }),
      // Kolejne CV z danymi z ostatniego zamówienia (formularz „Masz kolejne ogłoszenia?” na stronie dokumentów, z prefillem).
      d.orders.length ? el('p', {}, el('a', { className: 'btn sm', href: `/?id=${d.orders[0].id}#kolejne`, textContent: 'Zrób kolejne CV pod nowe ogłoszenie w 2 minuty – dane już są' })) : null,
      ...(d.orders.length ? d.orders.map((o) => el('div', { className: 'acct-order' },
        el('div', {}, el('b', { textContent: o.pkg }), el('small', { textContent: ` · ${new Date(o.created).toLocaleDateString('pl-PL')}` })),
        el('div', { className: 'acct-pos' }, ...o.positions.map((p, i) => el('span', {}, p.position, ' ', el('button', { className: 'link', type: 'button', textContent: '+ do aplikacji', onclick: () => { addBox.replaceChildren(el('h2', { textContent: 'Dodaj aplikację' }), appForm({ position: p.position, company: p.company, orderId: o.id, resultIndex: i })); addBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); } })))),
        el('a', { className: 'btn ghost sm', href: `/?id=${o.id}`, textContent: 'Otwórz dokumenty', onclick: cfg.preview ? (ev) => { ev.preventDefault(); $('#account').hidden = true; startResult(o.id); } : null })))
        : [el('p', { className: 'hint', textContent: 'Nie ma zamówień z ostatnich 30 dni na ten adres.' })])),
    addBox,
    el('div', { className: 'acct-card' }, el('h2', { textContent: 'Moje aplikacje' }), el('p', { className: 'hint', textContent: 'Zapisuj, gdzie wysyłasz CV. CV z zamówień dodają się same jako „przygotowane”. Przypomnienie o follow-up przyjdzie e-mailem w wybranym dniu, a przypomnienie o rozmowie – dzień przed terminem. Wpisy znikają razem z kontem.' }), appsBox),
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
// B2 (26.10): powrót z niedokończonym kreatorem – baner na stronie głównej z nazwą stanowiska i krokiem; „Dokończ” otwiera ten krok.
{
  let d = null; try { d = JSON.parse(localStorage.getItem(DKEY)); } catch {}
  const p = new URLSearchParams(location.search), st = Number(d?.step), label = (d?.f?.headline || d?.ads?.find((a) => a.title)?.title || '').trim().slice(0, 60);
  if (d && $('#draftNote').hidden === false && st >= 1 && st <= 6 && !window.__ROUTE && !['zamow', 'id', 'draft', 'szkic'].some((k) => p.get(k))) {
    $('#resumeTxt').textContent = `${tr('Masz niedokończone CV')}${label ? `: ${label}` : ''} · ${tr('krok {0} z {1}').replace('{0}', ORDER.indexOf(stepOf(st)) + 1).replace('{1}', ORDER.length)}`;
    $('#resumeBar').hidden = false;
    $('#resumeGo').onclick = () => { track('draftresume'); $('#resumeBar').hidden = true; openWiz(); go(stepOf(st)); };
  }
}
refresh(); go(ORDER[0]);
$('#clearDraft').onclick = () => { clearDraft(); resetWizard(); $('#draftNote').hidden = true; };
const q = new URLSearchParams(location.search);
if (window.__ROUTE?.startsWith('legal/')) $$('.langsw a').forEach((a) => a.setAttribute('href', legalUrl(window.__ROUTE.slice(6), a.dataset.lang)));
else if (window.__ROUTE) showPage(window.__ROUTE, false);
// „Dopasuj CV do tej oferty” z listy aplikacji: ogłoszenie (treść albo link) w pierwszym polu kreatora; karnet działa jak zwykle.
async function fitToApp(a) {
  let d; try { d = await accApi(`/apps/${a.id}/ad`); } catch (x) { flash(x.message, true); return; }
  $('#account').hidden = true; $('#landing').hidden = false;
  const first = $('#ads .entry');
  if (first) {
    $('[data-k=title]', first).value = d.title || ''; $('[data-k=text]', first).value = d.text || '';
    if (d.text && d.text.length >= 80) { first.dataset.fetched = '1'; setMode(first, 'paste'); }
    else if (d.url) { $('[data-k=url]', first).value = d.url; setMode(first, 'link'); $('.fetchbtn', first).click(); }
  }
  openWiz();
}
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
  // Zalogowany klient: ogłoszenie trafia też na listę aplikacji („przygotowane”), żeby nie zgubić oferty.
  accApi('/apps/from-draft', { method: 'POST', body: JSON.stringify({ draftId: id }) }).then((r) => { if (!r.duplicate) flash('Zapisaliśmy tę ofertę w Twoich aplikacjach na koncie.'); }).catch(() => {});
}
// ?zamow=1 (przycisk „Zamów” z lekkiej podstrony): kreator z wybranym pakietem i dodatkami.
// ?jezyk=de|en|… (strony „CV za granicę”): dodatkowo język dokumentów dla pierwszego ogłoszenia.
if ((q.get('zamow') || LANGS[q.get('jezyk')]) && !q.get('id') && !q.get('draft')) {
  try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
  (q.get('dodatki') || '').split(',').filter((a) => /^\w+$/.test(a)).forEach((a) => { const c = $('#ad' + a); if (c) c.checked = true; });
  const s = LANGS[q.get('jezyk')] && $('#ads .entry [data-k=lang]'); if (s) { s.value = q.get('jezyk'); refresh(); }
  // ?szablon=<id> (strony „CV Europass”, „CV do urzędu”): wybrany szablon w kreatorze.
  if (TPLS.some((t) => t[0] === q.get('szablon'))) { design = { ...design, tpl: q.get('szablon') }; drawWizDesign(); saveDraft(); }
  openWiz(['cv', 'cv_letter', 'pack3'].includes(q.get('pkg')) ? q.get('pkg') : undefined);
  // Ogłoszenie wklejone na stronie /kreator-cv (lite.js → pamięć tej karty): trafia do pierwszego ogłoszenia w kreatorze.
  try {
    const ad = sessionStorage.getItem('cvpo-wiz-ad'), first = $('#ads .entry');
    if (ad && first) { sessionStorage.removeItem('cvpo-wiz-ad'); const ta = $('[data-k=text]', first); if (ta && !ta.value.trim()) { ta.value = ad; setMode(first, 'paste'); fillTitle(first); saveDraft(); } }
  } catch {}
  if (q.get('tryb') === 'zawod' && !q.get('zawod')) profStart();
  // ?zawod=<slug> (przycisk na stronie zawodu): nazwa zawodu jako ogólne stanowisko, jeśli pole jest puste.
  const zaw = q.get('zawod') || '';
  if (/^[a-z0-9-]{2,60}$/.test(zaw)) loadContent().then((C) => {
    const p = C.INDEX?.find((x) => x.slug === zaw); if (!p) return;
    if (!$('#headline').value.trim()) { $('#headline').value = p.name; saveDraft(); }
    // ?tryb=zawod (przycisk „CV pod ten zawód” bez ogłoszenia): pierwsze ogłoszenie w trybie „Bez ogłoszenia” z wymaganiami zawodu.
    const first = $('#ads .entry');
    if (q.get('tryb') === 'zawod' && first && !$('[data-k=text]', first).value.trim()) { setMode(first, 'prof'); first.profRun?.(p.name); }
  }).catch(() => {});
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
  // Link z e-maila (także z przypomnienia) wraca dokładnie do kroku, na którym zapisano szkic.
  const st = stepOf(Number(d.data?.step)); if (st !== ORDER[0]) go(st);
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
  addEventListener('resize', () => { if (innerWidth > 1100 && !menu.hidden) set(false); });
}
})();
