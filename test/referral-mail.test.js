import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Program poleceń (10 zł dla znajomego, 10 zł salda dla polecającego, saldo do 50 zł): mail do polecającego przy naliczeniu,
// cofnięcie nagrody przy pełnym zwrocie zamówienia poleconej osoby, brak łączenia salda z innym kodem i karnetem, regulamin.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-refmail-'));
Object.assign(process.env, { SMTP_URL: 'json' });
const { emailHash, applyPaidCode, rewardBack, codeDiscount, REF_REWARD, REF_CAP } = await import('../lib/referral.js');
const { codes, saveOrder } = await import('../lib/store.js');
const { setRefunded, commissionBack } = await import('../lib/ops.js');
const { referralMailText, sendReferralMail } = await import('../lib/mail.js');
const { legalBody } = await import('../lib/legal.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = (x = {}) => ({ id: 'KOD-TEST01', amount: 1000, ownerOrderId: 'own1', ownerHash: emailHash('anna@example.com'), usedBy: [], referrals: 0, credit: 0, expires: Date.parse('2027-01-20T12:00:00Z'), ...x });

test('Naliczenie zapisuje zamówienie; pełny zwrot cofa 10 zł (saldo nie poniżej zera), inne zamówienie bez zmian', () => {
  let c = applyPaidCode(code(), { email: 'bartek@example.com', order: 'o-b' });
  c = applyPaidCode(c, { email: 'cezary@example.com', order: 'o-c' });
  assert.deepEqual([c.referrals, c.credit, c.rewarded], [2, 2 * REF_REWARD, ['o-b', 'o-c']]);
  assert.equal(rewardBack(c, 'o-x'), c, 'zamówienie bez nagrody');
  const r = rewardBack(c, 'o-b');
  assert.deepEqual([r.referrals, r.credit, r.earned, r.rewarded, r.reversed], [1, REF_REWARD, REF_REWARD, ['o-c'], 1]);
  assert.equal(rewardBack(r, 'o-b'), r, 'drugi zwrot tego samego zamówienia nic nie zmienia');
  assert.equal(rewardBack({ ...c, credit: 300 }, 'o-c').credit, 0, 'wykorzystane saldo: najwyżej do zera');
  // limit salda 50 zł bez zmian
  let full = code({ credit: REF_CAP }); full = applyPaidCode(full, { email: 'd@example.com', order: 'o-d' }); assert.equal(full.credit, REF_CAP);
  // saldo tylko z własnym kodem właściciela: obcy kod nie daje salda właściciela
  assert.deepEqual(codeDiscount(code({ credit: 2000 }), 'zofia@example.com'), { base: 1000, credit: 0 });
});

test('setRefunded + commissionBack: pełny zwrot zamówienia poleconej osoby zdejmuje nagrodę, częściowy nie', async () => {
  await codes.save(applyPaidCode(code(), { email: 'bartek@example.com', order: 'o-b' }));
  await codes.update('KOD-TEST01', (c) => applyPaidCode(c, { email: 'cezary@example.com', order: 'o-c' }));
  for (const id of ['o-b', 'o-c']) await saveOrder({ id, status: 'done', paidAt: Date.now(), total: 2900, code: 'KOD-TEST01', profile: { email: `${id}@example.com` }, pkg: 'cv' });
  const part = await setRefunded({ orderId: 'o-c', total: 900, source: 'panel' });
  assert.equal(part.full, false); await commissionBack(part.code, part.delta, part);
  assert.equal((await codes.get('KOD-TEST01')).credit, 2 * REF_REWARD, 'częściowy zwrot: nagroda zostaje');
  const all = await setRefunded({ orderId: 'o-b', total: 2900, source: 'panel' });
  assert.equal(all.full, true); await commissionBack(all.code, all.delta, all);
  const c = await codes.get('KOD-TEST01');
  assert.deepEqual([c.referrals, c.credit, c.rewarded], [1, REF_REWARD, ['o-c']]);
  for (const f of ['server.js', 'lib/admin.js']) assert.doesNotMatch(read(f), /commissionBack\([^)]*\.delta\)/, `${f}: commissionBack dostaje wynik setRefunded`);
});

test('Mail do polecającego: kod, liczba poleceń, saldo i ważność (4 języki), bez danych poleconej osoby', async () => {
  const c = code({ referrals: 2, credit: 2000 });
  const pl = referralMailText(c, 'pl');
  assert.equal(pl.subject, 'Ktoś zapłacił z Twoim kodem – masz 10 zł do wykorzystania');
  assert.match(pl.text, /Twój kod: KOD-TEST01\nPolecenia: 2 · do wykorzystania: 20 zł \(saldo najwyżej 50 zł\)/);
  assert.match(pl.text, /ważne do 20 stycznia 2027/); assert.match(pl.text, /nie łączy się z innym kodem rabatowym ani z karnetem/);
  assert.match(referralMailText(c, 'en').text, /Referrals: 2 · available: PLN 20 \(credit up to PLN 50\)/);
  assert.match(referralMailText(c, 'de').text, /Empfehlungen: 2 · verfügbar: 20 PLN/);
  assert.match(referralMailText(c, 'uk').text, /Рекомендації: 2 · доступно: 20 зл/);
  const info = await sendReferralMail('anna@example.com', c, 'pl', 'https://example.test', REF_CAP), m = JSON.parse(info.message);
  assert.deepEqual(m.to.map((x) => x.address), ['anna@example.com']);
  assert.doesNotMatch(m.text + m.html, /bartek|cezary|@example\.com/, 'bez adresu poleconej osoby');
  assert.match(m.html, /https:\/\/example\.test\/\?zamow=1/);
  const srv = read('server.js');
  assert.match(srv, /if \(after && \(after\.referrals \|\| 0\) > \(before\?\.referrals \|\| 0\)\) referralMail\(after\)/);
  assert.match(srv, /await sendReferralMail\(owner\.profile\.email, c, owner\.uiLang \|\| 'pl', BASE_URL, REF_CAP\)/);
  assert.match(srv, /const c = passUse \? \{\} : await checkCode\(code, p\.email\);/, 'karnet bez kodów i salda');
});

test('Regulamin §5b ust. 4 (4 języki): 10 zł, 50 zł, brak łączenia, e-mail, cofnięcie przy zwrocie; data 25.10.2026 i historia', () => {
  for (const [l, re] of [['pl', /otrzymuje 10 zł salda\. Saldo wynosi łącznie najwyżej 50 zł[\s\S]*Saldo nie łączy się z innym kodem rabatowym ani z karnetem\. O każdym naliczeniu salda Klient otrzymuje e-mail[\s\S]*w całości zwrócone, naliczone za nie 10 zł odejmuje się od salda/],
    ['en', /PLN 10 credit\. The credit totals no more than PLN 50[\s\S]*cannot be combined with another discount code or with a pass/], ['de', /Guthaben von 10 PLN[\s\S]*höchstens 50 PLN[\s\S]*nicht mit einem anderen Rabattcode oder einem Pass kombinierbar/],
    ['uk', /10 zł на баланс\. Баланс становить загалом не більше 50 zł[\s\S]*не поєднується з іншим кодом знижки чи з абонементом/]]) assert.match(legalBody('regulamin', l), re, l);
  assert.match(legalBody('regulamin', 'pl'), /Regulamin obowiązuje od 26 października 2026 r\. Historia zmian: (?:[^;]*; )*25 października 2026 r\. – program poleceń/);
  assert.match(legalBody('regulamin', 'de'), /gelten ab dem 26\. Oktober 2026/); assert.match(legalBody('regulamin', 'en'), /effective from 26 October 2026/); assert.match(legalBody('regulamin', 'uk'), /діють з 26 жовтня 2026/);
  // kwoty w regulaminie zgodne z kodem
  assert.equal(REF_REWARD, 1000); assert.equal(REF_CAP, 5000);
});
