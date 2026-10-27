// Strona /uslugi/oferta-na-zlecenie (D6): podgląd (pierwsze zdanie + rozmyta reszta), zakup oferty albo pakietu 5 ofert, kod z pakietu
// i powrót z płatności (?zamowienie=<id>) z pełną ofertą do skopiowania.
(() => {
  const $ = (s) => document.querySelector(s), f = $('#ofForm'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s, ui = () => window.I18N?.lang || 'pl';
  const say = (el, t, cls = '') => { el.className = `fstatus ${cls}`; el.textContent = t; };
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const st = $('#ofStatus'), pst = $('#ofPayStatus'), buy = $('#ofBuy'), prev = $('#ofPrev'), out = $('#ofOut');
  const PRICE = { offer: '29 zł', offerpack: '99 zł' };
  let previewId = '';

  // Pozycje wyceny: nazwa, cena, jednostka.
  const units = $('#ofUnits').innerHTML;
  const itemRow = () => {
    const r = el('div', 'grt-row ofr-item');
    for (const [k, label, attrs] of [['name', 'Pozycja', { maxLength: 160 }], ['price', 'Cena (zł)', { maxLength: 14, inputMode: 'decimal' }]]) { const l = el('label', 'f', tr(label)), i = el('input'); i.type = 'text'; i.dataset.k = k; Object.assign(i, attrs); l.append(i); r.append(l); }
    const l = el('label', 'f', tr('Jednostka')), s = el('select'); s.dataset.k = 'unit'; s.innerHTML = units; l.append(s); r.append(l);
    const x = el('button', 'btn ghost sm grt-del', '×'); x.type = 'button'; x.setAttribute('aria-label', tr('Usuń')); x.addEventListener('click', () => r.remove()); r.append(x);
    $('#ofItems').append(r);
  };
  Promise.resolve(window.I18N?.ready).catch(() => {}).then(itemRow); // etykiety po wczytaniu słownika
  $('#ofItemAdd').addEventListener('click', itemRow);
  const items = () => [...document.querySelectorAll('#ofItems .grt-row')].map((r) => Object.fromEntries([...r.querySelectorAll('[data-k]')].map((i) => [i.dataset.k, i.value.trim()]))).filter((i) => i.name || i.price);
  $('#ofInv').addEventListener('change', (e) => ($('#ofInvBox').hidden = !e.target.checked));
  const pkg = () => buy.querySelector('input[name=ofPkg]:checked')?.value || 'offer';
  buy.querySelectorAll('input[name=ofPkg]').forEach((r) => r.addEventListener('change', () => ($('#ofPay').textContent = `${tr(pkg() === 'offer' ? 'Kup ofertę' : 'Kup pakiet 5 ofert')} – ${PRICE[pkg()]}`)));

  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#ofGw'); if (gws.length < 2) return;
    gws.forEach((g, i) => {
      const l = document.createElement('label'), r = document.createElement('input'), s = document.createElement('span');
      l.className = 'check'; r.type = 'radio'; r.name = 'ofGw'; r.value = g.id; r.checked = !i;
      s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ')}`;
      l.append(r, s); box.append(l);
    });
  }).catch(() => {});

  // Podgląd: pierwsze zdanie i wycena czytelne, reszta to rozmyte paski (treści oferty nie ma w przeglądarce).
  const blur = (n) => { const b = el('div', 'ofr-blur'); for (let i = 0; i < n; i++) b.append(el('span')); return b; };
  const showPreview = (j) => {
    const box = el('div', 'ofr-card'); box.append(el('span', 'ofr-mark', tr('PODGLĄD')), el('h2', '', tr('Krótka odpowiedź')), el('p', '', j.start), blur(Math.max(2, Math.round(j.shortLen / 120))));
    box.append(el('h2', '', tr('Dłuższa oferta')), blur(Math.max(4, Math.round(j.longLen / 120))));
    const q = el('div'); q.append(el('h2', '', tr('Wycena')));
    if (j.quote.lines.length) { const ul = el('ul', 'tips'); j.quote.lines.forEach((l) => ul.append(el('li', '', l))); q.append(ul); if (j.quote.total != null) q.append(el('p', '', `${tr('Razem')}: ${j.quote.total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`)); }
    else q.append(el('p', 'hint', tr('Bez cen – oferta mówi, że wycenę podasz po doprecyzowaniu.')));
    q.append(el('p', 'hint', `${tr('W zakresie')}: ${j.scope} · ${tr('Pytania do klienta')}: ${j.questions}`));
    box.append(q); prev.replaceChildren(box); prev.hidden = false;
    previewId = j.id; buy.hidden = false; prev.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ($('#ofJob').value.trim().length < 50) return say(st, tr('Wklej treść zlecenia (co najmniej jedno–dwa zdania).'), 'bad');
    if ($('#ofTrade').value.trim().length < 3) return say(st, tr('Wpisz, czym się zajmujesz (np. hydraulik, grafik, tłumacz).'), 'bad');
    $('#ofGo').disabled = true; buy.hidden = true; prev.hidden = true; out.hidden = true; say(st, tr('Piszemy ofertę… To trwa zwykle do minuty.'));
    try {
      const body = { job: $('#ofJob').value, trade: $('#ofTrade').value, platform: $('#ofPlatform').value, about: $('#ofAbout').value, area: $('#ofArea').value, term: $('#ofTerm').value, name: $('#ofName').value, contact: $('#ofContact').value, warranty: $('#ofWarranty').value, tone: $('#ofTone').value, items: items() };
      let r = await fetch('/api/offer/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), j = await r.json();
      for (let i = 0; r.ok && j.pending && i < 40; i++) { await wait(3000); r = await fetch(`/api/offer/${j.id}`); j = await r.json(); }
      if (!r.ok || !j.start) throw new Error(j.error || tr('Przygotowanie trwa dłużej niż zwykle. Spróbuj za chwilę.'));
      say(st, ''); showPreview(j);
    } catch (x) { say(st, x.message, 'bad'); }
    $('#ofGo').disabled = false;
  });

  // Pełna oferta: sekcje z przyciskiem „Kopiuj” i pobranie .txt.
  const copyBtn = (text) => { const b = el('button', 'btn ghost sm', tr('Kopiuj')); b.type = 'button'; b.addEventListener('click', () => navigator.clipboard?.writeText(text).then(() => { b.textContent = tr('Skopiowano'); setTimeout(() => (b.textContent = tr('Kopiuj')), 1500); }).catch(() => {})); return b; };
  const block = (title, text, nodes) => { const s = el('section', 'ofr-sec'), h = el('div', 'ofr-head'); h.append(el('h2', '', tr(title)), copyBtn(text)); s.append(h, ...nodes); return s; };
  const paras = (t) => t.split(/\n{2,}/).map((p) => el('p', '', p));
  const showOffer = (o, text) => {
    const q = o.quote, qText = [...(q.lines.length ? q.lines.map((l) => `- ${l}`) : ['- cena po doprecyzowaniu zlecenia']), ...(q.total != null ? [`Razem: ${q.total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`] : []), ...(o.scope.length ? ['', 'W zakresie:', ...o.scope.map((s) => `- ${s}`)] : [])].join('\n');
    const short = el('p', 'ofr-short', o.short), cnt = el('p', 'hint', `${o.short.length} ${tr('znaków')}`);
    const qList = el('ul', 'tips'); (q.lines.length ? q.lines : [tr('cena po doprecyzowaniu zlecenia')]).forEach((l) => qList.append(el('li', '', l)));
    const sc = el('ul'); o.scope.forEach((x) => sc.append(el('li', '', x)));
    const scope = o.scope.length ? [el('p', '', `${tr('W zakresie')}:`), sc] : [];
    const qs = el('ol', 'tips'); o.questions.forEach((x) => qs.append(el('li', '', x)));
    const dl = el('a', 'btn sm', tr('Pobierz całość (.txt)')); dl.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); dl.download = 'oferta.txt';
    out.replaceChildren(el('p', 'hint', tr('Przeczytaj ofertę przed wysłaniem i uzupełnij miejsca oznaczone [UZUPEŁNIJ: …].')), block('Krótka odpowiedź', o.short, [short, cnt]), block('Dłuższa oferta', o.long, paras(o.long)), block('Wycena', qText, [qList, ...(q.total != null ? [el('p', '', `${tr('Razem')}: ${q.total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`)] : []), ...scope]), block('Pytania do klienta', o.questions.map((x, i) => `${i + 1}. ${x}`).join('\n'), [qs]), dl);
    out.hidden = false; prev.hidden = true; out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Kod z pakietu: pełna oferta bez płatności.
  $('#ofCodeGo').addEventListener('click', async () => {
    const cs = $('#ofCodeStatus'), code = $('#ofCode').value.trim(); if (!code) return say(cs, tr('Wpisz kod.'), 'bad');
    const r = await fetch('/api/offer/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: previewId, code }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) return say(cs, j.error || tr('Nie udało się użyć kodu.'), 'bad');
    say(cs, `${tr('Kod przyjęty. Zostało ofert')}: ${j.usesLeft}`, 'good'); showOffer(j.offer, j.text);
  });

  async function paid(id) {
    buy.hidden = false; f.hidden = true; $('#ofCodeBox').hidden = true; say(pst, tr('Czekamy na potwierdzenie płatności…')); $('#kup')?.scrollIntoView();
    for (let i = 0; i < 60; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') {
        pst.className = 'fstatus good'; pst.textContent = '';
        pst.append(el('b', '', j.product === 'offerpack' ? tr('Gotowe. Twój kod na 5 ofert:') : tr('Gotowe. Twoja oferta jest poniżej.')));
        if (j.code) { const k = el('p', 'ofr-code', j.code); pst.append(k, `${tr('Zostało ofert')}: ${j.usesLeft} · ${tr('ważny do')} ${new Date(j.expires).toLocaleDateString('pl-PL')}`); }
        pst.append(document.createElement('br'), j.mailed ? tr('Wysłaliśmy to też na e-mail.') : tr('Zapisz ofertę u siebie – strona zamówienia działa 30 dni.'));
        buy.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
        if (j.offer) showOffer(j.offer, j.text);
        return;
      }
      if (j.error) return say(pst, j.error, 'bad');
      await wait(2500);
    }
    say(pst, tr('Płatność jeszcze się potwierdza. Ofertę wyślemy na e-mail, gdy będzie gotowa.'));
  }
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  buy.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('#ofTerms').checked || !$('#ofWaiver').checked) return say(pst, tr('Zaznacz obie zgody, żeby kupić ofertę.'), 'bad');
    $('#ofPay').disabled = true; say(pst, tr('Otwieram płatność…'));
    try {
      const gw = buy.querySelector('input[name=ofGw]:checked')?.value;
      const body = { id: previewId, testCode: new URLSearchParams(location.search).get('kod') || undefined, email: $('#ofEmail').value, terms: true, waiver: true, gateway: gw, uiLang: ui(), ...($('#ofInv').checked ? { invoice: { name: $('#ofInvName').value, address: $('#ofInvAddr').value, nip: $('#ofInvNip').value } } : {}) };
      const r = await fetch(`/api/products/${pkg()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.free) { $('#ofPay').disabled = false; return paid(j.id); } // kod testowy właściciela: bez płatności
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); $('#ofPay').disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(pst, x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); $('#ofPay').disabled = false; }
  });
})();
