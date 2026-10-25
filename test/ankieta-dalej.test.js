import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Ankieta „Wyniki klientów” (14 dni, 3 odpowiedzi – bez zmian): po zapisaniu odpowiedzi jeden krok dalej.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-ank-'));
const express = (await import('express')).default;
const { outcomes, outcomeRoutes, OT, OUTCOME_AFTER, nextStep } = await import('../lib/outcomes.js');
const { saveOrder, codes } = await import('../lib/store.js');

test('Po odpowiedzi: „Tak” → symulator + opinia, „Jeszcze nie” → aplikacje z follow-up + kod, „Nie aplikowałem” → skaner; zapis jak dotąd', async () => {
  assert.equal(OUTCOME_AFTER, 14 * 864e5, 'ankieta nadal po 14 dniach');
  await saveOrder({ id: 'o1', status: 'done', pkg: 'cv_letter', addons: {}, myCode: 'KOD-AB12', profile: { email: 'a@example.test' } });
  await codes.save({ id: 'KOD-AB12', amount: 1000 });
  const r = await outcomes.save({ id: 'r1', token: 't'.repeat(32), orderId: 'o1', pkg: 'cv_letter', lang: 'pl', sentAt: Date.now(), answer: null });
  const yes = await nextStep(r, 'yes', OT.pl, { REVIEW_URL: 'https://pl.trustpilot.com/review/cvpodogloszenie.pl' });
  assert.match(yes, /symulatorze rozmowy pod to ogłoszenie – 29 zł/); assert.match(yes, /href="\/\?id=o1#upsell"/); assert.match(yes, /href="https:\/\/pl\.trustpilot\.com\/review\/cvpodogloszenie\.pl"/);
  assert.doesNotMatch(await nextStep(r, 'yes', OT.pl, {}), /trustpilot/, 'bez REVIEW_URL bez linku');
  await saveOrder({ id: 'o2', status: 'done', pkg: 'cv', addons: { sim: true } });
  assert.doesNotMatch(await nextStep({ ...r, orderId: 'o2' }, 'yes', OT.pl, {}), /symulator/, 'symulator już kupiony');
  const wait = await nextStep(r, 'not_yet', OT.pl, {});
  assert.match(wait, /przypomnienie o follow-up/); assert.match(wait, /href="\/konto"/); assert.match(wait, /Twój kod polecający: KOD-AB12/);
  assert.match(wait, /<a href="\/poradnik\/follow-up-po-wyslaniu-cv">Jak napisać follow-up/, 'link do poradnika o follow-upie');
  assert.match(await nextStep({ ...r, lang: 'de' }, 'not_yet', OT.de, {}), /href="\/de\/ratgeber\/nachfassen-nach-bewerbung"/);
  assert.match(await nextStep({ ...r, lang: 'uk' }, 'not_yet', OT.uk, {}), /href="\/uk\/porady\/nahaduvannia-pislia-nadsylannia-reziume"/);
  assert.match(await nextStep(r, 'not_applied', OT.pl, {}), /href="\/narzedzia\/skaner-cv"/);
  assert.match(await nextStep({ ...r, lang: 'en' }, 'not_applied', OT.en, {}), /href="\/en\/[^"]+"/);
  for (const l of ['en', 'uk', 'de']) for (const k of ['yesBtn', 'review', 'wait', 'waitBtn', 'fuLink', 'none', 'noneBtn']) assert.ok(OT[l].next[k], `${l}.${k}`);

  const app = express(); outcomeRoutes(app, { BASE_URL: 'https://example.test' });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/wyniki/odpowiedz?t=${'t'.repeat(32)}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'a=not_yet' })).text();
    assert.match(h, /Zapisaliśmy odpowiedź/); assert.match(h, /href="\/konto"/);
    assert.equal((await outcomes.get('r1')).answer, 'not_yet');
  } finally { srv.close(); }
});
