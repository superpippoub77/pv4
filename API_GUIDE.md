# Guide per usare il nuovo backend PHP con JWT

## Setup

1. **Installa PHP 7.4+ con SQLite**:
```bash
sudo apt-get install php php-sqlite3 php-common php-curl
```

2. **Avvia il server PHP**:
```bash
cd /workspaces/pv4
php -S localhost:8000
```

3. **Nel browser**: Accedi a `http://localhost:8000`

## API Endpoints

### Login (pubblico)
```javascript
POST /api/auth
Content-Type: application/json

{
  "username": "admin",
  "password": "1234"
}

Risposta:
{
  "token": "eyJhbGc...",
  "username": "admin"
}
```

### Users (richiede JWT)
```javascript
// Ottieni lista utenti
GET /api/users
Authorization: Bearer {token}

// Crea utente
POST /api/users
Authorization: Bearer {token}
{
  "username": "newuser",
  "password": "password123",
  "salt": "salt123",
  "expiration": "2025-12-31"
}

// Ottieni utente
GET /api/users/:username
Authorization: Bearer {token}
```

### Configuration (richiede JWT)
```javascript
// Ottieni configurazione
GET /api/config?key=app_config
Authorization: Bearer {token}

// Salva configurazione
POST /api/config
Authorization: Bearer {token}
{
  "key": "app_config",
  "value": { /* config object */ }
}
```

### Exercises (richiede JWT)
```javascript
// Ottieni esercizi
GET /api/exercises
Authorization: Bearer {token}

// Crea esercizio
POST /api/exercises
Authorization: Bearer {token}
{
  "name": "Esercizio 1",
  "category": "ricezione",
  "sport": "volleyball",
  "description": "...",
  "data": { /* exercise data */ }
}

// Ottieni esercizio
GET /api/exercises/:id
Authorization: Bearer {token}
```

## Utilizzo nei componenti

```javascript
// Inizializza i client
const apiClient = new APIClient('/api');
const loginManager = new LoginManager(apiClient);

// Login
await loginManager.login('admin', '1234');

// Ottieni configurazione
const config = await apiClient.getConfig('app_config');

// Ottieni esercizi
const exercises = await apiClient.getExercises();

// Logout
loginManager.logout();
```

## Sicurezza

- **JWT scade dopo 24 ore**
- **Il token è salvato in localStorage**
- **Tutte le API (tranne login) richiedono il token nell'header Authorization**
- **CORS è abilitato per sviluppo (configurare in produzione)**

## Database

Il database SQLite è in: `/data/app.db`

Tabelle:
- `users` - Utenti con username/password
- `configuration` - Configurazione app
- `exercises` - Libreria esercizi
