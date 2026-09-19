#!/usr/bin/env python3
import io, os, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

def load(src):
    if not src or src == "-":
        return None
    try:
        if src.startswith("http://") or src.startswith("https://"):
            req = urllib.request.Request(src, headers={"User-Agent": "HerdYardOG/1"})
            data = urllib.request.urlopen(req, timeout=8).read()
            return Image.open(io.BytesIO(data)).convert("RGB")
        if src.startswith("data:"):
            return None
        if os.path.isfile(src):
            return Image.open(src).convert("RGB")
        pub = os.path.join(os.path.dirname(__file__), "public", src.lstrip("/"))
        if os.path.isfile(pub):
            return Image.open(pub).convert("RGB")
    except Exception:
        return None
    return None

def font(name, size):
    for p in (
        "/usr/share/fonts/truetype/liberation/" + name,
        "/usr/share/fonts/truetype/dejavu/" + name,
    ):
        if os.path.isfile(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def main():
    cover_src = sys.argv[1] if len(sys.argv) > 1 else "-"
    name = sys.argv[2] if len(sys.argv) > 2 else "Ranch"
    loc = sys.argv[3] if len(sys.argv) > 3 else ""
    out = sys.argv[4] if len(sys.argv) > 4 else "out.jpg"
    canvas = Image.new("RGB", (W, H), (15, 63, 40))
    im = load(cover_src)
    if im:
        scale = max(W / float(im.width), H / float(im.height))
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        x = max(0, (im.width - W) // 2)
        y = max(0, (im.height - H) // 2)
        canvas.paste(im.crop((x, y, x + W, y + H)), (0, 0))
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for i in range(H):
        a = int(28 + 175 * ((i / float(H)) ** 1.55))
        d.line([(0, i), (W, i)], fill=(12, 28, 18, min(210, a)))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(canvas)
    serif = font("LiberationSerif-Bold.ttf", 58)
    if serif == ImageFont.load_default():
        serif = font("DejaVuSerif-Bold.ttf", 58)
    sans = font("LiberationSans-Regular.ttf", 28)
    small = font("LiberationSans-Bold.ttf", 20)
    draw.text((56, 46), "HERD YARD", font=small, fill=(214, 232, 212))
    title = (name or "Ranch")[:52]
    draw.text((56, 392), title, font=serif, fill=(255, 252, 247))
    if loc:
        draw.text((56, 478), loc[:64], font=sans, fill=(214, 232, 212))
    draw.text((56, 548), "Public ranch profile", font=small, fill=(196, 214, 198))
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    canvas.save(out, "JPEG", quality=86, optimize=True)

if __name__ == "__main__":
    main()
