#!/usr/bin/env node

/**
 * OpenRouter Model Availability Test Script
 * Tests recommended free models on OpenRouter
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Top recommended OpenRouter free models
const OPENROUTER_MODELS = [
  // General Purpose Models
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp',
    category: 'General',
    context: '1M',
    features: ['multimodal', 'vision']
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct:free',
    name: 'Llama 3.1 405B',
    category: 'General',
    context: '131K',
    features: ['large']
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    category: 'General',
    context: '131K',
    features: []
  },
  {
    id: 'mistralai/mistral-small-3.1:free',
    name: 'Mistral Small 3.1',
    category: 'General',
    context: '128K',
    features: []
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT OSS 120B',
    category: 'General',
    context: '131K',
    features: []
  },
  
  // Coding Specialists
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder',
    category: 'Coding',
    context: '262K',
    features: ['coding']
  },
  {
    id: 'mistralai/devstral-2:free',
    name: 'Devstral 2',
    category: 'Coding',
    context: '262K',
    features: ['coding']
  },
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'MiMo-V2-Flash',
    category: 'Coding',
    context: '262K',
    features: ['coding']
  },
  
  // Reasoning Models
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    category: 'Reasoning',
    context: '164K',
    features: ['reasoning']
  },
  {
    id: 'arcee-ai/arcee-trinity-large:free',
    name: 'Arcee Trinity Large',
    category: 'Reasoning',
    context: '131K',
    features: ['reasoning']
  },
  
  // Multimodal/Vision
  {
    id: 'google/gemma-3-27b:free',
    name: 'Gemma 3 27B',
    category: 'Multimodal',
    context: '131K',
    features: ['multimodal', 'vision']
  },
  {
    id: 'qwen/qwen-2.5-vl-7b:free',
    name: 'Qwen 2.5 VL 7B',
    category: 'Multimodal',
    context: '33K',
    features: ['vision']
  },
  
  // AI Agents
  {
    id: 'nvidia/nemotron-3-nano:free',
    name: 'Nemotron 3 Nano',
    category: 'Agents',
    context: '256K',
    features: ['agents']
  },
  {
    id: 'nous-research/hermes-3-405b:free',
    name: 'Hermes 3 405B',
    category: 'Agents',
    context: '131K',
    features: ['agents']
  },
  
  // Additional Popular Models
  {
    id: 'zhipu/glm-4.5-air:free',
    name: 'GLM-4.5-Air',
    category: 'General',
    context: '131K',
    features: ['multilingual']
  },
  {
    id: 'upstage/solar-pro-3:free',
    name: 'Solar Pro 3',
    category: 'General',
    context: '128K',
    features: ['multilingual']
  },
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash',
    category: 'General',
    context: '256K',
    features: []
  },
  {
    id: 'google/gemma-3-12b:free',
    name: 'Gemma 3 12B',
    category: 'General',
    context: '33K',
    features: ['multimodal']
  }
];

const TEST_PROMPT = 'Say "OK" if you can read this.';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOpenRouterModel(model, apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ConstructLM Test',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 20,
        temperature: 0
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch (e) {
        errorMsg = responseText.substring(0, 100);
      }
      return { success: false, error: errorMsg };
    }

    const data = JSON.parse(responseText);
    const reply = data.choices?.[0]?.message?.content || '';
    
    return { 
      success: true, 
      reply: reply.trim(),
      usage: data.usage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         OPENROUTER MODEL AVAILABILITY TEST                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  if (!openrouterKey) {
    log('❌ No OpenRouter API key found in .env.local', 'red');
    log('Expected: OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY\n', 'yellow');
    log('Get your free API key from: https://openrouter.ai/keys', 'cyan');
    process.exit(1);
  }

  log(`✓ API Key found: ${openrouterKey.substring(0, 15)}...\n`, 'green');

  const results = {
    byCategory: {},
    total: { tested: 0, passed: 0, failed: 0 }
  };

  // Group models by category
  const categories = [...new Set(OPENROUTER_MODELS.map(m => m.category))];
  
  for (const category of categories) {
    const categoryModels = OPENROUTER_MODELS.filter(m => m.category === category);
    
    log(`\n${'═'.repeat(60)}`, 'blue');
    log(`${category.toUpperCase()} MODELS (${categoryModels.length})`, 'blue');
    log('═'.repeat(60), 'blue');

    results.byCategory[category] = { tested: 0, passed: 0, failed: 0 };

    for (const model of categoryModels) {
      const features = model.features.length > 0 ? ` [${model.features.join(', ')}]` : '';
      process.stdout.write(`\nTesting ${model.name}${features}...\n`);
      process.stdout.write(`  Model ID: ${model.id}\n`);
      process.stdout.write(`  Context: ${model.context} | `);
      
      results.total.tested++;
      results.byCategory[category].tested++;
      
      const result = await testOpenRouterModel(model, openrouterKey);
      
      if (result.success) {
        log('✓ AVAILABLE', 'green');
        log(`  Response: "${result.reply}"`, 'gray');
        if (result.usage) {
          log(`  Tokens: ${result.usage.total_tokens}`, 'gray');
        }
        results.total.passed++;
        results.byCategory[category].passed++;
      } else {
        log('✗ FAILED', 'red');
        log(`  Error: ${result.error}`, 'gray');
        results.total.failed++;
        results.byCategory[category].failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Category breakdown
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const successRate = stats.tested > 0 ? ((stats.passed / stats.tested) * 100).toFixed(1) : 0;
    log(`${category}:`, 'blue');
    log(`  ✓ Passed: ${stats.passed}/${stats.tested}`, stats.passed > 0 ? 'green' : 'gray');
    log(`  ✗ Failed: ${stats.failed}`, stats.failed > 0 ? 'red' : 'gray');
    log(`  Success Rate: ${successRate}%`, successRate == 100 ? 'green' : 'yellow');
    console.log();
  }

  // Overall stats
  const overallRate = results.total.tested > 0 
    ? ((results.total.passed / results.total.tested) * 100).toFixed(1) 
    : 0;

  log('Overall:', 'cyan');
  log(`  Total Tested: ${results.total.tested}`, 'cyan');
  log(`  ✓ Passed: ${results.total.passed}`, 'green');
  log(`  ✗ Failed: ${results.total.failed}`, results.total.failed > 0 ? 'red' : 'gray');
  log(`  Success Rate: ${overallRate}%`, overallRate >= 80 ? 'green' : 'yellow');
  console.log();

  if (results.total.failed > 0) {
    log('⚠️  Some models failed. This could mean:', 'yellow');
    log('   - Model ID changed or deprecated', 'gray');
    log('   - Model requires special access', 'gray');
    log('   - Temporary API issue', 'gray');
    log('   - Rate limiting (try again in a moment)', 'gray');
  } else if (results.total.passed > 0) {
    log('✓ All tested models are available!', 'green');
    log(`\n🎉 You have access to ${results.total.passed} free OpenRouter models!`, 'cyan');
  }

  console.log();
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
