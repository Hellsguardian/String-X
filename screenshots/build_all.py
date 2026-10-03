"""
Build all 8 StringX Play Store screenshots in one shot.
Run from: d:\coder_cave\projects\string X\screenshots\
"""
import subprocess
import sys
import os

BRAIN_DIR = r"C:\Users\Nikhil\.gemini\antigravity-ide\brain\78181acb-38fe-432c-9ed0-9b02a27a69ef"
SCRIPT = os.path.join(os.path.dirname(__file__), "compose_android.py")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "play-store-final")

SLIDES = [
    # (slide#, bg_hex,   verb,       desc,                                screen_image_filename)
    (1, "#251436", "JOIN",      "the festival matchmaking",    "screen_01_landing_1790944064057.jpg"),
    (2, "#E3E0F5", "DISCOVER",  "campus festival events",      "screen_02_home_1790944226564.jpg"),
    (3, "#E3E0F5", "BUILD",     "your profile in minutes",     "screen_03_onboarding_1790944239386.jpg"),
    (4, "#251436", "SHARE",     "your festival vibes",         "screen_04_vibes_1790944253842.jpg"),
    (5, "#251436", "SCAN",      "the campus for connections",  "screen_05_radar_1790944340422.jpg"),
    (6, "#251436", "COUNTDOWN", "to your match reveal",        "screen_06_countdown_1790944353995.jpg"),
    (7, "#E3E0F5", "JOIN",      "with a quick face check",     "screen_07_verify_1790944364222.jpg"),
    (8, "#E3E0F5", "MANAGE",    "your campus profile",         "screen_08_profile_1790944376613.jpg"),
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for slide_num, bg, verb, desc, screen_file in SLIDES:
    screen_path = os.path.join(BRAIN_DIR, screen_file)
    output_path = os.path.join(OUTPUT_DIR, f"{slide_num:02d}-{verb.lower()}.png")

    if not os.path.isfile(screen_path):
        print(f"[SKIP] Screen not found: {screen_path}")
        continue

    cmd = [
        sys.executable, SCRIPT,
        "--slide", str(slide_num),
        "--bg", bg,
        "--verb", verb,
        "--desc", desc,
        "--screenshot", screen_path,
        "--output", output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout.strip())
    if result.returncode != 0:
        print(f"[ERROR] Slide {slide_num}: {result.stderr.strip()}")

print("\nAll slides done. Running contact sheet...")
contact_script = os.path.join(os.path.dirname(__file__), "contact_sheet.py")
subprocess.run([sys.executable, contact_script], capture_output=False)
