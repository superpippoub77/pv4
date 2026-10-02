/**
 * RotationBoard — "Lavagna"
 * Dispone in automatico i 6 giocatori (sistema 5-1: P, S1, C2, O, S2, C1 + libero) su
 * campo intero o metà campo, per ogni rotazione (P1…P6, dalla zona del palleggiatore)
 * e per ogni fase di gioco:
 *   - Posizioni di partenza (zone regolamentari)
 *   - Break point (fase punto): partenza in battuta → muro e difesa → contrattacco
 *   - Side out (cambio palla): ricezione → attacco
 * Le posizioni di ricezione rispettano le regole di posizione (nessun fallo).
 * Con "spostamenti" la posizione della fase precedente resta come copia semitrasparente
 * e tratteggiata, con la freccia fino alla nuova posizione.
 * Si può anche chiedere a parole: «P3 ricezione a metà campo», «tutte le rotazioni in
 * break point», «difesa P5 campo intero con avversari»…
 *
 * Coordinate: (u,v) della metà campo della squadra, rete a v=0, fondo a v=1,
 * u=0 lato zona 4/5, u=1 lato zona 2/1 (come guarda la squadra verso la rete).
 */
class RotationBoard {
    constructor(editor) {
        this.editor = editor;
        this.dialog = null;
    }

    // Formazione in P1: zone 1…6 → ruolo. Diagonali P-O, S1-S2, C1-C2.
    static LINEUP = ['P', 'S1', 'C2', 'O', 'S2', 'C1'];

    static PHASES = [
        { key: 'ZONE', group: 'BASE', label: 'Posizioni di partenza (zone)', short: 'Partenza' },
        { key: 'BP_START', group: 'BP', label: 'Break point · Partenza in battuta', short: 'Break point · Battuta' },
        { key: 'BP_DEF', group: 'BP', label: 'Break point · Muro e difesa', short: 'Break point · Difesa', from: 'BP_START' },
        { key: 'BP_COUNTER', group: 'BP', label: 'Break point · Contrattacco', short: 'Break point · Contrattacco', from: 'BP_DEF' },
        { key: 'SO_REC', group: 'SO', label: 'Side out · Ricezione', short: 'Side out · Ricezione' },
        { key: 'SO_ATT', group: 'SO', label: 'Side out · Attacco dopo la ricezione', short: 'Side out · Attacco', from: 'SO_REC' },
        { key: 'SO_COVER', group: 'SO', label: 'Side out · Copertura dell\'attacco', short: 'Side out · Copertura', from: 'SO_ATT' }
    ];

    // Fase della squadra avversaria (campo intero) mentre la nostra è nella fase indicata
    static OPPONENT_PHASE = { ZONE: 'ZONE', BP_START: 'SO_REC', BP_DEF: 'SO_ATT', BP_COUNTER: 'BP_DEF', SO_REC: 'BP_START', SO_ATT: 'BP_DEF', SO_COVER: 'BP_DEF' };

    // Ricezione a 3 (libero + 2 schiacciatori) per rotazione: posizioni regolari
    static RECEPTION = {
        1: { O: [0.10, 0.12], C2: [0.45, 0.08], S1: [0.78, 0.55], S2: [0.18, 0.60], C1: [0.48, 0.62], P: [0.92, 0.85] },
        6: { S2: [0.20, 0.55], O: [0.55, 0.08], C2: [0.85, 0.08], C1: [0.48, 0.62], P: [0.62, 0.20], S1: [0.80, 0.62] },
        5: { C1: [0.08, 0.06], S2: [0.25, 0.50], O: [0.90, 0.06], P: [0.12, 0.20], S1: [0.55, 0.62], C2: [0.82, 0.62] },
        4: { P: [0.35, 0.05], C1: [0.50, 0.08], S2: [0.78, 0.55], S1: [0.20, 0.60], C2: [0.50, 0.62], O: [0.93, 0.85] },
        3: { S1: [0.20, 0.52], P: [0.62, 0.05], C1: [0.88, 0.08], C2: [0.45, 0.62], O: [0.60, 0.28], S2: [0.80, 0.62] },
        2: { C2: [0.08, 0.06], S1: [0.25, 0.50], P: [0.80, 0.05], O: [0.10, 0.25], S2: [0.52, 0.62], C1: [0.82, 0.62] }
    };

    static ZONE_UV = { 4: [1 / 6, 0.15], 3: [0.5, 0.15], 2: [5 / 6, 0.15], 5: [1 / 6, 0.62], 6: [0.5, 0.62], 1: [5 / 6, 0.62] };
    static SERVE_UV = [0.85, 1.1];

    static ROLE_COLORS = { P: '#f39c12', O: '#8e44ad', S: '#2980b9', C: '#c0392b', L: '#16a085' };
    static OPP_COLOR = '#7f8c8d';

    static ROLE_NAMES = { P: 'palleggiatore', O: 'opposto', S: 'schiacciatore', C: 'centrale', L: 'libero' };

    // ============================================================
    // MODELLO
    // ============================================================
    /** Zona (1…6) del ruolo nella rotazione r (r = zona del palleggiatore) */
    static zoneOf(role, r) {
        const i = RotationBoard.LINEUP.indexOf(role);
        return ((i + r - 1) % 6) + 1;
    }

    static isFront(zone) { return zone === 2 || zone === 3 || zone === 4; }

    static kind(role) { return role === 'L' ? 'L' : role.charAt(0); }

    /**
     * Posizioni dei giocatori: [{ role, label, zone, u, v, server }]
     * label = scritta sul giocatore (L al posto del centrale di seconda linea).
     */
    positions(phase, r, opts = {}) {
        const libero = opts.libero !== false;
        const breakPoint = phase === 'ZONE' ? false : phase.startsWith('BP');
        const players = RotationBoard.LINEUP.map(role => {
            const zone = RotationBoard.zoneOf(role, r);
            return { role, kind: RotationBoard.kind(role), zone, front: RotationBoard.isFront(zone), label: role };
        });
        // Libero al posto del centrale in seconda linea (non batte: se il centrale è in zona 1 in break point batte lui)
        if (libero) {
            const c = players.find(p => p.kind === 'C' && !p.front);
            if (c && !(breakPoint && c.zone === 1)) { c.label = 'L'; c.kind = 'L'; c.replaced = c.role; }
        }

        const set = (p, uv) => { p.u = uv[0]; p.v = uv[1]; };
        switch (phase) {
            case 'ZONE':
                players.forEach(p => set(p, RotationBoard.ZONE_UV[p.zone]));
                break;
            case 'BP_START':
                players.forEach(p => {
                    if (p.zone === 1) { set(p, RotationBoard.SERVE_UV); p.server = true; }
                    else set(p, RotationBoard.ZONE_UV[p.zone]);
                });
                break;
            case 'SO_REC': {
                const sys = opts.rec || 'R3';
                if (sys === 'R3' || !this.solveReception(players, sys)) {
                    const t = RotationBoard.RECEPTION[r];
                    players.forEach(p => { set(p, t[p.role]); p.receiver = p.kind === 'S' || p.kind === 'L' || (!libero && p.kind === 'C' && !p.front); });
                }
                break;
            }
            case 'BP_DEF':
                players.forEach(p => set(p, this.systemDefenseUV(p, opts.def || 'BASE', opts.att || 'R')));
                break;
            case 'BP_COUNTER':
            case 'SO_ATT':
                players.forEach(p => set(p, this.attackUV(p)));
                break;
            case 'SO_COVER':
                this.coverPositions(players, opts.cover || '4');
                break;
        }
        return players;
    }

    /** Fase precedente (per gli spostamenti): [fase, opzioni] oppure null */
    prevOf(phase, opts) {
        if (phase === 'BP_DEF') return (opts.def && opts.def !== 'BASE') ? ['BP_DEF', { ...opts, def: 'BASE' }] : ['BP_START', opts];
        if (phase === 'BP_COUNTER') return ['BP_DEF', opts];
        if (phase === 'SO_ATT') return ['SO_REC', opts];
        if (phase === 'SO_COVER') return ['SO_ATT', opts];
        return null;
    }

    /** Nome breve della disposizione (scheda) */
    boardLabel(phase, o) {
        const def = RotationBoard.PHASES.find(p => p.key === phase);
        if (phase === 'SO_REC') return 'Side out · ' + RotationBoard.recSystem(o.rec || 'R3').short;
        if (phase === 'BP_DEF') {
            const d = RotationBoard.defSystem(o.def || 'BASE');
            return 'Break point · ' + d.short + (d.R ? ' · ' + RotationBoard.attackOf(o.att || 'R').short : '');
        }
        if (phase === 'SO_COVER') return 'Side out · ' + RotationBoard.coverOf(o.cover || '4').short;
        return def.short;
    }

    /** Spiegazione del sistema usato */
    boardDesc(phase, o) {
        if (phase === 'SO_REC') return RotationBoard.recSystem(o.rec || 'R3').desc;
        if (phase === 'BP_DEF') {
            const d = RotationBoard.defSystem(o.def || 'BASE');
            return d.desc + (d.R ? ' ' + RotationBoard.attackOf(o.att || 'R').label + '.' : '');
        }
        if (phase === 'SO_COVER') return 'Copertura dell\'attacco (' + RotationBoard.coverOf(o.cover || '4').label.toLowerCase() + '): tre giocatori vicini all\'attaccante, bassi, per riprendere la palla murata; due più profondi.';
        if (phase === 'BP_START') return 'Al momento della battuta: posizioni regolari, chi batte dietro la linea di fondo.';
        if (phase === 'BP_COUNTER' || phase === 'SO_ATT') return 'Il palleggiatore va al punto di alzata, gli attaccanti in rincorsa (posto 4, primo tempo, posto 2 e pipe), chi non attacca in copertura.';
        return 'Posizioni regolamentari nelle zone 1…6.';
    }
    // ============================================================
    // SISTEMI DI RICEZIONE, DIFESA E COPERTURA
    // Notazione delle difese (Federazione/allenatoridipallavolo): tre numeri =
    // giocatori a muro · giocatori sul pallonetto · giocatori sulle palle lunghe.
    // ============================================================
    static REC_SYSTEMS = [
        { key: 'R5', label: 'Ricezione a 5 (W)', short: 'Ricezione a 5',
          desc: 'Ricevono tutti tranne il palleggiatore, disposti a W (2 avanti, 3 dietro): lo schema più prudente, tipico del giovanile e delle rotazioni difficili; copre tutto il campo ma coinvolge gli attaccanti.' },
        { key: 'R4', label: 'Ricezione a 4 (libero, schiacciatori, opposto)', short: 'Ricezione a 4',
          desc: 'Ricevono libero, i due schiacciatori e l\'opposto: i centrali restano liberi per il primo tempo. Compromesso tra sicurezza e velocità.' },
        { key: 'R3', label: 'Ricezione a 3 (libero e 2 schiacciatori)', short: 'Ricezione a 3',
          desc: 'Ricevono solo i tre specialisti (libero e schiacciatori): opposto e centrali liberi per le combinazioni veloci. Scelta delle squadre evolute.' },
        { key: 'R2', label: 'Ricezione a 2 (libero e schiacciatore di 2ª linea)', short: 'Ricezione a 2',
          desc: 'Ricevono il libero e lo schiacciatore di seconda linea: tutta la prima linea è libera di attaccare. Richiede ricevitori molto affidabili.' }
    ];

    // Posizioni per attacco avversario sulla nostra DESTRA (da posto 4 avversario) [R] e al CENTRO [C].
    // Attacco da posto 2 avversario: specchio di R. Chiavi = posti specializzati: F4 F3 F2 (prima linea), B5 B6 B1.
    static DEF_SYSTEMS = [
        { key: 'BASE', label: 'Posizioni di base (posti specializzati)', short: 'Difesa di base',
          desc: 'Subito dopo la battuta ognuno va nel suo posto: schiacciatore in 4, centrale in 3, palleggiatore o opposto in 2; in seconda linea palleggiatore/opposto in 1, schiacciatore in 6, libero in 5. Da qui si legge l\'alzata avversaria.' },
        { key: '204', label: '2-0-4 perimetrale (6 arretrato)', short: 'Difesa 2-0-4',
          desc: 'Muro a 2 (posto dell\'attacco + centrale), nessuno fisso sul pallonetto, 4 difensori sulle palle lunghe: il giocatore di prima linea che non mura si stacca da rete per la diagonale corta, 5 e 1 sulle linee esterne, 6 in fondo al campo.',
          R: { F2: [0.88, 0.04], F3: [0.75, 0.04], F4: [0.14, 0.38], B1: [0.90, 0.62], B6: [0.42, 0.90], B5: [0.12, 0.66] },
          C: { F3: [0.50, 0.04], F2: [0.63, 0.04], F4: [0.12, 0.38], B1: [0.88, 0.66], B6: [0.50, 0.90], B5: [0.12, 0.66] } },
        { key: '213', label: '2-1-3 con 6 avanzato (pallonetto)', short: 'Difesa 2-1-3',
          desc: 'Muro a 2, il giocatore di zona 6 sale dietro al muro per i pallonetti e le palle smorzate, 3 difensori sulle palle lunghe: il non murante staccato da rete, 5 e 1 profondi sulle linee.',
          R: { F2: [0.88, 0.04], F3: [0.75, 0.04], F4: [0.14, 0.42], B6: [0.64, 0.33], B1: [0.90, 0.78], B5: [0.14, 0.80] },
          C: { F3: [0.50, 0.04], F2: [0.63, 0.04], F4: [0.12, 0.42], B6: [0.50, 0.33], B1: [0.86, 0.78], B5: [0.14, 0.78] } },
        { key: '213R', label: '2-1-3 rotazionale (1 avanzato, 6 sulla linea)', short: 'Difesa 2-1-3 rotazionale',
          desc: 'Muro a 2, il difensore di zona 1 (dietro al muro) avanza sul pallonetto, il 6 ruota sulla linea in fondo e il 5 copre la diagonale lunga: il campo "ruota" verso l\'attacco.',
          R: { F2: [0.88, 0.04], F3: [0.75, 0.04], F4: [0.14, 0.40], B1: [0.80, 0.30], B6: [0.86, 0.90], B5: [0.28, 0.82] },
          C: { F3: [0.50, 0.04], F2: [0.63, 0.04], F4: [0.12, 0.42], B6: [0.50, 0.33], B1: [0.86, 0.78], B5: [0.14, 0.78] } },
        { key: '303', label: '3-0-3 (muro a 3)', short: 'Difesa 3-0-3',
          desc: 'Muro a 3 contro l\'attaccante più forte: tutta la prima linea mura, 3 difensori in seconda linea (5 e 1 sulle diagonali, 6 in fondo), nessuno sul pallonetto.',
          R: { F2: [0.88, 0.04], F3: [0.74, 0.04], F4: [0.60, 0.04], B1: [0.90, 0.62], B6: [0.45, 0.88], B5: [0.12, 0.62] },
          C: { F4: [0.36, 0.04], F3: [0.50, 0.04], F2: [0.64, 0.04], B1: [0.88, 0.62], B6: [0.50, 0.88], B5: [0.12, 0.62] } },
        { key: '312', label: '3-1-2 (muro a 3, 6 avanzato)', short: 'Difesa 3-1-2',
          desc: 'Muro a 3, il giocatore di zona 6 al centro del campo (centro-mediano avanzato) sui pallonetti e sulle palle che passano sopra il muro, 5 e 1 profondi.',
          R: { F2: [0.88, 0.04], F3: [0.74, 0.04], F4: [0.60, 0.04], B6: [0.60, 0.34], B1: [0.90, 0.80], B5: [0.14, 0.80] },
          C: { F4: [0.36, 0.04], F3: [0.50, 0.04], F2: [0.64, 0.04], B6: [0.50, 0.34], B1: [0.85, 0.80], B5: [0.15, 0.80] } },
        { key: '321', label: '3-2-1 (muro a 3, 6 arretrato)', short: 'Difesa 3-2-1',
          desc: 'Muro a 3, 5 e 1 a metà campo sulle palle corte e sulle diagonali (2), il 6 sempre lungo in fondo (centro-mediano arretrato).',
          R: { F2: [0.88, 0.04], F3: [0.74, 0.04], F4: [0.60, 0.04], B1: [0.86, 0.50], B5: [0.18, 0.50], B6: [0.50, 0.90] },
          C: { F4: [0.36, 0.04], F3: [0.50, 0.04], F2: [0.64, 0.04], B1: [0.84, 0.50], B5: [0.16, 0.50], B6: [0.50, 0.90] } },
        { key: '123', label: '1-2-3 (muro a 1)', short: 'Difesa 1-2-3',
          desc: 'Muro a 1 (giovanile o contro attacchi veloci): un solo murante, gli altri due di prima linea staccati da rete sulle palle corte, tre difensori profondi.',
          R: { F2: [0.88, 0.04], F3: [0.50, 0.36], F4: [0.18, 0.36], B1: [0.88, 0.72], B6: [0.50, 0.90], B5: [0.12, 0.72] },
          C: { F3: [0.50, 0.04], F4: [0.20, 0.36], F2: [0.80, 0.36], B1: [0.88, 0.72], B6: [0.50, 0.90], B5: [0.12, 0.72] } }
    ];

    static ATTACKS = [
        { key: 'R', label: 'Attacco avversario da posto 4 (sulla nostra zona 2)', short: 'attacco da posto 4' },
        { key: 'C', label: 'Attacco avversario al centro (primo tempo, pipe)', short: 'attacco al centro' },
        { key: 'L', label: 'Attacco avversario da posto 2 (sulla nostra zona 4)', short: 'attacco da posto 2' }
    ];

    static COVERS = [
        { key: '4', label: 'Attacco da posto 4', short: 'copertura posto 4' },
        { key: '3', label: 'Primo tempo (posto 3)', short: 'copertura primo tempo' },
        { key: '2', label: 'Attacco da posto 2 (o da zona 1)', short: 'copertura posto 2' },
        { key: 'P', label: 'Pipe (seconda linea, zona 6)', short: 'copertura pipe' }
    ];

    // Posti della ricezione per numero di ricevitori (u,v della metà campo)
    static REC_SLOTS = {
        5: [[0.30, 0.40], [0.70, 0.40], [0.12, 0.66], [0.50, 0.68], [0.88, 0.66]],
        4: [[0.12, 0.58], [0.38, 0.63], [0.62, 0.63], [0.88, 0.58]],
        3: [[0.20, 0.58], [0.50, 0.62], [0.80, 0.58]],
        2: [[0.30, 0.60], [0.72, 0.60]]
    };

    static recSystem(k) { return RotationBoard.REC_SYSTEMS.find(s => s.key === k) || RotationBoard.REC_SYSTEMS[2]; }
    static defSystem(k) { return RotationBoard.DEF_SYSTEMS.find(s => s.key === k) || RotationBoard.DEF_SYSTEMS[0]; }
    static attackOf(k) { return RotationBoard.ATTACKS.find(s => s.key === k) || RotationBoard.ATTACKS[0]; }
    static coverOf(k) { return RotationBoard.COVERS.find(s => s.key === k) || RotationBoard.COVERS[0]; }

    /** Posto specializzato dopo la battuta (F = prima linea, B = seconda) */
    static slotOf(p) {
        if (p.front) return p.kind === 'S' ? 'F4' : p.kind === 'C' ? 'F3' : 'F2';
        return (p.kind === 'P' || p.kind === 'O') ? 'B1' : p.kind === 'S' ? 'B6' : 'B5';
    }

    /** Difesa secondo il sistema e la direzione dell'attacco avversario */
    systemDefenseUV(p, sysKey, att) {
        const sys = RotationBoard.defSystem(sysKey);
        if (!sys.R) return this.defenseUV(p);
        const slot = RotationBoard.slotOf(p);
        if (att === 'C') return sys.C[slot];
        if (att === 'L') {
            const sw = { F4: 'F2', F2: 'F4', B5: 'B1', B1: 'B5' }[slot] || slot;
            const uv = sys.R[sw];
            return [1 - uv[0], uv[1]];
        }
        return sys.R[slot];
    }

    static permutations(n) {
        const out = [];
        const rec = (arr, rest) => {
            if (!rest.length) { out.push(arr); return; }
            rest.forEach((x, i) => rec(arr.concat(x), rest.slice(0, i).concat(rest.slice(i + 1))));
        };
        rec([], Array.from({ length: n }, (_, i) => i));
        return out;
    }

    /**
     * Ricezione a k ricevitori: cerca la disposizione regolare (nessun fallo di posizione,
     * giocatori non sovrapposti) più vicina alle zone, con il palleggiatore più vicino
     * possibile al punto di alzata e chi non riceve nascosto a rete o dietro al compagno.
     */
    solveReception(players, sysKey) {
        const hasL = players.some(p => p.kind === 'L');
        const liberoLike = (p) => p.kind === 'L' || (!hasL && p.kind === 'C' && !p.front);
        const isRec = {
            R5: (p) => p.kind !== 'P',
            R4: (p) => p.kind === 'S' || p.kind === 'O' || liberoLike(p),
            R2: (p) => liberoLike(p) || (p.kind === 'S' && !p.front)
        }[sysKey];
        if (!isRec) return false;
        const rec = players.filter(isRec), non = players.filter(p => !isRec(p));
        const slots = RotationBoard.REC_SLOTS[rec.length];
        if (!slots) return false;
        const base = (p) => RotationBoard.ZONE_UV[p.zone];
        const us = [0.06, 0.2, 0.35, 0.5, 0.65, 0.8, 0.94];
        const candidates = non.map(p => {
            const list = p.front ? us.map(u => [u, 0.06]) : us.flatMap(u => [[u, 0.18], [u, 0.3], [u, 0.88]]);
            return list.map(c => ({ c, cost: p.kind === 'P' ? 3 * Math.hypot(c[0] - 0.62, c[1] - 0.05) : Math.hypot(c[0] - base(p)[0], c[1] - base(p)[1]) }))
                .sort((a, b) => a.cost - b.cost);
        });
        const far = (c, placed, min) => placed.every(q => Math.hypot(q[0] - c[0], q[1] - c[1]) >= min);
        let best = null, bestCost = Infinity;
        for (const perm of RotationBoard.permutations(rec.length)) {
            let c0 = 0;
            rec.forEach((p, i) => { const s = slots[perm[i]]; p.u = s[0]; p.v = s[1]; c0 += Math.abs(s[0] - base(p)[0]); });
            if (c0 >= bestCost) continue;
            const placed = rec.map(p => [p.u, p.v]);
            const dfs = (i, cost) => {
                if (cost >= bestCost) return;
                if (i === non.length) {
                    if (this.overlapFaults(players).length) return;
                    bestCost = cost;
                    best = players.map(p => [p.u, p.v]);
                    return;
                }
                for (const { c, cost: k } of candidates[i]) {
                    if (cost + k >= bestCost) break;
                    if (!far(c, placed, 0.12)) continue;
                    non[i].u = c[0]; non[i].v = c[1];
                    placed.push(c);
                    dfs(i + 1, cost + k);
                    placed.pop();
                }
            };
            dfs(0, c0);
        }
        if (!best) return false;
        players.forEach((p, i) => { p.u = best[i][0]; p.v = best[i][1]; });
        players.forEach(p => { p.receiver = isRec(p); });
        return true;
    }

    /** Copertura dell'attacco: 3 vicini all'attaccante, 2 profondi (assegnati a chi è più vicino) */
    coverPositions(players, key) {
        players.forEach(p => { const uv = this.attackUV(p); p.u = uv[0]; p.v = uv[1]; });
        let attacker, spot;
        if (key === '4') { attacker = players.find(p => p.front && p.kind === 'S'); spot = [0.10, 0.06]; }
        else if (key === '3') { attacker = players.find(p => p.front && p.kind === 'C'); spot = [0.45, 0.06]; }
        else if (key === '2') {
            attacker = players.find(p => p.front && p.kind === 'O');
            spot = [0.90, 0.06];
            if (!attacker) { attacker = players.find(p => !p.front && p.kind === 'O'); spot = [0.85, 0.32]; }
        } else { attacker = players.find(p => !p.front && p.kind === 'S'); spot = [0.50, 0.32]; }
        if (!attacker) attacker = players.find(p => p.front && p.kind !== 'P');
        attacker.u = spot[0]; attacker.v = spot[1]; attacker.attacker = true;
        const clip = (x) => Math.max(0.06, Math.min(0.94, x));
        const targets = [[clip(spot[0] - 0.2), spot[1] + 0.22], [clip(spot[0]), spot[1] + 0.3], [clip(spot[0] + 0.2), spot[1] + 0.22], [0.25, 0.78], [0.75, 0.78]];
        const others = players.filter(p => p !== attacker);
        let best = null, bestCost = Infinity;
        for (const perm of RotationBoard.permutations(others.length)) {
            let c = 0;
            others.forEach((p, i) => { const t = targets[perm[i]]; c += Math.hypot(t[0] - p.u, t[1] - p.v); });
            if (c < bestCost) { bestCost = c; best = perm; }
        }
        others.forEach((p, i) => { const t = targets[best[i]]; p.u = t[0]; p.v = t[1]; });
        return attacker;
    }

    /** Muro e difesa: posti specializzati dopo la battuta */
    defenseUV(p) {
        if (p.front) {
            if (p.kind === 'S') return [0.12, 0.11];          // posto 4
            if (p.kind === 'C') return [0.50, 0.10];          // posto 3
            return [0.88, 0.11];                              // P o O in posto 2
        }
        if (p.kind === 'P' || p.kind === 'O') return [0.85, 0.72]; // zona 1
        if (p.kind === 'S') return [0.50, 0.85];               // zona 6
        return [0.15, 0.72];                                   // libero / centrale in zona 5
    }

    /** Attacco (dopo la ricezione o in contrattacco): rincorse e copertura */
    attackUV(p) {
        if (p.kind === 'P') return [0.62, 0.08];               // alzata
        if (p.front) {
            if (p.kind === 'S') return [0.06, 0.40];           // rincorsa posto 4
            if (p.kind === 'C') return [0.42, 0.32];           // primo tempo
            return [0.96, 0.40];                               // opposto posto 2
        }
        if (p.kind === 'S') return [0.50, 0.72];               // pipe
        if (p.kind === 'O') return [0.88, 0.70];               // attacco da zona 1
        return [0.25, 0.75];                                   // libero / centrale: copertura
    }

    /**
     * Controllo dei falli di posizione (al momento della battuta): ogni giocatore di prima
     * linea davanti al corrispondente di seconda, e da sinistra a destra 4-3-2 e 5-6-1.
     * Restituisce l'elenco dei falli (vuoto se tutto regolare).
     */
    overlapFaults(players) {
        const byZone = {};
        players.forEach(p => { byZone[p.zone] = p; });
        const faults = [];
        const name = (p) => `${p.label} (zona ${p.zone})`;
        [[4, 5], [3, 6], [2, 1]].forEach(([f, b]) => {
            const F = byZone[f], B = byZone[b];
            if (F && B && !B.server && !(F.v < B.v)) faults.push(`${name(F)} deve stare davanti a ${name(B)}`);
        });
        [[4, 3], [3, 2], [5, 6], [6, 1]].forEach(([l, r]) => {
            const L = byZone[l], R = byZone[r];
            if (L && R && !L.server && !R.server && !(L.u < R.u)) faults.push(`${name(L)} deve stare a sinistra di ${name(R)}`);
        });
        return faults;
    }

    // ============================================================
    // RICHIESTA A PAROLE
    // ============================================================
    static norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    /** «P3 ricezione metà campo», «tutte le rotazioni in break point»… → opzioni (solo quelle riconosciute) */
    parseRequest(text) {
        const t = RotationBoard.norm(text);
        const o = {};
        if (/\btutte le rotazion/.test(t) || /\bogni rotazion/.test(t) || /\bp1\s*-\s*p6\b/.test(t)) o.rotation = 'ALL';
        else {
            const m = t.match(/\bp\s?([1-6])\b/) || t.match(/\brotazione\s*(?:n\.?\s*)?([1-6])\b/) || t.match(/\bpalleggiatore in (?:zona|posto) ([1-6])\b/);
            if (m) o.rotation = m[1];
        }

        const has = (re) => re.test(t);
        const bp = has(/break\s*-?\s*point|fase punto|\bin battuta\b|\bbattiamo\b/);
        const so = has(/side\s*-?\s*out|cambio palla/);
        // sistemi di difesa: 2-0-4, 2-1-3, 3-0-3… (anche «2 0 4», «204», «2/0/4»)
        const tri = (a, b, c) => new RegExp(`(?:^|[^0-9])${a}\\s*[-/ ]?\\s*${b}\\s*[-/ ]?\\s*${c}(?:[^0-9]|$)`).test(t);
        if (has(/tutti i sistemi|tutte le difese|ogni difesa/)) o.def = 'ALL';
        else if (tri(2, 1, 3) && has(/rotaz|1 avanzat|uno avanzat/)) o.def = '213R';
        else if (tri(2, 0, 4) || has(/perimetral/)) o.def = '204';
        else if (tri(2, 1, 3) || has(/6 avanzat|sei avanzat|pallonett/)) o.def = '213';
        else if (tri(3, 1, 2)) o.def = '312';
        else if (tri(3, 2, 1) || has(/6 arretrat|sei arretrat/)) o.def = '321';
        else if (tri(3, 0, 3) || has(/muro a (?:3|tre)/)) o.def = '303';
        else if (tri(1, 2, 3) || has(/muro a (?:1|uno)|muro singolo/)) o.def = '123';
        else if (has(/difesa di base|posizioni di base|posti specializzati/)) o.def = 'BASE';
        // ricezione a 5/4/3/2
        if (has(/tutte le ricezion|ogni ricezion/)) o.rec = 'ALL';
        else { const m = t.match(/ricezione a (5|4|3|2|cinque|quattro|tre|due|w)\b/); if (m) o.rec = { 5: 'R5', cinque: 'R5', w: 'R5', 4: 'R4', quattro: 'R4', 3: 'R3', tre: 'R3', 2: 'R2', due: 'R2' }[m[1]]; }
        // direzione dell'attacco avversario / attacco da coprire
        const cover = has(/copertur/);
        if (has(/tutti gli attacchi|ogni attacco/)) { if (cover) o.cover = 'ALL'; else o.att = 'ALL'; }
        else if (cover) {
            if (has(/pipe/)) o.cover = 'P';
            else if (has(/primo tempo|posto 3|zona 3|centrale/)) o.cover = '3';
            else if (has(/posto 2|zona 2|opposto|zona 1/)) o.cover = '2';
            else if (has(/posto 4|zona 4|banda|schiacciatore/)) o.cover = '4';
        } else if (has(/(?:attacco|attaccano|schiacciata)[^.]*(?:da|in|su) (?:posto|zona) 4|da posto 4/)) o.att = 'R';
        else if (has(/(?:attacco|attaccano|schiacciata)[^.]*(?:da|in|su) (?:posto|zona) 2|da posto 2/)) o.att = 'L';
        else if (has(/al centro|primo tempo|da posto 3|pipe/)) o.att = 'C';

        if (o.def === 'ALL' && !o.att) o.att = 'ALL';
        // «tutte le combinazioni»: ogni rotazione, fase, ricezione, difesa e copertura
        if (has(/tutte le combinazion|ogni combinazion|tutte le possibil/)) {
            Object.assign(o, { rotation: o.rotation || 'ALL', rec: o.rec || 'ALL', def: o.def || 'ALL', att: o.att || 'ALL', cover: o.cover || 'ALL' });
            o.phase = bp && !so ? 'BP_ALL' : so && !bp ? 'SO_ALL' : 'ALL';
        }
        else if (has(/tutte le fasi|ogni fase/)) o.phase = bp && !so ? 'BP_ALL' : so && !bp ? 'SO_ALL' : 'ALL';
        else if (cover) o.phase = 'SO_COVER';
        else if (o.def || has(/\bmur[oi]\b|difes/)) o.phase = 'BP_DEF';
        else if (has(/contrattacc|transizion/) || (bp && has(/\battacc/))) o.phase = 'BP_COUNTER';
        else if (has(/ricezion|riceviamo/) && has(/\battacc/)) o.phase = has(/dopo (?:la )?ricezion/) ? 'SO_ATT' : 'SO_ALL';
        else if (has(/ricezion|riceviamo/)) o.phase = 'SO_REC';
        else if (has(/\battacc/) && !bp) o.phase = 'SO_ATT';
        else if (bp && has(/partenza|battuta/) && !has(/break\s*-?\s*point|fase punto/)) o.phase = 'BP_START';
        else if (bp) o.phase = has(/partenza/) ? 'BP_START' : 'BP_ALL';
        else if (so) o.phase = 'SO_ALL';
        else if (has(/partenza|posizion[ei] (?:di )?(?:base|regolament)|\bzone\b/)) o.phase = 'ZONE';

        if (has(/meta campo|mezzo campo|half/)) o.court = 'half';
        else if (has(/campo (?:intero|completo|pieno)|tutto il campo|campo da 18|due campi/)) o.court = 'full';
        if (has(/verticale/)) o.horizontal = false;
        else if (has(/orizzontale/)) o.horizontal = true;
        if (has(/senza (?:il )?libero/)) o.libero = false;
        else if (has(/con (?:il )?libero/)) o.libero = true;
        if (has(/senza (?:le )?frecce|senza spostamenti/)) o.arrows = false;
        else if (has(/con (?:le )?frecce|spostamenti/)) o.arrows = true;
        if (has(/senza avversari/)) o.opponents = false;
        else if (has(/avversari/)) { o.opponents = true; if (!o.court) o.court = 'full'; }
        return o;
    }

    // ============================================================
    // UI
    // ============================================================
    show() {
        if (!this.dialog) this.createDialog();
        this.dialog.showDialog();
        this.setReport('');
        this.updatePreview();
        document.getElementById('rbAsk')?.focus();
    }

    hide() {
        this.dialog?.hideDialog();
    }

    createDialog() {
        const rot = [1, 6, 5, 4, 3, 2].map(r => `<option value="${r}">P${r} — palleggiatore in zona ${r}</option>`).join('');
        const phases = RotationBoard.PHASES.map(p => `<option value="${p.key}">${p.label}</option>`).join('');
        const opts = (list) => list.map(x => `<option value="${x.key}">${x.label}</option>`).join('');
        const html = `
<div class="tx-ex wg rb">
    <p class="tx-ex-help">
        Dispone i 6 giocatori (sistema 5-1: <b>P</b> palleggiatore, <b>O</b> opposto, <b>S1 S2</b> schiacciatori,
        <b>C1 C2</b> centrali, <b>L</b> libero) per ogni <b>rotazione</b> (P1…P6, dalla zona del palleggiatore)
        e ogni <b>fase</b>: partenza, break point (battuta, muro e difesa con i sistemi 2-0-4, 2-1-3, 3-0-3, 3-1-2, 3-2-1, 1-2-3
        sull'attacco avversario da posto 4, al centro o da posto 2, contrattacco) e side out (ricezione a 5, 4, 3 o 2, attacco, copertura).
        Puoi anche chiederlo a parole.
    </p>
    <div class="rb-ask">
        <input type="text" id="rbAsk" class="wg-input" placeholder="es. P3 ricezione a 4 · difesa 2-1-3 attacco da posto 4 · tutte le difese in P1 · copertura pipe P6 · tutte le rotazioni in ricezione a 5">
        <button type="button" class="btn" id="rbAskBtn">Imposta</button>
    </div>
    <div class="rb-grid">
        <div class="rb-form">
            <label class="wg-label">Campo</label>
            <div class="rb-seg">
                <label><input type="radio" name="rbCourt" value="full" checked> Campo intero</label>
                <label><input type="radio" name="rbCourt" value="half"> Metà campo</label>
            </div>
            <label class="wg-label">Orientamento</label>
            <div class="rb-seg">
                <label><input type="radio" name="rbOrient" value="h" checked> Orizzontale</label>
                <label><input type="radio" name="rbOrient" value="v"> Verticale</label>
            </div>
            <label class="wg-label" for="rbRotation">Rotazione</label>
            <select id="rbRotation" class="wg-input">${rot}<option value="ALL">Tutte le rotazioni (P1…P6)</option></select>
            <label class="wg-label" for="rbPhase">Fase</label>
            <select id="rbPhase" class="wg-input">${phases}
                <option value="BP_ALL">Break point · tutte le fasi</option>
                <option value="SO_ALL">Side out · tutte le fasi</option>
                <option value="ALL">Tutte le fasi</option>
            </select>
            <div id="rbRecWrap">
                <label class="wg-label" for="rbRec">Ricezione</label>
                <select id="rbRec" class="wg-input">${opts(RotationBoard.REC_SYSTEMS)}<option value="ALL">Tutte le ricezioni (a 5, 4, 3, 2)</option></select>
            </div>
            <div id="rbDefWrap">
                <label class="wg-label" for="rbDef">Sistema di muro e difesa</label>
                <select id="rbDef" class="wg-input">${opts(RotationBoard.DEF_SYSTEMS)}<option value="ALL">Tutti i sistemi di difesa</option></select>
                <div id="rbAttWrap">
                    <label class="wg-label" for="rbAtt">Attacco avversario</label>
                    <select id="rbAtt" class="wg-input">${opts(RotationBoard.ATTACKS)}<option value="ALL">Tutti gli attacchi (posto 4, centro, posto 2)</option></select>
                </div>
            </div>
            <div id="rbCoverWrap">
                <label class="wg-label" for="rbCover">Copertura dell'attacco</label>
                <select id="rbCover" class="wg-input">${opts(RotationBoard.COVERS)}<option value="ALL">Tutti gli attacchi da coprire</option></select>
            </div>
            <div class="tx-ex-options rb-options">
                <label><input type="checkbox" id="rbLibero" checked> Libero al posto del centrale in seconda linea</label>
                <label><input type="checkbox" id="rbArrows" checked> Mostra gli spostamenti dalla fase precedente</label>
                <label><input type="checkbox" id="rbOpponents"> Squadra avversaria (campo intero)</label>
                <label><input type="checkbox" id="rbNewTab" checked> In una nuova scheda</label>
            </div>
        </div>
        <div class="rb-preview-box">
            <div class="rb-preview-title" id="rbPreviewTitle"></div>
            <svg id="rbPreview" viewBox="-12 -14 124 134" class="rb-preview"></svg>
            <div class="rb-check" id="rbCheck"></div>
            <div class="rb-desc" id="rbDesc"></div>
        </div>
    </div>
    <div id="rbReport" class="tx-ex-report"></div>
</div>`;
        this.dialog = createWindow({
            title: 'dlg_title_rotation_board',
            icon: '🏐',
            id: 'rotationBoardDialog',
            contentHTML: html,
            effect: 'windows',
            size: 'lg',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_rotation_place', close: false, color: 'success', onClick: () => this.onPlace() },
                { label: 'btn_close', color: 'secondary', onClick: () => this.hide() }
            ]
        });
        const root = document.getElementById('rotationBoardDialog') || document;
        root.querySelectorAll('#rbRotation, #rbPhase, #rbRec, #rbDef, #rbAtt, #rbCover, #rbLibero, #rbArrows, input[name="rbCourt"]').forEach(el =>
            el.addEventListener('change', () => this.updatePreview()));
        document.getElementById('rbAskBtn')?.addEventListener('click', () => this.onAsk());
        document.getElementById('rbAsk')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.onAsk(true); }
        });
    }

    setReport(html) {
        const el = document.getElementById('rbReport');
        if (el) el.innerHTML = html;
    }

    escape(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    readOptions() {
        const val = (id) => document.getElementById(id)?.value;
        const checked = (id) => !!document.getElementById(id)?.checked;
        return {
            court: document.querySelector('input[name="rbCourt"]:checked')?.value || 'full',
            horizontal: (document.querySelector('input[name="rbOrient"]:checked')?.value || 'h') === 'h',
            rotation: val('rbRotation') || '1',
            phase: val('rbPhase') || 'ZONE',
            rec: val('rbRec') || 'R3',
            def: val('rbDef') || 'BASE',
            att: val('rbAtt') || 'R',
            cover: val('rbCover') || '4',
            libero: checked('rbLibero'),
            arrows: checked('rbArrows'),
            opponents: checked('rbOpponents'),
            newTab: checked('rbNewTab')
        };
    }

    writeOptions(o) {
        const setRadio = (name, value) => {
            const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (el) el.checked = true;
        };
        if (o.court) setRadio('rbCourt', o.court);
        if (o.horizontal !== undefined) setRadio('rbOrient', o.horizontal ? 'h' : 'v');
        if (o.rotation) document.getElementById('rbRotation').value = o.rotation;
        if (o.phase) document.getElementById('rbPhase').value = o.phase;
        if (o.rec) document.getElementById('rbRec').value = o.rec;
        if (o.def) document.getElementById('rbDef').value = o.def;
        if (o.att) document.getElementById('rbAtt').value = o.att;
        if (o.cover) document.getElementById('rbCover').value = o.cover;
        if (o.libero !== undefined) document.getElementById('rbLibero').checked = o.libero;
        if (o.arrows !== undefined) document.getElementById('rbArrows').checked = o.arrows;
        if (o.opponents !== undefined) document.getElementById('rbOpponents').checked = o.opponents;
    }

    /** Imposta le opzioni dalla richiesta scritta; con place=true dispone subito */
    onAsk(place = false) {
        const text = document.getElementById('rbAsk')?.value || '';
        const o = this.parseRequest(text);
        if (!Object.keys(o).length) {
            this.setReport('<div class="tx-ex-warn">Non ho capito la richiesta. Prova con: «P3 ricezione», «difesa P5 metà campo», «tutte le rotazioni in break point».</div>');
            return;
        }
        this.writeOptions(o);
        this.updatePreview();
        if (place) this.onPlace();
        else this.setReport('');
    }

    /** Anteprima (metà campo, prima rotazione/fase scelta) */
    updatePreview() {
        const svg = document.getElementById('rbPreview');
        if (!svg) return;
        const o = this.readOptions();
        this.syncControls(o);
        const r = o.rotation === 'ALL' ? 1 : parseInt(o.rotation, 10);
        const first = this.boardsFor(o)[0];
        const phase = first.ph;
        const bo = { ...o, ...first.v };
        const players = this.positions(phase, r, bo);
        const prevSpec = this.prevOf(phase, bo);
        const X = (u) => u * 100, Y = (v) => v * 100;
        let s = `<rect x="0" y="0" width="100" height="100" class="rb-court"/>
            <line x1="0" y1="${Y(1 / 3)}" x2="100" y2="${Y(1 / 3)}" class="rb-line"/>
            <line x1="-8" y1="0" x2="108" y2="0" class="rb-net"/>`;
        // spostamenti dalla fase precedente
        if (o.arrows && prevSpec) {
            const prev = this.positions(prevSpec[0], r, prevSpec[1]);
            prev.forEach(a => {
                const b = players.find(p => p.role === a.role);
                if (!b || (Math.abs(a.u - b.u) < 0.01 && Math.abs(a.v - b.v) < 0.01)) return;
                s += `<line x1="${X(a.u)}" y1="${Y(a.v)}" x2="${X(b.u)}" y2="${Y(b.v)}" class="rb-move"/>
                      <circle cx="${X(a.u)}" cy="${Y(a.v)}" r="5" class="rb-ghost"/>`;
            });
        }
        players.forEach(p => {
            const c = RotationBoard.ROLE_COLORS[p.kind] || '#3498db';
            s += `<circle cx="${X(p.u)}" cy="${Y(p.v)}" r="6.2" fill="${c}" class="rb-player"/>
                  <text x="${X(p.u)}" y="${Y(p.v) + 2.2}" class="rb-label">${p.label}</text>`;
            if (p.receiver && phase === 'SO_REC') s += `<circle cx="${X(p.u)}" cy="${Y(p.v)}" r="8.4" class="rb-ring"/>`;
            if (p.attacker) s += `<circle cx="${X(p.u)}" cy="${Y(p.v)}" r="8.4" class="rb-ring att"/>`;
        });
        svg.innerHTML = s;
        const title = document.getElementById('rbPreviewTitle');
        if (title) title.textContent = `P${r} · ${this.boardLabel(phase, bo)}`;
        const desc = document.getElementById('rbDesc');
        if (desc) desc.textContent = this.boardDesc(phase, bo);
        const check = document.getElementById('rbCheck');
        if (check) {
            if (phase === 'SO_REC' || phase === 'BP_START' || phase === 'ZONE') {
                const f = this.overlapFaults(players);
                check.innerHTML = f.length
                    ? `<span class="rb-bad">⚠ ${f.map(x => this.escape(x)).join('; ')}</span>`
                    : '<span class="rb-ok">✓ Posizioni regolari (nessun fallo di posizione)</span>';
            } else check.innerHTML = '<span class="rb-muted">Posizioni dopo la battuta: i giocatori sono liberi di spostarsi</span>';
        }
    }

    phaseList(phase) {
        if (phase === 'ALL') return RotationBoard.PHASES.map(p => p.key);
        if (phase === 'BP_ALL') return RotationBoard.PHASES.filter(p => p.group === 'BP').map(p => p.key);
        if (phase === 'SO_ALL') return RotationBoard.PHASES.filter(p => p.group === 'SO').map(p => p.key);
        return [phase];
    }

    /** Mostra solo le scelte che servono per la fase */
    syncControls(o) {
        const ph = this.phaseList(o.phase);
        const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
        show('rbRecWrap', ph.includes('SO_REC'));
        show('rbDefWrap', ph.includes('BP_DEF') || ph.includes('BP_COUNTER'));
        show('rbAttWrap', ph.includes('BP_DEF') && o.def !== 'BASE');
        show('rbCoverWrap', ph.includes('SO_COVER'));
    }

    /** Tutte le disposizioni richieste per una rotazione: [{ ph, v: { rec, def, att, cover } }] */
    boardsFor(o) {
        const all = (sel, list) => sel === 'ALL' ? list.map(x => x.key) : [sel];
        const out = [];
        this.phaseList(o.phase).forEach(ph => {
            if (ph === 'SO_REC') all(o.rec, RotationBoard.REC_SYSTEMS).forEach(rec => out.push({ ph, v: { rec } }));
            else if (ph === 'SO_ATT') out.push({ ph, v: { rec: o.rec === 'ALL' ? 'R3' : o.rec } });
            else if (ph === 'BP_DEF') all(o.def, RotationBoard.DEF_SYSTEMS).forEach(def => {
                if (def === 'BASE') out.push({ ph, v: { def } });
                else all(o.att, RotationBoard.ATTACKS).forEach(att => out.push({ ph, v: { def, att } }));
            });
            else if (ph === 'BP_COUNTER') {
                const def = o.def === 'ALL' ? 'BASE' : o.def;
                out.push({ ph, v: { def, att: o.att === 'ALL' ? 'R' : o.att } });
            }
            else if (ph === 'SO_COVER') all(o.cover, RotationBoard.COVERS).forEach(cover => out.push({ ph, v: { cover } }));
            else out.push({ ph, v: {} });
        });
        return out;
    }

    onPlace() {
        const o = this.readOptions();
        const rotations = o.rotation === 'ALL' ? [1, 6, 5, 4, 3, 2] : [parseInt(o.rotation, 10)];
        const per = this.boardsFor(o);
        const boards = [];
        rotations.forEach(r => per.forEach(b => boards.push({ r, ph: b.ph, v: b.v })));
        if (boards.length > 40 && !window.confirm(`Verranno create ${boards.length} schede (una per disposizione). Continuare?`)) return;
        if (boards.length > 1 && !o.newTab) o.newTab = true; // più disposizioni: una scheda ciascuna
        boards.forEach(b => this.place(b.r, b.ph, { ...o, ...b.v }));
        const names = boards.map(b => `P${b.r} · ${this.boardLabel(b.ph, { ...o, ...b.v })}`);
        const shown = names.length > 12 ? names.slice(0, 12).join(', ') + ` … (+${names.length - 12})` : names.join(', ');
        this.setReport(`<div class="tx-ex-ok">✅ ${boards.length === 1 ? 'Disposizione creata' : boards.length + ' disposizioni create, una per scheda'}: ${this.escape(shown)}.
            Puoi spostare i giocatori, salvare in libreria o condividere il link.</div>`);
    }

    // ============================================================
    // DISEGNO SULLA LAVAGNA
    // ============================================================
    playerColor(label, kind, opponent) {
        if (opponent) return RotationBoard.OPP_COLOR;
        return RotationBoard.ROLE_COLORS[kind] || '#3498db';
    }

    /** Da (u,v) della metà campo di una squadra a (u,v) del campo disegnato */
    courtUV(courtType, uv, opponent) {
        if (courtType === 'half-court') return { u: uv.u, v: uv.v };
        // Campo intero (verticale): la nostra squadra sotto (rete a v=0.5), gli avversari sopra, specchiati
        if (opponent) return { u: 1 - uv.u, v: 0.5 - uv.v / 2 };
        return { u: uv.u, v: 0.5 + uv.v / 2 };
    }

    place(r, phase, o) {
        const ed = this.editor;
        const tx = ed.textExerciseManager;
        if (o.newTab && ed.getCurrentTab().objects.size > 0) ed.addNewTab();
        else if (ed.noDocs) ed.setNoDocs(false);
        const tab = ed.getCurrentTab();
        if (!tab.history || tab.history.length === 0) ed.saveState('Prima della lavagna');

        const label = this.boardLabel(phase, o);
        const courtType = o.court === 'half' ? 'half-court' : 'court';
        const prevSpec = o.arrows ? this.prevOf(phase, o) : null;
        const players = this.positions(phase, r, o);

        ed._restoringState = true;
        try {
            const court = tx.placeCourt(courtType, o.horizontal);
            if (courtType === 'half-court') tx.placeNet(court);
            const size = ed.getDefaultSize('player');
            const toCanvas = (p, opponent) => tx.toCanvas(court, this.courtUV(courtType, { u: p.u, v: p.v }, opponent));
            const add = (p, at, color, dashed) => ed.addObject('player', at.x - size.width / 2, at.y - size.height / 2, color, p.label, 0, dashed);

            // Fase precedente: copie semitrasparenti e tratteggiate + frecce
            const prev = prevSpec ? this.positions(prevSpec[0], r, prevSpec[1]) : null;
            const placed = [];
            players.forEach(p => {
                const at = toCanvas(p, false);
                const color = this.playerColor(p.label, p.kind, false);
                const obj = add(p, at, color, false);
                placed.push({ p, obj, at });
            });
            if (prev) {
                prev.forEach(a => {
                    const b = placed.find(x => x.p.role === a.role);
                    if (!b || (Math.abs(a.u - b.p.u) < 0.01 && Math.abs(a.v - b.p.v) < 0.01)) return;
                    const at = toCanvas(a, false);
                    const ghost = add(a, at, b.obj.color, true);
                    ghost.opacity = 0.4;
                    ed.renderObject(ghost);
                    ed.createArrow(tx.endpoint({ obj: ghost, pos: at }, b.at), tx.endpoint({ obj: b.obj, pos: b.at }, at),
                        'linear', true, '#2c3e50', 2);
                });
            }

            // Palla a chi batte
            const ballNear = (at) => {
                const s = ed.getDefaultSize('ball');
                ed.addObject('ball', at.x + 14, at.y - 14 - s.height, '#f1c40f', '', 0, false);
            };
            const server = placed.find(x => x.p.server);
            if (server) ballNear(server.at);

            // Squadra avversaria (solo campo intero)
            if (o.opponents && courtType === 'court') {
                const oppPhase = RotationBoard.OPPONENT_PHASE[phase];
                this.positions(oppPhase, r, { ...o, rec: 'R3', def: 'BASE' }).forEach(p => {
                    const at = toCanvas(p, true);
                    add(p, at, this.playerColor(p.label, p.kind, true), false);
                    if (p.server) ballNear(at);
                });
            }

            // Step: disposizione e ruoli
            const zoneTxt = (p) => {
                const who = p.kind === 'L' ? `L (libero, al posto di ${p.replaced})` : `${p.label} (${RotationBoard.ROLE_NAMES[p.kind]})`;
                return `${who} zona ${p.zone}${p.server ? ', in battuta' : ''}${p.receiver && phase === 'SO_REC' ? ', riceve' : ''}${p.attacker ? ', attacca' : ''}`;
            };
            const steps = [
                { text: `Rotazione P${r}: palleggiatore in zona ${r}. ${label}.`, name: 'Rotazione e fase' },
                { text: this.boardDesc(phase, o), name: 'Sistema' },
                { text: 'Disposizione: ' + players.map(zoneTxt).join(', '), name: 'Disposizione' }
            ];
            if (prev) steps.push({ text: `Gli spostamenti partono da «${this.boardLabel(prevSpec[0], prevSpec[1])}» (posizioni tratteggiate).`, name: 'Spostamenti' });
            if (phase === 'SO_REC' || phase === 'BP_START' || phase === 'ZONE') {
                const f = this.overlapFaults(players);
                steps.push({ text: f.length ? 'Attenzione: ' + f.join('; ') : 'Posizioni regolari al momento della battuta (nessun fallo di posizione).', name: 'Regole di posizione' });
            }
            steps.forEach((s, i) => tab.exerciseSteps.push({ id: `step-${Date.now()}-${i}`, text: s.text, name: s.name, timestamp: new Date(), tags: [] }));
            if (!tab.descrizione) {
                tab.descrizione = `Rotazione P${r} — ${label} (sistema 5-1${o.libero ? ' con libero' : ''}). ${this.boardDesc(phase, o)}`;
                const d = document.getElementById('workoutDescrizione');
                if (d) d.value = tab.descrizione;
            }
        } finally {
            ed._restoringState = false;
        }
        this.renameTab(`P${r} · ${label.replace(/^(Break point|Side out) · /, '')}`);
        ed.renderStepsList?.();
        ed.saveState('Lavagna: P' + r + ' ' + label);
        ed.updateUI?.();
    }

    renameTab(name) {
        const ed = this.editor;
        ed.updateTabName(ed.activeTabId, name);
        const input = document.querySelector(`.tab[data-tab-id="${ed.activeTabId}"] .tab-title`);
        if (input) input.value = name;
        const title = document.getElementById('schemaTitle');
        if (title) title.value = name;
    }
}

window.RotationBoard = RotationBoard;
