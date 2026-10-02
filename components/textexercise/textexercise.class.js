/**
 * TextExerciseBuilder
 * Crea un esercizio (campo, giocatori, palla, frecce e step) partendo da una
 * descrizione scritta in italiano. Analizzatore a regole: funziona offline.
 *
 * Esempio:
 *   "Campo intero in orizzontale. Metti P1 in zona 1 e A in zona 2.
 *    P1 passa la palla ad A. A manda la palla oltre la rete in zona 5.
 *    P1 si sposta in zona 6."
 *
 * Apprendimento:
 *   - posizioni: se sposti a mano un giocatore creato da testo, "Impara dalle
 *     modifiche" (o la creazione successiva) memorizza la nuova posizione della zona;
 *   - frasi: "Quando scrivo … intendo …" crea regole di sostituzione personali.
 */
class TextExerciseBuilder {
    constructor(editor) {
        this.editor = editor;
        this.dialog = null;
    }

    // ============================================================
    // MEMORIA (per utente)
    // ============================================================
    loadMemory() {
        const empty = { zones: {}, phrases: [] };
        try {
            const raw = this.editor.loadUserPref('textExerciseMemory');
            if (!raw) return empty;
            const mem = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return { zones: mem.zones || {}, phrases: mem.phrases || [] };
        } catch (err) {
            return empty;
        }
    }

    saveMemory(mem) {
        this.editor.saveUserPref('textExerciseMemory', JSON.stringify(mem));
    }

    // ============================================================
    // UI
    // ============================================================
    show() {
        if (!this.dialog) this.createDialog();
        this.dialog.showDialog();
        // Ogni volta che si apre, impara dalle correzioni fatte sul foglio
        const learned = this.learnFromCanvas();
        if (learned > 0) this.setReport(`🧠 Ho memorizzato ${learned} posizione/i corrette da te.`);
        this.renderPhrases();
        document.getElementById('txExText')?.focus();
    }

    hide() {
        this.dialog?.hideDialog();
    }

    createDialog() {
        const html = `
<div class="tx-ex">
    <p class="tx-ex-help">
        Descrivi l'esercizio a frasi. Esempi di frasi capite:
        <em>campo intero in orizzontale</em> · <em>metà campo</em> ·
        <em>metti P1 in zona 1</em> · <em>A in zona 2 del campo avversario</em> ·
        <em>P1 passa la palla ad A</em> · <em>da A a P2</em> ·
        <em>P2 manda la palla oltre la rete in zona 5</em> · <em>P1 si sposta in zona 6</em> ·
        <em>A torna in zona 2</em> · <em>P1 batte in zona 1</em> · <em>cono in zona 3</em>.
    </p>
    <textarea id="txExText" class="tx-ex-text" rows="7"
        placeholder="Aggiungi il campo intero in orizzontale. Metti il giocatore P1 in zona 1 e il giocatore A in zona 2. P1 passa la palla ad A, A passa a P2 che manda la palla oltre la rete in zona 6. Poi P1 si sposta in zona 6."></textarea>
    <div class="tx-ex-options">
        <label><input type="checkbox" id="txExNewTab" checked> Crea in un nuovo schema se il foglio non è vuoto</label>
        <label><input type="checkbox" id="txExNumbers" checked> Numera le frecce</label>
    </div>
    <div id="txExReport" class="tx-ex-report"></div>

    <details class="tx-ex-learn">
        <summary>🧠 Insegnami una frase</summary>
        <div class="tx-ex-teach">
            <input type="text" id="txExFrom" placeholder="Quando scrivo… (es. palleggiatore)">
            <input type="text" id="txExTo" placeholder="…intendo (es. P1)">
            <button type="button" id="txExTeachBtn" class="tx-ex-btn">Insegna</button>
        </div>
        <ul id="txExPhrases" class="tx-ex-phrases"></ul>
        <button type="button" id="txExForgetZones" class="tx-ex-btn tx-ex-btn-ghost">Dimentica le posizioni imparate</button>
    </details>
</div>`;

        this.dialog = createWindow({
            title: 'dlg_title_text_exercise',
            icon: '✨',
            id: 'textExerciseDialog',
            contentHTML: html,
            effect: 'windows',
            size: 'lg',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_learn_changes', align: 'left', close: false, color: 'secondary', onClick: () => this.onLearnClick() },
                { label: 'btn_create_exercise', close: false, color: 'success', onClick: () => this.onCreateClick() },
                { label: 'btn_close', color: 'secondary', onClick: () => this.hide() }
            ]
        });

        document.getElementById('txExTeachBtn')?.addEventListener('click', () => this.teachPhrase());
        document.getElementById('txExForgetZones')?.addEventListener('click', () => {
            const mem = this.loadMemory();
            mem.zones = {};
            this.saveMemory(mem);
            this.setReport('Posizioni imparate cancellate: torno a quelle standard.');
        });
        document.getElementById('txExText')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this.onCreateClick();
        });
    }

    setReport(html) {
        const el = document.getElementById('txExReport');
        if (el) el.innerHTML = html;
    }

    renderPhrases() {
        const list = document.getElementById('txExPhrases');
        if (!list) return;
        const mem = this.loadMemory();
        list.innerHTML = '';
        if (mem.phrases.length === 0) {
            list.innerHTML = '<li class="tx-ex-empty">Nessuna frase insegnata.</li>';
            return;
        }
        mem.phrases.forEach((p, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>«${this.escape(p.from)}» → «${this.escape(p.to)}»</span>`;
            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = '×';
            del.title = 'Dimentica';
            del.addEventListener('click', () => {
                const m = this.loadMemory();
                m.phrases.splice(i, 1);
                this.saveMemory(m);
                this.renderPhrases();
            });
            li.appendChild(del);
            list.appendChild(li);
        });
    }

    teachPhrase() {
        const from = document.getElementById('txExFrom')?.value.trim();
        const to = document.getElementById('txExTo')?.value.trim();
        if (!from || !to) return;
        const mem = this.loadMemory();
        mem.phrases = mem.phrases.filter(p => p.from.toLowerCase() !== from.toLowerCase());
        mem.phrases.push({ from, to });
        this.saveMemory(mem);
        document.getElementById('txExFrom').value = '';
        document.getElementById('txExTo').value = '';
        this.renderPhrases();
    }

    onLearnClick() {
        const n = this.learnFromCanvas();
        this.setReport(n > 0
            ? `🧠 Ho memorizzato ${n} posizione/i: le userò nei prossimi esercizi.`
            : 'Nessuna modifica da imparare: sposta i giocatori creati da testo e riprova.');
    }

    onCreateClick() {
        const text = document.getElementById('txExText')?.value || '';
        if (!text.trim()) {
            this.setReport('Scrivi prima la descrizione dell\'esercizio.');
            return;
        }
        const result = this.build(text, {
            newTab: document.getElementById('txExNewTab')?.checked,
            numbers: document.getElementById('txExNumbers')?.checked
        });
        this.showResult(result);
        if (result.understood > 0 && result.unknown.length === 0) this.hide();
    }

    showResult(r) {
        let html = `<div class="tx-ex-ok">✅ Creati: ${r.players} giocatori, ${r.arrows} frecce, ${r.steps} step.</div>`;
        if (r.notes.length) html += `<div class="tx-ex-note">${r.notes.map(n => '• ' + this.escape(n)).join('<br>')}</div>`;
        if (r.unknown.length) {
            html += `<div class="tx-ex-warn">⚠️ Non ho capito:<br>${r.unknown.map(u => '• «' + this.escape(u) + '»').join('<br>')}
                <br><small>Riformula la frase oppure insegnamela in «Insegnami una frase».</small></div>`;
        }
        this.setReport(html);
    }

    escape(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // ============================================================
    // ANALISI DEL TESTO
    // ============================================================
    static normalize(s) {
        return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'");
    }

    applyLearnedPhrases(text) {
        const mem = this.loadMemory();
        let out = text;
        // Le frasi più lunghe per prime, così non vengono spezzate da quelle corte
        [...mem.phrases].sort((a, b) => b.from.length - a.from.length).forEach(p => {
            const re = new RegExp(`(^|[^\\p{L}\\p{N}])${p.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'giu');
            out = out.replace(re, (m, pre) => pre + p.to);
        });
        return out;
    }

    /** Spezza il testo in frasi semplici mantenendo il maiuscolo originale */
    splitClauses(text) {
        const NUM = { uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6 };
        let t = TextExerciseBuilder.normalize(text)
            .replace(/(zona|posizione)\s+(uno|due|tre|quattro|cinque|sei)\b/gi, (m, z, n) => `${z} ${NUM[n.toLowerCase()]}`)
            .replace(/\s*(->|→|=>)\s*/g, ' verso ');

        const parts = [];
        t.split(/[.;\n!?]+/).forEach(sentence => {
            sentence.split(/,|\s+(?:e\s+)?(?:poi|quindi|dopodiche|infine|successivamente)\s+|\s+e\s+(?=(?:poi\s+)?(?:il\s+|la\s+|lo\s+|l')?(?:giocator\w*\s+|atlet\w*\s+)?(?:[A-Z]{1,2}\d{0,2}|[pscolPSCOL]\d{1,2}|All|Dir)\b)|\s+e\s+(?=(?:metti|posiziona|aggiungi|inserisci|si |va |torna|ritorna|corre|passa|manda|batte|attacca|alza|palleggia)\b)/)
                .forEach(c => {
                    // "P1 passa a P2 che passa a P3" → la seconda parte ha come soggetto P2
                    const sub = c.split(/\s+che\s+/);
                    sub.forEach((s, i) => {
                        const clean = s.trim();
                        if (clean) parts.push({ text: clean, chained: i > 0 });
                    });
                });
        });
        return parts;
    }

    /** Trova i giocatori citati in una frase (in ordine) */
    findPlayers(clause) {
        const ROLE_WORDS = [
            [/\b(palleggiator\w*|alzator\w*|regista)\b/i, 'P1'],
            [/\blibero\b/i, 'L1'],
            [/\bopposto\b/i, 'O1'],
            [/\bcentrale\b/i, 'C1'],
            [/\b(schiacciator\w*|banda|attaccante)\b/i, 'S1'],
            [/\b(allenatore|coach|mister)\b/i, 'All']
        ];
        let c = clause;
        ROLE_WORDS.forEach(([re, id]) => { c = c.replace(re, id); });
        // "campo B", "squadra A", "lato B": non sono giocatori
        c = c.replace(/\b(campo|squadra|lato|meta)\s+[AB]\b/gi, ' ');

        const ids = [];
        const STOP = ['IL', 'LA', 'LO', 'UN', 'DA', 'DI', 'IN', 'AL', 'NE', 'SE', 'SI', 'CI', 'MA', 'O', 'I'];
        const re = /\b(All|Dir|[A-Z]{1,2}\d{0,2}|[pscol]\d{1,2})\b/g;
        let m;
        while ((m = re.exec(c)) !== null) {
            let id = m[1];
            if (/^[pscol]\d/.test(id)) id = id[0].toUpperCase() + id.slice(1);
            if (STOP.includes(id)) continue;
            // "E" a inizio frase è la congiunzione, non il giocatore E
            if (id === 'E' && m.index === 0) continue;
            ids.push({ id, index: m.index });
        }
        return { ids: ids.map(x => x.id), first: ids.length ? ids[0].index : -1, text: c };
    }

    parseSide(lower) {
        if (/\b(campo|meta campo|squadra|lato)\s+b\b|avversari\w*|oppost\w*\s+(campo|meta)|di la\b|altro campo|altra meta|dall'altra parte|oltre (la )?rete|al di la/.test(lower)) return 'B';
        if (/\b(campo|meta campo|squadra|lato)\s+a\b|nostro campo|di qua\b/.test(lower)) return 'A';
        return null;
    }

    parseZones(lower) {
        const zones = [];
        const re = /\b(?:zona|posizione|pos\.?|z)\s*([1-6])\b/g;
        let m;
        while ((m = re.exec(lower)) !== null) zones.push(parseInt(m[1], 10));
        return zones;
    }

    parseColor(lower) {
        const COLORS = {
            rosso: '#e74c3c', rossa: '#e74c3c', blu: '#3498db', azzurro: '#5dade2', azzurra: '#5dade2',
            verde: '#2ecc71', giallo: '#f1c40f', gialla: '#f1c40f', arancione: '#e67e22',
            nero: '#2c3e50', nera: '#2c3e50', viola: '#9b59b6', grigio: '#7f8c8d', grigia: '#7f8c8d', bianco: '#ecf0f1', bianca: '#ecf0f1'
        };
        const m = lower.match(/\b(rosso|rossa|blu|azzurr[oa]|verde|giall[oa]|arancione|ner[oa]|viola|grigi[oa]|bianc[oa])\b/);
        return m ? COLORS[m[1]] : null;
    }

    /**
     * Converte il testo in un piano di azioni (non tocca il foglio)
     */
    parse(text) {
        const plan = { court: null, net: false, placements: [], actions: [], cones: [], unknown: [] };
        const clauses = this.splitClauses(this.applyLearnedPhrases(text));
        let lastSubject = null;
        let lastTarget = null;
        const placed = new Set();

        clauses.forEach(({ text: clause, chained }) => {
            const { ids, first, text: roleText } = this.findPlayers(clause);
            // Ruoli già sostituiti (palleggiatore → P1): "palleggiatore" non è il verbo "palleggia"
            const lower = roleText.toLowerCase();
            const zones = this.parseZones(lower);
            const side = this.parseSide(clause.toLowerCase());
            let understood = false;

            // --- Campo ---
            if (/\bcamp(o|etto)\b|\bmeta campo\b|\bmezzo campo\b/.test(lower) && ids.length === 0 && zones.length === 0
                && !/\b(passa|manda|batte|attacca|sposta|va)\b/.test(lower)) {
                const half = /\b(meta|mezzo|half)\b/.test(lower);
                plan.court = {
                    type: half ? 'half-court' : 'court',
                    horizontal: !/\bverticale\b/.test(lower)
                };
                if (/\brete\b/.test(lower)) plan.net = true;
                understood = true;
            } else if (/\brete\b/.test(lower) && /\b(aggiungi|metti|inserisci)\b/.test(lower) && ids.length === 0) {
                plan.net = true;
                understood = true;
            }

            // --- Coni / birilli ---
            if (/\b(con[oi]|conin[oi]|birill[oi]|cinesin[oi]|ostacol[oi])\b/.test(lower) && zones.length) {
                zones.forEach(z => plan.cones.push({ zone: z, side: side || 'A' }));
                understood = true;
            }

            // --- Azioni ---
            const isServe = /\b(batte|battuta|battere|serv(e|izio|ire))\b/.test(lower);
            const isAttack = /\b(attacc\w*|schiacc\w*|pallonett\w*|colpisc\w*|tira|tirare)\b/.test(lower);
            const isOverNet = /\b(rete|di la|altro campo|campo avversari\w*|dall'altra parte|oltre)\b/.test(lower)
                && /\b(pass\w*|mand\w*|rimand\w*|super\w*|scavalc\w*|lanci\w*|spedisc\w*|tira\w*|butt\w*|alz\w*|palleggi\w*|oltre|di la)\b/.test(lower);
            const isPass = /\b(pass\w*|palleggi\w*|alz(a|ata|are)\b|appogg\w*|lanci\w*|bagher|rimand\w*|restitu\w*|appoggi\w*|serve la palla|dà la palla|da la palla|mand\w*)\b/.test(lower)
                || /\bda\s+\S+\s+(a|ad|verso)\s+\S+/.test(lower) || /\bverso\b/.test(lower) && ids.length >= 2;
            const isReceive = /\b(ricev\w*|ricezione|difend\w*|difesa)\b/.test(lower);
            const isReturn = /\b(torn\w*|ritorn\w*|rientr\w*)\b/.test(lower);
            const isMove = /\b(spost\w*|va|vada|andare|corr\w*|muov\w*|entra|entrare|scivol\w*|arretr\w*|avanz\w*|port(a|arsi)\b|raggiung\w*|ruot\w*|cambi\w* posizione)\b/.test(lower) || isReturn;
            const isPlacement = /\b(metti|mettere|posiziona\w*|aggiung\w*|inserisc\w*|inserire|colloca\w*|schiera\w*|disponi|dispone)\b/.test(lower)
                || (ids.length && zones.length && !isPass && !isMove && !isServe && !isAttack && !isOverNet && !isReceive);

            const subjectFor = (ballAction) => {
                if (chained && lastTarget) return lastTarget;
                if (ids.length) return ids[0];
                return ballAction ? (lastTarget || lastSubject) : lastSubject;
            };

            const hasBall = /\b(ha|tiene|con|in mano)\b.*\b(palla|pallone)\b|\b(palla|pallone)\b.*\b(a|ad|in mano a)\s/.test(lower);

            if (understood) {
                // già gestita (campo, rete, coni)
            } else if (isPlacement) {
                const color = this.parseColor(lower);
                const toNet = /\b(a rete|vicino alla rete|sotto rete)\b/.test(lower);
                // Associa giocatori e zone in ordine ("P1 in zona 1 e A in zona 2")
                const COUNT = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6 };
                const cm = lower.match(/\b(\d|un|uno|una|due|tre|quattro|cinque|sei)\s+(giocator\w*|atlet\w*)/);
                const count = cm ? (COUNT[cm[1]] || parseInt(cm[1], 10) || 1) : 1;
                const pids = ids.length ? ids : Array(Math.min(count, 12)).fill(null);
                pids.forEach((id, i) => {
                    const zone = zones[i] ?? zones[zones.length - 1] ?? null;
                    if (id && placed.has(id)) {
                        // Già in campo: "posiziona P1 in zona 6" diventa uno spostamento
                        plan.actions.push({ kind: 'move', who: id, zone, side, toNet, back: false, text: clause });
                        return;
                    }
                    if (id) placed.add(id);
                    plan.placements.push({ id, zone, side: side || 'A', color, net: toNet });
                });
                if (/\b(palla|pallone)\b/.test(lower) && ids.length) plan.actions.push({ kind: 'ball', from: ids[0], text: clause });
                if (ids.length) lastSubject = ids[ids.length - 1];
                understood = true;
            } else if (isServe) {
                const from = subjectFor(false);
                plan.actions.push({ kind: 'serve', from, zone: zones[0] ?? null, text: clause });
                lastSubject = from; lastTarget = null;
                understood = !!from;
            } else if (isPass && ids.length >= 2 && !isOverNet) {
                // "da X a Y", "X passa a Y", "X → Y"; "Y riceve da X" è al contrario
                let from = ids[0], to = ids[1];
                if (/\bricev\w*\b/.test(lower) && /\bda\b/.test(lower)) { from = ids[1]; to = ids[0]; }
                for (let i = 0; i < ids.length - 1; i++) {
                    const a = i === 0 ? from : ids[i], b = i === 0 ? to : ids[i + 1];
                    plan.actions.push({ kind: 'pass', from: a, to: b, text: clause });
                }
                lastSubject = from; lastTarget = ids.length > 2 ? ids[ids.length - 1] : to;
                understood = true;
            } else if (isPass && ids.length === 1 && !isOverNet && !isMove) {
                // "passa a P2" (soggetto implicito) oppure "P1 passa" senza destinatario
                const prefix = roleText.slice(0, Math.max(0, first));
                const verbFirst = /\b(pass|palleggi|alz|appogg|lanci|mand|rimand|restitu|da|dà|serv)\w*/i.test(prefix);
                if (verbFirst || chained) {
                    const from = chained && lastTarget ? lastTarget : (lastTarget || lastSubject);
                    if (from) {
                        plan.actions.push({ kind: 'pass', from, to: ids[0], text: clause });
                        lastSubject = from; lastTarget = ids[0];
                        understood = true;
                    }
                } else if (zones.length) {
                    plan.actions.push({ kind: 'pass-zone', from: ids[0], zone: zones[0], side, text: clause });
                    lastSubject = ids[0]; lastTarget = null;
                    understood = true;
                }
            } else if (isOverNet || isAttack) {
                const from = subjectFor(true);
                plan.actions.push({ kind: isAttack ? 'attack' : 'over', from, zone: zones[0] ?? null, text: clause });
                lastSubject = from; lastTarget = null;
                understood = !!from;
            } else if (isMove) {
                const who = ids.length ? ids : (lastSubject ? [lastSubject] : []);
                who.forEach((id, i) => {
                    plan.actions.push({
                        kind: 'move', who: id,
                        zone: zones[i] ?? zones[0] ?? null,
                        side,
                        toNet: /\b(rete|a rete|sotto rete)\b/.test(lower),
                        back: isReturn && !zones.length,
                        text: clause
                    });
                });
                if (who.length) lastSubject = who[who.length - 1];
                understood = who.length > 0;
            } else if (hasBall && ids.length) {
                plan.actions.push({ kind: 'ball', from: ids[0], text: clause });
                lastSubject = ids[0]; lastTarget = ids[0];
                understood = true;
            } else if (isReceive && ids.length) {
                plan.actions.push({ kind: 'note', who: ids[0], zone: zones[0] ?? null, side, receive: true, text: clause });
                lastSubject = ids[0]; lastTarget = ids[0];
                understood = true;
            }

            if (!understood) plan.unknown.push(clause);
        });

        return plan;
    }

    // ============================================================
    // GEOMETRIA DEL CAMPO
    // ============================================================
    /** Posizione standard della zona in coordinate del campo verticale (u,v in 0..1) */
    defaultZoneUV(courtType, side, zone) {
        const col = { 4: 1 / 6, 3: 0.5, 2: 5 / 6, 5: 1 / 6, 6: 0.5, 1: 5 / 6 }[zone] ?? 0.5;
        const front = [2, 3, 4].includes(zone);
        if (courtType === 'half-court') {
            // Rete in alto, linea dei 3 m a 1/3
            const v = front ? 1 / 6 : 2 / 3;
            if (side === 'B') return { u: 1 - col, v: front ? -0.12 : -0.3 };
            return { u: col, v };
        }
        const v = front ? 0.5 + 1 / 12 : 0.5 + 1 / 3;
        return side === 'B' ? { u: 1 - col, v: 1 - v } : { u: col, v };
    }

    zoneUV(courtType, side, zone, mem) {
        const key = `${courtType}|${side}|${zone}`;
        const learned = mem?.zones?.[key];
        if (learned) return { u: learned.u, v: learned.v };
        return this.defaultZoneUV(courtType, side, zone);
    }

    serveUV(courtType, side) {
        if (courtType === 'half-court') return { u: 5 / 6, v: 1.12 };
        return side === 'B' ? { u: 1 / 6, v: -0.07 } : { u: 5 / 6, v: 1.07 };
    }

    netUV(courtType, side, u) {
        if (courtType === 'half-court') return side === 'B' ? { u, v: -0.08 } : { u, v: 0.08 };
        return side === 'B' ? { u, v: 0.46 } : { u, v: 0.54 };
    }

    /** Da coordinate del campo (u,v) a coordinate del foglio */
    toCanvas(court, uv) {
        const cx = court.x + court.width / 2;
        const cy = court.y + court.height / 2;
        const dx = (uv.u - 0.5) * court.width;
        const dy = (uv.v - 0.5) * court.height;
        const r = (court.rotation || 0) * Math.PI / 180;
        return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
    }

    /** Da coordinate del foglio a coordinate del campo (inversa di toCanvas) */
    toCourt(court, p) {
        const cx = court.x + court.width / 2;
        const cy = court.y + court.height / 2;
        const X = p.x - cx, Y = p.y - cy;
        const r = (court.rotation || 0) * Math.PI / 180;
        const dx = X * Math.cos(r) + Y * Math.sin(r);
        const dy = -X * Math.sin(r) + Y * Math.cos(r);
        return { u: dx / court.width + 0.5, v: dy / court.height + 0.5 };
    }

    // ============================================================
    // APPRENDIMENTO DALLE MODIFICHE
    // ============================================================
    learnFromCanvas() {
        const tab = this.editor.getCurrentTab();
        if (!tab) return 0;
        const court = Array.from(tab.objects.values()).find(o => o.genCourt);
        if (!court) return 0;
        const mem = this.loadMemory();
        let count = 0;
        tab.objects.forEach(obj => {
            if (!obj.genZone || !obj.genUV) return;
            const uv = this.toCourt(court, { x: obj.x + obj.width / 2, y: obj.y + obj.height / 2 });
            const moved = Math.abs(uv.u - obj.genUV.u) > 0.02 || Math.abs(uv.v - obj.genUV.v) > 0.02;
            if (!moved) return;
            mem.zones[obj.genZone] = { u: +uv.u.toFixed(4), v: +uv.v.toFixed(4) };
            obj.genUV = { u: uv.u, v: uv.v };
            count++;
        });
        if (count) this.saveMemory(mem);
        return count;
    }

    // ============================================================
    // COSTRUZIONE SUL FOGLIO
    // ============================================================
    build(text, options = {}) {
        const ed = this.editor;
        this.learnFromCanvas();
        const mem = this.loadMemory();
        const plan = this.parse(text);
        const result = { players: 0, arrows: 0, steps: 0, notes: [], unknown: plan.unknown, understood: 0 };

        const somethingToDo = plan.court || plan.placements.length || plan.actions.length || plan.cones.length;
        if (!somethingToDo) return result;

        if (options.newTab && ed.getCurrentTab().objects.size > 0) ed.addNewTab();
        const tab = ed.getCurrentTab();

        // Stato di partenza per l'Annulla (uno schema nuovo non ne ha ancora)
        if (!tab.history || tab.history.length === 0) ed.saveState('Prima della creazione da testo');

        // Un solo passo di Annulla per tutto l'esercizio
        ed._restoringState = true;
        try {
            const courtType = plan.court?.type || 'court';
            const horizontal = plan.court ? plan.court.horizontal : true;
            const court = this.placeCourt(courtType, horizontal);
            if (plan.net && courtType === 'half-court') this.placeNet(court);

            const players = new Map(); // id → { obj, side, pos (posizione attuale), home }
            const usedZones = { A: new Set(), B: new Set() };
            // Zone che verranno raggiunte con uno spostamento: non ci metto giocatori "automatici"
            const reserved = { A: new Set(), B: new Set() };
            plan.actions.filter(a => a.kind === 'move' && a.zone).forEach(a => reserved[a.side || 'A'].add(a.zone));
            const placeholderNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

            const placePlayer = (id, zone, side, color, toNet) => {
                if (!id) id = placeholderNames.find(n => !players.has(n)) || `G${players.size + 1}`;
                if (!zone) {
                    const order = [3, 2, 4, 6, 5, 1];
                    zone = order.find(z => !usedZones[side].has(z) && !reserved[side].has(z))
                        || order.find(z => !usedZones[side].has(z)) || 6;
                }
                usedZones[side].add(zone);
                let uv = this.zoneUV(courtType, side, zone, mem);
                if (toNet) uv = this.netUV(courtType, side, uv.u);
                const p = this.toCanvas(court, uv);
                const size = ed.getDefaultSize('player');
                const obj = ed.addObject('player', p.x - size.width / 2, p.y - size.height / 2,
                    color || this.playerColor(id, side), id, 0, false);
                obj.genZone = `${courtType}|${side}|${zone}`;
                obj.genUV = uv;
                const entry = { obj, side, zone, pos: { x: p.x, y: p.y }, home: { x: p.x, y: p.y } };
                players.set(id, entry);
                result.players++;
                return entry;
            };

            // Lato in cui si trova la palla: chi la gioca e non è ancora in campo va da quella parte
            let ballSide = null;
            const ensurePlayer = (id, sideHint, zoneHint) => {
                if (!id) return null;
                if (players.has(id)) return players.get(id);
                const e = placePlayer(id, zoneHint || null, sideHint || ballSide || 'A', null, false);
                if (zoneHint) return e;
                result.notes.push(`${id} non era posizionato: l'ho messo in zona ${e.zone}.`);
                return e;
            };

            plan.placements.forEach(pl => {
                if (pl.id && players.has(pl.id)) return;
                placePlayer(pl.id, pl.zone, pl.side, pl.color, pl.net);
            });

            plan.cones.forEach(c => {
                const p = this.toCanvas(court, this.zoneUV(courtType, c.side, c.zone, mem));
                const s = ed.getDefaultSize('cone');
                ed.addObject('cone', p.x - s.width / 2, p.y - s.height / 2, '#e67e22', '', 0, false);
            });

            const steps = [];

            let ball = null;
            let arrowNumber = 0;
            const passColor = '#e74c3c';
            const moveColor = '#2c3e50';

            const addBallNear = (entry) => {
                if (ball || !entry) return;
                const s = ed.getDefaultSize('ball');
                ball = ed.addObject('ball', entry.pos.x + 14, entry.pos.y - 14 - s.height, '#f1c40f', '', 0, false);
            };

            const arrow = (fromEntry, toEntryOrPoint, dashed, color, curved) => {
                const from = this.endpoint(fromEntry, this.pointOf(toEntryOrPoint));
                const to = toEntryOrPoint.obj
                    ? this.endpoint(toEntryOrPoint, fromEntry.pos)
                    : { x: toEntryOrPoint.x, y: toEntryOrPoint.y };
                const a = ed.createArrow(from, to, curved ? 'curved' : 'linear', dashed, color, 2);
                result.arrows++;
                arrowNumber++;
                if (options.numbers) this.addArrowNumber(arrowNumber, this.pointOf(fromEntry), this.pointOf(toEntryOrPoint));
                return a;
            };

            const otherSide = (s) => (s === 'B' ? 'A' : 'B');

            plan.actions.forEach(act => {
                switch (act.kind) {
                    case 'ball': {
                        addBallNear(ensurePlayer(act.from));
                        break;
                    }
                    case 'pass': {
                        const a = ensurePlayer(act.from);
                        const b = ensurePlayer(act.to, a?.side);
                        if (!a || !b) break;
                        ballSide = b.side;
                        addBallNear(a);
                        arrow(a, b, false, passColor, false);
                        steps.push({ text: `${act.from} passa la palla ${this.toWord(act.to)} ${act.to}`, name: act.text });
                        break;
                    }
                    case 'pass-zone': {
                        const a = ensurePlayer(act.from);
                        if (!a) break;
                        addBallNear(a);
                        const s = act.side || a.side;
                        const p = this.toCanvas(court, this.zoneUV(courtType, s, act.zone, mem));
                        arrow(a, p, false, passColor, false);
                        steps.push({ text: `${act.from} passa la palla in zona ${act.zone}`, name: act.text });
                        break;
                    }
                    case 'over':
                    case 'attack':
                    case 'serve': {
                        const wasThere = players.has(act.from);
                        const a = ensurePlayer(act.from);
                        if (!a) break;
                        if (act.kind === 'serve' && !wasThere && !plan.placements.some(p => p.id === act.from)) {
                            result.notes.pop(); // non è "in zona …": va in battuta
                            a.zoneLabel = 'in battuta';
                            // Non è più nella zona: lo spostamento non va imparato come correzione dell'utente
                            delete a.obj.genZone;
                            delete a.obj.genUV;
                            // Chi batte va dietro la linea di fondo
                            const sp = this.toCanvas(court, this.serveUV(courtType, a.side));
                            this.moveObjectCenter(a.obj, sp);
                            a.pos = sp; a.home = sp;
                        }
                        addBallNear(a);
                        const target = this.toCanvas(court, this.zoneUV(courtType, otherSide(a.side), act.zone || (act.kind === 'attack' ? 5 : 6), mem));
                        ballSide = otherSide(a.side);
                        arrow(a, target, false, passColor, true);
                        const verb = act.kind === 'serve' ? 'batte' : act.kind === 'attack' ? 'attacca' : 'manda la palla oltre la rete';
                        steps.push({ text: `${act.from} ${verb}${act.zone ? ` in zona ${act.zone}` : ''}`, name: act.text });
                        break;
                    }
                    case 'move': {
                        const a = ensurePlayer(act.who);
                        if (!a) break;
                        let target;
                        let label;
                        if (act.back) {
                            if (!a.moved) {
                                steps.push({ text: `${act.who} resta in posizione`, name: act.text });
                                break;
                            }
                            target = a.home;
                            label = `${act.who} torna in posizione`;
                        } else if (act.zone) {
                            target = this.toCanvas(court, this.zoneUV(courtType, act.side || a.side, act.zone, mem));
                            label = `${act.who} si sposta in zona ${act.zone}`;
                        } else if (act.toNet) {
                            const uv = this.toCourt(court, a.pos);
                            target = this.toCanvas(court, this.netUV(courtType, a.side, uv.u));
                            label = `${act.who} si sposta a rete`;
                        } else {
                            result.unknown.push(act.text);
                            break;
                        }
                        arrow(a, target, true, moveColor, false);
                        a.pos = { x: target.x, y: target.y };
                        a.moved = true;
                        steps.push({ text: label, name: act.text });
                        break;
                    }
                    case 'note': {
                        const n = ensurePlayer(act.who, act.side || (act.receive ? ballSide : null), act.zone);
                        if (n && act.receive) ballSide = n.side;
                        steps.push({ text: this.capitalize(act.text), name: act.text });
                        break;
                    }
                }
            });

            // Disposizione iniziale come primo step (dopo le azioni: include i giocatori aggiunti in automatico)
            if (players.size) {
                const disp = Array.from(players.entries())
                    .map(([id, e]) => `${id} ${e.zoneLabel || 'in zona ' + e.zone}${e.side === 'B' ? ' (campo avversario)' : ''}`).join(', ');
                steps.unshift({ text: `Disposizione: ${disp}`, name: 'Disposizione iniziale' });
            }

            // Step dell'esercizio
            steps.forEach((s, i) => {
                tab.exerciseSteps.push({
                    id: `step-${Date.now()}-${i}`,
                    text: s.text,
                    name: s.name && s.name !== s.text ? s.name : '',
                    timestamp: new Date(),
                    tags: []
                });
            });
            result.steps = steps.length;

            if (!tab.descrizione) {
                tab.descrizione = text.trim();
                const d = document.getElementById('workoutDescrizione');
                if (d) d.value = tab.descrizione;
            }
            result.understood = result.players + result.arrows + result.steps + (plan.court ? 1 : 0);
        } finally {
            ed._restoringState = false;
        }

        ed.renderStepsList?.();
        ed.saveState('Esercizio creato da testo');
        ed.updateUI?.();
        return result;
    }

    pointOf(e) {
        if (e.obj) return e.pos;
        return e;
    }

    /** Punto di partenza/arrivo di una freccia: il punto di aggancio del giocatore, o la posizione libera se si è già spostato */
    endpoint(entry, towards) {
        if (entry.moved) return { x: entry.pos.x, y: entry.pos.y };
        const dx = towards.x - entry.pos.x, dy = towards.y - entry.pos.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI; // 0 = destra, 90 = giù
        const dirs = ['right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right'];
        const idx = ((Math.round(angle / 45) % 8) + 8) % 8;
        return { objectId: entry.obj.id, position: dirs[idx] };
    }

    moveObjectCenter(obj, p) {
        obj.x = p.x - obj.width / 2;
        obj.y = p.y - obj.height / 2;
        this.editor.renderObject(obj);
    }

    addArrowNumber(n, a, b) {
        const ed = this.editor;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        // Piccolo spostamento perpendicolare per non coprire la freccia
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = -dy / len * 14, oy = dx / len * 14;
        // Dimensione standard del testo: la dimensione del carattere dipende da quella del riquadro
        const s = ed.getDefaultSize('text');
        ed.addObject('text', mx + ox - s.width / 2, my + oy - s.height / 2, '#2c3e50', String(n), 0, false);
    }

    playerColor(id, side) {
        try {
            if (typeof sidebarConfig !== 'undefined') {
                for (const group of sidebarConfig) {
                    const item = (group.items || []).find(it => it.type === 'player' && it.text === id);
                    if (item?.color) return item.color;
                }
            }
        } catch (err) { /* ignore */ }
        return side === 'B' ? '#2ecc71' : '#3498db';
    }

    /** "a P2" ma "ad A" / "ad E" */
    toWord(id) {
        return /^[AEIOU]/i.test(id) ? 'ad' : 'a';
    }

    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    placeCourt(type, horizontal) {
        const ed = this.editor;
        const tab = ed.getCurrentTab();
        const size = ed.getDefaultSize(type);
        const visW = horizontal ? size.height : size.width;
        const visH = horizontal ? size.width : size.height;

        // Allarga il foglio (se personalizzato) per contenere campo e zona di battuta
        // Con la metà campo serve spazio oltre la rete per le palle mandate di là
        const margin = 70;
        const beyondNet = type === 'half-court' ? 60 : 0;
        if ((tab.canvasSize || 'custom') === 'custom') {
            const canvas = document.getElementById('canvas');
            const curW = tab.customWidth || canvas.offsetWidth;
            const curH = tab.customHeight || canvas.offsetHeight;
            const needW = visW + margin * 2 + (horizontal ? beyondNet * 2 : 0);
            const needH = visH + margin * 2 + (horizontal ? 0 : beyondNet * 2);
            if (curW < needW || curH < needH) {
                tab.customWidth = Math.max(curW, needW);
                tab.customHeight = Math.max(curH, needH);
                ed.applyCustomCanvasSize?.(tab);
            }
        }
        // Dimensioni impostate (non misurate: il foglio ha una transizione CSS e durante il ridimensionamento misurerebbe male)
        const canvas = document.getElementById('canvas');
        const custom = (tab.canvasSize || 'custom') === 'custom';
        const cw = (custom && tab.customWidth) || canvas.offsetWidth;
        const ch = (custom && tab.customHeight) || canvas.offsetHeight;
        // La rete della metà campo è in alto (verticale) o a destra (orizzontale): sposto il campo dall'altra parte
        const cx = cw / 2 - (horizontal ? beyondNet : 0);
        const cy = ch / 2 + (horizontal ? 0 : beyondNet);
        const court = ed.addObject(type, cx - size.width / 2, cy - size.height / 2, '#ffffff', '', horizontal ? 90 : 0, false);
        court.genCourt = { type, horizontal };
        return court;
    }

    placeNet(court) {
        const ed = this.editor;
        const p = this.toCanvas(court, { u: 0.5, v: 0 });
        const s = ed.getDefaultSize('net');
        const w = court.width + 20;
        const net = ed.addObject('net', p.x - w / 2, p.y - s.height / 2, '#2c3e50', '', court.rotation || 0, false);
        net.width = w;
        net.x = p.x - w / 2;
        ed.renderObject(net);
    }
}

window.TextExerciseBuilder = TextExerciseBuilder;
