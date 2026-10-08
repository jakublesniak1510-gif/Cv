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

export async function sendOrderMail(order, baseUrl) {
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
  const code = order.myCode ? `\n\nTwój kod −10 zł: ${order.myCode}. Użyj go przy kolejnym zamówieniu i podaj znajomym: każdy, kto go wpisze, zapłaci 10 zł mniej. Kod jest ważny 90 dni.` : '';
  const text = `Dzień dobry,\n\nTwoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):\n${list}\n\nMożesz je też zobaczyć, edytować i poprawić na stronie: ${link}\nDane zamówienia usuwamy automatycznie po 30 dniach.${msgs ? '\n\n' + msgs : ''}${code}\n\nPowodzenia w rekrutacji!\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>Twoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):</p><ul>${order.results.map((r) => `<li>${esc(r.position)}</li>`).join('')}</ul><p>Możesz je też zobaczyć, edytować i poprawić na stronie: <a href="${esc(link)}">${esc(link)}</a><br>Dane zamówienia usuwamy automatycznie po 30 dniach.</p>${msgs ? `<pre style="white-space:pre-wrap;font:inherit">${esc(msgs)}</pre>` : ''}${order.myCode ? `<p><b>Twój kod −10 zł: ${esc(order.myCode)}</b><br>Użyj go przy kolejnym zamówieniu i podaj znajomym: każdy, kto go wpisze, zapłaci 10 zł mniej. Kod jest ważny 90 dni.</p>` : ''}<p>Powodzenia w rekrutacji!<br>CV Pod Ogłoszenie</p>`;
  const info = await transport().sendMail({
    from: process.env.MAIL_FROM || 'CV Pod Ogłoszenie <no-reply@localhost>', to: p.email,
    subject: 'Twoje CV i list motywacyjny są gotowe', text, html, attachments,
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
export async function sendLoginLink(email, link) {
  const text = `Dzień dobry,\n\nkliknij, aby zalogować się na swoje konto w CV Pod Ogłoszenie:\n${link}\n\nLink działa 20 minut i tylko raz. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>kliknij, aby zalogować się na swoje konto w CV Pod Ogłoszenie:</p><p><a href="${esc(link)}" style="display:inline-block;background:#2548E8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Zaloguj się</a></p><p style="color:#666;font-size:13px">Link działa 20 minut i tylko raz. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.</p>`;
  return transport().sendMail({ from: from(), to: email, subject: 'Twój link do logowania', text, html });
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
