const PRESET_ACTIONS = [

    // ============================
    // TECNICHE BASE – PALLEGGIO
    // ============================
    'Palleggio',
    'Palleggio in salto',
    'Palleggio sopra la testa',
    'Palleggio a destra',
    'Palleggio a sinistra',
    'Palleggio in avanti',
    'Palleggio indietro',
    'Palleggio rovesciato',
    'Palleggio veloce',
    'Palleggio lungo',
    'Palleggio corto',
    'Palleggio in bagher rovesciato',
    'Palleggio di emergenza',
    'Palleggio in tuffo',
    'Palleggio su palla staccata',
    'Palleggio su ricezione staccata',
    'Palleggio da seconda linea',
    'Palleggio su palla alta',
    'Palleggio preciso',
    'Palleggio in transizione',
    // aggiunte
    'Palleggio a una mano',
    'Palleggio in salto rovesciato',
    'Palleggio di prima intenzione',
    'Palleggio cieco',
    'Palleggio dietro la schiena',
    'Palleggio a spinta laterale',

    // ============================
    // TECNICHE BASE – BAGHER
    // ============================
    'Bagher',
    'Bagher laterale',
    'Bagher in avanzamento',
    'Bagher indietreggiando',
    'Bagher su diagonale',
    'Bagher su palla corta',
    'Bagher su palla lunga',
    'Bagher in tuffo',
    'Bagher di emergenza',
    'Bagher di contenimento',
    'Bagher di precisione',
    // aggiunte
    'Bagher in semituffo',
    'Bagher con una mano',
    'Bagher con pugno',
    'Bagher in estensione',

    // ============================
    // ATTACCO
    // ============================
    'Schiacciata',
    'Schiacciata di potenza',
    'Schiacciata in diagonale lunga',
    'Schiacciata in diagonale corta',
    'Schiacciata in parallela',
    'Schiacciata di seconda',
    'Schiacciata in pallonetto',
    'Schiacciata in roll-shot',
    'Attacco da zona 4',
    'Attacco da zona 2',
    'Attacco da zona 3',
    'Attacco dalla seconda linea',
    'Attacco pipe',
    'Attacco dopo copertura',
    // aggiunte
    'Attacco in pallonetto corto',
    'Attacco in pallonetto lungo',
    'Attacco mani-out',
    'Attacco sulla mano esterna',
    'Attacco contro il muro a tempo',
    'Attacco su palla spinta',
    'Attacco su palla staccata',
    'Attacco di recupero',
    'Attacco in controtempo',
    'Attacco in slap-shot',
    'Attacco dietro al muro avversario',
    'Roll-shot lungo',
    'Roll-shot corto',
    'Pallonetto tattico',

    // ============================
    // ALZATA / SETTAGGIO
    // ============================
    'Alzata',
    'Alzata verso posto 4',
    'Alzata verso posto 2',
    'Alzata dal centro',
    'Alzata di seconda intenzione',
    'Alzata spinta',
    'Alzata tesa',
    'Alzata alta',

    // ============================
    // MURO
    // ============================
    'Muro',
    'Muro a uno',
    'Muro a due',
    'Muro a tre',
    'Muro su primo tempo',
    'Muro su secondo tempo',
    'Muro su palla alta',
    'Muro su palla staccata',
    'Muro in diagonale',
    'Muro in parallela',
    'Muro in lettura',
    'Muro di contenimento',
    // aggiunte
    'Muro a tempo',
    'Muro in ritardo',
    'Muro in anticipo',
    'Muro su fast',
    'Muro su slide',
    'Muro su pipe',
    'Muro su attacco di seconda',
    'Muro chiuso',
    'Muro aperto',
    'Muro a ombrello',
    'Muro di mano esterna',
    'Muro di mano interna',
    'Muro di ricostruzione',

    // ============================
    // BATTUTA
    // ============================
    'Battuta',
    'Battuta float',
    'Battuta float in salto',
    'Battuta in salto spin',
    'Battuta tattica in zona',
    'Battuta corta',
    'Battuta lunga',
    'Battuta su ricevitore specifico',
    // aggiunte
    'Battuta jump-float',
    'Battuta flottante corta',
    'Battuta flottante lunga',
    'Battuta spin diagonale',
    'Battuta spin parallela',
    'Battuta di sicurezza',
    'Battuta forzata',

    // ============================
    // RICEZIONE / DIFESA
    // ============================
    'Ricezione',
    'Ricezione a 3',
    'Ricezione a 4',
    'Ricezione su float',
    'Ricezione su spin',
    'Difesa',
    'Difesa in tuffo',
    'Difesa in sprawl',
    'Difesa diagonale',
    'Difesa parallela',
    'Difesa sul pallonetto',
    'Difesa su attacco forte',
    'Difesa in rotazione',
    'Copertura dell’attacco',
    // aggiunte
    'Ricezione profonda',
    'Ricezione corta',
    'Ricezione in bagher laterale',
    'Ricezione con scivolamento',
    'Ricezione in emergenza',
    'Ricezione con un braccio',
    'Ricezione con cambio posizione',
    'Difesa di recupero',
    'Difesa in estensione',
    'Difesa in semituffo',
    'Difesa con una mano',
    'Difesa con pugno',
    'Difesa a muro',
    'Difesa su pallonetto lungo',
    'Difesa su tocco morbido',
    'Difesa da zona 1',
    'Difesa da zona 6',
    'Difesa da zona 5',

    // ============================
    // MOVIMENTI
    // ============================
    'Spostamento laterale',
    'Movimento in avanti',
    'Movimento indietro',
    'Rotazione',
    'Salto',
    'Caduta controllata',
    'Spostamento a incrocio',
    'Passo di caricamento',
    'Approach a 3 passi',
    'Approach a 4 passi',
    'Riposizionamento rapido',
    'Scivolamento difensivo',

    // ============================
    // SITUAZIONI DI GIOCO
    // ============================
    'Contrattacco',
    'Ricostruzione del gioco',
    'Difesa in linea',
    'Posizionamento difensivo',
    'Copertura del muro',
    'Cambio in campo',
    'Cambio palla',
    'Side-out',
    'Rally',
    'Break point',
    'Transizione attacco-difesa',
    'Transizione difesa-attacco',
    'Timeout',
    'Fine set',
    'Inizio set',
    'Rotazione posizioni',
    // aggiunte
    'Copertura della pipe',
    'Copertura della fast',
    'Organizzazione muro-difesa',
    'Shift difensivo',
    'Doppia difesa su attacco forte',
    'Transizione rapida',
    'Transizione complessa',

    // ============================
    // ESERCIZI SPECIFICI
    // ============================
    'Esercizio di palleggio',
    'Esercizio di bagher',
    'Esercizio combinato',
    'Circuito tecnico',
    'Esercizio di velocità',
    'Esercizio di resistenza',
    'Riscaldamento generale',
    'Riscaldamento tecnico',
    'Stretching',
    'Propriocezione',
    'Potenziamento arti superiori',
    'Potenziamento arti inferiori',
    'Core training',
    'Mobilità articolare',

    // ============================
    // GESTIONE CAMPO / LOGISTICA
    // ============================
    'Allestimento campo',
    'Spostamento attrezzi',
    'Raccolta palloni',
    'Organizzazione file',
    'Briefing iniziale',
    'Debrief finale',
    'Pausa idrica',
    'Coaching individuale',
    'Analisi video',
    'Correzione tecnica',
    // aggiunte
    'Chiamata palla',
    'Chiamata muro',
    'Chiamata diagonale',
    'Chiamata parallela',
    'Check posizione',
    'Contestazione arbitrale (formale)',
    'Richiesta videocheck',

    // ============================
    // RUOLI SPECIFICI
    // ============================
    'Azione del palleggiatore',
    'Azione del libero',
    'Azione del centrale',
    'Azione dell’opposto',
    'Azione dello schiacciatore',
    'Azione del mister',

];
