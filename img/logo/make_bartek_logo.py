#!/usr/bin/env python3
"""BARTEK LLC mark — a pre-Columbian (Tolima-style) face + circuit-trace arms
atop a DNA double-helix. Colombian heritage + biomedical AI.
Run: python make_bartek_logo.py
Outputs:
  bartek_mark.svg / _tile.svg      -> the mark (used in the nav)
  bartek_lockup.svg / _tile.svg    -> mark + "BARTEK LLC" wordmark (LinkedIn/email/SOW)
"""
import math
import os

GOLD, BLUE, TEAL, NAVY, INK, LIGHT = "#d9a326", "#2c6fbb", "#2bd4c0", "#0e1c33", "#16233b", "#eef4ff"
W, CX = 220, 110
TOP, BOT, TURNS, AMP, N = 120, 250, 1.5, 30, 64
SY = 104  # shoulder / arm line
BASE_H = 272


def face(g=GOLD):
    p = []
    # headdress — two curved horns
    p.append(f'<path d="M {CX-12} 46 C {CX-30} 16 {CX-50} 22 {CX-38} 42" fill="none" stroke="{g}" stroke-width="7" stroke-linecap="round"/>')
    p.append(f'<path d="M {CX+12} 46 C {CX+30} 16 {CX+50} 22 {CX+38} 42" fill="none" stroke="{g}" stroke-width="7" stroke-linecap="round"/>')
    # ears — concentric spiral ornaments
    for sx in (CX-36, CX+36):
        p.append(f'<circle cx="{sx}" cy="62" r="13" fill="none" stroke="{g}" stroke-width="5"/>')
        p.append(f'<circle cx="{sx}" cy="62" r="4.5" fill="{g}"/>')
    # head — rounded square
    p.append(f'<rect x="{CX-24}" y="44" width="48" height="48" rx="9" fill="none" stroke="{g}" stroke-width="6"/>')
    p.append(f'<line x1="{CX-16}" y1="58" x2="{CX+16}" y2="58" stroke="{g}" stroke-width="3.5"/>')
    p.append(f'<circle cx="{CX-10}" cy="62" r="4" fill="{g}"/>')
    p.append(f'<circle cx="{CX+10}" cy="62" r="4" fill="{g}"/>')
    p.append(f'<path d="M {CX} 60 L {CX} 74 M {CX-6} 74 L {CX+6} 74" stroke="{g}" stroke-width="4" fill="none" stroke-linecap="round"/>')
    p.append(f'<rect x="{CX-12}" y="80" width="24" height="7" rx="1.5" fill="{g}"/>')
    # neck through the shoulders down to the helix
    p.append(f'<line x1="{CX}" y1="92" x2="{CX}" y2="{TOP-2}" stroke="{g}" stroke-width="6" stroke-linecap="round"/>')
    return "".join(p)


def arms():
    """Circuit-trace arms/wings: a main bus out to a via, with teeth ending in nodes."""
    p = []
    for s in (-1, 1):  # left, right
        x0 = CX + s * 10
        xe = CX + s * 84            # outer end
        p.append(f'<line x1="{x0}" y1="{SY}" x2="{xe}" y2="{SY}" stroke="{BLUE}" stroke-width="6" stroke-linecap="round"/>')
        # outer via + drop
        p.append(f'<line x1="{xe}" y1="{SY}" x2="{xe}" y2="{SY+12}" stroke="{BLUE}" stroke-width="6" stroke-linecap="round"/>')
        p.append(f'<circle cx="{xe}" cy="{SY}" r="5" fill="{TEAL}"/>')
        p.append(f'<circle cx="{xe}" cy="{SY+12}" r="3.5" fill="{TEAL}"/>')
        # teeth (comb) hanging off the bus, each ending in a node
        for k in (28, 50, 72):
            xt = CX + s * k
            p.append(f'<line x1="{xt}" y1="{SY}" x2="{xt}" y2="{SY+10}" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>')
            p.append(f'<circle cx="{xt}" cy="{SY+10}" r="2.6" fill="{TEAL}"/>')
        # a small square pad on the bus
        xp = CX + s * 40
        p.append(f'<rect x="{xp-3}" y="{SY-3}" width="6" height="6" fill="{TEAL}"/>')
    return "".join(p)


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


def svg(tile=False, word=False):
    s1, s2 = helix_pts()
    H = BASE_H + (52 if word else 0)
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BARTEK LLC">']
    if tile:
        out.append(f'<rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{W*0.14:.0f}" fill="{NAVY}"/>')
    # rungs
    for i in range(3, N, 6):
        (x1, y1), (x2, y2) = s1[i], s2[i]
        col = BLUE if math.sin(i / N * TURNS * 2 * math.pi) >= 0 else TEAL
        out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="4" opacity="0.85"/>')
    out.append(poly(s2, TEAL, 8))
    out.append(poly(s1, BLUE, 8))
    out.append(arms())
    out.append(face())
    if word:
        tc = LIGHT if tile else INK
        by = BASE_H + 30
        out.append(f'<text x="{CX}" y="{by}" text-anchor="middle" font-family="\'Segoe UI\',\'Helvetica Neue\',Arial,sans-serif" '
                   f'font-size="30" font-weight="800" letter-spacing="2" fill="{tc}">BARTEK '
                   f'<tspan fill="{TEAL}">LLC</tspan></text>')
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
