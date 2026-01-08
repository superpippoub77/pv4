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
        this.verbose = false; // when true, log detailed debug info
        this.actionQueue = [];
        this.abortRequested = false; // set true when user requests abort

        this.keyframeThrottleMs = 100; // ms between recorded keyframes per object
        this._lastKeyframeTime = new Map();

        this.loadMacros();
    }

    // Record a keyframe for differential timeline during transactions.
    recordKeyframe(objectId, props = {}) {
        if (!this.isRecording || !this.inTransaction) return false;

        try {
            const now = Date.now() - this.startTime;
            const rel = Math.max(0, now - (this.transactionRelativeStart || 0));

            const last = this._lastKeyframeTime.get(objectId) || 0;
            if (now - last < this.keyframeThrottleMs) return false;
            this._lastKeyframeTime.set(objectId, now);

            const frames = this.transactionTimeline.get(objectId) || [];
            // shallow copy of props to avoid mutation
            const p = Object.assign({}, props);
            frames.push({ t: rel, props: p });
            this.transactionTimeline.set(objectId, frames);

            if (this.verbose) console.debug('recordKeyframe', objectId, frames[frames.length - 1]);
            return true;
        } catch (e) {
            console.error('recordKeyframe error', e);
            return false;
        }
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
            tabObjects: new Map(), // Snapshot degli oggetti al inizio
            transactions: []
        };

        // Salva uno snapshot degli oggetti presenti
        const tab = this.editor.getCurrentTab();
        tab.objects.forEach((obj, id) => {
            this.currentMacro.tabObjects.set(id, JSON.parse(JSON.stringify(obj)));
        });

        console.log(`🎬 Registrazione avviata: ${macroName}`);
        this.showRecordingIndicator(true);
        this.inTransaction = false;
        this.transactionActions = [];
        this.hookInteractions();
    }

    setVerbose(v = true) {
        this.verbose = !!v;
        console.log(`🔍 MacroRecorder verbose=${this.verbose}`);
    }

    toggleVerbose() {
        this.setVerbose(!this.verbose);
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

        // Intercetta copia/incolla
        if (this.editor.copySelected) {
            this._originalCopy = this.editor.copySelected.bind(this.editor);
            this.editor.copySelected = this.recordCopy.bind(this);
        }

        if (this.editor.paste) {
            this._originalPaste = this.editor.paste.bind(this.editor);
            this.editor.paste = this.recordPaste.bind(this);
        }

        // Intercetta saveState per acquisire snapshot a fine operazione (spostamenti, resize, freehand finish...)
        if (this.editor.saveState) {
            this._originalSaveState = this.editor.saveState.bind(this.editor);
            this.editor.saveState = this.recordSaveState.bind(this);
        }
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

        if (this._originalCopy) this.editor.copySelected = this._originalCopy;
        if (this._originalPaste) this.editor.paste = this._originalPaste;
        if (this._originalSaveState) this.editor.saveState = this._originalSaveState;

        console.log('🎣 Interazioni scollegate');
    }

    // ============================================================
    // REGISTRAZIONE AZIONI
    // ============================================================

    recordAddObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData) {
        // Non registrare se non in recording oppure se stiamo riproducendo
        if (!this.isRecording || this.isPlaying) {
            return this._originalAddObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData);
        }

        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'addObject',
            timestamp,
            params: { type, x, y, color, text, rotation, dashed, icon, src, spriteData }
        };

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordAddObject ->', action);
    else console.log(`📝 Registrato: Aggiunto oggetto ${type}`);

        // Chiama il metodo originale
        return this._originalAddObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData);
    }

    recordDelete() {
        if (!this.isRecording || this.isPlaying) {
            return this._originalDelete();
        }

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

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordDelete ->', action);
    else console.log(`📝 Registrato: Eliminati ${deletedIds.length} oggetti`);

        return this._originalDelete();
    }

    recordCreateArrow(from, to, arrowType, dashed, color, thickness) {
        if (!this.isRecording || this.isPlaying) {
            return this._originalCreateArrow(from, to, arrowType, dashed, color, thickness);
        }

        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'createArrow',
            timestamp,
            params: { from, to, arrowType, dashed, color, thickness }
        };

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordCreateArrow ->', action);
    else console.log(`📝 Registrato: Creata freccia`);

        return this._originalCreateArrow(from, to, arrowType, dashed, color, thickness);
    }

    recordChangeColor(color) {
        if (!this.isRecording || this.isPlaying) {
            return this._originalChangeColor(color);
        }

        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'changeColor',
            timestamp,
            params: { color, selectedObjectsCount: this.editor.selectedObjects.size }
        };

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordChangeColor ->', action);
    else console.log(`📝 Registrato: Cambio colore a ${color}`);

        return this._originalChangeColor(color);
    }

    recordChangeText(text) {
        if (!this.isRecording || this.isPlaying) {
            return this._originalChangeText(text);
        }

        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'changeText',
            timestamp,
            params: { text, selectedObjectsCount: this.editor.selectedObjects.size }
        };

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordChangeText ->', action);
    else console.log(`📝 Registrato: Cambio testo a "${text}"`);

        return this._originalChangeText(text);
    }

    recordRotate(degrees) {
        if (!this.isRecording || this.isPlaying) {
            return this._originalRotate(degrees);
        }

        const timestamp = Date.now() - this.startTime;

        const action = {
            type: 'rotate',
            timestamp,
            params: { degrees, selectedObjectsCount: this.editor.selectedObjects.size }
        };

    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordRotate ->', action);
    else console.log(`📝 Registrato: Rotazione di ${degrees}°`);

        return this._originalRotate(degrees);
    }

    // ============================================================
    // COPIA / INCOLLA
    // ============================================================

    recordCopy() {
        if (!this.isRecording || this.isPlaying) {
            return this._originalCopy();
        }

        const timestamp = Date.now() - this.startTime;
        const action = { type: 'copy', timestamp, params: { selectedObjects: Array.from(this.editor.selectedObjects.keys()) } };
    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordCopy ->', action);
    else console.log('📝 Registrato: Copia selezione');

        return this._originalCopy();
    }

    recordPaste() {
        if (!this.isRecording || this.isPlaying) {
            return this._originalPaste();
        }

        const timestamp = Date.now() - this.startTime;
        const action = { type: 'paste', timestamp, params: {} };
    const target = this.inTransaction ? this.transactionActions : this.recordedActions;
    target.push(action);
    if (this.verbose) console.debug('recordPaste ->', action);
    else console.log('📝 Registrato: Incolla');

        return this._originalPaste();
    }

    // ============================================================
    // SNAPSHOT (salva lo stato attuale del tab - usato per movimenti, resize, freehand finish)
    // ============================================================

    recordSaveState(message) {
        // Sempre chiamare l'originale
        if (this._originalSaveState) this._originalSaveState(message);

        if (!this.isRecording || this.isPlaying) return;

        const timestamp = Date.now() - this.startTime;
        const tab = this.editor.getCurrentTab();

        try {
            const snapshot = {
                objects: Array.from(tab.objects.entries()),
                arrows: Array.from(tab.arrows.entries()),
                freehands: Array.from(tab.freehands.entries())
            };

            const action = {
                type: 'snapshot',
                timestamp,
                params: { message: message || '', snapshot }
            };

            const target = this.inTransaction ? this.transactionActions : this.recordedActions;
            target.push(action);
            if (this.verbose) console.debug('recordSaveState ->', { message: message || '', snapshotSize: { objects: snapshot.objects.length, arrows: snapshot.arrows.length, freehands: snapshot.freehands.length } });
            else console.log(`📝 Registrato: Snapshot stato (${message || 'no message'})`);
        } catch (err) {
            console.error('Errore durante la serializzazione snapshot:', err);
        }
    }

    // ============================================================
    // RIPRODUZIONE
    // ============================================================

    // Transactions API: begin/commit a grouped set of actions
    beginTransaction(name = '') {
        if (!this.isRecording) return;
        if (this.inTransaction) {
            console.warn('Transaction already open');
            return;
        }
        this.inTransaction = true;
        this.transactionActions = [];
        this.transactionName = name;
        // Optionally store a snapshot at start
        try {
            const tab = this.editor.getCurrentTab();
            this.transactionStartSnapshot = {
                objects: Array.from(tab.objects.entries()),
                arrows: Array.from(tab.arrows.entries()),
                freehands: Array.from(tab.freehands.entries())
            };
        } catch (e) { this.transactionStartSnapshot = null; }
        // timeline for differential recording inside the transaction (objectId -> [{t, props},...])
        this.transactionTimeline = new Map();
        this.transactionRelativeStart = (Date.now() - this.startTime) || 0;

        if (this.verbose) console.debug('beginTransaction', { name, startSnapshotSize: this.transactionStartSnapshot ? this.transactionStartSnapshot.objects.length : 0 });
        else console.log(`🔒 Transaction started: ${name}`);
    }

    endTransaction(name = '') {
        if (!this.isRecording) return;
        if (!this.inTransaction) {
            console.warn('No open transaction to end');
            return;
        }

        // capture final snapshot
        let transactionSnapshot = null;
        try {
            const tab = this.editor.getCurrentTab();
            transactionSnapshot = {
                objects: Array.from(tab.objects.entries()),
                arrows: Array.from(tab.arrows.entries()),
                freehands: Array.from(tab.freehands.entries())
            };
        } catch (e) { transactionSnapshot = null; }

        const tx = {
            type: 'transaction',
            timestamp: Date.now() - this.startTime,
            params: {
                name: name || this.transactionName || '',
                actions: [...this.transactionActions],
                snapshotAfter: transactionSnapshot,
                snapshotBefore: this.transactionStartSnapshot,
                timeline: Array.from(this.transactionTimeline ? this.transactionTimeline.entries() : [])
            }
        };

    this.recordedActions.push(tx);
    if (this.verbose) console.debug('endTransaction', { name: name || this.transactionName || '', actionCount: this.transactionActions.length, snapshotAfterSize: transactionSnapshot ? transactionSnapshot.objects.length : 0 });
    else console.log(`🔓 Transaction ended: ${name || this.transactionName || ''} (${this.transactionActions.length} actions)`);

        // reset transaction state
        this.inTransaction = false;
        this.transactionActions = [];
        this.transactionName = null;
        this.transactionStartSnapshot = null;
    }

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
        this.abortRequested = false; // reset abort flag
        console.log(`▶️ Riproduzione macro: ${macroName}`);

        try {
            await this.executeActions(macro.actions);
            console.log(`✅ Riproduzione completata`);
            alert('✅ Macro riprodotta con successo');
        } catch (error) {
            if (error && String(error.message).toLowerCase().includes('aborted')) {
                console.log('⏹️ Riproduzione interrotta dall\'utente');
                alert('⏹️ Riproduzione interrotta');
            } else {
                console.error('Errore durante la riproduzione:', error);
                alert('❌ Errore durante la riproduzione: ' + (error.message || error));
            }
        } finally {
            this.isPlaying = false;
        }
    }

    async executeActions(actions) {
        for (const action of actions) {
            if (this.abortRequested) {
                throw new Error('Playback aborted');
            }
            // Attesa in base al timestamp relativo
            if (actions.indexOf(action) > 0) {
                const prevTimestamp = actions[actions.indexOf(action) - 1].timestamp;
                const delay = (action.timestamp - prevTimestamp) / this.playbackSpeed;
                // small sleep but check abort in chunks
                const waitMs = Math.max(delay, 50);
                const step = 100;
                let waited = 0;
                while (waited < waitMs) {
                    if (this.abortRequested) throw new Error('Playback aborted');
                    const toWait = Math.min(step, waitMs - waited);
                    await new Promise(resolve => setTimeout(resolve, toWait));
                    waited += toWait;
                }
            }

            await this.executeAction(action);
        }

        // Salva lo stato finale
        this.editor.saveState('Macro riprodotta');
    }

    abortPlayback() {
        // Request an abort; executeActions / executeAction will notice and throw
        if (!this.isPlaying) {
            this.abortRequested = false;
            return false;
        }
        this.abortRequested = true;
        console.log('⏹️ Abort richiesto per la riproduzione');
        return true;
    }

    async executeAction(action) {
        const tab = this.editor.getCurrentTab();
        if (this.abortRequested) throw new Error('Playback aborted');
        if (this.verbose) console.groupCollapsed('⏯️ executeAction', action.type);

        switch (action.type) {
            case 'addObject': {
                const { type, x, y, color, text, rotation, dashed, icon, src, spriteData } = action.params;
                this.editor.addObject(type, x, y, color, text, rotation, dashed, icon, src, spriteData);
                if (this.verbose) console.debug('executeAction.addObject', action.params);
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
                if (this.verbose) console.debug('executeAction.deleteObjects', deletedObjects.map(d=>d.id));
                break;
            }

            case 'createArrow': {
                const { from, to, arrowType, dashed, color, thickness } = action.params;
                this.editor.createArrow(from, to, arrowType, dashed, color, thickness);
                if (this.verbose) console.debug('executeAction.createArrow', action.params);
                break;
            }

            case 'changeColor': {
                const { color } = action.params;
                this.editor.changeSelectedObjectsColor(color);
                if (this.verbose) console.debug('executeAction.changeColor', color);
                break;
            }

            case 'changeText': {
                const { text } = action.params;
                this.editor.changeSelectedObjectsText(text);
                if (this.verbose) console.debug('executeAction.changeText', text);
                break;
            }

            case 'rotate': {
                const { degrees } = action.params;
                this.editor.rotateSelected(degrees);
                if (this.verbose) console.debug('executeAction.rotate', degrees);
                break;
            }

            case 'copy': {
                try { this.editor.copySelected(); } catch (e) { console.warn('copy playback error', e); }
                if (this.verbose) console.debug('executeAction.copy');
                break;
            }

            case 'paste': {
                try { this.editor.paste(); } catch (e) { console.warn('paste playback error', e); }
                if (this.verbose) console.debug('executeAction.paste');
                break;
            }

            case 'snapshot': {
                try {
                    const { snapshot } = action.params;
                    if (!snapshot) break;

                    // Ripristina lo stato del tab dal snapshot
                    const currTab = this.editor.getCurrentTab();
                    currTab.objects = new Map(snapshot.objects || []);
                    currTab.arrows = new Map(snapshot.arrows || []);
                    currTab.freehands = new Map(snapshot.freehands || []);

                    // Ricarica lo stato e renderizza
                    if (typeof this.editor.loadTabState === 'function') {
                        this.editor.loadTabState();
                    }
                    if (this.verbose) console.debug('executeAction.snapshot', { objects: snapshot.objects.length, arrows: snapshot.arrows.length, freehands: snapshot.freehands.length });
                } catch (err) {
                    console.error('Errore riproduzione snapshot:', err);
                }
                break;
            }

            case 'transaction': {
                try {
                    const { actions: txActions } = action.params;
                    if (!Array.isArray(txActions)) break;

                    if (this.verbose) console.groupCollapsed('⤴️ transaction replay', action.params.name || 'transaction');
                    // Esegui le azioni della transazione in ordine
                    for (const a of txActions) {
                        // rispettare eventuali timestamp relativi all'interno della transazione
                        await this.executeAction(a);
                    }
                    if (this.verbose) console.groupEnd();

                    // Se presente, applica snapshot finale per garantire stato coerente
                        // If a differential timeline is present, play it before applying the final snapshot
                        const timeline = action.params && action.params.timeline;
                        if (timeline && Array.isArray(timeline) && timeline.length > 0) {
                            try {
                                // Flatten frames across objects into a single ordered list
                                const frames = [];
                                for (const [objectId, farr] of timeline) {
                                    (farr || []).forEach(f => frames.push({ objectId, t: f.t, props: f.props }));
                                }
                                frames.sort((a, b) => a.t - b.t);

                                let lastT = 0;
                                for (const frame of frames) {
                                    if (this.abortRequested) throw new Error('Playback aborted');
                                    const delay = Math.max(0, (frame.t - lastT) / this.playbackSpeed);
                                    if (delay > 0) await new Promise(r => setTimeout(r, delay));
                                    lastT = frame.t;

                                    // apply props to object if present
                                    try {
                                        const currTab = this.editor.getCurrentTab();
                                        const obj = currTab.objects.get(frame.objectId);
                                        if (obj) {
                                            Object.assign(obj, frame.props);
                                            // update DOM representation
                                            const el = document.getElementById(frame.objectId);
                                            if (el) {
                                                if (frame.props.x !== undefined) el.style.left = obj.x + 'px';
                                                if (frame.props.y !== undefined) el.style.top = obj.y + 'px';
                                                if (frame.props.rotation !== undefined) el.style.transform = `rotate(${obj.rotation}deg)`;
                                                if (frame.props.width !== undefined) el.style.width = obj.width + 'px';
                                                if (frame.props.height !== undefined) el.style.height = obj.height + 'px';
                                            }
                                            // special handling for freehands
                                            if (obj.type === 'freehand' && frame.props.points) {
                                                obj.points = frame.props.points;
                                                if (typeof this.editor.renderFreehand === 'function') this.editor.renderFreehand(obj);
                                            }
                                            // update arrows connected to this object
                                            if (typeof this.editor.updateArrowsForObject === 'function') this.editor.updateArrowsForObject(frame.objectId);
                                        }
                                    } catch (e) {
                                        if (this.verbose) console.debug('Error applying timeline frame', e);
                                    }
                                }
                            } catch (e) {
                                if (String(e.message).toLowerCase().includes('aborted')) throw e;
                                console.error('Error during timeline playback', e);
                            }
                        }

                        const snapshotAfter = action.params && action.params.snapshotAfter;
                        if (snapshotAfter) {
                            const currTab = this.editor.getCurrentTab();
                            currTab.objects = new Map(snapshotAfter.objects || []);
                            currTab.arrows = new Map(snapshotAfter.arrows || []);
                            currTab.freehands = new Map(snapshotAfter.freehands || []);
                            if (typeof this.editor.loadTabState === 'function') this.editor.loadTabState();
                            if (this.verbose) console.debug('executeAction.transaction.snapshotAfter applied', { objects: snapshotAfter.objects.length });
                        }
                } catch (err) {
                    console.error('Errore riproduzione transaction:', err);
                }
                break;
            }

            default:
                console.warn(`Azione sconosciuta: ${action.type}`);
        }

        if (this.verbose) console.groupEnd();
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
        
        this.editor.storage.set('volleyMacros', JSON.stringify(data));
        console.log('💾 Macros salvate');
    }

    loadMacros() {
        try {
            const data = this.editor.storage.get('volleyMacros');
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
                        <button id="btnAbortPlay" class="macro-btn danger" style="display:none;" title="Interrompi la riproduzione">
                            ⏹️ Interrompi
                        </button>
                        <label style="display:flex; align-items:center; gap:6px; margin-left:8px;">
                            <select id="playTarget" style="padding:6px; border-radius:4px; border:1px solid #ccc;">
                                <option value="currtab">Su tab corrente</option>
                                <option value="window">In nuova finestra</option>
                            </select>
                        </label>
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
                        <label style="display:flex; align-items:center; gap:8px; margin-left: 8px;">
                            <input type="checkbox" id="macroVerboseToggle" style="transform: scale(1.1);"> Modalità verbose
                        </label>
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
                        const abortBtn = win.querySelector('#btnAbortPlay');
                        if (abortBtn) abortBtn.style.display = 'inline-block';

                        if (!this.selectedMacro) return;

                        const playTarget = win.querySelector('#playTarget') ? win.querySelector('#playTarget').value : 'currtab';

                        if (playTarget === 'currtab') {
                            // comportamento corrente: esegui sul tab corrente
                            this.playMacro(this.selectedMacro.name);
                            return;
                        }

                        // playTarget === 'window' -> apri una nuova finestra/dialog e riproduci la macro lì
                        const macroName = this.selectedMacro.name;

                        createWindow({
                            title: `Riproduzione: ${macroName}`,
                            id: `macroPlayWindow_${macroName}`,
                            size: 'sm',
                            contentHTML: `<div style="padding:20px;"><div id="macroPlayStatus" style="font-weight:bold;">⏳ Preparazione riproduzione...</div></div>`,
                            buttons: [
                                { label: 'Interrompi', color: 'danger', onClick: (w) => { this.macroRecorder.abortPlayback(); } },
                                { label: 'Chiudi', color: 'secondary', onClick: (w) => { /* la finestra può essere chiusa manualmente */ } }
                            ],
                            listeners: {
                                domReady: (playWin) => {
                                    const statusEl = playWin.querySelector('#macroPlayStatus');
                                    // Avvia riproduzione usando lo stesso recorder (che opera sul tab corrente)
                                    this.macroRecorder.playMacro(macroName)
                                        .then(() => {
                                            if (statusEl) statusEl.textContent = '✅ Riproduzione completata';
                                        })
                                        .catch(err => {
                                            if (statusEl) statusEl.textContent = '❌ Errore durante la riproduzione: ' + (err.message || err);
                                            console.error('Errore riproduzione in window:', err);
                                        });
                                }
                            }
                        });
                    });

                    // Abort button listener
                    const btnAbort = win.querySelector('#btnAbortPlay');
                    if (btnAbort) {
                        btnAbort.addEventListener('click', () => {
                            this.macroRecorder.abortPlayback();
                            btnAbort.style.display = 'none';
                        });
                    }

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

                    // Verbose toggle
                    const verboseToggle = win.querySelector('#macroVerboseToggle');
                    verboseToggle.checked = !!this.macroRecorder.verbose;
                    verboseToggle.addEventListener('change', (e) => {
                        this.macroRecorder.setVerbose(e.target.checked);
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
            this.isPlaying = true;
            document.getElementById('btnPlayMacro').disabled = true;
            document.getElementById('btnPlayMacro').textContent = '⏳ In riproduzione...';

            // mostra il pulsante di abort nella dialog se presente
            const abortBtn = document.getElementById('btnAbortPlay');
            if (abortBtn) abortBtn.style.display = 'inline-block';

            await this.macroRecorder.playMacro(macroName);

            alert('✅ Macro riprodotta con successo!');
        } catch (error) {
            console.error('Errore durante la riproduzione:', error);
            alert('❌ Errore durante la riproduzione: ' + error.message);
        } finally {
            this.isPlaying = false;
            document.getElementById('btnPlayMacro').disabled = false;
            document.getElementById('btnPlayMacro').textContent = '▶️ Riproduci';
            const abortBtn2 = document.getElementById('btnAbortPlay');
            if (abortBtn2) abortBtn2.style.display = 'none';
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
            <div style="margin-top:10px; display:flex; gap:10px;">
                <div id="macroPreviewCanvas" style="flex:2; border:1px solid #ccc; padding:6px; min-height:120px; background:white; overflow:auto;"></div>
                <div id="macroPreviewStats" style="flex:1; border:1px solid #ccc; padding:6px; min-height:120px; overflow:auto;"></div>
            </div>
        `;

        panel.style.display = 'block';
        // render preview (if possible)
        this.showMacroPreview(macro);
    }

    showMacroPreview(macro) {
        // Try to find a snapshot in macro actions (last snapshot or transaction.snapshotAfter)
        let snapshot = null;
        for (let i = macro.actions.length - 1; i >= 0; i--) {
            const a = macro.actions[i];
            if (!a) continue;
            if (a.type === 'snapshot' && a.params && a.params.snapshot) {
                snapshot = a.params.snapshot; break;
            }
            if (a.type === 'transaction' && a.params && a.params.snapshotAfter) {
                snapshot = a.params.snapshotAfter; break;
            }
        }

        // fallback to tabObjects saved at macro start
        if (!snapshot && macro.tabObjects) {
            snapshot = {
                objects: Array.from(macro.tabObjects.entries()),
                arrows: [],
                freehands: []
            };
        }

        const canvas = document.getElementById('macroPreviewCanvas');
        const stats = document.getElementById('macroPreviewStats');
        if (!canvas || !stats) return;

        if (!snapshot) {
            canvas.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Nessuna anteprima disponibile</div>';
            stats.innerHTML = '';
            return;
        }

        // render mini preview similar to history preview
        canvas.innerHTML = '';
        const miniCanvas = document.createElement('div');
        miniCanvas.style.cssText = `width:100%; height:100%; position:relative; transform:scale(0.5); transform-origin:top left; background:white;`;

        (snapshot.objects || []).forEach(([id, obj]) => {
            const element = document.createElement('div');
            element.id = 'preview_' + id;
            element.style.cssText = `
                position:absolute; left:${obj.x}px; top:${obj.y}px; width:${obj.width}px; height:${obj.height}px;
                background:${obj.color}; opacity:${obj.opacity || 1}; transform:rotate(${obj.rotation}deg);
                border:${obj.dashed ? '2px dashed' : '2px solid'} #333; border-radius:4px; display:flex; align-items:center; justify-content:center;
                font-size:10px; color:white; text-shadow:1px 1px 2px black;
            `;
            element.textContent = obj.text || '';
            miniCanvas.appendChild(element);
        });

        (snapshot.arrows || []).forEach(([id, arrow]) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;';
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const from = arrow.from && arrow.from.x !== undefined ? arrow.from : { x: 0, y: 0 };
            const to = arrow.to && arrow.to.x !== undefined ? arrow.to : { x: 100, y: 100 };
            line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
            line.setAttribute('stroke', arrow.color || '#000');
            line.setAttribute('stroke-width', arrow.thickness || 2);
            if (arrow.dashed) line.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(line);
            miniCanvas.appendChild(svg);
        });

        canvas.appendChild(miniCanvas);

        // stats
        const objectCount = (snapshot.objects || []).length;
        const arrowCount = (snapshot.arrows || []).length;
        const freehandCount = (snapshot.freehands || []).length;
        stats.innerHTML = `
            <div><strong>📦 Oggetti:</strong> ${objectCount}</div>
            <div><strong>➡️ Frecce:</strong> ${arrowCount}</div>
            <div><strong>✏️ Disegni:</strong> ${freehandCount}</div>
        `;

        // Timeline editor / preview controls
        const timelineWrapper = document.createElement('div');
        timelineWrapper.style.cssText = 'margin-top:10px; border-top:1px dashed #eee; padding-top:8px;';
        timelineWrapper.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center;">
                <button id="btnPlayPreview" style="padding:6px 10px;">▶️ Riproduci anteprima</button>
                <button id="btnStopPreview" style="padding:6px 10px; display:none;">⏹️ Interrompi</button>
                <button id="btnSaveEditedMacro" style="padding:6px 10px;">💾 Salva macro modificata</button>
                <div style="margin-left:8px; color:#666; font-size:12px;">(Puoi rimuovere o modificare il timestamp delle azioni)</div>
            </div>
            <div id="timelineList" style="margin-top:8px; max-height:160px; overflow:auto;"></div>
        `;

        stats.appendChild(timelineWrapper);

        // render timeline list
        this.renderMacroTimeline(macro);

        // bind preview controls
        const btnPlay = document.getElementById('btnPlayPreview');
        const btnStop = document.getElementById('btnStopPreview');
        const btnSaveEdited = document.getElementById('btnSaveEditedMacro');
        if (btnPlay) btnPlay.addEventListener('click', () => { this.playMacroPreview(macro, snapshot); });
        if (btnStop) btnStop.addEventListener('click', () => { this.stopMacroPreview(); });
        if (btnSaveEdited) btnSaveEdited.addEventListener('click', () => {
            // persist edits
            try {
                this.macroRecorder.persistMacros();
            } catch (e) { /* best effort */ }
            this.loadMacros();
            this.renderMacroList();
            alert('✅ Macro salvata');
        });
    }

    // Render the timeline list and attach edit/remove handlers
    renderMacroTimeline(macro) {
        const listEl = document.getElementById('timelineList');
        if (!listEl) return;
        listEl.innerHTML = '';

        macro.actions.forEach((a, idx) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:6px; border-bottom:1px solid #f0f0f0;';
            const info = document.createElement('div');
            const t = typeof a.timestamp === 'number' ? (a.timestamp / 1000).toFixed(2) + 's' : '-';
            info.innerHTML = `<div style="font-weight:600">${idx + 1}. ${a.type}</div><div style="font-size:12px;color:#666">timestamp: ${t}</div>`;

            const ctrls = document.createElement('div');
            ctrls.style.cssText = 'display:flex; gap:6px;';

            const btnEdit = document.createElement('button');
            btnEdit.textContent = '✏️';
            btnEdit.title = 'Modifica timestamp';
            btnEdit.style.cssText = 'padding:4px 6px;';
            btnEdit.addEventListener('click', () => { this.editMacroActionTimestamp(macro, idx); });

            const btnRemove = document.createElement('button');
            btnRemove.textContent = '🗑️';
            btnRemove.title = 'Rimuovi azione';
            btnRemove.style.cssText = 'padding:4px 6px;';
            btnRemove.addEventListener('click', () => { this.removeMacroAction(macro, idx); });

            ctrls.appendChild(btnEdit);
            ctrls.appendChild(btnRemove);

            row.appendChild(info);
            row.appendChild(ctrls);
            listEl.appendChild(row);
        });
    }

    removeMacroAction(macro, idx) {
        if (!macro || !Array.isArray(macro.actions) || idx < 0 || idx >= macro.actions.length) return;
        if (!confirm('Eliminare questa azione dalla macro?')) return;
        macro.actions.splice(idx, 1);
        // persist and refresh UI
        try { this.macroRecorder.persistMacros(); } catch (e) {}
        this.loadMacros();
        this.renderMacroList();
        this.renderMacroTimeline(macro);
        this.showMacroPreview(macro);
    }

    editMacroActionTimestamp(macro, idx) {
        if (!macro || !Array.isArray(macro.actions) || idx < 0 || idx >= macro.actions.length) return;
        const a = macro.actions[idx];
        const current = typeof a.timestamp === 'number' ? (a.timestamp / 1000).toFixed(2) : '';
        const v = prompt('Inserisci nuovo timestamp in secondi (es. 1.25):', current);
        if (v === null) return;
        const parsed = parseFloat(v);
        if (isNaN(parsed) || parsed < 0) { alert('Valore non valido'); return; }
        a.timestamp = Math.round(parsed * 1000);
        // re-sort actions by timestamp to keep order
        macro.actions.sort((x, y) => (x.timestamp || 0) - (y.timestamp || 0));
        try { this.macroRecorder.persistMacros(); } catch (e) {}
        this.loadMacros();
        this.renderMacroList();
        this.renderMacroTimeline(macro);
        this.showMacroPreview(macro);
    }

    // Simple preview player that applies timeline frames and some action types to the preview canvas
    playMacroPreview(macro, snapshot) {
        if (!macro) return;
        this.stopMacroPreview();
        this._previewTimeouts = [];
        const previewRoot = document.getElementById('macroPreviewCanvas');
        if (!previewRoot) return;
        const miniCanvas = previewRoot.querySelector('div');
        if (!miniCanvas) return;

        // build frame list
        const frames = [];
        for (const a of macro.actions) {
            const baseT = a.timestamp || 0;
            if (a.type === 'transaction' && a.params && a.params.timeline) {
                try {
                    for (const entry of a.params.timeline) {
                        const objectId = entry[0];
                        const farr = entry[1] || [];
                        for (const f of farr) {
                            frames.push({ t: baseT + (f.t || 0), type: 'frame', objectId, props: f.props });
                        }
                    }
                } catch (e) { /* ignore */ }
            } else if (a.type === 'addObject') {
                frames.push({ t: baseT, type: 'addObject', params: a.params });
            } else if (a.type === 'deleteObjects') {
                frames.push({ t: baseT, type: 'deleteObjects', params: a.params });
            } else if (a.type === 'rotate' || a.type === 'changeColor' || a.type === 'changeText') {
                // best-effort: apply at action time to selected objects if ids present (limited data)
                frames.push({ t: baseT, type: a.type, params: a.params });
            }
        }

        frames.sort((a, b) => (a.t || 0) - (b.t || 0));
        const startT = frames.length ? frames[0].t : 0;
        const now = Date.now();

        // schedule frames
        frames.forEach(frame => {
            const delay = Math.max(0, (frame.t || 0) - startT);
            const to = setTimeout(() => {
                try {
                    if (this._previewAbort) return;
                    if (frame.type === 'frame') {
                        const el = document.getElementById('preview_' + frame.objectId);
                        if (el) {
                            const p = frame.props || {};
                            if (p.x !== undefined) el.style.left = p.x + 'px';
                            if (p.y !== undefined) el.style.top = p.y + 'px';
                            if (p.rotation !== undefined) el.style.transform = 'rotate(' + p.rotation + 'deg)';
                            if (p.width !== undefined) el.style.width = p.width + 'px';
                            if (p.height !== undefined) el.style.height = p.height + 'px';
                            if (p.color !== undefined) el.style.background = p.color;
                        }
                    } else if (frame.type === 'addObject') {
                        const params = frame.params || {};
                        const id = params.id || ('tmp_' + Math.random().toString(36).slice(2, 9));
                        if (!document.getElementById('preview_' + id)) {
                            const el = document.createElement('div');
                            el.id = 'preview_' + id;
                            el.style.cssText = `position:absolute; left:${params.x || 0}px; top:${params.y || 0}px; width:${params.width || 30}px; height:${params.height || 30}px; background:${params.color || '#888'}; border:2px solid #333; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:white;`;
                            el.textContent = params.text || '';
                            miniCanvas.appendChild(el);
                        }
                    } else if (frame.type === 'deleteObjects') {
                        const ids = (frame.params && frame.params.deletedObjects) ? frame.params.deletedObjects.map(d=>d.id) : null;
                        if (ids && ids.length) {
                            ids.forEach(id => {
                                const el = document.getElementById('preview_' + id);
                                if (el && el.parentNode) el.parentNode.removeChild(el);
                            });
                        }
                    } else if (frame.type === 'rotate' && frame.params) {
                        // rotate selected count: not actionable in preview without ids
                    }
                } catch (e) { /* ignore per-frame errors */ }
            }, delay);
            this._previewTimeouts.push(to);
        });

        // toggle UI
        const btnPlay = document.getElementById('btnPlayPreview');
        const btnStop = document.getElementById('btnStopPreview');
        if (btnPlay) btnPlay.style.display = 'none';
        if (btnStop) btnStop.style.display = 'inline-block';

        // automatically restore UI after last frame
        if (frames.length) {
            const lastDelay = Math.max(0, (frames[frames.length - 1].t || 0) - startT) + 50;
            const endTo = setTimeout(() => { this.stopMacroPreview(); }, lastDelay);
            this._previewTimeouts.push(endTo);
        }
    }

    stopMacroPreview() {
        this._previewAbort = true;
        if (this._previewTimeouts && Array.isArray(this._previewTimeouts)) {
            this._previewTimeouts.forEach(t => clearTimeout(t));
        }
        this._previewTimeouts = [];
        this._previewAbort = false;
        const btnPlay = document.getElementById('btnPlayPreview');
        const btnStop = document.getElementById('btnStopPreview');
        if (btnPlay) btnPlay.style.display = 'inline-block';
        if (btnStop) btnStop.style.display = 'none';
        // re-render preview to restore initial snapshot state
        if (this.selectedMacro) this.showMacroPreview(this.selectedMacro);
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