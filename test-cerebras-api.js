// Test Cerebras API with all models
const https = require('https');

const API_KEY = process.env.CEREBRAS_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error('❌ Please provide API key: node test-cerebras-api.js YOUR_API_KEY');
  process.exit(1);
}

const MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", reasoning: false },
  { id: "zai-glm-4.7", name: "Z.ai GLM 4.7", reasoning: true },
  { id: "gpt-oss-120b", name: "GPT OSS 120B", reasoning: true },
  { id: "qwen-3-235b-a22b-instruct-2507", name: "Qwen 3 235B", reasoning: false }
];

function testModel(model) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model.id,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello! I am working.' in exactly those words." }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.cerebras.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            const content = json.choices[0].message.content;
            console.log(`✅ ${model.name} (${model.id})`);
            console.log(`   Response: ${content}`);
            console.log(`   Reasoning: ${model.reasoning ? 'YES' : 'NO'}`);
            console.log(`   Tokens: ${json.usage.prompt_tokens} in / ${json.usage.completion_tokens} out\n`);
            resolve(true);
          } catch (e) {
            console.log(`❌ ${model.name} - Parse error: ${e.message}\n`);
            resolve(false);
          }
        } else {
          console.log(`❌ ${model.name} - HTTP ${res.statusCode}: ${body}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${model.name} - Network error: ${e.message}\n`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Cerebras Models\n');
  console.log('='.repeat(50) + '\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const model of MODELS) {
    const success = await testModel(model);
    if (success) passed++;
    else failed++;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(50));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nTotal: ${passed + failed} models tested`);
}

runTests();
