/**
 * ExerciseWizard — compilazione guidata dei dati dell'esercizio (scheda "Esercizio" del pannello).
 * Si apre da solo per un nuovo schema (o all'avvio, con lo schema vuoto) se i dati non sono ancora compilati;
 * si riapre con il pulsante "🧭 Compilazione guidata" nella scheda Esercizio.
 * Scrive nei campi veri della scheda (con i loro eventi), quindi salvataggio e libreria funzionano come sempre.
 */
class ExerciseWizard {
    constructor(editor) {
        this.editor = editor;
        this.win = null;
        this.step = 0;
    }

    static STEPS = [
        { title: 'Esercizio', hint: 'Come si chiama, quando e dove.' },
        { title: 'Per chi', hint: 'Squadra, categoria e ruoli coinvolti.' },
        { title: 'Tipo di lavoro', hint: 'Periodo della stagione e tipologia.' },
        { title: 'Carico', hint: 'Serie, ripetizioni, tempi di lavoro e recupero.' },
        { title: 'Note', hint: 'Obiettivo, consegne, varianti.' }
    ];
    static TIP_HELP = { ANA: 'un gesto tecnico isolato', SIN: 'più fondamentali collegati', GLO: 'situazione di gioco' };

    // ------------------------------------------------------------------
    // quando aprirlo
    // ------------------------------------------------------------------
    /** i dati dell'esercizio sono già stati compilati? */
    isCompiled(tab = this.editor.getCurrentTab()) {
        if (!tab) return true;
        const def = (v) => !v || v === 'GEN';
        return !!((tab.place && tab.place !== '-') || (tab.descrizione && tab.descrizione.trim()) ||
            !def(tab.periodo) || !def(tab.tipologia) || !def(tab.genere) || !def(tab.categoria) || !def(tab.ruolo));
    }

    autoEnabled() {
        try { return this.editor.loadUserPref('exerciseWizardAuto') !== '0'; } catch (e) { return true; }
    }

    /** apertura automatica: nuovo schema (newSchema=true) o avvio con uno schema vuoto e non compilato */
    maybeOpen(newSchema = false) {
        const ed = this.editor;
        const tab = ed.getCurrentTab();
        if (!tab || !this.autoEnabled() || ed.noDocs || tab.wizardDone || this.isCompiled(tab)) return;
        if (!newSchema && ed.tabHasWork && ed.tabHasWork(tab)) return;
        // non sopra un'altra finestra modale già aperta (es. accesso, libreria)
        const otherModal = Array.from(document.querySelectorAll('[class*="overlay-for-"]')).some(o => o.style.display !== 'none' && !o.classList.contains('overlay-for-exerciseWizard'));
        if (otherModal) return;
        this.open();
    }

    // ------------------------------------------------------------------
    // finestra
    // ------------------------------------------------------------------
    open(step = 0) {
        this.step = step;
        if (!this.win) {
            this.win = createWindow({
                title: 'Nuovo esercizio · compilazione guidata',
                icon: '🧭',
                id: 'exerciseWizard',
                contentHTML: '<div id="exWizBody" class="exwiz"></div>',
                effect: 'windows',
                size: 'lg',
                modal: true,
                visible: false,
                onClose: () => this.markDone(),
                buttons: [
                    { id: 'exWizSkip', label: 'Salta', color: 'secondary', onClick: () => this.close() },
                    { id: 'exWizBack', label: '← Indietro', close: false, color: 'secondary', onClick: () => this.go(-1) },
                    { id: 'exWizNext', label: 'Avanti →', close: false, color: 'success', onClick: () => this.go(1) }
                ]
            });
            const body = document.getElementById('exWizBody');
            body.addEventListener('click', (e) => this.onClick(e));
            body.addEventListener('input', (e) => this.onInput(e));
            body.addEventListener('change', (e) => this.onInput(e));
            body.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); this.go(1); }
            });
        }
        this.render();
        this.win.showDialog();
        setTimeout(() => this.win.querySelector('#exWizBody input:not([type=checkbox]), #exWizBody textarea')?.focus(), 80);
    }

    close() {
        this.markDone();
        this.win?.hideDialog();
    }

    markDone() {
        const tab = this.editor.getCurrentTab();
        if (tab) tab.wizardDone = true;
    }

    go(delta) {
        const n = ExerciseWizard.STEPS.length;
        const next = this.step + delta;
        if (next >= n) {
            this.close();
            this.editor.flashMessage?.('Dati dell\'esercizio salvati: li trovi e li modifichi nella scheda Esercizio.');
            return;
        }
        this.step = Math.max(0, next);
        this.render();
        setTimeout(() => this.win.querySelector('#exWizBody input:not([type=checkbox]), #exWizBody textarea')?.focus(), 30);
    }

    // ------------------------------------------------------------------
    // campi veri della scheda Esercizio
    // ------------------------------------------------------------------
    field(id) { return document.getElementById(id); }

    value(id) {
        const el = this.field(id);
        return el ? el.value : '';
    }

    /** scrive nel campo vero e fa scattare gli stessi eventi della scheda (salvataggio nello schema) */
    setValue(id, v) {
        const el = this.field(id);
        if (!el) return;
        el.value = v;
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
        if (el.tagName !== 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /** opzioni di un menu della scheda (con il gruppo, per la categoria) */
    options(id) {
        const el = this.field(id);
        if (!el) return [];
        return Array.from(el.options).filter(o => !o.hidden && !o.disabled && o.style.display !== 'none')
            .map(o => ({ v: o.value, l: o.textContent.trim(), g: o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '' }));
    }

    chips(id, opts) {
        const cur = this.value(id);
        const esc = (s) => this.esc(s);
        let lastG = null;
        return `<div class="exwiz-chips" data-id="${id}">` + opts.map(o => {
            let head = '';
            if (o.g && o.g !== lastG) { head = `<div class="exwiz-group">${esc(o.g)}</div>`; lastG = o.g; }
            const help = id === 'workoutTipologia' && ExerciseWizard.TIP_HELP[o.v] ? `<small>${ExerciseWizard.TIP_HELP[o.v]}</small>` : '';
            return `${head}<button type="button" class="exwiz-chip${o.v === cur ? ' on' : ''}" data-v="${esc(o.v)}">${esc(o.l)}${help}</button>`;
        }).join('') + `</div>`;
    }

    /** menu a tendina (liste lunghe, es. categoria), con i gruppi della scheda */
    selectHtml(id) {
        const cur = this.value(id);
        const esc = (s) => this.esc(s);
        let html = `<select data-f="${id}">`, open = null;
        this.options(id).forEach(o => {
            if (o.g !== open) { if (open) html += '</optgroup>'; if (o.g) html += `<optgroup label="${esc(o.g)}">`; open = o.g || null; }
            html += `<option value="${esc(o.v)}"${o.v === cur ? ' selected' : ''}>${esc(o.l)}</option>`;
        });
        return html + (open ? '</optgroup>' : '') + '</select>';
    }

    esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // ------------------------------------------------------------------
    // passi
    // ------------------------------------------------------------------
    render() {
        const body = document.getElementById('exWizBody');
        if (!body) return;
        const S = ExerciseWizard.STEPS;
        const st = S[this.step];
        const esc = (s) => this.esc(s);
        const dots = S.map((s, i) => `<button type="button" class="exwiz-dot${i === this.step ? ' on' : ''}${i < this.step ? ' done' : ''}" data-step="${i}" title="${esc(s.title)}"><span>${i + 1}</span>${esc(s.title)}</button>`).join('');
        let html = `<div class="exwiz-steps">${dots}</div><h3>${esc(st.title)}</h3><p class="exwiz-hint">${esc(st.hint)}</p>`;
        const num = (id, label, min, max, unit = '') => `<label class="exwiz-num"><span>${label}</span>
            <span class="exwiz-numrow"><button type="button" data-dec="${id}">−</button><input type="number" data-f="${id}" min="${min}" max="${max}" value="${esc(this.value(id))}"><button type="button" data-inc="${id}">+</button>${unit ? `<em>${unit}</em>` : ''}</span></label>`;
        switch (this.step) {
            case 0: {
                const title = document.getElementById('schemaTitle')?.value || '';
                const place = this.value('workoutPlace');
                html += `<label class="exwiz-field"><span>Nome dell'esercizio</span><input type="text" data-f="schemaTitle" value="${esc(title)}" placeholder="es. Ricezione a 3 contro battuta flot"></label>
                    <div class="exwiz-row">
                        <label class="exwiz-field"><span>Data</span><input type="date" data-f="workoutDate" value="${esc(this.value('workoutDate'))}"></label>
                        <label class="exwiz-field"><span>Dove</span><input type="text" data-f="workoutPlace" value="${esc(place === '-' ? '' : place)}" placeholder="es. Palestra comunale"></label>
                    </div>`;
                break;
            }
            case 1:
                html += `<div class="exwiz-label">Genere</div>${this.chips('workoutGenere', this.options('workoutGenere'))}
                    <label class="exwiz-field"><span>Categoria</span>${this.selectHtml('workoutCategoria')}</label>
                    <div class="exwiz-label">Gruppo</div>${this.chips('workoutGroups', this.options('workoutGroups'))}
                    <div class="exwiz-label">Ruolo</div>${this.chips('workoutRuolo', this.options('workoutRuolo'))}`;
                break;
            case 2:
                html += `<div class="exwiz-label">Periodo</div>${this.chips('workoutPeriodo', this.options('workoutPeriodo'))}
                    <div class="exwiz-label">Tipologia</div>${this.chips('workoutTipologia', this.options('workoutTipologia'))}`;
                break;
            case 3:
                html += `<div class="exwiz-nums">${num('workoutSeries', 'Serie', 1, 99)}${num('workoutNr', 'Ripetizioni', 0, 999)}${num('workoutTiming', 'Tempo di lavoro', 0, 600, 's')}${num('workoutRec', 'Recupero', 0, 600, 's')}</div>`;
                break;
            case 4:
                html += `<label class="exwiz-field"><span>Note</span><textarea data-f="workoutDescrizione" rows="6" placeholder="Obiettivo, consegne, varianti, punteggio…">${esc(this.value('workoutDescrizione'))}</textarea></label>`;
                break;
        }
        html += `<label class="exwiz-auto"><input type="checkbox" data-auto="1"${this.autoEnabled() ? '' : ' checked'}> Non aprire in automatico per i nuovi schemi (resta il pulsante 🧭 nella scheda Esercizio)</label>`;
        body.innerHTML = html;
        const back = document.getElementById('exWizBack');
        const next = document.getElementById('exWizNext');
        if (back) back.style.visibility = this.step === 0 ? 'hidden' : '';
        if (next) next.textContent = this.step === S.length - 1 ? '✓ Fine' : 'Avanti →';
    }

    onClick(e) {
        const dot = e.target.closest('[data-step]');
        if (dot) { this.step = +dot.dataset.step; return this.render(); }
        const chip = e.target.closest('.exwiz-chip');
        if (chip) {
            const id = chip.parentElement.dataset.id;
            this.setValue(id, chip.dataset.v);
            // il genere filtra le categorie: si ridisegna il passo
            if (id === 'workoutGenere') {
                const cat = this.field('workoutCategoria');
                if (cat && !this.options('workoutCategoria').some(o => o.v === cat.value)) this.setValue('workoutCategoria', 'GEN');
                return this.render();
            }
            chip.parentElement.querySelectorAll('.exwiz-chip').forEach(c => c.classList.toggle('on', c === chip));
            return;
        }
        const inc = e.target.closest('[data-inc],[data-dec]');
        if (inc) {
            const id = inc.dataset.inc || inc.dataset.dec;
            const inp = this.win.querySelector(`[data-f="${id}"]`);
            const step = /Timing|Rec/.test(id) ? 5 : 1;
            const v = Math.max(+inp.min || 0, Math.min(+inp.max || 999, (parseInt(inp.value, 10) || 0) + (inc.dataset.inc ? step : -step)));
            inp.value = v;
            this.setValue(id, String(v));
        }
    }

    onInput(e) {
        const t = e.target;
        if (t.dataset.auto) {
            try { this.editor.saveUserPref('exerciseWizardAuto', t.checked ? '0' : '1'); } catch (err) { /* ignore */ }
            return;
        }
        const id = t.dataset.f;
        if (!id) return;
        if (id === 'schemaTitle') {
            // come «Crea da testo»: nome della scheda, linguetta e titolo in alto
            const ed = this.editor;
            const name = t.value.trim();
            if (!name) return;
            ed.updateTabName(ed.activeTabId, name);
            const tabInput = document.querySelector(`.tab[data-tab-id="${ed.activeTabId}"] .tab-title`);
            if (tabInput) tabInput.value = name;
            const title = document.getElementById('schemaTitle');
            if (title) title.value = name;
            return;
        }
        this.setValue(id, id === 'workoutPlace' && !t.value.trim() ? '-' : t.value);
    }
}

if (typeof window !== 'undefined') window.ExerciseWizard = ExerciseWizard;
