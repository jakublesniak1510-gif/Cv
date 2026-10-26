import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Przypomnienie o niedokończonym kreatorze (za osobną zgodą): po 2 h, temat ze stanowiskiem z ogłoszenia, powrót do zapisanego kroku.
// Szkice ze zgodą udzieloną przed zmianą („po 24 godzinach”) – nadal po 24 h. Polityka prywatności w 4 językach.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wdraft2h-'));
process.env.SMTP_URL = 'json';
const W = await import('../lib/wizard-drafts.js');
const { sendDraftReminder } = await import('../lib/mail.js');
const { legalBody } = await import('../lib/legal.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const DATA = { step: 5, pkg: 'cv', f: { name: 'Anna' }, exp: [], edu: [], ads: [{ title: 'Magazynier', text: 'Ogłoszenie' }] };

test('Po 2 h przy nowej zgodzie, po 24 h przy zgodzie sprzed zmiany; jedno przypomnienie', async () => {
  assert.match(W.REMIND_CONSENT, /jeden e-mail po 2 godzinach/); assert.equal(W.REMIND_AFTER, 2 * 3600e3);
  const now = Date.now();
  await W.wizardDrafts.save({ id: 'n'.repeat(32), email: 'nowa@example.test', lang: 'pl', data: DATA, created: now, updated: now, reminder: { consent: { text: W.REMIND_CONSENT, at: now }, sent: false } });
  await W.wizardDrafts.save({ id: 's'.repeat(32), email: 'stara@example.test', lang: 'pl', data: DATA, created: now, updated: now, reminder: { consent: { text: W.REMIND_CONSENT_24H, at: now }, sent: false } });
  await W.wizardDraftsHourly('https://example.test', now + 1.5 * 3600e3);
  const sent = async () => Object.values(await W.wizardDrafts.all()).filter((x) => x.reminder?.sent).map((x) => x.email).sort();
  assert.deepEqual(await sent(), [], 'za wcześnie');
  await W.wizardDraftsHourly('https://example.test', now + 2.5 * 3600e3);
  assert.deepEqual(await sent(), ['nowa@example.test']);
  await W.wizardDraftsHourly('https://example.test', now + 25 * 3600e3);
  assert.deepEqual(await sent(), ['nowa@example.test', 'stara@example.test']);
  await W.wizardDraftsHourly('https://example.test', now + 26 * 3600e3);
  assert.equal((await sent()).length, 2, 'bez ponowień');
});

test('Temat przypomnienia ze stanowiskiem (4 języki), link z wypisem', async () => {
  const o = { link: 'https://example.test/?szkic=x', stop: 'https://example.test/szkic/wypisz?t=x', until: Date.now() + 864e5 };
  for (const [l, re] of [['pl', /^Twoje CV pod ogłoszenie „Magazynier” czeka – dokończ w 2 minuty$/], ['en', /^Your CV for the job ad “Magazynier” is waiting – finish it in 2 minutes$/], ['de', /^Ihr Lebenslauf für die Anzeige „Magazynier“ wartet/], ['uk', /^Ваше резюме під оголошення «Magazynier» чекає/]]) {
    const m = JSON.parse((await sendDraftReminder({ email: 'a@example.test', lang: l, data: DATA }, o)).message);
    assert.match(m.subject, re, l); assert.ok(m.text.includes(o.stop), `${l}: wypis`);
  }
  const bez = JSON.parse((await sendDraftReminder({ email: 'a@example.test', lang: 'pl', data: { ...DATA, ads: [{ text: 'x' }] } }, o)).message);
  assert.equal(bez.subject, 'Twoje CV pod ogłoszenie czeka – dokończ w 2 minuty');
});

test('Kreator: szkic zapamiętuje krok, link wraca do niego; zgoda i polityka (4 języki) mówią o 2 godzinach', () => {
  const app = read('public/app.js');
  assert.match(app, /const draftData = \(\) => \(\{ step, design,/);
  assert.match(app, /const st = stepOf\(Number\(d\.data\?\.step\)\); if \(st !== ORDER\[0\]\) go\(st\);/);
  assert.match(read('public/index.html'), /jeden e-mail za 2 godziny, opcjonalnie/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Przypomnij mi raz, jeśli nie dokończę (jeden e-mail za 2 godziny, opcjonalnie).'], l);
  for (const [l, re] of [['pl', /Jedno przypomnienie po 2 godzinach \(przy zgodach udzielonych przed 25 października 2026 r\. – po 24 godzinach\)/], ['de', /nach 2 Stunden \(bei Einwilligungen vor dem 25\. Oktober 2026 nach 24 Stunden\)/], ['en', /after 2 hours \(for consents given before 25 October 2026: after 24 hours\)/], ['uk', /через 2 години \(для згод, наданих до 25 жовтня 2026 р\., – через 24 години\)/]]) assert.match(legalBody('prywatnosc', l), re, l);
  assert.match(legalBody('prywatnosc', 'pl'), /<li>25 października 2026 r\. – przypomnienie o niedokończonym formularzu \(za osobną zgodą\) po 2 godzinach/);
});
