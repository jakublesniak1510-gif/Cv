const $ = (s, r = document) => r.querySelector(s);
const PRICE = { cv: 39, cv_letter: 49, extra: 20 };
let maxAds = 5;

fetch('/api/config').then((r) => r.json()).then((c) => { maxAds = c.maxAds; $('#demo').hidden = !c.demo; });

const expT = () => `<div class="entry"><button type="button" class="rm">Usuń</button>
<div class="grid4"><label class="f">Stanowisko<input type="text" data-k="title"></label><label class="f">Firma<input type="text" data-k="company"></label>
<label class="f">Od<input type="text" data-k="from" placeholder="03.2021"></label><label class="f">Do<input type="text" data-k="to" placeholder="obecnie"></label></div>
<label class="f">Zakres obowiązków i osiągnięcia <span class="h">każdy punkt w nowej linii</span><textarea data-k="description"></textarea></label></div>`;
const eduT = () => `<div class="entry"><button type="button" class="rm">Usuń</button>
<div class="grid4"><label class="f">Szkoła / uczelnia<input type="text" data-k="school"></label><label class="f">Kierunek / tytuł<input type="text" data-k="degree"></label>
<label class="f">Od<input type="text" data-k="from"></label><label class="f">Do<input type="text" data-k="to"></label></div></div>`;
const adT = () => `<div class="entry"><button type="button" class="rm">Usuń</button><label class="f">Treść ogłoszenia <span class="h">wklej cały tekst oferty</span><textarea data-k="text" style="min-height:160px"></textarea></label></div>`;

function add(box, tpl) {
  const d = document.createElement('div'); d.innerHTML = tpl(); const el = d.firstElementChild;
  $('.rm', el).onclick = () => { el.remove(); update(); };
  $(box).append(el); update();
}
$('#addExp').onclick = () => add('#exp', expT);
$('#addEdu').onclick = () => add('#edu', eduT);
$('#addAd').onclick = () => { if ($('#ads').children.length >= maxAds) return; add('#ads', adT); };
add('#exp', expT); add('#edu', eduT); add('#ads', adT);

function update() {
  const pkg = $('input[name=pkg]:checked').value, n = Math.max(1, $('#ads').children.length);
  $('#total').textContent = `${PRICE[pkg] + PRICE.extra * (n - 1)} zł`;
  $('#breakdown').textContent = n > 1 ? `(${PRICE[pkg]} zł + ${n - 1} × ${PRICE.extra} zł)` : '';
  $('#ads .rm') && ([...$('#ads').children].forEach((e) => ($('.rm', e).hidden = n === 1)));
}
document.querySelectorAll('input[name=pkg]').forEach((r) => (r.onchange = update));

const rows = (box) => [...$(box).children].map((e) => Object.fromEntries([...e.querySelectorAll('[data-k]')].map((i) => [i.dataset.k, i.value])));

$('#form').onsubmit = async (ev) => {
  ev.preventDefault();
  $('#err').textContent = '';
  const v = (id) => $('#' + id).value;
  const body = {
    pkg: $('input[name=pkg]:checked').value, consent: $('#consent').checked,
    profile: {
      ...Object.fromEntries(['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes'].map((k) => [k, v(k)])),
      experience: rows('#exp'), education: rows('#edu'),
    },
    ads: rows('#ads'),
  };
  $('#pay').disabled = true;
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    location.href = j.url;
  } catch (e) { $('#err').textContent = e.message; $('#pay').disabled = false; }
};
if (new URLSearchParams(location.search).has('canceled')) $('#err').textContent = 'Płatność anulowana. Możesz spróbować ponownie.';
update();
