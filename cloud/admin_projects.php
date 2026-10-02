<?php
/**
 * Tutti i progetti di tutti gli utenti (solo amministratori), privati compresi,
 * per poterne cambiare la visibilità dalla finestra Amministrazione.
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Metodo non consentito.', 405);
require_admin();

$users = [];
foreach (read_users() as $u) $users[$u['id']] = $u['username'] ?? '';
$folders = [];
foreach (read_folders() as $f) $folders[$f['id']] = $f;
$path = function ($fid) use ($folders) {       // percorso della cartella, per riconoscere il progetto
    $names = []; $guard = 0;
    while ($fid && isset($folders[$fid]) && $guard++ < 50) { array_unshift($names, $folders[$fid]['name'] ?? ''); $fid = $folders[$fid]['parentId'] ?? null; }
    return implode(' / ', $names);
};
$out = [];
foreach (read_index() as $p) {
    $generic = project_is_generic($p);
    $out[] = [
        'id'             => $p['id'],
        'name'           => $p['name'] ?? '',
        'ownerId'        => $p['ownerId'] ?? null,
        'ownerName'      => $generic ? null : ($users[$p['ownerId']] ?? ($p['ownerName'] ?? '?')),
        'generic'        => $generic,
        'shared'         => project_is_public($p),
        'folder'         => $path($p['folderId'] ?? null),
        'updated'        => $p['updated'] ?? null,
        'size'           => $p['size'] ?? null,
        'changedBy'      => $p['sharedChangedBy'] ?? null,
        'changedAt'      => $p['sharedChangedAt'] ?? null,
        'changedByAdmin' => !empty($p['sharedChangedByAdmin']),
    ];
}
json_ok(['projects' => $out]);
