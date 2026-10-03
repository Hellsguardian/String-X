#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StringX -- Google Play Store Android Screenshot Composer
========================================================
Produces 1080 × 1920 px, 24-bit PNG screenshots (no alpha channel).
Google Play Store minimum: 1080 × 1920 is the standard portrait slot.

Layout philosophy:
  • Marketing headline occupies the TOP ~18% of canvas (small, clean)
  • Android device frame dominates the remaining 82%
  • Device bleeds off the bottom edge for a dynamic, modern feel
  • Silk-string accent drawn beneath the headline

Usage:
  python compose_android.py \\
    --slide 01 \\
    --bg "#251436" \\
    --verb "REGISTER" \\
    --desc "for Navratri 2026" \\
    --screenshot path/to/screen.png \\
    --output screenshots/play-store-final/01-register.png

StringX brand palette:
  Deep Plum    #251436  — dark bg, primary text, borders
  Elec. Purple #894EFF  — action, accent, glow
  Soft Lavender #E3E0F5 — light bg, surface
  Warm Yellow  #FFC928  — highlights, sparkle

Font: Montserrat-Black (bold, premium, Gen-Z)
Fallback: Poppins-Black → any system sans
"""

import argparse
import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Canvas ────────────────────────────────────────────────────────────────
CANVAS_W = 1080
CANVAS_H = 1920

# ── Android device shell metrics (must match android_generate_frame.py) ──
DEVICE_W = 860
DEVICE_H = 1810
DEVICE_BEZEL = 20
SCREEN_W = DEVICE_W - 2 * DEVICE_BEZEL   # 820
SCREEN_CORNER_R = 50
PH_DIAMETER = 42
PH_TOP_OFFSET = 28

# ── Layout ────────────────────────────────────────────────────────────────
DEVICE_Y = 310         # top of device shell on canvas (bleeds off bottom)
TEXT_TOP = 54          # top of headline block

# ── Typography ─────────────────────────────────────────────────────────────
VERB_SIZE_MAX = 118
VERB_SIZE_MIN = 72
DESC_SIZE_MAX = 62
DESC_SIZE_MIN = 36
VERB_DESC_GAP = 14
LINE_GAP = 12
MAX_TEXT_W = int(CANVAS_W * 0.82)   # 882 px — keep safe from edges

# ── StringX brand colours ─────────────────────────────────────────────────
DEEP_PLUM    = (37, 20, 54)
ELEC_PURPLE  = (137, 78, 255)
SOFT_LAVENDER= (227, 224, 245)
WARM_YELLOW  = (255, 201, 40)
HOT_PINK     = (240, 42, 138)

# ── Font paths — priority order ───────────────────────────────────────────
_FONT_CANDIDATES_BLACK = [
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Montserrat-Black.otf",
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Poppins-Black.ttf",
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/GalanoGrotesqueAltBlack.otf",
    "C:/Windows/Fonts/arialbd.ttf",
]
_FONT_CANDIDATES_REGULAR = [
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Montserrat-Bold.otf",
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Poppins-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]

_FRAME_PATH = os.path.join(os.path.dirname(__file__), "android_device_frame.png")


def _pick_font_path(candidates):
    for p in candidates:
        if os.path.isfile(p):
            return p
    raise FileNotFoundError(f"No font found in: {candidates}")


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def is_light_bg(rgb: tuple) -> bool:
    r, g, b = rgb
    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.55


def word_wrap(draw, text: str, font, max_w: int) -> list:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        if draw.textlength(test, font=font) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_font(text: str, max_w: int, size_max: int, size_min: int, font_path: str):
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    for size in range(size_max, size_min - 1, -2):
        font = ImageFont.truetype(font_path, size)
        bbox = dummy.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= max_w:
            return font
    return ImageFont.truetype(font_path, size_min)


def draw_text_block(draw, y: int, verb: str, desc: str,
                    verb_font, desc_font, text_color,
                    shadow_color=None) -> int:
    """Draws verb on line 1, desc (word-wrapped) on line 2+. Returns new y."""

    def draw_line(draw, y, text, font):
        # Optional hard drop-shadow (Neo-brutalist)
        if shadow_color:
            draw.text((CANVAS_W // 2 + 3, y + 3), text,
                      fill=shadow_color, font=font, anchor="mt")
        draw.text((CANVAS_W // 2, y), text,
                  fill=text_color, font=font, anchor="mt")
        bbox = font.getbbox(text)
        return y + (bbox[3] - bbox[1]) + LINE_GAP

    y = draw_line(draw, y, verb.upper(), verb_font)
    y += VERB_DESC_GAP

    # Word-wrap desc
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    lines = word_wrap(dummy, desc.upper(), desc_font, MAX_TEXT_W)
    for line in lines:
        y = draw_line(draw, y, line, desc_font)
    return y


def draw_silk_string(draw, y_start: int, bg_rgb: tuple, use_light: bool):
    """Draw the signature StringX silk string below the headline.

    A gentle pink horizontal sinusoidal curve with small dot accents.
    """
    # Pink-to-yellow gradient approximated as segments
    string_y = y_start + 8
    cx = CANVAS_W // 2
    amplitude = 7
    freq = 0.018
    pts = []
    for x in range(50, CANVAS_W - 50):
        y = string_y + amplitude * math.sin(freq * (x - cx) * math.pi)
        pts.append((x, y))

    # Draw string as a sequence of anti-aliased dots
    string_color = HOT_PINK if not use_light else (200, 30, 110)
    for i, (x, y) in enumerate(pts):
        if i % 2 == 0:
            draw.ellipse([x-1, y-1, x+1, y+1], fill=string_color + (220,))

    # Accent sparkle dots
    for dx, color in [(-340, WARM_YELLOW), (0, HOT_PINK), (340, WARM_YELLOW)]:
        sx = cx + dx
        sy = int(string_y + amplitude * math.sin(freq * dx * math.pi))
        draw.ellipse([sx-4, sy-4, sx+4, sy+4], fill=color)

    return string_y + 16


def paste_screenshot_into_frame(canvas: Image.Image, shot_path: str,
                                 device_x: int, device_y: int):
    """Paste app screenshot inside the Android screen area, rounded + masked."""
    shot = Image.open(shot_path).convert("RGBA")

    screen_x = device_x + DEVICE_BEZEL
    screen_y = device_y + DEVICE_BEZEL

    # Scale screenshot to fill screen width
    scale = SCREEN_W / shot.width
    sc_w = SCREEN_W
    sc_h = int(shot.height * scale)
    shot = shot.resize((sc_w, sc_h), Image.LANCZOS)

    # Screen extends below canvas (bleed off bottom edge)
    screen_h = CANVAS_H - screen_y + 600

    # Create rounded mask for screen area
    scr_mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(scr_mask).rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W, screen_y + screen_h],
        radius=SCREEN_CORNER_R,
        fill=255,
    )

    # Black screen background
    scr_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(scr_layer).rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W, screen_y + screen_h],
        radius=SCREEN_CORNER_R,
        fill=(0, 0, 0, 255),
    )

    # Composite screenshot into screen layer
    scr_layer.paste(shot, (screen_x, screen_y))
    scr_layer.putalpha(scr_mask)

    return Image.alpha_composite(canvas, scr_layer)


def compose(bg_hex: str, verb: str, desc: str,
            screenshot_path: str, output_path: str,
            slide_num: int = 1):

    bg_rgb = hex_to_rgb(bg_hex)
    light_bg = is_light_bg(bg_rgb)
    text_color = DEEP_PLUM if light_bg else (255, 255, 255)
    shadow_color = None  # will set below based on bg

    # Neo-brutalist drop shadow colour
    if light_bg:
        shadow_color = ELEC_PURPLE
    else:
        shadow_color = None  # no shadow on dark — white on dark is clean

    # ── Font loading ───────────────────────────────────────────────────
    font_path_black   = _pick_font_path(_FONT_CANDIDATES_BLACK)
    font_path_regular = _pick_font_path(_FONT_CANDIDATES_REGULAR)

    verb_font = fit_font(verb.upper(), MAX_TEXT_W,
                         VERB_SIZE_MAX, VERB_SIZE_MIN, font_path_black)
    desc_font = fit_font(desc.upper(), MAX_TEXT_W,
                         DESC_SIZE_MAX, DESC_SIZE_MIN, font_path_regular)

    # ── 1. Canvas ──────────────────────────────────────────────────────
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (*bg_rgb, 255))
    draw = ImageDraw.Draw(canvas)

    # Subtle vignette: soft radial gradient overlay at bottom
    if not light_bg:
        _add_vignette(canvas)

    # ── 2. Headline text block ─────────────────────────────────────────
    y = TEXT_TOP
    text_end_y = draw_text_block(
        draw, y, verb, desc, verb_font, desc_font,
        text_color, shadow_color
    )

    # ── 3. Silk string accent ──────────────────────────────────────────
    silk_y = draw_silk_string(draw, text_end_y, bg_rgb, light_bg)

    # ── 4. Paste screenshot into device screen area ────────────────────
    device_x = (CANVAS_W - DEVICE_W) // 2
    device_y = DEVICE_Y
    canvas = paste_screenshot_into_frame(canvas, screenshot_path,
                                          device_x, device_y)

    # ── 5. Overlay Android device frame shell ─────────────────────────
    if not os.path.isfile(_FRAME_PATH):
        print(f"⚠  Frame not found at {_FRAME_PATH}, skipping frame overlay")
    else:
        frame_img = Image.open(_FRAME_PATH).convert("RGBA")
        frame_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        frame_layer.paste(frame_img, (device_x, device_y))
        canvas = Image.alpha_composite(canvas, frame_layer)

    # ── 6. Slide number badge (top-right, minimal) ────────────────────
    _draw_slide_badge(ImageDraw.Draw(canvas), slide_num, light_bg)

    # ── 7. Save as 24-bit PNG (no alpha) ──────────────────────────────
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG", optimize=False)

    # Verify dimensions
    check = Image.open(output_path)
    assert check.size == (CANVAS_W, CANVAS_H), \
        f"Dimension mismatch: got {check.size}, expected ({CANVAS_W},{CANVAS_H})"
    assert check.mode == "RGB", f"Mode mismatch: got {check.mode}"
    print(f"[OK] [{slide_num:02d}] {output_path} -- {check.size[0]}x{check.size[1]} {check.mode} PNG")


def _add_vignette(canvas: Image.Image):
    """Soft radial purple glow in bottom quarter for dark backgrounds."""
    w, h = canvas.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    cx, cy = w // 2, int(h * 0.82)
    rw, rh = int(w * 0.7), int(h * 0.3)
    d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh],
              fill=(*ELEC_PURPLE, 28))
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=80))
    Image.alpha_composite(canvas, blurred)


def _draw_slide_badge(draw, slide_num: int, light_bg: bool):
    """Tiny slide counter — bottom-center, very subtle."""
    total = 8
    cx = CANVAS_W // 2
    y = CANVAS_H - 28
    dot_r = 5
    gap = 14
    x_start = cx - (total - 1) * gap // 2

    for i in range(1, total + 1):
        x = x_start + (i - 1) * gap
        if i == slide_num:
            color = WARM_YELLOW if not light_bg else DEEP_PLUM
            draw.ellipse([x - dot_r, y - dot_r, x + dot_r, y + dot_r], fill=color)
        else:
            color = (255, 255, 255, 60) if not light_bg else (*DEEP_PLUM, 60)
            draw.ellipse([x - dot_r + 1, y - dot_r + 1,
                          x + dot_r - 1, y + dot_r - 1],
                         fill=(120, 100, 160, 90))


def main():
    p = argparse.ArgumentParser(
        description="StringX Android Play Store Screenshot Composer"
    )
    p.add_argument("--slide",       required=True, type=int, help="Slide number 1-8")
    p.add_argument("--bg",          required=True, help="Background hex (#251436)")
    p.add_argument("--verb",        required=True, help="Headline action word (REGISTER)")
    p.add_argument("--desc",        required=True, help="Benefit descriptor (for Navratri 2026)")
    p.add_argument("--screenshot",  required=True, help="Path to rendered UI screenshot PNG")
    p.add_argument("--output",      required=True, help="Output file path (.png)")
    args = p.parse_args()

    compose(
        bg_hex=args.bg,
        verb=args.verb,
        desc=args.desc,
        screenshot_path=args.screenshot,
        output_path=args.output,
        slide_num=args.slide,
    )


if __name__ == "__main__":
    main()
