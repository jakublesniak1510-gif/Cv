(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k.filter((x) => x != null && x !== false)); return e; };
const PRICE = { cv: 39, cv_letter: 49, extra: 20 };
const STEPS = ['Pakiet', 'Twoje dane', 'Doświadczenie', 'Wykształcenie i umiejętności', 'Ogłoszenia', 'Podsumowanie'];
let cfg = { demo: false, maxAds: 5, noPrint: false };
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
  cfg = c; $$('.linkbox').forEach((l) => { if (c.fakeFetch && !$('.hint', l)) l.append(el('p', { className: 'hint', textContent: 'Podgląd: link nie jest naprawdę pobierany, wstawiamy przykładowe ogłoszenie.' })); }); $('#demoBar').hidden = !c.demo; $('#fill').hidden = !c.demo; $('#printNote').hidden = !c.noPrint; $('#simNote').hidden = !c.demo;
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
const changesList = (e) => [el('h3', { textContent: 'Co zmieniliśmy w tym CV' }), el('ul', {}, ...e.changes.map((c) => el('li', { textContent: c }))), e.notAdded && el('p', { className: 'notadded' }, el('b', { textContent: 'Czego nie dopisaliśmy: ' }), e.notAdded)];
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

/* pełny podgląd przykładu (okno) */
let exI = 0, exDoc = 'cv';
function drawExView() {
  const e = EX[exI], r = exResult(exI);
  $('#exSide').replaceChildren(
    el('h3', { textContent: '1. Dane, które podajesz raz' }),
    el('div', { className: 'exbase' }, el('b', { textContent: BASE.name }), el('div', { textContent: BASE.contact.join(' · ') }),
      ...BASE.jobs.map((j) => el('div', {}, el('b', { textContent: j.title }), ` · ${j.company} (${j.period})`)),
      el('div', {}, el('b', { textContent: 'Umiejętności: ' }), BASE.skills), el('div', {}, el('b', { textContent: 'Języki: ' }), BASE.langs.join(', '))),
    el('h3', { textContent: '2. Ogłoszenie (wybierz)' }),
    el('div', { className: 'adlist' }, ...EX.map((x, i) => el('button', { type: 'button', 'aria-selected': i === exI, onclick: () => { exI = i; exDoc = 'cv'; drawExView(); } }, el('b', { textContent: x.title }), el('span', { textContent: x.company })))),
    el('div', { className: 'doc ad' }, el('div', { className: 'tagline', textContent: 'Treść ogłoszenia' }), el('p', {}, hl(e.ad, e.kws))));
  $('#exDocTabs').replaceChildren(...[['cv', 'CV'], ['letter', 'List motywacyjny']].map(([k, t]) => el('button', { type: 'button', textContent: t, 'aria-selected': k === exDoc, onclick: () => { exDoc = k; drawExView(); } })));
  $('#exPaper').replaceChildren(exDoc === 'cv' ? cvNode(r, true) : letterNode(r));
  $('#exChanges').replaceChildren(...changesList(e));
}
function openEx(i = 0) { exI = i; exDoc = 'cv'; drawExView(); $('#exview').hidden = false; document.body.style.overflow = 'hidden'; $('.exv-body').scrollTop = 0; setTimeout(() => $('#exClose').focus(), 0); }
const closeEx = () => { $('#exview').hidden = true; document.body.style.overflow = ''; };
$$('[data-example]').forEach((b) => (b.onclick = () => openEx(+b.dataset.example || 0)));
$('#exClose').onclick = closeEx;
$('#exCta').onclick = () => { closeEx(); openWiz(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#exview').hidden) closeEx(); });

/* ---------- Kreator ---------- */
const rowT = {
  exp: () => `<div class="grid4"><label class="f">Stanowisko<input type="text" data-k="title"></label><label class="f">Firma<input type="text" data-k="company"></label><label class="f">Od<input type="text" data-k="from" placeholder="03.2021"></label><label class="f">Do<input type="text" data-k="to" placeholder="obecnie"></label></div><label class="f">Obowiązki i osiągnięcia <span class="h">każdy punkt w nowej linii</span><textarea data-k="description"></textarea></label>`,
  edu: () => `<div class="grid4"><label class="f">Szkoła<input type="text" data-k="school"></label><label class="f">Kierunek / tytuł<input type="text" data-k="degree"></label><label class="f">Od<input type="text" data-k="from"></label><label class="f">Do<input type="text" data-k="to"></label></div>`,
  ads: () => `<div class="seg modes" role="tablist"><button type="button" role="tab" data-mode="link">Link do ogłoszenia</button><button type="button" role="tab" data-mode="paste">Wklej treść</button></div>
<div class="linkbox"><label class="f">Adres ogłoszenia<span class="urlrow"><input type="text" data-k="url" inputmode="url" placeholder="https://…"><button type="button" class="btn sm fetchbtn">Pobierz</button></span></label><div class="fstatus" role="status"></div></div>
<div class="adfields"><label class="f">Nazwa stanowiska<input type="text" data-k="title" placeholder="np. Kasjer / Sprzedawca"></label><label class="f">Treść ogłoszenia <span class="h">sprawdź i w razie potrzeby popraw</span><textarea data-k="text" style="min-height:150px"></textarea></label></div>`,
};
const label = { exp: 'Stanowisko', edu: 'Szkoła', ads: 'Ogłoszenie' };
function addRow(box, v = {}) {
  const e = el('div', { className: 'entry' });
  e.innerHTML = `<div class="etop"><span></span><button type="button" class="rm">Usuń</button></div>` + rowT[box]();
  $('.rm', e).onclick = () => { e.remove(); renum(box); refresh(); };
  $('#' + box).append(e);
  Object.entries(v).forEach(([k, val]) => { const i = $(`[data-k="${k}"]`, e); if (i) i.value = val; });
  if (box === 'ads') initAd(e, v.text ? 'paste' : 'link');
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
  [...rows].forEach((e, i) => { $('.etop span', e).textContent = `${label[box]} ${i + 1}`; $('.rm', e).hidden = box === 'ads' && rows.length === 1; });
}
const rows = (box) => $$('#' + box + ' .entry').map((e) => Object.fromEntries($$('[data-k]', e).map((i) => [i.dataset.k, i.value.trim()])));
const pkg = () => $('input[name=pkg]:checked').value;
const nAds = () => Math.max(1, $('#ads').children.length);
const total = () => PRICE[pkg()] + PRICE.extra * (nAds() - 1);

function refresh() {
  $('#total').textContent = total() + ' zł';
  $('#brk').textContent = nAds() > 1 ? `${PRICE[pkg()]} zł + ${nAds() - 1} × ${PRICE.extra} zł` : '';
  $('#addAd').disabled = nAds() >= cfg.maxAds;
}
$$('input[name=pkg]').forEach((r) => (r.onchange = refresh));
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
  if (n === 6) drawSummary();
  $('#werr').textContent = '';
  $('.wiz-body').scrollTop = 0;
}
function drawSummary() {
  const ads = rows('ads');
  $('#sum').replaceChildren(
    el('div', { className: 'sumrow' }, el('span', { textContent: pkg() === 'cv' ? 'CV' : 'CV + list motywacyjny' }), el('span', { textContent: PRICE[pkg()] + ' zł' })),
    ...ads.map((a, i) => el('div', { className: 'sumrow' }, el('span', { textContent: `Ogłoszenie ${i + 1}: ${a.title}` }), el('span', { textContent: i === 0 ? 'w cenie' : '+' + PRICE.extra + ' zł' }))),
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
const openWiz = (p) => {
  if (p) { $(`input[name=pkg][value=${p}]`).checked = true; refresh(); }
  $('#wiz').hidden = false; document.body.style.overflow = 'hidden'; go(step === 7 ? 6 : step);
  setTimeout(() => $('#wizClose').focus(), 0);
};
const closeWiz = () => { $('#wiz').hidden = true; document.body.style.overflow = ''; };
$$('[data-open]').forEach((b) => (b.onclick = () => openWiz(b.dataset.pkg)));
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
    pkg: pkg(), consent: $('#consent').checked && $('#waiver').checked, ads: rows('ads'),
    profile: { ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])), experience: rows('exp'), education: rows('edu') },
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
let data, curAd = 0, curDoc = 'cv', timer;
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
  if (data.status === 'done') { $('#gen').hidden = true; return showResult(); }
  if (data.status === 'paid') { $('#genTitle').textContent = 'Coś poszło nie tak'; $('#genMsg').textContent = data.error || 'Generowanie nie powiodło się. Płatność jest zachowana.'; $('#retry').hidden = false; return; }
  $('#genMsg').textContent = data.status === 'pending' ? 'Czekamy na potwierdzenie płatności…' : 'To zajmie około minuty. Nie zamykaj tej strony. Gotowe dokumenty wyślemy też na Twój e-mail.';
  timer = setTimeout(poll, cfg.demo ? 800 : 2500);
}
$('#retry').onclick = async () => { await fetch(`/api/orders/${orderId}/retry`, { method: 'POST' }); startResult(orderId); };

function section(p, t, ...c) { p.append(el('h3', { textContent: t }), ...c); }
function cvNode(r, on) {
  const c = r.cv, kw = r.keywords || [], p = el('div', { className: 'paper' + ((on ?? $('#hlTog').checked) ? '' : ' nohl') });
  p.append(el('h1', { textContent: c.name }), c.headline && el('div', { className: 'hl', textContent: c.headline }), el('div', { className: 'ct', textContent: (c.contact || []).filter(Boolean).join('  ·  ') }));
  if (c.summary) section(p, 'Profil zawodowy', el('div', {}, hl(c.summary, kw)));
  if (c.experience?.length) { section(p, 'Doświadczenie zawodowe'); c.experience.forEach((e) => p.append(el('div', { className: 'role' }, el('span', { textContent: e.title }), el('em', { textContent: e.period })), el('div', { className: 'co', textContent: e.company }), el('ul', {}, ...(e.bullets || []).map((b) => el('li', {}, hl(b, kw)))))); }
  if (c.education?.length) { section(p, 'Wykształcenie'); c.education.forEach((e) => p.append(el('div', { className: 'role' }, el('span', { textContent: e.school }), el('em', { textContent: e.period })), el('div', { className: 'co', style: 'margin-bottom:8px', textContent: e.degree }))); }
  if (c.skills?.length) section(p, 'Umiejętności', el('div', { className: 'chips' }, ...c.skills.map((s) => el('span', {}, hl(s, kw)))));
  if (c.languages?.length) section(p, 'Języki', el('div', { textContent: c.languages.join(' · ') }));
  if (c.certificates?.length) section(p, 'Certyfikaty i kursy', el('div', { textContent: c.certificates.join(' · ') }));
  if (c.interests) section(p, 'Zainteresowania', el('div', { textContent: c.interests }));
  if (c.clause) p.append(el('div', { className: 'clause', textContent: c.clause }));
  return p;
}
function letterNode(r) {
  const p = el('div', { className: 'paper letter' });
  p.append(el('div', { style: 'text-align:right;margin-bottom:20px', textContent: `${r.cv.contact?.[2] ? r.cv.contact[2] + ', ' : ''}${new Date().toLocaleDateString('pl-PL')}` }), el('div', { style: 'font-weight:600;margin-bottom:20px', textContent: r.cv.name }));
  (r.letter || '').split(/\n\n+/).forEach((x) => p.append(el('p', { textContent: x })));
  return p;
}
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
function showResult() {
  $('#result').hidden = false; window.scrollTo(0, 0);
  const withLetter = data.pkg === 'cv_letter';
  const draw = () => {
    $('#adTabs').replaceChildren(...(data.results.length > 1 ? data.results.map((r, i) => el('button', { type: 'button', textContent: `${i + 1}. ${(r.position || '').slice(0, 32)}`, onclick: () => { curAd = i; draw(); } })) : []));
    $$('#adTabs button').forEach((b, i) => b.setAttribute('aria-selected', i === curAd));
    $('#adTabs').hidden = data.results.length < 2;
    $('#docTabs').replaceChildren(...(withLetter ? [['cv', 'CV'], ['letter', 'List motywacyjny']].map(([k, t]) => el('button', { type: 'button', textContent: t, onclick: () => { curDoc = k; draw(); } })) : []));
    $$('#docTabs button').forEach((b, i) => b.setAttribute('aria-selected', ['cv', 'letter'][i] === curDoc));
    $('#docTabs').hidden = !withLetter;
    const r = data.results[curAd];
    $('#paper').replaceChildren(!withLetter || curDoc === 'cv' ? cvNode(r) : letterNode(r));
    try { document.title = `${curDoc === 'letter' ? 'List' : 'CV'} ${r.cv.name} – ${r.position}`; } catch {}
  };
  drawMail();
  $('#hlTog').onchange = draw;
  $('#print').hidden = !!cfg.noPrint;
  $('#print').onclick = () => window.print();
  draw();
}
$('#newOrder').onclick = () => {
  try { history.replaceState(null, '', location.pathname); } catch {}
  $('#result').hidden = true; landing(true); route();
  $('#wizForm').reset(); ['exp', 'edu', 'ads'].forEach((b) => { $('#' + b).replaceChildren(); addRow(b); }); go(1); window.scrollTo(0, 0);
};

const LEGAL = { '#regulamin': 'legal-regulamin', '#prywatnosc': 'legal-prywatnosc' };
function route() {
  if (!$('#result').hidden || !$('#gen').hidden) return;
  const id = LEGAL[location.hash];
  $('#landing').hidden = !!id;
  Object.values(LEGAL).forEach((l) => ($('#' + l).hidden = l !== id));
  if (id) { window.scrollTo(0, 0); try { document.title = location.hash === '#regulamin' ? 'Regulamin – CV Pod Ogłoszenie' : 'Polityka prywatności – CV Pod Ogłoszenie'; } catch {} }
  else { try { document.title = 'CV Pod Ogłoszenie'; } catch {} const t = location.hash.length > 1 && document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}
window.addEventListener('hashchange', route); route();

addRow('exp'); addRow('edu'); addRow('ads'); refresh(); go(1);
const q = new URLSearchParams(location.search);
if (q.get('id')) startResult(q.get('id'));
})();
