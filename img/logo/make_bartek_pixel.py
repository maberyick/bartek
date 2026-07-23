#!/usr/bin/env python3
"""Pixel-art BARTEK mark — a pixelated version of the helix + circuit SVG mark,
in the libélula pixel-family style (soft outline, brand blue/teal, navy tile).
The DNA double-helix wired into a tech frame. Favicon / app-icon source.
Run: python make_bartek_pixel.py  ->  bartek_pixel.svg (+ _tile.svg)
"""
import math
import os

BLUE, TEAL, NAVY, OUTLINE = "#2c6fbb", "#2bd4c0", "#0e1c33", "#54637a"
COLS, ROWS, CX = 17, 19, 8
PX, PAD = 14, 14
AMP, TURNS, RTOP, HR = 3, 1.5, 4, 11   # helix occupies rows 4..14


def cells():
    g = {}

    def put(x, y, c):
        if 0 <= x < COLS and 0 <= y < ROWS:
            g[(x, y)] = c

    # --- DNA double-helix (thin continuous crossing strands) ---
    p1 = p2 = CX
    for hr in range(HR):
        r = RTOP + hr
        t = hr / (HR - 1)
        ph = t * TURNS * 2 * math.pi
        x1 = round(CX + AMP * math.sin(ph))
        x2 = round(CX - AMP * math.sin(ph))
        for x in range(min(p1, x1), max(p1, x1) + 1):
            put(x, r, BLUE)
        for x in range(min(p2, x2), max(p2, x2) + 1):
            g.setdefault((x, r), TEAL)
        put(x1, r, BLUE)
        put(x2, r, TEAL)
        p1, p2 = x1, x2

    # --- surrounding circuit ---
    # top / bottom vias wired into the helix
    put(CX, 2, TEAL); put(CX, 3, BLUE)
    put(CX, 16, TEAL); put(CX, 15, BLUE)
    # side nodes with inward stubs
    put(2, 9, TEAL); put(3, 9, BLUE)
    put(14, 9, TEAL); put(13, 9, BLUE)
    # corner brackets (tech frame)
    for (ox, oy, sx, sy) in [(0, 0, 1, 1), (COLS-1, 0, -1, 1), (0, ROWS-1, 1, -1), (COLS-1, ROWS-1, -1, -1)]:
        put(ox, oy, TEAL)
        put(ox + sx, oy, BLUE); put(ox + 2*sx, oy, BLUE)
        put(ox, oy + sy, BLUE); put(ox, oy + 2*sy, BLUE)
    return g


def svg(tile=False):
    g = cells()
    W, H = COLS * PX + PAD * 2, ROWS * PX + PAD * 2
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'shape-rendering="crispEdges" role="img" aria-label="BARTEK">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{min(W,H)*0.22:.0f}" fill="{NAVY}"/>')
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
