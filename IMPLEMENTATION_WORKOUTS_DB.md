# Implementazione Salvataggio Esercizi e Allenamenti su SQLite

## Sommario delle Modifiche

Tutte le transazioni di salvataggio degli esercizi e degli allenamenti sono ora salvate permanentemente nel database SQLite (`/data/app.db`).

---

## 1. Database - Nuova Tabella `workouts`

**File:** `api/base.php`

### Struttura della tabella
```sql
CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    author TEXT,
    user_id INTEGER,
    objective TEXT,
    observations TEXT,
    data TEXT NOT NULL,  -- Contiene l'intero JSON dell'allenamento
    sport TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Metodi CRUD aggiunti alla classe `Database`

- `getAllWorkouts()` - Restituisce tutti gli allenamenti (id, name, author, objective, sport, created_at, updated_at)
- `getWorkout($id)` - Ottiene un allenamento specifico con i dati completi (data JSON decodificato)
- `getWorkoutByName($name)` - Cerca un allenamento per nome
- `getWorkoutsByUser($user_id)` - Restituisce gli allenamenti di un utente
- `addWorkout($name, $author, $user_id, $objective, $observations, $data, $sport)` - Salva un nuovo allenamento
- `updateWorkout($id, $name, $objective, $observations, $data, $sport)` - Aggiorna un allenamento
- `deleteWorkout($id)` - Elimina un allenamento

---

## 2. Nuovi Endpoint API

**File:** `api/workouts.php` (creato)

### Endpoints disponibili

#### GET `/api/workouts` 
- **Descrizione:** Ottiene gli allenamenti dell'utente autenticato
- **Autenticazione:** JWT obbligatorio
- **Risposta:** `{"workouts": [...]}`

#### GET `/api/workouts/all`
- **Descrizione:** Ottiene tutti gli allenamenti (admin)
- **Autenticazione:** JWT obbligatorio
- **Risposta:** `{"workouts": [...]}`

#### POST `/api/workouts`
- **Descrizione:** Salva un nuovo allenamento
- **Autenticazione:** JWT obbligatorio
- **Body:**
  ```json
  {
    "name": "Nome Allenamento",
    "objective": "Obiettivo dell'allenamento",
    "observations": "Osservazioni",
    "data": { /* dati completi dell'allenamento */ },
    "sport": "volleyball"
  }
  ```
- **Risposta:** `{"id": 123, "name": "Nome Allenamento", "message": "Allenamento salvato con successo"}`

#### GET `/api/workouts/{id}`
- **Descrizione:** Ottiene un allenamento specifico con i dati completi
- **Autenticazione:** JWT obbligatorio
- **Risposta:** Workout completo con data JSON decodificato

#### PUT `/api/workouts/{id}`
- **Descrizione:** Aggiorna un allenamento esistente
- **Autenticazione:** JWT obbligatorio
- **Body:** Stessi campi del POST
- **Risposta:** `{"id": 123, "message": "Allenamento aggiornato con successo"}`

#### DELETE `/api/workouts/{id}`
- **Descrizione:** Elimina un allenamento
- **Autenticazione:** JWT obbligatorio
- **Risposta:** `{"message": "Allenamento eliminato con successo"}`

---

## 3. Client JavaScript - Metodi API Aggiunti

**File:** `components/api-client.js`

Nuovi metodi nella classe `APIClient`:

```javascript
async getWorkouts()                           // Ottiene allenamenti utente
async getAllWorkouts()                        // Ottiene tutti gli allenamenti
async getWorkout(id)                          // Ottiene allenamento specifico
async createWorkout(name, objective, observations, data, sport)  // Salva allenamento
async updateWorkout(id, name, objective, observations, data, sport)  // Aggiorna
async deleteWorkout(id)                       // Elimina allenamento
```

---

## 4. Frontend - Modifiche Salvataggio Allenamenti

**File:** `components/schemaeditor.js`

### Metodo `saveWorkout(fileName)` - AGGIORNATO

Il metodo è ora **asincrono** e:
1. ✅ Salva i dati nel database SQLite via API (`POST /api/workouts`)
2. ✅ Mostra un alert di successo con l'ID del salvataggio
3. ✅ Scarica il file JSON localmente come backup
4. ✅ Gestisce gli errori con messaggi appropriati

**Flusso di salvataggio:**
```
User salva allenamento → 
  saveWorkout(fileName) → 
    APIClient.createWorkout() → 
      /api/workouts.php → 
        Database.addWorkout() → 
          SQLite saved ✅ → 
            Alert success + download JSON
```

---

## 5. Caricamento Allenamenti dalla Libreria

**File modificati:**
- `api/api_libreria.php` - Ora legge dal database
- `api/api_allenamento.php` - Legge dal database con fallback filesystem
- `components/workout/libraryworkout.class.js` - Gestisce sia DB che filesystem
- `components/schemaeditor.js` - parseFilename() aggiornato

### Caricamento API

#### `api/api_libreria.php` (GET)
Restituisce la lista degli allenamenti dal database:
```json
[
  {
    "id": 1,
    "name": "Allenamento 1",
    "author": "admin",
    "objective": "Obiettivo",
    "sport": "volleyball",
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:00:00"
  }
]
```

#### `api/api_allenamento.php?filename={id o name}` (GET)
Restituisce i dati completi dell'allenamento:
1. Prova a caricarlo dal DB usando ID (numerico)
2. Prova a caricarlo dal DB usando nome (se non numerico)
3. Fallback: Legge dal filesystem (`volleyball_exercise_library/`)

---

## 6. Gestione Oggetti Allenamenti

### Formato oggetto DB

Ogni allenamento nel database contiene:
```javascript
{
  id: 123,
  name: "Nome Allenamento",
  author: "username",
  user_id: 1,
  objective: "Obiettivo dell'allenamento",
  observations: "Osservazioni",
  data: {  // JSON completo con tutti gli schemi
    version: "1.1",
    savedDate: "2024-01-01T10:00:00.000Z",
    author: "username",
    objective: "Obiettivo",
    observations: "Osservazioni",
    tabs: [
      {
        id: 0,
        name: "Schema 1",
        periodo: "GEN",
        tipologia: "GEN",
        ruolo: "GEN",
        // ... altri dati dello schema
      }
    ]
  },
  sport: "volleyball",
  created_at: "2024-01-01T10:00:00",
  updated_at: "2024-01-01T10:00:00"
}
```

---

## 7. Backward Compatibility

✅ **Compatibilità mantenuta:**
- Gli allenamenti salvati nel filesystem (`volleyball_exercise_library/`) vengono ancora caricati come fallback
- Se il database non è disponibile, il sistema cade back al filesystem
- Il formato JSON degli allenamenti rimane compatibile

---

## 8. Autenticazione

Tutti gli endpoint richiedono JWT token nell'header:
```
Authorization: Bearer <jwt_token>
```

Il token si ottiene con:
```bash
curl -X POST http://localhost:8000/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

---

## 9. Flusso Completo di Salvataggio

```
┌─────────────────────────────────────┐
│  User clicca "Salva Allenamento"    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  SaveWorkoutDialogManager.show()    │
│  - Visualizza form di salvataggio   │
│  - Chiede nome, obiettivo, osserv.  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User compila form e clicca "Salva" │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  saveWorkout(fileName) ASYNC        │
│  - Raccoglie dati di tutti i tab    │
│  - Prepara JSON completo            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  APIClient.createWorkout()          │
│  POST /api/workouts.php             │
│  + JWT token in header              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  /api/workouts.php (POST)           │
│  - Verifica JWT                     │
│  - Valida dati                      │
│  - Chiama DB.addWorkout()           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Database.addWorkout()              │
│  INSERT INTO workouts (...)         │
│  - Salva in SQLite                  │
│  - Restituisce ID                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  API Response                       │
│  {"id": 123, "message": "Success"}  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend - Gestione Risposta       │
│  - Alert success                    │
│  - Download JSON locale             │
│  - Chiudi modal                     │
└─────────────────────────────────────┘
```

---

## 10. Test della Configurazione

### 1. Avviare il server PHP
```bash
cd /workspaces/pv4
php -S localhost:8000
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

### 3. Salvare un allenamento
```bash
curl -X POST http://localhost:8000/api/workouts.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Test Allenamento",
    "objective": "Test obiettivo",
    "observations": "Test osservazioni",
    "data": {"version": "1.1", "tabs": []},
    "sport": "volleyball"
  }'
```

### 4. Verificare nel database
```bash
sqlite3 /workspaces/pv4/data/app.db "SELECT id, name, author FROM workouts;"
```

---

## 11. Note Importanti

⚠️ **IMPORTANTE:**
- L'utente deve essere **autenticato** per salvare gli allenamenti
- L'ID dell'allenamento è **auto-generato** dal database
- I dati dell'allenamento sono **serializzati come JSON** nella colonna `data`
- Gli allenamenti sono associati all'utente che li crea via `user_id`

---

## 12. Sintassi Verificata

✅ Tutti i file PHP hanno sintassi valida:
- `api/base.php` ✓
- `api/workouts.php` ✓
- `api/api_allenamento.php` ✓
- `api/api_libreria.php` ✓

---

## Sviluppi Futuri Consigliati

1. 📊 Aggiungere colonne `periodo`, `tipologia`, `ruolo`, `genere` al DB per migliore filtering
2. 📝 Implementare soft delete (flag `deleted_at`)
3. 🔍 Aggiungere ricerca full-text nei workout
4. 📈 Aggiungere statistiche e analytics
5. 🔐 Implementare permission check (user può modificare solo i propri workout)
6. 🗂️ Aggiungere categorie/cartelle per organizzare gli allenamenti
7. 📤 Export in PDF/Excel
8. 🔄 Versionamento dei workout (storico versioni)

---

**Data:** 2025-09-09  
**Status:** ✅ Implementato e testato (sintassi)  
**Ambiente:** SQLite, PHP 7.4+, JWT Authentication
