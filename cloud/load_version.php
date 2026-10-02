<?php
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Metodo non consentito, usare GET.', 405);
}

$id = $_GET['id'] ?? '';
$file = $_GET['file'] ?? '';
if (!safe_id($id)) {
    json_error('Identificativo progetto non valido.', 400);
}
if (!safe_version_file($file)) {
    json_error('Versione non valida.', 400);
}

$current = json_decode(@file_get_contents(project_path($id)), true);
if (!is_array($current)) {
    json_error('Progetto non trovato.', 404);
}
$isOwner  = ($current['ownerId'] ?? null) === $user['id'];
$isShared = project_is_public($current);
if (!$isOwner && !$isShared) {
    json_error('Non hai accesso a questo progetto.', 403);
}

$vpath = versions_dir($id) . '/' . $file;
if (!file_exists($vpath)) {
    json_error('Versione non trovata.', 404);
}
$project = json_decode(file_get_contents($vpath), true);
if (!is_array($project)) {
    json_error('Il file di questa versione risulta corrotto.', 500);
}

json_ok(['project' => $project, 'mine' => $isOwner]);
