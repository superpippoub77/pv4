/**
 * MenuManager - Gestione centralizzata del menu dell'applicazione
 * Separato da SchemaEditor per una migliore manutenzione e riusabilità
 */

class MenuManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
    }

    createMenu(menuData) {
        return new Promise((resolve, reject) => {
            try {
                const menuBar = document.createElement("div");
                menuBar.id = "menu";
                menuBar.className = "menu-bar";
                menuBar.style.display = "none";

                menuData.forEach(menu => {
                    const item = document.createElement("div");
                    item.className = "menu-item" + (menu.meta && menu.meta.align === "right" ? " right" : "");

                    const label = document.createElement("span");
                    label.className = "menu-label";
                    label.textContent = menu.label;
                    item.appendChild(label);

                    const dropdown = document.createElement("div");
                    dropdown.className = "menu-dropdown";

                    menu.items.forEach(entry => {

                        if (entry.separator) {
                            const sep = document.createElement("div");
                            sep.className = "menu-dropdown-separator";
                            dropdown.appendChild(sep);
                            return;
                        }

                        const row = document.createElement("div");
                        row.className = "menu-dropdown-item";

                        if (entry.html) {
                            row.innerHTML = entry.html;
                            dropdown.appendChild(row);
                            return;
                        }

                        row.dataset.action = entry.action;

                        if (entry.checkbox) {
                            row.classList.add("checkbox");
                            row.innerHTML = `<input type="checkbox" id="${entry.checkbox}"> ${entry.icon} ${entry.label}`;
                        } else {
                            row.innerHTML = `${entry.icon} ${entry.label}`;
                        }

                        if (entry.shortcut) {
                            const sc = document.createElement("span");
                            sc.className = "shortcut";
                            sc.textContent = entry.shortcut;
                            row.appendChild(sc);
                        }

                        dropdown.appendChild(row);
                    });

                    item.appendChild(dropdown);
                    menuBar.appendChild(item);
                });

                // ⬅️ QUI: appendi all'inizio del body
                document.body.prepend(menuBar);

                console.log("Menu creato con successo!");
                resolve();
            } catch (err) {
                console.error("Errore nella creazione del menu:", err);
                reject(err);
            }
        });
    }
    /**
     * Inizializza il manager del menu
     */
    async init(menuData) {
        await this.createMenu(menuData);
        this.initMenuBar();
        this.bindMenuActions();
    }

    /**
     * Inizializza la barra dei menu
     */
    initMenuBar() {
        const menuItems = document.querySelectorAll('.menu-dropdown-item[data-action]');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                const size = item.dataset.size;
                const bg = item.dataset.bg;

                // Chiudi tutti i menu
                document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

                // Esegui l'azione
                this.executeMenuAction(action, size, bg);
            });
        });

        // Gestione apertura/chiusura menu
        document.querySelectorAll('.menu-item').forEach(menuItem => {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = menuItem.classList.contains('active');

                // Chiudi tutti i menu
                document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

                // Apri/chiudi il menu corrente
                if (!isActive) {
                    menuItem.classList.add('active');
                }
            });
        });

        // Chiudi menu al click fuori
        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        });

        // Sincronizza checkbox con stato corrente
        this.syncMenuCheckboxes();
    }

    /**
     * Esegue l'azione del menu selezionato
     */
    executeMenuAction(action, size, bg) {
        const actions = {
            // ========== FILE ==========
            'newSchema': () => this.editor.addNewTab(),
            'saveSchema': () => this.editor.saveSchema(),
            'loadSchema': () => document.getElementById('fileInput').click(),
            'saveWorkout': () => this.editor.showSaveWorkoutDialog(),
            'loadWorkout': () => document.getElementById('workoutFileInput').click(),
            'loadFromLibrary': () => document.getElementById('loadFromLibrary').click(),
            'exportSchema': () => this.editor.exportSchema(),
            'exportPDF': () => this.editor.exportWorkoutToPDF(),
            'exportWorkout': () => this.editor.exportWorkoutToPDF(),
            'exportFormations': () => this.editor.exportFormationSheet(),

            // ========== MODIFICA ==========
            'undo': () => this.editor.undo(),
            'redo': () => this.editor.redo(),
            'cut': () => this.editor.cutSelected(),
            'copy': () => this.editor.copySelected(),
            'paste': () => this.editor.paste(),
            'delete': () => this.editor.deleteSelected(),
            'selectAll': () => this.editor.selectAll(),
            'rotateLeft': () => this.editor.rotateSelected(-15),
            'rotateRight': () => this.editor.rotateSelected(15),
            'rotateGroupLeft': () => this.editor.rotateGroup(-15),
            'rotateGroupRight': () => this.editor.rotateGroup(15),

            // ========== VISTA ==========
            'zoomIn': () => this.editor.changeZoom(0.1),
            'zoomOut': () => this.editor.changeZoom(-0.1),
            'toggleGrid': () => {
                this.editor.getCurrentTab().gridVisible = !this.editor.getCurrentTab().gridVisible;
                this.editor.updateGrid();
                this.syncMenuCheckboxes();
            },
            'toggleBW': () => {
                this.editor.getCurrentTab().bwMode = !this.editor.getCurrentTab().bwMode;
                this.editor.updateBWMode();
                this.syncMenuCheckboxes();
            },
            'toggleDashed': () => {
                this.editor.dashedMode = !this.editor.dashedMode;
                document.getElementById('dashedToggle').classList.toggle('active', this.editor.dashedMode);
                this.syncMenuCheckboxes();
            },
            'toggleLabels': () => {
                this.editor.toggleObjectLabels();
                this.syncMenuCheckboxes();
            },
            'toggleBorder': () => {
                this.editor.toggleCanvasBorder();
                this.syncMenuCheckboxes();
            },
            'togglePlayerNames': () => this.editor.togglePlayerNames(),
            'snapToGrid': () => this.editor.snapObjectsToGrid(),
            'renumberObjects': () => this.editor.renumberAllObjects(),

            // ========== OGGETTI ==========
            'bringToFront': () => this.editor.bringToFront(),
            'sendToBack': () => this.editor.sendToBack(),
            'arrowMode': () => {
                this.editor.arrowMode = !this.editor.arrowMode;
                document.getElementById('arrowModeBtn').classList.toggle('active', this.editor.arrowMode);
                document.getElementById('canvas').style.cursor = this.editor.arrowMode ? 'crosshair' : 'default';
                this.editor.deselectAll();
            },
            'freehandMode': () => {
                this.editor.freehandMode = !this.editor.freehandMode;
                document.getElementById('freehandModeBtn').classList.toggle('active', this.editor.freehandMode);
                document.getElementById('canvas').style.cursor = this.editor.freehandMode ? 'crosshair' : 'default';
                this.editor.deselectAll();
            },
            'showAnimation': () => this.editor.showAnimationControls(),

            // ========== CANVAS ==========
            'setSize': () => {
                if (size) {
                    this.editor.setCanvasSize(size);
                    document.getElementById('canvasSizeSelect').value = size;
                }
            },
            'setBackground': () => {
                if (bg) {
                    this.editor.getCurrentTab().background = bg;
                    this.editor.updateBackground();
                    document.getElementById('backgroundSelect').value = bg;
                }
            },

            // ========== SQUADRA ==========
            'manageTeam': () => this.editor.teamManagementManager.show(),

            // ========== STRUMENTI ==========
            'openNotepad': () => {
                if (window.createWindow) {
                    window.createWindow({
                        title: 'Blocco Note',
                        contentHTML: '<textarea style="width:100%;height:100%;box-sizing:border-box;font-family:monospace;padding:10px;border:none;outline:none;">Scrivi qui le tue note...</textarea>'
                    });
                }
            },
            'showHistory': () => this.editor.historyManager.show(),
            'settings': () => this.showSettingsDialog(),

            // ========== AIUTO ==========
            'help': () => this.showHelpDialog(),
            'shortcuts': () => this.showShortcutsDialog(),
            'about': () => this.showAboutDialog(),

            // ========== USER ==========
            'logout': () => this.editor.handleLogout(),
        };

        if (actions[action]) {
            actions[action]();
        } else {
            console.warn(`Action "${action}" not implemented yet`);
        }
    }

    /**
     * Sincronizza i checkbox del menu con lo stato corrente
     */
    syncMenuCheckboxes() {
        const tab = this.editor.getCurrentTab();

        // Grid
        const gridCheck = document.getElementById('menu-grid-check');
        if (gridCheck) gridCheck.checked = tab.gridVisible;

        // B/W
        const bwCheck = document.getElementById('menu-bw-check');
        if (bwCheck) bwCheck.checked = tab.bwMode;

        // Dashed
        const dashedCheck = document.getElementById('menu-dashed-check');
        if (dashedCheck) dashedCheck.checked = this.editor.dashedMode;

        // Labels
        const labelsCheck = document.getElementById('menu-labels-check');
        if (labelsCheck) {
            labelsCheck.checked = document.getElementById('canvas').classList.contains('show-all-labels');
        }

        // Border
        const borderCheck = document.getElementById('menu-border-check');
        if (borderCheck) borderCheck.checked = this.editor.showCanvasBorder;
    }

    /**
     * Dialog per Impostazioni
     */
    showSettingsDialog() {
        const dialog = createWindow({
            title: '⚙️ Impostazioni',
            contentHTML: `
            <div style="padding: 20px;">
                <h4>Impostazioni Generali</h4>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px;">Autore predefinito:</label>
                    <input type="text" id="settings-author" value="${this.editor.currentUser || ''}" 
                           style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px;">
                </div>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px;">Griglia predefinita:</label>
                    <input type="number" id="settings-grid" value="20" min="5" max="50"
                           style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px;">
                </div>
            </div>
        `,
            buttons: [
                {
                    label: 'Salva', onClick: () => {
                        this.editor.currentUser = document.getElementById('settings-author').value;
                        alert('✅ Impostazioni salvate');
                    }
                }
            ]
        });
    }

    /**
     * Dialog per Scorciatoie da tastiera
     */
    showShortcutsDialog() {
        const shortcuts = [
            { key: 'Ctrl+Z', action: 'Annulla' },
            { key: 'Ctrl+Y', action: 'Ripeti' },
            { key: 'Ctrl+C', action: 'Copia' },
            { key: 'Ctrl+X', action: 'Taglia' },
            { key: 'Ctrl+V', action: 'Incolla' },
            { key: 'Ctrl+A', action: 'Seleziona tutto' },
            { key: 'Ctrl+H', action: 'Storico modifiche' },
            { key: 'Canc', action: 'Elimina selezionati' },
            { key: 'Frecce', action: 'Sposta oggetti' },
            { key: 'Shift+Frecce', action: 'Sposta veloce (10px)' },
            { key: 'Esc', action: 'Deseleziona tutto' }
        ];

        const html = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 15px;">⌨️ Scorciatoie da Tastiera</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${shortcuts.map(s => `
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                        <td style="padding: 8px; font-weight: bold; font-family: monospace;">${s.key}</td>
                        <td style="padding: 8px;">${s.action}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;

        createWindow({ title: '⌨️ Scorciatoie da Tastiera', contentHTML: html });
    }

    /**
     * Dialog Informazioni
     */
    showAboutDialog() {
        const html = `
        <div style="padding: 30px; text-align: center;">
            <h2 style="color: #3498db; margin-bottom: 10px;">Volleyball Coach Pro W4</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">Editor Professionale per Allenatori di Pallavolo</p>
            <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; margin-top: 20px;">
                <p><strong>Versione:</strong> 4.0.0</p>
                <p><strong>Autore:</strong> Filippo Morano</p>
                <p><strong>Web:</strong> <a href="https://www.filippomorano.com" target="_blank">filippomorano.com</a></p>
                <p style="margin-top: 20px; color: #95a5a6; font-size: 12px;">
                    © 2025 SpikeCode - Tutti i diritti riservati
                </p>
            </div>
        </div>
    `;

        createWindow({ title: 'ℹ️ Informazioni', contentHTML: html });
    }

    /**
     * Dialog Guida
     */
    showHelpDialog() {
        const html = `
        <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
            <h3>📖 Guida Rapida</h3>
            
            <h4 style="margin-top: 20px;">🎯 Creazione Schemi</h4>
            <ol>
                <li>Trascina gli elementi dalla barra laterale sul canvas</li>
                <li>Usa le maniglie per ridimensionare e ruotare</li>
                <li>Clicca sui punti arancioni per creare frecce</li>
                <li>Doppio click sul testo per modificarlo</li>
            </ol>
            
            <h4 style="margin-top: 20px;">👥 Gestione Squadra</h4>
            <p>Dal menu Squadra → Gestisci Squadra puoi inserire i nomi e numeri dei giocatori.</p>
            
            <h4 style="margin-top: 20px;">💾 Salvataggio</h4>
            <ul>
                <li><strong>Salva Schema:</strong> Salva solo il tab corrente</li>
                <li><strong>Salva Allenamento:</strong> Salva tutti i tab insieme</li>
            </ul>
            
            <h4 style="margin-top: 20px;">🎬 Animazioni</h4>
            <p>Usa il pulsante Animazione per creare sequenze animate di movimento degli oggetti.</p>
        </div>
    `;

        createWindow({ title: '📖 Guida', contentHTML: html });
    }

    /**
     * Binding aggiuntivi per azioni menu
     */
    bindMenuActions() {
        // Aggiungi qui binding aggiuntivi se necessario
    }
}