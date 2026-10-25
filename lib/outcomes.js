// Wyniki klientów: za osobną zgodą z zamówienia po 14 dniach jeden e-mail z pytaniem, czy klient dostał zaproszenie na rozmowę.
// Odpowiedź bez logowania (token jednorazowy; GET pokazuje stronę z przyciskiem, zapis dopiero POST-em, żeby skanery linków
// w poczcie nie „odpowiadały” za klienta). Zapisujemy tylko: numer zamówienia (do 30 dni), odpowiedź, datę, pakiet i język;
// e-mail nie trafia do tego magazynu. Po 30 dniach od wysłania pytania wpis jest anonimizowany (bez numeru zamówienia i tokenu).
// Wynik na stronie pokazujemy automatycznie dopiero od OUTCOMES_MIN odpowiedzi osób, które wysłały CV (domyślnie 50).
import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';
import { ssrPage, escHtml as esc } from './seo.js';
import { getOrder, codes } from './store.js';
import { PRICES } from './pricing.js';
import { toolUrl } from './tools-i18n.js';

export const outcomes = makeStore('outcomes.json');
export const OUTCOME_CONSENT = 'Zapytajcie mnie za 14 dni, czy dostałem(-am) zaproszenie na rozmowę (1 wiadomość).';
export const OUTCOME_AFTER = 14 * 864e5, ANON_AFTER = 30 * 864e5;
export const ANSWERS = ['yes', 'not_yet', 'not_applied'];
export const outcomesMin = (env = process.env) => Math.max(1, parseInt(env.OUTCOMES_MIN, 10) || 50);
const LANGS = ['pl', 'en', 'uk', 'de'];
const day = (t) => new Date(t).toISOString().slice(0, 10);
const plDate = (d) => d.split('-').reverse().join('.');

// Teksty e-maila i stron odpowiedzi (język strony, na której klient zamawiał).
export const OT = {
  pl: {
    next: {
      yes: (p) => `Gratulacje! Przed rozmową możesz przećwiczyć odpowiedzi w symulatorze rozmowy pod to ogłoszenie – ${p} zł.`, yesBtn: 'Przejdź do symulatora rozmowy', review: 'Jeśli dokumenty Ci pomogły, napisz krótką opinię:',
      wait: 'Jeśli długo nie ma odpowiedzi, warto uprzejmie przypomnieć się pracodawcy. W koncie zapiszesz wysłane aplikacje i ustawisz przypomnienie o follow-up.', waitBtn: 'Moje aplikacje', code: (c) => `Twój kod polecający: ${c} – znajomi płacą z nim 10 zł mniej, a Ty dostajesz 10 zł na kolejne zamówienie za każdego, kto zapłaci.`,
      none: 'Gdy znajdziesz ogłoszenie, sprawdź za darmo, jak Twoje CV do niego pasuje.', noneBtn: 'Sprawdź CV za darmo',
    },
    subj: 'Czy dostałeś(-aś) zaproszenie na rozmowę? (1 kliknięcie)',
    hi: 'Dzień dobry,', q: 'dwa tygodnie temu przygotowaliśmy Twoje CV. Czy po wysłaniu CV dostałeś(-aś) zaproszenie na rozmowę?',
    why: 'Odpowiedź zajmie kilka sekund i pomoże nam rzetelnie pokazać, jak działają nasze dokumenty. Odpowiedzi liczymy tylko zbiorczo.',
    a: { yes: 'Tak, dostałem(-am) zaproszenie', not_yet: 'Jeszcze nie', not_applied: 'Nie aplikowałem(-am) jeszcze' },
    note: 'To jednorazowa wiadomość wysłana za Twoją zgodą z zamówienia. Nie chcesz odpowiadać? Możesz też usunąć swoją zgodę:', unsub: 'wypisz mnie i usuń odpowiedź',
    confirmT: 'Twoja odpowiedź', confirm: 'Zapisz odpowiedź', invites: 'Ile zaproszeń na rozmowę dostałeś(-aś)? (opcjonalnie)',
    savedT: 'Dziękujemy!', saved: 'Zapisaliśmy odpowiedź. Jeśli coś się zmieni, możesz ją poprawić tym samym linkiem przez 30 dni od wysłania pytania.',
    goneT: 'Link nieaktualny', gone: 'Ten link wygasł albo odpowiedź została już usunięta.',
    unsubT: 'Wypisać się z ankiety?', unsubB: 'Wypisz mnie', unsubBody: 'Usuniemy pytanie i Twoją odpowiedź (jeśli już jej udzieliłeś(-aś)). Nie wyślemy więcej wiadomości w tej sprawie.',
    unsubDoneT: 'Wypisano', unsubDone: 'Usunęliśmy pytanie i odpowiedź. Nie wyślemy więcej wiadomości w tej sprawie.',
  },
  en: {
    next: {
      yes: (p) => `Congratulations! Before the interview you can practise your answers in the interview simulator for this job ad – PLN ${p}.`, yesBtn: 'Go to the interview simulator', review: 'If the documents helped you, please write a short review:',
      wait: 'If there is no reply for a while, it is worth politely following up with the employer. In your account you can save your applications and set a follow-up reminder.', waitBtn: 'My applications', code: (c) => `Your referral code: ${c} – friends pay PLN 10 less with it, and you get PLN 10 towards your next order for everyone who pays.`,
      none: 'When you find a job ad, check for free how well your CV matches it.', noneBtn: 'Check your CV for free',
    },
    subj: 'Did you get invited to an interview? (1 click)',
    hi: 'Hello,', q: 'two weeks ago we prepared your CV. After sending it, did you get invited to an interview?',
    why: 'Answering takes a few seconds and helps us show honestly how our documents work. We only count answers in aggregate.',
    a: { yes: 'Yes, I got an invitation', not_yet: 'Not yet', not_applied: 'I have not applied yet' },
    note: 'This is a one-time message sent with the consent you gave in your order. Prefer not to answer? You can also withdraw your consent:', unsub: 'unsubscribe and delete my answer',
    confirmT: 'Your answer', confirm: 'Save answer', invites: 'How many interview invitations did you get? (optional)',
    savedT: 'Thank you!', saved: 'We have saved your answer. If something changes, you can update it with the same link for 30 days from when we asked.',
    goneT: 'Link expired', gone: 'This link has expired or the answer has already been deleted.',
    unsubT: 'Unsubscribe from the survey?', unsubB: 'Unsubscribe', unsubBody: 'We will delete the question and your answer (if you have already given one). We will not send any more messages about it.',
    unsubDoneT: 'Unsubscribed', unsubDone: 'We have deleted the question and the answer. We will not send any more messages about it.',
  },
  uk: {
    next: {
      yes: (p) => `Вітаємо! Перед співбесідою можна потренувати відповіді в симуляторі співбесіди під це оголошення – ${p} зл.`, yesBtn: 'Перейти до симулятора співбесіди', review: 'Якщо документи вам допомогли, напишіть короткий відгук:',
      wait: 'Якщо відповіді довго немає, варто ввічливо нагадати про себе роботодавцю. В обліковому записі можна зберегти надіслані заявки й налаштувати нагадування про follow-up.', waitBtn: 'Мої заявки', code: (c) => `Ваш реферальний код: ${c} – друзі платять із ним на 10 зл менше, а ви отримуєте 10 зл на наступне замовлення за кожного, хто оплатить.`,
      none: 'Коли знайдете оголошення, безкоштовно перевірте, наскільки ваше резюме йому відповідає.', noneBtn: 'Перевірити резюме безкоштовно',
    },
    subj: 'Чи запросили вас на співбесіду? (1 клік)',
    hi: 'Добрий день,', q: 'два тижні тому ми підготували ваше резюме. Чи запросили вас на співбесіду після того, як ви його надіслали?',
    why: 'Відповідь займе кілька секунд і допоможе нам чесно показати, як працюють наші документи. Відповіді ми рахуємо лише загалом.',
    a: { yes: 'Так, мене запросили', not_yet: 'Ще ні', not_applied: 'Я ще не надсилав(-ла) резюме' },
    note: 'Це одноразове повідомлення, надіслане за вашою згодою із замовлення. Не хочете відповідати? Ви також можете відкликати згоду:', unsub: 'відписатися й видалити відповідь',
    confirmT: 'Ваша відповідь', confirm: 'Зберегти відповідь', invites: 'Скільки запрошень на співбесіду ви отримали? (необов’язково)',
    savedT: 'Дякуємо!', saved: 'Ми зберегли відповідь. Якщо щось зміниться, її можна виправити за цим самим посиланням протягом 30 днів від запитання.',
    goneT: 'Посилання неактуальне', gone: 'Посилання застаріло або відповідь уже видалено.',
    unsubT: 'Відписатися від опитування?', unsubB: 'Відписатися', unsubBody: 'Ми видалимо запитання і вашу відповідь (якщо ви її вже дали). Більше повідомлень про це не надсилатимемо.',
    unsubDoneT: 'Ви відписалися', unsubDone: 'Ми видалили запитання і відповідь. Більше повідомлень про це не надсилатимемо.',
  },
  de: {
    next: {
      yes: (p) => `Herzlichen Glückwunsch! Vor dem Gespräch können Sie Ihre Antworten im Interview-Simulator für diese Anzeige üben – ${p} PLN.`, yesBtn: 'Zum Interview-Simulator', review: 'Wenn Ihnen die Unterlagen geholfen haben, schreiben Sie bitte eine kurze Bewertung:',
      wait: 'Wenn längere Zeit keine Antwort kommt, lohnt sich eine höfliche Nachfrage beim Arbeitgeber. Im Konto speichern Sie Ihre Bewerbungen und stellen eine Follow-up-Erinnerung ein.', waitBtn: 'Meine Bewerbungen', code: (c) => `Ihr Empfehlungscode: ${c} – Freunde zahlen damit 10 PLN weniger, und Sie erhalten für jede Person, die bezahlt, 10 PLN für Ihre nächste Bestellung.`,
      none: 'Wenn Sie eine Stellenanzeige finden, prüfen Sie kostenlos, wie gut Ihr Lebenslauf dazu passt.', noneBtn: 'Lebenslauf kostenlos prüfen',
    },
    subj: 'Wurden Sie zu einem Vorstellungsgespräch eingeladen? (1 Klick)',
    hi: 'Guten Tag,', q: 'vor zwei Wochen haben wir Ihren Lebenslauf erstellt. Wurden Sie nach dem Versand zu einem Vorstellungsgespräch eingeladen?',
    why: 'Die Antwort dauert nur ein paar Sekunden und hilft uns, ehrlich zu zeigen, wie unsere Unterlagen wirken. Wir werten Antworten nur zusammengefasst aus.',
    a: { yes: 'Ja, ich wurde eingeladen', not_yet: 'Noch nicht', not_applied: 'Ich habe mich noch nicht beworben' },
    note: 'Dies ist eine einmalige Nachricht, die wir mit Ihrer Einwilligung aus der Bestellung senden. Sie möchten nicht antworten? Sie können Ihre Einwilligung auch widerrufen:', unsub: 'abmelden und Antwort löschen',
    confirmT: 'Ihre Antwort', confirm: 'Antwort speichern', invites: 'Wie viele Einladungen haben Sie erhalten? (optional)',
    savedT: 'Vielen Dank!', saved: 'Wir haben Ihre Antwort gespeichert. Falls sich etwas ändert, können Sie sie über denselben Link 30 Tage lang ab der Frage ändern.',
    goneT: 'Link abgelaufen', gone: 'Dieser Link ist abgelaufen oder die Antwort wurde bereits gelöscht.',
    unsubT: 'Von der Umfrage abmelden?', unsubB: 'Abmelden', unsubBody: 'Wir löschen die Frage und Ihre Antwort (falls Sie schon geantwortet haben). Wir senden dazu keine weiteren Nachrichten.',
    unsubDoneT: 'Abgemeldet', unsubDone: 'Wir haben die Frage und die Antwort gelöscht. Wir senden dazu keine weiteren Nachrichten.',
  },
};

// Wpis ankiety dla zamówienia (bez e-maila: adres bierzemy z zamówienia tylko w chwili wysyłki).
export async function startOutcome(order) {
  const lang = LANGS.includes(order.uiLang) ? order.uiLang : 'pl';
  return outcomes.save({ id: crypto.randomUUID(), token: crypto.randomBytes(24).toString('base64url'), orderId: order.id, pkg: order.pkg || '', lang, sentAt: Date.now(), answer: null, answeredAt: null, invites: null });
}
export const outcomeLinks = (base, rec) => ({
  ...Object.fromEntries(ANSWERS.map((a) => [a, `${base}/wyniki/odpowiedz?t=${rec.token}&a=${a}`])),
  unsub: `${base}/wyniki/wypisz?t=${rec.token}`,
});

// Co godzinę: anonimizacja wpisów starszych niż 30 dni od wysłania pytania (zostaje odpowiedź, dzień, pakiet i język).
export async function anonymizeOutcomes(now = Date.now()) {
  const all = Object.values(await outcomes.all()).filter((r) => r.token && now - r.sentAt >= ANON_AFTER);
  for (const r of all) await outcomes.update(r.id, (x) => ({ id: x.id, anon: true, pkg: x.pkg, lang: x.lang, sentDay: day(x.sentAt), answer: x.answer, answerDay: x.answeredAt ? day(x.answeredAt) : null, invites: x.invites }));
  return all.length;
}

const sentDayOf = (r) => r.sentDay || day(r.sentAt);
const answerDayOf = (r) => r.answerDay || (r.answeredAt ? day(r.answeredAt) : null);
// Zestawienie do panelu i na stronę: „tak” liczymy wśród osób, które wysłały CV (tak + jeszcze nie).
export function outcomeStats(list) {
  const by = (a) => list.filter((r) => r.answer === a).length;
  const yes = by('yes'), notYet = by('not_yet'), notApplied = by('not_applied'), applied = yes + notYet;
  const days = list.filter((r) => r.answer === 'yes' || r.answer === 'not_yet').map(answerDayOf).filter(Boolean).sort();
  const inv = list.filter((r) => r.answer === 'yes' && r.invites > 0).map((r) => r.invites);
  const group = (k) => Object.entries(list.reduce((m, r) => { const g = (m[r[k] || '–'] ||= { sent: 0, answered: 0, applied: 0, yes: 0 }); g.sent++; if (r.answer) g.answered++; if (r.answer === 'yes' || r.answer === 'not_yet') g.applied++; if (r.answer === 'yes') g.yes++; return m; }, {})).map(([key, v]) => ({ key, ...v }));
  return {
    sent: list.length, answered: yes + notYet + notApplied, yes, notYet, notApplied, applied,
    pctYes: applied ? Math.round((100 * yes) / applied) : null,
    avgInvites: inv.length ? Math.round((10 * inv.reduce((s, n) => s + n, 0)) / inv.length) / 10 : null,
    from: days[0] || null, to: days.at(-1) || null, firstSent: list.map(sentDayOf).sort()[0] || null,
    byPkg: group('pkg'), byLang: group('lang'),
  };
}

// Wynik do publikacji: tylko od OUTCOMES_MIN odpowiedzi osób, które wysłały CV; wcześniej null (na stronie nic się nie pokazuje).
export async function publicOutcome(env = process.env) {
  const s = outcomeStats(Object.values(await outcomes.all()));
  if (s.applied < outcomesMin(env)) return null;
  return { pct: s.pctYes, n: s.applied, from: plDate(s.from), to: plDate(s.to) };
}
export const outcomeSentence = (o) => `${o.pct}% klientów, którzy odpowiedzieli na naszą ankietę i wysłali CV, dostało co najmniej jedno zaproszenie na rozmowę (n=${o.n}, okres ${o.from}–${o.to}).`;

const METHOD = {
  title: 'Jak liczymy wyniki klientów',
  metaDescription: 'Skąd pochodzi odsetek klientów zaproszonych na rozmowę: dobrowolna ankieta po 14 dniach, samodzielne deklaracje, bez gwarancji. Metoda i zasady publikacji.',
};
const methodHtml = (o) => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Jak liczymy</span></nav>
<h1>${esc(METHOD.title)}</h1>
${o ? `<p class="lead">${esc(outcomeSentence(o))}</p>` : '<p class="lead">Wynik opublikujemy, gdy zbierzemy wystarczająco dużo odpowiedzi. Do tego czasu nie pokazujemy żadnych liczb.</p>'}
<h2>Skąd są dane</h2>
<p>Przy zamówieniu można zaznaczyć opcjonalną zgodę: „${esc(OUTCOME_CONSENT)}” Domyślnie jest odznaczona. Po 14 dniach od zamówienia wysyłamy jeden e-mail z trzema odpowiedziami do wyboru: „Tak, dostałem(-am) zaproszenie”, „Jeszcze nie” albo „Nie aplikowałem(-am) jeszcze”, z opcjonalnym polem na liczbę zaproszeń.</p>
<h2>Jak liczymy odsetek</h2>
<p>Liczymy tylko osoby, które odpowiedziały i wysłały CV (odpowiedź „Tak” albo „Jeszcze nie”). Odsetek to udział odpowiedzi „Tak” w tej grupie. Odpowiedzi „Nie aplikowałem(-am) jeszcze” nie wliczamy. Podajemy liczbę odpowiedzi (n) i okres, z którego pochodzą.</p>
<h2>Ograniczenia</h2>
<ul><li>Ankieta jest dobrowolna, więc odpowiadają nie wszyscy klienci, a wynik może się różnić od wyniku wszystkich klientów.</li>
<li>Odpowiedzi to samodzielne deklaracje klientów. Nie sprawdzamy ich u pracodawców.</li>
<li>Zaproszenie na rozmowę zależy od wielu rzeczy: doświadczenia, rynku pracy, liczby wysłanych CV i samej oferty. Wynik nie jest gwarancją zaproszenia ani zatrudnienia.</li></ul>
<h2>Kiedy publikujemy wynik</h2>
<p>Wynik pokazuje się automatycznie dopiero od ${outcomesMin()} odpowiedzi osób, które wysłały CV, i aktualizuje się sam. Nie wybieramy odpowiedzi ani okresu ręcznie.</p>
<h2>Prywatność</h2>
<p>W ankiecie zapisujemy tylko numer zamówienia (najwyżej przez 30 dni od wysłania pytania), odpowiedź, datę, pakiet i język strony. Po 30 dniach wpis jest anonimizowany. Adresu e-mail nie zapisujemy przy odpowiedzi. Szczegóły: <a href="/polityka-prywatnosci">Polityka prywatności</a>.</p>
</div>`;

const L = (r) => OT[r?.lang] || OT.pl;
const box = (r, title, body) => ({ title, html: `<div class="inner narrow"><h1>${esc(title)}</h1>${body}</div>`, lang: r?.lang && r.lang !== 'pl' ? r.lang : undefined });
const send = (res, base, path, b) => { res.set('Cache-Control', 'no-store'); ssrPage(res, base, path, { title: b.title, metaDescription: b.title }, b.html, { noindex: true, ...(b.lang ? { lang: b.lang } : {}) }); };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const byToken = async (t) => (t && t.length >= 20 ? Object.values(await outcomes.all()).find((r) => r.token === t) || null : null);

// Po odpowiedzi jeden krok dalej: „Tak” → symulator rozmowy (jeśli nie kupiony; dokupienie na stronie dokumentów) i prośba o opinię
// (REVIEW_URL); „Jeszcze nie” → lista aplikacji z przypomnieniem o follow-up i kod polecający klienta; „Nie aplikowałem” → skaner.
const btnA = (href, t) => `<p><a class="btn" href="${esc(href)}">${esc(t)}</a></p>`;
export async function nextStep(r, a, T, env = process.env) {
  const N = T.next, o = r.orderId ? await getOrder(r.orderId) : null, l = r.lang && r.lang !== 'pl' ? r.lang : '';
  if (a === 'yes') {
    const sim = o && o.status === 'done' && !o.addons?.sim ? `<p>${esc(N.yes(PRICES.sim / 100))}</p>${btnA(`/${l ? l : ''}?id=${o.id}#upsell`, N.yesBtn)}` : '';
    const rv = /^https:\/\/[^\s"'<>]{4,300}$/.test(env.REVIEW_URL || '') ? `<p>${esc(N.review)} <a href="${esc(env.REVIEW_URL)}" target="_blank" rel="noopener">${esc((env.REVIEW_SITE_NAME || 'Trustpilot').trim().slice(0, 40))}</a></p>` : '';
    return sim + rv;
  }
  if (a === 'not_yet') {
    const c = o?.myCode ? await codes.get(o.myCode) : null;
    return `<p>${esc(N.wait)}</p>${btnA('/konto', N.waitBtn)}${c && !c.disabled ? `<p>${esc(N.code(c.id))}</p>` : ''}`;
  }
  return `<p>${esc(N.none)}</p>${btnA(l ? `/${toolUrl(l, 'skaner-cv')}` : '/narzedzia/skaner-cv', N.noneBtn)}`;
}

export function outcomeRoutes(app, { BASE_URL }) {
  app.get('/jak-liczymy', async (_req, res) => {
    const o = await publicOutcome().catch(() => null);
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'jak-liczymy', METHOD, methodHtml(o), { noindex: !o });
  });
  app.get('/wyniki/odpowiedz', async (req, res) => {
    const t = str(req.query.t, 80), a = ANSWERS.includes(req.query.a) ? req.query.a : null, r = await byToken(t), T = L(r);
    if (!r || !a) return send(res, BASE_URL, 'wyniki/odpowiedz', box(r, T.goneT, `<p>${esc(T.gone)}</p>`));
    const choice = ANSWERS.map((k) => `<label class="check"><input type="radio" name="a" value="${k}"${k === a ? ' checked' : ''}> <span>${esc(T.a[k])}</span></label>`).join('');
    send(res, BASE_URL, 'wyniki/odpowiedz', box(r, T.confirmT, `<form method="post" action="/wyniki/odpowiedz?t=${esc(t)}" class="form">${choice}
<label class="f">${esc(T.invites)}<input type="number" name="invites" min="1" max="50" inputmode="numeric"${r.invites ? ` value="${r.invites}"` : ''}></label>
<p><button class="btn" type="submit">${esc(T.confirm)}</button></p></form>`));
  });
  app.post('/wyniki/odpowiedz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const r = await byToken(str(req.query.t, 80)), T = L(r), a = req.body?.a;
    if (!r || !ANSWERS.includes(a)) return send(res, BASE_URL, 'wyniki/odpowiedz', box(r, T.goneT, `<p>${esc(T.gone)}</p>`));
    const n = parseInt(req.body.invites, 10), invites = a === 'yes' && n >= 1 && n <= 50 ? n : null;
    await outcomes.update(r.id, { answer: a, answeredAt: Date.now(), invites });
    send(res, BASE_URL, 'wyniki/odpowiedz', box(r, T.savedT, `<p>${esc(T.saved)}</p>${await nextStep(r, a, T).catch(() => '')}`));
  });
  app.get('/wyniki/wypisz', async (req, res) => {
    const t = str(req.query.t, 80), r = await byToken(t), T = L(r);
    if (!r) return send(res, BASE_URL, 'wyniki/wypisz', box(r, T.goneT, `<p>${esc(T.gone)}</p>`));
    send(res, BASE_URL, 'wyniki/wypisz', box(r, T.unsubT, `<p>${esc(T.unsubBody)}</p><form method="post" action="/wyniki/wypisz?t=${esc(t)}"><button class="btn" type="submit">${esc(T.unsubB)}</button></form>`));
  });
  app.post('/wyniki/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const r = await byToken(str(req.query.t, 80)), T = L(r);
    if (r) await outcomes.remove(r.id);
    send(res, BASE_URL, 'wyniki/wypisz', box(r, T.unsubDoneT, `<p>${esc(T.unsubDone)}</p>`));
  });
}
