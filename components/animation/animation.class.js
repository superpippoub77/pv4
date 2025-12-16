/**
 * AnimationDialog
 * Gestisce il dialogo per il controllo animazioni (frame timeline)
 * Uso:
 * const animationManager = new AnimationDialog(schemaEditor);
 * animationManager.init();
 * animationManager.show();
 */

class AnimationDialog {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.elements = {};
        this.frames = [];
        this.currentFrameIndex = 0;
    }

    init() {
        this.createAnimationDialog();
        this.cacheElements();
        this.attachListeners();
    }

    createAnimationDialog() {
        const html = `
        <div class="animation-dialog-content">
            <div class="animation-dialog-header" id="animationDialogHeader">
                <h3 data-i18n="local_animation_controls_title">🎬 Controlli Animazione</h3>
                <button class="animation-dialog-close" id="closeAnimationDialog">&times;</button>
            </div>
            <div class="animation-dialog-body">
                <!-- Controlli Riproduzione -->
                <div class="animation-control-section">
                    <h4 data-i18n="local_animation_playback_title">▶️ Riproduzione</h4>
                    <div class="animation-controls-row">
                        <button id="animationPlay" title="Play">▶️</button>
                        <button id="animationPause" title="Pause" style="display: none;">⏸️</button>
                        <button id="animationStop" title="Stop">⏹️</button>
                        <button id="animationPrevFrame" title="Frame Precedente">⏮️</button>
                        <button id="animationNextFrame" title="Frame Successivo">⏭️</button>
                        <span class="frame-display" id="currentFrameDisplay">Frame: 0</span>
                    </div>
                </div>

                <!-- Velocità -->
                <div class="animation-control-section">
                    <h4 data-i18n="local_animation_speed_title">⚡ Velocità</h4>
                    <div class="animation-controls-row">
                        <label>ms/frame:</label>
                        <input type="number" id="animationSpeed" min="100" max="5000" value="1000" step="100">
                    </div>
                </div>

                <!-- Gestione Frame -->
                <div class="animation-control-section">
                    <h4 data-i18n="local_animation_frame_timeline_title">📋 Frame Timeline</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <button id="addFrameBtn" style="background: #27ae60; color: white; border: none;">➕ Nuovo Frame</button>
                    </div>
                    <div id="framesList"></div>
                </div>

                <!-- Proprietà Frame Selezionato -->
                <div id="frameProperties" style="display: none;">
                    <h5 data-i18n="local_animation_frame_properties_title">🎨 Proprietà Frame <span id="frameNumber"></span></h5>
                    <div style="margin-bottom: 10px;">
                        <label style="font-weight: bold;">⏱️ Timestamp (ms): <input type="number" id="frameTimestamp" min="0" step="100" style="width: 100px;"></label>
                    </div>
                    <div class="frame-properties-grid">
                        <label>X: <input type="number" id="frameX" step="1"></label>
                        <label>Y: <input type="number" id="frameY" step="1"></label>
                        <label>Larghezza: <input type="number" id="frameWidth" step="1"></label>
                        <label>Altezza: <input type="number" id="frameHeight" step="1"></label>
                        <label>Rotazione: <input type="number" id="frameRotation" step="15"></label>
                        <label>Opacità: <input type="number" id="frameOpacity" min="0" max="1" step="0.1"></label>
                        <label>Colore: <input type="color" id="frameColor"></label>
                        <label style="flex-direction: row; align-items: center;">
                            <input type="checkbox" id="frameDashed" data-i18n="local_frame_dashed_checkbox"> Tratteggiato
                        </label>
                    </div>
                    <div class="frame-actions">
                        <button id="updateFrameBtn" data-i18n="local_update_frame_button">💾 Aggiorna</button>
                        <button id="deleteFrameBtn" data-i18n="local_delete_frame_button">🗑️ Elimina</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        this.dialog = createWindow({
            title: 'dlg_title_animation',
            icon: '🎬',
            id: 'animationDialog',
            contentHTML: html,
            effect: 'windows',
            size: 'md',
            modal: false,
            visible: false,
            buttons: [
                { label: 'btn_close', color: 'secondary', onClick: () => { this.hide(); } }
            ]
        });
    }

    cacheElements() {
        this.elements.dialog = document.getElementById('animationDialog');
        this.elements.animationPlay = document.getElementById('animationPlay');
        this.elements.animationPause = document.getElementById('animationPause');
        this.elements.animationStop = document.getElementById('animationStop');
        this.elements.animationPrevFrame = document.getElementById('animationPrevFrame');
        this.elements.animationNextFrame = document.getElementById('animationNextFrame');
        this.elements.currentFrameDisplay = document.getElementById('currentFrameDisplay');
        this.elements.animationSpeed = document.getElementById('animationSpeed');
        this.elements.addFrameBtn = document.getElementById('addFrameBtn');
        this.elements.framesList = document.getElementById('framesList');
        this.elements.frameProperties = document.getElementById('frameProperties');
        this.elements.frameTimestamp = document.getElementById('frameTimestamp');
        this.elements.frameX = document.getElementById('frameX');
        this.elements.frameY = document.getElementById('frameY');
        this.elements.frameWidth = document.getElementById('frameWidth');
        this.elements.frameHeight = document.getElementById('frameHeight');
        this.elements.frameRotation = document.getElementById('frameRotation');
        this.elements.frameOpacity = document.getElementById('frameOpacity');
        this.elements.frameColor = document.getElementById('frameColor');
        this.elements.frameDashed = document.getElementById('frameDashed');
        this.elements.updateFrameBtn = document.getElementById('updateFrameBtn');
        this.elements.deleteFrameBtn = document.getElementById('deleteFrameBtn');
        this.elements.closeAnimationDialog = document.getElementById('closeAnimationDialog');

        if (!this.elements.dialog) console.error('AnimationDialog: elements not found');
    }

    attachListeners() {
        this.elements.closeAnimationDialog?.addEventListener('click', () => this.hide());
        this.elements.animationPlay?.addEventListener('click', () => this.play());
        this.elements.animationStop?.addEventListener('click', () => this.stop());
        this.elements.animationPrevFrame?.addEventListener('click', () => this.prevFrame());
        this.elements.animationNextFrame?.addEventListener('click', () => this.nextFrame());
        this.elements.addFrameBtn?.addEventListener('click', () => this.addFrame());
        this.elements.framesList?.addEventListener('click', (e) => this.onFrameListClick(e));
        this.elements.updateFrameBtn?.addEventListener('click', () => this.updateFrame());
        this.elements.deleteFrameBtn?.addEventListener('click', () => this.deleteFrame());
    }

    show() {
        if (this.dialog) this.dialog.showDialog();
        this.renderFramesList();
    }

    hide() {
        if (this.dialog) this.dialog.hideDialog();
    }

    isVisible() {
        return this.elements.dialog?.classList.contains('active') || false;
    }

    // Simple frame management methods (minimal, can be extended)
    addFrame() {
        const frame = {
            timestamp: Date.now(),
            x: 0,
            y: 0,
            width: 64,
            height: 64,
            rotation: 0,
            opacity: 1,
            color: '#000000',
            dashed: false
        };
        this.frames.push(frame);
        this.renderFramesList();
    }

    renderFramesList() {
        if (!this.elements.framesList) return;
        this.elements.framesList.innerHTML = '';
        this.frames.forEach((f, idx) => {
            const el = document.createElement('div');
            el.className = 'frame-item';
            el.dataset.index = idx;
            el.style.cssText = 'padding:8px; border-bottom:1px solid #eee; cursor:pointer; display:flex; justify-content:space-between; align-items:center;';
            el.innerHTML = `<span>Frame ${idx}</span><span>${f.timestamp}</span>`;
            this.elements.framesList.appendChild(el);
        });
    }

    onFrameListClick(e) {
        const item = e.target.closest('.frame-item');
        if (!item) return;
        const idx = parseInt(item.dataset.index);
        if (isNaN(idx)) return;
        this.selectFrame(idx);
    }

    selectFrame(idx) {
        this.currentFrameIndex = idx;
        const f = this.frames[idx];
        if (!f) return;
        this.elements.frameProperties.style.display = 'block';
        this.elements.frameNumber.textContent = idx;
        this.elements.frameTimestamp.value = f.timestamp;
        this.elements.frameX.value = f.x;
        this.elements.frameY.value = f.y;
        this.elements.frameWidth.value = f.width;
        this.elements.frameHeight.value = f.height;
        this.elements.frameRotation.value = f.rotation;
        this.elements.frameOpacity.value = f.opacity;
        this.elements.frameColor.value = f.color;
        this.elements.frameDashed.checked = !!f.dashed;
    }

    updateFrame() {
        const idx = this.currentFrameIndex;
        const f = this.frames[idx];
        if (!f) return;
        f.timestamp = parseInt(this.elements.frameTimestamp.value) || f.timestamp;
        f.x = parseInt(this.elements.frameX.value) || f.x;
        f.y = parseInt(this.elements.frameY.value) || f.y;
        f.width = parseInt(this.elements.frameWidth.value) || f.width;
        f.height = parseInt(this.elements.frameHeight.value) || f.height;
        f.rotation = parseInt(this.elements.frameRotation.value) || f.rotation;
        f.opacity = parseFloat(this.elements.frameOpacity.value) || f.opacity;
        f.color = this.elements.frameColor.value || f.color;
        f.dashed = !!this.elements.frameDashed.checked;
        this.renderFramesList();
    }

    deleteFrame() {
        const idx = this.currentFrameIndex;
        if (isNaN(idx)) return;
        this.frames.splice(idx, 1);
        this.currentFrameIndex = Math.max(0, idx - 1);
        this.renderFramesList();
        this.elements.frameProperties.style.display = this.frames.length ? 'block' : 'none';
    }

    play() {
        // minimal playback: iterate frames and update currentFrameDisplay
        if (!this.frames.length) return;
        const msPerFrame = parseInt(this.elements.animationSpeed.value) || 1000;
        let i = 0;
        this.stop();
        this._playInterval = setInterval(() => {
            if (i >= this.frames.length) {
                clearInterval(this._playInterval);
                this._playInterval = null;
                return;
            }
            this.currentFrameIndex = i;
            this.elements.currentFrameDisplay.textContent = `Frame: ${i}`;
            i++;
        }, msPerFrame);
    }

    stop() {
        if (this._playInterval) {
            clearInterval(this._playInterval);
            this._playInterval = null;
        }
    }

    prevFrame() {
        this.currentFrameIndex = Math.max(0, this.currentFrameIndex - 1);
        this.elements.currentFrameDisplay.textContent = `Frame: ${this.currentFrameIndex}`;
        this.selectFrame(this.currentFrameIndex);
    }

    nextFrame() {
        this.currentFrameIndex = Math.min(this.frames.length - 1, this.currentFrameIndex + 1);
        this.elements.currentFrameDisplay.textContent = `Frame: ${this.currentFrameIndex}`;
        this.selectFrame(this.currentFrameIndex);
    }
}

window.AnimationDialog = AnimationDialog;
