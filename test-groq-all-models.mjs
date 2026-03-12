#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const GROQ_MODELS = [
  "canopylabs/orpheus-arabic-saudi",
  "canopylabs/orpheus-v1-english",
  "groq/compound",
  "groq/compound-mini",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-guard-4-12b",
  "meta-llama/llama-prompt-guard-2-22m",
  "meta-llama/llama-prompt-guard-2-86m",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-safeguard-20b",
  "qwen/qwen3-32b",
  "whisper-large-v3",
  "whisper-large-v3-turbo"
];

const TEST_MESSAGE = "Hello! Please respond with a single word: 'SUCCESS'";
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

const results = { passed: [], failed: [], skipped: [] };

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGroqModel(modelId, apiKey) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  const requestBody = {
    model: modelId,
    messages: [{ role: "user", content: TEST_MESSAGE }],
    stream: false,
    max_tokens: 100,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  
  if (!text) {
    throw new Error('Empty response from API');
  }
  
  return { success: true, response: text.substring(0, 100) };
}

async function runTest(modelId, apiKey) {
  log(`▶ Testing: ${modelId}`, 'cyan');
  
  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      );
      
      const testPromise = testGroqModel(modelId, apiKey);
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      log(`✓ ${modelId}`, 'green');
      log(`  Response: ${result.response}`, 'gray');
      results.passed.push(modelId);
      return true;
      
    } catch (error) {
      lastError = error;
      
      if (attempt < MAX_RETRIES - 1) {
        log(`  Retry ${attempt + 1}/${MAX_RETRIES - 1}...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  log(`✗ ${modelId}`, 'red');
  log(`  Error: ${lastError.message}`, 'gray');
  results.failed.push({ model: modelId, error: lastError.message });
  return false;
}

async function main() {
  console.log('='.repeat(70));
  log('Groq Model Validation Test', 'cyan');
  console.log('='.repeat(70));
  
  const apiKey = process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey || apiKey.includes('YOUR_')) {
    log('✗ Groq API key not configured', 'red');
    log('Add VITE_GROQ_API_KEY to .env.local', 'yellow');
    process.exit(1);
  }
  
  log(`✓ API Key configured`, 'green');
  log(`Testing ${GROQ_MODELS.length} models\n`, 'cyan');
  
  const startTime = Date.now();
  
  for (const model of GROQ_MODELS) {
    await runTest(model, apiKey);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(70));
  log('Test Summary', 'cyan');
  console.log('='.repeat(70));
  log(`Total:  ${GROQ_MODELS.length}`, 'cyan');
  log(`Passed: ${results.passed.length}`, 'green');
  log(`Failed: ${results.failed.length}`, 'red');
  log(`Time:   ${duration}s`, 'cyan');
  
  if (results.failed.length > 0) {
    console.log('\n' + '='.repeat(70));
    log('Failed Models', 'red');
    console.log('='.repeat(70));
    results.failed.forEach(({ model, error }) => {
      log(`✗ ${model}`, 'red');
      log(`  ${error}`, 'gray');
    });
  }
  
  console.log('\n' + '='.repeat(70));
  const exitCode = results.failed.length > 0 ? 1 : 0;
  log(exitCode === 0 ? '✓ All tests passed!' : '✗ Some tests failed', exitCode === 0 ? 'green' : 'red');
  console.log('='.repeat(70) + '\n');
  
  process.exit(exitCode);
}

main().catch(error => {
  log('\n✗ Test suite crashed:', 'red');
  console.error(error);
  process.exit(1);
});
