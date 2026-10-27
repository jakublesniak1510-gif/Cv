// Lekkie podstrony treściowe (zawody, poradnik, wzory, o serwisie…): bez kreatora i ukrytej strony głównej w kodzie.
// Menu na telefonie, przełącznik języka, przyciski „Zamów” (prowadzą do kreatora na stronie głównej), statystyki i baner zgody.
(() => {
  const $ = (s) => document.querySelector(s), lang = (document.documentElement.lang || window.I18N?.lang || 'pl').slice(0, 2);
  const home = lang === 'pl' ? '/' : `/${lang}`;
  // Kod polecający (?ref=…) zapamiętany pod tym samym kluczem co na stronie głównej (app.js REF_KEY), żeby nie zginął po przejściu do kreatora.
  const REF_KEY = 'cvpo-ref', urlRef = new URLSearchParams(location.search).get('ref');
  try { if (urlRef) localStorage.setItem(REF_KEY, urlRef); } catch {}
  const ref = () => { try { return urlRef || localStorage.getItem(REF_KEY) || ''; } catch { return urlRef || ''; } };
  const btn = $('#menuBtn'), nav = $('#mnav');
  btn?.addEventListener('click', () => { const open = nav.hidden; nav.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
  for (const a of document.querySelectorAll('.langsw a')) {
    a.classList.toggle('on', a.dataset.lang === lang);
    a.addEventListener('click', () => window.I18N?.set(a.dataset.lang));
  }
  // Polecane kursy (linki partnerskie): liczymy kliknięcie – id kursu i strona, bez danych osobowych (lib/affiliates.js).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-aff]'); if (!a || !navigator.sendBeacon) return;
    try { navigator.sendBeacon('/api/t', JSON.stringify({ e: 'aff', t: a.dataset.aff, g: a.dataset.affPage || '', p: location.pathname, l: lang })); } catch {}
  });
  // „Zamów CV” na podstronie: kreator otwiera się na stronie głównej (z wybranym pakietem, dodatkami i kodem polecającym).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    e.preventDefault();
    const q = new URLSearchParams({ zamow: '1', ...(b.dataset.pkg ? { pkg: b.dataset.pkg } : {}), ...(b.dataset.addon ? { dodatki: b.dataset.addon } : {}), ...(ref() ? { ref: ref() } : {}) });
    location.href = `${home}?${q}`;
  });
  // Linki „Zamów” w treści (…?zamow=1) też niosą kod polecający.
  if (ref()) for (const a of document.querySelectorAll('a[href*="?zamow=1"]')) { const u = new URL(a.href); if (!u.searchParams.has('ref')) { u.searchParams.set('ref', ref()); a.href = u.pathname + u.search; } }
  // Pasek „Zacznij” na telefonie (jak na stronie głównej): po przewinięciu, schowany przy otwartym menu.
  const mcta = $('#mcta');
  // B1 (26.10): tylko na stronach zawodów (także EN/UK/DE i zawód × miasto), po przewinięciu 40% strony; × chowa pasek na 24 h.
  const PROF = /^\/(?:cv|en\/cv|uk\/rezyume|de\/lebenslauf)\/[\w-]+(?:\/[\w-]+)?$/.test(location.pathname), MCTA_KEY = 'cvpo-mcta-x';
  const off = () => { try { return Date.now() - Number(localStorage.getItem(MCTA_KEY) || 0) < 864e5; } catch { return false; } };
  const set = (show) => { mcta.hidden = !show; document.body.classList.toggle('mcta-on', show); };
  if (mcta && PROF) {
    addEventListener('scroll', () => set(!off() && scrollY >= 0.4 * Math.max(1, document.documentElement.scrollHeight - innerHeight) && (nav?.hidden ?? true)), { passive: true });
    $('#mctaX')?.addEventListener('click', () => { try { localStorage.setItem(MCTA_KEY, String(Date.now())); } catch {} set(false); });
  }
  // Widżety poradników (lib/widgets.js): słowa kluczowe z ogłoszenia, szkic podsumowania i kalkulator czasu.
  const adWords = async (f) => {
    const out = f.querySelector('.fstatus'); let ad = f.querySelector('textarea').value.trim();
    out.className = 'fstatus'; out.textContent = '';
    if (/^https?:\/\/\S+$/i.test(ad)) { const r = await fetch('/api/fetch-ad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ad }) }); const j = await r.json(); if (!r.ok) throw new Error(f.dataset.linkerr || `${j.error} Wklej treść ogłoszenia zamiast linku.`); ad = j.text; }
    const r = await fetch('/api/ad-keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adText: ad, lang: f.dataset.lang || 'pl' }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error); return j.keywords;
  };
  for (const b of document.querySelectorAll('form.kw-extract button[hidden], form.sum-gen button[hidden]')) b.hidden = false;
  const mk = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
  for (const f of document.querySelectorAll('form.kw-extract')) f.addEventListener('submit', async (e) => {
    e.preventDefault(); const box = f.querySelector('.w-out'), btn = f.querySelector('button');
    btn.disabled = true;
    try { const k = await adWords(f); box.replaceChildren(k.length ? mk('div', { className: 'kw' }, ...k.map((x) => mk('span', { textContent: x }))) : mk('p', { textContent: f.dataset.none || 'Nie znaleźliśmy wymagań w tym tekście. Wklej pełną treść ogłoszenia.' })); }
    catch (x) { const o = f.querySelector('.fstatus'); o.className = 'fstatus bad'; o.textContent = x.message; }
    btn.disabled = false;
  });
  for (const f of document.querySelectorAll('form.sum-gen')) f.addEventListener('submit', async (e) => {
    e.preventDefault(); const box = f.querySelector('.w-out'), btn = f.querySelector('button');
    btn.disabled = true;
    try {
      const k = await adWords(f), text = mk('p', { className: 'sum-draft' });
      const boxes = k.map((x) => { const c = mk('input', { type: 'checkbox', value: x }); c.addEventListener('change', draw); return c; });
      function draw() {
        const on = boxes.filter((c) => c.checked).map((c) => c.value);
        text.textContent = on.length ? `[Stanowisko] z doświadczeniem w: ${on.slice(0, 3).join(', ')}.${on.length > 3 ? ` Na co dzień: ${on.slice(3, 6).join(', ')}.` : ''} Szukam pracy jako [stanowisko z ogłoszenia], gdzie wykorzystam [Twoja mocna strona].` : 'Zaznacz słowa, które naprawdę Cię opisują.';
      }
      box.replaceChildren(mk('p', { textContent: 'Zaznacz tylko to, co jest prawdą o Tobie:' }), mk('div', { className: 'kw-pick' }, ...boxes.map((c) => mk('label', { className: 'check' }, c, ' ', c.value))), text);
      draw();
    } catch (x) { const o = f.querySelector('.fstatus'); o.className = 'fstatus bad'; o.textContent = x.message; }
    btn.disabled = false;
  });
  for (const f of document.querySelectorAll('form.time-calc')) {
    const v = (n) => Math.max(0, Number(f.elements[n].value) || 0), out = f.querySelector('.calc-out');
    const draw = () => { const h = (m) => (Math.round((m / 60) * 10) / 10).toLocaleString('pl-PL'); const a = v('n') * v('a'), b = v('n') * v('b'); out.textContent = `Ręcznie: ok. ${h(a)} godz. tygodniowo. Ze skanerem: ok. ${h(b)} godz. Różnica: ok. ${h(Math.max(0, a - b))} godz. tygodniowo.`; };
    f.addEventListener('input', draw); f.addEventListener('submit', (e) => e.preventDefault()); draw();
  }
  // „Masz ogłoszenie?” na stronach zawodów: treść idzie do skanera przez pamięć tej karty przeglądarki (nie na serwer).
  for (const pf of document.querySelectorAll('form.paste-ad[data-scan]')) pf.addEventListener('submit', (e) => {
    e.preventDefault(); const ta = pf.querySelector('textarea'), v = ta.value.trim();
    if (!v) { ta.focus(); return; }
    try { sessionStorage.setItem('cvpo-scan-ad', v.slice(0, 20000)); } catch {}
    location.href = pf.dataset.scan;
  });
  // /kreator-cv: ogłoszenie przechodzi do kreatora na stronie głównej przez pamięć tej karty przeglądarki (nie na serwer).
  for (const wf of document.querySelectorAll('form.wiz-ad')) wf.addEventListener('submit', (e) => {
    e.preventDefault(); const v = wf.querySelector('textarea').value.trim();
    try { if (v) sessionStorage.setItem('cvpo-wiz-ad', v.slice(0, 20000)); } catch {}
    location.href = `${home}?zamow=1${ref() ? `&ref=${encodeURIComponent(ref())}` : ''}`;
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
    if (navigator.sendBeacon) navigator.sendBeacon('/api/t', JSON.stringify({ e: 'pv', p: location.pathname, r: document.referrer, u: new URLSearchParams(location.search).get('utm_source') || '', l: lang }));
  }).catch(() => {});
})();
