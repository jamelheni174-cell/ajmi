#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont, ImageOps
import os

W, H = 1200, 630
NAVY = (30, 39, 102)
PAPER = (236, 233, 226)
GOLD = (245, 158, 11)
WHITE = (255, 255, 255)

img = Image.new("RGB", (W, H), NAVY)
draw = ImageDraw.Draw(img)

try:
    font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 52)
    font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 26)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    font_tiny = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    font_logo = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 38)
    font_logo2 = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
except:
    font_big = ImageFont.load_default()
    font_med = font_small = font_tiny = font_label = font_logo = font_big

# Top label
draw.text((50, 38), "CABINET D'AVOCAT  •  MONASTIR  —  TUNISIE", fill=(174,185,236), font=font_label)

# Title
draw.text((50, 85), "Cabinet Ajmi", fill=WHITE, font=font_big)
draw.text((50, 165), "Me Mohamed Anouar Ajmi", fill=GOLD, font=font_med)
draw.text((50, 205), "Avocat près la Cour d'Appel", fill=(220,216,203), font=font_small)

# Separator gold
draw.rectangle([50, 250, 520, 253], fill=GOLD)

# Domains
draw.text((50, 285), "Affaires  •  Famille  •  Médical  •  Biens  •  Contrats", fill=WHITE, font=font_small)
draw.text((50, 325), "Ouvrage 2026  •  25 ans d'expertise  •  5 domaines", fill=(160,175,220), font=font_tiny)

# Contact bottom
draw.text((50, 550), "cabinetmaitreajmi.tn    •    +216 54 311 937", fill=(174,185,236), font=font_small)

# Right side hero
try:
    hero_path = "public/images/hero.jpg"
    if not os.path.exists(hero_path):
        hero_path = "php/images/hero.jpg"
    hero = Image.open(hero_path).convert("RGB")
    hero = ImageOps.fit(hero, (520, 630), method=Image.LANCZOS)
    img.paste(hero, (680, 0))
    # subtle navy overlay on left edge
    overlay = Image.new("RGBA", (520, 630), (30,39,102,95))
    img.paste(overlay, (680, 0), overlay)
except Exception as e:
    print(f"hero fail: {e}")
    draw.rectangle([680, 0, 1200, 630], fill=(40,50,130))

# Bottom right badge - clean
badge_w, badge_h = 280, 70
bx, by = 880, 480
draw.rounded_rectangle([bx, by, bx+badge_w, by+badge_h], radius=12, fill=WHITE)
# AJMI big
draw.text((bx+22, by+10), "AJMI", fill=NAVY, font=font_logo)
draw.text((bx+135, by+22), "CABINET", fill=(100,100,130), font=font_logo2)

for p in ["public/images/og-image.jpg", "php/images/og-image.jpg"]:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, "JPEG", quality=90, optimize=True)
    print(f"Saved {p} {os.path.getsize(p)//1024}KB {Image.open(p).size}")

print("done")
