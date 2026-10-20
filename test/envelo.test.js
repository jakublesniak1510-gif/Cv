import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-envelo-'));
const { parseAddress, buildEnvelo, ENVELO_HEAD } = await import('../lib/envelo.js');
const { unzip, zip } = await import('../lib/zip.js');
const { colName } = await import('../lib/xlsx.js');
const crm = await import('../lib/crm.js');
const BASE = 'https://example.test';

const cell = (xml, ref) => { const m = xml.match(new RegExp(`<c r="${ref}"( t="inlineStr")?>(?:<is><t xml:space="preserve">([^<]*)</t></is>|<v>([^<]*)</v>)</c>`)); return m ? (m[2] ?? Number(m[3])) : ''; };

test('envelo: rozbijanie adresu na pola', () => {
  assert.deepEqual(parseAddress({ org: 'Uniwersytet X', dept: 'Biuro Karier', address: 'ul. Długa 57/59 lok. 4, pok. 12, 60-001 Poznań' }),
    { company: 'Biuro Karier, Uniwersytet X, pok. 12', street: 'ul. Długa', building: '57/59', flat: '4', postal: '60-001', city: 'Poznań' });
  assert.deepEqual(parseAddress({ org: 'Urząd Miasta', address: 'Urząd Miasta\nRynek 1\n50-101 Wrocław' }),
    { company: 'Urząd Miasta', street: 'Rynek', building: '1', flat: '', postal: '50-101', city: 'Wrocław' });
  const a = parseAddress({ org: 'Szkoła', address: 'Wydział Nauk, al. 3 Maja 12A, bud. B, lok. 7, 00-950 Warszawa' });
  assert.equal(a.company, 'Szkoła, Wydział Nauk, bud. B'); assert.equal(a.street, 'al. 3 Maja'); assert.equal(a.building, '12A'); assert.equal(a.flat, '7');
  assert.equal(parseAddress({ org: 'A', address: 'Wybrzeże Kościuszkowskie 31/33, 00-379 Warszawa' }).street, 'Wybrzeże Kościuszkowskie');
  assert.match(parseAddress({ org: 'A', address: 'ul. Długa 1, Poznań' }).error, /kod/);
  assert.match(parseAddress({ org: 'A', address: 'ul. Bez Numeru, 60-001 Poznań' }).error, /ulicy/);
  assert.match(parseAddress({ org: 'A', address: 'ul. Bardzo Bardzo Długiej Nazwy Ulicy Testowej 5, 60-001 Poznań' }).error, /35/);
});

test('envelo: ZIP bez folderów, PDF na list (1 strona), XLSX z grupami i nagłówkami', async () => {
  const now = Date.UTC(2026, 9, 20, 12);
  const r = await buildEnvelo([
    { id: '1', org: 'Politechnika', dept: 'Biuro Karier', address: 'ul. Narutowicza 11/12, 80-233 Gdańsk', segment: 'uczelnia' },
    { id: '2', org: 'Zły adres', address: 'gdzieś w Polsce', segment: 'firma' },
    { id: '3', org: 'Liceum', address: 'Rynek 5 lok. 2, 33-100 Tarnów', segment: 'szkola' },
  ], { base: BASE, now });
  assert.equal(r.ok.length, 2); assert.deepEqual(r.skipped, [{ name: 'Zły adres', reason: 'brak kodu pocztowego' }]);
  const files = unzip(r.zip), names = files.map((f) => f.name);
  assert.deepEqual(names, ['envelo-2026-10-20.xlsx', 'list-01.pdf', 'list-02.pdf']);
  assert.ok(names.every((n) => !n.includes('/')), 'bez folderów');
  for (const f of files.filter((x) => x.name.endsWith('.pdf'))) { const t = f.data.toString('latin1'); assert.ok(t.startsWith('%PDF')); assert.equal((t.match(/\/Type \/Page\b/g) || []).length, 1, `${f.name}: 1 strona`); }
  const x = Object.fromEntries(unzip(files[0].data).map((f) => [f.name, f.data.toString('utf8')]));
  assert.ok(x['[Content_Types].xml'] && x['xl/workbook.xml'] && x['_rels/.rels'] && x['xl/_rels/workbook.xml.rels']);
  const s = x['xl/worksheets/sheet1.xml'];
  assert.deepEqual(['A1', 'L1', 'S1', 'Z1'].map((r) => cell(s, r)), ['Odbiorca', 'Produkt', 'Parametry druku', 'Dodatkowe dane']);
  assert.equal(ENVELO_HEAD.length, 26); ENVELO_HEAD.forEach((h, i) => assert.equal(cell(s, `${colName(i)}2`), h));
  const row = (n) => Object.fromEntries(ENVELO_HEAD.map((h, i) => [h, cell(s, `${colName(i)}${n}`)]));
  assert.deepEqual(row(3), { 'Zwrot grzecznościowy': '', 'Envelo ID': '', 'Imię': '', 'Nazwisko': '', 'Nazwa firmy': 'Biuro Karier, Politechnika', 'Ulica lub skrytka pocztowa': 'ul. Narutowicza', 'Nr budynku': '11/12', 'Nr lokalu': '', 'Kod pocztowy': '80-233', 'Miasto': 'Gdańsk', 'Kraj': 'Polska', 'Typ produktu': 1, 'Przesyłka rejestrowana': 'N', 'Wycofane (Przesyłka priorytetowa)': '', 'ZPO': 'N', 'ID szablonu papeterii listu': 1, 'ID szablonu treści listu': '', 'Wskazanie nazwy pliku PDF': 'list-01.pdf', 'Kolor': 'N', 'Duplex': 'S', 'Nadruk adresu na osobnej kartce': 'Y', 'Generowanie strony adresowej': 'Y', 'Tekst ZPO': '', 'Identyfikator insertu': '', 'Identyfikator papieru': '', 'Pole informacyjne nadawcy': 'CVPO-2026-10-20' });
  assert.equal(row(4)['Nr lokalu'], '2'); assert.equal(row(4)['Wskazanie nazwy pliku PDF'], 'list-02.pdf'); assert.equal(cell(s, 'E5'), '');
  assert.deepEqual(unzip(zip([['a.txt', 'ąę']]))[0].data.toString(), 'ąę');
});

test('envelo: kontakty → status „list wysłany”, pominięte bez adresu i z adresem do poprawy', async () => {
  await crm.importContacts('organizacja;adres;email\nE1;ul. Polna 3, 10-100 Olsztyn;\nE2;;e2@x.example\nE3;bez kodu;e3@x.example');
  const all = Object.values(await crm.contacts.all()), id = (o) => all.find((c) => c.org === o).id;
  const r = await crm.enveloFor([id('E1'), id('E2'), id('E3')], BASE);
  assert.equal(r.count, 1); assert.equal(r.noAddress, 1); assert.deepEqual(r.skipped.map((x) => x.name), ['E3']);
  assert.equal((await crm.contacts.get(id('E1'))).status, 'list wysłany'); assert.equal((await crm.contacts.get(id('E3'))).status, 'nowy');
  await assert.rejects(() => crm.enveloFor([id('E3')], BASE), /Nie udało się rozbić.*E3/);
  await assert.rejects(() => crm.enveloFor([id('E2')], BASE), /pominięto 1 bez adresu/);
});
