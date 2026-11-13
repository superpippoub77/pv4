/**
 * RosterImport — riconosce i giocatori (numero, nome, ruolo e dettagli) da fonti diverse:
 * Excel/ODS/CSV, PDF, Word, testo incollato, JSON e foto/scansioni di un foglio (OCR).
 *
 * Parte "pura" (senza DOM, provabile anche in Node):
 *   textToRows(text)            → righe di celle (separatori ; , tab | oppure spazi ampi)
 *   pdfPagesToRows(pages)       → righe di celle dalle pagine di pdf.js (colonne dalle distanze in x)
 *   analyze(rows)               → { header, mapping, tabular }
 *   buildPlayers(rows, opts)    → giocatori riconosciuti, con avvisi
 *   assignRoles(players, roster, mode) → assegna le sigle P1/S1/C1/O/L1… senza doppioni
 *
 * Lettura dei file (browser): readFile(file, onProgress) → { rows, sheets?, kind, note }
 */
(function (root) {
    'use strict';

    // ------------------------------------------------------------------
    // CAMPI e sinonimi delle intestazioni
    // ------------------------------------------------------------------
    const FIELDS = [
        ['ignore', 'Ignora'], ['number', 'Numero'], ['name', 'Nome e cognome'], ['first', 'Nome'], ['last', 'Cognome'],
        ['role', 'Ruolo'], ['birth', 'Nascita'], ['height', 'Altezza'], ['email', 'Email'], ['phone', 'Telefono'],
        ['notes', 'Note']
    ];

    const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[°º.]/g, ' ').replace(/\s+/g, ' ').trim();

    const HEADER_WORDS = {
        number: ['n', 'nr', 'num', 'numero', 'number', 'no', '#', 'maglia', 'n maglia', 'numero maglia', 'jersey', 'shirt', 'dorsale', 'numero di maglia', 'numero dorsale'],
        name: ['nome e cognome', 'cognome e nome', 'nominativo', 'giocatore', 'giocatrice', 'atleta', 'player', 'full name', 'name', 'nom', 'nome completo'],
        first: ['nome', 'first name', 'firstname', 'given name', 'prenom'],
        last: ['cognome', 'last name', 'lastname', 'surname', 'family name'],
        role: ['ruolo', 'role', 'posizione', 'position', 'pos', 'poste', 'ruoli'],
        birth: ['data di nascita', 'data nascita', 'nascita', 'nato il', 'nata il', 'anno', 'anno di nascita', 'anno nascita', 'birth', 'birthday', 'date of birth', 'dob', 'nato', 'nata', 'classe', 'eta', 'age'],
        height: ['altezza', 'height', 'h', 'alt', 'cm', 'statura', 'taille'],
        email: ['email', 'e-mail', 'mail', 'posta'],
        phone: ['telefono', 'tel', 'cellulare', 'cell', 'phone', 'mobile', 'whatsapp', 'recapito'],
        notes: ['note', 'notes', 'annotazioni', 'osservazioni', 'commenti', 'remarks']
    };

    function headerField(cell) {
        const c = norm(cell).replace(/[:()]/g, '').trim();
        if (!c) return null;
        for (const [field, words] of Object.entries(HEADER_WORDS)) {
            if (words.includes(c)) return field;
        }
        // intestazioni più lunghe ("Numero maglia 2025", "Ruolo in campo")
        if (/^(n|nr|num|numero)\b/.test(c) && !/telefono|tel/.test(c)) return 'number';
        if (/cognome/.test(c) && /nome/.test(c)) return 'name';
        if (/cognome|surname/.test(c)) return 'last';
        if (/ruolo|position|posizione/.test(c)) return 'role';
        if (/nascita|birth|nato|nata/.test(c)) return 'birth';
        if (/altezza|height/.test(c)) return 'height';
        if (/mail/.test(c)) return 'email';
        if (/tel|cell|phone/.test(c)) return 'phone';
        if (/note/.test(c)) return 'notes';
        if (/nome|name|atleta|giocat/.test(c)) return 'name';
        return null;
    }

    // ------------------------------------------------------------------
    // RUOLI: parole → famiglia; le sigle (P1, S2…) si assegnano dopo
    // ------------------------------------------------------------------
    const ROLE_FAMILIES = [
        ['setter', ['palleggiatore', 'palleggiatrice', 'alzatore', 'alzatrice', 'regista', 'setter', 'passeur', 'passeuse', 'pal', 'palleggio', 'alz', 'p', 'set']],
        ['outside', ['schiacciatore', 'schiacciatrice', 'banda', 'martello', 'laterale', 'attaccante', 'attaccante di palla alta', 'ricettore', 'ricettrice', 'ricettore attaccante', 'outside', 'outside hitter', 'oh', 'spiker', 'hitter', 'receptionneur attaquant', 'r4', 'posto 4', 'schiac', 's', 'b']],
        ['middle', ['centrale', 'centro', 'middle', 'middle blocker', 'mb', 'central', 'c', 'cen']],
        ['opposite', ['opposto', 'opposta', 'opposite', 'opp', 'diagonale', 'oppose', 'o', 'op']],
        ['libero', ['libero', 'libera', 'lib', 'l', 'difensore', 'liberò']],
        ['coach', ['allenatore', 'allenatrice', 'coach', 'head coach', 'primo allenatore', 'all', 'mister', 'entraineur', '1 allenatore']],
        ['assistant', ['vice allenatore', 'secondo allenatore', 'assistant coach', 'vice', '2 allenatore', 'assistente']],
        ['physio', ['fisioterapista', 'physio', 'massaggiatore', 'fisio', 'medico', 'preparatore atletico', 'preparatore']],
        ['manager', ['dirigente', 'team manager', 'direttore sportivo', 'ds', 'dir', 'director', 'accompagnatore', 'presidente']],
        ['other', ['scoutman', 'scout', 'statistico', 'altro', 'other', 'universale', 'jolly']]
    ];
    const FAMILY_LABEL = {
        setter: 'Palleggiatore', outside: 'Schiacciatore', middle: 'Centrale', opposite: 'Opposto', libero: 'Libero',
        coach: 'Allenatore', assistant: 'Vice allenatore', physio: 'Staff sanitario', manager: 'Dirigente', other: 'Altro'
    };
    // sigle disponibili per famiglia, nell'ordine in cui si assegnano
    const FAMILY_SLOTS = {
        setter: ['P1', 'P2'], outside: ['S1', 'S2'], middle: ['C1', 'C2'], opposite: ['O'], libero: ['L1', 'L2'],
        coach: ['All', 'Coach'], assistant: ['Coach'], physio: ['Physio'], manager: ['Dir'], other: []
    };
    const SLOT_FAMILY = {};
    Object.entries(FAMILY_SLOTS).forEach(([f, slots]) => slots.forEach(s => { if (!SLOT_FAMILY[s]) SLOT_FAMILY[s] = f; }));
    SLOT_FAMILY.Other = 'other';

    /** famiglia del ruolo da una parola o sigla ("Palleggiatore", "OPP", "S1", "L") */
    function roleFamily(value) {
        if (value == null) return null;
        const raw = String(value).trim();
        if (!raw) return null;
        if (SLOT_FAMILY[raw]) return SLOT_FAMILY[raw];
        const up = raw.toUpperCase();
        const m = up.match(/^([PSCOL])\s*([12])?$/);          // P, P1, S2, C, O, L1
        if (m) return { P: 'setter', S: 'outside', C: 'middle', O: 'opposite', L: 'libero' }[m[1]];
        const n = norm(raw);
        for (const [fam, words] of ROLE_FAMILIES) {
            if (words.includes(n)) return fam;
        }
        for (const [fam, words] of ROLE_FAMILIES) {
            if (words.some(w => w.length >= 4 && n.includes(w))) return fam;
        }
        return null;
    }

    // ------------------------------------------------------------------
    // DETTAGLI: data/anno di nascita, altezza, email, telefono
    // ------------------------------------------------------------------
    const RE_EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
    const RE_PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){8,12}\d/;
    const RE_DATE = /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})\b/;
    const RE_YEAR = /\b(19[5-9]\d|20[0-2]\d)\b/;
    const RE_HEIGHT = /\b(?:h\s*)?([12][.,]\d{1,2}|[12]\d{2})\s*(?:cm|m)?\b/i;

    function parseBirth(v) {
        const s = String(v == null ? '' : v).trim();
        if (!s) return '';
        // numero seriale di Excel (giorni dal 1900)
        if (/^\d{5}(\.\d+)?$/.test(s)) {
            const d = new Date(Math.round((parseFloat(s) - 25569) * 86400000));
            if (!isNaN(d)) return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        }
        let m = s.match(RE_DATE);
        if (m) {
            let y = m[3];
            if (y.length === 2) y = (parseInt(y, 10) > 30 ? '19' : '20') + y;
            return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${y}`;
        }
        m = s.match(/\b(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[3]}/${m[2]}/${m[1]}`;
        m = s.match(RE_YEAR);
        return m ? m[1] : '';
    }

    function parseHeight(v) {
        const s = String(v == null ? '' : v).trim();
        if (!s) return '';
        const m = s.match(RE_HEIGHT);
        if (!m) return '';
        let h = m[1].replace(',', '.');
        h = h.includes('.') ? Math.round(parseFloat(h) * 100) : parseInt(h, 10);
        return h >= 120 && h <= 230 ? String(h) : '';
    }

    function parseNumber(v) {
        const s = String(v == null ? '' : v).trim().replace(/^(n[°º.]?|nr\.?|#)\s*/i, '');
        const m = s.match(/^(\d{1,2})(?:\.0+)?$/);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        return n >= 0 && n <= 99 ? n : null;
    }

    /** "ROSSI MARIO" → "Rossi Mario"; nomi già scritti bene restano come sono */
    function tidyName(s) {
        let t = String(s == null ? '' : s).replace(/[\s_]+/g, ' ').replace(/^[\s,;:.\-–—|]+|[\s,;:\-–—|]+$/g, '').trim();
        if (!t) return '';
        const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
        if (letters && (letters === letters.toUpperCase() || letters === letters.toLowerCase())) {
            t = t.toLowerCase().replace(/(^|[\s'’-])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
        }
        return t;
    }

    // ------------------------------------------------------------------
    // TESTO → righe di celle
    // ------------------------------------------------------------------
    function splitLine(line) {
        const l = line.replace(/ /g, ' ');
        for (const sep of ['\t', ';', '|']) {
            if (l.includes(sep)) return l.split(sep).map(c => c.trim());
        }
        // virgole: solo se la riga sembra una tabella (≥ 2 virgole), non "Rossi, Mario"
        if ((l.match(/,/g) || []).length >= 2 && !/\d,\d/.test(l)) return l.split(',').map(c => c.trim());
        // colonne allineate con molti spazi (copia da PDF o da tabelle)
        if (/\S {3,}\S/.test(l)) return l.split(/ {3,}/).map(c => c.trim());
        return [l.trim()];
    }

    function textToRows(text) {
        let t = String(text || '').replace(/\r\n?/g, '\n');
        // vecchio formato su una riga: "P1.4.Mario Rossi, S1.10.Luigi Bianchi"
        if (!t.includes('\n') && /^[A-Za-z]{1,6}\d?\.\d{1,2}\.[^,]+(,\s*[A-Za-z]{1,6}\d?\.\d{1,2}\.[^,]+)+$/.test(t.trim())) {
            t = t.split(',').join('\n');
        }
        return t.split('\n')
            .map(l => l.trim())
            .filter(l => l && !/^[-=_*·•.\s]+$/.test(l))
            .map(splitLine)
            .map(cells => cells.filter((c, i, a) => c !== '' || (i > 0 && i < a.length - 1)));
    }

    /** pagine pdf.js ({items:[{x,y,w,str}]}) → righe di celle (stessa y = stessa riga; grande distanza in x = nuova cella) */
    function pdfPagesToRows(pages) {
        const rows = [];
        (pages || []).forEach(page => {
            const items = (page.items || []).filter(it => it.str && it.str.trim());
            const lines = [];
            items.sort((a, b) => a.y - b.y || a.x - b.x).forEach(it => {
                const tol = Math.max(2, (it.size || 10) * 0.45);
                let line = lines.find(l => Math.abs(l.y - it.y) <= tol);
                if (!line) { line = { y: it.y, items: [] }; lines.push(line); }
                line.items.push(it);
            });
            lines.sort((a, b) => a.y - b.y).forEach(line => {
                const its = line.items.sort((a, b) => a.x - b.x);
                const cells = [];
                let cur = null, lastEnd = -1e9;
                its.forEach(it => {
                    const size = it.size || 10;
                    const gap = it.x - lastEnd;
                    if (cur === null || gap > size * 1.4) {
                        if (cur !== null) cells.push(cur.trim());
                        cur = it.str;
                    } else {
                        cur += (gap > size * 0.15 && !/\s$/.test(cur) && !/^\s/.test(it.str) ? ' ' : '') + it.str;
                    }
                    lastEnd = it.x + (it.w || it.str.length * size * 0.5);
                });
                if (cur !== null) cells.push(cur.trim());
                const clean = cells.filter(Boolean);
                if (clean.length) rows.push(clean);
            });
        });
        return rows;
    }

    // ------------------------------------------------------------------
    // ANALISI: intestazione e significato delle colonne
    // ------------------------------------------------------------------
    /** toglie i titoli (righe di una sola cella) sopra una tabella */
    function trimTitleRows(rows) {
        rows = (rows || []).filter(r => r && r.some(c => String(c == null ? '' : c).trim() !== ''));
        const filled = (r) => r.filter(c => String(c == null ? '' : c).trim() !== '').length;
        let i = 0;
        while (i < rows.length - 2 && filled(rows[i]) <= 1 && rows.slice(i + 1).filter(r => filled(r) >= 2).length >= 2) i++;
        return i ? rows.slice(i) : rows;
    }

    function columnCount(rows) {
        return rows.reduce((m, r) => Math.max(m, r.length), 0);
    }

    /** che tipo di dato c'è in una colonna (percentuali sulle righe non vuote) */
    function profileColumn(rows, col) {
        const vals = rows.map(r => r[col]).filter(v => v != null && String(v).trim() !== '');
        const n = vals.length || 1;
        const pct = (fn) => vals.filter(fn).length / n;
        return {
            filled: vals.length / Math.max(1, rows.length),
            number: pct(v => parseNumber(v) !== null),
            role: pct(v => roleFamily(v) !== null),
            email: pct(v => RE_EMAIL.test(String(v))),
            phone: pct(v => RE_PHONE.test(String(v)) && !RE_DATE.test(String(v)) && String(v).replace(/\D/g, '').length >= 8),
            birth: pct(v => (RE_DATE.test(String(v)) || /^\d{5}$/.test(String(v).trim()) || (/^\d{4}$/.test(String(v).trim()) && RE_YEAR.test(String(v))))),
            height: pct(v => parseHeight(v) !== '' && /^([12][.,]\d{1,2}|[12]\d{2})\s*(cm|m)?$/i.test(String(v).trim())),
            text: pct(v => /[A-Za-zÀ-ÿ]{2,}/.test(String(v)) && roleFamily(v) === null)
        };
    }

    function analyze(rows) {
        rows = (rows || []).filter(r => r && r.some(c => String(c == null ? '' : c).trim() !== ''));
        rows = trimTitleRows(rows);
        const cols = columnCount(rows);
        // tabella vera: almeno 2 colonne su buona parte delle righe
        const multi = rows.filter(r => r.filter(c => String(c).trim() !== '').length >= 2).length;
        const tabular = cols >= 2 && multi >= Math.max(1, rows.length * 0.5);
        if (!tabular) return { tabular: false, header: -1, mapping: [] };

        // intestazione: la prima riga (entro le prime 5) con almeno 2 celle riconosciute
        let header = -1, mapping = [];
        for (let i = 0; i < Math.min(5, rows.length); i++) {
            const m = rows[i].map(headerField);
            if (m.filter(Boolean).length >= 2) {
                header = i; mapping = m; break;
            }
        }
        const body = header >= 0 ? rows.slice(header + 1) : rows;
        // colonne senza intestazione riconosciuta: si guarda il contenuto
        const used = new Set(mapping.filter(Boolean));
        for (let c = 0; c < cols; c++) {
            if (mapping[c]) continue;
            const p = profileColumn(body, c);
            let f = null;
            if (p.filled < 0.2) f = 'ignore';
            else if (p.email > 0.6) f = 'email';
            else if (p.number > 0.7 && !used.has('number')) f = 'number';
            else if (p.birth > 0.6 && !used.has('birth')) f = 'birth';
            else if (p.height > 0.6 && !used.has('height')) f = 'height';
            else if (p.phone > 0.6 && !used.has('phone')) f = 'phone';
            else if (p.role > 0.6 && !used.has('role')) f = 'role';
            else if (p.text > 0.6) {
                if (!used.has('name') && !used.has('last') && !used.has('first')) f = 'name';
                else if (used.has('name') && !used.has('first')) {
                    // due colonne di testo: Cognome + Nome
                    const iName = mapping.indexOf('name');
                    if (iName >= 0) { mapping[iName] = 'last'; used.delete('name'); used.add('last'); }
                    f = 'first';
                } else f = 'notes';
            } else f = 'ignore';
            mapping[c] = f;
            used.add(f);
        }
        for (let c = 0; c < cols; c++) if (!mapping[c]) mapping[c] = 'ignore';
        return { tabular: true, header, mapping };
    }

    // ------------------------------------------------------------------
    // RIGA LIBERA → giocatore ("7 Mario Rossi palleggiatore 1.85 2004")
    // ------------------------------------------------------------------
    function parseFreeLine(line) {
        let s = String(line || '').replace(/ /g, ' ').trim();
        const p = { number: null, name: '', roleText: '', family: null, birth: '', height: '', email: '', phone: '', notes: '' };
        if (!s) return p;

        // vecchio formato "P1.4.Mario Rossi"
        let m = s.match(/^([A-Za-z]{1,6}\d?)\.(\d{1,2})\.(.+)$/);
        if (m && roleFamily(m[1])) {
            p.roleText = m[1]; p.family = roleFamily(m[1]); p.number = parseInt(m[2], 10); p.name = tidyName(m[3]);
            return p;
        }
        m = s.match(RE_EMAIL); if (m) { p.email = m[0]; s = s.replace(m[0], ' '); }
        m = s.match(new RegExp('(?:\\b(?:nat[oa]|classe|anno|del)\\s*(?:il|nel)?\\s*)?' + RE_DATE.source, 'i')); if (m) { p.birth = parseBirth(m[0]); s = s.replace(m[0], ' '); }
        m = s.match(/(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){8,12}\d/); if (m && m[0].replace(/\D/g, '').length >= 8) { p.phone = m[0].trim(); s = s.replace(m[0], ' '); }
        m = s.match(/\b(?:h\s*|alt\w*\s*)?(1[.,]\d{2})\s*m?\b|\b(1\d{2}|2[0-2]\d)\s*cm\b/i);
        if (m) { p.height = parseHeight(m[1] || m[2]); s = s.replace(m[0], ' '); }
        if (!p.birth) { m = s.match(/\b(?:classe|anno|nat[oa]\s+nel)?\s*(19[5-9]\d|20[0-2]\d)\b/i); if (m) { p.birth = m[1]; s = s.replace(m[0], ' '); } }

        // numero di maglia: "#7", "n. 7", "7 -", "7)" o un numero isolato di 1-2 cifre
        m = s.match(/(?:^|\s)(?:#|n[°º.]?\s*|nr\.?\s*|num\.?\s*)(\d{1,2})\b/i) || s.match(/^\s*(\d{1,2})\s*[).:\-–—]?\s+/) || s.match(/(?:^|\s)(\d{1,2})(?:\s|$)/);
        if (m) { p.number = parseInt(m[1], 10); s = s.replace(m[0], ' '); }

        // ruolo: parole note (anche tra parentesi o dopo un trattino)
        const words = s.split(/[\s,;()\[\]\/–—-]+/).filter(Boolean);
        // prima le espressioni di più parole
        for (const [fam, list] of ROLE_FAMILIES) {
            const multi = list.filter(w => w.includes(' '));
            const found = multi.find(w => norm(s).includes(w));
            if (found) {
                p.family = fam; p.roleText = found;
                s = s.replace(new RegExp(found.split(' ').join('\\s+'), 'i'), ' ');
                break;
            }
        }
        if (!p.family) {
            // prima le parole intere ("libero", "palleggiatore") ovunque nella riga
            for (const w of words) {
                const fam = w.length >= 4 ? roleFamily(w) : null;
                if (fam) {
                    p.family = fam; p.roleText = w;
                    s = s.replace(new RegExp('(^|[\\s(\\[,;/–—-])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[\\s)\\],;/–—-])'), ' ');
                    break;
                }
            }
        }
        if (!p.family) {
            // sigle (P, S1, OPP) solo se staccate dal nome, all'inizio o in fondo
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                const fam = roleFamily(w);
                const isAbbrev = w.length <= 3;
                const atEdge = i === 0 || i === words.length - 1;
                if (fam && (!isAbbrev || (atEdge && (/^[A-Z]{1,3}\d?$/.test(w) || /\d/.test(w) || w.length === 3)))) {
                    // una sigla in fondo che è l'iniziale del nome ("Rossi M") non è un ruolo
                    if (isAbbrev && i === words.length - 1 && words.length >= 2 && w.length === 1 && /^[A-Z]$/.test(w) && !/^[PSCOL]$/.test(w)) continue;
                    p.family = fam; p.roleText = w;
                    s = s.replace(new RegExp('(^|[\\s(\\[,;/–—-])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[\\s)\\],;/–—-])'), ' ');
                    break;
                }
            }
        }
        p.name = tidyName(s.replace(/[()\[\]]/g, ' '));
        return p;
    }

    // ------------------------------------------------------------------
    // RIGHE + mapping → giocatori
    // ------------------------------------------------------------------
    function buildPlayers(rows, opts = {}) {
        rows = (rows || []).filter(r => r && r.some(c => String(c == null ? '' : c).trim() !== ''));
        if (!opts.mapping) rows = trimTitleRows(rows);
        const info = opts.mapping ? { tabular: true, header: opts.header ?? -1, mapping: opts.mapping } : analyze(rows);
        const players = [];
        const body = info.tabular && info.header >= 0 ? rows.slice(info.header + 1) : rows;

        body.forEach((r, idx) => {
            let p;
            if (info.tabular) {
                p = { number: null, name: '', roleText: '', family: null, birth: '', height: '', email: '', phone: '', notes: '' };
                let first = '', last = '';
                const extra = [];
                info.mapping.forEach((f, c) => {
                    const v = r[c] == null ? '' : String(r[c]).trim();
                    if (!v) return;
                    switch (f) {
                        case 'number': p.number = parseNumber(v); if (p.number === null) extra.push(v); break;
                        case 'name': p.name = tidyName(v); break;
                        case 'first': first = tidyName(v); break;
                        case 'last': last = tidyName(v); break;
                        case 'role': p.roleText = v; p.family = roleFamily(v); break;
                        case 'birth': p.birth = parseBirth(v) || v; break;
                        case 'height': p.height = parseHeight(v) || v; break;
                        case 'email': p.email = v; break;
                        case 'phone': p.phone = v; break;
                        case 'notes': extra.push(v); break;
                        default: break;
                    }
                });
                if (first || last) p.name = [first, last].filter(Boolean).join(' ');
                // nome su una sola colonna che contiene anche il numero o il ruolo ("7 Rossi Mario")
                if (p.name && (p.number === null || !p.family)) {
                    const q = parseFreeLine(p.name);
                    if (p.number === null && q.number !== null) { p.number = q.number; p.name = q.name; }
                    if (!p.family && q.family) { p.family = q.family; p.roleText = q.roleText; p.name = q.name; }
                }
                p.notes = extra.join(' · ');
            } else {
                p = parseFreeLine(r.join(' '));
            }
            // righe che non sono giocatori (titoli, intestazioni, totali)
            const looksHeader = r.filter(c => headerField(c)).length >= 2;
            if (looksHeader || !p.name || p.name.length < 2 || !/[A-Za-zÀ-ÿ]{2,}/.test(p.name)) {
                if (!looksHeader && (p.number !== null || p.family)) {
                    p.warn = 'Nome mancante';
                } else return;
            }
            if (/^(totale|total|squadra|team|elenco|lista|rosa|roster|stagione|campionato|pagina|convocat[aeio]|convocazion[ei]|formazion[ei]|giocator[ei]|giocatric[ei]|atlet[ei]|partita|gara|allenamento|ritrovo)\b/i.test(p.name) && p.number === null) return;
            // riga-titolo che finisce con ":" ("Convocati sabato:") senza numero
            if (!info.tabular && p.number === null && !p.family && /:\s*$/.test(r.join(' ').trim())) return;
            p.source = idx + (info.tabular && info.header >= 0 ? info.header + 2 : 1);
            players.push(p);
        });

        // avvisi: numero mancante o ripetuto
        const seen = {};
        players.forEach(p => {
            if (p.number === null && !['coach', 'assistant', 'physio', 'manager'].includes(p.family)) p.warn = p.warn || 'Numero mancante';
            if (p.number !== null) seen[p.number] = (seen[p.number] || 0) + 1;
        });
        players.forEach(p => { if (p.number !== null && seen[p.number] > 1) p.warn = 'Numero ripetuto nel file'; });
        return { players, info };
    }

    /**
     * Sigle dei ruoli (P1, S1, C1, O, L1, All…) senza doppioni.
     * mode 'merge': le sigle già usate nella rosa restano a chi le ha (tranne chi viene sostituito per numero);
     * mode 'replace': si riparte da zero.
     */
    function assignRoles(players, roster = [], mode = 'merge') {
        const replacedNumbers = new Set(players.filter(p => p.include !== false && p.number !== null).map(p => p.number));
        const taken = new Set(mode === 'merge'
            ? roster.filter(r => !replacedNumbers.has(r.number)).map(r => r.role)
            : []);
        players.forEach(p => {
            if (p.include === false) return;
            if (p.roleFixed && p.role) { taken.add(p.role); return; }
            const fam = p.family || 'other';
            const slots = FAMILY_SLOTS[fam] || [];
            // sigla esplicita nel file (es. "S2") se libera
            const explicit = /^[PSCL][12]$|^O$/.test(String(p.roleText || '').toUpperCase()) ? String(p.roleText).toUpperCase() : null;
            let role = explicit && !taken.has(explicit) ? explicit : slots.find(s => !taken.has(s));
            if (!role) role = 'Other';
            if (role !== 'Other') taken.add(role);
            p.role = role;
        });
        return players;
    }

    function familyLabel(f) { return FAMILY_LABEL[f] || ''; }

    // ------------------------------------------------------------------
    // LETTURA FILE (browser) — librerie caricate solo quando servono
    // ------------------------------------------------------------------
    const LIBS = {
        xlsx: { test: () => root.XLSX, src: ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'] },
        mammoth: { test: () => root.mammoth, src: ['https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'] },
        pdf: { test: () => root.pdfjsLib, src: ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'] },
        tesseract: { test: () => root.Tesseract, src: ['https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'] }
    };
    const TESSERACT_PATHS = {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
        langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ita/4.0.0_best_int'
    };

    function loadLib(name) {
        const lib = LIBS[name];
        if (lib.test()) return Promise.resolve(lib.test());
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = lib.src[0];
            s.onload = () => {
                if (name === 'pdf' && root.pdfjsLib) root.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(lib.test());
            };
            s.onerror = () => reject(new Error('Impossibile caricare il lettore del file (serve la connessione a internet).'));
            document.head.appendChild(s);
        });
    }

    function kindOf(file) {
        const n = (file.name || '').toLowerCase();
        const t = file.type || '';
        if (/\.(xlsx|xlsm|xls|ods|numbers)$/.test(n) || /spreadsheet|excel/.test(t)) return 'sheet';
        if (/\.(csv|tsv)$/.test(n) || t === 'text/csv') return 'csv';
        if (/\.pdf$/.test(n) || t === 'application/pdf') return 'pdf';
        if (/\.docx$/.test(n) || /wordprocessingml/.test(t)) return 'docx';
        if (/\.json$/.test(n) || t === 'application/json') return 'json';
        if (/\.(png|jpe?g|webp|bmp|gif|tiff?)$/.test(n) || t.startsWith('image/')) return 'image';
        if (/\.(txt|text|md|rtf)$/.test(n) || t.startsWith('text/')) return 'text';
        if (/\.doc$/.test(n)) return 'doc';
        return 'text';
    }

    const KIND_LABEL = { sheet: 'Foglio di calcolo', csv: 'CSV', pdf: 'PDF', docx: 'Word', json: 'JSON', image: 'Foto/scansione (lettura del testo)', text: 'Testo', doc: 'Word (vecchio formato)' };

    async function readFile(file, onProgress = () => { }) {
        const kind = kindOf(file);
        const out = { kind, label: KIND_LABEL[kind], name: file.name, rows: [], sheets: null, note: '' };
        if (kind === 'doc') throw new Error('I file .doc del vecchio Word non si possono leggere: salvalo come .docx o PDF, oppure copia e incolla il testo.');
        if (kind === 'csv') {
            onProgress('Lettura del CSV…');
            out.text = await decodeText(file);
            out.rows = textToRows(out.text);
            return out;
        }
        if (kind === 'sheet') {
            onProgress('Lettura del foglio…');
            const XLSX = await loadLib('xlsx');
            const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false, raw: false });
            out.sheets = wb.SheetNames.map(name => ({
                name,
                rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '', blankrows: false })
                    .map(r => r.map(c => String(c == null ? '' : c).trim()))
                    .filter(r => r.some(c => c !== ''))
            })).filter(s => s.rows.length);
            // foglio con più giocatori riconosciuti
            let best = 0, bestCount = -1;
            out.sheets.forEach((s, i) => { const c = buildPlayers(s.rows).players.length; if (c > bestCount) { best = i; bestCount = c; } });
            out.sheet = best;
            out.rows = out.sheets.length ? out.sheets[best].rows : [];
            return out;
        }
        if (kind === 'pdf') {
            onProgress('Lettura del PDF…');
            const lib = await loadLib('pdf');
            const pages = root.PlanPdfParser
                ? await root.PlanPdfParser.readPdf(await file.arrayBuffer(), lib)
                : await readPdfPages(await file.arrayBuffer(), lib);
            out.rows = pdfPagesToRows(pages);
            if (!out.rows.length) out.note = 'Il PDF non contiene testo (è una scansione?): prova a importarlo come foto.';
            return out;
        }
        if (kind === 'docx') {
            onProgress('Lettura del documento Word…');
            const mammoth = await loadLib('mammoth');
            const res = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
            out.rows = htmlToRows(res.value);
            return out;
        }
        if (kind === 'json') {
            const data = JSON.parse(await file.text());
            const list = Array.isArray(data) ? data : (data.team || data.players || data.roster || []);
            out.rows = [['Ruolo', 'Numero', 'Nome', 'Nascita', 'Altezza', 'Email', 'Telefono', 'Note']]
                .concat(list.map(p => [p.role || p.ruolo || '', p.number ?? p.numero ?? '', p.name || p.nome || '', p.birth || '', p.height || '', p.email || '', p.phone || '', p.notes || '']));
            out.json = list;
            return out;
        }
        if (kind === 'image') {
            onProgress('Lettura del testo dalla foto… (la prima volta scarica il riconoscimento, qualche secondo)');
            const T = await loadLib('tesseract');
            const worker = await T.createWorker('ita', 1, {
                ...TESSERACT_PATHS,
                logger: m => { if (m.status === 'recognizing text') onProgress(`Lettura del testo dalla foto… ${Math.round((m.progress || 0) * 100)}%`); }
            });
            try {
                const { data } = await worker.recognize(file);
                out.text = fixOcrNumbers(data.text || '');
                out.rows = textToRows(out.text);
                out.note = 'Testo letto da una foto: controlla nomi e numeri prima di confermare.';
            } finally {
                await worker.terminate();
            }
            return out;
        }
        onProgress('Lettura del testo…');
        out.text = await decodeText(file);
        out.rows = textToRows(out.text);
        return out;
    }

    /** testo da file: UTF-8, oppure Windows-1252 (CSV salvati da Excel) se l'UTF-8 non torna */
    async function decodeText(file) {
        const buf = await file.arrayBuffer();
        let t = new TextDecoder('utf-8').decode(buf);
        if (t.includes('\ufffd')) {
            try { t = new TextDecoder('windows-1252').decode(buf); } catch (e) { /* resta UTF-8 */ }
        }
        return t.replace(/^\ufeff/, '');
    }

    /** OCR: all'inizio della riga "S" "O" "l" "Z" sono quasi sempre cifre (5 0 1 2) del numero di maglia */
    function fixOcrNumbers(text) {
        const map = { S: '5', s: '5', O: '0', o: '0', I: '1', l: '1', '|': '1', Z: '2', z: '2' };
        return String(text).split('\n').map(line => {
            const m = line.match(/^(\s*)([SsOoIlZz|\d]{1,2})(\s+)(.*)$/);
            if (!m || /^\d+$/.test(m[2]) || /\b\d{1,2}\b/.test(m[4])) return line;
            // solo se dopo c'è un nome (parola con iniziale maiuscola)
            if (!/^[A-ZÀ-Ý][a-zà-ÿ]/.test(m[4])) return line;
            return m[1] + m[2].split('').map(c => map[c] || c).join('') + m[3] + m[4];
        }).join('\n');
    }

    async function readPdfPages(arrayBuffer, lib) {
        const doc = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const vp = page.getViewport({ scale: 1 });
            const tc = await page.getTextContent();
            pages.push({ items: tc.items.map(it => ({ x: it.transform[4], y: vp.height - it.transform[5], size: Math.abs(it.transform[0]) || 10, w: it.width || 0, str: it.str })) });
        }
        return pages;
    }

    /**
     * HTML (Word, Google Documenti/Fogli, Excel, pagine web) → righe:
     * le tabelle restano a celle; paragrafi, elenchi puntati e a capo diventano righe di testo
     */
    function htmlToRows(html) {
        const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
        const rows = [];
        const BLOCK = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|PRE|SECTION|ARTICLE|UL|OL|DL|DT|DD|HEADER|FOOTER)$/;
        let buf = '';
        const flush = () => { if (buf.trim()) textToRows(buf).forEach(r => rows.push(r)); buf = ''; };
        const cellText = (td) => {
            // dentro una cella gli a capo diventano spazi
            const c = td.cloneNode(true);
            c.querySelectorAll('br').forEach(b => b.replaceWith(' '));
            return c.textContent.replace(/\s+/g, ' ').trim();
        };
        const walk = (node) => {
            if (node.nodeType === 3) { buf += node.nodeValue; return; }
            if (node.nodeType !== 1) return;
            const tag = node.nodeName;
            if (/^(STYLE|SCRIPT|META|TITLE|HEAD|LINK|COLGROUP)$/.test(tag)) return;
            if (tag === 'TABLE') {
                flush();
                Array.from(node.rows || []).forEach(tr => {
                    const cells = Array.from(tr.cells || []).map(cellText);
                    // celle unite (colspan): restano vuote le colonne coperte, così l'allineamento non si sposta
                    const out = [];
                    Array.from(tr.cells || []).forEach((td, i) => { out.push(cells[i]); for (let k = 1; k < (td.colSpan || 1); k++) out.push(''); });
                    if (out.some(Boolean)) rows.push(out);
                });
                return;
            }
            if (tag === 'BR') { buf += '\n'; return; }
            const block = BLOCK.test(tag);
            if (block) buf += '\n';
            node.childNodes.forEach(walk);
            if (block) buf += '\n';
        };
        walk(doc.body);
        flush();
        return rows;
    }

    /** da dove arriva un incolla (per l'etichetta dell'anteprima) */
    function pasteSourceLabel(html) {
        const h = String(html || '');
        if (/google-sheets-html-origin/i.test(h)) return 'Incollato da Google Fogli';
        if (/docs-internal-guid/i.test(h)) return 'Incollato da Google Documenti';
        if (/urn:schemas-microsoft-com:office:excel|ProgId.{0,4}Excel/i.test(h)) return 'Incollato da Excel';
        if (/urn:schemas-microsoft-com:office:word|ProgId.{0,4}Word/i.test(h)) return 'Incollato da Word';
        if (/LibreOffice|OpenOffice/i.test(h)) return 'Incollato da LibreOffice';
        if (/<table/i.test(h)) return 'Tabella incollata';
        return 'Testo incollato';
    }

    /**
     * Contenuto degli appunti → righe. Con una tabella in HTML si usa quella (celle esatte, anche da Google
     * Documenti e Word); altrimenti il testo semplice (Excel e Fogli lo danno già separato da tabulazioni).
     */
    function clipboardToRows(html, text) {
        const h = String(html || '');
        if (/<table/i.test(h)) {
            const rows = htmlToRows(h);
            if (rows.length) return { rows, label: pasteSourceLabel(h) };
        }
        if (text && String(text).trim()) return { rows: textToRows(text), label: h ? pasteSourceLabel(h) : 'Testo incollato' };
        if (h) return { rows: htmlToRows(h), label: pasteSourceLabel(h) };
        return { rows: [], label: 'Testo incollato' };
    }

    const api = {
        FIELDS, FAMILY_LABEL, familyLabel, roleFamily, parseFreeLine, textToRows, pdfPagesToRows, analyze, buildPlayers,
        assignRoles, trimTitleRows, parseBirth, parseHeight, parseNumber, tidyName, readFile, kindOf, htmlToRows, clipboardToRows, pasteSourceLabel, loadLib, fixOcrNumbers
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.RosterImport = api;
})(typeof window !== 'undefined' ? window : globalThis);
