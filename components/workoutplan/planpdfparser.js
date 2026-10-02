/**
 * Lettura di un PIANO DI ALLENAMENTO da PDF (testo con posizioni estratto da pdf.js).
 * Riconosce la struttura delle schede di allenamento come quella di esempio:
 *   intestazione (squadra, stagione, categoria, campionato, periodo, palestra, allenamento, durata),
 *   Obiettivo, Caratteristiche prestative, Materiale occorrente,
 *   Fase Analitica / Sintetica / Globale con blocchi a titolo ed esercizi
 *   (colonne Nr · Esercizio · G · R · Nr · Dettagli), GRUPPI.
 * Le colonne si ricavano dalle intestazioni della tabella; le righe dagli spazi verticali
 * e dai numeri (1.0, 1.1…); i blocchi dai titoli centrati.
 *
 * parsePlanPages(pages) con pages = [{ width, height, items: [{ x, y, size, str }] }]
 * (y misurata dall'alto della pagina). Restituisce un piano (vedi WorkoutPlan.empty()).
 */
(function (root) {

    const HEADING_SIZE = 14;   // titoli di sezione (Obiettivo 16, Fase … 20)
    const ROW_GAP = 16;        // spazio verticale oltre il quale inizia una nuova riga
    const BULLET = /^[●•▪◦○■\-–]$/;

    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    function emptyPlan() {
        return {
            header: { team: '', season: '', categoria: '', campionato: '', periodo: '', palestra: '', numero: '', durata: '' },
            objective: '',
            features: { categoria: '', eta: '', campionato: '', livTecnico: '', livTattico: '', fattibilita: '' },
            materials: { palloni: '', muro: '', tappetini: '', spalliere: '', panche: '', cinesini: '', carrelli: '', nastro: '' },
            phases: [
                { key: 'ANA', title: 'Fase Analitica', blocks: [] },
                { key: 'SIN', title: 'Fase Sintetica', blocks: [] },
                { key: 'GLO', title: 'Fase Globale o di gioco', blocks: [] }
            ],
            groups: []
        };
    }

    /** Raggruppa gli elementi di testo in righe (stessa altezza) con y globale crescente tra le pagine */
    function toLines(pages) {
        const lines = [];
        let offset = 0;
        pages.forEach((pg) => {
            const items = pg.items
                .filter(it => it.str && it.str.trim())
                // numero di pagina in fondo
                .filter(it => !(it.y > pg.height - 45 && /^\d{1,3}$/.test(it.str.trim())))
                .map(it => ({ ...it, str: it.str.replace(/​/g, ''), gy: offset + it.y }))
                .sort((a, b) => a.gy - b.gy || a.x - b.x);
            items.forEach(it => {
                const last = lines[lines.length - 1];
                if (last && Math.abs(last.gy - it.gy) <= 3) last.items.push(it);
                else lines.push({ gy: it.gy, items: [it] });
            });
            offset += pg.height + 100; // salto tra le pagine: più grande di qualunque distanza tra righe
        });
        lines.forEach(l => {
            l.items.sort((a, b) => a.x - b.x);
            l.size = Math.max(...l.items.map(i => i.size || 0));
            l.text = joinItems(l.items);
            l.x = l.items[0].x;
        });
        return lines;
    }

    function joinItems(items) {
        let out = '';
        items.forEach((it, i) => {
            const s = it.str;
            if (i > 0 && !/\s$/.test(out) && !/^\s/.test(s)) out += ' ';
            out += s;
        });
        return out.replace(/\s+/g, ' ').trim();
    }

    function headingKind(text) {
        const t = norm(text);
        if (/^obiettiv/.test(t)) return 'objective';
        if (/^caratteristiche/.test(t)) return 'features';
        if (/^material/.test(t)) return 'materials';
        if (/^fase\s+anal/.test(t)) return 'ANA';
        if (/^fase\s+sint/.test(t)) return 'SIN';
        if (/^fase\s+glob/.test(t) || /^fase\s+di\s+gioco/.test(t)) return 'GLO';
        if (/^gruppi/.test(t)) return 'groups';
        return null;
    }

    const FEATURE_KEYS = [
        [/categor/, 'categoria'], [/^eta|^età/, 'eta'], [/campionat/, 'campionato'],
        [/tecnic/, 'livTecnico'], [/tattic/, 'livTattico'], [/fattibil/, 'fattibilita']
    ];
    const MATERIAL_KEYS = [
        [/pallon/, 'palloni'], [/^muro/, 'muro'], [/tappetin/, 'tappetini'], [/spallier/, 'spalliere'],
        [/panch/, 'panche'], [/cinesin|conin/, 'cinesini'], [/carrell/, 'carrelli'], [/nastro|corda/, 'nastro']
    ];

    /** Tabella "etichette / valori" su due righe: abbina ogni valore all'etichetta più vicina in orizzontale */
    function labelValueTable(lines, keys, target) {
        if (lines.length < 2) return;
        const labels = lines[0].items.map(it => ({ x: it.x + (it.w || 0) / 2, text: it.str }));
        // etichette composte da più elementi vicini ("Liv. Tecnico med")
        const values = lines[1].items;
        const center = (it) => it.x + (it.w || it.str.length * 4) / 2;
        const labelCenters = lines[0].items.map(it => ({ c: center(it), text: it.str }));
        values.forEach(v => {
            const c = center(v);
            let best = null, bd = Infinity;
            labelCenters.forEach(l => { const d = Math.abs(l.c - c); if (d < bd) { bd = d; best = l; } });
            if (!best) return;
            const k = keys.find(([re]) => re.test(norm(best.text)));
            if (k) target[k[1]] = (target[k[1]] ? target[k[1]] + ' ' : '') + v.str.trim();
        });
        void labels;
    }

    function parseHeader(lines, plan) {
        if (!lines.length) return;
        const all = lines.flatMap(l => l.items.map(it => ({ ...it, gy: l.gy })));
        const find = (re) => all.find(it => re.test(norm(it.str)));
        const below = (label) => {
            if (!label) return '';
            const c = label.x + (label.w || label.str.length * 4) / 2;
            const cands = all.filter(it => it.gy > label.gy + 4 && it.gy < label.gy + 30)
                .map(it => ({ it, d: Math.abs((it.x + (it.w || it.str.length * 4) / 2) - c) }))
                .sort((a, b) => a.d - b.d);
            return cands.length && cands[0].d < 40 ? cands[0].it.str.trim() : '';
        };
        const after = (re) => { // "Periodo: Preparazione" sulla stessa riga
            const label = find(re);
            if (!label) return '';
            const inline = label.str.split(':').slice(1).join(':').trim();
            if (inline) return inline;
            const next = all.filter(it => Math.abs(it.gy - label.gy) <= 3 && it.x > label.x).sort((a, b) => a.x - b.x)[0];
            return next ? next.str.trim() : '';
        };
        const stag = find(/^stagione/), cat = find(/^categoria$/), camp = find(/^campionato$/);
        plan.header.season = below(stag);
        plan.header.categoria = below(cat);
        plan.header.campionato = below(camp);
        plan.header.periodo = after(/^periodo/);
        plan.header.palestra = after(/^palestra/);
        plan.header.numero = after(/^allenamento/);
        plan.header.durata = after(/^durata/);
        // squadra: il testo a sinistra delle etichette
        const leftLimit = stag ? stag.x - 8 : 140;
        const used = new Set(['stagione', 'categoria', 'campionato']);
        plan.header.team = all.filter(it => it.x + (it.w || 0) <= leftLimit + 2 && !used.has(norm(it.str)))
            .sort((a, b) => a.gy - b.gy || a.x - b.x).map(it => it.str.trim()).join(' ').trim();
    }

    function parsePhase(lines, phase) {
        if (!lines.length) return;
        // intestazione della tabella
        let hi = lines.findIndex(l => /\bnr\b/.test(norm(l.text)) && /esercizi/.test(norm(l.text)));
        if (hi < 0) hi = 0;
        const head = lines[hi].items;
        const nrs = head.filter(it => /^nr\.?$/i.test(it.str.trim()));
        const colX = {
            nr: nrs[0] ? nrs[0].x : 30,
            ex: (head.find(it => /esercizi/i.test(it.str)) || {}).x,
            g: (head.find(it => /^g$/i.test(it.str.trim())) || {}).x,
            r: (head.find(it => /^r$/i.test(it.str.trim())) || {}).x,
            qty: nrs[1] ? nrs[1].x : null,
            det: (head.find(it => /dettagl|note/i.test(it.str)) || {}).x
        };
        const exStart = colX.nr + 16;
        const gStart = colX.g != null ? colX.g - 9 : null;
        const rStart = colX.g != null && colX.r != null ? (colX.g + colX.r) / 2 : null;
        const qtyStart = colX.qty != null ? (colX.r != null ? (colX.r + colX.qty) / 2 : colX.qty - 12) : null;
        const detStart = colX.qty != null ? colX.qty + 24 : (colX.det != null ? colX.det - 60 : 400);
        const exEnd = gStart != null ? gStart : (qtyStart != null ? qtyStart : detStart);

        const colOf = (x) => {
            if (x < exStart - 4) return 'nr';
            if (x < exEnd) return 'ex';
            if (gStart != null && x < rStart) return 'g';
            if (rStart != null && x < qtyStart) return 'r';
            if (qtyStart != null && x < detStart) return 'qty';
            return 'det';
        };

        let block = null;
        let row = null;
        let lastExY = null, lastDetY = null;
        const exLines = new Map(), detLines = new Map();

        const ensureBlock = () => {
            if (!block) { block = { title: '', rows: [] }; phase.blocks.push(block); }
            return block;
        };
        const newRow = () => {
            row = { nr: '', text: '', g: '', r: '', qty: '', details: '' };
            ensureBlock().rows.push(row);
            exLines.set(row, []);
            detLines.set(row, []);
            lastExY = null; lastDetY = null;
            return row;
        };

        for (let i = hi + 1; i < lines.length; i++) {
            const line = lines[i];
            // intestazione ripetuta su una nuova pagina
            if (/\bnr\b/.test(norm(line.text)) && /esercizi/.test(norm(line.text)) && /dettagl/.test(norm(line.text))) continue;
            const cells = { nr: [], ex: [], g: [], r: [], qty: [], det: [] };
            line.items.forEach(it => cells[colOf(it.x)].push(it));

            // titolo di blocco: testo centrato nella tabella, da solo sulla riga
            const onlyCenter = line.items.every(it => it.x > exStart + 60 && it.x < (colX.det || 600)) &&
                !cells.nr.length && !cells.g.length && !cells.r.length && !cells.qty.length && !cells.det.length;
            if (onlyCenter && line.items.length <= 6 && !(row && lastExY != null && line.gy - lastExY < ROW_GAP)) {
                block = { title: line.text, rows: [] };
                phase.blocks.push(block);
                row = null;
                continue;
            }

            const hasNr = cells.nr.some(it => /^\d+([.,]\d+)?$/.test(it.str.trim()));
            const exStartsNew = cells.ex.length && (lastExY == null || line.gy - lastExY > ROW_GAP);
            if (!row || hasNr || exStartsNew) newRow();

            if (hasNr) row.nr = cells.nr.map(it => it.str.trim()).join(' ');
            if (cells.ex.length) { exLines.get(row).push({ gy: line.gy, items: cells.ex }); lastExY = line.gy; }
            if (cells.g.length) row.g = (row.g + ' ' + joinItems(cells.g)).trim();
            if (cells.r.length) row.r = (row.r + ' ' + joinItems(cells.r)).trim();
            if (cells.qty.length) row.qty = (row.qty + ' ' + joinItems(cells.qty)).trim();
            if (cells.det.length) {
                const t = joinItems(cells.det);
                const gap = lastDetY == null ? 0 : line.gy - lastDetY;
                const dl = detLines.get(row);
                const labelled = /^[A-ZÀ-Ý][^:]{1,24}:/.test(t);     // «Opposti: …» va a capo
                const fragment = /^[a-zà-ÿ]{1,2}$/.test(t);          // parola spezzata a fine riga («Raff» + «a»)
                if (dl.length && gap <= ROW_GAP && fragment) dl[dl.length - 1] += t;
                else if (dl.length && gap <= ROW_GAP && !labelled) dl[dl.length - 1] += ' ' + t;
                else dl.push(t);
                lastDetY = line.gy;
            }
        }

        // testo dell'esercizio: elenchi puntati su righe proprie, il resto unito
        phase.blocks.forEach(b => b.rows.forEach(r => {
            const out = [];
            let prevGy = null, prevBullet = false;
            (exLines.get(r) || []).forEach(l => {
                const items = l.items;
                const first = items[0].str.trim();
                const isBullet = BULLET.test(first);
                const text = joinItems(isBullet ? items.slice(1) : items);
                const cont = prevGy != null && l.gy - prevGy <= ROW_GAP;
                if (isBullet) out.push('• ' + text);
                else if (cont && out.length && (prevBullet ? items[0].x > exStart + 20 : true) && !/:$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + text;
                else out.push(text);
                if (isBullet) prevBullet = true; else if (!cont) prevBullet = false;
                prevGy = l.gy;
            });
            r.text = out.join('\n').replace(/\s+\n/g, '\n').trim();
            r.details = (detLines.get(r) || []).join('\n').trim();
        }));
        phase.blocks = phase.blocks.filter(b => b.title || b.rows.length);
    }

    function parseGroups(lines, plan) {
        let cur = null;
        lines.forEach(l => {
            const t = l.text.trim();
            if (/:$/.test(t)) {
                cur = { name: t.replace(/:$/, '').trim(), players: '' };
                plan.groups.push(cur);
            } else if (cur) {
                cur.players = (cur.players ? cur.players + ' ' : '') + t;
            } else {
                cur = { name: '', players: t };
                plan.groups.push(cur);
            }
        });
    }

    function parsePlanPages(pages) {
        const plan = emptyPlan();
        const lines = toLines(pages);
        // sezioni
        const marks = [];
        lines.forEach((l, i) => {
            const kind = l.size >= HEADING_SIZE ? headingKind(l.text) : null;
            if (kind) marks.push({ i, kind });
        });
        parseHeader(lines.slice(0, marks.length ? marks[0].i : 0), plan);
        marks.forEach((m, k) => {
            const body = lines.slice(m.i + 1, k + 1 < marks.length ? marks[k + 1].i : lines.length);
            if (m.kind === 'objective') plan.objective = body.map(l => l.text).join(' ').trim();
            else if (m.kind === 'features') labelValueTable(body, FEATURE_KEYS, plan.features);
            else if (m.kind === 'materials') labelValueTable(body, MATERIAL_KEYS, plan.materials);
            else if (m.kind === 'groups') parseGroups(body, plan);
            else {
                const phase = plan.phases.find(p => p.key === m.kind);
                const heading = lines[m.i].text;
                if (phase) { phase.title = heading; parsePhase(body, phase); }
            }
        });
        return plan;
    }

    /** Estrae le pagine da un PDF con pdf.js (window.pdfjsLib) */
    async function readPdf(arrayBuffer, pdfjsLib) {
        const lib = pdfjsLib || root.pdfjsLib;
        const doc = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const vp = page.getViewport({ scale: 1 });
            const tc = await page.getTextContent();
            pages.push({
                width: vp.width,
                height: vp.height,
                items: tc.items.map(it => ({
                    x: it.transform[4],
                    y: vp.height - it.transform[5],
                    size: Math.abs(it.transform[0]) || Math.abs(it.transform[3]),
                    w: it.width || 0,
                    str: it.str
                }))
            });
        }
        return pages;
    }

    const api = { parsePlanPages, readPdf, emptyPlan };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.PlanPdfParser = api;
})(typeof window !== 'undefined' ? window : globalThis);
