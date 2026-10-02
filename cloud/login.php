<?php
require_once __DIR__ . '/common.php';
check_api_key();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$identifier = trim((string)($body['identifier'] ?? ''));
$password   = (string)($body['password'] ?? '');

if ($identifier === '' || $password === '') {
    json_error('Inserisci nome utente (o email) e password.');
}

$users = read_users();
$user = find_user_by_username($users, $identifier);
if (!$user) $user = find_user_by_email($users, $identifier);

if (!$user || !password_verify($password, $user['passwordHash'])) {
    json_error('Nome utente/email o password non corretti.', 401);
}

// ultimo accesso (visibile agli amministratori)
foreach ($users as $i => $u) {
    if (($u['id'] ?? null) === $user['id']) { $users[$i]['lastLogin'] = date('c'); $user = $users[$i]; break; }
}
write_users($users);

$ttl = !empty($body['remember']) ? JWT_TTL_REMEMBER : JWT_TTL_DEFAULT;
$token = issue_jwt($user, $ttl);

json_ok(['user' => public_user($user), 'token' => $token, 'expiresIn' => $ttl]);
