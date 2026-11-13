/**
 * TeamManagementDialog
 * Gestisce il dialogo per la gestione della squadra
 * 
 * Utilizzo:
 * const teamManager = new TeamManagementDialog(schemaEditor);
 * teamManager.init();
 * teamManager.show();
 */

class TeamManagementDialog {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.teamPlayers = this.loadTeamFromStorage();
        this.showPlayerNames = false;
        this.currentPlayerImage = null;

        this.elements = {
            dialog: null,
            playersList: null,
            newPlayerRole: null,
            newPlayerNumber: null,
            newPlayerName: null,
            addPlayerBtn: null,
            importTextArea: null,
            importFromTextBtn: null,
            importTeamFile: null,
            importTeamBtn: null,
            exportTeamBtn: null,
            clearTeamBtn: null
        };
    }

    /**
     * Inizializza il manager
     */
    init() {
        this.createTeamDialog();
        this.cacheElements();
        this.setupImageDropzone();
    }
    setupImageDropzone() {
        const dz = document.getElementById('playerImageDropzone');
        const input = document.getElementById('playerImageInput');

        if (!dz || !input) return;

        dz.addEventListener('click', () => input.click());

        dz.addEventListener('dragover', e => {
            e.preventDefault();
            dz.classList.add('dragover');
        });

        dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));

        dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('dragover');
            this.loadPlayerImage(e.dataTransfer.files[0]);
        });

        input.addEventListener('change', e => {
            this.loadPlayerImage(e.target.files[0]);
        });
    }
    loadPlayerImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('File non valido');
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            this.currentPlayerImage = e.target.result;

            const dz = document.getElementById('playerImageDropzone');
            dz.innerHTML = `<img src="${this.currentPlayerImage}" class="player-image-preview">`;
        };
        reader.readAsDataURL(file);
    }

    // ============================================================
    // INIZIALIZZAZIONE UI
    // ============================================================
    buildRoleOptions(typeOfSport) {
        const roles = configuration.sports[typeOfSport] || [];

        return roles
            .map(r => `<option value="${r.value}">${r.label}</option>`)
            .join("");
    }

    /**
     * Crea la struttura HTML del dialogo
     */
    createTeamDialog() {
        const roleOptionsHtml = this.buildRoleOptions(this.editor.typeOfSport);

        const html = `
<div class="team-dialog-content">

    <div class="team-form-section full-width">
        <h4>➕ Aggiungi Giocatore</h4>

        <div class="team-form-row">
            <label>Ruolo:</label>
            <label>Numero:</label>
            <label>Nome Completo:</label>
            <label></label>
        </div>

        <div class="team-form-row">
            <select id="newPlayerRole">
                ${roleOptionsHtml}
            </select>

            <input type="number" id="newPlayerNumber" min="1" max="99" placeholder="N°">
            <input type="text" id="newPlayerName" placeholder="Nome e Cognome">
        </div>
        <div class="player-image-dropzone" id="playerImageDropzone">
            <span>📷 Trascina un'immagine<br><small>(opzionale)</small></span>
            <input type="file" id="playerImageInput" accept="image/*" hidden>
        </div>
    </div>

    <div class="team-form-section full-width">
        <h4>📥 Importa giocatori</h4>

        <div id="jsonDropzone" class="json-dropzone roster-dropzone">
            Trascina qui un file: <b>Excel, CSV, PDF, Word, testo, JSON</b> o la <b>foto di un foglio</b><br>
            <small>(oppure clicca per sceglierlo) · prima di confermare vedi l'anteprima e puoi correggere</small>
            <input type="file" id="importTeamFile" accept=".xlsx,.xls,.xlsm,.ods,.csv,.tsv,.txt,.text,.md,.pdf,.docx,.doc,.json,image/*">
        </div>

        <div class="roster-paste-row">
            <button type="button" id="rosterPasteBtn" class="roster-paste-btn">📋 Incolla</button>
            <p class="import-text-help">
                …oppure <b>copia</b> le righe da <b>Excel, Google Fogli, Google Documenti, Word, WhatsApp, email</b> e
                premi <b>Ctrl+V</b> (⌘V su Mac) qui o il pulsante <b>Incolla</b>: si apre subito l'anteprima.
                Puoi anche scrivere l'elenco qui sotto (una riga per giocatore, in qualsiasi ordine numero, nome, ruolo,
                nascita, altezza…) e premere <b>Importa testo</b>.
            </p>
        </div>

        <div class="import-text-container">
            <textarea id="playersImportText"
                rows="4"
                class="import-text-area"
                placeholder="7 Rossi Mario palleggiatore 2004&#10;10 Bianchi Luca schiacciatore 1.92&#10;12 Neri Paolo (libero)"></textarea>
        </div>
    </div>

    <div class="team-form-section full-width">
        <h4>📋 Rosa Giocatori</h4>
        <div class="team-list" id="teamPlayersList"></div>
    </div>

</div>
`;

        this.dialog = createWindow({
            title: 'dlg_title_team',
            icon: '👥',
            id: 'teamManagementDialog',
            contentHTML: html,
            effect: "windows",
            size: 'xl',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_import', align: 'left', close: false, color: 'success', onClick: () => { this.importFromText() } },

                // il bottone di import da file ora apre il file picker
                {
                    label: 'btn_import_file', close: false, color: 'success', onClick: () => {
                        const input = document.getElementById('importTeamFile');
                        if (input) input.click();
                    }
                },

                { label: 'btn_export', align: 'left', close: false, color: 'secondary', onClick: () => { this.exportTeam() } },
                { label: 'btn_clear', close: false, color: 'danger', onClick: () => { this.clearTeam() } },
                { label: 'btn_add', align: 'center', close: false, color: 'success', onClick: () => { this.addPlayer() } },
                { label: 'btn_close', color: 'secondary', onClick: () => { this.hide() } }
            ]
        });



    }

    /**
     * Cachea i riferimenti agli elementi DOM
     */
    cacheElements() {
        this.elements.dialog = document.getElementById('teamManagementDialog');
        this.elements.playersList = document.getElementById('teamPlayersList');
        this.elements.newPlayerRole = document.getElementById('newPlayerRole');
        this.elements.newPlayerNumber = document.getElementById('newPlayerNumber');
        this.elements.newPlayerName = document.getElementById('newPlayerName');

        // questi id esistono ora nell'HTML (file input e textarea)
        this.elements.importTextArea = document.getElementById('playersImportText');
        this.elements.importTeamFile = document.getElementById('importTeamFile');

        // bottoni ausiliari (se vuoi usarli altrove)
        this.elements.addPlayerBtn = document.getElementById('addPlayerBtn');
        this.elements.importFromTextBtn = document.getElementById('importPlayersFromTextBtn');
        this.elements.importTeamBtn = document.getElementById('importTeamBtn');
        this.elements.exportTeamBtn = document.getElementById('exportTeamBtn');
        this.elements.clearTeamBtn = document.getElementById('clearTeamBtn');

        if (!this.elements.dialog) {
            console.error('TeamManagementDialog: HTML elements not found');
        }

        // Incolla (Ctrl+V nel riquadro, nella finestra o pulsante): le tabelle di Excel, Fogli, Documenti e Word
        // arrivano con le loro celle e si apre subito l'anteprima
        this.elements.importTextArea?.addEventListener('paste', (e) => this.onPaste(e, true));
        this.elements.dialog?.addEventListener('paste', (e) => {
            if (e.target === this.elements.importTextArea) return;
            if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
            this.onPaste(e, false);
        });
        document.getElementById('rosterPasteBtn')?.addEventListener('click', () => this.pasteFromClipboard());

        // File scelto o trascinato: lettura e anteprima
        this.elements.importTeamFile?.addEventListener('change', (e) => this.importTeam(e));
        const dz = document.getElementById('jsonDropzone');
        if (dz) {
            dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
            dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
            dz.addEventListener('drop', (e) => {
                e.preventDefault();
                dz.classList.remove('dragover');
                const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (f) this.importFile(f);
            });
        }
    }

    /**
     * Attacca gli event listeners
     */
    // attachEventListeners() {
    //     // Aggiungi giocatore
    //     this.elements.addPlayerBtn?.addEventListener('click', () => this.addPlayer());

    //     // Enter per aggiungere giocatore
    //     this.elements.newPlayerName?.addEventListener('keypress', (e) => {
    //         if (e.key === 'Enter') this.addPlayer();
    //     });

    //     // Importa da testo
    //     this.elements.importFromTextBtn?.addEventListener('click', () => this.importFromText());

    //     // Import/Export/Clear
    //     this.elements.importTeamBtn?.addEventListener('click', () => {
    //         this.elements.importTeamFile?.click();
    //     });

    //     this.elements.importTeamFile?.addEventListener('change', (e) => this.importTeam(e));
    //     this.elements.exportTeamBtn?.addEventListener('click', () => this.exportTeam());
    //     this.elements.clearTeamBtn?.addEventListener('click', () => this.clearTeam());
    // }

    // ============================================================
    // GESTIONE VISIBILITÀ
    // ============================================================

    /**
     * Mostra il dialogo
     */
    show() {
        this.dialog.showDialog();
        this.renderPlayersList();
    }

    /**
     * Nasconde il dialogo
     */
    hide() {
        this.dialog.hideDialog();
    }

    /**
     * Verifica se il dialogo è visibile
     */
    isVisible() {
        return this.elements.dialog?.classList.contains('active') || false;
    }

    // ============================================================
    // GESTIONE STORAGE
    // ============================================================

    /**
     * Carica la squadra dallo storage
     */
    loadTeamFromStorage() {
        try {
            const saved = this.editor.storage.get('volleyTeam');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Errore nel caricamento della squadra:', error);
            return [];
        }
    }

    /**
     * Salva la squadra nello storage
     */
    saveTeamToStorage() {
        try {
            this.editor.storage.set('volleyTeam', JSON.stringify(this.teamPlayers));

            // Aggiorna anche l'editor se presente
            if (this.editor) {
                this.editor.teamPlayers = this.teamPlayers;
            }
        } catch (error) {
            console.error('Errore nel salvataggio della squadra:', error);
        }
    }

    // ============================================================
    // GESTIONE GIOCATORI
    // ============================================================

    /**
     * Aggiunge un nuovo giocatore
     */
    addPlayer() {
        const role = this.elements.newPlayerRole.value;
        const number = parseInt(this.elements.newPlayerNumber.value);
        const name = this.elements.newPlayerName.value.trim();

        if (!name || !number) {
            alert('Inserisci numero e nome del giocatore');
            return;
        }

        // Verifica duplicati
        const exists = this.teamPlayers.find(p =>
            p.role === role || p.number === number
        );

        if (exists) {
            if (!confirm('Ruolo o numero già assegnato. Sostituire?')) return;
            this.teamPlayers = this.teamPlayers.filter(p =>
                p.role !== role && p.number !== number
            );
        }

        // Aggiungi il giocatore
        this.teamPlayers.push({
            role,
            number,
            name,
            image: this.currentPlayerImage
        });
        this.teamPlayers.sort((a, b) => a.number - b.number);

        this.saveTeamToStorage();
        this.renderPlayersList();

        // Reset form
        this.elements.newPlayerNumber.value = '';
        this.elements.newPlayerName.value = '';
        this.elements.newPlayerName.focus();

        this.currentPlayerImage = null;
        document.getElementById('playerImageDropzone').innerHTML =
            '📷 Trascina un\'immagine<br><small>(opzionale)</small>';
    }

    /**
     * Modifica un giocatore esistente
     */
    editPlayer(index) {
        const player = this.teamPlayers[index];
        if (!player) return;
        this.currentPlayerImage = player.image || null;

        const dz = document.getElementById('playerImageDropzone');
        dz.innerHTML = player.image
            ? `<img src="${player.image}" class="player-image-preview">`
            : '📷 Trascina un\'immagine<br><small>(opzionale)</small>';

        this.elements.newPlayerRole.value = player.role;
        this.elements.newPlayerNumber.value = player.number;
        this.elements.newPlayerName.value = player.name;
        //this.deletePlayer(index);
        this.elements.newPlayerName.focus();
    }

    /**
     * Elimina un giocatore
     */
    deletePlayer(index) {
        if (!confirm('Eliminare questo giocatore?')) return;
        this.teamPlayers.splice(index, 1);
        this.saveTeamToStorage();
        this.renderPlayersList();
    }

    /**
     * Renderizza la lista dei giocatori
     */
    renderPlayersList() {
        const container = this.elements.playersList;
        if (!container) return;

        container.innerHTML = '';

        if (this.teamPlayers.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Nessun giocatore inserito</p>';
            return;
        }

        this.teamPlayers.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'team-player-item';

            const roleDiv = document.createElement('div');
            roleDiv.className = 'team-player-role';
            roleDiv.textContent = player.role;

            const numberDiv = document.createElement('div');
            numberDiv.className = 'team-player-number';
            numberDiv.textContent = player.number === '' || player.number == null ? '—' : `#${player.number}`;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'team-player-name';
            nameDiv.textContent = player.name;
            const det = [player.position, player.birth, player.height ? player.height + ' cm' : '', player.email, player.phone, player.notes].filter(Boolean).join(' · ');
            if (det) {
                const small = document.createElement('small');
                small.className = 'team-player-details';
                small.textContent = det;
                nameDiv.appendChild(small);
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'team-player-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Modifica';
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.editPlayer(index);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Elimina';
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deletePlayer(index);
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            item.appendChild(roleDiv);
            if (player.image) {
                const img = document.createElement('img');
                img.src = player.image;
                img.className = 'player-image-preview';
                item.appendChild(img);
            }

            item.appendChild(numberDiv);
            item.appendChild(nameDiv);
            item.appendChild(actionsDiv);

            container.appendChild(item);
        });
    }

    // ============================================================
    // IMPORT/EXPORT
    // ============================================================

    /**
     * Importa giocatori da testo
     * Formato: Ruolo.Numero.Nome, Ruolo.Numero.Nome, ...
     */
    importFromText() {
        const text = (this.elements.importTextArea?.value || '').trim();
        if (!text) {
            alert('Incolla l\'elenco dei giocatori nel riquadro, oppure trascina un file (Excel, PDF, Word, foto…).');
            return;
        }
        this.openImportPreview({ kind: 'text', label: 'Testo incollato', name: '', rows: RosterImport.textToRows(text) });
    }

    /** Ctrl+V: tabella o testo degli appunti → anteprima */
    onPaste(e, inTextarea) {
        const cd = e.clipboardData;
        if (!cd) return;
        // file incollati (es. screenshot di un elenco o file copiato dal computer)
        const file = Array.from(cd.files || [])[0];
        if (file) { e.preventDefault(); this.importFile(file); return; }
        const html = cd.getData('text/html');
        const text = cd.getData('text/plain');
        const { rows, label } = RosterImport.clipboardToRows(html, text);
        // nel riquadro una sola riga breve si incolla normalmente (si sta scrivendo a mano)
        if (inTextarea && rows.length < 2 && !/<table/i.test(html || '')) return;
        if (!rows.length) return;
        e.preventDefault();
        if (inTextarea && this.elements.importTextArea) this.elements.importTextArea.value = text || rows.map(r => r.join('\t')).join('\n');
        this.openImportPreview({ kind: 'paste', label, name: '', rows });
    }

    /** Pulsante Incolla: legge gli appunti (tabella HTML se c'è, altrimenti testo) */
    async pasteFromClipboard() {
        let html = '', text = '';
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                for (const it of items) {
                    const img = it.types.find(t => t.startsWith('image/'));
                    if (img && !it.types.includes('text/plain')) {
                        const blob = await it.getType(img);
                        return this.importFile(new File([blob], 'appunti.' + img.split('/')[1], { type: img }));
                    }
                    if (it.types.includes('text/html')) html = await (await it.getType('text/html')).text();
                    if (it.types.includes('text/plain')) text = await (await it.getType('text/plain')).text();
                }
            } else if (navigator.clipboard && navigator.clipboard.readText) {
                text = await navigator.clipboard.readText();
            }
        } catch (err) {
            try { text = await navigator.clipboard.readText(); } catch (e2) { /* permesso negato */ }
        }
        const { rows, label } = RosterImport.clipboardToRows(html, text);
        if (!rows.length) {
            alert('Gli appunti sono vuoti o il browser non permette di leggerli.\n\nCopia le righe (da Excel, Google Fogli, Documenti, Word…) e premi Ctrl+V (⌘V su Mac) nel riquadro.');
            this.elements.importTextArea?.focus();
            return;
        }
        this.openImportPreview({ kind: 'paste', label, name: '', rows });
    }

    /** Legge un file di qualsiasi tipo supportato e apre l'anteprima */
    async importFile(file) {
        const status = (msg) => this.setImportStatus(msg);
        try {
            status('Lettura di «' + file.name + '»…');
            const src = await RosterImport.readFile(file, status);
            status('');
            this.openImportPreview(src);
        } catch (err) {
            status('');
            console.error('Importazione giocatori:', err);
            alert('Non riesco a leggere «' + file.name + '»: ' + (err.message || err));
        }
    }

    setImportStatus(msg) {
        let el = document.getElementById('rosterImportStatus');
        const dz = document.getElementById('jsonDropzone');
        if (!el && dz) {
            el = document.createElement('div');
            el.id = 'rosterImportStatus';
            el.className = 'roster-import-status';
            dz.insertAdjacentElement('afterend', el);
        }
        if (el) { el.textContent = msg || ''; el.style.display = msg ? '' : 'none'; }
    }

    // ============================================================
    // ANTEPRIMA DELL'IMPORTAZIONE
    // ============================================================

    openImportPreview(src) {
        this.imp = { src, rows: RosterImport.trimTitleRows(src.rows || []), mode: this.teamPlayers.length ? 'merge' : 'replace', info: null, players: [] };
        this.rebuildImport();
        if (!this.imp.players.length) {
            alert('Nessun giocatore riconosciuto in ' + (src.name ? '«' + src.name + '»' : 'questo testo') + '.' +
                (src.note ? '\n\n' + src.note : '\n\nControlla che ci siano nomi e numeri, una riga per giocatore.'));
            return;
        }
        if (!this.previewWin) {
            this.previewWin = createWindow({
                title: 'Anteprima importazione giocatori',
                icon: '📥',
                id: 'rosterImportPreview',
                contentHTML: '<div id="rosterImportBody" class="roster-import"></div>',
                effect: 'windows',
                size: 'xl',
                modal: true,
                visible: false,
                buttons: [
                    { label: 'Annulla', color: 'secondary', onClick: () => this.previewWin.hideDialog() },
                    { id: 'rosterImportConfirm', label: 'Importa', close: false, color: 'success', onClick: () => this.confirmImport() }
                ]
            });
            // sopra la finestra Squadra
            const ov = document.querySelector('.overlay-for-rosterImportPreview');
            if (ov) ov.style.zIndex = 10050;
            this.previewWin.style.zIndex = 10051;
            const body = document.getElementById('rosterImportBody');
            body.addEventListener('change', (e) => this.onPreviewEdit(e));
            body.addEventListener('input', (e) => { if (e.target.matches('input[type=text],input[type=number]')) this.onPreviewEdit(e, true); });
        }
        this.renderImportPreview();
        this.previewWin.showDialog();
        const ov = document.querySelector('.overlay-for-rosterImportPreview');
        if (ov) ov.style.zIndex = 10050;
        this.previewWin.style.zIndex = 10051;
    }

    /** riconosce di nuovo i giocatori (dopo un cambio di foglio, di colonne o di intestazione) */
    rebuildImport(opts) {
        const { players, info } = RosterImport.buildPlayers(this.imp.rows, opts);
        players.forEach(p => { p.include = !/Nome mancante/.test(p.warn || ''); });
        this.imp.info = info;
        this.imp.players = players;
        RosterImport.assignRoles(players, this.teamPlayers, this.imp.mode);
    }

    roleOptions(selected) {
        const roles = (configuration.sports[this.editor.typeOfSport] || configuration.sports.volleyball || []);
        const list = roles.some(r => r.value === 'Other') ? roles : roles.concat([{ value: 'Other', label: 'Other - Altro' }]);
        return list.map(r => `<option value="${r.value}"${r.value === selected ? ' selected' : ''}>${r.label}</option>`).join('');
    }

    /** esito di ogni riga rispetto alla rosa attuale */
    importStatus(p) {
        if (p.include === false) return { cls: 'off', text: 'Escluso' };
        const warn = p.warn && !/ripetuto/.test(p.warn) ? p.warn : '';
        const dupInFile = this.imp.players.filter(q => q.include !== false && q.number !== null && q.number === p.number).length > 1;
        if (dupInFile) return { cls: 'warn', text: '⚠ Numero ripetuto nel file' };
        if (this.imp.mode === 'merge' && p.number !== null) {
            const ex = this.teamPlayers.find(t => t.number === p.number);
            if (ex) return { cls: 'upd', text: `Aggiorna #${ex.number} ${ex.name}` + (warn ? ' · ⚠ ' + warn : '') };
        }
        return warn ? { cls: 'warn', text: '⚠ ' + warn } : { cls: 'new', text: 'Nuovo' };
    }

    renderImportPreview() {
        const body = document.getElementById('rosterImportBody');
        if (!body) return;
        const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const { src, info, players } = this.imp;
        const cols = info.tabular ? info.mapping.length : 0;
        const headerRow = info.tabular && info.header >= 0 ? this.imp.rows[info.header] : null;

        let html = `<div class="ri-source">${src.kind === "paste" ? "📋" : "📄"} <b>${esc(src.name || src.label)}</b> <span>${esc(src.name ? src.label : '')} · ${players.length} giocatori riconosciuti</span></div>`;
        if (src.note) html += `<div class="ri-note">${esc(src.note)}</div>`;
        if (src.sheets && src.sheets.length > 1) {
            html += `<label class="ri-inline">Foglio <select data-act="sheet">${src.sheets.map((sh, i) => `<option value="${i}"${i === src.sheet ? ' selected' : ''}>${esc(sh.name)} (${sh.rows.length} righe)</option>`).join('')}</select></label>`;
        }
        if (info.tabular) {
            html += `<div class="ri-cols"><div class="ri-cols-title">Colonne del file <label class="ri-inline"><input type="checkbox" data-act="header"${info.header >= 0 ? ' checked' : ''}> la prima riga è l'intestazione</label></div><div class="ri-cols-list">`;
            for (let c = 0; c < cols; c++) {
                const head = headerRow ? headerRow[c] : `Colonna ${c + 1}`;
                const sample = (this.imp.rows[info.header >= 0 ? info.header + 1 : 0] || [])[c] || '';
                html += `<div class="ri-col"><span title="${esc(head)}">${esc(head || 'Colonna ' + (c + 1))}</span><select data-act="map" data-col="${c}">${RosterImport.FIELDS.map(([v, l]) => `<option value="${v}"${info.mapping[c] === v ? ' selected' : ''}>${l}</option>`).join('')}</select><small title="${esc(sample)}">${esc(sample)}</small></div>`;
            }
            html += `</div></div>`;
        }
        html += `<div class="ri-mode">
            <label><input type="radio" name="riMode" value="merge" data-act="mode"${this.imp.mode === 'merge' ? ' checked' : ''}> Aggiungi alla rosa attuale <small>(stesso numero = aggiornato)</small></label>
            <label><input type="radio" name="riMode" value="replace" data-act="mode"${this.imp.mode === 'replace' ? ' checked' : ''}> Sostituisci tutta la rosa <small>(${this.teamPlayers.length} giocatori attuali)</small></label>
        </div>`;
        html += `<div class="ri-table-wrap"><table class="ri-table"><thead><tr>
            <th><input type="checkbox" data-act="all"${players.every(p => p.include !== false) ? ' checked' : ''} title="Tutti"></th>
            <th>N°</th><th>Nome e cognome</th><th>Ruolo</th><th>Dettagli</th><th>Esito</th></tr></thead><tbody>`;
        players.forEach((p, i) => {
            const st = this.importStatus(p);
            const details = [p.family ? RosterImport.familyLabel(p.family) : (p.roleText || ''), p.birth, p.height ? p.height + ' cm' : '', p.email, p.phone, p.notes].filter(Boolean).join(' · ');
            html += `<tr class="${p.include === false ? 'off' : ''}">
                <td><input type="checkbox" data-act="inc" data-i="${i}"${p.include !== false ? ' checked' : ''}></td>
                <td><input type="number" min="0" max="99" data-act="num" data-i="${i}" value="${p.number === null ? '' : p.number}"></td>
                <td><input type="text" data-act="name" data-i="${i}" value="${esc(p.name)}"></td>
                <td><select data-act="role" data-i="${i}">${this.roleOptions(p.role)}</select></td>
                <td class="ri-det" title="${esc(details)}">${esc(details)}</td>
                <td class="ri-st ${st.cls}">${esc(st.text)}</td></tr>`;
        });
        html += `</tbody></table></div><div class="ri-summary" id="rosterImportSummary"></div>`;
        body.innerHTML = html;
        this.updateImportSummary();
    }

    updateImportSummary() {
        const inc = this.imp.players.filter(p => p.include !== false);
        let upd = 0;
        if (this.imp.mode === 'merge') inc.forEach(p => { if (p.number !== null && this.teamPlayers.some(t => t.number === p.number)) upd++; });
        const sum = document.getElementById('rosterImportSummary');
        if (sum) sum.innerHTML = `Verranno importati <b>${inc.length}</b> giocatori: ${inc.length - upd} nuovi` + (upd ? `, ${upd} aggiornati` : '') +
            (this.imp.mode === 'replace' && this.teamPlayers.length ? ` · <b>la rosa attuale (${this.teamPlayers.length}) verrà sostituita</b>` : '');
        const btn = document.getElementById('rosterImportConfirm');
        if (btn) { btn.textContent = `Importa ${inc.length} giocatori`; btn.disabled = !inc.length; btn.style.opacity = inc.length ? '1' : '.5'; }
    }

    onPreviewEdit(e, typing = false) {
        const t = e.target;
        const act = t.dataset.act;
        if (!act) return;
        const p = t.dataset.i !== undefined ? this.imp.players[+t.dataset.i] : null;
        switch (act) {
            case 'name': p.name = t.value.trim(); if (p.name) delete p.warn; return typing ? this.updateImportSummary() : this.renderImportPreview();
            case 'num': {
                const n = t.value === '' ? null : parseInt(t.value, 10);
                p.number = isNaN(n) ? null : n;
                if (p.number !== null && /Numero mancante/.test(p.warn || '')) delete p.warn;
                if (typing) return this.updateImportSummary();
                break;
            }
            case 'role': p.role = t.value; p.roleFixed = true; break;
            case 'inc': p.include = t.checked; break;
            case 'all': this.imp.players.forEach(q => { q.include = t.checked; }); break;
            case 'mode': this.imp.mode = t.value; break;
            case 'sheet': {
                const i = +t.value;
                this.imp.src.sheet = i;
                this.imp.rows = RosterImport.trimTitleRows(this.imp.src.sheets[i].rows);
                this.rebuildImport();
                return this.renderImportPreview();
            }
            case 'header': case 'map': {
                const info = this.imp.info;
                const mapping = Array.from(document.querySelectorAll('#rosterImportBody select[data-act=map]')).map(s => s.value);
                const header = document.querySelector('#rosterImportBody input[data-act=header]')?.checked ? 0 : -1;
                this.rebuildImport({ mapping, header: act === 'header' ? header : info.header });
                return this.renderImportPreview();
            }
            default: return;
        }
        // le sigle libere si riassegnano (senza toccare quelle scelte a mano)
        RosterImport.assignRoles(this.imp.players, this.teamPlayers, this.imp.mode);
        this.renderImportPreview();
    }

    confirmImport() {
        const inc = this.imp.players.filter(p => p.include !== false && p.name);
        if (!inc.length) return;
        const nums = inc.map(p => p.number).filter(n => n !== null);
        const dups = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))];
        if (dups.length && !confirm(`Numeri ripetuti: ${dups.map(n => '#' + n).join(', ')}.\nCorreggili nell'anteprima oppure conferma per importare lo stesso.`)) return;
        const fresh = inc.map(p => {
            const old = this.imp.mode === 'merge' && p.number !== null ? this.teamPlayers.find(t => t.number === p.number) : null;
            const out = {
                role: p.role || 'Other',
                number: p.number === null ? '' : p.number,
                name: p.name,
                image: old ? old.image || null : null
            };
            const extra = { position: p.family ? RosterImport.familyLabel(p.family) : (p.roleText || ''), birth: p.birth, height: p.height, email: p.email, phone: p.phone, notes: p.notes };
            Object.entries(extra).forEach(([k, v]) => { if (v) out[k] = v; else if (old && old[k]) out[k] = old[k]; });
            return out;
        });
        let roster;
        if (this.imp.mode === 'replace') roster = fresh;
        else {
            const numbers = new Set(fresh.map(p => p.number).filter(n => n !== ''));
            const roles = new Set(fresh.map(p => p.role).filter(r => r !== 'Other'));
            // chi resta perde la sigla se è stata data a un nuovo giocatore (niente doppioni)
            const kept = this.teamPlayers.filter(t => !numbers.has(t.number)).map(t => roles.has(t.role) ? { ...t, role: 'Other' } : t);
            roster = kept.concat(fresh);
        }
        roster.sort((a, b) => (a.number === '' ? 999 : a.number) - (b.number === '' ? 999 : b.number));
        this.teamPlayers = roster;
        this.saveTeamToStorage();
        this.renderPlayersList();
        if (this.elements.importTextArea) this.elements.importTextArea.value = '';
        this.previewWin.hideDialog();
        const msg = `Importati ${fresh.length} giocatori nella rosa.`;
        if (this.editor.flashMessage) this.editor.flashMessage(msg); else alert(msg);
    }

    /**
     * Esporta la squadra in JSON
     */
    exportTeam() {
        const data = {
            version: '1.0',
            date: new Date().toISOString(),
            team: this.teamPlayers
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `squadra_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Importa squadra da file JSON
     */
    // --- Sostituisci questa funzione ---
    importTeam(event) {
        const input = (event && event.target) || this.elements.importTeamFile;
        const file = input && input.files && input.files[0];
        if (file) this.importFile(file);
        if (input) input.value = '';           // si può riscegliere lo stesso file
    }

    /**
     * Cancella tutti i giocatori
     */
    clearTeam() {
        if (!confirm('Eliminare tutti i giocatori della squadra?')) return;

        this.teamPlayers = [];
        this.saveTeamToStorage();
        this.renderPlayersList();
    }

    // ============================================================
    // UTILITY
    // ============================================================

    /**
     * Ottiene un giocatore per ruolo
     */
    getPlayerByRole(role) {
        return this.teamPlayers.find(p => p.role === role);
    }

    /**
     * Ottiene tutti i giocatori
     */
    getAllPlayers() {
        return [...this.teamPlayers];
    }

    /**
     * Verifica se un ruolo è già assegnato
     */
    isRoleAssigned(role) {
        return this.teamPlayers.some(p => p.role === role);
    }

    /**
     * Verifica se un numero è già assegnato
     */
    isNumberAssigned(number) {
        return this.teamPlayers.some(p => p.number === number);
    }
}