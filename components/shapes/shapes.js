/**
 * PV4Shapes — forme classiche da disegno: forme base, diagramma a blocchi, frecce a blocco, fumetti.
 * Ogni forma: path(w, h, adj) → "d" SVG nelle misure reali dell'oggetto (gli angoli non si deformano),
 * adj = parametri 0…1 regolabili con le maniglie gialle (handles: posizione e funzione inversa).
 */
(function (root) {
    'use strict';
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const P = (pts) => 'M' + pts.map(p => `${r(p[0])} ${r(p[1])}`).join(' L') + ' Z';
    const r = (v) => Math.round(v * 100) / 100;
    const mn = (w, h) => Math.min(w, h);

    // ---------------------------------------------------------------- frecce a blocco
    // freccia "verso destra" in uno spazio L (lunghezza) × T (spessore), poi orientata
    function arrowPts(L, T, adj, opt = {}) {
        const t = clamp(adj[0], 0.05, 1);            // spessore dell'asta (frazione di T)
        const hl = clamp(adj[1], 0.02, opt.double ? 0.5 : 1) * L; // lunghezza della punta
        const y1 = T * (1 - t) / 2, y2 = T * (1 + t) / 2;
        if (opt.double) {
            return [[0, T / 2], [hl, 0], [hl, y1], [L - hl, y1], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, y2], [hl, y2], [hl, T]];
        }
        const n = opt.notch ? hl * 0.5 : 0;
        return [[0, y1], [L - hl, y1], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, y2], [0, y2]].concat(n ? [[n, T / 2]] : []);
    }
    // orientamento: (u lungo la freccia, v di traverso) ↔ (x, y)
    const ORIENT = {
        right: { L: (w, h) => w, T: (w, h) => h, map: (u, v, w, h) => [u, v], unmap: (x, y, w, h) => [x, y] },
        left: { L: (w, h) => w, T: (w, h) => h, map: (u, v, w, h) => [w - u, v], unmap: (x, y, w, h) => [w - x, y] },
        down: { L: (w, h) => h, T: (w, h) => w, map: (u, v, w, h) => [v, u], unmap: (x, y, w, h) => [y, x] },
        up: { L: (w, h) => h, T: (w, h) => w, map: (u, v, w, h) => [v, h - u], unmap: (x, y, w, h) => [h - y, x] }
    };
    function blockArrow(dir, opt = {}) {
        const o = ORIENT[dir];
        return {
            adj: [0.5, 0.35],
            path: (w, h, a) => P(arrowPts(o.L(w, h), o.T(w, h), a, opt).map(([u, v]) => o.map(u, v, w, h))),
            handles: [{
                // un solo rombo: in lunghezza la punta, di traverso lo spessore dell'asta
                pos: (w, h, a) => { const L = o.L(w, h), T = o.T(w, h); return o.map(L - clamp(a[1], 0, opt.double ? 0.5 : 1) * L, T * (1 - clamp(a[0], 0, 1)) / 2, w, h); },
                set: (x, y, w, h, a) => {
                    const [u, v] = o.unmap(x, y, w, h); const L = o.L(w, h), T = o.T(w, h);
                    return [clamp(1 - 2 * v / T, 0.05, 1), clamp((L - u) / L, 0.02, opt.double ? 0.5 : 1)];
                }
            }]
        };
    }

    // ---------------------------------------------------------------- poligoni e stelle
    function regular(n, w, h, rot = -Math.PI / 2) {
        const pts = [];
        for (let i = 0; i < n; i++) { const t = rot + i * 2 * Math.PI / n; pts.push([w / 2 + Math.cos(t) * w / 2, h / 2 + Math.sin(t) * h / 2]); }
        return pts;
    }
    function star(n, w, h, k) {
        const pts = [];
        for (let i = 0; i < n * 2; i++) {
            const t = -Math.PI / 2 + i * Math.PI / n, f = i % 2 ? k : 1;
            pts.push([w / 2 + Math.cos(t) * w / 2 * f, h / 2 + Math.sin(t) * h / 2 * f]);
        }
        return pts;
    }
    function starShape(n, k0) {
        return {
            adj: [k0],
            path: (w, h, a) => P(star(n, w, h, clamp(a[0], 0.1, 0.95))),
            handles: [{
                pos: (w, h, a) => { const t = -Math.PI / 2 + Math.PI / n; return [w / 2 + Math.cos(t) * w / 2 * a[0], h / 2 + Math.sin(t) * h / 2 * a[0]]; },
                set: (x, y, w, h) => [clamp(Math.hypot((x - w / 2) / (w / 2), (y - h / 2) / (h / 2)), 0.1, 0.95)]
            }]
        };
    }

    const roundRectPath = (w, h, rr) => {
        const k = clamp(rr, 0, mn(w, h) / 2);
        return `M${k} 0 H${w - k} A${k} ${k} 0 0 1 ${w} ${k} V${h - k} A${k} ${k} 0 0 1 ${w - k} ${h} H${k} A${k} ${k} 0 0 1 0 ${h - k} V${k} A${k} ${k} 0 0 1 ${k} 0 Z`;
    };
    const ellipsePath = (w, h) => `M0 ${h / 2} A${w / 2} ${h / 2} 0 1 0 ${w} ${h / 2} A${w / 2} ${h / 2} 0 1 0 0 ${h / 2} Z`;
    // maniglia che scorre su un lato (x da 0 a max·w)
    const hx = (frac, max = 1) => ({ pos: (w, h, a) => [a[0] * w * frac, 0], set: (x, y, w) => [clamp(x / (w * frac), 0, max)] });

    // fumetto: corpo nella casella, coda verso il punto (a[0]·w, a[1]·h), anche fuori dalla casella
    // base della coda: punti sul lato del corpo più vicino alla punta
    function tailBase(w, h, a) {
        const tx = a[0] * w, ty = a[1] * h, cx = w / 2, cy = h / 2, dx = tx - cx, dy = ty - cy;
        if (Math.abs(dy) / h >= Math.abs(dx) / w) {
            const y = dy > 0 ? h : 0, bx = clamp(cx + dx * 0.35, w * 0.15, w * 0.85), bw = mn(w, h) * 0.12 + w * 0.04;
            return { b1: [bx - bw, y], b2: [bx + bw, y], n: [0, dy > 0 ? -1 : 1], tip: [tx, ty] };
        }
        const x = dx > 0 ? w : 0, by = clamp(cy + dy * 0.35, h * 0.15, h * 0.85), bw = mn(w, h) * 0.12 + h * 0.04;
        return { b1: [x, by - bw], b2: [x, by + bw], n: [dx > 0 ? -1 : 1, 0], tip: [tx, ty] };
    }
    function callout(rounded) {
        return {
            adj: [0.2, 1.45],
            // copre il bordo del corpo alla base della coda
            cover: (w, h, a, sw) => {
                const { b1, b2, n, tip } = tailBase(w, h, a);
                const k = sw * 0.9, ux = (b2[0] - b1[0]), uy = (b2[1] - b1[1]), L = Math.hypot(ux, uy) || 1;
                const sh = (p, s) => [p[0] + ux / L * s, p[1] + uy / L * s];
                const c1 = sh(b1, k), c2 = sh(b2, -k);
                const in1 = [c1[0] + n[0] * k * 1.5, c1[1] + n[1] * k * 1.5], in2 = [c2[0] + n[0] * k * 1.5, c2[1] + n[1] * k * 1.5];
                const mid = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2], t = [mid[0] + (tip[0] - mid[0]) * 0.25, mid[1] + (tip[1] - mid[1]) * 0.25];
                return P([in1, c1, t, c2, in2]);
            },
            path: (w, h, a) => {
                const tx = a[0] * w, ty = a[1] * h;
                const body = rounded ? roundRectPath(w, h, mn(w, h) * 0.18) : P([[0, 0], [w, 0], [w, h], [0, h]]);
                // base della coda sul lato più vicino alla punta
                const cx = w / 2, cy = h / 2, dx = tx - cx, dy = ty - cy;
                let b1, b2;
                if (Math.abs(dy) / h >= Math.abs(dx) / w) {
                    const y = dy > 0 ? h : 0, bx = clamp(cx + dx * 0.35, w * 0.15, w * 0.85), bw = mn(w, h) * 0.12 + w * 0.04;
                    b1 = [bx - bw, y]; b2 = [bx + bw, y];
                } else {
                    const x = dx > 0 ? w : 0, by = clamp(cy + dy * 0.35, h * 0.15, h * 0.85), bw = mn(w, h) * 0.12 + h * 0.04;
                    b1 = [x, by - bw]; b2 = [x, by + bw];
                }
                return body + ' ' + P([b1, [tx, ty], b2]);
            },
            handles: [{ pos: (w, h, a) => [a[0] * w, a[1] * h], set: (x, y, w, h) => [clamp(x / w, -1, 2), clamp(y / h, -1, 2)] }],
            overflow: (w, h, a) => ({ l: Math.max(0, -a[0] * w), t: Math.max(0, -a[1] * h), r: Math.max(0, a[0] * w - w), b: Math.max(0, a[1] * h - h) })
        };
    }

    const SHAPES = {
        // ------------------------------------------------ forme base
        rect: { cat: 'base', label: 'Rettangolo', path: (w, h) => P([[0, 0], [w, 0], [w, h], [0, h]]) },
        roundRect: {
            cat: 'base', label: 'Rettangolo arrotondato', adj: [0.25],
            path: (w, h, a) => roundRectPath(w, h, a[0] * mn(w, h) / 2),
            handles: [{ pos: (w, h, a) => [a[0] * mn(w, h) / 2, 0], set: (x, y, w, h) => [clamp(x / (mn(w, h) / 2), 0, 1)] }]
        },
        ellipse: { cat: 'base', label: 'Ellisse', path: ellipsePath, size: [100, 70] },
        circle: { cat: 'base', label: 'Cerchio', path: ellipsePath, size: [80, 80] },
        triangle: {
            cat: 'base', label: 'Triangolo', adj: [0.5], size: [100, 86],
            path: (w, h, a) => P([[a[0] * w, 0], [w, h], [0, h]]),
            handles: [{ pos: (w, h, a) => [a[0] * w, 0], set: (x, y, w) => [clamp(x / w, 0, 1)] }]
        },
        rightTriangle: { cat: 'base', label: 'Triangolo rettangolo', size: [100, 80], path: (w, h) => P([[0, 0], [w, h], [0, h]]) },
        diamond: { cat: 'base', label: 'Rombo', size: [100, 80], path: (w, h) => P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) },
        parallelogram: {
            cat: 'base', label: 'Parallelogramma', adj: [0.25],
            path: (w, h, a) => { const s = a[0] * w; return P([[s, 0], [w, 0], [w - s, h], [0, h]]); },
            handles: [hx(1, 0.9)]
        },
        trapezoid: {
            cat: 'base', label: 'Trapezio', adj: [0.25],
            path: (w, h, a) => { const s = a[0] * w / 2; return P([[s, 0], [w - s, 0], [w, h], [0, h]]); },
            handles: [hx(0.5, 1)]
        },
        pentagon: { cat: 'base', label: 'Pentagono', size: [90, 86], path: (w, h) => P(regular(5, w, h)) },
        hexagon: {
            cat: 'base', label: 'Esagono', adj: [0.25], size: [100, 86],
            path: (w, h, a) => { const s = a[0] * w; return P([[s, 0], [w - s, 0], [w, h / 2], [w - s, h], [s, h], [0, h / 2]]); },
            handles: [hx(1, 0.5)]
        },
        octagon: {
            cat: 'base', label: 'Ottagono', adj: [0.29], size: [90, 90],
            path: (w, h, a) => { const c = a[0] * mn(w, h); return P([[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]); },
            handles: [{ pos: (w, h, a) => [a[0] * mn(w, h), 0], set: (x, y, w, h) => [clamp(x / mn(w, h), 0, 0.5)] }]
        },
        star5: Object.assign({ cat: 'base', label: 'Stella a 5 punte', size: [90, 90] }, starShape(5, 0.45)),
        star4: Object.assign({ cat: 'base', label: 'Stella a 4 punte', size: [90, 90] }, starShape(4, 0.4)),
        star6: Object.assign({ cat: 'base', label: 'Stella a 6 punte', size: [90, 90] }, starShape(6, 0.55)),
        cross: {
            cat: 'base', label: 'Croce', adj: [0.34], size: [90, 90],
            path: (w, h, a) => {
                const t = a[0] * mn(w, h), x1 = (w - t) / 2, x2 = (w + t) / 2, y1 = (h - t) / 2, y2 = (h + t) / 2;
                return P([[x1, 0], [x2, 0], [x2, y1], [w, y1], [w, y2], [x2, y2], [x2, h], [x1, h], [x1, y2], [0, y2], [0, y1], [x1, y1]]);
            },
            handles: [{ pos: (w, h, a) => [(w - a[0] * mn(w, h)) / 2, 0], set: (x, y, w, h) => [clamp((w - 2 * x) / mn(w, h), 0.05, 1)] }]
        },
        heart: {
            cat: 'base', label: 'Cuore', size: [90, 80],
            path: (w, h) => `M${w / 2} ${h * 0.28} C${w * 0.5} ${h * 0.05} ${w * 0.05} ${-h * 0.02} ${w * 0.02} ${h * 0.32} C${0} ${h * 0.6} ${w * 0.38} ${h * 0.78} ${w / 2} ${h} C${w * 0.62} ${h * 0.78} ${w} ${h * 0.6} ${w * 0.98} ${h * 0.32} C${w * 0.95} ${-h * 0.02} ${w * 0.5} ${h * 0.05} ${w / 2} ${h * 0.28} Z`
        },
        cloud: {
            cat: 'base', label: 'Nuvola', size: [130, 85],
            path: (w, h) => {
                const x = (v) => r(v * w), y = (v) => r(v * h);
                return `M${x(0.22)} ${y(0.9)} C${x(0.04)} ${y(0.9)} ${x(0.0)} ${y(0.62)} ${x(0.16)} ${y(0.55)} C${x(0.1)} ${y(0.3)} ${x(0.36)} ${y(0.18)} ${x(0.46)} ${y(0.3)} C${x(0.52)} ${y(0.05)} ${x(0.84)} ${y(0.08)} ${x(0.82)} ${y(0.36)} C${x(1.02)} ${y(0.36)} ${x(1.02)} ${y(0.72)} ${x(0.86)} ${y(0.76)} C${x(0.86)} ${y(0.98)} ${x(0.6)} ${y(0.98)} ${x(0.55)} ${y(0.86)} C${x(0.46)} ${y(1.0)} ${x(0.28)} ${y(0.98)} ${x(0.22)} ${y(0.9)} Z`;
            }
        },
        // ------------------------------------------------ diagramma a blocchi
        fcProcess: { cat: 'flow', label: 'Processo', path: (w, h) => P([[0, 0], [w, 0], [w, h], [0, h]]) },
        fcAltProcess: { cat: 'flow', label: 'Processo alternativo', path: (w, h) => roundRectPath(w, h, mn(w, h) * 0.18) },
        fcDecision: { cat: 'flow', label: 'Decisione', size: [120, 80], path: (w, h) => P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) },
        fcData: { cat: 'flow', label: 'Dati (input/output)', path: (w, h) => { const s = mn(w * 0.2, h * 0.5); return P([[s, 0], [w, 0], [w - s, h], [0, h]]); } },
        fcPredefined: {
            cat: 'flow', label: 'Processo predefinito', adj: [0.12],
            path: (w, h, a) => { const s = a[0] * w; return `${P([[0, 0], [w, 0], [w, h], [0, h]])} M${s} 0 V${h} M${w - s} 0 V${h}`; },
            handles: [hx(1, 0.45)]
        },
        fcTerminator: { cat: 'flow', label: 'Inizio / fine', size: [120, 50], path: (w, h) => roundRectPath(w, h, mn(w, h) / 2) },
        fcDocument: {
            cat: 'flow', label: 'Documento', adj: [0.12],
            path: (w, h, a) => { const k = a[0] * h; return `M0 0 H${w} V${h - k} Q${w * 0.75} ${h - 2.4 * k} ${w * 0.5} ${h - k} T0 ${h - k} Z`; },
            handles: [{ pos: (w, h, a) => [0, h - a[0] * h], set: (x, y, w, h) => [clamp((h - y) / h, 0, 0.35)] }]
        },
        fcPreparation: { cat: 'flow', label: 'Preparazione', path: (w, h) => { const s = mn(w * 0.2, h * 0.5); return P([[s, 0], [w - s, 0], [w, h / 2], [w - s, h], [s, h], [0, h / 2]]); } },
        fcManualInput: {
            cat: 'flow', label: 'Input manuale', adj: [0.3],
            path: (w, h, a) => P([[0, a[0] * h], [w, 0], [w, h], [0, h]]),
            handles: [{ pos: (w, h, a) => [0, a[0] * h], set: (x, y, w, h) => [clamp(y / h, 0, 0.9)] }]
        },
        fcManualOp: { cat: 'flow', label: 'Operazione manuale', path: (w, h) => { const s = w * 0.15; return P([[0, 0], [w, 0], [w - s, h], [s, h]]); } },
        fcConnector: { cat: 'flow', label: 'Connettore', size: [50, 50], path: ellipsePath },
        fcOffPage: {
            cat: 'flow', label: 'Connettore fuori pagina', adj: [0.3], size: [70, 80],
            path: (w, h, a) => P([[0, 0], [w, 0], [w, h - a[0] * h], [w / 2, h], [0, h - a[0] * h]]),
            handles: [{ pos: (w, h, a) => [0, h - a[0] * h], set: (x, y, w, h) => [clamp((h - y) / h, 0, 0.9)] }]
        },
        fcDatabase: {
            cat: 'flow', label: 'Database', adj: [0.25], size: [80, 100],
            path: (w, h, a) => {
                const ry = clamp(a[0], 0.02, 0.5) * h / 2;
                return `M0 ${ry} A${w / 2} ${ry} 0 0 1 ${w} ${ry} V${h - ry} A${w / 2} ${ry} 0 0 1 0 ${h - ry} Z M0 ${ry} A${w / 2} ${ry} 0 0 0 ${w} ${ry}`;
            },
            handles: [{ pos: (w, h, a) => [w / 2, clamp(a[0], 0.02, 0.5) * h], set: (x, y, w, h) => [clamp(y / h, 0.02, 0.5)] }]
        },
        fcDelay: { cat: 'flow', label: 'Ritardo', path: (w, h) => { const rx = mn(w / 2, h / 2); return `M0 0 H${w - rx} A${rx} ${h / 2} 0 0 1 ${w - rx} ${h} H0 Z`; } },
        fcMerge: { cat: 'flow', label: 'Unione', size: [80, 70], path: (w, h) => P([[0, 0], [w, 0], [w / 2, h]]) },
        fcExtract: { cat: 'flow', label: 'Estrazione', size: [80, 70], path: (w, h) => P([[w / 2, 0], [w, h], [0, h]]) },
        fcDisplay: { cat: 'flow', label: 'Visualizzazione', path: (w, h) => { const s = w * 0.15, rx = w * 0.15; return `M0 ${h / 2} L${s} 0 H${w - rx} A${rx} ${h / 2} 0 0 1 ${w - rx} ${h} H${s} Z`; } },
        // ------------------------------------------------ frecce a blocco
        arrowRight: Object.assign({ cat: 'arrow', label: 'Freccia a destra', size: [130, 70] }, blockArrow('right')),
        arrowLeft: Object.assign({ cat: 'arrow', label: 'Freccia a sinistra', size: [130, 70] }, blockArrow('left')),
        arrowUp: Object.assign({ cat: 'arrow', label: 'Freccia in su', size: [70, 130] }, blockArrow('up')),
        arrowDown: Object.assign({ cat: 'arrow', label: 'Freccia in giù', size: [70, 130] }, blockArrow('down')),
        arrowLeftRight: Object.assign({ cat: 'arrow', label: 'Freccia doppia ↔', size: [150, 70] }, blockArrow('right', { double: true }), { adj: [0.5, 0.25] }),
        arrowUpDown: Object.assign({ cat: 'arrow', label: 'Freccia doppia ↕', size: [70, 150] }, blockArrow('down', { double: true }), { adj: [0.5, 0.25] }),
        arrowNotched: Object.assign({ cat: 'arrow', label: 'Freccia con coda dentellata', size: [130, 70] }, blockArrow('right', { notch: true })),
        chevron: {
            cat: 'arrow', label: 'Gallone (chevron)', adj: [0.35], size: [110, 70],
            path: (w, h, a) => { const n = a[0] * w; return P([[0, 0], [w - n, 0], [w, h / 2], [w - n, h], [0, h], [n, h / 2]]); },
            handles: [{ pos: (w, h, a) => [w - a[0] * w, 0], set: (x, y, w) => [clamp((w - x) / w, 0, 0.5)] }]
        },
        homePlate: {
            cat: 'arrow', label: 'Pentagono freccia', adj: [0.3], size: [130, 70],
            path: (w, h, a) => { const n = a[0] * w; return P([[0, 0], [w - n, 0], [w, h / 2], [w - n, h], [0, h]]); },
            handles: [{ pos: (w, h, a) => [w - a[0] * w, 0], set: (x, y, w) => [clamp((w - x) / w, 0, 1)] }]
        },
        // ------------------------------------------------ fumetti
        calloutRect: Object.assign({ cat: 'callout', label: 'Fumetto', size: [130, 70] }, callout(false)),
        calloutRound: Object.assign({ cat: 'callout', label: 'Fumetto arrotondato', size: [130, 70] }, callout(true))
    };

    const CATS = [
        ['base', '⬛ Forme base'], ['flow', '🔀 Diagramma a blocchi'], ['arrow', '➡️ Frecce a blocco'], ['callout', '💬 Fumetti']
    ];
    // colori di partenza per categoria
    const DEFAULT_STYLE = {
        base: { color: '#d6e6f7', stroke: '#2c3e50' },
        flow: { color: '#fdf1d6', stroke: '#8a6a30' },
        arrow: { color: '#3498db', stroke: '#1f5f8b' },
        callout: { color: '#ffffff', stroke: '#2c3e50' }
    };

    function get(key) { return SHAPES[key] || SHAPES.rect; }
    function defaultAdj(key) { return (get(key).adj || []).slice(); }
    function size(key) { const s = get(key).size || [120, 80]; return { width: s[0], height: s[1] }; }
    function overflow(key, w, h, adj) { const f = get(key).overflow; return f ? f(w, h, adj) : { l: 0, t: 0, r: 0, b: 0 }; }

    /** anteprima per la galleria */
    function icon(key, fill, stroke) {
        const s = get(key), st = DEFAULT_STYLE[s.cat] || DEFAULT_STYLE.base;
        const sz = s.size || [120, 80], k = 24 / Math.max(sz[0], sz[1]);
        const w = sz[0] * k, h = sz[1] * k;
        const d = s.path(w, h, defaultAdj(key));
        return `<svg width="30" height="30" viewBox="-3 -3 30 30" style="overflow:visible"><g transform="translate(${(24 - w) / 2} ${(24 - h) / 2})"><path d="${d}" fill="${fill || st.color}" stroke="${stroke || st.stroke}" stroke-width="1.3" stroke-linejoin="round"/></g></svg>`;
    }

    /** voci per la galleria (una categoria per gruppo) */
    function sidebarCategories() {
        return CATS.map(([cat, title]) => ({
            title, controlType: 'accordion', category: 'shapes-' + cat, i18ntitle: '',
            items: Object.entries(SHAPES).filter(([, s]) => s.cat === cat).map(([key, s]) => ({ type: 'shape', shape: key, label: s.label }))
        }));
    }

    const api = { SHAPES, CATS, DEFAULT_STYLE, get, defaultAdj, size, overflow, icon, sidebarCategories };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.PV4Shapes = api;
})(typeof window !== 'undefined' ? window : globalThis);
