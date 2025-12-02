class HistoryDialogManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.dialog = null;
        this.selectedHistoryIndex = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.elements = {
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

    init() {
        this.createHistoryDialog();
        this.cacheElements();
        this.setupDragAndDrop();
    }

    createHistoryDialog() {
        const html = `
            <div class="history-dialog-container" style="display: flex; height: 100%;">
                <div class="history-list-panel" style="flex: 1; border-right: 1px solid #ccc; overflow-y: auto; padding: 10px;">
                    <div id="historyCount" class="history-count">0 modifiche</div>
                    <div id="historyList" style="margin-top: 10px;"></div>
                </div>
                <div class="history-preview-panel" style="flex: 1; padding: 10px; display: flex; flex-direction: column;">
                    <div class="history-preview-header">
                        <strong id="historyPreviewTitle">Seleziona una modifica per visualizzare l'anteprima</strong>
                    </div>
                    <div class="history-preview-content" style="flex: 1; display: flex; flex-direction: column; margin-top: 10px;">
                        <div class="history-preview-canvas" id="historyPreviewCanvas" style="flex: 2; border: 1px solid #ccc; overflow: auto; padding: 5px;"></div>
                        <div class="history-preview-stats" id="historyPreviewStats" style="flex: 1; margin-top: 10px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;"></div>
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
                { label: 'bt_cancel', color: 'secondary', onClick: () => this.hide(), id: 'cancelHistoryBtn' },
                { label: 'bt_delete', disabled: true, close: false, align: 'left', color: 'primary', onClick: () => this.deleteSelected(), id: 'deleteHistoryBtn' },
                { label: 'bt_compare', disabled: true, close: false, align: 'left', color: 'primary', onClick: () => this.compareWithCurrent(), id: 'compareHistoryBtn' },
                { label: 'bt_restore', disabled: true, close: false, align: 'left', color: 'primary', onClick: () => this.restoreSelected(), id: 'restoreHistoryBtn' }
            ]
        });
    }

    cacheElements() {
        this.elements.historyList = document.getElementById('historyList');
        this.elements.historyCount = document.getElementById('historyCount');
        this.elements.previewCanvas = document.getElementById('historyPreviewCanvas');
        this.elements.previewTitle = document.getElementById('historyPreviewTitle');
        this.elements.previewStats = document.getElementById('historyPreviewStats');
        this.elements.restoreBtn = document.getElementById('restoreHistoryBtn');
        this.elements.compareBtn = document.getElementById('compareHistoryBtn');
        this.elements.deleteBtn = document.getElementById('deleteHistoryBtn');
    }

    setupDragAndDrop() {
        const header = this.elements.previewTitle?.parentElement;
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            this.isDragging = true;
            const rect = this.dialog.getBoundingClientRect();
            this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            header.style.cursor = 'grabbing';
            this.dialog.style.transform = 'none';
            this.dialog.style.left = rect.left + 'px';
            this.dialog.style.top = rect.top + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.dialog.style.left = (e.clientX - this.dragOffset.x) + 'px';
            this.dialog.style.top = (e.clientY - this.dragOffset.y) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                header.style.cursor = 'move';
            }
        });
    }

    show() {
        this.dialog.showDialog();

        // Reset stato interno e selezione
        this.selectedHistoryIndex = null;
        this.elements.historyList?.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));

        // Disabilita tutti i pulsanti
        setButtonState(this.elements.restoreBtn, true);
        setButtonState(this.elements.deleteBtn, true);
        setButtonState(this.elements.compareBtn, true);

        // Reset anteprima
        this.resetPreview();

        // Renderizza la lista aggiornata
        this.render();
    }

    hide() {
        this.dialog.hideDialog();
        this.selectedHistoryIndex = null;
    }

    isVisible() {
        return this.dialog?.classList.contains('active') || false;
    }

    render() {
        this.renderHistoryList();
        this.updateStatsDisplay();
    }

    renderHistoryList() {
        const tab = this.editor.getCurrentTab();
        const container = this.elements.historyList;
        container.innerHTML = '';

        if (!tab.history || tab.history.length === 0) {
            container.innerHTML = `<div style="padding:20px; text-align:center; color:#999;">Nessuna modifica nello storico</div>`;
            return;
        }

        tab.history.forEach((state, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.index = index;
            if (index === tab.historyIndex) item.classList.add('current');

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
                <div class="history-item-details">📦 ${metadata.objectCount} obj | ➡️ ${metadata.arrowCount} frecce | ✏️ ${metadata.freehandCount} disegni</div>
            `;

            item.addEventListener('click', () => this.selectHistoryItem(index));
            container.appendChild(item);
        });

        const currentItem = container.querySelector('.history-item.current');
        if (currentItem) currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    selectHistoryItem(index) {
        this.elements.historyList?.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));
        const selectedItem = this.elements.historyList?.querySelector(`.history-item[data-index="${index}"]`);
        if (selectedItem) selectedItem.classList.add('selected');

        this.selectedHistoryIndex = index;
        this.updateButtonStates(index);
        this.showHistoryPreview(index);
    }

    updateButtonStates(index) {
        const tab = this.editor.getCurrentTab();
        setButtonState(this.elements.restoreBtn, false);
        setButtonState(this.elements.deleteBtn, index === tab.historyIndex);
        setButtonState(this.elements.compareBtn, false);
    }

    showHistoryPreview(index) {
        const tab = this.editor.getCurrentTab();
        const state = tab.history[index];
        if (!state) return;

        const time = new Date(state.timestamp);
        this.elements.previewTitle.textContent = `Anteprima: ${state.description || 'Modifica'} (${time.toLocaleString('it-IT')})`;
        this.showHistoryCanvasPreview(state);
        this.showHistoryStats(state, index);
    }

    showHistoryCanvasPreview(state) {
        const canvas = this.elements.previewCanvas;
        canvas.innerHTML = '';

        const miniCanvas = document.createElement('div');
        miniCanvas.style.cssText = `width:100%; height:100%; position:relative; transform:scale(0.5); transform-origin:top left; background:white;`;

        state.objects?.forEach(([id, obj]) => {
            const element = document.createElement('div');
            element.style.cssText = `
                position:absolute; left:${obj.x}px; top:${obj.y}px; width:${obj.width}px; height:${obj.height}px;
                background:${obj.color}; opacity:${obj.opacity || 1}; transform:rotate(${obj.rotation}deg);
                border:${obj.dashed ? '2px dashed' : '2px solid'} #333; border-radius:4px; display:flex; align-items:center; justify-content:center;
                font-size:10px; color:white; text-shadow:1px 1px 2px black;
            `;
            element.textContent = obj.text || '';
            miniCanvas.appendChild(element);
        });

        state.arrows?.forEach(([id, arrow]) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;';
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const from = arrow.from.x !== undefined ? arrow.from : { x: 0, y: 0 };
            const to = arrow.to.x !== undefined ? arrow.to : { x: 100, y: 100 };
            line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
            line.setAttribute('stroke', arrow.color || '#000');
            line.setAttribute('stroke-width', arrow.thickness || 2);
            if (arrow.dashed) line.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(line);
            miniCanvas.appendChild(svg);
        });

        canvas.appendChild(miniCanvas);
    }

    showHistoryStats(state, index) {
        const tab = this.editor.getCurrentTab();
        const isCurrent = index === tab.historyIndex;
        const objectCount = state.objects?.length || 0;
        const arrowCount = state.arrows?.length || 0;
        const freehandCount = state.freehands?.length || 0;
        const timeStr = new Date(state.timestamp).toLocaleString('it-IT');

        this.elements.previewStats.innerHTML = `
            <div><strong>📅 Timestamp:</strong> ${this.escapeHtml(timeStr)}</div>
            <div><strong>📦 Oggetti:</strong> ${objectCount}</div>
            <div><strong>➡️ Frecce:</strong> ${arrowCount}</div>
            <div><strong>✏️ Disegni:</strong> ${freehandCount}</div>
            <div><strong>📝 Descrizione:</strong> ${this.escapeHtml(state.description || 'Nessuna descrizione')}</div>
            ${isCurrent ? '<div style="color:#28a745;font-weight:bold;margin-top:5px;">✅ Stato Corrente</div>' : ''}
        `;
    }

    restoreSelected() {
        if (this.selectedHistoryIndex === null) return;
        const tab = this.editor.getCurrentTab();
        const index = this.selectedHistoryIndex;

        if (confirm(`Ripristinare lo stato: "${tab.history[index].description}"?\n\nQuesta azione creerà un nuovo punto nello storico.`)) {
            tab.historyIndex = index;
            this.editor.restoreState(tab.history[index]);
            this.editor.saveState(`Ripristinato: ${tab.history[index].description}`);
            this.render();
            alert('✅ Stato ripristinato con successo!');
        }
    }

    deleteSelected() {
        if (this.selectedHistoryIndex === null) return;
        const tab = this.editor.getCurrentTab();
        const index = this.selectedHistoryIndex;

        if (index === tab.historyIndex) { alert('❌ Non puoi eliminare lo stato corrente'); return; }
        if (confirm(`Eliminare la modifica: "${tab.history[index].description}"?`)) {
            tab.history.splice(index, 1);
            if (tab.historyIndex >= index) tab.historyIndex--;
            this.editor.historyMetadata.delete(`${this.editor.activeTabId}-${index}`);
            this.selectedHistoryIndex = null;
            this.render();
            this.resetPreview();
        }
    }

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
        const isSame = selectedObjects === currentObjects && selectedArrows === currentArrows && selectedFreehands === currentFreehands;

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
            <div style="margin-top:10px; padding:10px; background:${isSame ? '#d4edda' : '#fff3cd'}; border-radius:4px;">
                ${isSame ? '✅ Gli stati hanno lo stesso numero di elementi' :
                `⚠️ Differenze: ${Math.abs(selectedObjects - currentObjects)} oggetti, ${Math.abs(selectedArrows - currentArrows)} frecce, ${Math.abs(selectedFreehands - currentFreehands)} disegni`}
            </div>
        `;
    }

    resetPreview() {
        this.elements.previewCanvas.innerHTML = `<div style="padding:20px; text-align:center; color:#999;">Seleziona una modifica</div>`;
        this.elements.previewStats.innerHTML = `<div style="padding:10px; text-align:center; color:#999;">Seleziona un elemento dalla cronologia</div>`;
    }

    updateStatsDisplay() {
        const tab = this.editor.getCurrentTab();
        const count = tab.history?.length || 0;
        this.elements.historyCount.textContent = `${count} ${count === 1 ? 'modifica' : 'modifiche'}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
