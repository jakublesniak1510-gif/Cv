const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search), id = q.get('id');
const el = (t, p = {}, ...kids) => { const e = Object.assign(document.createElement(t), p); e.append(...kids.filter((k) => k != null && k !== false)); return e; };
let data, curAd = 0, curDoc = 'cv', timer;

async function load() {
  const r = await fetch(`/api/orders/${id}`);
  if (!r.ok) return ($('#state').textContent = 'Nie znaleziono zamówienia.');
  data = await r.json();
  if (data.status === 'done') { clearInterval(timer); $('#state').hidden = true; return show(); }
  if (data.status === 'pending') {
    if (q.get('demo')) { $('#state').hidden = true; $('#demoPay').hidden = false; }
    else $('#state').textContent = 'Czekamy na potwierdzenie płatności…';
  } else if (data.status === 'generating') {
    $('#demoPay').hidden = true; $('#state').hidden = false;
    $('#state').textContent = 'Płatność przyjęta. Piszemy Twoje dokumenty – to zajmie ok. minuty…';
  } else if (data.status === 'paid') {
    clearInterval(timer);
    $('#state').replaceChildren(el('p', {}, data.error || 'Błąd'), el('button', { className: 'btn', textContent: 'Spróbuj ponownie', onclick: async () => { await fetch(`/api/orders/${id}/retry`, { method: 'POST' }); $('#state').textContent = 'Generowanie…'; timer = setInterval(load, 3000); } }));
  }
}
$('#demoBtn').onclick = async () => { $('#demoPay').hidden = true; await fetch(`/api/orders/${id}/demo-pay`, { method: 'POST' }); $('#state').hidden = false; $('#state').textContent = 'Generowanie…'; load(); };

const list = (t, items) => items?.length ? [el('h3', { textContent: t }), el('div', { textContent: items.join(' • ') })] : [];

function cvNode(r) {
  const c = r.cv, p = el('div', { className: 'paper' });
  p.append(el('h1', { textContent: c.name }), c.headline && el('div', { className: 'hl', textContent: c.headline }), el('div', { className: 'ct', textContent: (c.contact || []).filter(Boolean).join('  |  ') }));
  if (c.summary) p.append(el('h3', { textContent: 'Profil zawodowy' }), el('div', { textContent: c.summary }));
  if (c.experience?.length) {
    p.append(el('h3', { textContent: 'Doświadczenie zawodowe' }));
    c.experience.forEach((e) => p.append(el('div', { className: 'role' }, el('span', { textContent: e.title }), el('em', { textContent: e.period })), el('div', { className: 'co', textContent: e.company }), el('ul', {}, ...(e.bullets || []).map((b) => el('li', { textContent: b })))));
  }
  if (c.education?.length) {
    p.append(el('h3', { textContent: 'Wykształcenie' }));
    c.education.forEach((e) => p.append(el('div', { className: 'role' }, el('span', { textContent: e.school }), el('em', { textContent: e.period })), el('div', { className: 'co', style: 'margin-bottom:8px', textContent: e.degree })));
  }
  p.append(...list('Umiejętności', c.skills), ...list('Języki', c.languages), ...list('Certyfikaty i kursy', c.certificates));
  if (c.interests) p.append(...list('Zainteresowania', [c.interests]));
  if (c.clause) p.append(el('div', { className: 'clause', textContent: c.clause }));
  return p;
}
function letterNode(r) {
  const p = el('div', { className: 'paper letter' });
  const when = new Date().toLocaleDateString('pl-PL');
  p.append(el('div', { style: 'text-align:right;margin-bottom:18px', textContent: `${r.cv.contact?.[2] || ''}${r.cv.contact?.[2] ? ', ' : ''}${when}` }), el('div', { style: 'font-weight:700;margin-bottom:18px', textContent: r.cv.name }));
  (r.letter || '').split(/\n\n+/).forEach((para) => p.append(el('p', { textContent: para })));
  return p;
}

function show() {
  $('#out').hidden = false;
  const withLetter = data.pkg === 'cv_letter';
  const draw = () => {
    $('#adTabs').replaceChildren(...(data.results.length > 1 ? data.results.map((r, i) => el('button', { className: i === curAd ? 'on' : '', textContent: `Ogłoszenie ${i + 1}: ${(r.position || '').slice(0, 30)}`, onclick: () => { curAd = i; draw(); } })) : []));
    $('#docTabs').replaceChildren(...(withLetter ? [['cv', 'CV'], ['letter', 'List motywacyjny']].map(([k, t]) => el('button', { className: k === curDoc ? 'on' : '', textContent: t, onclick: () => { curDoc = k; draw(); } })) : []));
    const r = data.results[curAd];
    $('#papers').replaceChildren(!withLetter || curDoc === 'cv' ? cvNode(r) : letterNode(r));
    document.title = `${curDoc === 'letter' ? 'List' : 'CV'} - ${r.cv.name}`;
  };
  $('#print').onclick = () => window.print();
  draw();
}
load(); timer = setInterval(load, 3000);
