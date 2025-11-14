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

let zCounter = 200; // baseline z-index for windows
const minWidth = 200;
const minHeight = 80;
// createWindow factory
function createWindow({ title = "Finestra", contentHTML = "", buttons = [], modal = false, icon = "📝" } = {}) {
    let overlay;
    if (modal) {
        overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
        overlay.style.zIndex = zCounter + 1000; // ensure above other windows
        document.body.appendChild(overlay);

        // click on overlay closes modal (only if clicked outside the modal)
        overlay.addEventListener('click', () => {
            // remove the win + overlay
            if (win) win.remove();
            overlay.remove();
        });
    }

    const win = document.createElement('div');
    win.className = 'win absolute bg-white shadow-lg';
    win.style.width = '540px';
    win.style.height = '360px';
    win.style.left = `${120 + Math.random() * 60}px`;
    win.style.top = `${120 + Math.random() * 60}px`;
    win.style.zIndex = modal ? (zCounter + 1001) : zCounter + 1;
    if (modal) {
        // append inside overlay so it's above the overlay background but clicks inside must not propagate
        overlay.appendChild(win);
        win.addEventListener('click', e => e.stopPropagation());
    } else {
        document.body.appendChild(win);
    }

    // titlebar
    const titlebar = document.createElement('div');
    titlebar.className = 'win-titlebar flex items-center justify-between px-3 py-2 win-titlebar';
    titlebar.innerHTML = `
    <div class="flex items-center gap-2">
      <div style="width:10px;height:10px;background:#34d399;border-radius:4px"></div>
      <div style="font-weight:600">${title}</div>
    </div>
    <div class="flex items-center gap-2">
      <button class="btn-min w-6 h-6 rounded-full" title="Minimize" style="background:#fbbf24"></button>
      <button class="btn-max w-6 h-6 rounded-full" title="Maximize" style="background:#60a5fa"></button>
      <button class="btn-close w-6 h-6 rounded-full" title="Close" style="background:#f87171"></button>
    </div>
  `;
    titlebar.style.background = 'linear-gradient(90deg,#0ea5e9,#0369a1)';
    titlebar.style.color = '#fff';
    win.appendChild(titlebar);

    // content
    const content = document.createElement('div');
    content.className = 'p-4';
    content.style.height = 'calc(100% - 48px)';
    content.innerHTML = contentHTML;
    win.appendChild(content);

    // bottom buttons area (optional)
    if (buttons && buttons.length) {
        const btnArea = document.createElement('div');
        btnArea.className = 'absolute left-0 right-0 bottom-0 p-2 flex justify-end bg-gray-100 border-t';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.className = 'ml-2 px-3 py-1 rounded bg-sky-600 text-white';
            btn.addEventListener('click', b.onClick);
            btnArea.appendChild(btn);
        });
        win.appendChild(btnArea);
        // shrink content area
        content.style.height = 'calc(100% - 48px - 44px)';
    }

    // resize handles
    const handles = ["t", "b", "l", "r", "tl", "tr", "bl", "br"];
    handles.forEach(hc => {
        const h = document.createElement('div');
        h.className = `resize-handle ${hc}`;
        win.appendChild(h);
    });

    // --- interactions: bring to front on mousedown anywhere in window ---
    win.addEventListener('mousedown', () => bringToFront(win));

    // drag from titlebar
    let dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        dragging = true;
        dx = e.clientX - win.offsetLeft;
        dy = e.clientY - win.offsetTop;
        bringToFront(win);
        // prevent selection
        document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        win.style.left = `${e.clientX - dx}px`;
        win.style.top = `${e.clientY - dy}px`;
    });
    window.addEventListener('mouseup', () => {
        dragging = false;
        document.body.style.userSelect = '';
    });

    // resize logic (shared)
    let resizing = false, handleType = null, startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0;
    win.querySelectorAll('.resize-handle').forEach(hEl => {
        hEl.addEventListener('mousedown', e => {
            e.stopPropagation();
            resizing = true;
            handleType = hEl.classList[1];
            startX = e.clientX; startY = e.clientY;
            startW = win.offsetWidth; startH = win.offsetHeight;
            startL = win.offsetLeft; startT = win.offsetTop;
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
        win.style.width = newW + 'px';
        win.style.height = newH + 'px';
        win.style.left = newL + 'px';
        win.style.top = newT + 'px';
    });

    window.addEventListener('mouseup', () => {
        if (resizing) {
            resizing = false;
            document.body.style.userSelect = '';
        }
    });

    // window control buttons
    const btnClose = titlebar.querySelector('.btn-close');
    const btnMin = titlebar.querySelector('.btn-min');
    const btnMax = titlebar.querySelector('.btn-max');

    btnClose.addEventListener('click', () => {
        win.remove();
        if (overlay) overlay.remove();
    });

    btnMin.addEventListener('click', () => {
        win.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden'); // nasconde l’overlay con la finestra modale

        const icon = document.createElement('div');
        icon.className = 'w-8 h-8 rounded flex items-center justify-center bg-yellow-400 text-sm cursor-pointer';
        icon.textContent = "🪟"; // icona generica
        icon.title = title;
        icon.addEventListener('click', () => {
            win.classList.remove('hidden');
            if (overlay) overlay.classList.remove('hidden'); // riporta anche l’overlay visibile
            icon.remove();
        });
        taskbarIcons.appendChild(icon);
    });

    let maximized = false;
    let prev = {};
    btnMax.addEventListener('click', () => {
        if (!maximized) {
            prev = { left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight };
            win.style.left = `${sidebarLeft.offsetWidth + 12}px`;
            win.style.top = `${topbar.offsetHeight + 8}px`;
            win.style.width = `${window.innerWidth - sidebarLeft.offsetWidth - sidebarRight.offsetWidth - 24}px`;
            win.style.height = `${window.innerHeight - topbar.offsetHeight - taskbar.offsetHeight - 24}px`;
            maximized = true;
        } else {
            win.style.left = prev.left + 'px';
            win.style.top = prev.top + 'px';
            win.style.width = prev.width + 'px';
            win.style.height = prev.height + 'px';
            maximized = false;
        }
    });

    return win;
}