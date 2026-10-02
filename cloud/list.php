<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Metodo non consentito, usare GET.', 405);
}

$index = read_index();
// Cestino: gli elementi dell'utente più vecchi di TRASH_DAYS giorni vengono cancellati davvero
$limit = time() - TRASH_DAYS * 86400;
$expired = array_filter($index, function ($e) use ($user, $limit) {
    return ($e['ownerId'] ?? null) === $user['id'] && project_is_trashed($e) && strtotime($e['trashedAt'] ?? 'now') < $limit;
});
if ($expired) {
    acquire_data_lock();                         // modifica l'indice: una richiesta alla volta
    $index = read_index();
    $keep = [];
    foreach ($index as $e) {
        if (($e['ownerId'] ?? null) === $user['id'] && project_is_trashed($e) && strtotime($e['trashedAt'] ?? 'now') < $limit) purge_project_files($e['id']);
        else $keep[] = $e;
    }
    write_index($keep); $index = $keep;
}
$trash = array_values(array_filter($index, function ($e) use ($user) {
    return ($e['ownerId'] ?? null) === $user['id'] && project_is_trashed($e);
}));
$items = array_values(array_filter($index, function ($e) use ($user) {
    if (project_is_trashed($e)) return false;    // nel Cestino: non compare nella libreria (né agli altri utenti)
    return ($e['ownerId'] ?? null) === $user['id'] || project_is_public($e);
}));
foreach ($items as &$it) {
    $it['mine'] = ($it['ownerId'] ?? null) === $user['id'];
    $it['generic'] = project_is_generic($it);
    if ($it['generic']) $it['shared'] = true; // i progetti generici sono sempre pubblici
    if (!array_key_exists('folderId', $it)) $it['folderId'] = null;
}
unset($it);

usort($items, function ($a, $b) {
    return strcmp($b['updated'] ?? '', $a['updated'] ?? '');
});

$folders = read_folders();
$myFolders = array_values(array_filter($folders, function ($f) use ($user) {
    return ($f['ownerId'] ?? null) === $user['id'];
}));

foreach ($trash as &$t) { $t['mine'] = true; if (!array_key_exists('folderId', $t)) $t['folderId'] = null; }
unset($t);
json_ok(['items' => $items, 'folders' => $myFolders, 'trash' => $trash, 'trashDays' => TRASH_DAYS]);
