// Simple Node.js server to serve the app and provide API key from .env
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const PORT = 8001;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint to get the API key
  if (req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      GROQ_API_KEY: process.env.VITE_GROQ_API_KEY || ''
    }));
    return;
  }

  // Serve static files
  // Strip query parameters from URL
  let requestUrl = req.url.split('?')[0];
  
  let filePath;
  
  // Handle root path
  if (requestUrl === '/') {
    filePath = path.join(__dirname, 'src', 'index.html');
  } 
  // Handle paths starting with /styles/ or /js/
  else if (requestUrl.startsWith('/styles/') || requestUrl.startsWith('/js/')) {
    filePath = path.join(__dirname, 'src', requestUrl);
  }
  // Default: look in src folder
  else {
    filePath = path.join(__dirname, 'src', requestUrl);
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`404 - File not found: ${filePath}`);
        res.writeHead(404);
        res.end('File not found: ' + req.url);
      } else {
        console.log(`500 - Server error: ${error.code} for ${filePath}`);
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      // Add cache-control headers to prevent caching during development
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log('AI Code Fix Pro V3 - Server Running');
  console.log('========================================');
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('');
  console.log('API Key loaded from .env.local:');
  console.log(process.env.VITE_GROQ_API_KEY ? '✓ Groq API Key found' : '✗ Groq API Key NOT found');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('========================================');
});
