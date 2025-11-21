const windowTemplates = {
    default: {
        headerBg: "bg-gradient-to-r from-cyan-500 to-blue-600",
        contentBg: "bg-white",
        footerBg: "bg-gray-50",
        footerBorder: "border-t border-gray-200",
        rounded: true,
        shadow: "shadow-2xl"
    },

    dark: {
        headerBg: "bg-gray-800",
        contentBg: "bg-gray-900 text-gray-200",
        footerBg: "bg-gray-800",
        footerBorder: "border-t border-gray-700",
        rounded: false,
        shadow: "shadow-lg"
    },

    neon: {
        headerBg: "bg-gradient-to-r from-fuchsia-600 to-purple-600",
        contentBg: "bg-black text-pink-400",
        footerBg: "bg-black",
        footerBorder: "border-t border-fuchsia-600",
        rounded: true,
        shadow: "shadow-[0_0_20px_rgba(255,0,255,0.7)]"
    }
};

function setDefaultDate(fieldName) {
    const dateField = document.getElementById(fieldName);
    if (dateField) {
        const today = new Date();

        // 1. Ottiene l'anno (YYYY)
        const yyyy = today.getFullYear();

        // 2. Ottiene il mese (MM): Aggiunge 1 (i mesi vanno da 0 a 11) e usa padStart per avere sempre due cifre.
        const mm = String(today.getMonth() + 1).padStart(2, '0');

        // 3. Ottiene il giorno (DD): Usa padStart per avere sempre due cifre.
        const dd = String(today.getDate()).padStart(2, '0');

        // COSTRUZIONE DEL FORMATO YYYY-MM-DD
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        // Imposta il valore (es: "2025-10-03")
        dateField.value = formattedDate;
    }
}
/**
 * Calcola il valore di Tonalità (Hue) da un colore Hex.
 * @param {string} hex - Il codice colore esadecimale (es. "#3498db" o "3498db").
 * @returns {number} Il valore di hue in gradi (0-360).
 */
function getHue(hex) {
    // Rimuove l'hash e converte in RGB
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0; // Ritorna 0 se non è un colore valido

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // Colore grigio (monocromatico)
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    // Converte in gradi (0-360)
    return h * 360;
}

/**
 * SISTEMA UNIFICATO DI FINESTRE - Progetto VolleyProW4
 * Unifica tutti i dialog/modal del progetto con createWindow()
 * Utilizza Tailwind CSS per lo styling
 */

// ============================================================================
// 1. AGGIORNA helper.js - createWindow avanzato
// ============================================================================

let zCounter = 200;
const minWidth = 200;
const minHeight = 80;

/**
 * Factory per creare finestre uniformi
 * @param {Object} config - Configurazione finestra
 * @param {string} config.title - Titolo finestra
 * @param {string} config.contentHTML - HTML contenuto
 * @param {Array} config.buttons - Array bottoni [{label, onClick, color}]
 * @param {boolean} config.modal - Se è modale (con overlay)
 * @param {string} config.icon - Icona titolo (emoji)
 * @param {string} config.size - 'sm'|'md'|'lg'|'xl' (default: 'md')
 * @param {boolean} config.fullscreen - Rendi a schermo intero
 * @returns {HTMLElement} Elemento finestra
 */
function createWindow({
    title = "Finestra",
    contentHTML = "",
    buttons = [],
    modal = false,
    icon = "📋",
    size = 'md',
    fullscreen = false,
    onClose = null,

    // nuovo parametro:
    template = "default",

    // fallback manuali:
    headerBg,
    contentBg,
    footerBg,
    footerBorder,
    rounded,
    shadow

} = {}) {

    // ---- APPICA IL TEMPLATE ----
    const tpl = windowTemplates[template] || {};

    headerBg = headerBg ?? tpl.headerBg ?? "bg-gray-700";
    contentBg = contentBg ?? tpl.contentBg ?? "bg-white";
    footerBg = footerBg ?? tpl.footerBg ?? "bg-gray-100";
    footerBorder = footerBorder ?? tpl.footerBorder ?? "border-t border-gray-300";
    rounded = rounded ?? tpl.rounded ?? true;
    shadow = shadow ?? tpl.shadow ?? "shadow-lg";

    // Dimensioni predefinite
    const sizes = {
        sm: { w: '400px', h: '300px' },
        md: { w: '540px', h: '360px' },
        lg: { w: '720px', h: '500px' },
        xl: { w: '900px', h: '600px' }
    };

    const dimensions = fullscreen
        ? { w: '95vw', h: '95vh' }
        : sizes[size] || sizes.md;

    // Crea overlay se modale
    let overlay;
    if (modal) {
        overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998]';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeWindow();
        });
    }

    // Crea finestra
    const win = document.createElement('div');
    win.className = `
        absolute 
        overflow-hidden 
        flex flex-col
        ${rounded ? "rounded-lg" : ""}
        ${shadow}
    `;
    win.style.width = dimensions.w;
    win.style.height = dimensions.h;
    win.style.left = `${120 + Math.random() * 60}px`;
    win.style.top = `${120 + Math.random() * 60}px`;
    win.style.zIndex = modal ? (zCounter + 1001) : (++zCounter);

    if (modal && overlay) {
        overlay.appendChild(win);
        win.addEventListener('click', e => e.stopPropagation());
    } else {
        document.body.appendChild(win);
    }

    // ========== TITLEBAR ==========
    const titlebar = document.createElement('div');
    titlebar.className = `
        flex items-center justify-between 
        px-4 py-3 
        text-white 
        cursor-grab active:cursor-grabbing
        ${headerBg}
    `;
    titlebar.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-lg">${icon}</span>
            <span class="font-semibold text-sm">${title}</span>
        </div>
        <div class="flex items-center gap-2 text-white">

  <div class="flex items-center gap-2 text-white">

        <!-- Minimizza -->
        <button 
            class="btn-min w-6 h-6 rounded-full bg-gray-400 opacity-30 hover:bg-yellow-400 hover:opacity-100 transition flex items-center justify-center text-xs">
            &#x2212;
        </button>

        <!-- Massimizza -->
        <button 
            class="btn-max w-6 h-6 rounded-full bg-gray-400 opacity-30 hover:bg-blue-400 hover:opacity-100 transition flex items-center justify-center text-xs">
            &#x25A1;
        </button>

        <!-- Chiudi -->
        <button 
            class="btn-close w-6 h-6 rounded-full bg-gray-400 opacity-30 hover:bg-red-400 hover:opacity-100 transition flex items-center justify-center text-xs">
            &#x2715;
        </button>
    </div>
    `;
    win.appendChild(titlebar);

    // ========== CONTENT ==========
    const content = document.createElement('div');
    content.className = `flex-1 overflow-auto p-4 ${contentBg}`;
    content.innerHTML = contentHTML;
    win.appendChild(content);

    // ========== FOOTER / BUTTONS AREA ==========
    if (buttons && buttons.length) {
        const btnArea = document.createElement('div');
        btnArea.className = `
            flex justify-end gap-2 p-4
            ${footerBg}
            ${footerBorder}
        `;

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;

            const colorClasses = {
                primary: 'bg-blue-600 hover:bg-blue-700',
                success: 'bg-green-600 hover:bg-green-700',
                danger: 'bg-red-600 hover:bg-red-700',
                warning: 'bg-yellow-600 hover:bg-yellow-700',
                secondary: 'bg-gray-500 hover:bg-gray-600'
            };

            btn.className = `px-4 py-2 rounded text-white transition ${colorClasses[b.color] || colorClasses.primary}`;
            btn.addEventListener('click', () => {
                b.onClick?.();
                if (b.close !== false) closeWindow();
            });
            btnArea.appendChild(btn);
        });

        win.appendChild(btnArea);
    }

    // ====================================================
    //      IL RESTO DEL CODICE (drag, resize, min, max)
    //      RIMANE IDENTICO E FUNZIONA SENZA CAMBIAMENTI
    // ====================================================

    // --- DA QUI IN POI INCOLLA IL TUO CODICE ORIGINALE ---

    const handles = ["t", "b", "l", "r", "tl", "tr", "bl", "br"];
    handles.forEach(hc => {
        const h = document.createElement('div');
        h.className = `resize-handle ${hc} absolute`;
        h.style.cssText = getResizeHandleStyle(hc);
        win.appendChild(h);
    });

    let dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        dragging = true;
        dx = e.clientX - win.offsetLeft;
        dy = e.clientY - win.offsetTop;
        bringToFront(win);
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        let newX = e.clientX - dx;
        let newY = e.clientY - dy;
        newX = Math.max(0, Math.min(newX, window.innerWidth - win.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - win.offsetHeight));
        win.style.left = `${newX}px`;
        win.style.top = `${newY}px`;
    });

    window.addEventListener('mouseup', () => {
        dragging = false;
        document.body.style.userSelect = '';
    });

    // Resize
    let resizing = false, handleType = null;
    let startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0;

    win.querySelectorAll('.resize-handle').forEach(hEl => {
        hEl.addEventListener('mousedown', e => {
            e.stopPropagation();
            resizing = true;
            handleType = hEl.classList[1];
            startX = e.clientX;
            startY = e.clientY;
            startW = win.offsetWidth;
            startH = win.offsetHeight;
            startL = win.offsetLeft;
            startT = win.offsetTop;
            bringToFront(win);
            document.body.style.userSelect = 'none';
        });
    });

    window.addEventListener('mousemove', (e) => {
        if (!resizing) return;
        const mx = e.clientX - startX;
        const my = e.clientY - startY;
        let newW = startW, newH = startH, newL = startL, newT = startT;

        switch (handleType) {
            case 'r': newW = Math.max(minWidth, startW + mx); break;
            case 'l': newW = Math.max(minWidth, startW - mx); newL = startL + mx; break;
            case 'b': newH = Math.max(minHeight, startH + my); break;
            case 't': newH = Math.max(minHeight, startH - my); newT = startT + my; break;
            case 'br': newW = Math.max(minWidth, startW + mx); newH = Math.max(minHeight, startH + my); break;
            case 'bl': newW = Math.max(minWidth, startW - mx); newL = startL + mx; newH = Math.max(minHeight, startH + my); break;
            case 'tr': newW = Math.max(minWidth, startW + mx); newH = Math.max(minHeight, startH - my); newT = startT + my; break;
            case 'tl': newW = Math.max(minWidth, startW - mx); newL = startL + mx; newH = Math.max(minHeight, startH - my); newT = startT + my; break;
        }

        win.style.width = `${newW}px`;
        win.style.height = `${newH}px`;
        win.style.left = `${newL}px`;
        win.style.top = `${newT}px`;
    });

    window.addEventListener('mouseup', () => {
        resizing = false;
        document.body.style.userSelect = '';
    });

    // Buttons
    const btnClose = titlebar.querySelector('.btn-close');
    const btnMin = titlebar.querySelector('.btn-min');
    const btnMax = titlebar.querySelector('.btn-max');

    const closeWindow = () => {
        win.remove();
        if (overlay) overlay.remove();
        onClose?.();
    };

    btnClose.addEventListener('click', closeWindow);

    btnMin.addEventListener('click', () => {
        win.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');

        const iconDiv = document.createElement('div');
        iconDiv.className = 'fixed bottom-4 right-4 w-10 h-10 rounded bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white cursor-pointer hover:shadow-lg transition';
        iconDiv.textContent = "📦";
        iconDiv.title = title;
        iconDiv.style.zIndex = '9990';

        iconDiv.addEventListener('click', () => {
            win.classList.remove('hidden');
            if (overlay) overlay.classList.remove('hidden');
            iconDiv.remove();
        });

        document.body.appendChild(iconDiv);
    });

    let maximized = false;
    let prev = {};
    btnMax.addEventListener('click', () => {
        if (!maximized) {
            prev = {
                left: win.offsetLeft,
                top: win.offsetTop,
                width: win.offsetWidth,
                height: win.offsetHeight
            };
            win.style.left = '20px';
            win.style.top = '20px';
            win.style.width = `${window.innerWidth - 40}px`;
            win.style.height = `${window.innerHeight - 40}px`;
            maximized = true;
        } else {
            win.style.left = `${prev.left}px`;
            win.style.top = `${prev.top}px`;
            win.style.width = `${prev.width}px`;
            win.style.height = `${prev.height}px`;
            maximized = false;
        }
    });

    return win;
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getResizeHandleStyle(type) {
    const size = '8px';
    const styles = {
        t: `top: 0; left: 0; right: 0; height: ${size}; cursor: n-resize;`,
        b: `bottom: 0; left: 0; right: 0; height: ${size}; cursor: s-resize;`,
        l: `top: 0; bottom: 0; left: 0; width: ${size}; cursor: w-resize;`,
        r: `top: 0; bottom: 0; right: 0; width: ${size}; cursor: e-resize;`,
        tl: `top: 0; left: 0; width: 16px; height: 16px; cursor: nw-resize;`,
        tr: `top: 0; right: 0; width: 16px; height: 16px; cursor: ne-resize;`,
        bl: `bottom: 0; left: 0; width: 16px; height: 16px; cursor: sw-resize;`,
        br: `bottom: 0; right: 0; width: 16px; height: 16px; cursor: se-resize;`
    };
    return styles[type] || '';
}

function bringToFront(win) {
    win.style.zIndex = ++zCounter;
}

// ============================================================================
// 2. ESEMPI DI UTILIZZO - Sostituisci i vecchi dialog nel SchemaEditor
// ============================================================================

/**
 * Dialogo Gestione Squadra Unificato
 */
function showTeamDialogUnified(editor) {
    const html = `
        <div class="space-y-4">
            <!-- Add Player Form -->
            <div class="grid grid-cols-4 gap-3 items-end">
                <select id="newPlayerRole" class="border border-gray-300 rounded px-3 py-2">
                    <option value="P1">P1 - Alzatore</option>
                    <option value="L1">L1 - Libero</option>
                    <option value="S1">S1 - Banda</option>
                    <option value="O">O - Opposto</option>
                    <option value="C1">C1 - Centro</option>
                    <option value="All">All - Allenatore</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
                <input type="number" id="newPlayerNumber" placeholder="N°" min="1" max="99" class="border border-gray-300 rounded px-3 py-2">
                <input type="text" id="newPlayerName" placeholder="Nome e Cognome" class="border border-gray-300 rounded px-3 py-2">
                <button id="addPlayerBtn" class="bg-blue-500 text-white rounded px-3 py-2">➕ Aggiungi</button>
            </div>

            <!-- Import from Text -->
            <div>
                <textarea id="playersImportText" rows="3" placeholder="P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi" class="w-full border border-gray-300 rounded p-2"></textarea>
                <button id="importPlayersFromTextBtn" class="mt-2 bg-green-500 text-white rounded px-3 py-2">📥 Importa da Testo</button>
            </div>

            <!-- Players List -->
            <div id="teamPlayersList" class="max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
                <!-- Lista dinamica dei giocatori -->
            </div>
        </div>
    `;

    const win = createWindow({
        title: 'Gestione Squadra',
        icon: '👥',
        contentHTML: html,
        size: 'md',
        buttons: [
            {
                label: '📤 Esporta',
                color: 'secondary',
                onClick: () => editor.exportTeam(),
                close: false
            },
            {
                label: '+ Inserisci',
                color: 'secondary',
                onClick: () => editor.addTeamPlayer(),
                close: false
            },
            {
                label: '+ Importa da testo',
                color: 'secondary',
                onClick: () => editor.importPlayersFromText(),
                close: false
            },
            {
                label: '🗑️ Cancella Tutto',
                color: 'danger',
                onClick: () => editor.clearTeam(),
                close: false
            }
        ]
    });

    editor.renderTeamPlayersList();
}


/**
 * Dialogo Salva Allenamento Unificato
 */
function showSaveWorkoutDialogUnified(editor) {
    const now = new Date();
    const defaultName = `Allenamento_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const html = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-bold mb-2">Nome File</label>
                <input type="text" id="workoutFileName" value="${defaultName}" class="w-full border border-gray-300 rounded px-3 py-2">
            </div>
            
            <div>
                <label class="block text-sm font-bold mb-2">Obiettivo Allenamento</label>
                <textarea id="workoutGlobalObjective" class="w-full border border-gray-300 rounded px-3 py-2 h-20" placeholder="Descrivi l'obiettivo..."></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-bold mb-2">Osservazioni</label>
                <textarea id="workoutGlobalObservations" class="w-full border border-gray-300 rounded px-3 py-2 h-20" placeholder="Note post-allenamento..."></textarea>
            </div>
            
            <div id="workOutListName" class="bg-gray-100 p-3 rounded text-sm max-h-32 overflow-y-auto">
                <!-- Tabs inseriti dinamicamente -->
            </div>
        </div>
    `;

    createWindow({
        title: 'Salva Allenamento Completo',
        icon: '💾',
        contentHTML: html,
        size: 'lg',
        modal: true,
        buttons: [
            {
                label: 'Annulla',
                color: 'secondary',
                onClick: () => { }
            },
            {
                label: 'Salva',
                color: 'success',
                onClick: () => {
                    editor.currentWorkoutObjective = document.getElementById('workoutGlobalObjective').value;
                    editor.currentWorkoutObservations = document.getElementById('workoutGlobalObservations').value;
                    editor.saveWorkout(document.getElementById('workoutFileName').value);
                }
            }
        ]
    });

    // Popola lista tab
    const tabList = document.getElementById('workOutListName');
    editor.tabs.forEach((tab, tabId) => {
        const div = document.createElement('div');
        div.className = 'inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded mr-2 mb-2';
        div.textContent = tab.name;
        tabList.appendChild(div);
    });

    document.getElementById('workoutFileName').select();
}

/**
 * Dialogo Carica da Libreria Unificato
 */
function showLibraryDialogUnified(editor) {
    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-sm font-bold mb-1">Periodo</label>
                    <select id="filterPeriodo" class="w-full border border-gray-300 rounded px-2 py-1 text-sm"></select>
                </div>
                <div>
                    <label class="block text-sm font-bold mb-1">Tipologia</label>
                    <select id="filterTipologia" class="w-full border border-gray-300 rounded px-2 py-1 text-sm"></select>
                </div>
                <div>
                    <label class="block text-sm font-bold mb-1">Ruolo</label>
                    <select id="filterRuolo" class="w-full border border-gray-300 rounded px-2 py-1 text-sm"></select>
                </div>
            </div>
            
            <div class="border border-gray-300 rounded p-3 max-h-64 overflow-y-auto">
                <ul id="workoutList" class="space-y-1">
                    <!-- Inserito dinamicamente -->
                </ul>
            </div>
        </div>
    `;

    createWindow({
        title: 'Carica da Libreria',
        icon: '📚',
        contentHTML: html,
        size: 'lg',
        modal: true,
        buttons: [
            {
                label: 'Carica',
                color: 'success',
                onClick: () => {
                    if (editor.selectedLibraryFile) {
                        editor.loadWorkoutFromBackend(editor.selectedLibraryFile);
                    }
                }
            }
        ]
    });

    // Popola inizialmente
    editor.fetchLibraryWorkouts();
}

/**
 * Dialogo Info Unificato
 */
function showAboutDialogUnified() {
    const html = `
        <div class="text-center space-y-4">
            <h2 class="text-2xl font-bold text-blue-600">Volleyball Coach Pro W4</h2>
            <p class="text-gray-600">Editor Professionale per Allenatori di Pallavolo</p>
            
            <div class="border-t border-b py-4 space-y-2">
                <p><strong>Versione:</strong> 4.0.0</p>
                <p><strong>Autore:</strong> Filippo Morano</p>
                <p><strong>Sito:</strong> <a href="https://www.filippomorano.com" target="_blank" class="text-blue-500 hover:underline">filippomorano.com</a></p>
            </div>
            
            <p class="text-xs text-gray-500">© 2025 SpikeCode - Tutti i diritti riservati</p>
        </div>
    `;

    createWindow({
        title: 'Informazioni',
        icon: 'ℹ️',
        contentHTML: html,
        size: 'sm',
        modal: true,
        buttons: [
            { label: 'Chiudi', color: 'primary' }
        ]
    });
}

// ============================================================================
// 3. INTEGRAZIONE NEL SchemaEditor
// ============================================================================

// Nel metodo initializeEventListeners() di SchemaEditor, sostituisci:

/*
PRIMA:
document.getElementById('manageTeamBtn').addEventListener('click', () => {
    this.showTeamDialog();
});

DOPO:
document.getElementById('manageTeamBtn').addEventListener('click', () => {
    showTeamDialogUnified(this);
});
*/

// ============================================================================
// 4. CSS TAILWIND - Aggiungi a index.html <head>
// ============================================================================

/*
<script src="https://cdn.tailwindcss.com"></script>
<style>
    .win {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .resize-handle {
        background: transparent;
    }
    
    .resize-handle:hover {
        background: rgba(59, 130, 246, 0.1);
    }
</style>
*/