#!/usr/bin/env node

/**
 * OpenRouter Model Availability Test Script - CORRECTED
 * Tests only models that actually exist in your OpenRouter account
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// CORRECTED: Only models that actually exist in openrouter_available_models.json
const OPENROUTER_MODELS = [
  // General Purpose - VERIFIED
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    category: 'General',
    context: '128K'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B',
    category: 'General',
    context: '131K'
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT OSS 120B',
    category: 'General',
    context: '131K'
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT OSS 20B',
    category: 'General',
    context: '131K'
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 24B',
    category: 'General',
    context: '128K'
  },
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash',
    category: 'General',
    context: '256K'
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM-4.5-Air',
    category: 'General',
    context: '131K'
  },
  
  // Coding Specialists - VERIFIED
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder',
    category: 'Coding',
    context: '262K'
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    name: 'Qwen3 Next 80B',
    category: 'Coding',
    context: '131K'
  },
  
  // Reasoning Models - VERIFIED
  {
    id: 'arcee-ai/trinity-large-preview:free',
    name: 'Arcee Trinity Large',
    category: 'Reasoning',
    context: '131K'
  },
  {
    id: 'arcee-ai/trinity-mini:free',
    name: 'Arcee Trinity Mini',
    category: 'Reasoning',
    context: '131K'
  },
  {
    id: 'liquid/lfm-2.5-1.2b-thinking:free',
    name: 'LFM 2.5 Thinking',
    category: 'Reasoning',
    context: '32K'
  },
  {
    id: 'liquid/lfm-2.5-1.2b-instruct:free',
    name: 'LFM 2.5 Instruct',
    category: 'Reasoning',
    context: '32K'
  },
  
  // Multimodal/Vision - VERIFIED
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B VL',
    category: 'Multimodal',
    context: '128K'
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    category: 'Multimodal',
    context: '131K'
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B',
    category: 'Multimodal',
    context: '33K'
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    category: 'Multimodal',
    context: '33K'
  },
  
  // AI Agents - VERIFIED
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 Nano 30B',
    category: 'Agents',
    context: '256K'
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'Nemotron Nano 9B V2',
    category: 'Agents',
    context: '128K'
  },
  
  // Compact Models - VERIFIED
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    category: 'Compact',
    context: '131K'
  },
  {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B',
    category: 'Compact',
    context: '33K'
  },
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma 3N E2B',
    category: 'Compact',
    context: '33K'
  },
  {
    id: 'google/gemma-3n-e4b-it:free',
    name: 'Gemma 3N E4B',
    category: 'Compact',
    context: '33K'
  },
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    name: 'Dolphin Mistral 24B',
    category: 'Compact',
    context: '32K'
  }
];

const TEST_PROMPT = 'Say "OK" if you can read this.';

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
      reply: reply.trim() || '(empty response)',
      usage: data.usage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║      OPENROUTER MODEL TEST - CORRECTED MODEL IDS           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  if (!openrouterKey) {
    log('❌ No OpenRouter API key found in .env.local', 'red');
    log('Expected: OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY\n', 'yellow');
    process.exit(1);
  }

  log(`✓ API Key found: ${openrouterKey.substring(0, 15)}...\n`, 'green');
  log(`Testing ${OPENROUTER_MODELS.length} verified free models\n`, 'cyan');

  const results = {
    byCategory: {},
    total: { tested: 0, passed: 0, failed: 0 }
  };

  const categories = [...new Set(OPENROUTER_MODELS.map(m => m.category))];
  
  for (const category of categories) {
    const categoryModels = OPENROUTER_MODELS.filter(m => m.category === category);
    
    log(`\n${'═'.repeat(60)}`, 'blue');
    log(`${category.toUpperCase()} MODELS (${categoryModels.length})`, 'blue');
    log('═'.repeat(60), 'blue');

    results.byCategory[category] = { tested: 0, passed: 0, failed: 0 };

    for (const model of categoryModels) {
      process.stdout.write(`\nTesting ${model.name}...\n`);
      process.stdout.write(`  ID: ${model.id}\n`);
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

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  for (const [category, stats] of Object.entries(results.byCategory)) {
    const successRate = stats.tested > 0 ? ((stats.passed / stats.tested) * 100).toFixed(1) : 0;
    log(`${category}:`, 'blue');
    log(`  ✓ Passed: ${stats.passed}/${stats.tested} (${successRate}%)`, 
        stats.passed === stats.tested ? 'green' : 'yellow');
    console.log();
  }

  const overallRate = results.total.tested > 0 
    ? ((results.total.passed / results.total.tested) * 100).toFixed(1) 
    : 0;

  log('Overall:', 'cyan');
  log(`  Total Tested: ${results.total.tested}`, 'cyan');
  log(`  ✓ Passed: ${results.total.passed}`, 'green');
  log(`  ✗ Failed: ${results.total.failed}`, results.total.failed > 0 ? 'red' : 'gray');
  log(`  Success Rate: ${overallRate}%`, overallRate >= 80 ? 'green' : 'yellow');
  console.log();

  if (results.total.passed > 0) {
    log(`🎉 ${results.total.passed} models are ready to integrate!`, 'green');
  }

  console.log();
}

runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
