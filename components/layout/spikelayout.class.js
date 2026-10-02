/**
 * SpikeLayout
 * -----------------------------------------------------------------------
 * Costruisce l'interfaccia con la stessa struttura di SpikeCut:
 *
 *   ┌ topbar ─────────────────────────────────────────────────────────┐
 *   │ ☰  🏐VolleyProW4  [titolo] ✓Salvato ☁Libreria ↶↷🕐 –100%+ … File▾ │
 *   ├ barra schede ───────────────────────────────────────────────────┤
 *   │ rail │                foglio                  │ pannello a schede │
 *   ├ status bar ─────────────────────────────────────────────────────┤
 *
 * Tutti i comandi arrivano da data/configuration/layout.js e menu.js.
 * Gli id degli elementi sono quelli già usati da SchemaEditor, quindi la
 * logica esistente (mostra/nascondi pannelli, stati "active", ecc.) continua
 * a funzionare senza modifiche.
 */
class SpikeLayout {
    constructor(editor, config = layoutConfig) {
        this.editor = editor;
        this.config = config;
        // Riutilizza il generatore di controlli della toolbar (select, input, checkbox…)
        this.factory = new ToolbarDialogManager(editor, [], editor.storage, "layoutFactory");
        this.flyoutMode = null;
    }

    // =====================================================================
    // COSTRUZIONE
    // =====================================================================
    build() {
        document.body.classList.add("sc-theme");
        this.buildTopbar();
        this.buildTabBar();
        this.buildRail();
        this.buildFlyout();
        this.buildPanel();
        this.buildStatus();
        this.bindShortcuts();
        this.patchEditor();
        this.observeSelection();

        // La vecchia toolbar resta solo come contenitore di input nascosti
        document.querySelectorAll("#toolbar, #footerbar").forEach(t => t.classList.add("sc-legacy-hidden"));
        const wm = document.querySelector("water-mark");
        if (wm) wm.style.display = "none";
    }

    /** Da chiamare quando il primo tab esiste (sincronizza gli stati dei toggle) */
    afterInit() {
        this.syncTools();
        this.syncStatusToggles();
        this.updateEmptySections();
    }

    // ---------------------------------------------------------------- topbar
    buildTopbar() {
        const left = document.querySelector("#menu .topbar-left");
        if (!left) return;

        this.config.topbar.forEach(group => {
            if (group === "spacer") {
                const sp = document.createElement("div");
                sp.className = "spacer";
                left.appendChild(sp);
                return;
            }
            const grp = document.createElement("div");
            grp.className = "grp";
            group.forEach(item => {
                if (item.type === "user") {
                    grp.classList.add("menuwrap");
                    const user = this.editor.menuManager.buildDropdown({
                        label: `👤 ${this.editor.currentUser || "Utente"}`,
                        cls: "user-menu",
                        items: (typeof userMenuData !== "undefined") ? userMenuData : []
                    });
                    grp.appendChild(user);
                    this.editor.menuManager.initMenuBar(grp);
                    return;
                }
                if (item.type === "brand") {
                    grp.classList.add("brand");
                    grp.innerHTML = item.html;
                    return;
                }
                grp.appendChild(this.make(item, "iconbtn"));
            });
            if (group[0] && group[0].cls === "sidebar-btn") grp.classList.add("sidebar-grp");
            left.appendChild(grp);
        });
    }

    // --------------------------------------------------------- barra schede
    buildTabBar() {
        const tabs = document.querySelector(".tabs-container");
        if (!tabs) return;
        const bar = document.createElement("div");
        bar.id = "tabBar";
        const container = document.getElementById("container");
        container.parentNode.insertBefore(bar, container);
        bar.appendChild(tabs);

        const add = tabs.querySelector(".add-tab");
        if (add) {
            add.textContent = "+";
            add.title = "Nuovo schema";
            add.removeAttribute("data-i18n");
        }
    }

    // ------------------------------------------------------------------ rail
    buildRail() {
        const side = document.getElementById("sidebar");
        if (!side) return;
        const rail = document.createElement("div");
        rail.id = "rail";

        this.config.rail.forEach(entry => {
            if (entry === "spacer") {
                rail.insertAdjacentHTML("beforeend", `<div class="rail-spacer"></div><div class="rail-sep end"></div>`);
                return;
            }
            if (entry.section) {
                rail.insertAdjacentHTML("beforeend",
                    `<div class="rail-title" data-i18n="${entry.i18n || ""}">${entry.section}</div><div class="rail-sep"></div>`);
                return;
            }
            const b = document.createElement("button");
            b.type = "button";
            b.className = "tool" + (entry.cls ? " " + entry.cls : "");
            b.id = entry.id;
            b.title = entry.title + (entry.key ? ` (${entry.key})` : "");
            b.innerHTML = (LAYOUT_ICONS[entry.icon] || "")
                + `<span class="tlabel"${entry.i18n ? ` data-i18n="${entry.i18n}"` : ""}>${entry.label}</span>`
                + (entry.key ? `<span class="kbd${entry.key.length > 1 ? " kbd-long" : ""}">${entry.key}</span>` : "");
            b.addEventListener("click", (ev) => entry.onClick(this.editor, ev));
            rail.appendChild(b);
        });

        side.appendChild(rail);
        this.rail = rail;

        let expanded = true;
        try { const v = localStorage.getItem("vbp-rail-expanded"); if (v !== null) expanded = v === "1"; } catch (e) { }
        this.setRailExpanded(expanded);
    }

    setRailExpanded(expanded) {
        const side = document.getElementById("sidebar");
        this.rail.classList.toggle("expanded", expanded);
        side.classList.toggle("rail-compact", !expanded);
        side.style.width = expanded ? "188px" : "52px";
        document.getElementById("btnSidebar")?.classList.toggle("on", expanded);
        try { localStorage.setItem("vbp-rail-expanded", expanded ? "1" : "0"); } catch (e) { }
        this.editor.sidebarManager?.updateSidebarSwitchPosition?.();
    }

    toggleRailExpanded() {
        const side = document.getElementById("sidebar");
        if (side.classList.contains("hidden")) this.editor.sidebarManager?.toggleSidebar();
        this.setRailExpanded(!this.rail.classList.contains("expanded"));
    }

    // ------------------------------------------------- galleria (flyout)
    buildFlyout() {
        const host = document.querySelector(".main-content");
        if (!host) return;
        const f = document.createElement("div");
        f.id = "elementsFlyout";
        f.className = "shapes-flyout";
        f.innerHTML = `
            <div class="sf-head"><h3 id="flyoutTitle">Giocatori</h3><button class="iconbtn" id="flyoutClose" title="Chiudi (Esc)">✕</button></div>
            <div class="hint sf-hint" data-i18n="sb_hint">Clic per aggiungere al centro del foglio · trascina per posizionare</div>
            <div class="sf-search"><input type="search" id="flyoutSearch" placeholder="🔍 Cerca…" data-i18n-placeholder="sb_search_placeholder"></div>
            <div class="sf-body" id="flyoutBody"></div>`;
        host.appendChild(f);

        const body = f.querySelector("#flyoutBody");
        const sb = this.editor.sidebarManager;
        (typeof sidebarConfig !== "undefined" ? sidebarConfig : []).forEach(cat => {
            const group = cat.category === "volleyball-players" ? "players" : "elements";
            const sec = document.createElement("div");
            sec.className = "sf-group";
            sec.dataset.group = group;
            sec.innerHTML = `<div class="grouphead"><span data-i18n="${cat.i18ntitle || ""}">${cat.title}</span><span class="layer-count">${cat.items.length}</span></div>
                <div class="component-grid">${cat.items.map(i => Sidebar.prototype.renderItem.call(sb, i)).join("")}</div>`;
            body.appendChild(sec);
        });

        // Clic = aggiungi al centro (il drag è gestito da SchemaEditor sugli .component-item)
        body.addEventListener("click", (e) => {
            const item = e.target.closest(".component-item");
            if (!item) return;
            this.setSelectTool(false);
            this.editor.addComponent({
                type: item.dataset.type,
                text: item.dataset.text || "",
                color: item.dataset.color || "",
                icon: item.dataset.icon || "",
                src: item.dataset.src || "",
                model3d: item.dataset.model3d || "",
                sprite: item.dataset.spriteSheet ? {
                    sheet: item.dataset.spriteSheet,
                    cols: +item.dataset.spriteCols, rows: +item.dataset.spriteRows, frame: +item.dataset.spriteFrame,
                    width: +item.dataset.spriteWidth || 64, height: +item.dataset.spriteHeight || 64
                } : null
            });
        });

        f.querySelector("#flyoutClose").addEventListener("click", () => this.toggleFlyout(null, false));
        f.querySelector("#flyoutSearch").addEventListener("input", (e) => this.filterFlyout(e.target.value));
        this.flyout = f;
    }

    toggleFlyout(mode, force) {
        const open = force !== undefined ? force : !(this.flyout.classList.contains("open") && this.flyoutMode === mode);
        this.flyoutMode = open ? mode : null;
        this.flyout.classList.toggle("open", open);
        document.getElementById("railPlayers")?.classList.toggle("open", open && mode === "players");
        document.getElementById("railElements")?.classList.toggle("open", open && mode === "elements");
        if (!open) return;

        const isPlayers = mode === "players";
        const title = this.flyout.querySelector("#flyoutTitle");
        title.textContent = isPlayers ? "Giocatori" : "Campo e oggetti";
        title.setAttribute("data-i18n", isPlayers ? "rail_players_title" : "rail_elements_title");
        try { translateElements(document.getElementById("languageSelector")?.value || "it"); } catch (e) { }
        const search = this.flyout.querySelector("#flyoutSearch");
        search.value = "";
        this.filterFlyout("");
        setTimeout(() => search.focus(), 30);
    }

    filterFlyout(q) {
        q = (q || "").trim().toLowerCase();
        this.flyout.querySelectorAll(".sf-group").forEach(g => {
            const inMode = g.dataset.group === this.flyoutMode;
            let visible = 0;
            g.querySelectorAll(".component-item").forEach(it => {
                const txt = (it.textContent + " " + (it.dataset.text || "") + " " + (it.title || "")).toLowerCase();
                const ok = !q || txt.includes(q);
                it.style.display = ok ? "" : "none";
                if (ok) visible++;
            });
            // Con una ricerca attiva si cerca in tutte le categorie
            g.style.display = (q ? visible > 0 : inMode) ? "" : "none";
        });
    }

    // --------------------------------------------------- pannello destro
    buildPanel() {
        const panel = document.getElementById("rightSidebar");
        if (!panel) return;
        panel.classList.add("sc-panel");

        const tabs = document.createElement("div");
        tabs.className = "tabs";
        const pages = {};

        // categorie create da Sidebar (Step, Dettagli) in ordine di configurazione
        const cats = Array.from(panel.querySelectorAll(":scope > .component-category"));

        this.config.panelTabs.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = t.label;
            if (t.i18n) btn.setAttribute("data-i18n", t.i18n);
            btn.dataset.tab = t.id;
            tabs.appendChild(btn);

            const page = document.createElement("div");
            page.className = "tabpage";
            page.dataset.tab = t.id;
            pages[t.id] = page;

            if (t.category) {
                const idx = rightSidebarConfig.findIndex(c => c.category === t.category);
                const cat = cats[idx];
                if (cat) {
                    cat.querySelector(".category-title")?.remove();
                    page.appendChild(cat);
                }
            }
            btn.addEventListener("click", () => this.showPanelTab(t.id));
        });

        // Scheda Proprietà
        this.config.panelSections.forEach(sec => pages.props.appendChild(this.buildSection(sec)));

        // Inserisci schede e pagine subito dopo la maniglia di ridimensionamento
        const handle = panel.querySelector(".right-sidebar-handle");
        const frag = document.createDocumentFragment();
        frag.appendChild(tabs);
        Object.values(pages).forEach(p => frag.appendChild(p));
        if (handle) handle.after(frag); else panel.prepend(frag);

        this.panelTabs = tabs;
        this.panelPages = pages;
        this.showPanelTab("props");
    }

    showPanelTab(id) {
        this.panelTabs.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
        Object.entries(this.panelPages).forEach(([k, p]) => p.classList.toggle("active", k === id));
    }

    buildSection(sec) {
        const el = document.createElement("div");
        el.className = "panel-section";
        el.id = sec.id;
        if (sec.whenEmpty) el.dataset.whenEmpty = "1";
        if (sec.hidden) el.style.display = "none";
        if (sec.title) el.insertAdjacentHTML("beforeend", `<div class="sec-title" data-i18n="${sec.i18n || ""}">${sec.title}</div>`);
        sec.fields.forEach(f => el.appendChild(this.buildField(f)));
        return el;
    }

    buildField(f) {
        if (f.type === "hint") {
            const h = document.createElement("div");
            h.className = "hint";
            if (f.id) h.id = f.id;
            if (f.i18n) h.setAttribute("data-i18n", f.i18n);
            h.textContent = f.text;
            return h;
        }
        if (f.type === "swatches") {
            const w = document.createElement("div");
            w.className = "fill-swatches";
            w.id = f.id;
            w.innerHTML = this.config.quickColors.map(([c, n]) =>
                `<button type="button" class="swatch" data-color="${c}" title="${n}" style="background:${c}"></button>`).join("");
            w.addEventListener("click", (e) => {
                const sw = e.target.closest(".swatch");
                if (!sw) return;
                document.getElementById("objectColor").value = sw.dataset.color;
                this.editor.changeSelectedObjectsColor(sw.dataset.color, true);
            });
            return w;
        }

        const field = document.createElement("div");
        field.className = "field";
        if (f.label) {
            const l = document.createElement("label");
            l.textContent = f.label;
            if (f.i18n) l.setAttribute("data-i18n", f.i18n);
            field.appendChild(l);
        }
        if (f.item) field.appendChild(this.make(f.item, "btn"));
        if (f.row) field.appendChild(this.makeRow(f.row, "row"));
        if (f.seg) field.appendChild(this.makeRow(f.seg, "seg3"));
        if (f.stack) f.stack.forEach(s => field.appendChild(this.makeRow(s.row, "row")));
        return field;
    }

    makeRow(items, cls) {
        const row = document.createElement("div");
        row.className = cls;
        items.forEach(it => row.appendChild(this.make(it, cls === "seg3" ? "" : "btn")));
        return row;
    }

    /** Crea un controllo: i pulsanti in stile SpikeCut, il resto con la factory della toolbar */
    make(item, btnClass = "iconbtn") {
        if (item.type === "button") {
            const b = document.createElement("button");
            b.type = "button";
            b.id = item.id || "";
            b.className = [btnClass, item.cls, item.class].filter(Boolean).join(" ");
            if (item.html) b.innerHTML = item.html; else b.textContent = item.text || "";
            if (item.title) b.title = item.title;
            if (item.onClick) b.addEventListener("click", (ev) => item.onClick(this.editor, ev));
            return b;
        }
        if (item.type === "label") {
            const s = document.createElement("span");
            s.id = item.id || "";
            s.className = item.cls || "";
            s.textContent = item.text || "";
            return s;
        }
        const el = this.factory.createItem(item);
        if (item.title && el.title === "") el.title = item.title;
        return el;
    }

    // ---------------------------------------------------------- status bar
    buildStatus() {
        const st = document.createElement("div");
        st.id = "status";
        st.innerHTML = `<span id="statusCoords">x: 0 · y: 0</span>`;
        this.config.status.forEach(t => {
            const b = document.createElement("span");
            b.className = "toggle" + (t.cls ? " " + t.cls : "");
            b.id = t.id;
            b.title = t.title || "";
            b.textContent = t.text;
            if (t.i18n) b.setAttribute("data-i18n", t.i18n);
            b.addEventListener("click", (ev) => t.onClick(this.editor, ev));
            st.appendChild(b);
        });
        st.insertAdjacentHTML("beforeend", `
            <span class="spacer"></span>
            <span class="status-sign">VBProW4 by <a href="https://www.filippomorano.com" target="_blank" rel="noopener">SpikeCode AI</a> · Ver: ${typeof APP_VERSION !== "undefined" ? APP_VERSION : ""}</span>`);
        const container = document.getElementById("container");
        container.after(st);

        // Coordinate del mouse sul foglio
        const canvas = document.getElementById("canvas");
        const coords = st.querySelector("#statusCoords");
        canvas?.addEventListener("mousemove", (e) => {
            try {
                const p = this.editor.getCanvasLocalPoint(e);
                coords.textContent = `x: ${Math.round(p.x)} · y: ${Math.round(p.y)}`;
            } catch (err) { /* ignore */ }
        });
    }

    syncStatusToggles() {
        const tab = this.editor.getCurrentTab();
        if (!tab) return;
        document.getElementById("gridToggle")?.classList.toggle("active", !!tab.gridVisible);
        document.getElementById("bwToggle")?.classList.toggle("active", !!tab.bwMode);
    }

    // ---------------------------------------------------- strumenti attivi
    setSelectTool(closeFlyout = true) {
        if (this.editor.arrowMode) this.editor.toggleArrowMode(false);
        if (this.editor.freehandMode) this.editor.toggleFreehandMode(false);
        if (closeFlyout && this.flyout) this.toggleFlyout(null, false);
        this.syncTools();
    }

    syncTools() {
        const ed = this.editor;
        document.getElementById("railSelect")?.classList.toggle("active", !ed.arrowMode && !ed.freehandMode);
        document.getElementById("arrowModeBtn")?.classList.toggle("active", !!ed.arrowMode);
        document.getElementById("freehandModeBtn")?.classList.toggle("active", !!ed.freehandMode);
        document.getElementById("dashedToggle")?.classList.toggle("active", !!ed.dashedMode);
    }

    resetZoom() {
        const tab = this.editor.getCurrentTab();
        if (!tab) return;
        this.editor.changeZoom(1 - (tab.zoom || 1));
    }

    /** Aggiunge al volo comportamenti di interfaccia a metodi esistenti dell'editor */
    patchEditor() {
        const ed = this.editor;
        ["toggleArrowMode", "toggleFreehandMode", "toggleDashedMode"].forEach(name => {
            const orig = ed[name].bind(ed);
            ed[name] = (...args) => { const r = orig(...args); this.syncTools(); return r; };
        });

        // Indicatore "✓ Salvato / ● Modificato" come in SpikeCut
        const status = () => document.getElementById("btnSaveStatus");
        const markDirty = () => { const b = status(); if (b) { b.textContent = "● Modificato"; b.classList.add("dirty"); } };
        const markSaved = () => { const b = status(); if (b) { b.textContent = "✓ Salvato"; b.classList.remove("dirty"); } };
        const origSave = ed.saveState.bind(ed);
        ed.saveState = (...a) => { const r = origSave(...a); if (!ed._restoringState) markDirty(); return r; };
        ["saveSchema", "performAutoSave"].forEach(name => {
            const orig = ed[name].bind(ed);
            ed[name] = (...a) => { const r = orig(...a); markSaved(); return r; };
        });
    }

    // ----------------------------- sezioni "Foglio" quando non c'è selezione
    observeSelection() {
        const ids = ["objectControls", "arrowControls", "spriteControls", "freehandControls"];
        const obs = new MutationObserver(() => this.updateEmptySections());
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) obs.observe(el, { attributes: true, attributeFilter: ["style"] });
        });
    }

    updateEmptySections() {
        const ids = ["objectControls", "arrowControls", "spriteControls", "freehandControls"];
        const anyShown = ids.some(id => {
            const el = document.getElementById(id);
            return el && el.style.display !== "none";
        });
        document.querySelectorAll("[data-when-empty]").forEach(s => s.style.display = anyShown ? "none" : "");
        // Quando selezioni qualcosa porta in primo piano la scheda Proprietà
        if (anyShown && this.panelPages && !this.panelPages.props.classList.contains("active")) this.showPanelTab("props");
    }

    // ------------------------------------------------- scorciatoie (come SpikeCut)
    bindShortcuts() {
        document.addEventListener("keydown", (e) => {
            const t = e.target || {};
            const tag = (t.tagName || "").toUpperCase();
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (!this.editor.getCurrentTab()) return;
            // una finestra della libreria, dell'account o della guida è aperta: i tasti non comandano il disegno
            if (document.querySelector(".modal-overlay.scx.open")) return;
            const ed = this.editor;
            const k = e.key.toLowerCase();
            const map = {
                v: () => this.setSelectTool(),
                a: () => ed.toggleArrowMode(),
                b: () => ed.toggleFreehandMode(),
                d: () => ed.toggleDashedMode(),
                t: () => ed.addComponent({ type: "text", text: "Testo" }),
                g: () => this.toggleFlyout("players"),
                e: () => this.toggleFlyout("elements"),
                r: () => ed.rotateSmart(e.shiftKey ? -15 : 15),
                h: () => ed.mirrorSelected("h"),
                "+": () => ed.changeZoom(0.1),
                "-": () => ed.changeZoom(-0.1),
                "0": () => this.resetZoom()
            };
            if (e.key === "Escape" && this.flyout?.classList.contains("open")) {
                this.toggleFlyout(null, false);
                return;
            }
            if (map[k]) {
                e.preventDefault();
                map[k]();
            }
        });
    }
}
