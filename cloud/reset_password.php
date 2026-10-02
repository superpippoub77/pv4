<?php
require_once __DIR__ . '/common.php';
check_api_key();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$token    = trim((string)($body['token'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($token === '' || preg_match('/^[a-f0-9]{64}$/', $token) !== 1) {
    json_error('Link di reimpostazione non valido o scaduto.');
}
if (strlen($password) < 6) {
    json_error('La password deve avere almeno 6 caratteri.');
}

$users = read_users();
$found = false;
foreach ($users as &$u) {
    if (!empty($u['resetToken']) && hash_equals($u['resetToken'], $token)) {
        if (($u['resetExpires'] ?? 0) < time()) {
            json_error('Questo link di reimpostazione è scaduto: richiedine uno nuovo.');
        }
        $u['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
        $u['resetToken']   = null;
        $u['resetExpires'] = null;
        $u['tokenValidAfter'] = time(); // invalida ogni accesso già aperto altrove
        $found = true;
        break;
    }
}
unset($u);

if (!$found) {
    json_error('Link di reimpostazione non valido o scaduto.');
}

write_users($users);
json_ok();
