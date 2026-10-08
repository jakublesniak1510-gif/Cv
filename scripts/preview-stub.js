// Atrapa API dla podglądu statycznego: ta sama strona, ale bez serwera, płatności i AI.
(() => {
  const orders = {};
  const P = { cv: 3900, cv_letter: 4900, extraAd: 2000, interview: 1500, messages: 900 };
  const MAXREV = 10;
  const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const total = (pkg, n, a, fu) => (fu ? P.extraAd * n : P[pkg] + P.extraAd * (n - 1)) + (a.interview ? P.interview : 0) + (a.messages ? P.messages : 0);
  const score = (m) => ({ ...m, score: m.found.length + m.missing.length ? Math.round((100 * m.found.length) / (m.found.length + m.missing.length)) : null });
  const view = (o) => ({ id: o.id, pkg: o.pkg, addons: o.addons, total: o.total, status: o.status, results: o.results, mail: o.mail, design: o.design, photo: o.profile.photo || '', parentId: o.parentId || null, revisionsLeft: MAXREV - o.revisions, expires: o.created + 30 * 864e5 });
  const make = (fields) => { const id = 'preview-' + Math.random().toString(36).slice(2); orders[id] = { id, status: 'pending', revisions: 0, created: Date.now(), ...fields }; return orders[id]; };
  window.fetch = async (url, opts = {}) => {
    const m = (opts.method || 'GET').toUpperCase(), body = opts.body ? JSON.parse(opts.body) : {};
    if (url === '/api/config') return json({ demo: true, preview: true, ai: false, maxAds: 5, noPrint: true, fakeFetch: true, maxRevisions: MAXREV, prices: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v / 100])) });
    if (url === '/content.json') return json({ PROFESSIONS, ARTICLES });
    if (url === '/api/fetch-ad' && m === 'POST') {
      const u = (body.url || '').trim();
      await wait(700);
      try { const p = new URL(u); if (!/^https?:$/.test(p.protocol)) throw 0; } catch { return json({ error: 'To nie wygląda na poprawny link.' }, 422); }
      if (/linkedin|blad|zaloguj/i.test(u)) return json({ error: 'Serwis odrzucił zapytanie (kod 403).' }, 422);
      if (/magazyn/i.test(u)) return json({ title: 'Magazynier', company: 'Hurtownia Sigma', text: 'Poszukujemy magazyniera do pracy w hurtowni w Krakowie.\nZakres obowiązków: przyjmowanie i wydawanie towaru, obsługa wózka widłowego, inwentaryzacja, praca z dokumentacją magazynową.\nWymagania: uprawnienia na wózki widłowe, rzetelność, praca zmianowa.\nOferujemy: umowę o pracę, premię kwartalną.' });
      return json({ title: 'Specjalista ds. obsługi klienta', company: 'Nova Serwis', text: 'Do biura obsługi poszukujemy specjalisty ds. obsługi klienta.\nZakres obowiązków: obsługa zgłoszeń, rozwiązywanie reklamacji, praca w systemie CRM.\nWymagania: min. 2 lata doświadczenia, znajomość angielskiego, komunikatywność.\nOferujemy: umowę o pracę, pakiet medyczny, elastyczne godziny.' });
    }
    if (url === '/api/import' && m === 'POST') {
      await wait(1200);
      return json({ ai: true, profile: { name: 'Marek Wiśniewski', email: 'marek.wisniewski@example.com', phone: '+48 600 000 123', city: 'Poznań', headline: 'Magazynier', summary: 'Od sześciu lat pracuję w magazynach i hurtowniach.', experience: [{ title: 'Magazynier', company: 'Hurtownia Polar Sp. z o.o.', from: '04.2021', to: 'obecnie', description: 'Przyjmowanie i wydawanie towaru\nObsługa wózka widłowego\nInwentaryzacje kwartalne' }, { title: 'Pracownik magazynu', company: 'Logistyka Wschód', from: '02.2018', to: '03.2021', description: 'Kompletowanie zamówień ze skanerem\nPraca zmianowa' }], education: [{ school: 'Technikum Logistyczne w Poznaniu', degree: 'Technik logistyk', from: '2013', to: '2017' }], skills: 'obsługa wózka widłowego, inwentaryzacja, skaner, praca zmianowa, Excel', languages: 'angielski A2', certificates: 'Uprawnienia UDT na wózki widłowe' } });
    }
    if (url === '/api/orders' && m === 'POST') {
      const ads = (body.ads || []).filter((a) => a.text && a.text.length >= 80);
      if (!body.consent) return json({ error: 'Wymagana zgoda na przetwarzanie danych.' }, 400);
      if (!ads.length) return json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' }, 400);
      const a = body.addons || {};
      const o = make({ design: body.design, pkg: body.pkg, addons: a, profile: body.profile, ads, total: total(body.pkg, ads.length, a) });
      return json({ id: o.id, demo: true });
    }
    let r;
    if ((r = /^\/api\/orders\/([^/]+)\/followup$/.exec(url)) && m === 'POST') {
      const p = orders[r[1]], ads = (body.ads || []).filter((a) => a.text && a.text.length >= 80);
      if (!ads.length) return json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' }, 400);
      const o = make({ parentId: p.id, design: p.design, pkg: p.pkg, addons: {}, profile: p.profile, ads, total: total(p.pkg, ads.length, {}, true) });
      return json({ id: o.id, demo: true });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/demo-pay$/.exec(url)) && m === 'POST') {
      const o = orders[r[1]]; o.status = 'generating';
      setTimeout(() => { o.results = o.ads.map((ad) => { const x = tailor({ profile: o.profile, ad, withLetter: o.pkg === 'cv_letter', addons: o.addons }); return { ...x, match: score(x.match) }; }); o.status = 'done'; o.mail = { status: 'sent', to: o.profile.email }; }, 2200);
      return json({ ok: true });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/design$/.exec(url)) && m === 'POST') { const o = orders[r[1]]; if (o) o.design = body; return json({ design: body }); }
    if ((r = /^\/api\/orders\/([^/]+)\/resend$/.exec(url)) && m === 'POST') return json({ mail: orders[r[1]].mail });
    if ((r = /^\/api\/orders\/([^/]+)\/results\/(\d+)$/.exec(url)) && m === 'PUT') {
      const o = orders[r[1]], x = { ...o.results[+r[2]] };
      if (body.cv) x.cv = body.cv; if (typeof body.letter === 'string') x.letter = body.letter;
      o.results[+r[2]] = x; return json({ result: x });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/revise$/.exec(url)) && m === 'POST') {
      await wait(900);
      const o = orders[r[1]];
      if (o.revisions >= MAXREV) return json({ error: 'Wykorzystano limit poprawek.' }, 429);
      const out = reviseFallback({ result: o.results[body.i], doc: body.doc, instruction: body.instruction });
      const x = { ...o.results[body.i], ...(body.doc === 'letter' ? { letter: out.letter } : { cv: out.cv }) };
      if (body.resolves && x.match) { const found = [...x.match.found, body.resolves], missing = x.match.missing.filter((k) => k.keyword !== body.resolves); x.match = score({ found, missing }); }
      o.results[body.i] = x; o.revisions++;
      return json({ result: x, note: out.note, revisionsLeft: MAXREV - o.revisions });
    }
    if ((r = /^\/api\/orders\/([^/]+)$/.exec(url)) && orders[r[1]]) return json(view(orders[r[1]]));
    return json({ error: 'not found' }, 404);
  };
})();
