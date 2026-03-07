// Test Cerebras API with fetch
const API_KEY = process.argv[2] || 'csk-pfje3ynhrecd6e4p56d4tcnxhrh452h44thwxk2p2v5pvk45';

const MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", reasoning: false },
  { id: "zai-glm-4.7", name: "Z.ai GLM 4.7", reasoning: true },
  { id: "gpt-oss-120b", name: "GPT OSS 120B", reasoning: true },
  { id: "qwen-3-235b-a22b-instruct-2507", name: "Qwen 3 235B", reasoning: false }
];

async function testModel(model) {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say 'Hello! I am working.' in exactly those words." }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ ${model.name} (${model.id})`);
      console.log(`   HTTP ${response.status}: ${errorText}\n`);
      return false;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log(`✅ ${model.name} (${model.id})`);
    console.log(`   Response: ${content}`);
    console.log(`   Reasoning: ${model.reasoning ? 'YES' : 'NO'}`);
    console.log(`   Tokens: ${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${model.name} (${model.id})`);
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Cerebras Models\n');
  console.log('='.repeat(60) + '\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const model of MODELS) {
    const success = await testModel(model);
    if (success) passed++;
    else failed++;
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nTotal: ${passed + failed} models tested`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Models are working correctly.');
  }
}

runTests();
