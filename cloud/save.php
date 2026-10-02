<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();

$name = trim((string)($body['name'] ?? ''));
if ($name === '') {
    json_error('Il progetto deve avere un nome.');
}
$name = utf8_cut($name, 120);
$shared = !empty($body['shared']);

$id = $body['id'] ?? null;
$index = read_index();
$existing = null;
if (safe_id($id)) {
    foreach ($index as $entry) {
        if (isset($entry['id']) && $entry['id'] === $id) { $existing = $entry; break; }
    }
}
// un progetto esistente può essere risalvato solo dal suo proprietario;
// se l'id non corrisponde a nessun progetto esistente, ne viene creato uno nuovo.
if ($existing && ($existing['ownerId'] ?? null) !== $user['id']) {
    json_error('Non puoi modificare un progetto che non ti appartiene.', 403);
}
if (!$existing) {
    $id = bin2hex(random_bytes(12));
}

// cartella di destinazione: se il client non la specifica esplicitamente e si
// sta risalvando un progetto già esistente, resta dov'era; altrimenti (nuovo
// progetto, o il client la specifica) va convalidata come propria dell'utente.
if (array_key_exists('folderId', $body)) {
    $folderId = $body['folderId'];
    if (!safe_folder_id($folderId)) {
        json_error('Cartella di destinazione non valida.', 400);
    }
    $folders = read_folders();
    if (!folder_usable_by($folders, $folderId, $user['id'])) {
        json_error('Non hai accesso a quella cartella.', 403);
    }
} else {
    $folderId = $existing['folderId'] ?? null;
}

$now = date('c');
if ($existing) {
    // sto sovrascrivendo un progetto già esistente: ne conservo lo stato
    // attuale nella cronologia versioni prima di sostituirlo.
    $oldRaw = @file_get_contents(project_path($id));
    $oldData = $oldRaw !== false ? json_decode($oldRaw, true) : null;
    if (is_array($oldData)) {
        snapshot_version($id, $oldData);
    }
}
$project = [
    'name'          => $name,
    // Esercizio di VolleyProW4: lo schema completo (oggetti, frecce, step, dati dell'esercizio)
    'data'          => $body['data'] ?? null,
    'ownerId'       => $user['id'],
    'ownerName'     => $user['username'],
    'shared'        => $shared,
    'folderId'      => $folderId,
    'created'       => $existing['created'] ?? $now,
    'updated'       => $now,
];

$bytesWritten = atomic_write(project_path($id), json_encode($project, JSON_UNESCAPED_UNICODE));
if ($bytesWritten === false) {
    json_error('Impossibile scrivere il progetto sul server.', 500);
}

// aggiorna l'indice (rimuove eventuale voce precedente con lo stesso id, poi la riaggiunge)
$index = array_values(array_filter($index, function ($e) use ($id) {
    return !isset($e['id']) || $e['id'] !== $id;
}));
$index[] = [
    'id'        => $id,
    'name'      => $name,
    'ownerId'   => $user['id'],
    'ownerName' => $user['username'],
    'shared'    => $shared,
    'folderId'  => $folderId,
    'created'   => $project['created'],
    'updated'   => $project['updated'],
    'size'      => $bytesWritten,
];
write_index($index);

json_ok(['id' => $id, 'updated' => $project['updated']]);
