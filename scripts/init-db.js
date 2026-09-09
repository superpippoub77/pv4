const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore apertura database:', err);
    process.exit(1);
  }
  console.log('Database connesso.');
});

db.serialize(() => {
  // Tabella utenti
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT,
    expiration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Errore creazione tabella users:', err);
    else console.log('Tabella users creata/già esistente');
  });

  // Tabella configurazione
  db.run(`CREATE TABLE IF NOT EXISTS configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Errore creazione tabella configuration:', err);
    else console.log('Tabella configuration creata/già esistente');
  });

  // Tabella esercizi (libreria)
  db.run(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    sport TEXT,
    description TEXT,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Errore creazione tabella exercises:', err);
    else console.log('Tabella exercises creata/già esistente');
  });

  // Migrazione utenti da JSON
  const usersPath = path.join(__dirname, '../data/users.json');
  if (fs.existsSync(usersPath)) {
    try {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      
      db.each(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        if (row && row.count === 0 && usersData.users) {
          usersData.users.forEach(user => {
            db.run(
              'INSERT INTO users (username, password, salt, expiration) VALUES (?, ?, ?, ?)',
              [user.username, user.password, user.salt, user.expiration],
              (err) => {
                if (err) console.log(`User ${user.username} già presente o errore:`, err.message);
                else console.log(`User ${user.username} importato`);
              }
            );
          });
        }
      });
    } catch (e) {
      console.error('Errore importazione users:', e.message);
    }
  }

  // Migrazione configurazione
  try {
    const configPath = path.join(__dirname, '../data/configuration/configuration.js');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(/const configuration = ({[\s\S]*?});/);
      if (match) {
        // Salva la config come stringa JSON
        db.run(
          'INSERT OR REPLACE INTO configuration (key, value) VALUES (?, ?)',
          ['app_config', match[1]],
          (err) => {
            if (err) console.log('Errore import configurazione:', err.message);
            else console.log('Configurazione importata');
          }
        );
      }
    }
  } catch (e) {
    console.error('Errore import configurazione:', e.message);
  }
});

db.close((err) => {
  if (err) console.error('Errore chiusura database:', err);
  else console.log('Database chiuso. Inizializzazione completata!');
});
