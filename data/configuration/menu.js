// =======================================================================
// MENU A TENDINA DELLA TOPBAR (pulsanti color ottone, come in SpikeCut)
// pill: true  -> pulsante "File ▾" in evidenza
// more: true  -> pulsante "⋯" (lingua, guida, informazioni)
// =======================================================================
const menuData = [
    {
        label: "File ▾",
        i18n: "menu_file",
        pill: true,
        items: [
            { icon: "🆕", label: "Nuovo schema", action: "newSchema" },
            { icon: "💾", label: "Salva schema (.json)", action: "saveSchema" },
            { icon: "📂", label: "Apri schema da file (.json)", action: "loadSchema" },
            { separator: true },
            { icon: "☁", label: "Libreria esercizi…", onClick: () => window.Pv4Library.open() },
            { icon: "☁", label: "Salva in libreria", onClick: () => window.Pv4Library.quickSave() },
            { icon: "☁", label: "Salva in libreria con nome…", onClick: () => window.Pv4Library.saveAs() },
            { icon: "🕐", label: "Versioni dell'esercizio…", onClick: () => window.Pv4Library.versions() },
            { icon: "📌", label: "Fissa questa versione…", onClick: () => window.Pv4Library.pinVersion() },
            { icon: "🗄", label: "Archivio esercizi (precedente)", onClick: (editor) => editor.libraryManager.show() },
            { separator: true },
            { icon: "🏐", label: "Lavagna (rotazioni e fasi)…", onClick: (editor) => editor.rotationBoard.show() },
            { icon: "📋", label: "Piano allenamento…", onClick: (editor) => editor.workoutPlan.show() },
            { icon: "🗓", label: "Genera allenamento…", onClick: (editor) => editor.workoutGenerator.show() },
            { icon: "🔗", label: "Condividi allenamento (link)…", onClick: () => window.Pv4Share.shareWorkout() },
            { icon: "🔗", label: "Condividi esercizio (link)…", onClick: () => window.Pv4Share.shareExercise() },
            { icon: "📇", label: "I miei link condivisi…", onClick: () => window.Pv4Share.myLinks() },
            { icon: "💾", label: "Salva allenamento…", onClick: (editor) => editor.workoutManager.show() },
            { icon: "📂", label: "Carica allenamento (.json)", action: "loadWorkout" },
            { separator: true },
            { icon: "📦", label: "Registra modelli 3D (.glb)…", onClick: (editor) => editor.registerGlbFiles() }
        ]
    },
    {
        label: "Stampa ▾",
        i18n: "menu_print",
        pill: true,
        items: [
            { icon: "📄", label: "Scheda allenamento (PDF)", action: "exportPDF" },
            { icon: "🖼️", label: "Esporta immagine", action: "exportSchema" },
            { separator: true },
            { icon: "📋", label: "Foglio formazioni", action: "exportFormations" },
            { icon: "📊", label: "Foglio scout", onClick: (editor) => editor.exportDataVolley() }
        ]
    },
    {
        label: "Strumenti ▾",
        i18n: "menu_tools",
        pill: true,
        items: [
            { icon: "✂️", label: "Taglia", action: "cut", shortcut: "Ctrl+X" },
            { icon: "📋", label: "Copia", action: "copy", shortcut: "Ctrl+C" },
            { icon: "📋", label: "Incolla", action: "paste", shortcut: "Ctrl+V" },
            { icon: "🔄", label: "Seleziona tutto", action: "selectAll", shortcut: "Ctrl+A" },
            { separator: true },
            { icon: "🔢", label: "Rinumera oggetti", action: "renumberObjects" },
            { icon: "📝", label: "Blocco note", action: "openNotepad" },
            { icon: "💾", label: "Salvataggi automatici…", onClick: (editor) => editor.showAutoSaveSettings() },
            { icon: "⚙️", label: "Impostazioni…", action: "settings" }
        ]
    },
    {
        label: "⋯",
        more: true,
        items: [
            {
                html: `<label class="menu-field"><span data-i18n="language_legend">Lingua</span>
                    <select id="languageSelector">
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select></label>`
            },
            { separator: true },
            { icon: "📖", label: "Guida", action: "help" },
            { icon: "⌨️", label: "Scorciatoie da tastiera", action: "shortcuts" },
            { icon: "ℹ️", label: "Informazioni", action: "about" }
        ]
    }
];

// Voci del menu utente (pulsante 👤 nella topbar)
const userMenuData = [
    { icon: "👤", label: "Account…", onClick: () => window.Pv4Library.account() },
    { icon: "🪪", label: "Profilo", action: "showUserProfile" },
    { icon: "🛠", label: "Amministrazione", onClick: () => window.Pv4Library.admin() },
    { separator: true },
    { icon: "🚪", label: "Esci", action: "logout" }
];
