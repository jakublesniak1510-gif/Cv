// Atrapa /api/admin dla podglądu: dane ze zrzutu, zmiany tylko w pamięci przeglądarki.
(() => {
  window.PREVIEW = true;
  const S = window.SNAP; let logged = false;
  const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = window.fetch.bind(window);
  const setStatus = (id, patch) => { Object.assign(S.details[id], patch); const r = S.rows.find((x) => x.id === id); if (r) Object.assign(r, patch); };
  window.fetch = async (url, opts = {}) => {
    if (!String(url).startsWith('/api/admin')) return realFetch(url, opts);
    const u = new URL(url, location.href), p = u.pathname.replace('/api/admin', ''), m = (opts.method || 'GET').toUpperCase(), body = opts.body ? JSON.parse(opts.body) : {};
    await new Promise((r) => setTimeout(r, 150));
    if (p === '/me') return json({ loggedIn: logged, totp: false, demo: true });
    if (p === '/login') { if (!body.password) return json({ error: 'Nieprawidłowe hasło.' }, 401); logged = true; return json({ ok: true }); }
    if (!logged) return json({ error: 'Zaloguj się.' }, 401);
    if (p === '/logout') { logged = false; return json({ ok: true }); }
    if (p === '/stats') return json(S.stats);
    if (p === '/orders') {
      const q = (u.searchParams.get('q') || '').toLowerCase(), st = u.searchParams.get('status') || '', page = +u.searchParams.get('page') || 0;
      let l = S.rows;
      if (st) l = l.filter((o) => o.status === st || (st === 'problem' && (o.status === 'paid' || o.mail === 'failed')));
      if (q) l = l.filter((o) => o.email.toLowerCase().includes(q) || o.id.startsWith(q) || (o.code || '').toLowerCase().includes(q));
      return json({ total: l.length, page, rows: l.slice(page * 50, page * 50 + 50) });
    }
    let x = /^\/orders\/([\w-]+)(?:\/(\w+))?$/.exec(p);
    if (x) {
      const [, id, act] = x, o = S.details[id];
      if (!o) return json({ error: 'Nie ma takiego zamówienia.' }, 404);
      if (m === 'GET') return json(o);
      if (m === 'DELETE') { delete S.details[id]; S.rows = S.rows.filter((r) => r.id !== id); return json({ ok: true }); }
      if (act === 'resend') return o.status === 'done' ? json({ ok: true, mail: { status: 'sent' } }) : json({ error: 'Dokumenty nie są jeszcze gotowe.' }, 409);
      if (act === 'regenerate') { setStatus(id, { status: 'done', mail: 'sent', error: null }); return json({ ok: true }); }
    }
    if (p === '/codes' && m === 'GET') return json(S.codes);
    if (p === '/codes' && m === 'POST') {
      const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (code.length < 3) return json({ error: 'Kod musi mieć co najmniej 3 znaki (litery, cyfry, myślnik).' }, 400);
      if (S.codes.some((c) => c.code === code)) return json({ error: 'Taki kod już istnieje.' }, 409);
      S.codes.unshift({ code, kind: 'akcja', amount: body.amount ? +body.amount : null, percent: body.percent ? +body.percent : null, uses: 0, maxUses: +body.maxUses || null, created: Date.now(), expires: Date.now() + (+body.days || 30) * 864e5, note: body.note || '' });
      return json({ ok: true });
    }
    x = /^\/codes\/(.+)$/.exec(p); if (x && m === 'DELETE') { S.codes = S.codes.filter((c) => c.code !== decodeURIComponent(x[1])); return json({ ok: true }); }
    if (p === '/problems') return json({ ...S.problems, orders: S.rows.filter((o) => o.status === 'paid' || o.mail === 'failed') });
    return json({ error: 'Brak w podglądzie.' }, 404);
  };
})();
