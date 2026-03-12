#!/usr/bin/env node

/**
 * AI Provider Model Validation Test Suite
 * Tests all configured AI providers and their models
 * 
 * Usage: node test-ai-providers.mjs
 * 
 * Requirements:
 * - Node.js 18+
 * - API keys configured in .env.local
 * - Internet connection
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test configuration
const TEST_MESSAGE = "Hello! Please respond with a single word: 'SUCCESS'";
const TIMEOUT_MS = 30000; // 30 seconds per test
const MAX_RETRIES = 2;

// Load model configurations from services
const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" }
];

const CEREBRAS_MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B" }
];

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" }
];

const OPENROUTER_MODELS = [
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5-Air" },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large" }
];

const OLLAMA_LOCAL_MODELS = [
  { id: "llama3.1:8b", name: "Llama 3.1 8B" },
  { id: "mistral:7b", name: "Mistral 7B" }
];

// Test results storage
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

function logTest(provider, model, status, message = '') {
  const statusColors = {
    'PASS': 'green',
    'FAIL': 'red',
    'SKIP': 'yellow',
    'TEST': 'cyan'
  };
  
  const icon = {
    'PASS': '✓',
    'FAIL': '✗',
    'SKIP': '○',
    'TEST': '▶'
  };
  
  const color = statusColors[status] || 'reset';
  const symbol = icon[status] || '•';
  
  log(`${symbol} [${provider}] ${model}`, color);
  if (message) {
    log(`  ${message}`, 'gray');
  }
}


// Provider test functions
async function testGemini(model, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model.id}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{ text: TEST_MESSAGE }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 100
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from API');
  }
  
  return { success: true, response: text.substring(0, 100) };
}

async function testCerebras(model, apiKey) {
  const url = "https://api.cerebras.ai/v1/chat/completions";
  
  const requestBody = {
    model: model.id,
    messages: [
      { role: "user", content: TEST_MESSAGE }
    ],
    stream: false,
    max_tokens: 100,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Cerebras-Version-Patch': '2'
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

async function testGroq(model, apiKey) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  const requestBody = {
    model: model.id,
    messages: [
      { role: "user", content: TEST_MESSAGE }
    ],
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

async function testOpenRouter(model, apiKey) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  
  const requestBody = {
    model: model.id,
    messages: [
      { role: "user", content: TEST_MESSAGE }
    ],
    stream: false,
    max_tokens: 100,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'ConstructLM Test'
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

async function testOllama(model, baseUrl) {
  const url = `${baseUrl}/api/chat`;
  
  const requestBody = {
    model: model.id,
    messages: [
      { role: "user", content: TEST_MESSAGE }
    ],
    stream: false
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.message?.content || '';
  
  if (!text) {
    throw new Error('Empty response from API');
  }
  
  return { success: true, response: text.substring(0, 100) };
}


// Test runner with retry logic
async function runTest(provider, model, testFn, ...args) {
  logTest(provider, model.name, 'TEST', 'Testing...');
  
  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      );
      
      const testPromise = testFn(model, ...args);
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      logTest(provider, model.name, 'PASS', `Response: ${result.response}`);
      results.passed.push({ provider, model: model.name });
      return true;
      
    } catch (error) {
      lastError = error;
      
      if (attempt < MAX_RETRIES - 1) {
        log(`  Retry ${attempt + 1}/${MAX_RETRIES - 1}...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  logTest(provider, model.name, 'FAIL', `Error: ${lastError.message}`);
  results.failed.push({ provider, model: model.name, error: lastError.message });
  return false;
}

// Main test suite
async function runTestSuite() {
  logSection('AI Provider Model Validation Test Suite');
  log('Testing all configured AI providers and models\n', 'cyan');
  
  const startTime = Date.now();
  
  // Check API keys
  const apiKeys = {
    gemini: process.env.VITE_GEMINI_API_KEY,
    cerebras: process.env.VITE_CEREBRAS_API_KEY,
    groq: process.env.VITE_GROQ_API_KEY,
    openrouter: process.env.VITE_OPENROUTER_API_KEY,
    ollama: process.env.VITE_OLLAMA_API_KEY,
    ollamaBaseUrl: process.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'
  };
  
  log('API Key Status:', 'bright');
  log(`  Gemini:     ${apiKeys.gemini ? '✓ Configured' : '✗ Missing'}`, apiKeys.gemini ? 'green' : 'red');
  log(`  Cerebras:   ${apiKeys.cerebras ? '✓ Configured' : '✗ Missing'}`, apiKeys.cerebras ? 'green' : 'red');
  log(`  Groq:       ${apiKeys.groq ? '✓ Configured' : '✗ Missing'}`, apiKeys.groq ? 'green' : 'red');
  log(`  OpenRouter: ${apiKeys.openrouter ? '✓ Configured' : '✗ Missing'}`, apiKeys.openrouter ? 'green' : 'red');
  log(`  Ollama:     ${apiKeys.ollamaBaseUrl}`, 'cyan');
  
  // Test Gemini
  if (apiKeys.gemini && !apiKeys.gemini.includes('YOUR_')) {
    logSection('Testing Google Gemini Models');
    for (const model of GEMINI_MODELS) {
      await runTest('Gemini', model, testGemini, apiKeys.gemini);
    }
  } else {
    logSection('Skipping Google Gemini Models');
    log('API key not configured', 'yellow');
    GEMINI_MODELS.forEach(model => {
      logTest('Gemini', model.name, 'SKIP', 'API key not configured');
      results.skipped.push({ provider: 'Gemini', model: model.name });
    });
  }
  
  // Test Cerebras
  if (apiKeys.cerebras && !apiKeys.cerebras.includes('YOUR_')) {
    logSection('Testing Cerebras Models');
    for (const model of CEREBRAS_MODELS) {
      await runTest('Cerebras', model, testCerebras, apiKeys.cerebras);
    }
  } else {
    logSection('Skipping Cerebras Models');
    log('API key not configured', 'yellow');
    CEREBRAS_MODELS.forEach(model => {
      logTest('Cerebras', model.name, 'SKIP', 'API key not configured');
      results.skipped.push({ provider: 'Cerebras', model: model.name });
    });
  }
  
  // Test Groq
  if (apiKeys.groq && !apiKeys.groq.includes('YOUR_')) {
    logSection('Testing Groq Models');
    for (const model of GROQ_MODELS) {
      await runTest('Groq', model, testGroq, apiKeys.groq);
    }
  } else {
    logSection('Skipping Groq Models');
    log('API key not configured', 'yellow');
    GROQ_MODELS.forEach(model => {
      logTest('Groq', model.name, 'SKIP', 'API key not configured');
      results.skipped.push({ provider: 'Groq', model: model.name });
    });
  }
  
  // Test OpenRouter
  if (apiKeys.openrouter && !apiKeys.openrouter.includes('YOUR_')) {
    logSection('Testing OpenRouter Models');
    for (const model of OPENROUTER_MODELS) {
      await runTest('OpenRouter', model, testOpenRouter, apiKeys.openrouter);
    }
  } else {
    logSection('Skipping OpenRouter Models');
    log('API key not configured', 'yellow');
    OPENROUTER_MODELS.forEach(model => {
      logTest('OpenRouter', model.name, 'SKIP', 'API key not configured');
      results.skipped.push({ provider: 'OpenRouter', model: model.name });
    });
  }
  
  // Test Ollama (Local)
  logSection('Testing Ollama Local Models');
  log('Note: Ollama must be running locally for these tests', 'yellow');
  
  // Check if Ollama is running
  try {
    const checkResponse = await fetch(`${apiKeys.ollamaBaseUrl}/api/tags`, {
      method: 'GET'
    });
    
    if (checkResponse.ok) {
      log('✓ Ollama is running', 'green');
      
      for (const model of OLLAMA_LOCAL_MODELS) {
        await runTest('Ollama', model, testOllama, apiKeys.ollamaBaseUrl);
      }
    } else {
      throw new Error('Ollama not responding');
    }
  } catch (error) {
    log('✗ Ollama is not running or not accessible', 'red');
    OLLAMA_LOCAL_MODELS.forEach(model => {
      logTest('Ollama', model.name, 'SKIP', 'Ollama not running');
      results.skipped.push({ provider: 'Ollama', model: model.name });
    });
  }
  
  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  logSection('Test Summary');
  log(`Total Tests: ${results.passed.length + results.failed.length + results.skipped.length}`, 'bright');
  log(`✓ Passed:  ${results.passed.length}`, 'green');
  log(`✗ Failed:  ${results.failed.length}`, 'red');
  log(`○ Skipped: ${results.skipped.length}`, 'yellow');
  log(`Duration:  ${duration}s`, 'cyan');
  
  if (results.failed.length > 0) {
    logSection('Failed Tests Details');
    results.failed.forEach(({ provider, model, error }) => {
      log(`✗ [${provider}] ${model}`, 'red');
      log(`  ${error}`, 'gray');
    });
  }
  
  // Exit with appropriate code
  const exitCode = results.failed.length > 0 ? 1 : 0;
  
  console.log('\n' + '='.repeat(70));
  log(exitCode === 0 ? '✓ All tests passed!' : '✗ Some tests failed', exitCode === 0 ? 'green' : 'red');
  console.log('='.repeat(70) + '\n');
  
  process.exit(exitCode);
}

// Run the test suite
runTestSuite().catch(error => {
  log('\n✗ Test suite crashed:', 'red');
  console.error(error);
  process.exit(1);
});
