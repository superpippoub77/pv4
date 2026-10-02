/**
 * WorkoutGenerator — "Genera allenamento"
 * Si descrive cosa si vuole nella parte analitica, sintetica e globale (un esercizio
 * per riga). Per ogni esercizio:
 *   1. se nella libreria online c'è un esercizio che corrisponde alla richiesta
 *      (nome, descrizione, step), si usa quello;
 *   2. altrimenti viene creato in automatico con il disegno: se la frase descrive
 *      già campo/giocatori/azioni la usa "Crea da testo", altrimenti sceglie uno
 *      schema tipo in base alle parole chiave (palleggio, bagher, battuta, ricezione,
 *      alzata, attacco, muro, difesa, partita, 3 contro 3…).
 * Ogni esercizio diventa una scheda, nell'ordine: analitica → sintetica → globale,
 * con la tipologia impostata. Insieme formano l'allenamento (Salva allenamento, Stampa).
 */
class WorkoutGenerator {
    constructor(editor) {
        this.editor = editor;
        this.dialog = null;
    }

    static PARTS = [
        { key: 'ANA', label: 'Parte analitica', short: 'Analitica', placeholder: 'es.\nPalleggio a coppie 10 minuti\nBagher in movimento laterale, 3 serie' },
        { key: 'SIN', label: 'Parte sintetica', short: 'Sintetica', placeholder: 'es.\nRicezione e alzata per lo schiacciatore di posto 4\nDifesa sull\'attacco dell\'allenatore' },
        { key: 'GLO', label: 'Parte globale', short: 'Globale', placeholder: 'es.\nPartita 6 contro 6 con battuta\n3 contro 3 a metà campo' }
    ];

    // ============================================================
    // UI
    // ============================================================
    show() {
        if (!this.dialog) this.createDialog();
        this.dialog.showDialog();
        this.setReport('');
        document.getElementById('wgName')?.focus();
    }

    hide() {
        this.dialog?.hideDialog();
    }

    createDialog() {
        const parts = WorkoutGenerator.PARTS.map(p => `
            <label class="wg-label" for="wg${p.key}">${p.label}</label>
            <textarea id="wg${p.key}" class="tx-ex-text wg-text" rows="3" placeholder="${p.placeholder}"></textarea>`).join('');
        const today = new Date().toISOString().slice(0, 10);
        const html = `
<div class="tx-ex wg">
    <p class="tx-ex-help">
        Scrivi cosa vuoi in ogni parte dell'allenamento, <b>un esercizio per riga</b>.
        Se nella libreria c'è un esercizio che corrisponde alla richiesta viene usato quello,
        altrimenti viene creato in automatico con il disegno sul campo (puoi anche descriverlo come in
        <em>Crea da testo</em>: «P1 in zona 1, A in zona 2, P1 passa ad A…»).
        Durata, serie e recupero scritti nella riga (es. <em>10 minuti</em>, <em>3 serie</em>, <em>recupero 60 secondi</em>) vengono riportati nella scheda.
    </p>
    <div class="wg-row">
        <div><label class="wg-label" for="wgName">Nome dell'allenamento</label><input type="text" id="wgName" class="wg-input" value="Allenamento ${today}"></div>
        <div><label class="wg-label" for="wgDate">Data</label><input type="date" id="wgDate" class="wg-input" value="${today}"></div>
    </div>
    <label class="wg-label" for="wgObjective">Obiettivo (facoltativo)</label>
    <input type="text" id="wgObjective" class="wg-input" placeholder="es. Migliorare la ricostruzione dopo la ricezione">
    ${parts}
    <div class="tx-ex-options">
        <label><input type="checkbox" id="wgUseLibrary" checked> Usa gli esercizi della libreria quando corrispondono</label>
        <label><input type="checkbox" id="wgNumbers" checked> Numera le frecce</label>
    </div>
    <div id="wgReport" class="tx-ex-report"></div>
</div>`;
        this.dialog = createWindow({
            title: 'dlg_title_workout_generator',
            icon: '🗓',
            id: 'workoutGeneratorDialog',
            contentHTML: html,
            effect: 'windows',
            size: 'lg',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_save_workout', align: 'left', close: false, color: 'secondary', onClick: () => this.editor.workoutManager?.show() },
                { label: 'btn_workout_pdf', align: 'left', close: false, color: 'secondary', onClick: () => this.editor.exportWorkoutToPDF() },
                { label: 'btn_share_link', align: 'left', close: false, color: 'secondary', onClick: () => window.Pv4Share?.shareWorkout() },
                { label: 'btn_generate_workout', close: false, color: 'success', onClick: () => this.onGenerate() },
                { label: 'btn_close', color: 'secondary', onClick: () => this.hide() }
            ]
        });
    }

    setReport(html) {
        const el = document.getElementById('wgReport');
        if (el) el.innerHTML = html;
    }

    escape(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    async onGenerate() {
        const requests = [];
        WorkoutGenerator.PARTS.forEach(p => {
            const lines = (document.getElementById('wg' + p.key)?.value || '')
                .split('\n')
                .map(l => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
                .filter(Boolean);
            lines.forEach(text => requests.push({ part: p, text }));
        });
        if (!requests.length) {
            this.setReport('<div class="tx-ex-warn">Scrivi almeno un esercizio in una delle tre parti.</div>');
            return;
        }
        this.setReport('<div class="tx-ex-note">Preparazione dell\'allenamento…</div>');
        const result = await this.generate(requests, {
            name: document.getElementById('wgName').value.trim(),
            date: document.getElementById('wgDate').value,
            objective: document.getElementById('wgObjective').value.trim(),
            useLibrary: document.getElementById('wgUseLibrary').checked,
            numbers: document.getElementById('wgNumbers').checked
        });
        this.showResult(result);
    }

    showResult(r) {
        const rows = r.items.map(it => {
            const src = it.source === 'library'
                ? `📚 dalla libreria: «${this.escape(it.libraryName)}»${it.owner ? ' di ' + this.escape(it.owner) : ''}`
                : (it.source === 'text' ? '✏️ disegnato dalla descrizione' : `✨ creato in automatico (${this.escape(it.template)})`);
            return `<tr><td>${this.escape(it.part.short)}</td><td>${this.escape(it.text)}</td><td>${src}</td></tr>`;
        }).join('');
        let html = `<div class="tx-ex-ok">✅ Allenamento pronto: ${r.items.length} esercizi in altrettante schede.
            Per salvarlo usa «Salva allenamento…», per stamparlo «📄 Scheda PDF».</div>
            <table class="wg-table"><tr><th>Parte</th><th>Richiesta</th><th>Esercizio</th></tr>${rows}</table>`;
        if (r.notes.length) html += `<div class="tx-ex-note">${r.notes.map(n => '• ' + this.escape(n)).join('<br>')}</div>`;
        this.setReport(html);
    }

    // ============================================================
    // GENERAZIONE
    // ============================================================
    /** Testi degli esercizi della libreria (vuoto se non disponibile; il motivo va in notes) */
    async loadLibraryIndex(notes) {
        if (!(window.Pv4Library && window.Pv4Library.isAvailable())) {
            notes.push('Libreria non disponibile (accesso senza account o server non raggiungibile): gli esercizi sono stati creati in automatico.');
            return [];
        }
        try {
            return (await CloudApi.get('search_index.php')).items || [];
        } catch (err) {
            notes.push('Libreria non raggiungibile (' + err.message + '): gli esercizi sono stati creati in automatico.');
            return [];
        }
    }

    /**
     * Crea (in una scheda) l'esercizio per una richiesta: dalla libreria se corrisponde,
     * altrimenti disegnato in automatico. ctx = { library, used, title, contextText }.
     * Restituisce { source, libraryName, owner, template, tabId }.
     */
    async createExercise(req, opts, ctx) {
        const ed = this.editor;
        const item = { part: req.part, text: req.text };
        const match = ctx.library && ctx.library.length ? this.findInLibrary(req, ctx.library, ctx.used) : null;

        if (match) {
            ctx.used.add(match.id);
            const ok = await window.Pv4Library.load(match.id);
            if (ok) {
                item.source = 'library';
                item.libraryName = match.name;
                item.owner = match.mine ? '' : match.ownerName;
                const tab = ed.getCurrentTab();
                if (!tab.tipologia || tab.tipologia === 'GEN') tab.tipologia = req.part.key;
                this.applyParams(tab, req.text, opts, false);
            }
        }

        if (!item.source) {
            let script = req.text;
            if (this.isDrawable(req.text)) {
                item.source = 'text';
            } else {
                const tpl = this.pickTemplate(req.text, req.part.key, ctx.contextText);
                script = tpl.script;
                item.source = 'template';
                item.template = tpl.name;
            }
            this.textExercise().build(script, { newTab: true, numbers: opts.numbers !== false });
            const tab = ed.getCurrentTab();
            tab.tipologia = req.part.key;
            this.renameTab(ctx.title || this.titleOf(req.text));
            this.applyParams(tab, req.text, opts, true);
        }
        item.tabId = ed.activeTabId;
        return item;
    }

    async generate(requests, opts = {}) {
        const ed = this.editor;
        const result = { items: [], notes: [] };
        const library = opts.useLibrary ? await this.loadLibraryIndex(result.notes) : [];
        const used = new Set();
        let firstTabId = null;
        const counters = {};

        for (const req of requests) {
            counters[req.part.key] = (counters[req.part.key] || 0) + 1;
            const title = `${req.part.short} ${counters[req.part.key]} · ${this.titleOf(req.text)}`;
            const item = await this.createExercise(req, opts, { library, used, title });
            if (firstTabId === null) firstTabId = item.tabId;
            result.items.push(item);
        }

        ed.currentWorkoutObjective = opts.objective || ed.currentWorkoutObjective || '';
        if (opts.name) ed.currentWorkoutName = opts.name;
        if (firstTabId !== null) ed.switchToTab(firstTabId); // aggiorna anche i campi del pannello Esercizio
        return result;
    }

    /**
     * La richiesta descrive già il disegno? Serve almeno un giocatore messo in una zona,
     * oppure due azioni con giocatori indicati (es. «P1 passa ad A. A passa a P2»).
     */
    isDrawable(text) {
        const plan = this.textExercise().parse(text);
        const placed = plan.placements.filter(p => p.id && p.zone).length;
        const actions = plan.actions.filter(a => a.from || a.who).length;
        return placed > 0 || (actions >= 2 && plan.unknown.length === 0);
    }

    textExercise() {
        return this.editor.textExerciseManager;
    }

    renameTab(name) {
        const ed = this.editor;
        ed.updateTabName(ed.activeTabId, name);
        const input = document.querySelector(`.tab[data-tab-id="${ed.activeTabId}"] .tab-title`);
        if (input) input.value = name;
        const title = document.getElementById('schemaTitle');
        if (title) title.value = name;
    }

    /** Durata, serie, recupero e data letti dalla richiesta */
    applyParams(tab, text, opts, isNew) {
        const t = WorkoutGenerator.norm(text);
        // la durata si cerca fuori dalla parte "recupero …" (es. «recupero 1 minuto» non è la durata)
        const noRec = t.replace(/recupero\s*(?:di\s*)?\d+\s*(?:min\w*|sec\w*|s\b|')?/g, ' ');
        const min = noRec.match(/(\d+)\s*(?:min\w*|')/);
        const ser = t.match(/(\d+)\s*serie/);
        const rec = t.match(/recupero\s*(?:di\s*)?(\d+)\s*(min\w*|')?/);
        if (min) tab.timing = parseInt(min[1], 10);
        if (ser) tab.series = parseInt(ser[1], 10);
        if (rec) tab.rec = parseInt(rec[1], 10) * (rec[2] ? 60 : 1);
        if (opts.date) tab.date = opts.date;
        if (isNew) {
            tab.descrizione = text;
            if (opts.objective) tab.descrizione += '\nObiettivo dell\'allenamento: ' + opts.objective;
        }
    }

    titleOf(text) {
        const first = text.split(/[.;:]/)[0].trim();
        const t = first.length > 42 ? first.slice(0, 40).replace(/\s+\S*$/, '') + '…' : first;
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    // ============================================================
    // RICERCA NELLA LIBRERIA
    // ============================================================
    static norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    static STOP = new Set(('il lo la i gli le un uno una di a da in con su per tra fra e ed o od che chi cui non piu meno molto poco ' +
        'del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle ' +
        'sul sullo sulla sui sugli sulle col coi come anche poi dopo prima ogni tutto tutti tutte questo questa quello quella ' +
        'esercizio esercizi lavoro lavori fare fa fanno serie minuti minuto secondi recupero volte volta palla palloni pallone ' +
        'giocatore giocatori giocatrice giocatrici atleta atleti campo parte allenamento squadra mio mia vorrei voglio').split(/\s+/));

    static stems(text) {
        const out = new Set();
        WorkoutGenerator.norm(text).split(/[^a-z0-9]+/).forEach(w => {
            if (w.length < 3 || WorkoutGenerator.STOP.has(w) || /^\d+$/.test(w)) return;
            out.add(w.length > 6 ? w.slice(0, 6) : (w.length > 4 ? w.replace(/[aeiou]$/, '') : w));
        });
        return out;
    }

    findInLibrary(req, library, used) {
        const q = WorkoutGenerator.stems(req.text);
        if (!q.size) return null;
        let best = null;
        library.forEach(it => {
            if (used.has(it.id)) return;
            const nameS = WorkoutGenerator.stems(it.name);
            const textS = WorkoutGenerator.stems(it.text);
            let hits = 0, nameHits = 0;
            q.forEach(w => {
                if (nameS.has(w)) { hits++; nameHits++; } else if (textS.has(w)) hits++;
            });
            if (!hits) return;
            let score = (hits + nameHits * 0.5) / q.size;
            if (it.tipologia === req.part.key) score += 0.15;
            if (it.mine) score += 0.05;
            const enough = hits >= Math.min(2, q.size);
            if (enough && score >= 0.6 && (!best || score > best.score)) best = { ...it, score };
        });
        return best;
    }

    // ============================================================
    // SCHEMI TIPO (quando la richiesta non descrive il disegno)
    // ============================================================
    static TEMPLATES = [
        { name: 'partita 6 contro 6', keys: /\b(6\s*(?:c|contro|vs|v)\s*6|sei contro sei|partita|gioco|sestetti?|set)\b/,
          script: 'Campo intero orizzontale. P1 in zona 1, O1 in zona 2, C1 in zona 3, S1 in zona 4, L1 in zona 5, A in zona 6. ' +
                  'P2 in zona 1 del campo avversario, O2 in zona 2 del campo avversario, C2 in zona 3 del campo avversario, S2 in zona 4 del campo avversario, L2 in zona 5 del campo avversario, B in zona 6 del campo avversario. ' +
                  'P1 batte in zona 5.' },
        { name: '3 contro 3', keys: /\b(3\s*(?:c|contro|vs|v)\s*3|tre contro tre|terne)\b/,
          script: 'Campo intero orizzontale. A in zona 1, B in zona 6, C in zona 5. D in zona 1 del campo avversario, E in zona 6 del campo avversario, F in zona 5 del campo avversario. ' +
                  'A passa la palla oltre la rete in zona 6. E passa a D. D passa a F. F attacca in zona 5.' },
        { name: '2 contro 2', keys: /\b(2\s*(?:c|contro|vs|v)\s*2|due contro due)\b/,
          script: 'Campo intero orizzontale. A in zona 1, B in zona 5. C in zona 1 del campo avversario, D in zona 5 del campo avversario. ' +
                  'A passa la palla oltre la rete in zona 6. C passa a D. D attacca in zona 1.' },
        { name: 'difesa sull\'attacco dell\'allenatore', keys: /\b(difes\w*|difend\w*|copertur\w*)\b/,
          script: 'Campo intero orizzontale. A in zona 5, B in zona 6, C in zona 1. L\'allenatore in zona 3 del campo avversario. ' +
                  'L\'allenatore attacca in zona 6. B passa ad A. A passa a C.' },
        { name: 'minicampo', keys: /\b(minicamp\w*|mini campo)\b/,
          script: 'Metà campo con la rete. A in zona 6. B in zona 4. C in zona 6 del campo avversario. D in zona 4 del campo avversario. ' +
                  'A passa a B. B passa la palla oltre la rete in zona 5. C passa a D. D passa la palla oltre la rete.' },
        { name: 'muro', keys: /\b(mur\w*)\b/,
          script: 'Campo intero orizzontale. S1 in zona 4. C1 in zona 3. P2 in zona 3 del campo avversario. S2 in zona 4 del campo avversario. ' +
                  'P2 passa a S2. S2 attacca in zona 1. S1 va a rete. C1 si sposta in zona 4.' },
        { name: 'ricezione e alzata', keys: /\b(ricezion\w*|ricev\w*)\b/,
          script: 'Campo intero orizzontale. A batte in zona 5. L1 in zona 5 del campo avversario. P1 in zona 2 del campo avversario. S1 in zona 4 del campo avversario. ' +
                  'L1 riceve. L1 passa a P1. P1 passa a S1.' },
        { name: 'battuta', keys: /\b(battut\w*|batt\w*|serviz\w*)\b/,
          script: 'Campo intero orizzontale. A batte in zona 1. B batte in zona 5. C in zona 6 del campo avversario. C riceve.' },
        { name: 'attacco', keys: /\b(attacc\w*|schiacc\w*|pallonett\w*|ricostruzion\w*|rincors\w*)\b/,
          script: 'Metà campo verticale con la rete. Il palleggiatore in zona 3. S1 in zona 4. A in zona 6. ' +
                  'A passa al palleggiatore che alza per S1. S1 attacca in zona 1.' },
        { name: 'alzata', keys: /\b(alzat\w*|palleggiator\w*|alzator\w*|regia)\b/,
          script: 'Metà campo verticale con la rete. Il palleggiatore in zona 3. A in zona 6. S1 in zona 4. O1 in zona 2. ' +
                  'A passa al palleggiatore. Il palleggiatore passa a S1. A passa al palleggiatore. Il palleggiatore passa a O1.' },
        { name: 'bagher a coppie', keys: /\b(bagher\w*)\b/,
          script: 'Metà campo. A in zona 6. B in zona 3. A passa a B. B passa ad A. A si sposta in zona 5. B passa ad A. A passa a B.' },
        { name: 'palleggio a coppie', keys: /\b(palleggi\w*|tocc\w*)\b/,
          script: 'Metà campo. A in zona 5. B in zona 2. A passa a B. B passa ad A. A si sposta in zona 6. B passa ad A. A passa a B.' },
        { name: 'riscaldamento con spostamenti', keys: /\b(riscaldament\w*|attivazion\w*|corsa|mobilit\w*|andatur\w*|spostament\w*|coordinazion\w*)\b/,
          script: 'Metà campo. Metti un cono in zona 1. Metti un cono in zona 5. Metti un cono in zona 3. A in zona 1. ' +
                  'A si sposta in zona 5. A si sposta in zona 3. A torna in posizione.' }
    ];

    static DEFAULT_BY_PART = { ANA: 'palleggio a coppie', SIN: 'attacco', GLO: 'partita 6 contro 6' };

    pickTemplate(text, partKey, contextText) {
        // prima la richiesta, poi il contesto (es. il titolo del blocco nel Piano allenamento)
        for (const src of [text, contextText]) {
            if (!src) continue;
            const t = WorkoutGenerator.norm(src);
            // lo schema con più parole chiave nel testo (a parità, quello che viene prima nell'elenco)
            let best = null, bestHits = 0;
            WorkoutGenerator.TEMPLATES.forEach(tp => {
                const hits = (t.match(new RegExp(tp.keys.source, 'g')) || []).length;
                if (hits > bestHits) { best = tp; bestHits = hits; }
            });
            if (best) return best;
        }
        const def = WorkoutGenerator.DEFAULT_BY_PART[partKey] || 'palleggio a coppie';
        return WorkoutGenerator.TEMPLATES.find(tp => tp.name === def);
    }
}

window.WorkoutGenerator = WorkoutGenerator;
