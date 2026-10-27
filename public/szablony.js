// Strona /szablony-premium (D2): zakup paczki szablonów (zgody, faktura, bramka płatności) i powrót z płatności (?zamowienie=<id>).
(() => {
  const $ = (s) => document.querySelector(s), f = $('#premForm'); if (!f) return;
  const st = $('#premStatus'), btn = $('#premBuy'), tr = (s) => window.I18N?.t?.(s) ?? s;
  const say = (t, cls = '') => { st.className = `fstatus ${cls}`; st.textContent = t; };
  $('#premInv').addEventListener('change', (e) => ($('#premInvBox').hidden = !e.target.checked));
  // Bramki płatności z /api/config (jak w kreatorze): Stripe (BLIK, karta, portfele) i/lub Przelewy24.
  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#premGw');
    if (gws.length < 2) return;
    gws.forEach((g, i) => {
      const l = document.createElement('label'), r = document.createElement('input'), s = document.createElement('span');
      l.className = 'check'; r.type = 'radio'; r.name = 'premGw'; r.value = g.id; r.checked = !i;
      s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ')}`;
      l.append(r, s); box.append(l);
    });
  }).catch(() => {});
  const gateway = () => f.querySelector('input[name=premGw]:checked')?.value || undefined;

  async function paid(id) {
    say(tr('Czekamy na potwierdzenie płatności…')); $('#kup')?.scrollIntoView();
    for (let i = 0; i < 60; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') {
        st.className = 'fstatus good'; st.textContent = '';
        const a = document.createElement('a'); a.href = `/api/products/${encodeURIComponent(id)}/${j.files[0]}`; a.download = j.files[0]; a.className = 'btn'; a.textContent = tr('Pobierz szablony (ZIP)');
        const b = document.createElement('b'); b.textContent = tr('Gotowe. Dziękujemy za zakup.');
        st.append(b, document.createElement('br'), a, document.createElement('br'), j.mailed ? tr('Paczkę wysłaliśmy też na e-mail.') : tr('Link do pobrania działa 30 dni – zapisz pliki u siebie.'));
        f.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
        return;
      }
      if (j.error) return say(j.error, 'bad');
      await new Promise((ok) => setTimeout(ok, 2500));
    }
    say(tr('Płatność jeszcze się potwierdza. Paczkę wyślemy na e-mail, gdy płatność dotrze.'));
  }
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('#premTerms').checked || !$('#premWaiver').checked) return say(tr('Zaznacz obie zgody, żeby kupić szablony.'), 'bad');
    btn.disabled = true; say(tr('Otwieram płatność…'));
    try {
      const body = { email: $('#premEmail').value, terms: true, waiver: true, gateway: gateway(), uiLang: window.I18N?.lang || 'pl', ...($('#premInv').checked ? { invoice: { name: $('#premInvName').value, address: $('#premInvAddr').value, nip: $('#premInvNip').value } } : {}) };
      const r = await fetch('/api/products/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); btn.disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); btn.disabled = false; }
  });
})();
