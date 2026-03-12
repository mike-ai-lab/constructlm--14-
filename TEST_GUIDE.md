# AI Provider Testing Guide

## Overview

This guide explains how to test all AI provider integrations in ConstructLM using the automated test suite.

## Prerequisites

- Node.js 18 or higher
- Internet connection
- API keys for the providers you want to test
- Ollama installed locally (optional, for Ollama tests)

## Setup

### 1. Configure API Keys

Edit `.env.local` and replace the placeholders with your actual API keys:

```bash
# Google Gemini API Key
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Cerebras API Key
VITE_CEREBRAS_API_KEY=YOUR_CEREBRAS_API_KEY_HERE

# Groq API Key
VITE_GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# OpenRouter API Key
VITE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

# Ollama API Key (for cloud mode)
VITE_OLLAMA_API_KEY=YOUR_OLLAMA_API_KEY_HERE

# Ollama Base URL (for local mode)
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Get API Keys

#### Google Gemini
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env.local`

#### Cerebras
1. Visit https://cloud.cerebras.ai/
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new key
5. Copy and paste into `.env.local`

#### Groq
1. Visit https://console.groq.com/
2. Sign up for an account
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into `.env.local`

#### OpenRouter
1. Visit https://openrouter.ai/
2. Sign up for an account
3. Navigate to Keys section
4. Create a new key
5. Copy and paste into `.env.local`

#### Ollama (Local)
1. Install Ollama: https://ollama.ai/
2. Start Ollama: `ollama serve`
3. Pull models: `ollama pull llama3.1:8b`
4. No API key needed for local mode

## Running Tests

### Run All Tests

```bash
node test-ai-providers.mjs
```

### What Gets Tested

The test suite validates:

1. **API Key Validation** - Checks if keys are configured
2. **Model Availability** - Tests each model's endpoint
3. **Response Generation** - Verifies models can generate text
4. **Error Handling** - Tests timeout and error scenarios
5. **Retry Logic** - Automatically retries failed tests

### Tested Models

#### Gemini (3 models)
- gemini-flash-latest
- gemini-2.5-flash
- gemini-2.5-flash-lite

#### Cerebras (2 models)
- llama3.1-8b
- llama-3.3-70b

#### Groq (5 models)
- llama-3.3-70b-versatile
- llama-3.1-70b-versatile
- llama-3.1-8b-instant
- mixtral-8x7b-32768
- gemma2-9b-it

#### OpenRouter (5 models)
- openai/gpt-oss-20b:free
- stepfun/step-3.5-flash:free
- z-ai/glm-4.5-air:free
- arcee-ai/trinity-large-preview:free
- liquid/lfm-2.5-1.2b-thinking:free

#### Ollama Local (2 models)
- llama3.1:8b
- mistral:7b

**Total: 17 models across 5 providers**

## Understanding Test Output

### Test Status Indicators

- `✓` **PASS** - Model responded successfully
- `✗` **FAIL** - Model failed to respond
- `○` **SKIP** - Test skipped (API key not configured)
- `▶` **TEST** - Test in progress

### Example Output

```
======================================================================
Testing Google Gemini Models
======================================================================
▶ [Gemini] Gemini Flash (Latest)
  Testing...
✓ [Gemini] Gemini Flash (Latest)
  Response: SUCCESS

======================================================================
Test Summary
======================================================================
Total Tests: 17
✓ Passed:  15
✗ Failed:  0
○ Skipped: 2
Duration:  45.32s

======================================================================
✓ All tests passed!
======================================================================
```

## Troubleshooting

### Issue: "API key not configured"

**Solution**: Add your API key to `.env.local` and ensure it doesn't contain `YOUR_` placeholder text.

### Issue: "Timeout"

**Possible causes**:
- Slow internet connection
- Provider API is down
- Rate limiting

**Solution**: 
- Check your internet connection
- Wait a few minutes and retry
- Check provider status page

### Issue: "HTTP 401" or "HTTP 403"

**Possible causes**:
- Invalid API key
- Expired API key
- Insufficient permissions

**Solution**:
- Verify API key is correct
- Regenerate API key from provider dashboard
- Check account status and billing

### Issue: "Ollama not running"

**Solution**:
```bash
# Start Ollama
ollama serve

# In another terminal, pull models
ollama pull llama3.1:8b
ollama pull mistral:7b
```

### Issue: "Empty response from API"

**Possible causes**:
- Model is overloaded
- API format changed
- Network issue

**Solution**:
- Retry the test
- Check provider documentation for API changes
- Report issue if persistent

## Test Configuration

### Modify Test Settings

Edit `test-ai-providers.mjs`:

```javascript
// Change test message
const TEST_MESSAGE = "Your custom test message";

// Change timeout (milliseconds)
const TIMEOUT_MS = 60000; // 60 seconds

// Change retry attempts
const MAX_RETRIES = 3;
```

### Add More Models

To test additional models, add them to the model arrays:

```javascript
const GEMINI_MODELS = [
  { id: "gemini-flash-latest", name: "Gemini Flash (Latest)" },
  { id: "your-new-model", name: "Your New Model" } // Add here
];
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test AI Providers

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Create .env.local
        run: |
          echo "VITE_GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> .env.local
          echo "VITE_CEREBRAS_API_KEY=${{ secrets.CEREBRAS_API_KEY }}" >> .env.local
          echo "VITE_GROQ_API_KEY=${{ secrets.GROQ_API_KEY }}" >> .env.local
      - name: Run tests
        run: node test-ai-providers.mjs
```

## Best Practices

1. **Don't commit API keys** - Keep `.env.local` in `.gitignore`
2. **Use test keys** - Create separate API keys for testing
3. **Monitor usage** - Check provider dashboards for API usage
4. **Rate limiting** - Space out tests if hitting rate limits
5. **Regular testing** - Run tests before deployments
6. **Document failures** - Report persistent failures to provider support

## Support

For issues with:
- **Test script**: Check this guide or open an issue
- **API providers**: Contact provider support directly
- **ConstructLM**: See main README.md

## License

MIT License - Same as ConstructLM project
