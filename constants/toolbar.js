// =======================
// DEFINIZIONE TOOLBAR
// =======================
const toolbarConfig = [
    {
        legend: "toolbar_size",
        items: [
            { type: "label", text: "toolbar_size" },
            {
                type: "select", id: "canvasSizeSelect", options: [
                    ["custom", "size_custom"],
                    ["a5-portrait", "size_a5_portrait"],
                    ["a5-landscape", "size_a5_landscape"],
                    ["a4-portrait", "size_a4_portrait"],
                    ["a4-landscape", "size_a4_landscape"],
                    ["a3-portrait", "size_a3_portrait"],
                    ["a3-landscape", "size_a3_landscape"],
                    ["a2-portrait", "size_a2_portrait"],
                    ["a2-landscape", "size_a2_landscape"],
                    ["business-card", "size_business_card"]
                ]
            },
            { type: "button", id: "toggleCanvasBorder", text: "🖼️ Bordi", i18n: "btn_toggle_borders" },

            { type: "label", text: "label_background" },
            {
                type: "select", id: "backgroundSelect", options: [
                    ["none", "bg_none"],
                    ["half-field", "bg_half_field"],
                    ["full-field", "bg_full_field"],
                    ["3d-field", "bg_3d_field"]
                ]
            },

            { type: "button", id: "zoomOut", text: "➖", i18n: "btn_zoom_out" },
            { type: "div", id: "zoomDisplay", class: "zoom-display", html: "100%" },
            { type: "button", id: "zoomIn", text: "➕", i18n: "btn_zoom_in" }
        ]
    },

    {
        legend: "toolbar_team",
        items: [
            { type: "button", id: "manageTeamBtn", text: "👥 Gestisci Squadra", i18n: "btn_manage_team" },
            { type: "button", id: "togglePlayerNames", text: "🏷️ Nomi Giocatori", i18n: "btn_toggle_names" }
        ]
    },

    {
        legend: "toolbar_order",
        items: [
            { type: "button", id: "bringToFront", text: "⬆️ In primo piano", i18n: "btn_to_front" },
            { type: "button", id: "sendToBack", text: "⬇️ In background", i18n: "btn_to_back" }
        ]
    },

    {
        legend: "toolbar_view",
        items: [
            { type: "button", id: "gridToggle", text: "📐 Griglia", i18n: "btn_grid" },
            { type: "button", id: "snapToGridBtn", text: "🧲 Allinea alla Griglia", i18n: "btn_snap_grid" },
            { type: "button", id: "bwToggle", text: "⚫ B/N", i18n: "btn_bw" },
            { type: "button", id: "dashedToggle", text: "⚡ Tratteggio", i18n: "btn_dashed" },
            { type: "button", id: "toggleLabels", text: "🔢 Etichette", i18n: "btn_labels" },
            { type: "button", id: "renumberObjects", text: "🔄 Rinumera", i18n: "btn_renumber" },
            { type: "button", id: "exportPdfBtn", text: "📄 Esporta PDF", i18n: "btn_export_pdf_full" },
            { type: "button", id: "freehandModeBtn", text: "✏️ Disegno", i18n: "btn_freehand_draw" },
            { type: "button", id: "exportFormationsBtn", text: "📋 Foglio Formazioni", i18n: "btn_export_formations" },
            { type: "button", id: "showAnimationControls", text: "🎬 Animazione", i18n: "btn_show_animation" },
            { type: "button", id: "recordMacroBtn", text: "⏺️", i18n: "btn_record_start" },
            { type: "button", id: "stopRecordBtn", text: "⏹️", i18n: "btn_record_stop" },
            { type: "button", id: "playMacroBtn", text: "▶️", i18n: "btn_record_play" }
        ]
    },

    {
        legend: "toolbar_edit",
        items: [
            { type: "button", id: "rotateLeft", text: "↺", i18n: "btn_rotate_left" },
            { type: "button", id: "rotateRight", text: "↻", i18n: "btn_rotate_right" },
            { type: "button", id: "rotateLeft90", text: "↺90", i18n: "btn_rotate_left" },
            { type: "button", id: "rotateRight90", text: "↻90", i18n: "btn_rotate_right" },
            { type: "button", id: "groupRotateLeft", text: "⟲ Ruota Gruppo -15°", i18n: "btn_group_rotate_left" },
            { type: "button", id: "groupRotateRight", text: "⟳ Ruota Gruppo +15°", i18n: "btn_group_rotate_right" },
            { type: "button", id: "groupRotateLeft90", text: "⟲ Ruota Gruppo -90°", i18n: "btn_group_rotate_left" },
            { type: "button", id: "groupRotateRight90", text: "⟳ Ruota Gruppo +90°", i18n: "btn_group_rotate_right" },
            { type: "button", id: "undoBtn", text: "⏪ Undo", i18n: "btn_undo" },
            { type: "button", id: "redoBtn", text: "⏩ Redo", i18n: "btn_redo" },
            { type: "button", id: "historyBtn", text: "📜 Storico", i18n: "btn_history" }
        ]
    },

    {
        legend: "toolbar_file",
        items: [
            { type: "input", id: "schemaTitle", placeholder: "Titolo schema", i18nPlaceholder: "placeholder_schema_title" },
            { type: "button", id: "saveBtn", text: "💾 Salva", i18n: "btn_save_schema" },
            { type: "button", id: "saveWorkOutBtn", text: "💾 Salva Allenamento", i18n: "btn_save_workout" },
            { type: "button", id: "loadBtn", text: "📁 Carica", i18n: "btn_load_schema" },
            { type: "button", id: "loadWorkOutBtn", text: "📁 Carica Allenamento", i18n: "btn_load_workout" },
            { type: "file", id: "fileInput", accept: ".json", style: "display:none" },
            { type: "file", id: "workoutFileInput", accept: ".json", style: "display:none" },
            { type: "button", id: "exportBtn", text: "📤 Esporta", i18n: "btn_export_schema" },
            { type: "button", id: "exportWorkOutBtn", text: "📤 Genera la scheda", i18n: "btn_export_workout_sheet" },
            { type: "button", id: "loadFromLibrary", text: "📁 Libreria", i18n: "btn_load_library" }
        ]
    },

    {
        legend: "toolbar_user",
        items: [
            {
                type: "div",
                id: "userInfo",
                class: "user-info",
                style: "display:none;",
                html: `👤 <span id="currentUsername"></span> <button class="logout-button" id="logoutButton" data-i18n="btn_logout">Esci</button>`
            },
            {
                type: "select",
                id: "languageSelector",
                options: [
                    ["it", "language_italian"],
                    ["en", "language_english"],
                    ["fr", "language_french"]
                ]
            }
        ]
    }
];