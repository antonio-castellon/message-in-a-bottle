"""Resize the bottle artwork into Expo icon, splash, and adaptive-icon slots."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "images" / "bottle-icon.jpg"

OUT = ROOT / "assets" / "images"
OUT.mkdir(parents=True, exist_ok=True)
DOCS = ROOT / "docs" / "images"
DOCS.mkdir(parents=True, exist_ok=True)


def cover(im: Image.Image, size: int) -> Image.Image:
    im = im.convert("RGB")
    return ImageOps.fit(im, (size, size), Image.Resampling.LANCZOS)


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    # App store / Expo master icon
    icon = cover(src, 1024)
    icon.save(OUT / "icon.png", "PNG", optimize=True)
    icon.save(DOCS / "icon.png", "PNG", optimize=True)

    # Adaptive background: water crop from lower-right (more sea, less bottle)
    bg = ImageOps.fit(src.crop((src.width // 5, src.height // 4, src.width, src.height)), (1024, 1024), Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(8))
    bg.save(OUT / "android-icon-background.png", "PNG", optimize=True)

    # Adaptive foreground: bottle with transparent padding (safe zone)
    fg_sq = cover(src, 720)
    canvas = Image.new("RGBA", (1024, 1024), (7, 16, 24, 0))
    canvas.paste(fg_sq, ((1024 - 720) // 2, (1024 - 720) // 2))
    canvas.save(OUT / "android-icon-foreground.png", "PNG", optimize=True)

    # Monochrome: high-contrast bottle silhouette
    gray = ImageOps.grayscale(cover(src, 1024))
    mono = ImageOps.autocontrast(gray).point(lambda p: 255 if p > 90 else 0)
    ImageOps.colorize(mono, "#000000", "#ffffff").save(OUT / "android-icon-monochrome.png", "PNG")

    splash = cover(src, 1284)
    splash.save(OUT / "splash-icon.png", "PNG", optimize=True)

    fav = cover(src, 64)
    fav.save(OUT / "favicon.png", "PNG", optimize=True)

    print("icons written from", SRC)


if __name__ == "__main__":
    main()
