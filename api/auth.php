<?php
require_once 'base.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = new Database();
$jwt = new JWTHandler();

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        sendError('Username e password richiesti', 400);
    }

    $user = $db->getUser($username);
    
    if (!$user) {
        sendError('Utente non trovato', 404);
    }

    // Verifica password (in produzione usare password_verify con hash)
    if ($user['password'] !== $password) {
        sendError('Password non valida', 401);
    }

    $token = $jwt->generateToken($username);
    sendJSON(['token' => $token, 'username' => $username], 200);
}
else {
    sendError('Metodo non supportato', 405);
}
