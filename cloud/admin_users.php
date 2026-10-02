<?php
/**
 * Elenco di tutti gli utenti (solo amministratori), con i loro progetti e cartelle.
 * Mai password o token: solo dati anagrafici e conteggi.
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Metodo non consentito.', 405);
require_admin();

$projects = read_index();
$folders = read_folders();
$out = [];
foreach (read_users() as $u) {
    $mine = array_filter($projects, function ($p) use ($u) { return ($p['ownerId'] ?? null) === $u['id']; });
    $pub = count(array_filter($mine, function ($p) { return !empty($p['shared']); }));
    $last = null;
    foreach ($mine as $p) if (!empty($p['updated']) && ($last === null || $p['updated'] > $last)) $last = $p['updated'];
    $out[] = [
        'id'          => $u['id'],
        'username'    => $u['username'] ?? '',
        'email'       => $u['email'] ?? '',
        'created'     => $u['created'] ?? null,
        'lastLogin'   => $u['lastLogin'] ?? null,
        'lastSave'    => $last,
        'projects'    => count($mine),
        'public'      => $pub,
        'private'     => count($mine) - $pub,
        'folders'     => count(array_filter($folders, function ($f) use ($u) { return ($f['ownerId'] ?? null) === $u['id']; })),
        'isAdmin'     => is_admin($u),
    ];
}
json_ok(['users' => $out, 'genericProjects' => count(array_filter($projects, 'project_is_generic'))]);
