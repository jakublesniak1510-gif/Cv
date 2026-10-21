// Zgoda na pliki cookie reklam (Google Ads, Meta Pixel). Bez zgody nie ładujemy żadnego skryptu reklamowego.
// Identyfikatory przychodzą z /api/config (zmienne GADS_ID, GADS_PURCHASE_LABEL, META_PIXEL_ID); bez nich baneru nie ma.
(() => {
  const KEY = 'cvpo-consent', PENDING = 'cvpo-conv-pending';
  let ads = null, loaded = false;
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

  function load() {
    if (loaded || !ads) return;
    loaded = true;
    if (ads.gads) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', ads.gads);
      const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ads.gads)}`; document.head.append(s);
    }
    if (ads.pixel) {
      const f = (window.fbq = function fbq() { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); });
      if (!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.append(s);
      window.fbq('init', ads.pixel);
      window.fbq('track', 'PageView');
    }
    // Zakup, który zdarzył się przed udzieleniem zgody na tej samej stronie, zgłaszamy teraz.
    try { const p = JSON.parse(get(PENDING) || 'null'); set(PENDING, null); if (p) send(p.id, p.value); } catch {}
  }

  function send(id, value) {
    const k = `cvpo-conv-${id}`;
    if (get(k)) return;
    set(k, '1');
    if (ads.gads && ads.label) window.gtag('event', 'conversion', { send_to: `${ads.gads}/${ads.label}`, value, currency: 'PLN', transaction_id: id });
    if (ads.pixel) window.fbq('track', 'Purchase', { value, currency: 'PLN' }, { eventID: id });
  }

  function banner() {
    document.getElementById('consentBar')?.remove(); space(null);
    const bar = document.createElement('div');
    bar.id = 'consentBar'; bar.className = 'consent'; bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Pliki cookie');
    bar.innerHTML = '<p><b>Pliki cookie reklam</b> <span>Za Twoją zgodą używamy plików cookie Google i Meta, żeby mierzyć skuteczność naszych reklam. Bez zgody strona działa tak samo.</span> <a href="#prywatnosc">Polityka prywatności</a></p>'
      + '<div class="consent-btns"><button type="button" class="btn ghost sm" data-c="denied">Tylko niezbędne</button><button type="button" class="btn sm" data-c="granted" data-i18n-key="Akceptuję (pliki cookie)">Akceptuję</button></div>';
    bar.addEventListener('click', (e) => {
      const v = e.target.closest('button')?.dataset.c; if (!v) return;
      set(KEY, v); bar.remove(); space(null);
      if (v === 'granted') load();
      else if (loaded) location.reload(); // wycofanie zgody: przeładowanie strony bez skryptów reklamowych
    });
    document.body.append(bar);
    space(bar);
  }
  // Miejsce zajęte przez baner (--consent-h): otwarty kreator kończy się nad nim, więc „Dalej” i kwota są zawsze widoczne.
  let cur = null, ro = null;
  const measure = () => { if (cur?.isConnected) document.documentElement.style.setProperty('--consent-h', `${Math.max(0, Math.ceil(window.innerHeight - cur.getBoundingClientRect().top) + 8)}px`); };
  function space(bar) {
    cur = bar; ro?.disconnect(); ro = null; window.removeEventListener('resize', measure);
    if (!bar) return document.documentElement.style.removeProperty('--consent-h');
    if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(bar); }
    window.addEventListener('resize', measure); measure();
  }

  window.CONSENT = {
    init(a) {
      ads = a && (a.gads || a.pixel) ? a : null;
      document.querySelectorAll('[data-consent]').forEach((x) => { x.hidden = !ads; });
      if (!ads) return;
      const v = get(KEY);
      if (v === 'granted') load(); else if (!v) banner();
    },
    // Zakup zgłaszamy raz na zamówienie (także przy ponownym otwarciu strony dokumentów).
    purchase(id, value) {
      if (!ads || !id || !(value > 0) || get(`cvpo-conv-${id}`)) return;
      if (loaded) send(id, value);
      else if (!get(KEY)) set(PENDING, JSON.stringify({ id, value }));
    },
    open: banner,
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-consent]')) { e.preventDefault(); banner(); } });
})();
