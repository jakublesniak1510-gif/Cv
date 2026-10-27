// Strona /tlumaczenie-cv (D3): podgląd tłumaczenia (obrazek strony 1, jak C1), zakup i powrót z płatności (?zamowienie=<id>).
(() => {
  const $ = (s) => document.querySelector(s), f = $('#trForm'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s, ui = () => window.I18N?.lang || 'pl', narrow = () => innerWidth < 700;
  const say = (el, t, cls = '') => { el.className = `fstatus ${cls}`; el.textContent = t; };
  const st = $('#trStatus'), pst = $('#trPayStatus'), buy = $('#trBuy');
  const BETA = ['fr', 'nl', 'no', 'cs', 'it', 'es'];
  let previewId = '';
  $('#trLang').addEventListener('change', () => ($('#trBetaNote').hidden = !BETA.includes($('#trLang').value)));
  $('#trInv').addEventListener('change', (e) => ($('#trInvBox').hidden = !e.target.checked));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const fileB64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error(tr('Nie udało się wczytać pliku.'))); r.readAsDataURL(file); });
  // Bramki płatności z /api/config (jak w kreatorze).
  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#trGw'); if (gws.length < 2) return;
    gws.forEach((g, i) => {
      const l = document.createElement('label'), r = document.createElement('input'), s = document.createElement('span');
      l.className = 'check'; r.type = 'radio'; r.name = 'trGw'; r.value = g.id; r.checked = !i;
      s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ')}`;
      l.append(r, s); box.append(l);
    });
  }).catch(() => {});
  const show = (j) => {
    const img = document.createElement('img'); img.src = j.image; img.alt = tr('Podgląd pierwszej strony przetłumaczonego CV'); img.draggable = false;
    $('#trImg').replaceChildren(img); previewId = j.id; buy.hidden = false; say(st, '');
    buy.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = $('#trFile').files[0], text = $('#trText').value.trim();
    if (!file && text.length < 60) return say(st, tr('Wgraj CV albo wklej jego treść.'), 'bad');
    if (file && file.size > 5 * 1024 * 1024) return say(st, tr('Plik musi mieć do 5 MB.'), 'bad');
    $('#trGo').disabled = true; buy.hidden = true; $('#trImg').replaceChildren(); say(st, tr('Tłumaczymy CV… To trwa zwykle do minuty.'));
    try {
      const body = { lang: $('#trLang').value, tpl: $('#trTpl').value, narrow: narrow(), ui: ui(), ...(file ? { data: await fileB64(file) } : { text }) };
      let r = await fetch('/api/translate/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), j = await r.json();
      for (let i = 0; r.ok && j.pending && i < 40; i++) { await wait(3000); r = await fetch(`/api/translate/${j.id}?narrow=${narrow() ? 1 : 0}&ui=${ui()}`); j = await r.json(); }
      if (!r.ok || !j.image) throw new Error(j.error || tr('Tłumaczenie trwa dłużej niż zwykle. Spróbuj za chwilę.'));
      show(j);
    } catch (x) { say(st, x.message, 'bad'); }
    $('#trGo').disabled = false;
  });

  async function paid(id) {
    buy.hidden = false; f.hidden = true; say(pst, tr('Czekamy na potwierdzenie płatności…')); $('#kup')?.scrollIntoView();
    for (let i = 0; i < 60; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') {
        pst.className = 'fstatus good'; pst.textContent = '';
        const b = document.createElement('b'); b.textContent = tr('Gotowe. Pobierz przetłumaczone CV:'); pst.append(b, document.createElement('br'));
        for (const [k, t] of [['cv.pdf', 'PDF'], ['cv.docx', 'Word (DOCX)']]) { const a = document.createElement('a'); a.href = `/api/products/${encodeURIComponent(id)}/${k}`; a.className = 'btn sm'; a.textContent = t; pst.append(a, ' '); }
        pst.append(document.createElement('br'), j.mailed ? tr('Pliki wysłaliśmy też na e-mail.') : tr('Link do pobrania działa 30 dni – zapisz pliki u siebie.'));
        buy.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
        return;
      }
      if (j.error) return say(pst, j.error, 'bad');
      await wait(2500);
    }
    say(pst, tr('Płatność jeszcze się potwierdza. Pliki wyślemy na e-mail, gdy będą gotowe.'));
  }
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  buy.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('#trTerms').checked || !$('#trWaiver').checked) return say(pst, tr('Zaznacz obie zgody, żeby kupić tłumaczenie.'), 'bad');
    $('#trPay').disabled = true; say(pst, tr('Otwieram płatność…'));
    try {
      const gw = buy.querySelector('input[name=trGw]:checked')?.value;
      const body = { id: previewId, email: $('#trEmail').value, terms: true, waiver: true, gateway: gw, uiLang: ui(), ...($('#trInv').checked ? { invoice: { name: $('#trInvName').value, address: $('#trInvAddr').value, nip: $('#trInvNip').value } } : {}) };
      const r = await fetch('/api/products/translation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); $('#trPay').disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(pst, x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); $('#trPay').disabled = false; }
  });
})();
