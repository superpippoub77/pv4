<?php
/** I miei link condivisi (l'amministratore con ?all=1 li vede tutti). GET */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/shares_lib.php';
check_api_key();
$user = require_login();
$all = !empty($_GET['all']) && is_admin($user);
$out = [];
if (is_dir(SHARES_DIR)) {
    foreach (glob(SHARES_DIR . '/*.json') ?: [] as $f) {
        $r = json_decode((string)@file_get_contents($f), true);
        if (!is_array($r) || empty($r['slug'])) continue;
        if (!$all && ($r['ownerId'] ?? null) !== $user['id']) continue;
        $out[] = share_summary($r);
    }
}
usort($out, function ($a, $b) { return strcmp((string)$b['updated'], (string)$a['updated']); });
json_ok(['shares' => $out]);
