<?php
/**
 * Stato del database (solo amministratori): tipo in uso, connessione, versione,
 * dimensione, migrazione, ultima copia di sicurezza, conteggi.
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Metodo non consentito.', 405);
require_admin();

$mode = storage_mode();
$st = ['configured' => STORAGE, 'active' => $mode, 'connected' => false];
if ($mode === 'json') {
    $st['warning'] = STORAGE === 'json'
        ? 'Il backend è configurato per usare i file JSON (nessun database).'
        : 'Il database configurato («' . STORAGE . '») non è disponibile su questo server: il backend sta usando i file JSON.';
} else {
    $pdo = db();                                   // se non si connette, risponde già con un errore 503
    $st['connected'] = true;
    if ($mode === 'sqlite') {
        $st['version'] = 'SQLite ' . $pdo->query('select sqlite_version()')->fetchColumn();
        $st['journal'] = strtolower((string)$pdo->query('PRAGMA journal_mode')->fetchColumn());
        $st['file'] = 'library/' . basename(SQLITE_FILE);
        $size = 0; foreach (['', '-wal', '-shm'] as $s) if (file_exists(SQLITE_FILE . $s)) $size += filesize(SQLITE_FILE . $s);
        $st['sizeBytes'] = $size;
        $b = glob(LIBRARY_DIR . '/backup/pv4-*.sqlite') ?: [];
        sort($b);
        $st['backups'] = count($b);
        if ($b) { $last = end($b); $st['lastBackup'] = date('c', filemtime($last)); $st['lastBackupFile'] = basename($last); }
    } else {
        $st['version'] = 'MySQL ' . $pdo->query('SELECT VERSION()')->fetchColumn();
        $st['server'] = preg_replace('/;?(user|password)=[^;]*/i', '', DB_DSN);   // niente credenziali
    }
    $m = db_meta_get($pdo, 'json_migrated');
    if ($m) $st['migratedAt'] = substr($m, 0, 25);
}
$projects = read_index();
$st['counts'] = [
    'users'    => count(read_users()),
    'projects' => count($projects),
    'folders'  => count(read_folders()),
    'public'   => count(array_filter($projects, function ($p) { return !project_is_generic($p) && !empty($p['shared']); })),
    'private'  => count(array_filter($projects, function ($p) { return !project_is_generic($p) && empty($p['shared']); })),
    'generic'  => count(array_filter($projects, 'project_is_generic')),
];
json_ok(['status' => $st]);
