import fetch from 'node-fetch';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.openrouter_api_key;

console.log('Testing raw OpenRouter response...\n');

const response = await fetch('http://localhost:3001/api/agent/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Find security vulnerabilities in authentication',
    provider: 'openrouter',
    apiKey: OPENROUTER_API_KEY,
    strategy: 'agentic'
  })
});

let fullResponse = '';
for await (const chunk of response.body) {
  fullResponse += chunk.toString();
}

console.log('FULL RESPONSE:');
console.log('='.repeat(80));
console.log(fullResponse);
console.log('='.repeat(80));

// Check for reasoning
if (fullResponse.includes('"type":"reasoning"')) {
  console.log('\n✅ REASONING FOUND IN RESPONSE!');
} else {
  console.log('\n❌ NO REASONING IN RESPONSE');
}

// Check for answer
if (fullResponse.includes('"type":"answer"')) {
  console.log('✅ ANSWER FOUND IN RESPONSE!');
} else {
  console.log('❌ NO ANSWER IN RESPONSE - STREAM CUT OFF!');
}

// Check for done
if (fullResponse.includes('"type":"done"')) {
  console.log('✅ DONE EVENT FOUND');
} else {
  console.log('❌ NO DONE EVENT - INCOMPLETE STREAM!');
}
