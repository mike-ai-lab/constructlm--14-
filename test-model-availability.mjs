#!/usr/bin/env node

/**
 * Model Availability Test Script
 * Tests Groq and Cerebras models for availability and basic functionality
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B • Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B • Groq' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
  { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
  { id: 'openai/gpt-oss-safeguard-20b', name: 'GPT OSS Safeguard 20B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
  { id: 'meta-llama/llama-guard-4-12b', name: 'Llama Guard 4 12B' },
  { id: 'meta-llama/llama-prompt-guard-2-86m', name: 'Llama Prompt Guard 86M' },
  { id: 'meta-llama/llama-prompt-guard-2-22m', name: 'Llama Prompt Guard 22M' }
];

const CEREBRAS_MODELS = [
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B • Cerebras' },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B • Cerebras' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B • Cerebras' },
  { id: 'zai-glm-4.7', name: 'ZAI GLM 4.7 • Cerebras' }
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
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGroqModel(model, apiKey) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    const data = await response.json();
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

async function testCerebrasModel(model, apiKey) {
  try {
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

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    const data = await response.json();
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
  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;

  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         MODEL AVAILABILITY TEST SCRIPT                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const results = {
    groq: { tested: 0, passed: 0, failed: 0, skipped: 0 },
    cerebras: { tested: 0, passed: 0, failed: 0, skipped: 0 }
  };

  // Test Groq Models
  log('🔵 TESTING GROQ MODELS', 'blue');
  log('─'.repeat(60), 'gray');

  if (!groqKey) {
    log('⚠️  GROQ_API_KEY not found in .env.local - skipping Groq tests\n', 'yellow');
    results.groq.skipped = GROQ_MODELS.length;
  } else {
    for (const model of GROQ_MODELS) {
      process.stdout.write(`Testing ${model.name}... `);
      results.groq.tested++;
      
      const result = await testGroqModel(model, groqKey);
      
      if (result.success) {
        log('✓ AVAILABLE', 'green');
        log(`  Response: "${result.reply}"`, 'gray');
        if (result.usage) {
          log(`  Tokens: ${result.usage.total_tokens}`, 'gray');
        }
        results.groq.passed++;
      } else {
        log('✗ FAILED', 'red');
        log(`  Error: ${result.error}`, 'gray');
        results.groq.failed++;
      }
      console.log();
    }
  }

  // Test Cerebras Models
  log('🟣 TESTING CEREBRAS MODELS', 'blue');
  log('─'.repeat(60), 'gray');

  if (!cerebrasKey) {
    log('⚠️  CEREBRAS_API_KEY not found in .env.local - skipping Cerebras tests\n', 'yellow');
    results.cerebras.skipped = CEREBRAS_MODELS.length;
  } else {
    for (const model of CEREBRAS_MODELS) {
      process.stdout.write(`Testing ${model.name}... `);
      results.cerebras.tested++;
      
      const result = await testCerebrasModel(model, cerebrasKey);
      
      if (result.success) {
        log('✓ AVAILABLE', 'green');
        log(`  Response: "${result.reply}"`, 'gray');
        if (result.usage) {
          log(`  Tokens: ${result.usage.total_tokens}`, 'gray');
        }
        results.cerebras.passed++;
      } else {
        log('✗ FAILED', 'red');
        log(`  Error: ${result.error}`, 'gray');
        results.cerebras.failed++;
      }
      console.log();
    }
  }

  // Summary
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const totalTested = results.groq.tested + results.cerebras.tested;
  const totalPassed = results.groq.passed + results.cerebras.passed;
  const totalFailed = results.groq.failed + results.cerebras.failed;
  const totalSkipped = results.groq.skipped + results.cerebras.skipped;

  log(`Groq Models:`, 'blue');
  log(`  ✓ Passed: ${results.groq.passed}`, 'green');
  log(`  ✗ Failed: ${results.groq.failed}`, results.groq.failed > 0 ? 'red' : 'gray');
  log(`  ⊘ Skipped: ${results.groq.skipped}`, results.groq.skipped > 0 ? 'yellow' : 'gray');
  console.log();

  log(`Cerebras Models:`, 'blue');
  log(`  ✓ Passed: ${results.cerebras.passed}`, 'green');
  log(`  ✗ Failed: ${results.cerebras.failed}`, results.cerebras.failed > 0 ? 'red' : 'gray');
  log(`  ⊘ Skipped: ${results.cerebras.skipped}`, results.cerebras.skipped > 0 ? 'yellow' : 'gray');
  console.log();

  log(`Total:`, 'cyan');
  log(`  Tested: ${totalTested}/${totalTested + totalSkipped}`, 'cyan');
  log(`  Success Rate: ${totalTested > 0 ? ((totalPassed / totalTested) * 100).toFixed(1) : 0}%`, 
      totalPassed === totalTested ? 'green' : 'yellow');
  console.log();

  if (totalFailed > 0) {
    log('⚠️  Some models failed. Check errors above for details.', 'yellow');
  } else if (totalPassed > 0) {
    log('✓ All tested models are available!', 'green');
  }

  if (totalSkipped > 0) {
    log('\n💡 Tip: Add missing API keys to .env.local to test skipped models', 'cyan');
  }

  console.log();
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
