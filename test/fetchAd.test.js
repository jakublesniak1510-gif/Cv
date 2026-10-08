import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAd, fetchAd, AdError } from '../lib/fetchAd.js';

test('czyta JSON-LD JobPosting', () => {
  const html = `<html><script type="application/ld+json">{"@type":"JobPosting","title":"Kasjer","hiringOrganization":{"name":"Sklep X"},"description":"&lt;p&gt;Obsługa kasy fiskalnej i klientów w sklepie. Wymagamy komunikatywności.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Umowa o pracę&lt;/li&gt;&lt;li&gt;Praca zmianowa&lt;/li&gt;&lt;/ul&gt; Dołącz do naszego zespołu."}</script></html>`;
  const r = extractAd(html);
  assert.equal(r.title, 'Kasjer'); assert.equal(r.company, 'Sklep X');
  assert.match(r.text, /Obsługa kasy fiskalnej/); assert.doesNotMatch(r.text, /<p>/);
});
test('zwykła strona: tytuł i tekst, bez skryptów', () => {
  const body = '<p>' + 'Poszukujemy magazyniera do pracy w hurtowni. '.repeat(8) + '</p>';
  const r = extractAd(`<html><head><title>Magazynier – Firma</title></head><body><script>alert(1)</script><main>${body}</main></body></html>`);
  assert.equal(r.title, 'Magazynier – Firma'); assert.doesNotMatch(r.text, /alert/);
});
test('pusta strona daje błąd', () => assert.throws(() => extractAd('<html><body>Zaloguj się</body></html>'), AdError));
test('blokuje adresy prywatne i złe schematy', async () => {
  for (const u of ['http://127.0.0.1/x', 'http://localhost/x', 'http://10.0.0.5', 'http://[::1]/', 'http://169.254.169.254/latest', 'file:///etc/passwd', 'ftp://a.pl', 'abc'])
    await assert.rejects(() => fetchAd(u), AdError, u);
});
