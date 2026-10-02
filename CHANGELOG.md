# Changelog

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
