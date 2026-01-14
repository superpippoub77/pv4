const sidebarConfig = [
    // ========== SIDEBAR SINISTRA ==========
    {
        title: "👥 Giocatori",
        active: true,
        controlType: "accordion",
        category: "volleyball-players",
        i18ncategory: "component_category_volleyball_players",
        i18ntitle: "component_title_volleyball_players",
        items: [
            { type: "player", text: "P1", label: "player_setter_1", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "L1", label: "player_libero_1", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "S1", label: "player_spiker_1", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "O1", label: "player_opposite_1", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "C1", label: "player_middle_1", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "All", label: "role_coach", iconHTML: "🧑‍🏫", category: "volleyball-players" },
            { type: "player", text: "Dir", label: "role_manager", iconHTML: "🧑‍💼", category: "volleyball-players" },
            { type: "player", text: "P2", label: "player_setter_2", color: "green", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "L2", label: "player_libero_2", color: "green", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "S2", label: "player_spiker_2", color: "green", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "O2", label: "player_opposite_2", color: "green", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "C2", label: "player_middle_2", color: "green", iconHTML: "🏃", category: "volleyball-players" },
            { type: "player", text: "A", label: "player_a", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
            { type: "player", text: "B", label: "player_b", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
            { type: "player", text: "C", label: "player_c", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
            { type: "player", text: "D", label: "player_d", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
            { type: "player", text: "E", label: "player_e", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
            { type: "player", text: "F", label: "player_f", color: "orange", iconHTML: "🏃‍♂️", category: "volleyball-players" },
        ]
    },

    {
        title: "🏐 Player",
        i18ncategory: "component_category_volleyball_player_actions",
        i18ntitle: "component_title_volleyball_player_actions",
        category: "volleyball-player-actions",
        controlType: "accordion",
        items: [
            { type: "volleyball-player-bagher", label: "action_bagher", iconHTML: "🏐", category: "volleyball-player-actions" },
        ]
    },

    {
        title: "🟩 Campi",
        i18ncategory: "component_category_volleyball_courts",
        i18ntitle: "component_title_volleyball_courts",
        category: "volleyball-courts",
        controlType: "accordion",
        items: [
            { type: "court", label: "court_full", iconHTML: "🟩", category: "volleyball-courts" },
            { type: "half-court", label: "court_half", iconHTML: "🟩", category: "volleyball-courts" },
        ]
    },

    {
        title: "🏐 Materiale",
        i18ncategory: "component_category_volleyball_materials",
        i18ntitle: "component_title_volleyball_materials",
        category: "volleyball-materials",
        controlType: "accordion",
        items: [
            { type: "ball", label: "material_ball", iconHTML: "🏐", category: "volleyball-materials" },
            { type: "mat", label: "material_mat", iconHTML: "🟩", category: "volleyball-materials" },
            { type: "net", label: "material_net", iconHTML: "🧵", category: "volleyball-materials" },
            { type: "brick", label: "material_brick", iconHTML: "🧱", category: "volleyball-materials" },
        ]
    },

    {
        title: "🔧 Strumenti",
        i18ncategory: "component_category_tools",
        i18ntitle: "component_title_tools",
        category: "tools",
        controlType: "accordion",
        items: [
            { type: "text", text: "Testo", label: "tool_text", iconHTML: "✏️", category: "tools" },
            { id: "arrowModeBtn", icon: "➡️", label: "tool_arrows", iconHTML: "arrowMode", category: "tools" }
        ]
    },

    {
        title: "🎨 Icone",
        i18ncategory: "component_category_icons",
        i18ntitle: "component_title_icons",
        category: "icons",
        controlType: "accordion",
        items: [
            { type: "icon", icon: "fa fa-heart", label: "icon_ball", category: "icons" },
            { type: "icon", icon: "fa fa-trophy", label: "icon_trophy", category: "icons" },
            { type: "icon", icon: "fa fa-medal", label: "icon_medal", category: "icons" },
            { type: "icon", icon: "fa fa-timer", label: "icon_stopwatch", category: "icons" },
            { type: "icon", icon: "fa fa-bullhorn", label: "icon_whistle", category: "icons" },
            { type: "icon", icon: "fa fa-arrow-up", label: "icon_arrow_up", category: "icons" },
            { type: "icon", icon: "fa fa-arrow-down", label: "icon_arrow_down", category: "icons" },
            { type: "icon", icon: "fa fa-arrow-left", label: "icon_arrow_left", category: "icons" },
            { type: "icon", icon: "fa fa-arrow-right", label: "icon_arrow_right", category: "icons" },
            { type: "icon", icon: "fa fa-star", label: "icon_star", category: "icons" },
            { type: "icon", icon: "fa fa-heart", label: "icon_heart", category: "icons" },
            { type: "icon", icon: "fa fa-check", label: "icon_check", category: "icons" },
            { type: "icon", icon: "fa fa-shopping-cart", label: "icon_cart", category: "icons" },
            { type: "icon", icon: "fa fa-hand-o-up", label: "icon_hands_holding", category: "icons" },
            { type: "icon", icon: "fa fa-times", label: "icon_times", category: "icons" },
            { type: "icon", icon: "fa fa-caret-up", label: "icon_cone", category: "icons" },
        ]
    },

    {
        title: "🖼️ Immagini SVG Locali",
        i18ncategory: "component_category_volleyball_local_images",
        i18ntitle: "component_title_volleyball_local_images",
        category: "volleyball-local-images",
        controlType: "accordion",
        items: [
            { type: "local-svg", src: "data/images/volleyball_ball.svg", label: "local_svg_volleyball_ball", iconHTML: "🏐", category: "volleyball-local-images" },
            { type: "local-svg", src: "data/images/player-bagher.png", label: "local_svg_player_bagher", iconHTML: "👤", category: "volleyball-local-images" },
            { type: "local-svg", src: "data/images/player-bagher-front.png", label: "local_svg_player_bagher_front", iconHTML: "👤", category: "volleyball-local-images" },
            { type: "local-svg", src: "data/images/player-jump-spike.png", label: "local_svg_player_spike", iconHTML: "🤾", category: "volleyball-local-images" },
            { type: "local-svg", src: "data/images/player-upball.png", label: "local_svg_player_upball", iconHTML: "🤾", category: "volleyball-local-images" },
        ]
    },

    {
        title: "🎬 Sprite Pallavolo",
        i18ncategory: "component_category_volleyball_sprites",
        i18ntitle: "component_title_volleyball_sprites",
        category: "volleyball-sprites",
        controlType: "accordion",
        items: [
            {
                type: "sprite",
                spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 0,
                width: 64, height: 64,
                label: "local_sprite_spike",
                iconHTML: "🏐",
                category: "volleyball-sprites"
            },
            {
                type: "sprite",
                spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 1,
                width: 32, height: 32,
                label: "local_sprite_bagher",
                iconHTML: "🤾",
                category: "volleyball-sprites"
            }
        ]
    },

    {
        title: "🖼️ Immagini 3D Locali",
        i18ncategory: "component_category_volleyball_local_3d_images",
        i18ntitle: "component_title_volleyball_local_3d_images",
        category: "volleyball-local-3d-images",
        controlType: "accordion",
        items: [
            { type: "object", src: "data/images/volleyball_ball.svg", model3d: "data/images/m3.glb", label: "local_m3_volleyball_ball", iconHTML: "🏐", category: "volleyball-local-3d-images" }
        ]
    }
];

// ========== SIDEBAR DESTRA CONFIGURAZIONE ==========
const rightSidebarConfig = [
    // ========== EXERCISE STEPS ==========
    {
        title: "📝 Step Esercizio",
        category: "exercise-steps",
        i18ncategory: "component_category_exercise_steps",
        i18ntitle: "local_exercise_steps_heading",
        controlType: "custom",
        render: (editor) => {
            return `
                <div class="exercise-steps">
                    <div class="steps-controls">
                        <input type="text" id="newStepInput" placeholder="Inserisci nuovo step...">
                        <button id="addStepBtn" data-i18n="local_add_step_button">➕ Aggiungi</button>
                    </div>
                    <button id="generateAISteps" data-i18n="local_generate_ai_steps_button"
                        style="width: 100%; margin: 10px 0; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✨ Genera Step con AI
                    </button>
                    <div id="stepsList" class="steps-list">
                        <!-- Gli step verranno inseriti qui dinamicamente -->
                    </div>
                </div>
            `;
        },
        init: (editor) => {
            // Event listener per aggiungi step
            document.getElementById('addStepBtn')?.addEventListener('click', () => {
                const i = editor.getCurrentTab().exerciseSteps.length;
                editor.editStep(i);
            });

            // Event listener per Enter su input
            document.getElementById('newStepInput')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const i = editor.getCurrentTab().exerciseSteps.length;
                    editor.editStep(i);
                }
            });

            // Event listener per genera AI
            document.getElementById('generateAISteps')?.addEventListener('click', () => {
                editor.generateBasicSteps();
            });
        }
    },

    // ========== WORKOUT DETAILS ==========
    {
        title: "📋 Dettagli Esercizio",
        category: "workout-details",
        i18ncategory: "component_category_workout_details",
        i18ntitle: "local_workout_details_heading",
        controlType: "custom",
        render: (editor) => {
            return `
                <div class="workout-details">
                    <div class="detail-row">
                        <div class="detail-field">
                            <label for="workoutDate">Data:</label>
                            <input type="date" id="workoutDate" placeholder="AAAA-MM-GG"
                                title="Seleziona la data" required>
                        </div>
                        <div class="detail-field">
                            <label for="workoutPlace" data-i18n="local_workout_place_label">Dove:</label>
                            <input type="text" id="workoutPlace">
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-field">
                            <label for="workoutGroups" data-i18n="local_workout_groups_label">Gruppo:</label>
                            <select id="workoutGroups" class="searchable-select">
                                <option value="*">All</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                            </select>
                        </div>
                        <div class="detail-field">
                            <label for="workoutRuolo" data-i18n="local_workout_role_label">Ruolo:</label>
                            <select id="workoutRuolo" class="searchable-select">
                                <option value="GEN">Generico</option>
                                <option value="L">Libero</option>
                                <option value="L1">Libero 1</option>
                                <option value="L2">Libero 2</option>
                                <option value="L+S">Libero + Schiacciatore</option>
                                <option value="L+A">Libero + Alzatore</option>
                                <option value="A">Alzatore</option>
                                <option value="S">Schiacciatore</option>
                                <option value="S1">Schiacciatore 1</option>
                                <option value="S2">Schiacciatore 2</option>
                                <option value="C">Centrale</option>
                                <option value="C1">Centrale 1</option>
                                <option value="C2">Centrale 2</option>
                                <option value="O">Opposto</option>
                            </select>
                        </div>
                    </div>

                    <div class="detail-row cols-4">
                        <div class="detail-field">
                            <label for="workoutSeries" data-i18n="local_workout_series_label">Serie:</label>
                            <input type="text" id="workoutSeries">
                        </div>
                        <div class="detail-field">
                            <label for="workoutNr" data-i18n="local_workout_reps_label">Ripetizioni:</label>
                            <input type="number" id="workoutNr" min="0" value="1">
                        </div>
                        <div class="detail-field">
                            <label for="workoutTiming" data-i18n="local_workout_duration_label">Durata (sec):</label>
                            <input type="number" id="workoutTiming" min="0" max="600" value="1">
                        </div>
                        <div class="detail-field">
                            <label for="workoutRec" data-i18n="local_workout_recovery_label">Recupero (sec):</label>
                            <input type="number" id="workoutRec" min="0" max="600" value="60">
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-field">
                            <label for="workoutPeriodo" data-i18n="local_workout_period_label">Periodo:</label>
                            <select id="workoutPeriodo" class="searchable-select">
                                <option value="GEN">Generico</option>
                                <option value="FIS">Preparazione fisica</option>
                                <option value="CAM">Campionato</option>
                                <option value="PRE">Pre-Campionato</option>
                                <option value="POS">Post-Campionato</option>
                            </select>
                        </div>
                        <div class="detail-field">
                            <label for="workoutTipologia" data-i18n="local_workout_typology_label">Tipologia:</label>
                            <select id="workoutTipologia" class="searchable-select">
                                <option value="GEN">Generico</option>
                                <option value="ANA">Analitico</option>
                                <option value="SIN">Sintetico</option>
                                <option value="GLO">Globale</option>
                            </select>
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-field">
                            <label for="workoutGenere" data-i18n="local_workout_gender_label">Genere:</label>
                            <select id="workoutGenere" class="searchable-select">
                                <option value="GEN">Generico</option>
                                <option value="MIS">Misto</option>
                                <option value="M">Maschile</option>
                                <option value="F">Femminile</option>
                            </select>
                        </div>
                        <div class="detail-field">
                            <label for="workoutCategoria" data-i18n="local_workout_category_label">Categoria:</label>
                            <select id="workoutCategoria" class="searchable-select">
                                <optgroup label="🎯 Generica">
                                    <option value="GEN">Generico</option>
                                </optgroup>
                                <optgroup label="👶 Giovanili Maschili">
                                    <option value="U12M">Under 12 M</option>
                                    <option value="U13M">Under 13 M</option>
                                    <option value="U14M">Under 14 M</option>
                                    <option value="U15M">Under 15 M</option>
                                    <option value="U16M">Under 16 M</option>
                                    <option value="U17M">Under 17 M</option>
                                    <option value="U18M">Under 18 M</option>
                                    <option value="U19M">Under 19 M</option>
                                </optgroup>
                                <optgroup label="👧 Giovanili Femminili">
                                    <option value="U12F">Under 12 F</option>
                                    <option value="U13F">Under 13 F</option>
                                    <option value="U14F">Under 14 F</option>
                                    <option value="U16F">Under 16 F</option>
                                    <option value="U18F">Under 18 F</option>
                                </optgroup>
                                <optgroup label="🏆 Senior Maschili">
                                    <option value="A1M">Superlega (A1) M</option>
                                    <option value="A2M">Serie A2 M</option>
                                    <option value="A3M">Serie A3 M</option>
                                    <option value="BM">Serie B M</option>
                                    <option value="CM">Serie C M</option>
                                    <option value="DM">Serie D M</option>
                                    <option value="1DM">Prima Divisione M</option>
                                    <option value="2DM">Seconda Divisione M</option>
                                    <option value="3DM">Terza Divisione M</option>
                                </optgroup>
                                <optgroup label="🏐 Senior Femminili">
                                    <option value="A1F">Serie A1 F</option>
                                    <option value="A2F">Serie A2 F</option>
                                    <option value="A3F">Serie A3 F</option>
                                    <option value="B1F">Serie B1 F</option>
                                    <option value="B2F">Serie B2 F</option>
                                    <option value="CF">Serie C F</option>
                                    <option value="DF">Serie D F</option>
                                    <option value="1DF">Prima Divisione F</option>
                                    <option value="2DF">Seconda Divisione F</option>
                                    <option value="3DF">Terza Divisione F</option>
                                </optgroup>
                                <optgroup label="🌊 Altri">
                                    <option value="BEACH">Beach Volley</option>
                                    <option value="SNOW">Snow Volley</option>
                                    <option value="CSI">CSI/UISP</option>
                                    <option value="SCO">Scolastico</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div class="detail-field">
                        <label for="workoutDescrizione" data-i18n="local_workout_notes_label">Note:</label>
                        <textarea id="workoutDescrizione" placeholder="Inserisci note sull'allenamento..."></textarea>
                    </div>

                    <div class="detail-field">
                        <label for="workoutAutore" data-i18n="local_workout_author_label">Autore:</label>
                        <input type="text" id="workoutAutore" readonly
                            style="background: #95a5a6; cursor: not-allowed; border:none; width:100%;">
                    </div>
                </div>
            `;
        },
        init: (editor) => {
            // Event listeners per i campi
            const fields = [
                { id: 'workoutPeriodo', prop: 'periodo' },
                { id: 'workoutRuolo', prop: 'ruolo' },
                { id: 'workoutTipologia', prop: 'tipologia' },
                { id: 'workoutDescrizione', prop: 'descrizione' },
                { id: 'workoutGenere', prop: 'genere' },
                { id: 'workoutCategoria', prop: 'categoria' },
                { id: 'workoutDate', prop: 'date' },
                { id: 'workoutPlace', prop: 'place' },
                { id: 'workoutNr', prop: 'nr' },
                { id: 'workoutSeries', prop: 'series' },
                { id: 'workoutGroups', prop: 'groups' },
                { id: 'workoutTiming', prop: 'timing' },
                { id: 'workoutRec', prop: 'rec' }
            ];

            fields.forEach(({ id, prop }) => {
                const element = document.getElementById(id);
                if (!element) return;

                const eventType = element.tagName === 'SELECT' ? 'change' : 'input';
                element.addEventListener(eventType, (e) => {
                    const tab = editor.getCurrentTab();
                    if (prop === 'nr' || prop === 'series' || prop === 'groups' || prop === 'timing' || prop === 'rec') {
                        tab[prop] = parseInt(e.target.value) || (prop === 'timing' ? 10 : (prop === 'rec' ? 60 : 1));
                    } else {
                        tab[prop] = e.target.value;
                    }

                    // Filtro categorie se cambia genere
                    if (prop === 'genere') {
                        editor.filterCategoriesByGenere(e.target.value);
                    }
                });
            });

            // Enhance selects with a simple searchable input (for better UX)
            try {
                const enhanceSearchableSelect = (sel) => {
                    if (!sel || sel._searchableInit) return;
                    sel._searchableInit = true;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'searchable-select-container';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'Cerca...';
                    input.className = 'searchable-filter';

                    const suggestions = document.createElement('div');
                    suggestions.className = 'searchable-suggestions';
                    suggestions.style.display = 'none';
                    // Position suggestions absolutely so they don't push the layout down
                    suggestions.style.position = 'absolute';
                    suggestions.style.left = '0';
                    suggestions.style.top = '100%';
                    suggestions.style.width = '100%';
                    suggestions.style.maxHeight = '240px';
                    suggestions.style.overflowY = 'auto';
                    suggestions.style.zIndex = 9999;
                    // Basic visual defaults (can be overridden via CSS)
                    suggestions.style.background = '#fff';
                    suggestions.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

                    sel.parentNode.insertBefore(wrapper, sel);
                    // place input first
                    wrapper.appendChild(input);

                    // make wrapper positioned so we can place the clear button inside the input area
                    wrapper.style.position = 'relative';
                    // give the input extra right padding to avoid overlap with the clear button
                    input.style.paddingRight = '30px';

                    // Add a clear button (single visible box UX) to reset the input/select
                    const clearBtn = document.createElement('button');
                    clearBtn.type = 'button';
                    clearBtn.className = 'searchable-clear';
                    clearBtn.title = 'Clear';
                    clearBtn.innerHTML = '✖';
                    clearBtn.style.display = 'none';
                    // visually place the clear button inside the input (absolute positioned)
                    clearBtn.style.position = 'absolute';
                    clearBtn.style.right = '8px';
                    clearBtn.style.top = '50%';
                    clearBtn.style.transform = 'translateY(-50%)';
                    clearBtn.style.border = 'none';
                    clearBtn.style.background = 'transparent';
                    clearBtn.style.cursor = 'pointer';
                    clearBtn.style.padding = '0';
                    clearBtn.style.fontSize = '12px';
                    clearBtn.style.lineHeight = '1';

                    // append clear button after input so it's inside the wrapper
                    wrapper.appendChild(clearBtn);

                    // suggestions go after the clear button
                    wrapper.appendChild(suggestions);
                    // keep native select in DOM but hidden
                    wrapper.appendChild(sel);
                    sel.style.display = 'none';

                    // Initialize input with currently selected option text (if any)
                    const initialOpt = sel.options[sel.selectedIndex];
                    if (initialOpt) {
                        input.value = initialOpt.textContent.trim();
                        clearBtn.style.display = input.value ? 'inline-block' : 'none';
                    }

                    // Build flat list of options (preserve optgroup label)
                    const getOptionsList = () => {
                        const list = [];
                        sel.querySelectorAll('option, optgroup').forEach(node => {
                            if (node.tagName.toLowerCase() === 'optgroup') {
                                const label = node.label || '';
                                node.querySelectorAll('option').forEach(opt => {
                                    list.push({ text: opt.textContent.trim(), value: opt.value, group: label });
                                });
                            } else if (node.tagName.toLowerCase() === 'option') {
                                list.push({ text: node.textContent.trim(), value: node.value, group: '' });
                            }
                        });
                        return list;
                    };

                    let optionList = getOptionsList();

                    const renderSuggestions = (q) => {
                        suggestions.innerHTML = '';

                        // If q is empty (focus without typing), show top options
                        const matches = (q && q.length > 0)
                            ? optionList.filter(opt => opt.text.toLowerCase().includes(q)).slice(0, 12)
                            : optionList.slice(0, 12);

                        if (matches.length === 0) {
                            suggestions.style.display = 'none';
                            return;
                        }

                        matches.forEach((m, idx) => {
                            const item = document.createElement('div');
                            item.className = 'searchable-suggestion';
                            item.tabIndex = 0;
                            item.dataset.value = m.value;
                            item.textContent = m.group ? `${m.text} · ${m.group}` : m.text;
                            item.addEventListener('click', (e) => {
                                e.preventDefault();
                                selectOption(m.value, m.text);
                            });
                            item.addEventListener('keydown', (ev) => {
                                if (ev.key === 'Enter') {
                                    ev.preventDefault();
                                    selectOption(m.value, m.text);
                                }
                            });
                            suggestions.appendChild(item);
                        });
                        suggestions.style.display = 'block';
                    };

                    const selectOption = (value, text) => {
                        sel.value = value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        input.value = text;
                        suggestions.style.display = 'none';
                        // show clear button when a value is selected
                        clearBtn.style.display = 'inline-block';
                    };

                    // Keyboard navigation support
                    let focusedIndex = -1;
                    input.addEventListener('keydown', (ev) => {
                        const items = Array.from(suggestions.querySelectorAll('.searchable-suggestion'));
                        if (!items.length) return;
                        if (ev.key === 'ArrowDown') {
                            ev.preventDefault();
                            focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
                            items.forEach(i => i.classList.remove('focused'));
                            items[focusedIndex].classList.add('focused');
                            items[focusedIndex].focus();
                        } else if (ev.key === 'ArrowUp') {
                            ev.preventDefault();
                            focusedIndex = Math.max(focusedIndex - 1, 0);
                            items.forEach(i => i.classList.remove('focused'));
                            items[focusedIndex].classList.add('focused');
                            items[focusedIndex].focus();
                        } else if (ev.key === 'Enter') {
                            if (focusedIndex >= 0 && items[focusedIndex]) {
                                ev.preventDefault();
                                items[focusedIndex].click();
                            }
                        } else {
                            focusedIndex = -1;
                        }
                    });

                    // Input -> update suggestions
                    input.addEventListener('input', () => {
                        const q = input.value.trim().toLowerCase();
                        optionList = getOptionsList();
                        renderSuggestions(q);
                        // Toggle clear button visibility
                        clearBtn.style.display = input.value ? 'inline-block' : 'none';
                    });

                    // Show suggestions when the input receives focus (single visible box behavior)
                    input.addEventListener('focus', () => {
                        optionList = getOptionsList();
                        renderSuggestions('');
                    });

                    // Clear button behavior: reset input and select
                    clearBtn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        input.value = '';
                        // Try to reset native select to no selection; if empty value not present,
                        // this will leave the select unchanged — we still dispatch change so consumers react.
                        try {
                            sel.value = '';
                        } catch (e) {
                            // ignore
                        }
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        suggestions.style.display = 'none';
                        clearBtn.style.display = 'none';
                        input.focus();
                    });

                    // Close suggestions when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!wrapper.contains(e.target)) {
                            suggestions.style.display = 'none';
                        }
                    });
                };

                document.querySelectorAll('.workout-details .searchable-select').forEach(sel => enhanceSearchableSelect(sel));
            } catch (e) {
                console.warn('searchable-select init failed', e);
            }
        }
    }
];