const sidebarConfig = [
    {
        title: "👥 Giocatori",
        active: true,
        items: [
            { type: "player", text: "P1", label: "player_setter_1", iconHTML: "👤" },
            { type: "player", text: "L1", label: "player_libero_1", iconHTML: "👤" },
            { type: "player", text: "S1", label: "player_spiker_1", iconHTML: "👤" },
            { type: "player", text: "O1", label: "player_opposite_1", iconHTML: "👤" },
            { type: "player", text: "C1", label: "player_middle_1", iconHTML: "👤" },
            { type: "player", text: "All", label: "role_coach", iconHTML: "🧑‍🏫" },
            { type: "player", text: "Dir", label: "role_manager", iconHTML: "🧑‍💼" },
            { type: "player", text: "P2", label: "player_setter_2", color: "green", iconHTML: "👤" },
            { type: "player", text: "L2", label: "player_libero_2", color: "green", iconHTML: "👤" },
            { type: "player", text: "S2", label: "player_spiker_2", color: "green", iconHTML: "👤" },
            { type: "player", text: "O2", label: "player_opposite_2", color: "green", iconHTML: "👤" },
            { type: "player", text: "C2", label: "player_middle_2", color: "green", iconHTML: "👤" },
            { type: "player", text: "A", label: "player_a", color: "orange", iconHTML: "🟠" },
            { type: "player", text: "B", label: "player_b", color: "orange", iconHTML: "🟠" },
            { type: "player", text: "C", label: "player_c", color: "orange", iconHTML: "🟠" },
            { type: "player", text: "D", label: "player_d", color: "orange", iconHTML: "🟠" },
            { type: "player", text: "E", label: "player_e", color: "orange", iconHTML: "🟠" },
            { type: "player", text: "F", label: "player_f", color: "orange", iconHTML: "🟠" },
        ]
    },

    {
        title: "🏟️ Player",
        items: [
            { type: "volleyball-player-bagher", label: "action_bagher", iconHTML: "🏐" },
        ]
    },

    {
        title: "🏟️ Campi",
        items: [
            { type: "court", label: "court_full", iconHTML: "🏟️" },
            { type: "half-court", label: "court_half", iconHTML: "🏟️" },
        ]
    },

    {
        title: "🏐 Materiale",
        items: [
            { type: "ball", label: "material_ball", iconHTML: "🏐" },
            { type: "mat", label: "material_mat", iconHTML: "🟩" },
            { type: "net", label: "material_net", iconHTML: "🧵" },
            { type: "brick", label: "material_brick", iconHTML: "🧱" },
        ]
    },

    {
        title: "🔧 Strumenti",
        items: [
            { type: "text", text: "Testo", label: "tool_text", iconHTML: "✏️" },
            { id: "arrowModeBtn", icon: "➡️", label: "tool_arrows", iconHTML: "arrowMode" }
        ]
    },

    {
        title: "🎨 Icone",
        items: [
            { type: "icon", icon: "⭐", label: "icon_ball" },
            { type: "icon", icon: "🏆", label: "icon_trophy" },
            { type: "icon", icon: "🎖️", label: "icon_medal" },
            { type: "icon", icon: "⏱️", label: "icon_stopwatch" },
            { type: "icon", icon: "📢", label: "icon_whistle" },
            { type: "icon", icon: "⬆️", label: "icon_arrow_up" },
            { type: "icon", icon: "⬇️", label: "icon_arrow_down" },
            { type: "icon", icon: "⬅️", label: "icon_arrow_left" },
            { type: "icon", icon: "➡️", label: "icon_arrow_right" },
            { type: "icon", icon: "⭐", label: "icon_star" },
            { type: "icon", icon: "❤️", label: "icon_heart" },
            { type: "icon", icon: "✔️", label: "icon_check" },
            { type: "icon", icon: "🛒", label: "icon_cart" },
            { type: "icon", icon: "🤝", label: "icon_hands_holding" },
            { type: "icon", icon: "❌", label: "icon_times" },
            { type: "icon", icon: "🔺", label: "icon_cone" },
        ]
    },

    {
        title: "🖼️ Immagini SVG Locali",
        items: [
            { type: "local-svg", src: "data/images/volleyball_ball.svg", label: "local_svg_volleyball_ball", iconHTML: "🏐" },
            { type: "local-svg", src: "data/images/player-bagher.png", label: "local_svg_player_bagher", iconHTML: "👤" },
            { type: "local-svg", src: "data/images/player-bagher-front.png", label: "local_svg_player_bagher_front", iconHTML: "👤" },
            { type: "local-svg", src: "data/images/player-jump-spike.png", label: "local_svg_player_spike", iconHTML: "🤾" },
            { type: "local-svg", src: "data/images/player-upball.png", label: "local_svg_player_upball", iconHTML: "🤾" },
        ]
    },

    {
        title: "🎬 Sprite Pallavolo",
        items: [
            {
                type: "sprite",
                spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 0,
                width: 64, height: 64,
                label: "local_sprite_spike",
                iconHTML: "🏐"
            },
            {
                type: "sprite",
                spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 1,
                width: 32, height: 32,
                label: "local_sprite_bagher",
                iconHTML: "🤾"
            }
        ]
    },
];
