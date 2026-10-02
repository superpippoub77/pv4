<?php
/**
 * Contenuto di un link condiviso (pubblico, sola lettura). GET ?s=<slug>
 * Serve per «Apri in VolleyProW4» (copia degli esercizi nell'editor di chi lo riceve).
 */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/shares_lib.php';
check_api_key();
$rec = share_read($_GET['s'] ?? '');
if (!$rec) json_error('Link non trovato o non più disponibile.', 404);
unset($rec['ownerId']);
$rec['url'] = share_url($rec['slug']);
json_ok(['share' => $rec]);
