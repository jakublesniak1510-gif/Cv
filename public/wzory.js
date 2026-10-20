// Wzory CV i listów: opcjonalny zapis do newslettera (podwójna zgoda – link potwierdzający w e-mailu).
for (const f of document.querySelectorAll('form.tpl-news')) {
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = f.querySelector('.tpl-msg'), btn = f.querySelector('button'), email = f.email.value.trim();
    msg.className = 'tpl-msg';
    if (!email) { msg.textContent = 'Wpisz adres e-mail.'; return; }
    if (!f.consent.checked) { msg.textContent = 'Zaznacz zgodę na newsletter, jeśli chcesz się zapisać.'; return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent: true, source: f.dataset.source, website: f.website.value, lang: 'pl' }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Nie udało się zapisać. Spróbuj za chwilę.');
      msg.className = 'tpl-msg good'; msg.textContent = 'Sprawdź skrzynkę i potwierdź zapis linkiem w e-mailu.'; f.reset();
    } catch (x) { msg.textContent = x.message; } finally { btn.disabled = false; }
  });
}
