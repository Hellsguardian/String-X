#!/usr/bin/env python3
"""
StringX — Play Store Screenshot Contact Sheet Generator
========================================================
Reads all 8 final PNGs from screenshots/play-store-final/
and produces a horizontal contact sheet for visual QA.

Layout: all 8 screenshots side-by-side, scaled to the same height,
on a Deep Plum (#251436) background with slide number labels.

Output: screenshots/play-store-final/contact_sheet.png
"""

import argparse
import os
import glob
from PIL import Image, ImageDraw, ImageFont

DEEP_PLUM = (37, 20, 54)
WARM_YELLOW = (255, 201, 40)
ELEC_PURPLE = (137, 78, 255)

THUMB_H = 720      # height of each thumbnail in the sheet
GAP = 32           # gap between screenshots
PADDING = 48       # outer padding
LABEL_H = 56       # height reserved for slide number label below each thumb

_FONT_CANDIDATES = [
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Montserrat-Black.otf",
    "C:/Users/Nikhil/AppData/Local/Microsoft/Windows/Fonts/Poppins-Black.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def _pick_font(size: int):
    for p in _FONT_CANDIDATES:
        if os.path.isfile(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def build_contact_sheet(screenshots: list, output_path: str) -> None:
    if not screenshots:
        raise ValueError("No screenshots provided.")

    images = [Image.open(p).convert("RGB") for p in screenshots]

    # Scale all to THUMB_H, maintain aspect ratio
    thumbs = []
    for img in images:
        ratio = THUMB_H / img.height
        w = int(img.width * ratio)
        thumbs.append(img.resize((w, THUMB_H), Image.LANCZOS))

    total_w = (sum(t.width for t in thumbs)
               + GAP * (len(thumbs) - 1)
               + PADDING * 2)
    total_h = THUMB_H + LABEL_H + PADDING * 2

    sheet = Image.new("RGB", (total_w, total_h), DEEP_PLUM)
    draw = ImageDraw.Draw(sheet)

    label_font = _pick_font(22)
    title_font = _pick_font(30)

    x = PADDING
    for i, (thumb, path) in enumerate(zip(thumbs, screenshots)):
        # Paste screenshot
        sheet.paste(thumb, (x, PADDING))

        # Slide number label
        slide_label = os.path.splitext(os.path.basename(path))[0]
        label_x = x + thumb.width // 2
        label_y = PADDING + THUMB_H + 14
        draw.text((label_x, label_y), slide_label,
                  fill=WARM_YELLOW, font=label_font, anchor="mt")

        x += thumb.width + GAP

    # Header text
    header_y = PADDING + THUMB_H + 36
    draw.text((total_w // 2, header_y),
              "StringX · Google Play Store · 8 Screenshots · 1080 × 1920 px",
              fill=(227, 224, 245),
              font=title_font,
              anchor="mt")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    sheet.save(output_path, "PNG")
    print(f"[OK] Contact sheet saved -> {output_path}  ({total_w}x{total_h})")


def main():
    p = argparse.ArgumentParser(description="Build StringX Play Store contact sheet")
    p.add_argument(
        "--screenshots", nargs="+",
        default=None,
        help="Paths to final PNGs. If omitted, uses all PNGs in screenshots/play-store-final/"
    )
    p.add_argument(
        "--output", default="screenshots/play-store-final/contact_sheet.png",
        help="Output file path"
    )
    args = p.parse_args()

    if args.screenshots:
        shots = args.screenshots
    else:
        shots = sorted(glob.glob("screenshots/play-store-final/[0-9][0-9]-*.png"))

    if not shots:
        print("[ERROR] No screenshots found. Run compose_android.py first.")
        return

    build_contact_sheet(shots, args.output)


if __name__ == "__main__":
    main()
