<?php
require_once 'base.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = new Database();

try {
    // Leggi tutti gli allenamenti dal database
    $workouts = $db->getAllWorkouts();
    
    // Restituisce la lista degli allenamenti
    $workoutNames = array_map(function($workout) {
        return [
            'id' => $workout['id'],
            'name' => $workout['name'],
            'author' => $workout['author'],
            'objective' => $workout['objective'],
            'sport' => $workout['sport'],
            'created_at' => $workout['created_at'],
            'updated_at' => $workout['updated_at']
        ];
    }, $workouts);
    
    echo json_encode($workoutNames);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore nel caricamento della libreria: ' . $e->getMessage()]);
}
?>
