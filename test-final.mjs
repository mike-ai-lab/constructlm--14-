// Final test with correct model IDs
const API_KEY = 'csk-pfje3ynhrecd6e4p56d4tcnxhrh452h44thwxk2p2v5pvk45';

const MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", reasoning: false },
  { id: "zai-glm-4.7", name: "Z.ai GLM 4.7", reasoning: true },
  { id: "gpt-oss-120b", name: "GPT OSS 120B", reasoning: true },
  { id: "qwen-3-235b-a22b-instruct-2507", name: "Qwen 3 235B", reasoning: false }
];

async function testModel(model) {
  try {
    console.log(`Testing ${model.name}...`);
    
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "user", content: "Say 'Working!' in one word." }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.log(`❌ ${model.name} FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${text.substring(0, 200)}\n`);
      return false;
    }

    const data = JSON.parse(text);
    const content = data.choices[0].message.content;
    
    console.log(`✅ ${model.name} SUCCESS`);
    console.log(`   Response: "${content}"`);
    console.log(`   Reasoning: ${model.reasoning ? 'YES' : 'NO'}\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${model.name} ERROR: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 FINAL CEREBRAS API TEST\n');
  console.log('='.repeat(60) + '\n');
  
  let results = [];
  
  for (const model of MODELS) {
    const success = await testModel(model);
    results.push({ model: model.name, success });
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('='.repeat(60));
  console.log('\nRESULTS:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.model}`);
  });
  
  const passed = results.filter(r => r.success).length;
  console.log(`\n${passed}/${results.length} models working`);
  
  if (passed === results.length) {
    console.log('\n🎉 ALL MODELS WORKING! Ready to test in browser.');
  } else {
    console.log('\n⚠️  Some models failed. Check API access.');
  }
}

runTests();
