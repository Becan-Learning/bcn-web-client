"""Render one page of public/slides/slides.pdf to public/slides/hero-slide-<N>.webp.

The landing hero demo (src/app/[locale]/_home/session-scene.tsx) shows
SLIDE_OF_TOPIC[0] of the PDF as a static image. If that number changes,
regenerate the image with:

    uv run --with pymupdf --with pillow python scripts/render-hero-slide.py <page>
"""
import io
import sys

import pymupdf
from PIL import Image

PDF = "public/slides/slides.pdf"
WIDTH = 288  # 3x the 96px column; the page is 720x540 (4:3)

page_no = int(sys.argv[1])
page = pymupdf.open(PDF)[page_no - 1]
zoom = WIDTH / page.rect.width
png = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False).tobytes("png")
out = f"public/slides/hero-slide-{page_no}.webp"
Image.open(io.BytesIO(png)).convert("RGB").save(out, "WEBP", quality=80, method=6)
print(out)
