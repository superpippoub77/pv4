<?php
/**
 * Pubblica (o aggiorna) un link condiviso in sola lettura.
 * POST { "slug"?: "...", "kind": "workout"|"exercise", "title": "...", "slugBase"?: "...",
 *        "images": N, "payload": { ...contenuto da mostrare... } }
 *  - senza slug (o con lo slug di un link non tuo) ne crea uno nuovo: <titolo>-<parte casuale>;
 *  - con lo slug di un tuo link lo aggiorna: il link resta lo stesso.
 * Le immagini dei disegni (N) si caricano dopo, una per richiesta, con share_upload_image.php.
 */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/shares_lib.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito.', 405);
$user = require_login();
$body = read_json_body();

$kind = ($body['kind'] ?? '') === 'exercise' ? 'exercise' : 'workout';
$title = trim(share_clean($body['title'] ?? '', 160));
if ($title === '') $title = $kind === 'exercise' ? 'Esercizio' : 'Allenamento';
$payload = share_clean_tree($body['payload'] ?? []);
if (!is_array($payload)) $payload = [];
$images = max(0, min(SHARE_MAX_IMAGES, (int)($body['images'] ?? 0)));

ensure_shares_dir();
acquire_data_lock();

$slug = $body['slug'] ?? null;
$existing = share_slug_ok($slug) ? share_read($slug) : null;
if ($existing && ($existing['ownerId'] ?? null) !== $user['id'] && !is_admin($user)) $existing = null;

if (!$existing) {
    $base = share_slugify(trim((string)($body['slugBase'] ?? '')) !== '' ? $body['slugBase'] : $title);
    if ($base === '') $base = $kind === 'exercise' ? 'esercizio' : 'allenamento';
    do { $slug = $base . '-' . share_random(6); } while (file_exists(share_path($slug)));
}

$now = date('c');
$record = [
    'slug'      => $slug,
    'kind'      => $kind,
    'title'     => $title,
    'ownerId'   => $existing['ownerId'] ?? $user['id'],
    'ownerName' => $existing['ownerName'] ?? $user['username'],
    'created'   => $existing['created'] ?? $now,
    'updated'   => $now,
    'views'     => (int)($existing['views'] ?? 0),
    'images'    => $images,
    'payload'   => $payload,
];
// aggiornamento: i disegni vengono ricaricati da capo
if ($existing) share_delete_images($slug);
if (atomic_write(share_path($slug), json_encode($record, JSON_UNESCAPED_UNICODE)) === false) json_error('Impossibile salvare il link sul server.', 500);

json_ok(['slug' => $slug, 'url' => share_url($slug), 'updated' => $now, 'isNew' => !$existing]);
