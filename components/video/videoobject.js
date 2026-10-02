/**
 * VIDEO NEL DISEGNO
 * Oggetto "video" da mettere sul foglio: un riquadro con anteprima, titolo e ▶.
 * Fonti: YouTube (anche Shorts e link con il minuto di partenza), Vimeo, file video
 * dal computer, oppure qualunque altro indirizzo (file .mp4/.webm diretti si vedono
 * nella finestra, gli altri link si aprono in una nuova scheda del browser).
 * Doppio clic (o ▶) sull'oggetto apre il video; dalla stessa finestra si cambia il link.
 *
 * Il file dal computer resta collegato finché la pagina è aperta: dopo una ricarica
 * l'anteprima rimane, ma per guardarlo va scelto di nuovo (il browser non conserva i file).
 */
const VideoObjects = {
    local: {},          // id oggetto → URL temporaneo del file scelto dal computer
    editor: null,
    dialog: null,
    current: null,      // oggetto video in modifica (null = nuovo)
    pending: null,      // dati in preparazione nella finestra

    init(editor) {
        this.editor = editor;
    },

    esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    // ------------------------------------------------------------ riconoscimento link
    parse(url) {
        const u = String(url || '').trim();
        if (!u) return null;
        let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (m) {
            const t = u.match(/[?&#](?:t|start)=([0-9hms]+)/);
            return { kind: 'youtube', id: m[1], start: t ? this.seconds(t[1]) : 0, url: u };
        }
        m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (m) return { kind: 'vimeo', id: m[1], url: u };
        if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(u)) return { kind: 'file', url: u };
        if (/^https?:\/\//i.test(u)) return { kind: 'link', url: u };
        return null;
    },

    seconds(t) {
        if (/^\d+$/.test(t)) return parseInt(t, 10);
        const h = (t.match(/(\d+)h/) || [])[1] || 0, mi = (t.match(/(\d+)m/) || [])[1] || 0, s = (t.match(/(\d+)s/) || [])[1] || 0;
        return h * 3600 + mi * 60 + parseInt(s, 10);
    },

    thumbUrl(info) {
        return info && info.kind === 'youtube' ? `https://img.youtube.com/vi/${info.id}/hqdefault.jpg` : '';
    },

    /** Converte un'immagine remota in dati incorporati (così resta nel salvataggio e nei PDF) */
    async toDataUrl(src) {
        try {
            const res = await fetch(src, { mode: 'cors' });
            if (!res.ok) return src;
            const blob = await res.blob();
            return await new Promise((resolve) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = () => resolve(src);
                r.readAsDataURL(blob);
            });
        } catch (err) {
            return src;
        }
    },

    /** Fotogramma di anteprima di un file video locale */
    frameOf(objectUrl) {
        return new Promise((resolve) => {
            const v = document.createElement('video');
            v.muted = true; v.preload = 'auto'; v.src = objectUrl;
            const done = (val) => { v.removeAttribute('src'); v.load(); resolve(val); };
            v.addEventListener('loadeddata', () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); }, { once: true });
            v.addEventListener('seeked', () => {
                try {
                    const c = document.createElement('canvas');
                    const k = Math.min(1, 480 / (v.videoWidth || 480));
                    c.width = Math.round((v.videoWidth || 480) * k); c.height = Math.round((v.videoHeight || 270) * k);
                    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
                    done(c.toDataURL('image/jpeg', 0.8));
                } catch (err) { done(''); }
            }, { once: true });
            v.addEventListener('error', () => done(''), { once: true });
            setTimeout(() => done(''), 6000);
        });
    },

    // ------------------------------------------------------------ resa sul foglio
    content(object) {
        const content = document.createElement('div');
        content.className = 'video-object';
        if (object.thumb && /^(data:image\/|https:\/\/)/.test(object.thumb)) content.style.backgroundImage = `url("${object.thumb.replace(/"/g, '%22')}")`;
        const label = { youtube: 'YouTube', vimeo: 'Vimeo', file: object.fileName ? 'File' : 'Video', link: 'Link' }[object.videoKind] || 'Video';
        content.innerHTML = `
            <span class="video-badge">${label}</span>
            <button type="button" class="video-play" title="Guarda il video">▶</button>
            <span class="video-title"></span>`;
        content.querySelector('.video-title').textContent = object.text || object.fileName || object.videoUrl || 'Video';
        const play = content.querySelector('.video-play');
        play.addEventListener('mousedown', (e) => e.stopPropagation());
        play.addEventListener('click', (e) => { e.stopPropagation(); this.open(object); });
        content.classList.toggle('dashed', !!object.dashed);
        return content;
    },

    // ------------------------------------------------------------ finestra
    ensureDialog() {
        if (this.dialog) return;
        this.dialog = createWindow({
            title: 'dlg_title_video',
            icon: '🎬',
            id: 'videoDialog',
            contentHTML: `
<div class="vd">
    <div class="vd-player" id="vdPlayer"></div>
    <div class="vd-form">
        <label class="vd-label" for="vdUrl">Link del video (YouTube, Vimeo, file .mp4 o qualunque indirizzo)</label>
        <input type="url" id="vdUrl" class="vd-input" placeholder="https://www.youtube.com/watch?v=…  (anche con &t=1m30s per il minuto di partenza)">
        <div class="vd-row">
            <button type="button" id="vdFileBtn" class="vd-btn">📁 Scegli un video dal computer…</button>
            <span id="vdFileName" class="vd-hint"></span>
            <input type="file" id="vdFile" accept="video/*" hidden>
        </div>
        <label class="vd-label" for="vdTitle">Titolo (compare sul riquadro)</label>
        <input type="text" id="vdTitle" class="vd-input" placeholder="es. Esecuzione corretta della rincorsa">
        <div id="vdMsg" class="vd-hint"></div>
    </div>
</div>`,
            effect: 'windows',
            size: 'lg',
            modal: true,
            visible: false,
            buttons: [
                { label: 'btn_video_open_tab', align: 'left', close: false, color: 'secondary', onClick: () => this.openExternal() },
                { label: 'btn_video_apply', close: false, color: 'success', onClick: () => this.apply() },
                { label: 'btn_close', color: 'secondary', onClick: () => this.close() }
            ]
        });
        const url = document.getElementById('vdUrl');
        url.addEventListener('change', () => this.fromUrl(url.value));
        url.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); this.fromUrl(url.value); } });
        document.getElementById('vdTitle').addEventListener('keydown', (e) => e.stopPropagation());
        document.getElementById('vdFileBtn').addEventListener('click', () => document.getElementById('vdFile').click());
        document.getElementById('vdFile').addEventListener('change', (e) => {
            const f = e.target.files[0]; e.target.value = '';
            if (f) this.fromFile(f);
        });
    },

    msg(text) {
        const el = document.getElementById('vdMsg');
        if (el) el.textContent = text || '';
    },

    /** Nuovo video (dalla barra a sinistra) */
    add() {
        this.ensureDialog();
        this.current = null;
        this.pending = null;
        document.getElementById('vdUrl').value = '';
        document.getElementById('vdTitle').value = '';
        document.getElementById('vdFileName').textContent = '';
        document.getElementById('vdPlayer').innerHTML = '<div class="vd-empty">Incolla un link o scegli un file: qui vedrai il video.</div>';
        this.msg('');
        this.dialog.showDialog();
        setTimeout(() => document.getElementById('vdUrl').focus(), 50);
    },

    /** Video già sul foglio: lo mostra e permette di cambiarlo */
    open(object) {
        this.ensureDialog();
        this.current = object;
        this.pending = {
            videoKind: object.videoKind, videoUrl: object.videoUrl || '', videoId: object.videoId || '',
            videoStart: object.videoStart || 0, thumb: object.thumb || '', fileName: object.fileName || '',
            localUrl: this.local[object.id] || null
        };
        document.getElementById('vdUrl').value = object.videoKind === 'file' && object.fileName ? '' : (object.videoUrl || '');
        document.getElementById('vdTitle').value = object.text || '';
        document.getElementById('vdFileName').textContent = object.fileName ? '📁 ' + object.fileName : '';
        this.msg(object.fileName && !this.local[object.id] ? 'Il file dal computer non è più collegato (dopo una ricarica il browser non lo conserva): sceglilo di nuovo per guardarlo.' : '');
        this.preview();
        this.dialog.showDialog();
    },

    close() {
        document.getElementById('vdPlayer').innerHTML = ''; // ferma la riproduzione
        this.dialog.hideDialog();
    },

    async fromUrl(raw) {
        const info = this.parse(raw);
        if (!info) { this.msg('Link non riconosciuto: incolla un indirizzo che inizia con https://'); return; }
        this.pending = { videoKind: info.kind, videoUrl: info.url, videoId: info.id || '', videoStart: info.start || 0, thumb: '', fileName: '', localUrl: null };
        this.msg('');
        this.preview();
        const t = this.thumbUrl(info);
        if (t) this.pending.thumb = await this.toDataUrl(t);
    },

    async fromFile(file) {
        const url = URL.createObjectURL(file);
        this.pending = { videoKind: 'file', videoUrl: '', videoId: '', videoStart: 0, thumb: '', fileName: file.name, localUrl: url };
        document.getElementById('vdFileName').textContent = '📁 ' + file.name;
        if (!document.getElementById('vdTitle').value) document.getElementById('vdTitle').value = file.name.replace(/\.[^.]+$/, '');
        this.msg('Il file resta collegato finché la pagina è aperta; nel disegno viene salvata l\'anteprima.');
        this.preview();
        this.pending.thumb = await this.frameOf(url);
    },

    preview() {
        const p = this.pending;
        const host = document.getElementById('vdPlayer');
        if (!p) { host.innerHTML = ''; return; }
        if (p.videoKind === 'youtube') {
            host.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.videoId)}?rel=0${p.videoStart ? '&start=' + p.videoStart : ''}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else if (p.videoKind === 'vimeo') {
            host.innerHTML = `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(p.videoId)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        } else if (p.videoKind === 'file' && (p.localUrl || p.videoUrl)) {
            host.innerHTML = `<video controls src="${this.esc(p.localUrl || p.videoUrl)}"></video>`;
        } else if (p.videoKind === 'file' && p.fileName) {
            host.innerHTML = `<div class="vd-empty">${p.thumb ? `<img src="${this.esc(p.thumb)}" alt="">` : ''}<br>📁 ${this.esc(p.fileName)}<br>Scegli di nuovo il file per guardarlo.</div>`;
        } else {
            host.innerHTML = `<div class="vd-empty">Questo link si apre in una nuova scheda del browser.<br><a href="${this.esc(p.videoUrl)}" target="_blank" rel="noopener">${this.esc(p.videoUrl)}</a></div>`;
        }
    },

    openExternal() {
        const p = this.pending;
        if (!p) return;
        const url = p.videoKind === 'youtube' ? `https://www.youtube.com/watch?v=${p.videoId}${p.videoStart ? '&t=' + p.videoStart + 's' : ''}` : (p.localUrl || p.videoUrl);
        if (url) window.open(url, '_blank', 'noopener');
    },

    /** Inserisce il video nel disegno (o aggiorna quello aperto) */
    apply() {
        const ed = this.editor;
        const p = this.pending;
        if (!p) { this.msg('Incolla un link o scegli un file.'); return; }
        const title = document.getElementById('vdTitle').value.trim();
        let obj = this.current;
        if (!obj) {
            if (ed.noDocs) ed.setNoDocs(false);
            const canvas = document.getElementById('canvas');
            const s = ed.getDefaultSize('video');
            obj = ed.addObject('video', Math.max(10, canvas.offsetWidth / 2 - s.width / 2), Math.max(10, canvas.offsetHeight / 2 - s.height / 2), '#2c3e50', '', 0, false);
        }
        Object.assign(obj, {
            videoKind: p.videoKind, videoUrl: p.videoUrl, videoId: p.videoId, videoStart: p.videoStart,
            thumb: p.thumb, fileName: p.fileName, text: title
        });
        if (p.localUrl) this.local[obj.id] = p.localUrl;
        ed.renderObject(obj);
        ed.saveState(this.current ? 'Video modificato' : 'Video inserito');
        this.current = obj;
        this.close();
    },

    /** Link da mostrare nei PDF per gli oggetti video di una scheda */
    linksOf(tab) {
        const out = [];
        (tab ? tab.objects : new Map()).forEach(o => {
            if (o.type !== 'video') return;
            const url = o.videoKind === 'youtube' ? `https://www.youtube.com/watch?v=${o.videoId}${o.videoStart ? '&t=' + o.videoStart + 's' : ''}` : o.videoUrl;
            out.push({ title: o.text || o.fileName || 'Video', url: url || '', file: !url && o.fileName ? o.fileName : '' });
        });
        return out;
    }
};

window.VideoObjects = VideoObjects;
