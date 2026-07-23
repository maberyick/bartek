#!/usr/bin/env python3
"""BARTEK LLC mark — a DNA double-helix wired into a surrounding circuit.
(Dropped the face/arms; helix + electronic surround reads cleaner.)
Run: python make_bartek_logo.py
Outputs:
  bartek_mark.svg / _tile.svg    -> the mark (used in the nav)
  bartek_lockup.svg / _tile.svg  -> mark + "BARTEK LLC" wordmark (sphere on the A)
"""
import math
import os

BLUE, TEAL, NAVY, INK, LIGHT = "#2c6fbb", "#2bd4c0", "#0e1c33", "#16233b", "#eef4ff"
W, CX = 220, 110
TOP, BOT, TURNS, AMP, N = 60, 196, 2.0, 26, 72
CY = (TOP + BOT) / 2
BASE_H = 236


def helix_pts():
    s1, s2 = [], []
    for i in range(N + 1):
        t = i / N
        y = TOP + (BOT - TOP) * t
        ph = t * TURNS * 2 * math.pi
        s1.append((CX + AMP * math.sin(ph), y))
        s2.append((CX - AMP * math.sin(ph), y))
    return s1, s2


def poly(pts, color, w):
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def node(x, y, r=4, c=TEAL):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'


def pad(x, y, s=6, c=TEAL):
    return f'<rect x="{x-s/2}" y="{y-s/2}" width="{s}" height="{s}" fill="{c}"/>'


def circuit():
    p = []
    # --- corner brackets (tech frame) ---
    m, L = 16, 24
    for cx0, cy0, sx, sy in [(m, m, 1, 1), (W-m, m, -1, 1), (m, BASE_H-m, 1, -1), (W-m, BASE_H-m, -1, -1)]:
        p.append(f'<path d="M {cx0} {cy0+sy*L} L {cx0} {cy0} L {cx0+sx*L} {cy0}" fill="none" stroke="{BLUE}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>')
        p.append(node(cx0, cy0, 3, TEAL))
    # --- side buses with nodes + inward stubs pointing at the helix ---
    for bx, s in [(30, 1), (W-30, -1)]:
        p.append(f'<line x1="{bx}" y1="72" x2="{bx}" y2="{BASE_H-72}" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>')
        for ny in (86, CY, BASE_H-86):
            p.append(node(bx, ny, 4, TEAL))
            p.append(f'<line x1="{bx}" y1="{ny}" x2="{bx+s*16}" y2="{ny}" stroke="{BLUE}" stroke-width="3" stroke-linecap="round"/>')
            p.append(node(bx+s*16, ny, 2.4, TEAL))
        p.append(pad(bx, 72, 6))
        p.append(pad(bx, BASE_H-72, 6))
    # --- top + bottom: helix wired out to vias ---
    for ty, s in [(TOP, -1), (BOT, 1)]:
        yb = ty - s*0  # helix tip
        yline = ty - s*14
        p.append(f'<line x1="{CX}" y1="{ty}" x2="{CX}" y2="{yline}" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>')
        p.append(f'<path d="M {CX-40} {yline} L {CX+40} {yline}" stroke="{BLUE}" stroke-width="3" fill="none" stroke-linecap="round"/>')
        for vx in (CX-40, CX+40):
            p.append(node(vx, yline, 4, TEAL))
    return "".join(p)


def helix(tile):
    s1, s2 = helix_pts()
    out = []
    for i in range(3, N, 6):
        (x1, y1), (x2, y2) = s1[i], s2[i]
        col = BLUE if math.sin(i / N * TURNS * 2 * math.pi) >= 0 else TEAL
        out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="4" opacity="0.85"/>')
    out.append(poly(s2, TEAL, 8))
    out.append(poly(s1, BLUE, 8))
    return "".join(out)


def wordmark(tile):
    tc = LIGHT if tile else INK
    by = BASE_H + 32
    return (f'<text x="{CX}" y="{by}" text-anchor="middle" '
            f'font-family="\'Segoe UI\',\'Helvetica Neue\',Arial,sans-serif" '
            f'font-size="27" font-weight="800" letter-spacing="1.5" fill="{tc}">BARTEK '
            f'<tspan fill="{TEAL}">LLC</tspan></text>')


def svg(tile=False, word=False):
    H = BASE_H + (58 if word else 0)
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BARTEK LLC">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{W*0.14:.0f}" fill="{NAVY}"/>')
    out.append(circuit())
    out.append(helix(tile))
    if word:
        out.append(wordmark(tile))
    out.append("</svg>\n")
    return "\n".join(out)


def main():
    d = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(d, "bartek_mark.svg"), "w").write(svg(False, False))
    open(os.path.join(d, "bartek_mark_tile.svg"), "w").write(svg(True, False))
    open(os.path.join(d, "bartek_lockup.svg"), "w").write(svg(False, True))
    open(os.path.join(d, "bartek_lockup_tile.svg"), "w").write(svg(True, True))
    print("wrote bartek_mark(.svg/_tile) + bartek_lockup(.svg/_tile)")


if __name__ == "__main__":
    main()
