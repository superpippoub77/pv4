<?php
/**
 * Testi degli esercizi visibili all'utente (i suoi e quelli pubblici), per
 * cercare nella libreria l'esercizio che corrisponde a una richiesta scritta
 * (usato da "Genera allenamento"). Solo lettura.
 *   GET → { items: [ { id, name, ownerName, mine, tipologia, text } ] }
 */
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Metodo non consentito, usare GET.', 405);
}

$out = [];
foreach (read_index() as $e) {
    if (project_is_trashed($e)) continue;
    $mine = ($e['ownerId'] ?? null) === $user['id'];
    if (!$mine && !project_is_public($e)) continue;
    if (!safe_id($e['id'] ?? null)) continue;

    $text = '';
    $tipologia = '';
    $raw = @file_get_contents(project_path($e['id']));
    $p = $raw !== false ? json_decode($raw, true) : null;
    $d = is_array($p) && is_array($p['data'] ?? null) ? $p['data'] : [];
    if ($d) {
        $parts = [$d['title'] ?? '', $d['note'] ?? '', $d['descrizione'] ?? ''];
        foreach (($d['exerciseSteps'] ?? []) as $s) {
            $parts[] = is_array($s) ? (($s['text'] ?? '') . ' ' . ($s['name'] ?? '')) : (string)$s;
        }
        $text = utf8_cut(trim(implode(' ', array_filter(array_map('strval', $parts)))), 4000);
        $tipologia = (string)($d['tipologia'] ?? '');
    }
    $out[] = [
        'id'        => $e['id'],
        'name'      => $e['name'] ?? '',
        'ownerName' => $e['ownerName'] ?? '',
        'mine'      => $mine,
        'tipologia' => $tipologia,
        'text'      => $text,
    ];
}
json_ok(['items' => $out]);
