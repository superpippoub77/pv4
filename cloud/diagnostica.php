<?php
/**
 * VolleyProW4 — verifica dei database disponibili sul server.
 *
 * Caricala nella cartella api/, apri nel browser
 *     https://tuo-sito/api/diagnostica.php
 * leggi il risultato e poi CANCELLA QUESTO FILE: non contiene segreti, ma
 * mostra informazioni tecniche sul server che non serve lasciare pubbliche.
 *
 * Non modifica nessun dato di VolleyProW4: la prova di SQLite crea un piccolo
 * database temporaneo e lo cancella subito; i dati di MySQL inseriti nel modulo
 * servono solo per la prova di connessione e non vengono salvati da nessuna parte.
 */
$ABILITATA = true; // metti false (o cancella il file) dopo l'uso

if (!$ABILITATA) { http_response_code(404); exit; }
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function riga($nome, $ok, $dettaglio = '') {
    $icona = $ok === null ? 'ℹ️' : ($ok ? '✅' : '❌');
    echo '<tr><td>' . $icona . '</td><td>' . h($nome) . '</td><td>' . $dettaglio . '</td></tr>';
}

$dataDir = realpath(__DIR__ . '/..') . '/library';
if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
$drivers = class_exists('PDO') ? PDO::getAvailableDrivers() : [];

// --- prova SQLite -----------------------------------------------------------
$sqlite = ['driver' => in_array('sqlite', $drivers, true), 'ok' => false, 'wal' => null, 'versione' => null, 'errore' => null];
if ($sqlite['driver']) {
    $file = $dataDir . '/_diagnostica_' . bin2hex(random_bytes(3)) . '.sqlite';
    try {
        $db = new PDO('sqlite:' . $file);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sqlite['versione'] = $db->query('select sqlite_version()')->fetchColumn();
        $sqlite['wal'] = strtolower((string)$db->query('PRAGMA journal_mode=WAL')->fetchColumn());
        $db->exec('CREATE TABLE prova (id INTEGER PRIMARY KEY, testo TEXT)');
        $db->beginTransaction();
        $st = $db->prepare('INSERT INTO prova (testo) VALUES (?)');
        for ($i = 0; $i < 200; $i++) $st->execute(['riga ' . $i]);
        $db->commit();
        $sqlite['ok'] = ((int)$db->query('SELECT COUNT(*) FROM prova')->fetchColumn() === 200);
        $db = null;
    } catch (Throwable $e) { $sqlite['errore'] = $e->getMessage(); }
    foreach ([$file, $file . '-wal', $file . '-shm', $file . '-journal'] as $f) if (file_exists($f)) @unlink($f);
}

// --- prova dei blocchi sui file (da cui dipende l'affidabilità di SQLite) ----
$lock = ['ok' => false, 'esclusivo' => null];
$lf = $dataDir . '/_diagnostica.lock';
$h1 = @fopen($lf, 'c'); $h2 = @fopen($lf, 'c');
if ($h1 && $h2) {
    $lock['ok'] = flock($h1, LOCK_EX | LOCK_NB);
    // se il blocco funziona davvero, un secondo blocco esclusivo sullo stesso file deve essere rifiutato
    $lock['esclusivo'] = $lock['ok'] ? !flock($h2, LOCK_EX | LOCK_NB) : null;
    flock($h1, LOCK_UN); flock($h2, LOCK_UN);
}
if ($h1) fclose($h1); if ($h2) fclose($h2); @unlink($lf);

// --- prova MySQL (solo se compilato il modulo) -------------------------------
$my = ['driver' => in_array('mysql', $drivers, true), 'provato' => false, 'ok' => false, 'versione' => null, 'errore' => null];
$mh = $_POST['host'] ?? ''; $mn = $_POST['db'] ?? ''; $mu = $_POST['user'] ?? '';
if ($my['driver'] && $_SERVER['REQUEST_METHOD'] === 'POST' && $mh !== '' && $mu !== '') {
    $my['provato'] = true;
    try {
        $pdo = new PDO('mysql:host=' . $mh . ($mn !== '' ? ';dbname=' . $mn : '') . ';charset=utf8mb4', $mu, $_POST['pass'] ?? '',
                       [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]);
        $my['versione'] = $pdo->query('SELECT VERSION()')->fetchColumn();
        $my['ok'] = true;
    } catch (Throwable $e) { $my['errore'] = preg_replace('/using password: \w+/i', 'password: (nascosta)', $e->getMessage()); }
}

$writable = ['library' => is_writable($dataDir), 'users' => is_writable(realpath(__DIR__ . '/..') . '/users') || is_writable(realpath(__DIR__ . '/..'))];
?><!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VolleyProW4 — verifica del server</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#1d1f23;background:#f6f5f2;line-height:1.5}
h1{font-size:22px}h2{font-size:17px;margin-top:28px}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #ddd;border-radius:8px;overflow:hidden}
td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top;font-size:14px}td:first-child{width:28px}
.box{background:#fff;border:1px solid #ddd;border-radius:8px;padding:14px 16px}
.verdetto{border-left:5px solid #c9973f}
.avviso{background:#fff4e0;border:1px solid #f0c36d;border-radius:8px;padding:10px 14px;margin:14px 0}
input{padding:7px;border:1px solid #bbb;border-radius:6px;width:100%;box-sizing:border-box;margin-bottom:8px}
button{padding:8px 16px;border-radius:6px;border:0;background:#c9973f;color:#fff;font-weight:600;cursor:pointer}
code{background:#eee;padding:1px 5px;border-radius:4px}
</style></head><body>
<h1>VolleyProW4 — verifica del server</h1>
<div class="avviso">⚠️ Dopo aver letto il risultato <b>cancella il file <code>api/diagnostica.php</code></b> dal server.</div>

<h2>Server</h2>
<table>
<?php
riga('Versione di PHP', version_compare(PHP_VERSION, '7.4', '>='), h(PHP_VERSION) . (version_compare(PHP_VERSION, '7.4', '>=') ? '' : ' — serve almeno la 7.4'));
riga('Driver di database disponibili (PDO)', null, $drivers ? h(implode(', ', $drivers)) : 'nessuno');
riga('Cartella dei dati scrivibile (library)', $writable['library'], h($dataDir));
riga('Blocchi sui file', $lock['ok'] && $lock['esclusivo'], $lock['ok'] ? ($lock['esclusivo'] ? 'funzionano: due scritture non possono sovrapporsi' : 'il blocco non è esclusivo: sconsigliato SQLite') : 'non disponibili');
?>
</table>

<h2>SQLite</h2>
<table>
<?php
riga('Driver SQLite (pdo_sqlite)', $sqlite['driver'], $sqlite['driver'] ? 'presente' : 'non presente: SQLite non è utilizzabile su questo piano');
if ($sqlite['driver']) {
    riga('Prova di scrittura e lettura (200 righe)', $sqlite['ok'], $sqlite['ok'] ? 'riuscita — versione ' . h($sqlite['versione']) : 'fallita: ' . h($sqlite['errore']));
    riga('Modalità WAL (letture e scritture contemporanee)', $sqlite['wal'] === 'wal', $sqlite['wal'] === 'wal' ? 'attiva' : 'non disponibile (' . h($sqlite['wal']) . '): funziona, ma le scritture bloccano anche le letture');
}
?>
</table>

<h2>MySQL</h2>
<table>
<?php
riga('Driver MySQL (pdo_mysql)', $my['driver'], $my['driver'] ? 'presente' : 'non presente');
if ($my['provato']) riga('Connessione al database', $my['ok'], $my['ok'] ? 'riuscita — versione ' . h($my['versione']) : 'fallita: ' . h($my['errore']));
?>
</table>
<?php if ($my['driver']): ?>
<div class="box" style="margin-top:10px">
<p style="margin-top:0">Per provare la connessione inserisci i dati del database MySQL che trovi nel pannello Aruba (non vengono salvati):</p>
<form method="post" autocomplete="off">
<input name="host" placeholder="Server (es. 31.11.39.xx o sqlXXXX.aruba.it)" value="<?= h($mh) ?>">
<input name="db" placeholder="Nome del database (es. Sql1234567_1)" value="<?= h($mn) ?>">
<input name="user" placeholder="Utente" value="<?= h($mu) ?>">
<input name="pass" type="password" placeholder="Password">
<button type="submit">Prova la connessione</button>
</form></div>
<?php endif; ?>

<h2>Conclusione</h2>
<div class="box verdetto">
<?php
$sqliteBuono = $sqlite['ok'] && $lock['ok'] && $lock['esclusivo'];
if ($my['ok']) {
    echo '<p><b>MySQL è pronto:</b> è la scelta consigliata su questo hosting (più utenti possono salvare insieme senza problemi).</p>';
} elseif ($my['driver'] && !$my['provato']) {
    echo '<p><b>MySQL:</b> il modulo c\'è. Se il tuo piano include un database MySQL, prova la connessione qui sopra: è la scelta consigliata.</p>';
}
if ($sqliteBuono) {
    echo '<p><b>SQLite funziona</b>' . ($sqlite['wal'] === 'wal' ? ' (anche in modalità WAL)' : '') . ': è un\'alternativa valida, senza configurazione, adatta finché gli utenti sono pochi.</p>';
} elseif ($sqlite['driver']) {
    echo '<p><b>SQLite</b> è presente ma la prova non è andata bene del tutto: meglio MySQL.</p>';
} else {
    echo '<p><b>SQLite non è disponibile</b> su questo piano.</p>';
}
if (!$my['ok'] && !$sqliteBuono && !($my['driver'] && !$my['provato'])) {
    echo '<p>Nessun database utilizzabile al momento: VolleyProW4 continua a funzionare con i file JSON, che sono comunque protetti dalle scritture contemporanee.</p>';
}
?>
<p style="margin-bottom:0">Copia questa pagina (o fanne uno screenshot) e mandamela: da qui decidiamo la migrazione.</p>
</div>
</body></html>
