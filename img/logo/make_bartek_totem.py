#!/usr/bin/env python3
"""BARTEK emblem — pixel-art homage to the Tolima gold figure, in BARTEK colors.
Square face + sharp ear ornaments, eyes as two knocked-out pixel holes,
outstretched wings, lattice body, spiral feet. A standalone icon candidate.
Run: python make_bartek_totem.py  ->  bartek_totem.svg (+ _tile.svg)
"""
import os

BLUE, TEAL, NAVY, OUTLINE = "#2c6fbb", "#2bd4c0", "#0e1c33", "#54637a"  # soft outline (libélula style) reads on any bg
COLS, ROWS, CX = 21, 31, 10
PX, PAD = 12, 14

g = {}
holes = set()


def put(x, y, c):
    if 0 <= x < COLS and 0 <= y < ROWS:
        g[(x, y)] = c


def hbar(x0, x1, y, c):
    for x in range(x0, x1 + 1):
        put(x, y, c)


def vbar(x, y0, y1, c):
    for y in range(y0, y1 + 1):
        put(x, y, c)


def box(x0, x1, y0, y1, c):
    for y in range(y0, y1 + 1):
        hbar(x0, x1, y, c)


def build():
    # HEAD (blue)
    put(7, 0, BLUE); put(13, 0, BLUE)                               # horn tips
    put(7, 1, BLUE); put(8, 1, BLUE); put(12, 1, BLUE); put(13, 1, BLUE)  # horns
    hbar(6, 14, 2, BLUE)                                            # headdress crown
    box(7, 13, 3, 8, BLUE)                                          # square face
    box(3, 5, 4, 6, BLUE); holes.add((4, 5))                        # left ear ornament (hole center)
    box(15, 17, 4, 6, BLUE); holes.add((16, 5))                     # right ear ornament
    put(6, 5, BLUE); put(14, 5, BLUE)                               # bridge ears -> face
    holes.update({(9, 5), (11, 5)})                                 # eyes = two pixel holes
    holes.update({(9, 7), (10, 7), (11, 7)})                        # mouth slit
    put(10, 9, BLUE)                                                # neck

    # WINGS (teal) + shoulders (blue)
    hbar(2, 6, 10, TEAL); hbar(14, 18, 10, TEAL)                    # wing bars
    put(2, 9, TEAL); put(18, 9, TEAL)                               # wing tips rise
    hbar(7, 13, 10, BLUE)                                           # shoulders
    for x in (3, 5, 15, 17):
        put(x, 11, TEAL)                                            # wing teeth

    # BODY lattice (blue)
    for x in (6, 8, 10, 12, 14):
        vbar(x, 11, 22, BLUE)
    for y in (11, 14, 17, 20, 22):
        hbar(6, 14, y, BLUE)
    for y in (13, 16, 19):                                          # side comb teeth
        hbar(3, 5, y, BLUE); hbar(15, 17, y, BLUE)

    # LEGS (teal) — two spiral feet
    for c in [(9, 23), (9, 24), (8, 25), (7, 26), (6, 26)]:
        put(*c, TEAL)
    box(4, 6, 27, 29, TEAL); holes.add((5, 28))
    for c in [(11, 23), (11, 24), (12, 25), (13, 26), (14, 26)]:
        put(*c, TEAL)
    box(14, 16, 27, 29, TEAL); holes.add((15, 28))


def svg(tile=False):
    for h in holes:
        g.pop(h, None)
    W, H = COLS * PX + PAD * 2, ROWS * PX + PAD * 2
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'shape-rendering="crispEdges" role="img" aria-label="BARTEK emblem">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{W*0.20:.0f}" fill="{NAVY}"/>')
    filled = set(g)
    for (x, y) in sorted(filled):
        if any((x+dx, y+dy) not in filled for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            out.append(f'<rect x="{PAD+x*PX-1}" y="{PAD+y*PX-1}" width="{PX+2}" height="{PX+2}" fill="{OUTLINE}"/>')
    for (x, y), c in g.items():
        out.append(f'<rect x="{PAD+x*PX}" y="{PAD+y*PX}" width="{PX}" height="{PX}" fill="{c}"/>')
    out.append("</svg>\n")
    return "\n".join(out)


def main():
    build()
    d = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(d, "bartek_totem.svg"), "w").write(svg(False))
    open(os.path.join(d, "bartek_totem_tile.svg"), "w").write(svg(True))
    print("wrote bartek_totem.svg + bartek_totem_tile.svg")


if __name__ == "__main__":
    main()
