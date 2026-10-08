import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCv, renderLetter } from '../lib/pdf.js';
import { tailor } from '../lib/tailor.js';

process.env.SMTP_URL = 'json';
const { sendOrderMail } = await import('../lib/mail.js');
const profile = { name: 'Żaneta Łącka', email: 'z@x.pl', city: 'Łódź', skills: 'Excel, obsługa klienta', experience: [{ title: 'Sprzedawca', company: 'Żabka', from: '2020', to: '2023', description: 'Obsługa klienta\nInwentaryzacja' }], education: [{ school: 'Uniwersytet Łódzki', degree: 'Zarządzanie' }] };
const res = tailor({ profile, ad: { title: 'Kasjer', text: 'Szukamy osoby do obsługi klienta i Excel w sklepie. '.repeat(3) }, withLetter: true });

test('PDF CV i listu są poprawnymi plikami', async () => {
  for (const b of [await renderCv(res), await renderLetter(res)]) { assert.equal(b.subarray(0, 5).toString(), '%PDF-'); assert.ok(b.length > 1500); }
});
test('mail ma załączniki PDF dla każdego ogłoszenia', async () => {
  const info = await sendOrderMail({ id: 'abc', pkg: 'cv_letter', profile, results: [res, res] }, 'https://x.pl');
  const m = JSON.parse(info.message);
  assert.equal(m.to[0].address, 'z@x.pl'); assert.equal(m.attachments.length, 4);
  assert.match(m.attachments[0].filename, /^CV-Zaneta-Lacka-Kasjer\.pdf$/);
});
