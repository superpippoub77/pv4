#!/usr/bin/env python3
"""Disegni vettoriali a colori di palestra e pallavolo (data/images/gym/*.svg).
Stile: tinte piatte con contorno scuro arrotondato. Uso: python3 scripts/gym-svg.py"""
import os, json
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'images', 'gym')
K = '#2b2b2b'           # contorno
S = f'stroke="{K}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"'

def ball(cx, cy, r, a='#ffd23f', b='#1f6fd1', uid='b'):
    """Pallone da pallavolo a due colori."""
    return f'''<clipPath id="{uid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="{a}"/>
<g clip-path="url(#{uid})" fill="{b}">
<path d="M{cx-r} {cy-r*0.35} Q{cx} {cy-r*0.05} {cx+r} {cy-r*0.55} L{cx+r} {cy-r} L{cx-r} {cy-r}Z"/>
<path d="M{cx-r*0.35} {cy+r} Q{cx-r*0.1} {cy+r*0.15} {cx+r} {cy+r*0.1} L{cx+r} {cy+r}Z"/></g>
<g fill="none" stroke="{K}" stroke-width="{max(1.2, r/14):.1f}" stroke-linecap="round" clip-path="url(#{uid})">
<path d="M{cx-r} {cy-r*0.35} Q{cx} {cy-r*0.05} {cx+r} {cy-r*0.55}"/>
<path d="M{cx-r*0.35} {cy+r} Q{cx-r*0.1} {cy+r*0.15} {cx+r} {cy+r*0.1}"/>
<path d="M{cx-r*0.2} {cy-r*0.15} Q{cx-r*0.75} {cy+r*0.25} {cx-r*0.55} {cy+r*0.95}"/></g>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{K}" stroke-width="{max(1.5, r/11):.1f}"/>'''

ITEMS = {
'pallone': (64, 64, ball(32, 32, 28)),
'pallone-azzurro': (64, 64, ball(32, 32, 28, '#ffffff', '#2ea8e6', 'b2')),
'carrello-palloni': (120, 116, f'''
<path d="M14 30 H106" {S} fill="none"/>
{ball(30, 30, 13, uid='c1')}{ball(56, 26, 13, uid='c2')}{ball(82, 30, 13, uid='c3')}{ball(44, 40, 12, uid='c4')}{ball(70, 40, 12, uid='c5')}
<path d="M14 42 L22 92 H98 L106 42Z" fill="#c9ced6" fill-opacity="0.55" {S}/>
<path d="M34 42 V92 M50 42 V92 M70 42 V92 M86 42 V92 M17 62 H103" stroke="{K}" stroke-width="1.6" fill="none"/>
<path d="M106 42 L114 16" {S} fill="none"/><path d="M110 16 H118" {S} fill="none"/>
<circle cx="28" cy="102" r="8" fill="#555" {S}/><circle cx="92" cy="102" r="8" fill="#555" {S}/>
<circle cx="28" cy="102" r="2.5" fill="#ddd"/><circle cx="92" cy="102" r="2.5" fill="#ddd"/>'''),
'cesto-palloni': (110, 90, f'''
{ball(34, 30, 15, uid='d1')}{ball(60, 24, 15, uid='d2')}{ball(80, 34, 14, uid='d3')}
<path d="M10 36 H100 L92 84 H18Z" fill="#e67e22" {S}/>
<path d="M14 50 H96 M16 66 H94 M32 36 L34 84 M55 36 V84 M78 36 L76 84" stroke="{K}" stroke-width="1.5" fill="none" stroke-opacity="0.7"/>'''),
'cono': (56, 74, f'''
<path d="M28 6 L44 60 H12Z" fill="#ff7a1a" {S}/>
<path d="M20 34 H36 L39 44 H17Z" fill="#fff" stroke="{K}" stroke-width="1.6"/>
<rect x="4" y="60" width="48" height="9" rx="2" fill="#ff7a1a" {S}/>'''),
'cinesino': (76, 42, f'''
<path d="M6 30 C10 8 66 8 70 30 Q38 40 6 30Z" fill="#ffd400" {S}/>
<ellipse cx="38" cy="15" rx="10" ry="4" fill="#7a6400" stroke="{K}" stroke-width="1.6"/>'''),
'cinesino-rosso': (76, 42, f'''
<path d="M6 30 C10 8 66 8 70 30 Q38 40 6 30Z" fill="#e8413c" {S}/>
<ellipse cx="38" cy="15" rx="10" ry="4" fill="#7a1e1b" stroke="{K}" stroke-width="1.6"/>'''),
'ostacolo': (110, 74, f'''
<path d="M18 22 V62 M92 22 V62" {S} stroke-width="4" fill="none"/>
<path d="M6 64 H30 M80 64 H104" {S} stroke-width="4" fill="none"/>
<rect x="10" y="12" width="90" height="12" rx="3" fill="#fff" {S}/>
<path d="M22 12 h12 v12 h-12z M46 12 h12 v12 h-12z M70 12 h12 v12 h-12z" fill="#e8413c"/>
<rect x="10" y="12" width="90" height="12" rx="3" fill="none" {S}/>'''),
'cerchio': (100, 52, f'''
<ellipse cx="50" cy="26" rx="44" ry="20" fill="none" stroke="{K}" stroke-width="9"/>
<ellipse cx="50" cy="26" rx="44" ry="20" fill="none" stroke="#2e86de" stroke-width="5"/>'''),
'scaletta': (64, 190, f'''
<path d="M10 6 V184 M54 6 V184" stroke="{K}" stroke-width="7" stroke-linecap="round"/>
<path d="M10 6 V184 M54 6 V184" stroke="#ffd400" stroke-width="3.5" stroke-linecap="round"/>
''' + ''.join(f'<rect x="8" y="{10+i*34}" width="48" height="6" rx="2" fill="#ffd400" stroke="{K}" stroke-width="1.8"/>' for i in range(6))),
'palla-medica': (66, 66, f'''
<circle cx="33" cy="33" r="29" fill="#8b4a2b" {S}/>
<path d="M4 33 H62 M33 4 Q18 33 33 62 M33 4 Q48 33 33 62" stroke="#3b1d10" stroke-width="2.2" fill="none"/>
<circle cx="33" cy="33" r="29" fill="none" {S}/>'''),
'manubrio': (120, 50, f'''
<rect x="30" y="21" width="60" height="8" rx="3" fill="#9aa3ad" {S}/>
<rect x="14" y="8" width="14" height="34" rx="3" fill="#3d4652" {S}/>
<rect x="4" y="13" width="10" height="24" rx="3" fill="#3d4652" {S}/>
<rect x="92" y="8" width="14" height="34" rx="3" fill="#3d4652" {S}/>
<rect x="106" y="13" width="10" height="24" rx="3" fill="#3d4652" {S}/>'''),
'kettlebell': (64, 74, f'''
<path d="M18 30 Q14 6 32 6 Q50 6 46 30" fill="none" stroke="{K}" stroke-width="9" stroke-linecap="round"/>
<path d="M18 30 Q14 6 32 6 Q50 6 46 30" fill="none" stroke="#3d4652" stroke-width="5" stroke-linecap="round"/>
<path d="M32 26 C54 26 60 46 56 58 Q54 68 44 68 H20 Q10 68 8 58 C4 46 10 26 32 26Z" fill="#3d4652" {S}/>
<path d="M20 60 H44" stroke="#9aa3ad" stroke-width="2"/>'''),
'step': (120, 84, f'''
<path d="M8 34 L36 12 H112 L84 34Z" fill="#e6c49a" {S}/>
<path d="M8 34 H84 V76 H8Z" fill="#c8894a" {S}/>
<path d="M84 34 L112 12 V54 L84 76Z" fill="#a86c34" {S}/>
<path d="M20 48 H72 M20 62 H72" stroke="{K}" stroke-width="1.2" stroke-opacity="0.5"/>'''),
'pedana': (150, 96, f'''
<path d="M50 30 L72 14 H142 L120 30Z" fill="#9db8d6" {S}/>
<path d="M50 30 H120 V88 H50Z" fill="#4f7cac" {S}/>
<path d="M120 30 L142 14 V72 L120 88Z" fill="#3b5f86" {S}/>
<path d="M8 60 L22 50 H50 V60Z" fill="#9db8d6" {S}/><path d="M8 60 H50 V88 H8Z" fill="#4f7cac" {S}/>
<path d="M50 60 V88" {S}/>'''),
'materassino': (150, 74, f'''
<path d="M10 22 L30 8 H142 L122 22Z" fill="#6aa9e9" {S}/>
<path d="M10 22 H122 V60 H10Z" fill="#2e86de" {S}/>
<path d="M122 22 L142 8 V46 L122 60Z" fill="#1d5fa3" {S}/>
<path d="M47 22 V60 M84 22 V60 M47 22 L67 8 M84 22 L104 8" stroke="{K}" stroke-width="1.6" fill="none"/>'''),
'panca': (170, 64, f'''
<rect x="6" y="12" width="158" height="12" rx="4" fill="#c8894a" {S}/>
<path d="M22 24 L16 58 H34 L38 24 M132 24 L136 58 H154 L148 24" fill="#7f8c8d" {S}/>'''),
'elastico': (110, 60, f'''
<path d="M14 30 C14 8 96 8 96 30 C96 52 14 52 14 30Z" fill="none" stroke="{K}" stroke-width="10"/>
<path d="M14 30 C14 8 96 8 96 30 C96 52 14 52 14 30Z" fill="none" stroke="#27ae60" stroke-width="6"/>'''),
'corda': (110, 80, f'''
<path d="M18 18 C10 70 100 74 92 18" fill="none" stroke="{K}" stroke-width="5"/>
<path d="M18 18 C10 70 100 74 92 18" fill="none" stroke="#e8413c" stroke-width="2.5"/>
<rect x="12" y="4" width="12" height="20" rx="4" fill="#3d4652" {S}/><rect x="86" y="4" width="12" height="20" rx="4" fill="#3d4652" {S}/>'''),
'fischietto': (96, 62, f'''
<circle cx="14" cy="16" r="9" fill="none" {S}/>
<path d="M22 20 H58 L62 14 H80 V24 H62" fill="#c0c6cc" {S}/>
<circle cx="42" cy="36" r="20" fill="#c0c6cc" {S}/>
<path d="M30 20 H62" stroke="{K}" stroke-width="2"/><circle cx="42" cy="36" r="6" fill="#2b2b2b"/>'''),
'cronometro': (72, 84, f'''
<rect x="29" y="3" width="14" height="9" rx="2" fill="#3d4652" {S}/>
<path d="M54 18 L60 12" {S} stroke-width="4"/>
<circle cx="36" cy="48" r="31" fill="#e8413c" {S}/>
<circle cx="36" cy="48" r="24" fill="#fff" {S}/>
<path d="M36 48 V30 M36 48 L48 54" stroke="{K}" stroke-width="3" stroke-linecap="round"/>
<path d="M36 26 v4 M58 48 h-4 M36 70 v-4 M14 48 h4" stroke="{K}" stroke-width="2"/>'''),
'lavagnetta': (96, 128, f'''
<rect x="6" y="10" width="84" height="112" rx="6" fill="#c8894a" {S}/>
<rect x="14" y="22" width="68" height="92" fill="#3c8d5a" stroke="#fff" stroke-width="2"/>
<path d="M14 68 H82 M14 53 H82 M14 83 H82" stroke="#fff" stroke-width="1.5"/>
<rect x="34" y="4" width="28" height="12" rx="3" fill="#9aa3ad" {S}/>
<path d="M28 36 l8 8 m0 -8 l-8 8" stroke="#ffd400" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="64" cy="96" r="5" fill="none" stroke="#fff" stroke-width="2.5"/>
<path d="M36 46 Q50 70 60 90" stroke="#fff" stroke-width="1.8" fill="none" stroke-dasharray="4 3"/>'''),
'borraccia': (44, 104, f'''
<rect x="14" y="4" width="16" height="12" rx="3" fill="#3d4652" {S}/>
<path d="M12 16 H32 L36 28 V94 Q36 100 30 100 H14 Q8 100 8 94 V28Z" fill="#2ea8e6" {S}/>
<rect x="8" y="46" width="28" height="22" fill="#fff" fill-opacity="0.85" stroke="{K}" stroke-width="1.6"/>'''),
'asciugamano': (90, 64, f'''
<path d="M8 12 H82 V52 H8Z" fill="#f2f2f2" {S}/><path d="M8 40 H82 M8 46 H82" stroke="#2e86de" stroke-width="3"/>
<path d="M8 12 Q4 32 8 52" fill="none" {S}/>'''),
'seggiolone': (100, 170, f'''
<rect x="22" y="40" width="56" height="10" rx="2" fill="#c0c6cc" {S}/>
<path d="M30 30 V40 M70 30 V40 M26 30 H74" {S} fill="none"/>
<path d="M28 50 L16 164 M72 50 L84 164" {S} stroke-width="4" fill="none"/>
''' + ''.join(f'<path d="M{28-0.105*(y-50):.1f} {y} H{72+0.105*(y-50):.1f}" {S} fill="none"/>' for y in range(72, 162, 22)) + f'''
<rect x="8" y="160" width="84" height="6" rx="2" fill="#7f8c8d" {S}/>'''),
'tabellone': (150, 96, f'''
<rect x="6" y="8" width="138" height="72" rx="6" fill="#2b2f36" {S}/>
<rect x="18" y="24" width="48" height="44" rx="4" fill="#fff" {S}/><rect x="84" y="24" width="48" height="44" rx="4" fill="#fff" {S}/>
<path d="M18 46 H66 M84 46 H132" stroke="{K}" stroke-width="1.2"/>
<text x="42" y="58" font-family="Arial,sans-serif" font-weight="700" font-size="30" text-anchor="middle" fill="#1f6fd1">12</text>
<text x="108" y="58" font-family="Arial,sans-serif" font-weight="700" font-size="30" text-anchor="middle" fill="#e8413c">10</text>
<rect x="18" y="12" width="48" height="8" rx="2" fill="#1f6fd1"/><rect x="84" y="12" width="48" height="8" rx="2" fill="#e8413c"/>
<path d="M30 80 V92 M120 80 V92" {S} stroke-width="4"/>'''),
'paletta-cambio': (54, 116, f'''
<rect x="22" y="70" width="10" height="42" rx="4" fill="#3d4652" {S}/>
<rect x="5" y="4" width="44" height="70" rx="8" fill="#ffd400" {S}/>
<text x="27" y="52" font-family="Arial,sans-serif" font-weight="800" font-size="34" text-anchor="middle" fill="#2b2b2b">7</text>'''),
'bersaglio': (110, 62, f'''
<ellipse cx="55" cy="31" rx="50" ry="26" fill="#e8413c" {S}/>
<ellipse cx="55" cy="31" rx="36" ry="18.5" fill="#fff" {S}/>
<ellipse cx="55" cy="31" rx="22" ry="11.5" fill="#e8413c" {S}/>
<ellipse cx="55" cy="31" rx="8" ry="4.2" fill="#fff" {S}/>'''),
'lanciapalloni': (130, 120, f'''
{ball(92, 22, 13, uid='l1')}{ball(110, 34, 12, uid='l2')}
<path d="M80 34 H122 L112 60 H90Z" fill="#c9ced6" {S}/>
<path d="M92 60 L60 70 L66 80 L98 66" fill="#9aa3ad" {S}/>
<rect x="14" y="62" width="76" height="34" rx="6" fill="#4f7cac" {S}/>
<circle cx="34" cy="79" r="10" fill="#2b2f36" {S}/><circle cx="66" cy="79" r="10" fill="#2b2f36" {S}/>
{ball(10, 70, 7, uid='l3')}
<path d="M30 96 L22 114 M74 96 L82 114 M14 114 H90" {S} stroke-width="3.5" fill="none"/>'''),
'antenna': (30, 150, f'''
<rect x="11" y="4" width="8" height="142" rx="3" fill="#fff" {S}/>
''' + ''.join(f'<rect x="11" y="{4+i*20}" width="8" height="10" fill="#e8413c"/>' for i in range(7)) + f'''
<rect x="11" y="4" width="8" height="142" rx="3" fill="none" {S}/>'''),
'ginocchiere': (110, 64, f'''
<path d="M10 14 Q30 4 50 14 V50 Q30 60 10 50Z" fill="#2b2f36" {S}/><ellipse cx="30" cy="32" rx="13" ry="10" fill="#4a525e" stroke="{K}" stroke-width="1.6"/>
<path d="M60 14 Q80 4 100 14 V50 Q80 60 60 50Z" fill="#2b2f36" {S}/><ellipse cx="80" cy="32" rx="13" ry="10" fill="#4a525e" stroke="{K}" stroke-width="1.6"/>'''),
'scarpa': (120, 62, f'''
<path d="M8 40 Q8 18 26 18 L44 12 Q58 26 80 30 Q110 34 112 46 V52 H8Z" fill="#fff" {S}/>
<path d="M8 46 H112 V54 Q112 58 106 58 H14 Q8 58 8 52Z" fill="#e8413c" {S}/>
<path d="M44 12 Q58 26 80 30" fill="none" stroke="#2e86de" stroke-width="4"/>
<path d="M52 22 l6 -6 M60 26 l6 -6 M68 28 l6 -6" stroke="{K}" stroke-width="2" stroke-linecap="round"/>'''),
'maglia': (100, 96, f'''
<path d="M34 6 Q50 18 66 6 L94 20 L84 42 L74 38 V90 H26 V38 L16 42 L6 20Z" fill="#1f6fd1" {S}/>
<text x="50" y="70" font-family="Arial,sans-serif" font-weight="800" font-size="32" text-anchor="middle" fill="#fff">7</text>'''),
}

os.makedirs(OUT, exist_ok=True)
sizes = {}
import re
def dedupe(body):
    # '{S} stroke-width="4"': vale l'ultimo spessore indicato
    def fix(m):
        tag = m.group(0)
        ws = re.findall(r' stroke-width="[^"]*"', tag)
        if len(ws) > 1:
            tag = tag.replace(ws[0], '', 1)
        return tag
    return re.sub(r'<[^>]+>', fix, body)

for name, (w, h, body) in ITEMS.items():
    body = dedupe(body)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{name}</title>{body}</svg>\n'
    with open(os.path.join(OUT, name + '.svg'), 'w') as fh:
        fh.write(svg)
    sizes[name + '.svg'] = [w, h]
print(json.dumps(sizes))
