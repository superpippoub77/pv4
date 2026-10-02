<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
// L'autenticazione ora passa dall'header "Authorization" (JWT), non da un
// cookie di sessione: il CORS può restare permissivo come per qualunque API,
// senza bisogno di credenziali/cookie cross-origin.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_ok($data = []) {
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function check_api_key() {
    global $API_KEY;
    if ($API_KEY === '') return;
    $given = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : '';
    if (!hash_equals($API_KEY, $given)) {
        json_error('Chiave API mancante o non valida.', 401);
    }
}

function ensure_library_dir() {
    if (!is_dir(LIBRARY_DIR)) {
        if (!mkdir(LIBRARY_DIR, 0775, true) && !is_dir(LIBRARY_DIR)) {
            json_error('Impossibile creare la cartella della libreria sul server. Verifica i permessi di scrittura.', 500);
        }
    }
    $htaccess = LIBRARY_DIR . '/.htaccess';
    if (!file_exists($htaccess)) {
        // Blocca l'accesso diretto ai file della libreria via URL: si passa sempre dall'API.
        @file_put_contents($htaccess, "Require all denied\nDeny from all\n");
    }
}

// ---------------------------------------------------------------------------
// PROTEZIONE DEI DATI CONDIVISI
// index.json, folders.json e users/index.json contengono i dati di TUTTI gli
// utenti e vengono riletti e riscritti per intero a ogni modifica. Senza
// protezioni, due richieste quasi contemporanee potevano leggere un file a metà
// scrittura, trattarlo come vuoto e cancellare l'elenco di tutti. Quindi:
//  - una sola richiesta per volta può modificare i dati (blocco su file);
//  - ogni file viene scritto su un temporaneo e poi sostituito in un colpo solo;
//  - un file illeggibile non viene MAI trattato come vuoto: si usa l'ultima
//    copia buona (.bak) oppure la richiesta si ferma senza salvare nulla.
// ---------------------------------------------------------------------------
function atomic_write($path, $data) {
    $tmp = $path . '.tmp-' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $data) === false) { @unlink($tmp); return false; }
    if (!@rename($tmp, $path)) {                    // filesystem che non sostituiscono con rename
        $ok = @copy($tmp, $path); @unlink($tmp);
        return $ok ? strlen($data) : false;
    }
    return strlen($data);
}
function read_json_list($file) {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    $data = ($raw === false || $raw === '') ? null : json_decode($raw, true);
    if (is_array($data)) return $data;
    $bak = $file . '.bak';                           // file illeggibile: ultima copia buona
    if (file_exists($bak)) {
        $b = json_decode((string)@file_get_contents($bak), true);
        if (is_array($b)) { error_log('VolleyProW4: ' . basename($file) . ' illeggibile, uso la copia .bak'); return $b; }
    }
    json_error('Archivio dei dati temporaneamente illeggibile: nessuna modifica è stata salvata. Riprova tra poco; se il problema continua, contatta l\'amministratore.', 503);
}
function write_json_list($file, $items) {
    $json = json_encode(array_values($items), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) json_error('Errore interno nella preparazione dei dati da salvare.', 500);
    if (file_exists($file)) @copy($file, $file . '.bak');   // copia di sicurezza dell'ultima versione buona
    if (atomic_write($file, $json) === false) json_error('Impossibile salvare i dati sul server.', 500);
}
function acquire_data_lock() {
    if (!empty($GLOBALS['__spikecut_lock'])) return;
    ensure_library_dir();
    $h = @fopen(LIBRARY_DIR . '/.data.lock', 'c');
    if (!$h) return;                                  // blocco non disponibile: si prosegue come prima
    $t0 = microtime(true);
    while (!flock($h, LOCK_EX | LOCK_NB)) {
        if (microtime(true) - $t0 > 10) { fclose($h); json_error('Il server è occupato: riprova tra qualche secondo.', 503); }
        usleep(40000);
    }
    $GLOBALS['__spikecut_lock'] = $h;
    register_shutdown_function(function () { $h = $GLOBALS['__spikecut_lock']; if ($h) { flock($h, LOCK_UN); fclose($h); } });
}

function read_index() {
    ensure_library_dir();
    return storage_mode() === 'json' ? read_json_list(INDEX_FILE) : db_read_table('projects');
}

function write_index($items) {
    ensure_library_dir();
    if (storage_mode() === 'json') write_json_list(INDEX_FILE, $items); else db_write_table('projects', $items);
}

// Visibilità: un progetto è pubblico se il proprietario l'ha condiviso, oppure
// se è "generico" (senza proprietario): i progetti generici sono sempre pubblici.
function project_is_generic($p) { return empty($p['ownerId']); }

// Cestino: un progetto eliminato resta recuperabile per TRASH_DAYS giorni, poi viene cancellato davvero
define('TRASH_DAYS', 30);
function project_is_trashed($p) { return !empty($p['trashed']); }
// cancellazione definitiva: file del progetto e tutte le sue versioni salvate
function purge_project_files($id) {
    $path = project_path($id);
    if (file_exists($path)) @unlink($path);
    $vd = versions_dir($id);
    if (is_dir($vd)) { foreach (glob($vd . '/*') ?: [] as $f) @unlink($f); @rmdir($vd); }
}
function project_is_public($p) { return !empty($p['shared']) || project_is_generic($p); }

// Accetta solo id generati dal server (esadecimali): evita path traversal
// o accessi a file arbitrari tramite l'id passato dal client.
function safe_id($id) {
    return is_string($id) && preg_match('/^[a-f0-9]{16,40}$/', $id) === 1;
}

function project_path($id) {
    return LIBRARY_DIR . '/' . $id . '.json';
}

/* ============================================================
   CARTELLE — organizzazione libera della propria libreria in
   cartelle (anche annidate), come in un file manager. Ogni cartella
   appartiene a un utente; un progetto o una sottocartella con
   folderId/parentId null sta nella cartella principale (radice).
============================================================ */

function read_folders() {
    ensure_library_dir();
    return storage_mode() === 'json' ? read_json_list(FOLDERS_FILE) : db_read_table('folders');
}

function write_folders($folders) {
    ensure_library_dir();
    if (storage_mode() === 'json') write_json_list(FOLDERS_FILE, $folders); else db_write_table('folders', $folders);
}

// null (radice) è sempre valido; altrimenti l'id deve avere il formato giusto.
function safe_folder_id($id) {
    return $id === null || (is_string($id) && preg_match('/^[a-f0-9]{16,40}$/', $id) === 1);
}

// Vero se $folderId è null (radice, sempre permesso) oppure è una cartella
// che esiste davvero ed appartiene a $userId.
function folder_usable_by($folders, $folderId, $userId) {
    if ($folderId === null) return true;
    foreach ($folders as $f) {
        if ($f['id'] === $folderId) return $f['ownerId'] === $userId;
    }
    return false;
}

// Impedisce di spostare una cartella dentro se stessa o in una propria
// discendente (creerebbe un ciclo nell'albero).
function folder_is_descendant_or_self($folders, $candidateId, $ancestorId) {
    if ($candidateId === $ancestorId) return true;
    $byId = [];
    foreach ($folders as $f) $byId[$f['id']] = $f;
    $cur = $candidateId;
    $guard = 0;
    while ($cur !== null && isset($byId[$cur]) && $guard < 200) {
        $parent = $byId[$cur]['parentId'] ?? null;
        if ($parent === $ancestorId) return true;
        $cur = $parent;
        $guard++;
    }
    return false;
}

/* ============================================================
   CRONOLOGIA VERSIONI — ad ogni salvataggio che sovrascrive un
   progetto esistente, lo stato precedente viene conservato qui
   prima di essere sostituito, così si può tornare indietro.
============================================================ */

function versions_dir($id) {
    return LIBRARY_DIR . '/versions/' . $id;
}

function ensure_versions_dir($id) {
    $dir = versions_dir($id);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
            json_error('Impossibile creare la cronologia versioni sul server.', 500);
        }
    }
}

// Versioni FISSATE: l'utente dà un nome a una versione ("Approvata dal cliente") perché resti
// per sempre. Sono registrate in versions/<id>/pins.json { "file": {label, note, pinnedAt, pinnedBy} }
// e la pulizia delle versioni vecchie non le cancella mai.
// taglia un testo a $n caratteri senza spezzare le lettere accentate (non richiede l'estensione mbstring)
function utf8_cut($s, $n) {
    if (function_exists('mb_substr')) return mb_substr($s, 0, $n, 'UTF-8');
    return preg_match('/^.{0,' . (int) $n . '}/us', $s, $m) ? $m[0] : substr($s, 0, $n);
}
function pins_path($id) { return versions_dir($id) . '/pins.json'; }
function read_pins($id) {
    $p = pins_path($id);
    if (!file_exists($p)) return [];
    $d = json_decode(file_get_contents($p), true);
    return is_array($d) ? $d : [];
}
function write_pins($id, $pins) {
    ensure_versions_dir($id);
    atomic_write(pins_path($id), json_encode((object) $pins, JSON_UNESCAPED_UNICODE));
}

// Salva $projectData (lo stato PRECEDENTE al salvataggio in corso) come
// nuova voce della cronologia, e pota le versioni più vecchie oltre il
// limite configurato (le versioni fissate non contano e non si cancellano).
function snapshot_version($id, $projectData) {
    ensure_versions_dir($id);
    $fname = ((int) round(microtime(true) * 1000)) . '_' . bin2hex(random_bytes(2)) . '.json';
    atomic_write(versions_dir($id) . '/' . $fname, json_encode($projectData, JSON_UNESCAPED_UNICODE));

    $files = glob(versions_dir($id) . '/*_*.json');
    if ($files === false) return $fname;
    $pins = read_pins($id);
    $files = array_values(array_filter($files, function ($f) use ($pins) { return !isset($pins[basename($f)]); }));
    sort($files); // i nomi iniziano col timestamp: ordine cronologico crescente
    $excess = count($files) - MAX_VERSIONS_PER_PROJECT;
    for ($i = 0; $i < $excess; $i++) {
        @unlink($files[$i]);
    }
    return $fname;
}

// Accetta solo nomi di file versione generati da snapshot_version(): evita
// path traversal tramite il parametro passato dal client.
function safe_version_file($f) {
    return is_string($f) && preg_match('/^[0-9]+_[a-f0-9]{4}\.json$/', $f) === 1;
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > MAX_PAYLOAD_BYTES) {
        json_error('Il progetto supera la dimensione massima consentita.', 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('Corpo della richiesta non valido: atteso JSON.', 400);
    }
    return $data;
}

/* ============================================================
   ACCOUNT UTENTE — registrazione, login, recupero password.
   Nessun database: un unico file indice con tutti gli utenti,
   password sempre salvate come hash (mai in chiaro).
============================================================ */

function ensure_users_dir() {
    if (!is_dir(USERS_DIR)) {
        if (!mkdir(USERS_DIR, 0775, true) && !is_dir(USERS_DIR)) {
            json_error('Impossibile creare la cartella utenti sul server. Verifica i permessi di scrittura.', 500);
        }
    }
    $htaccess = USERS_DIR . '/.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess, "Require all denied\nDeny from all\n");
    }
}

function read_users() {
    ensure_users_dir();
    return storage_mode() === 'json' ? read_json_list(USERS_INDEX_FILE) : db_read_table('users');
}

function write_users($users) {
    ensure_users_dir();
    if (storage_mode() === 'json') write_json_list(USERS_INDEX_FILE, $users); else db_write_table('users', $users);
}

function find_user_by_username($users, $username) {
    foreach ($users as $u) {
        if (isset($u['username']) && strcasecmp($u['username'], $username) === 0) return $u;
    }
    return null;
}

function find_user_by_email($users, $email) {
    foreach ($users as $u) {
        if (isset($u['email']) && strcasecmp($u['email'], $email) === 0) return $u;
    }
    return null;
}

function find_user_by_id($users, $id) {
    foreach ($users as $u) {
        if (isset($u['id']) && $u['id'] === $id) return $u;
    }
    return null;
}

/* ============================================================
   JWT (JSON Web Token) — firma e verifica HS256 scritte in PHP puro,
   senza librerie esterne (nessun composer richiesto sull'hosting).
   Il token contiene: sub (id utente), iat (emesso il), exp (scade il).
============================================================ */

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}

// Chiave di firma: generata da sola in modo casuale al primo utilizzo e
// salvata in users/.jwt_secret (cartella già protetta da .htaccess). Non va
// mai scritta a mano né trasmessa al client.
function jwt_secret() {
    static $cached = null;
    if ($cached !== null) return $cached;
    ensure_users_dir();
    if (file_exists(JWT_SECRET_FILE)) {
        $existing = trim((string) @file_get_contents(JWT_SECRET_FILE));
        if ($existing !== '') { $cached = $existing; return $cached; }
    }
    $cached = bin2hex(random_bytes(32));
    atomic_write(JWT_SECRET_FILE, $cached);
    @chmod(JWT_SECRET_FILE, 0600);
    return $cached;
}

function jwt_encode($payload) {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segments = [
        base64url_encode(json_encode($header, JSON_UNESCAPED_UNICODE)),
        base64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE)),
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, jwt_secret(), true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

// Restituisce il payload decodificato se la firma è valida e il token non è
// scaduto, altrimenti null. Non fa MAI fidamento sul contenuto senza aver
// prima verificato la firma con hash_equals (a tempo costante).
function jwt_decode($jwt) {
    if (!is_string($jwt) || $jwt === '') return null;
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    [$headerB64, $payloadB64, $sigB64] = $parts;
    $expected = hash_hmac('sha256', $headerB64 . '.' . $payloadB64, jwt_secret(), true);
    $actual = base64url_decode($sigB64);
    if (!hash_equals($expected, $actual)) return null;
    $payload = json_decode(base64url_decode($payloadB64), true);
    if (!is_array($payload)) return null;
    if (!isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

// L'header Authorization non arriva sempre nello stesso punto di $_SERVER a
// seconda di come PHP gira sull'hosting (mod_php, CGI, FastCGI...): li provo
// tutti nell'ordine più comune.
function get_authorization_header() {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) return trim($_SERVER['HTTP_AUTHORIZATION']);
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) return trim($value);
        }
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) return trim($value);
        }
    }
    return '';
}

function jwt_from_request() {
    $auth = get_authorization_header();
    if ($auth !== '' && preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) return $m[1];
    return null;
}

// Rilascia un nuovo token per l'utente indicato. $rememberSeconds è la
// durata: usa JWT_TTL_REMEMBER con "Ricordami", altrimenti JWT_TTL_DEFAULT.
function issue_jwt($user, $ttlSeconds) {
    $now = time();
    return jwt_encode([
        'sub' => $user['id'],
        'iat' => $now,
        'exp' => $now + $ttlSeconds,
    ]);
}

// Utente attualmente autenticato in base al token presentato, oppure null.
// Un token emesso PRIMA dell'ultimo logout (tokenValidAfter) viene rifiutato:
// è quello che permette un vero logout anche con un token altrimenti valido.
function current_user() {
    $token = jwt_from_request();
    if (!$token) return null;
    $payload = jwt_decode($token);
    if (!$payload || empty($payload['sub'])) return null;
    $users = read_users();
    $u = find_user_by_id($users, $payload['sub']);
    if (!$u) return null;
    $validAfter = $u['tokenValidAfter'] ?? 0;
    if (($payload['iat'] ?? 0) <= $validAfter) return null; // token emesso prima o nello stesso istante di un logout/reset password
    return $u;
}

// Come current_user(), ma interrompe la richiesta con errore 401 se non
// c'è nessuno collegato: da chiamare in cima alle API che richiedono login.
function require_login() {
    $u = current_user();
    if (!$u) json_error('Devi accedere al tuo account per usare questa funzione.', 401);
    return $u;
}

// Versione dell'utente sicura da restituire al client: mai l'hash password
// né il token di reset.
function public_user($u) {
    return ['id' => $u['id'], 'username' => $u['username'], 'email' => $u['email'], 'isAdmin' => is_admin($u)];
}

// Amministratori: quelli elencati in ADMIN_USERS, oppure (elenco vuoto) il primo utente registrato
function is_admin($u) {
    if (!$u || empty($u['id'])) return false;
    $list = defined('ADMIN_USERS') ? ADMIN_USERS : [];
    if (!empty($list)) return in_array(strtolower((string)$u['username']), array_map('strtolower', $list), true);
    $users = read_users();                          // in ordine di registrazione
    return !empty($users) && ($users[0]['id'] ?? null) === $u['id'];
}
function require_admin() {
    $u = require_login();
    if (!is_admin($u)) json_error('Questa funzione è riservata agli amministratori.', 403);
    return $u;
}

function safe_username($u) {
    return is_string($u) && preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $u) === 1;
}

function valid_email($e) {
    return is_string($e) && filter_var($e, FILTER_VALIDATE_EMAIL) !== false;
}

// URL di base del progetto (la cartella che contiene index.html), dedotto
// dalla richiesta corrente: usato per costruire il link nell'email di
// recupero password senza doverlo configurare a mano.
function site_base_url() {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // questo file sta in api/, la root del progetto è una cartella sopra
    $dir = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
    return $scheme . '://' . $host . $dir;
}

// Le richieste che modificano dati passano una alla volta; quelle di sola lettura
// non aspettano (grazie alla scrittura atomica non leggono mai un file a metà).
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'OPTIONS'
    && !in_array(basename($_SERVER['SCRIPT_NAME'] ?? ''), ['list.php', 'load.php', 'load_version.php', 'versions.php', 'me.php', 'admin_status.php', 'admin_users.php', 'admin_projects.php'], true)) {
    acquire_data_lock();
}
