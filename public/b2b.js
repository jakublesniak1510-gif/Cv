// Formularze stron B2B (zamówienie paczki kodów, zgłoszenie partnera, numer rachunku w raporcie partnera).
(() => {
  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) throw new Error(j.error || 'Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.');
    return j;
  };
  const data = (f) => { const o = Object.fromEntries(new FormData(f)); f.querySelectorAll('input[type=checkbox]').forEach((c) => (o[c.name] = c.checked)); return o; };
  const wire = (f, url, onOk) => f && f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = f.querySelector('.fstatus'), btn = f.querySelector('button[type=submit]');
    const bad = [...f.querySelectorAll('[required]')].find((x) => (x.type === 'checkbox' ? !x.checked : !x.value.trim()));
    if (bad) { st.className = 'fstatus err'; st.textContent = 'Uzupełnij wymagane pola i zaznacz akceptację regulaminu.'; bad.focus(); return; }
    btn.disabled = true; st.className = 'fstatus'; st.textContent = 'Chwileczkę…';
    try { await onOk(await post(url, data(f)), st); } catch (x) { st.className = 'fstatus err'; st.textContent = x.message; btn.disabled = false; }
  });

  // Zamówienie paczki kodów: cena za kod i suma liczone na bieżąco z progów przekazanych przez serwer.
  const order = document.getElementById('b2bOrder');
  if (order) {
    const prices = JSON.parse(order.dataset.prices), sum = document.getElementById('b2bSum'), fmt = (v) => v.toLocaleString('pl-PL') + ' zł';
    const draw = () => {
      const pkg = order.pkg.value, qty = parseInt(order.qty.value, 10) || 0, tier = [...prices[pkg]].reverse().find((t) => qty >= t.min);
      if (!tier || qty > Number(order.qty.max)) { sum.textContent = `Liczba kodów: od ${order.qty.min} do ${order.qty.max}.`; return; }
      sum.innerHTML = '';
      const b = document.createElement('b'); b.textContent = fmt(tier.unit * qty);
      sum.append(`${qty} × ${fmt(tier.unit)} = `, b, ' (bez VAT, zwolnienie podmiotowe)');
    };
    order.addEventListener('input', draw); draw();
    wire(order, '/api/b2b/order', (j) => { location.href = j.url || j.redirect; });
  }
  wire(document.getElementById('partnerForm'), '/api/b2b/partner', (_j, st) => {
    const f = document.getElementById('partnerForm'); f.reset();
    st.className = 'fstatus ok'; st.textContent = 'Dziękujemy! Zgłoszenie dotarło. Odpowiemy e-mailem, zwykle w ciągu 2 dni roboczych.';
    f.querySelector('button[type=submit]').disabled = false;
  });
  const bank = document.getElementById('bankForm');
  wire(bank, bank ? `/api/b2b/report/${bank.dataset.token}/bank` : '', (_j, st) => { st.className = 'fstatus ok'; st.textContent = 'Zapisano.'; bank.querySelector('button[type=submit]').disabled = false; });
})();
