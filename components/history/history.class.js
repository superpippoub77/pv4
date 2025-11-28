/**
 * HistoryDialogManager
 * Gestisce il dialogo dello storico delle modifiche
 * 
 * Utilizzo:
 * const historyManager = new HistoryDialogManager(schemaEditor);
 * historyManager.init();
 * historyManager.show();
 */

class HistoryDialogManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.overlay = null;
        this.selectedHistoryIndex = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.elements = {
            dialog: null,
            overlay: null,
            header: null,
            closeBtn: null,
            historyList: null,
            historyCount: null,
            previewCanvas: null,
            previewTitle: null,
            previewStats: null,
            restoreBtn: null,
            compareBtn: null,
            deleteBtn: null
        };
    }

    /**
     * Inizializza il manager
     */
    init() {
        this.createHistoryDialog();
        this.cacheElements();
        this.setupDragAndDrop();
    }
    // ============================================================
    // INIZIALIZZAZIONE UI
    // ============================================================
    createHistoryDialog() {
        const html = `
                <div class="history-list-panel">
                <div id="historyList">
                    <!-- Popolato dinamicamente -->
                </div>
            </div>
            <div class="history-preview-panel">
                <div class="history-preview-header">
                    <strong id="historyPreviewTitle" data-i18n="local_history_preview_title">Seleziona una modifica per
                        visualizzare l'anteprima</strong>
                </div>
                <div class="history-preview-content">
                    <div class="history-preview-canvas" id="historyPreviewCanvas">
                        <!-- Canvas di preview -->
                    </div>
                    <div class="history-preview-stats" id="historyPreviewStats">
                        <!-- Statistiche della modifica -->
                    </div>
                </div>
            </div>
        `;

        this.dialog = createWindow({
            title: 'dlg_title_history',
            icon: '🎬',
            id: 'historyManagerDialog',
            contentHTML: html,
            effect: "windows",
            size: 'lg',
            visible: false,
            buttons: [
                { label: 'Annulla', color: 'secondary', onClick: () => { this.hide() } },
                { label: 'Elimina', color: 'primary', onClick: () => { this.deleteSelected() } },
                { label: 'Compara', color: 'primary', onClick: () => { this.compareWithCurrent() } },
                { label: 'Ripristina', color: 'primary', onClick: () => { this.restoreSelected() } }
            ]
        });
    }


    /**
     * Cachea i riferimenti agli elementi DOM
     */
    cacheElements() {
        this.elements.dialog = document.getElementById('historyManagerDialog');
        this.elements.overlay = document.getElementById('historyDialogOverlay');
        this.elements.header = document.getElementById('historyDialogHeader');
        this.elements.closeBtn = document.getElementById('closeHistoryDialog');
        this.elements.historyList = document.getElementById('historyList');
        this.elements.historyCount = document.getElementById('historyCount');
        this.elements.previewCanvas = document.getElementById('historyPreviewCanvas');
        this.elements.previewTitle = document.getElementById('historyPreviewTitle');
        this.elements.previewStats = document.getElementById('historyPreviewStats');
        this.elements.restoreBtn = document.getElementById('restoreHistoryBtn');
        this.elements.compareBtn = document.getElementById('compareHistoryBtn');
        this.elements.deleteBtn = document.getElementById('deleteHistoryBtn');

        if (!this.elements.dialog) {
            console.error('HistoryDialogManager: HTML elements not found');
        }
    }

    /**
     * Configura il drag & drop dell'header
     */
    setupDragAndDrop() {
        const header = this.elements.header;
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            // Non trascinare se clicchi su pulsanti
            if (e.target.closest('button')) return;

            this.isDragging = true;
            const rect = this.elements.dialog.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            header.style.cursor = 'grabbing';
            this.elements.dialog.style.transform = 'none';
            this.elements.dialog.style.left = rect.left + 'px';
            this.elements.dialog.style.top = rect.top + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;

            this.elements.dialog.style.left = newX + 'px';
            this.elements.dialog.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                header.style.cursor = 'move';
            }
        });
    }

    /**
     * Mostra il dialogo
     */
    show() {
        this.dialog.showDialog();
        this.render();
    }

    /**
     * Nasconde il dialogo
     */
    hide() {
        this.dialog.hideDialog();
        this.selectedHistoryIndex = null;
    }

    /**
     * Verifica se il dialogo è visibile
     */
    isVisible() {
        return this.elements.dialog?.classList.contains('active') || false;
    }

    /**
     * Renderizza la lista dello storico
     */
    render() {
        this.renderHistoryList();
        this.updateStatsDisplay();
    }

    /**
     * Renderizza la lista dello storico
     */
    renderHistoryList() {
        const tab = this.editor.getCurrentTab();
        const container = this.elements.historyList;

        if (!container) return;

        container.innerHTML = '';

        if (!tab.history || tab.history.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #999;">
                    Nessuna modifica nello storico
                </div>
            `;
            return;
        }

        tab.history.forEach((state, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.index = index;

            if (index === tab.historyIndex) {
                item.classList.add('current');
            }

            const time = new Date(state.timestamp);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

            const historyKey = `${this.editor.activeTabId}-${index}`;
            const metadata = this.editor.historyMetadata.get(historyKey) || {
                description: state.description || 'Modifica',
                objectCount: state.objects?.length || 0,
                arrowCount: state.arrows?.length || 0,
                freehandCount: state.freehands?.length || 0
            };

            item.innerHTML = `
                <div class="history-item-time">${timeStr}</div>
                <div class="history-item-info">${this.escapeHtml(metadata.description)}</div>
                <div class="history-item-details">
                    📦 ${metadata.objectCount} obj | 
                    ➡️ ${metadata.arrowCount} frecce | 
                    ✏️ ${metadata.freehandCount} disegni
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectHistoryItem(index);
            });

            container.appendChild(item);
        });

        // Scroll all'elemento corrente
        const currentItem = container.querySelector('.history-item.current');
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Seleziona un elemento dello storico
     */
    selectHistoryItem(index) {
        const tab = this.editor.getCurrentTab();

        // Rimuovi selezione precedente
        this.elements.historyList?.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Seleziona nuovo item
        const selectedItem = this.elements.historyList?.querySelector(`.history-item[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Abilita i pulsanti
        this.selectedHistoryIndex = index;
        this.updateButtonStates(index);

        // Mostra preview
        this.showHistoryPreview(index);
    }

    /**
     * Aggiorna lo stato dei pulsanti
     */
    updateButtonStates(index) {
        const tab = this.editor.getCurrentTab();
        const isCurrent = index === tab.historyIndex;

        this.elements.restoreBtn.disabled = false;
        this.elements.deleteBtn.disabled = isCurrent;
        this.elements.compareBtn.disabled = false;
    }

    /**
     * Mostra l'anteprima di uno stato dello storico
     */
    showHistoryPreview(index) {
        const tab = this.editor.getCurrentTab();
        const state = tab.history[index];

        if (!state) return;

        const time = new Date(state.timestamp);
        const timeStr = time.toLocaleString('it-IT');

        this.elements.previewTitle.textContent = `Anteprima: ${state.description || 'Modifica'} (${timeStr})`;

        // Mostra statistiche
        this.showHistoryStats(state, index);
    }

    /**
     * Mostra le statistiche dello stato
     */
    showHistoryStats(state, index) {
        const tab = this.editor.getCurrentTab();
        const isCurrent = index === tab.historyIndex;

        const objectCount = state.objects?.length || 0;
        const arrowCount = state.arrows?.length || 0;
        const freehandCount = state.freehands?.length || 0;

        const time = new Date(state.timestamp);
        const timeStr = time.toLocaleString('it-IT');

        this.elements.previewStats.innerHTML = `
            <div><strong>📅 Timestamp:</strong> ${this.escapeHtml(timeStr)}</div>
            <div><strong>📦 Oggetti:</strong> ${objectCount}</div>
            <div><strong>➡️ Frecce:</strong> ${arrowCount}</div>
            <div><strong>✏️ Disegni:</strong> ${freehandCount}</div>
            <div><strong>📝 Descrizione:</strong> ${this.escapeHtml(state.description || 'Nessuna descrizione')}</div>
            ${isCurrent ? '<div style="color: #28a745; font-weight: bold; margin-top: 5px;">✅ Stato Corrente</div>' : ''}
        `;
    }

    /**
     * Ripristina lo stato selezionato
     */
    restoreSelected() {
        if (this.selectedHistoryIndex === null) return;

        const tab = this.editor.getCurrentTab();
        const index = this.selectedHistoryIndex;

        if (confirm(`Ripristinare lo stato: "${tab.history[index].description}"?\n\nQuesta azione creerà un nuovo punto nello storico.`)) {
            tab.historyIndex = index;
            this.editor.restoreState(tab.history[index]);

            // Crea un nuovo punto nello storico per il ripristino
            this.editor.saveState(`Ripristinato: ${tab.history[index].description}`);

            this.render();
            alert('✅ Stato ripristinato con successo!');
        }
    }

    /**
     * Elimina lo stato selezionato
     */
    deleteSelected() {
        if (this.selectedHistoryIndex === null) return;

        const tab = this.editor.getCurrentTab();
        const index = this.selectedHistoryIndex;

        if (index === tab.historyIndex) {
            alert('❌ Non puoi eliminare lo stato corrente');
            return;
        }

        if (confirm(`Eliminare la modifica: "${tab.history[index].description}"?`)) {
            tab.history.splice(index, 1);

            // Aggiorna historyIndex se necessario
            if (tab.historyIndex >= index) {
                tab.historyIndex--;
            }

            // Rimuovi metadati
            const historyKey = `${this.editor.activeTabId}-${index}`;
            this.editor.historyMetadata.delete(historyKey);

            this.selectedHistoryIndex = null;
            this.render();
            this.resetPreview();

            this.elements.restoreBtn.disabled = true;
            this.elements.deleteBtn.disabled = true;
            this.elements.compareBtn.disabled = true;
        }
    }

    /**
     * Confronta con lo stato corrente
     */
    compareWithCurrent() {
        if (this.selectedHistoryIndex === null) return;

        const tab = this.editor.getCurrentTab();
        const selectedState = tab.history[this.selectedHistoryIndex];
        const currentState = tab.history[tab.historyIndex];

        const selectedObjects = selectedState.objects?.length || 0;
        const currentObjects = currentState.objects?.length || 0;
        const selectedArrows = selectedState.arrows?.length || 0;
        const currentArrows = currentState.arrows?.length || 0;
        const selectedFreehands = selectedState.freehands?.length || 0;
        const currentFreehands = currentState.freehands?.length || 0;

        const isSame = selectedObjects === currentObjects &&
            selectedArrows === currentArrows &&
            selectedFreehands === currentFreehands;

        this.elements.previewStats.innerHTML = `
            <div class="history-comparison">
                <div class="comparison-side">
                    <div class="comparison-title">Stato Selezionato</div>
                    <div>📦 Oggetti: ${selectedObjects}</div>
                    <div>➡️ Frecce: ${selectedArrows}</div>
                    <div>✏️ Disegni: ${selectedFreehands}</div>
                </div>
                <div class="comparison-side">
                    <div class="comparison-title">Stato Corrente</div>
                    <div>📦 Oggetti: ${currentObjects}</div>
                    <div>➡️ Frecce: ${currentArrows}</div>
                    <div>✏️ Disegni: ${currentFreehands}</div>
                </div>
            </div>
            <div style="margin-top: 10px; padding: 10px; background: ${isSame ? '#d4edda' : '#fff3cd'}; border-radius: 4px;">
                ${isSame ?
                '✅ Gli stati hanno lo stesso numero di elementi' :
                `⚠️ Differenze: ${Math.abs(selectedObjects - currentObjects)} oggetti, ${Math.abs(selectedArrows - currentArrows)} frecce, ${Math.abs(selectedFreehands - currentFreehands)} disegni`
            }
            </div>
        `;
    }

    /**
     * Resetta l'anteprima
     */
    resetPreview() {
        this.elements.previewCanvas.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                Seleziona una modifica
            </div>
        `;
        this.elements.previewStats.innerHTML = `
            <div style="padding: 10px; text-align: center; color: #999;">
                Seleziona un elemento dalla cronologia
            </div>
        `;
    }

    /**
     * Aggiorna il conteggio delle modifiche
     */
    updateStatsDisplay() {
        const tab = this.editor.getCurrentTab();
        const count = tab.history?.length || 0;
        this.elements.historyCount.textContent = `${count} ${count === 1 ? 'modifica' : 'modifiche'}`;
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
