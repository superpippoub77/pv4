const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Errore apertura database:', err);
      }
    });
  }

  // Utenti
  getUser(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, username, expiration FROM users',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  addUser(username, password, salt, expiration) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, password, salt, expiration) VALUES (?, ?, ?, ?)',
        [username, password, salt, expiration],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Configurazione
  getConfig(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM configuration WHERE key = ?',
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : null);
        }
      );
    });
  }

  setConfig(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO configuration (key, value) VALUES (?, ?)',
        [key, typeof value === 'string' ? value : JSON.stringify(value)],
        function(err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  // Esercizi
  getAllExercises() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM exercises',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getExercise(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM exercises WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  addExercise(name, category, sport, description, data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO exercises (name, category, sport, description, data) VALUES (?, ?, ?, ?, ?)',
        [name, category, sport, description, typeof data === 'string' ? data : JSON.stringify(data)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();
