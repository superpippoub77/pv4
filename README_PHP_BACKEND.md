# PV4 Backend PHP con JWT Authentication

## 🚀 Quick Start

### 1. Avvia il server PHP
```bash
cd /workspaces/pv4
php -S localhost:8000
```

### 2. Accedi a login.html
Apri il browser: **http://localhost:8000/login.html**

Login con:
- Username: `admin`
- Password: `1234`

## 📋 Architettura

### Backend PHP
- **api/base.php** - Classi Database e JWTHandler
- **api/auth.php** - Endpoint login
- **api/users.php** - Gestione utenti
- **api/config.php** - Configurazione app
- **api/exercises.php** - Libreria esercizi

### Database SQLite
- **data/app.db** - Database principale
- Tabelle: `users`, `configuration`, `exercises`

### Frontend
- **login.html** - Interfaccia login
- **components/api-client.js** - Client API con JWT
- **components/login-manager.js** - Gestione sessioni

## 🔐 Autenticazione JWT

### Login
```bash
curl -X POST http://localhost:8000/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

Risposta:
```json
{
  "token": "eyJhbGc...",
  "username": "admin"
}
```

### Usare il token
Tutte le API (tranne login) richiedono:
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8000/api/users.php
```

## 📡 API Endpoints

### POST /api/auth.php - Login
```json
Request:
{
  "username": "admin",
  "password": "1234"
}

Response:
{
  "token": "eyJhbGc...",
  "username": "admin"
}
```

### GET /api/users.php - Lista utenti
```bash
Authorization: Bearer {token}
```

### POST /api/users.php - Crea utente
```json
{
  "username": "newuser",
  "password": "pass123",
  "salt": "salt123",
  "expiration": "2025-12-31"
}
```

### GET /api/users.php/:username - Ottieni utente
```bash
Authorization: Bearer {token}
```

### GET /api/config.php?key=app_config - Ottieni config
```bash
Authorization: Bearer {token}
```

### POST /api/config.php - Salva config
```json
{
  "key": "app_config",
  "value": { /* config */ }
}
```

### GET /api/exercises.php - Lista esercizi
```bash
Authorization: Bearer {token}
```

### POST /api/exercises.php - Crea esercizio
```json
{
  "name": "Esercizio 1",
  "category": "ricezione",
  "sport": "volleyball",
  "description": "Descrizione",
  "data": { /* exercise data */ }
}
```

### GET /api/exercises.php/:id - Ottieni esercizio
```bash
Authorization: Bearer {token}
```

## 💻 Utilizzo nei componenti

### JavaScript
```javascript
// Inizializza client
const api = new APIClient('/api');
const loginManager = new LoginManager(api);

// Login
await loginManager.login('admin', '1234');

// API calls
const users = await api.getUsers();
const config = await api.getConfig('app_config');
const exercises = await api.getExercises();

// Logout
loginManager.logout();
```

## 🔧 Configurazione

### Environment
- PHP 7.4+
- SQLite3 (built-in)
- PDO SQLite

### Database
Il database SQLite viene creato automaticamente in `data/app.db`

### JWT
- Secret: `pv4-secret-key-2024` (modificare in `api/base.php`)
- Expiration: 24 ore
- Algorithm: HS256

## 🛡️ Sicurezza

### Implementato
- ✅ JWT Authentication
- ✅ Token expiration
- ✅ CORS headers
- ✅ Input validation
- ✅ Prepared statements (SQL injection prevention)

### Da migliorare in produzione
- ⚠️ Modificare il secret JWT
- ⚠️ Usare password hashing (password_hash)
- ⚠️ Configurare CORS specificamente
- ⚠️ Abilitare HTTPS
- ⚠️ Rate limiting
- ⚠️ Database backups

## 📊 Struttura Database

### Tabella `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT,
    expiration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Tabella `configuration`
```sql
CREATE TABLE configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Tabella `exercises`
```sql
CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    sport TEXT,
    description TEXT,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🧪 Testing

### Testare login
```bash
curl -X POST http://localhost:8000/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

### Testare API protetto
```bash
TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users.php
```

### Verificare database
```bash
php api/init.php
```

## 📝 Note

- Il token JWT è salvato in localStorage nel browser
- La sessione viene ripristinata al reload della pagina
- Gli endpoint sono case-sensitive
- Tutte le response sono in JSON

## 🐛 Troubleshooting

### Database file not found
```bash
chmod 777 data/
chmod 777 data/app.db
```

### Port already in use
```bash
lsof -i :8000
pkill -f "php -S"
```

### PHP extension missing
```bash
php -m | grep sqlite
# Se non presente, installare: apt-get install php-sqlite3
```
