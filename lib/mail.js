import nodemailer from 'nodemailer';
import { renderCv, renderLetter, renderInterview } from './pdf.js';
import { renderDocx } from './docx.js';

let tx;
// SMTP_URL, np. smtps://user:haslo@smtp.resend.com:465 ("json" = tryb testowy bez wysyłki).
export const mailEnabled = () => !!process.env.SMTP_URL;
const transport = () => (tx ||= nodemailer.createTransport(
  process.env.SMTP_URL === 'json' ? { jsonTransport: true } : process.env.SMTP_URL,
  { connectionTimeout: 10_000, socketTimeout: 20_000 }));

const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'dokument';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Teksty e-maili w języku, w którym klient korzystał ze strony (pl / en / uk / de). Nazwy plików zostają po polsku.
const ML = {
  pl: { hi: 'Dzień dobry,', ready: 'Twoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):', see: 'Możesz je też zobaczyć, edytować i poprawić na stronie:', del: 'Dane zamówienia usuwamy automatycznie po 30 dniach.', luck: 'Powodzenia w rekrutacji!', subj: 'Twoje CV i list motywacyjny są gotowe',
    code: (c) => `Twój kod −10 zł: ${c}. Użyj go przy kolejnym zamówieniu i podaj znajomym: każdy, kto go wpisze, zapłaci 10 zł mniej, a Ty za każdego znajomego, który zapłaci, dostaniesz 10 zł na kolejne zamówienia (do 50 zł). Kod jest ważny 90 dni.`,
    loginSubj: 'Twój link do logowania', login: 'kliknij, aby zalogować się na swoje konto w CV Pod Ogłoszenie:', loginBtn: 'Zaloguj się', loginNote: 'Link działa 20 minut i tylko raz. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.' },
  en: { hi: 'Hello,', ready: 'Your documents are ready. You will find them attached (PDF):', see: 'You can also view, edit and correct them here:', del: 'We automatically delete order data after 30 days.', luck: 'Good luck with your application!', subj: 'Your CV and cover letter are ready',
    code: (c) => `Your 10 PLN discount code: ${c}. Use it for your next order and share it with friends: anyone who enters it pays 10 PLN less, and for every friend who pays you get 10 PLN towards your next orders (up to 50 PLN). The code is valid for 90 days.`,
    loginSubj: 'Your login link', login: 'click to log in to your CV Pod Ogłoszenie account:', loginBtn: 'Log in', loginNote: 'The link works for 20 minutes and only once. If you did not ask to log in, ignore this message.' },
  uk: { hi: 'Добрий день,', ready: 'Ваші документи готові, вони у вкладеннях (PDF):', see: 'Ви також можете переглянути, відредагувати й виправити їх на сторінці:', del: 'Дані замовлення ми автоматично видаляємо через 30 днів.', luck: 'Успіхів у пошуку роботи!', subj: 'Ваше резюме та супровідний лист готові',
    code: (c) => `Ваш код знижки на 10 зл: ${c}. Використайте його для наступного замовлення та поділіться з друзями: кожен, хто його введе, заплатить на 10 зл менше, а ви за кожного друга, який оплатить замовлення, отримаєте 10 зл на наступні замовлення (до 50 зл). Код дійсний 90 днів.`,
    loginSubj: 'Ваше посилання для входу', login: 'натисніть, щоб увійти до свого акаунта CV Pod Ogłoszenie:', loginBtn: 'Увійти', loginNote: 'Посилання діє 20 хвилин і лише один раз. Якщо ви не просили про вхід, проігноруйте цей лист.' },
  de: { hi: 'Guten Tag,', ready: 'Ihre Unterlagen sind fertig. Sie finden sie im Anhang (PDF):', see: 'Sie können sie auch hier ansehen, bearbeiten und korrigieren:', del: 'Bestelldaten löschen wir automatisch nach 30 Tagen.', luck: 'Viel Erfolg bei Ihrer Bewerbung!', subj: 'Ihr Lebenslauf und Anschreiben sind fertig',
    code: (c) => `Ihr Rabattcode über 10 PLN: ${c}. Nutzen Sie ihn bei Ihrer nächsten Bestellung und geben Sie ihn an Freunde weiter: Wer ihn eingibt, zahlt 10 PLN weniger, und Sie erhalten für jede Person, die bezahlt, 10 PLN für Ihre nächsten Bestellungen (bis 50 PLN). Der Code ist 90 Tage gültig.`,
    loginSubj: 'Ihr Anmeldelink', login: 'klicken Sie hier, um sich bei Ihrem Konto bei CV Pod Ogłoszenie anzumelden:', loginBtn: 'Anmelden', loginNote: 'Der Link ist 20 Minuten gültig und funktioniert nur einmal. Wenn Sie keine Anmeldung angefordert haben, ignorieren Sie diese Nachricht.' },
};
const ml = (l) => ML[l] || ML.pl;

export async function sendOrderMail(order, baseUrl) {
  const L = ml(order.uiLang);
  const p = order.profile, link = `${baseUrl}/?id=${order.id}`;
  const attachments = [];
  const docs = order.results.flatMap((r) => [r, ...Object.values(r.variants || {})]);
  for (const r of docs) {
    const tag = `${slug(p.name)}-${slug(r.position)}${r.lang && r.lang !== 'pl' ? '-' + r.lang.toUpperCase() : ''}`;
    attachments.push({ filename: `CV-${tag}.pdf`, content: await renderCv(r, order.design, p.photo), contentType: 'application/pdf' });
    if (order.pkg !== 'cv' && r.letter) attachments.push({ filename: `List-motywacyjny-${tag}.pdf`, content: await renderLetter(r, order.design), contentType: 'application/pdf' });
    if (order.addons?.docx) {
      attachments.push({ filename: `CV-${tag}.docx`, content: await renderDocx(r, 'cv', order.design), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      if (order.pkg !== 'cv' && r.letter) attachments.push({ filename: `List-motywacyjny-${tag}.docx`, content: await renderDocx(r, 'letter', order.design), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    if (r.interview?.length) attachments.push({ filename: `Przygotowanie-do-rozmowy-${tag}.pdf`, content: await renderInterview(r, order.design), contentType: 'application/pdf' });
  }
  const list = order.results.map((r) => `• ${r.position}`).join('\n');
  const msgs = order.results.filter((r) => r.messages).map((r) => `--- ${r.position} ---\nWiadomość na LinkedIn:\n${r.messages.linkedin}\n\nE-mail z aplikacją\nTemat: ${r.messages.email?.subject}\n${r.messages.email?.body}`).join('\n\n')
    + order.results.filter((r) => r.linkedin).map((r) => `\n\n--- Profil LinkedIn: ${r.position} ---\nNagłówek:\n${r.linkedin.headline}\n\nInformacje:\n${r.linkedin.about}\n\nUmiejętności:\n${(r.linkedin.skills || []).join(', ')}${(r.linkedin.experience || []).map((e) => `\n\n${e.title}${e.company ? ', ' + e.company : ''}:\n${e.text}`).join('')}`).join('');
  const code = order.myCode ? `\n\n${L.code(order.myCode)}` : '';
  const text = `${L.hi}\n\n${L.ready}\n${list}\n\n${L.see} ${link}\n${L.del}${msgs ? '\n\n' + msgs : ''}${code}\n\n${L.luck}\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${L.ready}</p><ul>${order.results.map((r) => `<li>${esc(r.position)}</li>`).join('')}</ul><p>${L.see} <a href="${esc(link)}">${esc(link)}</a><br>${L.del}</p>${msgs ? `<pre style="white-space:pre-wrap;font:inherit">${esc(msgs)}</pre>` : ''}${order.myCode ? `<p><b>${esc(L.code(order.myCode))}</b></p>` : ''}<p>${L.luck}<br>CV Pod Ogłoszenie</p>`;
  const info = await transport().sendMail({
    from: process.env.MAIL_FROM || 'CV Pod Ogłoszenie <no-reply@localhost>', to: p.email,
    subject: L.subj, text, html, attachments,
  });
  return info;
}

const from = () => process.env.MAIL_FROM || 'CV Pod Ogłoszenie <no-reply@localhost>';

// Jednorazowe przypomnienie po 7 dniach (tylko za zgodą klienta wyrażoną w zamówieniu).
// Jednorazowa prośba o ocenę dokumentów (tylko za zgodą klienta wyrażoną w zamówieniu).
export async function sendReviewAsk(order, baseUrl) {
  const link = `${baseUrl}/?id=${order.id}#ocena`;
  const text = `Dzień dobry,\n\nkilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty:\n${link}\n\nTo jednorazowa wiadomość.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>kilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty.</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Oceń dokumenty</a></p><p style="color:#666;font-size:13px">To jednorazowa wiadomość.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: 'Jak oceniasz swoje CV? (30 sekund)', text, html });
}

export async function sendReminder(order, baseUrl) {
  const link = `${baseUrl}/?id=${order.rootId || order.parentId || order.id}`;
  const text = `Dzień dobry,\n\nminął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?\n\nJeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem ${order.myCode} zapłacisz 10 zł mniej` : ''}: ${link}\nMożesz też skorzystać z darmowej poprawki obecnych dokumentów.\n\nTo jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>minął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?</p><p>Jeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem <b>${esc(order.myCode)}</b> zapłacisz 10 zł mniej` : ''}: <a href="${esc(link)}">przejdź do swoich dokumentów</a>. Możesz też skorzystać z darmowej poprawki.</p><p style="color:#666;font-size:13px">To jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: 'Masz kolejne ogłoszenie? Twój kod −10 zł czeka', text, html });
}

// Link do logowania na konto (ważny 20 minut, jednorazowy).
export async function sendLoginLink(email, link, lang) {
  const L = ml(lang);
  const text = `${L.hi}\n\n${L.login}\n${link}\n\n${L.loginNote}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${L.login}</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${L.loginBtn}</a></p><p style="color:#666;font-size:13px">${L.loginNote}</p>`;
  return transport().sendMail({ from: from(), to: email, subject: L.loginSubj, text, html });
}

// Przypomnienie dzień przed rozmową (klient sam włącza je przy aplikacji).
export async function sendInterviewReminder(email, app, links) {
  const when = new Date(app.interviewAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const what = `${app.position || 'rozmowa'}${app.company ? ', ' + app.company : ''}`;
  const tips = ['Przeczytaj jeszcze raz ogłoszenie i swoje CV wysłane do tej firmy.', 'Przećwicz na głos odpowiedź na „Proszę opowiedzieć o sobie” (ok. 60 sekund).', 'Przygotuj 2-3 pytania do pracodawcy.', 'Sprawdź dojazd albo link, kamerę i mikrofon przy rozmowie online.'];
  const text = `Dzień dobry,\n\njutro masz rozmowę: ${what} (${when}).\n\nNa ostatnią chwilę:\n${tips.map((t) => '• ' + t).join('\n')}${links.prep ? `\n\nTwoje przygotowanie do rozmowy: ${links.prep}` : ''}\n\nTwoje aplikacje: ${links.account}\n\nPowodzenia!\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>jutro masz rozmowę: <b>${esc(what)}</b> (${esc(when)}).</p><p>Na ostatnią chwilę:</p><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${links.prep ? `<p><a href="${esc(links.prep)}">Otwórz swoje przygotowanie do rozmowy</a></p>` : ''}<p><a href="${esc(links.account)}">Twoje aplikacje</a></p><p>Powodzenia!<br>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: email, subject: `Jutro rozmowa: ${what}`, text, html });
}

// Powiadomienie o wiadomości z formularza kontaktowego / zapytaniu firmy (na CONTACT_EMAIL, odpowiedź trafia do nadawcy).
export async function sendContactNotice(m) {
  const firm = m.kind === 'firma';
  const rows = [['Imię i nazwisko', m.name], ['E-mail', m.email], ['Telefon', m.phone], ...(firm ? [['Organizacja', m.org], ['Typ', m.orgType], ['Liczba osób', m.size]] : [['Temat', m.topic]]), ['Wiadomość', m.message]].filter(([, v]) => v);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td valign="top"><b>${esc(k)}</b></td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`;
  return transport().sendMail({ from: from(), to: process.env.CONTACT_EMAIL, replyTo: m.email, subject: firm ? `Zapytanie od organizacji: ${m.org}` : `Wiadomość ze strony${m.topic ? ': ' + m.topic : ''}`, text, html });
}

// Potwierdzenie zapisu do newslettera (podwójna zgoda: bez kliknięcia nie wysyłamy nic więcej).
export async function sendNewsletterConfirm(email, link) {
  const text = `Dzień dobry,\n\nktoś (prawdopodobnie Ty) zapisał ten adres do newslettera CV Pod Ogłoszenie. Aby potwierdzić zapis, kliknij:\n${link}\n\nJeśli to nie Ty, zignoruj tę wiadomość: bez potwierdzenia nie wyślemy niczego więcej, a adres usuniemy po 7 dniach.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>ktoś (prawdopodobnie Ty) zapisał ten adres do newslettera CV Pod Ogłoszenie. Aby potwierdzić zapis, kliknij:</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Potwierdzam zapis</a></p><p style="color:#666;font-size:13px">Jeśli to nie Ty, zignoruj tę wiadomość: bez potwierdzenia nie wyślemy niczego więcej, a adres usuniemy po 7 dniach.</p>`;
  return transport().sendMail({ from: from(), to: email, subject: 'Potwierdź zapis do newslettera', text, html });
}

// Wydanie newslettera: zwykły tekst (akapity), link do wypisania w treści i w nagłówkach List-Unsubscribe.
export async function sendNewsletterIssue(email, { subject, text }, unsubscribe) {
  const foot = `Dostajesz tę wiadomość, bo zapisałeś się do newslettera CV Pod Ogłoszenie. Wypisz się: ${unsubscribe}`;
  const html = `${String(text).split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`).join('')}<hr><p style="color:#666;font-size:12px">Dostajesz tę wiadomość, bo zapisałeś się do newslettera CV Pod Ogłoszenie. <a href="${esc(unsubscribe)}">Wypisz się</a></p>`;
  return transport().sendMail({ from: from(), to: email, subject, text: `${text}\n\n--\n${foot}`, html, list: { unsubscribe: { url: unsubscribe, comment: 'Wypisz się' } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}
