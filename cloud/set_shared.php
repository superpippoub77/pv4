<?php
/**
 * Rende pubblico o privato un progetto, senza doverlo risalvare.
 * POST { "id": "...", "shared": true|false } — il proprietario, oppure un amministratore.
 * Viene registrato chi ha fatto l'ultimo cambio (sharedChangedBy / sharedChangedAt).
 * I progetti generici (senza proprietario) sono sempre pubblici e non si possono rendere privati.
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito.', 405);
$user = require_login();
$body = read_json_body();
$id = $body['id'] ?? null;
if (!safe_id($id)) json_error('Progetto non valido.', 400);
$shared = !empty($body['shared']);

$index = read_index();
$pos = null;
foreach ($index as $i => $e) if (($e['id'] ?? null) === $id) { $pos = $i; break; }
if ($pos === null) json_error('Progetto non trovato.', 404);
if (project_is_generic($index[$pos])) json_error('I progetti generici (senza proprietario) sono sempre pubblici.', 403);
// il proprietario gestisce i propri progetti; l'amministratore può farlo su qualunque progetto con proprietario
$isOwner = ($index[$pos]['ownerId'] ?? null) === $user['id'];
if (!$isOwner && !is_admin($user)) json_error('Solo il proprietario (o un amministratore) può cambiare la visibilità di un progetto.', 403);

// file del progetto e indice restano allineati
$path = project_path($id);
$raw = @file_get_contents($path);
$project = $raw !== false ? json_decode($raw, true) : null;
$stamp = ['sharedChangedBy' => $user['username'], 'sharedChangedAt' => date('c'), 'sharedChangedByAdmin' => !$isOwner];
if (is_array($project)) {
    $project['shared'] = $shared;
    $project = array_merge($project, $stamp);
    if (atomic_write($path, json_encode($project, JSON_UNESCAPED_UNICODE)) === false) json_error('Impossibile aggiornare il progetto.', 500);
}
$index[$pos]['shared'] = $shared;
$index[$pos] = array_merge($index[$pos], $stamp);
write_index($index);
json_ok(['id' => $id, 'shared' => $shared, 'byAdmin' => !$isOwner]);
