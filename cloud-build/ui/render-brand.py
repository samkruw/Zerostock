"""Render the folded Z for the startup sequence, web icons and Android assets.

Run from any directory with Python and Pillow after changing the geometry.
Coordinates are shared by the animated segments and the assembled mark.
"""
from pathlib import Path
from PIL import Image, ImageDraw

UI = Path(__file__).resolve().parent
APP = UI.parent / 'overrides'
GRID = 128
SIZE = 2048
INK = '#102d29'
# Each face has a vertical colour ramp. The shared diagonals meet on whole grid points.
TOP = [
    ([(14,34),(29,19),(112,19),(97,34)], '#eaffef', '#ccf8df'),
    ([(97,34),(112,19),(112,34),(97,49)], '#62b99d', '#438d79'),
    ([(14,34),(97,34),(97,49),(8,49),(8,40)], '#d3f9df', '#a9edc8'),
    ([(8,40),(23,25),(29,19),(14,34)], '#d8fbe7', '#c1f4d4'),
]
BRIDGE = [
    ([(97,49),(112,34),(59,70),(44,85)], '#5eb59b', '#286f62'),
    ([(68,49),(97,49),(44,85),(15,85)], '#9ce6c2', '#71caa6'),
]
BASE = [
    ([(44,85),(59,70),(113,70),(98,85)], '#badfc9', '#a0dabe'),
    ([(98,85),(113,70),(113,82),(90,105),(98,97)], '#559f87', '#31715f'),
    ([(15,85),(98,85),(98,97),(90,105),(15,105)], '#cef2d9', '#a8e2c4'),
]


def segment(faces):
    result = Image.new('RGBA', (SIZE, SIZE))
    for points, top, bottom in faces:
        mask = Image.new('L', result.size)
        vertices = [(x * SIZE // GRID, y * SIZE // GRID) for x, y in points]
        ImageDraw.Draw(mask).polygon(vertices, fill=255)
        low, high = min(y for x, y in vertices), max(y for x, y in vertices)
        ramp = Image.new('RGB', (1, SIZE))
        a, b = (bytes.fromhex(c[1:]) for c in (top, bottom))
        for y in range(SIZE):
            t = min(1, max(0, (y - low) / max(1, high - low)))
            ramp.putpixel((0, y), tuple(round(v + (w - v) * t) for v, w in zip(a, b)))
        result.paste(ramp.resize(result.size), (0, 0), mask)
    return result


def main():
    upper, diagonal, lower = (segment(faces) for faces in (TOP, BRIDGE, BASE))
    mark = Image.new('RGBA', (SIZE, SIZE))
    for part in (lower, diagonal, upper):
        mark = Image.alpha_composite(mark, part)
    # The same registration box keeps segments aligned at every display size.
    cell = 320
    sprite = Image.new('RGBA', (cell * 4, cell))
    for index, part in enumerate((mark, upper, diagonal, lower)):
        sprite.paste(part.resize((cell, cell), Image.Resampling.LANCZOS), (cell * index, 0))
    sprite.save(UI / 'brand.png', optimize=True)
    # Native Android adds its own safe zone to the supplied transparent source.
    mark.resize((1024, 1024), Image.Resampling.LANCZOS).save(APP / 'assets/logo.png', optimize=True)
    for size in (192, 512, 1024):
        icon = Image.new('RGB', (size, size), INK)
        extent = round(.78 * size)
        glyph = mark.resize((extent, extent), Image.Resampling.LANCZOS)
        offset = (size - extent) // 2
        icon.paste(glyph, (offset, offset), glyph)
        icon.save(APP / f'icon-{size}.png', optimize=True)


if __name__ == '__main__':
    main()
