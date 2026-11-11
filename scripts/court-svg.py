#!/usr/bin/env python3
"""Genera i campi di pallavolo a sole linee in prospettiva (data/images/sketch/campo-*.svg).

Proiezione prospettica di un campo 18 x 9 m (rete a 2,43 m, linee dei 3 m, aste e antenne).
Coordinate: x di traverso (-4,5…4,5), y lungo il campo (0 = linea di fondo vicina, 9 = rete,
18 = fondo lontano), z in alto. Uso: python3 scripts/court-svg.py
"""
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'images', 'sketch')

VIEWS = {
    # nome file: (posizione camera, punto guardato, larghezza in px)
    'campo-prospettiva.svg': ((0.0, -6.5, 8.5), (0.0, 9.5, 0.0), 760),   # da dietro la linea di fondo
    'campo-sbieco.svg': ((12.5, -5.0, 7.0), (0.5, 9.0, 0.5), 860),      # di sbieco, dal lato
    'campo-diagonale.svg': ((15.0, 1.0, 19.0), (0.0, 9.0, 0.0), 760),   # in diagonale, dall'alto
}
NET_H, NET_D = 2.43, 1.0          # altezza della rete, altezza della fascia
POST_X, POST_H = 5.0, 2.65        # aste fuori dalle linee laterali
ANT_UP = 0.8                       # antenne sopra la rete

def camera(c, t):
    fx, fy, fz = (t[i] - c[i] for i in range(3))
    n = math.sqrt(fx * fx + fy * fy + fz * fz); f = (fx / n, fy / n, fz / n)
    up = (0, 0, 1)
    r = (f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0])
    n = math.sqrt(sum(v * v for v in r)); r = tuple(v / n for v in r)
    u = (r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0])
    def proj(p):
        d = tuple(p[i] - c[i] for i in range(3))
        z = sum(d[i] * f[i] for i in range(3))
        return (sum(d[i] * r[i] for i in range(3)) / z, -sum(d[i] * u[i] for i in range(3)) / z)
    return proj

def build(name, c, t, width):
    P = camera(c, t)
    segs = []  # (p0, p1, stile)
    L = lambda a, b, s='line': segs.append((a, b, s))
    # linee del campo
    for y in (0, 18):
        L((-4.5, y, 0), (4.5, y, 0))
    for x in (-4.5, 4.5):
        L((x, 0, 0), (x, 18, 0))
    for y in (6, 9, 12):
        L((-4.5, y, 0), (4.5, y, 0), 'line' if y != 9 else 'center')
    # zona di servizio: trattini di 15 cm dietro le linee di fondo
    for y0, d in ((0, -1), (18, 1)):
        for x in (-4.5, 4.5):
            L((x, y0 + d * 0.2, 0), (x, y0 + d * 0.35, 0), 'tick')
    # rete
    bot = NET_H - NET_D
    for k in range(0, 46):
        x = -4.5 + k * 0.2
        L((x, 9, bot), (x, 9, NET_H), 'mesh')
    for k in range(1, 5):
        z = bot + k * 0.2
        L((-4.5, 9, z), (4.5, 9, z), 'mesh')
    L((-POST_X, 9, NET_H), (POST_X, 9, NET_H), 'band')
    L((-4.5, 9, bot), (4.5, 9, bot), 'cable')
    for x in (-POST_X, POST_X):
        L((x, 9, 0), (x, 9, POST_H), 'post')
    for x in (-4.5, 4.5):
        L((x, 9, bot - 0.05), (x, 9, NET_H + ANT_UP), 'antenna')
    pts = [P(p) for s in segs for p in s[:2]]
    minx = min(p[0] for p in pts); maxx = max(p[0] for p in pts)
    miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
    k = (width - 24) / (maxx - minx)
    height = round((maxy - miny) * k + 24)
    tr = lambda p: ((p[0] - minx) * k + 12, (p[1] - miny) * k + 12)
    style = {
        'line': 'stroke="#1d1d1d" stroke-width="3"',
        'center': 'stroke="#1d1d1d" stroke-width="3"',
        'tick': 'stroke="#1d1d1d" stroke-width="3"',
        'mesh': 'stroke="#1d1d1d" stroke-width="0.8" stroke-opacity="0.75"',
        'band': 'stroke="#1d1d1d" stroke-width="4"',
        'cable': 'stroke="#1d1d1d" stroke-width="1.6"',
        'post': 'stroke="#1d1d1d" stroke-width="6"',
        'antenna': 'stroke="#d63031" stroke-width="3" stroke-dasharray="7 5"',
    }
    groups = {}
    for a, b, s in segs:
        (x1, y1), (x2, y2) = tr(P(a)), tr(P(b))
        groups.setdefault(s, []).append(f'M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}')
    order = ['line', 'center', 'tick', 'mesh', 'cable', 'band', 'post', 'antenna']
    body = '\n'.join(f'<path {style[s]} stroke-linecap="round" fill="none" d="{"".join(groups[s])}"/>' for s in order if s in groups)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
           f'<title>{name[:-4]}</title>\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name), 'w') as fh:
        fh.write(svg)
    print(name, width, height)

for n, (c, t, w) in VIEWS.items():
    build(n, c, t, w)
