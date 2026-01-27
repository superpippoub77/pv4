// server.js - minimal static server
// Usage: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

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

http.createServer((req, res) => {
  try {
    const safeUrl = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(__dirname, safeUrl === '/' ? '/index.html' : safeUrl);
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
  } catch (ex) {
    res.writeHead(500);
    res.end('Server error');
  }
}).listen(port, () => console.log(`Static server running at http://localhost:${port}`));
