// =======================================================================
// SIDEBAR SINISTRA
// -----------------------------------------------------------------------
// - I colori sono SEMPRE in formato #rrggbb (il color picker non accetta
//   nomi come "orange": era la causa del colore non modificabile).
// - Click su un elemento = lo aggiunge al centro del foglio;
//   trascinamento = lo posiziona dove lo rilasci.
// - Frecce, disegno e tratteggio sono nella toolbar (gruppo Strumenti).
// =======================================================================
const TEAM_A_COLOR = "#3498db";   // blu
const TEAM_B_COLOR = "#2ecc71";   // verde
const GENERIC_COLOR = "#e67e22";  // arancione
const STAFF_COLOR = "#7f8c8d";    // grigio

// Dimensioni naturali (px) dei disegni "schizzo": l'oggetto nasce in scala 0,5
const SKETCH_SIZES = {
    "campo.svg": [764, 848], "campo-prospettiva.svg": [760, 527], "campo-sbieco.svg": [860, 460], "campo-diagonale.svg": [760, 489],
    "attaccante.svg": [88, 134], "muro.svg": [86, 91],
    "difensore-1.svg": [64, 61], "difensore-2.svg": [72, 58], "difensore-3.svg": [57, 73], "difensore-4.svg": [54, 70],
    "pallone.svg": [50, 33]
};
const SKETCH_SCALE = 0.5;
// Disegni a colori di palestra e pallavolo (data/images/gym, rigenerabili con scripts/gym-svg.py)
const GYM_SIZES = { "pallone.svg": [64, 64], "pallone-azzurro.svg": [64, 64], "carrello-palloni.svg": [120, 116], "cesto-palloni.svg": [110, 90], "cono.svg": [56, 74], "cinesino.svg": [76, 42], "cinesino-rosso.svg": [76, 42], "ostacolo.svg": [110, 74], "cerchio.svg": [100, 52], "scaletta.svg": [64, 190], "palla-medica.svg": [66, 66], "manubrio.svg": [120, 50], "kettlebell.svg": [64, 74], "step.svg": [120, 84], "pedana.svg": [150, 96], "materassino.svg": [150, 74], "panca.svg": [170, 64], "elastico.svg": [110, 60], "corda.svg": [110, 80], "fischietto.svg": [96, 62], "cronometro.svg": [72, 84], "lavagnetta.svg": [96, 128], "borraccia.svg": [44, 104], "asciugamano.svg": [90, 64], "seggiolone.svg": [100, 170], "tabellone.svg": [150, 96], "paletta-cambio.svg": [54, 116], "bersaglio.svg": [110, 62], "lanciapalloni.svg": [130, 120], "antenna.svg": [30, 150], "ginocchiere.svg": [110, 64], "scarpa.svg": [120, 62], "maglia.svg": [100, 96] };
const GYM_SCALE = 0.5;
const gymIcon = (name) => `<img src="data/images/gym/${name}.svg" alt="" style="width:28px;height:28px;object-fit:contain">`;
// miniatura su carta chiara (il disegno è a inchiostro scuro, invisibile sul tema scuro)
const sketchIcon = (name) => `<img src="data/images/sketch/${name}.svg" alt="" style="width:28px;height:28px;object-fit:contain;background:#f5f1e6;border-radius:4px;padding:1px">`;

const sidebarConfig = [
    {
        title: "🔵 Squadra A",
        active: true,
        controlType: "accordion",
        category: "volleyball-players",
        i18ntitle: "sb_team_a",
        items: [
            { type: "player", text: "P1", label: "player_setter_1", color: TEAM_A_COLOR, iconHTML: "🏃" },
            { type: "player", text: "S1", label: "player_spiker_1", color: TEAM_A_COLOR, iconHTML: "🏃" },
            { type: "player", text: "C1", label: "player_middle_1", color: TEAM_A_COLOR, iconHTML: "🏃" },
            { type: "player", text: "O1", label: "player_opposite_1", color: TEAM_A_COLOR, iconHTML: "🏃" },
            { type: "player", text: "L1", label: "player_libero_1", color: TEAM_A_COLOR, iconHTML: "🏃" },
        ]
    },
    {
        title: "🟢 Squadra B",
        active: true,
        controlType: "accordion",
        category: "volleyball-players",
        i18ntitle: "sb_team_b",
        items: [
            { type: "player", text: "P2", label: "player_setter_2", color: TEAM_B_COLOR, iconHTML: "🏃" },
            { type: "player", text: "S2", label: "player_spiker_2", color: TEAM_B_COLOR, iconHTML: "🏃" },
            { type: "player", text: "C2", label: "player_middle_2", color: TEAM_B_COLOR, iconHTML: "🏃" },
            { type: "player", text: "O2", label: "player_opposite_2", color: TEAM_B_COLOR, iconHTML: "🏃" },
            { type: "player", text: "L2", label: "player_libero_2", color: TEAM_B_COLOR, iconHTML: "🏃" },
        ]
    },
    {
        title: "🟠 Generici e staff",
        active: true,
        controlType: "accordion",
        category: "volleyball-players",
        i18ntitle: "sb_generic_staff",
        items: [
            { type: "player", text: "A", label: "player_a", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "B", label: "player_b", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "C", label: "player_c", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "D", label: "player_d", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "E", label: "player_e", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "F", label: "player_f", color: GENERIC_COLOR, iconHTML: "🏃‍♂️" },
            { type: "player", text: "All", label: "role_coach", color: STAFF_COLOR, iconHTML: "🧑‍🏫" },
            { type: "player", text: "Dir", label: "role_manager", color: STAFF_COLOR, iconHTML: "🧑‍💼" },
        ]
    },
    {
        title: "🏐 Campo e materiale",
        controlType: "accordion",
        category: "volleyball-courts",
        i18ntitle: "sb_court_material",
        items: [
            { type: "court", label: "court_full", iconHTML: "🟩" },
            { type: "half-court", label: "court_half", iconHTML: "◧" },
            { type: "net", label: "material_net", iconHTML: "🧵" },
            { type: "ball", label: "material_ball", iconHTML: "🏐" },
            { type: "local-svg", src: "data/images/volleyball_ball.svg", label: "local_svg_volleyball_ball", iconHTML: "⚪" },
            { type: "object", src: "data/images/volleyball_ball.svg", model3d: "data/images/m3.glb", label: "local_m3_volleyball_ball", iconHTML: "🧊" },
            { type: "mat", label: "material_mat", iconHTML: "🟦" },
            { type: "brick", label: "material_brick", iconHTML: "🧱" },
            { type: "icon", icon: "fa fa-caret-up", label: "icon_cone" },
        ]
    },
    {
        title: "🤾 Figure giocatore",
        controlType: "accordion",
        category: "volleyball-figures",
        i18ntitle: "sb_player_figures",
        items: [
            { type: "volleyball-player-bagher", label: "action_bagher", iconHTML: "🏐" },
            { type: "local-svg", src: "data/images/player-bagher.png", label: "local_svg_player_bagher" },
            { type: "local-svg", src: "data/images/player-bagher-front.png", label: "local_svg_player_bagher_front" },
            { type: "local-svg", src: "data/images/player-jump-spike.png", label: "local_svg_player_spike" },
            { type: "local-svg", src: "data/images/player-upball.png", label: "local_svg_player_upball" },
            {
                type: "sprite", spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 0, width: 32, height: 32, label: "local_sprite_spike"
            },
            {
                type: "sprite", spriteSheet: "data/images/sprites/volleyball-actions.png",
                cols: 4, rows: 2, frame: 1, width: 32, height: 32, label: "local_sprite_bagher"
            }
        ]
    },
    {
        // Disegni a mano in stile "schizzo" (SVG vettoriali, senza filtro colore)
        title: "✍️ Stile schizzo",
        controlType: "accordion",
        category: "volleyball-figures",
        i18ntitle: "sb_sketch",
        items: [
            { type: "sketch", src: "data/images/sketch/campo.svg", label: "sketch_court", iconHTML: sketchIcon("campo") },
            { type: "sketch", src: "data/images/sketch/campo-prospettiva.svg", label: "sketch_court_perspective", iconHTML: sketchIcon("campo-prospettiva") },
            { type: "sketch", src: "data/images/sketch/campo-sbieco.svg", label: "sketch_court_side", iconHTML: sketchIcon("campo-sbieco") },
            { type: "sketch", src: "data/images/sketch/campo-diagonale.svg", label: "sketch_court_diagonal", iconHTML: sketchIcon("campo-diagonale") },
            { type: "sketch", src: "data/images/sketch/attaccante.svg", label: "sketch_spiker", iconHTML: sketchIcon("attaccante") },
            { type: "sketch", src: "data/images/sketch/muro.svg", label: "sketch_block", iconHTML: sketchIcon("muro") },
            { type: "sketch", src: "data/images/sketch/difensore-1.svg", label: "sketch_defender_1", iconHTML: sketchIcon("difensore-1") },
            { type: "sketch", src: "data/images/sketch/difensore-2.svg", label: "sketch_defender_2", iconHTML: sketchIcon("difensore-2") },
            { type: "sketch", src: "data/images/sketch/difensore-3.svg", label: "sketch_defender_3", iconHTML: sketchIcon("difensore-3") },
            { type: "sketch", src: "data/images/sketch/difensore-4.svg", label: "sketch_defender_4", iconHTML: sketchIcon("difensore-4") },
            { type: "sketch", src: "data/images/sketch/pallone.svg", label: "sketch_ball", iconHTML: sketchIcon("pallone") }
        ]
    },
    {
        // Attrezzi di palestra e materiale da pallavolo: disegni vettoriali a colori, in 2D e in 3D
        title: "🏋️ Palestra e pallavolo",
        controlType: "accordion",
        category: "volleyball-courts",
        i18ntitle: "sb_gym",
        items: [
            { type: "gym", src: "data/images/gym/pallone.svg", label: "gym_pallone", iconHTML: gymIcon("pallone") },
            { type: "gym", src: "data/images/gym/pallone-azzurro.svg", label: "gym_pallone_azzurro", iconHTML: gymIcon("pallone-azzurro") },
            { type: "gym", src: "data/images/gym/carrello-palloni.svg", label: "gym_carrello_palloni", iconHTML: gymIcon("carrello-palloni") },
            { type: "gym", src: "data/images/gym/cesto-palloni.svg", label: "gym_cesto_palloni", iconHTML: gymIcon("cesto-palloni") },
            { type: "gym", src: "data/images/gym/lanciapalloni.svg", label: "gym_lanciapalloni", iconHTML: gymIcon("lanciapalloni") },
            { type: "gym", src: "data/images/gym/antenna.svg", label: "gym_antenna", iconHTML: gymIcon("antenna") },
            { type: "gym", src: "data/images/gym/seggiolone.svg", label: "gym_seggiolone", iconHTML: gymIcon("seggiolone") },
            { type: "gym", src: "data/images/gym/tabellone.svg", label: "gym_tabellone", iconHTML: gymIcon("tabellone") },
            { type: "gym", src: "data/images/gym/paletta-cambio.svg", label: "gym_paletta_cambio", iconHTML: gymIcon("paletta-cambio") },
            { type: "gym", src: "data/images/gym/bersaglio.svg", label: "gym_bersaglio", iconHTML: gymIcon("bersaglio") },
            { type: "gym", src: "data/images/gym/maglia.svg", label: "gym_maglia", iconHTML: gymIcon("maglia") },
            { type: "gym", src: "data/images/gym/ginocchiere.svg", label: "gym_ginocchiere", iconHTML: gymIcon("ginocchiere") },
            { type: "gym", src: "data/images/gym/scarpa.svg", label: "gym_scarpa", iconHTML: gymIcon("scarpa") },
            { type: "gym", src: "data/images/gym/cono.svg", label: "gym_cono", iconHTML: gymIcon("cono") },
            { type: "gym", src: "data/images/gym/cinesino.svg", label: "gym_cinesino", iconHTML: gymIcon("cinesino") },
            { type: "gym", src: "data/images/gym/cinesino-rosso.svg", label: "gym_cinesino_rosso", iconHTML: gymIcon("cinesino-rosso") },
            { type: "gym", src: "data/images/gym/ostacolo.svg", label: "gym_ostacolo", iconHTML: gymIcon("ostacolo") },
            { type: "gym", src: "data/images/gym/cerchio.svg", label: "gym_cerchio", iconHTML: gymIcon("cerchio") },
            { type: "gym", src: "data/images/gym/scaletta.svg", label: "gym_scaletta", iconHTML: gymIcon("scaletta") },
            { type: "gym", src: "data/images/gym/step.svg", label: "gym_step", iconHTML: gymIcon("step") },
            { type: "gym", src: "data/images/gym/pedana.svg", label: "gym_pedana", iconHTML: gymIcon("pedana") },
            { type: "gym", src: "data/images/gym/materassino.svg", label: "gym_materassino", iconHTML: gymIcon("materassino") },
            { type: "gym", src: "data/images/gym/panca.svg", label: "gym_panca", iconHTML: gymIcon("panca") },
            { type: "gym", src: "data/images/gym/palla-medica.svg", label: "gym_palla_medica", iconHTML: gymIcon("palla-medica") },
            { type: "gym", src: "data/images/gym/manubrio.svg", label: "gym_manubrio", iconHTML: gymIcon("manubrio") },
            { type: "gym", src: "data/images/gym/kettlebell.svg", label: "gym_kettlebell", iconHTML: gymIcon("kettlebell") },
            { type: "gym", src: "data/images/gym/elastico.svg", label: "gym_elastico", iconHTML: gymIcon("elastico") },
            { type: "gym", src: "data/images/gym/corda.svg", label: "gym_corda", iconHTML: gymIcon("corda") },
            { type: "gym", src: "data/images/gym/fischietto.svg", label: "gym_fischietto", iconHTML: gymIcon("fischietto") },
            { type: "gym", src: "data/images/gym/cronometro.svg", label: "gym_cronometro", iconHTML: gymIcon("cronometro") },
            { type: "gym", src: "data/images/gym/lavagnetta.svg", label: "gym_lavagnetta", iconHTML: gymIcon("lavagnetta") },
            { type: "gym", src: "data/images/gym/borraccia.svg", label: "gym_borraccia", iconHTML: gymIcon("borraccia") },
            { type: "gym", src: "data/images/gym/asciugamano.svg", label: "gym_asciugamano", iconHTML: gymIcon("asciugamano") }
        ]
    },
    {
        title: "✏️ Testo e icone",
        controlType: "accordion",
        category: "icons",
        i18ntitle: "sb_text_icons",
        items: [
            { type: "text", text: "Testo", label: "tool_text", iconHTML: "🔤" },
            { type: "icon", icon: "fa fa-volleyball", label: "icon_ball" },
            { type: "icon", icon: "fa fa-stopwatch", label: "icon_stopwatch" },
            { type: "icon", icon: "fa fa-bullhorn", label: "icon_whistle" },
            { type: "icon", icon: "fa fa-trophy", label: "icon_trophy" },
            { type: "icon", icon: "fa fa-medal", label: "icon_medal" },
            { type: "icon", icon: "fa fa-star", label: "icon_star" },
            { type: "icon", icon: "fa fa-heart", label: "icon_heart" },
            { type: "icon", icon: "fa fa-check", label: "icon_check" },
            { type: "icon", icon: "fa fa-times", label: "icon_times" },
            { type: "icon", icon: "fa fa-hand-point-up", label: "icon_hands_holding" },
            { type: "icon", icon: "fa fa-shopping-cart", label: "icon_cart" },
            { type: "icon", icon: "fa fa-arrow-up", label: "icon_arrow_up" },
            { type: "icon", icon: "fa fa-arrow-down", label: "icon_arrow_down" },
            { type: "icon", icon: "fa fa-arrow-left", label: "icon_arrow_left" },
            { type: "icon", icon: "fa fa-arrow-right", label: "icon_arrow_right" },
            { type: "icon", icon: "fa fa-dumbbell", label: "icon_dumbbell" },
            { type: "icon", icon: "fa fa-person-running", label: "icon_running" },
            { type: "icon", icon: "fa fa-person-walking", label: "icon_walking" },
            { type: "icon", icon: "fa fa-shoe-prints", label: "icon_footwork" },
            { type: "icon", icon: "fa fa-bullseye", label: "icon_target" },
            { type: "icon", icon: "fa fa-flag", label: "icon_flag" },
            { type: "icon", icon: "fa fa-clipboard-list", label: "icon_clipboard" },
            { type: "icon", icon: "fa fa-hourglass-half", label: "icon_hourglass" },
            { type: "icon", icon: "fa fa-repeat", label: "icon_repeat" },
            { type: "icon", icon: "fa fa-bolt", label: "icon_bolt" },
            { type: "icon", icon: "fa fa-fire", label: "icon_fire" },
            { type: "icon", icon: "fa fa-bottle-water", label: "icon_water" },
            { type: "icon", icon: "fa fa-users", label: "icon_group" },
            { type: "icon", icon: "fa fa-hand", label: "icon_hand" },
            { type: "icon", icon: "fa fa-chart-line", label: "icon_progress" },
            { type: "icon", icon: "fa fa-circle-exclamation", label: "icon_attention" },
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
                    <button type="button" id="openExerciseWizard" class="exwiz-open-btn" title="Compila i dati dell'esercizio passo per passo">🧭 Compilazione guidata</button>
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
                            <label for="workoutTiming" data-i18n="local_workout_duration_label">Tempo(s):</label>
                            <input type="number" id="workoutTiming" min="0" max="600" value="1">
                        </div>
                        <div class="detail-field">
                            <label for="workoutRec" data-i18n="local_workout_recovery_label">Recupero(s):</label>
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
            document.getElementById('openExerciseWizard')?.addEventListener('click', () => editor.exerciseWizard?.open());
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
                    // valore cambiato da programma (cambio schema, caricamento, compilazione guidata)
                    sel._syncSearchable = () => {
                        const o = sel.options[sel.selectedIndex];
                        input.value = o ? o.textContent.trim() : '';
                        clearBtn.style.display = input.value ? 'inline-block' : 'none';
                    };
                    sel.addEventListener('change', sel._syncSearchable);

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