/**
 * LibraryWorkoutDialogManager
 * Gestisce il dialogo per caricare allenamenti dalla libreria
 * 
 * Utilizzo:
 * const libraryManager = new LibraryWorkoutDialogManager(schemaEditor);
 * libraryManager.init();
 * libraryManager.show();
 */

class LibraryWorkoutDialogManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.overlay = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.libraryWorkouts = [];
        this.selectedLibraryFile = null;
        this.librarySource = 'unknown';

        this.elements = {
            dialog: null,
            overlay: null,
            header: null,
            closeBtn: null,
            workoutList: null,
            filterPeriodo: null,
            filterTipologia: null,
            filterRuolo: null,
            loadBtn: null
        };
    }

    /**
     * Inizializza il manager
     */
    init() {
        this.createLibraryDialog();
        this.cacheElements();
        this.setupEventListeners();
    }

    /**
     * Crea il dialogo HTML
     */
    createLibraryDialog() {
        const html = `
            <div class="filters" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                <div>
                    <label for="filterPeriodo" style="display: block; margin-bottom: 5px; font-weight: bold;">Periodo:</label>
                    <select id="filterPeriodo" style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px;">
                        <option value="">Tutti</option>
                    </select>
                </div>
                <div>
                    <label for="filterTipologia" style="display: block; margin-bottom: 5px; font-weight: bold;">Tipologia:</label>
                    <select id="filterTipologia" style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px;">
                        <option value="">Tutti</option>
                    </select>
                </div>
                <div>
                    <label for="filterRuolo" style="display: block; margin-bottom: 5px; font-weight: bold;">Ruolo:</label>
                    <select id="filterRuolo" style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px;">
                        <option value="">Tutti</option>
                    </select>
                </div>
            </div>

            <div class="workout-list-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #ecf0f1; border-radius: 4px; padding: 10px; background: #f9f9f9;">
                <ul id="workoutList" style="list-style: none; padding: 0; margin: 0;">
                    <!-- Popolato dinamicamente -->
                </ul>
            </div>
        `;

        this.dialog = createWindow({
            title: 'Carica Allenamento da Libreria',
            icon: '📚',
            id: 'libraryWorkoutDialog',
            contentHTML: html,
            effect: "windows",
            size: 'lg',
            visible: false,
            buttons: [
                { 
                    label: 'Annulla', 
                    color: 'secondary', 
                    onClick: () => { this.hide() } 
                },
                { 
                    label: 'Carica', 
                    color: 'primary', 
                    id: 'loadSelectedWorkout',
                    onClick: () => { this.loadSelected() },
                    disabled: true
                }
            ]
        });
    }

    /**
     * Cachea i riferimenti agli elementi DOM
     */
    cacheElements() {
        this.elements.dialog = document.getElementById('libraryWorkoutDialog');
        this.elements.workoutList = document.getElementById('workoutList');
        this.elements.filterPeriodo = document.getElementById('filterPeriodo');
        this.elements.filterTipologia = document.getElementById('filterTipologia');
        this.elements.filterRuolo = document.getElementById('filterRuolo');
        this.elements.loadBtn = document.getElementById('loadSelectedWorkout');

        if (!this.elements.dialog) {
            console.error('LibraryWorkoutDialogManager: HTML elements not found');
        }
    }

    /**
     * Configura gli event listeners
     */
    setupEventListeners() {
        // Filtri
        this.elements.filterPeriodo?.addEventListener('change', () => this.filterWorkouts());
        this.elements.filterTipologia?.addEventListener('change', () => this.filterWorkouts());
        this.elements.filterRuolo?.addEventListener('change', () => this.filterWorkouts());
    }

    /**
     * Mostra il dialogo
     */
    async show() {
        this.dialog.showDialog();
        await this.fetchLibraryWorkouts();
    }

    /**
     * Nasconde il dialogo
     */
    hide() {
        this.dialog.hideDialog();
        this.selectedLibraryFile = null;
    }

    /**
     * Carica la lista dei file dal backend PHP con FALLBACK
     */
    async fetchLibraryWorkouts() {
        let filenames = [];
        const endpoint = 'api/api_libreria.php';

        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Errore nel server PHP (Status: ${response.status}).`);
            }

            filenames = await response.json();

            if (!Array.isArray(filenames)) {
                throw new Error('La risposta del server non è un array valido di nomi file.');
            }

            this.librarySource = 'server';
            this.elements.workoutList.innerHTML = '';

        } catch (error) {
            console.warn(`Tentativo fallito di caricare la libreria da ${endpoint}. Carico esempi di default.`);
            console.error(error);

            this.librarySource = 'fallback';

            filenames = [
                'PRE.ANA.A.esempio1.json'
            ];

            // Avvisa l'utente sulla UI
            this.elements.workoutList.innerHTML = `
                <li style="color: orange; padding: 10px; cursor: default;">
                    ⚠️ <strong>FALLBACK:</strong> Server non raggiunto. Caricati esempi locali.
                </li>
            `;
        }

        this.libraryWorkouts = filenames
            .map(f => this.parseFilename(f))
            .filter(w => w !== null);

        this.populateFilters(this.libraryWorkouts);
        this.filterWorkouts();
    }

    /**
     * Parsing del nome file
     * Esempio: PRE.ANA.A.alzate_miste.json
     */
    parseFilename(filename) {
        const parts = filename.replace('.json', '').split('.');
        if (parts.length < 4) return null;

        const [periodo, tipologia, ruolo, ...rest] = parts;
        const titolo = rest.join('.');

        return {
            filename: filename,
            periodo: periodo,
            tipologia: tipologia,
            ruolo: ruolo,
            titolo: titolo.replace(/_/g, ' ')
        };
    }

    /**
     * Popola i filtri con i valori univoci
     */
    populateFilters(workouts) {
        const filters = {
            periodo: new Set(),
            tipologia: new Set(),
            ruolo: new Set()
        };

        workouts.forEach(w => {
            filters.periodo.add(w.periodo);
            filters.tipologia.add(w.tipologia);
            filters.ruolo.add(w.ruolo);
        });

        ['periodo', 'tipologia', 'ruolo'].forEach(key => {
            const select = this.elements[`filter${key.charAt(0).toUpperCase() + key.slice(1)}`];
            select.innerHTML = `<option value="">Tutti</option>`;
            Array.from(filters[key]).sort().forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        });
    }

    /**
     * Filtra la lista degli allenamenti
     */
    filterWorkouts() {
        this.selectedLibraryFile = null;
        this.elements.loadBtn.disabled = true;

        const periodo = this.elements.filterPeriodo.value;
        const tipologia = this.elements.filterTipologia.value;
        const ruolo = this.elements.filterRuolo.value;

        this.elements.workoutList.innerHTML = '';

        const filtered = this.libraryWorkouts.filter(w =>
            (periodo === "" || w.periodo === periodo) &&
            (tipologia === "" || w.tipologia === tipologia) &&
            (ruolo === "" || w.ruolo === ruolo)
        );

        filtered.forEach(w => {
            const li = document.createElement('li');
            li.style.cssText = `
                padding: 10px;
                margin: 5px 0;
                background: white;
                border-left: 3px solid #3498db;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            `;
            li.textContent = `${w.titolo} (${w.periodo} | ${w.tipologia} | ${w.ruolo})`;
            li.dataset.filename = w.filename;

            li.addEventListener('click', () => {
                this.selectWorkout(li, w.filename);
            });

            li.addEventListener('mouseenter', () => {
                li.style.background = '#ecf0f1';
            });

            li.addEventListener('mouseleave', () => {
                if (!li.classList.contains('selected')) {
                    li.style.background = 'white';
                }
            });

            this.elements.workoutList.appendChild(li);
        });
    }

    /**
     * Seleziona un allenamento dalla lista
     */
    selectWorkout(element, filename) {
        // Rimuovi selezione precedente
        this.elements.workoutList.querySelectorAll('li').forEach(item => {
            item.classList.remove('selected');
            item.style.background = 'white';
        });

        // Seleziona nuovo elemento
        element.classList.add('selected');
        element.style.background = '#d1e7fd';

        this.selectedLibraryFile = filename;
        this.elements.loadBtn.disabled = false;
    }

    /**
     * Carica l'allenamento selezionato
     */
    async loadSelected() {
        if (!this.selectedLibraryFile) return;

        try {
            const fileWorkOut = await this.loadWorkoutFromBackend(this.selectedLibraryFile);
            if (fileWorkOut) {
                this.hide();
                this.editor.loadSchema(fileWorkOut);
            }
        } catch (error) {
            console.error('Errore nel caricamento:', error);
            alert('Errore nel caricamento dell\'allenamento: ' + error.message);
        }
    }

    /**
     * Carica il contenuto dell'allenamento dal backend
     */
    async loadWorkoutFromBackend(filename) {
        let workoutData = null;

        // FALLBACK: Caricamento locale
        if (this.librarySource === 'fallback') {
            const response = await fetch(`volleyball_exercise_library/${filename}`);

            if (!response.ok) {
                throw new Error(`Errore nel server (${response.status}). Il file non può essere letto.`);
            }

            workoutData = await response.json();
            return workoutData;
        }

        // SERVER: Caricamento reale
        try {
            const response = await fetch(`./api/api_allenamento.php?filename=${encodeURIComponent(filename)}`);

            if (!response.ok) {
                throw new Error(`Errore nel server (${response.status}). Il file non può essere letto.`);
            }

            workoutData = await response.json();
            return workoutData;

        } catch (error) {
            console.error("Errore nel caricamento del contenuto dell'allenamento dal server:", error);
            alert(`Impossibile caricare il contenuto per ${filename}. Errore di connessione o file non trovato.`);
            return null;
        }
    }

    /**
     * Verifica se il dialogo è visibile
     */
    isVisible() {
        return this.elements.dialog?.classList.contains('active') || false;
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}