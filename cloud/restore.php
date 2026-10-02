<?php
/**
 * Ripristina dal Cestino uno o più progetti del proprietario.
 * POST { "ids": ["...", "..."] } → tornano nella cartella d'origine (o nella radice se non esiste più).
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito.', 405);
$user = require_login();
$body = read_json_body();
$ids = $body['ids'] ?? [];
if (!is_array($ids) || !$ids) json_error('Nessun progetto indicato.', 400);
$myFolders = [];
foreach (read_folders() as $f) if (($f['ownerId'] ?? null) === $user['id']) $myFolders[$f['id']] = true;
$index = read_index();
$done = 0;
foreach ($index as $i => $e) {
    if (!in_array($e['id'] ?? null, $ids, true) || ($e['ownerId'] ?? null) !== $user['id'] || !project_is_trashed($e)) continue;
    $from = $e['trashedFrom'] ?? ($e['folderId'] ?? null);
    $index[$i]['folderId'] = ($from && isset($myFolders[$from])) ? $from : null;
    unset($index[$i]['trashed'], $index[$i]['trashedAt'], $index[$i]['trashedFrom']);
    $done++;
}
write_index($index);
json_ok(['restored' => $done]);
