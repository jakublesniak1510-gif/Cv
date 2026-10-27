// Strona /dla-firm/selekcja-cv (D8): wymagania z ogłoszenia (do poprawienia), wgrywanie CV po jednym, zakup i tabela wyników
// (?zamowienie=<id>). Bez rankingu: kandydaci w kolejności wgrania.
(() => {
  const $ = (s) => document.querySelector(s), f = $('#selForm'); if (!f) return;
  const tr = (s) => window.I18N?.t?.(s) ?? s, ui = () => window.I18N?.lang || 'pl';
  const say = (el, t, cls = '') => { el.className = `fstatus ${cls}`; el.textContent = t; };
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const PRICE = { 20: '49 zł', 50: '89 zł' }, SEV = { tak: 'ok', częściowo: 'mid', nie: 'no' };
  let draft = '', names = [];
  const variant = () => $('input[name=selVar]:checked')?.value || '20';
  const payLabel = () => ($('#selPay').textContent = `${tr('Zamów tabelę')} – ${PRICE[variant()]}`);
  document.querySelectorAll('input[name=selVar]').forEach((r) => r.addEventListener('change', payLabel));

  // Lista wymagań do edycji: pole tekstowe, „konieczne”, usuń.
  const reqRow = (r = { text: '', must: true }) => {
    const row = el('div', 'sel-req-row'), t = el('input'), m = el('label', 'check'), mc = el('input'), x = el('button', 'btn ghost sm', '×');
    t.type = 'text'; t.maxLength = 160; t.value = r.text; t.setAttribute('aria-label', tr('Wymaganie'));
    mc.type = 'checkbox'; mc.checked = r.must !== false; m.append(mc, ' ', tr('konieczne'));
    x.type = 'button'; x.setAttribute('aria-label', tr('Usuń')); x.addEventListener('click', () => { row.remove(); preview(); });
    t.addEventListener('input', preview); row.append(t, m, x); $('#selReqList').append(row);
  };
  const reqs = () => [...document.querySelectorAll('.sel-req-row')].map((r) => ({ text: r.querySelector('input[type=text]').value.trim(), must: r.querySelector('input[type=checkbox]').checked })).filter((r) => r.text);
  $('#selReqAdd').addEventListener('click', () => { reqRow(); preview(); });
  // Podgląd tabeli przed zakupem: wymagania i puste wiersze kandydatów ze znakiem „PODGLĄD”.
  function preview() {
    const box = $('#selPrev'), t = el('table', 'rep sel-table'), head = el('tr'); head.append(el('th', '', tr('Kandydat')), ...reqs().map((r) => el('th', '', r.text)));
    t.append(head); (names.length ? names : [tr('Kandydat 1'), tr('Kandydat 2')]).slice(0, 3).forEach((n, i) => { const row = el('tr'); row.append(el('td', '', names.length ? `${i + 1}. ${n}` : n), ...reqs().map(() => el('td', 'sel-blank', '…'))); t.append(row); });
    const wrap = el('div', 'table-wrap'); wrap.append(t); box.replaceChildren(el('span', 'ofr-mark', tr('PODGLĄD')), wrap);
  }
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ad = $('#selAd').value.trim(); if (ad.length < 150) return say($('#selStatus'), tr('Wklej całe ogłoszenie z wymaganiami (co najmniej kilka zdań).'), 'bad');
    $('#selReqGo').disabled = true; say($('#selStatus'), tr('Wypisujemy wymagania…'));
    try {
      const r = await fetch('/api/selection/requirements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad }) }), j = await r.json();
      if (!r.ok) throw new Error(j.error);
      draft = j.id; names = []; $('#selReqList').replaceChildren(); j.requirements.forEach(reqRow);
      const ex = $('#selExcluded'); ex.replaceChildren();
      if (j.excluded?.length) { const ul = el('ul'); j.excluded.forEach((x) => ul.append(el('li', '', `${x.text} – ${x.reason || tr('cecha chroniona')}`))); ex.append(el('p', 'hint', tr('Pominięte (nie sprawdzamy cech chronionych):')), ul); }
      $('#selReq').hidden = false; $('#selBuy').hidden = false; say($('#selStatus'), ''); preview(); drawCvs(); $('#selReq').scrollIntoView({ behavior: 'smooth' });
    } catch (x) { say($('#selStatus'), x.message || tr('Nie udało się odczytać wymagań.'), 'bad'); }
    $('#selReqGo').disabled = false;
  });

  // CV: wysyłamy po jednym pliku; na liście tylko nazwy plików.
  const drawCvs = () => {
    const ol = $('#selCvList'); ol.replaceChildren();
    names.forEach((n, i) => { const li = el('li', '', `${n} `), x = el('button', 'btn ghost sm', '×'); x.type = 'button'; x.setAttribute('aria-label', tr('Usuń')); x.addEventListener('click', () => removeCv(i)); li.append(x); ol.append(li); });
    if (names.length > 20 && variant() === '20') { $('input[name=selVar][value="50"]').checked = true; payLabel(); }
    preview();
  };
  async function removeCv(i) { const r = await fetch(`/api/selection/${draft}/cv/${i}`, { method: 'DELETE' }), j = await r.json(); if (r.ok) { names = j.names; drawCvs(); } }
  const b64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error(tr('Nie udało się wczytać pliku.'))); r.readAsDataURL(file); });
  $('#selFiles').addEventListener('change', async (e) => {
    const st = $('#selCvStatus'), files = [...e.target.files]; let bad = 0;
    for (const [k, file] of files.entries()) {
      if (names.length >= 50) { say(st, tr('Najwyżej 50 CV.'), 'bad'); break; }
      say(st, `${tr('Wgrywamy CV')} ${k + 1}/${files.length}…`);
      try {
        if (file.size > 4 * 1024 * 1024) throw new Error(tr('Plik CV musi mieć do 4 MB.'));
        const r = await fetch(`/api/selection/${draft}/cv`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, data: await b64(file) }) }), j = await r.json();
        if (!r.ok) throw new Error(j.error); names = j.names;
      } catch (x) { bad++; say(st, `${file.name}: ${x.message}`, 'bad'); }
    }
    e.target.value = ''; drawCvs(); if (!bad) say(st, `${tr('Wgrane CV')}: ${names.length}`, 'good');
  });

  fetch('/api/config').then((r) => r.json()).then((c) => {
    const gws = c.pay?.gateways || [], box = $('#selGw'); if (gws.length < 2) return;
    gws.forEach((g, i) => { const l = el('label', 'check'), r = el('input'), s = el('span'); r.type = 'radio'; r.name = 'selGw'; r.value = g.id; r.checked = !i; s.textContent = ` ${g.id === 'p24' ? tr('Przelewy24 (przelew online, BLIK)') : ['BLIK', 'karta', 'Apple Pay / Google Pay'].map(tr).join(' / ')}`; l.append(r, s); box.append(l); });
  }).catch(() => {});

  // Wyniki: karta dla każdego kandydata (kolejność wgrania), przy wymaganiu status i cytat.
  const showResults = (j, id) => {
    const s = j.selection, out = $('#selOut'), nodes = [el('p', 'perk', tr('To narzędzie pomocnicze. Decyzję o kandydatach podejmuje człowiek.')), el('p', 'hint', tr('Kandydaci w kolejności wgrania plików, bez rankingu. Wyniki usuniemy po 7 dniach od zakupu.'))];
    const dl = el('p'); for (const [k, t] of [['selekcja.pdf', 'PDF'], ['selekcja.csv', 'CSV (Excel)']]) { const a = el('a', 'btn sm', t); a.href = `/api/products/${encodeURIComponent(id)}/${k}`; dl.append(a, ' '); } nodes.push(dl);
    s.rows.forEach((r, i) => {
      const card = el('section', 'sel-card'); card.append(el('h3', '', `${tr('Kandydat')} ${i + 1} (${r.name})`));
      if (!r.cells) card.append(el('p', 'hint', r.error)); else { const ul = el('ul', 'sel-cells'); r.cells.forEach((c, k) => { const li = el('li'); li.append(el('span', `sel-st sel-${SEV[c.status]}`, tr(c.status)), ` ${s.requirements[k].text}`); if (c.quote) li.append(el('q', '', c.quote)); ul.append(li); }); card.append(ul); }
      nodes.push(card);
    });
    out.replaceChildren(...nodes); out.hidden = false;
  };
  async function paid(id) {
    f.hidden = true; $('#selBuy').hidden = false; const pst = $('#selPayStatus'); say(pst, tr('Czekamy na potwierdzenie płatności i sprawdzamy CV… Przy 50 CV to trwa kilka minut.')); $('#kup')?.scrollIntoView();
    for (let i = 0; i < 200; i++) {
      const j = await fetch(`/api/products/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === 'done') { $('#selBuy').querySelectorAll('input,button').forEach((x) => (x.disabled = true)); if (j.purged) return say(pst, tr('Wyniki usunęliśmy po 7 dniach od zakupu.')); say(pst, j.mailed ? tr('Gotowe. Tabelę wysłaliśmy też na e-mail.') : tr('Gotowe.'), 'good'); return showResults(j, id); }
      if (j.error) return say(pst, j.error, 'bad');
      await wait(3000);
    }
    say(pst, tr('Sprawdzanie jeszcze trwa. Tabelę wyślemy na e-mail, gdy będzie gotowa.'));
  }
  const back = new URLSearchParams(location.search).get('zamowienie');
  if (back) paid(back);

  $('#selBuy').addEventListener('submit', async (e) => {
    e.preventDefault(); const pst = $('#selPayStatus');
    if (!names.length) return say(pst, tr('Wgraj co najmniej jedno CV.'), 'bad');
    if (!$('#selTerms').checked || !$('#selDpa').checked || !$('#selWaiver').checked) return say(pst, tr('Zaznacz wszystkie trzy zgody, w tym umowę powierzenia.'), 'bad');
    $('#selPay').disabled = true; say(pst, tr('Otwieram płatność…'));
    try {
      const body = { id: draft, variant: Number(variant()), requirements: reqs(), email: $('#selEmail').value, terms: true, waiver: true, dpa: true, gateway: $('#selBuy').querySelector('input[name=selGw]:checked')?.value, uiLang: ui(), invoice: { name: $('#selInvName').value, address: $('#selInvAddr').value, nip: $('#selInvNip').value } };
      const r = await fetch('/api/products/selection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (j.demo) { await fetch(`/api/orders/${j.id}/demo-pay`, { method: 'POST' }); $('#selPay').disabled = false; return paid(j.id); }
      location.href = j.url;
    } catch (x) { say(pst, x.message || tr('Nie udało się otworzyć płatności.'), 'bad'); $('#selPay').disabled = false; }
  });
})();
