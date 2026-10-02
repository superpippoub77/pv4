<?php
/**
 * Versioni fissate (solo il proprietario del progetto).
 *   POST { "id": "...", "file": "<versione>", "label": "...", "note": "..." }  fissa una versione della cronologia
 *   POST { "id": "...", "current": true, "label": "...", "note": "..." }       fissa lo stato attuale del progetto
 *   POST { "id": "...", "file": "<versione>", "unpin": true }                  la toglie dalle fissate (resta nella cronologia)
 * Una versione fissata non viene mai cancellata dalla pulizia delle versioni vecchie.
 */
require_once __DIR__ . '/common.php';
check_api_key();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Metodo non consentito, usare POST.', 405);
$user = require_login();
$body = read_json_body();
$id = $body['id'] ?? null;
if (!safe_id($id)) json_error('Identificativo progetto non valido.', 400);
$path = project_path($id);
$current = json_decode(@file_get_contents($path), true);
if (!is_array($current)) json_error('Progetto non trovato.', 404);
if (($current['ownerId'] ?? null) !== $user['id']) json_error('Solo il proprietario può fissare le versioni di questo progetto.', 403);

$pins = read_pins($id);
if (!empty($body['unpin'])) {
    $file = $body['file'] ?? null;
    if (!safe_version_file($file)) json_error('Versione non valida.', 400);
    unset($pins[$file]);
    write_pins($id, $pins);
    json_ok(['file' => $file, 'pinned' => false]);
}

$label = trim((string) ($body['label'] ?? ''));
if ($label === '') json_error('Dai un nome alla versione da fissare.', 400);
$label = utf8_cut($label, 80);
$note = utf8_cut(trim((string) ($body['note'] ?? '')), 500);

if (!empty($body['current'])) {
    $file = snapshot_version($id, $current);     // lo stato attuale diventa una voce della cronologia
} else {
    $file = $body['file'] ?? null;
    if (!safe_version_file($file)) json_error('Versione non valida.', 400);
    if (!file_exists(versions_dir($id) . '/' . $file)) json_error('Versione non trovata.', 404);
}
$pins = read_pins($id);                          // riletto: snapshot_version potrebbe aver potato
$pins[$file] = ['label' => $label, 'note' => $note, 'pinnedAt' => date('c'), 'pinnedBy' => $user['username'] ?? ''];
write_pins($id, $pins);
json_ok(['file' => $file, 'pinned' => true, 'label' => $label]);
