# 🔄 Migrazione da Node.js a PHP Backend con JWT

## ✅ Operazioni completate

### 1. Backend PHP con SQLite
Sostituito Node.js server con backend PHP puro:
- ❌ Rimosso: `server.js` (Node.js)
- ✅ Creato: `api/base.php` - Classi Database e JWTHandler
- ✅ Creato: `api/auth.php` - Endpoint autenticazione JWT
- ✅ Creato: `api/users.php` - CRUD utenti
- ✅ Creato: `api/config.php` - CRUD configurazione
- ✅ Creato: `api/exercises.php` - CRUD esercizi

### 2. Database SQLite
Utilizzato SQLite per persistenza dati:
- **Posizione**: `/data/app.db`
- **Tabelle**:
  - `users` - Utenti (id, username, password, salt, expiration)
  - `configuration` - Config app (key, value)
  - `exercises` - Libreria esercizi (name, category, sport, data)
- **Auto-inizializzazione**: Tabelle create automaticamente al primo accesso
- **Dati iniziali**: Utente admin/1234 importato da `users.json`

### 3. Autenticazione JWT
Implementato JWT per sessioni stateless:
- **Algoritmo**: HS256
- **Expiration**: 24 ore
- **Secret**: `pv4-secret-key-2024` (da cambiare in produzione)
- **Storage**: localStorage nel browser
- **Header**: `Authorization: Bearer {token}`

### 4. Client JavaScript
Creati helper client-side:
- **`components/api-client.js`**
  - Gestisce JWT automaticamente
  - Singleton pattern
  - Metodi per tutte le API (users, config, exercises)
  - Logout automatico se token scade

- **`components/login-manager.js`**
  - Wrapper intorno a APIClient
  - Gestisce sessioni utente
  - Dispone eventi per login/logout
  - Ripristina sessione da localStorage

### 5. Interfaccia Login
- **`login.html`** - Pagina login moderna con:
  - Form login con validazione
  - Dashboard con info utente
  - Test API integrati
  - Design responsive
  - Gestione errori e loading

### 6. Documentazione
- **`README_PHP_BACKEND.md`** - Guida completa setup e utilizzo
- **`API_GUIDE.md`** - Documentazione dettagliata endpoint API
- **`.htaccess`** - Routing URL per endpoint PHP (opzionale)
- **`.user.ini`** - Configurazione PHP locale

## 📊 Confronto

### Prima (Node.js + JSON)
```
server.js → HTTP server statico
data/users.json → File JSON
data/configuration/config.js → File JS
sqlite3 npm package → Dipendenza node
```

### Dopo (PHP + SQLite)
```
api/*.php → Endpoint REST con JWT
data/app.db → Database SQLite unificato
php -S localhost:8000 → Server built-in
PDO SQLite → Driver nativo PHP
```

## 🔐 Flusso Autenticazione

```
1. User compila form login
   ↓
2. POST /api/auth.php {username, password}
   ↓
3. PHP verifica credentials in database
   ↓
4. Se ok: genera JWT token
   ↓
5. Client salva token in localStorage
   ↓
6. Nelle richieste successive: Authorization: Bearer {token}
   ↓
7. PHP verifica JWT prima di ogni API call
   ↓
8. Se token scade/invalido: logout automatico
```

## 🚀 Quick Start

### Avviare il server
```bash
cd /workspaces/pv4
php -S localhost:8000
```

### Accedere
Browser: `http://localhost:8000/login.html`
- Username: `admin`
- Password: `1234`

### Testare API
```bash
# Login
curl -X POST http://localhost:8000/api/auth.php \
  -d '{"username":"admin","password":"1234"}' \
  -H "Content-Type: application/json"

# Usare token
TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users.php
```

## 📁 Nuovi File Creati

```
/api/
  ├── base.php           ← Classi Database e JWTHandler
  ├── auth.php           ← Login endpoint
  ├── users.php          ← Users API
  ├── config.php         ← Config API
  ├── exercises.php      ← Exercises API
  └── init.php           ← Script test database

/components/
  ├── api-client.js      ← Client API con JWT
  └── login-manager.js   ← Gestione sessioni

/
  ├── login.html         ← Pagina login
  ├── .htaccess          ← Routing URL (opzionale)
  ├── .user.ini          ← Config PHP locale
  ├── README_PHP_BACKEND.md  ← Documentazione
  └── API_GUIDE.md       ← Guide API
```

## ✨ Vantaggi

- ✅ **Staples PHP built-in** - Niente dipendenze npm
- ✅ **JWT Stateless** - Niente sessioni server
- ✅ **SQLite Built-in** - Zero setup database
- ✅ **Standardizzato** - REST API standard
- ✅ **Sicuro** - Autenticazione JWT con expiration
- ✅ **Responsive** - Interfaccia moderna
- ✅ **Testato** - Endpoint verificati

## ⚠️ Prossimi Step (Produzione)

- [ ] Cambiare JWT secret
- [ ] Implementare password hashing (password_hash/password_verify)
- [ ] Configurare CORS specificamente
- [ ] Abilitare HTTPS
- [ ] Rate limiting su login
- [ ] Database backups automatici
- [ ] Logging errori
- [ ] Monitoraggio uptime

## 📚 Riferimenti Documentazione

1. **Setup iniziale**: Vedi `README_PHP_BACKEND.md` sezione "Quick Start"
2. **Endpoint API**: Vedi `API_GUIDE.md` per dettagli
3. **Utilizzo JS**: Vedi `login.html` per esempi
4. **Configurazione**: Vedi `api/base.php` per parametri JWT

## 🎯 Test Coverage

Verificato:
- ✅ Login con credenziali corrette
- ✅ JWT token generation
- ✅ API GET users con token
- ✅ Database SQLite creazione tabelle
- ✅ Utente admin importato
- ✅ CORS headers
- ✅ Error handling

---

**Data**: 2026-09-09
**Versione**: 1.0
**Status**: ✅ Pronto per uso
