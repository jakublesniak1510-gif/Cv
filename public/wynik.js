// Karta wyniku skanera (/wynik/<id>): kopiowanie linku i systemowe „Udostępnij” na telefonie (Web Share API).
// Obrazki 1080×1080 i 1080×1920: na telefonie udostępnienie pliku, gdy przeglądarka to umie, inaczej pobranie.
(() => {
  const img = document.querySelector('.share-img'); if (!img) return;
  const files = navigator.canShare && matchMedia('(pointer:coarse)').matches;
  img.querySelectorAll('[data-img]').forEach((b) => {
    if (files) b.textContent = b.dataset.share;
    b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        const r = await fetch(b.dataset.img); if (!r.ok) throw new Error();
        const blob = await r.blob(), file = new File([blob], `wynik-cv-${b.dataset.img.match(/(\d+x\d+)\.png$/)[1]}.png`, { type: 'image/png' });
        if (files && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] }).catch(() => {});
        else { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
      } catch { const st = document.querySelector('[data-status]'); if (st) st.textContent = img.dataset.err; }
      b.disabled = false;
    });
  });
})();
(() => {
  const box = document.querySelector('.share-btns[data-url]'); if (!box) return;
  const { url, text, copied } = box.dataset, st = box.querySelector('[data-status]'), nat = box.querySelector('[data-native]');
  if (navigator.share && matchMedia('(pointer:coarse)').matches) { nat.hidden = false; nat.addEventListener('click', () => navigator.share({ title: document.title, text, url }).catch(() => {})); }
  box.querySelector('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); } catch { const i = Object.assign(document.createElement('input'), { value: url }); document.body.append(i); i.select(); document.execCommand('copy'); i.remove(); }
    st.textContent = copied;
  });
})();
