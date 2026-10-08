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

/* ---------- Przykład dopasowania (strona główna) ---------- */
const EX = [
  { tab: 'Kasjer / Sprzedawca', title: 'Kasjer / Sprzedawca', ad: 'Szukamy osoby do obsługi klienta i obsługi kasy fiskalnej w supermarkecie. Wymagamy komunikatywności, uczciwości i gotowości do pracy zmianowej.',
    kws: ['obsługi klienta', 'obsługa klienta', 'kasa fiskalna', 'obsługa kasy', 'komunikatywności', 'komunikatywność', 'pracy zmianowej', 'praca zmianowa'],
    sub: 'Kasjer / Sprzedawca', sum: 'Aplikuję na stanowisko kasjera. Mam ponad 2 lata praktyki w obsłudze klienta i kasy w sklepie, jestem komunikatywna i pracuję zmianowo.',
    skills: ['obsługa klienta', 'obsługa kasy fiskalnej', 'komunikatywność', 'praca zmianowa', 'inwentaryzacja', 'Excel'],
    bullets: ['Obsługa kasy fiskalnej i rozliczanie zmiany', 'Obsługa klienta, rozwiązywanie reklamacji przy kasie', 'Praca zmianowa w zespole 8 osób'] },
  { tab: 'Specjalista ds. obsługi klienta', title: 'Specjalista ds. obsługi klienta', ad: 'Do biura obsługi poszukujemy specjalisty. Zakres: obsługa zgłoszeń, rozwiązywanie reklamacji, praca w systemie CRM. Wymagamy znajomości angielskiego.',
    kws: ['obsługa zgłoszeń', 'obsługi zgłoszeń', 'reklamacji', 'CRM', 'angielskiego', 'angielski'],
    sub: 'Specjalista ds. obsługi klienta', sum: 'Aplikuję na stanowisko specjalisty ds. obsługi klienta. Na co dzień prowadzę zgłoszenia i reklamacje w systemie CRM, komunikuję się po angielsku.',
    skills: ['CRM', 'rozwiązywanie reklamacji', 'obsługa zgłoszeń', 'angielski B2', 'Excel', 'praca zmianowa'],
    bullets: ['Obsługa 40–50 zgłoszeń dziennie w systemie CRM', 'Rozwiązywanie reklamacji klientów', 'Kontakt z klientami zagranicznymi po angielsku'] },
];
function drawEx(i) {
  const e = EX[i];
  $$('#exTabs button').forEach((b, j) => b.setAttribute('aria-selected', j === i));
  $('#exAd').replaceChildren(el('div', { className: 'tagline', textContent: 'Ogłoszenie' }), el('h4', { textContent: e.title }), el('p', {}, hl(e.ad, e.kws)));
  $('#exCv').replaceChildren(el('div', { className: 'tagline', textContent: 'CV Anny Nowak pod to ogłoszenie' }), el('h4', { textContent: 'Anna Nowak' }), el('div', { className: 'sub', textContent: e.sub }),
    el('p', {}, hl(e.sum, e.kws)), el('p', { className: 'h', textContent: 'Umiejętności' }), el('p', {}, hl(e.skills.join(' · '), e.kws)),
    el('p', { className: 'h', textContent: 'Doświadczenie, najważniejsze na górze' }), ...e.bullets.map((b) => el('p', {}, '• ', hl(b, e.kws))));
}
EX.forEach((e, i) => $('#exTabs').append(el('button', { type: 'button', role: 'tab', textContent: e.tab, onclick: () => drawEx(i) })));
drawEx(0);

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
  $('#genMsg').textContent = data.status === 'pending' ? 'Czekamy na potwierdzenie płatności…' : 'To zajmie około minuty. Nie zamykaj tej strony.';
  timer = setTimeout(poll, cfg.demo ? 800 : 2500);
}
$('#retry').onclick = async () => { await fetch(`/api/orders/${orderId}/retry`, { method: 'POST' }); startResult(orderId); };

function section(p, t, ...c) { p.append(el('h3', { textContent: t }), ...c); }
function cvNode(r) {
  const c = r.cv, kw = r.keywords || [], p = el('div', { className: 'paper' + ($('#hlTog').checked ? '' : ' nohl') });
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
