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

// Ottieni l'utente loggato
$currentUser = $db->getUser($payload['username']);
if (!$currentUser) {
    sendError('Utente non trovato', 404);
}

$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

// GET /api/profile - Ottieni profilo utente corrente
if ($method === 'GET' && count($path) == 1) {
    $profile = $db->getUserProfile($currentUser['id']);
    
    if (!$profile) {
        // Se il profilo non esiste, ritorna un profilo vuoto
        $profile = [
            'id' => null,
            'first_name' => '',
            'last_name' => '',
            'email' => '',
            'phone' => '',
            'team_id' => null,
            'position' => '',
            'bio' => '',
            'avatar_url' => null,
            'team_name' => null,
            'team_sport' => null
        ];
    }
    
    sendJSON($profile, 200);
}

// POST /api/profile - Aggiorna profilo utente
else if ($method === 'POST' && count($path) == 1) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $first_name = $input['first_name'] ?? '';
    $last_name = $input['last_name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $team_id = $input['team_id'] ?? null;
    $position = $input['position'] ?? '';
    $bio = $input['bio'] ?? '';

    try {
        $db->updateUserProfile(
            $currentUser['id'],
            $first_name,
            $last_name,
            $email,
            $phone,
            $team_id,
            $position,
            $bio
        );
        
        $profile = $db->getUserProfile($currentUser['id']);
        sendJSON($profile, 200);
    } catch (Exception $e) {
        sendError('Errore aggiornamento profilo: ' . $e->getMessage(), 400);
    }
}

// GET /api/profile/teams - Ottieni lista team
else if ($method === 'GET' && count($path) == 2 && $path[1] === 'teams') {
    $teams = $db->getTeams();
    sendJSON(['teams' => $teams], 200);
}

else {
    sendError('Endpoint non trovato', 404);
}
