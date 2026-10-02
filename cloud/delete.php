<?php
/**
 * Elimina un progetto.
 * Di norma lo sposta nel Cestino (resta recuperabile per TRASH_DAYS giorni):
 *   POST { "id": "..." }
 * Eliminazione definitiva (anche dal Cestino), file e versioni compresi:
 *   POST { "id": "...", "permanent": true }
 */
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();
$id = null; $permanent = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $id = $body['id'] ?? null;
    $permanent = !empty($body['permanent']);
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = $_GET['id'] ?? null;
    $permanent = !empty($_GET['permanent']);
} else {
    json_error('Metodo non consentito, usare POST o GET.', 405);
}
if (!safe_id($id)) json_error('Identificativo progetto non valido.', 400);

$index = read_index();
$pos = null;
foreach ($index as $i => $e) if (($e['id'] ?? null) === $id) { $pos = $i; break; }
$ownerId = $pos !== null ? ($index[$pos]['ownerId'] ?? null) : null;
if ($pos === null) {
    $path = project_path($id);
    if (file_exists($path)) { $p = json_decode(file_get_contents($path), true); $ownerId = is_array($p) ? ($p['ownerId'] ?? null) : null; }
}
if ($ownerId !== $user['id']) json_error('Non puoi eliminare un progetto che non ti appartiene.', 403);

if ($permanent) {
    purge_project_files($id);
    if ($pos !== null) { array_splice($index, $pos, 1); write_index($index); }
    json_ok(['id' => $id, 'permanent' => true]);
}
if ($pos === null) json_error('Progetto non trovato.', 404);
$index[$pos]['trashed'] = true;
$index[$pos]['trashedAt'] = date('c');
$index[$pos]['trashedFrom'] = $index[$pos]['folderId'] ?? null; // per il ripristino nella cartella d'origine
write_index($index);
json_ok(['id' => $id, 'trashed' => true]);
