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

	/****************************************************
     * INIT - Modificato per includere drag & drop
     ****************************************************/
    async init(beforeDivId = "menu") {
        this.restorePosition();
        await this.createToolbar(beforeDivId);
        this.restoreSize();
        this.applyPosition();
        
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
        if (oldResizer) {
            oldResizer.remove();
        }

        // Crea nuova maniglia
        const resizer = document.createElement("div");
        resizer.className = "toolbar-resizer";
        resizer.title = "Doppio click per minimizzare/ripristinare";

        // Inserisci la maniglia nella posizione corretta
        if (this.position === "top" || this.position === "left") {
            this.toolbar.parentNode.insertBefore(resizer, this.toolbar.nextSibling);
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
    async createToolbar(beforeDivId = "menu") {
        return new Promise((resolve, reject) => {
            try {
                // Toolbar
                this.toolbar = document.getElementById(this.id);
                if (!this.toolbar) {
                    this.toolbar = document.createElement("div");
                    this.toolbar.id = this.id;
                    this.toolbar.className = "toolbar";
                    document.body.append(this.toolbar);

                    const beforeDiv = document.getElementById(beforeDivId);
                    beforeDiv.after(this.toolbar);
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
	
	/* Vecchio metodo */
initToolbarDragDrop() {
        const toolbar = document.getElementById('toolbar');
        const footer = document.getElementById('footer');
        const bottomToolbarGroup = footer.querySelector('.bottom-toolbar-group');
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

                // ✅ RIMUOVI QUESTE RIGHE CHE CAUSANO IL PROBLEMA:
                // const img = new Image();
                // img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                // e.dataTransfer.setDragImage(img, 0, 0);

                // ✅ AGGIUNGI INVECE:
                // Nascondi l'elemento originale durante il drag
                setTimeout(() => {
                    group.style.opacity = '0.3';
                }, 0);
            });

            group.addEventListener('drag', (e) => {
                if (!isDraggingToolbar || !draggedGroup) return;
				//document.body.classList.add('is-dragging');

                // ✅ MODIFICA: Aggiorna solo il clone, non l'elemento originale
                if (dragClone && e.clientX !== 0 && e.clientY !== 0) {
                    dragClone.style.left = (e.clientX - offsetX) + 'px';
                    dragClone.style.top = (e.clientY - offsetY) + 'px';
                }
            });

            group.addEventListener('dragend', (e) => {
                if (!draggedGroup) return;
				//document.body.classList.remove('is-dragging');
				
                draggedGroup.classList.remove('dragging');
                draggedGroup.style.opacity = '1'; // ✅ AGGIUNGI: Ripristina opacità
                toolbar.classList.remove('drag-over');
                bottomToolbarGroup.classList.remove('drag-over');

                // ✅ NUOVO: Rimuovi il clone
                if (dragClone) {
                    dragClone.remove();
                    dragClone = null;
                }

                const toolbarRect = toolbar.getBoundingClientRect();
                const bottomRect = bottomToolbarGroup.getBoundingClientRect();

                const isOverToolbar = (
                    e.clientX >= toolbarRect.left &&
                    e.clientX <= toolbarRect.right &&
                    e.clientY >= toolbarRect.top &&
                    e.clientY <= toolbarRect.bottom
                );

                const isOverBottom = (
                    e.clientX >= bottomRect.left &&
                    e.clientX <= bottomRect.right &&
                    e.clientY >= bottomRect.top &&
                    e.clientY <= bottomRect.bottom
                );

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

        // Dragover per bottom toolbar
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


        toolbar.addEventListener('dragleave', (e) => {
            if (e.target === toolbar) {
                toolbar.classList.remove('drag-over');
            }
        });

        bottomToolbarGroup.addEventListener('dragleave', (e) => {
            if (e.target === bottomToolbarGroup) {
                bottomToolbarGroup.classList.remove('drag-over');
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
		const groups = this.toolbar.querySelectorAll('.toolbar-group:not(.fixed)');
		const isHorizontal = () => this.position === 'top' || this.position === 'bottom';

		groups.forEach(group => {
			let dragClone = null;
			let isDragging = false;
			let offsetX = 0, offsetY = 0;
			let initialParent = null;

			group.addEventListener('pointerdown', (e) => {
				if (group.classList.contains('fixed')) return;
				e.preventDefault();

				isDragging = true;
				initialParent = group.parentElement;

				const rect = group.getBoundingClientRect();
				offsetX = e.clientX - rect.left;
				offsetY = e.clientY - rect.top;

				// Clone visivo
				dragClone = group.cloneNode(true);
				dragClone.style.position = 'fixed';
				dragClone.style.left = `${rect.left}px`;
				dragClone.style.top = `${rect.top}px`;
				dragClone.style.width = `${rect.width}px`;
				dragClone.style.height = `${rect.height}px`;
				dragClone.style.opacity = '0.8';
				dragClone.style.pointerEvents = 'none';
				dragClone.style.zIndex = '10000';
				document.body.appendChild(dragClone);

				group.style.opacity = '0.3';

				const onPointerMove = (ev) => {
					if (!isDragging) return;
					dragClone.style.left = `${ev.clientX - offsetX}px`;
					dragClone.style.top = `${ev.clientY - offsetY}px`;
				};

				const onPointerUp = (ev) => {
					if (!isDragging) return;

					dragClone.remove();
					dragClone = null;
					group.style.opacity = '';

					const toolbarRect = this.toolbar.getBoundingClientRect();
					const isOverToolbar = (
						ev.clientX >= toolbarRect.left &&
						ev.clientX <= toolbarRect.right &&
						ev.clientY >= toolbarRect.top &&
						ev.clientY <= toolbarRect.bottom
					);

					// Se rilasciato dentro la toolbar → riposiziona
					if (isOverToolbar) {
						const groupsInToolbar = [...this.toolbar.querySelectorAll('.toolbar-group:not(.dragging)')];
						let inserted = false;
						for (let g of groupsInToolbar) {
							const gRect = g.getBoundingClientRect();
							if (isHorizontal() ? ev.clientX < gRect.left + gRect.width/2 : ev.clientY < gRect.top + gRect.height/2) {
								this.toolbar.insertBefore(group, g);
								inserted = true;
								break;
							}
						}
						if (!inserted) this.toolbar.appendChild(group);

						group.classList.remove('floating');
						group.classList.add('docked');

						// Rimuovi redock button se presente
						const btn = group.querySelector('.redock-btn');
						if (btn) btn.remove();

					} else {
						// Fuori dalla toolbar → diventa floating
						group.classList.remove('docked');
						group.classList.add('floating');
						group.style.position = 'fixed';
						group.style.left = `${ev.clientX - offsetX}px`;
						group.style.top = `${ev.clientY - offsetY}px`;
						group.style.zIndex = '9999';

						document.body.appendChild(group);
						this.addRedockButton(group);
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
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '10001';

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
            targetContainer = footer.querySelector('.bottom-toolbar-group');
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
        if (position === 'bottom') {
            targetContainer.appendChild(group);
        } else {
            const addButton = targetContainer.querySelector('.add-tab');
            if (addButton) {
                targetContainer.insertBefore(group, addButton.parentElement);
            } else {
                targetContainer.appendChild(group);
            }
        }

        // Rimuovi dal tracking dei floating
        if (group.id && this.floatingToolbarGroups.has(group.id)) {
            this.floatingToolbarGroups.delete(group.id);
        }
    }
	
	initFloatingGroupsDocking() {
        document.addEventListener('dragover', (e) => {
            this.floatingToolbarGroups.forEach((data, id) => {
                const group = data.element;
                if (!group.classList.contains('dragging')) return;

                const toolbar = document.querySelector('.toolbar');
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