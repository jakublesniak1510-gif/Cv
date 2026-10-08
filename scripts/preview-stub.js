// Atrapa API dla podglądu statycznego: ta sama strona, ale bez serwera i bez płatności.
(() => {
  const orders = {};
  const P = { cv: 3900, cv_letter: 4900, extra: 2000 };
  const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const m = (opts.method || 'GET').toUpperCase();
    if (url === '/api/config') return json({ demo: true, maxAds: 5, noPrint: true, fakeFetch: true });
    if (url === '/api/fetch-ad' && m === 'POST') {
      const u = (JSON.parse(opts.body).url || '').trim();
      await new Promise((r) => setTimeout(r, 700));
      try { const p = new URL(u); if (!/^https?:$/.test(p.protocol)) throw 0; } catch { return json({ error: 'To nie wygląda na poprawny link.' }, 422); }
      if (/linkedin|blad|zaloguj/i.test(u)) return json({ error: 'Serwis odrzucił zapytanie (kod 403).' }, 422);
      if (/magazyn/i.test(u)) return json({ title: 'Magazynier', company: 'Hurtownia Sigma', text: 'Poszukujemy magazyniera do pracy w hurtowni w Krakowie.\nZakres obowiązków: przyjmowanie i wydawanie towaru, obsługa wózka widłowego, inwentaryzacja, praca z dokumentacją magazynową.\nWymagania: uprawnienia na wózki widłowe, rzetelność, praca zmianowa.\nOferujemy: umowę o pracę, premię kwartalną.' });
      return json({ title: 'Specjalista ds. obsługi klienta', company: 'Nova Serwis', text: 'Do biura obsługi poszukujemy specjalisty ds. obsługi klienta.\nZakres obowiązków: obsługa zgłoszeń, rozwiązywanie reklamacji, praca w systemie CRM.\nWymagania: min. 2 lata doświadczenia, znajomość angielskiego, komunikatywność.\nOferujemy: umowę o pracę, pakiet medyczny, elastyczne godziny.' });
    }
    if (url === '/api/orders' && m === 'POST') {
      const b = JSON.parse(opts.body);
      const ads = (b.ads || []).filter((a) => a.text && a.text.length >= 80);
      if (!b.consent) return json({ error: 'Wymagana zgoda na przetwarzanie danych.' }, 400);
      if (!ads.length) return json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' }, 400);
      const id = 'preview-' + Math.random().toString(36).slice(2);
      orders[id] = { id, pkg: b.pkg, profile: b.profile, ads, status: 'pending', total: P[b.pkg] + P.extra * (ads.length - 1) };
      return json({ id, demo: true });
    }
    const pay = /^\/api\/orders\/([^/]+)\/demo-pay$/.exec(url);
    if (pay && m === 'POST') {
      const o = orders[pay[1]]; o.status = 'generating';
      setTimeout(() => { o.results = o.ads.map((ad) => tailor({ profile: o.profile, ad, withLetter: o.pkg === 'cv_letter' })); o.status = 'done'; o.mail = { status: 'sent', to: o.profile.email }; }, 2200);
      return json({ ok: true });
    }
    if (/\/resend$/.test(url) && m === 'POST') return json({ mail: orders[url.split('/')[3]].mail });
    const get = /^\/api\/orders\/([^/]+)$/.exec(url);
    if (get && orders[get[1]]) { const o = orders[get[1]]; return json({ id: o.id, pkg: o.pkg, total: o.total, status: o.status, results: o.results, mail: o.mail }); }
    return json({ error: 'not found' }, 404);
  };
})();
