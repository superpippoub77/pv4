<?php
/**
 * Carica il disegno numero i di un link condiviso.
 * POST { "slug": "...", "i": 0, "dataUrl": "data:image/jpeg;base64,..." } — solo il proprietario.
 */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/shares_lib.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito.', 405);
$user = require_login();
$body = read_json_body();
$slug = $body['slug'] ?? null;
$rec = share_read($slug);
if (!$rec) json_error('Link non trovato.', 404);
if (($rec['ownerId'] ?? null) !== $user['id'] && !is_admin($user)) json_error('Non puoi modificare questo link.', 403);
$i = (int)($body['i'] ?? -1);
if ($i < 0 || $i >= (int)($rec['images'] ?? 0)) json_error('Numero del disegno non valido.', 400);
$img = share_decode_image($body['dataUrl'] ?? '');
if (!$img) json_error('Immagine non valida (JPEG, PNG o WebP fino a 4 MB).', 400);
$dir = share_img_dir($slug);
if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) json_error('Impossibile salvare il disegno.', 500);
foreach (glob($dir . '/' . $i . '.*') ?: [] as $old) @unlink($old);
if (atomic_write($dir . '/' . $i . '.' . $img[1], $img[0]) === false) json_error('Impossibile salvare il disegno.', 500);
json_ok(['i' => $i]);
