// Panel administratora: logowanie, pulpit, zamówienia, kody, problemy, eksport.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return n;
}
const zl = (v) => `${Number(v || 0).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`;
const dt = (t) => (t ? new Date(t).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const dd = (t) => (t ? new Date(t).toLocaleDateString('pl-PL') : '—');
const ST = { done: 'Gotowe', pending: 'Czeka na płatność', generating: 'Generuje się', paid: 'Błąd generowania' };
const MAIL = { sent: 'E-mail wysłany', failed: 'E-mail nie doszedł', skipped: 'E-mail wyłączony' };
const status = (s) => el('span', { className: `st ${s}`, textContent: ST[s] || s });
const mailSt = (s) => (s ? el('span', { className: `st ${s}`, textContent: MAIL[s] || s }) : el('span', { className: 'mute', textContent: '—' }));

async function api(path, opts = {}) {
  const r = await fetch('/api/admin' + path, { ...opts, headers: { 'Content-Type': 'application/json', 'X-Admin': '1', ...(opts.headers || {}) }, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== '/login') { showLogin(); throw new Error(j.error || 'Zaloguj się.'); }
  if (!r.ok) throw new Error(j.error || `Błąd ${r.status}`);
  return j;
}
const post = (p, body) => api(p, { method: 'POST', body: JSON.stringify(body || {}) });
let toastT;
function toast(t) { const n = $('#toast'); n.textContent = t; n.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (n.hidden = true), 3500); }

// --- logowanie ---
let me = {};
function showLogin() { $('#appView').hidden = true; $('#loginView').hidden = false; $('#lCodeWrap').hidden = !me.totp; $('#lPass').focus(); }
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const b = e.submitter; b.disabled = true; $('#lMsg').textContent = '';
  try { await post('/login', { password: $('#lPass').value, code: $('#lCode').value }); $('#lPass').value = $('#lCode').value = ''; start(); }
  catch (x) { $('#lMsg').textContent = x.message; } finally { b.disabled = false; }
});
$('#logout').addEventListener('click', async () => { await post('/logout').catch(() => {}); showLogin(); });

// --- nawigacja ---
const loaders = {};
function go(v) {
  $$('#nav button').forEach((b) => (b.getAttribute('data-v') === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $$('main > section').forEach((s) => (s.hidden = s.dataset.view !== v));
  history.replaceState(null, '', '#' + v);
  loaders[v]?.();
}
$('#nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(b.dataset.v); });
document.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

// --- pulpit ---
function tile(k, v, s) { return el('div', { className: 'tile' }, el('div', { className: 'k', textContent: k }), el('div', { className: 'v', textContent: v }), s ? el('div', { className: 's', textContent: s }) : null); }
const plural = (n, a, b, c) => `${n} ${n === 1 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c}`;
const ords = (n) => plural(n, 'zamówienie', 'zamówienia', 'zamówień');
loaders.dash = async () => {
  const s = await api('/stats');
  $('#tiles').replaceChildren(
    tile('Dzisiaj', zl(s.today.revenue), ords(s.today.orders)),
    tile('Ostatnie 7 dni', zl(s.d7.revenue), ords(s.d7.orders)),
    tile('Ostatnie 30 dni', zl(s.d30.revenue), ords(s.d30.orders)),
    tile('Średnie zamówienie', zl(s.d30.avg), 'z ostatnich 30 dni'),
  );
  const PK = { cv: 'Samo CV', cv_letter: 'CV + list', pack3: 'Pakiet 3 CV + listy' };
  const total = Object.values(s.byPkg).reduce((a, b) => a + b, 0) || 1;
  $('#facts').replaceChildren(...[
    ...Object.entries(s.byPkg).map(([k, n]) => [PK[k] || k, `${n} (${Math.round((100 * n) / total)}%)`]),
    ['Z dodatkami', `${s.addonsShare}%`], ['Z kodem rabatowym', `${s.codesShare}%`],
    ['Czeka na płatność', String(s.pending)],
    ['Przygotowane CV (od startu)', `${s.totals.cvs}${s.totals.cvs < 1000 ? ` · licznik na stronie od 1000` : ' · licznik widoczny na stronie'}`],
    ['Konta klientów', String(s.accounts)],
    ['Ocena klientów', s.reviews.count ? `${String(s.reviews.avg).replace('.', ',')} / 5 (${s.reviews.count})` : 'brak ocen'], [`Koszt AI (${s.ai.month})`, `$${s.ai.usd.toFixed(2)} · ${s.ai.calls} wywołań`],
  ].map(([k, v]) => el('div', {}, el('dt', { textContent: k }), el('dd', { textContent: v }))));
  drawChart(s.byDay);
  setBadge(s.problems); setRvBadge(s.reviews.waiting); setMsgBadge(s.newMessages);
  $('#dashUpd').textContent = 'Stan na ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const r = await api('/orders?page=0');
  $('#recent').replaceChildren(orderTable(r.rows.slice(0, 6), true));
};
$('#dashRefresh').addEventListener('click', () => loaders.dash());
function setMsgBadge(n) { $('#msgBadge').hidden = !n; $('#msgBadge').textContent = n; }
function setRvBadge(n) { $('#rvBadge').hidden = !n; $('#rvBadge').textContent = n; }
function setBadge(n) { $('#probBadge').hidden = !n; $('#probBadge').textContent = n; }

// Wykres słupkowy: jedna seria, bez legendy (nazwa w tytule), zaokrąglone tylko górne rogi, dyskretna siatka.
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, a = {}) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(a)) n.setAttribute(k, v); return n; };
function niceMax(v) { if (v <= 0) return 100; const p = 10 ** Math.floor(Math.log10(v)); return [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((m) => m * p >= v) * p; }
const shortDay = (d) => { const [, m, day] = d.split('-'); return `${+day}.${m}`; };
const longDay = (d) => new Date(d + 'T12:00').toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });
// Wykres słupkowy dzienny (jedna seria): używany dla przychodu i dla odwiedzin.
function barChart(box, days, o) {
  const W = Math.max(box.clientWidth, 300), H = 240, L = 52, R = 4, T = 10, B = 26, vals = days.map(o.val);
  const max = niceMax(Math.max(...vals)), iw = W - L - R, ih = H - T - B, step = iw / days.length, bw = Math.max(2, step - 2);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${o.label}, maksymalnie ${o.fmt(Math.max(...vals))}` });
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, y = T + ih - (v / max) * ih;
    svg.append(sv('line', { class: 'gl', x1: L, x2: W - R, y1: y, y2: y }));
    const t = sv('text', { class: 'ax', x: L - 8, y: y + 4, 'text-anchor': 'end' }); t.textContent = o.axis(v); svg.append(t);
  }
  const tip = el('div', { className: 'tip', hidden: true });
  days.forEach((d, i) => {
    const x = L + i * step + (step - bw) / 2, h = (vals[i] / max) * ih, y = T + ih - h, r = Math.min(4, bw / 2, h);
    const bar = h > 0 ? sv('path', { class: 'bar', d: `M${x},${T + ih}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${T + ih}Z` }) : null;
    if (bar) svg.append(bar);
    const hit = sv('rect', { class: 'hit', x: L + i * step, y: T, width: step, height: ih });
    hit.addEventListener('pointerenter', () => {
      bar?.classList.add('on');
      tip.replaceChildren(el('div', { textContent: longDay(d.day) }), el('b', { textContent: o.fmt(vals[i]) }), document.createTextNode(` · ${o.sub(d)}`));
      tip.hidden = false;
      const px = ((x + bw / 2) / W) * box.clientWidth, py = (Math.min(y, T + ih - 2) / H) * 240;
      tip.style.left = `${Math.min(Math.max(px, 80), box.clientWidth - 80)}px`; tip.style.top = `${py}px`;
    });
    hit.addEventListener('pointerleave', () => { bar?.classList.remove('on'); tip.hidden = true; });
    svg.append(hit);
    const every = days.length > 45 ? 15 : 5;
    if (i % every === every - 1 || i === 0) { const t = sv('text', { class: 'ax', x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }); t.textContent = shortDay(d.day); svg.append(t); }
  });
  box.replaceChildren(svg, tip);
}
function drawChart(days) {
  barChart($('#chart'), days, { val: (d) => d.revenue, fmt: zl, axis: (v) => `${Math.round(v)} zł`, sub: (d) => ords(d.orders), label: 'Przychód dziennie z ostatnich 30 dni' });
  $('#chartTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: 'Dzień' }), el('th', { className: 'r', textContent: 'Zamówienia' }), el('th', { className: 'r', textContent: 'Przychód' }))),
    el('tbody', {}, [...days].reverse().map((d) => el('tr', {}, el('td', { textContent: longDay(d.day) }), el('td', { className: 'r', textContent: d.orders }), el('td', { className: 'r', textContent: zl(d.revenue) }))))));
  lastDays = days;
}
let lastDays = null;
$('#chartToggle').addEventListener('click', (e) => {
  const on = e.target.getAttribute('aria-pressed') !== 'true';
  e.target.setAttribute('aria-pressed', on); e.target.textContent = on ? 'Pokaż wykres' : 'Pokaż tabelę';
  $('#chart').hidden = on; $('#chartTable').hidden = !on;
});
let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (lastDays && !$('#chart').hidden) drawChart(lastDays); if (lastTraffic && current() === 'traffic') drawTraffic(lastTraffic); }, 150); });

// --- zamówienia ---
function orderTable(rows, compact = false) {
  if (!rows.length) return el('div', { className: 'empty', textContent: 'Brak zamówień.' });
  return el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: 'Data' }), el('th', { textContent: 'E-mail' }), el('th', { textContent: 'Pakiet' }),
      compact ? null : el('th', { textContent: 'Kod' }), el('th', { className: 'r', textContent: 'Kwota' }), el('th', { textContent: 'Status' }), compact ? null : el('th', { textContent: 'Wysyłka' }))),
    el('tbody', {}, rows.map((o) => {
      const tr = el('tr', { className: 'click', tabIndex: 0 },
        el('td', { className: 'num', textContent: dt(o.created) }), el('td', { className: 'ell', textContent: o.email, title: o.email }),
        el('td', {}, o.pkgName, o.followup ? el('span', { className: 'tag', textContent: 'kolejne', style: 'margin-left:6px' }) : null),
        compact ? null : el('td', { className: 'mono', textContent: o.code || '—' }), el('td', { className: 'r', textContent: zl(o.total) }),
        el('td', {}, status(o.status)), compact ? null : el('td', {}, mailSt(o.mail)));
      tr.addEventListener('click', () => openOrder(o.id));
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && openOrder(o.id));
      return tr;
    })));
}
let page = 0, qT;
loaders.orders = async () => {
  const q = new URLSearchParams({ q: $('#q').value.trim(), status: $('#stFilter').value, page });
  const r = await api('/orders?' + q);
  $('#ordTable').replaceChildren(orderTable(r.rows));
  $('#ordCount').textContent = ords(r.total);
  const from = r.total ? page * 50 + 1 : 0, to = Math.min(r.total, (page + 1) * 50);
  $('#pgInfo').textContent = `${from}–${to} z ${r.total}`;
  $('#pgPrev').disabled = page === 0; $('#pgNext').disabled = to >= r.total;
};
$('#q').addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { page = 0; loaders.orders(); }, 250); });
$('#stFilter').addEventListener('change', () => { page = 0; loaders.orders(); });
$('#pgPrev').addEventListener('click', () => { page--; loaders.orders(); });
$('#pgNext').addEventListener('click', () => { page++; loaders.orders(); });

// Szczegóły zamówienia w szufladzie
const LANG = { pl: 'polski', en: 'angielski', de: 'niemiecki', uk: 'ukraiński', es: 'hiszpański', fr: 'francuski', auto: 'auto' };
function closeDrawer() { $('#drawer').hidden = true; lastFocus?.focus(); }
let lastFocus;
$('#drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') closeDrawer(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });
const kv = (pairs) => el('dl', { className: 'kv' }, pairs.filter(Boolean).flatMap(([k, v]) => [el('dt', { textContent: k }), el('dd', {}, v ?? '—')]));
async function openOrder(id) {
  lastFocus = document.activeElement;
  const p = $('#panel'); p.replaceChildren(el('p', { className: 'mute', textContent: 'Wczytuję…' })); $('#drawer').hidden = false;
  let o; try { o = await api('/orders/' + id); } catch (x) { p.replaceChildren(el('p', { className: 'msg bad', textContent: x.message })); return; }
  const addons = [o.addons.interview && 'przygotowanie do rozmowy', o.addons.messages && 'wiadomości do rekrutera', o.addons.linkedin && 'profil LinkedIn', o.addons.docx && 'wersja Word', ...o.extraLangs.map((l) => `wersja: ${l}`)].filter(Boolean);
  const act = el('div', { className: 'confirm', hidden: true });
  const reload = () => { openOrder(id); loaders[current()]?.(); };
  const run = async (b, fn, ok) => { b.disabled = true; try { await fn(); toast(ok); reload(); } catch (x) { toast(x.message); b.disabled = false; } };
  const bResend = el('button', { className: 'btn ghost sm', textContent: 'Wyślij e-mail ponownie', disabled: o.status !== 'done' });
  bResend.onclick = () => run(bResend, async () => { const r = await post(`/orders/${id}/resend`); if (!r.ok) throw new Error(r.mail.status === 'skipped' ? 'Wysyłka e-mail jest wyłączona (brak SMTP_URL).' : 'E-mail nie doszedł. Sprawdź adres.'); }, 'E-mail wysłany.');
  const bRegen = el('button', { className: 'btn ghost sm', textContent: 'Generuj ponownie', disabled: !['paid', 'done'].includes(o.status) });
  bRegen.onclick = () => confirmBox('Wygenerować dokumenty od nowa?', 'Obecne dokumenty i poprawki klienta zostaną zastąpione nowymi. Klient dostanie nowy e-mail.', 'Generuj ponownie', false, () => run(bRegen, () => post(`/orders/${id}/regenerate`), 'Generowanie rozpoczęte.'));
  const bDel = el('button', { className: 'btn danger sm', textContent: 'Usuń dane' });
  bDel.onclick = () => confirmBox('Usunąć wszystkie dane tego zamówienia?', 'Na żądanie klienta (RODO). Znikną dane, zdjęcie i dokumenty; link klienta przestanie działać. Nie da się tego cofnąć.', 'Usuń na zawsze', true, async () => {
    try { await api(`/orders/${id}`, { method: 'DELETE' }); toast('Dane usunięte.'); closeDrawer(); loaders[current()]?.(); } catch (x) { toast(x.message); }
  });
  function confirmBox(title, text, label, danger, onOk, withReason) {
    const reason = withReason ? el('input', { placeholder: 'Powód (opcjonalnie, np. klient zrezygnował)', maxLength: 300 }) : null;
    const ok = el('button', { className: `btn sm ${danger ? 'danger solid' : ''}`, textContent: label });
    const no = el('button', { className: 'btn ghost sm', textContent: 'Anuluj' });
    ok.onclick = () => { act.hidden = true; onOk(reason?.value || ''); };
    no.onclick = () => { act.hidden = true; };
    act.replaceChildren(el('strong', { textContent: title }), el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: text }), reason, el('div', { className: 'actions' }, ok, no));
    act.hidden = false; (reason || ok).focus();
  }
  const x = el('button', { className: 'x', textContent: '×', ariaLabel: 'Zamknij' }); x.onclick = closeDrawer;
  p.replaceChildren(...[
    el('div', { className: 'top' }, el('h2', { id: 'dTitle', textContent: o.name || o.email }), x),
    el('div', { className: 'actions' }, status(o.status), mailSt(o.mail), o.followup ? el('span', { className: 'tag', textContent: 'kolejne zamówienie' }) : null),
    o.error ? el('p', { className: 'msg bad', style: 'margin:0', textContent: o.error }) : null,
    el('div', {}, el('h3', { textContent: 'Działania' }), el('div', { className: 'actions' }, bResend, bRegen, bDel,
      el('a', { className: 'btn ghost sm', href: o.link, target: '_blank', rel: 'noopener', textContent: 'Strona klienta ↗' })), act),
    el('div', {}, el('h3', { textContent: 'Zamówienie' }), kv([
      ['Numer', el('span', { className: 'mono', textContent: o.id })], ['Złożone', dt(o.created)], ['Opłacone', dt(o.paidAt)],
      ['Pakiet', o.pkgName], ['Dodatki', addons.join(', ') || '—'], ['Kwota', zl(o.total)],
      o.code && ['Kod', `${o.code} (−${zl(o.discount)})`],
      ['Poprawki', `${o.revisions} z 10`], ['Kod klienta', o.myCode || '—'], ['Dane znikną', dd(o.expires)],
    ])),
    el('div', {}, el('h3', { textContent: 'Klient' }), kv([['E-mail', o.email], ['Telefon', o.phone || '—'], ['Zdjęcie', o.hasPhoto ? 'tak' : 'nie'],
      ['Przypomnienie', o.reminder?.consent ? (o.reminder.sent ? 'wysłane' : 'zgoda, jeszcze nie wysłane') : 'bez zgody'], ['Szablon', `${o.design?.tpl || '—'} / ${o.design?.color || '—'}`]])),
    el('div', {}, el('h3', { textContent: `Ogłoszenia (${o.adsList.length})` }), el('ul', { className: 'list' }, o.adsList.map((a, i) => {
      const r = o.results[i];
      return el('li', {}, `${a.title || 'Bez tytułu'} · ${LANG[r?.lang || a.lang] || a.lang}`, r?.score != null ? ` · dopasowanie ${r.score}%` : '', r?.variants.length ? ` · +${r.variants.map((v) => LANG[v] || v).join(', ')}` : '');
    }))),
    o.mailInfo ? el('div', {}, el('h3', { textContent: 'E-mail' }), kv([['Do', o.mailInfo.to], ['Status', MAIL[o.mailInfo.status] || o.mailInfo.status], ['Kiedy', dt(o.mailInfo.at)]])) : null,
  ].filter(Boolean));
  x.focus();
}
const current = () => $('#nav [aria-current]')?.dataset.v || 'dash';

// --- kody ---
let kind = 'amount', codeFilter = '';
$('#cKind').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
  $$('#cKind button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  $('#cValLbl').textContent = kind === 'amount' ? 'Rabat (zł)' : 'Rabat (%)'; $('#cVal').max = kind === 'amount' ? 70 : 90;
});
$('#codeKind').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; codeFilter = b.dataset.k;
  $$('#codeKind button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loaders.codes();
});
$('#codeForm').addEventListener('submit', async (e) => {
  e.preventDefault(); const m = $('#cMsg'); m.className = 'msg'; m.textContent = '';
  try {
    await post('/codes', { code: $('#cCode').value, [kind]: $('#cVal').value, days: $('#cDays').value, maxUses: $('#cMax').value, note: $('#cNote').value });
    m.className = 'msg good'; m.textContent = `Kod ${$('#cCode').value.toUpperCase()} utworzony.`; $('#cCode').value = $('#cNote').value = $('#cMax').value = '';
    loaders.codes();
  } catch (x) { m.className = 'msg bad'; m.textContent = x.message; }
});
loaders.codes = async () => {
  const list = (await api('/codes')).filter((c) => !codeFilter || c.kind === codeFilter);
  if (!list.length) return $('#codeTable').replaceChildren(el('div', { className: 'empty', textContent: 'Brak kodów.' }));
  $('#codeTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, ['Kod', 'Rodzaj', 'Rabat', 'Użycia', 'Ważny do', 'Notatka', ''].map((t, i) => el('th', { className: i === 2 || i === 3 ? 'r' : '', textContent: t })))),
    el('tbody', {}, list.map((c) => {
      const del = el('button', { className: 'btn danger sm', textContent: 'Usuń' });
      del.onclick = async () => {
        if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; setTimeout(() => { del.dataset.sure = ''; del.textContent = 'Usuń'; }, 3000); return; }
        try { await api('/codes/' + encodeURIComponent(c.code), { method: 'DELETE' }); toast(`Kod ${c.code} usunięty.`); loaders.codes(); } catch (x) { toast(x.message); }
      };
      return el('tr', {}, el('td', { className: 'mono', textContent: c.code }), el('td', {}, el('span', { className: 'tag', textContent: c.kind === 'klient' ? 'klient' : 'akcja' }), c.referrals ? el('div', { className: 'mute', style: 'font-size:12px', textContent: `${c.referrals} pol. · saldo ${c.credit}` }) : null),
        el('td', { className: 'r', textContent: c.percent ? `−${c.percent}%` : `−${zl(c.amount)}` }),
        el('td', { className: 'r', textContent: c.maxUses ? `${c.uses} / ${c.maxUses}` : String(c.uses) }),
        el('td', { className: 'num', textContent: dd(c.expires) }), el('td', { className: 'ell mute', textContent: c.note || '—' }), el('td', { className: 'r' }, del));
    }))));
};

// --- opinie ---
let rvFilter = 'new';
const stars = (n) => el('span', { className: 'stars', textContent: '★'.repeat(n) + '☆'.repeat(5 - n), ariaLabel: `${n} na 5` });
const RVST = { new: 'do sprawdzenia', approved: 'opublikowana', hidden: 'ukryta', spam: 'spam' };
$('#rvKind').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; rvFilter = b.dataset.k; $$('#rvKind button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loaders.reviews(); });
loaders.reviews = async () => {
  const all = await api('/reviews'), ok = all.filter((r) => r.status !== 'spam');
  $('#rvSum').textContent = ok.length ? `średnia ${(ok.reduce((s, r) => s + r.rating, 0) / ok.length).toFixed(1).replace('.', ',')} z ${ok.length} ocen` : '';
  setRvBadge(all.filter((r) => r.status === 'new' && r.publish).length);
  const list = all.filter((r) => !rvFilter || r.status === rvFilter);
  if (!list.length) return $('#rvList').replaceChildren(el('div', { className: 'card empty', textContent: rvFilter === 'new' ? 'Nie ma nowych opinii do sprawdzenia.' : 'Brak opinii.' }));
  $('#rvList').replaceChildren(...list.map((r) => {
    const act = (status, label, cls = 'ghost') => { const b = el('button', { className: `btn sm ${cls}`, textContent: label }); b.onclick = async () => { b.disabled = true; try { await post(`/reviews/${r.id}`, { status }); toast('Zapisano.'); loaders.reviews(); } catch (x) { toast(x.message); b.disabled = false; } }; return b; };
    return el('div', { className: 'rv-item' },
      el('div', { className: 'meta' }, stars(r.rating), el('b', { textContent: r.name, style: 'color:var(--ink)' }), el('span', { textContent: r.pkgName }), el('span', { textContent: dt(r.created) }), el('span', { className: 'tag', textContent: RVST[r.status] || r.status }), r.publish ? null : el('span', { className: 'tag', textContent: 'bez zgody na publikację' })),
      r.text ? el('p', { textContent: r.text }) : el('p', { className: 'mute', textContent: 'Sama ocena, bez komentarza.' }),
      el('div', { className: 'actions' }, r.publish && r.status !== 'approved' ? act('approved', 'Opublikuj', '') : null, r.status !== 'hidden' ? act('hidden', 'Ukryj') : null, r.status !== 'spam' ? act('spam', 'Spam', 'danger') : act('new', 'To nie spam')));
  }));
};

// --- wiadomości (kontakt i zapytania firm) ---
let msgFilter = 'new';
$('#msgKind').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; msgFilter = b.dataset.k; $$('#msgKind button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loaders.messages(); });
loaders.messages = async () => {
  const all = await api('/messages'), fresh = all.filter((m) => m.status === 'new').length;
  setMsgBadge(fresh); $('#msgSum').textContent = all.length ? `${fresh} nowych z ${all.length}` : '';
  const list = all.filter((m) => (msgFilter === 'new' ? m.status === 'new' : msgFilter === 'firma' ? m.kind === 'firma' : true));
  if (!list.length) return $('#msgList').replaceChildren(el('div', { className: 'card empty', textContent: msgFilter === 'new' ? 'Nie ma nowych wiadomości.' : 'Brak wiadomości.' }));
  $('#msgList').replaceChildren(...list.map((m) => {
    const act = (fn, label, cls = 'ghost') => { const b = el('button', { className: `btn sm ${cls}`, textContent: label }); b.onclick = async () => { b.disabled = true; try { await fn(); loaders.messages(); } catch (x) { toast(x.message); b.disabled = false; } }; return b; };
    const subj = m.kind === 'firma' ? `Oferta CV Pod Ogłoszenie dla: ${m.org}` : `Re: ${m.topic || 'Twoja wiadomość'}`;
    return el('div', { className: 'rv-item' },
      el('div', { className: 'meta' }, el('span', { className: 'tag', textContent: m.kind === 'firma' ? 'firma / uczelnia' : 'kontakt' }), el('b', { textContent: m.kind === 'firma' ? m.org : m.name || m.email, style: 'color:var(--ink)' }), el('span', { textContent: dt(m.created) }), m.status === 'done' ? el('span', { className: 'tag', textContent: 'załatwione' }) : null),
      kv([['E-mail', m.email], m.name && ['Osoba', m.name], m.phone && ['Telefon', m.phone], m.orgTypeName && ['Typ', m.orgTypeName], m.size && ['Liczba osób', m.size], m.topic && ['Temat', m.topic]]),
      m.message ? el('p', { textContent: m.message, style: 'white-space:pre-wrap' }) : null,
      el('div', { className: 'actions' }, el('a', { className: 'btn sm', href: `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(subj)}`, textContent: 'Odpowiedz' }),
        m.status === 'new' ? act(() => post(`/messages/${m.id}`, { status: 'done' }), 'Załatwione') : act(() => post(`/messages/${m.id}`, { status: 'new' }), 'Oznacz jako nowe'),
        act(() => api(`/messages/${m.id}`, { method: 'DELETE' }), 'Usuń', 'danger')));
  }));
};

// --- newsletter ---
loaders.newsletter = async () => {
  const n = await api('/newsletter');
  $('#nlTiles').replaceChildren(tile('Potwierdzeni', String(n.confirmed), 'dostaną kolejne wydanie'), tile('Czekają na potwierdzenie', String(n.pending), 'usuwani po 7 dniach'),
    tile('Wysyłka', n.sending ? `${n.sending.sent} / ${n.sending.total}` : '—', n.sending ? 'trwa…' : n.mail ? 'gotowa' : 'brak SMTP_URL'));
  $('#nlTest').disabled = !n.mail || !n.testTo; $('#nlSend').disabled = !n.mail || !n.confirmed || !!n.sending;
  if (!n.list.length) return $('#nlTable').replaceChildren(el('div', { className: 'empty', textContent: 'Nikt się jeszcze nie zapisał.' }));
  $('#nlTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, ['E-mail', 'Status', 'Źródło', 'Zapis', ''].map((t) => el('th', { textContent: t })))),
    el('tbody', {}, n.list.map((x) => {
      const del = el('button', { className: 'btn danger sm', textContent: 'Usuń' });
      del.onclick = async () => { try { await api(`/newsletter/${x.id}`, { method: 'DELETE' }); toast('Usunięto z listy.'); loaders.newsletter(); } catch (e) { toast(e.message); } };
      return el('tr', {}, el('td', { textContent: x.email }), el('td', {}, el('span', { className: 'tag', textContent: x.status === 'confirmed' ? 'potwierdzony' : 'czeka' })), el('td', { className: 'mute', textContent: x.source || '—' }), el('td', { className: 'num', textContent: dt(x.confirmedAt || x.created) }), el('td', { className: 'r' }, del));
    }))));
};
async function nlSend(test) {
  const body = { subject: $('#nlSubj').value, text: $('#nlText').value, test };
  if (!test && !confirm('Wysłać to wydanie do wszystkich potwierdzonych subskrybentów?')) return;
  $('#nlMsg').textContent = 'Wysyłanie…';
  try { const r = await post('/newsletter/send', body); $('#nlMsg').textContent = r.test ? 'Test wysłany.' : `Wysyłka rozpoczęta: ${r.total} odbiorców.`; loaders.newsletter(); } catch (x) { $('#nlMsg').textContent = x.message; }
}
$('#nlTest').addEventListener('click', () => nlSend(true));
$('#nlForm').addEventListener('submit', (e) => { e.preventDefault(); nlSend(false); });

// --- ruch ---
let lastTraffic = null, trDays = 30;
const num = (n) => Number(n || 0).toLocaleString('pl-PL');
const visits = (n) => plural(n, 'odwiedzający', 'odwiedzających', 'odwiedzających');
function topTable(rows, head) {
  if (!rows.length) return el('div', { className: 'empty', textContent: 'Brak danych.' });
  const total = rows.reduce((s, [, n]) => s + n, 0) || 1;
  return el('table', {}, el('thead', {}, el('tr', {}, el('th', { textContent: head }), el('th', { className: 'r', textContent: 'Liczba' }), el('th', { className: 'r', textContent: 'Udział' }))),
    el('tbody', {}, rows.map(([k, n]) => el('tr', {}, el('td', { className: 'ell', textContent: k, title: k }), el('td', { className: 'r', textContent: num(n) }), el('td', { className: 'r', textContent: `${Math.round((100 * n) / total)}%` })))));
}
function drawTraffic(t) {
  lastTraffic = t;
  $('#trTiles').replaceChildren(tile('Odwiedzający', num(t.visitors), `ostatnie ${t.days} dni`), tile('Odsłony', num(t.views), `${t.visitors ? (t.views / t.visitors).toFixed(1).replace('.', ',') : 0} na osobę`), tile('Opłacone zamówienia', num(t.paid), `ostatnie ${t.days} dni`), tile('Konwersja', `${String(t.conversion).replace('.', ',')}%`, 'zamówienia / odwiedzający'));
  barChart($('#trChart'), t.byDay, { val: (d) => d.visitors, fmt: (v) => visits(Math.round(v)), axis: (v) => num(Math.round(v)), sub: (d) => `${num(d.views)} odsłon`, label: `Odwiedzający dziennie, ostatnie ${t.days} dni` });
  const top = t.funnel[0][1] || 1;
  $('#trFunnel').replaceChildren(...t.funnel.map(([k, n], i) => el('div', { className: 'fn-row' }, el('span', { textContent: k }), el('div', { className: 'fn-bar' }, el('i', { style: `width:${Math.max(n ? 2 : 0, (100 * n) / top)}%` })), el('b', { className: 'num', textContent: num(n) }), el('small', { className: 'mute', textContent: i ? `${Math.round((100 * n) / top)}%` : '' }))));
  $('#trRefs').replaceChildren(topTable(t.refs, 'Źródło'));
  $('#trPages').replaceChildren(topTable(t.pages, 'Strona'));
  $('#trDevices').textContent = t.devices.map(([k, n]) => `${k}: ${num(n)}`).join(' · ') || '';
}
loaders.traffic = async () => drawTraffic(await api('/traffic?days=' + trDays));
$('#trRange').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; trDays = +b.dataset.k; $$('#trRange button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loaders.traffic(); });

// --- problemy ---
const EV = { 'ogłoszenie': 'Pobieranie ogłoszenia', import: 'Import CV', skaner: 'Skaner CV', asystent: 'Asystent', 'e-mail': 'Wysyłka e-mail', generowanie: 'Generowanie' };
loaders.problems = async () => {
  const r = await api('/problems');
  setBadge(r.orders.length);
  $('#probOrders').replaceChildren(r.orders.length ? orderTable(r.orders) : el('div', { className: 'empty', textContent: 'Wszystko w porządku. Nie ma zamówień wymagających uwagi.' }));
  $('#probEvents').replaceChildren(r.events.length ? el('table', {},
    el('thead', {}, el('tr', {}, ['Kiedy', 'Gdzie', 'Opis', 'Szczegóły'].map((t) => el('th', { textContent: t })))),
    el('tbody', {}, r.events.map((e) => {
      const det = e.meta?.orderId ? el('button', { className: 'link', textContent: 'zamówienie' }) : el('span', { className: 'mute', textContent: e.meta?.host || '—' });
      if (e.meta?.orderId) det.onclick = () => openOrder(e.meta.orderId);
      return el('tr', {}, el('td', { className: 'num', textContent: dt(e.at) }), el('td', { textContent: EV[e.type] || e.type }), el('td', { textContent: e.message }), el('td', {}, det));
    }))) : el('div', { className: 'empty', textContent: 'Brak błędów.' }));
};

// --- eksport ---
const iso = (d) => d.toLocaleDateString('sv-SE');
function setRange(which) {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth() - (which === 'prev' ? 1 : 0);
  $('#eFrom').value = iso(new Date(y, m, 1)); $('#eTo').value = iso(which === 'prev' ? new Date(y, m + 1, 0) : n);
}
$$('[data-range]').forEach((b) => b.addEventListener('click', () => setRange(b.dataset.range)));
$('#expForm').addEventListener('submit', (e) => { e.preventDefault(); if (window.PREVIEW) return toast('W podglądzie pobieranie pliku jest wyłączone.'); location.href = `/api/admin/export.csv?from=${$('#eFrom').value}&to=${$('#eTo').value}`; });
loaders.export = () => { if (!$('#eFrom').value) setRange('this'); };

// --- start ---
async function start() {
  me = await api('/me').catch(() => ({}));
  if (!me.loggedIn) return showLogin();
  $('#loginView').hidden = true; $('#appView').hidden = false; $('#demoNote').hidden = !me.demo;
  const v = location.hash.slice(1);
  go(loaders[v] ? v : 'dash');
}
start();
