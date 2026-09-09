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

// GET /api/config?key=app_config
if ($method === 'GET') {
    $key = $_GET['key'] ?? 'app_config';
    $config = $db->getConfig($key);
    
    if (!$config) {
        sendError('Configurazione non trovata', 404);
    }
    
    sendJSON($config, 200);
}

// POST /api/config - Salva configurazione
else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $key = $input['key'] ?? 'app_config';
    $value = $input['value'] ?? [];

    if (empty($key)) {
        sendError('Chiave configurazione richiesta', 400);
    }

    $db->setConfig($key, $value);
    sendJSON(['success' => true, 'key' => $key], 200);
}

else {
    sendError('Metodo non supportato', 405);
}
