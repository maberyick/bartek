#!/usr/bin/env python3
"""Pixel-art BARTEK mark — a pixel DNA double-helix (matches the libélula style).
Run: python make_bartek_pixel.py  ->  bartek_pixel.svg (+ _tile.svg)
"""
import math
import os

BLUE, TEAL, RUNG, NAVY, OUTLINE = "#3f8fe0", "#2bd4c0", "#6f7fb0", "#0e1c33", "#24304a"
COLS, ROWS = 13, 21
CX, AMP, TURNS = 6, 5, 2.0
PX, PAD = 12, 12


def cells():
    """Return dict (x,y)->color for a pixel DNA double-helix (two crossing strands)."""
    grid = {}
    prev = None
    for r in range(ROWS):
        t = r / (ROWS - 1)
        ph = t * TURNS * 2 * math.pi + math.pi / 2
        x1 = round(CX + AMP * math.sin(ph))
        x2 = round(CX - AMP * math.sin(ph))
        # short rung only near the crossings (where strands are close) — subtle, not a ladder
        if abs(x1 - x2) <= 3 and abs(x1 - x2) >= 1:
            for x in range(min(x1, x2), max(x1, x2) + 1):
                grid.setdefault((x, r), RUNG)
        # connect strands vertically/diagonally so they read as continuous curves
        if prev:
            for (px_, col) in ((prev[0], BLUE), (prev[1], TEAL)):
                pass
        grid[(x1, r)] = BLUE
        grid[(x2, r)] = TEAL       # teal drawn on top at overlaps
        prev = (x1, x2)
    return grid


def svg(tile=False):
    g = cells()
    W = COLS * PX + PAD * 2
    H = ROWS * PX + PAD * 2
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'shape-rendering="crispEdges" role="img" aria-label="BARTEK">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{W*0.22:.0f}" fill="{NAVY}"/>')
    # soft outline behind edge pixels (readable on any bg)
    filled = set(g)
    for (x, y) in sorted(filled):
        if any((x+dx, y+dy) not in filled for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            out.append(f'<rect x="{PAD+x*PX-1}" y="{PAD+y*PX-1}" width="{PX+2}" height="{PX+2}" fill="{OUTLINE}"/>')
    for (x, y), c in g.items():
        out.append(f'<rect x="{PAD+x*PX}" y="{PAD+y*PX}" width="{PX}" height="{PX}" fill="{c}"/>')
    out.append("</svg>\n")
    return "\n".join(out)


def main():
    d = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(d, "bartek_pixel.svg"), "w").write(svg(False))
    open(os.path.join(d, "bartek_pixel_tile.svg"), "w").write(svg(True))
    print("wrote bartek_pixel.svg + bartek_pixel_tile.svg")


if __name__ == "__main__":
    main()
