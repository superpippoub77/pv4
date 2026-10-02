<?php
/**
 * LINK CONDIVISI (slug)
 * Un allenamento o un esercizio pubblicato in sola lettura: chi riceve il link
 * (…/v/<slug>) vede solo quello, senza account e senza aprire l'editor.
 *
 * Ogni link è un file library/shares/<slug>.json con i dati da mostrare
 * (titolo, intestazione, esercizi con descrizione, step, video, disegno) e,
 * nella cartella library/shares/<slug>/, le immagini dei disegni (0.jpg, 1.jpg…).
 * La cartella library non è raggiungibile via URL: si passa sempre da qui.
 * Lo slug contiene una parte casuale: il link non si indovina.
 */

define('SHARES_DIR', LIBRARY_DIR . '/shares');
define('SHARE_MAX_IMAGES', 60);
define('SHARE_MAX_IMAGE_BYTES', 4 * 1024 * 1024);

function ensure_shares_dir() {
    ensure_library_dir();
    if (!is_dir(SHARES_DIR) && !@mkdir(SHARES_DIR, 0775, true) && !is_dir(SHARES_DIR)) {
        json_error('Impossibile creare la cartella dei link condivisi sul server.', 500);
    }
}

function share_slug_ok($s) {
    return is_string($s) && preg_match('/^[a-z0-9](?:[a-z0-9-]{1,90}[a-z0-9])$/', $s) === 1;
}

function share_path($slug) { return SHARES_DIR . '/' . $slug . '.json'; }
function share_img_dir($slug) { return SHARES_DIR . '/' . $slug; }

/** «Allenamento 2 ottobre – Ricezione!» → «allenamento-2-ottobre-ricezione» */
function share_slugify($text) {
    $t = (string)$text;
    if (function_exists('iconv')) {
        $x = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t);
        if ($x !== false) $t = $x;
    }
    $t = strtolower($t);
    $t = preg_replace('/[^a-z0-9]+/', '-', $t);
    $t = trim($t, '-');
    if (strlen($t) > 60) $t = rtrim(substr($t, 0, 60), '-');
    return $t;
}

function share_random($n = 6) {
    $abc = 'abcdefghijkmnpqrstuvwxyz23456789';
    $s = '';
    for ($i = 0; $i < $n; $i++) $s .= $abc[random_int(0, strlen($abc) - 1)];
    return $s;
}

function share_read($slug) {
    if (!share_slug_ok($slug)) return null;
    $p = share_path($slug);
    if (!file_exists($p)) return null;
    $d = json_decode((string)@file_get_contents($p), true);
    return is_array($d) ? $d : null;
}

function share_delete_images($slug) {
    $dir = share_img_dir($slug);
    if (!is_dir($dir)) return;
    foreach (glob($dir . '/*') ?: [] as $f) @unlink($f);
    @rmdir($dir);
}

/** Cartella dell'app vista dal browser (es. /projects/pvw4), ricavata dallo script in cloud/ o v/ */
function share_app_root() {
    $dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $root = rtrim(str_replace('\\', '/', dirname($dir)), '/');
    return $root === '.' ? '' : $root;
}

function share_origin() {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') == 443);
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    if (!preg_match('/^[A-Za-z0-9.\-:\[\]]+$/', $host)) $host = 'localhost';
    return ($https ? 'https' : 'http') . '://' . $host;
}

function share_url($slug) { return share_origin() . share_app_root() . '/v/' . $slug; }
function share_image_url($slug, $i) { return share_origin() . share_app_root() . '/cloud/share_image.php?s=' . rawurlencode($slug) . '&i=' . (int)$i; }

/** Riassunto per gli elenchi */
function share_summary($r) {
    return [
        'slug' => $r['slug'], 'kind' => $r['kind'], 'title' => $r['title'],
        'ownerName' => $r['ownerName'] ?? '', 'created' => $r['created'] ?? null, 'updated' => $r['updated'] ?? null,
        'views' => (int)($r['views'] ?? 0), 'items' => count($r['payload']['items'] ?? []),
        'url' => share_url($r['slug'])
    ];
}

/** Testo semplice e limitato (i dati arrivano dal browser) */
function share_clean($v, $max = 4000) {
    if (is_array($v) || is_object($v)) return '';
    $s = (string)$v;
    if (function_exists('mb_check_encoding')) {
        if (!mb_check_encoding($s, 'UTF-8')) $s = mb_convert_encoding($s, 'UTF-8', 'UTF-8');
        return mb_substr($s, 0, $max);
    }
    if (strlen($s) <= $max) return $s;
    return preg_replace('/[\x80-\xBF]+$/', '', substr($s, 0, $max)); // non spezza un carattere a metà
}

/** Ripulisce ricorsivamente il contenuto da mostrare: solo stringhe, numeri, booleani, liste e oggetti */
function share_clean_tree($v, $depth = 0) {
    if ($depth > 12) return null;
    if (is_array($v)) {
        $out = [];
        $n = 0;
        foreach ($v as $k => $x) {
            if (++$n > 2000) break;
            $key = is_int($k) ? $k : share_clean($k, 60);
            $out[$key] = share_clean_tree($x, $depth + 1);
        }
        return $out;
    }
    if (is_string($v)) return share_clean($v, 20000);
    if (is_int($v) || is_float($v) || is_bool($v) || $v === null) return $v;
    return null;
}

/** data:image/jpeg;base64,… → [bytes, estensione] oppure null */
function share_decode_image($dataUrl) {
    if (!is_string($dataUrl) || !preg_match('#^data:image/(jpeg|jpg|png|webp);base64,(.+)$#s', $dataUrl, $m)) return null;
    $bin = base64_decode($m[2], true);
    if ($bin === false || strlen($bin) < 16 || strlen($bin) > SHARE_MAX_IMAGE_BYTES) return null;
    if (substr($bin, 0, 3) === "\xFF\xD8\xFF") return [$bin, 'jpg'];
    if (substr($bin, 0, 8) === "\x89PNG\r\n\x1a\n") return [$bin, 'png'];
    if (substr($bin, 0, 4) === 'RIFF' && substr($bin, 8, 4) === 'WEBP') return [$bin, 'webp'];
    return null;
}
