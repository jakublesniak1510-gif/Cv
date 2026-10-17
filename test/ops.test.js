import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Osobny katalog danych: moduły czytają DATA_DIR przy imporcie.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-ops-'));
process.env.DATA_DIR = dir;
const store = await import('../lib/store.js');
const ops = await import('../lib/ops.js');

const order = (id, extra = {}) => ({ id, status: 'done', pkg: 'cv_letter', total: 4900, discount: 0, created: Date.now(), paidAt: Date.now(), ads: [{ text: 'x' }], addons: { interview: true }, uiLang: 'en', profile: { email: 'a@b.pl', name: 'A', photo: 'data:image/png;base64,AAAA' }, payment: { provider: 'stripe', paymentIntent: 'pi_' + id }, ...extra });

test('Rejestr sprzedaży: zapis bez danych osobowych, raport pakietów i dodatków', async () => {
  await store.saveOrder(order('o1'));
  await store.saveOrder(order('o2', { pkg: 'cv', total: 3900, addons: {}, code: 'JESIEN' }));
  await store.saveOrder(order('o3', { status: 'pending', paidAt: undefined }));
  await ops.syncSales();
  const all = await ops.sales.all();
  assert.deepEqual(Object.keys(all).sort(), ['o1', 'o2']);
  assert.ok(!JSON.stringify(all).includes('a@b.pl'), 'bez e-maila w rejestrze');
  const r = await ops.salesReport('30');
  assert.equal(r.total.orders, 2);
  assert.equal(r.total.revenue, 88);
  assert.equal(r.series.length, 30);
  assert.equal(r.series.at(-1).orders, 2);
  assert.deepEqual(r.pkgs.map((p) => [p.key, p.n]).sort(), [['cv', 1], ['cv_letter', 1]]);
  assert.deepEqual(r.addons.map((a) => [a.key, a.n]), [['interview', 1]]);
  assert.equal((await ops.salesReport('365')).series.length, 12);
  assert.equal((await ops.salesReport('90')).series.length, 13);
});

test('Zwrot: zapis w zamówieniu i rejestrze, ponowione powiadomienie nie liczy się drugi raz, prowizja partnera maleje', async () => {
  await store.codes.save({ id: 'PART', commission: 20, due: 980, revenue: 4900, usedBy: [], expires: Date.now() + 1e9 });
  await store.updateOrder('o1', { code: 'PART' });
  const r = await ops.setRefunded({ orderId: 'o1', total: 2000, source: 'panel' });
  assert.equal(r.changed, true); assert.equal(r.delta, 2000);
  await ops.commissionBack('PART', r.delta);
  assert.equal((await store.codes.get('PART')).due, 580);
  assert.equal((await store.getOrder('o1')).refunded, 2000);
  assert.equal((await ops.sales.get('o1')).refunded, 2000);
  // Ten sam zwrot z webhooka Stripe (po payment_intent): bez zmian.
  const again = await ops.setRefunded({ paymentIntent: 'pi_o1', total: 2000, source: 'stripe' });
  assert.equal(again.changed, false);
  assert.equal((await store.getOrder('o1')).refunds.length, 1);
  assert.equal((await ops.salesReport('30')).total.revenue, 68);
  // Zamówienie już skasowane (po 30 dniach): zwrot trafia do rejestru po payment_intent.
  await store.removeOrder('o2');
  const late = await ops.setRefunded({ paymentIntent: 'pi_o2', total: 3900, source: 'stripe' });
  assert.equal(late.changed, true);
  assert.equal((await ops.sales.get('o2')).refunded, 3900);
});

test('Kopia zapasowa: wersja do e-maila bez zdjęć, przywrócenie zapisuje najpierw obecny stan', async () => {
  const light = await ops.makeBackup({ light: true }), full = await ops.makeBackup();
  assert.ok(light.counts['orders.json'] >= 1);
  const zlib = await import('node:zlib');
  const L = JSON.parse(zlib.gunzipSync(light.buf)), F = JSON.parse(zlib.gunzipSync(full.buf));
  assert.equal(L.files['orders.json'].o1.profile.photo, null);
  assert.ok(F.files['orders.json'].o1.profile.photo.startsWith('data:image'));
  await store.removeOrder('o1');
  assert.equal(await store.getOrder('o1'), null);
  const r = await ops.restoreBackup(full.buf);
  assert.ok(r.restored.includes('orders.json'));
  assert.ok((await store.getOrder('o1')).profile.photo);
  assert.ok(fs.existsSync(path.join(dir, 'kopie', r.savedBefore)));
  await assert.rejects(ops.restoreBackup(Buffer.from('nie kopia')), /kopii zapasowej/);
  const bad = zlib.gzipSync(Buffer.from(JSON.stringify({ app: 'inna', files: {} })));
  await assert.rejects(ops.restoreBackup(bad), /kopii zapasowej/);
});

test('Ustawienia e-maili: domyślnie włączone, zapis tylko znanych pól', async () => {
  assert.deepEqual(await ops.getSettings(), { orderMail: true, dailyMail: true, backupMail: true });
  const s = await ops.saveSettings({ orderMail: false, hack: true });
  assert.equal(s.orderMail, false); assert.equal(s.hack, undefined);
});
