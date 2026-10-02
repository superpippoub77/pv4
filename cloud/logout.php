<?php
require_once __DIR__ . '/common.php';

// Con JWT non c'è nulla da "distruggere" lato server come con le sessioni:
// il logout reale si ottiene alzando tokenValidAfter dell'utente ad ADESSO,
// così ogni token emesso finora (incluso quello appena usato) smette subito
// di essere accettato da current_user(), anche se non ancora scaduto.
$user = current_user();
if ($user) {
    $users = read_users();
    foreach ($users as &$u) {
        if ($u['id'] === $user['id']) {
            $u['tokenValidAfter'] = time();
            break;
        }
    }
    unset($u);
    write_users($users);
}

json_ok();
