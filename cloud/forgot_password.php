<?php
require_once __DIR__ . '/common.php';
check_api_key();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Metodo non consentito, usare POST.', 405);
}

$body = read_json_body();
$email = trim((string)($body['email'] ?? ''));

if (valid_email($email)) {
    $users = read_users();
    foreach ($users as &$u) {
        if (strcasecmp($u['email'], $email) === 0) {
            $u['resetToken']   = bin2hex(random_bytes(32));
            $u['resetExpires'] = time() + RESET_TOKEN_TTL;
            write_users($users);

            $link    = site_base_url() . '/index.html?reset=' . $u['resetToken'];
            $subject = 'Recupero password — VolleyProW4';
            $message = "Ciao " . $u['username'] . ",\n\n"
                     . "Hai richiesto di reimpostare la password del tuo account VolleyProW4.\n"
                     . "Apri questo link entro un'ora per sceglierne una nuova:\n\n"
                     . $link . "\n\n"
                     . "Se non hai richiesto tu questa operazione, ignora pure questa email:\n"
                     . "la tua password attuale resta valida.\n";
            $headers = 'From: ' . FROM_EMAIL . "\r\n";
            @mail($u['email'], $subject, $message, $headers);
            break;
        }
    }
    unset($u);
}

// Risposta identica indipendentemente dal fatto che l'email sia registrata
// o meno: evita di rivelare a chiunque quali indirizzi hanno un account.
json_ok(['message' => 'Se l\'indirizzo è registrato, riceverai a breve un\'email con il link per reimpostare la password.']);
