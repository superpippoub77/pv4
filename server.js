// server.js - server with SQLite integration
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db/database');

const port = process.env.PORT || 8000;

const mime = (p) => {
  if (p.endsWith('.html')) return 'text/html';
  if (p.endsWith('.js')) return 'application/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.glb')) return 'model/gltf-binary';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

const sendJSON = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const sendError = (res, message, statusCode = 400) => {
  sendJSON(res, { error: message }, statusCode);
};

http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // API Routes
    if (pathname.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Users API
      if (pathname === '/api/users') {
        if (req.method === 'GET') {
          const users = await db.getAllUsers();
          sendJSON(res, { users });
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { username, password, salt, expiration } = JSON.parse(body);
              const id = await db.addUser(username, password, salt, expiration);
              sendJSON(res, { id, username }, 201);
            } catch (e) {
              sendError(res, e.message);
            }
          });
        }
      }
      else if (pathname.startsWith('/api/users/')) {
        const username = pathname.split('/')[3];
        const user = await db.getUser(username);
        if (user) {
          sendJSON(res, user);
        } else {
          sendError(res, 'User not found', 404);
        }
      }

      // Configuration API
      else if (pathname === '/api/config') {
        if (req.method === 'GET') {
          const key = parsedUrl.query.key || 'app_config';
          const config = await db.getConfig(key);
          if (config) {
            sendJSON(res, config);
          } else {
            sendError(res, 'Config not found', 404);
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { key, value } = JSON.parse(body);
              await db.setConfig(key, value);
              sendJSON(res, { success: true });
            } catch (e) {
              sendError(res, e.message);
            }
          });
        }
      }

      // Exercises API
      else if (pathname === '/api/exercises') {
        if (req.method === 'GET') {
          const exercises = await db.getAllExercises();
          sendJSON(res, { exercises });
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { name, category, sport, description, data } = JSON.parse(body);
              const id = await db.addExercise(name, category, sport, description, data);
              sendJSON(res, { id, name }, 201);
            } catch (e) {
              sendError(res, e.message);
            }
          });
        }
      }
      else if (pathname.startsWith('/api/exercises/')) {
        const id = parseInt(pathname.split('/')[3]);
        const exercise = await db.getExercise(id);
        if (exercise) {
          exercise.data = JSON.parse(exercise.data);
          sendJSON(res, exercise);
        } else {
          sendError(res, 'Exercise not found', 404);
        }
      }
      else {
        sendError(res, 'API endpoint not found', 404);
      }
      return;
    }

    // Static files
    const safeUrl = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(__dirname, safeUrl);
    
    // Prevent directory traversal
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(__dirname)) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      fs.stat(filePath, (err2, stats2) => {
        if (err2 || !stats2.isFile()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mime(filePath) });
        fs.createReadStream(filePath).pipe(res);
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end('Internal server error');
  }
}).listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('API endpoints:');
  console.log('  GET  /api/users');
  console.log('  POST /api/users');
  console.log('  GET  /api/users/:username');
  console.log('  GET  /api/config?key=app_config');
  console.log('  POST /api/config');
  console.log('  GET  /api/exercises');
  console.log('  POST /api/exercises');
  console.log('  GET  /api/exercises/:id');
});
