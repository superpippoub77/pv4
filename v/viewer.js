/**
 * Pagina di consultazione di un allenamento o di un esercizio condiviso (sola lettura).
 * I dati arrivano da v/index.php in window.PV4_SHARE.
 */
(function () {
    'use strict';
    const S = window.PV4_SHARE;
    const app = document.getElementById('app');

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const has = (v) => v != null && String(v).trim() !== '';
    // solo indirizzi web: niente javascript: o data: nei link che arrivano dai dati condivisi
    const safeUrl = (u) => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || '').trim()) ? String(u).trim() : '';

    if (!S) {
        app.innerHTML = `
            <div class="vw-missing">
                <div class="vw-missing-icon">🏐</div>
                <h1>Link non disponibile</h1>
                <p>Questo allenamento o esercizio non esiste più oppure il link non è corretto.<br>Chiedi a chi te l'ha inviato un nuovo link.</p>
                <a class="vw-btn primary" href="../">Vai a VolleyProW4</a>
            </div>`;
        return;
    }

    const P = S.payload || {};
    const items = P.items || [];
    const isExercise = S.kind === 'exercise';
    const PART = {
        ANA: { label: 'Analitica', cls: 'ana' }, SIN: { label: 'Sintetica', cls: 'sin' }, GLO: { label: 'Globale', cls: 'glo' }
    };

    /** Testo con a capo; le righe che iniziano con •, -, * diventano un elenco */
    function richText(t) {
        if (!has(t)) return '';
        const lines = String(t).split(/\r?\n/);
        let html = '', list = [], para = [];
        const flushList = () => { if (list.length) { html += '<ul>' + list.map(l => `<li>${esc(l)}</li>`).join('') + '</ul>'; list = []; } };
        const flushPara = () => { if (para.length) { html += '<p>' + para.map(esc).join('<br>') + '</p>'; para = []; } };
        lines.forEach(l => {
            const m = l.match(/^\s*(?:[•●▪◦○■*-]|\d+[.)])\s+(.*)$/);
            if (m) { flushPara(); list.push(m[1]); }
            else if (!l.trim()) { flushPara(); flushList(); }
            else { flushList(); para.push(l.trim()); }
        });
        flushPara(); flushList();
        return html;
    }

    function youTubeId(url) {
        const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
        return m ? m[1] : null;
    }

    function chip(label, value, cls = '') {
        return has(value) ? `<span class="vw-chip ${cls}"><b>${esc(label)}</b> ${esc(value)}</span>` : '';
    }

    /** "10" → "10 min"; un valore con già l'unità resta com'è */
    function unit(v, u) { return /^\s*\d+(?:[.,]\d+)?\s*$/.test(String(v || '')) ? String(v).trim() + ' ' + u : v; }

    function itemCard(it, idx) {
        const n = idx + 1;
        const part = PART[it.part];
        const pr = it.params || {};
        const chips = [
            part ? `<span class="vw-chip part ${part.cls}">${part.label}</span>` : '',
            chip('Durata', it.qty || unit(pr.timing, 'min')),
            chip('Serie', pr.series),
            chip('Recupero', unit(pr.rec, 's')),
            chip('Gruppi', it.g || pr.groups),
            chip('Ruoli', it.r),
            chip('Luogo', pr.place)
        ].join('');
        const img = Number.isInteger(it.image)
            ? `<figure class="vw-figure"><button class="vw-img-btn" data-zoom="${it.image}" aria-label="Ingrandisci il disegno">
                   <img src="${esc(S.imageBase + it.image)}" alt="Disegno: ${esc(it.title)}" loading="lazy"${it.w && it.h ? ` width="${it.w}" height="${it.h}"` : ''}></button>
                   ${it.drawingLabel ? `<figcaption>${esc(it.drawingLabel)}</figcaption>` : ''}</figure>`
            : '';
        const steps = (it.steps || []).filter(s => has(s.text) || has(s.name));
        const stepsHtml = steps.length
            ? `<div class="vw-sub">Svolgimento</div><ol class="vw-steps">${steps.map(s =>
                `<li>${has(s.name) && s.name !== s.text ? `<b>${esc(s.name)}</b> ` : ''}${esc(s.text || '')}</li>`).join('')}</ol>`
            : '';
        const videos = (it.videos || []).map(v => ({ ...v, url: safeUrl(v.url), thumb: safeUrl(v.thumb) })).filter(v => v.url);
        const videosHtml = videos.length
            ? `<div class="vw-sub">Video</div><div class="vw-videos">${videos.map(v => {
                const id = youTubeId(v.url);
                const thumb = v.thumb || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');
                return `<a class="vw-video" href="${esc(v.url)}" target="_blank" rel="noopener">
                    ${thumb ? `<span class="vw-video-thumb" style="background-image:url('${esc(thumb)}')"><span class="vw-play">▶</span></span>` : '<span class="vw-video-thumb none"><span class="vw-play">▶</span></span>'}
                    <span class="vw-video-title">${esc(v.title || v.url)}</span></a>`;
            }).join('')}</div>`
            : '';
        return `
        <article class="vw-card" id="e${n}">
            <header class="vw-card-head">
                <span class="vw-num">${esc(it.nr || n)}</span>
                <h3>${esc(it.title || 'Esercizio ' + n)}</h3>
                <a class="vw-anchor" href="#e${n}" title="Link a questo esercizio" data-copy="#e${n}">#</a>
            </header>
            ${chips.trim() ? `<div class="vw-chips">${chips}</div>` : ''}
            <div class="vw-card-body ${img ? 'with-img' : ''}">
                <div class="vw-text">
                    ${richText(it.text)}
                    ${has(it.details) ? `<div class="vw-details">${richText(it.details)}</div>` : ''}
                    ${stepsHtml}
                    ${videosHtml}
                </div>
                ${img}
            </div>
        </article>`;
    }

    function planHeader(plan) {
        if (!plan) return '';
        const H = plan.header || {};
        const fields = [['Squadra', H.team], ['Stagione', H.season], ['Categoria', H.categoria], ['Campionato', H.campionato],
            ['Periodo', H.periodo], ['Palestra', H.palestra], ['Allenamento n°', H.numero], ['Durata', H.durata]].filter(f => has(f[1]));
        const F = plan.features || {};
        const feats = [['Categoria', F.categoria], ['Età', F.eta], ['Campionato', F.campionato], ['Livello tecnico', F.livTecnico],
            ['Livello tattico', F.livTattico], ['% fattibilità', F.fattibilita]].filter(f => has(f[1]));
        const M = plan.materials || {};
        const mats = [['Palloni', M.palloni], ['Muro', M.muro], ['Tappetini', M.tappetini], ['Spalliere', M.spalliere],
            ['Panche', M.panche], ['Cinesini', M.cinesini], ['Carrelli', M.carrelli], ['Nastro/corda', M.nastro]].filter(f => has(f[1]));
        const kv = (arr) => `<dl class="vw-kv">${arr.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
        let html = '';
        if (fields.length) html += kv(fields);
        if (feats.length) html += `<div class="vw-sub">Caratteristiche prestative</div>${kv(feats)}`;
        if (mats.length) html += `<div class="vw-sub">Materiale occorrente</div>${kv(mats)}`;
        return html ? `<section class="vw-panel">${html}</section>` : '';
    }

    function groupsHtml(plan) {
        const g = (plan && plan.groups || []).filter(x => has(x.name) || has(x.players));
        if (!g.length) return '';
        return `<section class="vw-section"><h2 class="vw-phase glo">Gruppi</h2>
            <div class="vw-groups">${g.map(x => `<div class="vw-group"><b>${esc(x.name || 'Gruppo')}</b><p>${esc(x.players)}</p></div>`).join('')}</div></section>`;
    }

    // ---------------------------------------------------------------- pagina
    const sections = (P.sections || []).filter(s => (s.blocks || []).some(b => (b.items || []).length));
    const totalMin = items.reduce((t, it) => {
        const m = String(it.qty || unit((it.params || {}).timing, 'min') || '').match(/(\d+)\s*(?:'|’|min)/i);
        return t + (m ? parseInt(m[1], 10) : 0);
    }, 0);
    const meta = [
        S.ownerName ? `di <b>${esc(S.ownerName)}</b>` : '',
        has(P.date) ? esc(P.date) : '',
        !isExercise ? `${items.length} esercizi` : '',
        has(P.plan && P.plan.header && P.plan.header.durata) ? esc(P.plan.header.durata) : (totalMin ? `circa ${totalMin} minuti` : '')
    ].filter(Boolean).join(' · ');
    const canImport = items.some(it => it.hasSchema);

    // indice con i link agli esercizi
    let toc = '';
    if (!isExercise && items.length > 1) {
        const rows = sections.length
            ? sections.map(s => `<li class="vw-toc-phase">${esc(s.title)}</li>` + s.blocks.map(b =>
                (has(b.title) ? `<li class="vw-toc-block">${esc(b.title)}</li>` : '') +
                b.items.map(i => `<li><a href="#e${i + 1}">${esc(items[i].nr || i + 1)}. ${esc(items[i].title)}</a></li>`).join('')).join('')).join('')
            : items.map((it, i) => `<li><a href="#e${i + 1}">${i + 1}. ${esc(it.title)}</a>${PART[it.part] ? ` <span class="vw-dot ${PART[it.part].cls}"></span>` : ''}</li>`).join('');
        toc = `<nav class="vw-toc"><div class="vw-sub">Esercizi</div><ul>${rows}</ul></nav>`;
    }

    let body = '';
    if (sections.length) {
        body = sections.map(s => {
            const cls = (PART[s.key] || {}).cls || '';
            return `<section class="vw-section"><h2 class="vw-phase ${cls}">${esc(s.title)}</h2>` +
                s.blocks.map(b => (has(b.title) ? `<h3 class="vw-block">${esc(b.title)}</h3>` : '') +
                    b.items.map(i => itemCard(items[i], i)).join('')).join('') + '</section>';
        }).join('');
    } else {
        body = items.map(itemCard).join('');
    }

    app.innerHTML = `
    <header class="vw-top">
        <a class="vw-brand" href="${esc(S.appUrl || '../')}"><img src="${esc((S.appUrl || '../').replace(/index\.html$/, ''))}data/images/favicon/favicon-32x32.png" alt="">VolleyProW4</a>
        <div class="vw-actions">
            <button class="vw-btn" id="vwCopy" title="Copia il link">🔗 <span>Copia link</span></button>
            ${navigator.share ? '<button class="vw-btn" id="vwShare" title="Condividi">📤 <span>Condividi</span></button>' : ''}
            <button class="vw-btn" id="vwPrint" title="Stampa o salva in PDF">🖨 <span>Stampa</span></button>
            ${canImport ? `<a class="vw-btn primary" href="${esc(S.appUrl)}?import=${encodeURIComponent(S.slug)}" title="Apri una copia nell'editor di VolleyProW4">✏️ <span>Apri in VolleyProW4</span></a>` : ''}
        </div>
    </header>
    <main class="vw-main">
        <section class="vw-hero">
            <span class="vw-kind">${isExercise ? 'Esercizio' : 'Allenamento'}</span>
            <h1>${esc(S.title)}</h1>
            ${meta ? `<div class="vw-meta">${meta}</div>` : ''}
            ${has(P.objective) ? `<div class="vw-objective"><b>Obiettivo</b>${richText(P.objective)}</div>` : ''}
        </section>
        ${planHeader(P.plan)}
        ${toc}
        ${body}
        ${groupsHtml(P.plan)}
    </main>
    <footer class="vw-foot">Creato con <a href="${esc(S.appUrl || '../')}">VolleyProW4</a> by SpikeCode AI · aggiornato il ${esc(new Date(S.updated).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }))}</footer>
    <div class="vw-lightbox" id="vwLightbox" hidden><img alt=""><button class="vw-close" aria-label="Chiudi">×</button></div>
    <div class="vw-toast" id="vwToast" hidden></div>`;

    // ---------------------------------------------------------------- azioni
    const toast = (msg) => {
        const t = document.getElementById('vwToast');
        t.textContent = msg; t.hidden = false;
        clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2200);
    };
    const copy = async (text) => {
        try { await navigator.clipboard.writeText(text); toast('Link copiato'); }
        catch (e) { window.prompt('Copia il link:', text); }
    };
    document.getElementById('vwCopy').onclick = () => copy(S.url);
    const sh = document.getElementById('vwShare');
    if (sh) sh.onclick = () => navigator.share({ title: S.title, url: S.url }).catch(() => { });
    document.getElementById('vwPrint').onclick = () => window.print();

    app.addEventListener('click', (e) => {
        const a = e.target.closest('[data-copy]');
        if (a) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('data-copy')); copy(S.url + a.getAttribute('data-copy')); return; }
        const z = e.target.closest('[data-zoom]');
        if (z) {
            const lb = document.getElementById('vwLightbox');
            lb.querySelector('img').src = S.imageBase + z.getAttribute('data-zoom');
            lb.hidden = false;
            return;
        }
        if (e.target.closest('#vwLightbox')) document.getElementById('vwLightbox').hidden = true;
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.getElementById('vwLightbox').hidden = true; });
    document.title = `${S.title} · ${isExercise ? 'Esercizio' : 'Allenamento'} · VolleyProW4`;
})();
