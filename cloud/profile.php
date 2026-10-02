<?php
/**
 * Profilo dell'utente collegato (nome, cognome, telefono, ruolo, squadra, bio).
 * I dati stanno nel record dell'account, sotto "profile".
 *   GET  → { profile }
 *   POST → aggiorna il profilo (e l'email, se cambiata e libera)
 */
require_once __DIR__ . '/common.php';
check_api_key();
$user = require_login();

const PROFILE_FIELDS = ['first_name' => 60, 'last_name' => 60, 'phone' => 40, 'position' => 60, 'team' => 80, 'bio' => 1000];

function profile_of($u) {
    $p = is_array($u['profile'] ?? null) ? $u['profile'] : [];
    $out = ['username' => $u['username'], 'email' => $u['email'], 'isAdmin' => is_admin($u), 'created' => $u['created'] ?? null];
    foreach (PROFILE_FIELDS as $k => $max) $out[$k] = (string)($p[$k] ?? '');
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_ok(['profile' => profile_of($user)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito.', 405);
}

$body = read_json_body();
$users = read_users();

$email = trim((string)($body['email'] ?? $user['email']));
if (strcasecmp($email, $user['email']) !== 0) {
    if (!valid_email($email)) json_error('Indirizzo email non valido.');
    $other = find_user_by_email($users, $email);
    if ($other && $other['id'] !== $user['id']) json_error('Questo indirizzo email è già usato da un altro account.');
}

foreach ($users as $i => $u) {
    if (($u['id'] ?? null) !== $user['id']) continue;
    $p = is_array($u['profile'] ?? null) ? $u['profile'] : [];
    foreach (PROFILE_FIELDS as $k => $max) {
        if (array_key_exists($k, $body)) $p[$k] = utf8_cut(trim((string)$body[$k]), $max);
    }
    $users[$i]['profile'] = $p;
    $users[$i]['email'] = $email;
    $user = $users[$i];
    break;
}
write_users($users);

json_ok(['profile' => profile_of($user)]);
