# pvw4
Professional VolleyBall Workout 4

## Account e libreria esercizi online (cartella `cloud/`)

Accesso, registrazione, recupero password e libreria esercizi (cartelle, esercizi privati e pubblici,
Cestino, versioni, amministrazione) usano le pagine PHP in `cloud/`, le stesse di SpikeCut.

- Serve PHP con `pdo_sqlite` (su Aruba è già presente). I dati stanno in `library/` (esercizi e database
  SQLite `pv4.sqlite`, con copie di sicurezza giornaliere) e `users/` (chiave dei token): le cartelle
  vengono create dal server, non sono nel repository e la pubblicazione FTP non le tocca mai.
- `cloud/.htaccess` serve perché Apache passi l'header `Authorization` agli script: senza, il login non resta attivo.
- Il primo utente che si registra è amministratore (oppure elencare i nomi in `ADMIN_USERS` in `cloud/config.php`).
- L'email di recupero password parte da `no-reply@<dominio>`: si cambia con `FROM_EMAIL` in `cloud/config.php`.
- `cloud/diagnostica.php` mostra quali database sono disponibili sul server.
