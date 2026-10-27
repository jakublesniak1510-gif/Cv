import nodemailer from 'nodemailer';
import { renderCv, renderLetter, renderInterview } from './pdf.js';
import { renderDocx } from './docx.js';
import { upsellPlan, withLetter, PRICES, nextEligible } from './pricing.js';
import { docFile } from './doc-names.js';
import { cvToText } from './cv-text.js';
import { LEGAL_PAGES } from './legal.js';

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

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Teksty e-maili w języku, w którym klient korzystał ze strony (pl / en / uk / de). Nazwy plików zostają po polsku.
const ML = {
  pl: { txtNote: 'W załącznikach jest też CV w czystym tekście (.txt) – do formularzy portali, w których PDF się nie wczytuje.', offerLetter: (p) => `Dodaj list motywacyjny pod to samo ogłoszenie – ${p} zł`, offerInterview: (p) => `Przygotowanie do rozmowy pod to ogłoszenie – ${p} zł`, offerHow: 'Dokupisz na stronie dokumentów:', acct: 'Wszystkie zamówienia w jednym miejscu: załóż darmowe konto jednym kliknięciem (opcjonalnie):', shareLbl: "Wyślij link znajomym:", shareTxt: "Robię CV pod konkretne ogłoszenie na CV Pod Ogłoszenie. Z moim linkiem zapłacisz 10 zł mniej:", hi: 'Dzień dobry,', ready: 'Twoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):', see: 'Możesz je też zobaczyć, edytować i poprawić na stronie:', del: 'Dane zamówienia usuwamy automatycznie po 30 dniach.', luck: 'Powodzenia w rekrutacji!', subj: 'Twoje CV i list motywacyjny są gotowe',
    code: (c) => `Twój kod −10 zł: ${c}. Użyj go przy kolejnym zamówieniu i podaj znajomym: każdy, kto go wpisze, zapłaci 10 zł mniej, a Ty za każdego znajomego, który zapłaci, dostaniesz 10 zł na kolejne zamówienia (do 50 zł). Kod jest ważny 90 dni.`,
    loginSubj: 'Twój link do logowania', login: 'kliknij, aby zalogować się na swoje konto w CV Pod Ogłoszenie:', loginBtn: 'Zaloguj się', loginNote: 'Link działa 20 minut i tylko raz. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.', before: 'Zanim wyślesz', bsFile: 'Nazwa pliku z CV (tak nazwaliśmy załącznik):', bsSubj: 'Temat e-maila do pracodawcy:', bsMsg: 'Krótka wiadomość do wklejenia w treść e-maila:', bsOwn: 'Twój e-mail z aplikacją (z dodatku):', bsFull: (p) => `Pełna wiadomość do rekrutera na LinkedIn i e-mail pisany pod to ogłoszenie – ${p} zł:` },
  en: { txtNote: 'The attachments also include your CV as plain text (.txt) – for job portal forms where a PDF does not upload.', offerLetter: (p) => `Add a cover letter for the same job ad – PLN ${p}`, offerInterview: (p) => `Interview preparation for this job ad – PLN ${p}`, offerHow: 'You can add it on your documents page:', acct: 'All your orders in one place: create a free account with one click (optional):', shareLbl: "Send the link to friends:", shareTxt: "I'm getting a CV tailored to a job ad at CV Pod Ogłoszenie. With my link you pay 10 PLN less:", hi: 'Hello,', ready: 'Your documents are ready. You will find them attached (PDF):', see: 'You can also view, edit and correct them here:', del: 'We automatically delete order data after 30 days.', luck: 'Good luck with your application!', subj: 'Your CV and cover letter are ready',
    code: (c) => `Your 10 PLN discount code: ${c}. Use it for your next order and share it with friends: anyone who enters it pays 10 PLN less, and for every friend who pays you get 10 PLN towards your next orders (up to 50 PLN). The code is valid for 90 days.`,
    loginSubj: 'Your login link', login: 'click to log in to your CV Pod Ogłoszenie account:', loginBtn: 'Log in', loginNote: 'The link works for 20 minutes and only once. If you did not ask to log in, ignore this message.', before: 'Before you send', bsFile: 'CV file name (the attachment already has it):', bsSubj: 'Email subject for the employer:', bsMsg: 'A short message to paste into the email:', bsOwn: 'Your application email (from the add-on):', bsFull: (p) => `A full message to the recruiter on LinkedIn and an email written for this job ad – PLN ${p}:` },
  uk: { txtNote: 'У вкладеннях також є резюме простим текстом (.txt) – для форм порталів, де PDF не завантажується.', offerLetter: (p) => `Додайте супровідний лист під те саме оголошення – ${p} зл`, offerInterview: (p) => `Підготовка до співбесіди під це оголошення – ${p} зл`, offerHow: 'Докупити можна на сторінці документів:', acct: 'Усі замовлення в одному місці: створіть безкоштовний обліковий запис одним кліком (за бажанням):', shareLbl: "Надішліть посилання друзям:", shareTxt: "Я замовляю резюме під конкретне оголошення на CV Pod Ogłoszenie. З моїм посиланням ви заплатите на 10 зл менше:", hi: 'Добрий день,', ready: 'Ваші документи готові, вони у вкладеннях (PDF):', see: 'Ви також можете переглянути, відредагувати й виправити їх на сторінці:', del: 'Дані замовлення ми автоматично видаляємо через 30 днів.', luck: 'Успіхів у пошуку роботи!', subj: 'Ваше резюме та супровідний лист готові',
    code: (c) => `Ваш код знижки на 10 зл: ${c}. Використайте його для наступного замовлення та поділіться з друзями: кожен, хто його введе, заплатить на 10 зл менше, а ви за кожного друга, який оплатить замовлення, отримаєте 10 зл на наступні замовлення (до 50 зл). Код дійсний 90 днів.`,
    loginSubj: 'Ваше посилання для входу', login: 'натисніть, щоб увійти до свого акаунта CV Pod Ogłoszenie:', loginBtn: 'Увійти', loginNote: 'Посилання діє 20 хвилин і лише один раз. Якщо ви не просили про вхід, проігноруйте цей лист.', before: 'Перед надсиланням', bsFile: 'Назва файлу з резюме (так названо вкладення):', bsSubj: 'Тема листа роботодавцю:', bsMsg: 'Коротке повідомлення, яке можна вставити в лист:', bsOwn: 'Ваш лист із заявкою (з додатка):', bsFull: (p) => `Повне повідомлення рекрутеру в LinkedIn і лист під це оголошення – ${p} зл:` },
  de: { txtNote: 'Im Anhang finden Sie Ihren Lebenslauf auch als reinen Text (.txt) – für Formulare von Jobportalen, in die sich kein PDF hochladen lässt.', offerLetter: (p) => `Anschreiben für dieselbe Anzeige hinzufügen – ${p} PLN`, offerInterview: (p) => `Vorbereitung auf das Vorstellungsgespräch für diese Anzeige – ${p} PLN`, offerHow: 'Hinzubuchen können Sie es auf der Seite mit Ihren Unterlagen:', acct: 'Alle Bestellungen an einem Ort: kostenloses Konto mit einem Klick anlegen (optional):', shareLbl: "Link an Freunde senden:", shareTxt: "Ich lasse meinen Lebenslauf bei CV Pod Ogłoszenie auf eine Stellenanzeige zuschneiden. Mit meinem Link zahlst du 10 PLN weniger:", hi: 'Guten Tag,', ready: 'Ihre Unterlagen sind fertig. Sie finden sie im Anhang (PDF):', see: 'Sie können sie auch hier ansehen, bearbeiten und korrigieren:', del: 'Bestelldaten löschen wir automatisch nach 30 Tagen.', luck: 'Viel Erfolg bei Ihrer Bewerbung!', subj: 'Ihr Lebenslauf und Anschreiben sind fertig',
    code: (c) => `Ihr Rabattcode über 10 PLN: ${c}. Nutzen Sie ihn bei Ihrer nächsten Bestellung und geben Sie ihn an Freunde weiter: Wer ihn eingibt, zahlt 10 PLN weniger, und Sie erhalten für jede Person, die bezahlt, 10 PLN für Ihre nächsten Bestellungen (bis 50 PLN). Der Code ist 90 Tage gültig.`,
    loginSubj: 'Ihr Anmeldelink', login: 'klicken Sie hier, um sich bei Ihrem Konto bei CV Pod Ogłoszenie anzumelden:', loginBtn: 'Anmelden', loginNote: 'Der Link ist 20 Minuten gültig und funktioniert nur einmal. Wenn Sie keine Anmeldung angefordert haben, ignorieren Sie diese Nachricht.', before: 'Bevor Sie senden', bsFile: 'Dateiname des Lebenslaufs (so heißt bereits der Anhang):', bsSubj: 'Betreff der E-Mail an den Arbeitgeber:', bsMsg: 'Kurze Nachricht zum Einfügen in die E-Mail:', bsOwn: 'Ihre Bewerbungs-E-Mail (aus dem Zusatz):', bsFull: (p) => `Vollständige Nachricht an die Recruiterin oder den Recruiter auf LinkedIn und eine E-Mail für diese Anzeige – ${p} PLN:` },
};
const ml = (l) => ML[l] || ML.pl;
// Linki „wyślij znajomym” w e-mailu z dokumentami: WhatsApp, Messenger (telefon), SMS, Telegram, e-mail, z gotową treścią.
// Nagłówek nad przyciskami poleceń (PR S), osobno od ML.
const FRIEND_H = { pl: 'Znajomy też szuka pracy?', en: 'Is a friend looking for a job too?', uk: 'Друг теж шукає роботу?', de: 'Sucht jemand aus Ihrem Umfeld auch eine Stelle?' };
const shareLinks = (L, link) => {
  const t = `${L.shareTxt} ${link}`, e = encodeURIComponent, a = (href, label) => `<a href="${esc(href)}" style="display:inline-block;margin:0 10px 6px 0">${label}</a>`;
  return `<p>${esc(L.shareLbl)}<br>${a(`https://wa.me/?text=${e(t)}`, 'WhatsApp')}${a(`fb-messenger://share/?link=${e(link)}`, 'Messenger')}${a(`sms:?&body=${e(t)}`, 'SMS')}${a(`https://t.me/share/url?url=${e(link)}&text=${e(L.shareTxt)}`, 'Telegram')}${a(`mailto:?body=${e(t)}`, 'E-mail')}</p>`;
};

// Po zakupie jedna propozycja (nie lista): samo CV → list do tego samego ogłoszenia, CV z listem → przygotowanie do rozmowy.
// Cena = różnica cennika (upsellPlan, jak na stronie dokumentów). Bez propozycji dla dodatków, karnetów i gdy dodatek już jest.
export function orderMailOffer(o) {
  if (!o || o.upsellOf || o.pass) return null;
  const key = !withLetter(o.pkg) ? 'letter' : !o.addons?.interview ? 'interview' : null;
  const price = key ? upsellPlan(o, key).price / 100 : 0;
  return price > 0 ? { key, price } : null;
}
// „Zanim wyślesz” (PR M): nazwa pliku (jak załącznik), temat e-maila i 3 zdania do pracodawcy w języku CV, ze znanych danych
// (stanowisko, firma, imię i nazwisko, telefon) – bez AI. Z dodatkiem „Wiadomość do rekrutera” zamiast szablonu jego e-mail,
// bez niego link tekstowy do dokupienia (nie zastępuje głównej propozycji z orderMailOffer).
const APPLY = {
  pl: { subj: (pos, n) => `Aplikacja: ${pos} – ${n}`, body: ({ pos, company, letter, phone, name }) => `Dzień dobry,\n\nw odpowiedzi na ogłoszenie na stanowisko ${pos}${company ? ` w firmie ${company}` : ''} przesyłam swoje CV${letter ? ' i list motywacyjny' : ''}. Chętnie opowiem więcej o swoim doświadczeniu podczas rozmowy. ${phone ? `Zapraszam do kontaktu telefonicznego (${phone}) lub e-mailowego.` : 'Zapraszam do kontaktu e-mailowego.'}\n\nZ poważaniem\n${name}` },
  en: { subj: (pos, n) => `Application: ${pos} – ${n}`, body: ({ pos, company, letter, phone, name }) => `Dear Hiring Manager,\n\nI am applying for the position of ${pos}${company ? ` at ${company}` : ''} and attach my CV${letter ? ' and cover letter' : ''}. I would be glad to tell you more about my experience in an interview. ${phone ? `You can reach me by phone (${phone}) or by email.` : 'You can reach me by email.'}\n\nKind regards\n${name}` },
  de: { subj: (pos, n) => `Bewerbung: ${pos} – ${n}`, body: ({ pos, company, letter, phone, name }) => `Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich auf die Stelle ${pos}${company ? ` bei ${company}` : ''} und sende Ihnen meinen Lebenslauf${letter ? ' und mein Anschreiben' : ''}. Gern erzähle ich Ihnen in einem persönlichen Gespräch mehr über meine Erfahrung. ${phone ? `Sie erreichen mich telefonisch (${phone}) oder per E-Mail.` : 'Sie erreichen mich per E-Mail.'}\n\nMit freundlichen Grüßen\n${name}` },
  uk: { subj: (pos, n) => `Заявка: ${pos} – ${n}`, body: ({ pos, company, letter, phone, name }) => `Добрий день!\n\nУ відповідь на оголошення на посаду ${pos}${company ? ` у компанії ${company}` : ''} надсилаю своє резюме${letter ? ' і супровідний лист' : ''}. Охоче розповім більше про свій досвід під час співбесіди. ${phone ? `Зі мною можна зв’язатися телефоном (${phone}) або електронною поштою.` : 'Зі мною можна зв’язатися електронною поштою.'}\n\nЗ повагою\n${name}` },
};
export function beforeSendItems(order) {
  const p = order.profile || {}, letter = order.pkg !== 'cv';
  return order.results.map((r, i) => {
    const name = r.cv?.name || p.name || '', pos = r.position || order.ads?.[i]?.title || '', T = APPLY[r.lang] || APPLY.pl;
    const own = r.messages?.email?.subject && r.messages?.email?.body ? r.messages.email : null;
    return { pos, file: docFile('cv', name, pos, r.lang), own: !!own, subject: own ? own.subject : T.subj(pos, name), body: own ? own.body : T.body({ pos, company: r.company || order.ads?.[i]?.company || '', letter: letter && !!r.letter, phone: p.phone || '', name }) };
  });
}
function beforeSend(order, L, link) {
  const items = beforeSendItems(order), buy = !order.addons?.messages && !order.upsellOf && !order.pass ? { t: L.bsFull(PRICES.messages / 100), href: `${link}#upsell` } : null;
  const text = items.map((x) => `${items.length > 1 ? `--- ${x.pos} ---\n` : ''}${L.bsFile} ${x.file}\n${L.bsSubj} ${x.subject}\n${x.own ? L.bsOwn : L.bsMsg}\n${x.body}`).join('\n\n') + (buy ? `\n\n${buy.t} ${buy.href}` : '');
  const html = `<div style="border:1px solid #D9E0EC;border-radius:8px;padding:10px 12px;margin:12px 0"><p style="margin:0 0 6px"><b>${esc(L.before)}</b></p>${items.map((x) => `${items.length > 1 ? `<p style="margin:8px 0 4px"><b>${esc(x.pos)}</b></p>` : ''}<p style="margin:0 0 4px">${esc(L.bsFile)} <code>${esc(x.file)}</code><br>${esc(L.bsSubj)} <b>${esc(x.subject)}</b></p><p style="margin:0 0 4px">${esc(x.own ? L.bsOwn : L.bsMsg)}</p><pre style="white-space:pre-wrap;font:inherit;margin:0;padding:8px;background:#F5F7FB;border-radius:6px">${esc(x.body)}</pre>`).join('')}${buy ? `<p style="margin:8px 0 0">${esc(buy.t)} <a href="${esc(buy.href)}">${esc(buy.href)}</a></p>` : ''}</div>`;
  return { text, html };
}
// 3 pytania za darmo (PR R, r.freeQs z generateFreeQs). Etykiety osobno od ML (mniej konfliktów przy zmianach maila).
const QS_L = {
  pl: { title: 'Trzy pytania, które mogą paść na rozmowie', why: 'Rekruter sprawdza:', more: (p) => `Pełne przygotowanie do rozmowy pod to ogłoszenie (12 pytań z przykładowymi odpowiedziami z Twojego doświadczenia) – ${p} zł:` },
  en: { title: 'Three questions you may be asked at the interview', why: 'The recruiter is checking:', more: (p) => `Full interview preparation for this job ad (12 questions with sample answers based on your experience) – PLN ${p}:` },
  uk: { title: 'Три запитання, які можуть прозвучати на співбесіді', why: 'Рекрутер перевіряє:', more: (p) => `Повна підготовка до співбесіди під це оголошення (12 запитань із прикладами відповідей з вашого досвіду) – ${p} зл:` },
  de: { title: 'Drei Fragen, die im Vorstellungsgespräch kommen können', why: 'Damit wird geprüft:', more: (p) => `Vollständige Vorbereitung auf das Vorstellungsgespräch für diese Anzeige (12 Fragen mit Beispielantworten aus Ihrer Erfahrung) – ${p} PLN:` },
};
// Gdy główną propozycją maila jest przygotowanie do rozmowy, blok ją zastępuje (link raz); przy liście – link tekstowy; z dodatkiem – brak bloku.
export function freeQsBlock(order, lang, link, of) {
  const qs = order.results?.find((r) => r.freeQs?.length)?.freeQs;
  if (!qs || order.addons?.interview || order.pass || order.upsellOf) return null;
  const Q = QS_L[lang] || QS_L.pl, price = of?.key === 'interview' ? of.price : upsellPlan(order, 'interview').price / 100;
  const more = price > 0 ? { t: Q.more(price), href: `${link}#upsell` } : null;
  const text = `${Q.title.toUpperCase()}\n${qs.map((x, i) => `${i + 1}. ${x.q}${x.why ? `\n   ${Q.why} ${x.why}` : ''}`).join('\n')}${more ? `\n\n${more.t} ${more.href}` : ''}`;
  const html = `<div style="border:1px solid #D9E0EC;border-radius:8px;padding:10px 12px;margin:12px 0"><p style="margin:0 0 6px"><b>${esc(Q.title)}</b></p><ol style="margin:0;padding-left:20px">${qs.map((x) => `<li style="margin:0 0 6px">${esc(x.q)}${x.why ? `<br><span style="color:#555;font-size:13px">${esc(Q.why)} ${esc(x.why)}</span>` : ''}</li>`).join('')}</ol>${more ? `<p style="margin:8px 0 0">${esc(more.t)} <a href="${esc(more.href)}">${esc(more.href)}</a></p>` : ''}</div>`;
  return { text, html, replacesOffer: of?.key === 'interview' };
}
// Stopka maila z CV (PR X): pytanie do poradnika (osobno od ML).
const ASK_L = { pl: 'Masz pytanie o CV? Napisz, odpowiemy w poradniku:', en: 'Have a question about your CV? Write to us and we will answer it in our guide:', uk: 'Маєте запитання про резюме? Напишіть нам – відповімо в порадах:', de: 'Haben Sie eine Frage zum Lebenslauf? Schreiben Sie uns, wir antworten im Ratgeber:' };
// Gwarancja dopasowania (C5): jedno zdanie z linkiem do §7a regulaminu w języku klienta.
const GUAR_L = { pl: 'Nie pasuje po poprawkach? Zwracamy pieniądze – zasady gwarancji:', en: 'Still not a match after the revisions? We refund your money – guarantee terms:', uk: 'Не підходить після виправлень? Повертаємо гроші – умови гарантії:', de: 'Passt es nach den Korrekturen immer noch nicht? Wir erstatten das Geld – Garantiebedingungen:' };
export const guarantee = (lang, baseUrl) => { const l = GUAR_L[lang] ? lang : 'pl'; return { t: GUAR_L[l], href: `${baseUrl}/${LEGAL_PAGES.regulamin[l].path}#gwarancja` }; };
// Zdjęcie do CV (D1): teksty maila z plikami (sendProductMail).
const PHOTO_L = {
  pl: { subj: 'Twoje zdjęcie do CV', hi: 'Dzień dobry,', body: 'w załącznikach jest Twoje zdjęcie do CV: kadr 3:4 i kwadrat, w JPG i PNG. Wykadrowaliśmy je i wyrównaliśmy jasność; tła nie zmienialiśmy, twarzy nie retuszujemy.', inserted: 'Zdjęcie wstawiliśmy też do Twojego CV – pobierz PDF jeszcze raz na stronie dokumentów.', link: 'Pliki pobierzesz też tutaj (przez 30 dni):', bye: 'Powodzenia!' },
  en: { subj: 'Your CV photo', hi: 'Hello,', body: 'attached is your CV photo: 3:4 and square crops, as JPG and PNG. We cropped it and evened out the brightness; we did not change the background and do not retouch faces.', inserted: 'We have also added the photo to your CV – download the PDF again on your documents page.', link: 'You can also download the files here (for 30 days):', bye: 'Good luck!' },
  uk: { subj: 'Ваше фото для резюме', hi: 'Добрий день!', body: 'у вкладеннях ваше фото для резюме: кадр 3:4 і квадрат, у JPG і PNG. Ми кадрували його та вирівняли яскравість; фон не змінювали, обличчя не ретушуємо.', inserted: 'Ми також додали фото до вашого резюме – завантажте PDF ще раз на сторінці документів.', link: 'Файли можна також завантажити тут (протягом 30 днів):', bye: 'Успіхів!' },
  de: { subj: 'Ihr Bewerbungsfoto', hi: 'Guten Tag,', body: 'im Anhang finden Sie Ihr Bewerbungsfoto: Zuschnitt 3:4 und quadratisch, als JPG und PNG. Wir haben es zugeschnitten und die Helligkeit angeglichen; den Hintergrund haben wir nicht verändert, Gesichter retuschieren wir nicht.', inserted: 'Wir haben das Foto auch in Ihren Lebenslauf eingefügt – laden Sie das PDF auf der Dokumentenseite erneut herunter.', link: 'Die Dateien können Sie auch hier herunterladen (30 Tage lang):', bye: 'Viel Erfolg!' },
};
// Szablony premium (D2): ZIP w załączniku i link do strony zamówienia.
const TPL_L = {
  pl: { subj: 'Twoje szablony CV premium (Word)', hi: 'Dzień dobry,', body: 'w załączniku jest paczka 10 szablonów CV w formacie Word (DOCX) i krótka instrukcja. Otworzysz je w Word, LibreOffice albo Google Docs.', link: 'Paczkę pobierzesz też tutaj (przez 30 dni):', bye: 'Powodzenia!' },
  en: { subj: 'Your premium CV templates (Word)', hi: 'Hello,', body: 'attached is a pack of 10 CV templates in Word format (DOCX) with short instructions. You can open them in Word, LibreOffice or Google Docs.', link: 'You can also download the pack here (for 30 days):', bye: 'Good luck!' },
  uk: { subj: 'Ваші преміум-шаблони резюме (Word)', hi: 'Добрий день!', body: 'у вкладенні пакет із 10 шаблонів резюме у форматі Word (DOCX) і коротка інструкція. Їх можна відкрити у Word, LibreOffice або Google Docs.', link: 'Пакет можна також завантажити тут (протягом 30 днів):', bye: 'Успіхів!' },
  de: { subj: 'Ihre Premium-Lebenslaufvorlagen (Word)', hi: 'Guten Tag,', body: 'im Anhang finden Sie ein Paket mit 10 Lebenslaufvorlagen im Word-Format (DOCX) und eine kurze Anleitung. Sie lassen sich in Word, LibreOffice oder Google Docs öffnen.', link: 'Das Paket können Sie auch hier herunterladen (30 Tage lang):', bye: 'Viel Erfolg!' },
};
// Tłumaczenie CV (D3): PDF i DOCX w załącznikach; to nie jest tłumaczenie przysięgłe.
const TR_L = {
  pl: { subj: 'Twoje przetłumaczone CV', hi: 'Dzień dobry,', body: 'w załącznikach jest Twoje przetłumaczone CV w PDF i w Word (DOCX). Przeczytaj je przed wysłaniem – zwłaszcza nazwy stanowisk i daty. To nie jest tłumaczenie przysięgłe (uwierzytelnione).', link: 'Pliki pobierzesz też tutaj (przez 30 dni):', bye: 'Powodzenia!' },
  en: { subj: 'Your translated CV', hi: 'Hello,', body: 'attached is your translated CV as PDF and Word (DOCX). Read it before sending – especially job titles and dates. This is not a sworn (certified) translation.', link: 'You can also download the files here (for 30 days):', bye: 'Good luck!' },
  uk: { subj: 'Ваше перекладене резюме', hi: 'Добрий день!', body: 'у вкладеннях ваше перекладене резюме у PDF і Word (DOCX). Перечитайте його перед надсиланням – особливо назви посад і дати. Це не присяжний (засвідчений) переклад.', link: 'Файли можна також завантажити тут (протягом 30 днів):', bye: 'Успіхів!' },
  de: { subj: 'Ihr übersetzter Lebenslauf', hi: 'Guten Tag,', body: 'im Anhang finden Sie Ihren übersetzten Lebenslauf als PDF und Word (DOCX). Lesen Sie ihn vor dem Versand – vor allem Berufsbezeichnungen und Daten. Dies ist keine beglaubigte Übersetzung.', link: 'Die Dateien können Sie auch hier herunterladen (30 Tage lang):', bye: 'Viel Erfolg!' },
};
// Sprawdzenie ogłoszenia (D4): raport PDF w załączniku; raport pomocniczy, nie porada prawna.
const AD_L = {
  pl: { subj: 'Raport z ogłoszenia o pracę', hi: 'Dzień dobry,', body: 'w załączniku jest raport z ogłoszenia o pracę: ocena, uwagi z poprawkami, poprawiona wersja ogłoszenia i lista do sprawdzenia przed publikacją. Brakujące informacje oznaczyliśmy jako [UZUPEŁNIJ: …]. Raport ma charakter pomocniczy i nie jest poradą prawną.', link: 'Raport pobierzesz też tutaj (przez 30 dni):', bye: 'Pozdrawiamy,' },
  en: { subj: 'Your job ad report', hi: 'Hello,', body: 'attached is the report on your job ad: a score, remarks with fixes, an improved version of the ad and a checklist before publishing. Missing information is marked as [UZUPEŁNIJ: …] (fill in). The report is for guidance only and is not legal advice.', link: 'You can also download the report here (for 30 days):', bye: 'Best regards,' },
  uk: { subj: 'Звіт щодо оголошення про роботу', hi: 'Добрий день!', body: 'у вкладенні звіт щодо вашого оголошення про роботу: оцінка, зауваження з виправленнями, покращена версія оголошення та список перевірки перед публікацією. Відсутню інформацію позначено як [UZUPEŁNIJ: …] (доповніть). Звіт має допоміжний характер і не є юридичною консультацією.', link: 'Звіт можна також завантажити тут (протягом 30 днів):', bye: 'З повагою,' },
  de: { subj: 'Ihr Bericht zur Stellenanzeige', hi: 'Guten Tag,', body: 'im Anhang finden Sie den Bericht zu Ihrer Stellenanzeige: Bewertung, Hinweise mit Korrekturen, eine überarbeitete Fassung der Anzeige und eine Checkliste vor der Veröffentlichung. Fehlende Angaben sind als [UZUPEŁNIJ: …] (ergänzen) markiert. Der Bericht dient nur zur Orientierung und ist keine Rechtsberatung.', link: 'Den Bericht können Sie auch hier herunterladen (30 Tage lang):', bye: 'Mit freundlichen Grüßen,' },
};
// Dotacja z urzędu pracy (D5): biznesplan (i pola wniosku) w załącznikach; nie gwarantujemy przyznania dotacji.
const GRANT_L = {
  pl: { subj: 'Twoje dokumenty do dotacji z urzędu pracy', hi: 'Dzień dobry,', body: 'w załącznikach są Twoje dokumenty do dotacji: biznesplan w PDF i Word (DOCX), a w wariancie z wnioskiem także pola wniosku do przepisania. Przed złożeniem przeczytaj je, uzupełnij miejsca oznaczone „założenie” i [UZUPEŁNIJ: …] i sprawdź wymagania swojego urzędu. Na stronie zamówienia możesz poprosić o poprawki (3 w cenie). Nie gwarantujemy przyznania dotacji – decyzję podejmuje urząd pracy.', link: 'Dokumenty pobierzesz i poprosisz o poprawkę tutaj (przez 30 dni):', bye: 'Powodzenia!' },
  en: { subj: 'Your documents for the labour office start-up grant', hi: 'Hello,', body: 'attached are your grant documents: the business plan as PDF and Word (DOCX) and, in the variant with the application, the application fields to copy into the form. Before submitting, read them, fill in the places marked “założenie” (assumption) and [UZUPEŁNIJ: …] and check your office’s requirements. On the order page you can request revisions (3 included). We do not guarantee that the grant will be awarded – the labour office decides.', link: 'Download the documents and request a revision here (for 30 days):', bye: 'Good luck!' },
  uk: { subj: 'Ваші документи для дотації від центру зайнятості', hi: 'Добрий день!', body: 'у вкладеннях ваші документи для дотації: бізнес-план у PDF і Word (DOCX), а у варіанті із заявою – також поля заяви для перенесення у бланк. Перед поданням перечитайте їх, доповніть місця, позначені «założenie» (припущення) і [UZUPEŁNIJ: …], та перевірте вимоги свого центру. На сторінці замовлення можна попросити про виправлення (3 включено). Ми не гарантуємо надання дотації – рішення ухвалює центр зайнятості.', link: 'Документи можна завантажити й попросити про виправлення тут (протягом 30 днів):', bye: 'Успіхів!' },
  de: { subj: 'Ihre Unterlagen für den Gründungszuschuss des Arbeitsamts', hi: 'Guten Tag,', body: 'im Anhang finden Sie Ihre Unterlagen: den Businessplan als PDF und Word (DOCX) und in der Variante mit Antrag auch die Antragsfelder zum Übertragen ins Formular. Lesen Sie sie vor der Abgabe, ergänzen Sie die mit „założenie“ (Annahme) und [UZUPEŁNIJ: …] markierten Stellen und prüfen Sie die Anforderungen Ihres Amtes. Auf der Bestellseite können Sie Korrekturen anfordern (3 inklusive). Wir garantieren keine Bewilligung – darüber entscheidet das Arbeitsamt.', link: 'Unterlagen herunterladen und Korrektur anfordern (30 Tage lang):', bye: 'Viel Erfolg!' },
};
// Oferta na zlecenie (D6): oferta w .txt; pakiet – kod na 5 ofert ważny 90 dni (body jako funkcja zamówienia).
const OFFER_L = {
  pl: { subj: 'Twoja oferta na zlecenie', hi: 'Dzień dobry,', body: 'w załączniku jest Twoja oferta: krótka odpowiedź, dłuższa oferta, wycena w punktach i pytania do klienta. Przeczytaj ją przed wysłaniem i uzupełnij miejsca oznaczone [UZUPEŁNIJ: …].', link: 'Ofertę zobaczysz też tutaj (przez 30 dni):', bye: 'Powodzenia przy zleceniu!' },
  en: { subj: 'Your job offer reply', hi: 'Hello,', body: 'attached is your offer: a short reply, a longer offer, a quote in points and questions for the client. Read it before sending and fill in the places marked [UZUPEŁNIJ: …].', link: 'You can also see the offer here (for 30 days):', bye: 'Good luck with the job!' },
  uk: { subj: 'Ваша пропозиція на замовлення', hi: 'Добрий день!', body: 'у вкладенні ваша пропозиція: коротка відповідь, розгорнута пропозиція, кошторис по пунктах і запитання до клієнта. Перечитайте її перед надсиланням і доповніть місця, позначені [UZUPEŁNIJ: …].', link: 'Пропозицію можна також переглянути тут (протягом 30 днів):', bye: 'Успіхів із замовленням!' },
  de: { subj: 'Ihr Angebot zum Auftrag', hi: 'Guten Tag,', body: 'im Anhang finden Sie Ihr Angebot: eine kurze Antwort, ein ausführlicheres Angebot, einen Kostenvoranschlag in Punkten und Fragen an den Kunden. Lesen Sie es vor dem Versand und ergänzen Sie die mit [UZUPEŁNIJ: …] markierten Stellen.', link: 'Das Angebot finden Sie auch hier (30 Tage lang):', bye: 'Viel Erfolg mit dem Auftrag!' },
};
const packDate = () => new Date(Date.now() + 90 * 864e5).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' });
const PACK_L = {
  pl: { subj: 'Twój pakiet 5 ofert na zlecenie', hi: 'Dzień dobry,', body: (o) => `Twój kod na 5 ofert: ${o.productResult?.code}. Jest ważny 90 dni (do ${packDate()}). Na stronie oferty na zlecenie wypełnij formularz, obejrzyj podgląd i wpisz kod zamiast płacić.${o.productData?.result ? ' Oferta z podglądu jest w załączniku (to pierwsza z 5).' : ''}`, link: 'Strona zamówienia (przez 30 dni):', bye: 'Powodzenia przy zleceniach!' },
  en: { subj: 'Your pack of 5 job offers', hi: 'Hello,', body: (o) => `Your code for 5 offers: ${o.productResult?.code}. It is valid for 90 days (until ${packDate()}). On the job offer page fill in the form, check the preview and enter the code instead of paying.${o.productData?.result ? ' The offer from the preview is attached (the first of 5).' : ''}`, link: 'Order page (for 30 days):', bye: 'Good luck with your jobs!' },
  uk: { subj: 'Ваш пакет із 5 пропозицій на замовлення', hi: 'Добрий день!', body: (o) => `Ваш код на 5 пропозицій: ${o.productResult?.code}. Він дійсний 90 днів (до ${packDate()}). На сторінці пропозиції на замовлення заповніть форму, перегляньте попередній перегляд і введіть код замість оплати.${o.productData?.result ? ' Пропозиція з попереднього перегляду у вкладенні (перша з 5).' : ''}`, link: 'Сторінка замовлення (протягом 30 днів):', bye: 'Успіхів із замовленнями!' },
  de: { subj: 'Ihr Paket mit 5 Angeboten', hi: 'Guten Tag,', body: (o) => `Ihr Code für 5 Angebote: ${o.productResult?.code}. Er ist 90 Tage gültig (bis ${packDate()}). Füllen Sie auf der Angebotsseite das Formular aus, prüfen Sie die Vorschau und geben Sie den Code statt einer Zahlung ein.${o.productData?.result ? ' Das Angebot aus der Vorschau ist im Anhang (das erste von 5).' : ''}`, link: 'Bestellseite (30 Tage lang):', bye: 'Viel Erfolg mit Ihren Aufträgen!' },
};
// Usługi z bloku D: pliki w załącznikach, link do strony zamówienia (zdjęcie: też informacja, czy trafiło do CV).
export async function sendProductMail(order, files, inserted, link) {
  const T = { templates: TPL_L, translation: TR_L, adcheck: AD_L, grantplan: GRANT_L, grantfull: GRANT_L, offer: OFFER_L, offerpack: PACK_L }[order.product] || PHOTO_L, L = T[order.uiLang] || T.pl, body = typeof L.body === 'function' ? L.body(order) : L.body;
  const type = (f) => ({ txt: 'text/plain; charset=utf-8', png: 'image/png', zip: 'application/zip', pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })[f.split('.').pop()] || 'image/jpeg';
  const text = `${L.hi}\n\n${body}${inserted ? `\n${L.inserted}` : ''}\n\n${L.link} ${link}\n\n${L.bye}\nCV Pod Ogłoszenie`;
  const html = `<p>${esc(L.hi)}</p><p>${esc(body)}${inserted ? `<br>${esc(L.inserted)}` : ''}</p><p>${esc(L.link)} <a href="${esc(link)}">${esc(link)}</a></p><p>${esc(L.bye)}<br>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: L.subj, text, html, attachments: Object.entries(files).map(([filename, content]) => ({ filename, content, contentType: type(filename) })) });
}
export async function sendOrderMail(order, baseUrl) {
  const L = ml(order.uiLang);
  const p = order.profile, link = `${baseUrl}/?id=${order.id}`;
  const attachments = [];
  const docs = order.results.flatMap((r) => [r, ...Object.values(r.variants || {})]);
  for (const r of docs) {
    const fn = (kind, ext) => docFile(kind, r.cv?.name || p.name, r.position, r.lang, ext);
    attachments.push({ filename: fn('cv'), content: await renderCv(r, order.design, p.photo), contentType: 'application/pdf' });
    attachments.push({ filename: fn('cv', 'txt'), content: cvToText(r), contentType: 'text/plain; charset=utf-8' }); // wersja ATS (PR Q)
    if (order.pkg !== 'cv' && r.letter) attachments.push({ filename: fn('letter'), content: await renderLetter(r, order.design), contentType: 'application/pdf' });
    if (order.addons?.docx) {
      attachments.push({ filename: fn('cv', 'docx'), content: await renderDocx(r, 'cv', order.design), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      if (order.pkg !== 'cv' && r.letter) attachments.push({ filename: fn('letter', 'docx'), content: await renderDocx(r, 'letter', order.design), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    if (r.interview?.length) attachments.push({ filename: fn('interview'), content: await renderInterview(r, order.design), contentType: 'application/pdf' });
  }
  const list = order.results.map((r) => `• ${r.position}`).join('\n');
  const msgs = order.results.filter((r) => r.messages?.linkedin).map((r) => `--- ${r.position} ---\nWiadomość na LinkedIn:\n${r.messages.linkedin}`).join('\n\n')
    + order.results.filter((r) => r.linkedin).map((r) => `\n\n--- Profil LinkedIn: ${r.position} ---\nNagłówek:\n${r.linkedin.headline}\n\nInformacje:\n${r.linkedin.about}\n\nUmiejętności:\n${(r.linkedin.skills || []).join(', ')}${(r.linkedin.experience || []).map((e) => `\n\n${e.title}${e.company ? ', ' + e.company : ''}:\n${e.text}`).join('')}${r.linkedinEn ? `\n\n--- LinkedIn (English): ${r.position} ---\nHeadline:\n${r.linkedinEn.headline}\n\nAbout:\n${r.linkedinEn.about}\n\nSkills:\n${(r.linkedinEn.skills || []).join(', ')}${(r.linkedinEn.experience || []).map((e) => `\n\n${e.title}${e.company ? ', ' + e.company : ''}:\n${e.text}`).join('')}` : ''}`).join('');
  const code = order.myCode ? `\n\n${L.code(order.myCode)}\n${FRIEND_H[order.uiLang] || FRIEND_H.pl} ${baseUrl}/?ref=${order.myCode}` : '';
  const of = orderMailOffer(order), qb = freeQsBlock(order, order.uiLang, link, of), offer = of && !qb?.replacesOffer ? { t: (of.key === 'letter' ? L.offerLetter : L.offerInterview)(of.price), href: `${link}#upsell` } : null;
  const acct = order.createAccount ? null : { t: L.acct, href: `${link}#acctOffer` }; // konto proponujemy dopiero po zakupie
  const bs = beforeSend(order, L, link), beforeText = `\n\n${L.before.toUpperCase()}\n${bs.text}`, gu = guarantee(order.uiLang, baseUrl);
  const text = `${L.hi}\n\n${L.ready}\n${list}\n\n${L.see} ${link}\n${L.del}\n${gu.t} ${gu.href}\n\n${L.txtNote}${offer ? `\n\n${offer.t}. ${L.offerHow} ${offer.href}` : ''}${qb ? `\n\n${qb.text}` : ''}${beforeText}${msgs ? '\n\n' + msgs : ''}${code}${acct ? `\n\n${acct.t} ${acct.href}` : ''}\n\n${ASK_L[order.uiLang] || ASK_L.pl} ${baseUrl}/kontakt\n\n${L.luck}\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${L.ready}</p><ul>${order.results.map((r) => `<li>${esc(r.position)}</li>`).join('')}</ul><p>${L.see} <a href="${esc(link)}">${esc(link)}</a><br>${L.del}<br>${esc(gu.t)} <a href="${esc(gu.href)}">${esc(gu.href)}</a></p><p>${esc(L.txtNote)}</p>${offer ? `<p style="border:1px solid #D9E0EC;border-radius:8px;padding:10px 12px"><b>${esc(offer.t)}</b><br>${esc(L.offerHow)} <a href="${esc(offer.href)}">${esc(offer.href)}</a></p>` : ''}${qb ? qb.html : ''}${bs.html}${msgs ? `<pre style="white-space:pre-wrap;font:inherit">${esc(msgs)}</pre>` : ''}${order.myCode ? `<p><b>${esc(L.code(order.myCode))}</b></p><p style="margin:0"><b>${esc(FRIEND_H[order.uiLang] || FRIEND_H.pl)}</b></p>${shareLinks(L, `${baseUrl}/?ref=${order.myCode}`)}` : ''}${acct ? `<p style="color:#555">${esc(acct.t)} <a href="${esc(acct.href)}">${esc(acct.href)}</a></p>` : ''}<p style="color:#555">${esc(ASK_L[order.uiLang] || ASK_L.pl)} <a href="${esc(baseUrl)}/kontakt">${esc(baseUrl)}/kontakt</a></p><p>${L.luck}<br>CV Pod Ogłoszenie</p>`;
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

// Ankieta „Wyniki klientów” (lib/outcomes.js): jeden e-mail po 14 dniach, za osobną zgodą; T to teksty w języku klienta.
export async function sendOutcomeAsk(email, T, links) {
  const ans = ['yes', 'not_yet', 'not_applied'];
  const text = `${T.hi}\n\n${T.q}\n\n${ans.map((a) => `${T.a[a]}: ${links[a]}`).join('\n')}\n\n${T.why}\n\n${T.note} ${links.unsub}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${esc(T.hi)}</p><p>${esc(T.q)}</p>${ans.map((a) => `<p>${btn(links[a], T.a[a])}</p>`).join('')}<p>${esc(T.why)}</p><p style="color:#666;font-size:13px">${esc(T.note)} <a href="${esc(links.unsub)}">${esc(T.unsub)}</a></p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: email, subject: T.subj, text, html, list: { unsubscribe: { url: links.unsub, comment: T.unsub } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
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

// Dzień 25 (PR V, osobna zgoda deleteNotice): za 5 dni usuniemy dane i dokumenty – pobierz je; kolejne CV pod nowe ogłoszenie
// za cenę z cennika (cv_next) jeszcze przez 5 dni, gdy zamówienie się kwalifikuje (nextEligible). Link wypisu.
const DN = {
  pl: { subj: 'Za 5 dni usuniemy Twoje dokumenty – pobierz je', body: (d) => `za 5 dni (${d}) automatycznie usuniemy dane Twojego zamówienia i dokumenty. Jeśli ich jeszcze nie masz, pobierz je teraz:`, btn: 'Pobierz dokumenty', next: (p, pl) => `Masz nowe ogłoszenie? Kolejne CV pod nowe ogłoszenie z Twoimi danymi kosztuje ${p} zł (z listem ${pl} zł) jeszcze przez 5 dni:`, nextBtn: 'Zrób kolejne CV', off: 'Nie chcesz takich przypomnień? Wypisz się:' },
  en: { subj: 'Your documents will be deleted in 5 days – download them', body: (d) => `in 5 days (${d}) we will automatically delete your order data and documents. If you have not saved them yet, download them now:`, btn: 'Download documents', next: (p, pl) => `Found a new job ad? Another CV for a new job ad with your details costs PLN ${p} (with a cover letter PLN ${pl}) for 5 more days:`, nextBtn: 'Create another CV', off: 'Do not want reminders like this? Unsubscribe:' },
  uk: { subj: 'Через 5 днів ми видалимо ваші документи – завантажте їх', body: (d) => `через 5 днів (${d}) ми автоматично видалимо дані вашого замовлення та документи. Якщо ви їх ще не зберегли, завантажте зараз:`, btn: 'Завантажити документи', next: (p, pl) => `Маєте нове оголошення? Наступне резюме під нове оголошення з вашими даними коштує ${p} зл (із листом ${pl} зл) ще 5 днів:`, nextBtn: 'Зробити наступне резюме', off: 'Не хочете таких нагадувань? Відписатися:' },
  de: { subj: 'In 5 Tagen löschen wir Ihre Unterlagen – laden Sie sie herunter', body: (d) => `in 5 Tagen (${d}) löschen wir automatisch Ihre Bestelldaten und Unterlagen. Falls Sie sie noch nicht gespeichert haben, laden Sie sie jetzt herunter:`, btn: 'Unterlagen herunterladen', next: (p, pl) => `Neue Stellenanzeige gefunden? Ein weiterer Lebenslauf für eine neue Anzeige mit Ihren Daten kostet noch 5 Tage lang ${p} PLN (mit Anschreiben ${pl} PLN):`, nextBtn: 'Weiteren Lebenslauf erstellen', off: 'Keine solchen Erinnerungen mehr? Abmelden:' },
};
export function deleteNoticeMail(order, baseUrl, now = Date.now()) {
  const l = DN[order.uiLang] ? order.uiLang : 'pl', D = DN[l], L = ml(l), pre = `${baseUrl}/${l === 'pl' ? '' : l}`, link = `${pre}?id=${order.id}`, off = `${baseUrl}/przypomnienie/wypisz?o=${order.id}`;
  const day = new Date((order.created || now) + 30 * 864e5).toLocaleDateString({ pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA', de: 'de-DE' }[l], { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });
  const next = nextEligible(order, now) ? { t: D.next(PRICES.cv_next / 100, (PRICES.cv_next + PRICES.cv_letter - PRICES.cv) / 100), href: `${link}#kolejne` } : null;
  const text = `${L.hi}\n\n${D.body(day)}\n${link}${next ? `\n\n${next.t}\n${next.href}` : ''}\n\n${D.off} ${off}\n\nCV Pod Ogłoszenie`;
  const html = `<p>${L.hi}</p><p>${esc(D.body(day))}</p><p>${btn(link, D.btn)}</p>${next ? `<p>${esc(next.t)}</p><p>${btn(next.href, D.nextBtn)}</p>` : ''}<p style="color:#666;font-size:13px">${esc(D.off)} <a href="${esc(off)}">${esc(off)}</a></p>`;
  return { subject: D.subj, text, html, off };
}
export async function sendDeleteNotice(order, baseUrl) {
  const m = deleteNoticeMail(order, baseUrl);
  return transport().sendMail({ from: from(), to: order.profile.email, subject: m.subject, text: m.text, html: m.html, headers: { 'List-Unsubscribe': `<${m.off}>` } });
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
  pl: { lSubj: 'Link do dokończenia zamówienia CV', l: 'oto link do formularza zamówienia CV z danymi, które już wpisano. Otwórz go na dowolnym urządzeniu i dokończ, kiedy Ci wygodnie:', btn: 'Dokończ zamówienie', keep: (d) => `Szkic (bez zdjęcia) przechowujemy do ${d}, potem usuniemy go automatycznie.`, remindOn: 'Zgodnie z Twoją prośbą przypomnimy raz, po 2 godzinach, jeśli nie złożysz zamówienia.', notYou: 'Jeśli to nie Ty, zignoruj tę wiadomość – szkic zniknie sam.', stop: 'Wyłącz przypomnienie albo usuń szkic', rSubj: (t) => `Twoje CV pod ogłoszenie${t ? ` „${t}”` : ''} czeka – dokończ w 2 minuty`, r: 'niedawno zapisano szkic zamówienia CV. Dane są zachowane – wystarczy dokończyć formularz:', rOnce: 'To jedyne przypomnienie, wysłane za Twoją zgodą. Link z poprzedniego e-maila już nie działa, użyj tego.' },
  en: { lSubj: 'Link to finish your CV order', l: 'here is the link to the CV order form with the details already entered. Open it on any device and finish whenever it suits you:', btn: 'Finish the order', keep: (d) => `We keep the draft (without the photo) until ${d}, then delete it automatically.`, remindOn: 'As requested, we will remind you once, after 2 hours, if you have not placed the order.', notYou: 'If this was not you, ignore this message – the draft will disappear on its own.', stop: 'Turn off the reminder or delete the draft', rSubj: (t) => `Your CV for the job ad${t ? ` “${t}”` : ''} is waiting – finish it in 2 minutes`, r: 'a draft CV order was recently saved. The details are kept – just finish the form:', rOnce: 'This is the only reminder, sent with your consent. The link from the previous e-mail no longer works, please use this one.' },
  uk: { lSubj: 'Посилання для завершення замовлення резюме', l: 'ось посилання на форму замовлення резюме з уже введеними даними. Відкрийте його на будь-якому пристрої та завершіть, коли вам зручно:', btn: 'Завершити замовлення', keep: (d) => `Чернетку (без фото) зберігаємо до ${d}, потім автоматично видалимо.`, remindOn: 'Як ви просили, ми нагадаємо один раз, через 2 години, якщо ви не оформите замовлення.', notYou: 'Якщо це були не ви, проігноруйте цей лист – чернетка зникне сама.', stop: 'Вимкнути нагадування або видалити чернетку', rSubj: (t) => `Ваше резюме під оголошення${t ? ` «${t}»` : ''} чекає – завершіть за 2 хвилини`, r: 'нещодавно було збережено чернетку замовлення резюме. Дані збережено – залишилося лише завершити форму:', rOnce: 'Це єдине нагадування, надіслане за вашою згодою. Посилання з попереднього листа вже не діє, скористайтеся цим.' },
  de: { lSubj: 'Link zum Abschließen Ihrer Lebenslauf-Bestellung', l: 'hier ist der Link zum Bestellformular mit den bereits eingegebenen Daten. Öffnen Sie ihn auf einem beliebigen Gerät und schließen Sie die Bestellung ab, wann es Ihnen passt:', btn: 'Bestellung abschließen', keep: (d) => `Den Entwurf (ohne Foto) speichern wir bis ${d}, danach wird er automatisch gelöscht.`, remindOn: 'Wie gewünscht erinnern wir Sie einmal nach 2 Stunden, falls Sie noch nicht bestellt haben.', notYou: 'Wenn Sie das nicht waren, ignorieren Sie diese Nachricht – der Entwurf verschwindet von selbst.', stop: 'Erinnerung ausschalten oder Entwurf löschen', rSubj: (t) => `Ihr Lebenslauf für die Anzeige${t ? ` „${t}“` : ''} wartet – in 2 Minuten fertigstellen`, r: 'vor Kurzem wurde ein Entwurf Ihrer Lebenslauf-Bestellung gespeichert. Die Daten sind erhalten – schließen Sie das Formular einfach ab:', rOnce: 'Dies ist die einzige Erinnerung, gesendet mit Ihrer Einwilligung. Der Link aus der vorherigen E-Mail funktioniert nicht mehr, bitte verwenden Sie diesen.' },
};
const dateIn = (t, l) => new Date(t).toLocaleDateString({ pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA', de: 'de-DE' }[l] || 'pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });
const draftMail = (d, { link, stop, until }, kind) => {
  const l = DR[d.lang] ? d.lang : 'pl', D = DR[l], L = ml(l), lead = kind === 'link' ? D.l : D.r;
  const notes = kind === 'link' ? [D.keep(dateIn(until, l)), d.reminder?.consent ? D.remindOn : '', D.notYou] : [D.rOnce, D.keep(dateIn(until, l))];
  const text = [L.hi, `${lead}\n${link}`, ...notes.filter(Boolean), `--\n${D.stop}: ${stop}`].join('\n\n');
  const html = `<p>${L.hi}</p><p>${esc(lead)}</p><p>${btn(link, D.btn)}</p>${notes.filter(Boolean).map((n) => `<p style="color:#666;font-size:13px">${esc(n)}</p>`).join('')}<hr><p style="color:#666;font-size:12px"><a href="${esc(stop)}">${esc(D.stop)}</a></p>`;
  return transport().sendMail({ from: from(), to: d.email, subject: kind === 'link' ? D.lSubj : D.rSubj(String(d.data?.ads?.find((a) => a?.title)?.title || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 80)), text, html, list: { unsubscribe: { url: stop, comment: D.stop } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
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

// Przypomnienie o follow-up z listy aplikacji (dzień wybrany przez klienta na koncie); wypis jednym linkiem.
export async function sendFollowupReminder(email, app, days, links) {
  const what = String(app.company || app.position || 'pracodawcy').replace(/[\r\n]+/g, ' ');
  const subject = `Minęło ${days} ${days === 1 ? 'dzień' : 'dni'} od wysłania CV do ${what} – czas na follow-up?`;
  const tips = ['Napisz krótko: na jakie stanowisko i kiedy zostało wysłane CV.', 'Zapytaj, czy rekrutacja trwa i kiedy można spodziewać się odpowiedzi.', 'Dodaj jedno zdanie, dlaczego zależy Ci na tej pracy.', 'Po rozmowie albo odpowiedzi zmień status na koncie.'];
  const pos = app.position && app.company ? ` (${String(app.position).replace(/[\r\n]+/g, ' ')})` : '';
  const text = `Dzień dobry,\n\nprzypomnienie, które ustawiono na koncie: minęło ${days} ${days === 1 ? 'dzień' : 'dni'} od wysłania CV do ${what}${pos}. Jeśli nie było jeszcze odpowiedzi, to dobry moment na krótką wiadomość do rekrutera.\n\n${tips.map((t) => '• ' + t).join('\n')}\n\nTwoje aplikacje: ${links.account}\n\nTo przypomnienie ustawione na liście aplikacji w Twoim koncie. Wyłącz przypomnienia o follow-up: ${links.unsub}\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>przypomnienie, które ustawiono na koncie: minęło ${days} ${days === 1 ? 'dzień' : 'dni'} od wysłania CV do <b>${esc(what)}</b>${esc(pos)}. Jeśli nie było jeszcze odpowiedzi, to dobry moment na krótką wiadomość do rekrutera.</p><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><p>${btn(links.account, 'Moje aplikacje')}</p><p style="color:#666;font-size:13px">To przypomnienie ustawione na liście aplikacji w Twoim koncie. <a href="${esc(links.unsub)}">Wyłącz przypomnienia o follow-up</a>.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: email, subject, text, html, list: { unsubscribe: { url: links.unsub, comment: 'Wyłącz przypomnienia o follow-up' } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}

// Powiadomienie o wiadomości z formularza kontaktowego (na CONTACT_EMAIL, odpowiedź trafia do nadawcy).
// Program poleceń: e-mail do właściciela kodu przy każdym naliczeniu 10 zł (bez danych osoby, która zapłaciła z kodem).
const REF = {
  pl: { loc: 'pl-PL', subj: 'Ktoś zapłacił z Twoim kodem – masz 10 zł do wykorzystania', cur: (x) => `${x} zł`,
    body: (r) => [`Dzień dobry,`, `ktoś opłacił zamówienie z Twoim kodem ${r.code}, więc na Twoje saldo poleceń dopisaliśmy 10 zł.`, `Twój kod: ${r.code}\nPolecenia: ${r.referrals} · do wykorzystania: ${r.credit} (saldo najwyżej ${r.cap})`, `Saldo obniży cenę Twojego kolejnego zamówienia: wpisz kod ${r.code} w kreatorze i podaj ten sam adres e-mail co przy zakupie. Saldo nie łączy się z innym kodem rabatowym ani z karnetem i nie podlega wypłacie. Kod i saldo są ważne do ${r.until}.`, `Nie przekazujemy danych osoby, która skorzystała z Twojego kodu.`] },
  en: { loc: 'en-GB', subj: 'Someone paid with your code – you have PLN 10 to use', cur: (x) => `PLN ${x}`,
    body: (r) => [`Hello,`, `someone paid for an order with your code ${r.code}, so we have added PLN 10 to your referral credit.`, `Your code: ${r.code}\nReferrals: ${r.referrals} · available: ${r.credit} (credit up to ${r.cap})`, `The credit reduces the price of your next order: enter the code ${r.code} in the order form with the same e-mail address you used before. The credit cannot be combined with another discount code or a pass and cannot be paid out. The code and credit are valid until ${r.until}.`, `We do not share any details of the person who used your code.`] },
  de: { loc: 'de-DE', subj: 'Jemand hat mit Ihrem Code bezahlt – 10 PLN Guthaben für Sie', cur: (x) => `${x} PLN`,
    body: (r) => [`Guten Tag,`, `jemand hat eine Bestellung mit Ihrem Code ${r.code} bezahlt. Wir haben Ihrem Empfehlungsguthaben 10 PLN gutgeschrieben.`, `Ihr Code: ${r.code}\nEmpfehlungen: ${r.referrals} · verfügbar: ${r.credit} (Guthaben höchstens ${r.cap})`, `Das Guthaben mindert den Preis Ihrer nächsten Bestellung: Geben Sie den Code ${r.code} im Bestellformular mit derselben E-Mail-Adresse wie beim Kauf ein. Das Guthaben ist nicht mit anderen Rabattcodes oder einem Pass kombinierbar und wird nicht ausgezahlt. Code und Guthaben gelten bis ${r.until}.`, `Daten der Person, die Ihren Code genutzt hat, geben wir nicht weiter.`] },
  uk: { loc: 'uk-UA', subj: 'Хтось оплатив з вашим кодом – у вас 10 зл на баланс', cur: (x) => `${x} зл`,
    body: (r) => [`Добрий день,`, `хтось оплатив замовлення з вашим кодом ${r.code}, тому ми додали 10 зл на ваш реферальний баланс.`, `Ваш код: ${r.code}\nРекомендації: ${r.referrals} · доступно: ${r.credit} (баланс не більше ${r.cap})`, `Баланс зменшить ціну вашого наступного замовлення: введіть код ${r.code} у формі замовлення з тією самою адресою e-mail, що й під час покупки. Баланс не поєднується з іншим кодом знижки чи абонементом і не виплачується. Код і баланс дійсні до ${r.until}.`, `Ми не передаємо даних особи, яка скористалася вашим кодом.`] },
};
export function referralMailText(c, lang = 'pl', capGr = 5000) {
  const R = REF[lang] || REF.pl, zl = (gr) => R.cur(gr % 100 ? (gr / 100).toFixed(2) : gr / 100);
  const r = { code: c.id, referrals: c.referrals || 0, credit: zl(c.credit || 0), cap: zl(capGr), until: new Date(c.expires).toLocaleDateString(R.loc, { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric' }) };
  return { subject: R.subj, text: `${R.body(r).join('\n\n')}\n\nCV Pod Ogłoszenie` };
}
export async function sendReferralMail(email, c, lang, baseUrl, capGr) {
  const { subject, text } = referralMailText(c, lang, capGr), link = `${baseUrl}/?zamow=1`;
  const html = text.split('\n\n').map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('') + `<p><a href="${esc(link)}">${esc(link)}</a></p>`;
  return transport().sendMail({ from: from(), to: email, subject, text: `${text}\n\n${link}`, html });
}

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
