<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$id = $body['id'] ?? null;
$file = $body['file'] ?? null;
if (!safe_id($id)) {
    json_error('Identificativo progetto non valido.', 400);
}
if (!safe_version_file($file)) {
    json_error('Versione non valida.', 400);
}

$path = project_path($id);
$current = json_decode(@file_get_contents($path), true);
if (!is_array($current)) {
    json_error('Progetto non trovato.', 404);
}
if (($current['ownerId'] ?? null) !== $user['id']) {
    json_error('Solo il proprietario può ripristinare una versione precedente.', 403);
}

$vpath = versions_dir($id) . '/' . $file;
if (!file_exists($vpath)) {
    json_error('Versione non trovata.', 404);
}
$old = json_decode(file_get_contents($vpath), true);
if (!is_array($old)) {
    json_error('Il file di questa versione risulta corrotto.', 500);
}

// Prima di sovrascrivere, salvo lo stato ATTUALE come nuova voce della
// cronologia: così anche il ripristino stesso resta annullabile.
snapshot_version($id, $current);

$now = date('c');
$restored = [
    'name'          => $old['name'] ?? $current['name'] ?? '',
    'data'          => $old['data'] ?? null,
    'folderId'      => $current['folderId'] ?? null,
    // proprietario e condivisione restano quelli ATTUALI: sono impostazioni
    // dell'account, non fanno parte della cronologia del contenuto.
    'ownerId'       => $current['ownerId'],
    'ownerName'     => $current['ownerName'],
    'shared'        => $current['shared'] ?? false,
    'created'       => $current['created'] ?? $now,
    'updated'       => $now,
    // da quale versione arriva lo stato attuale (per mostrarlo nella cronologia)
    'restoredFrom'  => ['file' => $file, 'label' => (read_pins($id)[$file]['label'] ?? null), 'at' => $now],
];

if (atomic_write($path, json_encode($restored, JSON_UNESCAPED_UNICODE)) === false) {
    json_error('Impossibile scrivere il progetto sul server.', 500);
}

$index = read_index();
foreach ($index as &$e) {
    if (isset($e['id']) && $e['id'] === $id) {
        $e['name'] = $restored['name'];
        $e['updated'] = $restored['updated'];
        break;
    }
}
unset($e);
write_index($index);

json_ok(['id' => $id, 'updated' => $restored['updated']]);
