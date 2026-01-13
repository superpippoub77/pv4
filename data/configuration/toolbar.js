// =======================
// DEFINIZIONE TOOLBAR
// =======================
const toolbarTopConfig = [
    {
        legend: "toolbar_size",
        position: "top",
        fieldsetId: "sizeControls",
        fieldsetClass: "toolbar-group",
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
                ], onChange: (editor, value) => { editor.setCanvasSize(value); }
            },
            { type: "button", id: "toggleCanvasBorder", text: "🖼️ Bordi", i18n: "btn_toggle_borders", titleI18n: "btn_toggle_borders", onClick: (editor) => { editor.toggleCanvasBorder(); } },

            { type: "label", text: "label_background" },
            {
                type: "select", id: "backgroundSelect", options: [
                    ["none", "bg_none"],
                    ["half-field", "bg_half_field"],
                    ["full-field", "bg_full_field"],
                    ["3d-field", "bg_3d_field"]
                ]
            },

            { type: "button", id: "zoomOut", text: "➖", i18n: "btn_zoom_out", titleI18n: "btn_zoom_out", onClick: (editor) => { editor.changeZoom(-0.1) } },
            { type: "div", id: "zoomDisplay", class: "zoom-display", html: "100%" },
            { type: "button", id: "zoomIn", text: "➕", i18n: "btn_zoom_in", titleI18n: "btn_zoom_in", onClick: (editor) => { editor.changeZoom(0.1) } }
        ]
    },
    {
        legend: "toolbar_team",
        position: "top",
        fieldsetId: "teamControls",
        fieldsetClass: "toolbar-group",
        items: [
            {
                type: "button", id: "manageTeamBtn", text: "👥 Gestisci Squadra", i18n: "btn_manage_team", titleI18n: "btn_manage_team", onClick: (editor) => {
                    editor.teamManager.show();
                }
            },
            { type: "button", id: "togglePlayerNames", text: "🏷️ Nomi Giocatori", i18n: "btn_toggle_names", titleI18n: "btn_toggle_names", onClick: (editor) => { editor.togglePlayerNames(); } }
        ]
    },

    {
        legend: "toolbar_order",
        position: "top",
        fieldsetId: "orderControls",
        fieldsetClass: "toolbar-group",
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
        position: "top",
        fieldsetId: "viewControls",
        fieldsetClass: "toolbar-group",
        items: [
            {
                type: "button", id: "gridToggle", class: "gridToggle", text: "📐 Griglia", i18n: "btn_grid", titleI18n: "btn_grid", onClick: (editor) => {
                    editor.getCurrentTab().gridVisible = !editor.getCurrentTab().gridVisible;
                    editor.updateGrid();
                }
            },
            {
                type: "button", id: "snapToGridBtn", text: "🧲 Allinea alla Griglia", i18n: "btn_snap_grid", titleI18n: "btn_snap_grid", onClick: (editor) => {
                    // Chiama la funzione di allineamento sulla griglia
                    if (window.editor && window.editor.snapObjectsToGrid) {
                        window.editor.snapObjectsToGrid();
                    }
                }
            },
            {
                type: "button", id: "bwToggle", class: "bwToggle", text: "⚫ B/N", i18n: "btn_bw", titleI18n: "btn_bw", onClick: (editor) => {
                    editor.getCurrentTab().bwMode = !editor.getCurrentTab().bwMode;
                    editor.updateBWMode();
                }
            },
            {
                type: "button", id: "dashedToggle", text: "⚡ Tratteggio", i18n: "btn_dashed", titleI18n: "btn_dashed", onClick: (editor) => {
                    editor.dashedMode = !editor.dashedMode;
                    document.getElementById('dashedToggle').classList.toggle('active', editor.dashedMode);
                }
            },
            {
                type: "button", id: "toggleLabels", text: "🔢 Etichette", i18n: "btn_labels", titleI18n: "btn_labels", onClick: (editor) => {
                    editor.toggleObjectLabels();
                }
            },
            {
                type: "button", id: "renumberObjects", text: "🔄 Rinumera", i18n: "btn_renumber", titleI18n: "btn_renumber", onClick: (editor) => {
                    editor.renumberAllObjects();
                }
            },
            { type: "button", id: "exportPdfBtn", text: "📄 Esporta PDF", i18n: "btn_export_pdf_full", titleI18n: "btn_export_pdf_full" },
            {
                type: "button", id: "freehandModeBtn", text: "✏️ Disegno", i18n: "btn_freehand_draw", titleI18n: "btn_freehand_draw",
                onClick: (editor) => {
                    editor.freehandMode = !editor.freehandMode;
                    document.getElementById('freehandModeBtn').classList.toggle('active', editor.freehandMode);
                    document.getElementById('canvas').style.cursor = editor.freehandMode ? 'crosshair' : 'default';
                    editor.deselectAll();
                }
            },
            {
                type: "button", id: "exportFormationsBtn", text: "📋 Foglio Formazioni", i18n: "btn_export_formations", titleI18n: "btn_export_formations", onClick: (editor) => {
                    editor.exportFormationSheet();
                }
            },
            {
                type: "button", id: "exportDataVolleyBtn", text: "📋 Foglio Scout", i18n: "btn_export_scout", titleI18n: "btn_export_scout", onClick: (editor) => {
                    editor.exportDataVolley();
                }
            },
            {
                type: "button", id: "showAnimationControls", text: "🎬 Animazione", i18n: "btn_show_animation", titleI18n: "btn_show_animation", onClick: (editor) => {
                    editor.showAnimationControls();
                }
            },
            { type: "button", id: "recordMacroBtn", text: "⏺️", i18n: "btn_record_start", titleI18n: "btn_record_start", onClick: (editor) => { editor.macroManager.showDialog(); } },
            { type: "button", id: "stopRecordBtn", text: "⏹️", i18n: "btn_record_stop", titleI18n: "btn_record_stop" },
            { type: "button", id: "playMacroBtn", text: "▶️", i18n: "btn_record_play", titleI18n: "btn_record_play" }
        ]
    },

    {
        legend: "toolbar_edit",
        position: "top",
        fieldsetId: "editControls",
        fieldsetClass: "toolbar-group",
        items: [
            { type: "input", inputType: "range", id: "objectRotationX", text: "x", i18n: "btn_rotate_x", titleI18n: "btn_rotate_x", min: "-180", max: "180", value: "0", step: "15" },
            { type: "div", id: "rotationXValue", class: "", html: "0°" },
            { type: "input", inputType: "range", id: "objectRotationY", text: "y", i18n: "btn_rotate_y", titleI18n: "btn_rotate_y", min: "-180", max: "180", value: "0", step: "15" },
            { type: "div", id: "rotationYValue", class: "", html: "0°" },
            { type: "input", inputType: "range", id: "objectRotationZ", text: "z", i18n: "btn_rotate_z", titleI18n: "btn_rotate_z", min: "-180", max: "180", value: "0", step: "15" },
            { type: "div", id: "rotationZValue", class: "", html: "0°" },

            { type: "button", id: "rotateLeft", text: "↺", i18n: "btn_rotate_left", titleI18n: "btn_rotate_left", onClick: (editor) => { editor.rotateSelected(-15); } },
            { type: "button", id: "rotateRight", text: "↻", i18n: "btn_rotate_right", titleI18n: "btn_rotate_right", onClick: (editor) => { editor.rotateSelected(15); } },
            { type: "button", id: "rotateLeft90", text: "↺90", i18n: "btn_rotate_left", titleI18n: "btn_rotate_left", onClick: (editor) => { editor.rotateSelected(-90); } },
            { type: "button", id: "rotateRight90", text: "↻90", i18n: "btn_rotate_right", titleI18n: "btn_rotate_right", onClick: (editor) => { editor.rotateSelected(90); } },
            { type: "button", id: "resetRotation", text: "Reset", i18n: "btn_reset_rotation", titleI18n: "btn_reset_rotation", onClick: (editor) => { editor.resetSelectedRotation(); } },
            // Plane rotation controls: rotate the whole canvas along X/Y/Z axes
            { type: "button", id: "rotatePlaneXMinus", text: "X−", i18n: "btn_rotate_plane_x_minus", titleI18n: "btn_rotate_plane_x_minus", onClick: (editor) => { editor.rotateCanvasPlane('X', -15); } },
            { type: "button", id: "rotatePlaneXPlus", text: "X+", i18n: "btn_rotate_plane_x_plus", titleI18n: "btn_rotate_plane_x_plus", onClick: (editor) => { editor.rotateCanvasPlane('X', 15); } },
            { type: "button", id: "rotatePlaneYMinus", text: "Y−", i18n: "btn_rotate_plane_y_minus", titleI18n: "btn_rotate_plane_y_minus", onClick: (editor) => { editor.rotateCanvasPlane('Y', -15); } },
            { type: "button", id: "rotatePlaneYPlus", text: "Y+", i18n: "btn_rotate_plane_y_plus", titleI18n: "btn_rotate_plane_y_plus", onClick: (editor) => { editor.rotateCanvasPlane('Y', 15); } },
            { type: "button", id: "rotatePlaneZMinus", text: "Z−", i18n: "btn_rotate_plane_z_minus", titleI18n: "btn_rotate_plane_z_minus", onClick: (editor) => { editor.rotateCanvasPlane('Z', -15); } },
            { type: "button", id: "rotatePlaneZPlus", text: "Z+", i18n: "btn_rotate_plane_z_plus", titleI18n: "btn_rotate_plane_z_plus", onClick: (editor) => { editor.rotateCanvasPlane('Z', 15); } },
            { type: "button", id: "rotatePlaneReset", text: "Reset", i18n: "btn_rotate_plane_reset", titleI18n: "btn_rotate_plane_reset", onClick: (editor) => { editor.resetCanvasPlaneRotation(); } },
            // 3D depth preference: toggle + presets/custom value
            { type: "input", inputType: "checkbox", id: "enableObjectDepth", text: "3D Depth", i18n: "btn_3d_depth", titleI18n: "btn_3d_depth", onChange: (editor, event) => { editor.objectDepthEnabled = event.target.checked; document.getElementById('enableObjectDepth')?.classList.toggle('active', event.target.checked); try { editor.storage.set('objectDepthEnabled', event.target.checked); } catch(err){} try { editor.updateAllObjectTransforms(); } catch (err) { /* ignore */ } } },
            { type: "select", id: "objectDepthPreset", options: [ ["0","none"], ["8","small"], ["20","medium"], ["40","large"], ["custom","custom"] ], onChange: (editor, value) => { if (value !== 'custom') { editor.objectDepthPx = parseInt(value); const el = document.getElementById('objectDepthCustom'); if (el) el.value = editor.objectDepthPx; try { editor.storage.set('objectDepthPx', editor.objectDepthPx); } catch(err){} try { editor.updateAllObjectTransforms(); } catch (err){} } } },
            { type: "input", inputType: "number", id: "objectDepthCustom", text: "Depth(px)", i18n: "lbl_depth_px", min: "0", max: "200", value: "20", onInput: (editor, event) => { editor.objectDepthPx = parseInt(event.target.value) || 0; try { editor.storage.set('objectDepthPx', editor.objectDepthPx); } catch(err){} try { editor.updateAllObjectTransforms(); } catch (err){} } },
            { type: "input", inputType: "checkbox", id: "inheritPlaneRotation", text: "Allinea al piano", i18n: "btn_inherit_plane", titleI18n: "btn_inherit_plane", onChange: (editor, event) => { editor.inheritPlaneRotationEnabled = event.target.checked; document.getElementById('inheritPlaneRotation')?.classList.toggle('active', event.target.checked); try { editor.updateAllObjectTransforms(); } catch (err) { /* ignore */ } } },
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
            {
                type: "button", id: "mirrorHorizontal", text: "⇋ Specchi Orizzontale", i18n: "btn_mirror_horizontal", titleI18n: "btn_mirror_horizontal",
                onClick: (editor) => {
                    editor.mirrorSelected("h");
                }
            },
            {
                type: "button", id: "mirrorVertical", text: "⥮ Specchi Verticale", i18n: "btn_mirror_vertical", titleI18n: "btn_mirror_vertical",
                onClick: (editor) => {
                    editor.mirrorSelected("v");
                }
            },
            { type: "button", id: "undoBtn", text: "⏪ Undo", i18n: "btn_undo", titleI18n: "btn_undo", onClick: (editor) => { editor.undo(); } },
            { type: "button", id: "redoBtn", text: "⏩ Redo", i18n: "btn_redo", titleI18n: "btn_redo", onClick: (editor) => { editor.redo(); } },
            {
                type: "button", id: "historyBtn", text: "📜 Storico", i18n: "btn_history", titleI18n: "btn_history", onClick: (editor) => {
                    editor.historyManager.show();
                }
            }
        ]
    },

    {
        legend: "toolbar_file",
        position: "top",
        fieldsetId: "fileControls",
        fieldsetClass: "toolbar-group",
        items: [
            { type: "input", id: "schemaTitle", placeholder: "Titolo schema", i18nPlaceholder: "placeholder_schema_title" },
            { type: "button", id: "saveBtn", text: "💾 Salva", i18n: "btn_save_schema", titleI18n: "btn_save_schema", onClick: (editor) => { editor.saveSchema(); } },
            { type: "button", id: "saveWorkOutBtn", text: "💾 Salva Allenamento", i18n: "btn_save_workout", titleI18n: "btn_save_workout", onClick: (editor) => { editor.workoutManager.show(); } },
            {
                type: "button", id: "loadBtn", text: "📁 Carica", i18n: "btn_load_schema", titleI18n: "btn_load_schema", onClick: (editor) => {
                    document.getElementById('fileInput').click();
                }
            },
            { type: "button", id: "loadWorkOutBtn", text: "📁 Carica Allenamento", i18n: "btn_load_workout", titleI18n: "btn_load_workout", onClick: (editor) => { document.getElementById('workoutFileInput').click(); } },
            { type: "file", id: "fileInput", accept: ".json", style: "display:none" },
            { type: "file", id: "workoutFileInput", accept: ".json", style: "display:none" },
            { type: "button", id: "exportBtn", text: "📤 Esporta", i18n: "btn_export_schema", titleI18n: "btn_export_schema", onClick: (editor) => { editor.exportSchema(); } },
            { type: "button", id: "exportWorkOutBtn", text: "📤 Genera la scheda", i18n: "btn_export_workout_sheet", titleI18n: "btn_export_workout_sheet", onClick: (editor) => { editor.exportWorkout(); } },
            {
                type: "button", id: "loadFromLibrary", text: "📁 Libreria", i18n: "btn_load_library", titleI18n: "btn_load_library", onClick: (editor) => {
                    editor.libraryManager.show();
                }
            }
        ]
    },

    {
        legend: "toolbar_user",
        position: "top",
        fieldsetId: "userControls",
        fieldsetClass: "toolbar-group",
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
    }];

const toolbarBottomConfig = [
    // -----------------------
    // BOTTOM TOOLBAR CONTROLS
    // -----------------------
    {
        legend: "toolbar_object_controls",
        position: "bottom",
        fixed: true,
        fieldsetId: "objectControls",
        fieldsetClass: "toolbar-group fixed form-grid",
        items: [
            { type: "input", inputType: "color", text: "Colore", label: "object_color", iconHTML: "🎨", id: "objectColor", class: "color-picker", i18n: "local_object_color_label", value: "#3498db", onClick: (editor, event) => { editor.changeSelectedObjectsColor(event.target.value) } },
            { type: "input", inputType: "range", text: "Opacità", label: "object_opacity", iconHTML: "⚪", id: "objectOpacity", i18n: "local_object_opacity_label", min: "0", max: "1", value: "1", step: "0.01", onInput: (editor, event) => { document.getElementById('objectOpacityValue').value = parseFloat(event.target.value).toFixed(2); editor.changeSelectedObjectsOpacity(event.target.value); } },
            { type: "input", inputType: "number", text: "Valore", label: "object_opacity_value", iconHTML: "🔢", id: "objectOpacityValue", class: "small-input", i18n: "local_object_opacity_value_label", min: "0", max: "1", step: "0.01", value: "1.00" },
            { type: "input", inputType: "text", text: "Testo", label: "object_text", iconHTML: "✏️", id: "objectText", i18nPlaceholder: "local_object_text_label", i18n: "local_object_text_label", placeholder: "Inserisci testo...", onInput: (editor, event) => { editor.changeSelectedObjectsText(event.target.value); } },
            { type: "input", inputType: "number", text: "Numero", label: "object_number", iconHTML: "🔢", id: "objectNumber", class: "small-input", i18n: "local_object_number_label", min: "1", onInput: (editor, event) => { editor.changeSelectedObjectsNumber(parseInt(event.target.value)); } },
            { type: "button", text: "Tratteggiato", label: "dashed_object_toggle", iconHTML: "⚡", id: "dashedObjectToggle", class: "toolbar-button", i18n: "local_dashed_object_toggle", onClick: (editor) => { editor.toggleSelectedObjectsDashed(); } },
            { type: "button", text: "Elimina", label: "delete_object", iconHTML: "🗑️", id: "deleteBtn", i18n: "local_delete_button", onClick: (editor) => { editor.deleteSelected(); } }
        ]
    },
    {
        legend: "toolbar_arrow_controls",
        position: "bottom",
        fixed: true,
        fieldsetId: "arrowControls",
        fieldsetClass: "toolbar-group fixed",
        items: [
            { type: "input", inputType: "color", text: "Colore", label: "arrow_color", iconHTML: "🎨", id: "arrowColor", class: "color-picker", i18n: "local_arrow_color_label" },
            {
                type: "input", inputType: "range", text: "Opacità", label: "arrow_opacity", iconHTML: "⚪", id: "arrowOpacity", i18n: "local_arrow_opacity_label", min: "0", max: "1", value: "1", step: "0.01",
                onInput: (editor, event) => {
                    document.getElementById('arrowOpacityValue').textContent = parseFloat(event.target.value).toFixed(2);
                    if (editor.selectedArrow) {
                        editor.changeArrowOpacity(event.target.value);
                    }
                }
            },
            { text: "0", id: "arrowOpacityValue" },
            {
                type: "input", inputType: "range", text: "Spessore", label: "arrow_thickness", iconHTML: "📏", id: "arrowThickness", i18n: "local_arrow_thickness_label", min: "0", max: "3", value: "1", step: "0.01",
                onInput: (editor, event) => {
                    document.getElementById('thicknessValue').textContent = event.target.value;
                    if (editor.selectedArrow) {
                        editor.changeArrowThickness(event.target.value);
                    }
                }
            },
            { text: "0", id: "thicknessValue" },
            { type: "button", text: "Lineare", label: "arrow_type_linear", iconHTML: "➡️", id: "arrowTypeLinear", class: "arrow-type-btn", i18n: "local_arrow_type_linear", onClick: (editor) => { editor.changeArrowType('linear'); } },
            { type: "button", text: "Curva", label: "arrow_type_curved", iconHTML: "➰", id: "arrowTypeCurved", class: "arrow-type-btn", i18n: "local_arrow_type_curved", onClick: (editor) => { editor.changeArrowType('curved'); } },
            { type: "button", text: "Zigzag", label: "arrow_type_zigzag", iconHTML: "⚡", id: "arrowTypeZigzag", class: "arrow-type-btn", i18n: "local_arrow_type_zigzag", onClick: (editor) => { editor.changeArrowType('zigzag'); } },
            { type: "button", text: "Tratteggiata", label: "dashed_arrow_toggle", iconHTML: "⚡", id: "dashedArrowToggle", class: "toolbar-button", i18n: "local_dashed_arrow_toggle", onClick: (editor) => { editor.toggleDashedArrow(); } },
            {
                type: "input", inputType: "checkbox", text: "Marker Inizio", label: "arrow_marker_start", iconHTML: "🔹", id: "arrowMarkerStart", i18n: "local_arrow_marker_start_label", onChange: (editor, event) => {
                    if (editor.selectedArrow) {
                        const arrowData = editor.getCurrentTab().arrows.get(editor.selectedArrow);
                        if (arrowData) {
                            arrowData.markerStart = event.target.checked;
                            const svgElement = document.getElementById(editor.selectedArrow);
                            if (svgElement) {
                                const path = svgElement.querySelector('.arrow-path');
                                const markerId = `arrowhead-${editor.selectedArrow}`;
                                if (path) {
                                    if (event.target.checked) {
                                        path.setAttribute('marker-start', `url(#${markerId}-start)`);
                                    } else {
                                        path.removeAttribute('marker-start');
                                    }
                                }
                            }
                            editor.saveState(`Modificato marker start freccia ${editor.selectedArrow} a ${event.target.checked}`);
                        }
                    }

                }
            },
            {
                type: "input", inputType: "checkbox", text: "Marker Fine", label: "arrow_marker_end", iconHTML: "🔹", id: "arrowMarkerEnd", i18n: "local_arrow_marker_end_label", onChange: (editor, event) => {
                    if (editor.selectedArrow) {
                        const arrowData = editor.getCurrentTab().arrows.get(editor.selectedArrow);
                        if (arrowData) {
                            arrowData.markerEnd = event.target.checked;
                            const svgElement = document.getElementById(editor.selectedArrow);
                            if (svgElement) {
                                const path = svgElement.querySelector('.arrow-path');
                                const markerId = `arrowhead-${editor.selectedArrow}`;
                                if (path) {
                                    if (event.target.checked) {
                                        path.setAttribute('marker-end', `url(#${markerId}-end)`);
                                    } else {
                                        path.removeAttribute('marker-end');
                                    }
                                }
                            }
                            editor.saveState(`Modificato marker end freccia ${editor.selectedArrow} a ${event.target.checked}`);
                        }
                    }
                }
            }
        ]
    },
    {
        legend: "toolbar_sprite_controls",
        position: "bottom",
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
        position: "bottom",
        fixed: true,
        fieldsetId: "freehandControls",
        fieldsetClass: "toolbar-group fixed",
        items: [
            { type: "input", inputType: "color", text: "Colore Traccia", label: "freehand_color", iconHTML: "🎨", id: "freehandColor", class: "color-picker", i18n: "local_freehand_color_label", onChange: (editor, event) => { editor.changeFreehandColor(event.target.value); } },
            {
                type: "input", inputType: "range", text: "Spessore", label: "freehand_thickness", iconHTML: "📏", id: "freehandThickness", i18n: "local_freehand_thickness_label", min: "1", max: "15", value: "3", onInput: (editor, event) => {
                    document.getElementById('freehandThicknessValue').textContent = event.target.value;
                    if (editor.selectedFreehand) {
                        editor.changeFreehandThickness(event.target.value);
                    }
                }
            },
            { type: "div", id: "freehandThicknessValue", class: "", html: "3" },
            {
                type: "input", inputType: "range", text: "Opacità", label: "freehand_opacity", iconHTML: "⚪", id: "freehandOpacity", i18n: "local_freehand_opacity_label", min: "0", max: "1", step: "0.01", onInput: (editor, event) => {
                    document.getElementById('freehandOpacityValue').textContent = parseFloat(event.target.value).toFixed(2);
                    if (editor.selectedFreehand) {
                        editor.changeFreehandOpacity(event.target.value);
                    }
                }
            },
            { type: "div", id: "freehandOpacityValue", class: "", html: "1.00" }
        ]
    },
    {
        legend: "toolbar_object_info",
        position: "bottom",
        fixed: true,
        fieldsetId: "objectInfo",
        fieldsetClass: "toolbar-group",
        items: [
            { text: "Nessun oggetto", label: "object_info", iconHTML: "❌", i18n: "local_no_object_selected" }
        ]
    }
];