#!/usr/bin/env python3
"""Generate a clean, reusable BARTEK LLC mark (DNA double-helix + circuit nodes).
Distills the AI-generated logo into scalable SVG. Run: python make_bartek_logo.py
Outputs: bartek_mark.svg (transparent) + bartek_mark_tile.svg (navy tile).
"""
import math
import os

BLUE, TEAL, LIGHT, NAVY = "#2c6fbb", "#2bd4c0", "#dbeafe", "#0e1c33"
W = H = 220
CX, A = 110, 40           # center x, helix amplitude
TOP, BOT, TURNS, N = 34, 186, 2.0, 72


def helix():
    s1, s2 = [], []
    for i in range(N + 1):
        t = i / N
        y = TOP + (BOT - TOP) * t
        ph = t * TURNS * 2 * math.pi
        s1.append((CX + A * math.sin(ph), y))
        s2.append((CX - A * math.sin(ph), y))
    return s1, s2


def poly(pts, color, w):
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def svg(tile=False):
    s1, s2 = helix()
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'role="img" aria-label="BARTEK LLC">']
    if tile:
        r = W * 0.22
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{r:.0f}" fill="{NAVY}"/>')
    # circuit nodes around the helix (the "AI" nod)
    for ang in range(0, 360, 30):
        a = math.radians(ang)
        rr = 96
        x, y = CX + rr * math.cos(a), (TOP + BOT) / 2 + rr * math.sin(a) * 0.62
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2" fill="{TEAL}" opacity="0.55"/>')
        out.append(f'<line x1="{CX + (rr-14)*math.cos(a):.1f}" y1="{(TOP+BOT)/2 + (rr-14)*math.sin(a)*0.62:.1f}" '
                   f'x2="{x:.1f}" y2="{y:.1f}" stroke="{TEAL}" stroke-width="1.4" opacity="0.35"/>')
    # rungs (base pairs) behind strands
    for i in range(3, N, 6):
        (x1, y1), (x2, y2) = s1[i], s2[i]
        col = BLUE if math.sin(i / N * TURNS * 2 * math.pi) >= 0 else TEAL
        out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="4" opacity="0.85"/>')
    # the two strands
    out.append(poly(s2, TEAL, 8))
    out.append(poly(s1, BLUE, 8))
    out.append("</svg>\n")
    return "\n".join(out)


def main():
    d = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(d, "bartek_mark.svg"), "w").write(svg(tile=False))
    open(os.path.join(d, "bartek_mark_tile.svg"), "w").write(svg(tile=True))
    print("wrote bartek_mark.svg + bartek_mark_tile.svg")


if __name__ == "__main__":
    main()
