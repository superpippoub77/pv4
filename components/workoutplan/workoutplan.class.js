/**
 * PIANO ALLENAMENTO
 * La scheda completa di una seduta, come quella delle società:
 *   intestazione (squadra, stagione, categoria, campionato, periodo, palestra, n° allenamento, durata),
 *   obiettivo, caratteristiche prestative, materiale occorrente,
 *   Fase Analitica / Sintetica / Globale con blocchi a titolo ed esercizi
 *   (Nr · Esercizio · G · R · quantità · Dettagli), gruppi di lavoro.
 * Ogni esercizio può avere il suo DISEGNO (una scheda dell'editor):
 *   - a mano: «✏️ Disegna» apre una scheda collegata all'esercizio;
 *   - in automatico: «✨» lo prende dalla libreria se corrisponde, altrimenti lo crea
 *     (Crea da testo o schema tipo), anche per tutti gli esercizi insieme.
 * Il piano si compila a mano, si importa da PDF (stessa struttura) e si esporta in PDF
 * con la stessa impaginazione, più i disegni annessi. Si salva nel browser (automatico)
 * e su file .json insieme ai disegni.
 */
class WorkoutPlan {
    constructor(editor) {
        this.editor = editor;
        this.dialog = null;
        this.plan = this.loadStored() || WorkoutPlan.empty();
    }

    static PHASE_INFO = {
        ANA: { short: 'An', part: 'Analitica', color: [255, 242, 204], css: '#fff2cc' },
        SIN: { short: 'Si', part: 'Sintetica', color: [207, 226, 243], css: '#cfe2f3' },
        GLO: { short: 'Gl', part: 'Globale', color: [217, 234, 211], css: '#d9ead3' }
    };

    static empty() {
        return PlanPdfParser.emptyPlan();
    }

    // ============================================================
    // MEMORIA
    // ============================================================
    loadStored() {
        try {
            const raw = this.editor.loadUserPref('workoutPlan');
            if (!raw) return null;
            const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return this.normalize(p);
        } catch (err) { return null; }
    }

    store() {
        clearTimeout(this._storeT);
        this._storeT = setTimeout(() => {
            try { this.editor.saveUserPref('workoutPlan', JSON.stringify(this.plan)); } catch (err) { /* ignore */ }
        }, 300);
    }

    /** Completa un piano (da file o da versioni precedenti) con tutti i campi */
    normalize(p) {
        const base = WorkoutPlan.empty();
        const out = { ...base, ...p };
        out.header = { ...base.header, ...(p.header || {}) };
        out.features = { ...base.features, ...(p.features || {}) };
        out.materials = { ...base.materials, ...(p.materials || {}) };
        out.phases = base.phases.map(bp => {
            const found = (p.phases || []).find(x => x.key === bp.key) || {};
            return {
                key: bp.key,
                title: found.title || bp.title,
                blocks: (found.blocks || []).map(b => ({
                    title: b.title || '',
                    rows: (b.rows || []).map(r => ({ nr: '', text: '', g: '', r: '', qty: '', details: '', uid: null, ...r }))
                }))
            };
        });
        out.groups = (p.groups || []).map(g => ({ name: g.name || '', players: g.players || '' }));
        return out;
    }

    // ============================================================
    // FINESTRA
    // ============================================================
    show() {
        if (!this.dialog) this.createDialog();
        this.render();
        this.dialog.showDialog();
    }

    hide() {
        this.dialog?.hideDialog();
    }

    createDialog() {
        this.dialog = createWindow({
            title: 'dlg_title_workout_plan',
            icon: '📋',
            id: 'workoutPlanDialog',
            contentHTML: `<div class="wp" id="wpRoot"></div>
                <input type="file" id="wpPdfInput" accept="application/pdf,.pdf" hidden>
                <input type="file" id="wpJsonInput" accept=".json,application/json" hidden>`,
            effect: 'windows',
            size: 'xl',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_share_link', align: 'left', close: false, color: 'secondary', onClick: () => window.Pv4Share?.shareWorkout() },
                { label: 'btn_close', color: 'secondary', onClick: () => this.hide() }
            ]
        });
        const root = document.getElementById('wpRoot');
        root.addEventListener('input', (e) => this.onInput(e));
        root.addEventListener('change', (e) => this.onChange(e));
        root.addEventListener('click', (e) => this.onClick(e));
        document.getElementById('wpPdfInput').addEventListener('change', (e) => {
            const f = e.target.files[0]; e.target.value = '';
            if (f) this.importPdf(f);
        });
        document.getElementById('wpJsonInput').addEventListener('change', (e) => {
            const f = e.target.files[0]; e.target.value = '';
            if (f) this.loadJson(f);
        });
    }

    esc(s) {
        return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    setStatus(html, kind = 'note') {
        this._status = { html, kind }; // resta visibile anche quando la finestra si ridisegna
        const el = document.getElementById('wpStatus');
        if (!el) return;
        el.className = 'wp-status ' + (html ? 'tx-ex-' + kind : '');
        el.innerHTML = html || '';
    }

    render() {
        const p = this.plan;
        const root = document.getElementById('wpRoot');
        if (!root) return;
        const scroll = root.parentElement ? root.parentElement.scrollTop : 0;
        const inp = (path, value, cls = '', ph = '') => `<input type="text" class="wp-in ${cls}" data-f="${path}" value="${this.esc(value)}" placeholder="${this.esc(ph)}">`;
        const ta = (path, value, cls = '', rows = 2, ph = '') => `<textarea class="wp-ta ${cls}" data-f="${path}" rows="${rows}" placeholder="${this.esc(ph)}">${this.esc(value)}</textarea>`;
        const field = (label, path, value, cls = '') => `<label class="wp-field ${cls}"><span>${label}</span>${inp(path, value)}</label>`;

        const H = p.header, F = p.features, M = p.materials;
        let html = `
<div class="wp-toolbar">
    <button type="button" data-act="import-pdf" title="Legge un piano di allenamento da PDF (stessa struttura: intestazione, obiettivo, fasi con esercizi, gruppi)">📥 Importa da PDF</button>
    <button type="button" data-act="auto-all" title="Per ogni esercizio senza disegno: dalla libreria se corrisponde, altrimenti creato in automatico">✨ Disegna tutti gli esercizi</button>
    <button type="button" data-act="pdf" class="wp-primary" title="PDF con la stessa impaginazione della scheda, più i disegni annessi">📄 PDF dell'allenamento</button>
    <span class="wp-sep"></span>
    <button type="button" data-act="save-json" title="Salva il piano e i suoi disegni in un file">💾 Salva (.json)</button>
    <button type="button" data-act="open-json" title="Apre un piano salvato con i suoi disegni">📂 Apri (.json)</button>
    <button type="button" data-act="new" title="Svuota il piano (i disegni restano aperti nelle schede)">🗑 Nuovo piano</button>
</div>
<div id="wpStatus" class="wp-status"></div>

<div class="wp-head">
    ${field('Squadra', 'header.team', H.team, 'wide')}
    ${field('Stagione', 'header.season', H.season)}
    ${field('Categoria', 'header.categoria', H.categoria)}
    ${field('Campionato', 'header.campionato', H.campionato)}
    ${field('Periodo', 'header.periodo', H.periodo)}
    ${field('Palestra', 'header.palestra', H.palestra)}
    ${field('Allenamento n°', 'header.numero', H.numero)}
    ${field('Durata', 'header.durata', H.durata)}
</div>

<h3 class="wp-h">Obiettivo</h3>
${ta('objective', p.objective, 'wide', 2, 'Cosa si vuole ottenere con questa seduta')}

<h3 class="wp-h">Caratteristiche prestative</h3>
<div class="wp-grid6">
    ${field('Categoria', 'features.categoria', F.categoria)}
    ${field('Età', 'features.eta', F.eta)}
    ${field('Campionato', 'features.campionato', F.campionato)}
    ${field('Liv. tecnico med', 'features.livTecnico', F.livTecnico)}
    ${field('Liv. tattico med', 'features.livTattico', F.livTattico)}
    ${field('% All. fattibilità', 'features.fattibilita', F.fattibilita)}
</div>

<h3 class="wp-h">Materiale occorrente</h3>
<div class="wp-grid8">
    ${field('Palloni', 'materials.palloni', M.palloni)}
    ${field('Muro', 'materials.muro', M.muro)}
    ${field('Tappetini', 'materials.tappetini', M.tappetini)}
    ${field('Spalliere', 'materials.spalliere', M.spalliere)}
    ${field('Panche', 'materials.panche', M.panche)}
    ${field('Cinesini', 'materials.cinesini', M.cinesini)}
    ${field('Carrelli', 'materials.carrelli', M.carrelli)}
    ${field('Nastro/corda', 'materials.nastro', M.nastro)}
</div>`;

        p.phases.forEach((ph, pi) => {
            const info = WorkoutPlan.PHASE_INFO[ph.key];
            const glo = ph.key === 'GLO';
            html += `<h2 class="wp-phase" style="--ph:${info.css}"><input type="text" class="wp-in wp-phase-title" data-f="phases.${pi}.title" value="${this.esc(ph.title)}"></h2>`;
            ph.blocks.forEach((b, bi) => {
                html += `<div class="wp-block">
                    <div class="wp-block-head">
                        <input type="text" class="wp-in" data-f="phases.${pi}.blocks.${bi}.title" value="${this.esc(b.title)}" placeholder="Titolo del blocco (es. Riscaldamento e Mobilità)">
                        <button type="button" data-act="block-up" data-p="${pi}" data-b="${bi}" title="Sposta su">↑</button>
                        <button type="button" data-act="block-down" data-p="${pi}" data-b="${bi}" title="Sposta giù">↓</button>
                        <button type="button" data-act="block-del" data-p="${pi}" data-b="${bi}" title="Elimina il blocco">🗑</button>
                    </div>
                    <table class="wp-table${glo ? ' glo' : ''}">
                        <thead><tr><th>Nr</th><th>Esercizio</th>${glo ? '' : '<th>G</th><th>R</th>'}<th>Nr</th><th>Dettagli</th><th>Disegno</th><th></th></tr></thead>
                        <tbody>`;
                b.rows.forEach((r, ri) => {
                    const at = `data-p="${pi}" data-b="${bi}" data-r="${ri}"`;
                    const base = `phases.${pi}.blocks.${bi}.rows.${ri}`;
                    const tabId = this.editor.findTabByUid(r.uid);
                    const tab = tabId != null ? this.editor.tabs.get(tabId) : null;
                    const drawing = tab
                        ? `<div class="wp-draw ok" title="${this.esc(tab.name)}">🖼 ${this.esc(tab.name)}</div>
                           <button type="button" data-act="open" ${at}>Apri</button>
                           <button type="button" data-act="auto" ${at} title="Rifai il disegno in automatico">✨</button>
                           <button type="button" data-act="unlink" ${at} title="Scollega il disegno (la scheda resta aperta)">✕</button>`
                        : `<button type="button" data-act="draw" ${at} title="Apre una nuova scheda collegata a questo esercizio, da disegnare a mano">✏️ Disegna</button>
                           <button type="button" data-act="auto" ${at} title="Dalla libreria se corrisponde, altrimenti creato in automatico">✨ Auto</button>
                           ${this.linkSelect(at)}`;
                    html += `<tr>
                        <td>${inp(base + '.nr', r.nr, 'wp-nr')}</td>
                        <td>${ta(base + '.text', r.text, 'wp-text', Math.min(8, Math.max(2, (r.text || '').split('\n').length + 1)), 'Descrizione; «• » a inizio riga per gli elenchi')}</td>
                        ${glo ? '' : `<td>${inp(base + '.g', r.g, 'wp-small')}</td><td>${inp(base + '.r', r.r, 'wp-small')}</td>`}
                        <td>${inp(base + '.qty', r.qty, 'wp-qty', "10'")}</td>
                        <td>${ta(base + '.details', r.details, 'wp-det', Math.min(8, Math.max(2, (r.details || '').split('\n').length + 1)))}</td>
                        <td class="wp-drawcell">${drawing}</td>
                        <td class="wp-rowbtn">
                            <button type="button" data-act="row-up" ${at} title="Sposta su">↑</button>
                            <button type="button" data-act="row-down" ${at} title="Sposta giù">↓</button>
                            <button type="button" data-act="row-del" ${at} title="Elimina l'esercizio">🗑</button>
                        </td>
                    </tr>`;
                });
                html += `</tbody></table>
                    <button type="button" class="wp-add" data-act="row-add" data-p="${pi}" data-b="${bi}">＋ Esercizio</button>
                </div>`;
            });
            html += `<button type="button" class="wp-add" data-act="block-add" data-p="${pi}">＋ Blocco in ${this.esc(ph.title)}</button>`;
        });

        html += `<h2 class="wp-phase" style="--ph:#d9ead3">GRUPPI</h2><div class="wp-groups">`;
        p.groups.forEach((g, gi) => {
            html += `<div class="wp-group">
                ${inp('groups.' + gi + '.name', g.name, 'wp-gname', 'Nome del gruppo (es. bagher)')}
                ${ta('groups.' + gi + '.players', g.players, 'wp-gplayers', 2, 'Giocatori separati da virgola')}
                <button type="button" data-act="group-del" data-g="${gi}" title="Elimina il gruppo">🗑</button>
            </div>`;
        });
        html += `</div><button type="button" class="wp-add" data-act="group-add">＋ Gruppo</button>`;

        root.innerHTML = html;
        if (root.parentElement) root.parentElement.scrollTop = scroll;
        if (this._status) this.setStatus(this._status.html, this._status.kind);
    }

    /** Elenco delle schede aperte non ancora collegate, per collegarne una all'esercizio */
    linkSelect(at) {
        const linked = new Set();
        this.allRows().forEach(({ row }) => { if (row.uid) linked.add(row.uid); });
        const opts = [...this.editor.tabs.entries()]
            .filter(([id, t]) => !linked.has(t.uid) && (t.objects.size > 0))
            .map(([id, t]) => `<option value="${id}">${this.esc(t.name)}</option>`).join('');
        if (!opts) return '';
        return `<select class="wp-link" data-act="link" ${at} title="Collega una scheda già aperta"><option value="">🔗 Collega scheda…</option>${opts}</select>`;
    }

    allRows() {
        const out = [];
        this.plan.phases.forEach((ph, pi) => ph.blocks.forEach((b, bi) => b.rows.forEach((row, ri) => out.push({ ph, b, row, pi, bi, ri }))));
        return out;
    }

    // ============================================================
    // EVENTI
    // ============================================================
    setPath(path, value) {
        const parts = path.split('.');
        let o = this.plan;
        for (let i = 0; i < parts.length - 1; i++) o = o[isNaN(parts[i]) ? parts[i] : parseInt(parts[i], 10)];
        o[parts[parts.length - 1]] = value;
    }

    onInput(e) {
        const f = e.target.dataset && e.target.dataset.f;
        if (!f) return;
        this.setPath(f, e.target.value);
        this.store();
    }

    onChange(e) {
        if (e.target.dataset.act === 'link' && e.target.value !== '') {
            const { p, b, r } = e.target.dataset;
            const row = this.plan.phases[p].blocks[b].rows[r];
            const tab = this.editor.tabs.get(parseInt(e.target.value, 10));
            if (tab) {
                row.uid = this.editor.tabUid(tab);
                this.store();
                this.render();
            }
        }
    }

    async onClick(e) {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const p = btn.dataset.p != null ? parseInt(btn.dataset.p, 10) : null;
        const b = btn.dataset.b != null ? parseInt(btn.dataset.b, 10) : null;
        const r = btn.dataset.r != null ? parseInt(btn.dataset.r, 10) : null;
        const phase = p != null ? this.plan.phases[p] : null;
        const block = phase && b != null ? phase.blocks[b] : null;
        const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
        const newRow = () => ({ nr: '', text: '', g: '', r: '', qty: '', details: '', uid: null });

        switch (act) {
            case 'import-pdf': document.getElementById('wpPdfInput').click(); return;
            case 'open-json': document.getElementById('wpJsonInput').click(); return;
            case 'save-json': this.saveJson(); return;
            case 'pdf': this.exportPdf(); return;
            case 'auto-all': this.autoDrawAll(); return;
            case 'new':
                if (!confirm('Svuotare il piano di allenamento? I disegni restano aperti nelle schede.')) return;
                this.plan = WorkoutPlan.empty();
                break;
            case 'block-add': phase.blocks.push({ title: '', rows: [newRow()] }); break;
            case 'block-del':
                if (block.rows.some(x => x.text.trim()) && !confirm('Eliminare il blocco con i suoi esercizi?')) return;
                phase.blocks.splice(b, 1); break;
            case 'block-up': move(phase.blocks, b, -1); break;
            case 'block-down': move(phase.blocks, b, 1); break;
            case 'row-add': {
                const last = block.rows[block.rows.length - 1];
                block.rows.push({ ...newRow(), nr: this.nextNr(phase, b, last) });
                break;
            }
            case 'row-del': block.rows.splice(r, 1); break;
            case 'row-up': move(block.rows, r, -1); break;
            case 'row-down': move(block.rows, r, 1); break;
            case 'group-add': this.plan.groups.push({ name: '', players: '' }); break;
            case 'group-del': this.plan.groups.splice(parseInt(btn.dataset.g, 10), 1); break;
            case 'unlink': block.rows[r].uid = null; break;
            case 'open': this.openDrawing(p, b, r); return;
            case 'draw': this.drawManually(p, b, r); return;
            case 'auto': await this.autoDraw(p, b, r); break;
            default: return;
        }
        this.store();
        this.render();
    }

    nextNr(phase, bi, last) {
        if (last && /^\d+\.\d+$/.test(last.nr)) {
            const [a, c] = last.nr.split('.').map(Number);
            return `${a}.${c + 1}`;
        }
        return `${bi + 1}.0`;
    }

    // ============================================================
    // DISEGNI DEGLI ESERCIZI
    // ============================================================
    rowTitle(ph, row) {
        const info = WorkoutPlan.PHASE_INFO[ph.key];
        const first = (row.text || '').split('\n')[0].replace(/^•\s*/, '').trim();
        const t = first.length > 40 ? first.slice(0, 38).replace(/\s+\S*$/, '') + '…' : first;
        return `${info.part} ${row.nr || ''} · ${t || 'Esercizio'}`.replace(/\s+·/, ' ·');
    }

    /** Dati dell'esercizio nella scheda: tipologia, descrizione, quantità/tempi e step dagli elenchi puntati */
    fillTabFromRow(tab, ph, row, withSteps) {
        tab.tipologia = ph.key;
        tab.descrizione = [row.text, row.details].filter(Boolean).join('\n');
        const q = WorkoutGenerator.norm(row.qty || '');
        const min = q.match(/(\d+)\s*(?:'|’|min)/);
        if (min) tab.timing = parseInt(min[1], 10);
        const ser = q.match(/^x?(\d+)/);
        if (!min && ser) tab.nr = parseInt(ser[1], 10);
        if (row.g && /^\d+$/.test(row.g.trim())) tab.groups = parseInt(row.g, 10);
        if (withSteps) {
            const bullets = (row.text || '').split('\n').filter(l => /^\s*•/.test(l)).map(l => l.replace(/^\s*•\s*/, '').trim());
            if (bullets.length) {
                tab.exerciseSteps = bullets.map((t, i) => ({ id: `step-${Date.now()}-${i}`, text: t, name: '', timestamp: new Date(), tags: [] }));
            }
        }
    }

    renameActiveTab(name) {
        const ed = this.editor;
        ed.updateTabName(ed.activeTabId, name);
        const input = document.querySelector(`.tab[data-tab-id="${ed.activeTabId}"] .tab-title`);
        if (input) input.value = name;
        const title = document.getElementById('schemaTitle');
        if (title) title.value = name;
    }

    openDrawing(p, b, r) {
        const row = this.plan.phases[p].blocks[b].rows[r];
        const tabId = this.editor.findTabByUid(row.uid);
        if (tabId == null) { this.render(); return; }
        this.hide();
        this.editor.switchToTab(tabId);
        window.Pv4Library?.toast('Disegno dell\'esercizio aperto. Per tornare al piano: «Piano allenamento» nella barra a sinistra.', false);
    }

    drawManually(p, b, r) {
        const ed = this.editor;
        const ph = this.plan.phases[p];
        const row = ph.blocks[b].rows[r];
        const cur = ed.getCurrentTab();
        if (!(ed.noDocs && cur && cur.objects.size === 0)) ed.addNewTab();
        else ed.setNoDocs(false);
        const tab = ed.getCurrentTab();
        this.renameActiveTab(this.rowTitle(ph, row));
        this.fillTabFromRow(tab, ph, row, true);
        row.uid = ed.tabUid(tab);
        ed.switchToTab(ed.activeTabId); // aggiorna i campi del pannello Esercizio e gli step
        this.store();
        this.hide();
        window.Pv4Library?.toast('Disegna qui l\'esercizio (campo e giocatori dalla barra a sinistra, oppure «Crea da testo»). Per tornare al piano: «Piano allenamento».', false);
    }

    async autoDraw(p, b, r, ctx) {
        const ed = this.editor;
        const gen = ed.workoutGenerator;
        const ph = this.plan.phases[p];
        const block = ph.blocks[b];
        const row = block.rows[r];
        if (!row.text.trim()) return null;
        const own = !ctx;
        if (own) {
            const notes = [];
            ctx = { library: await gen.loadLibraryIndex(notes), used: new Set(), notes };
        }
        // un disegno già collegato viene sostituito: la vecchia scheda si chiude
        const oldTab = ed.findTabByUid(row.uid);
        const part = WorkoutGenerator.PARTS.find(x => x.key === ph.key);
        const text = row.text.replace(/^\s*•\s*/gm, '').replace(/\n+/g, '. ');
        const item = await gen.createExercise({ part, text }, { numbers: true }, {
            library: ctx.library, used: ctx.used, title: this.rowTitle(ph, row), contextText: block.title
        });
        const tab = ed.tabs.get(item.tabId);
        if (item.source !== 'library') this.fillTabFromRow(tab, ph, row, false);
        row.uid = ed.tabUid(tab);
        if (oldTab != null && oldTab !== item.tabId) ed.closeTab(oldTab);
        if (own) {
            this.store();
            this.setStatus(this.describe(item, row) + (ctx.notes.length ? '<br>' + ctx.notes.map(n => this.esc(n)).join('<br>') : ''), 'ok');
        }
        return item;
    }

    describe(item, row) {
        const nr = this.esc(row.nr || (row.text || '').split('\n')[0].replace(/^•\s*/, '').slice(0, 40) || 'Esercizio');
        if (item.source === 'library') return `✅ ${nr}: dalla libreria «${this.esc(item.libraryName)}»${item.owner ? ' di ' + this.esc(item.owner) : ''}`;
        if (item.source === 'text') return `✅ ${nr}: disegnato dalla descrizione`;
        return `✅ ${nr}: creato in automatico (${this.esc(item.template)})`;
    }

    async autoDrawAll() {
        const ed = this.editor;
        const rows = this.allRows().filter(({ row }) => row.text.trim() && ed.findTabByUid(row.uid) == null);
        if (!rows.length) { this.setStatus('Tutti gli esercizi hanno già un disegno.', 'note'); return; }
        this.setStatus(`Disegno di ${rows.length} esercizi in corso…`, 'note');
        const notes = [];
        const ctx = { library: await ed.workoutGenerator.loadLibraryIndex(notes), used: new Set(), notes };
        const firstTab = ed.activeTabId;
        let lib = 0, auto = 0;
        for (const { pi, bi, ri } of rows) {
            const item = await this.autoDraw(pi, bi, ri, ctx);
            if (item) item.source === 'library' ? lib++ : auto++;
        }
        if (ed.tabs.has(firstTab) && !(ed.noDocs)) ed.switchToTab(firstTab);
        this.store();
        this.render();
        this.setStatus(`✅ Disegnati ${lib + auto} esercizi: ${lib} dalla libreria, ${auto} creati in automatico. Ognuno è in una scheda collegata («Apri»).` +
            (notes.length ? '<br>' + notes.map(n => this.esc(n)).join('<br>') : ''), 'ok');
    }

    // ============================================================
    // IMPORTAZIONE DA PDF
    // ============================================================
    async ensurePdfJs() {
        if (window.pdfjsLib) return window.pdfjsLib;
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Impossibile caricare il lettore PDF (serve la connessione a internet).'));
            document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return window.pdfjsLib;
    }

    async importPdf(file) {
        try {
            const hasContent = this.allRows().some(({ row }) => row.text.trim()) || this.plan.objective.trim();
            if (hasContent && !confirm('Sostituire il piano attuale con quello del PDF?')) return;
            this.setStatus('Lettura del PDF…', 'note');
            const lib = await this.ensurePdfJs();
            const pages = await PlanPdfParser.readPdf(await file.arrayBuffer(), lib);
            const plan = this.normalize(PlanPdfParser.parsePlanPages(pages));
            const n = plan.phases.reduce((s, ph) => s + ph.blocks.reduce((t, b) => t + b.rows.length, 0), 0);
            if (!n && !plan.objective) {
                this.setStatus('⚠️ Nel PDF non ho trovato un piano di allenamento con questa struttura (Obiettivo, Fase Analitica/Sintetica/Globale con la tabella Nr · Esercizio · … · Dettagli).', 'warn');
                return;
            }
            this.plan = plan;
            this.store();
            this.render();
            this.setStatus(`✅ Importato: ${n} esercizi in ${plan.phases.reduce((s, ph) => s + ph.blocks.length, 0)} blocchi, ${plan.groups.length} gruppi. Controlla i campi, poi «✨ Disegna tutti gli esercizi» per i disegni.`, 'ok');
        } catch (err) {
            this.setStatus('⚠️ ' + this.esc(err.message), 'warn');
        }
    }

    // ============================================================
    // FILE .JSON (piano + disegni)
    // ============================================================
    saveJson() {
        const ed = this.editor;
        const schemas = {};
        const back = ed.activeTabId;
        this.allRows().forEach(({ row }) => {
            const id = ed.findTabByUid(row.uid);
            if (id == null) return;
            if (ed.activeTabId !== id) ed.switchToTab(id);
            schemas[row.uid] = ed.getSchemaData();
        });
        if (ed.tabs.has(back) && ed.activeTabId !== back) ed.switchToTab(back);
        const data = { type: 'pv4-workout-plan', version: (typeof APP_VERSION !== 'undefined' ? APP_VERSION : ''), plan: this.plan, schemas };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const h = this.plan.header;
        a.download = `Allenamento_${(h.numero || '').trim() || new Date().toISOString().slice(0, 10)}.json`.replace(/[\\/:*?"<>|\s]+/g, '_');
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        this.setStatus('💾 Piano salvato con ' + Object.keys(schemas).length + ' disegni.', 'ok');
    }

    async loadJson(file) {
        try {
            const data = JSON.parse(await file.text());
            if (!data || data.type !== 'pv4-workout-plan' || !data.plan) throw new Error('Il file non è un piano di allenamento di VolleyProW4.');
            const ed = this.editor;
            const plan = this.normalize(data.plan);
            const schemas = data.schemas || {};
            for (const { ph, row } of this.allRowsOf(plan)) {
                if (!row.uid || !schemas[row.uid]) { row.uid = null; continue; }
                const existing = ed.findTabByUid(row.uid);
                if (existing != null) continue; // già aperto
                const cur = ed.getCurrentTab();
                if (!(ed.noDocs && cur && cur.objects.size === 0)) ed.addNewTab();
                await ed.loadSchema(Promise.resolve(schemas[row.uid]));
                ed.getCurrentTab().uid = row.uid;
                this.renameActiveTab(this.rowTitle(ph, row));
            }
            this.plan = plan;
            this.store();
            this.render();
            this.setStatus('📂 Piano aperto con ' + Object.keys(schemas).length + ' disegni.', 'ok');
        } catch (err) {
            this.setStatus('⚠️ ' + this.esc(err.message), 'warn');
        }
    }

    allRowsOf(plan) {
        const out = [];
        plan.phases.forEach(ph => ph.blocks.forEach(b => b.rows.forEach(row => out.push({ ph, b, row }))));
        return out;
    }

    // ============================================================
    // PDF (stessa impaginazione della scheda + disegni annessi)
    // ============================================================
    static pdfText(s) {
        // i caratteri non disponibili nei font standard del PDF
        return String(s || '').replace(/[●▪◦○■]/g, '•').replace(/[​ ]/g, ' ').replace(/\t/g, ' ');
    }

    async exportPdf() {
        const ed = this.editor;
        if (!window.jspdf || !window.jspdf.jsPDF) { this.setStatus('⚠️ Libreria PDF non caricata (serve la connessione a internet).', 'warn'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        if (typeof doc.autoTable !== 'function') { this.setStatus('⚠️ Componente tabelle del PDF non caricato (serve la connessione a internet).', 'warn'); return; }
        this.setStatus('Preparazione del PDF…', 'note');
        const T = WorkoutPlan.pdfText;
        const p = this.plan, H = p.header, M = 14, W = 210 - 2 * M;
        const line = [0, 0, 0];
        const grid = { lineColor: line, lineWidth: 0.25, textColor: [0, 0, 0], font: 'helvetica', fontSize: 9, cellPadding: 1.6, valign: 'middle' };

        // --- intestazione
        let y = 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const teamLines = doc.splitTextToSize(T(H.team), 38);
        doc.text(teamLines, M + 19, y, { align: 'center' });
        const cols = [['Stagione', H.season, M + 52], ['Categoria', H.categoria, M + 74], ['Campionato', H.campionato, M + 96]];
        cols.forEach(([l, v, x]) => { doc.text(l, x, y, { align: 'center' }); doc.text(T(v), x, y + 5.5, { align: 'center' }); });
        doc.setFontSize(7.5);
        const kv = (l, v, x, yy) => { doc.text(l + ':', x, yy); doc.text(T(v), x + doc.getTextWidth(l + ':') + 2, yy); };
        kv('Periodo', H.periodo, 122, y - 0.5); kv('Allenamento', H.numero, 160, y - 0.5);
        kv('Palestra', H.palestra, 122, y + 5); kv('Durata', H.durata, 160, y + 5);
        y += Math.max(12, teamLines.length * 5 + 6);

        const section = (title, size = 15) => {
            if (y > 270) { doc.addPage(); y = 16; }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
            doc.text(title, M, y + size * 0.3);
            y += size * 0.45 + 1.5;
        };
        const phaseTitle = (title, rgb) => {
            if (y > 262) { doc.addPage(); y = 16; }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
            const w = doc.getTextWidth(title) + 2;
            doc.setFillColor(...rgb);
            doc.rect(M - 1, y - 0.5, w, 8.2, 'F');
            doc.text(title, M, y + 6);
            y += 9.5;
        };

        // --- obiettivo
        section('Obiettivo');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const obj = doc.splitTextToSize(T(p.objective) || '—', W);
        doc.text(obj, M, y + 2);
        y += obj.length * 4.4 + 3;

        // --- caratteristiche e materiale
        const F = p.features, Mt = p.materials;
        section('Caratteristiche prestative');
        doc.autoTable({
            startY: y, margin: { left: M, right: M }, theme: 'grid', styles: { ...grid, halign: 'center' },
            headStyles: { fillColor: [217, 217, 217], textColor: 0, fontStyle: 'bold', lineColor: line, lineWidth: 0.25 },
            head: [['Categoria', 'Età', 'Campionato', 'Liv. Tecnico med', 'Liv. Tattico med', '% All. Fattibilità']],
            body: [[F.categoria, F.eta, F.campionato, F.livTecnico, F.livTattico, F.fattibilita].map(T)]
        });
        y = doc.lastAutoTable.finalY + 3;
        section('Materiale occorrente');
        doc.autoTable({
            startY: y, margin: { left: M, right: M }, theme: 'grid', styles: { ...grid, halign: 'center' },
            headStyles: { fillColor: [217, 217, 217], textColor: 0, fontStyle: 'bold', lineColor: line, lineWidth: 0.25 },
            head: [['Palloni', 'Muro', 'Tappetini', 'Spalliere', 'Panche', 'Cinesini', 'Carrelli', 'Nastro/corda']],
            body: [[Mt.palloni, Mt.muro, Mt.tappetini, Mt.spalliere, Mt.panche, Mt.cinesini, Mt.carrelli, Mt.nastro].map(T)]
        });
        y = doc.lastAutoTable.finalY + 3;

        // --- fasi
        const drawings = []; // { uid, label, caption }
        p.phases.forEach(ph => {
            if (!ph.blocks.length) return;
            const info = WorkoutPlan.PHASE_INFO[ph.key];
            const glo = ph.key === 'GLO';
            phaseTitle(T(ph.title), info.color);
            const head = glo ? [['Nr', 'Esercizio', 'Nr', 'Dettagli']] : [['Nr', 'Esercizio', 'G', 'R', 'Nr', 'Dettagli']];
            const ncol = head[0].length;
            const body = [];
            ph.blocks.forEach(b => {
                if (b.title) body.push([{ content: T(b.title), colSpan: ncol, styles: { fillColor: [102, 102, 102], textColor: 255, fontStyle: 'bold', halign: 'center' } }]);
                b.rows.forEach(r => {
                    let text = T(r.text);
                    if (r.uid && ed.findTabByUid(r.uid) != null) {
                        const n = drawings.length + 1;
                        drawings.push({ uid: r.uid, label: 'D' + n, caption: `${info.part}${r.nr ? ' ' + r.nr : ''} — ${T((r.text || '').split('\n')[0].replace(/^•\s*/, ''))}` });
                        text += `\n(disegno D${n})`;
                    }
                    const cells = glo ? [T(r.nr), text, T(r.qty), T(r.details)] : [T(r.nr), text, T(r.g), T(r.r), T(r.qty), T(r.details)];
                    body.push(cells);
                });
            });
            const colStyles = glo
                ? { 0: { cellWidth: 9, fillColor: [243, 243, 243] }, 1: { cellWidth: 103 }, 2: { cellWidth: 14, halign: 'center' }, 3: { cellWidth: 56, fontStyle: 'italic' } }
                : { 0: { cellWidth: 9, fillColor: [243, 243, 243] }, 1: { cellWidth: 78 }, 2: { cellWidth: 9, halign: 'center' }, 3: { cellWidth: 13, halign: 'center' }, 4: { cellWidth: 14, halign: 'center' }, 5: { cellWidth: 59, fontStyle: 'italic' } };
            doc.autoTable({
                startY: y, margin: { left: M, right: M }, theme: 'grid',
                rowPageBreak: 'avoid', // un esercizio non viene spezzato tra due pagine
                styles: { ...grid, valign: 'top' },
                headStyles: { fillColor: [217, 217, 217], textColor: 0, fontStyle: 'normal', halign: 'center', lineColor: line, lineWidth: 0.25 },
                columnStyles: colStyles,
                head, body
            });
            y = doc.lastAutoTable.finalY + 3;
        });

        // --- gruppi
        if (p.groups.length) {
            phaseTitle('GRUPPI', [217, 234, 211]);
            doc.setFontSize(10);
            p.groups.forEach(g => {
                const lines = doc.splitTextToSize(T(g.players), W);
                if (y + 6 + lines.length * 4.4 > 285) { doc.addPage(); y = 16; }
                doc.setFont('helvetica', 'normal');
                doc.text(T(g.name) + (g.name ? ':' : ''), M, y + 3);
                doc.text(lines, M, y + 7.5);
                y += 7.5 + lines.length * 4.4 + 2.5;
            });
        }

        // --- disegni annessi
        if (drawings.length) {
            const back = ed.activeTabId;
            doc.addPage();
            y = 16;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
            doc.text('Disegni degli esercizi', M, y + 4);
            y += 11;
            for (const d of drawings) {
                const tabId = ed.findTabByUid(d.uid);
                if (tabId == null) continue;
                let img;
                try { img = await ed.captureTabImage(tabId, { crop: true }); } catch (err) { continue; }
                const maxH = 105;
                let w = Math.min(W, 150), h = img.height * w / img.width;
                if (h > maxH) { h = maxH; w = img.width * h / img.height; }
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
                const cap = doc.splitTextToSize(`${d.label} · ${d.caption}`, W).slice(0, 2);
                const capH = cap.length * 4.6;
                if (y + capH + h + 6 > 284) { doc.addPage(); y = 16; }
                doc.text(cap, M, y + 4);
                const top = y + capH + 2;
                doc.addImage(img.dataUrl, 'JPEG', M + (W - w) / 2, top, w, h);
                doc.setDrawColor(180); doc.rect(M + (W - w) / 2, top, w, h);
                y = top + h + 4;
                // link dei video inseriti nel disegno (cliccabili nel PDF)
                const videos = window.VideoObjects ? VideoObjects.linksOf(ed.tabs.get(tabId)) : [];
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
                videos.forEach(v => {
                    const label = T(`Video: ${v.title}${v.url ? ' — ' + v.url : (v.file ? ' (file ' + v.file + ')' : '')}`).slice(0, 150);
                    if (v.url) { doc.setTextColor(30, 90, 180); doc.textWithLink(label, M, y + 3, { url: v.url }); doc.setTextColor(0); }
                    else doc.text(label, M, y + 3);
                    y += 4.6;
                });
                y += 5;
            }
            if (ed.tabs.has(back)) ed.switchToTab(back);
        }

        // --- numeri di pagina e firma
        const pages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
            doc.text(String(i), 196, 290, { align: 'right' });
            doc.text('VolleyProW4 · SpikeCode AI', M, 290);
            doc.setTextColor(0);
        }
        const name = `Allenamento_${(H.numero || '').trim() || new Date().toISOString().slice(0, 10)}.pdf`.replace(/[\\/:*?"<>|\s]+/g, '_');
        doc.save(name);
        this.setStatus(`📄 PDF creato${drawings.length ? ' con ' + drawings.length + ' disegni annessi' : ''}.`, 'ok');
    }
}

window.WorkoutPlan = WorkoutPlan;
