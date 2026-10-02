<?php
/**
 * Accesso al database (SQLite ora, MySQL in futuro): TUTTO passa da qui.
 *
 * Ogni tabella ha alcune colonne per cercare e filtrare (proprietario,
 * cartella, visibilità, nome) più la colonna "data" con il record completo in
 * JSON: nessun campo si perde e gli endpoint ricevono esattamente gli stessi
 * array di prima (vedi read_index / write_index in common.php).
 */

function storage_mode() {
    static $mode = null;
    if ($mode !== null) return $mode;
    $mode = STORAGE;
    $drivers = class_exists('PDO') ? PDO::getAvailableDrivers() : [];
    if ($mode === 'sqlite' && !in_array('sqlite', $drivers, true)) { error_log('VolleyProW4: pdo_sqlite assente, uso i file JSON'); $mode = 'json'; }
    if ($mode === 'mysql' && (!in_array('mysql', $drivers, true) || DB_DSN === '')) { error_log('VolleyProW4: MySQL non configurato, uso i file JSON'); $mode = 'json'; }
    return $mode;
}

// Tabelle: nome => colonne indicizzate (ricavate dal record)
function db_tables() {
    return [
        'projects' => ['owner_id' => 'ownerId', 'folder_id' => 'folderId', 'shared' => 'shared', 'name' => 'name', 'updated' => 'updated'],
        'folders'  => ['owner_id' => 'ownerId', 'parent_id' => 'parentId', 'name' => 'name'],
        'users'    => ['username' => 'username', 'email' => 'email'],
    ];
}

function db_schema($driver) {
    $sql = [];
    foreach (db_tables() as $t => $cols) {
        if ($driver === 'mysql') {
            $c = ["id VARCHAR(64) NOT NULL PRIMARY KEY", "pos INT NOT NULL DEFAULT 0"];
            foreach ($cols as $col => $k) $c[] = $col === 'shared' ? "shared TINYINT NOT NULL DEFAULT 0" : "$col VARCHAR(255) NULL";
            $c[] = "data LONGTEXT NOT NULL";
            $sql[] = "CREATE TABLE IF NOT EXISTS $t (" . implode(', ', $c) . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        } else {
            $c = ["id TEXT PRIMARY KEY", "pos INTEGER NOT NULL DEFAULT 0"];
            foreach ($cols as $col => $k) $c[] = $col === 'shared' ? "shared INTEGER NOT NULL DEFAULT 0" : "$col TEXT";
            $c[] = "data TEXT NOT NULL";
            $sql[] = "CREATE TABLE IF NOT EXISTS $t (" . implode(', ', $c) . ")";
        }
        foreach (array_keys($cols) as $col) if ($col !== 'name' && $col !== 'updated') {
            $sql[] = $driver === 'mysql' ? null : "CREATE INDEX IF NOT EXISTS idx_{$t}_{$col} ON $t($col)";
        }
    }
    $sql[] = $driver === 'mysql'
        ? "CREATE TABLE IF NOT EXISTS meta (k VARCHAR(64) NOT NULL PRIMARY KEY, v TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        : "CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)";
    return array_values(array_filter($sql));
}

function db() {
    static $pdo = null;
    if ($pdo) return $pdo;
    $mode = storage_mode();
    if ($mode === 'json') return null;
    try {
        if ($mode === 'sqlite') {
            ensure_library_dir();
            $pdo = new PDO('sqlite:' . SQLITE_FILE, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $pdo->exec('PRAGMA busy_timeout = 10000');   // attende invece di fallire se un'altra richiesta sta scrivendo
            $pdo->exec('PRAGMA journal_mode = WAL');     // letture e scritture contemporanee
            $pdo->exec('PRAGMA synchronous = NORMAL');
        } else {
            $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        }
        foreach (db_schema($mode) as $q) $pdo->exec($q);
        db_migrate_from_json($pdo);
    } catch (Throwable $e) {
        error_log('VolleyProW4: database non disponibile: ' . $e->getMessage());
        json_error('Il database non è raggiungibile: riprova tra poco; se il problema continua, contatta l\'amministratore.', 503);
    }
    return $pdo;
}

function db_meta_get($pdo, $k) { $st = $pdo->prepare('SELECT v FROM meta WHERE k = ?'); $st->execute([$k]); $v = $st->fetchColumn(); return $v === false ? null : $v; }
function db_meta_set($pdo, $k, $v) {
    $up = $pdo->prepare('UPDATE meta SET v = ? WHERE k = ?'); $up->execute([$v, $k]);
    if (db_meta_get($pdo, $k) === null) $pdo->prepare('INSERT INTO meta (k, v) VALUES (?, ?)')->execute([$k, $v]);
}

// Primo avvio: importa utenti, progetti e cartelle dai vecchi file JSON (una sola volta)
function db_migrate_from_json($pdo) {
    if (db_meta_get($pdo, 'json_migrated') !== null) return;
    acquire_data_lock();                                   // una sola richiesta esegue l'importazione
    if (db_meta_get($pdo, 'json_migrated') !== null) return;
    $sources = ['users' => USERS_INDEX_FILE, 'projects' => INDEX_FILE, 'folders' => FOLDERS_FILE];
    $counts = [];
    $pdo->beginTransaction();
    try {
        foreach ($sources as $t => $file) {
            $rows = file_exists($file) ? read_json_list($file) : [];
            db_write_table_rows($pdo, $t, $rows);
            $counts[$t] = count($rows);
        }
        db_meta_set($pdo, 'json_migrated', date('c') . ' ' . json_encode($counts));
        $pdo->commit();
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
    // i vecchi file restano come copia, con un nome che non verrà più usato
    $suffix = '.migrated-' . date('Ymd');
    foreach ($sources as $file) if (file_exists($file)) @rename($file, $file . $suffix);
}

function db_read_table($t) {
    $st = db()->query("SELECT data FROM $t ORDER BY pos, id");
    $out = [];
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $raw) { $r = json_decode($raw, true); if (is_array($r)) $out[] = $r; }
    return $out;
}

// Rende la tabella uguale all'elenco: aggiorna le righe cambiate, aggiunge le nuove, toglie quelle sparite
function db_write_table_rows($pdo, $t, $rows) {
    $cols = db_tables()[$t];
    $cur = [];
    foreach ($pdo->query("SELECT id, pos, data FROM $t")->fetchAll(PDO::FETCH_ASSOC) as $r) $cur[$r['id']] = $r;
    $seen = [];
    $colNames = array_keys($cols);
    $ins = $pdo->prepare("INSERT INTO $t (id, pos, " . implode(', ', $colNames) . ", data) VALUES (?, ?, " . implode(', ', array_fill(0, count($colNames), '?')) . ", ?)");
    $upd = $pdo->prepare("UPDATE $t SET pos = ?, " . implode(', ', array_map(function ($c) { return "$c = ?"; }, $colNames)) . ", data = ? WHERE id = ?");
    foreach (array_values($rows) as $pos => $r) {
        if (!isset($r['id']) || $r['id'] === '' || isset($seen[$r['id']])) continue;
        $id = (string)$r['id']; $seen[$id] = true;
        $data = json_encode($r, JSON_UNESCAPED_UNICODE);
        $vals = [];
        foreach ($cols as $col => $k) { $v = $r[$k] ?? null; $vals[] = $col === 'shared' ? (!empty($v) ? 1 : 0) : ($v === null ? null : (string)$v); }
        if (isset($cur[$id])) {
            if ($cur[$id]['data'] !== $data || (int)$cur[$id]['pos'] !== $pos) $upd->execute(array_merge([$pos], $vals, [$data, $id]));
        } else {
            $ins->execute(array_merge([$id, $pos], $vals, [$data]));
        }
    }
    $del = $pdo->prepare("DELETE FROM $t WHERE id = ?");
    foreach (array_keys($cur) as $id) if (!isset($seen[$id])) $del->execute([$id]);
}

function db_write_table($t, $rows) {
    $pdo = db();
    $pdo->beginTransaction();
    try { db_write_table_rows($pdo, $t, $rows); $pdo->commit(); }
    catch (Throwable $e) { $pdo->rollBack(); error_log('VolleyProW4: scrittura non riuscita: ' . $e->getMessage()); json_error('Impossibile salvare i dati sul server.', 500); }
    db_daily_backup();
}

// Copia di sicurezza giornaliera del file SQLite (le ultime DB_BACKUP_DAYS)
function db_daily_backup() {
    if (storage_mode() !== 'sqlite') return;
    $dir = LIBRARY_DIR . '/backup'; if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $today = $dir . '/pv4-' . date('Ymd') . '.sqlite';
    if (file_exists($today)) return;
    try { db()->exec("VACUUM INTO " . db()->quote($today)); }
    catch (Throwable $e) { error_log('VolleyProW4: copia di sicurezza non riuscita: ' . $e->getMessage()); return; }
    $all = glob($dir . '/pv4-*.sqlite'); sort($all);
    while (count($all) > DB_BACKUP_DAYS) @unlink(array_shift($all));
}
