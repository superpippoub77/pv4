<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$id = $body['id'] ?? null;
$folderId = array_key_exists('folderId', $body) ? $body['folderId'] : null;

if (!safe_id($id)) {
    json_error('Identificativo progetto non valido.', 400);
}
if (!safe_folder_id($folderId)) {
    json_error('Cartella di destinazione non valida.', 400);
}

$folders = read_folders();
if (!folder_usable_by($folders, $folderId, $user['id'])) {
    json_error('Non hai accesso a quella cartella.', 403);
}

$path = project_path($id);
$project = @file_get_contents($path);
$projectData = $project !== false ? json_decode($project, true) : null;
if (!is_array($projectData)) {
    json_error('Progetto non trovato.', 404);
}
if (($projectData['ownerId'] ?? null) !== $user['id']) {
    json_error('Non puoi spostare un progetto che non ti appartiene.', 403);
}

$projectData['folderId'] = $folderId;
atomic_write($path, json_encode($projectData, JSON_UNESCAPED_UNICODE));

$index = read_index();
foreach ($index as &$e) {
    if (isset($e['id']) && $e['id'] === $id) {
        $e['folderId'] = $folderId;
        break;
    }
}
unset($e);
write_index($index);

json_ok(['id' => $id, 'folderId' => $folderId]);
