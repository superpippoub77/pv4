<?php
require_once 'base.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = new Database();
$jwt = new JWTHandler();

// Verifica JWT token
$token = $jwt->getTokenFromHeader();
if (!$token) {
    sendError('Token non fornito', 401);
}
$payload = $jwt->verifyToken($token);
if (!$payload) {
    sendError('Token non valido o scaduto', 401);
}

$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

// GET /api/exercises - Lista esercizi
if ($method === 'GET' && count($path) == 1) {
    $exercises = $db->getAllExercises();
    sendJSON(['exercises' => $exercises], 200);
}

// POST /api/exercises - Crea esercizio
else if ($method === 'POST' && count($path) == 1) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    $category = $input['category'] ?? '';
    $sport = $input['sport'] ?? '';
    $description = $input['description'] ?? '';
    $data = $input['data'] ?? [];

    if (empty($name)) {
        sendError('Nome esercizio richiesto', 400);
    }

    $id = $db->addExercise($name, $category, $sport, $description, $data);
    sendJSON(['id' => $id, 'name' => $name], 201);
}

// GET /api/exercises/{id} - Ottieni esercizio
else if ($method === 'GET' && count($path) == 2) {
    $id = (int)$path[1];
    $exercise = $db->getExercise($id);
    
    if (!$exercise) {
        sendError('Esercizio non trovato', 404);
    }
    
    sendJSON($exercise, 200);
}

else {
    sendError('Endpoint non trovato', 404);
}
