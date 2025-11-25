// ============================================================
// SISTEMA MACRO RECORDER - Registrazione e Riproduzione Azioni
// ============================================================

class MacroRecorder {
    constructor(editor) {
        this.editor = editor;
        this.isRecording = false;
        this.isFinalizing = false;
        this.isPlaying = false;
        this.currentMacro = null;
        this.macroList = [];
        this.recordedActions = [];
        this.startTime = null;
        this.playbackSpeed = 1;
        this.actionQueue = [];

        this.loadMacros();
    }

    // ============================================================
    // REGISTRAZIONE
    // ============================================================

    startRecording(macroName) {
        if (this.isRecording) {
            alert('Una registrazione è già in corso');
            return;
        }

        if (!macroName || macroName.trim() === '') {
            alert('Inserisci un nome per la macro');
            return;
        }

        this.isRecording = true;
        this.isFinalizing = false;
        this.recordedActions = [];
        this.startTime = Date.now();
        this.currentMacro = {
            name: macroName,
            description: '',
            actions: [],
            createdAt: new Date().toISOString(),
            version: '1.0',
            tabObjects: new Map() // Snapshot degli oggetti al inizio
        };

        // Salva uno snapshot degli oggetti presenti
        const tab = this.editor.getCurrentTab();
        tab.objects.forEach((obj, id) => {
            this.currentMacro.tabObjects.set(id, JSON.parse(JSON.stringify(obj)));
        });

        console.log(`🎬 Registrazione avviata: ${macroName}`);
        this.showRecordingIndicator(true);
        this.hookInteractions();
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        this.isFinalizing = true;
        this.showRecordingIndicator(false);
        this.unhookInteractions();

        if (this.recordedActions.length === 0) {
            alert('Nessuna azione registrata');
            this.currentMacro = null;
            return;
        }

        console.log(`✅ Registrazione terminata: ${this.recordedActions.length} azioni`);
        return true;
    }

    saveMacro(description = '') {
        if (!this.currentMacro || this.recordedActions.length === 0) {
            alert('Nessuna macro da salvare');
            return false;
        }

        this.currentMacro.description = description;
        this.currentMacro.actions = [...this.recordedActions];

        // Controlla se una macro con lo stesso nome esiste
        const existingIndex = this.macroList.findIndex(m => m.name === this.currentMacro.name);

        if (existingIndex >= 0) {
            if (confirm(`La macro "${this.currentMacro.name}" esiste già. Sovrascrivere?`)) {
                this.macroList[existingIndex] = this.currentMacro;
            } else {
                return false;
            }
        } else {
            this.macroList.push(this.currentMacro);
        }

        this.persistMacros();
        console.log(`💾 Macro salvata: ${this.currentMacro.name}`);
        this.isFinalizing = false;
        this.currentMacro = null;
        return true;
    }

    // ============================================================
    // GANCIO INTERAZIONI (HOOKING)
    // ============================================================

    hookInteractions() {
        const canvas = document.getElementById('canvas');

        // Intercetta drag and drop
        this._originalAddObject = this.editor.addObject.bind(this.editor);
        this.editor.addObject = this.recordAddObject.bind(this);

        // Intercetta eliminazione
        this._originalDelete = this.editor.deleteSelected.bind(this.editor);
        this.editor.deleteSelected = this.recordDelete.bind(this);

        // Intercetta frecce
        this._originalCreateArrow = this.editor.createArrow.bind(this.editor);
        this.editor.createArrow = this.recordCreateArrow.bind(this);

        // Intercetta modifiche colore
        this._originalChangeColor = this.editor.changeSelectedObjectsColor.bind(this.editor);
        this.editor.changeSelectedObjectsColor = this.recordChangeColor.bind(this);

        // Intercetta modifiche testo
        this._originalChangeText = this.editor.changeSelectedObjectsText.bind(this.editor);
        this.editor.changeSelectedObjectsText = this.recordChangeText.bind(this);

        // Intercetta rotazione
        this._originalRotate = this.editor.rotateSelected.bind(this.editor);
        this.editor.rotateSelected = this.recordRotate.bind(this);

        console.log('🎣 Interazioni agganciate');
    }

    unhookInteractions() {
        // Ripristina i metodi originali
        this.editor.addObject = this._originalAddObject;
        this.editor.deleteSelected = this._originalDelete;
        this.editor.createArrow = this._originalCreateArrow;
        this.editor.changeSelectedObjectsColor = this._originalChangeColor;
        this.editor.changeSelectedObjectsText = this._originalChangeText;
        this.editor.rotateSelected = this._originalRotate;

        console.log('🎣 Interazioni scollegate');
    }

    // ============================================================
    // REGISTRAZIONE AZIONI
    // ============================================================

    recordAddObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData) {
        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'addObject',
            timestamp,
            params: { type, x, y, color, text, rotation, dashed, icon, src, spriteData }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Aggiunto oggetto ${type}`);

        // Chiama il metodo originale
        return this._originalAddObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData);
    }

    recordDelete() {
        const timestamp = Date.now() - this.startTime;

        // Salva lo stato prima dell'eliminazione
        const deletedIds = Array.from(this.editor.selectedObjects.keys());
        const tab = this.editor.getCurrentTab();

        const deletedObjects = deletedIds.map(id => ({
            id,
            data: tab.objects.get(id),
            type: 'object'
        }));

        const action = {
            type: 'deleteObjects',
            timestamp,
            params: { deletedObjects }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Eliminati ${deletedIds.length} oggetti`);

        return this._originalDelete();
    }

    recordCreateArrow(from, to, arrowType, dashed, color, thickness) {
        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'createArrow',
            timestamp,
            params: { from, to, arrowType, dashed, color, thickness }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Creata freccia`);

        return this._originalCreateArrow(from, to, arrowType, dashed, color, thickness);
    }

    recordChangeColor(color) {
        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'changeColor',
            timestamp,
            params: { color, selectedObjectsCount: this.editor.selectedObjects.size }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Cambio colore a ${color}`);

        return this._originalChangeColor(color);
    }

    recordChangeText(text) {
        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'changeText',
            timestamp,
            params: { text, selectedObjectsCount: this.editor.selectedObjects.size }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Cambio testo a "${text}"`);

        return this._originalChangeText(text);
    }

    recordRotate(degrees) {
        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'rotate',
            timestamp,
            params: { degrees, selectedObjectsCount: this.editor.selectedObjects.size }
        };

        this.recordedActions.push(action);
        console.log(`📝 Registrato: Rotazione di ${degrees}°`);

        return this._originalRotate(degrees);
    }

    // ============================================================
    // RIPRODUZIONE
    // ============================================================

    async playMacro(macroName) {
        if (this.isPlaying) {
            alert('Una riproduzione è già in corso');
            return;
        }

        const macro = this.macroList.find(m => m.name === macroName);
        if (!macro) {
            alert(`Macro "${macroName}" non trovata`);
            return;
        }

        this.isPlaying = true;
        console.log(`▶️ Riproduzione macro: ${macroName}`);

        try {
            await this.executeActions(macro.actions);
            console.log(`✅ Riproduzione completata`);
            alert('✅ Macro riprodotta con successo');
        } catch (error) {
            console.error('Errore durante la riproduzione:', error);
            alert('❌ Errore durante la riproduzione: ' + error.message);
        } finally {
            this.isPlaying = false;
        }
    }

    async executeActions(actions) {
        for (const action of actions) {
            // Attesa in base al timestamp relativo
            if (actions.indexOf(action) > 0) {
                const prevTimestamp = actions[actions.indexOf(action) - 1].timestamp;
                const delay = (action.timestamp - prevTimestamp) / this.playbackSpeed;
                await new Promise(resolve => setTimeout(resolve, Math.max(delay, 50)));
            }

            await this.executeAction(action);
        }

        // Salva lo stato finale
        this.editor.saveState('Macro riprodotta');
    }

    async executeAction(action) {
        const tab = this.editor.getCurrentTab();

        switch (action.type) {
            case 'addObject': {
                const { type, x, y, color, text, rotation, dashed, icon, src, spriteData } = action.params;
                this.editor.addObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData);
                break;
            }

            case 'deleteObjects': {
                // Seleziona gli oggetti e elimina
                const { deletedObjects } = action.params;
                this.editor.deselectAll();

                deletedObjects.forEach(del => {
                    if (tab.objects.has(del.id)) {
                        this.editor.selectedObjects.set(del.id, { x: del.data.x, y: del.data.y });
                    }
                });

                if (this.editor.selectedObjects.size > 0) {
                    this.editor.deleteSelected();
                }
                break;
            }

            case 'createArrow': {
                const { from, to, arrowType, dashed, color, thickness } = action.params;
                this.editor.createArrow(from, to, arrowType, dashed, color, thickness);
                break;
            }

            case 'changeColor': {
                const { color } = action.params;
                this.editor.changeSelectedObjectsColor(color);
                break;
            }

            case 'changeText': {
                const { text } = action.params;
                this.editor.changeSelectedObjectsText(text);
                break;
            }

            case 'rotate': {
                const { degrees } = action.params;
                this.editor.rotateSelected(degrees);
                break;
            }

            default:
                console.warn(`Azione sconosciuta: ${action.type}`);
        }
    }

    // ============================================================
    // UI
    // ============================================================

    showRecordingIndicator(isRecording) {
        let indicator = document.getElementById('macroRecordingIndicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'macroRecordingIndicator';
            document.body.appendChild(indicator);
        }

        if (isRecording) {
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #e74c3c;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                z-index: 10001;
                animation: blink 1s infinite;
            `;
            indicator.innerHTML = '🔴 REGISTRAZIONE IN CORSO';

            // Aggiungi animazione
            const style = document.createElement('style');
            style.textContent = `
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        } else {
            indicator.style.display = 'none';
        }
    }

    // ============================================================
    // PERSISTENZA
    // ============================================================

    persistMacros() {
        const data = this.macroList.map(macro => ({
            ...macro,
            tabObjects: Array.from(macro.tabObjects.entries())
        }));

        localStorage.setItem('volleyMacros', JSON.stringify(data));
        console.log('💾 Macros salvate');
    }

    loadMacros() {
        try {
            const data = localStorage.getItem('volleyMacros');
            if (data) {
                this.macroList = JSON.parse(data).map(macro => ({
                    ...macro,
                    tabObjects: new Map(macro.tabObjects)
                }));
                console.log(`📂 Caricate ${this.macroList.length} macros`);
            }
        } catch (error) {
            console.error('Errore nel caricamento delle macros:', error);
        }
    }

    // ============================================================
    // GESTIONE MACROS
    // ============================================================

    deleteMacro(macroName) {
        const index = this.macroList.findIndex(m => m.name === macroName);
        if (index >= 0) {
            if (confirm(`Eliminare la macro "${macroName}"?`)) {
                this.macroList.splice(index, 1);
                this.persistMacros();
                console.log(`🗑️ Macro eliminata: ${macroName}`);
                return true;
            }
        }
        return false;
    }

    exportMacro(macroName) {
        const macro = this.macroList.find(m => m.name === macroName);
        if (!macro) {
            alert('Macro non trovata');
            return;
        }

        const data = JSON.stringify(macro, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${macro.name}.macro.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log(`📤 Macro esportata: ${macroName}`);
    }

    importMacro(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const macro = JSON.parse(e.target.result);

                // Valida la struttura
                if (!macro.name || !macro.actions || !Array.isArray(macro.actions)) {
                    throw new Error('Formato macro non valido');
                }

                // Converti tabObjects da array a Map se necessario
                if (Array.isArray(macro.tabObjects)) {
                    macro.tabObjects = new Map(macro.tabObjects);
                }

                const existingIndex = this.macroList.findIndex(m => m.name === macro.name);
                if (existingIndex >= 0) {
                    if (confirm(`La macro "${macro.name}" esiste già. Sovrascrivere?`)) {
                        this.macroList[existingIndex] = macro;
                    } else {
                        return;
                    }
                } else {
                    this.macroList.push(macro);
                }

                this.persistMacros();
                console.log(`📥 Macro importata: ${macro.name}`);
                alert(`✅ Macro "${macro.name}" importata con successo`);
            } catch (error) {
                console.error('Errore importazione macro:', error);
                alert('❌ Errore nell\'importazione: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    getMacroList() {
        return this.macroList;
    }

    getMacroInfo(macroName) {
        const macro = this.macroList.find(m => m.name === macroName);
        if (!macro) return null;

        return {
            name: macro.name,
            description: macro.description,
            actionCount: macro.actions.length,
            createdAt: macro.createdAt,
            duration: macro.actions[macro.actions.length - 1]?.timestamp || 0
        };
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(5, speed));
        console.log(`⚡ Velocità riproduzione: ${this.playbackSpeed}x`);
    }
}

// ============================================================
// MACRO MANAGER - Gestione Macro Avanzata
// ============================================================

class MacroManager {
    constructor(editor) {
        this.editor = editor;
        this.macroRecorder = new MacroRecorder(editor);
        this.macroList = [];
        this.selectedMacro = null;
        this.isPlaying = false;
        this.playbackSpeed = 1;
    }

    // ============================================================
    // INIZIALIZZAZIONE UI
    // ============================================================
    createMacroDialog() {
        const html = `
                <div style="padding: 15px; border-bottom: 1px solid #ddd; background: #f8f9fa;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="btnStartRecord" class="macro-btn primary" data-i18n="macro_record">
                            🔴 Avvia Registrazione
                        </button>
                        <button id="btnStopRecord" class="macro-btn danger" style="display: none;" data-i18n="macro_stop">
                            ⏹ Ferma Registrazione
                        </button>
                        <button id="btnPlayMacro" class="macro-btn success" disabled data-i18n="macro_play">
                            ▶️ Riproduci
                        </button>
                        <button id="btnExportMacro" class="macro-btn" disabled data-i18n="macro_export">
                            📤 Esporta
                        </button>
                        <button id="btnDeleteMacro" class="macro-btn danger" disabled data-i18n="macro_delete">
                            🗑️ Elimina
                        </button>
                        <input type="file" id="importMacroFile" accept=".json" style="display: none;" data-i18n="macro_import">
                        <button id="btnImportMacro" class="macro-btn">
                            📥 Importa
                        </button>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px;">
                        <input type="text" id="macroName" placeholder="Nome della macro..." data-i18n="macro_name"
                               style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px; margin-bottom: 5px;">
                        <textarea id="macroDescription" placeholder="Descrizione (opzionale)..." data-i18n="macro_description"
                                  style="width: 100%; padding: 8px; border: 1px solid #bdc3c7; border-radius: 4px; height: 50px; resize: vertical;"></textarea>
                    </div>
                </div>

                <!-- Sezione Lista Macro -->
                <div style="flex: 1; overflow-y: auto; padding: 10px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;" data-i18n="macro_list">📋 Macro Disponibili</h4>
                    <div id="macroList" style="display: flex; flex-direction: column; gap: 8px;" data-i18n="macro_queue">
                        <!-- Macro verranno inserite qui -->
                    </div>
                </div>

                <!-- Sezione Dettagli Macro Selezionata -->
                <div id="macroDetailsPanel" style="display: none; padding: 15px; border-top: 1px solid #ddd; background: #f8f9fa; max-height: 200px; overflow-y: auto;">
                    <h4 style="margin-top: 0;" data-i18n="macro_detail">📊 Dettagli Macro</h4>
                    <div id="macroDetails"></div>
                </div>

                <!-- Sezione Velocità -->
                <div style="padding: 10px 15px; border-top: 1px solid #ddd; background: #f8f9fa;">
                    <label style="display: flex; align-items: center; gap: 10px;" data-i18n="macro_speed">
                        ⚡ Velocità riproduzione:
                        <input type="range" id="playbackSpeedSlider" min="0.5" max="2" step="0.1" value="1" style="width: 150px;">
                        <span id="speedValue" style="width: 40px; text-align: center;">1.0x</span>
                    </label>
                </div>
        `;

        createWindow({
            title: 'dlg_title_macro',
            icon: '🎬',
            id: 'macroManagerDialog',
            contentHTML: html,
            effect: "windows",
            size: 'lg',
            buttons: [
                { label: 'Annulla', color: 'secondary', onClick: () => { } }
            ],
            listeners: {
                domReady: (win) => {
                    win.querySelector('#btnStartRecord').addEventListener('click', () => {
                        this.startRecording();
                    });

                    win.querySelector('#btnStopRecord').addEventListener('click', () => {
                        this.stopRecording();
                    });

                    win.querySelector('#btnPlayMacro').addEventListener('click', () => {
                        if (this.selectedMacro) {
                            this.playMacro(this.selectedMacro.name);
                        }
                    });

                    win.querySelector('#btnExportMacro').addEventListener('click', () => {
                        if (this.selectedMacro) {
                            this.exportMacro(this.selectedMacro.name);
                        }
                    });

                    win.querySelector('#btnDeleteMacro').addEventListener('click', () => {
                        if (this.selectedMacro && confirm(`Eliminare la macro "${this.selectedMacro.name}"?`)) {
                            this.deleteMacro(this.selectedMacro.name);
                        }
                    });

                    win.querySelector('#btnImportMacro').addEventListener('click', () => {
                        win.querySelector('#importMacroFile').click();
                    });

                    win.querySelector('#importMacroFile').addEventListener('change', (e) => {
                        if (e.target.files[0]) {
                            app.macroRecorder.importMacro(e.target.files[0]);
                            app.loadMacros();
                            app.renderMacroList();
                            e.target.value = '';
                        }
                    });

                    // 🎚️ Velocità riproduzione
                    win.querySelector('#playbackSpeedSlider').addEventListener('input', (e) => {
                        app.playbackSpeed = parseFloat(e.target.value);
                        app.macroRecorder.setPlaybackSpeed(app.playbackSpeed);
                        win.querySelector('#speedValue').textContent = app.playbackSpeed.toFixed(1) + 'x';
                    });
                }
            }
        });
    }

    // attachEventListeners() {
    //     document.getElementById('btnStartRecord').addEventListener('click', () => {
    //         this.startRecording();
    //     });

    //     document.getElementById('btnStopRecord').addEventListener('click', () => {
    //         this.stopRecording();
    //     });

    //     document.getElementById('btnPlayMacro').addEventListener('click', () => {
    //         if (this.selectedMacro) {
    //             this.playMacro(this.selectedMacro.name);
    //         }
    //     });

    //     document.getElementById('btnExportMacro').addEventListener('click', () => {
    //         if (this.selectedMacro) {
    //             this.exportMacro(this.selectedMacro.name);
    //         }
    //     });

    //     document.getElementById('btnDeleteMacro').addEventListener('click', () => {
    //         if (this.selectedMacro && confirm(`Eliminare la macro "${this.selectedMacro.name}"?`)) {
    //             this.deleteMacro(this.selectedMacro.name);
    //         }
    //     });

    //     document.getElementById('btnImportMacro').addEventListener('click', () => {
    //         document.getElementById('importMacroFile').click();
    //     });

    //     document.getElementById('importMacroFile').addEventListener('change', (e) => {
    //         if (e.target.files[0]) {
    //             this.macroRecorder.importMacro(e.target.files[0]);
    //             this.loadMacros();
    //             this.renderMacroList();
    //             e.target.value = '';
    //         }
    //     });

    //     // Velocità riproduzione
    //     document.getElementById('playbackSpeedSlider').addEventListener('input', (e) => {
    //         this.playbackSpeed = parseFloat(e.target.value);
    //         this.macroRecorder.setPlaybackSpeed(this.playbackSpeed);
    //         document.getElementById('speedValue').textContent = this.playbackSpeed.toFixed(1) + 'x';
    //     });
    // }

    // ============================================================
    // REGISTRAZIONE
    // ============================================================

    startRecording() {
        const macroName = document.getElementById('macroName').value.trim();

        if (!macroName) {
            alert('Inserisci un nome per la macro');
            return;
        }

        this.macroRecorder.startRecording(macroName);

        // Aggiorna UI
        document.getElementById('btnStartRecord').style.display = 'none';
        document.getElementById('btnStopRecord').style.display = 'inline-block';
        document.getElementById('macroName').disabled = true;

        console.log(`🎬 Registrazione avviata: ${macroName}`);
    }

    stopRecording() {
        const description = document.getElementById('macroDescription').value.trim();

        if (this.macroRecorder.stopRecording()) {
            this.macroRecorder.saveMacro(description);
            this.loadMacros();
            this.renderMacroList();

            // Reset UI
            document.getElementById('btnStartRecord').style.display = 'inline-block';
            document.getElementById('btnStopRecord').style.display = 'none';
            document.getElementById('macroName').disabled = false;
            document.getElementById('macroName').value = '';
            document.getElementById('macroDescription').value = '';

            alert('✅ Macro salvata con successo!');
        }
    }

    // ============================================================
    // RIPRODUZIONE
    // ============================================================

    async playMacro(macroName) {
        if (this.isPlaying) {
            alert('Una riproduzione è già in corso');
            return;
        }

        try {
            this.isPlaying = true;
            document.getElementById('btnPlayMacro').disabled = true;
            document.getElementById('btnPlayMacro').textContent = '⏳ In riproduzione...';

            await this.macroRecorder.playMacro(macroName);

            alert('✅ Macro riprodotta con successo!');
        } catch (error) {
            console.error('Errore durante la riproduzione:', error);
            alert('❌ Errore durante la riproduzione: ' + error.message);
        } finally {
            this.isPlaying = false;
            document.getElementById('btnPlayMacro').disabled = false;
            document.getElementById('btnPlayMacro').textContent = '▶️ Riproduci';
        }
    }

    // ============================================================
    // GESTIONE MACRO
    // ============================================================

    loadMacros() {
        this.macroList = this.macroRecorder.getMacroList();
    }

    renderMacroList() {
        const container = document.getElementById('macroList');
        container.innerHTML = '';

        if (this.macroList.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nessuna macro disponibile</p>';
            return;
        }

        this.macroList.forEach((macro, index) => {
            const item = document.createElement('div');
            item.className = 'macro-item';
            item.style.cssText = `
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                background: white;
            `;

            const info = this.macroRecorder.getMacroInfo(macro.name);
            const duration = info.duration ? (info.duration / 1000).toFixed(2) : '0.00';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #333;">${macro.name}</div>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                            📊 ${info.actionCount} azioni | ⏱️ ${duration}s
                        </div>
                        ${macro.description ? `<div style="font-size: 12px; color: #555; margin-top: 4px;">📝 ${macro.description}</div>` : ''}
                    </div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectMacro(macro, item, container);
            });

            item.addEventListener('mouseover', () => {
                item.style.borderColor = '#3498db';
                item.style.background = '#f0f8ff';
            });

            item.addEventListener('mouseout', () => {
                item.style.borderColor = '#ddd';
                item.style.background = 'white';
            });

            container.appendChild(item);
        });
    }

    selectMacro(macro, element, container) {
        // Deseleziona elemento precedente
        container.querySelectorAll('.macro-item').forEach(item => {
            item.style.borderColor = '#ddd';
            item.style.background = 'white';
        });

        // Seleziona nuovo elemento
        this.selectedMacro = macro;
        element.style.borderColor = '#27ae60';
        element.style.background = '#e8f8f5';

        // Abilita pulsanti
        document.getElementById('btnPlayMacro').disabled = false;
        document.getElementById('btnExportMacro').disabled = false;
        document.getElementById('btnDeleteMacro').disabled = false;

        // Mostra dettagli
        this.showMacroDetails(macro);
    }

    showMacroDetails(macro) {
        const panel = document.getElementById('macroDetailsPanel');
        const details = document.getElementById('macroDetails');

        const info = this.macroRecorder.getMacroInfo(macro.name);
        const duration = info.duration ? (info.duration / 1000).toFixed(2) : '0.00';
        const createdAt = new Date(macro.createdAt).toLocaleString('it-IT');

        details.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 5px; font-weight: bold; width: 150px;">Nome:</td>
                    <td style="padding: 5px; color: #333;">${macro.name}</td>
                </tr>
                <tr>
                    <td style="padding: 5px; font-weight: bold;">Descrizione:</td>
                    <td style="padding: 5px; color: #333;">${macro.description || '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 5px; font-weight: bold;">Azioni:</td>
                    <td style="padding: 5px; color: #333;">${info.actionCount}</td>
                </tr>
                <tr>
                    <td style="padding: 5px; font-weight: bold;">Durata:</td>
                    <td style="padding: 5px; color: #333;">${duration}s</td>
                </tr>
                <tr>
                    <td style="padding: 5px; font-weight: bold;">Creata:</td>
                    <td style="padding: 5px; color: #333;">${createdAt}</td>
                </tr>
                <tr>
                    <td style="padding: 5px; font-weight: bold;">Versione:</td>
                    <td style="padding: 5px; color: #333;">${macro.version}</td>
                </tr>
            </table>
        `;

        panel.style.display = 'block';
    }

    deleteMacro(macroName) {
        if (this.macroRecorder.deleteMacro(macroName)) {
            this.loadMacros();
            this.renderMacroList();

            // Reset selezione
            this.selectedMacro = null;
            document.getElementById('macroDetailsPanel').style.display = 'none';
            document.getElementById('btnPlayMacro').disabled = true;
            document.getElementById('btnExportMacro').disabled = true;
            document.getElementById('btnDeleteMacro').disabled = true;

            console.log(`🗑️ Macro eliminata: ${macroName}`);
        }
    }

    exportMacro(macroName) {
        this.macroRecorder.exportMacro(macroName);
    }

    // ============================================================
    // INTERFACCIA PUBBLICA
    // ============================================================

    showDialog() {
        this.createMacroDialog();
        //this.attachEventListeners();

        this.loadMacros();
        this.renderMacroList();
    }
}

window.MacroManager = MacroManager;