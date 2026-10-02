<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$id = $body['id'] ?? null;
if (!safe_folder_id($id) || $id === null) {
    json_error('Identificativo cartella non valido.', 400);
}

$folders = read_folders();
$target = null;
foreach ($folders as $f) {
    if ($f['id'] === $id) { $target = $f; break; }
}
if (!$target) {
    json_error('Cartella non trovata.', 404);
}
if ($target['ownerId'] !== $user['id']) {
    json_error('Non puoi eliminare una cartella che non ti appartiene.', 403);
}
$parentOfDeleted = $target['parentId'] ?? null;

// le sottocartelle dirette salgono al livello della cartella eliminata,
// invece di restare orfane o venire eliminate a cascata
foreach ($folders as &$f) {
    if (($f['parentId'] ?? null) === $id) {
        $f['parentId'] = $parentOfDeleted;
    }
}
unset($f);
$folders = array_values(array_filter($folders, function ($f) use ($id) {
    return $f['id'] !== $id;
}));
write_folders($folders);

// i progetti direttamente in questa cartella salgono anch'essi al livello superiore
$index = read_index();
$changed = false;
foreach ($index as &$e) {
    if (($e['folderId'] ?? null) === $id) {
        $e['folderId'] = $parentOfDeleted;
        $changed = true;
        // aggiorno anche il file del progetto, non solo l'indice
        if (isset($e['id']) && safe_id($e['id'])) {
            $ppath = project_path($e['id']);
            $proj = @file_get_contents($ppath);
            $projData = $proj !== false ? json_decode($proj, true) : null;
            if (is_array($projData)) {
                $projData['folderId'] = $parentOfDeleted;
                atomic_write($ppath, json_encode($projData, JSON_UNESCAPED_UNICODE));
            }
        }
    }
}
unset($e);
if ($changed) write_index($index);

json_ok(['id' => $id]);
