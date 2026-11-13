# Changelog

La versione e il mese di rilascio si trovano in `data/configuration/layout.js` (`APP_VERSION`, `APP_RELEASE`)
e compaiono nella barra di stato ("VBProW4 by SpikeCode AI · Ott 2026 · Ver: 1.3.0"), nella finestra
Informazioni e nella guida (Riferimento → Novità). A ogni rilascio vanno aggiornati insieme a questo file
e a `package.json`.

## 1.14.2 — Nov 2026

- **Scout partita, formazioni corrette**: la *Formazione automatica* schiera sempre il sestetto 5-1 — 1 palleggiatore,
  2 bande, 2 centrali, 1 opposto — più i liberi. Prima poteva mettere due palleggiatori e lasciare fuori una banda:
  il ruolo si leggeva solo dalla sigla e chi in rosa aveva la sigla *Altro* (es. la seconda banda importata) era preso
  per **O = Opposto**. Ora il ruolo si legge prima dal ruolo esteso (Palleggiatore, Schiacciatore, Centrale…), poi
  dalla sigla esatta; se un ruolo manca si usa un giocatore di movimento rimasto e lo si segnala.
- Sotto ogni squadra un **avviso** indica se il sestetto ha due palleggiatori o se manca una banda, un centrale o
  l'opposto; *Inizia set* chiede conferma in quel caso.
- Elenco a comparsa: prima i giocatori del ruolo della riga (es. le bande sulla riga S), lo staff non compare, il
  giocatore già in quella riga non risulta «già in formazione».

## 1.14.1 — Nov 2026

- **Frecce più semplici**: non si sceglie più tra Lineare e Curva. La freccia nasce **dritta** e si curva trascinando
  il **perno arancione**, che ora sta sulla linea a metà (prima era fuori linea e sulle frecce lineari non serviva): la
  curva passa esattamente sotto il mouse e mantiene la forma quando si spostano i giocatori collegati. Riportando il
  perno sulla linea, con doppio clic sul perno o con **↺ Raddrizza** torna dritta. Con lo Zigzag il perno non compare.
  Le frecce già salvate restano come erano (le lineari dritte, le curve con la stessa curva).
- Pannello **Freccia** riordinato: campi allineati a sinistra e a tutta larghezza, *Forma* con Linea · Zigzag ·
  Raddrizza, punte su una riga; stesso ordine per il pannello del disegno a mano libera.
- Curvare una freccia è un solo passo di Annulla (prima ne salvava due, uno come «posizione oggetto»).

## 1.14.0 — Nov 2026

- **Pulsante ＋** (accanto alle schede e in alto): menu con le stesse scelte della schermata «Nessuno schema aperto» —
  schema vuoto, apri dalla libreria, da file, crea da testo, lavagna, genera allenamento, piano allenamento.
- **Compilazione guidata** 🧭 dei dati dell'esercizio (scheda *Esercizio*), in 5 passi con pulsanti grandi: nome, data e
  luogo · genere, categoria, gruppo, ruolo · periodo e tipologia · serie, ripetizioni, tempo e recupero (± rapidi) ·
  note. Si apre per ogni nuovo schema vuoto e all'avvio se lo schema è vuoto e non compilato; *Salta*, riapertura dal
  pulsante nella scheda Esercizio, opzione per non aprirla in automatico. Scrive nei campi veri (salvataggio e libreria
  invariati); il nome diventa il nome della scheda e il titolo.
- **Archivio squadre** (finestra *Squadra*): salva la rosa con un nome, ricaricala, eliminala; nell'anteprima di
  importazione la nuova scelta *Salva come squadra in archivio* (es. avversari da PDF/Excel/incolla) non tocca la rosa.
- **Scout partita**: per Casa e Ospiti si sceglie la *Squadra* (la rosa o una dell'archivio); clic sul numero o sul
  nome di una zona apre l'elenco dei giocatori (filtro scrivendo, frecce e Invio, già in formazione in grigio) che
  compila numero, nome e ruolo e passa alla riga dopo; *Formazione automatica* anche per gli ospiti.
- Corretto: ＋ da «Nessuno schema aperto» creava **due schede** (si usa la scheda vuota già pronta).
- Corretto: i menu con ricerca della scheda Esercizio non mostravano il valore dopo un cambio di scheda o un caricamento.

## 1.13.1 — Nov 2026

- **Importa giocatori con copia e incolla**: copia le righe da **Excel, Google Fogli, Google Documenti, Word,
  LibreOffice, pagine web, WhatsApp o email** e premi **Ctrl+V** (⌘V) nella finestra *Squadra* (nel riquadro o in un
  punto qualsiasi) oppure il nuovo pulsante **📋 Incolla**: si apre subito l'anteprima.
  - dagli appunti si usa la tabella vera (HTML) quando c'è: le colonne restano separate anche da Google Documenti e
    Word, le celle con «a capo» restano una cella, le celle unite non spostano le colonne;
  - elenchi puntati e paragrafi diventano una riga per giocatore; righe-titolo come «Convocati sabato:» sono saltate;
  - anche un'immagine copiata (es. screenshot di un elenco) viene letta come una foto;
  - nel riquadro di testo una parola o una riga sola si incolla normalmente, per scrivere a mano.

## 1.13.0 — Nov 2026

- **Importa giocatori** (finestra *Squadra*) da qualsiasi fonte, con **anteprima** prima della conferma:
  - file **Excel/ODS** (sceglie da solo il foglio con i giocatori, si può cambiare), **CSV** (anche salvati da Excel con
    accenti), **PDF** con tabelle o elenchi, **Word .docx** (tabelle e paragrafi), **testo**, **JSON** e **foto o
    scansioni** di un foglio scritto o stampato (lettura del testo nel browser);
  - testo incollato da WhatsApp, email, Word: una riga per giocatore, campi in qualsiasi ordine; resta valido il vecchio
    formato `P1.4.Mario Rossi`;
  - riconosce numero, nome e cognome (anche in due colonne, MAIUSCOLO sistemato), ruolo in italiano, inglese e francese
    (palleggiatore, banda, centrale, opposto, libero, staff), data o anno di nascita (anche date di Excel), altezza
    (185, 1.85, 1,85 m), email, telefono e note; salta titoli e intestazioni;
  - anteprima: colonne del file con il loro significato modificabile, intestazione sì/no, numero, nome e ruolo
    correggibili, righe escludibili, *Aggiungi alla rosa* (stesso numero = aggiornato, la foto resta) o *Sostituisci
    tutta la rosa*; avvisi per numero mancante o ripetuto ed esito per riga (Nuovo / Aggiorna #7 …);
  - le sigle P1/P2, S1/S2, C1/C2, O, L1/L2, All… sono assegnate senza doppioni (gli altri diventano *Altro*), così
    la rosa è pronta anche per lo Scout partita.
- La rosa mostra i dettagli sotto il nome (ruolo esteso, nascita, altezza, contatti).
- Corretto **✏️ Modifica** nella rosa: andava in errore.

## 1.12.1 — Nov 2026

- **Finestre reattive**: trascinandole o ridimensionandole dai bordi seguono subito il mouse. Prima l'effetto di
  animazione era sempre attivo su tutte le proprietà (anche posizione e dimensioni), così la finestra arrivava con
  0,25 s di ritardo; ora l'animazione morbida resta solo per Ingrandisci/Ripristina.

## 1.12.0 — Nov 2026

- **Nuova categoria 🏋️ Palestra e pallavolo** in *Campo e oggetti…*: 33 disegni vettoriali a colori, nitidi a ogni
  zoom e in stampa, disponibili sia in 2D sia in 3D:
  - **pallavolo**: pallone giallo-blu e bianco-azzurro, carrello e cesto dei palloni, macchina lanciapalloni, antenna,
    seggiolone dell'arbitro, tabellone segnapunti, paletta del cambio, bersaglio a terra, maglia, ginocchiere, scarpa;
  - **palestra**: cono, cinesino giallo e rosso, ostacolo, cerchio, scaletta agility, step/box, pedana, materassino,
    panca, palla medica, manubrio, kettlebell, elastico, corda per saltare, fischietto, cronometro, lavagnetta tattica,
    borraccia, asciugamano.
  Nascono a metà della dimensione naturale e si ridimensionano come gli altri oggetti; si rigenerano con
  `scripts/gym-svg.py`.
- **16 nuove icone** in *Testo e icone*: pesi, corsa, camminata, spostamenti, obiettivo, bandierina, scheda, clessidra,
  ripeti, esplosività, intensità, pausa acqua, gruppo, mano/stop, progressione, attenzione.

## 1.11.0 — Nov 2026

- **Campi a sole linee in prospettiva** nella categoria ✍️ Stile schizzo (*Campo e oggetti…*): disegni vettoriali del
  campo 18 × 9 m con linee dei 3 m, linea centrale, rete con aste e antenne, in tre viste:
  - **in prospettiva**: da dietro la linea di fondo, con la profondità (la metà lontana si stringe verso la rete);
  - **di sbieco**: visto dal lato, con il campo inclinato;
  - **in diagonale**: dall'alto, con il campo ruotato.
  Come il campo schizzo si adattano al foglio, restano sotto agli altri oggetti e convertendo in 3D diventano il Campo 3D.
  Sono generati in proiezione prospettica da `scripts/court-svg.py` (per rifarli con altre viste).

## 1.10.0 — Nov 2026

- **Scout partita** (stile DataVolley, fase 1) in una nuova finestra (barra a sinistra → Allenamento, File → Scout partita):
  - **formazioni** delle due squadre per zona (numero, nome, ruolo), casa **dalla rosa** (P1/P2, S1, S2, O, C1, C2,
    liberi), rotazione di partenza **P1…P6** (zona del palleggiatore), due liberi, chi batte per primo;
  - **campo** con le 6 zone per squadra: numero, nome e ruolo; il **libero** sostituisce il centrale in seconda linea
    (in zona 1 batte il centrale); evidenziati battitore e palleggiatore;
  - **clic sul giocatore** → un arco a 6 spicchi con le valutazioni `=` (errore, rosso) `/ - ! +` `#` (perfetto/punto,
    verde); il fondamentale è dedotto dalla fase (battuta → ricezione → alzata, aperta da sola sul palleggiatore →
    attacco → difesa/muro); si cambia con pressione lunga o tasto destro, clic sul centro dell'arco o tasti S R E A B D F;
  - da 1 a 3 tocchi per squadra, il muro non conta come tocco; **punteggio, break point, cambio palla e rotazione**
    automatici; fine set a 25 (15 al quinto) con 2 punti di scarto, partita a 3 set vinti; punto a mano (+1);
  - **registro dei codici** DataVolley (`*7RH#`, `a12AH+`, `*p03:02`, `*z6`, `**1set`), codici scritti a mano nel
    campo Codice, **Annulla** (Ctrl+Z) e scorciatoie (`= / - ! + #` o 1…6 con l'arco aperto, Esc);
  - lo scout è **salvato con lo schema** (file .json, libreria, allenamento, salvataggio automatico).
- Prossime fasi: zone d'arrivo con un terzo clic, tipi di battuta e attacco, statistiche ed export CSV.

## 1.9.1 — Nov 2026

- **⟲ Vista** sotto la sfera 3D: un clic rimette la vista 3D standard (foglio inclinato di 40°). Il ritorno alla vista
  c'era già (doppio clic sulla sfera, ⟲ 3D nella barra in basso, ⟲ nel pannello Vista 3D) ma non si vedeva; ora tutti
  riportano alla vista 3D standard invece che al foglio piatto (il foglio piatto è il 2D).
- La modalità 2D/3D è applicata già all'avvio (prima la galleria e la sfera si aggiornavano solo aprendo la galleria).

## 1.9.0 — Nov 2026

- **Disegno 2D o 3D** per ogni schema, con i pulsanti **2D · 3D** nella barra in alto:
  - **2D**: foglio piatto, galleria con disegni, figure, stile schizzo e campi piani; vista 3D (pannello, sfera,
    azzeramento) nascosta;
  - **3D**: foglio inclinato con sfera e pannello Vista 3D, galleria con gli oggetti 3D e sfondo Campo 3D;
  - giocatori, rete, coni, testi e icone restano in tutte e due; gli schemi già salvati prendono la modalità dal
    contenuto (oggetti 3D, campo 3D o foglio inclinato = 3D).
- **⇄ in 3D / ⇄ in 2D**: converte il disegno (palloni piani ↔ pallone 3D, figure disegnate → giocatori con lettera,
  campo schizzo e campo intero ↔ Campo 3D, foglio inclinato ↔ piatto). Un solo passo di Annulla, che ora riporta anche
  modalità, sfondo e inclinazione del foglio.
- **Cancella tutto**: nella barra a sinistra (sezione Modifica) e nel menu del tasto destro sul foglio, con conferma;
  si annulla con Ctrl+Z.
- Con la griglia accesa gli sfondi del campo (Metà, Intero, Campo 3D) si vedono sotto la griglia: prima la griglia li
  copriva del tutto.

## 1.8.1 — Nov 2026

- **Trascinamento dalla galleria più affidabile**: prendendo un elemento dalla miniatura (es. i disegni dello stile
  schizzo) il browser trascinava l'immagine come file e il foglio la scartava, quindi a volte il rilascio non inseriva
  nulla. Ora l'elemento viene sempre riconosciuto, e si può rilasciare anche sulla zona scura attorno al foglio
  (l'oggetto entra dal bordo più vicino).

## 1.8.0 — Nov 2026

- **Stile schizzo** (nuova categoria in *Campo e oggetti…*): disegni a mano vettoriali (SVG) ricavati da un'illustrazione,
  con i tratti originali: campo completo con la rete, attaccante, giocatore a muro (rete tolta, gambe, maglietta e
  pantaloncini ricalcati sul disegno), quattro difensori e pallone. Sfondo trasparente, nessun filtro colore; il campo
  si adatta al foglio e resta sotto agli altri oggetti.
- **Caratteri a mano per i testi**: Nanum Pen Script, Schoolbell e Architects Daughter (file locali in `data/fonts`,
  licenze OFL / Apache), scelti dal pannello Proprietà.
- **Evidenziatore**: pennellata colorata dietro i testi e alone trasparente sotto le frecce (colore della freccia o a
  scelta), dal pannello Proprietà; resta salvato nello schema e si annulla con Ctrl+Z.

## 1.7.0 — Ott 2026

- **Responsive come spikeengine / SpikeCut** (telefono, tablet, schermi piccoli):
  - **barra in alto adattabile**: i gruppi che non ci stanno passano nel menu **»** dal meno importante (zoom, stato
    di salvataggio, nuovo/carica/guida, titolo, annulla, libreria, account) e tornano al loro posto quando c'è spazio;
    prima su schermi stretti alcuni comandi (zoom, storico, Carica) sparivano;
  - **≤ 820 px o telefono girato**: barra degli strumenti a sole icone, pannello di destra a **cassetto** sopra il foglio
    (chiuso all'avvio, si apre con la linguetta, si richiude con la linguetta o toccando il foglio);
  - **telefono**: tutte le finestre a tutto schermo (anche Libreria e Guida, con cartelle sopra ed elenco sotto),
    griglie su una colonna, barra di stato scorrevole, foglio adattato allo schermo all'avvio e girando il telefono;
  - **tocco** sul foglio: un dito = mouse (seleziona, trascina, disegna), due dita = zoom e spostamento, pressione lunga
    = menu del tasto destro, doppio tocco = doppio clic; intestazioni delle finestre e maniglie dei pannelli si
    trascinano con il dito; pulsanti più grandi con il dito;
  - la pagina occupa l'altezza visibile del telefono (`100dvh`): la barra di stato non finisce più fuori schermo.
- Guida: nuovo argomento «Telefono e tablet».

## 1.6.4 — Ott 2026

- **Barre di scorrimento a scomparsa** (come macOS, VS Code, Office): sottili e invisibili finché non passi con il
  mouse sul riquadro, non ci stai lavorando dentro (focus) o non stai scorrendo; poco dopo spariscono di nuovo.
  Lo spazio resta riservato, quindi il contenuto non si sposta. Vale per barra strumenti, pannello, finestre, menu e
  liste (Chrome, Edge, Safari e Firefox).

## 1.6.3 — Ott 2026

- **Avvio pulito**: ricaricando la pagina (anche con Ctrl+F5) non compare più per un attimo la vecchia impaginazione
  dell'HTML (sfondo blu, scheda «Schema 1 / + Nuovo», quadratino al centro) prima della grafica vera: finché l'app non
  è pronta si vede una schermata di caricamento scura con il pallone. La finestra di accesso resta visibile come prima.

## 1.6.2 — Ott 2026

- **Finestre ridotte a icona**: il pulsante «−» manda la finestra in una barra in basso a sinistra (icona e titolo);
  un clic la riapre, dentro lo schermo. Prima l'icona finiva nella vecchia barra in fondo, che non esiste più, e la
  finestra spariva. Riaprendo la finestra dal menu l'icona sparisce; ogni finestra viene tenuta dentro lo schermo.
- **Pannelli laterali come SpikeCut**: maniglia di ridimensionamento tra barra strumenti e foglio e tra foglio e
  pannello (trascina = larghezza, doppio clic = nascondi; le larghezze restano dopo la ricarica); la barra strumenti
  stretta passa da sola alla modalità a icone. Le linguette ‹ › sono attaccate al bordo del pannello, lo seguono
  mentre lo ridimensioni o lo chiudi e restano sotto le finestre.
- **Schermi 4:3 e non molto larghi** (1024×768, 1280×1024, 1366×768…): la barra in alto non si sovrappone più ai
  menu File/Stampa/Strumenti (zoom, storico e «Carica» restano nei menu e nelle scorciatoie), la firma con la
  versione nella barra di stato resta leggibile.

## 1.6.1 — Ott 2026

- **Sicurezza**: tolto dal repository e dal sito `data/users.json`, il vecchio elenco utenti del sistema di accesso
  precedente (non più usato dall'app), che veniva pubblicato ed era scaricabile da chiunque. Aggiunto a `.gitignore`.
  La pubblicazione successiva lo cancella anche dal server.

## 1.6.0 — Ott 2026

- **Link condivisi (slug)**: 🔗 Condividi (barra in alto e a sinistra, File, Piano allenamento, Genera allenamento) crea un
  link di sola consultazione `…/v/<slug>` dell'allenamento (dal Piano allenamento o dalle schede aperte) o del singolo
  esercizio. Chi lo apre vede solo quello, senza account: indice con i link agli esercizi, disegni ingrandibili,
  descrizione, step, durata, video, intestazione e gruppi del piano; stampa; «Apri in VolleyProW4» ne copia gli esercizi
  nel proprio editor. Anteprima del link sui social (titolo, descrizione, primo disegno), pagine non indicizzate.
  Aggiornamento dello stesso link, «I miei link condivisi» con visite, copia ed eliminazione.
  - Server: `cloud/share_save.php`, `share_upload_image.php`, `share_get.php`, `share_image.php`, `share_list.php`,
    `share_delete.php`; dati in `library/shares/`; pagina `v/index.php` (con `v/.htaccess` per gli indirizzi `/v/<slug>`).
- **Lavagna — sistemi di gioco**: ricezione a 5 (W), a 4, a 3, a 2 (disposizioni regolari calcolate per ogni rotazione);
  muro e difesa in break point 2-0-4, 2-1-3 (6 avanzato), 2-1-3 rotazionale, 3-0-3, 3-1-2, 3-2-1, 1-2-3 contro l'attacco
  avversario da posto 4, al centro o da posto 2; copertura dell'attacco (posto 4, primo tempo, posto 2, pipe);
  «tutte le combinazioni»; spiegazione del sistema nell'anteprima e negli step.

## 1.5.0 — Ott 2026

- **Lavagna** (barra a sinistra → Allenamento, File → Lavagna, schermata «Nessuno schema aperto»): dispone in automatico
  i 6 giocatori del sistema 5-1 (P, O, S1, S2, C1, C2 e libero al posto del centrale in seconda linea) per ogni
  rotazione P1…P6 e fase di gioco: posizioni di partenza, break point (partenza in battuta, muro e difesa,
  contrattacco) e side out (ricezione a 3, attacco dopo la ricezione).
  - Campo intero (anche con la squadra avversaria nella fase corrispondente) o metà campo, orizzontale o verticale.
  - Spostamenti dalla fase precedente con copie tratteggiate e frecce; tutte le rotazioni e/o tutte le fasi in
    altrettante schede, con nome, descrizione e step.
  - Anteprima con controllo delle regole di posizione (le ricezioni proposte sono tutte regolari).
  - Richiesta a parole: «P3 ricezione a metà campo», «tutte le rotazioni in break point», «difesa P5 con avversari».

## 1.4.1 — Ott 2026

- **Anteprima dei link**: condividendo l'indirizzo dell'app su Facebook, WhatsApp, LinkedIn, Telegram, X ecc.
  compaiono titolo, descrizione e immagine (meta Open Graph e Twitter completi, URL canonico, lingua, colore del
  tema). Nuova immagine di anteprima `data/images/og-image.jpg` (1200×630).

## 1.4.0 — Ott 2026

- **Piano allenamento** (barra a sinistra → Allenamento, File → Piano allenamento…, schermata iniziale): la scheda
  completa della seduta come quelle delle società — intestazione (squadra, stagione, categoria, campionato, periodo,
  palestra, n° allenamento, durata), obiettivo, caratteristiche prestative, materiale occorrente, Fase Analitica /
  Sintetica / Globale con blocchi a titolo ed esercizi (Nr · Esercizio · G · R · quantità · Dettagli), gruppi.
  - **Importa da PDF**: legge un piano con questa struttura (colonne dalle intestazioni, righe, elenchi puntati,
    blocchi, tabelle che continuano sulla pagina dopo, gruppi).
  - **Disegni degli esercizi**: «✏️ Disegna» apre una scheda collegata da disegnare a mano; «✨ Auto» e
    «Disegna tutti gli esercizi» li prendono dalla libreria se corrispondono, altrimenti li creano in automatico;
    si può anche collegare una scheda già aperta.
  - **PDF dell'allenamento** con la stessa impaginazione (tabelle, fasi colorate, blocchi grigi, gruppi) e i
    **disegni annessi** (ritagliati sul contenuto, con il rimando «disegno D1» nella tabella e i link dei video).
  - **Salva / Apri (.json)** del piano insieme ai suoi disegni; il piano è anche salvato da solo nel browser.
- **Video nel disegno** (barra a sinistra → Video…): YouTube (anche Shorts e minuto di partenza), Vimeo, file
  dal computer o qualunque link, con anteprima, titolo e ▶; doppio clic per guardarlo; il link compare nei PDF.
- Genera allenamento: schema tipo scelto in base al maggior numero di parole chiave; nuovi schemi «minicampo»
  e «rincorsa»; «difesa senza muro» ora dà la difesa.
- Crea da testo: due passaggi uguali tra gli stessi giocatori non si sovrappongono più.

## 1.3.2 — Ott 2026

- **Nessuno schema aperto** (come SpikeCut): chiudendo l'ultima scheda o tutte le schede compare una schermata
  con Nuovo schema, Apri dalla libreria, Apri da file, Crea da testo, Genera allenamento; resta anche
  ricaricando la pagina.
- **Tratteggio sugli oggetti già inseriti**: «⚡ Tratteggiato» nel pannello Proprietà non faceva nulla (funzione
  mancante); ora tratteggia o rende continuo il bordo degli oggetti (e della freccia) selezionati. Anche
  «Tratteggio» nella barra a sinistra (D) agisce sulla selezione; senza selezione vale per i nuovi oggetti.
- Dopo il ripristino delle schede un nuovo schema poteva ricevere lo stesso numero di una scheda esistente.

## 1.3.1 — Ott 2026

- Si può chiudere anche l'ultima scheda (resta uno schema nuovo vuoto); pulsante **✕ Chiudi tutte** a destra
  delle schede e tasto destro su una scheda (Chiudi scheda, Chiudi le altre, Chiudi tutte), con una sola
  conferma se c'è del lavoro aperto.
- **Scheda PDF** dell'allenamento di nuovo a portata di mano: pulsante nella barra a sinistra (Allenamento) e
  nella finestra Genera allenamento, oltre a Stampa → Scheda allenamento (PDF).
- PDF dell'allenamento: intestazione con nome e obiettivo, parte (analitica/sintetica/globale) di ogni
  esercizio, disegno catturato alla misura reale del foglio (prima piccolo in un riquadro vuoto), step
  stampati come testo (prima «[object Object]»).

## 1.3.0 — Ott 2026

- **Genera allenamento**: si descrive cosa si vuole nella parte analitica, sintetica e globale (un esercizio
  per riga); per ogni richiesta si usa l'esercizio della libreria che corrisponde (nome, descrizione, step),
  altrimenti viene creato in automatico con il disegno (Crea da testo o schema tipo per parola chiave).
  Durata, serie e recupero vengono letti dalla riga; la tipologia è impostata da sola. Nuova API
  `cloud/search_index.php`.
- Pulsante **⟲ 3D** nella barra di stato (e doppio clic sulla sfera) per azzerare la vista 3D.
- Il salvataggio automatico non mostra più messaggi quando riesce (solo in caso di errore).
- Mese di rilascio e versione nella barra di stato, come in SpikeCut; versione allineata in guida,
  Informazioni e `package.json`.
- Profilo utente nell'account (`cloud/profile.php`); ruolo e voce Amministrazione visibili.

## 1.2.0 — Ott 2026

- Account veri come SpikeCut (registrazione, accesso, recupero password, sessione ricordata).
- Libreria esercizi online in stile Esplora file: esercizi privati e pubblici, cartelle, Cestino,
  appunti, Sposta in…/Copia in…, Proprietà, versioni con versioni fissate, amministrazione.
- Guida con ricerca (F1).
- Crea da testo: esercizio disegnato da una descrizione, con apprendimento; spostamenti dello stesso
  giocatore come copie trasparenti e tratteggiate.
- Correzioni: login non ricordato, foglio iniziale 100×100, nuovo schema in errore, metà campo con le linee
  del campo intero.

## 1.1.0 — Interfaccia in stile SpikeCut

### Layout
- Nuova interfaccia con la stessa struttura di SpikeCut: topbar 46px con menu **File ▾ / Stampa ▾ / Strumenti ▾ / ⋯**,
  barra delle schede, **rail** strumenti a sinistra (sezioni, icona + nome + tasto rapido, compattabile con ☰),
  **pannello a schede** a destra (Proprietà · Step · Esercizio) e **status bar** con coordinate e interruttori di vista.
- Galleria a scomparsa "Giocatori…" (G) e "Campo e oggetti…" (E) con ricerca: clic = aggiunge al centro, trascina = posiziona.
- Finestre di dialogo e menu contestuale scuri con pulsanti color ottone.
- Ogni comando compare in un solo posto (prima molti erano ripetuti tra toolbar e menu).
- File nuovi: `data/configuration/layout.js`, `components/layout/spikelayout.class.js`, `css/spikecut-theme.css`.
  Rimosso `data/configuration/toolbar.js` (sostituito da `layout.js`).

### Correzioni
- Colore dei giocatori non modificabile (arancione/verde salvati come nomi CSS; il picker ascoltava `click` invece di `input/change`).
- Click su un elemento della sidebar senza effetto (`addComponent` non esisteva).
- "Ripeti" non funzionava dopo "Annulla"; "Annulla" non ripristinava il colore (storico che condivideva gli oggetti).
- Griglia / B-N / sfondo riportavano il foglio a 100×100.
- Colore frecce non modificabile; punte inizio/fine non collegate.
- Selettore formato foglio senza effetto.
- Finestra Macro: errore all'apertura (`#playbackSpeedSlider` mancante).
- Voci di menu che chiamavano funzioni inesistenti (Salva allenamento, Genera scheda).
- Doppia dichiarazione di `LoginManager` (errore in console); pulsante "Registra .glb" creato tre volte.
- Traduzioni mancanti per titoli e pulsanti delle finestre (comparivano le chiavi, es. `bt_cancel`).
