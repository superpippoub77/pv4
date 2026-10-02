# Changelog

La versione e il mese di rilascio si trovano in `data/configuration/layout.js` (`APP_VERSION`, `APP_RELEASE`)
e compaiono nella barra di stato ("VBProW4 by SpikeCode AI · Ott 2026 · Ver: 1.3.0"), nella finestra
Informazioni e nella guida (Riferimento → Novità). A ogni rilascio vanno aggiornati insieme a questo file
e a `package.json`.

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
