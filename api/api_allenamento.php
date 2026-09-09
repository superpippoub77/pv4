<?php
require_once 'base.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = new Database();

try {
    // Leggi il filename dalla query string
    $filename = isset($_GET['filename']) ? $_GET['filename'] : '';
    
    if (empty($filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome file non fornito']);
        exit;
    }

    $workout = null;
    
    // Se è un numero, prova come ID
    if (is_numeric($filename)) {
        $workout = $db->getWorkout((int)$filename);
    } 
    
    // Altrimenti prova come nome
    if (!$workout) {
        $filename_clean = str_replace('.json', '', $filename);
        $workout = $db->getWorkoutByName($filename_clean);
    }
    
    if ($workout) {
        // Restituisce l'allenamento dal database
        echo json_encode($workout['data']);
        exit;
    }
    
    // Fallback: leggi dal filesystem per compatibilità con file vecchi
    $library_dir = '../volleyball_exercise_library/';
    
    // Controllo di sicurezza: pulizia e validazione del nome file
    if (strpos($filename, '..') !== false || pathinfo($filename, PATHINFO_EXTENSION) !== 'json') {
        http_response_code(400);
        echo json_encode(['error' => 'Nome file non valido']);
        exit;
    }

    $file_path = $library_dir . basename($filename);

    // Verifica se il file esiste
    if (!file_exists($file_path)) {
        http_response_code(404);
        echo json_encode(['error' => 'Allenamento non trovato']);
        exit;
    }

    // Legge il contenuto del file
    $json_content = file_get_contents($file_path);

    if ($json_content === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nella lettura del file']);
        exit;
    }

    // Tenta di decodificare per validare il JSON
    $decoded_json = json_decode($json_content);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(['error' => 'Il contenuto del file non è un JSON valido']);
        exit;
    }

    // Restituisce il contenuto JSON
    echo $json_content;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore nel caricamento dell\'allenamento: ' . $e->getMessage()]);
}
?>
