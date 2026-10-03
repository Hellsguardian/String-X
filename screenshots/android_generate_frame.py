#!/usr/bin/env python3
"""
StringX Google Play Store — Android Device Frame Generator
Generates an Android punch-hole phone frame (not an iPhone / Dynamic Island frame).
Output: android_device_frame.png — transparent PNG of the device shell only.
compose_android.py pastes this on top of the composited canvas.

Dimensions sized for a 1080 x 1920 canvas:
  Device shell = 860 x 1810 px  (~80% of canvas width)
  Screen area  = 820 x 1770 px  (20 px bezel each side)
  Punch-hole   = 42 px diameter, centered at top
"""

import os
from PIL import Image, ImageDraw, ImageChops

# ── Device shell ────────────────────────────────────────────────────────
DEVICE_W = 860
DEVICE_H = 1810
DEVICE_CORNER_R = 68        # rounded corners — modern Android
BEZEL = 20

# ── Screen area ─────────────────────────────────────────────────────────
SCREEN_W = DEVICE_W - 2 * BEZEL    # 820
SCREEN_H = DEVICE_H - 2 * BEZEL    # 1770
SCREEN_CORNER_R = 50                # inner screen corners

# ── Punch-hole selfie camera ─────────────────────────────────────────────
PH_DIAMETER = 42
PH_TOP_OFFSET = 28           # from top of screen area


def generate(out_path: str = "android_device_frame.png") -> None:
    frame = Image.new("RGBA", (DEVICE_W, DEVICE_H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)

    # ── 1. Body — dark charcoal chassis ─────────────────────────────────
    fd.rounded_rectangle(
        [0, 0, DEVICE_W - 1, DEVICE_H - 1],
        radius=DEVICE_CORNER_R,
        fill=(28, 28, 32, 255),
    )
    # Thin inner edge highlight (lighter rim)
    fd.rounded_rectangle(
        [1, 1, DEVICE_W - 2, DEVICE_H - 2],
        radius=DEVICE_CORNER_R - 1,
        fill=(22, 22, 26, 255),
    )

    # ── 2. Screen cutout (transparent) ──────────────────────────────────
    screen_x, screen_y = BEZEL, BEZEL
    cutout = Image.new("L", (DEVICE_W, DEVICE_H), 255)
    ImageDraw.Draw(cutout).rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W, screen_y + SCREEN_H],
        radius=SCREEN_CORNER_R,
        fill=0,
    )
    frame.putalpha(ImageChops.multiply(frame.getchannel("A"), cutout))

    # ── 3. Punch-hole camera dot (opaque, drawn on top of cutout) ───────
    ph_x = (DEVICE_W - PH_DIAMETER) // 2
    ph_y = screen_y + PH_TOP_OFFSET
    ImageDraw.Draw(frame).ellipse(
        [ph_x, ph_y, ph_x + PH_DIAMETER, ph_y + PH_DIAMETER],
        fill=(14, 14, 16, 255),
    )

    # ── 4. Side buttons (flat, symmetrical — Android-style) ─────────────
    btn = (24, 24, 28, 255)
    d2 = ImageDraw.Draw(frame)
    # Power button — right side, mid-height
    d2.rounded_rectangle([DEVICE_W - 1, 480, DEVICE_W + 3, 610], radius=2, fill=btn)
    # Volume up — left side
    d2.rounded_rectangle([-3, 380, 1, 490], radius=2, fill=btn)
    # Volume down — left side
    d2.rounded_rectangle([-3, 510, 1, 610], radius=2, fill=btn)

    frame.save(out_path, "PNG")
    print(f"[OK] Android device frame saved -> {out_path}")
    print(f"  Shell: {DEVICE_W}x{DEVICE_H}  |  Screen: {SCREEN_W}x{SCREEN_H}")
    print(f"  Punch-hole dia={PH_DIAMETER}px @ ({ph_x}, {ph_y})")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "android_device_frame.png")
    generate(out)
