import nodemailer from 'nodemailer';
import { renderCv, renderLetter } from './pdf.js';

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
  for (const r of order.results) {
    const tag = `${slug(p.name)}-${slug(r.position)}`;
    attachments.push({ filename: `CV-${tag}.pdf`, content: await renderCv(r), contentType: 'application/pdf' });
    if (order.pkg === 'cv_letter' && r.letter) attachments.push({ filename: `List-motywacyjny-${tag}.pdf`, content: await renderLetter(r), contentType: 'application/pdf' });
  }
  const list = order.results.map((r) => `• ${r.position}`).join('\n');
  const text = `Dzień dobry,\n\nTwoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):\n${list}\n\nMożesz je też zobaczyć na stronie: ${link}\n\nPowodzenia w rekrutacji!\nCV Pod Ogłoszenie`;
  const html = `<p>Dzień dobry,</p><p>Twoje dokumenty są gotowe i znajdziesz je w załącznikach (PDF):</p><ul>${order.results.map((r) => `<li>${esc(r.position)}</li>`).join('')}</ul><p>Możesz je też zobaczyć na stronie: <a href="${esc(link)}">${esc(link)}</a></p><p>Powodzenia w rekrutacji!<br>CV Pod Ogłoszenie</p>`;
  const info = await transport().sendMail({
    from: process.env.MAIL_FROM || 'CV Pod Ogłoszenie <no-reply@localhost>', to: p.email,
    subject: 'Twoje CV i list motywacyjny są gotowe', text, html, attachments,
  });
  return info;
}
