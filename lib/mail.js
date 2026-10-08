import nodemailer from 'nodemailer';
import { renderCv, renderLetter, renderInterview } from './pdf.js';

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
    if (r.interview?.length) attachments.push({ filename: `Przygotowanie-do-rozmowy-${tag}.pdf`, content: await renderInterview(r, order.design), contentType: 'application/pdf' });
  }
  const list = order.results.map((r) => `• ${r.position}`).join('\n');
  const msgs = order.results.filter((r) => r.messages).map((r) => `--- ${r.position} ---\nWiadomość na LinkedIn:\n${r.messages.linkedin}\n\nE-mail z aplikacją\nTemat: ${r.messages.email?.subject}\n${r.messages.email?.body}`).join('\n\n');
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
export async function sendReminder(order, baseUrl) {
  const link = `${baseUrl}/?id=${order.rootId || order.parentId || order.id}`;
  const text = `Dzień dobry,\n\nminął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?\n\nJeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem ${order.myCode} zapłacisz 10 zł mniej` : ''}: ${link}\nMożesz też skorzystać z darmowej poprawki obecnych dokumentów.\n\nTo jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.\n\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>minął tydzień od przygotowania Twojego CV. Jak idzie rekrutacja?</p><p>Jeśli znalazłeś kolejne ogłoszenie, przygotujemy CV pod nie bez ponownego wpisywania danych${order.myCode ? `, a z kodem <b>${esc(order.myCode)}</b> zapłacisz 10 zł mniej` : ''}: <a href="${esc(link)}">przejdź do swoich dokumentów</a>. Możesz też skorzystać z darmowej poprawki.</p><p style="color:#666;font-size:13px">To jednorazowa wiadomość: nie wyślemy kolejnych przypomnień. Dane zamówienia usuniemy automatycznie po 30 dniach od zamówienia.</p><p>CV Pod Ogłoszenie</p>`;
  return transport().sendMail({ from: from(), to: order.profile.email, subject: 'Masz kolejne ogłoszenie? Twój kod −10 zł czeka', text, html });
}
