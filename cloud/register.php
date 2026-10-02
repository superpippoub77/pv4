<?php
require_once __DIR__ . '/common.php';
check_api_key();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$username = trim((string)($body['username'] ?? ''));
$email    = trim((string)($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');

if (!safe_username($username)) {
    json_error('Il nome utente deve avere 3-30 caratteri: lettere, numeri, punto, trattino o underscore.');
}
if (!valid_email($email)) {
    json_error('Indirizzo email non valido.');
}
if (strlen($password) < 6) {
    json_error('La password deve avere almeno 6 caratteri.');
}

$users = read_users();
if (find_user_by_username($users, $username)) {
    json_error('Questo nome utente è già in uso.');
}
if (find_user_by_email($users, $email)) {
    json_error('Questo indirizzo email è già registrato.');
}

$user = [
    'id'              => bin2hex(random_bytes(12)),
    'username'        => $username,
    'email'           => $email,
    'passwordHash'    => password_hash($password, PASSWORD_DEFAULT),
    'created'         => date('c'),
    'resetToken'      => null,
    'resetExpires'    => null,
    'tokenValidAfter' => 0,
];
$users[] = $user;
write_users($users);

$token = issue_jwt($user, JWT_TTL_DEFAULT);
json_ok(['user' => public_user($user), 'token' => $token, 'expiresIn' => JWT_TTL_DEFAULT]);
