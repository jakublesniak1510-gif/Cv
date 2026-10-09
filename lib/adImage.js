import { askJson } from './ai.js';

// Ogłoszenie ze zdjęcia lub zrzutu ekranu (Facebook, OLX, grupy z ofertami): model przepisuje treść oferty.
export class AdImageError extends Error {}
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const SYSTEM = `Odczytujesz ogłoszenie o pracę ze zdjęcia albo zrzutu ekranu (np. z Facebooka, OLX, grupy z ofertami pracy, tablicy ogłoszeń).
Przepisz treść oferty dokładnie tak, jak jest napisana, w oryginalnym języku. Niczego nie dopisuj i nie poprawiaj.
Pomiń elementy interfejsu, które nie są częścią ogłoszenia: przyciski, menu, reklamy, komentarze, reakcje, godziny, liczby polubień.
Jeśli tekst jest częściowo nieczytelny, przepisz to, co da się odczytać, a w miejscu luki wstaw „[…]”.
Zwróć wyłącznie JSON: {"isAd": true|false, "title": "nazwa stanowiska lub pusty tekst", "company": "pracodawca lub pusty tekst", "text": "pełna treść ogłoszenia"}.
Jeśli na obrazie nie ma ogłoszenia o pracę, zwróć {"isAd": false, "title": "", "company": "", "text": ""}.`;

export async function adFromImage(dataUrl) {
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m || !TYPES.includes(m[1])) throw new AdImageError('Wgraj zdjęcie w formacie JPG, PNG lub WebP.');
  if (m[2].length > 7_000_000) throw new AdImageError('Zdjęcie jest za duże. Wgraj mniejsze (do 5 MB).');
  const out = await askJson(SYSTEM, [
    { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
    { type: 'text', text: 'Przepisz ogłoszenie o pracę z tego obrazu.' },
  ], { effort: 'low', maxTokens: 8000 });
  const text = String(out.text || '').trim().slice(0, 10000);
  if (!out.isAd || text.length < 40) throw new AdImageError('Na zdjęciu nie widać ogłoszenia o pracę albo tekst jest nieczytelny. Zrób ostrzejsze zdjęcie lub wklej treść.');
  return { title: String(out.title || '').slice(0, 100), company: String(out.company || '').slice(0, 100), text };
}
