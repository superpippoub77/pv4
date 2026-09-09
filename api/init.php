<?php
// Script di inizializzazione database per PHP
require_once 'api/base.php';

try {
    $db = new Database();
    
    // Verifica che le tabelle siano state create
    $pdo = new PDO('sqlite:data/app.db');
    
    // Conta utenti
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $usersCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Conta configurazioni
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM configuration");
    $configCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Conta esercizi
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM exercises");
    $exercisesCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database inizializzato',
        'tables' => [
            'users' => $usersCount,
            'configuration' => $configCount,
            'exercises' => $exercisesCount
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
