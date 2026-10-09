import subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1920, 1080, 30
BRAND = (37, 72, 232); BRAND_D = (27, 55, 184); NAVY = (15, 23, 42)
BG = (238, 242, 255); YEL = (255, 226, 92); WHITE = (255, 255, 255)
FD = '/usr/share/fonts/opentype/inter/'
def F(name, size): return ImageFont.truetype(FD + name, size)
H1 = lambda s: F('InterDisplay-Bold.otf', s)
REG = lambda s: F('Inter-Regular.otf', s)
SEMI = lambda s: F('Inter-SemiBold.otf', s)

def load(p): return Image.open(p).convert('RGB')
IMG = {k: load(f'{k}.png') for k in ['cap_top', 'cap_skaner', 'cap_cennik', 'gal', 'ex_0', 'ex_1', 'ex_2']}
ICON = Image.open('cap_nav.png').convert('RGB').crop((238, 30, 304, 94))

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def appear(t, start, dur=0.5): return ease((t - start) / dur)

def text(img, xy, s, font, fill, a=1.0, anchor='la', dy=30):
    if a <= 0: return
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    d.text((x, y + (1 - a) * dy), s, font=font, fill=fill + (int(255 * a),), anchor=anchor)
    img.alpha_composite(layer)

def rich(img, xy, parts, font, a=1.0, anchor_center=True, dy=30):
    """parts: list of (text, color) drawn in one line, centered at x."""
    d = ImageDraw.Draw(img)
    total = sum(d.textlength(s, font=font) for s, _ in parts)
    x = xy[0] - total / 2 if anchor_center else xy[0]
    for s, c in parts:
        text(img, (x, xy[1]), s, font, c, a, dy=dy)
        x += d.textlength(s, font=font)

def card(img, shot, box, radius=22, shadow=True, a=1.0):
    x, y, w, h = box
    shot = shot.resize((int(w), int(h)), Image.LANCZOS)
    if shadow:
        sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((x, y + 18, x + w, y + h + 18), radius, fill=(20, 30, 90, int(70 * a)))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(28)))
    mask = Image.new('L', (int(w), int(h)), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=int(255 * a))
    img.paste(shot, (int(x), int(y)), mask)

def fit_crop(src, ar, top=0.0):
    """crop src to aspect ratio ar (w/h), from vertical offset top (0..1)."""
    sw, sh = src.size
    if sw / sh > ar:
        nw = int(sh * ar); return src.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    nh = int(sw / ar); oy = int((sh - nh) * top)
    return src.crop((0, oy, sw, oy + nh))

def blue_bg():
    g = np.linspace(0, 1, H)[:, None, None]
    arr = np.array(BRAND)[None, None] * (1 - g) + np.array(BRAND_D)[None, None] * g
    arr = np.broadcast_to(arr, (H, W, 3)).astype(np.uint8)
    return Image.fromarray(arr).convert('RGBA')
BLUE = blue_bg()
LIGHT = Image.new('RGBA', (W, H), BG + (255,))

def chip(img, cx, y, s, a, bg=BRAND, fg=WHITE, size=34):
    if a <= 0: return
    f = SEMI(size); d = ImageDraw.Draw(img)
    tw = d.textlength(s, font=f); pw, ph = tw + 64, size + 34
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((cx - pw / 2, y + (1 - a) * 20, cx + pw / 2, y + ph + (1 - a) * 20), ph / 2, fill=bg + (int(255 * a),))
    img.alpha_composite(layer)
    text(img, (cx, y + ph / 2 + (1 - a) * 20), s, f, fg, a, anchor='mm', dy=0)

def heading(img, t, s, sub=None, y=70):
    text(img, (W / 2, y), s, H1(68), NAVY, appear(t, 0.1), anchor='ma')
    if sub: text(img, (W / 2, y + 92), sub, REG(34), (71, 85, 105), appear(t, 0.35), anchor='ma')

# ---------------- scenes ----------------
def s_intro(t):
    img = BLUE.copy()
    text(img, (W / 2, 380), 'Wysyłasz to samo CV', H1(104), WHITE, appear(t, 0.2), anchor='ma')
    text(img, (W / 2, 510), 'na każde ogłoszenie?', H1(104), YEL, appear(t, 0.7), anchor='ma')
    return img

def s_problem(t):
    img = BLUE.copy()
    text(img, (W / 2, 360), 'Rekruter i systemy ATS szukają', SEMI(64), WHITE, appear(t, 0.1), anchor='ma')
    text(img, (W / 2, 450), 'słów z ogłoszenia.', SEMI(64), WHITE, appear(t, 0.35), anchor='ma')
    text(img, (W / 2, 600), 'Twoje CV też powinno je mieć.', H1(84), YEL, appear(t, 1.1), anchor='ma')
    return img

def s_hero(t, D=5.0):
    img = LIGHT.copy()
    a = appear(t, 0)
    z = 1.0 + 0.06 * (t / D)
    w = 1700 * z; h = w * IMG['cap_top'].height / IMG['cap_top'].width
    card(img, IMG['cap_top'], ((W - w) / 2, (H - h) / 2 - 40 + (1 - a) * 60, w, h), a=a)
    chip(img, W / 2, 900, 'CV Pod Ogłoszenie  ·  osobne CV pod każdą ofertę pracy', appear(t, 0.9), size=36)
    return img

def s_steps(t):
    img = LIGHT.copy()
    heading(img, t, 'Jak to działa?', 'Trzy kroki, kilka minut.')
    steps = [('1', 'Podajesz swoje', 'doświadczenie raz'), ('2', 'Wklejasz ogłoszenie', 'albo link do oferty'),
             ('3', 'Dostajesz CV i list', 'gotowe w PDF')]
    cw, ch, gap = 500, 420, 60
    x0 = (W - 3 * cw - 2 * gap) / 2
    for i, (n, l1, l2) in enumerate(steps):
        a = appear(t, 0.6 + i * 0.45, 0.6)
        if a <= 0: continue
        x = x0 + i * (cw + gap); y = 360 + (1 - a) * 60
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
        d.rounded_rectangle((x, y + 14, x + cw, y + ch + 14), 30, fill=(20, 30, 90, int(40 * a)))
        layer = layer.filter(ImageFilter.GaussianBlur(20)); d = ImageDraw.Draw(layer)
        d.rounded_rectangle((x, y, x + cw, y + ch), 30, fill=WHITE + (int(255 * a),))
        d.ellipse((x + cw / 2 - 60, y + 60, x + cw / 2 + 60, y + 180), fill=BRAND + (int(255 * a),))
        img.alpha_composite(layer)
        text(img, (x + cw / 2, y + 120), n, H1(72), WHITE, a, anchor='mm', dy=0)
        text(img, (x + cw / 2, y + 250), l1, SEMI(40), NAVY, a, anchor='ma', dy=0)
        text(img, (x + cw / 2, y + 305), l2, REG(36), (71, 85, 105), a, anchor='ma', dy=0)
    return img

def s_example(t, D=7.5):
    img = LIGHT.copy()
    heading(img, t, 'To samo doświadczenie, trzy różne CV', 'Żółte są słowa z ogłoszenia, przeniesione tam, gdzie patrzy rekruter.', y=50)
    seg = D / 3; i = min(2, int(t / seg)); lt = t - i * seg
    def draw(k, a):
        src = IMG[f'ex_{k}']
        bw, bh = 1640, 790
        s = min(bw / src.width, bh / src.height)
        w, h = src.width * s, src.height * s
        card(img, src, ((W - w) / 2, 220 + (bh - h) / 2, w, h), a=a)
    draw(i, appear(t, 0.3, 0.6) if i == 0 else 1)
    if i < 2 and lt > seg - 0.35: draw(i + 1, (lt - (seg - 0.35)) / 0.35)
    return img

def s_templates(t, D=5.0):
    img = LIGHT.copy()
    g = IMG['gal']
    # scroll gallery on the right
    bw = 1000; s = bw / g.width; vh = 1000
    visible_src_h = vh / s
    oy = (g.height - visible_src_h) * ease(t / D) * 0.75
    crop = g.crop((0, int(oy), g.width, int(oy + visible_src_h)))
    a = appear(t, 0)
    card(img, crop, (840, 40 + (1 - a) * 40, bw, vh), radius=24, a=a)
    text(img, (120, 300), '10 szablonów', H1(96), NAVY, appear(t, 0.2), dy=30)
    text(img, (120, 410), '× 6 kolorów', H1(96), BRAND, appear(t, 0.5), dy=30)
    for k, s_ in enumerate(['Wygląd zmienisz też po zakupie', 'Wersja ATS dla systemów rekrutacji', 'Zdjęcie, wersja angielska i inne języki']):
        a2 = appear(t, 1.1 + k * 0.3)
        text(img, (120, 580 + k * 70), '✓', SEMI(40), (22, 163, 74), a2)
        text(img, (175, 583 + k * 70), s_, REG(38), (51, 65, 85), a2)
    return img

def s_scan(t, D=4.5):
    img = LIGHT.copy()
    heading(img, t, 'Darmowy skaner CV', 'Sprawdź, jak Twoje obecne CV pasuje do ogłoszenia. Bez rejestracji.')
    src = IMG['cap_skaner']; w = 1640 * (1 + 0.04 * t / D); h = w * src.height / src.width
    a = appear(t, 0.3, 0.6)
    card(img, src, ((W - w) / 2, 270 + (1 - a) * 50, w, h), a=a)
    return img

def s_price(t, D=5.0):
    img = LIGHT.copy()
    heading(img, t, 'Płacisz raz. Bez abonamentu.', 'BLIK  ·  karta  ·  szybki przelew  ·  Google Pay  ·  Apple Pay', y=50)
    src = IMG['cap_cennik']
    crop = src.crop((0, 0, src.width, int(src.width * 0.42)))
    w = 1600; h = w * crop.height / crop.width
    a = appear(t, 0.3, 0.6)
    card(img, crop, ((W - w) / 2, 240 + (1 - a) * 50, w, h), a=a)
    return img

def s_outro(t):
    img = BLUE.copy()
    a = appear(t, 0.1)
    # logo
    d = ImageDraw.Draw(img)
    f = H1(92); parts = [('CV', WHITE), ('Pod', YEL), ('Ogłoszenie', WHITE)]
    tw = sum(d.textlength(s, font=f) for s, _ in parts)
    isz = 120; total = isz + 36 + tw; x0 = (W - total) / 2; y0 = 260
    if a > 0:
        m = Image.new('L', (isz, isz), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, isz - 1, isz - 1), 28, fill=int(255 * a))
        bg = Image.new('RGB', (isz, isz), WHITE)
        ic = ICON.resize((isz - 20, isz - 20), Image.LANCZOS); bg.paste(ic, (10, 10))
        img.paste(bg, (int(x0), int(y0 + (1 - a) * 30)), m)
    rich(img, (x0 + isz + 36, y0 + 8), parts, f, a, anchor_center=False)
    text(img, (W / 2, 470), 'CV i list motywacyjny pisane pod konkretne ogłoszenie', SEMI(46), WHITE, appear(t, 0.5), anchor='ma')
    chip(img, W / 2, 600, 'Zamów CV od 39 zł', appear(t, 1.0), bg=YEL, fg=NAVY, size=54)
    text(img, (W / 2, 800), 'Raport dopasowania  ·  Darmowa poprawka  ·  Dane usuwane po 30 dniach', REG(34), (220, 228, 255), appear(t, 1.5), anchor='ma')
    return img

SCENES = [(s_intro, 3.2), (s_problem, 3.8), (s_hero, 5.0), (s_steps, 5.0), (s_example, 7.5),
          (s_templates, 5.0), (s_scan, 4.5), (s_price, 5.0), (s_outro, 5.5)]
XF = 0.45
TOTAL = sum(d for _, d in SCENES)

def frame(T):
    acc = 0
    for i, (fn, d) in enumerate(SCENES):
        if T < acc + d or i == len(SCENES) - 1:
            t = T - acc
            img = fn(t)
            if i + 1 < len(SCENES) and t > d - XF:
                nxt = SCENES[i + 1][0](0.0)
                img = Image.blend(img, nxt, (t - (d - XF)) / XF)
            return img
        acc += d

# ---------------- music ----------------
def music(path, dur, sr=44100, bpm=108):
    n = int(dur * sr); tt = np.arange(n) / sr; out = np.zeros(n)
    beat = 60 / bpm; bar = 4 * beat
    def note(m): return 440 * 2 ** ((m - 69) / 12)
    chords = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]  # C G Am F
    for b in range(int(dur / bar) + 1):
        ch = chords[b % 4]; st = b * bar
        i0, i1 = int(st * sr), min(n, int((st + bar) * sr))
        if i0 >= n: break
        seg = tt[i0:i1] - st
        env = np.minimum(1, seg / 0.3) * np.minimum(1, (bar - seg) / 0.3)
        for m in ch:
            f = note(m)
            out[i0:i1] += 0.05 * env * (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(2 * np.pi * 2 * f * seg + 0.5))
        # bass
        fb = note(ch[0] - 24)
        out[i0:i1] += 0.12 * env * np.sin(2 * np.pi * fb * seg)
        # arpeggio 8th notes
        for k in range(8):
            s0 = st + k * beat / 2; j0 = int(s0 * sr); j1 = min(n, j0 + int(0.35 * sr))
            if j0 >= n: break
            sg = tt[j0:j1] - s0; f = note(ch[k % 4] + 12)
            out[j0:j1] += 0.07 * np.exp(-sg * 9) * np.sin(2 * np.pi * f * sg)
    # kick + hat (starting after intro)
    for k in range(int(dur / beat)):
        s0 = k * beat
        if s0 < 3.2: continue
        j0 = int(s0 * sr); j1 = min(n, j0 + int(0.25 * sr)); sg = tt[j0:j1] - s0
        out[j0:j1] += 0.35 * np.exp(-sg * 18) * np.sin(2 * np.pi * (50 + 90 * np.exp(-sg * 30)) * sg)
        h0 = int((s0 + beat / 2) * sr); h1 = min(n, h0 + int(0.05 * sr))
        if h0 < n: out[h0:h1] += 0.05 * np.exp(-np.arange(h1 - h0) / sr * 80) * np.random.uniform(-1, 1, h1 - h0)
    fade = np.minimum(1, np.minimum(tt / 1.0, (dur - tt) / 2.0))
    out *= fade; out /= np.max(np.abs(out)) * 1.15
    data = (out * 32767).astype(np.int16)
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(data.tobytes())

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        for T in [2.5, 6, 9, 14, 18, 23, 26, 30, 36, 41]:
            frame(T).convert('RGB').resize((960, 540)).save(f'pv_{T:04.1f}.png')
        sys.exit()
    music('music.wav', TOTAL)
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-i', 'music.wav', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
                          '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', 'reklama.mp4'], stdin=subprocess.PIPE)
    N = int(TOTAL * FPS)
    for k in range(N):
        p.stdin.write(frame(k / FPS).convert('RGB').tobytes())
        if k % 150 == 0: print(k, '/', N, flush=True)
    p.stdin.close(); p.wait(); print('done', TOTAL)
