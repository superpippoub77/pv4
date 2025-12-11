const sidebarConfig = [
    {
        title: "👥 Giocatori",
        active: true,
        controlType: "accordion",
        category: "volleyball-players",
        i18ncategory: "component_category_volleyball_players",
        i18ntitle: "component_title_volleyball_players",
        items: [
            { type: "player", text: "P1", label: "player_setter_1", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "L1", label: "player_libero_1", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "S1", label: "player_spiker_1", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "O1", label: "player_opposite_1", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "C1", label: "player_middle_1", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "All", label: "role_coach", iconHTML: "🧑‍🏫", category: "volleyball-players" },
            { type: "player", text: "Dir", label: "role_manager", iconHTML: "🧑‍💼", category: "volleyball-players" },
            { type: "player", text: "P2", label: "player_setter_2", color: "green", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "L2", label: "player_libero_2", color: "green", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "S2", label: "player_spiker_2", color: "green", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "O2", label: "player_opposite_2", color: "green", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "C2", label: "player_middle_2", color: "green", iconHTML: "👤", category: "volleyball-players" },
            { type: "player", text: "A", label: "player_a", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
            { type: "player", text: "B", label: "player_b", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
            { type: "player", text: "C", label: "player_c", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
            { type: "player", text: "D", label: "player_d", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
            { type: "player", text: "E", label: "player_e", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
            { type: "player", text: "F", label: "player_f", color: "orange", iconHTML: "🟠", category: "volleyball-players" },
        ]
    },

    // Esempio di categoria con ACCORDION
    {
        title: "🎯 Filtri e Ricerca",
        category: "filters",
        i18ncategory: "component_category_filters",
        i18ntitle: "component_title_filters",
        controlType: "accordion", // Specifica che è un accordion
        active: false,
        items: [
            {
                controlType: "search",
                id: "playerSearch",
                placeholder: "Cerca giocatore...",
                label: "search_player",
                onInput: (value) => console.log("Ricerca:", value)
            },
            {
                controlType: "select",
                id: "teamFilter",
                label: "filter_team",
                options: [
                    { value: "", text: "Tutti i team" },
                    { value: "team1", text: "Team 1" },
                    { value: "team2", text: "Team 2" }
                ],
                onChange: (value) => console.log("Team selezionato:", value)
            }
        ]
    },

    // Esempio di categoria con BUTTON
    {
        title: "⚡ Azioni Rapide",
        category: "quick-actions",
        i18ncategory: "component_category_quick_actions",
        i18ntitle: "component_title_quick_actions",
        controlType: "buttons", // Specifica che contiene bottoni
        items: [
            {
                controlType: "button",
                id: "clearCanvas",
                text: "Pulisci Canvas",
                label: "button_clear_canvas",
                icon: "🗑️",
                className: "btn-danger",
                onClick: () => console.log("Canvas pulito")
            },
            {
                controlType: "button",
                id: "saveSchema",
                text: "Salva Schema",
                label: "button_save_schema",
                icon: "💾",
                className: "btn-primary",
                onClick: () => console.log("Schema salvato")
            },
            {
                controlType: "button",
                id: "exportPDF",
                text: "Esporta PDF",
                label: "button_export_pdf",
                icon: "📄",
                className: "btn-success",
                onClick: () => console.log("PDF esportato")
            }
        ]
    },

    // Esempio con TEXTAREA e INPUT
    {
        title: "📝 Note e Impostazioni",
        category: "notes",
        i18ncategory: "component_category_notes",
        i18ntitle: "component_title_notes",
        active: false,
        items: [
            {
                controlType: "textarea",
                id: "schemaDescription",
                placeholder: "Descrizione dello schema...",
                label: "textarea_description",
                rows: 4,
                onInput: (value) => console.log("Descrizione:", value)
            },
            {
                controlType: "input",
                id: "schemaTitle",
                type: "text",
                placeholder: "Titolo schema",
                label: "input_schema_title",
                onInput: (value) => console.log("Titolo:", value)
            },
            {
                controlType: "select",
                id: "difficulty",
                label: "select_difficulty",
                options: [
                    { value: "easy", text: "Facile" },
                    { value: "medium", text: "Medio" },
                    { value: "hard", text: "Difficile" }
                ],
                onChange: (value) => console.log("Difficoltà:", value)
            }
        ]
    },

    {
        title: "🏐️ Player",
        i18ncategory: "component_category_volleyball_player_actions",
        i18ntitle: "component_title_volleyball_player_actions",
        category: "volleyball-player-actions",
        items: [
            { type: "volleyball-player-bagher", label: "action_bagher", iconHTML: "🏐", category: "volleyball-player-actions" },
        ]
    },

    {
        title: "🏟️ Campi",
        i18ncategory: "component_category_volleyball_courts",
        i18ntitle: "component_title_volleyball_courts",
        category: "volleyball-courts",
        items: [
            { type: "court", label: "court_full", iconHTML: "🏟️", category: "volleyball-courts" },
            { type: "half-court", label: "court_half", iconHTML: "🏟️", category: "volleyball-courts" },
        ]
    },

    {
        title: "🏐 Materiale",
        i18ncategory: "component_category_volleyball_materials",
        i18ntitle: "component_title_volleyball_materials",
        category: "volleyball-materials",
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
        items: [
            { type: "icon", icon: "⭐", label: "icon_ball", category: "icons" },
            { type: "icon", icon: "🏆", label: "icon_trophy", category: "icons" },
            { type: "icon", icon: "🎖️", label: "icon_medal", category: "icons" },
            { type: "icon", icon: "⏱️", label: "icon_stopwatch", category: "icons" },
            { type: "icon", icon: "📢", label: "icon_whistle", category: "icons" },
            { type: "icon", icon: "⬆️", label: "icon_arrow_up", category: "icons" },
            { type: "icon", icon: "⬇️", label: "icon_arrow_down", category: "icons" },
            { type: "icon", icon: "⬅️", label: "icon_arrow_left", category: "icons" },
            { type: "icon", icon: "➡️", label: "icon_arrow_right", category: "icons" },
            { type: "icon", icon: "⭐", label: "icon_star", category: "icons" },
            { type: "icon", icon: "❤️", label: "icon_heart", category: "icons" },
            { type: "icon", icon: "✔️", label: "icon_check", category: "icons" },
            { type: "icon", icon: "🛑", label: "icon_cart", category: "icons" },
            { type: "icon", icon: "🤝", label: "icon_hands_holding", category: "icons" },
            { type: "icon", icon: "❌", label: "icon_times", category: "icons" },
            { type: "icon", icon: "🔺", label: "icon_cone", category: "icons" },
        ]
    },

    {
        title: "🖼️ Immagini SVG Locali",
        i18ncategory: "component_category_volleyball_local_images",
        i18ntitle: "component_title_volleyball_local_images",
        category: "volleyball-local-images",
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
];