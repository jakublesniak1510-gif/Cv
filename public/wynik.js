// Karta wyniku skanera (/wynik/<id>): kopiowanie linku i systemowe „Udostępnij” na telefonie (Web Share API).
(() => {
  const box = document.querySelector('.share-btns[data-url]'); if (!box) return;
  const { url, text, copied } = box.dataset, st = box.querySelector('[data-status]'), nat = box.querySelector('[data-native]');
  if (navigator.share && matchMedia('(pointer:coarse)').matches) { nat.hidden = false; nat.addEventListener('click', () => navigator.share({ title: document.title, text, url }).catch(() => {})); }
  box.querySelector('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); } catch { const i = Object.assign(document.createElement('input'), { value: url }); document.body.append(i); i.select(); document.execCommand('copy'); i.remove(); }
    st.textContent = copied;
  });
})();
