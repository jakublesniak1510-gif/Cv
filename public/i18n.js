// Wersje językowe interfejsu (EN, UK, DE). Strona jest pisana po polsku; ten skrypt podmienia teksty interfejsu
// według słownika (klucz = polski tekst). Dokumenty klienta, przykłady CV, poradnik i dokumenty prawne zostają po polsku.
(() => {
  const LANGS = ['pl', 'en', 'uk', 'de'];
  const pick = () => {
    const fromPath = /^\/(en|uk|de)(\/|$)/.exec(location.pathname)?.[1];
    if (fromPath) { try { localStorage.setItem('cvpo-lang', fromPath); } catch {} return fromPath; }
    if (window.__LANG) return window.__LANG;
    try { const s = localStorage.getItem('cvpo-lang'); if (LANGS.includes(s)) return s; } catch {}
    return 'pl';
  };
  const lang = pick();
  const I = (window.I18N = { lang, ready: Promise.resolve(), t: (s) => s, set(l) { try { localStorage.setItem('cvpo-lang', l); } catch {} } });
  document.documentElement.lang = lang;
  if (lang === 'pl') return;

  // Fragmenty, których nie tłumaczymy: dokumenty, przykłady, treści poradnika i dokumenty prawne.
  const SKIP = '.paper,.doc,#page,.legal ol,.legal ul,.legal p:not(.legal-note),.legal h2,.msgbox,.tool-out,script,style,code,[data-noi18n],#chatLog .me';
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  let dict = new Map(), pats = [], done = new Set();
  const load = (d) => {
    done = new Set(Object.values(d).map(norm));
    dict = new Map(Object.entries(d).filter(([k]) => !k.includes('{0}')));
    pats = Object.entries(d).filter(([k]) => k.includes('{0}')).map(([k, v]) => {
      const re = new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d)\}/g, '(.+?)') + '$');
      return [re, v];
    });
  };
  const tr = (raw) => {
    const s = norm(raw); if (!s || !/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(s)) return null;
    if (dict.has(s)) return dict.get(s);
    if (done.has(s)) return null;
    for (const [re, v] of pats) { const m = re.exec(s); if (m) return v.replace(/\{(\d)\}/g, (_, i) => m[+i + 1]); }
    if (window.__I18N_MISS) window.__I18N_MISS.add(s);
    return null;
  };
  I.t = (s) => tr(s) ?? s;
  const skip = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; return !e || (!!e.closest(SKIP) && !e.closest('[data-i18n]')); };
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const doText = (n) => {
    if (skip(n)) return;
    const v = tr(n.nodeValue); if (v == null) return;
    const lead = /^\s*/.exec(n.nodeValue)[0], tail = /\s*$/.exec(n.nodeValue)[0];
    const out = lead + v + tail; if (n.nodeValue !== out) n.nodeValue = out;
  };
  const doEl = (e) => {
    if (e.closest(SKIP)) return;
    for (const a of ATTRS) if (e.hasAttribute(a)) { const v = tr(e.getAttribute(a)); if (v != null && v !== e.getAttribute(a)) e.setAttribute(a, v); }
    if ((e.tagName === 'INPUT' && (e.type === 'button' || e.type === 'submit'))) { const v = tr(e.value); if (v != null) e.value = v; }
  };
  const walk = (root) => {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let n; while ((n = w.nextNode())) (n.nodeType === 3 ? doText(n) : doEl(n));
  };
  const obs = new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') doText(m.target); else if (m.type === 'attributes') doEl(m.target); else m.addedNodes.forEach(walk); } });

  const html = document.documentElement;
  html.classList.add('i18n-wait');
  const start = (d) => {
    load(d);
    const go = () => {
      walk(document.head.querySelector('title') || document.head); walk(document.body); document.querySelectorAll('[data-i18n]').forEach(walk);
      obs.observe(html, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      html.classList.remove('i18n-wait');
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
  };
  if (window.__I18N_DICT?.[lang]) start(window.__I18N_DICT[lang]);
  else I.ready = fetch(`/i18n/${lang}.json`).then((r) => r.json()).then(start).catch(() => html.classList.remove('i18n-wait'));
  setTimeout(() => html.classList.remove('i18n-wait'), 2500);
})();
