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
  pl: { shareLbl: "Wyślij link znajomym:", shareTxt: "Robię CV pod konkretne ogłoszenie na CV Pod Ogłoszenie. Z moim linkiem zapłacisz 10 zł mniej:", hi: 'Dzień dobry,', ready: 'Twoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):', see: 'Możesz je też zobaczyć, edytować i poprawić na stronie:', del: 'Dane zamówienia usuwamy automatycznie po 30 dniach.', luck: 'Powodzenia w rekrutacji!', subj: 'Twoje CV i list motywacyjny są gotowe',
    code: (c) => `Twój kod −10 zł: ${c}. Użyj go przy kolejnym zamówieniu i podaj znajomym: każdy, kto go wpisze, zapłaci 10 zł mniej, a Ty za każdego znajomego, który zapłaci, dostaniesz 10 zł na kolejne zamówienia (do 50 zł). Kod jest ważny 90 dni.`,
    loginSubj: 'Twój link do logowania', login: 'kliknij, aby zalogować się na swoje konto w CV Pod Ogłoszenie:', loginBtn: 'Zaloguj się', loginNote: 'Link działa 20 minut i tylko raz. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.' },
  en: { shareLbl: "Send the link to friends:", shareTxt: "I'm getting a CV tailored to a job ad at CV Pod Ogłoszenie. With my link you pay 10 PLN less:", hi: 'Hello,', ready: 'Your documents are ready. You will find them attached (PDF):', see: 'You can also view, edit and correct them here:', del: 'We automatically delete order data after 30 days.', luck: 'Good luck with your application!', subj: 'Your CV and cover letter are ready',
    code: (c) => `Your 10 PLN discount code: ${c}. Use it for your next order and share it with friends: anyone who enters it pays 10 PLN less, and for every friend who pays you get 10 PLN towards your next orders (up to 50 PLN). The code is valid for 90 days.`,
    loginSubj: 'Your login link', login: 'click to log in to your CV Pod Ogłoszenie account:', loginBtn: 'Log in', loginNote: 'The link works for 20 minutes and only once. If you did not ask to log in, ignore this message.' },
  uk: { shareLbl: "Надішліть посилання друзям:", shareTxt: "Я замовляю резюме під конкретне оголошення на CV Pod Ogłoszenie. З моїм посиланням ви заплатите на 10 зл менше:", hi: 'Добрий день,', ready: 'Ваші документи готові, вони у вкладеннях (PDF):', see: 'Ви також можете переглянути, відредагувати й виправити їх на сторінці:', del: 'Дані замовлення ми автоматично видаляємо через 30 днів.', luck: 'Успіхів у пошуку роботи!', subj: 'Ваше резюме та супровідний лист готові',
    code: (c) => `Ваш код знижки на 10 зл: ${c}. Використайте його для наступного замовлення та поділіться з друзями: кожен, хто його введе, заплатить на 10 зл менше, а ви за кожного друга, який оплатить замовлення, отримаєте 10 зл на наступні замовлення (до 50 зл). Код дійсний 90 днів.`,
    loginSubj: 'Ваше посилання для входу', login: 'натисніть, щоб увійти до свого акаунта CV Pod Ogłoszenie:', loginBtn: 'Увійти', loginNote: 'Посилання діє 20 хвилин і лише один раз. Якщо ви не просили про вхід, проігноруйте цей лист.' },
  de: { shareLbl: "Link an Freunde senden:", shareTxt: "Ich lasse meinen Lebenslauf bei CV Pod Ogłoszenie auf eine Stellenanzeige zuschneiden. Mit meinem Link zahlst du 10 PLN weniger:", hi: 'Guten Tag,', ready: 'Ihre Unterlagen sind fertig. Sie finden sie im Anhang (PDF):', see: 'Sie können sie auch hier ansehen, bearbeiten und korrigieren:', del: 'Bestelldaten löschen wir automatisch nach 30 Tagen.', luck: 'Viel Erfolg bei Ihrer Bewerbung!', subj: 'Ihr Lebenslauf und Anschreiben sind fertig',
    code: (c) => `Ihr Rabattcode über 10 PLN: ${c}. Nutzen Sie ihn bei Ihrer nächsten Bestellung und geben Sie ihn an Freunde weiter: Wer ihn eingibt, zahlt 10 PLN weniger, und Sie erhalten für jede Person, die bezahlt, 10 PLN für Ihre nächsten Bestellungen (bis 50 PLN). Der Code ist 90 Tage gültig.`,
    loginSubj: 'Ihr Anmeldelink', login: 'klicken Sie hier, um sich bei Ihrem Konto bei CV Pod Ogłoszenie anzumelden:', loginBtn: 'Anmelden', loginNote: 'Der Link ist 20 Minuten gültig und funktioniert nur einmal. Wenn Sie keine Anmeldung angefordert haben, ignorieren Sie diese Nachricht.' },
};
const ml = (l) => ML[l] || ML.pl;
// Linki „wyślij znajomym” w e-mailu z dokumentami: WhatsApp, Messenger (telefon), SMS, Telegram, e-mail, z gotową treścią.
const shareLinks = (L, link) => {
  const t = `${L.shareTxt} ${link}`, e = encodeURIComponent, a = (href, label) => `<a href="${esc(href)}" style="display:inline-block;margin:0 10px 6px 0">${label}</a>`;
  return `<p>${esc(L.shareLbl)}<br>${a(`https://wa.me/?text=${e(t)}`, 'WhatsApp')}${a(`fb-messenger://share/?link=${e(link)}`, 'Messenger')}${a(`sms:?&body=${e(t)}`, 'SMS')}${a(`https://t.me/share/url?url=${e(link)}&text=${e(L.shareTxt)}`, 'Telegram')}${a(`mailto:?body=${e(t)}`, 'E-mail')}</p>`;
};

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
  const html = `<p>${L.hi}</p><p>${L.ready}</p><ul>${order.results.map((r) => `<li>${esc(r.position)}</li>`).join('')}</ul><p>${L.see} <a href="${esc(link)}">${esc(link)}</a><br>${L.del}</p>${msgs ? `<pre style="white-space:pre-wrap;font:inherit">${esc(msgs)}</pre>` : ''}${order.myCode ? `<p><b>${esc(L.code(order.myCode))}</b></p>${shareLinks(L, `${baseUrl}/?ref=${order.myCode}`)}` : ''}<p>${L.luck}<br>CV Pod Ogłoszenie</p>`;
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
  // Opinia w innym serwisie (np. Trustpilot): REVIEW_URL (https) i REVIEW_SITE_NAME (domyślnie „Trustpilot”).
  const rv = /^https:\/\/[^\s"'<>]{4,300}$/.test(process.env.REVIEW_URL || '') ? process.env.REVIEW_URL : '', rvName = (process.env.REVIEW_SITE_NAME || 'Trustpilot').trim().slice(0, 40);
  const text = `Dzień dobry,\n\nkilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty:\n${link}\n${g ? `\nMożesz też wystawić opinię w Google: ${g}\n` : ''}${rv ? `\nMożesz też wystawić opinię na ${rvName}: ${rv}\n` : ''}\nTo jednorazowa wiadomość.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>kilka dni temu przygotowaliśmy Twoje CV. Jak się sprawdza? Twoja ocena (wystarczą gwiazdki, komentarz jest opcjonalny) pomaga innym wybrać, a nam poprawiać dokumenty.</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Oceń dokumenty</a></p>${g ? `<p>Możesz też wystawić opinię w Google: <a href="${esc(g)}">oceń nas w Google</a>.</p>` : ''}${rv ? `<p>Możesz też wystawić opinię na ${esc(rvName)}: <a href="${esc(rv)}">oceń nas na ${esc(rvName)}</a>.</p>` : ''}<p style="color:#666;font-size:13px">To jednorazowa wiadomość.</p><p>CV Pod Ogłoszenie</p>`;
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

// Karnety (lib/passes.js): aktywacja z linkiem logowania (i fakturą), przypomnienie 3 dni przed końcem i w dniu wygaśnięcia.
// Przypomnienia to informacja o usłudze, bez zachęty do „odnowienia” (karnet się nie odnawia).
const PS = {
  pl: { aSubj: (n) => `Karnet „${n}” jest aktywny`, a: (n, m, d) => `dziękujemy za zakup karnetu „${n}”. Masz ${m} dopasowań (CV + list pod jedno ogłoszenie), ważnych do ${d}. Karnet jest na Twoim koncie – zaloguj się tym linkiem (działa 7 dni, potem poprosisz o nowy na stronie konta):`, aBtn: 'Przejdź do konta', aHow: 'W formularzu zamówienia zaznacz „Użyj karnetu”. To płatność jednorazowa: karnet nie odnawia się i nic więcej nie pobierzemy. Niewykorzystane dopasowania przepadają po terminie ważności.', terms: 'Zasady karnetów i prawo odstąpienia: Regulamin', d3Subj: (n) => `Karnet „${n}” wygasa za 3 dni`, d3: (n, m, d) => `Twój karnet „${n}” jest ważny do ${d}. Zostało ${m} dopasowań – po tym terminie przepadną. Karnet nie odnawia się sam.`, d0Subj: (n) => `Karnet „${n}” wygasł`, d0: (n, m) => `Twój karnet „${n}” wygasł${m ? ` (niewykorzystane dopasowania: ${m})` : ''}. Nic nie zostanie pobrane – karnet się nie odnawia.`, acc: 'Stan karnetu i historia na koncie:', prices: 'Cennik, jeśli kiedyś będziesz potrzebować kolejnych CV:' },
  en: { aSubj: (n) => `Your “${n}” pass is active`, a: (n, m, d) => `thank you for buying the “${n}” pass. You have ${m} matches (CV + cover letter for one job ad), valid until ${d}. The pass is in your account – log in with this link (valid for 7 days; after that you can request a new one on the account page):`, aBtn: 'Go to my account', aHow: 'In the order form, tick “Use my pass”. This is a one-off payment: the pass does not renew and nothing else will be charged. Unused matches expire at the end of the validity period.', terms: 'Pass rules and the right of withdrawal: Terms of Service', d3Subj: (n) => `Your “${n}” pass expires in 3 days`, d3: (n, m, d) => `Your “${n}” pass is valid until ${d}. You have ${m} matches left – after that date they expire. The pass does not renew automatically.`, d0Subj: (n) => `Your “${n}” pass has expired`, d0: (n, m) => `Your “${n}” pass has expired${m ? ` (unused matches: ${m})` : ''}. Nothing will be charged – the pass does not renew.`, acc: 'Pass status and history in your account:', prices: 'Prices, in case you need more CVs one day:' },
  uk: { aSubj: (n) => `Абонемент «${n}» активний`, a: (n, m, d) => `дякуємо за купівлю абонемента «${n}». У вас ${m} підборів (резюме + супровідний лист під одне оголошення), дійсних до ${d}. Абонемент у вашому акаунті – увійдіть за цим посиланням (діє 7 днів, потім можна запросити нове на сторінці акаунта):`, aBtn: 'Перейти до акаунта', aHow: 'У формі замовлення позначте «Використати абонемент». Це одноразовий платіж: абонемент не поновлюється, і більше нічого не буде списано. Невикористані підбори згорають після закінчення терміну дії.', terms: 'Правила абонементів і право відмови: Правила користування', d3Subj: (n) => `Абонемент «${n}» закінчується через 3 дні`, d3: (n, m, d) => `Ваш абонемент «${n}» дійсний до ${d}. Залишилося ${m} підборів – після цієї дати вони згорять. Абонемент не поновлюється автоматично.`, d0Subj: (n) => `Абонемент «${n}» закінчився`, d0: (n, m) => `Ваш абонемент «${n}» закінчився${m ? ` (невикористані підбори: ${m})` : ''}. Нічого не буде списано – абонемент не поновлюється.`, acc: 'Стан абонемента та історія в акаунті:', prices: 'Ціни, якщо колись знадобляться ще резюме:' },
  de: { aSubj: (n) => `Ihr Paket „${n}“ ist aktiv`, a: (n, m, d) => `vielen Dank für den Kauf des Pakets „${n}“. Sie haben ${m} Anpassungen (Lebenslauf + Anschreiben für eine Stellenanzeige), gültig bis ${d}. Das Paket ist in Ihrem Konto – melden Sie sich mit diesem Link an (7 Tage gültig, danach können Sie auf der Kontoseite einen neuen anfordern):`, aBtn: 'Zum Konto', aHow: 'Kreuzen Sie im Bestellformular „Paket verwenden“ an. Es ist eine Einmalzahlung: Das Paket verlängert sich nicht und es wird nichts weiter abgebucht. Nicht genutzte Anpassungen verfallen nach Ablauf der Gültigkeit.', terms: 'Regeln der Pakete und Widerrufsrecht: AGB', d3Subj: (n) => `Ihr Paket „${n}“ läuft in 3 Tagen ab`, d3: (n, m, d) => `Ihr Paket „${n}“ ist bis ${d} gültig. Sie haben noch ${m} Anpassungen – danach verfallen sie. Das Paket verlängert sich nicht automatisch.`, d0Subj: (n) => `Ihr Paket „${n}“ ist abgelaufen`, d0: (n, m) => `Ihr Paket „${n}“ ist abgelaufen${m ? ` (nicht genutzte Anpassungen: ${m})` : ''}. Es wird nichts abgebucht – das Paket verlängert sich nicht.`, acc: 'Status und Verlauf im Konto:', prices: 'Preise, falls Sie einmal weitere Lebensläufe brauchen:' },
};
const passDate = (t, l) => new Date(t).toLocaleDateString({ pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA', de: 'de-DE' }[l] || 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
const PASS_NAMES = { start30: 'Start 30', aktywny30: 'Aktywny 30', maraton60: 'Maraton 60' };
export async function sendPassMail(p, kind, { link, terms = '', prices = '', invoice = null }) {
  const l = PS[p.lang] ? p.lang : 'pl', P = PS[l], L = ml(l), n = PASS_NAMES[p.kind] || p.kind, d = passDate(p.expires, l);
  let subject, paras, button = null, extra = [];
  if (kind === 'active') { subject = P.aSubj(n); paras = [P.a(n, p.left.matches, d)]; button = [link, P.aBtn]; extra = [P.aHow, terms ? `${P.terms}: ${terms}` : '']; }
  else if (kind === 'd3') { subject = P.d3Subj(n); paras = [P.d3(n, p.left.matches, d), `${P.acc} ${link}`]; }
  else { subject = P.d0Subj(n); paras = [P.d0(n, p.left.matches), `${P.acc} ${link}`, prices ? `${P.prices} ${prices}` : '']; }
  paras = paras.filter(Boolean); extra = extra.filter(Boolean);
  const text = [L.hi, ...paras, button ? button[0] : '', ...extra, 'CV Pod Ogłoszenie'].filter(Boolean).join('\n\n');
  const html = `<p>${L.hi}</p>${paras.map((t) => `<p>${esc(t)}</p>`).join('')}${button ? `<p>${btn(button[0], button[1])}</p>` : ''}${extra.map((t) => `<p style="color:#666;font-size:13px">${esc(t)}</p>`).join('')}`;
  const attachments = invoice ? [{ filename: `faktura-${invoice.inv.number.replace(/[^0-9A-Za-z]+/g, '-')}.pdf`, content: invoice.pdf, contentType: 'application/pdf' }] : [];
  return transport().sendMail({ from: from(), to: p.email, subject, text, html, attachments });
}

// Szkic kreatora (lib/wizard-drafts.js): link do dokończenia na prośbę klienta i jedno przypomnienie za osobną zgodą.
const DR = {
  pl: { lSubj: 'Link do dokończenia zamówienia CV', l: 'oto link do formularza zamówienia CV z danymi, które już wpisano. Otwórz go na dowolnym urządzeniu i dokończ, kiedy Ci wygodnie:', btn: 'Dokończ zamówienie', keep: (d) => `Szkic (bez zdjęcia) przechowujemy do ${d}, potem usuniemy go automatycznie.`, remindOn: 'Zgodnie z Twoją prośbą przypomnimy raz, po 24 godzinach, jeśli nie złożysz zamówienia.', notYou: 'Jeśli to nie Ty, zignoruj tę wiadomość – szkic zniknie sam.', stop: 'Wyłącz przypomnienie albo usuń szkic', rSubj: 'Twoje CV czeka na dokończenie', r: 'wczoraj zapisano szkic zamówienia CV. Dane są zachowane – wystarczy dokończyć formularz:', rOnce: 'To jedyne przypomnienie, wysłane za Twoją zgodą. Link z poprzedniego e-maila już nie działa, użyj tego.' },
  en: { lSubj: 'Link to finish your CV order', l: 'here is the link to the CV order form with the details already entered. Open it on any device and finish whenever it suits you:', btn: 'Finish the order', keep: (d) => `We keep the draft (without the photo) until ${d}, then delete it automatically.`, remindOn: 'As requested, we will remind you once, after 24 hours, if you have not placed the order.', notYou: 'If this was not you, ignore this message – the draft will disappear on its own.', stop: 'Turn off the reminder or delete the draft', rSubj: 'Your CV is waiting to be finished', r: 'yesterday a draft CV order was saved. The details are kept – just finish the form:', rOnce: 'This is the only reminder, sent with your consent. The link from the previous e-mail no longer works, please use this one.' },
  uk: { lSubj: 'Посилання для завершення замовлення резюме', l: 'ось посилання на форму замовлення резюме з уже введеними даними. Відкрийте його на будь-якому пристрої та завершіть, коли вам зручно:', btn: 'Завершити замовлення', keep: (d) => `Чернетку (без фото) зберігаємо до ${d}, потім автоматично видалимо.`, remindOn: 'Як ви просили, ми нагадаємо один раз, через 24 години, якщо ви не оформите замовлення.', notYou: 'Якщо це були не ви, проігноруйте цей лист – чернетка зникне сама.', stop: 'Вимкнути нагадування або видалити чернетку', rSubj: 'Ваше резюме чекає на завершення', r: 'учора було збережено чернетку замовлення резюме. Дані збережено – залишилося лише завершити форму:', rOnce: 'Це єдине нагадування, надіслане за вашою згодою. Посилання з попереднього листа вже не діє, скористайтеся цим.' },
  de: { lSubj: 'Link zum Abschließen Ihrer Lebenslauf-Bestellung', l: 'hier ist der Link zum Bestellformular mit den bereits eingegebenen Daten. Öffnen Sie ihn auf einem beliebigen Gerät und schließen Sie die Bestellung ab, wann es Ihnen passt:', btn: 'Bestellung abschließen', keep: (d) => `Den Entwurf (ohne Foto) speichern wir bis ${d}, danach wird er automatisch gelöscht.`, remindOn: 'Wie gewünscht erinnern wir Sie einmal nach 24 Stunden, falls Sie noch nicht bestellt haben.', notYou: 'Wenn Sie das nicht waren, ignorieren Sie diese Nachricht – der Entwurf verschwindet von selbst.', stop: 'Erinnerung ausschalten oder Entwurf löschen', rSubj: 'Ihr Lebenslauf wartet auf den Abschluss', r: 'gestern wurde ein Entwurf Ihrer Lebenslauf-Bestellung gespeichert. Die Daten sind erhalten – schließen Sie das Formular einfach ab:', rOnce: 'Dies ist die einzige Erinnerung, gesendet mit Ihrer Einwilligung. Der Link aus der vorherigen E-Mail funktioniert nicht mehr, bitte verwenden Sie diesen.' },
};
const dateIn = (t, l) => new Date(t).toLocaleDateString({ pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA', de: 'de-DE' }[l] || 'pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });
const draftMail = (d, { link, stop, until }, kind) => {
  const l = DR[d.lang] ? d.lang : 'pl', D = DR[l], L = ml(l), lead = kind === 'link' ? D.l : D.r;
  const notes = kind === 'link' ? [D.keep(dateIn(until, l)), d.reminder?.consent ? D.remindOn : '', D.notYou] : [D.rOnce, D.keep(dateIn(until, l))];
  const text = [L.hi, `${lead}\n${link}`, ...notes.filter(Boolean), `--\n${D.stop}: ${stop}`].join('\n\n');
  const html = `<p>${L.hi}</p><p>${esc(lead)}</p><p>${btn(link, D.btn)}</p>${notes.filter(Boolean).map((n) => `<p style="color:#666;font-size:13px">${esc(n)}</p>`).join('')}<hr><p style="color:#666;font-size:12px"><a href="${esc(stop)}">${esc(D.stop)}</a></p>`;
  return transport().sendMail({ from: from(), to: d.email, subject: kind === 'link' ? D.lSubj : D.rSubj, text, html, list: { unsubscribe: { url: stop, comment: D.stop } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
};
export const sendDraftLink = (d, o) => draftMail(d, o, 'link');
export const sendDraftReminder = (d, o) => draftMail(d, o, 'reminder');

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

// Faktura PDF dla klienta (osobny e-mail zaraz po płatności), w języku strony.
const INV = {
  pl: { subj: (n) => `Faktura ${n} – CV Pod Ogłoszenie`, body: (n, link) => `Dzień dobry,\n\nw załączniku faktura ${n} za zamówienie w CV Pod Ogłoszenie. Fakturę znajdziesz też na stronie swoich dokumentów:\n${link}\n\nDziękujemy!\nCV Pod Ogłoszenie` },
  en: { subj: (n) => `Invoice ${n} – CV Pod Ogłoszenie`, body: (n, link) => `Hello,\n\nplease find attached invoice ${n} for your CV Pod Ogłoszenie order. It is also available on your documents page:\n${link}\n\nThank you!\nCV Pod Ogłoszenie` },
  uk: { subj: (n) => `Рахунок-фактура ${n} – CV Pod Ogłoszenie`, body: (n, link) => `Добрий день,\n\nу вкладенні рахунок-фактура ${n} за замовлення в CV Pod Ogłoszenie. Її також можна знайти на сторінці ваших документів:\n${link}\n\nДякуємо!\nCV Pod Ogłoszenie` },
  de: { subj: (n) => `Rechnung ${n} – CV Pod Ogłoszenie`, body: (n, link) => `Guten Tag,\n\nim Anhang finden Sie die Rechnung ${n} für Ihre Bestellung bei CV Pod Ogłoszenie. Sie ist auch auf Ihrer Dokumentenseite verfügbar:\n${link}\n\nVielen Dank!\nCV Pod Ogłoszenie` },
};
export async function sendInvoiceMail(order, inv, pdf, baseUrl) {
  const l = INV[order.uiLang] ? order.uiLang : 'pl', link = `${baseUrl}/${l === 'pl' ? '' : l}?id=${order.id}`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: INV[l].subj(inv.number), text: INV[l].body(inv.number, link),
    attachments: [{ filename: `faktura-${inv.number.replace(/[^0-9A-Za-z]+/g, '-')}.pdf`, content: pdf, contentType: 'application/pdf' }] });
}

// Wiadomości dla właściciela (nowe zamówienie, poranne podsumowanie z kopią zapasową): na BACKUP_EMAIL albo CONTACT_EMAIL.
export async function sendOwnerMail(subject, text, attachments = []) {
  return transport().sendMail({ from: from(), to: process.env.BACKUP_EMAIL || process.env.CONTACT_EMAIL, subject: `[CV Pod Ogłoszenie] ${subject}`, text, attachments });
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
  pl: { cSubj: 'Potwierdź powiadomienia o ofertach', c: (w) => `ktoś (prawdopodobnie Ty) chce dostawać raz w tygodniu linki do ofert pracy: ${w}. Aby włączyć powiadomienia, kliknij:`, cBtn: 'Włączam powiadomienia', cNote: 'Jeśli to nie Ty, zignoruj tę wiadomość: bez potwierdzenia nie wyślemy niczego więcej, a adres usuniemy po 7 dniach.',
    jIntro: (w) => `oto nowe oferty pracy z ostatnich 7 dni: ${w}. Przy każdej możesz od razu zamówić CV dopasowane do tego ogłoszenia.`, jOpen: 'Zobacz ofertę', jFit: 'Dopasuj CV do tej oferty', jMore: 'Więcej ofert w wyszukiwarkach portali:', jVia: 'Oferty pochodzą z serwisów partnerskich',
    subj: (w) => `Nowe oferty w tym tygodniu: ${w}`, intro: (w) => `oto linki do najnowszych ofert pracy: ${w}. Każdy otwiera wyniki wyszukiwania na portalu z ogłoszeniami.`, tip: 'Porada tygodnia', found: 'Znalazłeś ofertę? Wklej link, a przygotujemy CV pod to ogłoszenie w kilka minut:', orderBtn: 'Zrób CV pod ogłoszenie', left: (n) => (n ? `Zostało jeszcze ${n} wydań, potem powiadomienia wygasną same.` : 'To ostatnie wydanie: powiadomienia wygasają. Możesz zapisać się ponownie na stronie.'), stop: 'Wyłącz powiadomienia', why: 'Dostajesz tę wiadomość, bo włączyłeś powiadomienia o ofertach w CV Pod Ogłoszenie.' },
  en: { cSubj: 'Confirm your job alerts', c: (w) => `someone (probably you) wants to receive links to job offers once a week: ${w}. To turn on the alerts, click:`, cBtn: 'Turn on alerts', cNote: 'If this was not you, ignore this message: without confirmation we will not send anything else, and we delete the address after 7 days.',
    jIntro: (w) => `here are new job offers from the last 7 days: ${w}. For each one you can order a CV tailored to that advertisement right away.`, jOpen: 'View offer', jFit: 'Tailor my CV to this offer', jMore: 'More offers on job portals:', jVia: 'Offers come from partner services',
    subj: (w) => `New job offers this week: ${w}`, intro: (w) => `here are links to the latest job offers: ${w}. Each one opens search results on a job portal.`, tip: 'Tip of the week', found: 'Found an offer? Paste the link and we will prepare a CV for that advertisement in a few minutes:', orderBtn: 'Make a CV for the advertisement', left: (n) => (n ? `${n} more issues left, then the alerts expire on their own.` : 'This is the last issue: the alerts expire. You can sign up again on the website.'), stop: 'Turn off alerts', why: 'You are receiving this message because you turned on job alerts at CV Pod Ogłoszenie.' },
  uk: { cSubj: 'Підтвердьте сповіщення про вакансії', c: (w) => `хтось (імовірно, ви) хоче раз на тиждень отримувати посилання на вакансії: ${w}. Щоб увімкнути сповіщення, натисніть:`, cBtn: 'Увімкнути сповіщення', cNote: 'Якщо це були не ви, проігноруйте цей лист: без підтвердження ми більше нічого не надішлемо, а адресу видалимо через 7 днів.',
    jIntro: (w) => `ось нові вакансії за останні 7 днів: ${w}. Для кожної можна одразу замовити резюме, підготовлене під це оголошення.`, jOpen: 'Переглянути вакансію', jFit: 'Підготувати резюме під цю вакансію', jMore: 'Більше вакансій на порталах:', jVia: 'Вакансії надані партнерськими сервісами',
    subj: (w) => `Нові вакансії цього тижня: ${w}`, intro: (w) => `ось посилання на найновіші вакансії: ${w}. Кожне відкриває результати пошуку на порталі з оголошеннями.`, tip: 'Порада тижня', found: 'Знайшли вакансію? Вставте посилання, і ми підготуємо резюме під це оголошення за кілька хвилин:', orderBtn: 'Створити резюме під оголошення', left: (n) => (n ? `Залишилося ще ${n} випусків, потім сповіщення вимкнуться самі.` : 'Це останній випуск: сповіщення вимикаються. Ви можете підписатися знову на сайті.'), stop: 'Вимкнути сповіщення', why: 'Ви отримуєте цей лист, бо увімкнули сповіщення про вакансії в CV Pod Ogłoszenie.' },
  de: { cSubj: 'Bestätigen Sie Ihre Job-Benachrichtigungen', c: (w) => `jemand (wahrscheinlich Sie) möchte einmal pro Woche Links zu Stellenangeboten erhalten: ${w}. Um die Benachrichtigungen einzuschalten, klicken Sie:`, cBtn: 'Benachrichtigungen einschalten', cNote: 'Wenn Sie das nicht waren, ignorieren Sie diese Nachricht: Ohne Bestätigung senden wir nichts weiter und löschen die Adresse nach 7 Tagen.',
    jIntro: (w) => `hier sind neue Stellenangebote der letzten 7 Tage: ${w}. Zu jedem Angebot können Sie sofort einen passenden Lebenslauf bestellen.`, jOpen: 'Angebot ansehen', jFit: 'Lebenslauf an dieses Angebot anpassen', jMore: 'Weitere Angebote auf Jobportalen:', jVia: 'Die Angebote stammen von Partnerdiensten',
    subj: (w) => `Neue Stellenangebote diese Woche: ${w}`, intro: (w) => `hier sind Links zu den neuesten Stellenangeboten: ${w}. Jeder Link öffnet die Suchergebnisse auf einem Jobportal.`, tip: 'Tipp der Woche', found: 'Ein Angebot gefunden? Fügen Sie den Link ein, und wir erstellen in wenigen Minuten einen Lebenslauf für diese Anzeige:', orderBtn: 'Lebenslauf für die Anzeige erstellen', left: (n) => (n ? `Noch ${n} Ausgaben, danach enden die Benachrichtigungen von selbst.` : 'Dies ist die letzte Ausgabe: Die Benachrichtigungen enden. Sie können sich auf der Website erneut anmelden.'), stop: 'Benachrichtigungen ausschalten', why: 'Sie erhalten diese Nachricht, weil Sie Job-Benachrichtigungen bei CV Pod Ogłoszenie eingeschaltet haben.' },
};
const btn = (href, t) => `<a href="${esc(href)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${esc(t)}</a>`;
export async function sendAlertConfirm(email, { job, city, lang }, link) {
  const A = AL[lang] || AL.pl, L = ml(lang), what = `${job}${city ? ', ' + city : ''}`;
  const text = `${L.hi}\n\n${A.c(what)}\n${link}\n\n${A.cNote}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${esc(A.c(what))}</p><p>${btn(link, A.cBtn)}</p><p style="color:#666;font-size:13px">${A.cNote}</p>`;
  return transport().sendMail({ from: from(), to: email, subject: A.cSubj, text, html });
}
// jobs: oferty z oficjalnych API (lib/jobfeed.js) – tytuł, firma, miasto, link partnerski i przycisk do kreatora; pusta lista → same linki do portali.
const SRC_NAME = { adzuna: 'Adzuna', jooble: 'Jooble' }, SRC_HOME = { adzuna: 'https://www.adzuna.pl', jooble: 'https://pl.jooble.org' };
// Atrybucja przy każdej ofercie (regulamin Adzuna API): „via Adzuna” z linkiem do serwisu; w HTML logo, gdy jest adres pliku
// z materiałów prasowych (ADZUNA_LOGO_URL, min. 116×23 px), inaczej sam link. Jooble analogicznie (JOOBLE_LOGO_URL).
const attrHtml = (src) => { if (!SRC_NAME[src]) return ''; const logo = process.env[`${src.toUpperCase()}_LOGO_URL`]; return `<br><span style="color:#666;font-size:12px">via <a href="${SRC_HOME[src]}">${logo ? `<img src="${esc(logo)}" alt="${SRC_NAME[src]}" width="116" height="23" style="vertical-align:middle;border:0">` : SRC_NAME[src]}</a></span>`; };
export async function sendAlertIssue(a, { jobs = [], links, tip, order, stop, left }) {
  const A = AL[a.lang] || AL.pl, L = ml(a.lang), what = `${a.job}${a.city ? ', ' + a.city : ''}`;
  const meta = (j) => [j.company, j.city].filter(Boolean).join(', '), via = [...new Set(jobs.map((j) => SRC_NAME[j.src]).filter(Boolean))].join(', ');
  const jobsText = jobs.map((j) => `• ${j.title}${meta(j) ? ` – ${meta(j)}` : ''}\n  ${A.jOpen}: ${j.url}\n  ${A.jFit}: ${j.fit}${SRC_NAME[j.src] ? `\n  via ${SRC_NAME[j.src]}: ${SRC_HOME[j.src]}` : ''}`).join('\n');
  const text = [`${L.hi}`, jobs.length ? A.jIntro(what) : A.intro(what), jobsText, jobs.length ? A.jMore : '', links.map(([n, u]) => `• ${n}: ${u}`).join('\n'), tip ? `${A.tip}: ${tip.title}\n${tip.url}` : '', `${A.found}\n${order}`, A.left(left), via ? `${A.jVia}: ${via}.` : '', `--\n${A.why} ${A.stop}: ${stop}`].filter(Boolean).join('\n\n');
  const jobsHtml = jobs.map((j) => `<div style="border:1px solid #DDE3F0;border-radius:10px;padding:12px 14px;margin:0 0 10px"><b><a href="${esc(j.url)}" style="color:#16233A">${esc(j.title)}</a></b>${meta(j) ? `<br><span style="color:#555">${esc(meta(j))}</span>` : ''}<br><a href="${esc(j.url)}">${esc(A.jOpen)}</a> &nbsp;·&nbsp; <a href="${esc(j.fit)}" style="font-weight:bold">${esc(A.jFit)}</a>${attrHtml(j.src)}</div>`).join('');
  const html = `<p>${L.hi}</p><p>${esc(jobs.length ? A.jIntro(what) : A.intro(what))}</p>${jobsHtml}${jobs.length ? `<p>${esc(A.jMore)}</p>` : ''}<ul>${links.map(([n, u]) => `<li><a href="${esc(u)}">${esc(n)}</a></li>`).join('')}</ul>${tip ? `<p><b>${A.tip}:</b> <a href="${esc(tip.url)}">${esc(tip.title)}</a></p>` : ''}<p>${esc(A.found)}</p><p>${btn(order, A.orderBtn)}</p><p style="color:#666;font-size:13px">${esc(A.left(left))}</p>${via ? `<p style="color:#666;font-size:12px">${esc(A.jVia)}: ${esc(via)}.</p>` : ''}<hr><p style="color:#666;font-size:12px">${A.why} <a href="${esc(stop)}">${A.stop}</a></p>`;
  return transport().sendMail({ from: from(), to: a.email, subject: A.subj(what), text, html, list: { unsubscribe: { url: stop, comment: A.stop } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}

// Zwykła wiadomość (zamówienia instytucji, program partnerski): tekst + prosty HTML, opcjonalnie załączniki.
// Odpowiedzi trafiają na adres kontaktowy, nie na no-reply.
export async function sendPlainMail({ to, subject, text, attachments = [], headers, fromAddr }) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#16233A">${text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`).join('')}</div>`;
  return transport().sendMail({ from: fromAddr || from(), to, replyTo: process.env.CONTACT_EMAIL || undefined, subject, text, html, attachments, headers });
}
