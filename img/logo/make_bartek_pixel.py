#!/usr/bin/env python3
"""Pixel-art BARTEK mark — a pre-Columbian (Tolima-style) face atop a pixel DNA helix.
Matches the clean SVG concept + the libélula pixel style.
Run: python make_bartek_pixel.py  ->  bartek_pixel.svg (+ _tile.svg)
"""
import math
import os

GOLD, BLUE, TEAL, RUNG, NAVY, OUTLINE = "#e0a92e", "#3f8fe0", "#2bd4c0", "#6f7fb0", "#0e1c33", "#24304a"
COLS = 13
CXP, AMP, TURNS, HELIX_ROWS = 6, 5, 1.5, 16
PX, PAD = 12, 12

# gold pre-Columbian face (G), each row 13 chars, center col 6
FACE = [
    "...G.....G...",   # horn tips
    "...GG...GG...",   # horns
    "....GGGGG....",   # headdress crown
    "..G.GGGGG.G..",   # ears + head
    "..G.G.G.G.G..",   # ears + eyes + nose
    "..G.GGGGG.G..",   # ears + head
    "....G.G.G....",   # mouth / teeth
    "....GGGGG....",   # jaw
    "......G......",   # neck
]
ROWS = len(FACE) + HELIX_ROWS


def cells():
    grid = {}
    for r, row in enumerate(FACE):
        for c, ch in enumerate(row):
            if ch == "G":
                grid[(c, r)] = GOLD
    p1 = p2 = CXP  # strands start at the neck (center) so they connect to the face
    for hr in range(HELIX_ROWS):
        r = len(FACE) + hr
        t = hr / (HELIX_ROWS - 1)
        ph = t * TURNS * 2 * math.pi                    # start at center crossing
        x1 = round(CXP + AMP * math.sin(ph))
        x2 = round(CXP - AMP * math.sin(ph))
        # a short rung tick only at the widest points
        if abs(x1 - x2) >= 6:
            grid.setdefault((CXP, r), RUNG)
        # thin continuous strands: bridge from previous row's x to this row's x
        for x in range(min(p1, x1), max(p1, x1) + 1):
            grid[(x, r)] = BLUE
        for x in range(min(p2, x2), max(p2, x2) + 1):
            grid.setdefault((x, r), TEAL)
        grid[(x1, r)] = BLUE
        grid[(x2, r)] = TEAL
        p1, p2 = x1, x2
    return grid


def svg(tile=False):
    g = cells()
    W = COLS * PX + PAD * 2
    H = ROWS * PX + PAD * 2
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'shape-rendering="crispEdges" role="img" aria-label="BARTEK">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{W*0.22:.0f}" fill="{NAVY}"/>')
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
