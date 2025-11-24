function buildMenu(menuData) {
    const menuBar = document.createElement("div");
    menuBar.className = "menu-bar";
    menuBar.style.display = "none";

    menuData.forEach(menu => {
        const item = document.createElement("div");
        item.className = "menu-item" + (menu.meta && menu.meta.align === "right" ? " right" : "");

        const label = document.createElement("span");
        label.className = "menu-label";
        label.textContent = menu.label;
        item.appendChild(label);

        const dropdown = document.createElement("div");
        dropdown.className = "menu-dropdown";

        menu.items.forEach(entry => {

            if (entry.separator) {
                const sep = document.createElement("div");
                sep.className = "menu-dropdown-separator";
                dropdown.appendChild(sep);
                return;
            }

            const row = document.createElement("div");
            row.className = "menu-dropdown-item";
            row.dataset.action = entry.action;

            if (entry.checkbox) {
                row.classList.add("checkbox");
                row.innerHTML = `<input type="checkbox" id="${entry.checkbox}"> ${entry.icon} ${entry.label}`;
            } else {
                row.innerHTML = `${entry.icon} ${entry.label}`;
            }

            if (entry.shortcut) {
                const sc = document.createElement("span");
                sc.className = "shortcut";
                sc.textContent = entry.shortcut;
                row.appendChild(sc);
            }

            dropdown.appendChild(row);
        });

        item.appendChild(dropdown);
        menuBar.appendChild(item);
    });

    document.getElementById("menu").appendChild(menuBar);
}

const menuData = [
    {
        label: "📁 File",
        items: [
            { icon: "🆕", label: "Nuovo Schema", action: "newSchema" },
            { icon: "💾", label: "Salva Schema", action: "saveSchema" },
            { icon: "📂", label: "Carica Schema", action: "loadSchema" },
            { separator: true },
            { icon: "💾", label: "Salva Allenamento", action: "saveWorkout" },
            { icon: "📂", label: "Carica Allenamento", action: "loadWorkout" },
            { icon: "📚", label: "Libreria", action: "loadFromLibrary" },
            { separator: true },
            { icon: "📤", label: "Esporta Immagine", action: "exportSchema" },
            { icon: "📄", label: "Esporta PDF", action: "exportPDF" },
            { icon: "📄", label: "Genera Scheda", action: "exportWorkout" },
            { icon: "📋", label: "Foglio Formazioni", action: "exportFormations" }
        ]
    },

    {
        label: "✏️ Modifica",
        items: [
            { icon: "↶", label: "Annulla", action: "undo", shortcut: "Ctrl+Z" },
            { icon: "↷", label: "Ripeti", action: "redo", shortcut: "Ctrl+Y" },
            { separator: true },
            { icon: "✂️", label: "Taglia", action: "cut", shortcut: "Ctrl+X" },
            { icon: "📋", label: "Copia", action: "copy", shortcut: "Ctrl+C" },
            { icon: "📋", label: "Incolla", action: "paste", shortcut: "Ctrl+V" },
            { icon: "🗑️", label: "Elimina", action: "delete", shortcut: "Canc" },
            { separator: true },
            { icon: "🔄", label: "Seleziona Tutto", action: "selectAll", shortcut: "Ctrl+A" },
            { icon: "↺", label: "Ruota -15°", action: "rotateLeft" },
            { icon: "↻", label: "Ruota +15°", action: "rotateRight" },
            { icon: "⟲", label: "Ruota Gruppo -15°", action: "rotateGroupLeft" },
            { icon: "⟳", label: "Ruota Gruppo +15°", action: "rotateGroupRight" }
        ]
    },

    {
        label: "🎨 Vista",
        items: [
            { icon: "➕", label: "Zoom In", action: "zoomIn" },
            { icon: "➖", label: "Zoom Out", action: "zoomOut" },
            { separator: true },
            { icon: "🔍", label: "Griglia", action: "toggleGrid", checkboxId: "menu-grid-check" },
            { icon: "⚫", label: "Bianco/Nero", action: "toggleBW", checkboxId: "menu-bw-check" },
            { icon: "⚡", label: "Tratteggio", action: "toggleDashed", checkboxId: "menu-dashed-check" },
            { icon: "🔢", label: "Etichette", action: "toggleLabels", checkboxId: "menu-labels-check" },
            { icon: "🖼️", label: "Bordi Canvas", action: "toggleBorder", checkboxId: "menu-border-check" },
            { separator: true },
            { icon: "🏷️", label: "Nomi Giocatori", action: "togglePlayerNames" },
            { icon: "🧲", label: "Allinea alla Griglia", action: "snapToGrid" },
            { icon: "🔄", label: "Rinumera Oggetti", action: "renumberObjects" }
        ]
    },

    {
        label: "📐 Oggetti",
        items: [
            { icon: "⬆️", label: "In Primo Piano", action: "bringToFront", shortcut: "Ctrl+]" },
            { icon: "⬇️", label: "In Background", action: "sendToBack", shortcut: "Ctrl+[" },
            { separator: true },
            { icon: "➡️", label: "Modalità Frecce", action: "arrowMode" },
            { icon: "✏️", label: "Modalità Disegno", action: "freehandMode" },
            { separator: true },
            { icon: "🎬", label: "Animazione", action: "showAnimation" }
        ]
    },

    {
        label: "⚙️ Canvas",
        items: [
            {
                icon: "📏",
                label: "Dimensione Canvas",
                submenu: [
                    { icon: "", label: "Personalizzato", action: "setSize", size: "custom" },
                    { icon: "", label: "A5 Verticale", action: "setSize", size: "a5-portrait" },
                    { icon: "", label: "A5 Orizzontale", action: "setSize", size: "a5-landscape" },
                    { icon: "", label: "A4 Verticale", action: "setSize", size: "a4-portrait" },
                    { icon: "", label: "A4 Orizzontale", action: "setSize", size: "a4-landscape" },
                    { icon: "", label: "A3 Verticale", action: "setSize", size: "a3-portrait" },
                    { icon: "", label: "A3 Orizzontale", action: "setSize", size: "a3-landscape" }
                ]
            },
            {
                icon: "🏐",
                label: "Sfondo Campo",
                submenu: [
                    { icon: "", label: "Nessuno", action: "setBackground", bg: "none" },
                    { icon: "", label: "Metà Campo", action: "setBackground", bg: "half-field" },
                    { icon: "", label: "Campo Intero", action: "setBackground", bg: "full-field" },
                    { icon: "", label: "Campo 3D", action: "setBackground", bg: "3d-field" }
                ]
            }
        ]
    },

    {
        label: "👥 Squadra",
        items: [
            { icon: "👥", label: "Gestisci Squadra", action: "manageTeam" }
        ]
    },

    {
        label: "🔧 Strumenti",
        items: [
            { icon: "📝", label: "Blocco Note", action: "openNotepad" },
            { icon: "📜", label: "Storico", action: "showHistory", shortcut: "Ctrl+H" },
            { separator: true },
            { icon: "⚙️", label: "Impostazioni", action: "settings" }
        ]
    },

    {
        label: "❓ Aiuto",
        items: [
            { icon: "📖", label: "Guida", action: "help" },
            { icon: "⌨️", label: "Scorciatoie", action: "shortcuts" },
            { separator: true },
            { icon: "ℹ️", label: "Informazioni", action: "about" }
        ]
    },

    // voce allineata a destra (puoi gestire la classe 'right' quando costruisci il DOM)
    {
        label: "👤 User",
        meta: { align: "right" },
        items: [
            { icon: "🚪", label: "Logout", action: "logout" }
        ]
    }
];
