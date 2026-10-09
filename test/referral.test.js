import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailHash, codeDiscount, applyPaidCode, REF_REWARD, REF_CAP } from '../lib/referral.js';

const code = () => ({ id: 'KOD-ABC123', amount: 1000, ownerOrderId: 'o1', ownerHash: emailHash('Anna@Example.com'), usedBy: [], referrals: 0, credit: 0, expires: Date.now() + 1000 });

test('Polecenie: znajomy płaci mniej, właściciel dostaje saldo', () => {
  let c = code();
  assert.deepEqual(codeDiscount(c, 'bartek@example.com'), { base: 1000, credit: 0 });
  c = applyPaidCode(c, { email: 'bartek@example.com' });
  assert.equal(c.referrals, 1); assert.equal(c.credit, REF_REWARD);
  assert.ok(c.expires > Date.now() + 80 * 864e5, 'kod przedłużony o 90 dni');
  assert.ok(codeDiscount(c, 'bartek@example.com').error, 'znajomy drugi raz nie skorzysta');
  // ten sam znajomy nie nalicza nagrody ponownie
  assert.equal(applyPaidCode(c, { email: 'bartek@example.com' }).credit, REF_REWARD);
});

test('Właściciel: −10 zł raz plus saldo, saldo schodzi po zapłacie', () => {
  let c = { ...code(), credit: 2000 };
  assert.deepEqual(codeDiscount(c, 'anna@example.com'), { base: 1000, credit: 2000 });
  c = applyPaidCode(c, { email: 'anna@example.com', creditUsed: 2000 });
  assert.equal(c.credit, 0); assert.equal(c.referrals, 0);
  assert.ok(codeDiscount(c, 'anna@example.com').error);
  c = applyPaidCode(c, { email: 'cezary@example.com' });
  assert.deepEqual(codeDiscount(c, 'anna@example.com'), { base: 0, credit: REF_REWARD });
});

test('Saldo ma limit, kody akcji nie dają nagród', () => {
  let c = { ...code(), credit: REF_CAP - 500 };
  c = applyPaidCode(c, { email: 'x@example.com' });
  assert.equal(c.credit, REF_CAP);
  const promo = applyPaidCode({ id: 'JESIEN', amount: 1000, usedBy: [], expires: 1 }, { email: 'x@example.com' });
  assert.equal(promo.credit, undefined); assert.equal(promo.usedBy.length, 1);
});
