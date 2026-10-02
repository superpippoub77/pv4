<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Metodo non consentito, usare GET.', 405);
}

$id = $_GET['id'] ?? '';
if (!safe_id($id)) {
    json_error('Identificativo progetto non valido.', 400);
}

$path = project_path($id);
if (!file_exists($path)) {
    json_error('Progetto non trovato.', 404);
}
$current = json_decode(file_get_contents($path), true);
if (!is_array($current)) {
    json_error('Il file di progetto sul server risulta corrotto.', 500);
}

$isOwner  = ($current['ownerId'] ?? null) === $user['id'];
$isShared = project_is_public($current);
if (!$isOwner && !$isShared) {
    json_error('Non hai accesso a questo progetto.', 403);
}

$dir = versions_dir($id);
$items = [];
if (is_dir($dir)) {
    $pins = read_pins($id);
    $files = glob($dir . '/*_*.json');
    foreach ($files as $f) {
        $fname = basename($f);
        $data = json_decode(file_get_contents($f), true);
        $parts = explode('_', $fname);
        $ts = isset($parts[0]) ? intdiv((int) $parts[0], 1000) : time();
        $item = [
            'file'    => $fname,
            'name'    => is_array($data) ? ($data['name'] ?? '') : '',
            'savedAt' => date('c', $ts),
            // numero di oggetti dello schema (giocatori, campo, palla…)
            'shapes'  => is_array($data) && isset($data['data']['objects']) && is_array($data['data']['objects']) ? count($data['data']['objects']) : null,
        ];
        if (isset($pins[$fname])) $item['pin'] = $pins[$fname];   // versione fissata: nome, nota, data
        $items[] = $item;
    }
}
usort($items, function ($a, $b) { return strcmp($b['file'], $a['file']); }); // più recenti prima

json_ok(['items' => $items, 'mine' => $isOwner, 'maxVersions' => MAX_VERSIONS_PER_PROJECT,
         'restoredFrom' => $current['restoredFrom'] ?? null]);
