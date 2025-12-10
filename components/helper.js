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


function createTaskbarIcon(win, icon, title, overlay, effect) {
    const iconDiv = document.createElement('div');

    Object.assign(iconDiv.style, {
        width: '32px',
        height: '32px',
        background: '#4b5563',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '6px',
        boxShadow: '0 0 5px rgba(0,0,0,0.3)'
    });

    iconDiv.textContent = icon;
    iconDiv.title = title;

    // Click → Restore
    iconDiv.onclick = () => {
        win.style.display = 'flex';
        if (overlay) overlay.style.display = 'flex';

        if (effect === "windows") {
            win.classList.add('win-effect-restore');
            setTimeout(() => win.classList.remove('win-effect-restore'), 260);
        }

        iconDiv.remove();
    };

    document.querySelector('#footer')?.appendChild(iconDiv);
}

function setButtonState(btn, disabled) {
    btn.disabled = disabled;
    if (disabled) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.onmouseenter = null;
        btn.onmouseleave = null;
    } else {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.onmouseenter = () => btn.style.opacity = '0.8';
        btn.onmouseleave = () => btn.style.opacity = '1';
    }
}

// ======================================================
// 2. createWindow completamente indipendente da Tailwind
// ======================================================

function createWindow({
    title = "Finestra",
    id = "",
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
    shadow,
    visible = true,
    effect = "none",
    listeners = {},
    lang = 'it'
} = {}) {

    if (!id) id = `win-${Math.floor(Math.random() * 1000000)}`;
    const existing = document.getElementById(id);
    if (existing) {
        existing.style.display = 'flex';
        bringToFront(existing);
        const existingOverlay = document.querySelector(`.overlay-for-${id}`);
        if (existingOverlay) existingOverlay.style.display = 'flex';
        return existing;
    }

    const tpl = windowTemplates[template] || {};
    headerBg = headerBg ?? tpl.headerBg ?? "#4b5563";
    contentBg = contentBg ?? tpl.contentBg ?? "#ffffff";
    contentColor = contentColor ?? tpl.contentColor ?? "#000000";
    footerBg = footerBg ?? tpl.footerBg ?? "#f3f4f6";
    footerBorder = footerBorder ?? tpl.footerBorder ?? "1px solid #d1d5db";
    rounded = rounded ?? tpl.rounded ?? true;
    shadow = shadow ?? tpl.shadow ?? "0 10px 25px rgba(0,0,0,0.2)";

    const percentSizes = {
        sm: { w: 0.35, h: 0.35 },
        md: { w: 0.45, h: 0.45 },
        lg: { w: 0.60, h: 0.55 },
        xl: { w: 0.75, h: 0.65 }
    };

    const dimensions = fullscreen
        ? { w: window.innerWidth * 0.95, h: window.innerHeight * 0.95 }
        : { w: window.innerWidth * (percentSizes[size]?.w ?? percentSizes.md.w), h: window.innerHeight * (percentSizes[size]?.h ?? percentSizes.md.h) };

    const centerX = (window.innerWidth - dimensions.w) / 2;
    const centerY = (window.innerHeight - dimensions.h) / 2;

    // ==================== Overlay ====================
    let overlay;
    let closeWindow = () => {
        win.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        onClose?.();
    };

    if (modal) {
        overlay = document.createElement('div');
        overlay.classList.add(`overlay-for-${id}`);
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: visible ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998
        });
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeWindow();
        });
    }

    // ==================== Finestra ====================
    const win = document.createElement('div');
    if (effect === "windows") win.classList.add('win-effect-resize');
    win.id = id;
    Object.assign(win.style, {
        position: 'absolute', width: dimensions.w + 'px', height: dimensions.h + 'px',
        left: centerX + 'px', top: centerY + 'px',
        zIndex: modal ? 9999 : ++zCounter,
        display: visible ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden',
        borderRadius: rounded ? '10px' : '0px', boxShadow: shadow,
        backgroundColor: contentBg, color: contentColor, fontFamily: 'Arial,sans-serif'
    });

    if (modal && overlay) {
        overlay.appendChild(win);
        win.addEventListener('click', e => e.stopPropagation());
    } else document.body.appendChild(win);

    // ==================== Titlebar ====================
    const titlebar = document.createElement('div');
    Object.assign(titlebar.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', cursor: 'grab', background: headerBg, color: '#fff', userSelect: 'none'
    });

    const titleLeft = document.createElement('div');
    titleLeft.style.display = 'flex'; titleLeft.style.gap = '8px';
    const iconSpan = document.createElement('span'); iconSpan.textContent = icon; iconSpan.style.fontSize = '16px';
    const titleSpan = document.createElement('span'); titleSpan.textContent = title; titleSpan.style.fontWeight = '600'; titleSpan.style.fontSize = '14px';
    titleSpan.setAttribute('data-i18n', title);
    titleLeft.appendChild(iconSpan); titleLeft.appendChild(titleSpan);

    const titleRight = document.createElement('div'); titleRight.style.display = 'flex'; titleRight.style.gap = '4px';
    const createBtn = (symbol, bgHover, bgNormal = '#9ca3af') => {
        const btn = document.createElement('button');
        btn.innerHTML = symbol;
        Object.assign(btn.style, {
            width: '24px', height: '24px', borderRadius: '50%', border: 'none',
            backgroundColor: bgNormal, color: '#fff', cursor: 'pointer', opacity: '0.7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', transition: 'all 0.2s'
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

    // ==================== Content ====================
    const content = document.createElement('div');
    content.innerHTML = contentHTML;
    content.setAttribute('data-i18n', contentHTML);
    Object.assign(content.style, { flex: '1', overflow: 'auto', padding: '12px', backgroundColor: contentBg, color: contentColor });
    win.appendChild(content);

    // ==================== Footer ====================
    if (buttons.length) {
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', backgroundColor: footerBg, borderTop: footerBorder, gap: '20px', position: 'relative'
        });
        win.appendChild(footer);

        const footerLeft = document.createElement('div');
        const footerCenter = document.createElement('div');
        const footerRight = document.createElement('div');
        footerLeft.style.display = footerCenter.style.display = footerRight.style.display = "flex";
        footerLeft.style.gap = footerCenter.style.gap = footerRight.style.gap = "8px";
        footer.appendChild(footerLeft); footer.appendChild(footerCenter); footer.appendChild(footerRight);

        // Pulsante overflow
        // Pulsante overflow
        // Nella sezione Footer di createWindow, sostituisci il codice del menu overflow con questo:

        // Pulsante overflow
        const overflowBtn = document.createElement('button');
        overflowBtn.textContent = '⋯';
        Object.assign(overflowBtn.style, {
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: '#6b7280',
            display: 'none',
            position: 'absolute',
            right: '12px',
            zIndex: '1000',
            border: '1px solid #ccc'
        });
        footer.appendChild(overflowBtn);

        const hiddenMenu = document.createElement('div');
        Object.assign(hiddenMenu.style, {
            position: 'absolute',
            display: 'none',
            flexDirection: 'column',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: '10001',
            minWidth: '150px',
            overflow: 'hidden'
        });
        footer.appendChild(hiddenMenu); // Aggiungiamo al footer invece che al body

        overflowBtn.addEventListener('click', e => {
            e.stopPropagation();
            // Posiziona il menu sopra il pulsante overflow
            hiddenMenu.style.right = '12px';
            hiddenMenu.style.bottom = (overflowBtn.offsetHeight + 8) + 'px';
            hiddenMenu.style.display = hiddenMenu.style.display === 'flex' ? 'none' : 'flex';
        });

        document.addEventListener('click', e => {
            if (!hiddenMenu.contains(e.target) && e.target !== overflowBtn) {
                hiddenMenu.style.display = 'none';
            }
        });

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.setAttribute('data-i18n', b.label);
            btn.id = b.id || `btn-${Math.floor(Math.random() * 1000000)}`;
            Object.assign(btn.style, {
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: '0.2s',
                backgroundColor: b.color ? null : '#2563eb',
                color: '#fff',
                whiteSpace: 'nowrap' // Previene il wrapping del testo
            });

            switch (b.color) {
                case 'success': btn.style.backgroundColor = '#16a34a'; break;
                case 'danger': btn.style.backgroundColor = '#dc2626'; break;
                case 'warning': btn.style.backgroundColor = '#eab308'; break;
                case 'secondary': btn.style.backgroundColor = '#6b7280'; break;
                case 'primary': btn.style.backgroundColor = '#2563eb'; break;
            }

            if (b.class) btn.className = b.class;
            if (b.disabled) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.onmouseenter = () => btn.style.opacity = '0.8';
                btn.onmouseleave = () => btn.style.opacity = '1';
            }

            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    b.onClick?.();
                    if (b.close !== false) closeWindow();
                    hiddenMenu.style.display = 'none'; // Chiudi il menu dopo il click
                }
            });

            if (b.align === "left") footerLeft.appendChild(btn);
            else if (b.align === "center") footerCenter.appendChild(btn);
            else footerRight.appendChild(btn);
        });

        let resizeTimeout;
        let isFirstCalculation = true;

        const updateFooterButtons = () => {
            // Debouncing per evitare calcoli continui
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                const footerWidth = footer.offsetWidth;
                const overflowBtnWidth = 50;
                const availableWidth = footerWidth - overflowBtnWidth - 60;

                const allBtns = [...footerLeft.children, ...footerCenter.children, ...footerRight.children]
                    .filter(b => b !== overflowBtn);

                // Calcola prima quali pulsanti nascondere senza modificare il DOM
                let usedWidth = 0;
                let hidden = [];

                allBtns.forEach(btn => {
                    const btnWidth = btn.offsetWidth + 8;
                    usedWidth += btnWidth;
                    if (usedWidth > availableWidth) {
                        hidden.push(btn);
                    }
                });

                // Applica tutte le modifiche al DOM in un'unica operazione
                requestAnimationFrame(() => {
                    // Usa visibility invece di display per evitare ricalcoli di layout
                    hidden.forEach(btn => {
                        btn.style.visibility = 'hidden';
                        btn.style.position = 'absolute';
                    });

                    allBtns.forEach(btn => {
                        if (!hidden.includes(btn)) {
                            btn.style.visibility = 'visible';
                            btn.style.position = 'static';
                        }
                    });

                    overflowBtn.style.display = hidden.length ? 'inline-block' : 'none';

                    // Ricostruisci menu nascosto
                    hiddenMenu.innerHTML = '';
                    hidden.forEach(btn => {
                        const clone = btn.cloneNode(true);
                        Object.assign(clone.style, {
                            width: '100%',
                            display: 'block',
                            margin: '0',
                            opacity: '0.8',
                            borderRadius: '0',
                            textAlign: 'left',
                            visibility: 'visible',
                            position: 'static'
                        });

                        clone.addEventListener('click', () => {
                            btn.click();
                        });

                        clone.addEventListener('mouseenter', () => {
                            clone.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
                            clone.style.opacity = '1';
                        });

                        clone.addEventListener('mouseleave', () => {
                            clone.style.boxShadow = 'none';
                            clone.style.opacity = '0.8';
                        });

                        hiddenMenu.appendChild(clone);
                    });

                    // Mostra il footer dopo il primo calcolo
                    if (isFirstCalculation) {
                        footer.style.opacity = '1';
                        isFirstCalculation = false;
                    }
                });
            }, 50); // Debounce di 50ms
        };

        // Nascondi temporaneamente il footer durante il calcolo iniziale
        footer.style.opacity = '0';
        footer.style.transition = 'opacity 0.2s';

        const footerResizeObserver = new ResizeObserver(updateFooterButtons);
        footerResizeObserver.observe(win);

        // Esegui il primo calcolo dopo che il DOM è stato renderizzato
        setTimeout(updateFooterButtons, 0);
    }

    // ==================== Drag ====================
    let dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') return; dragging = true; dx = e.clientX - win.offsetLeft; dy = e.clientY - win.offsetTop; bringToFront(win); document.body.style.userSelect = 'none'; });
    window.addEventListener('mousemove', e => { if (!dragging) return; let nx = e.clientX - dx, ny = e.clientY - dy; nx = Math.max(0, Math.min(nx, window.innerWidth - win.offsetWidth)); ny = Math.max(0, Math.min(ny, window.innerHeight - win.offsetHeight)); win.style.left = nx + 'px'; win.style.top = ny + 'px'; });
    window.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });

    // ==================== Min / Max / Close ====================
    let maximized = false, prev = {};
    btnMax.addEventListener('click', () => {
        if (!maximized) { prev = { left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight }; win.style.left = '20px'; win.style.top = '20px'; win.style.width = (window.innerWidth - 40) + 'px'; win.style.height = (window.innerHeight - 40) + 'px'; maximized = true; }
        else { win.style.left = prev.left + 'px'; win.style.top = prev.top + 'px'; win.style.width = prev.width + 'px'; win.style.height = prev.height + 'px'; maximized = false; }
    });
    btnMin.addEventListener('click', () => { win.style.display = 'none'; if (overlay) overlay.style.display = 'none'; createTaskbarIcon(win, icon, title, overlay, effect); });
    btnClose.addEventListener('click', closeWindow);

    // ==================== Resize grips ====================
    const createResizeGrips = (win) => {
        const grips = [
            { pos: 'top', cursor: 'n-resize' }, { pos: 'bottom', cursor: 's-resize' },
            { pos: 'left', cursor: 'w-resize' }, { pos: 'right', cursor: 'e-resize' },
            { pos: 'top-left', cursor: 'nw-resize' }, { pos: 'top-right', cursor: 'ne-resize' },
            { pos: 'bottom-left', cursor: 'sw-resize' }, { pos: 'bottom-right', cursor: 'se-resize' }
        ];
        grips.forEach(g => {
            const div = document.createElement('div'); div.dataset.pos = g.pos;
            Object.assign(div.style, { position: 'absolute', cursor: g.cursor, zIndex: 10000, background: 'transparent' });
            if (g.pos.includes('top') || g.pos.includes('bottom')) div.style.height = '8px'; else div.style.height = '100%';
            if (g.pos.includes('left') || g.pos.includes('right')) div.style.width = '8px'; else div.style.width = '100%';
            if (g.pos.includes('top')) div.style.top = '0';
            if (g.pos.includes('bottom')) div.style.bottom = '0';
            if (g.pos.includes('left')) div.style.left = '0';
            if (g.pos.includes('right')) div.style.right = '0';
            win.appendChild(div);

            let resizing = false, startX, startY, startW, startH, startL, startT;
            div.addEventListener('mousedown', e => { e.stopPropagation(); resizing = true; startX = e.clientX; startY = e.clientY; startW = win.offsetWidth; startH = win.offsetHeight; startL = win.offsetLeft; startT = win.offsetTop; document.body.style.userSelect = 'none'; });
            window.addEventListener('mousemove', e => {
                if (!resizing) return;
                let dx = e.clientX - startX, dy = e.clientY - startY;
                const minWidth = 250;
                const minHeight = titlebar.offsetHeight + (footer ? footer.offsetHeight : 0) + 50;

                switch (g.pos) {
                    case 'top': { let newH = Math.max(startH - dy, minHeight); win.style.height = newH + 'px'; win.style.top = startT + (startH - newH) + 'px'; break; }
                    case 'bottom': win.style.height = Math.max(startH + dy, minHeight) + 'px'; break;
                    case 'left': { let newW = Math.max(startW - dx, minWidth); win.style.width = newW + 'px'; win.style.left = startL + (startW - newW) + 'px'; break; }
                    case 'right': win.style.width = Math.max(startW + dx, minWidth) + 'px'; break;
                    case 'top-left': { let newW = Math.max(startW - dx, minWidth); let newH = Math.max(startH - dy, minHeight); win.style.width = newW + 'px'; win.style.left = startL + (startW - newW) + 'px'; win.style.height = newH + 'px'; win.style.top = startT + (startH - newH) + 'px'; break; }
                    case 'top-right': { let newW = Math.max(startW + dx, minWidth); let newH = Math.max(startH - dy, minHeight); win.style.width = newW + 'px'; win.style.height = newH + 'px'; win.style.top = startT + (startH - newH) + 'px'; break; }
                    case 'bottom-left': { let newW = Math.max(startW - dx, minWidth); let newH = Math.max(startH + dy, minHeight); win.style.width = newW + 'px'; win.style.left = startL + (startW - newW) + 'px'; win.style.height = newH + 'px'; break; }
                    case 'bottom-right': win.style.width = Math.max(startW + dx, minWidth) + 'px'; win.style.height = Math.max(startH + dy, minHeight) + 'px'; break;
                }
            });
            window.addEventListener('mouseup', () => { resizing = false; document.body.style.userSelect = ''; });
        });
    };
    createResizeGrips(win);

    translateElements(lang);
    win.showDialog = () => { win.style.display = 'flex'; if (overlay) overlay.style.display = 'flex'; bringToFront(win); translateElements(lang); };
    win.hideDialog = () => closeWindow();
    if (typeof listeners.domReady === "function") listeners.domReady(win);

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
function getFormattedDate(date = new Date()) {
    const now = new Date(date);

    // Formatta la data e ora come vuoi, ad esempio: "2025-09-24 15:30"
    const formattedDate = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + "_ " +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');
    return formattedDate;
}

/**
         * Funzione per la traduzione: cerca tutti gli elementi con 'data-i18n'
         * e li aggiorna con la traduzione appropriata.
         * @param {string} lang - La chiave della lingua ('it', 'en', 'fr').
         */
function translateElements(lang) {
    const currentDictionary = translations[lang];

    if (!currentDictionary) {
        console.error(`Dizionario per la lingua '${lang}' non trovato.`);
        return;
    }

    // 1. Traduce il contenuto di testo
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (currentDictionary[key]) {
            // Mantiene il contenuto originale (come l'emoji) se presente
            const originalContent = element.innerHTML.match(/^(.*?)\s?/) ? element.innerHTML.match(/^(.*?)\s?/)[1] : '';

            // Aggiorna solo il testo, cercando di preservare gli eventuali prefissi non testuali (come le emoji)
            // Questa logica è semplificata e funziona se l'emoji è all'inizio.
            if (originalContent && originalContent.length < 5) { // Assumiamo che l'emoji sia breve
                element.innerHTML = originalContent + ' ' + currentDictionary[key];
            } else {
                element.textContent = currentDictionary[key];
            }
        }
    });

    // 2. Traduce gli attributi placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (currentDictionary[key]) {
            element.setAttribute('placeholder', currentDictionary[key]);
        }
    });

    // 3. Traduce gli attributi title (se presenti, non usati in questa demo)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (currentDictionary[key]) {
            element.setAttribute('title', currentDictionary[key]);
        }
    });

    // 4. Aggiorna l'attributo lang della pagina
    document.documentElement.lang = lang;
}

/**
 * Imposta la lingua e avvia la traduzione.
 * @param {string} lang - La lingua selezionata.
 */
function setLanguage(lang) {
    translateElements(lang);
}