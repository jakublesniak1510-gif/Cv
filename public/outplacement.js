// Strona /dla-firm/outplacement (D7): zamówienie kodów dla pracowników – cena za osobę z progów (data-tiers) i suma na bieżąco.
(() => {
  const f = document.getElementById('outOrder'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s;
  const tiers = JSON.parse(f.dataset.tiers), sum = document.getElementById('outSum'), st = f.querySelector('.fstatus'), btn = f.querySelector('button[type=submit]');
  const fmt = (gr) => `${(gr / 100).toLocaleString('pl-PL')} zł`;
  const draw = () => {
    const qty = parseInt(f.qty.value, 10) || 0, t = [...tiers].reverse().find((x) => qty >= x.min);
    if (!t || qty > Number(f.qty.max)) { sum.textContent = `${tr('Liczba osób')}: 1–${f.qty.max}.`; return; }
    sum.textContent = ''; const b = document.createElement('b'); b.textContent = fmt(t.unit * qty);
    sum.append(`${qty} × ${fmt(t.unit)} = `, b, ` (${tr('bez VAT, zwolnienie podmiotowe')})`);
  };
  f.addEventListener('input', draw); draw();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = [...f.querySelectorAll('[required]')].find((x) => (x.type === 'checkbox' ? !x.checked : !x.value.trim()));
    if (bad) { st.className = 'fstatus err'; st.textContent = tr('Uzupełnij wymagane pola i zaznacz akceptację regulaminu.'); bad.focus(); return; }
    btn.disabled = true; st.className = 'fstatus'; st.textContent = tr('Chwileczkę…');
    const body = Object.fromEntries(new FormData(f)); body.terms = f.terms.checked; body.qty = Number(body.qty);
    try {
      const r = await fetch('/api/outplacement/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || tr('Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.'));
      location.href = j.url || j.redirect;
    } catch (x) { st.className = 'fstatus err'; st.textContent = x.message; btn.disabled = false; }
  });
})();
