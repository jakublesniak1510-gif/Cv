// Strona /dla-firm/sprawdz-ogloszenie (D4): bezpłatny wynik i 3 uwagi, zakup z fakturą (NIP) i powrót z płatności (?zamowienie=<id>) z pełnym raportem.
(() => {
  const $ = (s) => document.querySelector(s), f = $('#adForm'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s, ui = () => window.I18N?.lang || 'pl';
  const say = (el, t, cls = '') => { el.className = `fstatus ${cls}`; el.textContent = t; };
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
  const st = $('#adStatus'), pst = $('#adPayStatus'), buy = $('#adBuy'), out = $('#adResult');
  const SEV = { wysoki: 'Priorytet wysoki', średni: 'Priorytet średni', niski: 'Priorytet niski' };
  let previewId = '';
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#adGw'); if (gws.length < 2) return;
    gws.forEach((g, i) => {
      const l = document.createElement('label'), r = document.createElement('input'), s = document.createElement('span');
      l.className = 'check'; r.type = 'radio'; r.name = 'adGw'; r.value = g.id; r.checked = !i;
      s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ((g.methods || []).filter((m) => m !== 'Przelewy24').length ? g.methods.filter((m) => m !== 'Przelewy24') : ['BLIK', 'karta', 'Apple Pay / Google Pay']).map(tr).join(' / ')}`;
      l.append(r, s); box.append(l);
    });
  }).catch(() => {});
  // Wynik: ocena, podsumowanie, uwagi (w podglądzie bez poprawek), a w pełnym raporcie też poprawiona wersja i lista kontrolna.
  const render = (j, full) => {
    const box = el('div', 'adc-score'); box.append(el('b', 'adc-num', `${j.score}/100`), el('span', '', tr('Ocena ogłoszenia')));
    if (j.position) box.append(el('span', 'adc-pos', j.position));
    const list = el('ol', 'adc-list');
    j.remarks.forEach((x) => {
      const li = el('li', `adc-r sev-${x.severity === 'wysoki' ? 'hi' : x.severity === 'niski' ? 'lo' : 'mid'}`);
      const tag = el('span', 'adc-tag'); tag.append(el('span', '', tr(x.area)), ' · ', el('span', '', tr(SEV[x.severity] || SEV.średni)));
      li.append(tag, el('p', '', x.issue));
      if (full && x.fix) { const p = el('p', 'adc-fix'); p.append(el('b', '', tr('Jak poprawić:')), ' ', x.fix); li.append(p); }
      list.append(li);
    });
    const nodes = [box, el('p', '', j.summary), el('h2', '', full ? tr('Uwagi i poprawki') : tr('Najważniejsze uwagi')), list];
    if (!full) nodes.push(el('p', 'perk', j.more ? tr(`Pozostałe uwagi w pełnym raporcie: ${j.more}. Do tego poprawki do każdej uwagi i poprawiona wersja ogłoszenia.`) : tr('W pełnym raporcie: poprawki do każdej uwagi i poprawiona wersja ogłoszenia.')));
    if (full && j.rewrite) {
      const rw = el('div', 'adc-rw'); j.rewrite.split(/\n{2,}/).forEach((p) => rw.append(el('p', '', p)));
      nodes.push(el('h2', '', tr('Poprawiona wersja ogłoszenia')), el('p', 'hint', tr('Brakujące informacje oznaczyliśmy jako [UZUPEŁNIJ: …] – uzupełnij je przed publikacją.')), rw);
    }
    if (full && j.checklist?.length) { const ul = el('ul', 'tips'); j.checklist.forEach((c) => ul.append(el('li', '', c))); nodes.push(el('h2', '', tr('Przed publikacją sprawdź')), ul); }
    out.replaceChildren(...nodes); out.hidden = false;
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = $('#adText').value.trim();
    if (text.length < 150) return say(st, tr('Wklej całe ogłoszenie (co najmniej kilka zdań).'), 'bad');
    $('#adGo').disabled = true; buy.hidden = true; out.hidden = true; say(st, tr('Sprawdzamy ogłoszenie… To trwa zwykle do minuty.'));
    try {
      let r = await fetch('/api/ad-check/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }), j = await r.json();
      for (let i = 0; r.ok && j.pending && i < 40; i++) { await wait(3000); r = await fetch(`/api/ad-check/${j.id}`); j = await r.json(); }
      if (!r.ok || !Array.isArray(j.remarks)) throw new Error(j.error || tr('Sprawdzanie trwa dłużej niż zwykle. Spróbuj za chwilę.'));
      previewId = j.id; render(j, false); buy.hidden = false; say(st, '');
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (x) { say(st, x.message, 'bad'); }
    $('#adGo').disabled = false;
  });

  async function paid(id) {
    buy.hidden = false; f.hidden = true; say(pst, tr('Czekamy na potwierdzenie płatności…')); $('#kup')?.scrollIntoView();
    for (let i = 0; i < 60; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') {
        pst.className = 'fstatus good'; pst.textContent = '';
        const a = el('a', 'btn sm', tr('Pobierz raport (PDF)')); a.href = `/api/products/${encodeURIComponent(id)}/${j.files[0]}`;
        pst.append(el('b', '', tr('Gotowe. Pełny raport jest poniżej.')), document.createElement('br'), a, document.createElement('br'), j.mailed ? tr('Raport wysłaliśmy też na e-mail.') : tr('Link do pobrania działa 30 dni – zapisz plik u siebie.'));
        buy.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
        if (j.report) { render(j.report, true); buy.after(out); }
        return;
      }
      if (j.error) return say(pst, j.error, 'bad');
      await wait(2500);
    }
    say(pst, tr('Płatność jeszcze się potwierdza. Raport wyślemy na e-mail, gdy będzie gotowy.'));
  }
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  buy.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!$('#adTerms').checked || !$('#adWaiver').checked) return say(pst, tr('Zaznacz obie zgody, żeby kupić raport.'), 'bad');
    if (!$('#adInvNip').value.trim()) return say(pst, tr('Podaj dane firmy z NIP – wystawimy fakturę.'), 'bad');
    $('#adPay').disabled = true; say(pst, tr('Otwieram płatność…'));
    try {
      const gw = buy.querySelector('input[name=adGw]:checked')?.value;
      const body = { id: previewId, testCode: new URLSearchParams(location.search).get('kod') || undefined, email: $('#adEmail').value, terms: true, waiver: true, gateway: gw, uiLang: ui(), invoice: { name: $('#adInvName').value, address: $('#adInvAddr').value, nip: $('#adInvNip').value } };
      const r = await fetch('/api/products/adcheck', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      if (j.free) { $('#adPay').disabled = false; return paid(j.id); } // kod testowy właściciela: bez płatności
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); $('#adPay').disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(pst, x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); $('#adPay').disabled = false; }
  });
})();
