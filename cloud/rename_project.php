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

if (!safe_id($id)) {
    json_error('Identificativo progetto non valido.', 400);
}
if ($name === '') {
    json_error('Il progetto deve avere un nome.');
}
$name = utf8_cut($name, 120);

$path = project_path($id);
$project = json_decode(@file_get_contents($path), true);
if (!is_array($project)) {
    json_error('Progetto non trovato.', 404);
}
if (($project['ownerId'] ?? null) !== $user['id']) {
    json_error('Non puoi rinominare un progetto che non ti appartiene.', 403);
}

$project['name'] = $name;
if (atomic_write($path, json_encode($project, JSON_UNESCAPED_UNICODE)) === false) {
    json_error('Impossibile scrivere il progetto sul server.', 500);
}

$index = read_index();
foreach ($index as &$e) {
    if (isset($e['id']) && $e['id'] === $id) {
        $e['name'] = $name;
        break;
    }
}
unset($e);
write_index($index);

json_ok(['id' => $id, 'name' => $name]);
