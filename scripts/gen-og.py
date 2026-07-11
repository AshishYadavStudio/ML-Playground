"""Generate og-image.png (1200x630) for Open Graph / Twitter Card previews.

Regenerate whenever the site's tagline or branding changes:
    python scripts/gen-og.py
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "og-image.png")


# ---------- helpers ----------
def font(size, bold=False):
    """Best-effort font loader — falls back gracefully."""
    candidates = (
        ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def linear_gradient(w, h, stops):
    """Diagonal gradient (top-left → bottom-right) with N stops."""
    img = Image.new("RGB", (w, h))
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            t = (x / w + y / h) / 2  # 0..1
            # find surrounding stops
            for i in range(len(stops) - 1):
                p0, c0 = stops[i]
                p1, c1 = stops[i + 1]
                if p0 <= t <= p1:
                    u = (t - p0) / max(p1 - p0, 1e-9)
                    r = int(c0[0] + (c1[0] - c0[0]) * u)
                    g = int(c0[1] + (c1[1] - c0[1]) * u)
                    b = int(c0[2] + (c1[2] - c0[2]) * u)
                    pixels[x, y] = (r, g, b)
                    break
    return img


def radial_glow(w, h, cx, cy, radius, color, alpha):
    """Soft radial glow overlay as an RGBA image."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / radius
            if d < 1:
                a = int(alpha * (1 - d) ** 2)
                pixels[x, y] = (color[0], color[1], color[2], a)
    return img


def gradient_text(draw, xy, text, fnt, stops):
    """Render text with a horizontal gradient fill."""
    # measure
    bbox = draw.textbbox(xy, text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # build a mask of the text
    mask = Image.new("L", (tw + 4, th + 4), 0)
    ImageDraw.Draw(mask).text((0, 0), text, font=fnt, fill=255)
    # gradient block
    grad = Image.new("RGB", (tw + 4, th + 4))
    gp = grad.load()
    for x in range(tw + 4):
        t = x / max(tw + 3, 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                u = (t - p0) / max(p1 - p0, 1e-9)
                col = (
                    int(c0[0] + (c1[0] - c0[0]) * u),
                    int(c0[1] + (c1[1] - c0[1]) * u),
                    int(c0[2] + (c1[2] - c0[2]) * u),
                )
                break
        for y in range(th + 4):
            gp[x, y] = col
    # paste into main image via mask
    img = draw._image  # PIL internal — we happen to know draw wraps an image
    img.paste(grad, xy, mask)


# ---------- palette (matches site) ----------
INDIGO = (109, 141, 255)
VIOLET = (183, 140, 255)
TEAL = (79, 214, 197)
GREEN = (74, 222, 128)
DARK = (10, 14, 30)
TEXT = (234, 240, 250)
DIM = (195, 205, 224)
MUTE = (139, 150, 178)


def draw_neural_net(img, ox, oy):
    """Small stylized network on the right side."""
    d = ImageDraw.Draw(img, "RGBA")
    layers = [
        [(60, 90), (60, 220), (60, 360)],
        [(220, 60), (220, 180), (220, 330)],
        [(380, 120), (380, 260), (380, 380)],
        [(440, 220)],
    ]
    # edges
    for i in range(len(layers) - 1):
        for a in layers[i]:
            for b in layers[i + 1]:
                d.line(
                    (ox + a[0], oy + a[1], ox + b[0], oy + b[1]),
                    fill=(109, 141, 255, 90),
                    width=2,
                )
    # nodes with soft glow
    for lvl, layer in enumerate(layers):
        color = (
            VIOLET if lvl == 0 else TEAL if lvl == len(layers) - 1 else INDIGO
        )
        r = 12 if lvl == len(layers) - 1 else 10
        for (x, y) in layer:
            # glow
            for gg in range(6, 0, -1):
                d.ellipse(
                    (ox + x - r - gg * 2, oy + y - r - gg * 2,
                     ox + x + r + gg * 2, oy + y + r + gg * 2),
                    fill=(color[0], color[1], color[2], 8),
                )
            d.ellipse(
                (ox + x - r, oy + y - r, ox + x + r, oy + y + r),
                fill=color,
            )


def draw_badge(img, x, y):
    """The '37 lessons · 100% free' badge."""
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle(
        (x, y, x + 380, y + 56),
        radius=28,
        fill=(109, 141, 255, 55),
        outline=(158, 178, 255, 200),
        width=2,
    )
    # pulse dot
    d.ellipse((x + 22, y + 22, x + 34, y + 34), fill=GREEN)
    d.text(
        (x + 50, y + 16),
        "37 LESSONS · 40+ DEMOS · FREE",
        font=font(18, bold=True),
        fill=(220, 230, 255),
    )


def draw_brand_strip(img, x, y):
    """Bottom brand row: logo tile + name + URL."""
    d = ImageDraw.Draw(img, "RGBA")
    # gradient tile
    tile = Image.new("RGB", (56, 56), INDIGO)
    tp = tile.load()
    for py in range(56):
        for px in range(56):
            t = (px + py) / 112
            tp[px, py] = (
                int(INDIGO[0] + (VIOLET[0] - INDIGO[0]) * t),
                int(INDIGO[1] + (VIOLET[1] - INDIGO[1]) * t),
                int(INDIGO[2] + (VIOLET[2] - INDIGO[2]) * t),
            )
    mask = Image.new("L", (56, 56), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 55, 55), radius=14, fill=255)
    img.paste(tile, (x, y), mask)
    # brain emoji — fall back to plain text if emoji font is unavailable
    try:
        emoji_font = ImageFont.truetype("seguiemj.ttf", 30)
        d.text((x + 12, y + 8), "🧠", font=emoji_font, embedded_color=True)
    except (OSError, IOError):
        d.text((x + 16, y + 14), "ML", font=font(22, bold=True), fill=TEXT)
    d.text((x + 76, y + 4), "ML Playground", font=font(26, bold=True), fill=TEXT)
    d.text(
        (x + 76, y + 34),
        "ashishyadavstudio.github.io/ML-Playground",
        font=font(15),
        fill=MUTE,
    )


def build():
    # background
    img = linear_gradient(
        W, H,
        [(0, (10, 14, 30)), (0.55, (15, 16, 48)), (1, (10, 27, 38))],
    ).convert("RGBA")

    # glow overlays
    img = Image.alpha_composite(img, radial_glow(W, H, W * 0.85, -30, 620, INDIGO, 82))
    img = Image.alpha_composite(img, radial_glow(W, H, W * 0.05, H + 20, 520, TEAL, 55))
    img = Image.alpha_composite(img, radial_glow(W, H, W * 0.55, H + 60, 450, VIOLET, 42))

    d = ImageDraw.Draw(img, "RGBA")

    # decorative neural net (further right so it doesn't collide with headline)
    draw_neural_net(img, 790, 90)

    # top-left badge
    draw_badge(img, 80, 74)

    # headline — nudged up so the "y" descender clears the neural net
    headline_font = font(74, bold=True)
    d.text((80, 168), "Learn Machine", font=headline_font, fill=TEXT)
    d.text((80, 252), "Learning", font=headline_font, fill=TEXT)
    learning_bbox = d.textbbox((80, 252), "Learning ", font=headline_font)
    lw = learning_bbox[2] - learning_bbox[0]
    gradient_text(
        d, (80 + lw, 252), "Visually.", headline_font,
        [(0, INDIGO), (0.55, VIOLET), (1, TEAL)],
    )

    # subhead
    sub = font(26)
    d.text(
        (80, 388),
        "From your first regression line to how ChatGPT works —",
        font=sub, fill=DIM,
    )
    d.text(
        (80, 426),
        "every concept is a live demo you can drag and train.",
        font=sub, fill=DIM,
    )

    # brand strip
    draw_brand_strip(img, 80, 540)

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print("wrote", os.path.abspath(OUT), img.size)


if __name__ == "__main__":
    random.seed(1)
    build()
