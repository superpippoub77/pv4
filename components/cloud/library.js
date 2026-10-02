/**
 * LIBRERIA ESERCIZI ONLINE — come la libreria di SpikeCut
 * Esplora risorse con esercizi privati e pubblici, cartelle, Cestino,
 * appunti (taglia/copia/incolla), Sposta in… / Copia in…, Proprietà,
 * cronologia versioni con versioni fissate, salvataggio in libreria e
 * finestra di amministrazione. Il server è nella cartella cloud/.
 *
 * Il codice delle finestre è quello di SpikeCut; qui sotto c'è solo lo
 * strato che lo collega a VolleyProW4 (schede, dati dell'esercizio, utente).
 * Un "progetto" di SpikeCut qui è un esercizio: lo schema di una scheda.
 */
(function () {

const CLOUD_MARKUP = `<div id="accountModal" class="modal-overlay scx">
  <div class="modal-box" style="width:340px;">
    <div class="modal-head">
      <h3 id="accountModalTitle">Accedi</h3>
      <button class="iconbtn" id="accountModalClose" title="Chiudi">✕</button>
    </div>
    <div class="modal-body">

      <div id="acctViewLoggedIn" style="display:none;">
        <div class="hint" style="margin-bottom:12px;">Sei collegato come <b id="acctLoggedUsername"></b> (<span id="acctLoggedEmail"></span>).</div>
        <div class="hint" id="acctRole" style="margin:-6px 0 12px;"></div>
        <div class="hint" id="acctOffline" style="margin-bottom:12px;color:var(--cut);display:none;">Il server non risponde o sei entrato senza account: la libreria online non è disponibile. Esci e accedi di nuovo quando sei collegato a internet.</div>
        <button class="btn primary" id="btnAdminOpen" style="display:none;margin-bottom:8px;">🛠 Amministrazione</button>
        <button class="btn" id="logoutSubmit">Esci</button>
      </div>

    </div>
  </div>
</div>

<div id="saveLibraryModal" class="modal-overlay scx">
  <div class="modal-box" style="width:340px;">
    <div class="modal-head">
      <h3>Salva in libreria</h3>
      <button class="iconbtn" id="saveLibModalClose" title="Chiudi">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>Nome del esercizio</label><input type="text" id="saveLibName"></div>
      <div class="field"><label>Cartella</label><select id="saveLibFolder"></select></div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer;">
          <input type="checkbox" id="saveLibShared" style="width:auto;">
          <span>Condividi nella libreria comune (visibile a tutti gli utenti)</span>
        </label>
      </div>
      <div id="saveLibError" class="hint" style="color:var(--cut);display:none;"></div>
      <button class="btn primary" id="saveLibSubmit">Salva</button>
    </div>
  </div>
</div>
<div id="saveConflictModal" class="modal-overlay scx">
  <div class="modal-box" style="width:340px;">
    <div class="modal-head">
      <h3>Nome già esistente</h3>
      <button class="iconbtn" id="saveConflictClose" title="Chiudi">✕</button>
    </div>
    <div class="modal-body">
      <div id="saveConflictMessage" class="hint" style="margin-bottom:14px;"></div>
      <button class="btn primary" id="saveConflictOverwrite" style="margin-bottom:8px;">Sovrascrivi il esercizio esistente</button>
      <button class="btn" id="saveConflictCopy">Salva come copia separata</button>
    </div>
  </div>
</div>

<div id="pinModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(420px,96vw);">
    <div class="modal-head"><h3 id="pinTitle">Fissa versione</h3><button class="iconbtn" id="pinClose" title="Chiudi">✕</button></div>
    <div class="modal-body">
      <div class="hint" id="pinInfo" style="margin-bottom:8px;"></div>
      <div class="field"><label>Nome della versione</label><input type="text" id="pinLabel" maxlength="80" placeholder="es. Approvata dal cliente, Prima stampa, v2 definitiva"></div>
      <div class="field"><label>Nota (facoltativa)</label><textarea id="pinNote" rows="3" maxlength="500" style="width:100%;resize:vertical;" placeholder="Cosa c'è di importante in questa versione"></textarea></div>
      <div class="hint">Le versioni fissate non vengono mai cancellate e restano nella cronologia insieme a tutte le altre.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
        <button class="btn" id="pinCancel" style="width:auto;margin:0;">Annulla</button>
        <button class="btn primary" id="pinOk" style="width:auto;margin:0;">📌 Fissa</button>
      </div>
    </div>
  </div>
</div>

<div id="versionsModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(620px,96vw);">
    <div class="modal-head">
      <h3>Cronologia versioni</h3>
      <button class="iconbtn" id="versionsModalClose" title="Chiudi">✕</button>
    </div>
    <div class="versions-bar">
      <button class="btn primary" id="verPinCurrent" style="width:auto;margin:0;">📌 Fissa lo stato attuale…</button>
      <label style="display:flex;gap:6px;align-items:center;font-size:12.5px;cursor:pointer;margin:0 0 0 auto;"><input type="checkbox" id="verOnlyPinned" style="width:auto;margin:0;"> Solo versioni fissate</label>
    </div>
    <div id="versionsList" class="modal-body" style="max-height:62vh;overflow-y:auto;">
      <div class="emptystate">Caricamento…</div>
    </div>
  </div>
</div>
<div id="adminModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(980px,96vw);">
    <div class="modal-head">
      <h3>Amministrazione</h3>
      <button class="iconbtn" id="adminModalClose" title="Chiudi">✕</button>
    </div>
    <div class="modal-body" style="max-height:78vh;overflow:auto;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <h4 style="margin:0;font-size:14px;">Stato del database</h4>
        <span id="adminDbBadge" class="admin-badge">…</span>
        <button class="btn" id="adminRefresh" style="width:auto;margin:0 0 0 auto;">↻ Aggiorna</button>
      </div>
      <div id="adminDbInfo" class="admin-grid"></div>
      <div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;flex-wrap:wrap;">
        <h4 style="margin:0;font-size:14px;">Utenti</h4>
        <input type="search" id="adminUserSearch" placeholder="Cerca per nome o email…" autocomplete="off" style="flex:1;min-width:160px;margin:0;">
      </div>
      <div style="overflow-x:auto;"><table class="admin-table" id="adminUsersTable"></table></div>
      <div id="adminUsersSummary" class="hint" style="margin-top:8px;"></div>
      <div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;flex-wrap:wrap;">
        <h4 style="margin:0;font-size:14px;">Esercizi</h4>
        <input type="search" id="adminProjSearch" placeholder="Cerca per nome, proprietario o cartella…" autocomplete="off" style="flex:1;min-width:160px;margin:0;">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap;cursor:pointer;"><input type="checkbox" id="adminProjOnlyPrivate" style="width:auto;"><span>Solo privati</span></label>
      </div>
      <div style="overflow-x:auto;"><table class="admin-table" id="adminProjectsTable"></table></div>
      <div id="adminProjectsSummary" class="hint" style="margin-top:8px;"></div>
      <div class="hint" style="margin-top:10px;">Da amministratore puoi rendere pubblico o privato qualunque esercizio con un proprietario; il proprietario viene indicato e resta traccia di chi ha fatto l'ultimo cambio. I esercizi generici (senza proprietario) sono sempre pubblici. Un clic su un utente nella tabella qui sopra mostra solo i suoi esercizi.</div>
    </div>
  </div>
</div>

<div id="libPropsModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(420px,94vw);">
    <div class="modal-head"><h3 id="libPropsTitle">Proprietà</h3><button class="iconbtn" id="libPropsClose" title="Chiudi">✕</button></div>
    <div class="modal-body"><table class="admin-table" id="libPropsTable"></table></div>
  </div>
</div>
<div id="libMoveModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(420px,96vw);">
    <div class="modal-head"><h3 id="libMoveTitle">Sposta in…</h3><button class="iconbtn" id="libMoveClose" title="Chiudi">✕</button></div>
    <div class="modal-body">
      <div class="hint" id="libMoveInfo" style="margin-bottom:8px;"></div>
      <div id="libMoveTree" class="lib-move-tree"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn" id="libMoveNewFolder" style="width:auto;margin:0;">📁+ Nuova cartella</button>
        <span style="flex:1;"></span>
        <button class="btn" id="libMoveCancel" style="width:auto;margin:0;">Annulla</button>
        <button class="btn primary" id="libMoveOk" style="width:auto;margin:0;">Sposta</button>
      </div>
    </div>
  </div>
</div>

<div id="libraryModal" class="modal-overlay scx">
  <div class="modal-box" style="width:900px;max-width:96vw;height:600px;max-height:88vh;">
    <div class="modal-head">
      <h3>Libreria esercizi</h3>
      <button class="iconbtn" id="libModalClose" title="Chiudi">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;flex:1;padding:0;overflow:hidden;">
      <div id="libToolbar" class="lib-toolbar">
        <div class="lib-tb-group lib-tb-files">
          <button data-cmd="up" title="Cartella superiore (Backspace)">⬆<span>Su</span></button>
          <button id="libNewFolderBtn" data-cmd="newfolder" title="Nuova cartella (Ctrl+Shift+N)">📁<span>Nuova cartella</span></button>
          <i class="lib-tb-sep"></i>
          <button data-cmd="open" title="Apri (Invio)">📂<span>Apri</span></button>
          <button data-cmd="rename" title="Rinomina (F2)">✎<span>Rinomina</span></button>
          <button data-cmd="duplicate" title="Duplica (Ctrl+D)">⧉<span>Duplica</span></button>
          <button data-cmd="delete" title="Sposta nel Cestino (Canc) — Shift+Canc elimina definitivamente">🗑<span>Elimina</span></button>
          <i class="lib-tb-sep"></i>
          <button data-cmd="cut" title="Taglia (Ctrl+X)">✂<span>Taglia</span></button>
          <button data-cmd="copy" title="Copia (Ctrl+C)">📋<span>Copia</span></button>
          <button data-cmd="paste" title="Incolla qui (Ctrl+V)">📌<span>Incolla</span></button>
          <i class="lib-tb-sep"></i>
          <button data-cmd="moveto" title="Sposta in un'altra cartella…">➜<span>Sposta in…</span></button>
          <button data-cmd="copyto" title="Copia in un'altra cartella…">⇉<span>Copia in…</span></button>
          <i class="lib-tb-sep"></i>
          <button data-cmd="props" title="Proprietà">ℹ<span>Proprietà</span></button>
        </div>
        <div class="lib-tb-group lib-tb-trash">
          <button data-cmd="restore" title="Rimetti gli elementi selezionati dove erano">↺<span>Ripristina</span></button>
          <button data-cmd="purge" title="Elimina per sempre gli elementi selezionati">✖<span>Elimina definitivamente</span></button>
          <button data-cmd="emptytrash" title="Elimina per sempre tutto il contenuto del Cestino">🗑<span>Svuota Cestino</span></button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--line-soft);flex-shrink:0;">
        <input type="search" id="libSearch" placeholder="🔍 Cerca in tutta la libreria (nome, cartella, autore)…" autocomplete="off" style="flex:1;min-width:120px;margin:0;">
        <div id="libOpenAllWrap"></div>
      </div>
      <div style="display:flex;flex:1;min-height:0;">
        <div id="libTree" style="width:190px;flex-shrink:0;border-right:1px solid var(--line-soft);overflow-y:auto;padding:8px 6px;"></div>
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
          <div id="libBreadcrumb" style="padding:7px 12px;font-size:12px;color:var(--ink-dim);border-bottom:1px solid var(--line-soft);flex-shrink:0;"></div>
          <div id="libList" style="flex:1;overflow-y:auto;padding:2px 10px;"></div>
        </div>
      </div>
<div id="promptModal" class="modal-overlay scx">
  <div class="modal-box" style="width:320px;">
    <div class="modal-head"><h3 id="promptTitle">Nome</h3></div>
    <div class="modal-body">
      <input type="text" id="promptInput">
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn" id="promptCancel" style="flex:1;">Annulla</button>
        <button class="btn primary" id="promptOk" style="flex:1;">Conferma</button>
      </div>
    </div>
  </div>
</div>

<div id="confirmModal" class="modal-overlay scx">
  <div class="modal-box" style="width:320px;">
    <div class="modal-head"><h3 id="confirmTitle">Conferma</h3></div>
    <div class="modal-body">
      <div id="confirmMessage" class="hint" style="font-size:12.5px;color:var(--ink);white-space:pre-line;"></div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn" id="confirmCancel" style="flex:1;">Annulla</button>
        <button class="btn primary" id="confirmOk" style="flex:1;">Conferma</button>
      </div>
    </div>
  </div>
</div>

<div id="toastHost"></div>
<div id="ctxMenu"></div>`;

function boot() {
  const host = document.createElement('div');
  host.id = 'cloudLibraryRoot';
  host.innerHTML = CLOUD_MARKUP;
  while (host.firstChild) document.body.appendChild(host.firstChild);

/* ===== collegamento a VolleyProW4 ===== */
const currentLang = 'it';
function translate(str){ return str; }
function tpl(str, vars){
  let s = translate(str);
  if(vars) for(const k in vars) s = s.split('{'+k+'}').join(vars[k]);
  return s;
}
function applyI18n(){ /* testi in italiano */ }
function renderModalDock(){ /* finestre ridotte a icona: non usate in VolleyProW4 */ }

// Collegamento scheda ↔ esercizio in libreria (come state.libraryId… di SpikeCut, ma per scheda)
function libInfo(){
  const t = window.editor && window.editor.getCurrentTab();
  if(!t) return {};
  return t.lib || (t.lib = {});
}
function schemaPayload(){ return window.editor.getSchemaData(); }
// impronta corta dello schema (per sapere se ci sono modifiche non salvate in libreria)
function hashStr(s){ let h = 5381; for(let i=0;i<s.length;i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ':' + s.length; }
function schemaHash(data){ return hashStr(JSON.stringify(data || schemaPayload())); }
function markSaved(data){ libInfo().savedHash = schemaHash(data); }
const state = {
  get libraryId(){ return libInfo().id || null; },
  set libraryId(v){ libInfo().id = v || null; },
  get libraryFolderId(){ return libInfo().folderId ?? null; },
  set libraryFolderId(v){ libInfo().folderId = v ?? null; },
  get librarySharedLast(){ return !!libInfo().shared; },
  set librarySharedLast(v){ libInfo().shared = !!v; },
  get libraryUpdated(){ return libInfo().updated || null; },
  set libraryUpdated(v){ libInfo().updated = v || null; },
  // modifiche non ancora salvate in libreria
  get libraryDirty(){ const i = libInfo(); return !!i.id && i.savedHash !== schemaHash(); },
  set libraryDirty(v){ if(!v) markSaved(); else libInfo().savedHash = null; }
};
function activeSchemaName(){
  const t = window.editor.getCurrentTab();
  return (t && t.name && t.name.trim()) || 'Esercizio';
}
function renameActiveTab(name){
  const ed = window.editor;
  ed.updateTabName(ed.activeTabId, name);
  const input = document.querySelector(`.tab[data-tab-id="${ed.activeTabId}"] .tab-title`);
  if(input) input.value = name;
  const title = document.getElementById('schemaTitle');
  if(title) title.value = name;
}
function renameTabsOfLibraryItem(id, name){
  const ed = window.editor;
  ed.tabs.forEach((t, tid)=>{
    if(!t.lib || t.lib.id!==id) return;
    ed.updateTabName(tid, name);
    const input = document.querySelector(`.tab[data-tab-id="${tid}"] .tab-title`);
    if(input) input.value = name;
    if(tid===ed.activeTabId){ const title = document.getElementById('schemaTitle'); if(title) title.value = name; }
  });
}
// Carica un esercizio: newTab true = sempre in una scheda nuova, false = nella scheda attuale,
// non indicato = nella scheda attuale se è vuota, altrimenti in una nuova
async function loadSchemaIntoTab(data, name, newTab){
  const ed = window.editor;
  const t = ed.getCurrentTab();
  if(newTab===true || (newTab!==false && t && t.objects.size>0)) ed.addNewTab();
  if(data) await ed.loadSchema(Promise.resolve(data));
  if(name) renameActiveTab(name);
}

/* ===== helpers: finestre (da SpikeCut) ===== */
function setupOverlayClickClose(overlayEl, closeFn){
  let downOnOverlay = false;
  overlayEl.addEventListener('mousedown', (e)=>{ downOnOverlay = (e.target === overlayEl); });
  overlayEl.addEventListener('click', (e)=>{ if(e.target === overlayEl && downOnOverlay) closeFn(); });
}
// Apre una finestra modale assicurandosi che finisca sempre sopra alle altre
// eventualmente già aperte (es. una conferma sopra la libreria): la sposta in
// fondo al DOM, dove — a parità di z-index — il browser disegna per ultimo.
function openModal(id){
  const el = document.getElementById(id);
  el.parentNode.appendChild(el);
  el.classList.add('open');
  if(el.dataset.minimized==='1'){ delete el.dataset.minimized; renderModalDock(); }
}

/* ===== helpers: menu contestuale, avvisi, conferme (da SpikeCut) ===== */
function showContextMenu(clientX, clientY, items){
  const menu = document.getElementById('ctxMenu');
  menu.innerHTML = '';
  items.forEach(it=>{
    if(it==='sep'){
      const s = document.createElement('div'); s.className='menu-sep';
      menu.appendChild(s);
      return;
    }
    const btn = document.createElement('button');
    btn.textContent = translate(it.label);
    if(it.disabled) btn.disabled = true;
    btn.onclick = (e)=>{ e.stopPropagation(); hideContextMenu(); if(!it.disabled) it.action(); };
    menu.appendChild(btn);
  });
  menu.style.display = 'block';
  // riposiziono DOPO averlo reso visibile, per conoscerne le dimensioni reali
  // e non farlo uscire dal bordo destro/basso della finestra
  const rect = menu.getBoundingClientRect();
  const x = Math.min(clientX, window.innerWidth - rect.width - 6);
  const y = Math.min(clientY, window.innerHeight - rect.height - 6);
  menu.style.left = Math.max(4,x) + 'px';
  menu.style.top = Math.max(4,y) + 'px';
}
function hideContextMenu(){
  document.getElementById('ctxMenu').style.display = 'none';
}
// Il mousedown scatta sempre, subito, sia che l'interazione resti un clic sia
// che diventi un trascinamento (selezione, spostamento di una forma...): usarlo
// invece di 'click' evita che il menu resti aperto quando l'interazione
// successiva è un trascinamento e il browser non arriva a generare un 'click'.
document.addEventListener('mousedown', (e)=>{
  const menu = document.getElementById('ctxMenu');
  if(menu.style.display==='block' && !menu.contains(e.target)) hideContextMenu();
}, true);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideContextMenu(); });
document.addEventListener('contextmenu', (e)=>{
  // un secondo tasto destro fuori da un'area gestita chiude il menu invece di
  // lasciarlo aperto sopra a quello nativo del browser
  if(!e.defaultPrevented) hideContextMenu();
});

function showToast(message, isError){
  const host = document.getElementById('toastHost');
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.textContent = translate(message);
  host.appendChild(t);
  requestAnimationFrame(()=> t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 220);
  }, 4200);
}
let _confirmResolve = null;
function showConfirm(message, title){
  return new Promise((resolve)=>{
    document.getElementById('confirmTitle').textContent = translate(title || 'Conferma');
    document.getElementById('confirmMessage').textContent = translate(message);
    openModal('confirmModal');
    _confirmResolve = resolve;
  });
}
function resolveConfirm(v){
  document.getElementById('confirmModal').classList.remove('open');
  if(_confirmResolve){ _confirmResolve(v); _confirmResolve = null; }
}
document.getElementById('confirmOk').onclick = ()=> resolveConfirm(true);
document.getElementById('confirmCancel').onclick = ()=> resolveConfirm(false);
setupOverlayClickClose(document.getElementById('confirmModal'), ()=> resolveConfirm(false));

let _promptResolve = null;
function showPrompt(title, defaultValue){
  return new Promise((resolve)=>{
    document.getElementById('promptTitle').textContent = translate(title || 'Nome');
    const inp = document.getElementById('promptInput');
    inp.value = defaultValue || '';
    openModal('promptModal');
    inp.focus(); inp.select();
    _promptResolve = resolve;
  });
}
function resolvePrompt(v){
  document.getElementById('promptModal').classList.remove('open');
  if(_promptResolve){ _promptResolve(v); _promptResolve = null; }
}
document.getElementById('promptOk').onclick = ()=> resolvePrompt(document.getElementById('promptInput').value.trim());
document.getElementById('promptCancel').onclick = ()=> resolvePrompt(null);
document.getElementById('promptInput').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') resolvePrompt(document.getElementById('promptInput').value.trim());
  if(e.key==='Escape') resolvePrompt(null);
});
setupOverlayClickClose(document.getElementById('promptModal'), ()=> resolvePrompt(null));

/* ===== amministrazione (da SpikeCut) ===== */
/* ============================================================
   AMMINISTRAZIONE (solo amministratori): stato del database e utenti
============================================================ */
const adminState = { users:[], sort:'created', dir:1 };
function fmtDateTime(iso){ if(!iso) return '—'; const d = new Date(iso); if(isNaN(d)) return '—'; return d.toLocaleDateString(currentLang==='zh'?'zh-CN':currentLang, {day:'2-digit', month:'2-digit', year:'numeric'}) + ' ' + d.toLocaleTimeString(currentLang==='zh'?'zh-CN':currentLang, {hour:'2-digit', minute:'2-digit'}); }
function fmtBytes(n){ if(n==null) return '—'; if(n < 1024) return n + ' B'; if(n < 1048576) return (n/1024).toFixed(1).replace('.', ',') + ' KB'; return (n/1048576).toFixed(1).replace('.', ',') + ' MB'; }
async function openAdmin(){
  if(!currentUser){ openAccountModal(); return; }
  if(!currentUser.isAdmin){ showToast('L\'amministrazione è riservata agli amministratori: è amministratore il primo account registrato su questo sito, oppure chi è indicato in ADMIN_USERS nel file cloud/config.php.', true); return; }
  closeAccountModal();
  openModal('adminModal');
  await refreshAdmin();
}
async function refreshAdmin(){
  const badge = document.getElementById('adminDbBadge'), info = document.getElementById('adminDbInfo');
  badge.className = 'admin-badge'; badge.textContent = translate('Verifica in corso…'); info.innerHTML = '';
  try{
    const data = await apiFetch('admin_status.php', {method:'GET'});
    const s = data.status, cnt = s.counts || {};
    if(s.connected){ badge.className = 'admin-badge ok'; badge.textContent = '● ' + translate('Connesso'); }
    else { badge.className = 'admin-badge warn'; badge.textContent = '● ' + translate('Nessun database: file JSON'); }
    const cell = (k, v)=> `<div><span class="k">${escapeHTML(translate(k))}</span><span class="v">${escapeHTML(String(v))}</span></div>`;
    let html = cell('Database in uso', s.active==='sqlite' ? 'SQLite' : (s.active==='mysql' ? 'MySQL' : translate('File JSON')))
      + (s.configured !== s.active ? cell('Configurato', s.configured) : '')
      + (s.version ? cell('Versione', s.version) : '')
      + (s.file ? cell('File', s.file + ' · ' + fmtBytes(s.sizeBytes)) : '')
      + (s.server ? cell('Server', s.server) : '')
      + (s.journal ? cell('Modalità', s.journal==='wal' ? 'WAL (' + translate('letture e scritture contemporanee') + ')' : s.journal) : '')
      + (s.migratedAt ? cell('Migrazione dai file JSON', fmtDateTime(s.migratedAt)) : '')
      + (s.active==='sqlite' ? cell('Copie di sicurezza', s.backups ? tpl('{n} (ultima: {d})', {n:s.backups, d:fmtDateTime(s.lastBackup)}) : translate('nessuna ancora')) : '')
      + cell('Utenti', cnt.users) + cell('Esercizi', tpl('{n} ({pub} pubblici, {priv} privati, {gen} generici)', {n:cnt.projects, pub:cnt.public, priv:cnt.private, gen:cnt.generic}))
      + cell('Cartelle', cnt.folders);
    if(s.warning) html = `<div style="grid-column:1/-1;border-color:#f0c36d;background:rgba(255,159,10,.12);">⚠️ ${escapeHTML(translate(s.warning))}</div>` + html;
    info.innerHTML = html;
  }catch(err){
    badge.className = 'admin-badge ko'; badge.textContent = '● ' + translate('Non connesso');
    info.innerHTML = `<div style="grid-column:1/-1;">${escapeHTML(err.message || translate('Il server non risponde.'))}</div>`;
  }
  try{
    const data = await apiFetch('admin_users.php', {method:'GET'});
    adminState.users = data.users || []; adminState.generic = data.genericProjects || 0;
    renderAdminUsers();
    await loadAdminProjects();
  }catch(err){
    document.getElementById('adminUsersTable').innerHTML = '';
    document.getElementById('adminUsersSummary').textContent = err.message || translate('Impossibile leggere l\'elenco degli utenti.');
  }
}

/* esercizi di tutti gli utenti (amministratore): visibilità */
const adminProj = { list:[], sort:'updated', dir:-1 };
async function loadAdminProjects(){
  try{
    const data = await apiFetch('admin_projects.php', {method:'GET'});
    adminProj.list = data.projects || [];
    renderAdminProjects();
  }catch(err){
    document.getElementById('adminProjectsTable').innerHTML = '';
    document.getElementById('adminProjectsSummary').textContent = err.message || translate('Impossibile leggere l\'elenco dei esercizi.');
  }
}
function renderAdminProjects(){
  const q = (document.getElementById('adminProjSearch').value || '').toLowerCase().trim();
  const onlyPriv = document.getElementById('adminProjOnlyPrivate').checked;
  let rows = adminProj.list.filter(p=> (!onlyPriv || !p.shared) && (!q || (p.name||'').toLowerCase().includes(q) || (p.ownerName||'').toLowerCase().includes(q) || (p.folder||'').toLowerCase().includes(q)));
  const k = adminProj.sort, d = adminProj.dir;
  rows.sort((a,b)=>{ const x = k==='vis' ? (a.generic?2:(a.shared?1:0)) : (a[k] ?? ''), y = k==='vis' ? (b.generic?2:(b.shared?1:0)) : (b[k] ?? ''); return (typeof x==='number' && typeof y==='number' ? x-y : String(x).localeCompare(String(y))) * d; });
  const cols = [['name','Esercizio'],['ownerName','Proprietario'],['vis','Visibilità'],['updated','Ultima modifica'],['','']];
  const t = document.getElementById('adminProjectsTable');
  t.innerHTML = '<thead><tr>' + cols.map(([key,l])=>`<th data-k="${key}">${escapeHTML(translate(l))}${key && k===key ? (d>0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr></thead><tbody>'
    + rows.map(p=>{
        const vis = p.generic ? '🌐 ' + translate('generico') : (p.shared ? '🌐 ' + translate('pubblico') : '🔒 ' + translate('privato'));
        const who = p.changedBy ? `<div class="hint" style="margin:0;font-size:10.5px;">${escapeHTML(tpl('cambiato da {u} il {d}', {u:p.changedBy, d:fmtDateTime(p.changedAt)}))}${p.changedByAdmin ? ' (' + escapeHTML(translate('amministratore')) + ')' : ''}</div>` : '';
        const act = p.generic ? `<span class="hint" style="margin:0;">${escapeHTML(translate('sempre pubblico'))}</span>`
          : `<button class="btn" data-id="${escapeHTML(p.id)}" data-shared="${p.shared?'0':'1'}" style="width:auto;margin:0;padding:3px 9px;font-size:11.5px;">${escapeHTML(translate(p.shared ? '🔒 Rendi privato' : '🌐 Rendi pubblico'))}</button>`;
        return `<tr><td>${escapeHTML(p.name)}${p.folder ? `<div class="hint" style="margin:0;font-size:10.5px;">📁 ${escapeHTML(p.folder)}</div>` : ''}</td>`
          + `<td>${p.generic ? '—' : escapeHTML(p.ownerName||'?')}${currentUser && p.ownerId===currentUser.id ? ' <span style="color:var(--ink-dim);">(' + escapeHTML(translate('tu')) + ')</span>' : ''}</td>`
          + `<td>${vis}${who}</td><td>${fmtDateTime(p.updated)}</td><td>${act}</td></tr>`;
      }).join('') + '</tbody>';
  t.querySelectorAll('th[data-k]').forEach(th=>{ if(!th.dataset.k) return; th.onclick = ()=>{ const key = th.dataset.k; if(adminProj.sort===key) adminProj.dir = -adminProj.dir; else { adminProj.sort = key; adminProj.dir = 1; } renderAdminProjects(); }; });
  t.querySelectorAll('button[data-id]').forEach(b=> b.onclick = ()=> adminSetShared(adminProj.list.find(p=>p.id===b.dataset.id), b.dataset.shared==='1'));
  const pub = adminProj.list.filter(p=>p.shared).length;
  document.getElementById('adminProjectsSummary').textContent = tpl('{n} esercizi mostrati su {t} ({pub} pubblici, {priv} privati).', {n:rows.length, t:adminProj.list.length, pub, priv:adminProj.list.length-pub});
}
async function adminSetShared(p, shared){
  if(!p) return;
  const mine = currentUser && p.ownerId===currentUser.id;
  if(!mine){
    const msg = shared
      ? tpl('Rendere pubblico il esercizio «{name}» di {owner}? Lo vedranno e potranno aprirlo tutti gli utenti.', {name:p.name, owner:p.ownerName})
      : tpl('Rendere privato il esercizio «{name}» di {owner}? Lo vedrà solo il suo proprietario.', {name:p.name, owner:p.ownerName});
    if(!(await showConfirm(msg, shared ? 'Rendi pubblico' : 'Rendi privato'))) return;
  }
  try{
    await apiFetch('set_shared.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:p.id, shared})});
    showToast(shared ? tpl('«{name}» ora è pubblico.', {name:p.name}) : tpl('«{name}» ora è privato.', {name:p.name}), false);
    await refreshAdmin();
  }catch(err){ showToast(err.message || 'Impossibile cambiare la visibilità del esercizio.', true); }
}

function renderAdminUsers(){
  const q = (document.getElementById('adminUserSearch').value || '').toLowerCase().trim();
  const cols = [['username','Utente'],['email','Email'],['created','Registrato'],['lastLogin','Ultimo accesso'],['lastSave','Ultimo salvataggio'],['projects','Esercizi'],['public','Pubblici'],['private','Privati'],['folders','Cartelle']];
  let rows = adminState.users.filter(u=> !q || (u.username||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
  const k = adminState.sort, d = adminState.dir;
  rows.sort((a,b)=>{ const x = a[k] ?? '', y = b[k] ?? ''; return (typeof x==='number' && typeof y==='number' ? x-y : String(x).localeCompare(String(y))) * d; });
  const t = document.getElementById('adminUsersTable');
  t.innerHTML = '<thead><tr>' + cols.map(([key,l])=>`<th data-k="${key}">${escapeHTML(translate(l))}${k===key ? (d>0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr></thead><tbody>'
    + rows.map(u=>`<tr data-user="${escapeHTML(u.username)}" style="cursor:pointer;" title="${escapeHTML(translate('Mostra i esercizi di questo utente'))}"><td>${escapeHTML(u.username)}${u.isAdmin ? ' <span class="admin-badge ok" style="font-size:10px;padding:0 6px;">admin</span>' : ''}${currentUser && u.id===currentUser.id ? ' <span style="color:var(--ink-dim);">(' + escapeHTML(translate('tu')) + ')</span>' : ''}</td>`
      + `<td>${escapeHTML(u.email)}</td><td>${fmtDateTime(u.created)}</td><td>${fmtDateTime(u.lastLogin)}</td><td>${fmtDateTime(u.lastSave)}</td>`
      + `<td class="num">${u.projects}</td><td class="num">${u.public}</td><td class="num">${u.private}</td><td class="num">${u.folders}</td></tr>`).join('') + '</tbody>';
  t.querySelectorAll('th').forEach(th=> th.onclick = ()=>{ const key = th.dataset.k; if(adminState.sort===key) adminState.dir = -adminState.dir; else { adminState.sort = key; adminState.dir = 1; } renderAdminUsers(); });
  t.querySelectorAll('tr[data-user]').forEach(tr=> tr.onclick = ()=>{ const s = document.getElementById('adminProjSearch'); s.value = tr.dataset.user; renderAdminProjects(); s.scrollIntoView && s.scrollIntoView({block:'center'}); });
  const tot = adminState.users.reduce((s,u)=>s+u.projects,0);
  document.getElementById('adminUsersSummary').textContent = (q ? tpl('{n} utenti trovati su {t}.', {n:rows.length, t:adminState.users.length}) : tpl('{n} utenti registrati.', {n:adminState.users.length}))
    + ' ' + tpl('Esercizi con proprietario: {p}; esercizi generici (sempre pubblici): {g}.', {p:tot, g:adminState.generic});
}

/* ===== libreria, salvataggio, versioni (da SpikeCut) ===== */
const AUTH_TOKEN_KEY = 'spikecut-jwt';
function getAuthToken(){ try{ return localStorage.getItem(AUTH_TOKEN_KEY); }catch(err){ return null; } }
function setAuthToken(token){ try{ if(token) localStorage.setItem(AUTH_TOKEN_KEY, token); else localStorage.removeItem(AUTH_TOKEN_KEY); }catch(err){ /* best-effort */ } }
async function apiFetch(path, opts){
  try{
    return await CloudApi.fetch(path, opts);
  }catch(err){
    if(err.status===401 && currentUser && path!=='login.php' && path!=='logout.php'){
      // accesso scaduto o revocato: come un'uscita dall'account, niente dati privati a video
      currentUser = null; clearPrivateLibraryData(); updateAccountUI();
      showToast('L\'accesso è scaduto: esci e accedi di nuovo per usare la libreria.', true);
    }
    throw err;
  }
}
function escapeHTML(s){
  return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
// Salvataggio rapido: se il esercizio è già collegato a un elemento della
// libreria, lo sovrascrive direttamente senza aprire nessuna finestra —
// è il caso più comune (risalvare il proprio esercizio già aperto). Solo
// la PRIMA volta (nessun collegamento ancora) serve scegliere nome e
// cartella, quindi in quel caso apre comunque la finestra completa.
async function quickSaveToLibrary(){
  if(!currentUser){ showToast('Accedi al tuo account per salvare in libreria.', true); return; }
  if(!state.libraryId){ saveToLibrary(); return; }
  const name = activeSchemaName();
  try{
    const data = schemaPayload();
    const payload = { id: state.libraryId, name, shared: !!state.librarySharedLast, folderId: state.libraryFolderId, data };
    const saved = await apiFetch('save.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    state.libraryUpdated = saved.updated || new Date().toISOString(); markSaved(data);
    showToast('Salvato in libreria.', false);
    return true;
  }catch(err){ showToast('Errore nel salvataggio in libreria: ' + err.message, true); return false; }
}
async function saveToLibrary(){
  if(!currentUser){ showToast('Accedi al tuo account per salvare in libreria.', true); return; }
  document.getElementById('saveLibName').value = activeSchemaName();
  document.getElementById('saveLibShared').checked = !!state.librarySharedLast;
  document.getElementById('saveLibError').style.display = 'none';
  openModal('saveLibraryModal');
  const folderSel = document.getElementById('saveLibFolder');
  folderSel.innerHTML = '<option value="">📁 Cartella principale</option>';
  try{
    const data = await apiFetch('list.php', {method:'GET'});
    libCacheItems = data.items || []; libCacheFolders = data.folders || [];
    folderSel.innerHTML = folderOptionsHTML(null);
    folderSel.value = (state.libraryFolderId!=null ? state.libraryFolderId : libCurrentFolderId) || '';
  }catch(err){ /* selettore resta solo con "Cartella principale": non blocco il salvataggio per questo */ }
}
function closeSaveLibraryModal(){ document.getElementById('saveLibraryModal').classList.remove('open'); }
document.getElementById('saveLibModalClose').onclick = closeSaveLibraryModal;
setupOverlayClickClose(document.getElementById('saveLibraryModal'), closeSaveLibraryModal);
let _saveConflictResolve = null;
function showSaveConflict(name){
  return new Promise((resolve)=>{
    document.getElementById('saveConflictMessage').textContent = tpl('Hai già un esercizio chiamato "{name}" nella tua libreria. Cosa vuoi fare?', {name});
    openModal('saveConflictModal');
    _saveConflictResolve = resolve;
  });
}
function resolveSaveConflict(v){
  document.getElementById('saveConflictModal').classList.remove('open');
  if(_saveConflictResolve){ _saveConflictResolve(v); _saveConflictResolve = null; }
}
document.getElementById('saveConflictOverwrite').onclick = ()=> resolveSaveConflict('overwrite');
document.getElementById('saveConflictCopy').onclick = ()=> resolveSaveConflict('copy');
document.getElementById('saveConflictClose').onclick = ()=> resolveSaveConflict(null);
setupOverlayClickClose(document.getElementById('saveConflictModal'), ()=> resolveSaveConflict(null));

document.getElementById('saveLibSubmit').onclick = async ()=>{
  const name = document.getElementById('saveLibName').value.trim();
  const errEl = document.getElementById('saveLibError');
  errEl.style.display = 'none';
  if(!name){ errEl.textContent='Inserisci un nome per il esercizio.'; errEl.style.display=''; return; }
  const shared = document.getElementById('saveLibShared').checked;
  const folderId = document.getElementById('saveLibFolder').value || null;

  let targetId = state.libraryId || null;
  try{
    // ricontrollo con l'elenco più aggiornato possibile, per non basarmi su
    // dati eventualmente non più freschi da quando la finestra è stata aperta
    const freshData = await apiFetch('list.php', {method:'GET'});
    libCacheItems = freshData.items || []; libCacheFolders = freshData.folders || [];
    const norm = (s)=> (s||'').trim().toLowerCase();

    if(state.libraryId){
      // il esercizio aperto in questa scheda esiste GIÀ in libreria: risalvare
      // lo sovrascriverebbe direttamente, quindi chiedo sempre conferma.
      const choice = await showSaveConflict(name);
      if(!choice) return; // annullato: si resta nella modale di salvataggio
      if(choice==='copy') targetId = null; // crea un esercizio nuovo e separato, lascia intatto l'originale
      // 'overwrite': targetId resta state.libraryId, cioè lo stesso esercizio
    } else {
      // esercizio nuovo in questa scheda: controllo comunque se esiste già un
      // ALTRO esercizio con lo stesso nome nella stessa cartella di destinazione
      const dup = libCacheItems.find(it=> it.mine && it.id!==state.libraryId
        && (it.folderId||null)===(folderId||null) && norm(it.name)===norm(name));
      if(dup){
        const choice = await showSaveConflict(name);
        if(!choice) return;
        if(choice==='overwrite') targetId = dup.id;
        // 'copy': targetId resta null (nuovo esercizio)
      }
    }
  }catch(err){ /* se il controllo fallisce, procedo comunque con il salvataggio normale */ }

  try{
    const schemaData = schemaPayload();
    const payload = { id: targetId, name, shared, folderId, data: schemaData };
    const data = await apiFetch('save.php', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    state.libraryId = data.id;
    state.libraryFolderId = folderId;
    state.librarySharedLast = shared;
    state.libraryUpdated = data.updated || new Date().toISOString();
    renameActiveTab(name); markSaved(schemaData);
    closeSaveLibraryModal();
    showToast(shared ? 'Salvato in libreria e condiviso con tutti gli utenti.' : 'Salvato nella tua libreria personale.', false);
  }catch(err){ errEl.textContent = err.message; errEl.style.display=''; }
};
let libCacheItems = [];
let libCacheFolders = [];
let libCurrentFolderId = null;
let libClipboard = null; // {mode:'copy'|'cut', type:'project'|'folder', id, name}

let libSearchQuery = '';
function openLibraryModal(){
  if(!currentUser){ openAccountModal('login'); showToast('Accedi al tuo account per usare la libreria.', true); return; }
  libCurrentFolderId = null;
  libSearchQuery = ''; const ls = document.getElementById('libSearch'); if(ls) ls.value = '';
  openModal('libraryModal');
  loadLibraryList();
}
function closeLibraryModal(){ document.getElementById('libraryModal').classList.remove('open'); }
document.getElementById('libModalClose').onclick = closeLibraryModal;
setupOverlayClickClose(document.getElementById('libraryModal'), closeLibraryModal);

async function loadLibraryList(){
  const host = document.getElementById('libList');
  host.innerHTML = '<div class="emptystate">Caricamento…</div>';
  try{
    const data = await apiFetch('list.php', {method:'GET'});
    libCacheItems = data.items || [];
    libCacheFolders = data.folders || [];
    libCacheTrash = data.trash || []; libTrashDays = data.trashDays || 30;
    if(libCurrentFolderId && !libCacheFolders.some(f=>f.id===libCurrentFolderId)) libCurrentFolderId = null;
    renderLibraryView();
  }catch(err){
    host.innerHTML = `<div class="emptystate">${escapeHTML(err.message)}</div>`;
  }
}
function folderPath(folderId){
  const path = [];
  let cur = folderId;
  let guard = 0;
  while(cur && guard++ < 50){
    const f = libCacheFolders.find(x=>x.id===cur);
    if(!f) break;
    path.unshift(f);
    cur = f.parentId;
  }
  return path;
}
let libCacheTrash = [], libTrashDays = 30, libInTrash = false;
function navigateToFolder(folderId){
  libInTrash = false;
  libCurrentFolderId = folderId;
  if(libSearchQuery){ libSearchQuery = ''; document.getElementById('libSearch').value = ''; } // andando in una cartella la ricerca si chiude
  renderLibraryView();
}
function folderOptionsHTML(excludeId){
  const opts = ['<option value="">📁 Cartella principale</option>'];
  function walk(parentId, depth){
    libCacheFolders.filter(f=>(f.parentId||null)===(parentId||null)).forEach(f=>{
      if(f.id===excludeId) return; // non si può spostare una cartella dentro se stessa (i figli sono comunque esclusi dal ciclo lato server)
      opts.push(`<option value="${f.id}">${'　'.repeat(depth)}📁 ${escapeHTML(f.name)}</option>`);
      walk(f.id, depth+1);
    });
  }
  walk(null, 0);
  return opts.join('');
}
function formatFileSize(bytes){
  if(bytes==null || isNaN(bytes)) return '';
  if(bytes<1024) return bytes+' B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1024/1024).toFixed(1)+' MB';
}
// Rende una riga (dell'albero o dell'elenco) una destinazione valida per il
// trascinamento: accetta sia un esercizio (spostato con move_project.php)
// sia un'altra cartella (riparentata con move_folder.php).
function wireFolderDropTarget(rowEl, folderId){
  rowEl.addEventListener('dragover', (e)=>{
    if(e.dataTransfer.types.includes('text/pv4-project') || e.dataTransfer.types.includes('text/pv4-folder') || e.dataTransfer.types.includes('text/pv4-multi')){
      e.preventDefault();
      rowEl.classList.add('dragover');
    }
  });
  rowEl.addEventListener('dragleave', ()=> rowEl.classList.remove('dragover'));
  rowEl.addEventListener('drop', async (e)=>{
    e.preventDefault();
    rowEl.classList.remove('dragover');
    const projId = e.dataTransfer.getData('text/pv4-project');
    const srcFolderId = e.dataTransfer.getData('text/pv4-folder');
    const multi = e.dataTransfer.getData('text/pv4-multi');
    if(multi){ // più elementi trascinati insieme
      let moved = 0, skipped = 0;
      for(const k of JSON.parse(multi)){
        const x = libItemByKey(k); if(!x) continue;
        try{
          if(x.type==='project'){ await apiFetch('move_project.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:x.id, folderId})}); moved++; }
          else if(folder_is_descendant_or_self_client(x.id, folderId)) skipped++;
          else { await apiFetch('move_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:x.id, parentId:folderId})}); moved++; }
        }catch(err){ skipped++; }
      }
      await loadLibraryList();
      showToast(tpl('{n} elementi spostati.', {n: moved}) + (skipped ? ' ' + tpl('{s} non spostati.', {s: skipped}) : ''), !!skipped);
      return;
    }
    if(projId){
      await moveProjectAction(projId, folderId);
    } else if(srcFolderId && srcFolderId !== (folderId||'')){
      try{
        await apiFetch('move_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:srcFolderId, parentId:folderId})});
        loadLibraryList();
      }catch(err){ showToast('Errore nello spostamento della cartella: ' + err.message, true); loadLibraryList(); }
    }
  });
}
function renderFolderTree(){
  const host = document.getElementById('libTree');
  host.innerHTML = '';
  const rootRow = document.createElement('div');
  rootRow.className = 'libtree-row' + (!libInTrash && libCurrentFolderId===null ? ' active' : '');
  rootRow.textContent = '📚 Libreria';
  rootRow.onclick = ()=> navigateToFolder(null);
  rootRow.oncontextmenu = (e)=>{ e.preventDefault(); e.stopPropagation(); showContextMenu(e.clientX, e.clientY, libEmptyAreaContextItems(null)); };
  wireFolderDropTarget(rootRow, null);
  host.appendChild(rootRow);

  function walk(parentId, depth){
    libCacheFolders.filter(f=> (f.parentId||null) === (parentId||null))
      .sort((a,b)=> a.name.localeCompare(b.name))
      .forEach(f=>{
        const row = document.createElement('div');
        row.className = 'libtree-row' + (!libInTrash && libCurrentFolderId===f.id ? ' active' : '');
        row.style.paddingLeft = (8 + depth*14) + 'px';
        row.textContent = '📁 ' + f.name;
        row.title = f.name;
        row.onclick = ()=> navigateToFolder(f.id);
        row.oncontextmenu = (e)=>{ e.preventDefault(); e.stopPropagation(); showContextMenu(e.clientX, e.clientY, libFolderContextItems(f)); };
        row.draggable = true;
        row.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/pv4-folder', f.id); e.stopPropagation(); });
        wireFolderDropTarget(row, f.id);
        host.appendChild(row);
        walk(f.id, depth+1);
      });
  }
  walk(null, 0);
  // Cestino in fondo all'albero
  const tr = document.createElement('div');
  tr.className = 'libtree-row trash-row' + (libInTrash ? ' active' : '');
  tr.textContent = '🗑 ' + translate('Cestino') + (libCacheTrash.length ? ` (${libCacheTrash.length})` : '');
  tr.title = tpl('Esercizi eliminati: restano qui {d} giorni, poi vengono cancellati', {d: libTrashDays});
  tr.onclick = ()=>{ libInTrash = true; libSel = new Set(); if(libSearchQuery){ libSearchQuery=''; document.getElementById('libSearch').value=''; } renderLibraryView(); };
  // trascinare esercizi sul Cestino li elimina
  tr.addEventListener('dragover', e=>{ const ty=[...e.dataTransfer.types]; if(ty.includes('text/pv4-project') || ty.includes('text/pv4-multi')){ e.preventDefault(); tr.classList.add('drop-target'); } });
  tr.addEventListener('dragleave', ()=> tr.classList.remove('drop-target'));
  tr.addEventListener('drop', e=>{ e.preventDefault(); tr.classList.remove('drop-target');
    const multi = e.dataTransfer.getData('text/pv4-multi'), one = e.dataTransfer.getData('text/pv4-project');
    const keys = multi ? JSON.parse(multi) : (one ? ['p:'+one] : []);
    libSel = new Set(keys.filter(k=>k.startsWith('p:'))); libDeleteSelected(false); });
  host.appendChild(tr);
}
function renderLibraryView(){
  renderLibraryViewInner();
  applyI18n(document.getElementById('libraryModal'));
}
function renderLibraryViewInner(){
  if(!currentUser){ // mai mostrare la libreria senza un utente collegato
    ['libTree','libBreadcrumb','libOpenAllWrap'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=''; });
    document.getElementById('libList').innerHTML = `<div class="emptystate">${escapeHTML(translate('Accedi al tuo account per usare la libreria.'))}</div>`;
    return;
  }
  renderFolderTree();
  const host = document.getElementById('libList');
  const crumb = document.getElementById('libBreadcrumb');
  host.innerHTML = ''; host.tabIndex = 0;
  libOrder = [];
  document.getElementById('libToolbar').classList.toggle('in-trash', libInTrash);
  if(libInTrash){ renderTrashView(host, crumb); libFinishView(host); return; }
  host.onclick = (e)=>{ if(e.target===host){ libSel = new Set(); libRefreshSelection(); host.focus({preventScroll:true}); } }; // clic sull'area vuota: nessuna selezione
  if(libSearchQuery.trim()){ renderLibrarySearch(host, crumb); libFinishView(host); return; }

  // breadcrumb: Libreria > cartella > sottocartella...
  crumb.innerHTML = '';
  const rootLink = document.createElement('a'); rootLink.href='#'; rootLink.textContent='📚 Libreria';
  rootLink.onclick = (e)=>{ e.preventDefault(); navigateToFolder(null); };
  crumb.appendChild(rootLink);
  folderPath(libCurrentFolderId).forEach(f=>{
    crumb.appendChild(document.createTextNode(' / '));
    const a = document.createElement('a'); a.href='#'; a.textContent = f.name;
    a.onclick = (e)=>{ e.preventDefault(); navigateToFolder(f.id); };
    crumb.appendChild(a);
  });

  const subFolders = libCacheFolders.filter(f=> (f.parentId||null) === (libCurrentFolderId||null)).sort((a,b)=> a.name.localeCompare(b.name) * (libSort.key==='name' ? libSort.dir : 1));
  const myItemsHere = libSortItems(libCacheItems.filter(it=> it.mine && (it.folderId||null) === (libCurrentFolderId||null)));
  const sharedItems = libCurrentFolderId===null ? libCacheItems.filter(it=>!it.mine) : [];

  const openAllWrap = document.getElementById('libOpenAllWrap');
  openAllWrap.innerHTML = '';
  if(myItemsHere.length){
    const btn = document.createElement('button'); btn.className='btn'; btn.style.cssText='width:auto;margin:0;';
    btn.textContent = tpl('📂 Apri tutta la cartella ({n})', {n: myItemsHere.length});
    btn.title = 'Apre ogni esercizio di questa cartella in una scheda separata';
    btn.onclick = ()=> openFolderAsTabs(myItemsHere);
    openAllWrap.appendChild(btn);
  }

  host.oncontextmenu = (e)=>{
    if(e.target !== host) return; // solo se il clic è sull'area vuota, non su una riga specifica
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, libEmptyAreaContextItems(libCurrentFolderId));
  };

  if(!subFolders.length && !myItemsHere.length && !sharedItems.length){
    host.innerHTML = '<div class="emptystate">Cartella vuota. Trascina qui un esercizio o una cartella, oppure creane una nuova con "Nuova cartella" (o tasto destro).</div>';
    return;
  }

  const head = document.createElement('div'); head.className='libitem-row libitem-head';
  const arrow = k=> libSort.key===k ? (libSort.dir>0 ? ' ▲' : ' ▼') : '';
  head.innerHTML = `<div class="sortable" data-sort="name">${escapeHTML(translate('Nome'))}${arrow('name')}</div><div class="sortable" data-sort="updated">${escapeHTML(translate('Ultima modifica'))}${arrow('updated')}</div><div class="sortable" data-sort="size" style="text-align:right;">${escapeHTML(translate('Dimensione'))}${arrow('size')}</div><div></div>`;
  head.querySelectorAll('.sortable').forEach(h=> h.onclick = ()=> libSetSort(h.dataset.sort));
  host.appendChild(head);

  subFolders.forEach(f=>{
    const row = document.createElement('div'); row.className='libitem-row';
    const fkey = libKeyOf('folder', f.id); row.dataset.key = fkey; libOrder.push(fkey);
    if(libClipboard && libClipboard.mode==='cut' && (libClipboard.items||[]).some(x=>x.type==='folder' && x.id===f.id)) row.classList.add('cut-pending');
    row.onclick = (e)=> libRowClick(e, fkey);
    row.ondblclick = ()=> navigateToFolder(f.id); // doppio clic: apri, come in Esplora Risorse
    const nameDiv = document.createElement('div'); nameDiv.className='libitem-name';
    nameDiv.innerHTML = `📁 ${escapeHTML(f.name)}`;
    row.appendChild(nameDiv);
    row.appendChild(document.createElement('div'));
    row.appendChild(document.createElement('div'));
    const actions = document.createElement('div'); actions.className='libitem-actions';
    const renBtn = document.createElement('button'); renBtn.textContent='✎'; renBtn.title='Rinomina cartella (F2)';
    renBtn.onclick = (e)=>{ e.stopPropagation(); libStartRename(fkey); };
    const delBtn = document.createElement('button'); delBtn.textContent='🗑'; delBtn.title='Elimina cartella';
    delBtn.onclick = (e)=>{ e.stopPropagation(); deleteFolderAction(f); };
    actions.appendChild(renBtn); actions.appendChild(delBtn);
    row.appendChild(actions);
    row.draggable = true;
    row.addEventListener('dragstart', (e)=> libDragStart(e, fkey, ()=> e.dataTransfer.setData('text/pv4-folder', f.id)));
    row.oncontextmenu = (e)=> libRowContextMenu(e, fkey, ()=> libFolderContextItems(f));
    wireFolderDropTarget(row, f.id);
    host.appendChild(row);
  });

  libRenderProjectRow = renderProjectRow;
  function renderProjectRow(it, pathInfo, terms){
    const row = document.createElement('div'); row.className='libitem-row';
    const pkey = libKeyOf('project', it.id); row.dataset.key = pkey; libOrder.push(pkey);
    if(libClipboard && libClipboard.mode==='cut' && (libClipboard.items||[]).some(x=>x.type==='project' && x.id===it.id)) row.classList.add('cut-pending');
    row.onclick = (e)=> libRowClick(e, pkey);
    row.ondblclick = ()=> loadFromLibrary(it.id); // doppio clic: apri
    if(it.mine){
      row.draggable = true;
      row.addEventListener('dragstart', (e)=> libDragStart(e, pkey, ()=> e.dataTransfer.setData('text/pv4-project', it.id)));
    }
    row.oncontextmenu = (e)=> libRowContextMenu(e, pkey, ()=> libProjectContextItems(it));
    const nameDiv = document.createElement('div'); nameDiv.className='libitem-name';
    const ownerNote = (it.mine || it.generic) ? '' : ` <span style="color:var(--ink-dim);">${tpl('· di {name}', {name: escapeHTML(it.ownerName||'?')})}</span>`;
    nameDiv.innerHTML = `📄 ${terms ? libHighlight(it.name, terms) : escapeHTML(it.name)}${libVisibilityBadge(it)}${ownerNote}`;
    if(pathInfo){ // nei risultati della ricerca: dove si trova, cliccabile
      const pth = document.createElement('div'); pth.className = 'libitem-path';
      pth.innerHTML = pathInfo.html; pth.title = translate('Vai alla cartella');
      if(pathInfo.folder!==undefined) pth.onclick = (e)=>{ e.stopPropagation(); navigateToFolder(pathInfo.folder); };
      nameDiv.appendChild(pth);
    }
    row.appendChild(nameDiv);

    const dateDiv = document.createElement('div'); dateDiv.className='libitem-date';
    dateDiv.textContent = it.updated ? new Date(it.updated).toLocaleDateString() : '';
    row.appendChild(dateDiv);

    const sizeDiv = document.createElement('div'); sizeDiv.className='libitem-size';
    sizeDiv.textContent = formatFileSize(it.size);
    row.appendChild(sizeDiv);

    const actions = document.createElement('div'); actions.className='libitem-actions';
    const versBtn = document.createElement('button'); versBtn.textContent='Versioni';
    versBtn.onclick = (e)=>{ e.stopPropagation(); openVersionsModal(it.id); };
    actions.appendChild(versBtn);
    if(it.mine){
      const delBtn = document.createElement('button'); delBtn.textContent='🗑'; delBtn.title='Elimina';
      delBtn.onclick = (e)=>{ e.stopPropagation(); deleteFromLibrary(it.id); };
      actions.appendChild(delBtn);
    }
    row.appendChild(actions);
    host.appendChild(row);
  }

  myItemsHere.forEach(it=> renderProjectRow(it)); // (non passare l'indice come "percorso": comparirebbe "undefined")
  if(sharedItems.length){
    const h = document.createElement('div'); h.style.cssText='margin:10px 0 4px;font-weight:600;font-size:12px;';
    h.textContent = 'Libreria comune (condivisi da tutti gli utenti)';
    host.appendChild(h);
    libSortItems(sharedItems).forEach(it=> renderProjectRow(it));
  }
  libFinishView(host);
}
// barra di stato in fondo all'elenco e selezione ancora valida dopo un aggiornamento
function libFinishView(host){
  libSel = new Set([...libSel].filter(k=> libOrder.includes(k)));
  const st = document.createElement('div'); st.className='lib-status'; st.id='libStatus'; host.appendChild(st);
  libRefreshSelection();
}
// trascinamento: se la riga fa parte di una selezione multipla si trascinano tutti gli elementi selezionati
function libDragStart(e, key, single){
  if(libSel.has(key) && libSel.size > 1){
    const keys = libSelected().filter(x=> x.type==='folder' || x.mine).map(x=> libKeyOf(x.type, x.id));
    e.dataTransfer.setData('text/pv4-multi', JSON.stringify(keys));
  }
  single();
}

/* ---------- ricerca in tutta la libreria ---------- */
let libRenderProjectRow = null;
const libNorm = s=> String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function libHighlight(text, terms){
  const t = String(text), n = libNorm(t), hits = [];
  terms.forEach(w=>{ let p = n.indexOf(w); while(p>=0){ hits.push([p, p+w.length]); p = n.indexOf(w, p+w.length); } });
  if(!hits.length) return escapeHTML(t);
  hits.sort((a,b)=>a[0]-b[0]);
  let out = '', last = 0;
  hits.forEach(([s,e])=>{ if(s<last) return; out += escapeHTML(t.slice(last,s)) + '<mark class="guide-hit">' + escapeHTML(t.slice(s,e)) + '</mark>'; last = e; });
  return out + escapeHTML(t.slice(last));
}
function libPathText(folderId){ return ['📚 ' + translate('Libreria')].concat(folderPath(folderId).map(f=>f.name)).join(' / '); }
function renderLibrarySearch(host, crumb){
  const terms = libNorm(libSearchQuery).split(/\s+/).filter(Boolean);
  const matchAll = hay=> terms.every(w=> hay.includes(w));
  // cartelle
  const folders = libCacheFolders.map(f=>{
    const name = libNorm(f.name), path = libNorm(libPathText(f.parentId||null));
    if(!matchAll(name + ' ' + path)) return null;
    return {f, score: terms.filter(w=>name.includes(w)).length*10};
  }).filter(Boolean).sort((a,b)=> b.score-a.score || a.f.name.localeCompare(b.f.name));
  // esercizi (i miei in tutte le cartelle, e quelli condivisi)
  const projects = libCacheItems.map(it=>{
    const name = libNorm(it.name), path = it.mine ? libNorm(libPathText(it.folderId||null)) : libNorm(translate('Libreria comune')), owner = libNorm(it.ownerName||'');
    if(!matchAll(name + ' ' + path + ' ' + owner)) return null;
    const score = terms.filter(w=>name.includes(w)).length*10 + (name.startsWith(terms[0]) ? 5 : 0);
    return {it, score};
  }).filter(Boolean).sort((a,b)=> b.score-a.score || (b.it.updated||'').localeCompare(a.it.updated||''));
  crumb.innerHTML = '';
  const t = document.createElement('span');
  t.textContent = tpl('Ricerca in tutta la libreria: {n} risultati', {n: folders.length + projects.length});
  crumb.appendChild(t);
  const x = document.createElement('a'); x.href = '#'; x.textContent = '  ✕ ' + translate('Annulla ricerca'); x.style.marginLeft = '10px';
  x.onclick = (e)=>{ e.preventDefault(); libSearchQuery = ''; document.getElementById('libSearch').value = ''; renderLibraryView(); };
  crumb.appendChild(x);
  document.getElementById('libOpenAllWrap').innerHTML = '';
  if(!folders.length && !projects.length){
    host.innerHTML = `<div class="emptystate">${escapeHTML(translate('Nessun esercizio o cartella corrisponde alla ricerca. Prova con meno parole o con parte del nome.'))}</div>`;
    return;
  }
  const head = document.createElement('div'); head.className='libitem-row libitem-head';
  const arrow = k=> libSort.key===k ? (libSort.dir>0 ? ' ▲' : ' ▼') : '';
  head.innerHTML = `<div class="sortable" data-sort="name">${escapeHTML(translate('Nome'))}${arrow('name')}</div><div class="sortable" data-sort="updated">${escapeHTML(translate('Ultima modifica'))}${arrow('updated')}</div><div class="sortable" data-sort="size" style="text-align:right;">${escapeHTML(translate('Dimensione'))}${arrow('size')}</div><div></div>`;
  head.querySelectorAll('.sortable').forEach(h=> h.onclick = ()=> libSetSort(h.dataset.sort));
  host.appendChild(head);
  folders.forEach(({f})=>{
    const row = document.createElement('div'); row.className='libitem-row';
    const nameDiv = document.createElement('div'); nameDiv.className='libitem-name';
    nameDiv.innerHTML = `📁 ${libHighlight(f.name, terms)}<div class="libitem-path">${escapeHTML(libPathText(f.parentId||null))}</div>`;
    nameDiv.onclick = ()=> navigateToFolder(f.id);
    row.appendChild(nameDiv); row.appendChild(document.createElement('div')); row.appendChild(document.createElement('div')); row.appendChild(document.createElement('div'));
    row.oncontextmenu = (e)=>{ e.preventDefault(); e.stopPropagation(); showContextMenu(e.clientX, e.clientY, libFolderContextItems(f)); };
    host.appendChild(row);
  });
  projects.forEach(({it})=>{
    const info = it.mine ? {html: escapeHTML(libPathText(it.folderId||null)), folder: it.folderId||null}
                         : {html: escapeHTML(translate('Libreria comune')) + (it.ownerName ? ' · ' + escapeHTML(tpl('di {name}', {name:it.ownerName})) : ''), folder: null};
    libRenderProjectRow(it, info, terms);
  });
}

document.getElementById('libSearch').addEventListener('input', e=>{ libSearchQuery = e.target.value; renderLibraryView(); });
document.getElementById('libSearch').addEventListener('keydown', e=>{
  e.stopPropagation(); // i tasti della ricerca non attivano gli strumenti di disegno
  if(e.key==='Escape'){ e.preventDefault(); libSearchQuery = ''; e.target.value = ''; renderLibraryView(); }
});
// barra dei comandi della libreria (anche "Nuova cartella")
document.getElementById('libToolbar').addEventListener('click', e=>{ const b = e.target.closest('button[data-cmd]'); if(b && !b.disabled) libToolbarCmd(b.dataset.cmd); });
document.getElementById('libMoveClose').onclick = ()=> document.getElementById('libMoveModal').classList.remove('open');
document.getElementById('libMoveCancel').onclick = ()=> document.getElementById('libMoveModal').classList.remove('open');
setupOverlayClickClose(document.getElementById('libMoveModal'), ()=> document.getElementById('libMoveModal').classList.remove('open'));
document.getElementById('libMoveOk').onclick = libMoveApply;
document.getElementById('libMoveNewFolder').onclick = async ()=>{
  const name = await showPrompt('Nome della nuova cartella'); if(!name) return;
  try{
    const parent = libMove.target===undefined ? null : libMove.target;
    const r = await apiFetch('create_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, parentId: parent})});
    await loadLibraryList(); libMove.target = r.folder ? r.folder.id : parent; renderLibMoveTree();
  }catch(err){ showToast('Errore nella creazione della cartella: ' + err.message, true); }
};
async function renameFolderAction(f){
  const name = await showPrompt('Nuovo nome della cartella', f.name);
  if(!name || name===f.name) return;
  try{
    await apiFetch('rename_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:f.id, name})});
    loadLibraryList();
  }catch(err){ showToast('Errore nel rinominare la cartella: ' + err.message, true); }
}
async function deleteFolderAction(f){
  const ok = await showConfirm(tpl('Eliminare la cartella "{name}"? Il suo contenuto (sottocartelle e esercizi) verrà spostato nella cartella superiore, non verrà cancellato.', {name: f.name}), 'Elimina cartella');
  if(!ok) return;
  try{
    await apiFetch('delete_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:f.id})});
    loadLibraryList();
  }catch(err){ showToast('Errore nell\'eliminazione della cartella: ' + err.message, true); }
}
async function moveProjectAction(id, folderId){
  try{
    await apiFetch('move_project.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, folderId})});
    loadLibraryList();
  }catch(err){ showToast('Errore nello spostamento: ' + err.message, true); loadLibraryList(); }
}
async function renameProjectAction(it){
  const name = await showPrompt('Nuovo nome del esercizio', it.name);
  if(!name || name===it.name) return;
  try{
    await apiFetch('rename_project.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:it.id, name})});
    loadLibraryList();
  }catch(err){ showToast('Errore nel rinominare: ' + err.message, true); }
}


/* ---------- Cestino ---------- */
function renderTrashView(host, crumb){
  crumb.innerHTML = '';
  crumb.appendChild(document.createTextNode('🗑 ' + translate('Cestino') + ' — ' + tpl('gli elementi restano qui {d} giorni, poi vengono cancellati', {d: libTrashDays})));
  document.getElementById('libOpenAllWrap').innerHTML = '';
  host.onclick = (e)=>{ if(e.target===host){ libSel = new Set(); libRefreshSelection(); } };
  host.oncontextmenu = (e)=>{ if(e.target!==host) return; e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [{label:'🗑 Svuota Cestino', disabled: !libCacheTrash.length, action:()=> libEmptyTrash()}]); };
  if(!libCacheTrash.length){ host.innerHTML = `<div class="emptystate">${escapeHTML(translate('Il Cestino è vuoto.'))}</div>`; return; }
  const head = document.createElement('div'); head.className='libitem-row libitem-head';
  head.innerHTML = `<div>${escapeHTML(translate('Nome'))}</div><div>${escapeHTML(translate('Eliminato il'))}</div><div>${escapeHTML(translate('Posizione originale'))}</div><div></div>`;
  host.appendChild(head);
  libCacheTrash.slice().sort((a,b)=> String(b.trashedAt||'').localeCompare(String(a.trashedAt||''))).forEach(it=>{
    const key = 't:' + it.id; libOrder.push(key);
    const row = document.createElement('div'); row.className='libitem-row'; row.dataset.key = key;
    row.onclick = (e)=> libRowClick(e, key);
    row.ondblclick = ()=>{ libSel = new Set([key]); libRestoreSelected(); };
    row.oncontextmenu = (e)=> libRowContextMenu(e, key, ()=> [
      {label:'↺ Ripristina', action:()=> libRestoreSelected()},
      {label:'✖ Elimina definitivamente', action:()=> libPurgeSelected()},
    ]);
    const n = document.createElement('div'); n.className='libitem-name'; n.textContent = '📄 ' + it.name;
    const d = document.createElement('div'); d.className='libitem-date'; d.textContent = it.trashedAt ? new Date(it.trashedAt).toLocaleDateString() : '';
    const w = document.createElement('div'); w.className='libitem-size'; w.style.textAlign='left';
    const from = it.trashedFrom!==undefined ? it.trashedFrom : it.folderId;
    w.textContent = libPathText(from && libCacheFolders.some(f=>f.id===from) ? from : null);
    const a = document.createElement('div'); a.className='libitem-actions';
    const rb = document.createElement('button'); rb.textContent='↺'; rb.title = translate('Ripristina');
    rb.onclick = (e)=>{ e.stopPropagation(); libSel = new Set([key]); libRestoreSelected(); };
    a.appendChild(rb);
    row.append(n, d, w, a); host.appendChild(row);
  });
}
async function libRestoreSelected(){
  const ids = [...libSel].filter(k=>k.startsWith('t:')).map(k=>k.slice(2)); if(!ids.length) return;
  try{
    await apiFetch('restore.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ids})});
    libSel = new Set(); await loadLibraryList();
    showToast(ids.length===1 ? translate('Esercizio ripristinato nella sua cartella.') : tpl('{n} esercizi ripristinati nelle loro cartelle.', {n: ids.length}), false);
  }catch(err){ showToast('Errore nel ripristino: ' + err.message, true); }
}
async function libPurgeIds(ids, confirmMsg){
  if(!ids.length) return;
  if(!(await showConfirm(confirmMsg, 'Elimina definitivamente'))) return;
  let ok = 0;
  for(const id of ids){ try{ await apiFetch('delete.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, permanent:true})}); ok++; if(state.libraryId===id) state.libraryId = null; }catch(err){ showToast('Errore: ' + err.message, true); } }
  libSel = new Set(); await loadLibraryList();
  showToast(tpl(ok===1 ? '{n} esercizio eliminato definitivamente.' : '{n} esercizi eliminati definitivamente.', {n: ok}), false);
}
function libPurgeSelected(){
  const ids = [...libSel].filter(k=>k.startsWith('t:')).map(k=>k.slice(2));
  return libPurgeIds(ids, ids.length===1 ? tpl('Eliminare definitivamente «{name}»? Non si potrà più recuperare.', {name: (libCacheTrash.find(x=>x.id===ids[0])||{}).name||''})
                                         : tpl('Eliminare definitivamente {n} esercizi? Non si potranno più recuperare.', {n: ids.length}));
}
function libEmptyTrash(){
  return libPurgeIds(libCacheTrash.map(x=>x.id), tpl('Svuotare il Cestino? {n} esercizi verranno eliminati definitivamente.', {n: libCacheTrash.length}));
}
/* ---------- barra dei comandi ---------- */
function libUpdateToolbar(){
  const tb = document.getElementById('libToolbar'); if(!tb) return;
  const sel = libSelected(), mine = sel.filter(x=>x.mine), one = sel.length===1;
  const en = (cmd, on)=>{ const b = tb.querySelector(`[data-cmd="${cmd}"]`); if(b) b.disabled = !on; };
  en('up', !libInTrash && libCurrentFolderId!=null);
  en('newfolder', !libInTrash);
  en('open', sel.length>0 && sel.every(x=>x.type!=='trash'));
  en('rename', one && mine.length===1 && sel[0].type!=='trash');
  en('duplicate', mine.length>0);
  en('delete', mine.length>0);
  en('cut', mine.length>0);
  en('copy', sel.length>0);
  en('paste', !!libClipboard && !libInTrash);
  en('moveto', mine.length>0);
  en('copyto', sel.length>0);
  en('props', one);
  const trashSel = [...libSel].some(k=>k.startsWith('t:'));
  en('restore', trashSel); en('purge', trashSel); en('emptytrash', libCacheTrash.length>0);
}
function libToolbarCmd(cmd){
  switch(cmd){
    case 'up': { const f = libCacheFolders.find(x=>x.id===libCurrentFolderId); navigateToFolder(f ? (f.parentId||null) : null); break; }
    case 'newfolder': libNewFolderHere(); break;
    case 'open': libOpenSelected(); break;
    case 'rename': if(libSel.size===1) libStartRename([...libSel][0]); break;
    case 'duplicate': libDuplicateSelected(); break;
    case 'delete': libDeleteSelected(false); break;
    case 'cut': libClipSelected('cut'); break;
    case 'copy': libClipSelected('copy'); break;
    case 'paste': pasteClipboardInto(libCurrentFolderId); break;
    case 'moveto': openLibMoveDialog('move'); break;
    case 'copyto': openLibMoveDialog('copy'); break;
    case 'props': if(libSel.size===1) libShowProperties([...libSel][0]); break;
    case 'restore': libRestoreSelected(); break;
    case 'purge': libPurgeSelected(); break;
    case 'emptytrash': libEmptyTrash(); break;
  }
}
async function libNewFolderHere(){
  const name = await showPrompt('Nome della nuova cartella');
  if(!name) return;
  try{
    await apiFetch('create_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, parentId:libCurrentFolderId})});
    await loadLibraryList();
  }catch(err){ showToast('Errore nella creazione della cartella: ' + err.message, true); }
}
/* ---------- Sposta in… / Copia in… ---------- */
const libMove = { mode:'move', items:[], target:null };
function openLibMoveDialog(mode){
  const sel = libSelected().filter(x=> x.type!=='trash' && (mode==='copy' || x.mine));
  if(!sel.length) return;
  libMove.mode = mode; libMove.items = sel.map(x=>({type:x.type, id:x.id, name:x.name})); libMove.target = undefined;
  document.getElementById('libMoveTitle').textContent = translate(mode==='move' ? 'Sposta in…' : 'Copia in…');
  document.getElementById('libMoveOk').textContent = translate(mode==='move' ? 'Sposta' : 'Copia');
  document.getElementById('libMoveInfo').textContent = sel.length===1 ? tpl('«{name}»: scegli la cartella di destinazione.', {name: sel[0].name}) : tpl('{n} elementi: scegli la cartella di destinazione.', {n: sel.length});
  renderLibMoveTree();
  openModal('libMoveModal');
}
function renderLibMoveTree(){
  const host = document.getElementById('libMoveTree'); host.innerHTML = '';
  const movingFolders = libMove.items.filter(x=>x.type==='folder').map(x=>x.id);
  const blocked = fid=> libMove.mode==='move' && movingFolders.some(m=> folder_is_descendant_or_self_client(m, fid));
  const add = (fid, label, depth)=>{
    const r = document.createElement('div'); r.className='mv-row'; r.style.paddingLeft = (8 + depth*16) + 'px'; r.textContent = label;
    if(fid!==null && blocked(fid)){ r.classList.add('disabled'); r.title = translate('Non si può spostare una cartella dentro se stessa'); }
    else r.onclick = ()=>{ libMove.target = fid; renderLibMoveTree(); };
    if(libMove.target===fid) r.classList.add('sel');
    r.ondblclick = ()=>{ if(!r.classList.contains('disabled')){ libMove.target = fid; libMoveApply(); } };
    host.appendChild(r);
  };
  add(null, '📚 ' + translate('Libreria (cartella principale)'), 0);
  (function walk(pid, depth){ libCacheFolders.filter(f=>(f.parentId||null)===(pid||null)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(f=>{ add(f.id, '📁 ' + f.name, depth); walk(f.id, depth+1); }); })(null, 1);
  document.getElementById('libMoveOk').disabled = libMove.target===undefined;
}
async function libMoveApply(){
  if(libMove.target===undefined) return;
  document.getElementById('libMoveModal').classList.remove('open');
  await libTransfer(libMove.items, libMove.mode==='move' ? 'cut' : 'copy', libMove.target);
}

/* ============================================================
   APPUNTI DELLA LIBRERIA — copia/taglia/incolla di esercizi e
   cartelle, come nel tasto destro di Esplora Risorse.
============================================================ */
function setClipboard(mode, type, id, name){ setClipboardItems(mode, [{type, id, name}]); }
function setClipboardItems(mode, items){
  if(!items.length) return;
  libClipboard = {mode, items};
  showToast(items.length===1 ? translate(mode==='copy' ? 'Copiato: ' : 'Tagliato: ') + items[0].name
                             : tpl(mode==='copy' ? '{n} elementi copiati.' : '{n} elementi tagliati.', {n: items.length}), false);
  if(document.getElementById('libraryModal').classList.contains('open')) renderLibraryView(); // i tagliati appaiono attenuati
}
async function pasteClipboardInto(targetFolderId){
  if(!libClipboard) return;
  const { mode } = libClipboard, items = libClipboard.items || [{type:libClipboard.type, id:libClipboard.id, name:libClipboard.name}];
  const ok = await libTransfer(items, mode, targetFolderId);
  if(ok && mode==='cut'){ libClipboard = null; renderLibraryView(); }
}
// sposta ('cut') o copia ('copy') elementi in una cartella: usato da Incolla, Sposta in…, Copia in…
async function libTransfer(items, mode, targetFolderId){
  let done = 0, skipped = 0;
  try{
    for(const {type, id} of items){
      if(type==='project'){
        if(mode==='cut') await apiFetch('move_project.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, folderId:targetFolderId})});
        else await duplicateProjectInto(id, targetFolderId);
        done++;
      } else if(type==='folder'){
        if(folder_is_descendant_or_self_client(id, targetFolderId)){ skipped++; continue; }
        if(mode==='cut') await apiFetch('move_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, parentId:targetFolderId})});
        else await deepCopyFolder(id, targetFolderId);
        done++;
      }
      if(mode==='copy') await loadLibraryList(); // i nomi dei duplicati tengono conto dei precedenti
    }
    await loadLibraryList();
    showToast(skipped ? tpl('{n} elementi incollati; {s} cartelle non spostate: non si può mettere una cartella dentro se stessa.', {n:done, s:skipped}) : translate('Operazione completata.'), !!skipped);
    return true;
  }catch(err){ showToast('Errore: ' + err.message, true); await loadLibraryList(); return false; }
}
// Replica lato client lo stesso controllo del server, per un errore subito
// chiaro senza dover attendere la risposta dell'API in questo caso specifico.
function folder_is_descendant_or_self_client(candidateId, ancestorId){
  if(candidateId === ancestorId) return true;
  const byId = {}; libCacheFolders.forEach(f=> byId[f.id]=f);
  let cur = ancestorId, guard = 0;
  while(cur!=null && byId[cur] && guard++<200){
    const parent = byId[cur].parentId || null;
    if(parent === candidateId) return true;
    cur = parent;
  }
  return false;
}
function uniqueNameIn(items, baseName){ // "Nome", "Nome - copia", "Nome - copia 2"… come in Esplora Risorse
  const names = new Set(items.map(it=>it.name.trim().toLowerCase()));
  if(!names.has(baseName.trim().toLowerCase())) return baseName;
  const root = baseName.replace(/ - copia( \d+)?$/i, '');
  let cand = root + ' - copia', n = 2;
  while(names.has(cand.toLowerCase())) cand = root + ' - copia ' + (n++);
  return cand;
}
async function duplicateProjectInto(id, targetFolderId){
  const data = await apiFetch('load.php?id=' + encodeURIComponent(id), {method:'GET'});
  const proj = data.project || {};
  const siblings = libCacheItems.filter(it=> it.mine && (it.folderId||null)===(targetFolderId||null));
  const newName = uniqueNameIn(siblings, proj.name || 'Esercizio');
  await apiFetch('save.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
    name:newName, shared:false, folderId:targetFolderId, data: proj.data || null
  })});
}
async function deepCopyFolder(folderId, targetParentId){
  const orig = libCacheFolders.find(f=>f.id===folderId);
  if(!orig) return;
  const siblingFolders = libCacheFolders.filter(f=>(f.parentId||null)===(targetParentId||null));
  const newName = uniqueNameIn(siblingFolders, orig.name);
  const created = await apiFetch('create_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:newName, parentId:targetParentId})});
  const newFolderId = created.folder.id;

  const projectsHere = libCacheItems.filter(it=> it.mine && (it.folderId||null)===folderId);
  for(const it of projectsHere){
    await duplicateProjectInto(it.id, newFolderId);
  }
  const subFolders = libCacheFolders.filter(f=>(f.parentId||null)===folderId);
  for(const sf of subFolders){
    await deepCopyFolder(sf.id, newFolderId);
  }
}

/* ============================================================
   LIBRERIA COME ESPLORA RISORSE — selezione (clic, Ctrl+clic, Shift+clic,
   Ctrl+A), doppio clic / Invio per aprire, rinomina sulla riga (F2),
   Canc, Ctrl+C / X / V, Ctrl+D, Backspace, frecce, ordinamento per colonna,
   operazioni su più elementi, Proprietà, Scarica, Apri in una nuova scheda.
============================================================ */
let libSel = new Set(), libAnchor = null, libOrder = [];
let libSort = { key:'updated', dir:-1 };
try{ Object.assign(libSort, JSON.parse(localStorage.getItem('pv4-libsort') || '{}')); }catch(e){}
const libKeyOf = (type, id)=> (type==='folder' ? 'f:' : 'p:') + id;
function libItemByKey(key){
  if(!key) return null;
  const id = key.slice(2);
  if(key[0]==='f'){ const f = libCacheFolders.find(x=>x.id===id); return f ? {type:'folder', id, obj:f, name:f.name, mine:true} : null; }
  if(key[0]==='t'){ const t = libCacheTrash.find(x=>x.id===id); return t ? {type:'trash', id, obj:t, name:t.name, mine:true} : null; }
  const it = libCacheItems.find(x=>x.id===id); return it ? {type:'project', id, obj:it, name:it.name, mine:!!it.mine} : null;
}
function libSelected(){ return [...libSel].map(libItemByKey).filter(Boolean); }
function libRefreshSelection(){
  libUpdateToolbar();
  document.querySelectorAll('#libList .libitem-row[data-key]').forEach(r=> r.classList.toggle('selected', libSel.has(r.dataset.key)));
  const st = document.getElementById('libStatus');
  if(st){ const n = libOrder.length, s = libSel.size;
    st.textContent = tpl(n===1 ? '{n} elemento' : '{n} elementi', {n}) + (s ? ' · ' + tpl(s===1 ? '{s} selezionato' : '{s} selezionati', {s}) : '')
      + (libClipboard ? ' · ' + tpl(libClipboard.mode==='copy' ? 'negli appunti: {c} da copiare' : 'negli appunti: {c} da spostare', {c:(libClipboard.items||[1]).length}) : ''); }
}
function libRowClick(e, key){
  if(e.shiftKey && libAnchor && libOrder.includes(libAnchor)){
    const a = libOrder.indexOf(libAnchor), b = libOrder.indexOf(key);
    if(!(e.ctrlKey || e.metaKey)) libSel = new Set();
    libOrder.slice(Math.min(a,b), Math.max(a,b)+1).forEach(k=> libSel.add(k));
  } else if(e.ctrlKey || e.metaKey){
    if(libSel.has(key)) libSel.delete(key); else libSel.add(key);
    libAnchor = key;
  } else { libSel = new Set([key]); libAnchor = key; }
  libRefreshSelection();
  document.getElementById('libList').focus({preventScroll:true});
}
function libOpenKey(key){
  const x = libItemByKey(key); if(!x) return;
  if(x.type==='folder') navigateToFolder(x.id); else loadFromLibrary(x.id);
}
function libOpenSelected(){
  const sel = libSelected(); if(!sel.length) return;
  if(sel.length===1){ libOpenKey(libKeyOf(sel[0].type, sel[0].id)); return; }
  const projs = sel.filter(x=>x.type==='project').map(x=>x.obj);
  if(projs.length) openFolderAsTabs(projs);
}
async function libOpenInNewTab(id){ await loadFromLibrary(id, {newTab:true}); }
// rinomina direttamente sulla riga (F2 o menu)
function libStartRename(key){
  const x = libItemByKey(key); if(!x || !x.mine) return;
  const row = document.querySelector(`#libList .libitem-row[data-key="${key}"]`); if(!row) return;
  const nameDiv = row.querySelector('.libitem-name'); if(!nameDiv) return;
  const inp = document.createElement('input'); inp.type='text'; inp.className='lib-rename'; inp.value = x.name;
  nameDiv.innerHTML = ''; nameDiv.appendChild(inp); inp.focus(); inp.select();
  let done = false;
  const finish = async (commit)=>{
    if(done) return; done = true;
    const name = inp.value.trim();
    if(!commit || !name || name===x.name){ renderLibraryView(); return; }
    try{
      await apiFetch(x.type==='folder' ? 'rename_folder.php' : 'rename_project.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:x.id, name})});
      if(x.type==='project') renameTabsOfLibraryItem(x.id, name);
      await loadLibraryList();
    }catch(err){ showToast('Errore nel rinominare: ' + err.message, true); renderLibraryView(); }
  };
  inp.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); finish(true); } if(e.key==='Escape'){ e.preventDefault(); finish(false); } });
  inp.addEventListener('blur', ()=> finish(true));
  inp.addEventListener('click', e=> e.stopPropagation());
  inp.addEventListener('dblclick', e=> e.stopPropagation());
}
async function libDeleteSelected(permanent){
  if(libInTrash){ return libPurgeSelected(); }
  const sel = libSelected(), mine = sel.filter(x=>x.mine && x.type!=='trash'), others = sel.length - mine.length;
  if(!mine.length){ if(others) showToast('Puoi eliminare solo i tuoi esercizi e le tue cartelle.', true); return; }
  const projs = mine.filter(x=>x.type==='project'), folders = mine.filter(x=>x.type==='folder');
  if(permanent && projs.length){ // Shift+Canc: eliminazione definitiva, come in Esplora file
    await libPurgeIds(projs.map(x=>x.id), projs.length===1 ? tpl('Eliminare definitivamente «{name}»? Non passerà dal Cestino e non si potrà recuperare.', {name: projs[0].name})
                                                           : tpl('Eliminare definitivamente {n} esercizi? Non passeranno dal Cestino e non si potranno recuperare.', {n: projs.length}));
  } else {
    let n = 0;
    for(const x of projs){ try{ await apiFetch('delete.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:x.id})}); if(state.libraryId===x.id) state.libraryId = null; n++; }catch(err){ showToast('Errore nell\'eliminazione: ' + err.message, true); } }
    if(n) showToast(n===1 ? tpl('«{name}» spostato nel Cestino.', {name: projs[0].name}) : tpl('{n} esercizi spostati nel Cestino.', {n}), false);
  }
  if(folders.length){ // le cartelle non vanno nel Cestino: si tolgono e il contenuto sale di un livello (niente si perde)
    const ok = await showConfirm(folders.length===1 ? tpl('Eliminare la cartella «{name}»? Il suo contenuto (sottocartelle e esercizi) verrà spostato nella cartella superiore, non verrà cancellato.', {name: folders[0].name})
                                                    : tpl('Eliminare {n} cartelle? Il loro contenuto verrà spostato nella cartella superiore, non verrà cancellato.', {n: folders.length}), 'Elimina');
    if(ok) for(const f of folders){ try{ await apiFetch('delete_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:f.id})}); }catch(err){ showToast('Errore: ' + err.message, true); } }
  }
  libSel = new Set();
  await loadLibraryList();
  if(others) showToast(tpl('{n} elementi di altri utenti non sono stati eliminati.', {n: others}), true);
}
async function libDuplicateSelected(){
  const sel = libSelected().filter(x=> x.type==='folder' || x.mine);
  if(!sel.length) return;
  try{
    for(const x of sel){
      if(x.type==='project') await duplicateProjectInto(x.id, x.obj.folderId || null);
      else await deepCopyFolder(x.id, x.obj.parentId || null);
      await loadLibraryList(); // i nomi dei duplicati successivi tengono conto dei precedenti
    }
    showToast(sel.length===1 ? tpl('Duplicato: «{name}».', {name: sel[0].name}) : tpl('{n} elementi duplicati.', {n: sel.length}), false);
  }catch(err){ showToast('Errore: ' + err.message, true); await loadLibraryList(); }
}
function libClipSelected(mode){
  const sel = libSelected().filter(x=> x.type==='folder' || x.mine || mode==='copy');
  setClipboardItems(mode, sel.map(x=>({type:x.type, id:x.id, name:x.name})));
}
async function libSetSharedSelected(shared){
  const projs = libSelected().filter(x=>x.type==='project' && x.mine && !x.obj.generic);
  for(const x of projs){ try{ await apiFetch('set_shared.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:x.id, shared})}); }catch(e){} }
  await loadLibraryList();
  showToast(tpl(shared ? '{n} esercizi resi pubblici.' : '{n} esercizi resi privati.', {n: projs.length}), false);
}
async function libDownloadProject(id){
  try{
    const data = await apiFetch('load.php?id=' + encodeURIComponent(id), {method:'GET'});
    const proj = data.project || {};
    const blob = new Blob([JSON.stringify(proj)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (proj.name || 'esercizio').replace(/[\\/:*?"<>|]+/g, '_') + '.json';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }catch(err){ showToast('Errore nello scaricamento: ' + err.message, true); }
}
function libFolderStats(folderId){
  let projects = 0, folders = 0, size = 0;
  const walk = fid=>{
    libCacheItems.filter(it=> it.mine && (it.folderId||null)===fid).forEach(it=>{ projects++; size += it.size||0; });
    libCacheFolders.filter(f=> (f.parentId||null)===fid).forEach(f=>{ folders++; walk(f.id); });
  };
  walk(folderId);
  return {projects, folders, size};
}
async function libShowProperties(key){
  const x = libItemByKey(key); if(!x) return;
  const rows = [];
  const dt = v=> v ? new Date(v).toLocaleString(currentLang==='zh'?'zh-CN':currentLang) : '—';
  if(x.type==='folder'){
    const st = libFolderStats(x.id);
    rows.push(['Nome', x.name], ['Tipo', translate('Cartella')], ['Posizione', libPathText(x.obj.parentId||null)],
      ['Contenuto', tpl('{p} esercizi, {f} sottocartelle', {p: st.projects, f: st.folders})], ['Dimensione', formatFileSize(st.size)]);
  } else {
    const it = x.obj;
    rows.push(['Nome', it.name], ['Tipo', translate('Esercizio VolleyProW4')], ['Posizione', it.mine ? libPathText(it.folderId||null) : translate('Libreria comune')],
      ['Dimensione', formatFileSize(it.size)], ['Creato', dt(it.created)], ['Ultima modifica', dt(it.updated)],
      ['Visibilità', it.generic ? translate('generico (sempre pubblico)') : (it.shared ? translate('pubblico') : translate('privato'))]);
    if(!it.mine) rows.push(['Proprietario', it.ownerName || '—']);
    try{
      const data = await apiFetch('load.php?id=' + encodeURIComponent(it.id), {method:'GET'});
      const pj = data.project || {};
      const d = pj.data || {};
      rows.push(['Oggetti', String((d.objects||[]).length)], ['Frecce', String((d.arrows||[]).length)], ['Step', String((d.exerciseSteps||[]).length)]);
      if(d.note || d.descrizione) rows.push(['Descrizione', d.note || d.descrizione]);
    }catch(e){}
  }
  document.getElementById('libPropsTitle').textContent = tpl('Proprietà di «{name}»', {name: x.name});
  document.getElementById('libPropsTable').innerHTML = rows.map(([k,v])=> `<tr><td style="color:var(--ink-dim);white-space:nowrap;">${escapeHTML(translate(k))}</td><td style="white-space:normal;">${escapeHTML(String(v))}</td></tr>`).join('');
  openModal('libPropsModal');
}
function libMultiContextItems(){
  const sel = libSelected(), projs = sel.filter(x=>x.type==='project'), mineP = projs.filter(x=>x.mine && !x.obj.generic);
  return [
    ...(projs.length ? [{label: tpl('📂 Apri in {n} schede', {n: projs.length}), action:()=> openFolderAsTabs(projs.map(x=>x.obj))}] : []),
    'sep',
    {label:'✂ Taglia (Ctrl+X)', action:()=> libClipSelected('cut')},
    {label:'📋 Copia (Ctrl+C)', action:()=> libClipSelected('copy')},
    {label:'⧉ Duplica (Ctrl+D)', action:()=> libDuplicateSelected()},
    ...(mineP.length ? ['sep', {label:'🌐 Rendi pubblici', action:()=> libSetSharedSelected(true)}, {label:'🔒 Rendi privati', action:()=> libSetSharedSelected(false)}] : []),
    'sep',
    {label:'➜ Sposta in…', action:()=> openLibMoveDialog('move')},
    {label:'⇉ Copia in…', action:()=> openLibMoveDialog('copy')},
    'sep',
    {label: tpl('🗑 Sposta {n} elementi nel Cestino (Canc)', {n: sel.length}), action:()=> libDeleteSelected(false)},
  ];
}
function libRowContextMenu(e, key, singleItemsFn){
  e.preventDefault(); e.stopPropagation();
  if(!libSel.has(key)){ libSel = new Set([key]); libAnchor = key; libRefreshSelection(); }
  showContextMenu(e.clientX, e.clientY, libSel.size > 1 ? libMultiContextItems() : singleItemsFn());
}
function libMoveSelection(dir, extend){
  if(!libOrder.length) return;
  const cur = libAnchor && libOrder.includes(libAnchor) ? libOrder.indexOf(libAnchor) : (dir>0 ? -1 : libOrder.length);
  const next = Math.max(0, Math.min(libOrder.length-1, cur + dir)), key = libOrder[next];
  if(extend){ libSel.add(key); } else libSel = new Set([key]);
  libAnchor = key; libRefreshSelection();
  const row = document.querySelector(`#libList .libitem-row[data-key="${key}"]`); if(row) row.scrollIntoView({block:'nearest'});
}
// tastiera della libreria (solo con la finestra aperta e senza scrivere in un campo)
window.addEventListener('keydown', e=>{
  const modal = document.getElementById('libraryModal');
  if(!modal || !modal.classList.contains('open')) return;
  if(document.querySelector('.modal-overlay.open:not(#libraryModal)')) return; // un'altra finestra sopra (conferma, proprietà…)
  const t = e.target; if(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.tagName==='SELECT' || t.isContentEditable)) return;
  const k = e.key, ctrl = e.ctrlKey || e.metaKey;
  let handled = true;
  if(ctrl && k.toLowerCase()==='a'){ libSel = new Set(libOrder); libRefreshSelection(); }
  else if(ctrl && k.toLowerCase()==='c'){ if(!libInTrash) libClipSelected('copy'); }
  else if(ctrl && k.toLowerCase()==='x'){ if(!libInTrash) libClipSelected('cut'); }
  else if(ctrl && k.toLowerCase()==='v'){ if(!libInTrash) pasteClipboardInto(libCurrentFolderId); }
  else if(ctrl && k.toLowerCase()==='d'){ if(!libInTrash) libDuplicateSelected(); }
  else if(k==='Delete'){ libDeleteSelected(e.shiftKey); }            // Canc: Cestino · Shift+Canc: definitivo
  else if(ctrl && e.shiftKey && k.toLowerCase()==='n'){ if(!libInTrash) libNewFolderHere(); }
  else if(k==='F5'){ loadLibraryList(); }
  else if(k==='F2'){ if(libSel.size===1 && !libInTrash) libStartRename([...libSel][0]); }
  else if(k==='Enter'){ if(libInTrash) libRestoreSelected(); else libOpenSelected(); }
  else if(k==='Backspace' || (e.altKey && k==='ArrowUp')){ if(libCurrentFolderId!=null){ const f = libCacheFolders.find(x=>x.id===libCurrentFolderId); navigateToFolder(f ? (f.parentId||null) : null); } }
  else if(k==='ArrowDown'){ libMoveSelection(1, e.shiftKey); }
  else if(k==='ArrowUp'){ libMoveSelection(-1, e.shiftKey); }
  else if(k==='Escape' && libSel.size){ libSel = new Set(); libRefreshSelection(); }
  else handled = false;
  if(handled){ e.preventDefault(); e.stopPropagation(); }
}, true);
document.getElementById('libPropsClose').onclick = ()=> document.getElementById('libPropsModal').classList.remove('open');
setupOverlayClickClose(document.getElementById('libPropsModal'), ()=> document.getElementById('libPropsModal').classList.remove('open'));
function libSortItems(list){
  const k = libSort.key, d = libSort.dir;
  return list.slice().sort((a,b)=>{
    const va = k==='name' ? (a.name||'').toLowerCase() : k==='size' ? (a.size||0) : (a.updated||''), vb = k==='name' ? (b.name||'').toLowerCase() : k==='size' ? (b.size||0) : (b.updated||'');
    return (typeof va==='number' ? va-vb : String(va).localeCompare(String(vb))) * d;
  });
}
function libSetSort(key){
  if(libSort.key===key) libSort.dir = -libSort.dir; else { libSort.key = key; libSort.dir = key==='name' ? 1 : -1; }
  try{ localStorage.setItem('pv4-libsort', JSON.stringify(libSort)); }catch(e){}
  renderLibraryView();
}

function libFolderContextItems(f){
  const key = libKeyOf('folder', f.id);
  return [
    {label:'📂 Apri (Invio)', action:()=> navigateToFolder(f.id)},
    {label:'📁+ Nuova cartella qui', action: async ()=>{
      const name = await showPrompt('Nome della nuova cartella');
      if(!name) return;
      try{
        await apiFetch('create_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, parentId:f.id})});
        loadLibraryList();
      }catch(err){ showToast('Errore nella creazione della cartella: ' + err.message, true); }
    }},
    'sep',
    {label:'✂ Taglia (Ctrl+X)', action:()=> setClipboard('cut','folder', f.id, f.name)},
    {label:'📋 Copia (Ctrl+C)', action:()=> setClipboard('copy','folder', f.id, f.name)},
    {label:'📌 Incolla qui', disabled:!libClipboard, action:()=> pasteClipboardInto(f.id)},
    {label:'⧉ Duplica (Ctrl+D)', action:()=> libDuplicateSelected()},
    'sep',
    {label:'➜ Sposta in…', action:()=>{ libSel = new Set([key]); openLibMoveDialog('move'); }},
    {label:'⇉ Copia in…', action:()=>{ libSel = new Set([key]); openLibMoveDialog('copy'); }},
    {label:'✎ Rinomina (F2)', action:()=> libStartRename(key)},
    {label:'ℹ Proprietà', action:()=> libShowProperties(key)},
    'sep',
    {label:'🗑 Elimina (Canc)', action:()=> deleteFolderAction(f)},
  ];
}
function libProjectContextItems(it){
  const key = libKeyOf('project', it.id);
  const items = [
    {label:'📂 Apri (Invio)', action:()=> loadFromLibrary(it.id)},
    {label:'🗂 Apri in una nuova scheda', action:()=> libOpenInNewTab(it.id)},
    {label:'🕐 Versioni', action:()=> openVersionsModal(it.id)},
  ];
  if(it.mine){
    items.push('sep',
      {label:'✂ Taglia (Ctrl+X)', action:()=> setClipboard('cut','project', it.id, it.name)},
      {label:'📋 Copia (Ctrl+C)', action:()=> setClipboard('copy','project', it.id, it.name)},
      {label:'⧉ Duplica (Ctrl+D)', action:()=> libDuplicateSelected()},
      'sep',
      {label:'➜ Sposta in…', action:()=>{ libSel = new Set([key]); openLibMoveDialog('move'); }},
      {label:'⇉ Copia in…', action:()=>{ libSel = new Set([key]); openLibMoveDialog('copy'); }},
      {label:'✎ Rinomina (F2)', action:()=> libStartRename(key)},
      it.shared ? {label:'🔒 Rendi privato', action:()=> setProjectShared(it, false)}
                : {label:'🌐 Rendi pubblico', action:()=> setProjectShared(it, true)},
      {label:'⬇ Scarica (.json)', action:()=> libDownloadProject(it.id)},
      {label:'ℹ Proprietà', action:()=> libShowProperties(key)},
      'sep',
      {label:'🗑 Sposta nel Cestino (Canc)', action:()=> deleteFromLibrary(it.id)},
      {label:'✖ Elimina definitivamente (Shift+Canc)', action:()=>{ libSel = new Set([key]); libDeleteSelected(true); }}
    );
  } else {
    items.push('sep', {label:'📋 Copia nella mia libreria (Ctrl+C)', action:()=> setClipboard('copy','project', it.id, it.name)},
      {label:'⬇ Scarica (.json)', action:()=> libDownloadProject(it.id)}, {label:'ℹ Proprietà', action:()=> libShowProperties(key)});
  }
  if(it.generic){
    items.push('sep', {label: translate('🌐 Esercizio generico: sempre pubblico'), disabled:true, action:()=>{}});
  } else if(!it.mine && currentUser && currentUser.isAdmin){
    items.push('sep', it.shared ? {label: translate('🔒 Rendi privato (amministratore)'), action:()=> adminSetSharedFromLibrary(it, false)}
                                : {label: translate('🌐 Rendi pubblico (amministratore)'), action:()=> adminSetSharedFromLibrary(it, true)});
  }
  return items;
}
async function adminSetSharedFromLibrary(it, shared){
  const msg = shared ? tpl('Rendere pubblico il esercizio «{name}» di {owner}? Lo vedranno e potranno aprirlo tutti gli utenti.', {name:it.name, owner:it.ownerName||'?'})
                     : tpl('Rendere privato il esercizio «{name}» di {owner}? Lo vedrà solo il suo proprietario.', {name:it.name, owner:it.ownerName||'?'});
  if(!(await showConfirm(msg, shared ? 'Rendi pubblico' : 'Rendi privato'))) return;
  await setProjectShared(it, shared);
}
// Pubblico/privato senza risalvare il esercizio (il proprietario, o un amministratore)
async function setProjectShared(it, shared){
  try{
    await apiFetch('set_shared.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:it.id, shared})});
    showToast(shared ? tpl('«{name}» ora è pubblico: lo vedono tutti gli utenti.', {name:it.name}) : tpl('«{name}» ora è privato: lo vedi solo tu.', {name:it.name}), false);
    await loadLibraryList();
  }catch(err){ showToast(err.message || 'Impossibile cambiare la visibilità del esercizio.', true); }
}
// Indicazione della visibilità accanto al nome
function libVisibilityBadge(it){
  if(it.generic) return ` <span class="libvis pub" title="${escapeHTML(translate('Esercizio generico, senza proprietario: sempre pubblico'))}">🌐 ${escapeHTML(translate('generico'))}</span>`;
  if(it.shared) return ` <span class="libvis pub" title="${escapeHTML(translate('Pubblico: lo vedono tutti gli utenti'))}">🌐</span>`;
  return ` <span class="libvis" title="${escapeHTML(translate('Privato: lo vedi solo tu'))}">🔒</span>`;
}
function libEmptyAreaContextItems(targetFolderId){
  return [
    {label:'📁+ Nuova cartella', action: async ()=>{
      const name = await showPrompt('Nome della nuova cartella');
      if(!name) return;
      try{
        await apiFetch('create_folder.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, parentId:targetFolderId})});
        loadLibraryList();
      }catch(err){ showToast('Errore nella creazione della cartella: ' + err.message, true); }
    }},
    {label:'📌 Incolla', disabled:!libClipboard, action:()=> pasteClipboardInto(targetFolderId)},
  ];
}

async function openFolderAsTabs(items){
  if(!items.length) return;
  let opened = 0, failed = 0;
  for(const it of items){
    const ok = await loadFromLibrary(it.id, {silent:true, newTab:true});
    if(ok) opened++; else failed++;
  }
  closeLibraryModal();
  const failNote = failed>0 ? tpl(' ({failed} non aperti per un errore)', {failed}) : '';
  showToast(tpl('Aperti {opened} esercizi in altrettante schede{failNote}.', {opened, failNote}), failed>0);
}
async function loadFromLibrary(id, opts){
  opts = opts || {};
  try{
    const data = await apiFetch('load.php?id=' + encodeURIComponent(id), {method:'GET'});
    const proj = data.project || {};
    // un esercizio già aperto in una scheda: ci si sposta lì invece di aprirlo due volte
    const ed = window.editor;
    const openTabId = [...ed.tabs.entries()].find(([tid, t])=> t.lib && t.lib.id===id && data.mine);
    if(openTabId && !opts.newTab){ ed.switchToTab(openTabId[0]); if(!opts.silent) closeLibraryModal(); return true; }
    await loadSchemaIntoTab(proj.data, proj.name, opts.newTab);
    state.libraryId = data.mine ? id : null; // un esercizio altrui condiviso, se modificato, va salvato come copia propria
    state.libraryFolderId = data.mine ? (proj.folderId || null) : null;
    state.librarySharedLast = !!proj.shared;
    state.libraryUpdated = data.mine ? (proj.updated || null) : null;
    markSaved();
    if(!opts.silent) closeLibraryModal();
    if(!data.mine && !opts.silent) showToast('Esercizio condiviso caricato: salvandolo verrà creata una tua copia personale.', false);
    return true;
  }catch(err){ showToast('Errore nel caricamento dalla libreria: ' + err.message, true); return false; }
}
async function deleteFromLibrary(id){
  if(document.getElementById('libraryModal').classList.contains('open')){ libSel = new Set(['p:' + id]); return libDeleteSelected(false); } // nel Cestino
  const ok = await showConfirm('Spostare questo esercizio nel Cestino della libreria? Potrai ripristinarlo per 30 giorni.', 'Elimina dalla libreria');
  if(!ok) return;
  try{
    await apiFetch('delete.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id})});
    if(state.libraryId===id) state.libraryId = null;
    loadLibraryList();
  }catch(err){ showToast('Errore nell\'eliminazione: ' + err.message, true); }
}

/* ============================================================
   CRONOLOGIA VERSIONI — ogni salvataggio successivo al primo
   conserva lo stato precedente: si può riaprire "in sola lettura"
   in una scheda separata, oppure ripristinarlo (solo proprietario).
============================================================ */
let versionsModalProjectId = null;
function openVersionsModal(id){
  versionsModalProjectId = id;
  openModal('versionsModal');
  loadVersionsList(id);
}
function closeVersionsModal(){ document.getElementById('versionsModal').classList.remove('open'); }
document.getElementById('versionsModalClose').onclick = closeVersionsModal;
document.getElementById('verOnlyPinned').onchange = ()=> renderVersionsList(versionsModalProjectId);
document.getElementById('verPinCurrent').onclick = ()=>{
  if(state.libraryId===versionsModalProjectId && state.libraryDirty) pinCurrentVersion(); // modifiche non salvate: prima si salvano
  else openPinDialog({id: versionsModalProjectId, current: true});
};
document.getElementById('pinClose').onclick = closePinDialog;
document.getElementById('pinCancel').onclick = closePinDialog;
document.getElementById('pinOk').onclick = applyPin;
setupOverlayClickClose(document.getElementById('pinModal'), closePinDialog);
document.getElementById('pinModal').addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key==='Enter' && e.target.id==='pinLabel'){ e.preventDefault(); applyPin(); } });
setupOverlayClickClose(document.getElementById('versionsModal'), closeVersionsModal);

/* ===== finestre trascinabili e amministrazione (da SpikeCut) ===== */
/* ---------- finestre trascinabili dall'intestazione ---------- */
document.addEventListener('mousedown', e=>{
  const head = e.target.closest && e.target.closest('.scx .modal-head');
  if(!head || e.button!==0 || e.target.closest('button, input, select, textarea, a, label')) return;
  const box = head.closest('.modal-box'); if(!box) return;
  const r = box.getBoundingClientRect();
  box.style.position = 'fixed'; box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.margin = '0';
  const ox = e.clientX - r.left, oy = e.clientY - r.top;
  const move = ev=>{
    const x = Math.min(window.innerWidth - 80, Math.max(80 - r.width, ev.clientX - ox));
    const y = Math.min(window.innerHeight - 40, Math.max(0, ev.clientY - oy)); // l'intestazione resta sempre raggiungibile
    box.style.left = x + 'px'; box.style.top = y + 'px';
  };
  const up = ()=>{ window.removeEventListener('mousemove', move, true); window.removeEventListener('mouseup', up, true); };
  window.addEventListener('mousemove', move, true); window.addEventListener('mouseup', up, true);
  e.preventDefault();
}, true);
document.addEventListener('dblclick', e=>{ // doppio clic sull'intestazione: la finestra torna nella posizione iniziale
  const head = e.target.closest && e.target.closest('.scx .modal-head');
  if(!head || e.target.closest('button, input, select, textarea, a, label')) return;
  const box = head.closest('.modal-box'); if(!box) return;
  box.style.position = ''; box.style.left = ''; box.style.top = ''; box.style.margin = '';
}, true);

document.getElementById('btnAdminOpen').onclick = openAdmin;
document.getElementById('adminModalClose').onclick = ()=> document.getElementById('adminModal').classList.remove('open');
setupOverlayClickClose(document.getElementById('adminModal'), ()=> document.getElementById('adminModal').classList.remove('open'));
document.getElementById('adminRefresh').onclick = refreshAdmin;
document.getElementById('adminUserSearch').addEventListener('input', renderAdminUsers);
document.getElementById('adminProjSearch').addEventListener('input', renderAdminProjects);
document.getElementById('adminProjSearch').addEventListener('keydown', e=> e.stopPropagation());
document.getElementById('adminProjOnlyPrivate').onchange = renderAdminProjects;
document.getElementById('adminUserSearch').addEventListener('keydown', e=> e.stopPropagation());

/* ===== versioni e account (da SpikeCut) ===== */
let versionsData = null;
async function loadVersionsList(id){
  const host = document.getElementById('versionsList');
  host.innerHTML = '<div class="emptystate">Caricamento…</div>';
  try{
    versionsData = await apiFetch('versions.php?id=' + encodeURIComponent(id), {method:'GET'});
    renderVersionsList(id);
  }catch(err){
    host.innerHTML = `<div class="emptystate">${escapeHTML(err.message)}</div>`;
  }
}
function renderVersionsList(id){
  const data = versionsData || {items:[]}, host = document.getElementById('versionsList');
  const onlyPinned = document.getElementById('verOnlyPinned').checked;
  document.getElementById('verPinCurrent').style.display = data.mine ? '' : 'none';
  const all = data.items || [], pinnedN = all.filter(x=>x.pin).length;
  const items = onlyPinned ? all.filter(x=>x.pin) : all;
  host.innerHTML = '';
  const info = document.createElement('div'); info.className='ver-info';
  info.textContent = tpl('{n} versioni, di cui {p} fissate. Le versioni fissate non vengono mai cancellate; delle altre restano le ultime {m}. Ripristinando una versione lo stato attuale resta nella cronologia.', {n: all.length, p: pinnedN, m: data.maxVersions || 30});
  host.appendChild(info);
  // stato attuale
  const cur = document.createElement('div'); cur.className='ver-row current';
  const rf = data.restoredFrom;
  cur.innerHTML = `<div class="ver-main"><div class="ver-title">● ${escapeHTML(translate('Stato attuale in libreria'))}</div>`
    + (rf ? `<div class="ver-sub">${escapeHTML(tpl('ripristinato il {d} da «{l}»', {d: new Date(rf.at).toLocaleString(), l: rf.label || new Date(parseInt(String(rf.file).split('_')[0],10)).toLocaleString()}))}</div>` : '') + `</div>`;
  host.appendChild(cur);
  if(!items.length){
    const em = document.createElement('div'); em.className='emptystate';
    em.textContent = translate(onlyPinned ? 'Nessuna versione fissata: usa «📌 Fissa lo stato attuale…» o «Fissa…» su una versione.' : 'Ancora nessuna versione precedente: la cronologia si riempie dal secondo salvataggio in poi.');
    host.appendChild(em); return;
  }
  const section = t=>{ const h = document.createElement('div'); h.className='ver-section'; h.textContent = t; host.appendChild(h); };
  const renderRow = it=>{
    const row = document.createElement('div'); row.className = 'ver-row' + (it.pin ? ' pinned' : '');
    const when = it.savedAt ? new Date(it.savedAt).toLocaleString() : '';
    const main = document.createElement('div'); main.className='ver-main';
    main.innerHTML = it.pin
      ? `<div class="ver-title">⭐ ${escapeHTML(it.pin.label)}</div><div class="ver-sub">${escapeHTML(when)} · ${escapeHTML(it.name||'')}${it.shapes!=null ? ' · ' + escapeHTML(tpl('{n} oggetti', {n: it.shapes})) : ''}</div>` + (it.pin.note ? `<div class="ver-note">${escapeHTML(it.pin.note)}</div>` : '')
      : `<div class="ver-title" style="font-weight:500;">${escapeHTML(it.name||'(senza nome)')}</div><div class="ver-sub">${escapeHTML(when)}${it.shapes!=null ? ' · ' + escapeHTML(tpl('{n} oggetti', {n: it.shapes})) : ''}</div>`;
    row.appendChild(main);
    const btn = (label, title, fn, cls)=>{ const b = document.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : ''); b.style.cssText='width:auto;margin:0;'; b.textContent = translate(label); b.title = translate(title); b.onclick = fn; row.appendChild(b); };
    btn('Apri qui', 'Carica questa versione in una scheda separata, senza modificare quella salvata', ()=> loadSpecificVersion(id, it.file));
    if(data.mine){
      btn('Ripristina', 'Rendi questa la versione attuale salvata in libreria (lo stato attuale resta nella cronologia)', ()=> restoreSpecificVersion(id, it.file));
      if(it.pin){
        btn('✎', 'Modifica nome e nota', ()=> openPinDialog({id, file: it.file, label: it.pin.label, note: it.pin.note}));
        btn('Togli ⭐', 'Togli dalle versioni fissate (resta nella cronologia, ma potrà essere cancellata come le altre)', ()=> unpinVersion(id, it.file, it.pin.label));
      } else btn('📌 Fissa…', 'Dai un nome a questa versione perché resti per sempre', ()=> openPinDialog({id, file: it.file}));
    }
    host.appendChild(row);
  };
  // le versioni fissate in cima (sono quelle che si cercano), poi tutta la cronologia in ordine di tempo
  const pinned = items.filter(x=>x.pin);
  if(!onlyPinned && pinned.length){ section('⭐ ' + tpl('Versioni fissate ({n})', {n: pinned.length})); pinned.forEach(renderRow); section(translate('Cronologia completa')); }
  items.forEach(renderRow);
}
/* ---------- versioni fissate ---------- */
const pinReq = { id:null, file:null, current:false };
function openPinDialog(o){
  Object.assign(pinReq, {id:o.id, file:o.file||null, current:!!o.current});
  document.getElementById('pinTitle').textContent = translate(o.label ? 'Modifica versione fissata' : (o.current ? 'Fissa lo stato attuale' : 'Fissa questa versione'));
  document.getElementById('pinInfo').textContent = o.current ? translate('Lo stato del esercizio salvato ora in libreria diventa una versione con un nome, a cui potrai sempre tornare.')
    : tpl('Versione del {d}.', {d: new Date(parseInt(String(o.file).split('_')[0],10)).toLocaleString()});
  document.getElementById('pinLabel').value = o.label || '';
  document.getElementById('pinNote').value = o.note || '';
  openModal('pinModal');
  setTimeout(()=> document.getElementById('pinLabel').focus(), 50);
}
function closePinDialog(){ document.getElementById('pinModal').classList.remove('open'); }
async function applyPin(){
  const label = document.getElementById('pinLabel').value.trim();
  if(!label){ document.getElementById('pinLabel').focus(); showToast('Dai un nome alla versione.', true); return; }
  const note = document.getElementById('pinNote').value.trim();
  try{
    await apiFetch('pin_version.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(pinReq.current ? {id:pinReq.id, current:true, label, note} : {id:pinReq.id, file:pinReq.file, label, note})});
    closePinDialog();
    showToast(tpl('Versione fissata: «{l}».', {l: label}), false);
    if(document.getElementById('versionsModal').classList.contains('open') && versionsModalProjectId===pinReq.id) loadVersionsList(pinReq.id);
  }catch(err){ showToast('Errore: ' + err.message, true); }
}
async function unpinVersion(id, file, label){
  if(!(await showConfirm(tpl('Togliere «{l}» dalle versioni fissate? Resterà nella cronologia, ma potrà essere cancellata come le altre quando se ne accumulano troppe.', {l: label}), 'Togli'))) return;
  try{ await apiFetch('pin_version.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, file, unpin:true})}); loadVersionsList(id); }
  catch(err){ showToast('Errore: ' + err.message, true); }
}
// dal menu File: fissa ciò che si vede (se ci sono modifiche non salvate le salva prima)
async function pinCurrentVersion(){
  if(!currentUser){ openAccountModal('login'); showToast('Accedi al tuo account per fissare le versioni.', true); return; }
  if(!state.libraryId){ showToast('Questo disegno non è ancora nella libreria: salvalo prima con «Salva in libreria», poi potrai fissarne le versioni.', true); return; }
  if(state.libraryDirty){
    if(!(await showConfirm('Ci sono modifiche non ancora salvate in libreria. Salvarle adesso e fissare questa versione?', 'Salva e fissa'))) return;
    if(!(await quickSaveToLibrary())) return;
  }
  openPinDialog({id: state.libraryId, current: true});
}

async function loadSpecificVersion(id, file){
  try{
    const data = await apiFetch('load_version.php?id=' + encodeURIComponent(id) + '&file=' + encodeURIComponent(file), {method:'GET'});
    const proj = data.project || {};
    await loadSchemaIntoTab(proj.data, (proj.name || 'Esercizio') + ' (versione precedente)', true);
    state.libraryId = null; // versione storica: salvarla crea un esercizio nuovo, non sovrascrive quello attuale
    closeVersionsModal(); closeLibraryModal();
    showToast('Versione precedente aperta in una nuova scheda: salvandola in libreria creerai un esercizio separato, senza toccare quello originale.', false);
  }catch(err){ showToast('Errore nel caricamento della versione: ' + err.message, true); }
}
async function restoreSpecificVersion(id, file){
  const it = versionsData && (versionsData.items||[]).find(x=>x.file===file);
  const what = it && it.pin ? tpl('la versione fissata «{l}»', {l: it.pin.label}) : tpl('la versione del {d}', {d: it && it.savedAt ? new Date(it.savedAt).toLocaleString() : ''});
  const ok = await showConfirm(tpl('Ripristinare {what} come stato attuale dell\'esercizio? Lo stato di adesso resta nella cronologia, quindi potrai tornarci.', {what}), 'Ripristina');
  if(!ok) return;
  try{
    await apiFetch('restore_version.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, file})});
    showToast(it && it.pin ? tpl('Ripristinata «{l}».', {l: it.pin.label}) : translate('Versione ripristinata in libreria.'), false);
    loadVersionsList(id);
    // la scheda che ha aperto questo esercizio si allinea alla versione ripristinata (se non ha modifiche non salvate)
    const ed = window.editor;
    const entry = [...ed.tabs.entries()].find(([tid, t])=> t.lib && t.lib.id===id);
    if(entry){
      if(ed.activeTabId!==entry[0]) ed.switchToTab(entry[0]);
      if(!state.libraryDirty || await showConfirm('La scheda con questo esercizio ha modifiche non salvate. Sostituirle con la versione ripristinata?', 'Aggiorna la scheda')){
        const fresh = await apiFetch('load.php?id=' + encodeURIComponent(id), {method:'GET'});
        await loadSchemaIntoTab((fresh.project||{}).data, (fresh.project||{}).name, false);
        state.libraryUpdated = (fresh.project||{}).updated || null; markSaved();
      }
    }
  }catch(err){ showToast('Errore nel ripristino: ' + err.message, true); }
}

/* ============================================================
   ACCOUNT UTENTE — login, registrazione, recupero password.
   I file salvati in libreria possono restare privati (visibili solo
   a chi li ha creati) oppure essere condivisi con tutti gli utenti
   (vedi checkbox nella modale "Salva in libreria").
============================================================ */
let currentUser = null;
// Finestre che mostrano dati privati della libreria (nomi di esercizi e cartelle, versioni)
const PRIVATE_MODALS = ['libraryModal','versionsModal','pinModal','saveLibraryModal','saveConflictModal','adminModal','libMoveModal'];
// Cancella dal browser tutto ciò che è stato scaricato dalla libreria dell'utente e chiude le finestre
// che lo mostrano (anche se ridotte a icona): va fatto all'uscita, allo scadere dell'accesso e al cambio utente.
function clearPrivateLibraryData(){
  libCacheItems = []; libCacheFolders = []; libCurrentFolderId = null; libSearchQuery = ''; libClipboard = null;
  ['libList','libTree','libBreadcrumb','libOpenAllWrap','versionsList','sharedComponentsList','adminDbInfo','adminUsersTable','adminUsersSummary','adminProjectsTable','adminProjectsSummary'].forEach(id=>{ const e = document.getElementById(id); if(e) e.innerHTML = ''; });
  if(typeof adminState !== 'undefined') adminState.users = [];
  if(typeof libCacheTrash !== 'undefined'){ libCacheTrash = []; libInTrash = false; }
  if(typeof adminProj !== 'undefined') adminProj.list = [];
  const ls = document.getElementById('libSearch'); if(ls) ls.value = '';
  const sf = document.getElementById('saveLibFolder'); if(sf) sf.innerHTML = '';
  const sn = document.getElementById('saveLibName'); if(sn) sn.value = '';
  PRIVATE_MODALS.forEach(id=>{ const ov = document.getElementById(id); if(!ov) return; ov.classList.remove('open'); delete ov.dataset.minimized; });
  renderModalDock();
}

function updateAccountUI(){
  updateAccountUIInner();
}
function updateAccountUIInner(){
  const adm = document.getElementById('btnAdminOpen'); if(adm) adm.style.display = currentUser && currentUser.isAdmin ? '' : 'none';
  ['loadFromLibrary', 'btnSaveLibraryTop'].forEach(id=>{
    const b = document.getElementById(id); if(!b) return;
    b.classList.toggle('lib-off', !currentUser);
  });
}
async function checkAuthStatus(){
  const lm = window.loginManager;
  currentUser = lm && lm.isOnline() ? lm.user : null;
  if(!currentUser) clearPrivateLibraryData();
  updateAccountUI();
}
function showAccountView(view){
  // accesso e registrazione sono nella schermata iniziale: qui c'è solo la vista "collegato"
  document.getElementById('acctViewLoggedIn').style.display = '';
  document.getElementById('accountModalTitle').textContent = translate('Account');
}
function openAccountModal(view){
  const lm = window.loginManager;
  const u = (lm && lm.user) || {};
  showAccountView('loggedin');
  document.getElementById('acctLoggedUsername').textContent = u.username || '';
  document.getElementById('acctLoggedEmail').textContent = u.email || '';
  document.getElementById('acctOffline').style.display = currentUser ? 'none' : '';
  document.getElementById('acctRole').innerHTML = u.isAdmin
    ? '🛠 Sei <b>amministratore</b>: usa il pulsante qui sotto.'
    : 'Ruolo: utente. ' + escapeHTML('È amministratore il primo account registrato su questo sito, oppure chi è indicato in ADMIN_USERS nel file cloud/config.php.');
  updateAccountUI();
  openModal('accountModal');
}
function closeAccountModal(){ document.getElementById('accountModal').classList.remove('open'); }
document.getElementById('accountModalClose').onclick = closeAccountModal;
setupOverlayClickClose(document.getElementById('accountModal'), closeAccountModal);

/* ===== collegamento a VolleyProW4: account e comandi ===== */
document.getElementById('logoutSubmit').onclick = ()=>{ closeAccountModal(); window.loginManager && window.loginManager.handleLogout(); };
window.addEventListener('pv4:user', ()=>{ clearPrivateLibraryData(); checkAuthStatus(); });
window.addEventListener('pv4:auth-expired', ()=>{ if(currentUser){ currentUser = null; clearPrivateLibraryData(); updateAccountUI(); showToast('L\'accesso è scaduto: esci e accedi di nuovo per usare la libreria.', true); } });
checkAuthStatus();

window.Pv4Library = {
  open: openLibraryModal,
  quickSave: quickSaveToLibrary,
  saveAs: saveToLibrary,
  versions(){
    if(!currentUser){ openAccountModal(); return; }
    if(!state.libraryId){ showToast('Questo esercizio non è ancora nella libreria: salvalo prima con «Salva in libreria».', true); return; }
    openVersionsModal(state.libraryId);
  },
  pinVersion: pinCurrentVersion,
  account: openAccountModal,
  // apre un esercizio della libreria (nella scheda attuale se vuota, altrimenti in una nuova)
  load: (id)=> loadFromLibrary(id, {silent:true}),
  isAvailable: ()=> !!currentUser,
  admin: openAdmin,
  toast: showToast,
  contextMenu: showContextMenu
};
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
