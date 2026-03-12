# Quick Test Reference

## 🚀 Quick Start

```bash
# 1. Add your API keys to .env.local
# 2. Run the test
node test-ai-providers.mjs
```

## 📋 API Key Checklist

Edit `.env.local`:

- [ ] `VITE_GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey
- [ ] `VITE_CEREBRAS_API_KEY` - Get from https://cloud.cerebras.ai/
- [ ] `VITE_GROQ_API_KEY` - Get from https://console.groq.com/
- [ ] `VITE_OPENROUTER_API_KEY` - Get from https://openrouter.ai/
- [ ] `VITE_OLLAMA_BASE_URL` - Default: http://localhost:11434 (local only)

## 🎯 What Gets Tested

- ✅ 3 Gemini models
- ✅ 2 Cerebras models  
- ✅ 5 Groq models
- ✅ 5 OpenRouter models
- ✅ 2 Ollama models (if running locally)

**Total: 17 models**

## 📊 Expected Output

```
======================================================================
AI Provider Model Validation Test Suite
======================================================================

API Key Status:
  Gemini:     ✓ Configured
  Cerebras:   ✓ Configured
  Groq:       ✓ Configured
  OpenRouter: ✓ Configured
  Ollama:     http://localhost:11434

======================================================================
Testing Google Gemini Models
======================================================================
✓ [Gemini] Gemini Flash (Latest)
✓ [Gemini] Gemini 2.5 Flash
✓ [Gemini] Gemini 2.5 Flash Lite

... (more tests)

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

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| "API key not configured" | Add key to `.env.local` |
| "Timeout" | Check internet connection |
| "HTTP 401" | Verify API key is valid |
| "Ollama not running" | Run `ollama serve` |

## 💡 Pro Tips

- Tests run with 2 retries automatically
- Each test has 30s timeout
- Skipped tests don't count as failures
- Exit code 0 = all passed, 1 = some failed

## 📖 Full Documentation

See `TEST_GUIDE.md` for complete documentation.
