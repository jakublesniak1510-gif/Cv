# Film reklamowy

`reklama.mp4` – 45 s, 1920×1080, 30 kl./s, z muzyką (wygenerowaną w skrypcie, bez praw autorskich osób trzecich). `okladka.jpg` – kadr końcowy na miniaturę.

Sceny: pytanie otwierające → problem (słowa z ogłoszenia, ATS) → strona główna → jak to działa (3 kroki) → to samo doświadczenie, trzy różne CV → 10 szablonów × 6 kolorów → darmowy skaner → cennik i płatności → logo i „Zamów CV od 39 zł”.

## Jak odświeżyć film po zmianach na stronie
```
npm start                                  # w osobnym terminalu
cd marketing
node capture.mjs                           # zrzuty sekcji (Playwright)
python3 make_video.py preview              # podgląd kilku klatek (pv_*.png)
python3 make_video.py                      # reklama.mp4 (Pillow, numpy, ffmpeg)
```
Teksty scen i czasy są w `make_video.py` (funkcje `s_*` i lista `SCENES`).
