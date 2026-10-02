// =======================================================================
// LAYOUT STILE SPIKECUT
// -----------------------------------------------------------------------
// Struttura (identica a SpikeCut):
//   [topbar 46px]  ☰ · titolo · ✓ Salvato · Libreria · ↶ ↷ 🕐 · zoom · … · File ▾ Stampa ▾ Strumenti ▾ ⋯
//   [barra schede] Schema 1 · +
//   [rail sinistra] strumenti a sezioni (icona + nome + tasto)   [foglio]   [pannello destro a schede]
//   [status 26px]  x/y · toggle vista · selezione · firma e versione
// Ogni comando compare in UN solo posto.
// =======================================================================

// Versione e mese di rilascio (come in SpikeCut): da aggiornare a ogni rilascio,
// insieme a CHANGELOG.md, package.json e alla sezione "Novità" della guida.
const APP_VERSION = "1.4.0";
const APP_RELEASE = "Ott 2026";

// Icone in stile SpikeCut (viewBox 22, tratto 1.6)
const SC_ICON = (d, extra = "") =>
    `<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${extra}<path d="${d}"/></svg>`;

const LAYOUT_ICONS = {
    menu: `<svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h14M4 11h14M4 16h14"/></svg>`,
    select: SC_ICON("M4 3l6 15 2-6 6-2z"),
    arrow: SC_ICON("M4 18L17 5 M10 5h7v7"),
    freehand: SC_ICON("M4 17c3-8 5-3 8-9 2 4 4-1 6 2"),
    dashed: SC_ICON("M3 11h3 M9.5 11h3 M16 11h3"),
    text: SC_ICON("M5 4h12M11 4v14"),
    players: SC_ICON("M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2.5 19c.6-3.5 2.8-5.5 5.5-5.5s4.9 2 5.5 5.5 M15 9.5a2.5 2.5 0 1 0 0-5 M16.5 13.5c1.9.5 3.1 2.4 3.5 5.5"),
    court: SC_ICON("M3 5h16v12H3z M11 5v12 M3 9h4 M15 9h4 M3 13h4 M15 13h4"),
    rotate: SC_ICON("M5.5 8.5A6.5 6.5 0 1 1 5 14 M5 4v4.5h4.5"),
    rotate90: SC_ICON("M4 11a7 7 0 0 1 12-5 M16 2v4h-4 M8 11h10v8H8z"),
    mirrorH: SC_ICON("M11 3v16 M8 6L3 11l5 5z M14 6l5 5-5 5z"),
    mirrorV: SC_ICON("M3 11h16 M6 8l5-5 5 5z M6 14l5 5 5-5z"),
    front: SC_ICON("M7 7h11v11H7z M4 15V4h11"),
    back: SC_ICON("M4 4h11v11H4z M7 18h11V7"),
    snap: SC_ICON("M5 4v7a6 6 0 0 0 12 0V4 M5 8h4 M13 8h4 M9 4v7a2 2 0 0 0 4 0V4"),
    renumber: SC_ICON("M8 3L6 19 M15 3l-2 16 M3.5 8h15 M3 14h15"),
    animation: SC_ICON("M3 5h16v12H3z M7 5v12 M15 5v12 M3 9h4 M3 13h4 M15 9h4 M15 13h4"),
    macro: SC_ICON("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", `<circle cx="11" cy="11" r="3" fill="currentColor" stroke="none"/>`),
    team: SC_ICON("M4 19v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1 M11 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"),
    video: SC_ICON("M3 6h12v10H3z M15 9l4-2.5v9L15 13", `<path d="M7.5 9v4l3.5-2z" fill="currentColor" stroke="none"/>`),
    plan: SC_ICON("M6 4h10v15H6z M9 3h4v2H9z M8.5 9h5 M8.5 12h5 M8.5 15h3"),
    pdf: SC_ICON("M6 3h7l4 4v12H6z M13 3v4h4 M8.5 12h6 M8.5 15h6"),
    calendar: SC_ICON("M4 6h14v13H4z M4 10h14 M8 3v5 M14 3v5 M7.5 13.5h2 M12.5 13.5h2 M7.5 16.5h2"),
    magic: SC_ICON("M4 18L14 8 M12 6l4 4 M16 3v3 M14.5 4.5h3 M19 8v2 M18 9h2 M8 3v2 M7 4h2"),
    trash: SC_ICON("M4 6h14 M9 6V4h4v2 M6 6l1 13h8l1-13 M9.5 9.5v6 M12.5 9.5v6")
};

const layoutConfig = {
    // ------------------------------------------------------------------
    // TOPBAR: gruppi a sinistra dei menu a tendina (che arrivano da menu.js)
    // ------------------------------------------------------------------
    topbar: [
        [{ type: "button", id: "btnSidebar", cls: "sidebar-btn", html: LAYOUT_ICONS.menu, title: "Comprimi o espandi la barra degli strumenti", onClick: (ed) => ed.layout.toggleRailExpanded() }],
        [{ type: "brand", html: `<span class="brand-mark">🏐</span><span class="brand-name">VolleyPro<b>W4</b></span>` }],
        [{ type: "input", id: "schemaTitle", placeholder: "Titolo schema", i18nPlaceholder: "placeholder_schema_title", title: "Nome dello schema" }],
        [{ type: "button", id: "btnSaveStatus", text: "✓ Salvato", title: "Salva lo schema (il lavoro viene salvato anche in automatico)", onClick: (ed) => ed.saveSchema() }],
        [
            { type: "button", id: "loadFromLibrary", text: "☁ Libreria", title: "Libreria esercizi online: i tuoi esercizi e quelli condivisi da altri utenti", onClick: () => window.Pv4Library.open() },
            { type: "button", id: "btnSaveLibraryTop", text: "☁ Salva", title: "Salva subito in libreria: sovrascrive l'esercizio se è già collegato, altrimenti chiede nome e cartella", onClick: () => window.Pv4Library.quickSave() }
        ],
        [
            { type: "button", id: "undoBtn", text: "↶", title: "Annulla (Ctrl+Z)", onClick: (ed) => ed.undo() },
            { type: "button", id: "redoBtn", text: "↷", title: "Ripeti (Ctrl+Y)", onClick: (ed) => ed.redo() },
            { type: "button", id: "historyBtn", text: "🕐", title: "Storico modifiche", onClick: (ed) => ed.historyManager.show() }
        ],
        [
            { type: "button", id: "zoomOut", text: "–", title: "Riduci (-)", onClick: (ed) => ed.changeZoom(-0.1) },
            { type: "label", id: "zoomDisplay", cls: "pagelabel", text: "100%" },
            { type: "button", id: "zoomIn", text: "+", title: "Ingrandisci (+)", onClick: (ed) => ed.changeZoom(0.1) },
            { type: "button", id: "zoomReset", text: "⤢", title: "Zoom 100% (0)", onClick: (ed) => ed.layout.resetZoom() }
        ],
        "spacer",
        [
            { type: "button", id: "btnNewTab", text: "＋", title: "Nuovo schema", onClick: (ed) => ed.addNewTab() },
            { type: "button", id: "btnLoadTop", text: "⇪", title: "Carica uno schema (.json)", onClick: () => document.getElementById("fileInput").click() },
            { type: "button", id: "btnHelpTop", text: "?", title: "Guida (F1)", onClick: (ed) => ed.menuManager.showHelpDialog?.() }
        ],
        [{ type: "user" }]
    ],

    // ------------------------------------------------------------------
    // RAIL SINISTRA (come SpikeCut: sezioni, icona + nome + tasto)
    // ------------------------------------------------------------------
    rail: [
        { section: "Seleziona", i18n: "rail_sec_select" },
        { id: "railSelect", icon: "select", label: "Selezione", i18n: "rail_select", key: "V", title: "Selezione e spostamento degli oggetti", onClick: (ed) => ed.layout.setSelectTool() },

        { section: "Disegna", i18n: "rail_sec_draw" },
        { id: "arrowModeBtn", icon: "arrow", label: "Frecce", i18n: "rail_arrows", key: "A", title: "Collega gli oggetti con frecce (clic sui punti di aggancio)", onClick: (ed) => ed.toggleArrowMode() },
        { id: "freehandModeBtn", icon: "freehand", label: "Matita libera", i18n: "rail_freehand", key: "B", title: "Disegno a mano libera", onClick: (ed) => ed.toggleFreehandMode() },
        { id: "dashedToggle", icon: "dashed", label: "Tratteggio", i18n: "rail_dashed", key: "D", title: "Nuovi oggetti e frecce tratteggiati", onClick: (ed) => ed.toggleDashedMode() },
        { id: "railText", icon: "text", label: "Testo", i18n: "rail_text", key: "T", title: "Aggiungi un testo al centro del foglio", onClick: (ed) => ed.addComponent({ type: "text", text: "Testo" }) },

        { section: "Inserisci", i18n: "rail_sec_insert" },
        { id: "railPlayers", icon: "players", label: "Giocatori…", i18n: "rail_players", key: "G", title: "Galleria giocatori: clic per aggiungere, trascina per posizionare", onClick: (ed) => ed.layout.toggleFlyout("players") },
        { id: "railVideo", icon: "video", label: "Video…", i18n: "rail_video", title: "Inserisci un video (YouTube, Vimeo, file dal computer o un link) con anteprima; doppio clic per guardarlo", onClick: () => window.VideoObjects?.add() },
        { id: "railElements", icon: "court", label: "Campo e oggetti…", i18n: "rail_elements", key: "E", title: "Campo, materiale, figure, testo e icone", onClick: (ed) => ed.layout.toggleFlyout("elements") },

        { section: "Modifica", i18n: "rail_sec_edit" },
        { id: "rotateRight", icon: "rotate", label: "Ruota 15°", i18n: "rail_rotate", key: "R", title: "Ruota di 15° (Maiusc+R: -15°). Con più oggetti ruota il gruppo", onClick: (ed, ev) => ed.rotateSmart(ev && ev.shiftKey ? -15 : 15) },
        { id: "rotateRight90", icon: "rotate90", label: "Ruota 90°", i18n: "rail_rotate90", title: "Ruota di 90° (Maiusc+clic: -90°)", onClick: (ed, ev) => ed.rotateSmart(ev && ev.shiftKey ? -90 : 90) },
        { id: "mirrorHorizontal", icon: "mirrorH", label: "Specchia ⇋", i18n: "rail_mirror_h", key: "H", title: "Specchia orizzontalmente", onClick: (ed) => ed.mirrorSelected("h") },
        { id: "mirrorVertical", icon: "mirrorV", label: "Specchia ⥮", i18n: "rail_mirror_v", title: "Specchia verticalmente", onClick: (ed) => ed.mirrorSelected("v") },
        { id: "bringToFront", icon: "front", label: "Primo piano", i18n: "rail_front", key: "Ctrl+]", title: "Porta in primo piano", onClick: (ed) => ed.bringToFront() },
        { id: "sendToBack", icon: "back", label: "Sfondo", i18n: "rail_back", key: "Ctrl+[", title: "Porta sullo sfondo", onClick: (ed) => ed.sendToBack() },
        { id: "snapToGridBtn", icon: "snap", label: "Allinea a griglia", i18n: "rail_snap", title: "Allinea gli oggetti alla griglia", onClick: (ed) => ed.snapObjectsToGrid() },

        { section: "Allenamento", i18n: "rail_sec_training" },
        { id: "workoutPlanBtn", icon: "plan", label: "Piano allenamento", i18n: "rail_workout_plan", title: "Scheda completa della seduta: intestazione, obiettivo, fasi con esercizi e disegni, gruppi; importa da PDF ed esporta in PDF", onClick: (ed) => ed.workoutPlan.show() },
        { id: "workoutGenBtn", icon: "calendar", label: "Genera allenamento", i18n: "rail_workout_generator", title: "Descrivi parte analitica, sintetica e globale: l'allenamento viene composto con gli esercizi della libreria o creati in automatico", onClick: (ed) => ed.workoutGenerator.show() },
        { id: "workoutPdfBtn", icon: "pdf", label: "Scheda PDF", i18n: "rail_workout_pdf", title: "Scheda PDF dell'allenamento: tutte le schede aperte, con disegno, step e dati (anche da Stampa → Scheda allenamento)", onClick: (ed) => ed.exportWorkoutToPDF() },
        { id: "textExerciseBtn", icon: "magic", label: "Crea da testo", i18n: "rail_text_exercise", title: "Descrivi l'esercizio a parole: campo, giocatori, frecce e step vengono creati in automatico", onClick: (ed) => ed.textExerciseManager.show() },
        { id: "showAnimationControls", icon: "animation", label: "Animazione", i18n: "rail_animation", title: "Pannello animazione", onClick: (ed) => ed.showAnimationControls() },
        { id: "recordMacroBtn", icon: "macro", label: "Macro", i18n: "rail_macro", title: "Registra e riproduci macro", onClick: (ed) => ed.macroManager.showDialog() },
        { id: "manageTeamBtn", icon: "team", label: "Squadra", i18n: "rail_team", title: "Gestisci la rosa della squadra", onClick: (ed) => ed.teamManager.show() },

        "spacer",
        { id: "deleteBtn", icon: "trash", cls: "danger", label: "Elimina", i18n: "rail_delete", key: "Canc", title: "Elimina la selezione", onClick: (ed) => ed.deleteSelected() }
    ],

    // ------------------------------------------------------------------
    // PANNELLO DESTRO (schede come SpikeCut: Proprietà · Step · Esercizio)
    // I fieldset mantengono gli id usati da SchemaEditor per mostrarli/nasconderli.
    // ------------------------------------------------------------------
    panelTabs: [
        { id: "props", label: "Proprietà", i18n: "panel_tab_props" },
        { id: "steps", label: "Step", i18n: "panel_tab_steps", category: "exercise-steps" },
        { id: "details", label: "Esercizio", i18n: "panel_tab_details", category: "workout-details" }
    ],

    panelSections: [
        // ---- sempre visibile: cosa è selezionato
        { id: "selectionInfo", always: true, fields: [{ type: "hint", id: "objectInfoText", text: "Nessun oggetto selezionato", i18n: "local_no_object_selected" }] },

        // ---- foglio (visibile quando non c'è selezione)
        {
            id: "sheetControls", title: "Foglio", i18n: "panel_sheet", whenEmpty: true, fields: [
                {
                    label: "Formato", i18n: "toolbar_size", item: {
                        type: "select", id: "canvasSizeSelect", options: [
                            ["custom", "size_custom"], ["a5-portrait", "size_a5_portrait"], ["a5-landscape", "size_a5_landscape"],
                            ["a4-portrait", "size_a4_portrait"], ["a4-landscape", "size_a4_landscape"], ["a3-portrait", "size_a3_portrait"],
                            ["a3-landscape", "size_a3_landscape"], ["a2-portrait", "size_a2_portrait"], ["a2-landscape", "size_a2_landscape"],
                            ["business-card", "size_business_card"]
                        ], onChange: (ed, value) => ed.setCanvasSize(value)
                    }
                },
                { label: "Sfondo", i18n: "panel_background", item: { type: "select", id: "backgroundSelect", options: [["none", "bg_none"], ["half-field", "bg_half_field"], ["full-field", "bg_full_field"], ["3d-field", "bg_3d_field"]] } },
                { type: "hint", text: "Clic su un giocatore o un oggetto per modificarne colore, testo e rotazione.", i18n: "panel_sheet_hint" }
            ]
        },
        {
            id: "planeControls", title: "Vista 3D", i18n: "panel_3d", whenEmpty: true, fields: [
                {
                    label: "Rotazione piano", i18n: "panel_plane_rotation", row: [
                        { type: "button", id: "rotatePlaneXMinus", text: "X−", onClick: (ed) => ed.rotateCanvasPlane('X', -15) },
                        { type: "button", id: "rotatePlaneXPlus", text: "X+", onClick: (ed) => ed.rotateCanvasPlane('X', 15) },
                        { type: "button", id: "rotatePlaneYMinus", text: "Y−", onClick: (ed) => ed.rotateCanvasPlane('Y', -15) },
                        { type: "button", id: "rotatePlaneYPlus", text: "Y+", onClick: (ed) => ed.rotateCanvasPlane('Y', 15) },
                        { type: "button", id: "rotatePlaneZMinus", text: "Z−", onClick: (ed) => ed.rotateCanvasPlane('Z', -15) },
                        { type: "button", id: "rotatePlaneZPlus", text: "Z+", onClick: (ed) => ed.rotateCanvasPlane('Z', 15) },
                        { type: "button", id: "rotatePlaneReset", text: "⟲", title: "Azzera", onClick: (ed) => ed.resetCanvasPlaneRotation() }
                    ]
                },
                { item: { type: "input", inputType: "checkbox", id: "inheritPlaneRotation", text: "Oggetti allineati al piano", i18n: "btn_inherit_plane", onChange: (ed, ev) => { ed.inheritPlaneRotationEnabled = ev.target.checked; try { ed.updateAllObjectTransforms(); } catch (e) { } } } },
                { item: { type: "input", inputType: "checkbox", id: "enableObjectDepth", text: "Profondità oggetti", i18n: "btn_3d_depth", onChange: (ed, ev) => { ed.objectDepthEnabled = ev.target.checked; try { ed.saveUserPref('objectDepthEnabled', ev.target.checked); } catch (e) { } try { ed.updateAllObjectTransforms(); } catch (e) { } } } },
                { item: { type: "input", inputType: "checkbox", id: "autoObjectDepth", text: "Profondità automatica", i18n: "btn_auto_depth", onChange: (ed, ev) => { ed.objectDepthAuto = ev.target.checked; try { ed.saveUserPref('objectDepthAuto', ev.target.checked); } catch (e) { } try { ed.updateAllObjectTransforms(); } catch (e) { } } } },
                {
                    label: "Profondità (px)", i18n: "panel_depth", row: [
                        { type: "select", id: "objectDepthPreset", options: [["0", "depth_none"], ["8", "depth_small"], ["20", "depth_medium"], ["40", "depth_large"], ["custom", "size_custom"]], onChange: (ed, value) => { if (value !== 'custom') { ed.objectDepthPx = parseInt(value); const el = document.getElementById('objectDepthCustom'); if (el) el.value = ed.objectDepthPx; try { ed.saveUserPref('objectDepthPx', ed.objectDepthPx); } catch (e) { } try { ed.updateAllObjectTransforms(); } catch (e) { } } } },
                        { type: "input", inputType: "number", id: "objectDepthCustom", min: "0", max: "200", value: "20", onInput: (ed, ev) => { ed.objectDepthPx = parseInt(ev.target.value) || 0; try { ed.saveUserPref('objectDepthPx', ed.objectDepthPx); } catch (e) { } try { ed.updateAllObjectTransforms(); } catch (e) { } } }
                    ]
                }
            ]
        },

        // ---- oggetto selezionato
        {
            id: "objectControls", title: "Oggetto", i18n: "toolbar_object_controls", hidden: true, fields: [
                {
                    label: "Colore", i18n: "panel_color", row: [
                        { type: "input", inputType: "color", id: "objectColor", value: "#3498db", onInput: (ed, ev) => ed.changeSelectedObjectsColor(ev.target.value, false), onChange: (ed, ev) => ed.changeSelectedObjectsColor(ev.target.value, true) }
                    ]
                },
                { type: "swatches", id: "quickColors" },
                {
                    label: "Opacità", i18n: "panel_opacity", row: [
                        { type: "input", inputType: "range", id: "objectOpacity", min: "0", max: "1", value: "1", step: "0.05", onInput: (ed, ev) => { document.getElementById('objectOpacityValue').textContent = parseFloat(ev.target.value).toFixed(2); ed.changeSelectedObjectsOpacity(ev.target.value); } },
                        { type: "div", id: "objectOpacityValue", class: "range-value", html: "1.00" }
                    ]
                },
                { label: "Testo", i18n: "panel_text", item: { type: "input", inputType: "text", id: "objectText", placeholder: "Testo...", i18nPlaceholder: "placeholder_edit_text", onInput: (ed, ev) => ed.changeSelectedObjectsText(ev.target.value) } },
                {
                    label: "Numero etichetta", i18n: "panel_number", row: [
                        { type: "input", inputType: "number", id: "objectNumber", min: "1", onInput: (ed, ev) => ed.changeSelectedObjectsNumber(parseInt(ev.target.value)) },
                        { type: "button", id: "dashedObjectToggle", text: "⚡ Tratteggiato", title: "Bordo tratteggiato", onClick: (ed) => ed.toggleSelectedObjectsDashed() }
                    ]
                },
                {
                    label: "Rotazione 3D (X · Y · Z)", i18n: "panel_rotation_3d", stack: [
                        { row: [{ type: "input", inputType: "range", id: "objectRotationX", min: "-180", max: "180", value: "0", step: "15" }, { type: "div", id: "rotationXValue", class: "range-value", html: "0°" }] },
                        { row: [{ type: "input", inputType: "range", id: "objectRotationY", min: "-180", max: "180", value: "0", step: "15" }, { type: "div", id: "rotationYValue", class: "range-value", html: "0°" }] },
                        { row: [{ type: "input", inputType: "range", id: "objectRotationZ", min: "-180", max: "180", value: "0", step: "15" }, { type: "div", id: "rotationZValue", class: "range-value", html: "0°" }] }
                    ]
                },
                { item: { type: "button", id: "resetRotation", text: "⟲ Azzera rotazione", title: "Azzera la rotazione dell'oggetto", onClick: (ed) => ed.resetSelectedRotation() } }
            ]
        },

        // ---- freccia selezionata
        {
            id: "arrowControls", title: "Freccia", i18n: "toolbar_arrow_controls", hidden: true, fields: [
                { label: "Colore", i18n: "panel_color", item: { type: "input", inputType: "color", id: "arrowColor", value: "#000000", onChange: (ed, ev) => ed.changeArrowColor(ev.target.value) } },
                {
                    label: "Tipo", i18n: "panel_arrow_type", seg: [
                        { type: "button", id: "arrowTypeLinear", class: "arrow-type-btn", text: "Lineare", onClick: (ed) => ed.changeArrowType('linear') },
                        { type: "button", id: "arrowTypeCurved", class: "arrow-type-btn", text: "Curva", onClick: (ed) => ed.changeArrowType('curved') },
                        { type: "button", id: "arrowTypeZigzag", class: "arrow-type-btn", text: "Zigzag", onClick: (ed) => ed.changeArrowType('zigzag') }
                    ]
                },
                {
                    label: "Spessore", i18n: "panel_thickness", row: [
                        { type: "input", inputType: "range", id: "arrowThickness", min: "1", max: "10", value: "3", step: "1", onInput: (ed, ev) => { document.getElementById('thicknessValue').textContent = ev.target.value; if (ed.selectedArrow) ed.changeArrowThickness(ev.target.value); } },
                        { type: "div", id: "thicknessValue", class: "range-value", html: "3" }
                    ]
                },
                {
                    label: "Opacità", i18n: "panel_opacity", row: [
                        { type: "input", inputType: "range", id: "arrowOpacity", min: "0", max: "1", value: "1", step: "0.05", onInput: (ed, ev) => { document.getElementById('arrowOpacityValue').textContent = parseFloat(ev.target.value).toFixed(2); if (ed.selectedArrow) ed.changeArrowOpacity(ev.target.value); } },
                        { type: "div", id: "arrowOpacityValue", class: "range-value", html: "1.00" }
                    ]
                },
                {
                    label: "Punte", i18n: "panel_arrow_heads", row: [
                        { type: "input", inputType: "checkbox", id: "arrowMarkerStart", text: "◀ Inizio", i18n: "tb_marker_start", onChange: (ed, ev) => ed.setArrowMarker('start', ev.target.checked) },
                        { type: "input", inputType: "checkbox", id: "arrowMarkerEnd", text: "Fine ▶", i18n: "tb_marker_end", checked: true, onChange: (ed, ev) => ed.setArrowMarker('end', ev.target.checked) }
                    ]
                },
                { item: { type: "button", id: "dashedArrowToggle", text: "⚡ Freccia tratteggiata", onClick: (ed) => ed.toggleDashedArrow() } }
            ]
        },

        // ---- sprite selezionato
        {
            id: "spriteControls", title: "Sprite", i18n: "toolbar_sprite_controls", hidden: true, fields: [
                { label: "Frame corrente", i18n: "label_sprite_frame", item: { type: "input", inputType: "number", id: "spriteCurrentFrame", min: "0", max: "7", value: "0" } },
                { label: "Animazione (frame, FPS)", i18n: "panel_sprite_anim", row: [{ type: "input", inputType: "text", id: "spriteAnimationFrames", placeholder: "0,1,2,3" }, { type: "input", inputType: "number", id: "spriteAnimationFPS", min: "1", max: "60", value: "10" }] },
                { row: [{ type: "button", id: "spritePlayAnimation", text: "▶ Play" }, { type: "button", id: "spriteStopAnimation", text: "⏸ Stop" }] },
                { label: "Dimensioni frame (L × A)", i18n: "label_sprite_frame_size", row: [{ type: "input", inputType: "number", id: "spriteFrameWidth", min: "8", max: "512", value: "64" }, { type: "input", inputType: "number", id: "spriteFrameHeight", min: "8", max: "512", value: "64" }, { type: "button", id: "spriteApplySize", text: "✓" }] }
            ]
        },

        // ---- disegno a mano libera selezionato
        {
            id: "freehandControls", title: "Disegno", i18n: "toolbar_freehand_controls", hidden: true, fields: [
                { label: "Colore traccia", i18n: "label_freehand_color", item: { type: "input", inputType: "color", id: "freehandColor", value: "#000000", onChange: (ed, ev) => ed.changeFreehandColor(ev.target.value) } },
                { label: "Spessore", i18n: "panel_thickness", row: [{ type: "input", inputType: "range", id: "freehandThickness", min: "1", max: "15", value: "3", onInput: (ed, ev) => { document.getElementById('freehandThicknessValue').textContent = ev.target.value; if (ed.selectedFreehand) ed.changeFreehandThickness(ev.target.value); } }, { type: "div", id: "freehandThicknessValue", class: "range-value", html: "3" }] },
                { label: "Opacità", i18n: "panel_opacity", row: [{ type: "input", inputType: "range", id: "freehandOpacity", min: "0", max: "1", step: "0.05", value: "1", onInput: (ed, ev) => { document.getElementById('freehandOpacityValue').textContent = parseFloat(ev.target.value).toFixed(2); if (ed.selectedFreehand) ed.changeFreehandOpacity(ev.target.value); } }, { type: "div", id: "freehandOpacityValue", class: "range-value", html: "1.00" }] }
            ]
        }
    ],

    // Palette rapida colori (oggetto)
    quickColors: [
        ["#3498db", "Blu"], ["#2ecc71", "Verde"], ["#e67e22", "Arancione"], ["#e74c3c", "Rosso"],
        ["#f1c40f", "Giallo"], ["#9b59b6", "Viola"], ["#2c3e50", "Nero"], ["#ffffff", "Bianco"]
    ],

    // ------------------------------------------------------------------
    // STATUS BAR (toggle di visualizzazione, come griglia/calamita in SpikeCut)
    // ------------------------------------------------------------------
    status: [
        { id: "gridToggle", text: "▦ griglia", i18n: "st_grid", title: "Griglia (G con Maiusc)", onClick: (ed, ev) => { const t = ed.getCurrentTab(); t.gridVisible = !t.gridVisible; ed.updateGrid(); ev.currentTarget.classList.toggle('active', t.gridVisible); } },
        { id: "bwToggle", text: "◐ b/n", i18n: "st_bw", title: "Bianco e nero", onClick: (ed, ev) => { const t = ed.getCurrentTab(); t.bwMode = !t.bwMode; ed.updateBWMode(); ev.currentTarget.classList.toggle('active', t.bwMode); } },
        { id: "toggleLabels", text: "# numeri", i18n: "st_labels", title: "Numeri degli oggetti", onClick: (ed) => ed.toggleObjectLabels() },
        { id: "togglePlayerNames", text: "🏷 nomi", i18n: "st_names", title: "Nomi dei giocatori", onClick: (ed) => ed.togglePlayerNames() },
        { id: "toggleCanvasBorder", text: "▭ bordi", i18n: "st_borders", title: "Bordi del foglio", onClick: (ed) => ed.toggleCanvasBorder() },
        {
            id: "togglePlaneSphereBtn", text: "◍ sfera 3D", i18n: "st_sphere", cls: "active", title: "Sfera di rotazione del piano", onClick: (ed, ev) => {
                const tab = ed.getCurrentTab();
                const sphere = document.getElementById('planeRotationSphere');
                if (!sphere) return;
                tab.planeSphere = tab.planeSphere || {};
                tab.planeSphere.visible = sphere.style.display === 'none';
                sphere.style.display = tab.planeSphere.visible ? '' : 'none';
                ev.currentTarget.classList.toggle('active', tab.planeSphere.visible);
                ed.saveState('Toggle sfera rotazione piano');
            }
        },
        { id: "resetPlane3dBtn", text: "⟲ 3D", i18n: "st_reset3d", title: "Azzera la vista 3D: il foglio torna piatto (anche doppio clic sulla sfera)", onClick: (ed) => ed.resetCanvasPlaneRotation(true) }
    ]
};

// La vecchia toolbar non è più usata: i comandi sono in topbar, rail, pannello e status bar.
const toolbarTopConfig = [];
const toolbarBottomConfig = [
    // file input nascosti usati da Carica schema / Carica allenamento
    {
        legend: "", position: "bottom", fieldsetId: "hiddenInputs", fieldsetClass: "toolbar-group", hidden: true, items: [
            { type: "file", id: "fileInput", class: "hidden", accept: ".json" },
            { type: "file", id: "workoutFileInput", class: "hidden", accept: ".json" }
        ]
    }
];
