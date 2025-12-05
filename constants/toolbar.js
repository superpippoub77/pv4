// =======================
// DEFINIZIONE TOOLBAR
// =======================
const toolbarConfig = [
    {
        legend: "toolbar_size",
        align: "up",
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
            { type: "button", id: "toggleCanvasBorder", text: "🖼️ Bordi", i18n: "btn_toggle_borders", titleI18n: "btn_toggle_borders" },

            { type: "label", text: "label_background" },
            {
                type: "select", id: "backgroundSelect", options: [
                    ["none", "bg_none"],
                    ["half-field", "bg_half_field"],
                    ["full-field", "bg_full_field"],
                    ["3d-field", "bg_3d_field"]
                ]
            },

            { type: "button", id: "zoomOut", text: "➖", i18n: "btn_zoom_out", titleI18n: "btn_zoom_out" },
            { type: "div", id: "zoomDisplay", class: "zoom-display", html: "100%" },
            { type: "button", id: "zoomIn", text: "➕", i18n: "btn_zoom_in", titleI18n: "btn_zoom_in" }
        ]
    },

    {
        legend: "toolbar_team",
        align: "up",
        items: [
            {
                type: "button", id: "manageTeamBtn", text: "👥 Gestisci Squadra", i18n: "btn_manage_team", titleI18n: "btn_manage_team", onClick: (editor) => {
                    editor.teamManagementManager.show();
                }
            },
            { type: "button", id: "togglePlayerNames", text: "🏷️ Nomi Giocatori", i18n: "btn_toggle_names", titleI18n: "btn_toggle_names" }
        ]
    },

    {
        legend: "toolbar_order",
        items: [
            {
                type: "button", id: "bringToFront", text: "⬆️ In primo piano", i18n: "btn_to_front", titleI18n: "btn_to_front",
                onClick: (editor) => {
                    editor.bringToFront();
                }
            },
            {
                type: "button", id: "sendToBack", text: "⬇️ In background", i18n: "btn_to_back", titleI18n: "btn_to_back",
                onClick: (editor) => {
                    editor.sendToBack();
                }
            }
        ]
    },

    {
        legend: "toolbar_view",
        align: "up",
        items: [
            { type: "button", id: "gridToggle", text: "📐 Griglia", i18n: "btn_grid", titleI18n: "btn_grid" },
            { type: "button", id: "snapToGridBtn", text: "🧲 Allinea alla Griglia", i18n: "btn_snap_grid", titleI18n: "btn_snap_grid" },
            { type: "button", id: "bwToggle", text: "⚫ B/N", i18n: "btn_bw", titleI18n: "btn_bw" },
            { type: "button", id: "dashedToggle", text: "⚡ Tratteggio", i18n: "btn_dashed", titleI18n: "btn_dashed" },
            { type: "button", id: "toggleLabels", text: "🔢 Etichette", i18n: "btn_labels", titleI18n: "btn_labels" },
            { type: "button", id: "renumberObjects", text: "🔄 Rinumera", i18n: "btn_renumber", titleI18n: "btn_renumber" },
            { type: "button", id: "exportPdfBtn", text: "📄 Esporta PDF", i18n: "btn_export_pdf_full", titleI18n: "btn_export_pdf_full" },
            {
                type: "button", id: "freehandModeBtn", text: "✏️ Disegno", i18n: "btn_freehand_draw", titleI18n: "btn_freehand_draw",
                onClick: (editor) => {
                    return (e) => {
                        editor.freehandMode = !editor.freehandMode;
                        e.currentTarget.classList.toggle('active', editor.freehandMode);
                        document.getElementById('canvas').style.cursor = editor.freehandMode ? 'crosshair' : 'default';
                        editor.deselectAll();
                    };
                }
            },
            { type: "button", id: "exportFormationsBtn", text: "📋 Foglio Formazioni", i18n: "btn_export_formations", titleI18n: "btn_export_formations" },
            { type: "button", id: "showAnimationControls", text: "🎬 Animazione", i18n: "btn_show_animation", titleI18n: "btn_show_animation" },
            { type: "button", id: "recordMacroBtn", text: "⏺️", i18n: "btn_record_start", titleI18n: "btn_record_start" },
            { type: "button", id: "stopRecordBtn", text: "⏹️", i18n: "btn_record_stop", titleI18n: "btn_record_stop" },
            { type: "button", id: "playMacroBtn", text: "▶️", i18n: "btn_record_play", titleI18n: "btn_record_play" }
        ]
    },

    {
        legend: "toolbar_edit",
        align: "up",
        items: [
            { type: "button", id: "rotateLeft", text: "↺", i18n: "btn_rotate_left", titleI18n: "btn_rotate_left" },
            { type: "button", id: "rotateRight", text: "↻", i18n: "btn_rotate_right", titleI18n: "btn_rotate_right" },
            { type: "button", id: "rotateLeft90", text: "↺90", i18n: "btn_rotate_left", titleI18n: "btn_rotate_left" },
            { type: "button", id: "rotateRight90", text: "↻90", i18n: "btn_rotate_right", titleI18n: "btn_rotate_right" },
            {
                type: "button", id: "groupRotateLeft", text: "⟲ Ruota Gruppo -15°", i18n: "btn_group_rotate_left", titleI18n: "btn_group_rotate_left",
                onClick: (editor) => {
                    editor.rotateGroup(-15);
                }
            },
            {
                type: "button", id: "groupRotateRight", text: "⟳ Ruota Gruppo +15°", i18n: "btn_group_rotate_right", titleI18n: "btn_group_rotate_right",
                onClick: (editor) => {
                    editor.rotateGroup(15);
                }
            },
            {
                type: "button", id: "groupRotateLeft90", text: "⟲ Ruota Gruppo -90°", i18n: "btn_group_rotate_left", titleI18n: "btn_group_rotate_left",
                onClick: (editor) => {
                    editor.rotateGroup(-90);
                }
            },
            {
                type: "button", id: "groupRotateRight90", text: "⟳ Ruota Gruppo +90°", i18n: "btn_group_rotate_right", titleI18n: "btn_group_rotate_right",
                onClick: (editor) => {
                    editor.rotateGroup(90);
                }
            },
            { type: "button", id: "undoBtn", text: "⏪ Undo", i18n: "btn_undo", titleI18n: "btn_undo" },
            { type: "button", id: "redoBtn", text: "⏩ Redo", i18n: "btn_redo", titleI18n: "btn_redo" },
            {
                type: "button", id: "historyBtn", text: "📜 Storico", i18n: "btn_history", titleI18n: "btn_history", onClick: (editor) => {
                    editor.historyManager.show();
                }
            }
        ]
    },

    {
        legend: "toolbar_file",
        align: "up",
        items: [
            { type: "input", id: "schemaTitle", placeholder: "Titolo schema", i18nPlaceholder: "placeholder_schema_title" },
            { type: "button", id: "saveBtn", text: "💾 Salva", i18n: "btn_save_schema", titleI18n: "btn_save_schema" },
            { type: "button", id: "saveWorkOutBtn", text: "💾 Salva Allenamento", i18n: "btn_save_workout", titleI18n: "btn_save_workout" },
            { type: "button", id: "loadBtn", text: "📁 Carica", i18n: "btn_load_schema", titleI18n: "btn_load_schema" },
            { type: "button", id: "loadWorkOutBtn", text: "📁 Carica Allenamento", i18n: "btn_load_workout", titleI18n: "btn_load_workout" },
            { type: "file", id: "fileInput", accept: ".json", style: "display:none" },
            { type: "file", id: "workoutFileInput", accept: ".json", style: "display:none" },
            { type: "button", id: "exportBtn", text: "📤 Esporta", i18n: "btn_export_schema", titleI18n: "btn_export_schema" },
            { type: "button", id: "exportWorkOutBtn", text: "📤 Genera la scheda", i18n: "btn_export_workout_sheet", titleI18n: "btn_export_workout_sheet" },
            {
                type: "button", id: "loadFromLibrary", text: "📁 Libreria", i18n: "btn_load_library", titleI18n: "btn_load_library", onClick: (editor) => {
                    editor.libraryManager.show();
                }
            }
        ]
    },

    {
        legend: "toolbar_user",
        align: "up",
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
    },

    // -----------------------
    // BOTTOM TOOLBAR CONTROLS
    // -----------------------
    {
        legend: "toolbar_object_controls",
        align: "down",
        fixed: true,
        fieldsetId: "objectControls",
        fieldsetClass: "toolbar-group fixed form-grid",
        items: [
            { type: "player", text: "Colore", label: "object_color", iconHTML: "🎨", id: "objectColor", class: "color-picker", i18n: "local_object_color_label" },
            { type: "player", text: "Opacità", label: "object_opacity", iconHTML: "⚪", id: "objectOpacity", i18n: "local_object_opacity_label" },
            { type: "player", text: "Valore", label: "object_opacity_value", iconHTML: "🔢", id: "objectOpacityValue", class: "small-input", i18n: "local_object_opacity_value_label" },
            { type: "player", text: "Testo", label: "object_text", iconHTML: "✏️", id: "objectText", i18nPlaceholder: "local_object_text_label", i18n: "local_object_text_label" },
            { type: "player", text: "Numero", label: "object_number", iconHTML: "🔢", id: "objectNumber", class: "small-input", i18n: "local_object_number_label" },
            { type: "player", text: "Tratteggiato", label: "dashed_object_toggle", iconHTML: "⚡", id: "dashedObjectToggle", class: "toolbar-button", i18n: "local_dashed_object_toggle" },
            { type: "player", text: "Elimina", label: "delete_object", iconHTML: "🗑️", id: "deleteBtn", i18n: "local_delete_button" }
        ]
    },
    {
        legend: "toolbar_arrow_controls",
        align: "down",
        fixed: true,
        fieldsetId: "arrowControls",
        fieldsetClass: "toolbar-group fixed",
        items: [
            { type: "player", text: "Colore", label: "arrow_color", iconHTML: "🎨", id: "arrowColor", class: "color-picker", i18n: "local_arrow_color_label" },
            { type: "player", text: "Opacità", label: "arrow_opacity", iconHTML: "⚪", id: "arrowOpacity", i18n: "local_arrow_opacity_label" },
            { type: "player", text: "Spessore", label: "arrow_thickness", iconHTML: "📏", id: "arrowThickness", i18n: "local_arrow_thickness_label" },
            { type: "player", text: "Lineare", label: "arrow_type_linear", iconHTML: "➡️", id: "arrowTypeLinear", class: "arrow-type-btn", i18n: "local_arrow_type_linear" },
            { type: "player", text: "Curva", label: "arrow_type_curved", iconHTML: "➰", id: "arrowTypeCurved", class: "arrow-type-btn", i18n: "local_arrow_type_curved" },
            { type: "player", text: "Zigzag", label: "arrow_type_zigzag", iconHTML: "⚡", id: "arrowTypeZigzag", class: "arrow-type-btn", i18n: "local_arrow_type_zigzag" },
            { type: "player", text: "Tratteggiata", label: "dashed_arrow_toggle", iconHTML: "⚡", id: "dashedArrowToggle", class: "toolbar-button", i18n: "local_dashed_arrow_toggle" },
            { type: "player", text: "Marker Inizio", label: "arrow_marker_start", iconHTML: "🔹", id: "arrowMarkerStart", i18n: "local_arrow_marker_start_label" },
            { type: "player", text: "Marker Fine", label: "arrow_marker_end", iconHTML: "🔹", id: "arrowMarkerEnd", i18n: "local_arrow_marker_end_label" }
        ]
    },
    {
        legend: "toolbar_sprite_controls",
        align: "down",
        fixed: true,
        fieldsetId: "spriteControls",
        fieldsetClass: "toolbar-group fixed",
        items: [
            { type: "player", text: "Frame", label: "sprite_current_frame", iconHTML: "🎞️", id: "spriteCurrentFrame", i18n: "local_sprite_current_frame_label" },
            { type: "player", text: "Animazione", label: "sprite_animation_frames", iconHTML: "🎬", id: "spriteAnimationFrames", i18nPlaceholder: "local_sprite_animation_label" },
            { type: "player", text: "FPS", label: "sprite_fps", iconHTML: "⏱️", id: "spriteAnimationFPS", i18n: "local_sprite_animation_fps_label" },
            { type: "player", text: "Play", label: "sprite_play_animation", iconHTML: "▶️", id: "spritePlayAnimation", class: "toolbar-button" },
            { type: "player", text: "Stop", label: "sprite_stop_animation", iconHTML: "⏸️", id: "spriteStopAnimation", class: "toolbar-button" },
            { type: "player", text: "Larghezza", label: "sprite_frame_width", iconHTML: "📐", id: "spriteFrameWidth", i18n: "local_sprite_frame_size_label" },
            { type: "player", text: "Altezza", label: "sprite_frame_height", iconHTML: "📐", id: "spriteFrameHeight", i18n: "local_sprite_frame_size_label" },
            { type: "player", text: "Applica", label: "sprite_apply_size", iconHTML: "✅", id: "spriteApplySize", class: "toolbar-button" }
        ]
    },
    {
        legend: "toolbar_freehand_controls",
        align: "down",
        fixed: true,
        fieldsetId: "freehandControls",
        fieldsetClass: "toolbar-group fixed",
        items: [
            { type: "player", text: "Colore Traccia", label: "freehand_color", iconHTML: "🎨", id: "freehandColor", class: "color-picker", i18n: "local_freehand_color_label" },
            { type: "player", text: "Spessore", label: "freehand_thickness", iconHTML: "📏", id: "freehandThickness", i18n: "local_freehand_thickness_label" },
            { type: "player", text: "Opacità", label: "freehand_opacity", iconHTML: "⚪", id: "freehandOpacity", i18n: "local_freehand_opacity_label" }
        ]
    },
    {
        legend: "toolbar_object_info",
        align: "down",
        fixed: true,
        fieldsetId: "objectInfo",
        fieldsetClass: "toolbar-group",
        items: [
            { type: "player", text: "Nessun oggetto", label: "object_info", iconHTML: "❌", i18n: "local_no_object_selected" }
        ]
    }
];