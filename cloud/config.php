<?php
/**
 * Configurazione della libreria progetti e degli account utente.
 *
 * $API_KEY: se valorizzata, tutte le chiamate all'API dovranno includere
 * l'header "X-Api-Key" con lo stesso valore, altrimenti verranno rifiutate.
 * Lasciala vuota ('') per un uso interno/fidato senza questa protezione
 * aggiuntiva (l'accesso alla libreria resta comunque protetto dal login
 * utente descritto sotto).
 *
 * Se attivi una chiave qui, ricordati di impostarla anche nel file HTML
 * dell'editor (costante API_KEY in cima al blocco <script>).
 */
$API_KEY = '';

// Cartella dove vengono salvati i progetti (un file .json per progetto
// più un indice). Deve essere scrivibile dal server web.
define('LIBRARY_DIR', __DIR__ . '/../library');
define('INDEX_FILE', LIBRARY_DIR . '/index.json');
define('FOLDERS_FILE', LIBRARY_DIR . '/folders.json');

// Cartella dove vengono salvati gli account utente (un unico file indice,
// nessun database richiesto). Deve essere scrivibile dal server web e,
// come per LIBRARY_DIR, non è mai raggiungibile direttamente via URL.
define('USERS_DIR', __DIR__ . '/../users');
define('USERS_INDEX_FILE', USERS_DIR . '/index.json');

// Dimensione massima accettata per un progetto (bytes). Alzala se prevedi
// di allegare immagini di riferimento grandi.
define('MAX_PAYLOAD_BYTES', 15 * 1024 * 1024); // 15 MB
/**
 * DATABASE
 * Utenti, indice dei progetti e cartelle stanno in un database; i disegni
 * restano file JSON nella cartella library (con le loro versioni).
 *  - 'sqlite' (predefinito): un unico file, nessuna configurazione. Al primo
 *    avvio importa da solo i dati dai vecchi file JSON (che vengono rinominati
 *    in *.migrated-AAAAMMGG, non cancellati).
 *  - 'mysql': per il futuro. Compila DB_DSN, DB_USER e DB_PASS con i dati del
 *    pannello Aruba (es. 'mysql:host=sqlXXXX.aruba.it;dbname=Sql1234567_1;charset=utf8mb4').
 *  - 'json': i vecchi file JSON (protetti dalle scritture contemporanee).
 * Se il driver del database scelto manca, si torna automaticamente a 'json'.
 */
/**
 * AMMINISTRATORI
 * Nomi utente che possono aprire la finestra "Amministrazione" dell'app (stato
 * del database, elenco di tutti gli utenti). Esempio: ['filippo'].
 * Se l'elenco è vuoto, è amministratore il PRIMO utente registrato.
 * Gli amministratori possono anche rendere pubblico o privato qualunque
 * progetto con proprietario (dalla finestra Amministrazione); i progetti
 * generici restano sempre pubblici.
 */
define('ADMIN_USERS', []);
define('STORAGE', 'sqlite');
define('SQLITE_FILE', LIBRARY_DIR . '/pv4.sqlite');
define('DB_DSN', '');
define('DB_USER', '');
define('DB_PASS', '');
define('DB_BACKUP_DAYS', 7); // copie di sicurezza giornaliere del database SQLite conservate

// Quante versioni precedenti di ciascun progetto restano conservate nella
// cronologia (le più vecchie oltre questo numero vengono eliminate ad ogni
// nuovo salvataggio, per non far crescere la libreria all'infinito).
define('MAX_VERSIONS_PER_PROJECT', 30);

/**
 * ACCESSO CON JWT (JSON Web Token)
 * Il login non usa più sessioni/cookie: dopo l'accesso il server firma un
 * token che il browser conserva e ripresenta ad ogni richiesta (header
 * "Authorization: Bearer <token>"). Il server verifica solo la firma, senza
 * dover tenere nulla in memoria — tranne un piccolo controllo che permette
 * comunque un logout reale (vedi tokenValidAfter in common.php).
 *
 * La chiave segreta con cui i token vengono firmati NON va scritta qui a
 * mano: viene generata da sola, in modo casuale e sicuro, al primo utilizzo,
 * e salvata in users/.jwt_secret (cartella già protetta da accesso diretto
 * via URL). Cancellare quel file invalida tutti i token già emessi, forzando
 * un nuovo accesso per tutti.
 */
define('JWT_SECRET_FILE', USERS_DIR . '/.jwt_secret');
define('JWT_TTL_DEFAULT', 60 * 60 * 24);      // durata di un accesso normale: 24 ore
define('JWT_TTL_REMEMBER', 60 * 60 * 24 * 30); // durata con "Ricordami": 30 giorni

// Per quanto tempo (in secondi) resta valido il link di recupero password
// inviato via email prima di scadere. Default: 1 ora.
define('RESET_TOKEN_TTL', 3600);

/**
 * Indirizzo "From" con cui vengono inviate le email di recupero password.
 * Su molti hosting condivisi (incluso Aruba) funziona solo se il dominio
 * corrisponde a quello dello spazio web: modificalo se necessario, ad
 * esempio 'no-reply@ilTuoDominio.it'.
 */
define('FROM_EMAIL', 'no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
