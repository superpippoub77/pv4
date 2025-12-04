class ToolbarDialogManager {
    constructor(editor, storage, align = "up", id = "toolbar", position = "top") {
        this.editor = editor;
        this.storage = storage;
        this.align = align;

        this.toolbar = null;
        this.id = id;
        this.position = position; // "top", "bottom", "left", "right"
        this.key = "toolbarSize_" + id;
        this.keyPrevious = "toolbarPreviousSize_" + id;
        this.keyPosition = "toolbarPosition_" + id;
        this.isMinimized = false;
        this.minSize = 40; // Dimensione minima (altezza o larghezza)
    }

    async init() {
        this.restorePosition();
        await this.createToolbar();
        this.restoreSize();
        this.applyPosition();
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
        if (oldResizer) {
            oldResizer.remove();
        }

        // Crea nuova maniglia
        const resizer = document.createElement("div");
        resizer.className = "toolbar-resizer";
        resizer.title = "Doppio click per minimizzare/ripristinare";
        
        // Inserisci la maniglia nella posizione corretta
        if (this.position === "top" || this.position === "left") {
            this.toolbar.appendChild(resizer); // Alla fine
        } else {
            this.toolbar.insertBefore(resizer, this.toolbar.firstChild); // All'inizio
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
    async createToolbar() {
        return new Promise((resolve, reject) => {
            try {
                // Toolbar
                this.toolbar = document.getElementById(this.id);
                if (!this.toolbar) {
                    this.toolbar = document.createElement("div");
                    this.toolbar.id = this.id;
                    this.toolbar.className = "toolbar";
                    document.body.prepend(this.toolbar);
                }

                // Gruppi
                toolbarConfig.forEach(group => {
                    if (group.align !== this.align) return;

                    const fs = document.createElement("fieldset");
                    fs.className = "toolbar-group";

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
                el.textContent = item.text;
                // Aggiungi data-i18n se presente
                if (item.i18n || item.text) {
                    el.setAttribute("data-i18n", item.i18n || item.text);
                }
                break;

            case "button":
                el = document.createElement("button");
                el.id = item.id;
                el.textContent = item.text;
                el.addEventListener("click", () => item.onClick?.(this.editor));
                // Aggiungi data-i18n se presente
                if (item.i18n || item.text) {
                    el.setAttribute("data-i18n", item.i18n || item.text);
                }
                // Aggiungi title/tooltip se presente
                if (item.title) {
                    el.title = item.title;
                    el.setAttribute("data-i18n-title", item.titleI18n || item.title);
                }
                break;

            case "select":
                el = document.createElement("select");
                el.id = item.id;
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
                el.placeholder = item.placeholder ?? "";
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
                break;

            case "file":
                el = document.createElement("input");
                el.type = "file";
                el.id = item.id;
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
        }

        return el;
    }

    /****************************************************
     * Mostra / Nascondi
     ****************************************************/
    show() { this.toolbar.style.display = "flex"; }
    hide() { this.toolbar.style.display = "none"; }
}