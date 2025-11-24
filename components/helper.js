// ======================================================
// 1. Templates e funzioni di base (già convertite)
// ======================================================

const windowTemplates = {
    default: {
        headerBg: "linear-gradient(to right, #06b6d4, #2c3e50)",
        contentBg: "#ffffff",
        contentColor: "#000000",
        footerBg: "#f9fafb",
        footerBorder: "1px solid #e5e7eb",
        rounded: true,
        shadow: "0 25px 50px rgba(0,0,0,0.25)"
    },
    dark: {
        headerBg: "#1f2937",
        contentBg: "#111827",
        contentColor: "#e5e7eb",
        footerBg: "#1f2937",
        footerBorder: "1px solid #374151",
        rounded: false,
        shadow: "0 15px 30px rgba(0,0,0,0.25)"
    },
    neon: {
        headerBg: "linear-gradient(to right, #a21caf, #7e22ce)",
        contentBg: "#000000",
        contentColor: "#f472b6",
        footerBg: "#000000",
        footerBorder: "1px solid #a21caf",
        rounded: true,
        shadow: "0 0 20px rgba(255,0,255,0.7)"
    }
};

// setDefaultDate e getHue restano identiche
function setDefaultDate(fieldName) {
    const dateField = document.getElementById(fieldName);
    if (!dateField) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateField.value = `${yyyy}-${mm}-${dd}`;
}

function getHue(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, l = (max + min) / 2, s;
    if (max === min) { h = s = 0; }
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return h * 360;
}

let zCounter = 200;
const minWidth = 200;
const minHeight = 80;

function bringToFront(win) { win.style.zIndex = ++zCounter; }

// ======================================================
// 2. createWindow completamente indipendente da Tailwind
// ======================================================

function createWindow({
    title = "Finestra",
    contentHTML = "",
    buttons = [],
    modal = false,
    icon = "📋",
    size = 'md',
    fullscreen = false,
    onClose = null,
    template = "default",
    headerBg,
    contentBg,
    contentColor,
    footerBg,
    footerBorder,
    rounded,
    shadow
} = {}) {

    const tpl = windowTemplates[template] || {};
    headerBg = headerBg ?? tpl.headerBg ?? "#4b5563";
    contentBg = contentBg ?? tpl.contentBg ?? "#ffffff";
    contentColor = contentColor ?? tpl.contentColor ?? "#000000";
    footerBg = footerBg ?? tpl.footerBg ?? "#f3f4f6";
    footerBorder = footerBorder ?? tpl.footerBorder ?? "1px solid #d1d5db";
    rounded = rounded ?? tpl.rounded ?? true;
    shadow = shadow ?? tpl.shadow ?? "0 10px 25px rgba(0,0,0,0.2)";

    const sizes = {
        sm: { w: 400, h: 300 },
        md: { w: 540, h: 360 },
        lg: { w: 720, h: 500 },
        xl: { w: 900, h: 600 }
    };

    const dimensions = fullscreen
        ? { w: window.innerWidth * 0.95, h: window.innerHeight * 0.95 }
        : sizes[size] || sizes.md;
    const centerX = (window.innerWidth - dimensions.w) / 2;
    const centerY = (window.innerHeight - dimensions.h) / 2;
    let overlay;
    if (modal) {
        overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9998
        });
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWindow(); });
    }

    const win = document.createElement('div');
    Object.assign(win.style, {
        position: 'absolute',
        width: dimensions.w + 'px',
        height: dimensions.h + 'px',
        left: `${centerX}px`,
        top: `${centerY}px`,
        zIndex: modal ? (zCounter + 1001) : ++zCounter,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: rounded ? '10px' : '0px',
        boxShadow: shadow,
        backgroundColor: contentBg,
        color: contentColor,
        fontFamily: 'Arial, sans-serif'
    });

    if (modal && overlay) { overlay.appendChild(win); win.addEventListener('click', e => e.stopPropagation()); }
    else document.body.appendChild(win);

    // ========== Titlebar ==========
    const titlebar = document.createElement('div');
    Object.assign(titlebar.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'grab',
        background: headerBg,
        color: '#fff',
        userSelect: 'none'
    });

    const titleLeft = document.createElement('div');
    titleLeft.style.display = 'flex';
    titleLeft.style.gap = '8px';
    const iconSpan = document.createElement('span'); iconSpan.textContent = icon; iconSpan.style.fontSize = '16px';
    const titleSpan = document.createElement('span'); titleSpan.textContent = title; titleSpan.style.fontWeight = '600'; titleSpan.style.fontSize = '14px';
    titleLeft.appendChild(iconSpan); titleLeft.appendChild(titleSpan);

    const titleRight = document.createElement('div');
    titleRight.style.display = 'flex'; titleRight.style.gap = '4px';

    const createBtn = (symbol, bgHover, bgNormal = '#9ca3af') => {
        const btn = document.createElement('button');
        btn.innerHTML = symbol;
        Object.assign(btn.style, {
            width: '24px', height: '24px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: bgNormal,
            color: '#fff',
            cursor: 'pointer',
            opacity: '0.7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'all 0.2s'
        });
        btn.onmouseenter = () => btn.style.backgroundColor = bgHover;
        btn.onmouseleave = () => btn.style.backgroundColor = bgNormal;
        return btn;
    };

    const btnMin = createBtn('−', '#facc15');
    const btnMax = createBtn('□', '#3b82f6');
    const btnClose = createBtn('✕', '#ef4444');

    titleRight.appendChild(btnMin); titleRight.appendChild(btnMax); titleRight.appendChild(btnClose);
    titlebar.appendChild(titleLeft); titlebar.appendChild(titleRight);
    win.appendChild(titlebar);

    // ========== Content ==========
    const content = document.createElement('div');
    content.innerHTML = contentHTML;
    Object.assign(content.style, {
        flex: '1', overflow: 'auto', padding: '12px', backgroundColor: contentBg, color: contentColor
    });
    win.appendChild(content);

    // ========== Footer / Buttons ==========
    if (buttons.length) {
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px',
            backgroundColor: footerBg, borderTop: footerBorder
        });

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            Object.assign(btn.style, {
                padding: '6px 12px',
                borderRadius: '6px',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: '0.2s',
                backgroundColor: '#2563eb'
            });
            switch (b.color) {
                case 'success': btn.style.backgroundColor = '#16a34a'; break;
                case 'danger': btn.style.backgroundColor = '#dc2626'; break;
                case 'warning': btn.style.backgroundColor = '#eab308'; break;
                case 'secondary': btn.style.backgroundColor = '#6b7280'; break;
            }
            btn.onmouseenter = () => btn.style.opacity = '0.8';
            btn.onmouseleave = () => btn.style.opacity = '1';
            btn.addEventListener('click', () => {
                b.onClick?.();
                if (b.close !== false) closeWindow();
            });
            footer.appendChild(btn);
        });
        win.appendChild(footer);
    }

    // Drag
    let dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', e => {
        if (e.target.tagName === 'BUTTON') return;
        dragging = true; dx = e.clientX - win.offsetLeft; dy = e.clientY - win.offsetTop;
        bringToFront(win); document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        let nx = e.clientX - dx, ny = e.clientY - dy;
        nx = Math.max(0, Math.min(nx, window.innerWidth - win.offsetWidth));
        ny = Math.max(0, Math.min(ny, window.innerHeight - win.offsetHeight));
        win.style.left = nx + 'px'; win.style.top = ny + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });

    // Buttons actions
    const closeWindow = () => { win.remove(); if (overlay) overlay.remove(); onClose?.(); };
    btnClose.addEventListener('click', closeWindow);
    btnMin.addEventListener('click', () => {
        win.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        const iconDiv = document.createElement('div');
        Object.assign(iconDiv.style, {
            width: '32px',
            height: '32px',
            background: headerBg,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '6px',
            boxShadow: '0 0 5px rgba(0,0,0,0.3)'
        });

        iconDiv.textContent = icon;   // Usa la stessa icona della finestra
        iconDiv.title = title;

        // Ripristina la finestra quando cliccata
        iconDiv.onclick = () => {
            win.style.display = 'flex';
            if (overlay) overlay.style.display = 'flex';
            iconDiv.remove();
        };

        // Monta l'icona nel footer
        document.querySelector('#footer').appendChild(iconDiv);

    });
    let maximized = false, prev = {};
    btnMax.addEventListener('click', () => {
        if (!maximized) {
            prev = { left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight };
            win.style.left = '20px'; win.style.top = '20px';
            win.style.width = (window.innerWidth - 40) + 'px'; win.style.height = (window.innerHeight - 40) + 'px';
            maximized = true;
        } else {
            win.style.left = prev.left + 'px'; win.style.top = prev.top + 'px';
            win.style.width = prev.width + 'px'; win.style.height = prev.height + 'px';
            maximized = false;
        }
    });

    return win;
}

// ======================================================
// 3. Dialog unificati (completamente senza Tailwind)
// ======================================================

// --- showTeamDialogUnified ---
function showTeamDialogUnified(editor) {
    const html = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;align-items:end;">
                <select id="newPlayerRole" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;">
                    <option value="P1">P1 - Alzatore</option>
                    <option value="L1">L1 - Libero</option>
                    <option value="S1">S1 - Banda</option>
                    <option value="O">O - Opposto</option>
                    <option value="C1">C1 - Centro</option>
                    <option value="All">All - Allenatore</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
                <input type="number" id="newPlayerNumber" placeholder="N°" min="1" max="99" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;">
                <input type="text" id="newPlayerName" placeholder="Nome e Cognome" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;">
                <button id="addPlayerBtn" style="padding:6px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;">➕ Aggiungi</button>
            </div>
            <div>
                <textarea id="playersImportText" rows="3" placeholder="P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;"></textarea>
                <button id="importPlayersFromTextBtn" style="margin-top:4px;padding:6px;background:#16a34a;color:#fff;border:none;border-radius:4px;cursor:pointer;">📥 Importa da Testo</button>
            </div>
            <div id="teamPlayersList" style="max-height:256px;overflow-y:auto;border:1px solid #d1d5db;border-radius:4px;padding:6px;"></div>
        </div>
    `;
    const win = createWindow({
        title: 'Gestione Squadra',
        icon: '👥',
        contentHTML: html,
        size: 'md',
        modal: true,
        buttons: [
            { label: '📤 Esporta', color: 'secondary', onClick: () => editor.exportTeam(), close: false },
            { label: '+ Inserisci', color: 'secondary', onClick: () => editor.addTeamPlayer(), close: false },
            { label: '⬇ Importa da testo', color: 'secondary', onClick: () => editor.importPlayersFromText(), close: false },
            { label: '🗑️ Cancella Tutto', color: 'danger', onClick: () => editor.clearTeam(), close: false },
            { label: '❌ Chiudi', color: 'secondary', onClick: () => win.close(), close: true }
        ]
    });
    editor.renderTeamPlayersList();
}

// --- showSaveWorkoutDialogUnified ---
function showSaveWorkoutDialogUnified(editor) {
    const now = new Date();
    const defaultName = `Allenamento_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const html = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div><label>Nome File</label><input type="text" id="workoutFileName" value="${defaultName}" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;"></div>
            <div><label>Obiettivo Allenamento</label><textarea id="workoutGlobalObjective" style="width:100%;height:80px;padding:6px;border:1px solid #d1d5db;border-radius:4px;" placeholder="Descrivi l'obiettivo..."></textarea></div>
            <div><label>Osservazioni</label><textarea id="workoutGlobalObservations" style="width:100%;height:80px;padding:6px;border:1px solid #d1d5db;border-radius:4px;" placeholder="Note post-allenamento..."></textarea></div>
            <div id="workOutListName" style="background:#f3f4f6;padding:6px;border-radius:4px;max-height:128px;overflow-y:auto;"></div>
        </div>
    `;
    createWindow({
        title: 'Salva Allenamento Completo',
        icon: '💾',
        contentHTML: html,
        size: 'lg',
        modal: true,
        buttons: [
            { label: 'Annulla', color: 'secondary', onClick: () => { } },
            {
                label: 'Salva', color: 'success', onClick: () => {
                    editor.currentWorkoutObjective = document.getElementById('workoutGlobalObjective').value;
                    editor.currentWorkoutObservations = document.getElementById('workoutGlobalObservations').value;
                    editor.saveWorkout(document.getElementById('workoutFileName').value);
                }
            }
        ]
    });
    const tabList = document.getElementById('workOutListName');
    editor.tabs.forEach(tab => {
        const div = document.createElement('div');
        Object.assign(div.style, { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', marginRight: '4px', marginBottom: '4px', fontSize: '12px' });
        div.textContent = tab.name;
        tabList.appendChild(div);
    });
    document.getElementById('workoutFileName').select();
}

// ---
