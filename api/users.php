<?php
require_once 'base.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = new Database();
$jwt = new JWTHandler();

// Verifica JWT token per operazioni che non sono login
if ($method !== 'POST' || (isset($_GET['check']))) {
    $token = $jwt->getTokenFromHeader();
    if (!$token) {
        sendError('Token non fornito', 401);
    }
    $payload = $jwt->verifyToken($token);
    if (!$payload) {
        sendError('Token non valido o scaduto', 401);
    }
}

$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

// GET /api/users - Lista utenti (richiede auth)
if ($method === 'GET' && count($path) == 1) {
    $users = $db->getAllUsers();
    sendJSON(['users' => $users], 200);
}

// POST /api/users - Crea utente (richiede auth)
else if ($method === 'POST' && count($path) == 1) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $salt = $input['salt'] ?? 'salt-' . uniqid();
    $expiration = $input['expiration'] ?? '2025-12-31';

    if (empty($username) || empty($password)) {
        sendError('Username e password richiesti', 400);
    }

    try {
        $id = $db->addUser($username, $password, $salt, $expiration);
        sendJSON(['id' => $id, 'username' => $username], 201);
    } catch (Exception $e) {
        sendError('Username già esiste', 409);
    }
}

// GET /api/users/{username} - Ottieni utente
else if ($method === 'GET' && count($path) == 2) {
    $username = $path[1];
    $user = $db->getUser($username);
    
    if (!$user) {
        sendError('Utente non trovato', 404);
    }
    
    unset($user['password']);
    sendJSON($user, 200);
}

else {
    sendError('Endpoint non trovato', 404);
}
