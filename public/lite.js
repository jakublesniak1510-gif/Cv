// Lekkie podstrony treściowe (zawody, poradnik, wzory, o serwisie…): bez kreatora i ukrytej strony głównej w kodzie.
// Menu na telefonie, przełącznik języka, przyciski „Zamów” (prowadzą do kreatora na stronie głównej), statystyki i baner zgody.
(() => {
  const $ = (s) => document.querySelector(s), lang = (window.I18N?.lang || document.documentElement.lang || 'pl').slice(0, 2);
  const home = lang === 'pl' ? '/' : `/${lang}`;
  const btn = $('#menuBtn'), nav = $('#mnav');
  btn?.addEventListener('click', () => { const open = nav.hidden; nav.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
  for (const a of document.querySelectorAll('.langsw a')) {
    a.classList.toggle('on', a.dataset.lang === lang);
    a.addEventListener('click', () => window.I18N?.set(a.dataset.lang));
  }
  // „Zamów CV” na podstronie: kreator otwiera się na stronie głównej (z wybranym pakietem i dodatkami).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    e.preventDefault();
    const q = new URLSearchParams({ zamow: '1', ...(b.dataset.pkg ? { pkg: b.dataset.pkg } : {}), ...(b.dataset.addon ? { dodatki: b.dataset.addon } : {}) });
    location.href = `${home}?${q}`;
  });
  // Formularz „Dla firm i uczelni”.
  const f = $('#b2bForm');
  f?.addEventListener('submit', async (e) => {
    e.preventDefault(); const out = $('#bMsgOut'), sub = f.querySelector('button[type=submit]'), v = (id) => $('#' + id)?.value || '';
    out.className = 'fstatus'; sub.disabled = true;
    try {
      const r = await fetch('/api/b2b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ org: v('bOrg'), name: v('bName'), email: v('bEmail'), phone: v('bPhone'), count: v('bCount'), msg: v('bMsg'), consent: !!$('#bConsent')?.checked, uiLang: lang }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      f.reset(); out.classList.add('good'); out.textContent = 'Dziękujemy! Odpowiemy e-mailem, zwykle w ciągu 1–2 dni roboczych.';
    } catch (x) { out.classList.add('bad'); out.textContent = x.message; }
    sub.disabled = false;
  });
  // Statystyki bez cookies (jak na stronie głównej) i baner zgody na reklamy.
  fetch('/api/config').then((r) => r.json()).then((c) => {
    window.CONSENT?.init(c.ads);
    if (!c.preview && navigator.sendBeacon) navigator.sendBeacon('/api/t', JSON.stringify({ e: 'pv', p: location.pathname, r: document.referrer, u: new URLSearchParams(location.search).get('utm_source') || '', l: lang }));
  }).catch(() => {});
})();
