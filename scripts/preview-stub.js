// Atrapa API dla podglądu statycznego: ta sama strona, ale bez serwera, płatności i AI.
(() => {
  const orders = {};
  const P = { cv: 3900, cv_letter: 4900, pack3: 7900, interview: 5000, messages: 900, linkedin: 1900, docx: 900, extraLang: 500 };
  const MAXREV = 10;
  const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const total = (pkg, n, a, fu, langs = [], disc = 0) => P[pkg] + ['interview', 'messages', 'linkedin', 'docx'].reduce((t, k) => t + (a[k] ? P[k] : 0), 0) + P.extraLang * langs.length - disc;
  const score = (m) => ({ ...m, score: m.found.length + m.missing.length ? Math.round((100 * m.found.length) / (m.found.length + m.missing.length)) : null });
  const view = (o) => ({ review: o.review || null, myCode: o.status === 'done' ? { code: 'KOD-' + (o.parentId || o.id).slice(-6).toUpperCase(), discount: 10, expires: o.created + 90 * 864e5, uses: 0, usedByMe: !!o.parentId && /^KOD-/.test(o.code || '') } : null, extraLangs: o.extraLangs, id: o.id, pkg: o.pkg, addons: o.addons, total: o.total, status: o.status, results: o.results, mail: o.mail, design: o.design, photo: o.profile.photo || '', parentId: o.parentId || null, revisionsLeft: MAXREV - o.revisions, expires: o.created + 30 * 864e5 });
  const make = (fields) => { const id = 'preview-' + Math.random().toString(36).slice(2); orders[id] = { id, status: 'pending', revisions: 0, created: Date.now(), ...fields }; return orders[id]; };
  window.fetch = async (url, opts = {}) => {
    const m = (opts.method || 'GET').toUpperCase(), body = opts.body ? JSON.parse(opts.body) : {};
    if (url === '/api/config') return json({ demo: true, preview: true, ai: false, maxAds: 3, noPrint: true, fakeFetch: true, maxRevisions: MAXREV, prices: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v / 100])) });
    if (url === '/content.json') return json({ INDEX: PROFESSIONS.map(({ slug, name, category, keywords }) => ({ slug, name, category, keywords })), POPULAR: PROFESSIONS.filter((p) => POPULAR_SLUGS.includes(p.slug)), ARTICLES, CITIES, TOOLS });
    { const c = /^\/content\/cv\/([\w-]+)\.json$/.exec(url); if (c) { const p = PROFESSIONS.find((x) => x.slug === c[1]); return p ? json(p) : json({}, 404); } }
    // Podgląd nie pokazuje żadnych opinii: na prawdziwej stronie pojawią się dopiero opinie prawdziwych klientów.
    // Konto w podglądzie: logowanie bez e-maila, wszystko w pamięci przeglądarki.
    if (url.startsWith('/api/account')) {
      const p = url.replace('/api/account', ''), A = (window.__acc ||= { logged: false, email: '', apps: [] });
      if (p === '/link') { if (!/^\S+@\S+\.\S+$/.test(body.email || '')) return json({ error: 'Podaj poprawny adres e-mail.' }, 400); A.pending = body.email.toLowerCase(); return json({ ok: true, demoLink: 'https://twojadomena.pl/konto?t=podglad' }); }
      if (p === '/login') { if (!A.pending) return json({ error: 'Link wygasł albo został już użyty. Poproś o nowy.' }, 401); A.logged = true; A.email = A.pending; return json({ ok: true }); }
      if (!A.logged) return json({ error: 'Zaloguj się.' }, 401);
      if (p === '' && m === 'GET') return json({ email: A.email, apps: A.apps, statuses: ['wysłane', 'rozmowa', 'oferta', 'odmowa', 'brak odpowiedzi'], orders: Object.values(orders).filter((o) => o.status === 'done').map((o) => ({ id: o.id, created: o.created, pkg: { cv: 'CV', cv_letter: 'CV + list motywacyjny', pack3: 'Pakiet 3 CV + listy motywacyjne' }[o.pkg], status: o.status, positions: o.results.map((r) => ({ position: r.position, company: r.company || '' })) })) });
      if (p === '/logout' || (p === '' && m === 'DELETE')) { A.logged = false; if (m === 'DELETE') A.apps = []; return json({ ok: true }); }
      if (p === '/apps' && m === 'POST') { if (!body.company && !body.position) return json({ error: 'Podaj firmę lub stanowisko.' }, 400); const a = { id: Math.random().toString(36).slice(2), status: 'wysłane', remind: false, interviewAt: null, ...body, created: Date.now() }; A.apps.unshift(a); return json(a); }
      const am = /^\/apps\/(\w+)$/.exec(p);
      if (am && m === 'PUT') { const a = A.apps.find((x) => x.id === am[1]); if (!a) return json({ error: 'Nie ma takiej aplikacji.' }, 404); const t = body.interviewAt === undefined ? a.interviewAt : Date.parse(body.interviewAt) || null; Object.assign(a, body, { interviewAt: t, remind: !!(body.remind ?? a.remind) && !!t }); return json(a); }
      if (am && m === 'DELETE') { A.apps = A.apps.filter((x) => x.id !== am[1]); return json({ ok: true }); }
    }
    if (url === '/api/public-stats') return json({ cvs: null });
    if (url === '/api/reviews') return json({ count: 0, avg: null, list: [] });
    { const c = /^\/api\/orders\/([\w-]+)\/review$/.exec(url); if (c && m === 'POST') { const o = orders[c[1]]; if (!o) return json({}, 404); if (!(body.rating >= 1 && body.rating <= 5)) return json({ error: 'Wybierz ocenę od 1 do 5 gwiazdek.' }, 400); o.review = { rating: body.rating, text: body.text || '' }; return json({ ok: true }); } }
    if (url === '/api/assistant' && m === 'POST') { await wait(600); return json({ answer: assistantFallback(body.messages[body.messages.length - 1].content) }); }
    if (url === '/api/scan' && m === 'POST') {
      await wait(1200);
      const cvText = 'Marek Wiśniewski. Magazynier, Hurtownia Polar. Przyjmowanie i wydawanie towaru, obsługa wózka widłowego, inwentaryzacje, kompletowanie zamówień ze skanerem, praca zmianowa. Uprawnienia UDT na wózki widłowe. Excel, angielski A2.';
      const r = scanFallback({ cvText, adText: body.adText });
      const found = r.found, missing = r.missing;
      return json({ position: '', found, missing, tips: ['Przenieś na górę doświadczenie najbliższe temu stanowisku.', 'Użyj słów kluczowych z ogłoszenia w takim samym brzmieniu, jeśli to prawda o Tobie.', 'Dopisz konkretne liczby i efekty pracy, np. liczbę zamówień dziennie.'], score: found.length + missing.length ? Math.round(100 * found.length / (found.length + missing.length)) : 0 });
    }
    { const c = /^\/api\/code\/([^?]+)/.exec(url); if (c) { const code = decodeURIComponent(c[1]).toUpperCase(); return /^KOD-/.test(code) ? json({ code, discount: 10, label: 'Kod rabatowy' }) : json({ error: 'Ten kod nie istnieje albo wygasł.' }, 404); } }
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
      const disc = /^KOD-/.test(body.code || '') ? 1000 : 0;
      const o = make({ design: body.design, pkg: body.pkg, addons: a, extraLangs: body.extraLangs || [], profile: body.profile, ads, total: total(body.pkg, ads.length, a, false, body.extraLangs || [], disc) });
      return json({ id: o.id, demo: true });
    }
    let r;
    if ((r = /^\/api\/orders\/([^/]+)\/followup$/.exec(url)) && m === 'POST') {
      const p = orders[r[1]], ads = (body.ads || []).filter((a) => a.text && a.text.length >= 80);
      if (!ads.length) return json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' }, 400);
      const disc = /^KOD-/.test(body.code || '') ? 1000 : 0;
      const pk = ['cv', 'cv_letter', 'pack3'].includes(body.pkg) ? body.pkg : p.pkg;
      const o = make({ code: body.code, parentId: p.id, design: p.design, pkg: pk, addons: {}, extraLangs: [], profile: p.profile, ads, total: total(pk, ads.length, {}, true, [], disc) });
      return json({ id: o.id, demo: true });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/demo-pay$/.exec(url)) && m === 'POST') {
      const o = orders[r[1]]; o.status = 'generating';
      setTimeout(() => { o.results = o.ads.map((ad) => { const x = tailor({ profile: o.profile, ad, withLetter: o.pkg !== 'cv', addons: o.addons }); const r = { ...x, match: score(x.match) }; const langs = (o.extraLangs || []).filter((l) => l !== r.lang); if (langs.length) r.variants = Object.fromEntries(langs.map((l) => [l, translateFallback(r, l)])); return r; }); o.status = 'done'; o.mail = { status: 'sent', to: o.profile.email }; }, 2200);
      return json({ ok: true });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/design$/.exec(url)) && m === 'POST') { const o = orders[r[1]]; if (o) o.design = body; return json({ design: body }); }
    if ((r = /^\/api\/orders\/([^/]+)\/resend$/.exec(url)) && m === 'POST') return json({ mail: orders[r[1]].mail });
    if ((r = /^\/api\/orders\/([^/]+)\/results\/(\d+)$/.exec(url)) && m === 'PUT') {
      const o = orders[r[1]], base = o.results[+r[2]], v = base.variants?.[body.lang], x = { ...(v || base) };
      if (body.cv) x.cv = body.cv; if (typeof body.letter === 'string') x.letter = body.letter;
      const merged = v ? { ...base, variants: { ...base.variants, [body.lang]: x } } : { ...x, variants: base.variants };
      o.results[+r[2]] = merged; return json({ result: merged });
    }
    if ((r = /^\/api\/orders\/([^/]+)\/revise$/.exec(url)) && m === 'POST') {
      await wait(900);
      const o = orders[r[1]];
      if (o.revisions >= MAXREV) return json({ error: 'Wykorzystano limit poprawek.' }, 429);
      const base = o.results[body.i], v = base.variants?.[body.lang], target = v || base;
      const out = reviseFallback({ result: target, doc: body.doc, instruction: body.instruction });
      let x = { ...target, ...(body.doc === 'letter' ? { letter: out.letter } : { cv: out.cv }) };
      if (body.resolves && x.match) { const found = [...x.match.found, body.resolves], missing = x.match.missing.filter((k) => k.keyword !== body.resolves); x.match = score({ found, missing }); }
      x = v ? { ...base, variants: { ...base.variants, [body.lang]: x } } : { ...x, variants: base.variants };
      o.results[body.i] = x; o.revisions++;
      return json({ result: x, note: out.note, revisionsLeft: MAXREV - o.revisions });
    }
    if ((r = /^\/api\/orders\/([^/]+)$/.exec(url)) && orders[r[1]]) return json(view(orders[r[1]]));
    return json({ error: 'not found' }, 404);
  };
})();
