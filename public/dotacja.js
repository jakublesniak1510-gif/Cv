// Strona /uslugi/dotacja-z-urzedu-pracy (D5): kreator w 6 krokach, podgląd (rozmyta strona 1 i rozdziały), zakup i powrót z płatności
// (?zamowienie=<id>) z plikami i poprawkami (3 w cenie).
(() => {
  const $ = (s) => document.querySelector(s), f = $('#grForm'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s, ui = () => window.I18N?.lang || 'pl', narrow = () => innerWidth < 700;
  const say = (el, t, cls = '') => { el.className = `fstatus ${cls}`; el.textContent = t; };
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const st = $('#grStatus'), pst = $('#grPayStatus'), buy = $('#grBuy'), steps = [...f.querySelectorAll('.grt-step')];
  const PRICE = { plan: '349 zł', full: '549 zł' };
  const variant = () => f.querySelector('input[name=grVar]:checked')?.value || 'plan';
  let step = 0, previewId = '', formText = '';

  // Wiersze wydatków i kosztów.
  const row = (box, fields) => {
    const r = el('div', 'grt-row');
    for (const [k, label, attrs] of fields) { const l = el('label', 'f', tr(label)), i = el('input'); i.type = 'text'; i.dataset.k = k; Object.assign(i, attrs || {}); l.append(i); r.append(l); }
    const x = el('button', 'btn ghost sm grt-del', '×'); x.type = 'button'; x.setAttribute('aria-label', tr('Usuń')); x.addEventListener('click', () => r.remove()); r.append(x);
    box.append(r);
  };
  const expRow = () => row($('#grExp'), [['item', 'Wydatek', { maxLength: 200 }], ['amount', 'Kwota (zł)', { maxLength: 14, inputMode: 'decimal' }], ['why', 'Do czego jest potrzebny', { maxLength: 500 }]]);
  const costRow = () => row($('#grCost'), [['name', 'Koszt', { maxLength: 120 }], ['monthly', 'Miesięcznie (zł)', { maxLength: 14, inputMode: 'decimal' }]]);
  Promise.resolve(window.I18N?.ready).catch(() => {}).then(() => { expRow(); costRow(); }); // etykiety wierszy po wczytaniu słownika
  $('#grExpAdd').addEventListener('click', expRow); $('#grCostAdd').addEventListener('click', costRow);
  const rows = (box) => [...$(box).querySelectorAll('.grt-row')].map((r) => Object.fromEntries([...r.querySelectorAll('input')].map((i) => [i.dataset.k, i.value.trim()])));
  $('#grMonths').addEventListener('change', () => ($('#grRevCBox').hidden = $('#grMonths').value !== '24'));
  f.querySelectorAll('input[name=grVar]').forEach((r) => r.addEventListener('change', () => { $('#grFormReq').hidden = variant() !== 'full'; }));

  // Pliki: tekst odczytuje serwer (/api/grant/extract) i wraca do przeglądarki.
  const fileB64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error(tr('Nie udało się wczytać pliku.'))); r.readAsDataURL(file); });
  const extract = async (file) => {
    if (file.size > 5 * 1024 * 1024) throw new Error(tr('Plik musi mieć do 5 MB.'));
    const r = await fetch('/api/grant/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: await fileB64(file) }) }), j = await r.json();
    if (!r.ok) throw new Error(j.error); return j.text;
  };
  $('#grCvFile').addEventListener('change', async (e) => { const file = e.target.files[0]; if (!file) return; say(st, tr('Czytamy CV…')); try { $('#grCv').value = await extract(file); say(st, tr('CV wczytane. Sprawdź treść w polu poniżej.'), 'good'); } catch (x) { say(st, x.message, 'bad'); } });
  $('#grFormFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return; $('#grFormInfo').textContent = tr('Czytamy wzór wniosku…');
    try { formText = await extract(file); $('#grFormInfo').textContent = `${tr('Wzór wczytany')}: ${file.name}`; } catch (x) { formText = ''; $('#grFormInfo').textContent = x.message; }
  });

  // Kroki: proste sprawdzenie wymaganych pól (resztę sprawdza serwer).
  const need = [
    () => (!$('#grVoiv').value || $('#grPup').value.trim().length < 5 ? 'Wybierz województwo i wpisz nazwę urzędu pracy.' : ''),
    () => ($('#grName').value.trim().length < 3 ? 'Podaj imię i nazwisko.' : ''),
    () => ($('#grIdea').value.trim().length < 80 ? 'Opisz pomysł na firmę (co najmniej kilka zdań).' : !/^\d{2}\.\d{2}\.[A-Za-z]$/.test($('#grPkd').value.split(/[,;\s]+/)[0] || '') ? 'Podaj kod PKD w formacie 00.00.Z.' : $('#grPlace').value.trim().length < 2 ? 'Podaj miejsce prowadzenia działalności.' : ''),
    () => (!rows('#grExp').some((e) => e.item && e.amount) ? 'Dodaj co najmniej jeden wydatek z kwotą.' : ''),
    () => '',
    () => (variant() === 'full' && formText.length < 200 ? 'Wgraj wzór wniosku z Twojego urzędu pracy (PDF albo Word) – wypełnimy jego pola.' : ''),
  ];
  const show = (n) => {
    step = n; steps.forEach((s, i) => (s.hidden = i !== n));
    document.querySelectorAll('.grt-steps span').forEach((s, i) => s.classList.toggle('on', i === n));
    $('#grBack').hidden = n === 0; $('#grNext').hidden = n === steps.length - 1; $('#grGo').hidden = n !== steps.length - 1;
    say(st, ''); steps[n].querySelector('input,select,textarea')?.focus({ preventScroll: true });
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#grNext').addEventListener('click', () => { const e = need[step](); if (e) return say(st, tr(e), 'bad'); show(step + 1); });
  $('#grBack').addEventListener('click', () => show(step - 1));
  show(0);

  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#grGw'); if (gws.length < 2) return;
    gws.forEach((g, i) => {
      const l = document.createElement('label'), r = document.createElement('input'), s = document.createElement('span');
      l.className = 'check'; r.type = 'radio'; r.name = 'grGw'; r.value = g.id; r.checked = !i;
      s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ')}`;
      l.append(r, s); box.append(l);
    });
  }).catch(() => {});
  $('#grInv').addEventListener('change', (e) => ($('#grInvBox').hidden = !e.target.checked));

  const data = () => ({ variant: variant(), voiv: $('#grVoiv').value, pup: $('#grPup').value, name: $('#grName').value, city: $('#grCity').value, cvText: $('#grCv').value, extra: $('#grExtra').value,
    idea: $('#grIdea').value, pkd: $('#grPkd').value, bizName: $('#grBiz').value, place: $('#grPlace').value, form: $('#grForm2').value, start: $('#grStart').value,
    customers: $('#grCust').value, competition: $('#grComp').value, marketing: $('#grMkt').value,
    expenses: rows('#grExp').filter((e) => e.item || e.amount), requested: $('#grReq').value, own: $('#grOwn').value,
    months: $('#grMonths').value, revenue: { a: $('#grRevA').value, b: $('#grRevB').value, c: $('#grRevC').value }, costs: rows('#grCost').filter((c) => c.name || c.monthly), formText, narrow: narrow() });
  const preview = (j) => {
    const img = el('img'); img.src = j.image; img.alt = tr('Podgląd pierwszej strony biznesplanu'); img.draggable = false;
    $('#grImg').replaceChildren(img);
    const toc = [el('h2', '', tr('Rozdziały biznesplanu')), el('ol', 'grt-toc')];
    j.sections.forEach((s) => toc[1].append(el('li', '', s)));
    if (j.fields?.length) { const ul = el('ul', 'grt-fields'); j.fields.forEach((x) => ul.append(el('li', '', x))); toc.push(el('h2', '', tr('Pola wniosku, które wypełniliśmy')), ul); }
    $('#grToc').replaceChildren(...toc); $('#grPrev').hidden = false;
    previewId = j.id; $('#grPrice').textContent = PRICE[j.variant]; $('#grPay').textContent = `${tr('Kup dokumenty')} – ${PRICE[j.variant]}`; buy.hidden = false;
    $('#grPrev').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (let i = 0; i < need.length; i++) { const m = need[i](); if (m) { show(i); return say(st, tr(m), 'bad'); } }
    $('#grGo').disabled = true; buy.hidden = true; $('#grPrev').hidden = true; say(st, tr('Przygotowujemy dokumenty… To trwa zwykle 1–3 minuty. Nie zamykaj strony.'));
    try {
      let r = await fetch('/api/grant/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data()) }), j = await r.json();
      for (let i = 0; r.ok && j.pending && i < 80; i++) { await wait(3000); r = await fetch(`/api/grant/${j.id}?narrow=${narrow() ? 1 : 0}`); j = await r.json(); }
      if (!r.ok || !j.image) throw new Error(j.error || tr('Przygotowanie trwa dłużej niż zwykle. Spróbuj za chwilę.'));
      say(st, ''); preview(j);
    } catch (x) { say(st, x.message, 'bad'); }
    $('#grGo').disabled = false;
  });

  // Po płatności: pliki, poprawki (stan z /api/products/:id).
  const FILES = { 'biznesplan.pdf': 'Biznesplan (PDF)', 'biznesplan.docx': 'Biznesplan (Word)', 'wniosek-pola.docx': 'Pola wniosku (Word)' };
  let orderId = '';
  const render = (j) => {
    pst.className = 'fstatus good'; pst.textContent = '';
    pst.append(el('b', '', tr('Gotowe. Pobierz dokumenty:')), document.createElement('br'));
    for (const k of j.files) { const a = el('a', 'btn sm', tr(FILES[k] || k)); a.href = `/api/products/${encodeURIComponent(orderId)}/${k}`; pst.append(a, ' '); }
    pst.append(document.createElement('br'), j.mailed ? tr('Dokumenty wysłaliśmy też na e-mail.') : tr('Link do pobrania działa 30 dni – zapisz pliki u siebie.'));
    buy.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
    $('#grDone').hidden = false; $('#grRevLeft').textContent = j.revisionsLeft;
    $('#grRevGo').disabled = j.revising || j.revisionsLeft < 1; $('#grRevNote').disabled = j.revisionsLeft < 1;
    const rs = $('#grRevStatus');
    if (j.revising) say(rs, tr('Przygotowujemy poprawioną wersję… To trwa zwykle 1–3 minuty.'));
    else if (j.revError) say(rs, tr(j.revError), 'bad');
    else if (j.revisionsLeft < 1) say(rs, tr('Wykorzystano wszystkie poprawki w cenie.'));
  };
  const poll = async (until) => {
    for (let i = 0; i < 120; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(orderId)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') { render(j); if (until(j)) return j; }
      else if (j.error) return say(pst, j.error, 'bad');
      await wait(3000);
    }
    say(pst, tr('Płatność jeszcze się potwierdza. Dokumenty wyślemy na e-mail, gdy będą gotowe.'));
  };
  async function paid(id) {
    orderId = id; buy.hidden = false; f.hidden = true; say(pst, tr('Czekamy na potwierdzenie płatności…')); $('#kup')?.scrollIntoView();
    await poll((j) => !j.revising);
  }
  $('#grRevGo').addEventListener('click', async () => {
    const note = $('#grRevNote').value.trim(), rs = $('#grRevStatus');
    if (note.length < 10) return say(rs, tr('Napisz, co poprawić (co najmniej jedno zdanie).'), 'bad');
    $('#grRevGo').disabled = true;
    const r = await fetch(`/api/products/${encodeURIComponent(orderId)}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) { $('#grRevGo').disabled = false; return say(rs, j.error || tr('Nie udało się wysłać prośby.'), 'bad'); }
    $('#grRevNote').value = ''; say(rs, tr('Przygotowujemy poprawioną wersję… To trwa zwykle 1–3 minuty.'));
    const done = await poll((x) => !x.revising);
    if (done && !done.revError) say(rs, tr('Poprawiona wersja jest gotowa – pobierz pliki powyżej. Wysłaliśmy ją też e-mailem.'), 'good');
  });
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  buy.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('#grTerms').checked || !$('#grWaiver').checked || !$('#grNoGuar').checked) return say(pst, tr('Zaznacz wszystkie trzy zgody, żeby kupić dokumenty.'), 'bad');
    $('#grPay').disabled = true; say(pst, tr('Otwieram płatność…'));
    try {
      const gw = buy.querySelector('input[name=grGw]:checked')?.value;
      const body = { id: previewId, email: $('#grEmail').value, terms: true, waiver: true, noGuarantee: true, gateway: gw, uiLang: ui(), ...($('#grInv').checked ? { invoice: { name: $('#grInvName').value, address: $('#grInvAddr').value, nip: $('#grInvNip').value } } : {}) };
      const r = await fetch('/api/products/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); $('#grPay').disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(pst, x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); $('#grPay').disabled = false; }
  });
})();
