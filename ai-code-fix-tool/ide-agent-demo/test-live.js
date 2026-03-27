// Live test against running server
const http = require('http');

console.log('Testing live server...\n');

const data = JSON.stringify({
  query: 'how many projects are there',
  provider: 'groq',
  apiKey: process.env.VITE_GROQ_API_KEY || 'test-key',
  strategy: 'agentic'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/agent/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}\n`);
  
  let buffer = '';
  
  res.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          console.log(`[${event.type}]`, JSON.stringify(event, null, 2));
        } catch (e) {
          console.error('Parse error:', e.message);
        }
      }
    });
  });
  
  res.on('end', () => {
    console.log('\nStream ended');
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
