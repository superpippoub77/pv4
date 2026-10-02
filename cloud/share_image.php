<?php
/**
 * Disegno di un link condiviso (pubblico: serve alla pagina di consultazione e
 * all'anteprima dei link su Facebook, WhatsApp…). GET ?s=<slug>&i=<n>
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/shares_lib.php';
$slug = $_GET['s'] ?? '';
$i = (int)($_GET['i'] ?? 0);
$file = null;
if (share_slug_ok($slug) && $i >= 0 && $i < SHARE_MAX_IMAGES) {
    foreach (['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'] as $ext => $type) {
        $f = share_img_dir($slug) . '/' . $i . '.' . $ext;
        if (file_exists($f)) { $file = $f; $mime = $type; break; }
    }
}
if (!$file) {
    // nessun disegno: immagine di anteprima dell'app
    $file = __DIR__ . '/../data/images/og-image.jpg';
    $mime = 'image/jpeg';
    if (!file_exists($file)) { http_response_code(404); exit; }
}
$etag = '"' . md5($file . filemtime($file) . filesize($file)) . '"';
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=3600');
header('ETag: ' . $etag);
header('Access-Control-Allow-Origin: *');
if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
header('Content-Length: ' . filesize($file));
readfile($file);
