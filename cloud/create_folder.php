<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$name = trim((string)($body['name'] ?? ''));
$parentId = array_key_exists('parentId', $body) ? $body['parentId'] : null;

if ($name === '') {
    json_error('La cartella deve avere un nome.');
}
$name = utf8_cut($name, 80);

if (!safe_folder_id($parentId)) {
    json_error('Cartella superiore non valida.', 400);
}
$folders = read_folders();
if (!folder_usable_by($folders, $parentId, $user['id'])) {
    json_error('Non hai accesso a quella cartella superiore.', 403);
}

$folder = [
    'id'       => bin2hex(random_bytes(12)),
    'name'     => $name,
    'parentId' => $parentId,
    'ownerId'  => $user['id'],
    'created'  => date('c'),
];
$folders[] = $folder;
write_folders($folders);

json_ok(['folder' => $folder]);
