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
    }

    // ============================================================
    // INIZIALIZZAZIONE UI
    // ============================================================

    /**
     * Crea la struttura HTML del dialogo
     */
    createTeamDialog() {
        const html = `
        <div class="team-dialog-content">

    <!-- Aggiungi Giocatore (riga 1) -->
    <div class="team-form-section full-width">
        <h4>➕ Aggiungi Giocatore</h4>

        <!-- Intestazioni colonne -->
        <div class="team-form-row">
            <label>Ruolo:</label>
            <label>Numero:</label>
            <label>Nome Completo:</label>
            <label></label>
        </div>

        <!-- Input -->
        <div class="team-form-row">
            <select id="newPlayerRole">
                <option value="P1">P1 - Alzatore</option>
                <option value="L1">L1 - Libero</option>
                <option value="S1">S1 - Banda</option>
                <option value="O">O - Opposto</option>
                <option value="C1">C1 - Centro</option>
                <option value="All">All - Allenatore</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>

            <input type="number" id="newPlayerNumber" min="1" max="99" placeholder="N°">
            <input type="text" id="newPlayerName" placeholder="Nome e Cognome">
        </div>
    </div>

    <div class="team-form-section full-width">
        <h4>📝 Importa da Testo</h4>

        <p class="import-text-help">
            Formato: Ruolo.Numero.Nome, Ruolo.Numero.Nome, ...<br>
            <small>Esempio: P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi</small>
        </p>

        <div class="import-text-container">
            <textarea id="playersImportText"
                rows="4"
                class="import-text-area"
                placeholder="P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi"></textarea>
        </div>
    </div>

    <div id="jsonDropzone" class="json-dropzone">
    Trascina qui il file JSON<br>
    <small>(oppure clicca per selezionarlo)</small>
    <input type="file" id="importTeamFile" accept="application/json">
</div>

    <!-- Lista Giocatori (riga 3) -->
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

                { label: 'btn_export',  align: 'left', close: false, color: 'secondary', onClick: () => { this.exportTeam() } },
                { label: 'btn_clear', close: false, color: 'danger', onClick: () => { this.clearTeam() } },
                { label: 'btn_add',  align: 'center', close: false, color: 'success', onClick: () => { this.addPlayer() } },
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

        // Attacca listener sul file input (quando scelgo il file, chiamami)
        this.elements.importTeamFile?.addEventListener('change', (e) => this.importTeam(e));
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
        this.teamPlayers.push({ role, number, name });
        this.teamPlayers.sort((a, b) => a.number - b.number);

        this.saveTeamToStorage();
        this.renderPlayersList();

        // Reset form
        this.elements.newPlayerNumber.value = '';
        this.elements.newPlayerName.value = '';
        this.elements.newPlayerName.focus();
    }

    /**
     * Modifica un giocatore esistente
     */
    editPlayer(index) {
        const player = this.teamPlayers[index];
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
            numberDiv.textContent = `#${player.number}`;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'team-player-name';
            nameDiv.textContent = player.name;

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
        const text = this.elements.importTextArea.value.trim();

        if (!text) {
            alert('Inserisci i dati dei giocatori nel formato richiesto');
            return;
        }

        try {
            const entries = text.split(',').map(e => e.trim());
            const imported = [];
            const errors = [];

            entries.forEach((entry, idx) => {
                const parts = entry.split('.');

                if (parts.length !== 3) {
                    errors.push(`Riga ${idx + 1}: formato non valido`);
                    return;
                }

                const role = parts[0].trim();
                const number = parseInt(parts[1].trim());
                const name = parts[2].trim();

                if (!role || isNaN(number) || !name) {
                    errors.push(`Riga ${idx + 1}: dati incompleti`);
                    return;
                }

                imported.push({ role, number, name });
            });

            if (errors.length > 0) {
                alert('Errori durante l\'importazione:\n' + errors.join('\n'));
                return;
            }

            if (imported.length === 0) {
                alert('Nessun giocatore valido trovato');
                return;
            }

            let added = 0;
            let replaced = 0;

            imported.forEach(player => {
                const existing = this.teamPlayers.find(p =>
                    p.role === player.role || p.number === player.number
                );

                if (existing) {
                    const msg = `Il ruolo ${player.role} o il numero ${player.number} è già assegnato a:\n` +
                        `→ ${existing.role}.${existing.number}.${existing.name}\n\n` +
                        `Vuoi sostituirlo con:\n` +
                        `→ ${player.role}.${player.number}.${player.name}?`;

                    if (confirm(msg)) {
                        // sostituisci eliminando il vecchio
                        this.teamPlayers = this.teamPlayers.filter(p =>
                            p.role !== player.role && p.number !== player.number
                        );
                        this.teamPlayers.push(player);
                        replaced++;
                    }
                } else {
                    // aggiungi nuovo
                    this.teamPlayers.push(player);
                    added++;
                }
            });

            this.teamPlayers.sort((a, b) => a.number - b.number);
            this.saveTeamToStorage();
            this.renderPlayersList();
            this.elements.importTextArea.value = '';

            alert(`Importazione completata!\n\nAggiunti: ${added}\nSostituiti: ${replaced}`);

        } catch (error) {
            alert('Errore durante l\'importazione: ' + error.message);
            console.error('Errore importazione testo:', error);
        }
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
        // supporta sia il caso "change" (event) sia il caso in cui venga chiamata senza event
        try {
            let file = null;

            if (event && event.target && event.target.files) {
                file = event.target.files[0];
            } else if (this.elements.importTeamFile && this.elements.importTeamFile.files) {
                file = this.elements.importTeamFile.files[0];
            }

            if (!file) {
                // nessun file selezionato: esci silenziosamente
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.team && Array.isArray(data.team)) {
                        // qui potresti voler gestire merge vs replace: per ora sostituiamo interamente
                        // (se vuoi comportamento diverso, lo modifichiamo)
                        this.teamPlayers = data.team;
                        this.saveTeamToStorage();
                        this.renderPlayersList();
                        alert('✅ Squadra importata con successo!');
                    } else {
                        alert('❌ File non valido: formato squadra non riconosciuto');
                    }
                } catch (error) {
                    alert('❌ Errore nel caricamento del file: ' + error.message);
                    console.error('Errore importazione file:', error);
                } finally {
                    // reset input per permettere lo stesso file in futuro
                    if (event && event.target) event.target.value = '';
                    if (this.elements.importTeamFile) this.elements.importTeamFile.value = '';
                }
            };

            reader.readAsText(file);
        } catch (err) {
            console.error('importTeam error:', err);
            alert('Errore durante l\'importazione del file: ' + (err.message || err));
        }
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