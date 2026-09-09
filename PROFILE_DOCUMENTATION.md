# Profilo Utente - Documentazione

## 🎯 Funzionalità

Gestione completa del profilo utente con:
- **Dati Personali**: Nome, cognome, email, telefono
- **Dati Professionali**: Ruolo, squadra di appartenenza, bio
- **Team Management**: Selezione della squadra direttamente dal profilo

## 📱 Utilizzo

### Aprire il profilo
1. **Login** con admin/1234
2. **Clicca sulla sezione utente** nella dashboard
3. Si apre il dialog del profilo

### Modificare il profilo
1. Compila i campi desiderati
2. Seleziona la squadra dal dropdown
3. Clicca "💾 Salva Profilo"

## 🗄️ Database Schema

### Tabella: `user_profiles`
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE,          -- ID dell'utente (FK)
    first_name TEXT,                 -- Nome
    last_name TEXT,                  -- Cognome
    email TEXT,                       -- Email
    phone TEXT,                       -- Numero telefono
    team_id INTEGER,                 -- ID squadra (FK)
    position TEXT,                    -- Ruolo/Posizione
    bio TEXT,                         -- Biografia/Note
    avatar_url TEXT,                  -- URL avatar (futuro)
    updated_at TIMESTAMP,             -- Ultimo aggiornamento
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

### Tabella: `teams`
```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,               -- Nome squadra
    description TEXT,                 -- Descrizione
    sport TEXT,                       -- Sport (volleyball, basketball, etc.)
    created_at TIMESTAMP
);
```

## 🔌 API Endpoints

### GET /api/profile.php
Ottiene il profilo dell'utente loggato

**Risposta:**
```json
{
  "id": 1,
  "first_name": "Marco",
  "last_name": "Rossi",
  "email": "marco@example.com",
  "phone": "+39 123 456 7890",
  "team_id": 1,
  "position": "Palleggiatore",
  "bio": "Esperienza 10 anni",
  "avatar_url": null,
  "team_name": "Default Team",
  "team_sport": "volleyball"
}
```

### POST /api/profile.php
Aggiorna il profilo dell'utente loggato

**Request:**
```json
{
  "first_name": "Marco",
  "last_name": "Rossi",
  "email": "marco@example.com",
  "phone": "+39 123 456 7890",
  "team_id": 1,
  "position": "Palleggiatore",
  "bio": "Esperienza 10 anni"
}
```

**Risposta:** Stesso formato di GET

### GET /api/profile.php/teams
Ottiene la lista di tutte le squadre disponibili

**Risposta:**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "Default Team",
      "description": "Team di default",
      "sport": "volleyball",
      "created_at": "2026-09-09 12:00:00"
    }
  ]
}
```

## 💻 Utilizzo nel Codice

### JavaScript
```javascript
// Inizializzazione
const api = new APIClient('/api');
const profileManager = new ProfileManager(api);

// Caricare il profilo
await profileManager.loadProfile();
console.log(profileManager.profile);

// Aggiornare il profilo
await profileManager.updateProfile({
  first_name: 'Marco',
  last_name: 'Rossi',
  email: 'marco@example.com',
  phone: '+39 123 456 7890',
  team_id: 1,
  position: 'Palleggiatore',
  bio: 'Esperienza 10 anni'
});

// Aprire il dialog del profilo
await profileManager.showProfileDialog();

// Listener su aggiornamento profilo
window.addEventListener('profile:updated', (e) => {
  console.log('Profilo aggiornato:', e.detail);
});
```

## 🎨 UI Components

### Profile Dialog
Dialog modale per la gestione del profilo con:
- Form per i dati personali
- Dropdown per la selezione squadra
- Textarea per la bio
- Messaggio di successo/errore
- Bottone di salvataggio

### User Info (Clickable)
Sezione nella dashboard che mostra:
- Username
- "Token scade in 24 ore"
- **Cliccabile** per aprire il profilo

Style hover con transizione smooth

## 🔐 Sicurezza

- ✅ JWT Authentication richiesto
- ✅ Accesso solo al proprio profilo
- ✅ Validazione dati lato server
- ✅ SQL Injection prevention (Prepared Statements)

## 📝 Prossime Features

- [ ] Avatar upload
- [ ] Profilo pubblico (visualizzazione per altri utenti)
- [ ] Cronologia modifiche
- [ ] Statistiche personali
- [ ] Integrazione con team management

## 🐛 Troubleshooting

### Il profilo non si apre
- Verificare che `helper.js` sia caricato
- Controllare la console per errori
- Verificare il token JWT sia valido

### Le squadre non compaiono
- Verificare che la tabella `teams` sia creata
- Controllare che `api/profile.php/teams` sia accessibile
- Verificare il token nel header Authorization

### Salvataggio non funziona
- Verificare che il token non sia scaduto
- Controllare i dati nel form
- Verificare la risposta dell'API nella console

---

**Ultima modifica**: 2026-09-09
**Versione**: 1.0
