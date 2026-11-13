#!/usr/bin/env python3
"""Gera os assets de marca do Consol (wallpaper + logo) em PNG.

Estilo: "inspirado no Xbox Series" — fundo quase preto, verde esmeralda
(#107C10 / brilho #9BF00B), arcos concêntricos como na Sphere, grade sutil.
Assets 100% próprios, sem copiar o logo oficial da Microsoft.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(__file__), "..", "system_files", "usr", "share")

BG = (10, 10, 10)
GREEN = (16, 124, 16)        # #107C10
GREEN_HI = (155, 240, 11)    # #9BF00B
GREEN_GLOW = (60, 200, 60)
GRID = (22, 30, 22)

font_candidates = [
    r"C:\Windows\Fonts\ariblk.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
]
font_path = next((f for f in font_candidates if os.path.exists(f)), None)
def font(size):
    return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()

def wallpaper():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # grade sutil de "tiles" estilo painel do console
    step = 96
    for x in range(0, W, step):
        d.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H, step):
        d.line([(0, y), (W, y)], fill=GRID, width=1)

    # arcos concêntricos à direita (eco da Sphere, arte própria)
    cx, cy = int(W * 0.78), int(H * 0.42)
    for r in range(560, 40, -46):
        alpha_like = r / 560
        col = (
            int(GREEN[0] * (0.35 + 0.65 * alpha_like)),
            int(GREEN[1] * (0.35 + 0.65 * alpha_like)),
            int(GREEN[2] * (0.35 + 0.65 * alpha_like)),
        )
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=3)

    # halo brilhante
    halo = Image.new("RGB", (W, H), (0, 0, 0))
    dh = ImageDraw.Draw(halo)
    dh.ellipse([cx - 190, cy - 190, cx + 190, cy + 190], outline=GREEN_GLOW, width=14)
    halo = halo.filter(ImageFilter.GaussianBlur(28))
    green_layer = Image.new("RGB", (W, H), GREEN)
    img = Image.composite(green_layer, img, halo.convert("L"))
    d = ImageDraw.Draw(img)

    # wordmark
    text = "CONSOL"
    f_big = font(150)
    tw = d.textlength(text, font=f_big)
    d.text((int(W * 0.08), int(H * 0.40)), text, font=f_big, fill=(235, 235, 235))
    d.rectangle([int(W * 0.08), int(H * 0.40) + 165, int(W * 0.08) + int(tw), int(H * 0.40) + 172], fill=GREEN_HI)
    f_sub = font(34)
    d.text((int(W * 0.08), int(H * 0.40) + 195), "A EXPERIÊNCIA DEFINITIVA DE GAMES NO PC", font=f_sub, fill=(140, 200, 140))

    out = os.path.join(OUT, "wallpapers", "Consol", "contents", "images")
    os.makedirs(out, exist_ok=True)
    img.save(os.path.join(out, "1920x1080.png"))
    img.resize((1365, 768), Image.LANCZOS).save(os.path.join(out, "1366x768.png"))

def logo():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = 28
    d.rounded_rectangle([m, m, size - m, size - m], radius=96, fill=(12, 12, 12, 255), outline=GREEN, width=10)
    cx, cy = size // 2, size // 2
    for r in (150, 108, 66):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GREEN_GLOW, width=16)
    d.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=GREEN_HI)
    out = os.path.join(OUT, "icons", "hicolor", "scalable", "apps")
    os.makedirs(out, exist_ok=True)
    img.save(os.path.join(OUT, "consol-logo.png"))

if __name__ == "__main__":
    wallpaper()
    logo()
    print("assets gerados em", OUT)
