import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-inv-'));
const { invoiceLines, issueInvoice, renderInvoice, invoices } = await import('../lib/invoice.js');

const order = (id, extra = {}) => ({ id, pkg: 'cv_letter', ads: [{}], addons: { interview: true, sim: true }, extraLangs: ['en'], total: 4900 + 5000 + 2900 - 1900 + 500 - 1000, code: 'KOD-AB12CD', paidAt: Date.UTC(2026, 9, 17, 10), invoice: { name: 'Jan Kowalski', address: 'ul. Długa 1, 00-001 Warszawa', nip: '' }, profile: { email: 'jan@test.pl' }, payment: { provider: 'stripe' }, ...extra });

test('Pozycje faktury sumują się do zapłaconej kwoty (rabat jako osobna pozycja)', () => {
  const o = order('a'), l = invoiceLines(o);
  assert.equal(l.reduce((s, i) => s + i.value, 0), o.total);
  assert.match(l.at(-1).name, /Rabat \(kod KOD-AB12CD\)/);
  assert.equal(invoiceLines(order('b', { addons: {}, extraLangs: [], total: 4900, code: null })).length, 1);
});

test('Numeracja w miesiącu, jedna faktura na zamówienie, PDF', async () => {
  const t = Date.UTC(2026, 9, 17, 12);
  const a = await issueInvoice(order('o1'), t), b = await issueInvoice(order('o2'), t), again = await issueInvoice(order('o1'), t);
  assert.equal(a.number, 'FV 1/10/2026'); assert.equal(b.number, 'FV 2/10/2026'); assert.equal(again.number, 'FV 1/10/2026');
  assert.equal((await issueInvoice(order('o3'), Date.UTC(2026, 10, 2, 12))).number, 'FV 1/11/2026');
  assert.equal(await issueInvoice(order('o4', { invoice: null })), null);
  assert.equal(await issueInvoice(order('o5', { total: 0 })), null);
  assert.equal(Object.keys(await invoices.all()).length, 3);
  const pdf = await renderInvoice(a);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 2000);
});
