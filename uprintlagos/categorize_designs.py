"""
UPrintLagos portfolio auto-categoriser.
Sorts design images into: logo / branding / print / packaging.

How it works:
  1. Scores every image with 3 visual signals:
       - squareness      (logos are near-square, centred marks)
       - colourfulness   (Hasler & Suesstrunk metric)
       - edge density    (bus creativeness = busy flyers/ads)
  2. Applies rule-based suggestion from those signals.
  3. MANUAL overrides win (human-verified picks always beat the guess).
  4. Copies the curated set into images/portfolio/ + writes manifest.

Usage:
    python categorize_designs.py
"""
import json
import os
import shutil

from PIL import Image, ImageFilter, ImageStat

SRC = r"D:\ASSETS AND MOODBOARDS\pinterest-_created-2026-10-11"
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "portfolio")

# Human-verified mapping (filename -> category). Always wins over heuristics.
MANUAL = {
    # ---- logo ----
    "pin-211.jpg": "logo",      # Einstein crest sheet (dark)
    "pin-207.jpg": "logo",      # Einstein primary crest
    # ---- branding (boards / systems) ----
    "pin-32.jpg": "branding",   # purple content system board
    "pin-105.jpg": "branding",  # carousel identity board
    # ---- print (single flyers / social) ----
    "pin-89.jpg": "print",      # Jumia Phones Friday
    "pin-115.jpg": "print",     # Airtel 9GB data
    "pin-10.jpg": "print",      # Vessel Send Money
    # ---- packaging / product ads ----
    "pin-195.jpg": "packaging", # peanut butter product ad
    "pin-234.jpg": "packaging", # Nescafe Gold product ad
}

CAPTIONS = {
    "pin-211.jpg": ("Einstein College — Crest System", "Logo • crest suite"),
    "pin-207.jpg": ("Einstein — Primary Crest", "Logo • identity mark"),
    "pin-32.jpg": ("Fintech Content System", "Branding • board set"),
    "pin-105.jpg": ("Carousel Identity Board", "Branding • social system"),
    "pin-89.jpg": ("Jumia — Phones Friday", "Print • campaign flyer"),
    "pin-115.jpg": ("Airtel — 9GB Data Push", "Print • data campaign"),
    "pin-10.jpg": ("Vessel — Send Money", "Print • fintech flyer"),
    "pin-195.jpg": ("Peanut Butter — Product Ad", "Packaging • product push"),
    "pin-234.jpg": ("Nescafe Gold — Product Ad", "Packaging • product push"),
}


def signals(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    squareness = min(w, h) / max(w, h)
    small = im.resize((100, 100))
    r, g, b = [ImageStat.Stat(c).mean[0] for c in small.split()]
    rg, yb = abs(r - g), abs(0.5 * (r + g) - b)
    colourfulness = (rg ** 2 + yb ** 2) ** 0.5
    edges = small.convert("L").filter(ImageFilter.FIND_EDGES)
    edge_density = ImageStat.Stat(edges).mean[0] / 255
    return squareness, colourfulness, edge_density


def suggest(sq, col, edge):
    if sq > 0.92 and col < 70 and edge < 0.25:
        return "logo"
    if sq < 0.75 and edge > 0.20:
        return "print"
    if edge > 0.28 and col > 60:
        return "packaging"
    return "branding"


def main():
    os.makedirs(DEST, exist_ok=True)
    manifest = []
    checked = 0
    for f in sorted(os.listdir(SRC)):
        if not f.lower().endswith(".jpg"):
            continue
        sq, col, edge = signals(os.path.join(SRC, f))
        auto = suggest(sq, col, edge)
        final = MANUAL.get(f, auto)
        checked += 1
        if f in MANUAL:
            dst = os.path.join(DEST, f)
            shutil.copy2(os.path.join(SRC, f), dst)
            title, sub = CAPTIONS[f]
            manifest.append({"file": f, "category": final, "title": title,
                             "sub": sub, "auto": auto})
            print(f"{f}: auto={auto} final={final} COPIED")
    with open(os.path.join(DEST, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"\nChecked {checked} images, curated {len(manifest)} -> {DEST}")


if __name__ == "__main__":
    main()
