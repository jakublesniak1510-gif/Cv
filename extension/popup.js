// CV Pod Ogłoszenie – popup rozszerzenia. Uprawnienia: activeTab + scripting (bez host_permissions).
// Treść aktywnej karty czytamy wyłącznie po kliknięciu przycisku, pokazujemy podgląd i wysyłamy dopiero po „Wyślij”:
// tekst wskazanej strony (ogłoszenia), tytuł i adres strony.
const SITE = 'https://cvpodogloszenie.pl';
const t = (k) => chrome.i18n.getMessage(k) || k;
document.querySelectorAll('[data-msg]').forEach((n) => (n.textContent = t(n.dataset.msg)));
document.documentElement.lang = chrome.i18n.getUILanguage().slice(0, 2);
const status = document.getElementById('status'), buttons = [...document.querySelectorAll('button')];

// Wykonywane w karcie z ogłoszeniem (wstrzykiwane przez chrome.scripting, bez zdalnego kodu).
function extractAd() {
  const SEL = {
    'pracuj.pl': ['[data-test="section-offerView"]', '[data-scroll-id="job-description"]', 'main'],
    'olx.pl': ['[data-cy="ad_description"]', '[data-testid="ad-description"]', 'main'],
    'justjoin.it': ['[class*="JobOffer"]', 'main'],
    'nofluffjobs.com': ['nfj-posting-details', '#posting-description', 'main'],
    'indeed.com': ['#jobDescriptionText', '.jobsearch-JobComponent'],
    'linkedin.com': ['.jobs-description__content', '.jobs-box__html-content', '.description__text', 'main'],
  };
  const host = location.hostname.replace(/^www\./, '').replace(/^[a-z]{2}\.(indeed\.com)$/, '$1');
  const key = Object.keys(SEL).find((k) => host === k || host.endsWith('.' + k));
  let text = '';
  for (const s of key ? SEL[key] : []) { const n = document.querySelector(s); if (n && n.innerText.trim().length > 200) { text = n.innerText; break; } }
  if (!text) text = document.body ? document.body.innerText : '';
  const h1 = document.querySelector('h1');
  return { text: text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 15000), title: (h1 ? h1.innerText : document.title).trim().slice(0, 200), url: location.href, site: key || '' };
}

// Krok 1: odczyt ogłoszenia z aktywnej karty i podgląd. Nic nie wysyłamy, dopóki użytkownik nie kliknie „Wyślij”.
let pending = null;
const preview = document.getElementById('preview'), mainBtns = [document.getElementById('cv'), document.getElementById('scan')];
async function read(target) {
  buttons.forEach((b) => (b.disabled = true)); status.className = ''; status.textContent = t('working');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || '')) throw new Error(t('errPage'));
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractAd });
    const ad = res && res.result;
    if (!ad || ad.text.length < 80) throw new Error(t('errShort'));
    pending = { target, ad };
    document.getElementById('site').textContent = ad.site || t('unknownSiteName');
    document.getElementById('warn').hidden = !!ad.site;
    document.getElementById('snippet').textContent = ad.text.slice(0, 300) + (ad.text.length > 300 ? '…' : '');
    mainBtns.forEach((b) => (b.hidden = true)); preview.hidden = false; status.textContent = '';
  } catch (e) { status.className = 'err'; status.textContent = e.message || t('errServer'); }
  buttons.forEach((b) => (b.disabled = false));
}
// Krok 2: po potwierdzeniu wysyłamy tekst ogłoszenia, tytuł i adres strony i otwieramy kreator albo skaner.
async function send() {
  if (!pending) return;
  buttons.forEach((b) => (b.disabled = true)); status.className = ''; status.textContent = t('working');
  try {
    const { target, ad } = pending;
    const r = await fetch(`${SITE}/api/ad-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ad.text, title: ad.title, url: ad.url, src: 'ext' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id) throw new Error(j.error || t('errServer'));
    const ui = chrome.i18n.getUILanguage().slice(0, 2), pre = ['uk', 'en', 'de'].includes(ui) ? `/${ui}` : '';
    const scan = { '': '/narzedzia/skaner-cv', '/uk': '/uk/instrumenty/skaner-rezyume', '/en': '/en/tools/cv-scanner', '/de': '/de/tools/lebenslauf-scanner' }[pre];
    const path = target === 'scan' ? scan : `${pre || '/'}`;
    await chrome.tabs.create({ url: `${SITE}${path}?draft=${encodeURIComponent(j.id)}&utm_source=chrome_ext` });
    window.close();
  } catch (e) {
    status.className = 'err'; status.textContent = e.message || t('errServer');
    buttons.forEach((b) => (b.disabled = false));
  }
}
document.getElementById('send').addEventListener('click', send);
document.getElementById('cancel').addEventListener('click', () => { pending = null; preview.hidden = true; mainBtns.forEach((b) => (b.hidden = false)); status.textContent = ''; });
document.getElementById('cv').addEventListener('click', () => read('cv'));
document.getElementById('scan').addEventListener('click', () => read('scan'));
