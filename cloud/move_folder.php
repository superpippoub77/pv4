<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$id = $body['id'] ?? null;
$parentId = array_key_exists('parentId', $body) ? $body['parentId'] : null;

if (!safe_folder_id($id) || $id === null) {
    json_error('Identificativo cartella non valido.', 400);
}
if (!safe_folder_id($parentId)) {
    json_error('Cartella di destinazione non valida.', 400);
}

$folders = read_folders();
if (!folder_usable_by($folders, $id, $user['id'])) {
    json_error('Non puoi spostare una cartella che non ti appartiene.', 403);
}
if ($parentId !== null && !folder_usable_by($folders, $parentId, $user['id'])) {
    json_error('Non hai accesso a quella cartella di destinazione.', 403);
}
if (folder_is_descendant_or_self($folders, $parentId, $id)) {
    json_error('Non puoi spostare una cartella dentro se stessa o in una sua sottocartella.', 400);
}

$found = false;
foreach ($folders as &$f) {
    if ($f['id'] === $id) {
        $f['parentId'] = $parentId;
        $found = true;
        break;
    }
}
unset($f);
if (!$found) {
    json_error('Cartella non trovata.', 404);
}

write_folders($folders);
json_ok(['id' => $id, 'parentId' => $parentId]);
