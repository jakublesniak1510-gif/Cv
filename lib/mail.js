import nodemailer from 'nodemailer';
import { renderCv, renderLetter, renderInterview } from './pdf.js';
import { renderDocx } from './docx.js';

let tx;
// Poczta: SMTP_USER + SMTP_PASS (+ opcjonalnie SMTP_HOST, domyślnie OVH, i SMTP_PORT) – hasło wpisuje się wprost, bez kodowania.
// Albo jedna linijka SMTP_URL, np. smtps://user:haslo@smtp.resend.com:465 ("json" = tryb testowy bez wysyłki).
const smtpConfig = () => {
  const e = process.env;
  if (e.SMTP_URL) return e.SMTP_URL === 'json' ? { jsonTransport: true } : e.SMTP_URL;
  if (e.SMTP_USER && e.SMTP_PASS) { const port = Number(e.SMTP_PORT) || 465; return { host: e.SMTP_HOST || 'ssl0.ovh.net', port, secure: port === 465, auth: { user: e.SMTP_USER.trim(), pass: e.SMTP_PASS } }; }
  return null;
};
export const mailEnabled = () => !!smtpConfig();
const transport = () => (tx ||= nodemailer.createTransport(smtpConfig(), { connectionTimeout: 10_000, socketTimeout: 20_000 }));

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
  const g = /^https:\/\//.test(process.env.GOOGLE_REVIEW_URL || '') ? process.env.GOOGLE_REVIEW_URL : '';
  const text = `Dzień dobry,\n\nkilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty:\n${link}\n${g ? `\nMożesz też wystawić opinię w Google: ${g}\n` : ''}\nTo jednorazowa wiadomość.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>kilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty.</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Oceń dokumenty</a></p>${g ? `<p>Możesz też wystawić opinię w Google: <a href="${esc(g)}">oceń nas w Google</a>.</p>` : ''}<p style="color:#666;font-size:13px">To jednorazowa wiadomość.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: 'Jak oceniasz swoje CV? (30 sekund)', text, html });
}

export async function sendReminder(order, baseUrl) {
  const link = `${baseUrl}/?id=${order.rootId || order.parentId || order.id}`;
  const text = `Dzień dobry,\n\nminął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?\n\nJeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem ${order.myCode} zapłacisz 10 zł mniej` : ''}: ${link}\nMożesz też skorzystać z darmowej poprawki obecnych dokumentów.\n\nTo jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>minął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?</p><p>Jeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem <b>${esc(order.myCode)}</b> zapłacisz 10 zł mniej` : ''}: <a href="${esc(link)}">przejdź do swoich dokumentów</a>. Możesz też skorzystać z darmowej poprawki.</p><p style="color:#666;font-size:13px">To jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: 'Masz kolejne ogłoszenie? Twój kod −10 zł czeka', text, html });
}

// E-mail po miesiącu (jednorazowy, za zgodą): jak poszła rekrutacja + kod −10 zł; wysyłany dzień przed usunięciem danych zamówienia.
const FU = {
  pl: { subj: 'Jak poszła rekrutacja?', q: 'minął miesiąc od przygotowania Twojego CV. Jak poszło?', ok: 'Jeśli masz już nową pracę: gratulacje i dziękujemy, że skorzystałeś z CV Pod Ogłoszenie!', more: 'Jeśli nadal szukasz, przygotujemy CV pod kolejne ogłoszenie bez ponownego wpisywania danych', code: (c) => `, a z kodem ${c} zapłacisz 10 zł mniej`, btn: 'Zamów CV pod kolejne ogłoszenie', note: 'Link działa jeszcze przez 24 godziny: potem dane zamówienia usuwamy, zgodnie z polityką prywatności. To jednorazowa wiadomość.' },
  en: { subj: 'How did your job search go?', q: 'it has been a month since we prepared your CV. How did it go?', ok: 'If you already have a new job: congratulations, and thank you for using CV Pod Ogłoszenie!', more: 'If you are still looking, we will prepare a CV for your next job advertisement without entering your details again', code: (c) => `, and with the code ${c} you pay 10 PLN less`, btn: 'Order a CV for the next advertisement', note: 'The link works for another 24 hours: after that we delete the order data, as described in the privacy policy. This is a one-time message.' },
  uk: { subj: 'Як пройшов пошук роботи?', q: 'минув місяць відтоді, як ми підготували ваше резюме. Як усе пройшло?', ok: 'Якщо ви вже маєте нову роботу: вітаємо і дякуємо, що скористалися CV Pod Ogłoszenie!', more: 'Якщо ви ще шукаєте, ми підготуємо резюме під наступне оголошення без повторного введення даних', code: (c) => `, а з кодом ${c} ви заплатите на 10 зл менше`, btn: 'Замовити резюме під наступне оголошення', note: 'Посилання діє ще 24 години: потім ми видаляємо дані замовлення згідно з політикою конфіденційності. Це одноразове повідомлення.' },
  de: { subj: 'Wie lief Ihre Bewerbung?', q: 'vor einem Monat haben wir Ihren Lebenslauf erstellt. Wie ist es gelaufen?', ok: 'Wenn Sie schon eine neue Stelle haben: herzlichen Glückwunsch und danke, dass Sie CV Pod Ogłoszenie genutzt haben!', more: 'Wenn Sie noch suchen, erstellen wir Ihren Lebenslauf für die nächste Stellenanzeige, ohne dass Sie Ihre Daten erneut eingeben müssen', code: (c) => `, und mit dem Code ${c} zahlen Sie 10 PLN weniger`, btn: 'Lebenslauf für die nächste Anzeige bestellen', note: 'Der Link funktioniert noch 24 Stunden: danach löschen wir die Bestelldaten gemäß der Datenschutzerklärung. Dies ist eine einmalige Nachricht.' },
};
export async function sendFollowUp(order, baseUrl) {
  const l = FU[order.uiLang] ? order.uiLang : 'pl', F = FU[l], L = ml(l), link = `${baseUrl}/${l === 'pl' ? '' : l}?id=${order.id}#kolejne`;
  const more = F.more + (order.myCode ? F.code(order.myCode) : '') + '.';
  const text = `${L.hi}\n\n${F.q}\n\n${F.ok}\n\n${more}\n${link}\n\n${F.note}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${F.q}</p><p>${F.ok}</p><p>${esc(more)}</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${F.btn}</a></p><p style="color:#666;font-size:13px">${F.note}</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: F.subj, text, html });
}

// Przypomnienie o niedokończonej płatności (jednorazowe, za zgodą z formularza), w języku strony klienta.
const PAY = {
  pl: { subj: 'Twoje CV czeka na dokończenie zamówienia', body: 'Twoje zamówienie w CV Pod Ogłoszenie zostało rozpoczęte, ale płatność nie została dokończona. Dane są zapisane – wystarczy dokończyć płatność, a dokumenty powstaną od razu:', btn: 'Dokończ zamówienie', note: 'To jednorazowa wiadomość, wysłana za Twoją zgodą. Jeśli nie chcesz kończyć zamówienia, nic nie musisz robić – dane usuniemy automatycznie po 30 dniach.' },
  en: { subj: 'Your CV is waiting – finish your order', body: 'you started an order at CV Pod Ogłoszenie, but the payment was not completed. Your details are saved – just finish the payment and your documents will be created right away:', btn: 'Finish the order', note: 'This is a one-time message sent with your consent. If you do not want to finish the order, you do not need to do anything – we delete the data automatically after 30 days.' },
  uk: { subj: 'Ваше резюме чекає на завершення замовлення', body: 'ви почали замовлення в CV Pod Ogłoszenie, але оплату не завершено. Дані збережено – достатньо завершити оплату, і документи буде створено одразу:', btn: 'Завершити замовлення', note: 'Це одноразове повідомлення, надіслане за вашою згодою. Якщо не хочете завершувати замовлення, нічого робити не потрібно – дані буде автоматично видалено через 30 днів.' },
  de: { subj: 'Ihr Lebenslauf wartet – schließen Sie Ihre Bestellung ab', body: 'Sie haben bei CV Pod Ogłoszenie eine Bestellung begonnen, die Zahlung wurde jedoch nicht abgeschlossen. Ihre Angaben sind gespeichert – schließen Sie einfach die Zahlung ab, dann werden Ihre Unterlagen sofort erstellt:', btn: 'Bestellung abschließen', note: 'Dies ist eine einmalige Nachricht, die mit Ihrer Einwilligung gesendet wird. Wenn Sie die Bestellung nicht abschließen möchten, müssen Sie nichts tun – wir löschen die Daten automatisch nach 30 Tagen.' },
};
export async function sendPayReminder(order, baseUrl) {
  const l = PAY[order.uiLang] ? order.uiLang : 'pl', P = PAY[l], L = ml(l), link = `${baseUrl}/${l === 'pl' ? '' : l}?id=${order.id}`;
  const text = `${L.hi}\n\n${P.body}\n${link}\n\n${P.note}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${P.body}</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${P.btn}</a></p><p style="color:#666;font-size:13px">${P.note}</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: P.subj, text, html });
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

// Powiadomienie o wiadomości z formularza kontaktowego (na CONTACT_EMAIL, odpowiedź trafia do nadawcy).
export async function sendContactNotice(m) {
  const rows = [['Imię', m.name], ['E-mail', m.email], ['Temat', m.topic], ['Wiadomość', m.message]].filter(([, v]) => v);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td valign="top"><b>${esc(k)}</b></td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`;
  return transport().sendMail({ from: from(), to: process.env.CONTACT_EMAIL, replyTo: m.email, subject: `Wiadomość ze strony${m.topic ? ': ' + m.topic : ''}`, text, html });
}

// Ostrzeżenie dla właściciela (na CONTACT_EMAIL), np. gdy po płatności nie da się wygenerować dokumentów.
export async function sendAdminAlert(subject, text) {
  return transport().sendMail({ from: from(), to: process.env.CONTACT_EMAIL, subject: `[CV Pod Ogłoszenie] ${subject}`, text });
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

// Powiadomienia o ofertach (lib/alerts.js): potwierdzenie zapisu i cotygodniowe wydanie, w języku strony klienta.
const AL = {
  pl: { cSubj: 'Potwierdź powiadomienia o ofertach', c: (w) => `ktoś (prawdopodobnie Ty) chce dostawać co poniedziałek linki do ofert pracy: ${w}. Aby włączyć powiadomienia, kliknij:`, cBtn: 'Włączam powiadomienia', cNote: 'Jeśli to nie Ty, zignoruj tę wiadomość: bez potwierdzenia nie wyślemy niczego więcej, a adres usuniemy po 7 dniach.',
    subj: (w) => `Nowe oferty w tym tygodniu: ${w}`, intro: (w) => `oto linki do najnowszych ofert pracy: ${w}. Każdy otwiera wyniki wyszukiwania na portalu z ogłoszeniami.`, tip: 'Porada tygodnia', found: 'Znalazłeś ofertę? Wklej link, a przygotujemy CV pod to ogłoszenie w kilka minut:', orderBtn: 'Zrób CV pod ogłoszenie', left: (n) => (n ? `Zostało jeszcze ${n} wydań, potem powiadomienia wygasną same.` : 'To ostatnie wydanie: powiadomienia wygasają. Możesz zapisać się ponownie na stronie.'), stop: 'Wyłącz powiadomienia', why: 'Dostajesz tę wiadomość, bo włączyłeś powiadomienia o ofertach w CV Pod Ogłoszenie.' },
  en: { cSubj: 'Confirm your job alerts', c: (w) => `someone (probably you) wants to receive links to job offers every Monday: ${w}. To turn on the alerts, click:`, cBtn: 'Turn on alerts', cNote: 'If this was not you, ignore this message: without confirmation we will not send anything else, and we delete the address after 7 days.',
    subj: (w) => `New job offers this week: ${w}`, intro: (w) => `here are links to the latest job offers: ${w}. Each one opens search results on a job portal.`, tip: 'Tip of the week', found: 'Found an offer? Paste the link and we will prepare a CV for that advertisement in a few minutes:', orderBtn: 'Make a CV for the advertisement', left: (n) => (n ? `${n} more issues left, then the alerts expire on their own.` : 'This is the last issue: the alerts expire. You can sign up again on the website.'), stop: 'Turn off alerts', why: 'You are receiving this message because you turned on job alerts at CV Pod Ogłoszenie.' },
  uk: { cSubj: 'Підтвердьте сповіщення про вакансії', c: (w) => `хтось (імовірно, ви) хоче щопонеділка отримувати посилання на вакансії: ${w}. Щоб увімкнути сповіщення, натисніть:`, cBtn: 'Увімкнути сповіщення', cNote: 'Якщо це були не ви, проігноруйте цей лист: без підтвердження ми більше нічого не надішлемо, а адресу видалимо через 7 днів.',
    subj: (w) => `Нові вакансії цього тижня: ${w}`, intro: (w) => `ось посилання на найновіші вакансії: ${w}. Кожне відкриває результати пошуку на порталі з оголошеннями.`, tip: 'Порада тижня', found: 'Знайшли вакансію? Вставте посилання, і ми підготуємо резюме під це оголошення за кілька хвилин:', orderBtn: 'Створити резюме під оголошення', left: (n) => (n ? `Залишилося ще ${n} випусків, потім сповіщення вимкнуться самі.` : 'Це останній випуск: сповіщення вимикаються. Ви можете підписатися знову на сайті.'), stop: 'Вимкнути сповіщення', why: 'Ви отримуєте цей лист, бо увімкнули сповіщення про вакансії в CV Pod Ogłoszenie.' },
  de: { cSubj: 'Bestätigen Sie Ihre Job-Benachrichtigungen', c: (w) => `jemand (wahrscheinlich Sie) möchte jeden Montag Links zu Stellenangeboten erhalten: ${w}. Um die Benachrichtigungen einzuschalten, klicken Sie:`, cBtn: 'Benachrichtigungen einschalten', cNote: 'Wenn Sie das nicht waren, ignorieren Sie diese Nachricht: Ohne Bestätigung senden wir nichts weiter und löschen die Adresse nach 7 Tagen.',
    subj: (w) => `Neue Stellenangebote diese Woche: ${w}`, intro: (w) => `hier sind Links zu den neuesten Stellenangeboten: ${w}. Jeder Link öffnet die Suchergebnisse auf einem Jobportal.`, tip: 'Tipp der Woche', found: 'Ein Angebot gefunden? Fügen Sie den Link ein, und wir erstellen in wenigen Minuten einen Lebenslauf für diese Anzeige:', orderBtn: 'Lebenslauf für die Anzeige erstellen', left: (n) => (n ? `Noch ${n} Ausgaben, danach enden die Benachrichtigungen von selbst.` : 'Dies ist die letzte Ausgabe: Die Benachrichtigungen enden. Sie können sich auf der Website erneut anmelden.'), stop: 'Benachrichtigungen ausschalten', why: 'Sie erhalten diese Nachricht, weil Sie Job-Benachrichtigungen bei CV Pod Ogłoszenie eingeschaltet haben.' },
};
const btn = (href, t) => `<a href="${esc(href)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${esc(t)}</a>`;
export async function sendAlertConfirm(email, { job, city, lang }, link) {
  const A = AL[lang] || AL.pl, L = ml(lang), what = `${job}${city ? ', ' + city : ''}`;
  const text = `${L.hi}\n\n${A.c(what)}\n${link}\n\n${A.cNote}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${esc(A.c(what))}</p><p>${btn(link, A.cBtn)}</p><p style="color:#666;font-size:13px">${A.cNote}</p>`;
  return transport().sendMail({ from: from(), to: email, subject: A.cSubj, text, html });
}
export async function sendAlertIssue(a, { links, tip, order, stop, left }) {
  const A = AL[a.lang] || AL.pl, L = ml(a.lang), what = `${a.job}${a.city ? ', ' + a.city : ''}`;
  const text = [`${L.hi}`, A.intro(what), links.map(([n, u]) => `• ${n}: ${u}`).join('\n'), tip ? `${A.tip}: ${tip.title}\n${tip.url}` : '', `${A.found}\n${order}`, A.left(left), `--\n${A.why} ${A.stop}: ${stop}`].filter(Boolean).join('\n\n');
  const html = `<p>${L.hi}</p><p>${esc(A.intro(what))}</p><ul>${links.map(([n, u]) => `<li><a href="${esc(u)}">${esc(n)}</a></li>`).join('')}</ul>${tip ? `<p><b>${A.tip}:</b> <a href="${esc(tip.url)}">${esc(tip.title)}</a></p>` : ''}<p>${esc(A.found)}</p><p>${btn(order, A.orderBtn)}</p><p style="color:#666;font-size:13px">${esc(A.left(left))}</p><hr><p style="color:#666;font-size:12px">${A.why} <a href="${esc(stop)}">${A.stop}</a></p>`;
  return transport().sendMail({ from: from(), to: a.email, subject: A.subj(what), text, html, list: { unsubscribe: { url: stop, comment: A.stop } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}
