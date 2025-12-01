/**
 * SaveWorkoutDialogManager
 * Gestisce il dialogo per salvare un allenamento completo
 * 
 * Utilizzo:
 * const saveWorkoutManager = new SaveWorkoutDialogManager(schemaEditor);
 * saveWorkoutManager.init();
 * saveWorkoutManager.show();
 */

class SaveWorkoutDialogManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.overlay = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.elements = {
            dialog: null,
            overlay: null,
            header: null,
            closeBtn: null,
            fileName: null,
            workoutList: null,
            globalObjective: null,
            globalObservations: null,
            confirmBtn: null,
            cancelBtn: null
        };
    }

    /**
     * Inizializza il manager
     */
    init() {
        this.createSaveWorkoutDialog();
        this.cacheElements();
        this.setupEventListeners();
    }

    /**
     * Crea il dialogo HTML
     */
    createSaveWorkoutDialog() {
        const html = `
            <div id="workOutListName" style="margin-bottom: 15px; padding: 10px; background: #ecf0f1; border-radius: 4px;">
                <!-- Popolato dinamicamente con la lista dei tab -->
            </div>

            <div style="padding: 20px 0;">
                <label for="workoutFileName" style="display: block; margin-bottom: 10px; font-weight: bold;">
                    Nome del file:
                </label>
                <input type="text" id="workoutFileName"
                    style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px; margin-bottom: 15px;"
                    placeholder="es: Allenamento_Settimana1">

                <label for="workoutGlobalObjective" style="display: block; margin-bottom: 10px; font-weight: bold;">
                    Obiettivo dell'allenamento:
                </label>
                <textarea id="workoutGlobalObjective"
                    style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px; margin-bottom: 15px; resize: vertical; min-height: 80px; font-family: inherit;"
                    placeholder="Descrivi l'obiettivo generale di questo allenamento..."></textarea>

                <label for="workoutGlobalObservations" style="display: block; margin-bottom: 10px; font-weight: bold;">
                    Osservazioni:
                </label>
                <textarea id="workoutGlobalObservations"
                    style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px; resize: vertical; min-height: 100px; font-family: inherit;"
                    placeholder="Aggiungi eventuali osservazioni o note post-allenamento..."></textarea>
            </div>
        `;

        this.dialog = createWindow({
            title: 'Salva Allenamento Completo',
            icon: '💾',
            id: 'saveWorkoutDialog',
            contentHTML: html,
            effect: "windows",
            size: 'md',
            visible: false,
            buttons: [
                { 
                    label: 'Annulla', 
                    color: 'secondary', 
                    onClick: () => { this.hide() } 
                },
                { 
                    label: 'Salva', 
                    color: 'primary', 
                    onClick: () => { this.confirmSave() } 
                }
            ]
        });
    }

    /**
     * Cachea i riferimenti agli elementi DOM
     */
    cacheElements() {
        this.elements.dialog = document.getElementById('saveWorkoutDialog');
        this.elements.fileName = document.getElementById('workoutFileName');
        this.elements.workoutList = document.getElementById('workOutListName');
        this.elements.globalObjective = document.getElementById('workoutGlobalObjective');
        this.elements.globalObservations = document.getElementById('workoutGlobalObservations');

        if (!this.elements.dialog) {
            console.error('SaveWorkoutDialogManager: HTML elements not found');
        }
    }

    /**
     * Configura gli event listeners
     */
    setupEventListeners() {
        // Enter key per salvare
        this.elements.fileName?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmSave();
            }
        });
    }

    /**
     * Mostra il dialogo
     */
    show() {
        // Genera nome predefinito con data e ora
        const now = new Date();
        const defaultName = `Allenamento_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        
        this.elements.fileName.value = defaultName;
        
        // Ripristina i valori salvati in precedenza
        this.elements.globalObjective.value = this.editor.currentWorkoutObjective || '';
        this.elements.globalObservations.value = this.editor.currentWorkoutObservations || '';

        // Popola la lista dei tab
        this.renderTabsList();

        this.dialog.showDialog();

        // Focus e selezione del nome file
        setTimeout(() => {
            this.elements.fileName.focus();
            this.elements.fileName.select();
        }, 100);
    }

    /**
     * Nasconde il dialogo
     */
    hide() {
        this.dialog.hideDialog();
    }

    /**
     * Renderizza la lista dei tab da salvare
     */
    renderTabsList() {
        this.elements.workoutList.innerHTML = '';
        
        this.editor.tabs.forEach((tab, tabId) => {
            const tabName = tab.name || `Tab_${tabId + 1}`;
            const tabDiv = document.createElement('div');
            tabDiv.style.cssText = `
                padding: 5px 10px;
                margin: 5px 0;
                background: white;
                border-left: 3px solid #3498db;
                border-radius: 4px;
                font-size: 14px;
            `;
            tabDiv.textContent = `📄 ${tabName}`;
            this.elements.workoutList.appendChild(tabDiv);
        });
    }

    /**
     * Conferma e salva l'allenamento
     */
    confirmSave() {
        const fileName = this.elements.fileName.value.trim();

        if (!fileName) {
            alert('Inserisci un nome per il file');
            this.elements.fileName.focus();
            return;
        }

        // Leggi i campi globali
        const globalObjective = this.elements.globalObjective.value.trim();
        const globalObservations = this.elements.globalObservations.value.trim();

        // Salva nei campi dell'editor
        this.editor.currentWorkoutObjective = globalObjective;
        this.editor.currentWorkoutObservations = globalObservations;

        // Chiudi il modal
        this.hide();

        // Esegui il salvataggio
        this.editor.saveWorkout(fileName);
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