<?php
// Configurazione degli header per l'API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 

// Ottiene il nome del file dalla query string
$filename = isset($_GET['filename']) ? $_GET['filename'] : '';

// Controllo di sicurezza: pulizia e validazione del nome file
// Impedisce la navigazione fuori dalla directory (path traversal)
if (empty($filename) || strpos($filename, '..') !== false || pathinfo($filename, PATHINFO_EXTENSION) !== 'json') {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Nome file non valido o mancante.']);
    exit;
}

$library_dir = 'volleyball_exercise_library/';
$file_path = $library_dir . basename($filename); // basename() previene manipolazioni path

// Verifica se il file esiste
if (!file_exists($file_path)) {
    http_response_code(404); // Not Found
    echo json_encode(['error' => 'Allenamento non trovato.']);
    exit;
}

// Legge il contenuto del file
$json_content = file_get_contents($file_path);

// Verifica se la lettura ha avuto successo e il contenuto è JSON valido (opzionale ma consigliato)
if ($json_content === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore nella lettura del file.']);
    exit;
}

// Tenta di decodificare per validare il JSON
$decoded_json = json_decode($json_content);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'Il contenuto del file non è un JSON valido.']);
    exit;
}

// Restituisce il contenuto JSON (PHP è in grado di inviare direttamente il contenuto letto)
echo $json_content;

// Nota: il contenuto di questo file verrà chiamato da JavaScript.
?>