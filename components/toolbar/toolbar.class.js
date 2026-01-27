class Enumerator {
    static get TOP() { return "top"; }
    static get BOTTOM() { return "bottom"; }
    static get LEFT() { return "left"; }
    static get RIGHT() { return "right"; }
}

class ToolbarDialogManager {
    constructor(editor, config, storage, id = "toolbar", position = Enumerator.TOP) {
        this.editor = editor;
        this.config = config;
        this.storage = storage;
        //this.align = align;

        this.toolbar = null;
        this.id = id;
        this.position = position; // "top", "bottom", "left", "right"
        this.key = "toolbarSize_" + id;
        this.keyPrevious = "toolbarPreviousSize_" + id;
        this.keyPosition = "toolbarPosition_" + id;
        this.isMinimized = false;
        this.minSize = 40; // Dimensione minima (altezza o larghezza)

        // ---------- FIX: inizializza la struttura per i gruppi floating ----------
        this.floatingToolbarGroups = new Map();

        // Bind per preservare il contesto this quando il metodo è usato come listener
        this.initFloatingGroupsDocking = this.initFloatingGroupsDocking.bind(this);
    }

    /****************************************************
     * INIT - Modificato per includere drag & drop
     ****************************************************/
    async init(beforeDivId = "menu") {
        this.restorePosition();
        await this.createToolbar(beforeDivId);
        this.applyPosition();
        this.restoreSize();

        // ✅ ABILITA DRAG & DROP
        this.enableGroupDragging();
        this.restoreGroupOrder();

        // Abilita evidenziazione per gruppi floating vicino alla toolbar
        this.initFloatingGroupsDocking();
    }

    /****************************************************
     * Gestione posizione della toolbar
     ****************************************************/
    restorePosition() {
        const saved = this.storage.get(this.keyPosition);
        if (saved) {
            this.position = saved;
        }
    }

    savePosition() {
        this.storage.set(this.keyPosition, this.position);
    }

    setPosition(newPosition) {
        if (!["top", "bottom", "left", "right"].includes(newPosition)) {
            console.error("Invalid position:", newPosition);
            return;
        }

        this.position = newPosition;
        this.savePosition();
        this.applyPosition();
        this.restoreSize();
    }

    applyPosition() {
        // Rimuovi tutte le classi di posizione
        this.toolbar.classList.remove("toolbar-top", "toolbar-bottom", "toolbar-left", "toolbar-right");

        // Aggiungi la classe appropriata
        this.toolbar.classList.add(`toolbar-${this.position}`);

        // Reset degli stili per evitare conflitti
        this.toolbar.style.width = "";
        this.toolbar.style.height = "";

        // Ricrea la maniglia nella posizione corretta
        this.recreateResizer();
    }

    isHorizontal() {
        return this.position === "top" || this.position === "bottom";
    }

    /****************************************************
     * Memorizzazione dimensione (altezza o larghezza)
     ****************************************************/
    restoreSize() {
        const saved = this.storage.get(this.key);
        if (saved) {
            if (this.isHorizontal()) {
                this.toolbar.style.height = saved + "px";
            } else {
                this.toolbar.style.width = saved + "px";
            }
        }
    }

    saveSize(size) {
        this.storage.set(this.key, size);
    }

    savePreviousSize(size) {
        this.storage.set(this.keyPrevious, size);
    }

    getPreviousSize() {
        return this.storage.get(this.keyPrevious);
    }

    /****************************************************
     * Toggle Minimize/Restore con doppio click
     ****************************************************/
    toggleMinimize() {
        const isHorizontal = this.isHorizontal();
        const currentSize = isHorizontal
            ? (parseInt(this.toolbar.style.height, 10) || this.toolbar.getBoundingClientRect().height)
            : (parseInt(this.toolbar.style.width, 10) || this.toolbar.getBoundingClientRect().width);

        if (this.isMinimized) {
            // Ripristina dimensione precedente
            const previousSize = this.getPreviousSize() || 100;
            if (isHorizontal) {
                this.toolbar.style.height = previousSize + "px";
            } else {
                this.toolbar.style.width = previousSize + "px";
            }
            this.saveSize(previousSize);
            this.isMinimized = false;
        } else {
            // Salva dimensione corrente e minimizza
            this.savePreviousSize(currentSize);
            if (isHorizontal) {
                this.toolbar.style.height = this.minSize + "px";
            } else {
                this.toolbar.style.width = this.minSize + "px";
            }
            this.saveSize(this.minSize);
            this.isMinimized = true;
        }
    }

    /****************************************************
     * Ricrea la maniglia nella posizione corretta
     ****************************************************/
    recreateResizer() {
        // Rimuovi la vecchia maniglia se esiste
        const oldResizer = this.toolbar.querySelector(".toolbar-resizer");
        if (oldResizer) oldResizer.remove();

        // Crea nuova maniglia
        const resizer = document.createElement("div");
        resizer.className = "toolbar-resizer";
        resizer.title = "Doppio click per minimizzare/ripristinare";

        // Imposta i puntini
        resizer.textContent = this.isHorizontal() ? "⋯" : "⋮";
        resizer.style.fontSize = "12px";
        resizer.style.color = "#6b7280";
        resizer.style.textAlign = "center";
        resizer.style.userSelect = "none";

        // Imposta il cursore
        resizer.style.cursor = this.isHorizontal() ? "row-resize" : "col-resize";

        // Inserisci la maniglia
        // Inserisci la maniglia
        if (this.position === "top" || this.position === "left") {
            // top e left: dopo la toolbar
            this.toolbar.parentNode.insertBefore(resizer, this.toolbar.nextSibling);
        } else if (this.position === "bottom") {
            // bottom: prima della toolbar
            this.toolbar.parentNode.insertBefore(resizer, this.toolbar);
        } else if (this.position === "right") {
            // right: all’inizio della toolbar
            this.toolbar.insertBefore(resizer, this.toolbar.firstChild);
        }

        this.enableResize(resizer);
    }



    /****************************************************
     * Resize Premium: adattato per tutte le direzioni
     ****************************************************/
    enableResize(resizer) {
        let startPos = 0;
        let startSize = 0;
        let pointerId = null;
        const isHorizontal = this.isHorizontal();

        const onPointerMove = (e) => {
            if (pointerId !== null && e.pointerId !== pointerId) return;

            let delta;
            if (isHorizontal) {
                delta = e.clientY - startPos;
                if (this.position === "top") delta = delta;
                else delta = -delta; // Inverti per bottom
            } else {
                delta = e.clientX - startPos;
                if (this.position === "left") delta = delta;
                else delta = -delta; // Inverti per right
            }

            const newSize = Math.max(this.minSize, startSize + delta);

            if (isHorizontal) {
                this.toolbar.style.height = newSize + "px";
            } else {
                this.toolbar.style.width = newSize + "px";
            }

            this.isMinimized = (newSize <= this.minSize);
        };

        const onPointerUp = (e) => {
            if (pointerId !== null && e.pointerId === pointerId) {
                try { resizer.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
                pointerId = null;
            }

            const finalSize = isHorizontal
                ? (parseInt(this.toolbar.style.height, 10) || this.toolbar.getBoundingClientRect().height)
                : (parseInt(this.toolbar.style.width, 10) || this.toolbar.getBoundingClientRect().width);

            this.saveSize(finalSize);

            if (finalSize > this.minSize) {
                this.savePreviousSize(finalSize);
                this.isMinimized = false;
            }

            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("pointercancel", onPointerUp);
        };

        resizer.addEventListener("dblclick", (e) => {
            e.preventDefault();
            this.toggleMinimize();
        });

        resizer.addEventListener("pointerdown", (e) => {
            e.preventDefault();

            pointerId = e.pointerId;
            startPos = isHorizontal ? e.clientY : e.clientX;

            if (isHorizontal) {
                startSize = parseInt(getComputedStyle(this.toolbar).height, 10);
            } else {
                startSize = parseInt(getComputedStyle(this.toolbar).width, 10);
            }

            try {
                resizer.setPointerCapture(pointerId);
            } catch (err) { /* ignore */ }

            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
            document.addEventListener("pointercancel", onPointerUp);
        });
    }

    /****************************************************
     * Creazione Toolbar + Gruppi + Maniglia
     ****************************************************/
    async createToolbar(beforeDivId = "menu") {
        return new Promise((resolve, reject) => {
            try {
                // Toolbar
                this.toolbar = document.getElementById(this.id);
                if (!this.toolbar) {
                    this.toolbar = document.createElement("div");
                    this.toolbar.id = this.id;
                    this.toolbar.className = "toolbar";
                    //document.body.append(this.toolbar);

                    const beforeDiv = document.getElementById(beforeDivId);
                    if (beforeDiv && beforeDiv.parentNode) {
                        beforeDiv.after(this.toolbar);
                    } else {
                        document.body.appendChild(this.toolbar);
                    }
                }

                // Gruppi
                this.config.forEach(group => {
                    if (group.position === undefined) group.position = "top"; // Default top
                    if (group.position !== this.position) return;

                    const fs = document.createElement("fieldset");
                    if (group.fieldsetId) fs.id = group.fieldsetId;
                    if (group.fieldsetClass) fs.className = group.fieldsetClass;
                    else fs.className = "toolbar-group";

                    const legend = document.createElement("legend");
                    legend.textContent = group.legend;
                    legend.setAttribute("data-i18n", group.legend);
                    fs.appendChild(legend);

                    group.items.forEach(item => {
                        const el = this.createItem(item);
                        fs.appendChild(el);
                    });

                    this.toolbar.appendChild(fs);
                });

                resolve();

            } catch (err) {
                console.error("Toolbar creation error:", err);
                reject(err);
            }
        });
    }

    /****************************************************
     * Helper per creare ogni item
     ****************************************************/
    createItem(item) {
        let el;

        switch (item.type) {
            case "label":
                el = document.createElement("label");
                el.id = item.id;
                el.className = item.class ? item.class : "";
                el.textContent = item.text;
                // Aggiungi data-i18n se presente
                if (item.i18n || item.text) {
                    el.setAttribute("data-i18n", item.i18n || item.text);
                }
                break;

            case "button":
                el = document.createElement("button");
                el.id = item.id;
                el.className = (item.class ? item.class : "") + " tooltip-wrapper"; // Aggiunge sempre la classe wrapper
                el.textContent = item.text;

                if (item.onClick) {
                    el.addEventListener("click", (event) => item.onClick?.(this.editor, event));
                }

                if (item.i18n) el.setAttribute("data-i18n", item.i18n);

                const tooltipText = item.title || item.text;
                if (tooltipText) {
                    const tooltip = document.createElement("span");
                    tooltip.className = "tooltip-text floating-tooltip";
                    tooltip.textContent = tooltipText;

                    // Se c'è una traduzione per il titolo, impostala
                    if (item.titleI18n || item.i18n) {
                        tooltip.setAttribute("data-i18n", item.titleI18n || item.i18n);
                    }

                    // Ensure button has an id so we can reference it if needed
                    if (!el.id) {
                        el.id = item.id || `toolbar-btn-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
                    }

                    // Append tooltip to body to avoid clipping by parent containers / transforms
                    document.body.appendChild(tooltip);

                    // Remove native title to avoid browser default tooltip
                    el.removeAttribute('title');

                    // Mouseenter: show & position tooltip; attach live repositioning
                    el.addEventListener("mouseenter", (ev) => {
                        el.classList.add("show-tooltip");
                        tooltip.classList.add('visible');
                        // Position once immediately (positionTooltip uses button rect)
                        this.positionTooltip(el, tooltip);

                        if (!el._tooltipPointerMove) {
                            el._tooltipPointerMove = (ev2) => {
                                this.positionTooltip(el, tooltip);
                            };
                        }
                        el.addEventListener('pointermove', el._tooltipPointerMove);
                    });

                    // Mouseleave: hide tooltip and cleanup
                    el.addEventListener("mouseleave", () => {
                        el.classList.remove("show-tooltip");
                        tooltip.classList.remove('visible');
                        if (el._tooltipPointerMove) {
                            try { el.removeEventListener('pointermove', el._tooltipPointerMove); } catch (e) { }
                        }

                        // Clear inline positioning so CSS can fully control visibility next time
                        tooltip.style.left = '';
                        tooltip.style.top = '';
                        tooltip.style.right = '';
                        tooltip.style.bottom = '';
                        tooltip.style.transform = '';
                        tooltip.style.visibility = '';
                        tooltip.style.display = '';
                    });

                    // Keep a reference for potential cleanup
                    el._tooltipElement = tooltip;
                }
                break;

            case "select":
                el = document.createElement("select");
                el.id = item.id;
                el.className = item.class ? item.class : "";
                // Aggiungi data-i18n per il select stesso
                if (item.i18n) {
                    el.setAttribute("data-i18n", item.i18n);
                }
                // Aggiungi title se presente
                if (item.title) {
                    el.title = item.title;
                    el.setAttribute("data-i18n-title", item.titleI18n || item.title);
                }
                item.options.forEach(([value, text, i18nKey]) => {
                    const opt = document.createElement("option");
                    opt.value = value;
                    opt.textContent = text;
                    // Aggiungi data-i18n per ogni option
                    if (i18nKey || text) {
                        opt.setAttribute("data-i18n", i18nKey || text);
                    }
                    el.appendChild(opt);
                });
                break;

            case "input":
                el = document.createElement("input");
                el.id = item.id;
                el.className = item.class ? item.class : "";
                el.placeholder = item.placeholder ?? "";

                // Click handler (opzionale)
                if (item.onClick) {
                    el.addEventListener("click", (event) => item.onClick?.(this.editor, event));
                }

                // Input handler (opzionale)
                if (item.onInput) {
                    el.addEventListener("input", (event) => item.onInput?.(this.editor, event));
                }
                if (item.onChange) {
                    el.addEventListener("change", (event) => item.onChange?.(this.editor, event));
                }

                // Aggiungi data-i18n per il placeholder
                if (item.placeholderI18n || item.placeholder) {
                    el.setAttribute("data-i18n-placeholder", item.placeholderI18n || item.placeholder);
                }
                // Aggiungi data-i18n per il label aria
                if (item.i18n) {
                    el.setAttribute("data-i18n", item.i18n);
                    el.setAttribute("aria-label", item.i18n);
                }
                // Aggiungi title se presente
                if (item.title) {
                    el.title = item.title;
                    el.setAttribute("data-i18n-title", item.titleI18n || item.title);
                }

                // Attributi input
                if (item.inputType) el.type = item.inputType;
                if (item.min !== undefined) el.min = item.min;
                if (item.max !== undefined) el.max = item.max;
                if (item.step !== undefined) el.step = item.step;
                if (item.value !== undefined) el.value = item.value;

                break;

            case "file":
                el = document.createElement("input");
                el.type = "file";
                el.id = item.id;
                el.className = item.class ? item.class : "";
                el.accept = item.accept;
                // Aggiungi data-i18n per il label aria
                if (item.i18n || item.text) {
                    el.setAttribute("data-i18n", item.i18n || item.text);
                    el.setAttribute("aria-label", item.i18n || item.text);
                }
                // Aggiungi title se presente
                if (item.title) {
                    el.title = item.title;
                    el.setAttribute("data-i18n-title", item.titleI18n || item.title);
                }
                break;

            case "div":
                el = document.createElement("div");
                el.id = item.id;
                el.className = item.class ?? "";
                el.style = item.style ?? "";
                el.innerHTML = item.html ?? "";
                // Aggiungi data-i18n se presente
                if (item.i18n) {
                    el.setAttribute("data-i18n", item.i18n);
                }
                // Aggiungi data-i18n-html per contenuto HTML traducibile
                if (item.htmlI18n) {
                    el.setAttribute("data-i18n-html", item.htmlI18n);
                }
                break;
            default:
                el = document.createElement(el?.inputType || "div");
                el.id = item.id || "";
                el.className = item.class ? item.class : "";
                el.textContent = item.text || "";
                break;
        }

        return el;
    }

    positionTooltip(button, tooltip) {
        // Determine tooltip text: prefer explicit i18n/title on the tooltip element,
        // then the button-level data-i18n-title, then the tooltip's existing text,
        // finally fall back to the button text.
        const text = tooltip.getAttribute('data-i18n')
            || button.getAttribute('data-i18n-title')
            || tooltip.textContent
            || button.textContent || '';
        tooltip.textContent = text;

        // Compute pixel-perfect position using the button bounding rect.
        const rect = button.getBoundingClientRect();

        // Ensure tooltip is displayed so we can measure it
        tooltip.style.display = 'block';
        tooltip.style.position = 'fixed';

        // Horizontal center of the button
        const left = rect.left + rect.width / 2;

        // Vertical position: place tooltip above the button with a small gap
        // We measure the tooltip height after making it visible.
        const tooltipHeight = tooltip.offsetHeight || 24;
        let top = rect.top - 8 - tooltipHeight;

        // If not enough space above, place tooltip below the button
        if (top < 8) {
            top = rect.bottom + 8;
        }

        // Clamp horizontally within viewport (small margin)
        const tooltipWidth = tooltip.offsetWidth || 100;
        const minLeft = 8 + tooltipWidth / 2;
        const maxLeft = window.innerWidth - 8 - tooltipWidth / 2;
        const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);

        tooltip.style.left = clampedLeft + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.right = 'auto';
        tooltip.style.bottom = 'auto';
        tooltip.style.transform = 'translateX(-50%)';
    }


    /* Vecchio metodo */
    initToolbarDragDrop() {
        const toolbar = document.getElementById('toolbar');
        const footer = document.getElementById('footer');
        const bottomToolbarGroup = footer ? footer.querySelector('.bottom-toolbar-group') : null;
        const toolbarGroups = document.querySelectorAll('.toolbar-group');

        let draggedGroup = null;
        let placeholder = null;
        let isDraggingToolbar = false;
        let startX, startY;
        let offsetX, offsetY;
        let initialParent = null;
        let dragClone = null;

        toolbarGroups.forEach(group => {
            group.setAttribute('draggable', 'true');

            group.addEventListener('dragstart', (e) => {
                // ✅ Se la toolbar è fixed, blocca il drag
                if (group.classList.contains('fixed')) {
                    e.preventDefault();  // blocca il drag
                    return;
                }
                draggedGroup = group;
                isDraggingToolbar = true;
                initialParent = group.parentElement;

                const rect = group.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                startX = e.clientX;
                startY = e.clientY;

                group.classList.add('dragging');

                // ✅ MODIFICA: Crea un clone visivo invece di nascondere l'originale
                dragClone = group.cloneNode(true);
                dragClone.style.position = 'fixed';
                dragClone.style.pointerEvents = 'none';
                dragClone.style.opacity = '0.8';
                dragClone.style.zIndex = '10000';
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                document.body.appendChild(dragClone);

                // Crea placeholder
                placeholder = document.createElement('div');
                placeholder.className = 'toolbar-group toolbar-placeholder';
                placeholder.style.width = rect.width + 'px';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.display = 'inline-flex';
                placeholder.style.opacity = '0.5';
                placeholder.style.border = '2px dashed #3498db';

                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', group.innerHTML);

                // Nascondi l'elemento originale durante il drag
                setTimeout(() => {
                    group.style.opacity = '0.3';
                }, 0);
            });

            group.addEventListener('drag', (e) => {
                if (!isDraggingToolbar || !draggedGroup) return;

                // Aggiorna solo il clone, non l'elemento originale
                if (dragClone && e.clientX !== 0 && e.clientY !== 0) {
                    dragClone.style.left = (e.clientX - offsetX) + 'px';
                    dragClone.style.top = (e.clientY - offsetY) + 'px';
                }
            });

            group.addEventListener('dragend', (e) => {
                if (!draggedGroup) return;

                draggedGroup.classList.remove('dragging');
                draggedGroup.style.opacity = '1'; // Ripristina opacità
                if (toolbar) toolbar.classList.remove('drag-over');
                if (bottomToolbarGroup) bottomToolbarGroup.classList.remove('drag-over');

                // Rimuovi il clone
                if (dragClone) {
                    dragClone.remove();
                    dragClone = null;
                }

                const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : null;
                const bottomRect = bottomToolbarGroup ? bottomToolbarGroup.getBoundingClientRect() : null;

                const isOverToolbar = toolbarRect ? (
                    e.clientX >= toolbarRect.left &&
                    e.clientX <= toolbarRect.right &&
                    e.clientY >= toolbarRect.top &&
                    e.clientY <= toolbarRect.bottom
                ) : false;

                const isOverBottom = bottomRect ? (
                    e.clientX >= bottomRect.left &&
                    e.clientX <= bottomRect.right &&
                    e.clientY >= bottomRect.top &&
                    e.clientY <= bottomRect.bottom
                ) : false;

                if (!isOverToolbar && !isOverBottom &&
                    (initialParent === toolbar || initialParent === bottomToolbarGroup)) {
                    // Diventa floating
                    draggedGroup.classList.remove('docked');
                    draggedGroup.classList.add('floating');
                    draggedGroup.style.position = 'fixed';
                    draggedGroup.style.left = (e.clientX - offsetX) + 'px';
                    draggedGroup.style.top = (e.clientY - offsetY) + 'px';
                    draggedGroup.style.zIndex = '9999';

                    const floatingId = draggedGroup.id || `floating-${Date.now()}`;
                    if (!draggedGroup.id) draggedGroup.id = floatingId;

                    this.floatingToolbarGroups.set(floatingId, {
                        element: draggedGroup,
                        x: e.clientX - offsetX,
                        y: e.clientY - offsetY
                    });

                    if (draggedGroup.parentNode === toolbar || draggedGroup.parentNode === bottomToolbarGroup) {
                        draggedGroup.remove();
                        document.body.appendChild(draggedGroup);
                    }

                    this.addRedockButton(draggedGroup);

                } else if (isOverToolbar && draggedGroup.classList.contains('floating')) {
                    this.redockGroup(draggedGroup, 'top');
                } else if (isOverBottom && draggedGroup.classList.contains('floating')) {
                    this.redockGroup(draggedGroup, 'bottom');
                } else {
                    draggedGroup.classList.remove('floating');
                    draggedGroup.classList.add('docked');
                    draggedGroup.style.position = '';
                    draggedGroup.style.left = '';
                    draggedGroup.style.top = '';
                    draggedGroup.style.zIndex = '';
                }

                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }

                draggedGroup = null;
                placeholder = null;
                isDraggingToolbar = false;
                initialParent = null;
            });

            // Doppio click su floating group per re-dockare
            group.addEventListener('dblclick', (e) => {
                if (group.classList.contains('floating')) {
                    e.preventDefault();
                    this.showDockMenu(group, e.clientX, e.clientY);
                }
            });
        });

        // Dragover per toolbar superiore
        if (toolbar) {
            toolbar.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggedGroup) return;

                e.dataTransfer.dropEffect = 'move';
                toolbar.classList.add('drag-over');

                const afterElement = this.getDragAfterElement(toolbar, e.clientX);

                if (placeholder && placeholder.parentNode) {
                    placeholder.remove();
                }

                if (afterElement == null) {
                    toolbar.appendChild(placeholder);
                } else {
                    toolbar.insertBefore(placeholder, afterElement);
                }
            });

            toolbar.addEventListener('dragleave', (e) => {
                if (e.target === toolbar) {
                    toolbar.classList.remove('drag-over');
                }
            });

            toolbar.addEventListener('drop', (e) => {
                e.preventDefault();
                toolbar.classList.remove('drag-over');

                if (!draggedGroup) return;

                if (placeholder && placeholder.parentNode) {
                    toolbar.insertBefore(draggedGroup, placeholder);
                    placeholder.remove();
                }
            });
        }

        // Dragover per bottom toolbar
        if (bottomToolbarGroup) {
            bottomToolbarGroup.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggedGroup) return;

                e.dataTransfer.dropEffect = 'move';
                bottomToolbarGroup.classList.add('drag-over');

                const afterElement = this.getDragAfterElement(bottomToolbarGroup, e.clientX);

                if (placeholder && placeholder.parentNode) {
                    placeholder.remove();
                }

                if (afterElement == null) {
                    bottomToolbarGroup.appendChild(placeholder);
                } else {
                    bottomToolbarGroup.insertBefore(placeholder, afterElement);
                }
            });

            bottomToolbarGroup.addEventListener('dragleave', (e) => {
                if (e.target === bottomToolbarGroup) {
                    bottomToolbarGroup.classList.remove('drag-over');
                }
            });

            bottomToolbarGroup.addEventListener('drop', (e) => {
                e.preventDefault();
                bottomToolbarGroup.classList.remove('drag-over');

                if (!draggedGroup) return;

                if (placeholder && placeholder.parentNode) {
                    bottomToolbarGroup.insertBefore(draggedGroup, placeholder);
                    placeholder.remove();
                }
            });
        }
    }


    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.toolbar-group:not(.dragging):not(.toolbar-placeholder)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    /****************************************************
     * DRAG AND DROP - Gestione gruppi toolbar
     ****************************************************/
    enableGroupDragging() {
        if (!this.toolbar) return;
        const groups = this.toolbar.querySelectorAll('.toolbar-group:not(.fixed)');
        const isHorizontal = () => this.position === 'top' || this.position === 'bottom';

        groups.forEach(group => {
            let dragClone = null;
            let isDragging = false;
            let offsetX = 0, offsetY = 0;
            let initialParent = null;

            group.addEventListener('pointerdown', (e) => {
                // ❌ Blocca drag solo se il target è il pulsante redock o altri input interattivi
                if (e.target.closest('.redock-btn, button, input, select, textarea')) return;

                if (group.classList.contains('fixed')) return;

                e.preventDefault();

                isDragging = true;
                initialParent = group.parentElement;

                const rect = group.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;

                group.classList.add('dragging');

                // Clone visivo per drag
                dragClone = group.cloneNode(true);
                dragClone.style.position = 'fixed';
                dragClone.style.left = `${rect.left}px`;
                dragClone.style.top = `${rect.top}px`;
                dragClone.style.width = `${rect.width}px`;
                dragClone.style.height = `${rect.height}px`;
                dragClone.style.opacity = '0.7';
                dragClone.style.pointerEvents = 'none';
                dragClone.style.zIndex = '10000';
                document.body.appendChild(dragClone);

                const onPointerMove = (ev) => {
                    if (!isDragging) return;
                    dragClone.style.left = `${ev.clientX - offsetX}px`;
                    dragClone.style.top = `${ev.clientY - offsetY}px`;
                };

                const onPointerUp = (ev) => {
                    if (!isDragging) return;

                    dragClone.remove();
                    dragClone = null;
                    group.classList.remove('dragging');

                    const toolbarRect = this.toolbar.getBoundingClientRect();
                    const isOverToolbar = ev.clientX >= toolbarRect.left &&
                        ev.clientX <= toolbarRect.right &&
                        ev.clientY >= toolbarRect.top &&
                        ev.clientY <= toolbarRect.bottom;

                    if (isOverToolbar) {
                        // Dock nella toolbar
                        const groupsInToolbar = [...this.toolbar.querySelectorAll('.toolbar-group:not(.dragging)')];
                        let inserted = false;
                        for (let g of groupsInToolbar) {
                            const gRect = g.getBoundingClientRect();
                            if (isHorizontal() ? ev.clientX < gRect.left + gRect.width / 2 : ev.clientY < gRect.top + gRect.height / 2) {
                                this.toolbar.insertBefore(group, g);
                                inserted = true;
                                break;
                            }
                        }
                        if (!inserted) this.toolbar.appendChild(group);

                        group.classList.remove('floating');
                        group.classList.add('docked');

                        const btn = group.querySelector('.redock-btn');
                        if (btn) btn.remove();

                    } else {
                        // Floating
                        group.classList.remove('docked');
                        group.classList.add('floating');
                        group.style.position = 'fixed';
                        group.style.left = `${ev.clientX - offsetX}px`;
                        group.style.top = `${ev.clientY - offsetY}px`;
                        group.style.zIndex = '9999';
                        document.body.appendChild(group);

                        this.addRedockButton(group);

                        // Track floating
                        const floatingId = group.id || `floating-${Date.now()}`;
                        if (!group.id) group.id = floatingId;
                        this.floatingToolbarGroups.set(floatingId, {
                            element: group,
                            x: ev.clientX - offsetX,
                            y: ev.clientY - offsetY
                        });
                    }

                    isDragging = false;
                    this.saveGroupOrder();

                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', onPointerUp);
                };

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
            });

            // Doppio click su floating → mostra menu dock
            group.addEventListener('dblclick', (e) => {
                if (group.classList.contains('floating')) {
                    e.preventDefault();
                    this.showDockMenu(group, e.clientX, e.clientY);
                }
            });

            group.style.touchAction = 'none';
        });
    }


    // Modifica il metodo showDockMenu per permettere la scelta
    showDockMenu(group, x, y) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'dockMenu';
        //menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        //menu.style.zIndex = '10001';

        menu.innerHTML = `
        <div class="context-menu-item" data-dock="top">🔝 Ancora in alto</div>
        <div class="context-menu-item" data-dock="bottom">🔽 Ancora in basso</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-dock="cancel">❌ Annulla</div>
    `;

        document.body.appendChild(menu);

        // ---- Subito dopo ----
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };
        document.addEventListener('click', removeMenu);

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;

            const dockPosition = item.dataset.dock;

            if (dockPosition === 'top') {
                this.redockGroup(group, 'top');
            } else if (dockPosition === 'bottom') {
                this.redockGroup(group, 'bottom');
            }

            menu.remove();
        });

        // Chiudi menu al click fuori
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    addRedockButton(group) {
        // Rimuovi eventuali pulsanti esistenti
        const existingBtn = group.querySelector('.redock-btn');
        if (existingBtn) return;

        const redockBtn = document.createElement('button');
        redockBtn.className = 'redock-btn';
        redockBtn.innerHTML = '📌';
        redockBtn.title = 'Ancora toolbar (doppio click per scegliere posizione)';
        redockBtn.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #27ae60;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 10001;
    `;

        redockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDockMenu(group, e.clientX, e.clientY);
        });

        group.appendChild(redockBtn);
    }

    redockGroup(group, position = 'top') {
        let targetContainer;

        if (position === 'bottom') {
            const footer = document.getElementById('footer');
            targetContainer = footer ? footer.querySelector('.bottom-toolbar-group') : null;
        } else {
            targetContainer = document.querySelector('.toolbar');
        }

        // Rimuovi stili floating
        group.classList.remove('floating');
        group.classList.add('docked');
        group.style.position = '';
        group.style.left = '';
        group.style.top = '';
        group.style.zIndex = '';

        // Rimuovi pulsante redock
        const redockBtn = group.querySelector('.redock-btn');
        if (redockBtn) redockBtn.remove();

        // Rimuovi dal body se necessario
        if (group.parentElement === document.body) {
            group.remove();
        }

        // Aggiungi al container target
        if (position === 'bottom' && targetContainer) {
            targetContainer.appendChild(group);
        } else {
            const addButton = targetContainer ? targetContainer.querySelector('.add-tab') : null;
            if (addButton) {
                targetContainer.insertBefore(group, addButton.parentElement);
            } else if (targetContainer) {
                targetContainer.appendChild(group);
            }
        }

        // Rimuovi dal tracking dei floating (se presente)
        if (group.id && this.floatingToolbarGroups && this.floatingToolbarGroups.has(group.id)) {
            this.floatingToolbarGroups.delete(group.id);
        }
    }

    initFloatingGroupsDocking() {
        // sicurezza: se la map non esiste, inizializzala
        if (!this.floatingToolbarGroups) this.floatingToolbarGroups = new Map();

        document.addEventListener('dragover', (e) => {
            // se non c'è toolbar, niente da fare
            const toolbar = document.querySelector('.toolbar');
            if (!toolbar) return;

            // scorri i floating groups (Map) — se è vuota forEach semplicemente non itera
            this.floatingToolbarGroups.forEach((data, id) => {
                const group = data.element;
                if (!group) return;
                // coerente: controlla classe 'dragging' (ora aggiunta/rimossa anche nel pointer flow)
                if (!group.classList.contains('dragging')) return;

                const toolbarRect = toolbar.getBoundingClientRect();

                const isNearToolbar = (
                    Math.abs(e.clientY - toolbarRect.top) < 50 ||
                    Math.abs(e.clientY - toolbarRect.bottom) < 50
                );

                if (isNearToolbar) {
                    toolbar.style.background = '#d1e7fd'; // Evidenzia
                } else {
                    toolbar.style.background = '';
                }
            });
        });

        // pulizia: togli evidenziazione quando mouse leave
        document.addEventListener('dragleave', (e) => {
            const toolbar = document.querySelector('.toolbar');
            if (!toolbar) return;
            toolbar.style.background = '';
        });
    }



    /****************************************************
     * CLEANUP - Pulizia dopo drag
     ****************************************************/
    cleanupDrag() {
        // ✅ RIMUOVI CLASSE GLOBALE per riabilitare transizioni
        document.body.classList.remove('is-dragging');

        // Rimuovi placeholder
        const placeholder = this.toolbar.querySelector('.toolbar-placeholder');
        if (placeholder && placeholder.parentNode) {
            placeholder.remove();
        }

        // Rimuovi classi di feedback
        const dragging = this.toolbar.querySelector('.dragging');
        if (dragging) {
            dragging.classList.remove('dragging');
            dragging.style.opacity = '';
        }

        this.toolbar.classList.remove('drag-over');

        // Salva nuovo ordine dei gruppi
        this.saveGroupOrder();
    }

    /****************************************************
     * SALVATAGGIO ORDINE GRUPPI
     ****************************************************/
    saveGroupOrder() {
        const groups = Array.from(this.toolbar.querySelectorAll('.toolbar-group'));
        const order = groups.map(group => group.id || group.querySelector('legend')?.textContent);

        this.storage.set(`${this.id}_groupOrder`, JSON.stringify(order));
    }

    /****************************************************
     * RIPRISTINO ORDINE GRUPPI
     ****************************************************/
    restoreGroupOrder() {
        const savedOrder = this.storage.get(`${this.id}_groupOrder`);
        if (!savedOrder) return;

        try {
            const order = JSON.parse(savedOrder);
            const groups = Array.from(this.toolbar.querySelectorAll('.toolbar-group'));

            order.forEach((identifier, index) => {
                const group = groups.find(g =>
                    g.id === identifier ||
                    g.querySelector('legend')?.textContent === identifier
                );

                if (group) {
                    this.toolbar.appendChild(group);
                }
            });
        } catch (err) {
            console.error('Error restoring group order:', err);
        }
    }

    /****************************************************
     * Mostra / Nascondi
     ****************************************************/
    show() { this.toolbar.style.display = "flex"; }
    hide() { this.toolbar.style.display = "none"; }
}
