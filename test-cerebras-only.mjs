#!/usr/bin/env node

import { config } from 'dotenv';
config({ path: '.env.local' });

const CEREBRAS_MODELS = [
  // Production models (fully supported)
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', status: 'production' },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B', status: 'production' },
  
  // Preview models (may require special access)
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', status: 'preview' },
  { id: 'zai-glm-4.7', name: 'ZAI GLM 4.7', status: 'preview' }
];

const TEST_PROMPT = 'Say "OK"';

async function testCerebrasModel(model, apiKey) {
  try {
    console.log(`\nTesting ${model.name} (${model.id}) [${model.status}]...`);
    
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10,
        temperature: 0
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.log(`❌ FAILED - HTTP ${response.status}`);
      console.log(`Response: ${responseText.substring(0, 200)}`);
      return false;
    }

    const data = JSON.parse(responseText);
    const reply = data.choices?.[0]?.message?.content || '';
    
    console.log(`✅ SUCCESS`);
    console.log(`Response: "${reply}"`);
    console.log(`Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const cerebrasKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;

  console.log('🟣 CEREBRAS MODEL AVAILABILITY TEST\n');
  console.log('='.repeat(60));

  if (!cerebrasKey) {
    console.log('❌ No Cerebras API key found in .env.local');
    console.log('Expected: CEREBRAS_API_KEY or VITE_CEREBRAS_API_KEY');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${cerebrasKey.substring(0, 10)}...`);

  let passed = 0;
  let failed = 0;

  for (const model of CEREBRAS_MODELS) {
    const success = await testCerebrasModel(model, cerebrasKey);
    if (success) passed++;
    else failed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${CEREBRAS_MODELS.length}`);
  console.log(`❌ Failed: ${failed}/${CEREBRAS_MODELS.length}`);
  console.log(`Success Rate: ${((passed / CEREBRAS_MODELS.length) * 100).toFixed(1)}%`);
}

runTests().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
