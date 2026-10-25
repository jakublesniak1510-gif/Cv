// „Pytania czytelników” (PR X): krótkie Q&A w poradniku. Pierwsze 10 napisane przez redakcję (typowe pytania, bez danych osób);
// kolejne dodaje właściciel w panelu (Wiadomości → Pytania czytelników): pytanie zanonimizowane, odpowiedź, publikacja po zatwierdzeniu.
import crypto from 'node:crypto';
import { makeStore } from './store.js';

export const readerQa = makeStore('reader-qa.json');
export const QA_PATH = 'poradnik/pytania-czytelnikow';
export const QA_SEED = [
  { q: 'Czy mogę wysłać to samo CV na kilka ofert?', a: 'Możesz, ale CV dopasowane do konkretnego ogłoszenia lepiej odpowiada na to, czego szuka rekruter. Wystarczy przestawić najważniejsze punkty na górę i użyć słów z ogłoszenia, jeśli są prawdą o Tobie.' },
  { q: 'Co wpisać w CV, jeśli pracowałem bez umowy?', a: 'Opisz pracę tak jak każdą inną: stanowisko, miejsce, okres i obowiązki. Forma zatrudnienia nie jest w CV wymagana. Na rozmowie odpowiadaj zgodnie z prawdą, jeśli rekruter zapyta.' },
  { q: 'Czy w CV trzeba podać wiek albo datę urodzenia?', a: 'Nie. Pracodawca nie potrzebuje tych danych na etapie rekrutacji. Wystarczą imię, nazwisko i dane kontaktowe.' },
  { q: 'Jak opisać pracę za granicą w polskim CV?', a: 'Podaj stanowisko po polsku, nazwę firmy w oryginale, kraj i okres. W obowiązkach pokaż to, co przyda się na nowym stanowisku, na przykład obsługę klienta w języku obcym.' },
  { q: 'Czy w CV trzeba podać powód odejścia z pracy?', a: 'Nie. Przygotuj za to krótką, rzeczową odpowiedź na rozmowę: czego szukasz w nowej pracy, bez krytykowania poprzedniego pracodawcy.' },
  { q: 'Ogłoszenie dała agencja i nie ma nazwy firmy. Jak dopasować CV?', a: 'Dopasuj CV do opisu stanowiska i wymagań z ogłoszenia. Nazwa pracodawcy nie jest do tego potrzebna. W liście motywacyjnym zwróć się do agencji albo użyj zwrotu „Szanowni Państwo”.' },
  { q: 'Czy dodać do CV link do profilu LinkedIn?', a: 'Tak, jeśli profil jest aktualny i zgodny z CV. Wklej krótki, czytelny adres profilu w danych kontaktowych.' },
  { q: 'Jak wpisać do CV kursy online?', a: 'W sekcji „Kursy i certyfikaty”: nazwa kursu, organizator i rok. Wpisuj te, które mają związek z ogłoszeniem; resztę możesz pominąć.' },
  { q: 'Czy stare stanowiska mogę opisać jedną linijką?', a: 'Tak. Starsze lub niezwiązane z ogłoszeniem prace wystarczy podać z nazwą stanowiska, firmą i okresem. Szczegóły zostaw dla ostatnich lat.' },
  { q: 'Ile czekać na odpowiedź po wysłaniu CV?', a: 'Jeśli ogłoszenie podaje termin, poczekaj do jego końca; jeśli nie – zwykle około dwóch tygodni. Potem możesz raz uprzejmie zapytać o etap rekrutacji. Wzory wiadomości znajdziesz w poradniku o follow-upie.' },
];
const clean = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
// Lista publiczna: najpierw zatwierdzone z panelu (od najnowszych), potem pytania redakcji.
export async function publishedQa() {
  const mine = Object.values(await readerQa.all()).filter((x) => x.status === 'published').sort((a, b) => (b.published || 0) - (a.published || 0));
  return [...mine.map(({ q, a }) => ({ q, a })), ...QA_SEED];
}
export function readerQaAdmin(api) {
  api.get('/reader-qa', async (_req, res) => res.json(Object.values(await readerQa.all()).sort((a, b) => b.created - a.created)));
  api.post('/reader-qa', async (req, res) => {
    const q = clean(req.body?.q, 300), a = clean(req.body?.a, 1200);
    if (q.length < 10 || a.length < 20) return res.status(400).json({ error: 'Wpisz pytanie (min. 10 znaków) i odpowiedź (min. 20 znaków).' });
    if (/\S+@\S+\.\S+|\+?\d[\d\s-]{7,}\d/.test(`${q} ${a}`)) return res.status(400).json({ error: 'Usuń z pytania i odpowiedzi adresy e-mail i numery telefonów (pytania publikujemy anonimowo).' });
    res.json(await readerQa.save({ id: crypto.randomUUID(), q, a, status: 'draft', created: Date.now() }));
  });
  api.post('/reader-qa/:id', async (req, res) => {
    const status = req.body?.status === 'published' ? 'published' : 'draft';
    const x = await readerQa.update(req.params.id, (o) => ({ ...o, status, ...(status === 'published' ? { published: Date.now() } : {}) }));
    res.status(x ? 200 : 404).json(x || { error: 'Nie ma takiego pytania.' });
  });
  api.delete('/reader-qa/:id', async (req, res) => { const ok = await readerQa.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });
}
