<?php
/** Elimina un link condiviso: chi lo apre vedrà «link non disponibile». POST { "slug": "..." } */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/shares_lib.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito.', 405);
$user = require_login();
$body = read_json_body();
$slug = $body['slug'] ?? null;
$rec = share_read($slug);
if (!$rec) json_error('Link non trovato.', 404);
if (($rec['ownerId'] ?? null) !== $user['id'] && !is_admin($user)) json_error('Solo chi ha creato il link (o un amministratore) può eliminarlo.', 403);
acquire_data_lock();
@unlink(share_path($slug));
share_delete_images($slug);
json_ok(['slug' => $slug]);
