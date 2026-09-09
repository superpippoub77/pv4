<?php
// Configurazione headers (solo se non in CLI)
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

class Database {
    private $db;
    private $dbPath;

    public function __construct($dbPath = null) {
        if (!$dbPath) {
            $dbPath = __DIR__ . '/../data/app.db';
        }
        $this->dbPath = $dbPath;
        $this->db = new PDO('sqlite:' . $this->dbPath);
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->initializeTables();
    }

    private function initializeTables() {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                salt TEXT,
                expiration TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $this->db->exec("
            CREATE TABLE IF NOT EXISTS configuration (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $this->db->exec("
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                sport TEXT,
                description TEXT,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $this->db->exec("
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                sport TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $this->db->exec("
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                first_name TEXT,
                last_name TEXT,
                email TEXT,
                phone TEXT,
                team_id INTEGER,
                position TEXT,
                bio TEXT,
                avatar_url TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (team_id) REFERENCES teams(id)
            )
        ");

        // Importa utente admin se non esiste
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute(['admin']);
        if ($stmt->fetchColumn() == 0) {
            $this->addUser('admin', '1234', 'a1b2c3d4e5f6g7h8', '2025-12-31');
        }

        // Crea team di default se non esiste
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM teams WHERE name = ?");
        $stmt->execute(['Default Team']);
        if ($stmt->fetchColumn() == 0) {
            $this->db->exec("INSERT INTO teams (name, description, sport) VALUES ('Default Team', 'Team di default', 'volleyball')");
        }
    }

    public function getUser($username) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllUsers() {
        $stmt = $this->db->prepare("SELECT id, username, expiration FROM users");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addUser($username, $password, $salt, $expiration) {
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, password, salt, expiration) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$username, $password, $salt, $expiration]);
        return $this->db->lastInsertId();
    }

    // ===== USER PROFILES =====
    public function getUserProfile($user_id) {
        $stmt = $this->db->prepare("
            SELECT 
                up.id,
                up.first_name,
                up.last_name,
                up.email,
                up.phone,
                up.team_id,
                up.position,
                up.bio,
                up.avatar_url,
                t.name as team_name,
                t.sport as team_sport
            FROM user_profiles up
            LEFT JOIN teams t ON up.team_id = t.id
            WHERE up.user_id = ?
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateUserProfile($user_id, $first_name, $last_name, $email, $phone, $team_id, $position, $bio) {
        $stmt = $this->db->prepare("
            INSERT OR REPLACE INTO user_profiles 
            (user_id, first_name, last_name, email, phone, team_id, position, bio, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$user_id, $first_name, $last_name, $email, $phone, $team_id, $position, $bio]);
        return true;
    }

    // ===== TEAMS =====
    public function getTeams() {
        $stmt = $this->db->prepare("SELECT * FROM teams ORDER BY name");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTeam($id) {
        $stmt = $this->db->prepare("SELECT * FROM teams WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function addTeam($name, $description, $sport) {
        $stmt = $this->db->prepare(
            "INSERT INTO teams (name, description, sport) VALUES (?, ?, ?)"
        );
        $stmt->execute([$name, $description, $sport]);
        return $this->db->lastInsertId();
    }

    public function getConfig($key) {
        $stmt = $this->db->prepare("SELECT value FROM configuration WHERE key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? json_decode($row['value'], true) : null;
    }

    public function setConfig($key, $value) {
        $stmt = $this->db->prepare(
            "INSERT OR REPLACE INTO configuration (key, value) VALUES (?, ?)"
        );
        $stmt->execute([$key, is_string($value) ? $value : json_encode($value)]);
        return true;
    }

    public function getAllExercises() {
        $stmt = $this->db->prepare("SELECT * FROM exercises");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getExercise($id) {
        $stmt = $this->db->prepare("SELECT * FROM exercises WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['data'] = json_decode($row['data'], true);
        }
        return $row;
    }

    public function addExercise($name, $category, $sport, $description, $data) {
        $stmt = $this->db->prepare(
            "INSERT INTO exercises (name, category, sport, description, data) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$name, $category, $sport, $description, is_string($data) ? $data : json_encode($data)]);
        return $this->db->lastInsertId();
    }
}

class JWTHandler {
    private $secret;
    private $algorithm = 'HS256';

    public function __construct($secret = 'pv4-secret-key-2024') {
        $this->secret = $secret;
    }

    public function generateToken($username) {
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->algorithm]);
        $payload = json_encode([
            'username' => $username,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 ore
        ]);

        $headerEncoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payloadEncoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        
        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            $this->secret,
            true
        );
        $signatureEncoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    public function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        $headerEncoded = $parts[0];
        $payloadEncoded = $parts[1];
        $signatureEncoded = $parts[2];

        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            $this->secret,
            true
        );
        $expectedSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        if ($signatureEncoded !== $expectedSignature) {
            return null;
        }

        $payload = json_decode(base64_decode(strtr($payloadEncoded, '-_', '+/')), true);

        if ($payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    public function getTokenFromHeader() {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }
}

function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}
