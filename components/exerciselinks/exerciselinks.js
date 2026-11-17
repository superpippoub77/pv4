/**
 * ExerciseLinks — collegamenti di un esercizio (scheda Esercizio del pannello) e di un singolo oggetto del disegno.
 *
 * Un esercizio può avere uno o più collegamenti verso:
 *  - un'altra scheda aperta (anche una nuova, magari con una copia del disegno, per il dettaglio di una zona);
 *  - un esercizio della libreria online;
 *  - una pagina web o un video.
 * Ogni collegamento ha un tipo (dettaglio, variante, progressione, propedeutico, collegato…) e una nota.
 * Tra due schede si può aggiungere in automatico il collegamento di ritorno (dettaglio ↔ esercizio principale).
 *
 * Dati:  tab.links = [link, …]      oggetto.link = link
 *        link = { id, kind, target: 'tab'|'lib'|'url', uid?, libId?, url?, name, note }
 * Le schede si riconoscono dal loro uid (editor.tabUid), che resta uguale nel salvataggio automatico,
 * negli allenamenti salvati e negli esercizi della libreria; se la scheda non è aperta e l'esercizio è
 * in libreria (libId) il collegamento lo riapre da lì.
 */
class ExerciseLinks {
    static KINDS = [
        { key: 'detail', icon: '🔍', label: 'Dettaglio', inverse: 'parent' },
        { key: 'variant', icon: '🔀', label: 'Variante', inverse: 'variant' },
        { key: 'progression', icon: '📈', label: 'Progressione (esercizio successivo)', short: 'Progressione', inverse: 'prereq' },
        { key: 'prereq', icon: '🧱', label: 'Propedeutico (esercizio precedente)', short: 'Propedeutico', inverse: 'progression' },
        { key: 'related', icon: '🔗', label: 'Esercizio collegato', inverse: 'related' },
        { key: 'parent', icon: '⬆️', label: 'Esercizio principale', inverse: 'detail' },
        { key: 'web', icon: '🌐', label: 'Pagina web o video' }
    ];

    static kind(key) { return ExerciseLinks.KINDS.find(k => k.key === key) || ExerciseLinks.KINDS[4]; }

    static esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    constructor(editor) {
        this.editor = editor;
        this.libItems = null; // elenco della libreria (caricato alla prima apertura della finestra)
    }

    newId() { return 'ln' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    toast(msg, err) {
        if (window.Pv4Library && window.Pv4Library.toast) window.Pv4Library.toast(msg, err);
        else this.editor.flashMessage?.(msg);
    }

    // ------------------------------------------------------------------
    // Destinazione: nome aggiornato, scheda aperta, apertura
    // ------------------------------------------------------------------

    /** Id della scheda aperta a cui punta il collegamento (null se non è aperta) */
    findTab(link) {
        const ed = this.editor;
        if (link.target === 'tab') {
            const id = ed.findTabByUid(link.uid);
            if (id != null) return id;
        }
        if (link.libId) {
            for (const [id, t] of ed.tabs) if (t.lib && t.lib.id === link.libId) return id;
        }
        return null;
    }

    /** Nome da mostrare (quello attuale della scheda, se è aperta) e aggiornamento dei dati salvati */
    refresh(link) {
        const id = this.findTab(link);
        if (id == null) return false;
        const t = this.editor.tabs.get(id);
        if (t.name) link.name = t.name;
        if (t.lib && t.lib.id) link.libId = t.lib.id;
        if (link.target === 'tab' && !link.uid) link.uid = this.editor.tabUid(t);
        return true;
    }

    label(link) {
        if (link.target === 'url') return link.name || link.url || '';
        return link.name || 'Esercizio';
    }

    where(link) {
        if (link.target === 'url') return link.url || '';
        const open = this.findTab(link) != null;
        if (open) return 'scheda aperta';
        if (link.libId) return 'dalla libreria';
        return 'scheda non aperta';
    }

    async open(link) {
        if (!link) return;
        const ed = this.editor;
        if (link.target === 'url') {
            let url = (link.url || '').trim();
            if (!url) return;
            if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
            if (!/^https?:/i.test(url)) { this.toast('Indirizzo non valido: ' + url, true); return; }
            window.open(url, '_blank', 'noopener');
            return;
        }
        const id = this.findTab(link);
        if (id != null) { ed.switchToTab(id); return; }
        if (link.libId && window.Pv4Library) {
            if (!window.Pv4Library.isAvailable()) { this.toast('Per aprire «' + this.label(link) + '» dalla libreria accedi al tuo account.', true); return; }
            const ok = await window.Pv4Library.load(link.libId);
            if (ok) return;
        }
        this.toast('La scheda «' + this.label(link) + '» non è aperta. Aprila (o salvala in libreria, così il collegamento la riapre da solo).', true);
    }

    // ------------------------------------------------------------------
    // Pannello (scheda Esercizio)
    // ------------------------------------------------------------------

    linksOf(tab) {
        if (!tab) return [];
        if (!Array.isArray(tab.links)) tab.links = [];
        return tab.links;
    }

    render() {
        const host = document.getElementById('exerciseLinksList');
        if (!host) return;
        const tab = this.editor.getCurrentTab();
        const links = this.linksOf(tab);
        if (!links.length) {
            host.innerHTML = '<div class="exl-empty">Nessun collegamento. Collega un dettaglio, una variante, una progressione o un altro esercizio.</div>';
            return;
        }
        host.innerHTML = links.map((l, i) => {
            this.refresh(l);
            const k = ExerciseLinks.kind(l.kind);
            const where = this.where(l);
            const off = where === 'scheda non aperta';
            return `<div class="exl-item${off ? ' off' : ''}" data-i="${i}">
                <button type="button" class="exl-open" data-act="open" title="Apri ${ExerciseLinks.esc(this.label(l))}">
                    <span class="exl-ico">${k.icon}</span>
                    <span class="exl-txt"><b>${ExerciseLinks.esc(k.short || k.label)}</b> · ${ExerciseLinks.esc(this.label(l))}
                    <small>${ExerciseLinks.esc(l.target === 'url' && this.label(l) === where ? '' : where)}${l.note ? (l.target === 'url' && this.label(l) === where ? '' : ' — ') + ExerciseLinks.esc(l.note) : ''}</small></span>
                </button>
                <button type="button" class="exl-btn" data-act="edit" title="Modifica il collegamento">✎</button>
                <button type="button" class="exl-btn" data-act="del" title="Togli il collegamento">🗑</button>
            </div>`;
        }).join('');
    }

    bindPanel() {
        const host = document.getElementById('exerciseLinksList');
        if (host && !host._bound) {
            host._bound = true;
            host.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-act]');
                const row = e.target.closest('.exl-item');
                if (!btn || !row) return;
                const tab = this.editor.getCurrentTab();
                const links = this.linksOf(tab);
                const i = +row.dataset.i;
                const link = links[i];
                if (!link) return;
                if (btn.dataset.act === 'open') this.open(link);
                else if (btn.dataset.act === 'edit') this.showDialog({ mode: 'tab', link });
                else if (btn.dataset.act === 'del') this.remove(tab, link);
            });
        }
        const add = document.getElementById('exerciseLinkAdd');
        if (add && !add._bound) { add._bound = true; add.addEventListener('click', () => this.showDialog({ mode: 'tab' })); }
        this.render();
    }

    remove(tab, link) {
        if (!confirm('Togliere il collegamento «' + this.label(link) + '»?')) return;
        tab.links = this.linksOf(tab).filter(l => l !== link);
        // anche il collegamento di ritorno, se c'è
        const otherId = link.target === 'tab' ? this.findTab(link) : null;
        if (otherId != null && link.back) {
            const other = this.editor.tabs.get(otherId);
            const myUid = this.editor.tabUid(tab);
            if (other && Array.isArray(other.links)) other.links = other.links.filter(l => !(l.back === link.back && l.uid === myUid));
        }
        this.render();
        this.editor.saveState('Collegamento tolto');
    }

    // ------------------------------------------------------------------
    // Collegamento di un oggetto del disegno
    // ------------------------------------------------------------------

    /** Distintivo 🔗 sull'oggetto collegato: un clic apre la destinazione */
    decorateObject(element, object) {
        if (!element) return;
        element.querySelector(':scope > .obj-link-badge')?.remove();
        if (!object || !object.link) return;
        const k = ExerciseLinks.kind(object.link.kind);
        const b = document.createElement('div');
        b.className = 'obj-link-badge';
        b.textContent = k.icon;
        b.title = `${k.short || k.label}: ${this.label(object.link)} — clic per aprire`;
        element.appendChild(b);
        // Il foglio è un contesto 3D: il browser può consegnare il clic al contenuto dell'oggetto invece che al
        // distintivo. Si controlla quindi, in fase di cattura sull'oggetto, se il punto cade dentro il distintivo.
        if (!element._linkHitBound) {
            element._linkHitBound = true;
            const inside = (e) => {
                const bd = element.querySelector(':scope > .obj-link-badge');
                if (!bd) return false;
                const r = bd.getBoundingClientRect();
                return e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2;
            };
            element.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !inside(e)) return;
                e.stopPropagation(); e.preventDefault();
                element._linkPress = true;
            }, true);
            element.addEventListener('click', (e) => {
                if (!element._linkPress) return;
                element._linkPress = false;
                e.stopPropagation(); e.preventDefault();
                const obj = this.editor.getCurrentTab()?.objects.get(element.id);
                if (obj && obj.link && inside(e)) this.open(obj.link);
            }, true);
            element.addEventListener('dblclick', (e) => { if (inside(e)) { e.stopPropagation(); e.preventDefault(); } }, true);
        }
    }

    refreshObject(object) {
        const el = document.getElementById(object.id);
        if (el) this.decorateObject(el, object);
    }

    objectMenuItems(object) {
        if (!object) return [];
        const items = [{ label: object.link ? '🔗 Modifica collegamento…' : '🔗 Collega a un dettaglio o esercizio…', action: () => this.showDialog({ mode: 'object', object }) }];
        if (object.link) {
            items.push({ label: '↗ Apri «' + this.label(object.link).slice(0, 28) + '»', action: () => this.open(object.link) });
            items.push({ label: '✖ Togli collegamento', action: () => { object.link = null; this.refreshObject(object); this.editor.saveState('Collegamento tolto'); } });
        }
        return items;
    }

    // ------------------------------------------------------------------
    // Finestra «Collega…»
    // ------------------------------------------------------------------

    /** opts = { mode: 'tab'|'object', link? (da modificare), object? } */
    showDialog(opts) {
        const ed = this.editor;
        const tab = ed.getCurrentTab();
        const editing = opts.link || (opts.mode === 'object' ? opts.object?.link : null) || null;
        this.dlg = { ...opts, editing, tabId: ed.activeTabId };
        const E = ExerciseLinks.esc;
        const others = [...ed.tabs.entries()].filter(([id]) => id !== ed.activeTabId);
        const curTarget = editing ? editing.target : (others.length ? 'tab' : 'new');
        const curTabId = editing && editing.target === 'tab' ? this.findTab(editing) : null;
        const kinds = ExerciseLinks.KINDS.filter(k => k.key !== 'web')
            .map(k => `<option value="${k.key}"${(editing ? editing.kind : 'detail') === k.key ? ' selected' : ''}>${k.icon} ${E(k.label)}</option>`).join('');
        const tabOpts = others.map(([id, t]) => `<option value="${id}"${id === curTabId ? ' selected' : ''}>${E(t.name || 'Schema ' + id)}</option>`).join('');
        const baseName = (opts.mode === 'object' && opts.object ? (opts.object.text || opts.object.objectNumber || 'zona') : (tab.name || 'Schema'));
        const radio = (v, label, dis) => `<label class="exl-radio${dis ? ' dis' : ''}"><input type="radio" name="exlTarget" value="${v}"${curTarget === v ? ' checked' : ''}${dis ? ' disabled' : ''}> ${label}</label>`;
        const libOk = !!(window.Pv4Library && window.Pv4Library.isAvailable());

        const html = `<div class="exl-dlg">
            <p class="exl-hint">${opts.mode === 'object' ? 'Collega questo oggetto del disegno: sull\'oggetto compare 🔗 e con un clic si apre la destinazione.' : 'Collega questo esercizio: il collegamento compare nella scheda Esercizio e nel PDF.'}</p>
            <div class="exl-field" id="exlKindRow"><span>Tipo</span><select id="exlKind">${kinds}</select></div>
            <div class="exl-field"><span>Collega a</span>
                <div class="exl-radios">
                    ${radio('tab', 'Scheda aperta', !others.length)}
                    ${radio('new', 'Nuova scheda')}
                    ${radio('lib', 'Esercizio della libreria', !libOk && curTarget !== 'lib')}
                    ${radio('url', 'Pagina web o video')}
                </div>
            </div>
            <div class="exl-pane" data-pane="tab"><select id="exlTab">${tabOpts}</select></div>
            <div class="exl-pane" data-pane="new">
                <input type="text" id="exlNewName" value="${E(baseName + ' · dettaglio')}" placeholder="Nome della nuova scheda">
                <label class="exl-check"><input type="checkbox" id="exlCopy" checked> Parti da una copia di questo disegno (da ingrandire o modificare)</label>
            </div>
            <div class="exl-pane" data-pane="lib">
                <input type="search" id="exlLibSearch" placeholder="Cerca nella libreria…">
                <div id="exlLibList" class="exl-liblist">${libOk ? 'Caricamento…' : 'Accedi al tuo account per collegare un esercizio della libreria.'}</div>
            </div>
            <div class="exl-pane" data-pane="url">
                <input type="url" id="exlUrl" placeholder="https://…" value="${E(editing && editing.target === 'url' ? editing.url : '')}">
                <input type="text" id="exlUrlName" placeholder="Titolo (facoltativo)" value="${E(editing && editing.target === 'url' ? editing.name : '')}">
            </div>
            <label class="exl-check" id="exlBackRow"><input type="checkbox" id="exlBack" checked> Aggiungi anche il collegamento di ritorno nell'altra scheda</label>
            <div class="exl-field"><span>Nota (facoltativa)</span><input type="text" id="exlNote" value="${E(editing ? editing.note || '' : '')}" placeholder="es. lavoro del libero in ricezione"></div>
        </div>`;

        this.win?.remove?.();
        document.querySelectorAll('.overlay-for-exerciseLinkWin').forEach(o => o.remove());
        this.win = createWindow({
            title: editing ? 'Modifica collegamento' : 'Collega…',
            icon: '🔗',
            id: 'exerciseLinkWin',
            contentHTML: html,
            effect: 'windows',
            size: 'md',
            modal: true,
            buttons: [
                { id: 'exlCancel', label: 'Annulla', color: 'secondary', onClick: () => { } },
                { id: 'exlOk', label: editing ? 'Salva' : 'Collega', close: false, color: 'success', onClick: () => this.confirm() }
            ]
        });
        const w = this.win;
        if (editing && editing.target === 'lib') this.dlg.libPick = { id: editing.libId, name: editing.name };
        w.querySelectorAll('input[name=exlTarget]').forEach(r => r.addEventListener('change', () => this.syncPanes()));
        w.querySelector('#exlLibSearch')?.addEventListener('input', () => this.renderLib());
        w.querySelector('#exlLibList')?.addEventListener('click', (e) => {
            const it = e.target.closest('[data-lib]');
            if (!it) return;
            this.dlg.libPick = { id: it.dataset.lib, name: it.dataset.name };
            this.renderLib();
        });
        this.syncPanes();
        if (libOk) this.loadLib();
    }

    syncPanes() {
        const w = this.win;
        const v = w.querySelector('input[name=exlTarget]:checked')?.value || 'new';
        w.querySelectorAll('.exl-pane').forEach(p => { p.style.display = p.dataset.pane === v ? '' : 'none'; });
        w.querySelector('#exlKindRow').style.display = v === 'url' ? 'none' : '';
        // il ritorno si può scrivere solo in una scheda (aperta o nuova)
        const backRow = w.querySelector('#exlBackRow');
        backRow.style.display = (v === 'tab' || v === 'new') && !this.dlg.editing ? '' : 'none';
    }

    async loadLib() {
        try {
            if (!this.libItems) {
                const data = await CloudApi.get('list.php');
                this.libItems = (data.items || []).map(it => ({ id: it.id, name: it.name || '(senza nome)', folder: it.folderId || null }));
                this.libFolders = new Map((data.folders || []).map(f => [f.id, f.name]));
            }
            this.renderLib();
        } catch (err) {
            const host = this.win?.querySelector('#exlLibList');
            if (host) host.textContent = 'Libreria non raggiungibile: ' + err.message;
        }
    }

    renderLib() {
        const host = this.win?.querySelector('#exlLibList');
        if (!host || !this.libItems) return;
        const q = (this.win.querySelector('#exlLibSearch')?.value || '').trim().toLowerCase();
        const pick = this.dlg.libPick;
        const items = this.libItems.filter(it => !q || it.name.toLowerCase().includes(q)).slice(0, 200);
        if (!items.length) { host.innerHTML = '<div class="exl-empty">Nessun esercizio trovato.</div>'; return; }
        const E = ExerciseLinks.esc;
        host.innerHTML = items.map(it => `<div class="exl-libit${pick && pick.id === it.id ? ' on' : ''}" data-lib="${E(it.id)}" data-name="${E(it.name)}">📄 ${E(it.name)}${it.folder && this.libFolders.get(it.folder) ? ` <small>📁 ${E(this.libFolders.get(it.folder))}</small>` : ''}</div>`).join('');
    }

    /** Scrive il collegamento (nuovo o modificato) */
    async confirm() {
        const ed = this.editor;
        const w = this.win;
        const d = this.dlg;
        const srcTab = ed.tabs.get(d.tabId);
        if (!srcTab) { w.hideDialog(); return; }
        const target = w.querySelector('input[name=exlTarget]:checked')?.value || 'new';
        const kind = target === 'url' ? 'web' : w.querySelector('#exlKind').value;
        const note = w.querySelector('#exlNote').value.trim();
        const link = { id: d.editing ? d.editing.id : this.newId(), kind, target: target === 'new' ? 'tab' : target, note };
        if (d.editing && d.editing.back) link.back = d.editing.back;
        const wantBack = (target === 'tab' || target === 'new') && !d.editing && w.querySelector('#exlBack').checked;

        if (target === 'url') {
            const url = w.querySelector('#exlUrl').value.trim();
            if (!url) { this.toast('Scrivi l\'indirizzo della pagina o del video.', true); return; }
            link.url = url;
            link.name = w.querySelector('#exlUrlName').value.trim() || url.replace(/^https?:\/\//i, '').slice(0, 60);
        } else if (target === 'lib') {
            if (!d.libPick || !d.libPick.id) { this.toast('Scegli un esercizio della libreria.', true); return; }
            link.libId = d.libPick.id;
            link.name = d.libPick.name;
        } else if (target === 'tab') {
            const id = +w.querySelector('#exlTab').value;
            const t = ed.tabs.get(id);
            if (!t) { this.toast('Scegli la scheda da collegare.', true); return; }
            link.uid = ed.tabUid(t);
            link.name = t.name || ('Schema ' + id);
            if (t.lib && t.lib.id) link.libId = t.lib.id;
        }

        w.hideDialog();

        if (target === 'new') {
            const name = w.querySelector('#exlNewName').value.trim() || ((srcTab.name || 'Schema') + ' · dettaglio');
            const copy = w.querySelector('#exlCopy').checked;
            const newId = await this.createTab(srcTab, name, copy);
            const t = ed.tabs.get(newId);
            link.uid = ed.tabUid(t);
            link.name = name;
            ed.switchToTab(d.tabId); // si scrive il collegamento nella scheda di partenza
        }

        if (wantBack) {
            link.back = link.back || this.newId();
            const otherId = ed.findTabByUid(link.uid);
            const other = otherId != null ? ed.tabs.get(otherId) : null;
            if (other) {
                const inv = ExerciseLinks.kind(kind).inverse || 'related';
                const label = d.mode === 'object' && d.object ? 'Esercizio principale' : null;
                const backLink = { id: this.newId(), kind: inv, target: 'tab', uid: ed.tabUid(srcTab), name: srcTab.name || 'Schema', note: label && d.object.text ? 'da «' + d.object.text + '»' : '', back: link.back };
                if (srcTab.lib && srcTab.lib.id) backLink.libId = srcTab.lib.id;
                this.linksOf(other).push(backLink);
            }
        }

        if (d.mode === 'object' && d.object) {
            d.object.link = link;
            this.refreshObject(d.object);
            ed.saveState('Collegamento dell\'oggetto');
        } else {
            const links = this.linksOf(srcTab);
            const i = d.editing ? links.indexOf(d.editing) : -1;
            if (i >= 0) links[i] = link; else links.push(link);
            ed.saveState(d.editing ? 'Collegamento modificato' : 'Collegamento aggiunto');
        }
        this.render();

        if (target === 'new') {
            // si va nella nuova scheda per disegnare il dettaglio
            const nid = ed.findTabByUid(link.uid);
            if (nid != null) setTimeout(() => ed.switchToTab(nid), 30);
            this.toast('Creata la scheda «' + link.name + '», collegata a «' + (srcTab.name || 'Schema') + '».');
        }
    }

    /** Nuova scheda (vuota o con una copia del disegno della scheda di partenza); restituisce il suo id */
    async createTab(srcTab, name, copy) {
        const ed = this.editor;
        let data = null;
        if (copy) {
            ed.switchToTab(this.dlg.tabId);
            data = JSON.parse(JSON.stringify(ed.getSchemaData()));
            delete data.uid; delete data.links;
            (data.objects || []).forEach(([, o]) => { if (o) o.link = null; });
            data.exerciseSteps = [];
            data.note = data.descrizione = '';
        }
        const before = new Set(ed.tabs.keys());
        ed.addNewTab();
        let id = [...ed.tabs.keys()].find(k => !before.has(k));
        if (id == null) id = ed.activeTabId;
        const t = ed.tabs.get(id);
        if (t) t.wizardDone = true; // niente compilazione guidata per un dettaglio
        if (data) await ed.loadSchema(Promise.resolve(data));
        ed.updateTabName(id, name);
        return id;
    }

    /** Righe per il PDF: [{ text, url? }] */
    pdfLines(tab) {
        return this.linksOf(tab).map(l => {
            this.refresh(l);
            const k = ExerciseLinks.kind(l.kind);
            const txt = `${k.short || k.label}: ${this.label(l)}${l.target === 'url' && l.url && l.name !== l.url ? ' - ' + l.url : ''}${l.note ? ' (' + l.note + ')' : ''}`;
            let url = null;
            if (l.target === 'url' && l.url) url = /^[a-z][a-z0-9+.-]*:/i.test(l.url) ? l.url : 'https://' + l.url;
            return { text: txt, url: url && /^https?:/i.test(url) ? url : null };
        });
    }
}

window.ExerciseLinks = ExerciseLinks;
