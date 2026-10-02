/**
 * GUIDA DI VOLLEYPROW4 — come la guida di SpikeCut: ricerca a testo libero su tutti
 * gli argomenti (ignora maiuscole e accenti, evidenzia le parole trovate), menu a
 * tendina per capitolo, collegamenti tra argomenti. Si apre con ? in alto o con F1.
 * La finestra e la ricerca sono quelle di SpikeCut; i contenuti sono di VolleyProW4.
 */
(function () {

const GUIDE_MARKUP = `<div id="helpModal" class="modal-overlay scx">
  <div class="modal-box" style="width:min(1000px,96vw);height:min(740px,90vh);display:flex;flex-direction:column;">
    <div class="modal-head">
      <h3>Guida di VolleyProW4</h3>
      <button class="iconbtn" id="helpModalClose" title="Chiudi">✕</button>
    </div>
    <div class="guide-bar">
      <input type="search" id="guideSearch" placeholder="Cerca nella guida (es. zona, libreria, frecce)…" autocomplete="off">
      <select id="guideTopic"></select>
    </div>
    <div class="guide-main">
      <div id="guideList"></div>
      <div id="guideContent"></div>
    </div>
  </div>
</div>`;

function boot() {
  const host = document.createElement('div');
  host.innerHTML = GUIDE_MARKUP;
  while (host.firstChild) document.body.appendChild(host.firstChild);

const currentLang = 'it';
function translate(str){ return str; }
function tpl(str, vars){ let s = translate(str); if(vars) for(const k in vars) s = s.split('{'+k+'}').join(vars[k]); return s; }
function escapeHTML(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function openModal(id){ const el = document.getElementById(id); el.parentNode.appendChild(el); el.classList.add('open'); }
function setupOverlayClickClose(overlayEl, closeFn){
  let downOnOverlay = false;
  overlayEl.addEventListener('mousedown', (e)=>{ downOnOverlay = (e.target === overlayEl); });
  overlayEl.addEventListener('click', (e)=>{ if(e.target === overlayEl && downOnOverlay) closeFn(); });
}

/* ============================================================
   GUIDA DI VOLLEYPROW4 — contenuti. Da aggiornare a ogni modifica
   del programma (anche la sezione "Novità" e GUIDE_VERSION).
   Collegamenti tra argomenti: <a data-topic="id">testo</a>
============================================================ */
const GUIDE_VERSION = '1.2.0';
const GUIDE_TOPICS = [
/* ---------------- PER INIZIARE ---------------- */
{ id:'intro', cat:'Per iniziare', title:'Cos\'è VolleyProW4', keys:'panoramica introduzione cosa fa allenatore pallavolo schema esercizio allenamento',
html:`<p>VolleyProW4 è l'editor per <b>allenatori di pallavolo</b>: disegni schemi ed esercizi sul campo, con giocatori, palloni, materiale e frecce, e ne prepari la scheda da stampare.</p>
<p>Oltre agli strumenti di disegno offre:</p>
<ul><li><a data-topic="crea-da-testo">Crea da testo</a>: scrivi l'esercizio a parole e il campo, i giocatori, le frecce e gli step vengono creati in automatico;</li>
<li>gli <a data-topic="step">step</a> e i <a data-topic="dati-esercizio">dati dell'esercizio</a> (obiettivo, serie, tempi, recupero) per la scheda di allenamento;</li>
<li>l'<a data-topic="animazione">animazione</a> dei movimenti e la <a data-topic="vista-3d">vista 3D</a> del campo;</li>
<li>una <a data-topic="libreria">libreria online</a> con account, cartelle, versioni ed esercizi privati o condivisi con tutti;</li>
<li>la stampa in PDF della scheda, dei fogli formazioni e del foglio scout: vedi <a data-topic="stampa">Stampa ed esportazione</a>.</li></ul>` },

{ id:'account', cat:'Per iniziare', title:'Accesso e account', keys:'login accedi registrati registrazione password dimenticata recupero ricordami esci logout utente email',
html:`<p>All'apertura compare la schermata di accesso. Ogni allenatore usa il <b>proprio account</b>:</p>
<ul><li><b>Registrati</b>: scegli nome utente (3-30 caratteri: lettere, numeri, punto, trattino, underscore), email e password (almeno 6 caratteri). Entri subito.</li>
<li><b>Accedi</b>: con il nome utente <i>oppure</i> l'email, e la password.</li>
<li><b>Ricordami su questo dispositivo</b>: resti collegato per 30 giorni, anche chiudendo il browser; senza la spunta l'accesso dura 24 ore.</li>
<li><b>Password dimenticata?</b>: inserisci l'email del tuo account e riceverai un link, valido un'ora, per sceglierne una nuova.</li></ul>
<p>Dal menu utente in alto a destra (👤):</p>
<ul><li><b>Account…</b> mostra con chi sei collegato e il tuo ruolo (utente o amministratore);</li>
<li><b>Profilo</b>: nome, cognome, email, telefono, ruolo, squadra e bio, salvati nel tuo account;</li>
<li><b>Amministrazione</b>: solo per gli amministratori, vedi <a data-topic="amministrazione">Amministrazione</a>;</li>
<li><b>Esci</b> chiude la sessione su questo dispositivo.</li></ul>
<p>Se il server non risponde (nessuna connessione) puoi entrare con l'ultimo account usato o <b>senza account</b>: l'editor funziona normalmente, ma la <a data-topic="libreria">libreria online</a> resta disattivata finché non accedi di nuovo.</p>` },

{ id:'interfaccia', cat:'Per iniziare', title:'L\'interfaccia', keys:'barra menu pannello laterale topbar schermo zone finestra rail strumenti stato',
html:`<p>Lo schermo è diviso in zone:</p>
<ul><li><b>Barra in alto</b>: titolo dello schema, salvataggio, <b>☁ Libreria</b> e <b>☁ Salva</b> (vedi <a data-topic="libreria">Libreria</a>), annulla/ripeti e storico, zoom, nuovo schema, apri file, questa guida (?), il tuo utente e i menu <b>File</b>, <b>Stampa</b> e <b>Strumenti</b>.</li>
<li><b>Schede</b> sotto la barra: più schemi aperti insieme, vedi <a data-topic="schede">Schede</a>.</li>
<li><b>Barra degli strumenti</b> a sinistra, a sezioni: Seleziona, Disegna, Inserisci, Modifica, Allenamento. Il pulsante ☰ la comprime o la espande.</li>
<li><b>Foglio</b> al centro: il campo con giocatori, oggetti e frecce.</li>
<li><b>Pannello a destra</b> con tre schede: <b>Proprietà</b> (del foglio o dell'oggetto selezionato), <b>Step</b> (vedi <a data-topic="step">Step</a>) ed <b>Esercizio</b> (vedi <a data-topic="dati-esercizio">Dati dell'esercizio</a>).</li>
<li><b>Barra di stato</b> in basso: coordinate e interruttori per griglia, bianco e nero, numeri degli oggetti, nomi dei giocatori, bordi del foglio e sfera 3D.</li></ul>` },

{ id:'schede', cat:'Per iniziare', title:'Schede e foglio', keys:'tab nuovo schema più schemi chiudi scheda foglio dimensione formato personalizzato maniglia sfondo zoom',
html:`<p>Con <b>＋</b> accanto alle schede (o nella barra in alto) crei un nuovo schema; la × su una scheda la chiude. Ogni scheda ha i suoi oggetti, i suoi step e la sua cronologia annulla/ripeti. Il nome si cambia scrivendo direttamente sulla scheda o nel titolo in alto.</p>
<ul><li><b>Dimensione del foglio</b>: dal pannello Proprietà (senza selezione) scegli un formato (A5, A4, A3, A2, verticale o orizzontale) oppure <b>Personalizzato</b>; trascinando la maniglia ⇲ nell'angolo del foglio lo ridimensioni a mano. Il nuovo schema parte da 560 × 400.</li>
<li><b>Sfondo</b>: dal pannello Proprietà.</li>
<li><b>Zoom</b>: pulsanti – e + nella barra in alto, ⤢ per tornare al 100%.</li></ul>
<p>Il lavoro viene salvato da solo nel browser: vedi <a data-topic="salvataggio">Salvataggio</a>.</p>` },

/* ---------------- DISEGNARE ---------------- */
{ id:'inserire', cat:'Disegnare', title:'Campo, giocatori e materiale', keys:'inserisci aggiungi campo intero metà campo rete pallone cono giocatori squadra galleria trascina',
html:`<ul><li><b>Giocatori…</b> (G) apre la galleria dei giocatori: Squadra A (blu: P1, S1, C1, O1, L1), Squadra B (verde: P2, S2, C2, O2, L2), giocatori generici A-F e staff. <b>Clic</b> per aggiungerlo al centro del foglio, <b>trascinamento</b> per metterlo dove vuoi.</li>
<li><b>Campo e oggetti…</b> (E): campo intero, metà campo, rete, palloni, figure, materiale, testo e icone.</li>
<li><b>Testo</b> (T) aggiunge una scritta al centro del foglio.</li></ul>
<p>Il campo resta sempre sotto agli altri oggetti. Per un esercizio completo in un colpo solo usa <a data-topic="crea-da-testo">Crea da testo</a>.</p>` },

{ id:'frecce', cat:'Disegnare', title:'Frecce, matita e tratteggio', keys:'freccia collega punti aggancio curva lineare zigzag spessore punte matita disegno libero tratteggio tratteggiato',
html:`<ul><li><b>Frecce</b> (A): clicca un punto di aggancio di un oggetto e poi un altro punto (di un oggetto o del foglio). Le frecce agganciate seguono gli oggetti quando li sposti.</li>
<li>Selezionando una freccia, nel pannello Proprietà scegli colore, tipo (lineare, curva, zigzag), spessore, opacità, punte all'inizio e alla fine, tratteggio. Nelle frecce curve il punto arancione ne regola la curvatura.</li>
<li><b>Matita libera</b> (B): disegno a mano libera, con colore, spessore e opacità.</li>
<li><b>Tratteggio</b> (D): i nuovi oggetti e le nuove frecce vengono creati tratteggiati. Per convenzione: freccia continua = palla, tratteggiata = spostamento del giocatore.</li></ul>` },

{ id:'modificare', cat:'Disegnare', title:'Selezionare e modificare', keys:'seleziona sposta ruota specchia primo piano sfondo griglia allinea elimina colore opacità etichetta copia incolla annulla',
html:`<ul><li><b>Selezione</b> (V): clic su un oggetto per selezionarlo, trascinamento sull'area vuota per selezionarne più di uno. Si spostano trascinandoli o con le frecce della tastiera (Maiusc per passi più lunghi).</li>
<li><b>Ruota 15°</b> (R, con Maiusc nel verso opposto) e <b>Ruota 90°</b>; con più oggetti ruota il gruppo.</li>
<li><b>Specchia</b> orizzontale (H) e verticale.</li>
<li><b>Primo piano</b> (Ctrl+]) e <b>Sfondo</b> (Ctrl+[) cambiano l'ordine di sovrapposizione.</li>
<li><b>Allinea a griglia</b> porta gli oggetti sui punti della griglia.</li>
<li><b>Elimina</b> (Canc) toglie la selezione.</li>
<li>Nel pannello Proprietà: colore, opacità, testo, numero dell'etichetta, tratteggio e rotazione 3D dell'oggetto selezionato.</li></ul>
<p>Annulla e Ripeti (Ctrl+Z / Ctrl+Y) e lo <b>storico modifiche</b> (🕐) permettono di tornare indietro.</p>` },

{ id:'vista-3d', cat:'Disegnare', title:'Vista 3D', keys:'3d sfera rotazione piano inclinazione profondità prospettiva modelli glb',
html:`<p>Il foglio si può inclinare per una vista in prospettiva del campo:</p>
<ul><li>la <b>sfera 3D</b> (interruttore nella barra di stato) si trascina per ruotare il piano;</li>
<li>nel pannello Proprietà, <b>Rotazione piano</b> con i pulsanti X−/X+, Y−/Y+, Z−/Z+ e ⟲ per azzerare;</li>
<li><b>Oggetti allineati al piano</b> fa seguire agli oggetti l'inclinazione; <b>Profondità</b> li solleva dal piano (fissa o automatica in base alla dimensione).</li></ul>
<p>Dal menu File puoi registrare modelli 3D (.glb) da usare come oggetti.</p>` },

/* ---------------- ESERCIZI ---------------- */
{ id:'crea-da-testo', cat:'Esercizi', title:'Crea da testo', keys:'descrizione scrivi testo automatico frasi zona passaggio rete battuta attacco sposta fantasma copia trasparente impara',
html:`<p><b>Crea da testo</b> (barra a sinistra, sezione Allenamento) costruisce l'esercizio da una descrizione scritta: campo, giocatori, palla, coni, frecce numerate e step. Funziona senza connessione.</p>
<p>Esempio: <i>Campo intero in orizzontale. Metti P1 in zona 1 e A in zona 2. P1 passa la palla ad A, A passa a P2 che manda la palla oltre la rete. P1 si sposta in zona 6.</i></p>
<table class="guide-table"><tr><th>Cosa</th><th>Frasi capite</th></tr>
<tr><td>Campo</td><td>campo intero / metà campo, orizzontale / verticale, con la rete</td></tr>
<tr><td>Posizioni</td><td>metti P1 in zona 1 · A in zona 2 del campo avversario · due giocatori · a rete · colori (rosso, verde…)</td></tr>
<tr><td>Ruoli a parole</td><td>palleggiatore → P1, libero → L1, opposto → O1, centrale → C1, schiacciatore/banda → S1</td></tr>
<tr><td>Passaggi</td><td>P1 passa ad A · da A a P2 · A → B · A passa a P2 che passa a P3</td></tr>
<tr><td>Azioni</td><td>manda la palla oltre la rete · batte in zona 5 · attacca in zona 1 · riceve · si sposta in zona 6 · va a rete · torna in posizione</td></tr>
<tr><td>Materiale</td><td>metti un cono in zona 3</td></tr></table>
<ul><li>Ogni <b>spostamento</b> dello stesso giocatore viene disegnato come una sua copia <b>semitrasparente e tratteggiata</b>, sempre più chiara, collegata da una freccia tratteggiata; «torna in posizione» disegna una freccia curva verso il giocatore originale.</li>
<li>I giocatori nominati ma non posizionati vengono messi da soli nel campo dove si trova la palla.</li>
<li>Le frasi non capite vengono elencate nella finestra.</li>
<li>Tutto l'esercizio si toglie con un solo Annulla.</li></ul>
<p><b>Apprendimento</b>: se sposti a mano un giocatore creato da testo, la nuova posizione della zona viene ricordata (all'apertura della finestra o con «Impara dalle modifiche»). In «Insegnami una frase» puoi dire che una parola tua significa un'altra (es. «la palleggiatrice» → «P1»).</p>` },

{ id:'step', cat:'Esercizi', title:'Step dell\'esercizio', keys:'step passi sequenza descrizione ordine trascina azioni preimpostate',
html:`<p>Nella scheda <b>Step</b> del pannello a destra scrivi le fasi dell'esercizio in ordine. Le azioni preimpostate vengono riconosciute mentre scrivi; gli step si riordinano trascinandoli e compaiono nella scheda stampata.</p>
<p><a data-topic="crea-da-testo">Crea da testo</a> compila gli step da solo: la disposizione iniziale e un passo per ogni passaggio, spostamento o azione.</p>` },

{ id:'dati-esercizio', cat:'Esercizi', title:'Dati dell\'esercizio', keys:'esercizio obiettivo periodo ruolo tipologia genere categoria descrizione autore data luogo serie gruppi tempo recupero',
html:`<p>La scheda <b>Esercizio</b> del pannello a destra contiene i dati che finiscono nella scheda di allenamento: periodo, ruolo, tipologia, genere e categoria, descrizione, autore, data e luogo, numero, serie, gruppi, durata e recupero.</p>
<p>Con <b>File → Salva allenamento…</b> riunisci più esercizi in un allenamento completo.</p>` },

{ id:'animazione', cat:'Esercizi', title:'Animazione, macro e squadra', keys:'animazione frame fotogrammi movimento play velocità macro registra squadra rosa giocatori nomi foto',
html:`<ul><li><b>Animazione</b>: salvi le posizioni degli oggetti in fotogrammi successivi e riproduci il movimento, con la velocità che preferisci.</li>
<li><b>Macro</b>: registri una sequenza di operazioni e la riproduci quando serve.</li>
<li><b>Squadra</b>: la rosa dei giocatori (ruolo, numero, nome e foto). Con l'interruttore <b>nomi</b> nella barra di stato i giocatori sul campo mostrano nome e numero.</li></ul>` },

/* ---------------- SALVARE E CONDIVIDERE ---------------- */
{ id:'salvataggio', cat:'Salvare e condividere', title:'Salvataggio', keys:'salva salvataggio automatico autosave file json apri carica browser',
html:`<ul><li><b>Salvataggio automatico</b>: il lavoro viene salvato nel browser a intervalli regolari e ritrovato alla riapertura (frequenza in Strumenti → Salvataggi automatici…).</li>
<li><b>File → Salva schema (.json)</b> scarica lo schema in un file; <b>Apri schema da file</b> (o ⇪ in alto) lo ricarica.</li>
<li>Per avere gli esercizi su ogni dispositivo e condividerli usa la <a data-topic="libreria">libreria online</a>.</li></ul>` },

{ id:'libreria', cat:'Salvare e condividere', title:'Libreria esercizi online', keys:'libreria online server cloud salva in libreria apri cartelle esplora file pubblico privato condividi',
html:`<p>La libreria online conserva i tuoi esercizi sul server: li ritrovi da qualunque dispositivo accedendo con il tuo <a data-topic="account">account</a>.</p>
<ul><li><b>☁ Salva</b> (in alto) o <b>File → Salva in libreria</b>: la prima volta chiede nome, cartella e se <b>condividere</b> l'esercizio con tutti gli utenti; le volte successive sovrascrive subito l'esercizio collegato alla scheda (e la versione precedente resta nelle <a data-topic="versioni">versioni</a>).</li>
<li><b>File → Salva in libreria con nome…</b> salva sempre chiedendo nome e cartella; se il nome esiste già puoi sovrascrivere o creare una copia.</li>
<li><b>☁ Libreria</b> apre la finestra della libreria: vedi <a data-topic="esplora">La libreria come Esplora file</a>.</li></ul>
<p><b>Privati e pubblici</b>: un esercizio privato (🔒) lo vedi solo tu; uno pubblico (🌐) compare a tutti in «Libreria comune». Solo il proprietario può modificarlo o eliminarlo: chi apre un esercizio pubblico altrui e lo salva ne crea una copia personale. Si cambia con il tasto destro → Rendi pubblico / Rendi privato.</p>` },

{ id:'esplora', cat:'Salvare e condividere', title:'La libreria come Esplora file', keys:'esplora cartelle nuova cartella rinomina duplica taglia copia incolla sposta in copia in proprietà scarica cerca ordina trascina tastiera',
html:`<p>La finestra della libreria funziona come Esplora file: a sinistra l'albero delle cartelle (con il <a data-topic="cestino">Cestino</a> in fondo), a destra il contenuto della cartella, in alto la <b>barra dei comandi</b>: Su, Nuova cartella, Apri, Rinomina, Duplica, Elimina, Taglia, Copia, Incolla, <b>Sposta in…</b>, <b>Copia in…</b> e Proprietà.</p>
<ul><li><b>Selezione</b>: clic, Ctrl+clic e Maiusc+clic per più elementi; Ctrl+A seleziona tutto.</li>
<li><b>Apri</b>: doppio clic o Invio. Il tasto destro offre anche <b>Apri in una nuova scheda</b>; «Apri tutta la cartella» apre ogni esercizio in una scheda.</li>
<li><b>Spostare</b>: trascina esercizi e cartelle su una cartella dell'albero o dell'elenco, oppure Taglia e Incolla, oppure Sposta in….</li>
<li><b>Cerca</b>: la casella in alto cerca in tutta la libreria per nome, cartella e autore.</li>
<li><b>Ordina</b>: clic sulle intestazioni Nome, Ultima modifica, Dimensione.</li>
<li><b>Proprietà</b>: posizione, dimensione, date, visibilità, numero di oggetti, frecce e step. Dal tasto destro anche <b>Scarica (.json)</b>.</li></ul>
<table class="guide-table"><tr><th>Tasti</th><th>Comando</th></tr>
<tr><td>Invio</td><td>apri</td></tr><tr><td>F2</td><td>rinomina</td></tr><tr><td>Ctrl+D</td><td>duplica</td></tr>
<tr><td>Ctrl+C / Ctrl+X / Ctrl+V</td><td>copia, taglia, incolla</td></tr><tr><td>Canc / Maiusc+Canc</td><td>Cestino / elimina definitivamente</td></tr>
<tr><td>Ctrl+Maiusc+N</td><td>nuova cartella</td></tr><tr><td>Backspace</td><td>cartella superiore</td></tr><tr><td>F5</td><td>aggiorna</td></tr></table>
<p>Eliminando una cartella il suo contenuto sale alla cartella superiore: non si perde nulla.</p>` },

{ id:'versioni', cat:'Salvare e condividere', title:'Versioni', keys:'versioni cronologia storico ripristina versione precedente fissa versione nome nota',
html:`<p>Ogni volta che risalvi un esercizio in libreria, lo stato precedente resta nella <b>cronologia versioni</b> (pulsante <b>Versioni</b> nella libreria, o File → Versioni dell'esercizio…).</p>
<ul><li><b>Apri qui</b> apre una versione passata in una nuova scheda, senza toccare quella salvata; salvandola nasce un esercizio separato.</li>
<li><b>Ripristina</b> la rende la versione attuale; lo stato di prima resta comunque nella cronologia.</li>
<li><b>📌 Fissa…</b> dà un nome (e una nota) a una versione perché resti per sempre; «Fissa lo stato attuale…» o File → Fissa questa versione… fissano quello che stai vedendo, salvandolo prima se serve.</li></ul>
<p>Delle versioni non fissate restano le ultime 30.</p>` },

{ id:'cestino', cat:'Salvare e condividere', title:'Cestino', keys:'cestino elimina ripristina recupera svuota definitivamente 30 giorni',
html:`<p>Un esercizio eliminato dalla libreria va nel <b>Cestino</b> (in fondo all'albero delle cartelle) e resta recuperabile per <b>30 giorni</b>, poi viene cancellato davvero.</p>
<ul><li><b>Ripristina</b> (o doppio clic) lo rimette nella cartella da cui era stato eliminato.</li>
<li><b>Elimina definitivamente</b> e <b>Svuota Cestino</b> lo cancellano subito.</li>
<li>Maiusc+Canc nella libreria elimina definitivamente senza passare dal Cestino.</li></ul>` },

{ id:'amministrazione', cat:'Salvare e condividere', title:'Amministrazione', keys:'amministratore admin database utenti esercizi pubblici privati stato server',
html:`<p>Gli amministratori (il primo utente registrato, se non è indicato diversamente in <code>cloud/config.php</code>) trovano <b>Amministrazione</b> nel menu 👤 e in Account…. Per sapere se lo sei, apri Account…: c'è scritto il tuo ruolo. Per aggiungere altri amministratori si scrivono i loro nomi utente in <code>ADMIN_USERS</code>, per esempio <code>define('ADMIN_USERS', ['mario', 'giulia']);</code> (con l'elenco compilato sono amministratori solo quelli indicati).</p>
<p>La finestra mostra:</p>
<ul><li>lo <b>stato del database</b> (SQLite, file, copie di sicurezza giornaliere, numero di utenti, esercizi e cartelle);</li>
<li>l'elenco degli <b>utenti</b> con registrazione, ultimo accesso e ultimo salvataggio, ed esercizi pubblici e privati di ognuno;</li>
<li>l'elenco di tutti gli <b>esercizi</b>, con la possibilità di renderli pubblici o privati (resta traccia di chi ha fatto l'ultimo cambio).</li></ul>` },

/* ---------------- STAMPA ---------------- */
{ id:'stampa', cat:'Stampa ed esportazione', title:'Stampa ed esportazione', keys:'stampa pdf scheda allenamento immagine png formazioni scout datavolley esporta',
html:`<p>Dal menu <b>Stampa</b>:</p>
<ul><li><b>Scheda allenamento (PDF)</b>: lo schema con step e dati dell'esercizio.</li>
<li><b>Esporta immagine</b>: lo schema come immagine.</li>
<li><b>Foglio formazioni</b>: i campi dei set con le rotazioni, sostituzioni e note.</li>
<li><b>Foglio scout</b>: il foglio per raccogliere i dati durante la partita.</li></ul>
<p>Con l'interruttore <b>b/n</b> nella barra di stato lo schema diventa in bianco e nero, utile per la stampa.</p>` },

/* ---------------- RIFERIMENTO ---------------- */
{ id:'scorciatoie', cat:'Riferimento', title:'Scorciatoie da tastiera', keys:'tasti scorciatoie tastiera shortcut ctrl',
html:`<table class="guide-table"><tr><th>Tasti</th><th>Comando</th></tr>
<tr><td>V · A · B · D · T</td><td>selezione · frecce · matita · tratteggio · testo</td></tr>
<tr><td>G · E</td><td>galleria giocatori · campo e oggetti</td></tr>
<tr><td>R / Maiusc+R · H</td><td>ruota di 15° · specchia</td></tr>
<tr><td>Ctrl+] · Ctrl+[</td><td>primo piano · sfondo</td></tr>
<tr><td>Ctrl+Z · Ctrl+Y</td><td>annulla · ripeti</td></tr>
<tr><td>Ctrl+C · Ctrl+X · Ctrl+V · Ctrl+A</td><td>copia · taglia · incolla · seleziona tutto</td></tr>
<tr><td>Canc</td><td>elimina la selezione</td></tr>
<tr><td>Frecce · Maiusc+Frecce</td><td>sposta gli oggetti · a passi lunghi</td></tr>
<tr><td>+ · − · 0</td><td>zoom avanti · indietro · 100%</td></tr>
<tr><td>Esc</td><td>deseleziona</td></tr>
<tr><td>Ctrl+Invio</td><td>in Crea da testo: crea l'esercizio</td></tr>
<tr><td>F1</td><td>questa guida</td></tr></table>
<p>I tasti della libreria sono in <a data-topic="esplora">La libreria come Esplora file</a>.</p>` },

{ id:'problemi', cat:'Riferimento', title:'Problemi frequenti', keys:'problemi errore non funziona login server accesso scaduto non trovo libreria disattivata vecchia versione cache',
html:`<dl class="guide-faq">
<dt>La libreria dice di accedere anche se sono entrato.</dt><dd>Sei entrato senza account o il server non rispondeva, oppure l'accesso è scaduto. Esci dal menu 👤 e accedi di nuovo.</dd>
<dt>Non ricevo l'email per reimpostare la password.</dt><dd>Controlla la posta indesiderata; il link vale un'ora. Se non arriva, chiedi all'amministratore.</dd>
<dt>Dopo un aggiornamento vedo ancora la versione vecchia.</dt><dd>Ricarica la pagina con Ctrl+F5 per svuotare la cache del browser.</dd>
<dt>Crea da testo non capisce una frase.</dt><dd>Riformulala come negli esempi di <a data-topic="crea-da-testo">Crea da testo</a>, oppure insegnagliela in «Insegnami una frase».</dd>
<dt>Non posso modificare un esercizio della libreria comune.</dt><dd>È di un altro utente: salvandolo ne crei una tua copia.</dd>
</dl>` },

{ id:'novita', cat:'Riferimento', title:'Novità', keys:'novità versioni changelog aggiornamenti',
html:`<ul>
<li><b>1.2</b> — Account veri (registrazione, accesso, recupero password, sessione ricordata), <a data-topic="libreria">libreria online</a> come Esplora file con esercizi privati e pubblici, <a data-topic="versioni">versioni</a>, <a data-topic="cestino">Cestino</a> e <a data-topic="amministrazione">amministrazione</a>; questa guida con ricerca (F1).</li>
<li><b>1.1</b> — <a data-topic="crea-da-testo">Crea da testo</a> con apprendimento e spostamenti disegnati come copie trasparenti e tratteggiate; il foglio iniziale parte a 560 × 400; il login resta ricordato.</li>
</ul>` },
];


/* ===== interfaccia della guida (da SpikeCut) ===== */
/* ---------- interfaccia della guida: ricerca e argomenti ---------- */
const guideState = { current:'intro', query:'' };
const guideNorm = s=> String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function guidePlain(html){ const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g,' ').trim(); }
const guideIndex = GUIDE_TOPICS.map(t=>({ t, title: guideNorm(t.title), keys: guideNorm(t.keys||''), text: guideNorm(guidePlain(t.html)), plain: guidePlain(t.html) }));
function guideSearchResults(q){
  const terms = guideNorm(q).split(/\s+/).filter(w=>w.length>1);
  if(!terms.length) return null;
  const res = [];
  guideIndex.forEach(ix=>{
    let score = 0, ok = true;
    for(const w of terms){
      const inT = ix.title.includes(w), inK = ix.keys.includes(w), cnt = ix.text.split(w).length-1;
      if(!inT && !inK && !cnt){ ok = false; break; }
      score += (inT ? 10 : 0) + (inK ? 4 : 0) + Math.min(cnt, 5);
    }
    if(ok) res.push({ix, score, terms});
  });
  return res.sort((a,b)=> b.score-a.score);
}
function guideSnippet(ix, terms){
  const n = guideNorm(ix.plain); let pos = -1;
  for(const w of terms){ const p = n.indexOf(w); if(p>=0 && (pos<0 || p<pos)) pos = p; }
  if(pos<0) return '';
  const a = Math.max(0, pos-40), b = Math.min(ix.plain.length, pos+90);
  return (a>0?'…':'') + ix.plain.slice(a,b) + (b<ix.plain.length?'…':'');
}
function guideHighlight(root, terms){
  if(!terms || !terms.length) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const txt = node.nodeValue, n = guideNorm(txt);
    const hits = [];
    terms.forEach(w=>{ let p = n.indexOf(w); while(p>=0){ hits.push([p, p+w.length]); p = n.indexOf(w, p+w.length); } });
    if(!hits.length) return;
    hits.sort((x,y)=>x[0]-y[0]);
    const frag = document.createDocumentFragment(); let last = 0;
    hits.forEach(([s,e])=>{ if(s<last) return; frag.appendChild(document.createTextNode(txt.slice(last,s))); const m=document.createElement('mark'); m.className='guide-hit'; m.textContent=txt.slice(s,e); frag.appendChild(m); last=e; });
    frag.appendChild(document.createTextNode(txt.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}
function guideShow(id, keepScroll){
  const t = GUIDE_TOPICS.find(x=>x.id===id) || GUIDE_TOPICS[0];
  guideState.current = t.id;
  const box = document.getElementById('guideContent');
  box.innerHTML = (currentLang!=='it' ? `<div class="guide-note">${escapeHTML(translate('La guida è disponibile in italiano.'))}</div>` : '')
    + `<div class="guide-cat">${escapeHTML(t.cat)}</div><h2>${escapeHTML(t.title)}</h2>` + t.html;
  box.querySelectorAll('a[data-topic]').forEach(a=> a.onclick = (e)=>{ e.preventDefault(); guideShow(a.dataset.topic); guideRenderList(); });
  const terms = guideNorm(guideState.query).split(/\s+/).filter(w=>w.length>1);
  guideHighlight(box, terms);
  if(!keepScroll) box.scrollTop = 0;
  document.getElementById('guideTopic').value = t.id;
  guideRenderList();
  const first = box.querySelector('mark.guide-hit'); if(first && first.scrollIntoView) first.scrollIntoView({block:'center'});
}
function guideRenderList(){
  const host = document.getElementById('guideList'); host.innerHTML = '';
  const res = guideSearchResults(guideState.query);
  const item = (t, snip)=>{
    const d = document.createElement('div'); d.className = 'guide-item' + (t.id===guideState.current ? ' active' : '');
    d.textContent = t.title;
    if(snip){ const s = document.createElement('span'); s.className='guide-snip'; s.textContent = snip; d.appendChild(s); }
    d.onclick = ()=> guideShow(t.id);
    host.appendChild(d);
  };
  if(res){
    const h = document.createElement('div'); h.className='guide-cathead';
    h.textContent = res.length ? tpl('{n} argomenti trovati', {n:res.length}) : translate('Nessun argomento trovato: prova con altre parole.');
    host.appendChild(h);
    res.forEach(r=> item(r.ix.t, guideSnippet(r.ix, r.terms)));
  } else {
    let cat = null;
    GUIDE_TOPICS.forEach(t=>{ if(t.cat!==cat){ cat = t.cat; const h=document.createElement('div'); h.className='guide-cathead'; h.textContent = cat; host.appendChild(h); } item(t, null); });
  }
}
function openGuide(topicId){
  const sel = document.getElementById('guideTopic');
  if(!sel.options.length){
    let cat=null, grp=null;
    GUIDE_TOPICS.forEach(t=>{ if(t.cat!==cat){ cat=t.cat; grp=document.createElement('optgroup'); grp.label=cat; sel.appendChild(grp); } const o=document.createElement('option'); o.value=t.id; o.textContent=t.title; grp.appendChild(o); });
  }
  openModal('helpModal');
  guideShow(topicId || guideState.current);
  setTimeout(()=>{ const s=document.getElementById('guideSearch'); if(s && s.focus) s.focus(); }, 30);
}

document.getElementById('guideSearch').addEventListener('input', e=>{
  guideState.query = e.target.value;
  const res = guideSearchResults(guideState.query);
  if(res && res.length) guideShow(res[0].ix.t.id); else { guideShow(guideState.current, true); }
});
document.getElementById('guideSearch').addEventListener('keydown', e=> e.stopPropagation()); // i tasti della ricerca non attivano gli strumenti
document.getElementById('guideTopic').onchange = e=> guideShow(e.target.value);
window.addEventListener('keydown', e=>{ if(e.key==='F1'){ e.preventDefault(); openGuide(); } });
document.getElementById('helpModalClose').onclick = ()=> document.getElementById('helpModal').classList.remove('open');
setupOverlayClickClose(document.getElementById('helpModal'), ()=> document.getElementById('helpModal').classList.remove('open'));
document.getElementById('helpModal').addEventListener('keydown', e=>{ if(e.key==='Escape') document.getElementById('helpModal').classList.remove('open'); });

window.Pv4Guide = { open: openGuide };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
