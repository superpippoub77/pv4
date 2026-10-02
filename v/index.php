<?php
/**
 * Pagina di consultazione di un link condiviso: …/v/<slug> (oppure …/v/?s=<slug>).
 * Mostra SOLO l'allenamento o l'esercizio (sola lettura), senza account e senza editor,
 * con i meta per l'anteprima del link (Facebook, WhatsApp, Telegram, X…).
 */
require_once __DIR__ . '/../cloud/config.php';
require_once __DIR__ . '/../cloud/shares_lib.php';

$slug = $_GET['s'] ?? '';
if ($slug === '') {
    // …/v/<slug> (riscrittura di .htaccess, oppure pagina di errore 404 di Apache)
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
    if (preg_match('#/v/([a-z0-9-]+)/?$#', $path, $m)) $slug = $m[1];
}
$rec = share_read($slug);
$root = share_app_root();
// la pagina può essere servita anche da …/v/index.php o come pagina 404: la radice dell'app la ricavo dallo script
http_response_code($rec ? 200 : 404);
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

$title = $rec ? $rec['title'] : 'Link non disponibile';
$items = $rec['payload']['items'] ?? [];
$kindLabel = $rec && $rec['kind'] === 'exercise' ? 'Esercizio' : 'Allenamento';
$desc = '';
if ($rec) {
    $p = $rec['payload'];
    $desc = trim((string)($p['objective'] ?? ''));
    if ($desc === '' && count($items) === 1) $desc = trim((string)($items[0]['text'] ?? ''));
    $n = count($items);
    $extra = $rec['kind'] === 'exercise' ? 'Esercizio di pallavolo' : "Allenamento di pallavolo: $n esercizi" . ($n ? ' con disegni' : '');
    $desc = $desc !== '' ? $desc . ' — ' . $extra : $extra;
    $desc .= ' · VolleyProW4';
    if (function_exists('mb_substr')) $desc = mb_substr(preg_replace('/\s+/', ' ', $desc), 0, 280);
    else $desc = substr(preg_replace('/\s+/', ' ', $desc), 0, 280);
}
$imgIdx = null;
foreach ($items as $it) if (isset($it['image']) && is_int($it['image'])) { $imgIdx = $it; break; }
$ogImage = $rec ? share_image_url($slug, $imgIdx ? $imgIdx['image'] : 999) : share_origin() . $root . '/data/images/og-image.jpg';
$ogW = $imgIdx['w'] ?? null; $ogH = $imgIdx['h'] ?? null;
if (!$imgIdx) { $ogW = 1200; $ogH = 630; }

// visite (non contano le anteprime dei social)
if ($rec && !preg_match('/bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview|skype/i', $_SERVER['HTTP_USER_AGENT'] ?? '')) {
    $f = share_path($slug);
    $hdl = @fopen($f, 'c+');
    if ($hdl && flock($hdl, LOCK_EX)) {
        $raw = stream_get_contents($hdl);
        $d = json_decode($raw, true);
        if (is_array($d)) {
            $d['views'] = (int)($d['views'] ?? 0) + 1;
            ftruncate($hdl, 0); rewind($hdl);
            fwrite($hdl, json_encode($d, JSON_UNESCAPED_UNICODE));
            fflush($hdl);
        }
        flock($hdl, LOCK_UN);
    }
    if ($hdl) fclose($hdl);
}

// dati per la pagina (senza lo schema completo dei disegni, che serve solo per «Apri in VolleyProW4»)
$view = null;
if ($rec) {
    $view = $rec;
    unset($view['ownerId']);
    foreach ($view['payload']['items'] ?? [] as $k => $it) {
        $view['payload']['items'][$k]['hasSchema'] = !empty($it['schema']);
        unset($view['payload']['items'][$k]['schema']);
    }
    $view['url'] = share_url($slug);
    $view['imageBase'] = $root . '/cloud/share_image.php?s=' . rawurlencode($slug) . '&i=';
    $view['appUrl'] = $root . '/index.html';
}
$json = json_encode($view, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$url = $rec ? share_url($slug) : share_origin() . $root . '/';
?><!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= h($title) ?> · <?= h($kindLabel) ?> · VolleyProW4</title>
<meta name="description" content="<?= h($desc) ?>">
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#0b1d3a">
<link rel="canonical" href="<?= h($url) ?>">
<meta property="og:type" content="article">
<meta property="og:url" content="<?= h($url) ?>">
<meta property="og:site_name" content="VolleyProW4">
<meta property="og:title" content="<?= h($title) ?>">
<meta property="og:description" content="<?= h($desc) ?>">
<meta property="og:image" content="<?= h($ogImage) ?>">
<meta property="og:image:secure_url" content="<?= h($ogImage) ?>">
<?php if ($ogW && $ogH): ?>
<meta property="og:image:width" content="<?= (int)$ogW ?>">
<meta property="og:image:height" content="<?= (int)$ogH ?>">
<?php endif; ?>
<meta property="og:image:alt" content="<?= h($title) ?>">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= h($title) ?>">
<meta name="twitter:description" content="<?= h($desc) ?>">
<meta name="twitter:image" content="<?= h($ogImage) ?>">
<link rel="icon" type="image/png" sizes="32x32" href="<?= h($root) ?>/data/images/favicon/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="<?= h($root) ?>/data/images/favicon/apple-touch-icon.png">
<link rel="stylesheet" href="<?= h($root) ?>/v/viewer.css?v=1">
</head>
<body>
<div id="app" class="vw"></div>
<noscript><p style="padding:20px">Per vedere <?= h(strtolower($kindLabel)) ?> serve JavaScript.</p></noscript>
<script>window.PV4_SHARE = <?= $json ?>;</script>
<script src="<?= h($root) ?>/v/viewer.js?v=1"></script>
</body>
</html>
