import crypto from 'node:crypto';
import express from 'express';
import { makeStore, allOrders } from './store.js';
import { subscribers, startSubscription } from './leads.js';
import { welcomeStatus } from './welcome.js';
import { mailEnabled, sendNewsletterIssue, sendPlainMail } from './mail.js';
import { logEvent } from './events.js';
import { ART_LANGS } from './articles-i18n.js';

// Pozyskiwanie klientów indywidualnych bez ręcznej pracy (zgodnie z RODO i Prawem komunikacji elektronicznej):
// 1) seria powitalna newslettera (tylko potwierdzeni subskrybenci), 2) wynik skanera na e-mail (usługa na prośbę),
// 4) widżet skanera do osadzenia na stronach partnerów, 5) porady na kanale Telegram po ukraińsku.
const runs = makeStore('growth-runs.json');
const PAID = ['generating', 'paid', 'done'];
const plDate = (t, l = 'pl') => new Date(t).toLocaleDateString(l === 'uk' ? 'uk-UA' : 'pl-PL', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long' });
const warsaw = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map((p) => [p.type, p.value]));

// --- 1. Seria powitalna newslettera ---
const articleUrl = (base, l, pl) => (l === 'uk' && ART_LANGS.uk?.data?.[pl] ? `${base}/uk/${ART_LANGS.uk.seg}/${ART_LANGS.uk.data[pl].slugLang}` : `${base}/poradnik/${pl}`);
export const SERIES = [
  { key: 'd2', day: 2, pl: (b) => ({ subject: '3 błędy w CV, przez które nikt nie dzwoni', text: `Dzień dobry,

oto trzy błędy, które najczęściej widzimy w CV wysyłanych na ogłoszenia:

1. Jedno CV do wszystkich ofert. Rekruter szuka w CV wymagań z konkretnego ogłoszenia. Jeśli ich nie widzi, odkłada dokument.
2. Obowiązki zamiast konkretów. „Obsługa klienta” mówi mniej niż „obsługa ok. 40 klientów dziennie, kasa i reklamacje”.
3. Brak słów z ogłoszenia. Rekruterzy i systemy do selekcji CV porównują słowa z oferty z treścią CV.

Sprawdź za darmo i bez rejestracji, jak Twoje CV pasuje do wybranego ogłoszenia:
${b}/narzedzia/skaner-cv

Pozdrawiamy,
CV Pod Ogłoszenie` }),
    uk: (b) => ({ subject: '3 помилки в резюме, через які ніхто не дзвонить', text: `Добрий день!

Ось три помилки, які ми найчастіше бачимо в резюме, що надсилають на вакансії:

1. Одне резюме для всіх вакансій. Рекрутер шукає в резюме вимоги з конкретного оголошення. Якщо не бачить їх, відкладає документ.
2. Обов’язки замість конкретики. «Обслуговування клієнтів» каже менше, ніж «обслуговування близько 40 клієнтів щодня, каса й рекламації».
3. Немає слів з оголошення. Рекрутери й системи відбору резюме порівнюють слова з вакансії зі змістом резюме.

Безкоштовно й без реєстрації перевірте, як ваше резюме відповідає вибраній вакансії:
${b}/uk/instrumenty/skaner-rezyume

З повагою,
CV Pod Ogłoszenie` }) },
  { key: 'd5', day: 5, pl: (b) => ({ subject: 'Jak czytać ogłoszenie o pracę: słowa kluczowe', text: `Dzień dobry,

zanim wyślesz CV, przeczytaj ogłoszenie z długopisem w ręku:

- Zaznacz wymagania konieczne („wymagamy”) i osobno te mile widziane.
- Wypisz słowa kluczowe: nazwy umiejętności, programów, uprawnień, języków.
- Przy każdym słowie zapisz, gdzie to robiłeś lub robiłaś: praca, praktyki, szkoła, wolontariat.
- Użyj tych samych słów w CV, ale tylko tam, gdzie to prawda.

Więcej przykładów w poradniku:
${articleUrl(b, 'pl', 'jak-dopasowac-cv-do-ogloszenia')}

Pozdrawiamy,
CV Pod Ogłoszenie` }),
    uk: (b) => ({ subject: 'Як читати оголошення про роботу: ключові слова', text: `Добрий день!

Перш ніж надіслати резюме, прочитайте оголошення з ручкою в руці:

- Позначте обов’язкові вимоги та окремо ті, що «буде перевагою».
- Випишіть ключові слова: назви навичок, програм, допусків, мов.
- Біля кожного слова запишіть, де ви це робили: робота, практика, навчання, волонтерство.
- Використайте ці самі слова в резюме, але тільки там, де це правда.

Більше прикладів у пораднику:
${articleUrl(b, 'uk', 'jak-dopasowac-cv-do-ogloszenia')}

З повагою,
CV Pod Ogłoszenie` }) },
  { key: 'd9', day: 9, needsCode: true, pl: (b, w) => ({ subject: `Twój kod powitalny wygasa za ${w.days} ${w.days === 1 ? 'dzień' : 'dni'}`, text: `Dzień dobry,

przypominamy: Twój kod powitalny ${w.code} (−${w.amount} zł) jest ważny do ${plDate(w.expires)}.

Wpisze się sam, gdy wejdziesz przez ten link:
${b}/?ref=${encodeURIComponent(w.code)}

Pozdrawiamy,
CV Pod Ogłoszenie` }),
    uk: (b, w) => ({ subject: `Ваш вітальний код діє ще ${w.days} дн.`, text: `Добрий день!

Нагадуємо: ваш вітальний код ${w.code} (−${w.amount} зл) діє до ${plDate(w.expires, 'uk')}.

Він введеться сам, якщо перейти за цим посиланням:
${b}/uk?ref=${encodeURIComponent(w.code)}

З повагою,
CV Pod Ogłoszenie` }) },
];
// Raz na godzinę: każdy subskrybent dostaje kolejny krok w swoim dniu (najwyżej jeden na przebieg). Starsze zapisy
// (sprzed wdrożenia) pomijamy oknem 3 dni, osoby po zakupie wypadają z serii, wypis jest w każdej wiadomości (sendNewsletterIssue).
export async function welcomeSeries(base, now = Date.now()) {
  if (!mailEnabled()) return { sent: 0 };
  const buyers = new Set(Object.values(await allOrders()).filter((o) => PAID.includes(o.status)).map((o) => String(o.profile?.email || '').toLowerCase()));
  let sent = 0;
  for (const s of Object.values(await subscribers.all())) {
    if (s.status !== 'confirmed' || !s.confirmedAt || buyers.has(s.email)) continue;
    const age = (now - s.confirmedAt) / 864e5, l = s.lang === 'uk' ? 'uk' : 'pl';
    const step = SERIES.find((x) => !s.series?.[x.key] && age >= x.day && age < x.day + 3);
    if (!step) continue;
    let w = null;
    if (step.needsCode) {
      w = await welcomeStatus(s.email);
      if (!w || w.used || w.expires <= now) { await subscribers.update(s.id, (x) => ({ ...x, series: { ...x.series, [step.key]: -now } })); continue; }
      w.days = Math.max(1, Math.ceil((w.expires - now) / 864e5));
    }
    try {
      await sendNewsletterIssue(s.email, step[l](base, w), `${base}/newsletter/wypisz?t=${s.token}`);
      await subscribers.update(s.id, (x) => ({ ...x, series: { ...x.series, [step.key]: now } }));
      sent++;
    } catch (e) { logEvent('e-mail', `Seria powitalna: ${e.message}`); }
  }
  return { sent };
}

// --- 2. Wynik skanera na e-mail ---
// Wynik (bez treści CV) trzymamy w pamięci godzinę pod losowym id, żeby nie przyjmować od przeglądarki dowolnej treści do wysyłki.
const scans = new Map();
export function rememberScan(result, now = Date.now()) {
  for (const [k, v] of scans) if (now - v.at > 3600e3) scans.delete(k);
  const id = crypto.randomBytes(12).toString('base64url');
  scans.set(id, { at: now, result: { score: result.score, position: result.position || '', found: (result.found || []).slice(0, 14), missing: (result.missing || []).slice(0, 14), tips: (result.tips || []).slice(0, 3) } });
  return id;
}
const T = {
  pl: { subj: (r) => `Wynik skanera CV: ${r.score}% dopasowania${r.position ? ` (${r.position})` : ''}`, hi: 'Dzień dobry,\n\noto wynik sprawdzenia Twojego CV, o który prosisz:', score: 'Dopasowanie do ogłoszenia', pos: 'Stanowisko', found: 'Wymagania, które widać w Twoim CV', miss: 'Czego nie widać w Twoim CV (dopisz, jeśli to prawda)', tips: 'Co poprawić', site: 'Strona serwisu', foot: 'Ten e-mail wysłaliśmy jednorazowo, na Twoją prośbę. Nie zapisujemy treści Twojego CV.' },
  uk: { subj: (r) => `Результат сканера резюме: ${r.score}% відповідності${r.position ? ` (${r.position})` : ''}`, hi: 'Добрий день!\n\nОсь результат перевірки вашого резюме, про який ви просили:', score: 'Відповідність вакансії', pos: 'Посада', found: 'Вимоги, які видно у вашому резюме', miss: 'Чого не видно у вашому резюме (допишіть, якщо це правда)', tips: 'Що покращити', site: 'Сайт сервісу', foot: 'Цей лист ми надіслали одноразово, на ваше прохання. Ми не зберігаємо зміст вашого резюме.' },
};
export function scanMailText(r, l, base) {
  const t = T[l] || T.pl;
  return `${t.hi}

${t.score}: ${r.score}%${r.position ? `\n${t.pos}: ${r.position}` : ''}

${t.found}:
${r.found.length ? r.found.map((x) => `- ${x}`).join('\n') : '-'}

${t.miss}:
${r.missing.length ? r.missing.map((m) => `- ${m.keyword}${m.hint ? `: ${m.hint}` : ''}`).join('\n') : '-'}
${r.tips.length ? `\n${t.tips}:\n${r.tips.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n` : ''}
${t.site}: ${base}${l === 'uk' ? '/uk' : ''}

${t.foot}

CV Pod Ogłoszenie`;
}

// --- 4. Widżet skanera do osadzenia ---
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const embedSnippet = (base, code) => `<iframe src="${base}/embed/skaner${code ? `?ref=${encodeURIComponent(code)}` : ''}" width="100%" height="760" style="border:0;max-width:720px" loading="lazy" title="Skaner CV – CV Pod Ogłoszenie"></iframe>`;
function embedHtml(base, ref) {
  const site = `${base}/${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Skaner CV</title>
<style>body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#16233A;background:#fff}.w{padding:16px;max-width:720px;margin:0 auto}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 10px}.h{color:#546178;font-size:13px}label{display:block;font-weight:600;margin:12px 0 4px}textarea{width:100%;box-sizing:border-box;border:1px solid #D9E0EC;border-radius:10px;padding:10px;font:inherit;min-height:110px}button,.btn{display:inline-block;background:#2447D8;color:#fff;border:0;border-radius:10px;padding:11px 18px;font:600 15px system-ui,sans-serif;cursor:pointer;text-decoration:none;margin-top:12px}button:disabled{opacity:.6}.res{margin-top:16px;border-top:1px solid #D9E0EC;padding-top:12px}.ok li{color:#137A3E}.miss li{color:#B42318}.err{color:#B42318;font-weight:600}.foot{margin-top:14px;font-size:12px;color:#546178}.foot a{color:#546178}</style></head>
<body><div class="w"><h1>Darmowy skaner CV</h1><p class="h">Wklej swoje CV i ogłoszenie, a sprawdzimy, które wymagania z ogłoszenia widać w Twoim CV. Bez rejestracji, nie zapisujemy treści.</p>
<form id="f"><label for="cv">Twoje CV (tekst)</label><textarea id="cv" maxlength="20000" required placeholder="Wklej treść swojego CV"></textarea>
<label for="ad">Ogłoszenie o pracę</label><textarea id="ad" maxlength="10000" required placeholder="Wklej całą treść ogłoszenia"></textarea>
<button type="submit" id="b">Sprawdź za darmo</button><p id="m" role="status"></p></form><div id="r" class="res" hidden></div>
<p class="foot">Skaner: <a href="${esc(base)}" target="_blank" rel="noopener">cvpodogloszenie.pl</a> · <a href="${esc(base)}/polityka-prywatnosci" target="_blank" rel="noopener">prywatność</a></p></div>
<script>
(function(){var f=document.getElementById('f'),m=document.getElementById('m'),r=document.getElementById('r'),b=document.getElementById('b'),SITE=${JSON.stringify(site)};
function li(t){var e=document.createElement('li');e.textContent=t;return e}
function ul(cls,items){var u=document.createElement('ul');u.className=cls;items.forEach(function(x){u.appendChild(li(x))});return u}
function h(t,tag){var e=document.createElement(tag||'h2');e.style.fontSize='16px';e.textContent=t;return e}
f.addEventListener('submit',function(e){e.preventDefault();var cv=document.getElementById('cv').value.trim(),ad=document.getElementById('ad').value.trim();
if(cv.length<60){m.className='err';m.textContent='Wklej treść CV (min. 60 znaków).';return}if(ad.length<80){m.className='err';m.textContent='Wklej pełną treść ogłoszenia (min. 80 znaków).';return}
b.disabled=true;m.className='';m.textContent='Porównujemy Twoje CV z ogłoszeniem…';
fetch('/api/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cvText:cv,adText:ad})}).then(function(x){return x.json().then(function(j){if(!x.ok)throw new Error(j.error||'Błąd');return j})}).then(function(j){
m.textContent='';r.innerHTML='';r.appendChild(h('Dopasowanie: '+j.score+'%'+(j.position?' – '+j.position:'')));
r.appendChild(h('Widać w Twoim CV','h3'));r.appendChild(ul('ok',j.found));r.appendChild(h('Czego nie widać','h3'));r.appendChild(ul('miss',j.missing.map(function(x){return x.keyword+(x.hint?': '+x.hint:'')})));
var a=document.createElement('a');a.className='btn';a.href=SITE;a.target='_blank';a.rel='noopener';a.textContent='Zrób CV pod to ogłoszenie';r.appendChild(a);r.hidden=false;
}).catch(function(x){m.className='err';m.textContent=x.message}).then(function(){b.disabled=false})});})();
</script></body></html>`;
}

// --- 5. Porady na kanale Telegram (po ukraińsku) ---
export const TELEGRAM_TIPS = [
  'Надсилайте окреме резюме під кожну вакансію: рекрутер шукає в документі вимоги саме з цього оголошення.',
  'Перед відправкою резюме випишіть з оголошення 8–10 ключових слів і перевірте, чи вони є у вашому документі.',
  'Замість «обслуговування клієнтів» напишіть конкретно: скільки клієнтів на день, яка каса, які програми.',
  'Польські роботодавці часто очікують клаузулу RODO внизу резюме. Без неї резюме можуть не розглянути.',
  'Фото в резюме в Польщі не обов’язкове. Якщо додаєте, оберіть нейтральне тло й діловий вигляд.',
  'Назвіть файл резюме зрозуміло: Imię_Nazwisko_CV.pdf. Так рекрутеру легше його знайти.',
  'Надсилайте резюме у PDF: форматування не «поїде» на іншому комп’ютері.',
  'Вкажіть рівень польської чесно (наприклад, B1). Краще приємно здивувати на співбесіді, ніж розчарувати.',
  'Якщо ваш диплом з України, напишіть назву спеціальності польською та в дужках українською.',
  'Досвід з України теж рахується. Опишіть обов’язки так, щоб польський роботодавець зрозумів, що саме ви робили.',
  'Якщо є прогалина в досвіді, коротко поясніть її: навчання, догляд за дитиною, переїзд. Це нормально.',
  'Розділ «Про себе» — 2–3 речення під конкретну посаду, а не загальні фрази про «комунікабельність».',
  'Мовні курси, волонтерство й практика — теж досвід. Додайте їх, якщо досвіду роботи мало.',
  'Перевірте телефон і e-mail у резюме. Помилка в одній цифрі — і рекрутер не зможе з вами зв’язатися.',
  'Використовуйте польський формат дат: 03.2024 – obecnie. Так резюме виглядає звично для роботодавця.',
  'Якщо у вашій професії потрібні допуски (наприклад, UDT, санітарна книжка), впишіть їх на видне місце.',
  'Супровідний лист — короткий: чому саме ця фірма, що ви вмієте, коли можете почати.',
  'Після співбесіди надішліть короткий лист-подяку. Це рідкість, тому вас запам’ятають.',
  'Готуючись до співбесіди, підготуйте 3 приклади зі свого досвіду: проблема, що ви зробили, результат.',
  'На співбесіді в Польщі часто питають про очікувану зарплату. Перевірте ставки «brutto» і «netto» заздалегідь.',
  'Різниця між umowa o pracę та umowa zlecenie важлива: від неї залежать відпустка, лікарняний і внески.',
  'Шукайте вакансії не лише на порталах: сторінки «Kariera» на сайтах фірм часто мають свіжіші оголошення.',
  'Не копіюйте одне й те саме резюме в усі вакансії. 15 хвилин на адаптацію часто дають більше, ніж 20 відправок.',
  'Якщо вакансія вимагає водійських прав категорії B або C, вкажіть категорію та рік отримання.',
  'Для роботи на складі корисно вказати досвід зі сканерами, WMS і посвідчення на навантажувач.',
  'Для роботи в магазині вкажіть досвід з касою, інвентаризацією та викладкою товару.',
  'Для роботи з клієнтами підкресліть мови, якими спілкуєтеся, і приклади вирішених проблем.',
  'Не пишіть у резюме неправди: на співбесіді це легко перевірити.',
  'Перевірте резюме безкоштовним сканером: він покаже, яких вимог з оголошення не видно у вашому документі.',
  'Збережіть одну «базову» версію резюме, а під кожну вакансію робіть копію й адаптуйте її.',
  'Якщо відповідь не приходить 1–2 тижні, можна ввічливо нагадати про себе листом.',
  'Профіль LinkedIn має збігатися з резюме: посади, дати й назви фірм.',
];
export async function telegramHourly(base, now = new Date(), fetchFn = fetch) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim(), chat = (process.env.TELEGRAM_CHANNEL || '').trim();
  if (!token || !chat) return null;
  const p = warsaw(now), day = `${p.year}-${p.month}-${p.day}`;
  if (!['Mon', 'Wed', 'Fri'].includes(p.weekday) || +p.hour !== 18) return null;
  const last = (await runs.get('telegram')) || { idx: -1 };
  if (last.day === day) return null;
  const idx = (last.idx + 1) % TELEGRAM_TIPS.length, text = `💡 ${TELEGRAM_TIPS[idx]}\n\n👉 Резюме під конкретну вакансію, сайт українською: ${base}/uk`;
  const r = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: false }), signal: AbortSignal.timeout(15_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.description || `Telegram ${r.status}`);
  await runs.save({ id: 'telegram', day, idx, at: now.getTime() });
  return { idx };
}

export function growthRoutes(app, { BASE_URL, DEMO = false }) {
  const hits = new Map();
  const limited = (req, max, kind) => { const k = `${kind}:${req.ip}`, now = Date.now(), h = (hits.get(k) || []).filter((t) => now - t < 3600e3); if (h.length >= max) return true; hits.set(k, [...h, now]); return false; };
  app.post('/api/scan/email', express.json({ limit: '5kb' }), async (req, res) => {
    if (limited(req, 3, 'scanmail')) return res.status(429).json({ error: 'Limit: 3 wyniki na e-mail na godzinę. Spróbuj później.' });
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 160), l = req.body?.lang === 'uk' ? 'uk' : 'pl';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    const s = scans.get(String(req.body?.scanId || ''));
    if (!s) return res.status(410).json({ error: 'Wynik wygasł. Sprawdź CV jeszcze raz.' });
    if (!mailEnabled()) return res.status(503).json({ error: 'Wysyłka e-maili jest chwilowo wyłączona.' });
    try { await sendPlainMail({ to: email, subject: T[l].subj(s.result), text: scanMailText(s.result, l, BASE_URL) }); }
    catch (e) { logEvent('e-mail', `Wynik skanera: ${e.message}`); return res.status(502).json({ error: 'Nie udało się wysłać e-maila. Spróbuj za chwilę.' }); }
    // Newsletter tylko po osobnym, niezaznaczonym domyślnie polu i z potwierdzeniem (podwójna zgoda).
    let newsletter = false;
    if (req.body?.newsletter === true) { await startSubscription({ email, source: 'skaner', lang: l, BASE_URL }).catch((e) => logEvent('e-mail', `Newsletter (skaner): ${e.message}`)); newsletter = true; }
    res.json({ ok: true, newsletter });
  });
  app.get('/embed/skaner', (req, res) => {
    const ref = /^[A-Z0-9-]{3,20}$/.test(String(req.query.ref || '').toUpperCase()) ? String(req.query.ref).toUpperCase() : '';
    res.set({ 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, max-age=600' }).type('html').send(embedHtml(BASE_URL, ref));
  });
}
