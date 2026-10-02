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
        { key: 'SO_ATT', group: 'SO', label: 'Side out · Attacco dopo la ricezione', short: 'Side out · Attacco', from: 'SO_REC' }
    ];

    // Fase della squadra avversaria (campo intero) mentre la nostra è nella fase indicata
    static OPPONENT_PHASE = { ZONE: 'ZONE', BP_START: 'SO_REC', BP_DEF: 'SO_ATT', BP_COUNTER: 'BP_DEF', SO_REC: 'BP_START', SO_ATT: 'BP_DEF' };

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
                const t = RotationBoard.RECEPTION[r];
                players.forEach(p => set(p, t[p.role]));
                break;
            }
            case 'BP_DEF':
                players.forEach(p => set(p, this.defenseUV(p)));
                break;
            case 'BP_COUNTER':
            case 'SO_ATT':
                players.forEach(p => set(p, this.attackUV(p)));
                break;
        }
        return players;
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
        if (has(/tutte le fasi|ogni fase/)) o.phase = bp && !so ? 'BP_ALL' : so && !bp ? 'SO_ALL' : 'ALL';
        else if (has(/contrattacc|transizion/) || (bp && has(/\battacc/))) o.phase = 'BP_COUNTER';
        else if (has(/\bmur[oi]\b|difes/)) o.phase = 'BP_DEF';
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
        const html = `
<div class="tx-ex wg rb">
    <p class="tx-ex-help">
        Dispone i 6 giocatori (sistema 5-1: <b>P</b> palleggiatore, <b>O</b> opposto, <b>S1 S2</b> schiacciatori,
        <b>C1 C2</b> centrali, <b>L</b> libero) per ogni <b>rotazione</b> (P1…P6, dalla zona del palleggiatore)
        e ogni <b>fase</b>: partenza, break point (battuta, muro e difesa, contrattacco) e side out (ricezione, attacco).
        Puoi anche chiederlo a parole.
    </p>
    <div class="rb-ask">
        <input type="text" id="rbAsk" class="wg-input" placeholder="es. P3 ricezione a metà campo · tutte le rotazioni in break point · difesa P5 con avversari">
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
        root.querySelectorAll('#rbRotation, #rbPhase, #rbLibero, input[name="rbCourt"]').forEach(el =>
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
        const r = o.rotation === 'ALL' ? 1 : parseInt(o.rotation, 10);
        const phase = this.phaseList(o.phase)[0];
        const players = this.positions(phase, r, o);
        const def = RotationBoard.PHASES.find(p => p.key === phase);
        const X = (u) => u * 100, Y = (v) => v * 100;
        let s = `<rect x="0" y="0" width="100" height="100" class="rb-court"/>
            <line x1="0" y1="${Y(1 / 3)}" x2="100" y2="${Y(1 / 3)}" class="rb-line"/>
            <line x1="-8" y1="0" x2="108" y2="0" class="rb-net"/>`;
        // spostamenti dalla fase precedente
        if (o.arrows && def.from) {
            const prev = this.positions(def.from, r, o);
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
        });
        svg.innerHTML = s;
        const title = document.getElementById('rbPreviewTitle');
        if (title) title.textContent = `P${r} · ${def.label}`;
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

    onPlace() {
        const o = this.readOptions();
        const rotations = o.rotation === 'ALL' ? [1, 6, 5, 4, 3, 2] : [parseInt(o.rotation, 10)];
        const phases = this.phaseList(o.phase);
        const boards = [];
        rotations.forEach(r => phases.forEach(ph => boards.push({ r, ph })));
        if (boards.length > 1 && !o.newTab) o.newTab = true; // più disposizioni: una scheda ciascuna
        boards.forEach(b => this.place(b.r, b.ph, o));
        const names = boards.map(b => `P${b.r} · ${RotationBoard.PHASES.find(p => p.key === b.ph).short}`);
        this.setReport(`<div class="tx-ex-ok">✅ ${boards.length === 1 ? 'Disposizione creata' : boards.length + ' disposizioni create, una per scheda'}: ${this.escape(names.join(', '))}.
            Puoi spostare i giocatori e salvare lo schema nella libreria.</div>`);
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

        const def = RotationBoard.PHASES.find(p => p.key === phase);
        const courtType = o.court === 'half' ? 'half-court' : 'court';
        const players = this.positions(phase, r, o);

        ed._restoringState = true;
        try {
            const court = tx.placeCourt(courtType, o.horizontal);
            if (courtType === 'half-court') tx.placeNet(court);
            const size = ed.getDefaultSize('player');
            const toCanvas = (p, opponent) => tx.toCanvas(court, this.courtUV(courtType, { u: p.u, v: p.v }, opponent));
            const add = (p, at, color, dashed) => ed.addObject('player', at.x - size.width / 2, at.y - size.height / 2, color, p.label, 0, dashed);

            // Fase precedente: copie semitrasparenti e tratteggiate + frecce
            const prev = o.arrows && def.from ? this.positions(def.from, r, o) : null;
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
                this.positions(oppPhase, r, o).forEach(p => {
                    const at = toCanvas(p, true);
                    add(p, at, this.playerColor(p.label, p.kind, true), false);
                    if (p.server) ballNear(at);
                });
            }

            // Step: disposizione e ruoli
            const zoneTxt = (p) => {
                const who = p.kind === 'L' ? `L (libero, al posto di ${p.replaced})` : `${p.label} (${RotationBoard.ROLE_NAMES[p.kind]})`;
                return `${who} zona ${p.zone}${p.server ? ', in battuta' : ''}`;
            };
            const steps = [
                { text: `Rotazione P${r}: palleggiatore in zona ${r}. ${def.label}.`, name: 'Rotazione e fase' },
                { text: 'Disposizione: ' + players.map(zoneTxt).join(', '), name: 'Disposizione' }
            ];
            if (prev) steps.push({ text: `Gli spostamenti partono dalla fase «${RotationBoard.PHASES.find(p => p.key === def.from).label}» (posizioni tratteggiate).`, name: 'Spostamenti' });
            if (phase === 'SO_REC' || phase === 'BP_START' || phase === 'ZONE') {
                const f = this.overlapFaults(players);
                steps.push({ text: f.length ? 'Attenzione: ' + f.join('; ') : 'Posizioni regolari al momento della battuta (nessun fallo di posizione).', name: 'Regole di posizione' });
            }
            steps.forEach((s, i) => tab.exerciseSteps.push({ id: `step-${Date.now()}-${i}`, text: s.text, name: s.name, timestamp: new Date(), tags: [] }));
            if (!tab.descrizione) {
                tab.descrizione = `Rotazione P${r} — ${def.label} (sistema 5-1${o.libero ? ' con libero' : ''}).`;
                const d = document.getElementById('workoutDescrizione');
                if (d) d.value = tab.descrizione;
            }
        } finally {
            ed._restoringState = false;
        }
        this.renameTab(`P${r} · ${def.short}`);
        ed.renderStepsList?.();
        ed.saveState('Lavagna: P' + r + ' ' + def.short);
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
