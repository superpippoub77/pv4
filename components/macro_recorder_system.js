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
// ESPORTAZIONE
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MacroRecorder;
}