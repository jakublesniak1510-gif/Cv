// Strona /karnety: wybór karnetu z kart (#kup-<rodzaj>) i zakup – zgody, opcjonalna faktura, przejście do płatności Stripe.
(() => {
  const $ = (s) => document.querySelector(s), f = $('#passForm'); if (!f) return;
  const pick = (k) => { const r = f.querySelector(`input[name=kind][value="${k}"]`); if (r) r.checked = true; };
  const fromHash = () => { const m = /^#kup-(\w+)$/.exec(location.hash); if (m) { pick(m[1]); $('#kup')?.scrollIntoView({ behavior: 'smooth' }); } };
  addEventListener('hashchange', fromHash); fromHash();
  $('#passInv').addEventListener('change', (e) => ($('#passInvBox').hidden = !e.target.checked));
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = $('#passStatus'), btn = $('#passBuy'), kind = f.querySelector('input[name=kind]:checked')?.value;
    st.className = 'fstatus';
    if (!$('#passTerms').checked || !$('#passStart').checked) { st.classList.add('bad'); st.textContent = 'Zaznacz obie zgody, żeby kupić karnet.'; return; }
    btn.disabled = true; st.textContent = 'Otwieram płatność…';
    try {
      const body = { kind, email: $('#passEmail').value, terms: true, start: true, lang: document.documentElement.lang || 'pl', invoice: $('#passInv').checked ? { name: $('#pInvName').value, address: $('#pInvAddress').value, nip: $('#pInvNip').value } : null };
      const r = await fetch('/api/passes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      location.href = j.url;
    } catch (x) { st.classList.add('bad'); st.textContent = x.message || 'Nie udało się otworzyć płatności.'; btn.disabled = false; }
  });
})();
