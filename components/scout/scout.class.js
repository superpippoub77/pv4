/**
 * ScoutManager — "Scout partita" in stile DataVolley (fase 1)
 *
 * - Formazioni delle due squadre (casa dalla rosa), rotazioni P1…P6, libero al posto del
 *   centrale in seconda linea, palleggiatore.
 * - Campo con le 6 zone per squadra: in ogni zona numero, nome e ruolo del giocatore.
 * - Clic sul giocatore → arco a 6 spicchi con le valutazioni DataVolley  = / - ! + #
 *   (= errore, rosso … # perfetto/punto, verde). Il fondamentale lo deduce la fase dell'azione:
 *   battuta → ricezione → alzata (arco automatico sul palleggiatore) → attacco → muro/difesa…
 *   Pressione lunga (o tasto destro) sul giocatore, o clic sul centro dell'arco, per cambiarlo.
 * - Da 1 a 3 tocchi per squadra (il muro non conta), punteggio, break point / cambio palla e
 *   rotazione automatici; fine set a 25 (15 al 5°) con due punti di scarto.
 * - Registro dei codici DataVolley (es. *7RH#, a12AH+, *p03:02, *z6, **1set), Annulla,
 *   scorciatoie da tastiera e inserimento dei codici scritti a mano.
 * - Lo scout è salvato nello schema (scheda) con il resto del lavoro: tab.scout.
 *
 * Fasi successive: zone d'arrivo (terzo clic), tipi di battuta/attacco, statistiche, CSV, .dvw.
 */
class ScoutManager {
    constructor(editor) {
        this.editor = editor;
        this.dialog = null;
        this.tab = null;
        this.state = null;
        this.undoStack = [];
        this.view = 'match';
        this.forceSkill = null;   // fondamentale scelto a mano per la prossima azione
        this.arc = null;          // arco aperto: { el, team, num, skill, auto }
        this.active = false;      // ultima interazione dentro la finestra (per le scorciatoie)
        this._keysBound = false;
    }

    static TEAMS = ['home', 'away'];
    static SKILLS = { S: 'Battuta', R: 'Ricezione', E: 'Alzata', A: 'Attacco', B: 'Muro', D: 'Difesa', F: 'Free ball' };
    static SKILL_ORDER = ['S', 'R', 'E', 'A', 'B', 'D', 'F'];
    static EVALS = ['=', '/', '-', '!', '+', '#'];
    static EVAL_COLORS = { '=': '#d63031', '/': '#e8743b', '-': '#f0a830', '!': '#c9c23a', '+': '#7fbf4d', '#': '#27ae60' };
    static EVAL_LABELS = {
        S: { '=': 'Errore', '/': 'Positiva, palla rigiocata facile', '-': 'Negativa (ricezione perfetta)', '!': 'Media', '+': 'Positiva', '#': 'Ace (punto)' },
        R: { '=': 'Errore (ace subito)', '/': 'Sovrapassaggio', '-': 'Negativa', '!': 'Media', '+': 'Positiva', '#': 'Perfetta' },
        E: { '=': 'Errore', '/': 'Sovrapassaggio', '-': 'Scarsa', '!': 'Media', '+': 'Buona', '#': 'Perfetta' },
        A: { '=': 'Errore', '/': 'Murato (punto avversario)', '-': 'Negativo', '!': 'Coperto dopo il muro', '+': 'Positivo', '#': 'Punto' },
        B: { '=': 'Errore', '/': 'Invasione', '-': 'Toccato, palla agli avversari', '!': 'Rimbalzo, gli avversari ricostruiscono', '+': 'Positivo, palla per noi', '#': 'Punto' },
        D: { '=': 'Errore', '/': 'Sovrapassaggio', '-': 'Negativa', '!': 'Media', '+': 'Positiva', '#': 'Perfetta' },
        F: { '=': 'Errore', '/': 'Sovrapassaggio', '-': 'Negativa', '!': 'Media', '+': 'Positiva', '#': 'Perfetta' }
    };
    // Tipo di colpo nel codice (fase 1: sempre H; i tipi arriveranno nella fase 2)
    static DEFAULT_TYPE = 'H';
    static ROLES = [
        { v: 'P', l: 'P · Palleggiatore' }, { v: 'S', l: 'S · Schiacciatore' },
        { v: 'O', l: 'O · Opposto' }, { v: 'C', l: 'C · Centrale' }
    ];
    static ROLE_NAMES = { P: 'Palleggiatore', S: 'Schiacciatore', O: 'Opposto', C: 'Centrale', L: 'Libero' };
    static ROLE_COLORS = { P: '#f39c12', O: '#8e44ad', S: '#2980b9', C: '#c0392b', L: '#16a085' };
    // Formazione in P1 (zone 1…6), sistema 5-1, con i ruoli della rosa
    static LINEUP_P1 = ['P', 'S1', 'C2', 'O', 'S2', 'C1'];
    // Disposizione delle zone: squadra a sinistra (rete a destra) e a destra (rete a sinistra)
    static GRID_LEFT = [[5, 4], [6, 3], [1, 2]];
    static GRID_RIGHT = [[2, 1], [3, 6], [4, 5]];

    // ============================================================
    // MODELLO
    // ============================================================
    static other(t) { return t === 'home' ? 'away' : 'home'; }
    static prefix(t) { return t === 'home' ? '*' : 'a'; }
    static pad(n) { return String(n).padStart(2, '0'); }
    static roleKind(role) {
        const r = String(role || '').toUpperCase();
        if (r.startsWith('L')) return 'L';
        if (r.startsWith('P')) return 'P';
        if (r.startsWith('C') && !r.startsWith('CO')) return 'C';
        if (r.startsWith('O')) return 'O';
        if (r.startsWith('S')) return 'S';
        return '';
    }

    newState() {
        const emptyTeam = (name, roles) => ({
            name,
            lineup: roles.map(role => ({ num: '', name: '', role })),
            liberi: [{ num: '', name: '' }, { num: '', name: '' }]
        });
        const roles = ['P', 'S', 'C', 'O', 'S', 'C'];
        return {
            v: 1,
            teams: { home: emptyTeam('Casa', roles), away: emptyTeam('Ospiti', roles) },
            firstServe: 'home',
            set: 1,
            sets: [],
            setsWon: { home: 0, away: 0 },
            score: { home: 0, away: 0 },
            serving: 'home',
            rot: { home: [], away: [] },
            rally: { team: 'home', touches: 0, expect: 'S' },
            stats: { home: { bp: 0, so: 0 }, away: { bp: 0, so: 0 } },
            log: [],
            started: false,
            needLineup: true,
            over: false,
            swap: false
        };
    }

    player(team, num) {
        const T = this.state.teams[team];
        const n = String(num);
        const p = T.lineup.find(x => String(x.num) === n);
        if (p) return { num: p.num, name: p.name, role: p.role, kind: ScoutManager.roleKind(p.role) };
        const l = T.liberi.find(x => x.num !== '' && String(x.num) === n);
        if (l) return { num: l.num, name: l.name, role: 'L', kind: 'L' };
        return { num, name: '', role: '', kind: '' };
    }

    setterNum(team) {
        const p = this.state.teams[team].lineup.find(x => ScoutManager.roleKind(x.role) === 'P');
        return p ? String(p.num) : null;
    }

    activeLibero(team) {
        const l = this.state.teams[team].liberi.find(x => x.num !== '' && x.num != null);
        return l ? String(l.num) : null;
    }

    /** Zona (1…6) del palleggiatore = rotazione P1…P6 */
    rotationOf(team) {
        const s = this.setterNum(team);
        const i = this.state.rot[team].findIndex(n => String(n) === s);
        return i >= 0 ? i + 1 : null;
    }

    /** Giocatori in campo per zona (1…6), con il libero al posto del centrale di seconda linea */
    onCourt(team) {
        const st = this.state;
        const lib = this.activeLibero(team);
        const out = {};
        st.rot[team].forEach((num, i) => {
            const zone = i + 1;
            const p = this.player(team, num);
            let shown = p, replaced = null;
            const back = zone === 1 || zone === 5 || zone === 6;
            // il centrale batte; il libero entra in zona 1 solo quando la squadra non è al servizio
            if (lib && back && p.kind === 'C' && !(zone === 1 && st.serving === team)) {
                shown = this.player(team, lib);
                replaced = p;
            }
            out[zone] = { ...shown, zone, replaced };
        });
        return out;
    }

    /** Fondamentale atteso per un giocatore della squadra indicata */
    deduceSkill(team, num) {
        const r = this.state.rally;
        if (r.expect === 'S') {
            return team === this.state.serving ? 'S' : 'R';
        }
        if (team === r.team) return r.expect;
        // palla dall'altra parte: il rally è andato avanti senza registrare un tocco
        return 'D';
    }

    // ============================================================
    // AZIONI
    // ============================================================
    pushUndo() {
        this.undoStack.push(JSON.stringify(this.state));
        if (this.undoStack.length > 400) this.undoStack.shift();
    }

    undo() {
        this.closeArc();
        const prev = this.undoStack.pop();
        if (!prev) { this.flash('Niente da annullare'); return; }
        this.state = JSON.parse(prev);
        this.persist();
        this.render();
        this.flash('Annullato');
    }

    addLog(entry) {
        const st = this.state;
        st.log.push({ ...entry, set: st.set, h: st.score.home, a: st.score.away });
    }

    /** Registra un tocco: squadra, numero, fondamentale, valutazione */
    record(team, num, skill, ev) {
        const st = this.state;
        if (!st.started || st.needLineup || st.over) return;
        if (!ScoutManager.EVALS.includes(ev) || !ScoutManager.SKILLS[skill]) return;
        this.pushUndo();
        const code = `${ScoutManager.prefix(team)}${num}${skill}${ScoutManager.DEFAULT_TYPE}${ev}`;
        this.addLog({ k: 'a', code, team, num: String(num), skill, ev });
        this.forceSkill = null;

        const res = this.resolve(team, skill, ev);
        if (res.point) this.awardPoint(res.point);
        else st.rally = { team: res.team, touches: res.touches, expect: res.expect };
        this.persist();
        this.render();

        // alzata automatica sul palleggiatore
        const r = st.rally;
        if (!res.point && r.expect === 'E' && !st.needLineup) {
            const setter = this.setterNum(r.team);
            const onCourt = Object.values(this.onCourt(r.team)).some(p => String(p.num) === setter);
            if (setter && onCourt && !(team === r.team && String(num) === setter)) {
                setTimeout(() => this.openEvalArc(r.team, setter, 'E', true), 90);
            }
        }
    }

    /** Esito di un tocco: punto (squadra) oppure chi ha la palla, quanti tocchi, prossimo fondamentale */
    resolve(team, skill, ev) {
        const opp = ScoutManager.other(team);
        const r = this.state.rally;
        if (ev === '=') return { point: opp };
        if (ev === '#' && (skill === 'S' || skill === 'A' || skill === 'B')) return { point: team };
        if (ev === '/' && (skill === 'A' || skill === 'B')) return { point: opp };
        const over = { team: opp, touches: 0, expect: 'D' };
        switch (skill) {
            case 'S': return { team: opp, touches: 0, expect: 'R' };
            case 'A': return ev === '!' ? { team, touches: 0, expect: 'D' } : over;
            case 'B': // il muro non conta come tocco
                return ev === '+' ? { team, touches: 0, expect: 'D' } : over;
            default: { // R, D, F, E
                if (ev === '/') return over; // sovrapassaggio
                const t = (r.team === team ? r.touches : 0) + 1;
                if (t >= 3) return over;     // terzo tocco: la palla passa di là
                if (skill === 'E') return { team, touches: t, expect: 'A' };
                return { team, touches: t, expect: t === 1 ? 'E' : 'A' };
            }
        }
    }

    awardPoint(winner, manual = false) {
        const st = this.state;
        if (manual) this.pushUndo();
        st.score[winner]++;
        const sideOut = winner !== st.serving;
        if (sideOut) st.stats[winner].so++; else st.stats[winner].bp++;
        this.addLog({ k: 'p', code: `${ScoutManager.prefix(winner)}p${ScoutManager.pad(st.score.home)}:${ScoutManager.pad(st.score.away)}`, team: winner, so: sideOut, manual });
        if (sideOut) {
            // cambio palla: la squadra che conquista il servizio ruota
            const a = st.rot[winner];
            st.rot[winner] = a.slice(1).concat(a.slice(0, 1));
            st.serving = winner;
            const z = this.rotationOf(winner);
            if (z) this.addLog({ k: 'z', code: `${ScoutManager.prefix(winner)}z${z}`, team: winner });
        }
        st.rally = { team: st.serving, touches: 0, expect: 'S' };
        this.checkSetEnd();
    }

    checkSetEnd() {
        const st = this.state;
        const target = st.set >= 5 ? 15 : 25;
        const h = st.score.home, a = st.score.away;
        if (Math.max(h, a) < target || Math.abs(h - a) < 2) return;
        const w = h > a ? 'home' : 'away';
        st.sets.push({ home: h, away: a });
        st.setsWon[w]++;
        this.addLog({ k: 's', code: `**${st.set}set`, team: w });
        if (st.setsWon[w] >= 3) {
            st.over = true;
            this.flash(`Partita finita: ${st.teams[w].name} vince ${st.setsWon[w]}-${st.setsWon[ScoutManager.other(w)]}`);
            return;
        }
        st.set++;
        st.score = { home: 0, away: 0 };
        st.firstServe = ScoutManager.other(st.firstServe);
        st.needLineup = true;
        this.flash(`Fine set: ${h}-${a}. Controlla le formazioni del set ${st.set} e premi «Inizia set».`);
        this.view = 'lineup';
    }

    manualPoint(team) {
        const st = this.state;
        if (!st.started || st.needLineup || st.over) return;
        this.closeArc();
        this.awardPoint(team, true);
        this.persist();
        this.render();
    }

    /** Codice scritto a mano: [*|a]numero[fondamentale][tipo]valutazione, oppure *p / ap */
    submitCode(text) {
        const st = this.state;
        const s = String(text || '').trim();
        if (!s) return false;
        const pm = s.match(/^([*aA])p$/);
        if (pm) { this.manualPoint(pm[1] === '*' ? 'home' : 'away'); return true; }
        const m = s.match(/^([*aA])?(\d{1,2})([SREABDFsreabdf])?([HMQTUNOhmqtuno])?([=\/\-!+#])$/);
        if (!m) { this.flash('Codice non riconosciuto (es. *7RH#, a12A+, 9#)'); return false; }
        if (!st.started || st.needLineup || st.over) { this.flash('Prima imposta le formazioni e inizia il set'); return false; }
        const num = String(parseInt(m[2], 10));
        let team = m[1] ? (m[1] === '*' ? 'home' : 'away') : null;
        if (!team) {
            const inH = Object.values(this.onCourt('home')).some(p => String(p.num) === num);
            const inA = Object.values(this.onCourt('away')).some(p => String(p.num) === num);
            const pref = st.rally.expect === 'S' ? st.serving : st.rally.team;
            team = (inH && inA) || (!inH && !inA) ? pref : (inH ? 'home' : 'away');
        }
        const skill = m[3] ? m[3].toUpperCase() : (this.forceSkill || this.deduceSkill(team, num));
        this.closeArc();
        this.record(team, num, skill, m[5]);
        return true;
    }

    persist() {
        if (this.tab) this.tab.scout = this.state;
    }

    // ============================================================
    // FORMAZIONI
    // ============================================================
    /** Squadre tra cui scegliere: la rosa (Squadra) e quelle dell'archivio */
    pickerTeams() {
        const tm = this.editor.teamManager;
        if (tm && tm.getPickerTeams) return tm.getPickerTeams();
        return [{ id: '__rosa__', name: 'La mia rosa (Squadra)', players: tm?.teamPlayers || this.editor.teamPlayers || [] }];
    }

    /** id della squadra d'origine dei giocatori di un lato (casa = rosa se non scelto) */
    sourceId(t) {
        const T = this.state.teams[t];
        if (T.sourceId === undefined) return t === 'home' ? '__rosa__' : '';
        return T.sourceId;
    }

    sourcePlayers(t) {
        const id = this.sourceId(t);
        if (!id) return [];
        const team = this.pickerTeams().find(x => x.id === id);
        return team ? (team.players || []) : [];
    }

    /** Formazione della casa dalla rosa (Squadra), con il palleggiatore nella zona della rotazione */
    fromRoster(rotation) { return this.fromTeam('home', rotation); }

    /** Formazione di una squadra dai suoi giocatori (rosa o archivio), palleggiatore nella zona della rotazione */
    fromTeam(t, rotation) {
        const roster = this.sourcePlayers(t);
        if (!roster.length) { this.flash(this.sourceId(t) ? 'La squadra scelta non ha giocatori' : 'Scegli prima la squadra (rosa o archivio)'); return; }
        const used = new Set();
        const pick = (roles) => {
            for (const r of roles) {
                const p = roster.find(x => x.role === r && !used.has(x));
                if (p) { used.add(p); return p; }
            }
            return null;
        };
        const alt = { P: ['P1', 'P2'], S1: ['S1', 'S2'], S2: ['S2', 'S1'], O: ['O'], C1: ['C1', 'C2'], C2: ['C2', 'C1'] };
        const lineup = new Array(6);
        ScoutManager.LINEUP_P1.forEach((role, i) => {
            const zone = ((i + rotation - 1) % 6) + 1;
            const p = pick(alt[role] || [role]);
            lineup[zone - 1] = { num: p ? String(p.number) : '', name: p ? (p.name || '') : '', role: role.charAt(0) };
        });
        const libs = roster.filter(x => /^L/.test(x.role)).slice(0, 2);
        const T = this.state.teams[t];
        T.lineup = lineup;
        T.liberi = [0, 1].map(i => ({ num: libs[i] ? String(libs[i].number) : '', name: libs[i]?.name || '' }));
        this.renderLineupForm();
    }

    readLineupForm() {
        const root = this.root();
        const st = this.state;
        ScoutManager.TEAMS.forEach(t => {
            const T = st.teams[t];
            T.name = root.querySelector(`[data-f="${t}-name"]`)?.value.trim() || (t === 'home' ? 'Casa' : 'Ospiti');
            for (let z = 1; z <= 6; z++) {
                T.lineup[z - 1] = {
                    num: (root.querySelector(`[data-f="${t}-num-${z}"]`)?.value || '').trim(),
                    name: (root.querySelector(`[data-f="${t}-pname-${z}"]`)?.value || '').trim(),
                    role: root.querySelector(`[data-f="${t}-role-${z}"]`)?.value || 'S'
                };
            }
            T.liberi = [0, 1].map(i => ({
                num: (root.querySelector(`[data-f="${t}-lnum-${i}"]`)?.value || '').trim(),
                name: (root.querySelector(`[data-f="${t}-lname-${i}"]`)?.value || '').trim()
            }));
        });
        st.firstServe = root.querySelector('input[name="scFirstServe"]:checked')?.value || st.firstServe;
    }

    validateLineups() {
        const st = this.state;
        for (const t of ScoutManager.TEAMS) {
            const T = st.teams[t];
            const nums = T.lineup.map(p => p.num);
            if (nums.some(n => !/^\d{1,2}$/.test(n))) return `${T.name}: inserisci il numero (1-99) dei 6 giocatori in campo`;
            if (new Set(nums).size !== 6) return `${T.name}: due giocatori in campo hanno lo stesso numero`;
            const libs = T.liberi.map(l => l.num).filter(Boolean);
            if (libs.some(n => !/^\d{1,2}$/.test(n))) return `${T.name}: numero del libero non valido`;
            if (libs.some(n => nums.includes(n))) return `${T.name}: il libero non può essere tra i 6 in campo`;
        }
        return '';
    }

    startSet() {
        this.readLineupForm();
        const err = this.validateLineups();
        if (err) { this.flash(err); return; }
        this.pushUndo();
        const st = this.state;
        ScoutManager.TEAMS.forEach(t => { st.rot[t] = st.teams[t].lineup.map(p => String(p.num)); });
        st.serving = st.firstServe;
        st.rally = { team: st.serving, touches: 0, expect: 'S' };
        st.started = true;
        st.needLineup = false;
        st.score = { home: 0, away: 0 };
        st.stats = st.stats || { home: { bp: 0, so: 0 }, away: { bp: 0, so: 0 } };
        ScoutManager.TEAMS.forEach(t => {
            const z = this.rotationOf(t);
            if (z) this.addLog({ k: 'z', code: `${ScoutManager.prefix(t)}z${z}`, team: t, start: true });
        });
        this.view = 'match';
        this.persist();
        this.render();
    }

    resetMatch() {
        if (!confirm('Azzerare lo scout della partita? (si può annullare con Annulla)')) return;
        this.pushUndo();
        const keepTeams = JSON.parse(JSON.stringify(this.state.teams));
        this.state = this.newState();
        this.state.teams = keepTeams;
        this.view = 'lineup';
        this.persist();
        this.render();
    }

    /** Ruota le righe del modulo per mettere il palleggiatore nella zona scelta */
    rotateForm(team, target) {
        this.readLineupForm();
        const T = this.state.teams[team];
        const i = T.lineup.findIndex(p => ScoutManager.roleKind(p.role) === 'P');
        if (i < 0) { this.flash('Indica il palleggiatore (ruolo P)'); return; }
        const shift = ((target - 1 - i) % 6 + 6) % 6;
        const out = new Array(6);
        T.lineup.forEach((p, k) => { out[(k + shift) % 6] = p; });
        T.lineup = out;
        this.renderLineupForm();
    }

    // ============================================================
    // UI
    // ============================================================
    root() { return document.getElementById('scoutDialog') || document; }

    show() {
        this.tab = this.editor.getCurrentTab?.() || null;
        this.state = (this.tab && this.tab.scout) ? this.tab.scout : this.newState();
        this.normalize();
        this.undoStack = [];
        if (!this.dialog) this.createDialog();
        this.view = (!this.state.started || this.state.needLineup) ? 'lineup' : 'match';
        this.dialog.showDialog();
        this.active = true;
        this.render();
    }

    hide() {
        this.closeArc();
        this.persist();
        this.dialog?.hideDialog();
        this.active = false;
    }

    normalize() {
        const base = this.newState();
        const st = this.state;
        for (const k of Object.keys(base)) if (st[k] === undefined) st[k] = base[k];
        ScoutManager.TEAMS.forEach(t => {
            st.teams[t] = Object.assign(base.teams[t], st.teams[t] || {});
            st.stats[t] = st.stats[t] || { bp: 0, so: 0 };
        });
    }

    isVisible() {
        const w = document.getElementById('scoutDialog');
        return !!w && w.style.display !== 'none';
    }

    createDialog() {
        const html = `
<div class="scout wg" id="scoutRoot">
    <div class="scout-bar">
        <div class="scout-views">
            <button type="button" class="scout-tabbtn" data-view="match">🏐 Partita</button>
            <button type="button" class="scout-tabbtn" data-view="lineup">📋 Formazioni</button>
        </div>
        <div class="scout-flash" id="scoutFlash"></div>
    </div>
    <div class="scout-view" id="scoutMatch"></div>
    <div class="scout-view" id="scoutLineup"></div>
</div>`;
        this.dialog = createWindow({
            title: 'dlg_title_scout',
            icon: '📊',
            id: 'scoutDialog',
            contentHTML: html,
            effect: 'windows',
            size: 'xl',
            modal: false,
            visible: false,
            onClose: () => { this.closeArc(); this.persist(); this.active = false; },
            buttons: [
                { label: 'btn_close', color: 'secondary', onClick: () => this.hide() }
            ]
        });
        const win = document.getElementById('scoutDialog');
        // finestra grande (il campo deve stare tutto): 92% x 88% dello schermo
        if (!win.classList.contains('phone-full')) {
            const w = Math.min(1320, window.innerWidth * 0.92), h = window.innerHeight * 0.88;
            Object.assign(win.style, { width: w + 'px', height: h + 'px', left: (window.innerWidth - w) / 2 + 'px', top: (window.innerHeight - h) / 2 + 'px' });
        }
        win.addEventListener('click', (e) => {
            const b = e.target.closest('[data-view]');
            if (b) { this.closeArc(); this.closePicker(); if (this.view === 'lineup') this.readLineupForm(); this.view = b.dataset.view; this.render(); }
        });
        this.bindKeys();
    }

    bindKeys() {
        if (this._keysBound) return;
        this._keysBound = true;
        // l'ultima interazione decide se le scorciatoie vanno allo scout o all'editor
        document.addEventListener('pointerdown', (e) => {
            const win = document.getElementById('scoutDialog');
            const inArc = this.arc && this.arc.el.contains(e.target);
            this.active = !!(win && (win.contains(e.target) || inArc));
            if (this.arc && !inArc) this.closeArc();
        }, true);
        window.addEventListener('keydown', (e) => this.onKey(e), true);
    }

    onKey(e) {
        if (!this.isVisible() || !this.active) return;
        const tgt = e.target || {};
        const tag = (tgt.tagName || '').toUpperCase();
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tgt.isContentEditable;
        const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
        const k = e.key;

        if (this.arc) {
            if (ScoutManager.EVALS.includes(k)) { stop(); this.chooseEval(k); return; }
            if (/^[1-6]$/.test(k) && this.arc.mode === 'eval') { stop(); this.chooseEval(ScoutManager.EVALS[+k - 1]); return; }
            const up = k.toUpperCase();
            if (ScoutManager.SKILLS[up] && !e.ctrlKey && !e.metaKey) { stop(); this.changeArcSkill(up); return; }
            if (k === 'Escape') { stop(); this.closeArc(); return; }
            if (k === ' ') { stop(); this.cycleArcSkill(); return; }
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k.toLowerCase() === 'z') {
            if (inInput && tgt.value) return; // annulla del testo nel campo
            stop(); this.undo(); return;
        }
        if (inInput) return;
        if (this.view !== 'match') return;
        const up = k.length === 1 ? k.toUpperCase() : k;
        if (ScoutManager.SKILLS[up] && !e.ctrlKey && !e.metaKey && !e.altKey) {
            stop();
            this.forceSkill = this.forceSkill === up ? null : up;
            this.renderHint();
            return;
        }
        if (k === 'Escape') { stop(); this.forceSkill = null; this.renderHint(); return; }
        if (k === 'Enter' || k === '*' || /^\d$/.test(k)) {
            const inp = this.root().querySelector('#scoutCode');
            if (inp) { stop(); inp.focus(); if (k !== 'Enter') inp.value += k; }
        }
    }

    flash(msg) {
        const el = this.root().querySelector('#scoutFlash');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(this._flashT);
        this._flashT = setTimeout(() => el.classList.remove('show'), 4000);
    }

    esc(s) {
        return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    render() {
        const root = this.root();
        root.querySelectorAll('.scout-tabbtn').forEach(b => b.classList.toggle('active', b.dataset.view === this.view));
        const m = root.querySelector('#scoutMatch'), l = root.querySelector('#scoutLineup');
        if (!m || !l) return;
        m.style.display = this.view === 'match' ? '' : 'none';
        l.style.display = this.view === 'lineup' ? '' : 'none';
        if (this.view === 'match') this.renderMatch(); else this.renderLineupForm();
    }

    // ---------------- Formazioni ----------------
    renderLineupForm() {
        const el = this.root().querySelector('#scoutLineup');
        if (!el) return;
        const st = this.state;
        const teams = this.pickerTeams();
        const datalist = '';
        const team = (t) => {
            const T = st.teams[t];
            const setterZone = (T.lineup.findIndex(p => ScoutManager.roleKind(p.role) === 'P') + 1) || 1;
            const rows = [1, 2, 3, 4, 5, 6].map(z => {
                const p = T.lineup[z - 1] || { num: '', name: '', role: 'S' };
                const roles = ScoutManager.ROLES.map(r => `<option value="${r.v}" ${ScoutManager.roleKind(p.role) === r.v ? 'selected' : ''}>${r.l}</option>`).join('');
                return `<tr><td class="sc-z">Z${z}</td>
                    <td><input class="wg-input sc-num sc-pick" data-f="${t}-num-${z}" value="${this.esc(p.num)}" inputmode="numeric" maxlength="2" autocomplete="off"></td>
                    <td><input class="wg-input sc-pick" data-f="${t}-pname-${z}" value="${this.esc(p.name)}" placeholder="Nome · clic per scegliere" autocomplete="off"></td>
                    <td><select class="wg-input" data-f="${t}-role-${z}">${roles}</select></td></tr>`;
            }).join('');
            const libs = [0, 1].map(i => {
                const l = T.liberi[i] || { num: '', name: '' };
                return `<tr><td class="sc-z">L${i + 1}</td>
                    <td><input class="wg-input sc-num sc-pick" data-f="${t}-lnum-${i}" value="${this.esc(l.num)}" inputmode="numeric" maxlength="2" autocomplete="off"></td>
                    <td colspan="2"><input class="wg-input sc-pick" data-f="${t}-lname-${i}" value="${this.esc(l.name)}" placeholder="Nome del libero · clic per scegliere" autocomplete="off"></td></tr>`;
            }).join('');
            const rot = [1, 6, 5, 4, 3, 2].map(r => `<option value="${r}" ${r === setterZone ? 'selected' : ''}>P${r}</option>`).join('');
            return `<div class="scout-team-form">
                <div class="sc-form-head">
                    <input class="wg-input sc-team-name" data-f="${t}-name" value="${this.esc(T.name)}" placeholder="${t === 'home' ? 'Squadra di casa' : 'Squadra ospite'}">
                    <span class="sc-prefix">${ScoutManager.prefix(t)}</span>
                </div>
                <div class="sc-form-tools">
                    <label>Squadra <select class="wg-input sc-source" data-source="${t}" title="Da dove prendere i giocatori: la tua rosa o una squadra salvata in Squadra → Archivio squadre">
                        <option value="">— nessuna —</option>${teams.map(x => `<option value="${this.esc(x.id)}" ${x.id === this.sourceId(t) ? 'selected' : ''}>${this.esc(x.name)} (${(x.players || []).length})</option>`).join('')}</select></label>
                    <label>Rotazione <select class="wg-input sc-rot" data-rot="${t}">${rot}</select></label>
                    <button type="button" class="btn sc-small" data-roster="${t}" title="Mette in campo P1/P2, S1, S2, O, C1, C2 e i liberi della squadra scelta, con il palleggiatore nella zona della rotazione scelta">👥 Formazione automatica</button>
                </div>
                <table class="sc-form-table"><thead><tr><th>Zona</th><th>N°</th><th>Nome</th><th>Ruolo</th></tr></thead><tbody>${rows}</tbody>
                <tbody class="sc-libs">${libs}</tbody></table>
            </div>`;
        };
        el.innerHTML = `${datalist}
            <p class="tx-ex-help">Formazione di partenza del <b>set ${st.set}</b>: in ogni zona numero, nome e ruolo
            (zona 1 = battitore). Il <b>libero</b> sostituisce il centrale in seconda linea (non batte). La <b>rotazione</b>
            P1…P6 è la zona del palleggiatore: cambiandola le righe ruotano.</p>
            <div class="scout-forms">${team('home')}${team('away')}</div>
            <div class="sc-form-foot">
                <span>Al servizio per primi:</span>
                <label><input type="radio" name="scFirstServe" value="home" ${st.firstServe === 'home' ? 'checked' : ''}> ${this.esc(st.teams.home.name)}</label>
                <label><input type="radio" name="scFirstServe" value="away" ${st.firstServe === 'away' ? 'checked' : ''}> ${this.esc(st.teams.away.name)}</label>
                <span class="sc-grow"></span>
                ${st.started ? `<button type="button" class="btn sc-small" data-act="reset">Azzera partita</button>` : ''}
                <button type="button" class="btn primary sc-start" data-act="start">${st.started && !st.needLineup ? 'Applica e ricomincia il set' : `▶ Inizia set ${st.set}`}</button>
            </div>`;
        el.querySelectorAll('[data-roster]').forEach(b => b.addEventListener('click', () => {
            const t = b.dataset.roster;
            this.readLineupForm();
            const r = parseInt(el.querySelector(`[data-rot="${t}"]`).value, 10) || 1;
            this.fromTeam(t, r);
        }));
        el.querySelectorAll('[data-source]').forEach(sel => sel.addEventListener('change', () => {
            const t = sel.dataset.source;
            this.readLineupForm();
            const T = this.state.teams[t];
            const prev = this.pickerTeams().find(x => x.id === this.sourceId(t));
            T.sourceId = sel.value;
            const team = this.pickerTeams().find(x => x.id === sel.value);
            // il nome della squadra segue la scelta, se non era stato scritto a mano
            const def = t === 'home' ? 'Casa' : 'Ospiti';
            if (team && team.id !== '__rosa__' && (!T.name || T.name === def || (prev && T.name === prev.name))) T.name = team.name;
            this.renderLineupForm();
        }));
        this.bindPlayerPicker(el);
        el.querySelectorAll('[data-rot]').forEach(s => s.addEventListener('change', () => this.rotateForm(s.dataset.rot, parseInt(s.value, 10))));
        el.querySelector('[data-act="start"]')?.addEventListener('click', () => this.startSet());
        el.querySelector('[data-act="reset"]')?.addEventListener('click', () => this.resetMatch());
    }

    /** Elenco a comparsa dei giocatori della squadra scelta, sulle celle numero e nome */
    bindPlayerPicker(el) {
        const parse = (f) => {
            let m = f.match(/^(home|away)-(num|pname)-(\d)$/);
            if (m) return { t: m[1], kind: 'zone', idx: m[3] };
            m = f.match(/^(home|away)-(lnum|lname)-(\d)$/);
            if (m) return { t: m[1], kind: 'lib', idx: m[3] };
            return null;
        };
        const fill = (info, p) => {
            const q = (f) => el.querySelector(`[data-f="${f}"]`);
            if (info.kind === 'zone') {
                const n = q(`${info.t}-num-${info.idx}`); if (n) n.value = p.number === '' || p.number == null ? '' : String(p.number);
                const nm = q(`${info.t}-pname-${info.idx}`); if (nm) nm.value = p.name || '';
                const k = ScoutManager.roleKind(p.role || p.position);
                const r = q(`${info.t}-role-${info.idx}`); if (r && k && k !== 'L') r.value = k;
            } else {
                const n = q(`${info.t}-lnum-${info.idx}`); if (n) n.value = p.number === '' || p.number == null ? '' : String(p.number);
                const nm = q(`${info.t}-lname-${info.idx}`); if (nm) nm.value = p.name || '';
            }
        };
        el.querySelectorAll('input.sc-pick').forEach(inp => {
            const info = parse(inp.dataset.f);
            if (!info) return;
            inp.addEventListener('focus', () => this.openPicker(inp, info, fill));
            inp.addEventListener('click', () => this.openPicker(inp, info, fill));
            inp.addEventListener('input', () => this.openPicker(inp, info, fill, true));
            inp.addEventListener('keydown', (e) => this.pickerKey(e));
            // numero scritto a mano: se è della squadra scelta, completa nome e ruolo
            if (/num/.test(inp.dataset.f)) inp.addEventListener('change', () => {
                const p = this.sourcePlayers(info.t).find(x => String(x.number) === inp.value.trim());
                if (p) fill(info, p);
            });
        });
    }

    openPicker(inp, info, fill, filtering = false) {
        const players = this.sourcePlayers(info.t);
        let pk = this._picker;
        if (!pk) {
            pk = this._picker = document.createElement('div');
            pk.className = 'sc-picker';
            document.body.appendChild(pk);
            pk.addEventListener('mousedown', (e) => e.preventDefault());       // il campo resta attivo
            document.addEventListener('mousedown', (e) => {
                if (this._picker && this._picker.style.display !== 'none' && !this._picker.contains(e.target) && !e.target.closest('input.sc-pick')) this.closePicker();
            });
        }
        this._pickerCtx = { inp, info, fill };
        const T = this.state.teams[info.t];
        const team = this.pickerTeams().find(x => x.id === this.sourceId(info.t));
        // giocatori già messi in questa formazione (letti dal modulo, non ancora salvati)
        const form = this.root().querySelector('#scoutLineup');
        const used = new Set();
        form.querySelectorAll(`input[data-f^="${info.t}-"]`).forEach(i => {
            if (i === inp) return;
            if (/-(num|lnum)-/.test(i.dataset.f) && i.value.trim()) used.add('n' + i.value.trim());
            if (/-(pname|lname)-/.test(i.dataset.f) && i.value.trim()) used.add('m' + i.value.trim().toLowerCase());
        });
        const q = filtering ? inp.value.trim().toLowerCase() : '';
        const isNum = /num/.test(inp.dataset.f);
        let list = players.map(p => ({ p, used: used.has('n' + p.number) || used.has('m' + String(p.name || '').toLowerCase()) }))
            .filter(({ p }) => !q || (isNum ? String(p.number).startsWith(q) : String(p.name || '').toLowerCase().includes(q)));
        // liberi in cima per le righe del libero, poi non usati, poi per numero
        const lib = (p) => ScoutManager.roleKind(p.role) === 'L';
        list.sort((a, b) => (info.kind === 'lib' ? lib(b.p) - lib(a.p) : lib(a.p) - lib(b.p)) || a.used - b.used || (Number(a.p.number) || 999) - (Number(b.p.number) || 999));
        const esc = (v) => this.esc(v);
        pk.innerHTML = !team
            ? `<div class="sc-pk-empty">Scegli la <b>Squadra</b> qui sopra: la tua rosa o una squadra salvata in <b>Squadra → Archivio squadre</b>.</div>`
            : !players.length
                ? `<div class="sc-pk-empty">«${esc(team.name)}» non ha giocatori.</div>`
                : `<div class="sc-pk-head">${esc(team.name)}</div>` + (list.length ? list.map(({ p, used }, i) =>
                    `<div class="sc-pk-item${used ? ' used' : ''}${i === 0 ? ' active' : ''}" data-i="${players.indexOf(p)}">
                        <span class="sc-pk-num">${p.number === '' || p.number == null ? '—' : esc(p.number)}</span>
                        <span class="sc-pk-name">${esc(p.name)}</span>
                        <span class="sc-pk-role">${esc(p.position || p.role || '')}</span>${used ? '<span class="sc-pk-used">già in formazione</span>' : ''}
                    </div>`).join('') : `<div class="sc-pk-empty">Nessun giocatore corrisponde a «${esc(inp.value)}».</div>`);
        pk.querySelectorAll('.sc-pk-item').forEach(it => it.addEventListener('click', () => this.pickPlayer(+it.dataset.i)));
        const r = inp.getBoundingClientRect();
        pk.style.display = 'block';
        const w = Math.max(280, r.width);
        pk.style.width = w + 'px';
        pk.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
        const below = window.innerHeight - r.bottom;
        pk.style.maxHeight = Math.max(160, Math.min(320, Math.max(below, r.top) - 16)) + 'px';
        if (below >= 180 || below >= r.top) { pk.style.top = (r.bottom + 2) + 'px'; pk.style.bottom = ''; }
        else { pk.style.top = ''; pk.style.bottom = (window.innerHeight - r.top + 2) + 'px'; }
    }

    pickPlayer(i) {
        const ctx = this._pickerCtx;
        if (!ctx) return;
        const p = this.sourcePlayers(ctx.info.t)[i];
        if (!p) return;
        ctx.fill(ctx.info, p);
        this.closePicker();
        // passa alla riga successiva (comodo per fare la formazione di seguito)
        const all = Array.from(this.root().querySelectorAll(`#scoutLineup input.sc-pick[data-f^="${ctx.info.t}-"][data-f*="name"]`));
        const cur = all.findIndex(x => x.dataset.f.endsWith(ctx.info.idx) && x.dataset.f.includes(ctx.info.kind === 'zone' ? 'pname' : 'lname'));
        const next = all[cur + 1];
        if (next && !next.value) next.focus(); else ctx.inp.blur();
    }

    pickerKey(e) {
        const pk = this._picker;
        if (!pk || pk.style.display === 'none') return;
        const items = Array.from(pk.querySelectorAll('.sc-pk-item'));
        let i = items.findIndex(x => x.classList.contains('active'));
        if (e.key === 'Escape') { this.closePicker(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!items.length) return;
            i = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items.forEach((x, k) => x.classList.toggle('active', k === i));
            items[i].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && i >= 0 && items[i]) {
            e.preventDefault();
            this.pickPlayer(+items[i].dataset.i);
        } else if (e.key === 'Tab') this.closePicker();
    }

    closePicker() {
        if (this._picker) this._picker.style.display = 'none';
        this._pickerCtx = null;
    }

    // ---------------- Partita ----------------
    renderMatch() {
        const el = this.root().querySelector('#scoutMatch');
        if (!el) return;
        const st = this.state;
        if (!st.started) {
            el.innerHTML = `<div class="sc-empty">Imposta le formazioni delle due squadre e premi <b>Inizia set</b>.
                <br><button type="button" class="btn" data-view="lineup">📋 Formazioni</button></div>`;
            return;
        }
        const left = st.swap ? 'away' : 'home', right = ScoutManager.other(left);
        const setsTxt = st.sets.map(s => `${s.home}-${s.away}`).join(' · ');
        const sb = (t) => `<div class="sc-sb-team ${st.serving === t ? 'serving' : ''}">
                <span class="sc-sb-name">${st.serving === t ? '🏐 ' : ''}${this.esc(st.teams[t].name)}</span>
                <span class="sc-sb-sets" title="Set vinti">${st.setsWon[t]}</span>
                <span class="sc-sb-meta">P${this.rotationOf(t) || '?'} · BP ${st.stats[t].bp} · CP ${st.stats[t].so}</span>
            </div>`;
        el.innerHTML = `
            <div class="sc-scoreboard">
                ${sb(left)}
                <div class="sc-sb-score"><b>${st.score[left]}</b><span>:</span><b>${st.score[right]}</b>
                    <small>Set ${st.set}${setsTxt ? ' · ' + setsTxt : ''}</small></div>
                ${sb(right)}
            </div>
            <div class="sc-hint" id="scoutHint"></div>
            <div class="sc-main">
                <div class="sc-court-wrap">
                    <div class="sc-court" id="scoutCourt">
                        <div class="sc-half" data-team="${left}">${this.halfHTML(left, ScoutManager.GRID_LEFT)}</div>
                        <div class="sc-net"></div>
                        <div class="sc-half" data-team="${right}">${this.halfHTML(right, ScoutManager.GRID_RIGHT)}</div>
                    </div>
                    <div class="sc-tools">
                        <button type="button" class="btn sc-small" data-act="undo" title="Annulla l'ultima registrazione (Ctrl+Z)">↶ Annulla</button>
                        <button type="button" class="btn sc-small" data-act="pt-${left}" title="Punto a ${this.esc(st.teams[left].name)} (es. fallo fischiato)">+1 ${this.esc(st.teams[left].name)}</button>
                        <button type="button" class="btn sc-small" data-act="pt-${right}" title="Punto a ${this.esc(st.teams[right].name)}">+1 ${this.esc(st.teams[right].name)}</button>
                        <button type="button" class="btn sc-small" data-act="swap" title="Scambia i lati del campo">⇄ Campo</button>
                        <span class="sc-skills">${ScoutManager.SKILL_ORDER.map(s => `<button type="button" class="sc-skill" data-skill="${s}" title="${ScoutManager.SKILLS[s]} (tasto ${s}): forza il fondamentale della prossima azione">${s}</button>`).join('')}</span>
                    </div>
                </div>
                <div class="sc-side">
                    <div class="sc-code-row">
                        <input type="text" id="scoutCode" class="wg-input" placeholder="Codice: *7RH#  a12A+  9#  *p" autocomplete="off" spellcheck="false">
                        <button type="button" class="btn sc-small" data-act="code">↵</button>
                    </div>
                    <div class="sc-log" id="scoutLog">${this.logHTML()}</div>
                </div>
            </div>
            ${st.over ? `<div class="sc-over">Partita finita · set ${st.setsWon.home}-${st.setsWon.away}</div>` : ''}`;
        this.renderHint();
        this.bindMatch(el);
    }

    halfHTML(team, grid) {
        const st = this.state;
        const players = this.onCourt(team);
        const r = st.rally;
        const ballHere = r.expect === 'S' ? st.serving === team : r.team === team;
        const setter = this.setterNum(team);
        const cells = grid.flat().map(z => {
            const p = players[z] || { num: '?', name: '', kind: '', zone: z };
            const color = ScoutManager.ROLE_COLORS[p.kind] || '#607d8b';
            const server = r.expect === 'S' && st.serving === team && z === 1;
            const isSetter = String(p.num) === setter;
            const roleTxt = p.kind ? ScoutManager.ROLE_NAMES[p.kind] : (p.role || '');
            return `<div class="sc-cell ${server ? 'server' : ''} ${p.kind === 'L' ? 'libero' : ''}" data-team="${team}" data-num="${this.esc(p.num)}" data-zone="${z}"
                    title="${this.esc(`${p.num} ${p.name} · ${roleTxt}${p.replaced ? ` (al posto di ${p.replaced.num})` : ''} · zona ${z}`)}">
                <span class="sc-zone">${z}</span>
                ${server ? '<span class="sc-ball">🏐</span>' : ''}
                <span class="sc-num" style="border-color:${color}">${this.esc(p.num)}</span>
                <span class="sc-name">${this.esc(p.name || '')}</span>
                <span class="sc-role" style="background:${color}">${p.kind || '–'}${isSetter ? ' ★' : ''}</span>
            </div>`;
        }).join('');
        return `<div class="sc-grid ${ballHere ? 'has-ball' : ''}">${cells}</div>`;
    }

    renderHint() {
        const el = this.root().querySelector('#scoutHint');
        if (!el) return;
        const st = this.state;
        const r = st.rally;
        const tn = (t) => this.esc(st.teams[t].name);
        let txt;
        if (st.over) txt = 'Partita finita.';
        else if (r.expect === 'S') {
            const srv = this.onCourt(st.serving)[1];
            txt = `<b>Battuta</b> di ${tn(st.serving)}: ${ScoutManager.prefix(st.serving)}${this.esc(srv?.num)} ${this.esc(srv?.name || '')} — clicca il battitore`;
        } else {
            const names = { R: 'Ricezione', E: 'Alzata', A: 'Attacco', D: 'Difesa (o muro)' };
            txt = `<b>${names[r.expect] || ScoutManager.SKILLS[r.expect]}</b> di ${tn(r.team)} · tocco ${r.touches + 1} di 3`;
        }
        if (this.forceSkill) txt += ` · <span class="sc-force">fondamentale forzato: ${ScoutManager.SKILLS[this.forceSkill]} (${this.forceSkill})</span>`;
        el.innerHTML = txt;
        this.root().querySelectorAll('.sc-skill').forEach(b => b.classList.toggle('active', b.dataset.skill === this.forceSkill));
    }

    logHTML() {
        const st = this.state;
        if (!st.log.length) return '<div class="sc-log-empty">Il registro dei codici comparirà qui.</div>';
        return st.log.slice().reverse().map(e => {
            let desc = '', cls = '';
            if (e.k === 'a') {
                const p = this.player(e.team, e.num);
                desc = `${this.esc(p.name || '#' + e.num)} · ${ScoutManager.SKILLS[e.skill]} · ${ScoutManager.EVAL_LABELS[e.skill]?.[e.ev] || e.ev}`;
                cls = 'ev' + ScoutManager.EVALS.indexOf(e.ev);
            } else if (e.k === 'p') {
                desc = `Punto ${this.esc(st.teams[e.team]?.name)}${e.so ? ' · cambio palla' : ' · break point'}${e.manual ? ' (a mano)' : ''}`;
                cls = 'pt';
            } else if (e.k === 'z') {
                desc = `${this.esc(st.teams[e.team]?.name)} in P${e.code.slice(2)}`;
                cls = 'rot';
            } else if (e.k === 's') {
                desc = `Fine set ${e.set}`;
                cls = 'set';
            }
            return `<div class="sc-log-row ${cls}"><code>${this.esc(e.code)}</code><span class="sc-log-desc">${desc}</span><span class="sc-log-score">${e.h}-${e.a}</span></div>`;
        }).join('');
    }

    bindMatch(el) {
        el.querySelector('[data-act="undo"]')?.addEventListener('click', () => this.undo());
        el.querySelector('[data-act="swap"]')?.addEventListener('click', () => { this.state.swap = !this.state.swap; this.persist(); this.render(); });
        ScoutManager.TEAMS.forEach(t => el.querySelector(`[data-act="pt-${t}"]`)?.addEventListener('click', () => this.manualPoint(t)));
        el.querySelectorAll('.sc-skill').forEach(b => b.addEventListener('click', () => {
            this.forceSkill = this.forceSkill === b.dataset.skill ? null : b.dataset.skill;
            this.renderHint();
        }));
        const code = el.querySelector('#scoutCode');
        const submit = () => { if (this.submitCode(code.value)) { const c = this.root().querySelector('#scoutCode'); if (c) { c.value = ''; c.focus(); } } };
        el.querySelector('[data-act="code"]')?.addEventListener('click', submit);
        code?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); }
            else if (e.key === 'Escape') { code.value = ''; code.blur(); }
        });

        el.querySelectorAll('.sc-cell').forEach(cell => {
            let timer = null, long = false;
            cell.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                long = false;
                clearTimeout(timer);
                timer = setTimeout(() => { long = true; this.openSkillArc(cell.dataset.team, cell.dataset.num, cell); }, 480);
            });
            const cancel = () => { clearTimeout(timer); timer = null; };
            cell.addEventListener('pointerleave', cancel);
            cell.addEventListener('pointercancel', cancel);
            cell.addEventListener('pointerup', (e) => {
                if (e.button !== 0) return;
                const wasLong = long;
                cancel();
                if (wasLong) return;
                const t = cell.dataset.team, n = cell.dataset.num;
                const skill = this.forceSkill || this.deduceSkill(t, n);
                this.openEvalArc(t, n, skill, false, cell);
            });
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                cancel();
                this.openSkillArc(cell.dataset.team, cell.dataset.num, cell);
            });
        });
    }

    // ============================================================
    // ARCO A SPICCHI
    // ============================================================
    cellFor(team, num) {
        return this.root().querySelector(`.sc-cell[data-team="${team}"][data-num="${CSS.escape(String(num))}"]`);
    }

    closeArc() {
        if (this.arc) { this.arc.el.remove(); this.arc = null; }
        this.root().querySelectorAll('.sc-cell.picked').forEach(c => c.classList.remove('picked'));
    }

    openEvalArc(team, num, skill, auto = false, cell = null) {
        const st = this.state;
        if (!st.started || st.needLineup || st.over) return;
        cell = cell || this.cellFor(team, num);
        if (!cell) return;
        this.closeArc();
        const items = ScoutManager.EVALS.map(ev => ({
            key: ev, text: ev, color: ScoutManager.EVAL_COLORS[ev], title: `${ev}  ${ScoutManager.EVAL_LABELS[skill][ev]}`
        }));
        this.drawArc(cell, items, { mode: 'eval', team, num, skill, auto });
    }

    openSkillArc(team, num, cell = null) {
        const st = this.state;
        if (!st.started || st.needLineup || st.over) return;
        cell = cell || this.cellFor(team, num);
        if (!cell) return;
        this.closeArc();
        const items = ScoutManager.SKILL_ORDER.map(s => ({ key: s, text: s, color: '#4a6278', title: ScoutManager.SKILLS[s] }));
        this.drawArc(cell, items, { mode: 'skill', team, num, skill: this.deduceSkill(team, num) });
    }

    drawArc(cell, items, info) {
        const R = 92, r0 = 38, pad = 8;
        const rect = cell.getBoundingClientRect();
        let cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        cx = Math.max(R + pad, Math.min(window.innerWidth - R - pad, cx));
        const down = cy - R - pad < 0; // poco spazio sopra: arco verso il basso
        const NS = 'http://www.w3.org/2000/svg';
        const size = 2 * (R + pad);
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'scout-arc');
        svg.setAttribute('width', size); svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `${-R - pad} ${-R - pad} ${size} ${size}`);
        Object.assign(svg.style, { left: (cx - R - pad) + 'px', top: (cy - R - pad) + 'px' });
        const pt = (rr, a) => [rr * Math.cos(a * Math.PI / 180), rr * Math.sin(a * Math.PI / 180)];
        const n = items.length, span = 180 / n;
        items.forEach((it, i) => {
            const a0 = down ? 180 - i * span : 180 + i * span;
            const a1 = down ? a0 - span : a0 + span;
            const sw = down ? 0 : 1;
            const [x1, y1] = pt(R, a0), [x2, y2] = pt(R, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
            const g = document.createElementNS(NS, 'g');
            g.setAttribute('class', 'scout-arc-seg');
            g.dataset.key = it.key;
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', `M${x1},${y1} A${R},${R} 0 0 ${sw} ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 ${1 - sw} ${x4},${y4} Z`);
            path.setAttribute('fill', it.color);
            const am = (a0 + a1) / 2;
            const [tx, ty] = pt((R + r0) / 2, am);
            const text = document.createElementNS(NS, 'text');
            text.setAttribute('x', tx); text.setAttribute('y', ty);
            text.textContent = it.text;
            const title = document.createElementNS(NS, 'title');
            title.textContent = it.title;
            g.append(path, text, title);
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                if (info.mode === 'eval') this.chooseEval(it.key);
                else this.changeArcSkill(it.key);
            });
            svg.appendChild(g);
        });
        // centro: fondamentale e giocatore (clic = cambia fondamentale)
        const c = document.createElementNS(NS, 'g');
        c.setAttribute('class', 'scout-arc-center');
        const circ = document.createElementNS(NS, 'circle');
        circ.setAttribute('r', r0 - 5);
        const t1 = document.createElementNS(NS, 'text');
        t1.setAttribute('y', -4); t1.setAttribute('class', 'big');
        t1.textContent = info.mode === 'eval' ? info.skill : '?';
        const t2 = document.createElementNS(NS, 'text');
        t2.setAttribute('y', 13); t2.setAttribute('class', 'small');
        t2.textContent = `${ScoutManager.prefix(info.team)}${info.num}`;
        const ct = document.createElementNS(NS, 'title');
        ct.textContent = info.mode === 'eval'
            ? `${ScoutManager.SKILLS[info.skill]}${info.auto ? ' (automatica)' : ''} — clic qui o barra spaziatrice per cambiare fondamentale`
            : 'Scegli il fondamentale';
        c.append(circ, t1, t2, ct);
        c.addEventListener('click', (e) => { e.stopPropagation(); if (info.mode === 'eval') this.cycleArcSkill(); });
        svg.appendChild(c);
        document.body.appendChild(svg);
        cell.classList.add('picked');
        this.arc = { el: svg, ...info };
    }

    chooseEval(ev) {
        if (!this.arc || this.arc.mode !== 'eval') return;
        const { team, num, skill } = this.arc;
        this.closeArc();
        this.record(team, num, skill, ev);
    }

    changeArcSkill(skill) {
        if (!this.arc || !ScoutManager.SKILLS[skill]) return;
        const { team, num } = this.arc;
        this.openEvalArc(team, num, skill);
    }

    cycleArcSkill() {
        if (!this.arc) return;
        const o = ScoutManager.SKILL_ORDER;
        const i = o.indexOf(this.arc.skill);
        this.changeArcSkill(o[(i + 1) % o.length]);
    }
}
