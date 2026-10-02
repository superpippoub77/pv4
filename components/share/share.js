/**
 * LINK CONDIVISI — window.Pv4Share
 * Pubblica un allenamento (piano allenamento o schede aperte) o il singolo esercizio
 * come pagina di sola consultazione raggiungibile con un link a slug: …/v/<slug>.
 * Chi riceve il link vede solo quello (disegni, descrizione, step, video, indice con
 * i link agli esercizi), senza account e senza l'editor; con «Apri in VolleyProW4»
 * può copiarselo nel proprio editor (index.html?import=<slug>).
 * Server: cloud/share_save.php, share_upload_image.php, share_list.php, share_delete.php, share_get.php.
 */
(function () {
    'use strict';
    const PARTS = { ANA: 'Fase Analitica', SIN: 'Fase Sintetica', GLO: 'Fase Globale' };
    const SLUGS_KEY = 'pv4-share-slugs'; // contenuto → ultimo link creato (per aggiornarlo invece di crearne un altro)
    const MAX_IMG_SIDE = 1400;
    const MAX_SCHEMA_CHARS = 3 * 1024 * 1024;

    let dlg = null, listDlg = null;
    const ed = () => window.editor;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toast = (m, err) => (window.Pv4Library && window.Pv4Library.toast) ? window.Pv4Library.toast(m, err) : alert(m);

    function loadSlugs() { try { return JSON.parse(localStorage.getItem(SLUGS_KEY) || '{}'); } catch (e) { return {}; } }
    function saveSlug(key, slug) { try { const m = loadSlugs(); if (slug) m[key] = slug; else delete m[key]; localStorage.setItem(SLUGS_KEY, JSON.stringify(m)); } catch (e) { /* ignore */ } }

    function slugify(t) {
        return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
    }
    function appBase() { return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''); }

    // ------------------------------------------------------------------ contenuto
    function planHasRows() {
        const p = ed()?.workoutPlan?.plan;
        return !!p && p.phases.some(ph => ph.blocks.some(b => b.rows.some(r => (r.text || '').trim())));
    }
    function contentTabs() {
        const out = [];
        ed().tabs.forEach((t, id) => { if (t.objects.size || (t.descrizione || '').trim() || (t.exerciseSteps || []).length) out.push(id); });
        return out;
    }

    async function shrink(dataUrl) {
        const img = new Image();
        await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = dataUrl; });
        const k = Math.min(1, MAX_IMG_SIDE / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        return { dataUrl: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height };
    }

    function videosOf(tab) {
        const out = [];
        tab.objects.forEach(o => {
            if (o.type !== 'video') return;
            const url = o.videoKind === 'youtube' && o.videoId
                ? `https://www.youtube.com/watch?v=${o.videoId}${o.videoStart ? '&t=' + o.videoStart + 's' : ''}`
                : (/^https?:/i.test(o.videoUrl || '') ? o.videoUrl : '');
            if (!url) return; // file dal computer: non raggiungibile da chi riceve il link
            out.push({ url, title: o.text || o.fileName || '', thumb: /^https?:/i.test(o.thumb || '') ? o.thumb : '' });
        });
        return out;
    }

    /** Dati di una scheda dell'editor (disegno compreso) */
    async function tabItem(tabId, images, opts) {
        const E = ed();
        if (E.activeTabId !== tabId) { E.switchToTab(tabId); await new Promise(r => setTimeout(r, 80)); }
        const tab = E.getCurrentTab();
        const item = {
            title: tab.name || 'Esercizio',
            text: tab.descrizione || '',
            part: ['ANA', 'SIN', 'GLO'].includes(tab.tipologia) ? tab.tipologia : '',
            params: { timing: tab.timing || '', series: tab.series || '', rec: tab.rec || '', groups: tab.groups || '', place: tab.place || '' },
            steps: (tab.exerciseSteps || []).map(s => ({ name: s.name || '', text: s.text || '' })),
            videos: videosOf(tab),
            image: null
        };
        if (tab.objects.size) {
            try {
                const cap = await E.captureTabImage(tabId, { crop: true });
                const s = await shrink(cap.dataUrl);
                item.image = images.length; item.w = s.w; item.h = s.h;
                images.push(s.dataUrl);
            } catch (err) { console.warn('Disegno non catturato', err); }
        }
        if (opts.withSchema) {
            try {
                const sc = E.getSchemaData();
                if (JSON.stringify(sc).length <= MAX_SCHEMA_CHARS) item.schema = sc;
            } catch (err) { /* ignore */ }
        }
        return item;
    }

    async function buildExercise(opts) {
        const images = [];
        const item = await tabItem(ed().activeTabId, images, opts);
        return { kind: 'exercise', title: item.title, images, payload: { date: new Date().toLocaleDateString('it-IT'), items: [item] } };
    }

    async function buildWorkoutFromTabs(opts) {
        const E = ed();
        const back = E.activeTabId;
        const images = [], items = [];
        for (const id of contentTabs()) items.push(await tabItem(id, images, opts));
        E.switchToTab(back);
        const order = ['ANA', 'SIN', 'GLO', ''];
        const sections = order.map(k => ({
            key: k, title: PARTS[k] || 'Altri esercizi',
            blocks: [{ title: '', items: items.map((it, i) => (it.part === k ? i : -1)).filter(i => i >= 0) }]
        })).filter(s => s.blocks[0].items.length);
        // una sola sezione "Altri esercizi": niente intestazioni di fase
        const useSections = !(sections.length === 1 && sections[0].key === '');
        return {
            kind: 'workout',
            title: E.currentWorkoutName || (items.length ? 'Allenamento ' + new Date().toLocaleDateString('it-IT') : 'Allenamento'),
            images,
            payload: { date: new Date().toLocaleDateString('it-IT'), objective: E.currentWorkoutObjective || '', items, sections: useSections ? sections : [] }
        };
    }

    async function buildWorkoutFromPlan(opts) {
        const E = ed();
        const plan = E.workoutPlan.plan;
        const back = E.activeTabId;
        const images = [], items = [], sections = [];
        let d = 0;
        for (const ph of plan.phases) {
            const sec = { key: ph.key, title: ph.title || PARTS[ph.key], blocks: [] };
            for (const b of ph.blocks) {
                const blk = { title: b.title || '', items: [] };
                for (const r of b.rows) {
                    if (!(r.text || '').trim()) continue;
                    const lines = r.text.split('\n').map(l => l.trim()).filter(Boolean);
                    const first = (lines[0] || '').replace(/^[•●▪◦○■*-]\s*/, '');
                    let item = { title: first.length > 90 ? first.slice(0, 88) + '…' : first, text: r.text };
                    const tabId = r.uid ? E.findTabByUid(r.uid) : null;
                    if (tabId != null) {
                        const t = await tabItem(tabId, images, opts);
                        // la descrizione della scheda collegata ripete di solito il testo della riga: la aggiungo solo se dice altro
                        const norm = (x) => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase();
                        const extra = t.text && !norm(t.text).includes(norm(first)) && !norm(r.text).includes(norm(t.text)) ? '\n\n' + t.text : '';
                        item = { ...t, title: item.title, text: r.text + extra, params: {} }; // nel piano valgono quantità, G e R della riga
                        if (item.image != null) item.drawingLabel = 'Disegno D' + (++d);
                    }
                    Object.assign(item, { nr: r.nr || '', part: ph.key, g: r.g || '', r: r.r || '', qty: r.qty || '', details: r.details || '' });
                    blk.items.push(items.length);
                    items.push(item);
                }
                if (blk.items.length) sec.blocks.push(blk);
            }
            if (sec.blocks.length) sections.push(sec);
        }
        if (back != null && E.tabs.has(back)) E.switchToTab(back);
        const H = plan.header || {};
        const title = [H.numero ? 'Allenamento n° ' + H.numero : 'Allenamento', H.team].filter(Boolean).join(' — ');
        return {
            kind: 'workout', title, images,
            payload: {
                date: new Date().toLocaleDateString('it-IT'), objective: plan.objective || '', items, sections,
                plan: { header: plan.header, features: plan.features, materials: plan.materials, groups: plan.groups }
            }
        };
    }

    // ------------------------------------------------------------------ invio
    async function publish(content, { slug, slugBase, title }, progress) {
        progress('Pubblicazione del link…');
        const res = await CloudApi.post('share_save.php', {
            slug: slug || null, kind: content.kind, title: title || content.title, slugBase,
            images: content.images.length, payload: content.payload
        });
        for (let i = 0; i < content.images.length; i++) {
            progress(`Caricamento dei disegni ${i + 1}/${content.images.length}…`);
            await CloudApi.post('share_upload_image.php', { slug: res.slug, i, dataUrl: content.images[i] });
        }
        return res;
    }

    // ------------------------------------------------------------------ finestra "Condividi"
    function sourceKey(kind, source) {
        if (kind === 'exercise') { const t = ed().getCurrentTab(); return 'ex:' + ed().tabUid(t); }
        return source === 'plan' ? 'workout:plan' : 'workout:tabs';
    }

    function open(kind) {
        if (!window.editor) return;
        if (!(window.Pv4Library && window.Pv4Library.isAvailable())) {
            toast('Per creare un link condiviso accedi al tuo account (Account → Accedi).', true);
            window.Pv4Library?.account();
            return;
        }
        if (!dlg) createDialog();
        const plan = planHasRows();
        document.getElementById('shKind' + (kind === 'exercise' ? 'Ex' : 'Wo')).checked = true;
        document.getElementById('shSrcPlan').disabled = !plan;
        document.getElementById('shSrcPlan').checked = plan;
        document.getElementById('shSrcTabs').checked = !plan;
        document.getElementById('shSrcTabsLabel').textContent = `Schede aperte (${contentTabs().length})`;
        document.getElementById('shResult').innerHTML = '';
        document.getElementById('shStatus').textContent = '';
        refresh(true);
        dlg.showDialog();
    }

    function current() {
        const kind = document.getElementById('shKindEx').checked ? 'exercise' : 'workout';
        const source = document.getElementById('shSrcPlan').checked ? 'plan' : 'tabs';
        return { kind, source };
    }

    function defaultTitle(kind, source) {
        const E = ed();
        if (kind === 'exercise') return E.getCurrentTab().name || 'Esercizio';
        if (source === 'plan') {
            const H = E.workoutPlan.plan.header || {};
            return [H.numero ? 'Allenamento n° ' + H.numero : 'Allenamento', H.team].filter(Boolean).join(' — ');
        }
        return E.currentWorkoutName || 'Allenamento ' + new Date().toLocaleDateString('it-IT');
    }

    function refresh(resetTitle) {
        const { kind, source } = current();
        document.getElementById('shSources').style.display = kind === 'workout' ? '' : 'none';
        const t = document.getElementById('shTitle');
        if (resetTitle || !t.dataset.touched) { t.value = defaultTitle(kind, source); t.dataset.touched = ''; }
        const prev = loadSlugs()[sourceKey(kind, source)];
        const upd = document.getElementById('shUpdateRow');
        upd.style.display = prev ? '' : 'none';
        if (prev) document.getElementById('shPrevLink').textContent = appBase() + 'v/' + prev;
        document.getElementById('shUpdate').checked = !!prev;
        document.getElementById('shSlugPreview').textContent = appBase() + 'v/' + (slugify(t.value) || (kind === 'exercise' ? 'esercizio' : 'allenamento')) + '-xxxxxx';
    }

    function createDialog() {
        const html = `
<div class="sh">
    <p class="sh-help">Crea un <b>link di sola consultazione</b>: chi lo riceve vede solo l'allenamento o l'esercizio
    (disegni, descrizione, step, video e l'indice con i link agli esercizi), dal telefono o dal computer, senza account.
    Il link mostra anche l'anteprima con titolo e disegno quando lo incolli su WhatsApp, Facebook, Telegram…</p>
    <div class="sh-row">
        <label><input type="radio" name="shKind" id="shKindWo" value="workout" checked> 🗓 Allenamento</label>
        <label><input type="radio" name="shKind" id="shKindEx" value="exercise"> 🏐 Esercizio (scheda attuale)</label>
    </div>
    <div class="sh-row" id="shSources">
        <label><input type="radio" name="shSrc" id="shSrcPlan" value="plan"> 📋 Piano allenamento (con intestazione, fasi, blocchi, gruppi e disegni)</label>
        <label><input type="radio" name="shSrc" id="shSrcTabs" value="tabs"> 🗂 <span id="shSrcTabsLabel">Schede aperte</span></label>
    </div>
    <label class="sh-label" for="shTitle">Titolo</label>
    <input type="text" id="shTitle" class="sh-input" maxlength="160">
    <div class="sh-slug">Link: <span id="shSlugPreview"></span></div>
    <div class="sh-row" id="shUpdateRow"><label><input type="checkbox" id="shUpdate" checked> Aggiorna il link già creato <span class="sh-prev" id="shPrevLink"></span> (resta lo stesso indirizzo)</label></div>
    <div class="sh-row"><label><input type="checkbox" id="shSchema" checked> Permetti a chi lo riceve di aprirne una copia nell'editor («Apri in VolleyProW4»)</label></div>
    <div id="shStatus" class="sh-status"></div>
    <div id="shResult"></div>
    <div class="sh-foot"><a href="#" id="shMine">🔗 I miei link condivisi…</a></div>
</div>`;
        dlg = createWindow({
            title: 'dlg_title_share', icon: '🔗', id: 'shareDialog', contentHTML: html,
            effect: 'windows', size: 'lg', modal: true, visible: false,
            buttons: [
                { label: 'btn_share_create', close: false, color: 'success', onClick: () => create() },
                { label: 'btn_close', color: 'secondary', onClick: () => dlg.hideDialog() }
            ]
        });
        document.querySelectorAll('input[name="shKind"], input[name="shSrc"]').forEach(el => el.addEventListener('change', () => refresh(true)));
        const t = document.getElementById('shTitle');
        t.addEventListener('input', () => { t.dataset.touched = '1'; refresh(false); });
        document.getElementById('shMine').addEventListener('click', (e) => { e.preventDefault(); openList(); });
    }

    async function create() {
        const { kind, source } = current();
        const status = document.getElementById('shStatus');
        const result = document.getElementById('shResult');
        const progress = (m) => { status.textContent = m; };
        const key = sourceKey(kind, source);
        const prev = document.getElementById('shUpdate').checked ? loadSlugs()[key] : null;
        const title = document.getElementById('shTitle').value.trim();
        result.innerHTML = '';
        try {
            progress('Preparazione dei disegni…');
            const opts = { withSchema: document.getElementById('shSchema').checked };
            const content = kind === 'exercise' ? await buildExercise(opts)
                : source === 'plan' ? await buildWorkoutFromPlan(opts) : await buildWorkoutFromTabs(opts);
            if (!content.payload.items.length) { progress(''); result.innerHTML = '<div class="tx-ex-warn">Non ci sono esercizi da condividere.</div>'; return; }
            let res;
            try { res = await publish(content, { slug: prev, slugBase: title, title }, progress); }
            catch (err) {
                if (prev && err.status === 404) { saveSlug(key, null); res = await publish(content, { slugBase: title, title }, progress); }
                else throw err;
            }
            saveSlug(key, res.slug);
            progress('');
            refresh(false); // da ora «Crea il link» aggiorna questo stesso link
            showResult(res, title || content.title);
        } catch (err) {
            progress('');
            result.innerHTML = `<div class="tx-ex-warn">⚠️ ${esc(err.message || err)}</div>`;
        }
    }

    function showResult(res, title) {
        const url = res.url;
        const msg = encodeURIComponent(title + '\n' + url);
        document.getElementById('shResult').innerHTML = `
            <div class="tx-ex-ok">✅ ${res.isNew ? 'Link creato' : 'Link aggiornato'}: chi lo apre vede ${esc(title)} in sola lettura.</div>
            <div class="sh-link"><input type="text" readonly value="${esc(url)}" id="shUrl"><button class="btn" id="shCopy">Copia</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Apri</a></div>
            <div class="sh-social">
                <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${msg}">WhatsApp</a>
                <a class="btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}">Telegram</a>
                <a class="btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
                <a class="btn" href="mailto:?subject=${encodeURIComponent(title)}&body=${msg}">Email</a>
            </div>`;
        const input = document.getElementById('shUrl');
        document.getElementById('shCopy').onclick = async () => {
            try { await navigator.clipboard.writeText(url); toast('Link copiato'); } catch (e) { input.select(); document.execCommand('copy'); toast('Link copiato'); }
        };
        input.addEventListener('focus', () => input.select());
    }

    // ------------------------------------------------------------------ "I miei link"
    function openList() {
        if (!(window.Pv4Library && window.Pv4Library.isAvailable())) { toast('Accedi al tuo account per vedere i tuoi link.', true); return; }
        if (!listDlg) {
            listDlg = createWindow({
                title: 'dlg_title_share_list', icon: '🔗', id: 'shareListDialog',
                contentHTML: '<div class="sh"><div id="shList" class="sh-list">Caricamento…</div></div>',
                effect: 'windows', size: 'lg', modal: true, visible: false,
                buttons: [{ label: 'btn_close', color: 'secondary', onClick: () => listDlg.hideDialog() }]
            });
            document.getElementById('shList').addEventListener('click', onListClick);
        }
        listDlg.showDialog();
        loadList();
    }

    async function loadList() {
        const box = document.getElementById('shList');
        box.textContent = 'Caricamento…';
        try {
            const r = await CloudApi.get('share_list.php');
            if (!r.shares.length) { box.innerHTML = '<p>Non hai ancora creato link condivisi. Usa «Condividi allenamento (link)…» o «Condividi esercizio (link)…».</p>'; return; }
            box.innerHTML = `<table class="wg-table sh-table"><tr><th>Titolo</th><th>Tipo</th><th>Esercizi</th><th>Aggiornato</th><th>Visite</th><th></th></tr>${r.shares.map(s => `
                <tr data-slug="${esc(s.slug)}" data-url="${esc(s.url)}">
                    <td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><div class="sh-small">${esc(s.slug)}</div></td>
                    <td>${s.kind === 'exercise' ? 'Esercizio' : 'Allenamento'}</td><td>${s.items}</td>
                    <td>${s.updated ? esc(new Date(s.updated).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })) : ''}</td>
                    <td>${s.views}</td>
                    <td class="sh-acts"><button class="btn" data-act="copy">Copia</button><button class="btn danger" data-act="del">Elimina</button></td>
                </tr>`).join('')}</table>`;
        } catch (err) { box.innerHTML = `<div class="tx-ex-warn">⚠️ ${esc(err.message)}</div>`; }
    }

    async function onListClick(e) {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const tr = b.closest('tr');
        if (b.dataset.act === 'copy') {
            try { await navigator.clipboard.writeText(tr.dataset.url); toast('Link copiato'); } catch (err) { window.prompt('Copia il link:', tr.dataset.url); }
        } else if (b.dataset.act === 'del') {
            if (!confirm('Eliminare questo link? Chi lo apre vedrà «Link non disponibile».')) return;
            try {
                await CloudApi.post('share_delete.php', { slug: tr.dataset.slug });
                const m = loadSlugs(); Object.keys(m).forEach(k => { if (m[k] === tr.dataset.slug) saveSlug(k, null); });
                toast('Link eliminato');
                loadList();
            } catch (err) { toast(err.message, true); }
        }
    }

    // ------------------------------------------------------------------ "Apri in VolleyProW4" (?import=<slug>)
    async function importShare(slug) {
        let tries = 0;
        while (!(window.editor && window.editor.tabs) && tries++ < 1200) await new Promise(r => setTimeout(r, 500));
        const E = window.editor;
        if (!E) return;
        try {
            const r = await CloudApi.get('share_get.php?s=' + encodeURIComponent(slug));
            const s = r.share;
            const list = (s.payload.items || []).filter(it => it.schema);
            if (!list.length) { toast('Questo link non contiene esercizi da aprire nell\'editor.', true); return; }
            for (const it of list) {
                const t = E.getCurrentTab();
                if (E.noDocs || (t && t.objects.size > 0)) E.addNewTab();
                await E.loadSchema(Promise.resolve(it.schema));
                const name = it.title || it.schema.title || 'Esercizio';
                E.updateTabName(E.activeTabId, name);
                const input = document.querySelector(`.tab[data-tab-id="${E.activeTabId}"] .tab-title`);
                if (input) input.value = name;
            }
            if (s.kind === 'workout') { E.currentWorkoutName = s.title; E.currentWorkoutObjective = s.payload.objective || ''; }
            toast(`Aperti ${list.length} esercizi da «${s.title}» di ${s.ownerName || 'un allenatore'}: sono una tua copia.`);
        } catch (err) {
            toast('Impossibile aprire il link: ' + err.message, true);
        } finally {
            history.replaceState(null, '', location.pathname);
        }
    }

    const imp = new URLSearchParams(location.search).get('import');
    if (imp && /^[a-z0-9-]{3,100}$/.test(imp)) importShare(imp);

    window.Pv4Share = {
        shareWorkout: () => open('workout'),
        shareExercise: () => open('exercise'),
        myLinks: openList,
        import: importShare
    };
})();
