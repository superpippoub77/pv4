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

// GET /api/workouts - Lista allenamenti dell'utente
if ($method === 'GET' && count($path) == 1) {
    $user = $db->getUser($payload['username']);
    $workouts = $db->getWorkoutsByUser($user['id']);
    sendJSON(['workouts' => $workouts], 200);
}

// GET /api/workouts/all - Lista tutti gli allenamenti (admin)
else if ($method === 'GET' && count($path) == 2 && $path[1] === 'all') {
    $workouts = $db->getAllWorkouts();
    sendJSON(['workouts' => $workouts], 200);
}

// POST /api/workouts - Crea/Salva allenamento
else if ($method === 'POST' && count($path) == 1) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    $objective = $input['objective'] ?? '';
    $observations = $input['observations'] ?? '';
    $data = $input['data'] ?? [];
    $sport = $input['sport'] ?? 'volleyball';

    if (empty($name)) {
        sendError('Nome allenamento richiesto', 400);
    }

    if (empty($data)) {
        sendError('Dati allenamento richiesti', 400);
    }

    $user = $db->getUser($payload['username']);
    $id = $db->addWorkout($name, $payload['username'], $user['id'], $objective, $observations, $data, $sport);
    sendJSON(['id' => $id, 'name' => $name, 'message' => 'Allenamento salvato con successo'], 201);
}

// GET /api/workouts/{id} - Ottieni allenamento
else if ($method === 'GET' && count($path) == 2) {
    $id = (int)$path[1];
    $workout = $db->getWorkout($id);
    
    if (!$workout) {
        sendError('Allenamento non trovato', 404);
    }
    
    sendJSON($workout, 200);
}

// PUT /api/workouts/{id} - Aggiorna allenamento
else if ($method === 'PUT' && count($path) == 2) {
    $id = (int)$path[1];
    $input = json_decode(file_get_contents('php://input'), true);
    
    $workout = $db->getWorkout($id);
    if (!$workout) {
        sendError('Allenamento non trovato', 404);
    }

    $name = $input['name'] ?? $workout['name'];
    $objective = $input['objective'] ?? $workout['objective'];
    $observations = $input['observations'] ?? $workout['observations'];
    $data = $input['data'] ?? $workout['data'];
    $sport = $input['sport'] ?? $workout['sport'];

    $db->updateWorkout($id, $name, $objective, $observations, $data, $sport);
    sendJSON(['id' => $id, 'message' => 'Allenamento aggiornato con successo'], 200);
}

// DELETE /api/workouts/{id} - Elimina allenamento
else if ($method === 'DELETE' && count($path) == 2) {
    $id = (int)$path[1];
    $workout = $db->getWorkout($id);
    
    if (!$workout) {
        sendError('Allenamento non trovato', 404);
    }

    $db->deleteWorkout($id);
    sendJSON(['message' => 'Allenamento eliminato con successo'], 200);
}

else {
    sendError('Endpoint non trovato', 404);
}
?>
