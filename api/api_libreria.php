<?php
// Configurazione degli header per l'API
header('Content-Type: application/json');
// Potrebbe essere necessario per i test locali, in produzione si dovrebbe limitare
header('Access-Control-Allow-Origin: *'); 

$library_dir = '../volleyball_exercise_library/';
$json_files = [];

// Assicura che la directory esista e sia leggibile
if (is_dir($library_dir)) {
    // Legge tutti i file e le directory all'interno di 'libreria/'
    $files = scandir($library_dir);
    
    foreach ($files as $file) {
        // Ignora . e ..
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        // Verifica che sia un file e che termini con .json
        if (is_file($library_dir . $file) && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
            $json_files[] = $file;
        }
    }
    
    // Restituisce l'array dei nomi dei file in formato JSON
    echo json_encode($json_files);
    
} else {
    // Gestione errore se la directory non esiste
    http_response_code(500);
    echo json_encode(['error' => 'Directory della libreria non trovata.']);
}

// Nota: se usi un file .htaccess per il routing, questo script potrebbe essere incorporato diversamente.
// Per la soluzione più semplice, lo si chiama direttamente.
?>