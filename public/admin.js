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
    ['Faktury do wystawienia', String(s.invoicesTodo || 0)],
    ['Przygotowane CV (od startu)', `${s.totals.cvs}${s.totals.cvs < 1000 ? ` · licznik na stronie od 1000` : ' · licznik widoczny na stronie'}`],
    ['Konta klientów', String(s.accounts)],
    ['Ocena klientów', s.reviews.count ? `${String(s.reviews.avg).replace('.', ',')} / 5 (${s.reviews.count})` : 'brak ocen'], [`Koszt AI (${s.ai.month})`, `$${s.ai.usd.toFixed(2)} · ${s.ai.calls} wywołań`],
  ].map(([k, v]) => el('div', {}, el('dt', { textContent: k }), el('dd', { textContent: v }))));
  loadSales().catch((x) => toast(x.message));
  setBadge(s.problems); setRvBadge(s.reviews.waiting); setMsgBadge(s.newMessages); $('#invBadge').hidden = !s.invoicesTodo; $('#invBadge').textContent = s.invoicesTodo;
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
      tip.replaceChildren(el('div', { textContent: (o.long || longDay)(d.day, d) }), el('b', { textContent: o.fmt(vals[i]) }), document.createTextNode(` · ${o.sub(d)}`));
      tip.hidden = false;
      const px = ((x + bw / 2) / W) * box.clientWidth, py = (Math.min(y, T + ih - 2) / H) * 240;
      tip.style.left = `${Math.min(Math.max(px, 80), box.clientWidth - 80)}px`; tip.style.top = `${py}px`;
    });
    hit.addEventListener('pointerleave', () => { bar?.classList.remove('on'); tip.hidden = true; });
    svg.append(hit);
    const every = o.every || (days.length > 45 ? 15 : 5);
    if (i % every === every - 1 || i === 0) { const t = sv('text', { class: 'ax', x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }); t.textContent = (o.short || shortDay)(d.day, d); svg.append(t); }
  });
  box.replaceChildren(svg, tip);
}
// Sprzedaż z rejestru (zostaje po skasowaniu zamówień): dziennie (30 dni), tygodniowo (90 dni), miesięcznie (12 miesięcy).
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const monthLong = (k) => new Date(k + '-15T12:00').toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
const weekLong = (_k, d) => `${new Date(d.from + 'T12:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} – ${new Date(d.to + 'T12:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}`;
let salesRange = '30';
function drawChart(rep) {
  const days = rep.series.map((x) => ({ ...x, day: x.key })), unit = rep.unit;
  const label = { day: 'Przychód dziennie, ostatnie 30 dni', week: 'Przychód tygodniowo, ostatnie 90 dni', month: 'Przychód miesięcznie, ostatnie 12 miesięcy' }[unit];
  $('#chartTitle').textContent = label;
  barChart($('#chart'), days, {
    val: (d) => d.revenue, fmt: zl, axis: (v) => `${Math.round(v)} zł`, sub: (d) => ords(d.orders), label,
    short: unit === 'month' ? (k) => MONTHS[+k.slice(5, 7) - 1] : unit === 'week' ? (_k, d) => shortDay(d.from) : shortDay,
    long: unit === 'month' ? monthLong : unit === 'week' ? weekLong : longDay, every: unit === 'day' ? 5 : unit === 'week' ? 2 : 1,
  });
  const name = unit === 'month' ? 'Miesiąc' : unit === 'week' ? 'Tydzień' : 'Dzień', lab = unit === 'month' ? monthLong : unit === 'week' ? weekLong : longDay;
  $('#chartTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: name }), el('th', { className: 'r', textContent: 'Zamówienia' }), el('th', { className: 'r', textContent: 'Przychód' }))),
    el('tbody', {}, [...days].reverse().map((d) => el('tr', {}, el('td', { textContent: lab(d.day, d) }), el('td', { className: 'r', textContent: d.orders }), el('td', { className: 'r', textContent: zl(d.revenue) }))))));
  const t = rep.total;
  $('#salesSum').textContent = `Razem: ${zl(t.revenue)} · ${ords(t.orders)} · średnio ${zl(t.avg)}${t.refunded ? ` · zwroty ${zl(t.refunded)}` : ''}. Kwoty po rabatach i zwrotach.${rep.since ? ` Dane od ${dd(rep.since)}.` : ''}`;
  drawMix(rep);
  lastDays = rep;
}
// Co się sprzedaje: pakiety, dodatki, języki strony i kody (udział w liczbie zamówień z okresu).
function drawMix(rep) {
  const n = rep.total.orders || 1, LN = { pl: 'polski', en: 'angielski', uk: 'ukraiński', de: 'niemiecki' };
  const list = (title, rows, nameOf, empty) => el('div', {}, el('h3', { textContent: title }), rows.length ? el('ul', {}, rows.map((r) => {
    const pct = Math.round((100 * r.n) / n);
    return el('li', {}, el('span', { textContent: nameOf(r) }), el('span', { className: 'n', textContent: `${r.n} · ${pct}% · ${zl(r.revenue)}` }),
      el('div', { className: 'bar-row', role: 'presentation' }, el('i', { style: `width:${Math.max(2, pct)}%` })));
  })) : el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: empty }));
  $('#mixRange').textContent = { day: 'ostatnie 30 dni', week: 'ostatnie 90 dni', month: 'ostatnie 12 miesięcy' }[rep.unit] + (rep.followupShare ? ` · ${rep.followupShare}% to kolejne zamówienia` : '');
  $('#salesMix').replaceChildren(
    list('Pakiety', rep.pkgs, (r) => r.name, 'Brak sprzedaży w tym okresie.'),
    list('Dodatki', rep.addons, (r) => r.name, 'Nikt jeszcze nie dokupił dodatku.'),
    list('Język strony przy zakupie', rep.langs, (r) => LN[r.key] || r.key, '—'),
    list('Kody rabatowe', rep.codes, (r) => r.key, 'Bez kodów.'),
  );
}
async function loadSales() { drawChart(await api('/sales?range=' + salesRange)); }
$('#salesRange').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; salesRange = b.dataset.k;
  $$('#salesRange button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loadSales().catch((x) => toast(x.message));
});
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
        el('td', {}, o.pkgName, o.followup ? el('span', { className: 'tag', textContent: 'kolejne', style: 'margin-left:6px' }) : null, o.invoice ? el('span', { className: 'tag', textContent: o.invoice === 'todo' ? 'faktura do wystawienia' : 'faktura ✓', style: 'margin-left:6px' }) : null),
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
  const addons = [o.addons.interview && 'przygotowanie do rozmowy', o.addons.messages && 'wiadomości do rekrutera', o.addons.linkedin && 'profil LinkedIn', o.addons.sim && 'symulator rozmowy', o.addons.docx && 'wersja Word', ...o.extraLangs.map((l) => `wersja: ${l}`)].filter(Boolean);
  const act = el('div', { className: 'confirm', hidden: true });
  const reload = () => { openOrder(id); loaders[current()]?.(); };
  const run = async (b, fn, ok) => { b.disabled = true; try { await fn(); toast(ok); reload(); } catch (x) { toast(x.message); b.disabled = false; } };
  const bResend = el('button', { className: 'btn ghost sm', textContent: 'Wyślij e-mail ponownie', disabled: o.status !== 'done' });
  bResend.onclick = () => run(bResend, async () => { const r = await post(`/orders/${id}/resend`); if (!r.ok) throw new Error(r.mail.status === 'skipped' ? 'Wysyłka e-mail jest wyłączona (brak ustawień poczty SMTP_USER/SMTP_PASS).' : 'E-mail nie doszedł. Sprawdź adres.'); }, 'E-mail wysłany.');
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
      ['Pakiet', o.pkgName], ['Dodatki', addons.join(', ') || '—'], ['Kwota', o.refunded ? `${zl(o.total)} · zwrócono ${zl(o.refunded)}` : zl(o.total)],
      o.code && ['Kod', `${o.code} (−${zl(o.discount)})`],
      ['Poprawki', `${o.revisions} z 10`], ['Kod klienta', o.myCode || '—'], ['Dane znikną', dd(o.expires)],
    ])),
    el('div', {}, el('h3', { textContent: 'Klient' }), kv([['E-mail', o.email], ['Telefon', o.phone || '—'], ['Zdjęcie', o.hasPhoto ? 'tak' : 'nie'],
      ['Przypomnienie', o.reminder?.consent ? (o.reminder.sent ? 'wysłane' : 'zgoda, jeszcze nie wysłane') : 'bez zgody'], ['Szablon', `${o.design?.tpl || '—'} / ${o.design?.color || '—'}`]])),
    el('div', {}, el('h3', { textContent: `Ogłoszenia (${o.adsList.length})` }), el('ul', { className: 'list' }, o.adsList.map((a, i) => {
      const r = o.results[i];
      return el('li', {}, `${a.title || 'Bez tytułu'} · ${LANG[r?.lang || a.lang] || a.lang}`, r?.score != null ? ` · dopasowanie ${r.score}%` : '', r?.variants.length ? ` · +${r.variants.map((v) => LANG[v] || v).join(', ')}` : '');
    }))),
    refundBox(o, reload),
    invoiceBox(o, reload),
    o.mailInfo ? el('div', {}, el('h3', { textContent: 'E-mail' }), kv([['Do', o.mailInfo.to], ['Status', MAIL[o.mailInfo.status] || o.mailInfo.status], ['Kiedy', dt(o.mailInfo.at)]])) : null,
  ].filter(Boolean));
  x.focus();
}
// Zwrot przez Stripe: całość albo podana kwota, z potwierdzeniem. Pieniądze wracają na kartę/BLIK klienta w kilka dni.
function refundBox(o, reload) {
  if (!['stripe', 'przelewy24'].includes(o.provider) && !o.refunds.length) return null;
  const hist = o.refunds.length ? el('ul', { className: 'list' }, o.refunds.map((r) => el('li', { textContent: `${zl(r.amount)} · ${dt(r.at)} · ${r.source === 'stripe' ? 'w panelu Stripe' : 'z tego panelu'}` }))) : null;
  if (o.provider === 'przelewy24') return el('div', {}, el('h3', { textContent: 'Zwrot' }), el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: 'Płatność przez Przelewy24: zwrot zrób w panelu Przelewy24.' }), hist);
  if (!o.refundable) return el('div', {}, el('h3', { textContent: 'Zwrot' }), el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: o.refunded ? 'Zamówienie zwrócone w całości.' : 'Zwrot niedostępny (brak klucza Stripe).' }), hist);
  const amt = el('input', { type: 'text', inputMode: 'decimal', value: String(o.refundable).replace('.', ','), ariaLabel: 'Kwota zwrotu w zł' });
  const box = el('div', { className: 'confirm', hidden: true });
  const b = el('button', { className: 'btn danger sm', textContent: 'Zwróć pieniądze' });
  b.onclick = () => {
    const v = amt.value.trim();
    const ok = el('button', { className: 'btn danger solid sm', textContent: `Tak, zwróć ${v} zł` }), no = el('button', { className: 'btn ghost sm', textContent: 'Anuluj' });
    no.onclick = () => { box.hidden = true; };
    ok.onclick = async () => { ok.disabled = no.disabled = true; try { const r = await post(`/orders/${o.id}/refund`, { amount: v }); toast(`Zwrot ${zl(r.amount)} zlecony w Stripe.`); reload(); } catch (x) { toast(x.message); ok.disabled = no.disabled = false; } };
    box.replaceChildren(el('strong', { textContent: `Zwrócić klientowi ${v} zł?` }), el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: 'Stripe odda pieniądze tą samą metodą, którą klient zapłacił (zwykle 5–10 dni). Opłaty Stripe za transakcję nie wracają. Tego nie da się cofnąć.' }), el('div', { className: 'actions' }, ok, no));
    box.hidden = false; ok.focus();
  };
  return el('div', {}, el('h3', { textContent: 'Zwrot' }), el('div', { className: 'refund' }, el('label', { className: 'mute', style: 'font-size:14px' }, 'Kwota (zł) ', amt), b), box, hist,
    el('p', { className: 'help', textContent: `Do zwrotu zostało ${zl(o.refundable)}. Dokumenty klienta zostają; jeśli trzeba, usuń dane przyciskiem „Usuń dane”.` }));
}
// Faktura bez VAT na życzenie: dane nabywcy do przepisania w programie do faktur i odhaczenie z numerem.
function invoiceBox(o, reload) {
  const f = o.invoiceData; if (!f) return null;
  // Faktura PDF wystawiona przez stronę: pobranie; gdy jeszcze nie ma, „Wystaw teraz” (numer i e-mail do klienta).
  if (f.pdf) return el('div', {}, el('h3', { textContent: 'Faktura (bez VAT, zw. art. 113)' }), kv([
    ['Numer', `${f.number} (${dt(f.issuedAt)})`], ['Nabywca', f.name], ['Adres', f.address], ['NIP', f.nip || '— (osoba prywatna)'], ['Kwota', zl(o.total)],
  ]), el('div', { className: 'actions' }, el('a', { className: 'btn ghost sm', href: `/api/admin/invoices/${o.id}.pdf`, target: '_blank', rel: 'noopener', textContent: 'Pobierz PDF' })),
  o.refunded ? el('p', { className: 'help', textContent: 'Zamówienie ma zwrot: wystaw fakturę korygującą w swoim programie do faktur.' }) : null);
  const auto = el('button', { className: 'btn sm', textContent: 'Wystaw fakturę PDF teraz', disabled: !['generating', 'paid', 'done'].includes(o.status) });
  auto.onclick = async () => { auto.disabled = true; try { const r = await post(`/orders/${o.id}/invoice/issue`); toast(`Wystawiono ${r.number} i wysłano klientowi.`); reload(); } catch (x) { toast(x.message); auto.disabled = false; } };
  const copy = el('button', { className: 'btn ghost sm', textContent: 'Kopiuj dane' });
  copy.onclick = async () => { try { await navigator.clipboard.writeText([f.name, f.address, f.nip && 'NIP ' + f.nip].filter(Boolean).join('\n')); toast('Skopiowano.'); } catch { toast('Nie udało się skopiować.'); } };
  const num = el('input', { placeholder: 'Numer faktury, np. FV 1/10/2026', maxLength: 60, value: f.number || '', style: 'max-width:240px' });
  const b = el('button', { className: 'btn sm', textContent: f.issued ? 'Cofnij: nie wystawiona' : 'Faktura wystawiona' });
  b.onclick = async () => { b.disabled = true; try { await post(`/orders/${o.id}/invoice`, { issued: !f.issued, number: num.value }); toast(f.issued ? 'Oznaczono jako do wystawienia.' : 'Oznaczono jako wystawioną.'); reload(); } catch (x) { toast(x.message); b.disabled = false; } };
  return el('div', {}, el('h3', { textContent: 'Faktura (bez VAT, zw. art. 113)' }), kv([
    ['Status', f.issued ? `wystawiona${f.number ? ' · ' + f.number : ''} (${dt(f.issuedAt)})` : o.status === 'pending' ? 'czeka na płatność' : 'do wystawienia'],
    ['Nabywca', f.name], ['Adres', f.address], ['NIP', f.nip || '— (osoba prywatna)'], ['Kwota', zl(o.total)],
  ]), el('div', { className: 'actions' }, f.issued ? null : auto, f.issued ? null : num, b, copy));
}
const current = () => $('#nav [aria-current]')?.dataset.v || 'dash';

// --- kody ---
let kind = 'amount', codeFilter = '';
$('#cKind').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
  $$('#cKind button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  $('#cValLbl').textContent = kind === 'amount' ? 'Rabat (zł)' : 'Rabat (%)'; $('#cVal').max = kind === 'amount' ? 70 : 90;
  $('#cValBox').hidden = kind === 'voucher'; $('#cVal').required = kind !== 'voucher'; $('#cPkgBox').hidden = kind !== 'voucher'; $('#cComBox').hidden = kind === 'voucher';
});
$('#codeKind').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; codeFilter = b.dataset.k;
  $$('#codeKind button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loaders.codes();
});
$('#codeForm').addEventListener('submit', async (e) => {
  e.preventDefault(); const m = $('#cMsg'); m.className = 'msg'; m.textContent = '';
  try {
    await post('/codes', { code: $('#cCode').value, [kind]: kind === 'voucher' ? $('#cPkg').value : $('#cVal').value, days: $('#cDays').value, maxUses: $('#cMax').value, note: $('#cNote').value, commission: kind === 'voucher' ? 0 : $('#cCom').value });
    m.className = 'msg good'; m.textContent = `Kod ${$('#cCode').value.toUpperCase()} utworzony.`; $('#cCode').value = $('#cNote').value = $('#cMax').value = $('#cCom').value = '';
    loaders.codes();
  } catch (x) { m.className = 'msg bad'; m.textContent = x.message; }
});
// Kod partnera: ile prowizji czeka na przelew; po przelewie „Wypłacono” zeruje kwotę do wypłaty.
function codePayout(c) {
  const info = el('div', { className: 'mute', style: 'font-size:12px', textContent: `wypłacono ${zl(c.paidOut)}${c.bank ? ` · konto: ${c.bank}` : ' · brak numeru konta'}` });
  if (!c.due) return el('span', {}, el('span', { className: 'tag', textContent: 'do wypłaty 0 zł' }), info);
  const b = el('button', { className: 'btn sm', textContent: `Wypłacono ${zl(c.due)}` });
  b.onclick = async () => {
    if (!confirm(`Czy przelew ${zl(c.due)} dla partnera ${c.code} jest już wysłany?`)) return;
    try { await post(`/codes/${encodeURIComponent(c.code)}/payout`, {}); toast('Prowizja oznaczona jako wypłacona.'); loaders.codes(); } catch (x) { toast(x.message); }
  };
  return el('span', {}, b, info);
}
// Przy kodzie od organizacji: czy organizacja dostała już fakturę (bez VAT) za pakiet.
function codeInvoice(c) {
  if (c.kind === 'partner') return codePayout(c);
  if (c.kind !== 'instytucja') return el('span', { className: 'mute', textContent: '—' });
  if (c.b2b) return el('span', { className: 'tag', textContent: 'faktura automatyczna (Firmy)' });
  const set = async (issued, number) => { try { await post(`/codes/${encodeURIComponent(c.code)}/invoice`, { issued, number }); toast(issued ? 'Faktura oznaczona jako wystawiona.' : 'Cofnięto oznaczenie faktury.'); loaders.codes(); } catch (x) { toast(x.message); } };
  if (c.invoice) { const b = el('button', { className: 'btn ghost sm', textContent: 'Cofnij' }); b.onclick = () => set(false); return el('span', {}, el('span', { className: 'tag', textContent: `✓ ${c.invoice.number || 'wystawiona'}` }), ' ', b); }
  const b = el('button', { className: 'btn sm', textContent: 'Wystawiona' });
  b.onclick = () => { const n = prompt('Numer faktury dla organizacji (opcjonalnie):', ''); if (n !== null) set(true, n); };
  return b;
}
// Link do prywatnej strony statystyk kodu (bez danych osobowych): kopiowany do schowka, tworzony przy pierwszym kliknięciu.
function codeReport(c) {
  if (c.kind === 'klient') return '';
  const b = el('button', { className: 'btn ghost sm', textContent: 'Link do raportu', title: c.report || 'Utworzy prywatny link do statystyk kodu' });
  b.onclick = async () => {
    try {
      const url = c.report || (await post(`/codes/${encodeURIComponent(c.code)}/report`)).url; c.report = url;
      await navigator.clipboard.writeText(url).then(() => toast('Skopiowano link do raportu.'), () => prompt('Link do raportu:', url));
    } catch (x) { toast(x.message); }
  };
  return b;
}
loaders.codes = async () => {
  const list = (await api('/codes')).filter((c) => !codeFilter || c.kind === codeFilter);
  if (!list.length) return $('#codeTable').replaceChildren(el('div', { className: 'empty', textContent: 'Brak kodów.' }));
  $('#codeTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, ['Kod', 'Rodzaj', 'Rabat', 'Użycia', 'Ważny do', 'Notatka', 'Faktura / prowizja', ''].map((t, i) => el('th', { className: i === 2 || i === 3 ? 'r' : '', textContent: t })))),
    el('tbody', {}, list.map((c) => {
      const del = el('button', { className: 'btn danger sm', textContent: 'Usuń' });
      del.onclick = async () => {
        if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; setTimeout(() => { del.dataset.sure = ''; del.textContent = 'Usuń'; }, 3000); return; }
        try { await api('/codes/' + encodeURIComponent(c.code), { method: 'DELETE' }); toast(`Kod ${c.code} usunięty.`); loaders.codes(); } catch (x) { toast(x.message); }
      };
      return el('tr', {}, el('td', { className: 'mono', textContent: c.code }), el('td', {}, el('span', { className: 'tag', textContent: c.kind }), c.referrals ? el('div', { className: 'mute', style: 'font-size:12px', textContent: `${c.referrals} pol. · saldo ${c.credit}` }) : null,
          c.kind === 'partner' ? el('div', { className: 'mute', style: 'font-size:12px', textContent: `${c.commission}% · ${c.sales} sprzed. · ${zl(c.revenue)}` }) : null),
        el('td', { className: 'r', textContent: c.voucher ? `${{ cv: 'CV', cv_letter: 'CV + list', pack3: 'Pakiet 3' }[c.voucher]} gratis` : c.percent ? `−${c.percent}%` : `−${zl(c.amount)}` }),
        el('td', { className: 'r', textContent: c.maxUses ? `${c.uses} / ${c.maxUses}` : String(c.uses) }),
        el('td', { className: 'num', textContent: dd(c.expires) }), el('td', { className: 'ell mute', textContent: c.note || '—' }), el('td', {}, codeInvoice(c)), el('td', { className: 'r' }, codeReport(c), ' ', del));
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
  const list = all.filter((m) => (msgFilter === 'new' ? m.status === 'new' : true));
  if (!list.length) return $('#msgList').replaceChildren(el('div', { className: 'card empty', textContent: msgFilter === 'new' ? 'Nie ma nowych wiadomości.' : 'Brak wiadomości.' }));
  $('#msgList').replaceChildren(...list.map((m) => {
    const act = (fn, label, cls = 'ghost') => { const b = el('button', { className: `btn sm ${cls}`, textContent: label }); b.onclick = async () => { b.disabled = true; try { await fn(); loaders.messages(); } catch (x) { toast(x.message); b.disabled = false; } }; return b; };
    const subj = `Re: ${m.topic || 'Twoja wiadomość'}`;
    return el('div', { className: 'rv-item' },
      el('div', { className: 'meta' }, el('b', { textContent: m.name || m.email, style: 'color:var(--ink)' }), el('span', { textContent: dt(m.created) }), m.status === 'done' ? el('span', { className: 'tag', textContent: 'załatwione' }) : null),
      kv([['E-mail', m.email], m.topic && ['Temat', m.topic]]),
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
    tile('Wysyłka', n.sending ? `${n.sending.sent} / ${n.sending.total}` : '—', n.sending ? 'trwa…' : n.mail ? 'gotowa' : 'brak ustawień poczty'));
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

// --- SEO i lejek (raport tygodniowy) ---
function simpleTable(rows, cols) {
  if (!rows?.length) return el('div', { className: 'empty', textContent: 'Brak danych.' });
  return el('table', {}, el('thead', {}, el('tr', {}, cols.map(([, h, r]) => el('th', { className: r ? 'r' : '', textContent: h })))),
    el('tbody', {}, rows.map((x) => el('tr', {}, cols.map(([k, , r]) => { const v = typeof k === 'function' ? k(x) : x[k]; return el('td', { className: r ? 'r' : 'ell', textContent: v ?? '–', title: r ? '' : String(v ?? '') }); })))));
}
const shortUrl = (u) => String(u || '').replace(/^https?:\/\/[^/]+/, '') || '/';
const QC = [['key', 'Zapytanie'], ['clicks', 'Klik.', 1], ['impressions', 'Wyśw.', 1], ['ctr', 'CTR %', 1], ['position', 'Poz.', 1], ['prevPosition', 'Poz. wcześniej', 1]];
const PC = [[(x) => shortUrl(x.key), 'Strona'], ['type', 'Typ'], ['lang', 'Język'], ['clicks', 'Klik.', 1], ['impressions', 'Wyśw.', 1], ['ctr', 'CTR %', 1], ['position', 'Poz.', 1]];
// --- Dane: anonimowe statystyki wymagań (n < 30 wyszarzone, poza CSV) ---
let daMonth = '';
loaders.data = async () => {
  const d = await api('/stats-agg?month=' + encodeURIComponent(daMonth)), sel = $('#daMonth');
  sel.replaceChildren(el('option', { value: 'last3', textContent: 'Ostatnie 3 miesiące' }), ...[...new Set([d.month === 'last3' ? '' : d.month, ...d.months])].filter(Boolean).map((m) => el('option', { value: m, textContent: m })));
  sel.value = d.month; daMonth = d.month;
  $('#daCsv').href = '/api/admin/stats-agg.csv?month=' + encodeURIComponent(d.month);
  const ok = d.professions.filter((p) => p.ok);
  $('#daTiles').replaceChildren(tile('Ogłoszenia', num(d.professions.reduce((a, p) => a + p.n, 0)), d.label), tile('Zawody', num(d.professions.length), `${ok.length} z n ≥ ${d.minN}`));
  $('#daTable').replaceChildren(!d.professions.length ? el('div', { className: 'empty', textContent: 'Brak danych w tym okresie.' }) : el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: 'Zawód' }), el('th', { className: 'r', textContent: 'n' }), el('th', { textContent: 'Najczęstsze wymagania (wystąpienia, % w CV)' }))),
    el('tbody', {}, d.professions.map((p) => el('tr', { className: p.ok ? '' : 'da-low' },
      el('td', {}, p.name, p.ok ? null : el('div', { className: 'note', textContent: 'za mało danych do publikacji' })),
      el('td', { className: 'r', textContent: num(p.n) }),
      el('td', { className: 'wrap', textContent: p.keywords.map((k) => `${k.kw} (${k.seen}, ${String(k.pct).replace('.', ',')}%)`).join(' · ') || '–' }))))));
};
$('#daMonth').addEventListener('change', (e) => { daMonth = e.target.value; loaders.data().catch((x) => toast(x.message)); });

let seoPoll = null;
loaders.seo = async () => {
  const d = await api('/seo'), r = d.latest, g = r?.gsc;
  const err = d.manual?.error || (d.enabled && r?.gscError) || '';
  $('#seoErr').hidden = !err; $('#seoErrMsg').textContent = err ? `${err} Sprawdź GSC_SA_JSON i GSC_SITE w Render oraz czy konto serwisowe (client_email z klucza) jest dodane jako użytkownik właściwości w Search Console.` : '';
  const b = $('#seoRun'); b.disabled = !!d.manual?.running; b.textContent = d.manual?.running ? 'Generuję raport…' : 'Wygeneruj raport teraz';
  if (d.manual?.running && !seoPoll) seoPoll = setTimeout(() => { seoPoll = null; if (!$('section[data-view="seo"]').hidden) loaders.seo().catch(() => {}); }, 8000);
  $('#seoInfo').textContent = [d.enabled ? 'Search Console połączone.' : 'Search Console nie jest skonfigurowane: ustaw w Render GSC_SA_JSON (klucz konta serwisowego) i GSC_SITE, a konto serwisowe dodaj jako użytkownika w Search Console.', 'Raport powstaje co poniedziałek po 6:30 i przychodzi e-mailem.', d.link ? 'Link tylko do odczytu jest ustawiony (SEO_REPORT_TOKEN).' : 'Link tylko do odczytu: ustaw SEO_REPORT_TOKEN (min. 32 znaki).'].join(' ');
  $('#seoTiles').replaceChildren(...(g ? [tile('Kliknięcia z Google', num(g.totals.cur.clicks), `28 dni, wcześniej ${num(g.totals.prev.clicks)}`), tile('Wyświetlenia', num(g.totals.cur.impressions), `wcześniej ${num(g.totals.prev.impressions)}`), tile('CTR', `${String(g.totals.cur.ctr).replace('.', ',')}%`, `wcześniej ${String(g.totals.prev.ctr).replace('.', ',')}%`), tile('Średnia pozycja', String(g.totals.cur.position).replace('.', ','), `wcześniej ${String(g.totals.prev.position).replace('.', ',')}`)] : [tile('Raport', r ? r.id : 'brak', r?.gscError || 'Kliknij „Wygeneruj teraz”')]));
  $('#seoWeeks').replaceChildren(simpleTable(d.weeks, [['id', 'Tydzień od'], ['clicks', 'Kliknięcia', 1], ['impressions', 'Wyświetlenia', 1], ['visits', 'Wejścia', 1], ['paid', 'Opłacone', 1]]));
  const f = r?.funnel;
  $('#seoFunnel').replaceChildren(f ? simpleTable(f.stages, [['label', 'Etap'], ['n', 'Liczba', 1], [(s) => (s.rate == null ? '–' : `${String(s.rate).replace('.', ',')}%`), '% z poprz.', 1], ...['pl', 'en', 'uk', 'de'].map((l) => [(s) => s.lang[l] || 0, l, 1])]) : el('div', { className: 'empty', textContent: 'Brak raportu.' }));
  $('#seoSrc').replaceChildren(f ? simpleTable(['google', 'youtube', 'facebook', 'instagram', 'tiktok', 'direct', 'inne'].map((k) => ({ k, v: f.stages.map((s) => s.src[k] || 0) })), [['k', 'Źródło'], ...f.stages.map((s, i) => [(x) => x.v[i], s.label, 1])]) : '');
  $('#seoQueries').replaceChildren(simpleTable(g?.queries, QC));
  $('#seoNear').replaceChildren(simpleTable(g?.nearFirstPage, QC));
  $('#seoPages').replaceChildren(simpleTable(g?.pages, PC));
  $('#seoZero').replaceChildren(simpleTable(g?.zeroClickPages, PC));
  $('#seoLang').replaceChildren(simpleTable(g?.byLang, [['key', 'Język'], ['clicks', 'Klik.', 1], ['impressions', 'Wyśw.', 1], ['ctr', 'CTR %', 1]]));
  $('#seoType').replaceChildren(simpleTable(g?.byType, [['key', 'Typ'], ['clicks', 'Klik.', 1], ['impressions', 'Wyśw.', 1], ['ctr', 'CTR %', 1]]));
  $('#seoIdx').replaceChildren(g?.inspection?.error ? el('p', { className: 'help', textContent: g.inspection.error }) : '', simpleTable(g ? Object.entries(g.inspection.states).map(([k, v]) => ({ k, v })) : [], [['k', 'Stan'], ['v', 'Adresów', 1]]), simpleTable(g?.inspection.rows, [[(x) => shortUrl(x.url), 'Adres'], ['coverage', 'Stan'], [(x) => (x.googleCanonical && x.googleCanonical !== x.userCanonical ? shortUrl(x.googleCanonical) : '–'), 'Inna strona główna wg Google'], ['lastCrawl', 'Ostatnie pobranie']]));
};
$('#seoRun').addEventListener('click', async () => {
  const b = $('#seoRun'); if (b.disabled) return; b.disabled = true;
  try { await post('/seo/run'); toast('Generuję raport (zwykle 1–3 minuty). Tabela odświeży się sama, a kopia przyjdzie e-mailem.'); } catch (x) { toast(x.message); }
  await loaders.seo().catch(() => {});
});

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
$$('[data-range]').forEach((b) => b.addEventListener('click', () => { setRange(b.dataset.range); loadInvoices().catch(() => {}); }));
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

// --- zapytania od firm ---
// Zamówienia paczek kodów (instytucje): płatność, wykorzystanie, faktura, raport.
const B2BST = { paid: 'opłacona', unpaid: 'czeka na przelew', refunded: 'zwrot', new: 'nieopłacona (płatność online)', approval: 'czeka na zatwierdzenie', rejected: 'odrzucone' };
async function loadB2b() {
  const list = await api('/b2b'), late = list.filter((b) => (b.overdue && !b.deactivated) || b.status === 'approval').length;
  $('#b2bBadge').hidden = !late; $('#b2bBadge').textContent = late;
  if (!list.length) return $('#b2bTable').replaceChildren(el('div', { className: 'empty', textContent: 'Brak zamówień paczek kodów.' }));
  $('#b2bTable').replaceChildren(el('div', { className: 'tbl-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, ['Data', 'Organizacja', 'Pakiet', 'Kwota', 'Płatność', 'Kod', ''].map((t, i) => el('th', { className: i === 3 ? 'r' : '', textContent: t })))),
    el('tbody', {}, list.map((b) => {
      const acts = el('td', { className: 'r' });
      if (b.status === 'unpaid') { const x = el('button', { className: 'btn sm', textContent: 'Opłacona' }); x.onclick = async () => { if (!confirm(`Czy przelew ${zl(b.total / 100)} od ${b.org} dotarł?`)) return; try { await post(`/b2b/${b.id}/paid`); toast('Oznaczono jako opłaconą.'); loadB2b(); } catch (e) { toast(e.message); } }; acts.append(x, ' '); }
      if (b.status === 'approval') {
        const ok = el('button', { className: 'btn sm', textContent: 'Zatwierdź' }), no = el('button', { className: 'btn ghost sm', textContent: 'Odrzuć' });
        ok.onclick = async () => { if (!confirm(`Zatwierdzić ${b.qty} kodów dla ${b.org} z fakturą na 14 dni? Kod zacznie działać od razu.`)) return; ok.disabled = true; try { const r = await post(`/b2b/${b.id}/approve`); toast(`Zatwierdzono. Kod ${r.code} i faktura wysłane.`); loadB2b(); } catch (e) { toast(e.message); ok.disabled = false; } };
        no.onclick = async () => { if (!confirm(`Odrzucić zamówienie ${b.org}? Zamawiający dostanie uprzejmy e-mail.`)) return; try { await post(`/b2b/${b.id}/reject`); toast('Odrzucono.'); loadB2b(); } catch (e) { toast(e.message); } };
        acts.append(ok, ' ', no);
      }
      if (b.deactivated && b.status === 'unpaid' && b.invoiceNumber && !b.corrected) { const x = el('button', { className: 'btn ghost sm', textContent: 'Korekta wystawiona', title: `Faktura korygująca do ${b.invoiceNumber}` }); x.onclick = async () => { try { await post(`/b2b/${b.id}/corrected`); toast('Zapisano.'); loadB2b(); } catch (e) { toast(e.message); } }; acts.append(x, ' '); }
      if (b.code && !b.deactivated && b.status !== 'refunded') { const x = el('button', { className: 'btn ghost sm', textContent: 'Wyłącz kod' }); x.onclick = async () => { if (!confirm(`Wyłączyć kod ${b.code}? Zostaną tylko już wykorzystane użycia.`)) return; try { await post(`/b2b/${b.id}/deactivate`); toast('Kod wyłączony.'); loadB2b(); } catch (e) { toast(e.message); } }; acts.append(x); }
      const pay = el('span', { className: `st ${b.status === 'paid' ? 'done' : b.overdue ? 'paid' : 'pending'}`, textContent: b.overdue ? `po terminie (${dd(b.due)})` : B2BST[b.status] || b.status, title: b.approvalReason || '' });
      return el('tr', {}, el('td', { className: 'num', textContent: dd(b.created) }),
        el('td', {}, b.org, el('div', { className: 'mute', style: 'font-size:12px' }, el('a', { href: 'mailto:' + b.email, textContent: b.email }), b.nip ? ` · NIP ${b.nip}` : '')),
        el('td', { textContent: `${b.pkgName} × ${b.qty}` }), el('td', { className: 'r', textContent: zl(b.total / 100) }),
        el('td', {}, pay, b.invoiceNumber ? el('div', { style: 'font-size:12px' }, el('a', { href: `/api/admin/b2b/${b.id}/invoice.pdf`, target: '_blank', textContent: b.invoiceNumber })) : null),
        el('td', {}, b.code ? el('span', { className: 'mono', textContent: b.code }) : '—', b.code ? el('div', { className: 'mute', style: 'font-size:12px' }, `${b.used} / ${b.qty} użyć${b.deactivated ? ' · wyłączony' : ''} · `, b.report ? el('a', { href: b.report, target: '_blank', textContent: 'raport' }) : '') : null),
        acts);
    })))));
}
// Zgłoszenia do programu partnerskiego.
loaders.partners = async () => {
  const list = await api('/partners'), waiting = list.filter((a) => a.status === 'new').length;
  $('#partBadge').hidden = !waiting; $('#partBadge').textContent = waiting;
  if (!list.length) return $('#partTable').replaceChildren(el('div', { className: 'empty', textContent: 'Brak zgłoszeń.' }));
  const ST2 = { new: 'nowe', approved: 'zatwierdzone', rejected: 'odrzucone' };
  $('#partTable').replaceChildren(el('div', { className: 'tbl-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, ['Data', 'Partner', 'Kanał / instytucja', 'Obserwujący / osób', 'Odbiorcy', 'Stan', ''].map((t, i) => el('th', { className: i === 3 ? 'r' : '', textContent: t })))),
    el('tbody', {}, list.map((a) => {
      const acts = el('td', { className: 'r' });
      if (a.status === 'new') {
        const ok = el('button', { className: 'btn sm', textContent: 'Zatwierdź' }), no = el('button', { className: 'btn ghost sm', textContent: 'Odrzuć' });
        ok.onclick = async () => { ok.disabled = true; try { const r = await post(`/partners/${a.id}/approve`); toast(`Zatwierdzono. Kod ${r.code} wysłany do partnera.`); loaders.partners(); } catch (e) { toast(e.message); ok.disabled = false; } };
        no.onclick = async () => { if (!confirm(`Odrzucić zgłoszenie: ${a.name}? Partner dostanie krótki e-mail.`)) return; try { await post(`/partners/${a.id}/reject`); toast('Odrzucono.'); loaders.partners(); } catch (e) { toast(e.message); } };
        acts.append(ok, ' ', no);
      }
      const adv = a.kind === 'advisor';
      return el('tr', {}, el('td', { className: 'num', textContent: dd(a.created) }),
        el('td', {}, a.name, adv ? el('span', { className: 'tag', style: 'margin-left:6px', textContent: 'doradca, kod 0 zł' }) : null, el('div', { className: 'mute', style: 'font-size:12px' }, el('a', { href: 'mailto:' + a.email, textContent: a.email }))),
        el('td', {}, adv ? `${a.org}${a.role ? ` (${a.role})` : ''}` : el('a', { href: a.channel, target: '_blank', rel: 'noopener noreferrer', textContent: a.platform || 'link' })),
        el('td', { className: 'r', textContent: (adv ? a.group : a.followers) ? (adv ? a.group : a.followers).toLocaleString('pl-PL') : '—' }), el('td', { className: 'mute', textContent: adv ? 'grupa uczniów / studentów' : a.audience || '—' }),
        el('td', {}, el('span', { className: 'tag', textContent: ST2[a.status] || a.status }), a.code ? el('div', { className: 'mono', style: 'font-size:12px', textContent: a.code }) : null), acts);
    })))));
};
// Mini-CRM kontaktów B2B.
let ctData = null; const ctSel = new Set();
const plLetters = (n) => (n === 1 ? 'list' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'listy' : 'listów');
// „Listy PDF” i „Paczka envelo (ZIP)”: pobranie pliku dla zaznaczonych kontaktów z adresem, potem status „list wysłany”.
async function ctDownload(btn, path, ext) {
  if (!ctSel.size) return toast('Zaznacz kontakty (pole wyboru w pierwszej kolumnie).');
  if (btn.disabled) return; const label = btn.textContent; btn.disabled = true; btn.textContent = 'Generuję…'; $('#ctLetMsg').textContent = '';
  try {
    const r = await fetch('/api/admin/contacts/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, credentials: 'same-origin', body: JSON.stringify({ ids: [...ctSel] }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Błąd ${r.status}`);
    const name = (r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || `${path}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    const url = URL.createObjectURL(await r.blob()), a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    const n = +r.headers.get('X-Letters'), na = +r.headers.get('X-No-Address');
    let bad = []; try { bad = JSON.parse(decodeURIComponent(r.headers.get('X-Skipped') || '[]')); } catch {}
    const msg = `Pobrano: ${name} (${n} ${plLetters(n)}${na ? `, pominięto ${na} bez adresu` : ''}${bad.length ? `, pominięto ${bad.length} z adresem do poprawy: ${bad.map((x) => `${x.name} – ${x.reason}`).join('; ')}` : ''}). Status „list wysłany” ustawiony przy nowych kontaktach.`;
    $('#ctLetMsg').textContent = msg; toast(msg);
    ctSel.clear(); loaders.contacts();
  } catch (x) { toast(x.message); } finally { btn.disabled = false; btn.textContent = label; }
}
$('#ctLetters').addEventListener('click', (e) => ctDownload(e.currentTarget, 'letters', 'pdf'));
$('#ctEnvelo').addEventListener('click', (e) => ctDownload(e.currentTarget, 'envelo', 'zip'));
$('#ctBulkGo').addEventListener('click', async () => {
  const sel = $('#ctBulk'), btn = $('#ctBulkGo'), status = sel.value;
  if (!status) return toast('Wybierz status z listy „Zmień status zaznaczonych…”.');
  if (!ctSel.size) return toast('Zaznacz kontakty (pole wyboru w pierwszej kolumnie).');
  const n = ctSel.size;
  if (status === 'odmowa' ? !confirm(`Odmowa dla ${n} kontaktów: kontakty zostaną usunięte, a ich e-maile trafią na listę blokad. Kontynuować?`) : !confirm(`Zmienić status ${n} zaznaczonych kontaktów na „${status}”?${status === 'nowy' ? ' Data wysłania listu zostanie wyczyszczona.' : ''}`)) return;
  if (btn.disabled) return; btn.disabled = sel.disabled = true;
  try { const r = await post('/contacts/bulk-status', { ids: [...ctSel], status }); const msg = `Zmieniono status: ${r.changed} z ${r.total} na „${status}”.`; $('#ctLetMsg').textContent = msg; toast(msg); ctSel.clear(); sel.value = ''; loaders.contacts(); }
  catch (x) { toast(x.message); } finally { btn.disabled = sel.disabled = false; }
});
$('#ctImport').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = $('#ctFile').files[0]; if (!f) return toast('Wybierz plik CSV.');
  try { const r = await post('/contacts/import', { csv: await f.text() }); $('#ctMsg').textContent = `Dodano ${r.added} z ${r.rows}. Duplikaty: ${r.dupes}, na liście blokad: ${r.blocked}, bez e-maila i adresu: ${r.invalid}.${r.noEmail ? ` Bez e-maila (tylko list): ${r.noEmail}.` : ''}`; $('#ctFile').value = ''; loaders.contacts(); }
  catch (x) { toast(x.message); }
});
['#ctStatus', '#ctSeg', '#ctPrio', '#ctQ'].forEach((s) => $(s).addEventListener('input', () => drawContacts()));
loaders.contacts = async () => {
  ctData = await api('/contacts');
  if ($('#ctStatus').options.length === 1) ctData.statuses.forEach((x) => $('#ctStatus').append(el('option', { value: x, textContent: x })));
  if ($('#ctBulk').options.length === 1) ctData.statuses.filter((x) => x !== 'zgoda na ofertę').forEach((x) => $('#ctBulk').append(el('option', { value: x, textContent: `→ ${x}` })));
  if ($('#ctSeg').options.length === 1) Object.entries(ctData.segments).forEach(([k, v]) => $('#ctSeg').append(el('option', { value: k, textContent: v })));
  drawContacts();
};
function drawContacts() {
  const st = $('#ctStatus').value, sg = $('#ctSeg').value, pr = $('#ctPrio').value, q = $('#ctQ').value.trim().toLowerCase();
  const list = ctData.list.filter((c) => (!st || c.status === st) && (!sg || c.segment === sg) && (!pr || String(c.priority || 0) === pr) && (!q || `${c.org} ${c.city} ${c.email} ${c.address || ''}`.toLowerCase().includes(q)));
  $('#ctSum').textContent = `${list.length} z ${ctData.list.length} · na liście blokad: ${ctData.blocked}`;
  if (!list.length) return $('#ctTable').replaceChildren(el('div', { className: 'empty', textContent: ctData.list.length ? 'Brak kontaktów dla tego filtra.' : 'Brak kontaktów. Zaimportuj plik CSV.' }));
  const save = async (c, patch, ok) => { try { const r = await post(`/contacts/${c.id}`, patch); if (ok) toast(ok); if (!r.contact) return loaders.contacts(); Object.assign(c, r.contact); drawContacts(); } catch (x) { toast(x.message); drawContacts(); } };
  $('#ctTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, (() => { const all = el('input', { type: 'checkbox', ariaLabel: 'Zaznacz wszystkie widoczne', title: 'Zaznacz wszystkie widoczne (po filtrach)', checked: list.every((c) => ctSel.has(c.id)) }); all.onchange = () => { list.forEach((c) => (all.checked ? ctSel.add(c.id) : ctSel.delete(c.id))); toast(`Zaznaczone: ${ctSel.size}`); drawContacts(); }; return el('th', {}, all); })(), ['Organizacja', 'Kontakt', 'Segment', 'Prio', 'Status', 'Zgoda (jak i kiedy)', 'Notatka', ''].map((t) => el('th', { textContent: t })))),
    el('tbody', {}, list.slice(0, 300).map((c) => {
      const sel = el('select', { ariaLabel: 'Status' }, ctData.statuses.map((x) => el('option', { value: x, textContent: x, selected: x === c.status })));
      sel.onchange = () => { if (sel.value === 'odmowa' && !confirm(c.email ? 'Odmowa usuwa kontakt i zostawia sam e-mail na liście blokad. Kontynuować?' : 'Odmowa usuwa kontakt. Kontynuować?')) { sel.value = c.status; return; } save(c, { status: sel.value, consent: cons.value }, sel.value === 'odmowa' ? 'Kontakt usunięty, e-mail na liście blokad.' : 'Zapisano.'); };
      const seg = el('select', { ariaLabel: 'Segment' }, Object.entries(ctData.segments).map(([k, v]) => el('option', { value: k, textContent: v, selected: k === c.segment })));
      seg.onchange = () => save(c, { segment: seg.value }, 'Zapisano.');
      const pri = el('select', { ariaLabel: 'Priorytet' }, ['', '1', '2', '3'].map((x) => el('option', { value: x, textContent: x || '—', selected: x === String(c.priority || '') })));
      pri.onchange = () => save(c, { priority: pri.value || null }, 'Zapisano.');
      const cons = el('input', { value: c.consent?.text || '', placeholder: 'np. odpisali na list 28.10 mailem', maxLength: 500 });
      cons.onchange = () => save(c, { consent: cons.value }, 'Zapisano zgodę.');
      const note = el('input', { value: c.note || '', maxLength: 1000 }); note.onchange = () => save(c, { note: note.value }, 'Zapisano notatkę.');
      const send = el('button', { className: 'btn sm', textContent: 'Wyślij ofertę', disabled: !c.email || c.status !== 'zgoda na ofertę' || !c.consent?.text, title: !c.email ? 'brak e-maila – tylko list' : c.status !== 'zgoda na ofertę' ? 'Najpierw ustaw status „zgoda na ofertę” i opisz zgodę' : '' });
      send.onclick = async () => { if (!confirm(`Wysłać ofertę (${ctData.segments[c.segment]}) na ${c.email}?`)) return; send.disabled = true; try { await post(`/contacts/${c.id}/offer`); toast('Oferta wysłana.'); loaders.contacts(); } catch (x) { toast(x.message); send.disabled = false; } };
      const del = el('button', { className: 'btn danger sm', textContent: 'Usuń' });
      del.onclick = async () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; return; } try { await api('/contacts/' + c.id, { method: 'DELETE' }); loaders.contacts(); } catch (x) { toast(x.message); } };
      const pick = el('input', { type: 'checkbox', ariaLabel: `Zaznacz ${c.org || c.email}`, checked: ctSel.has(c.id) }); pick.onchange = () => (pick.checked ? ctSel.add(c.id) : ctSel.delete(c.id));
      return el('tr', {}, el('td', {}, pick), el('td', {}, c.org || '—', el('div', { className: 'mute', style: 'font-size:12px', textContent: [c.city, c.dept].filter(Boolean).join(' · ') + (c.address ? '' : ' · brak adresu') }), c.letter ? el('div', { className: 'mute', style: 'font-size:12px', textContent: `list ${dd(c.letter.at)}` }) : null),
        el('td', {}, c.email ? el('a', { href: 'mailto:' + c.email, textContent: c.email }) : el('span', { className: 'mute', textContent: 'brak e-maila – tylko list' }), c.phone ? el('div', { className: 'mute', style: 'font-size:12px', textContent: c.phone }) : null),
        el('td', {}, seg), el('td', {}, pri), el('td', {}, sel, c.offer ? el('div', { className: 'mute', style: 'font-size:12px', textContent: `oferta ${dd(c.offer.at)}${c.reminder ? `, przyp. ${dd(c.reminder.at)}` : ''}` }) : null),
        el('td', {}, cons), el('td', {}, note), el('td', { className: 'r' }, send, ' ', del));
    }))));
}
loaders.leads = async () => {
  loadB2b().catch((e) => toast(e.message));
  const list = await api('/leads');
  if (!list.length) return $('#leadTable').replaceChildren(el('div', { className: 'empty', textContent: 'Brak zapytań.' }));
  $('#leadTable').replaceChildren(el('table', {},
    el('thead', {}, el('tr', {}, ['Data', 'Instytucja', 'Osoba', 'Kontakt', 'Osób', 'Wiadomość', ''].map((t, i) => el('th', { className: i === 4 ? 'r' : '', textContent: t })))),
    el('tbody', {}, list.map((l) => {
      const del = el('button', { className: 'btn danger sm', textContent: 'Usuń' });
      del.onclick = async () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Na pewno?'; return; } try { await api('/leads/' + l.id, { method: 'DELETE' }); loaders.leads(); } catch (x) { toast(x.message); } };
      return el('tr', {}, el('td', { className: 'num', textContent: dd(l.created) }), el('td', { textContent: l.org }), el('td', { textContent: l.name }),
        el('td', {}, el('a', { href: 'mailto:' + l.email, textContent: l.email }), l.phone ? el('div', { className: 'mute', textContent: l.phone }) : ''),
        el('td', { className: 'r', textContent: l.count || '—' }), el('td', { className: 'mute', textContent: l.msg || '—' }), el('td', { className: 'r' }, del));
    }))));
};

// --- ustawienia i kopia zapasowa ---
loaders.settings = async () => {
  const st = await api('/settings'), f = $('#setForm');
  for (const k of ['orderMail', 'dailyMail', 'backupMail', 'autoInvoice']) f.elements[k].checked = !!st[k];
  $('#setTo').textContent = st.mail ? (st.to ? `Wysyłamy na: ${st.to} (zmienna BACKUP_EMAIL albo CONTACT_EMAIL).` : 'Ustaw CONTACT_EMAIL w Render, żeby dostawać te e-maile.') : 'Poczta wyłączona: ustaw SMTP_USER i SMTP_PASS w Render.';
};
$('#setForm').addEventListener('change', async (e) => {
  const m = $('#setMsg'); m.className = 'msg';
  try { await post('/settings', { [e.target.name]: e.target.checked }); m.className = 'msg good'; m.textContent = 'Zapisano.'; } catch (x) { m.className = 'msg bad'; m.textContent = x.message; e.target.checked = !e.target.checked; }
});
$('#setTest').addEventListener('click', async (e) => {
  const b = e.target, m = $('#setMsg'); b.disabled = true; m.className = 'msg'; m.textContent = 'Wysyłam…';
  try { const r = await post('/settings/test-daily'); m.className = 'msg good'; m.textContent = r.backup ? 'Wysłane, z kopią w załączniku. Sprawdź skrzynkę.' : 'Wysłane (kopia za duża na e-mail: pobierz ją przyciskiem obok).'; }
  catch (x) { m.className = 'msg bad'; m.textContent = x.message; } finally { b.disabled = false; }
});
$('#rsFile').addEventListener('change', () => { $('#rsBtn').disabled = !$('#rsFile').files.length; $('#rsConfirm').hidden = true; });
$('#rsBtn').addEventListener('click', () => {
  const file = $('#rsFile').files[0]; if (!file) return;
  const box = $('#rsConfirm'), m = $('#rsMsg');
  const ok = el('button', { className: 'btn danger solid sm', textContent: 'Tak, przywróć' }), no = el('button', { className: 'btn ghost sm', textContent: 'Anuluj' });
  no.onclick = () => { box.hidden = true; };
  ok.onclick = async () => {
    ok.disabled = no.disabled = true; m.className = 'msg'; m.textContent = 'Przywracam…';
    try {
      const r = await fetch('/api/admin/restore', { method: 'POST', headers: { 'Content-Type': 'application/gzip', 'X-Admin': '1' }, credentials: 'same-origin', body: file });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `Błąd ${r.status}`);
      m.className = 'msg good'; m.textContent = `Przywrócono kopię z ${dt(j.created)} (${j.restored.length} plików). Poprzedni stan zapisany na serwerze jako ${j.savedBefore}.`; box.hidden = true;
    } catch (x) { m.className = 'msg bad'; m.textContent = x.message; ok.disabled = no.disabled = false; }
  };
  box.replaceChildren(el('strong', { textContent: `Przywrócić dane z pliku ${file.name}?` }), el('p', { className: 'mute', style: 'margin:0;font-size:14px', textContent: 'Obecne zamówienia, kody, opinie i inne dane zostaną zastąpione zawartością kopii. Zamówienia złożone po jej utworzeniu znikną z panelu (zostaną w zapisanym stanie sprzed przywrócenia).' }), el('div', { className: 'actions' }, ok, no));
  box.hidden = false; ok.focus();
});

// --- faktury (zakładka Eksport) ---
async function loadInvoices() {
  const q = new URLSearchParams({ from: $('#eFrom').value || '', to: $('#eTo').value || '' });
  $('#invCsv').href = '/api/admin/invoices.csv?' + q;
  const list = await api('/invoices?' + q);
  $('#invTable').replaceChildren(list.length ? el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: 'Numer' }), el('th', { textContent: 'Data' }), el('th', { textContent: 'Nabywca' }), el('th', { textContent: 'NIP' }), el('th', { className: 'r', textContent: 'Kwota' }), el('th', { textContent: 'PDF' }))),
    el('tbody', {}, list.reverse().map((i) => el('tr', {}, el('td', { className: 'mono', textContent: i.number }), el('td', { textContent: dd(i.issued) }), el('td', { className: 'ell', textContent: i.buyer, title: i.buyer }), el('td', { className: 'mono', textContent: i.nip || '—' }), el('td', { className: 'r', textContent: zl(i.total) }),
      el('td', {}, el('a', { href: `/api/admin/invoices/${i.id}.pdf`, target: '_blank', rel: 'noopener', textContent: 'Otwórz' })))))) : el('div', { className: 'empty', textContent: 'Brak faktur w tym okresie.' }));
}
const prevExport = loaders.export;
loaders.export = async () => { await prevExport?.(); await loadInvoices().catch((x) => toast(x.message)); };
$('#eFrom').addEventListener('change', () => loadInvoices().catch(() => {}));
$('#eTo').addEventListener('change', () => loadInvoices().catch(() => {}));
