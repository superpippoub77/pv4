<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$id = $body['id'] ?? null;
$name = trim((string)($body['name'] ?? ''));

if (!safe_folder_id($id) || $id === null) {
    json_error('Identificativo cartella non valido.', 400);
}
if ($name === '') {
    json_error('La cartella deve avere un nome.');
}
$name = utf8_cut($name, 80);

$folders = read_folders();
$found = false;
foreach ($folders as &$f) {
    if ($f['id'] === $id) {
        if ($f['ownerId'] !== $user['id']) {
            json_error('Non puoi rinominare una cartella che non ti appartiene.', 403);
        }
        $f['name'] = $name;
        $found = true;
        break;
    }
}
unset($f);
if (!$found) {
    json_error('Cartella non trovata.', 404);
}

write_folders($folders);
json_ok(['id' => $id, 'name' => $name]);
