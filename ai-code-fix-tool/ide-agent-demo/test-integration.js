// Integration test for the agent stream endpoint
const http = require('http');

console.log('🧪 Integration Test: Testing /api/agent/stream endpoint\n');

// Helper to make POST request
function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    
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
      let buffer = '';
      const events = [];
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              events.push(event);
            } catch (e) {
              console.error('Parse error:', e, 'Line:', line);
            }
          }
        });
      });
      
      res.on('end', () => {
        resolve(events);
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Test with mock data
async function runTests() {
  try {
    console.log('Test 1: Semantic search with empty codebase');
    const events1 = await makeRequest({
      query: 'test query',
      provider: 'groq',
      apiKey: 'test-key',
      strategy: 'semantic'
    });
    
    console.log(`  Received ${events1.length} events`);
    
    // Check for errors
    const errors = events1.filter(e => e.type === 'error');
    if (errors.length > 0) {
      console.log('  ⚠️  Errors found:', errors.map(e => e.message));
    }
    
    // Check event types
    const types = [...new Set(events1.map(e => e.type))];
    console.log('  Event types:', types.join(', '));
    
    // Verify no "Cannot convert undefined or null to object" error
    const nullError = errors.find(e => e.message && e.message.includes('Cannot convert undefined or null to object'));
    if (nullError) {
      console.log('  ❌ FAIL: Found null/undefined error!');
      process.exit(1);
    } else {
      console.log('  ✅ PASS: No null/undefined errors\n');
    }
    
    console.log('🎉 Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
const checkServer = http.get('http://localhost:3001/', (res) => {
  console.log('✓ Server is running\n');
  runTests().then(() => process.exit(0));
});

checkServer.on('error', (err) => {
  console.error('❌ Server is not running on port 3001');
  console.error('   Please start the server first: node server.js');
  process.exit(1);
});
