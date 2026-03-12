# AI Provider Testing - Complete Setup

## 📦 What Was Created

### Test Files
1. **test-ai-providers.mjs** - Main test script (Node.js)
2. **run-tests.bat** - Windows batch file (double-click to run)
3. **run-tests.sh** - Linux/Mac shell script (chmod +x && ./run-tests.sh)

### Documentation
1. **TEST_GUIDE.md** - Complete testing documentation
2. **QUICK_TEST.md** - Quick reference card
3. **TESTING_SUMMARY.md** - This file

### Configuration
1. **.env.local** - Updated with all API key placeholders

## 🎯 Test Coverage

The test suite validates **17 models** across **5 AI providers**:

| Provider | Models | Status |
|----------|--------|--------|
| Google Gemini | 3 | ✅ Ready |
| Cerebras | 2 | ✅ Ready |
| Groq | 5 | ✅ Ready |
| OpenRouter | 5 | ✅ Ready |
| Ollama (Local) | 2 | ⚠️ Requires local install |

## 🚀 Quick Start (3 Steps)

### Step 1: Configure API Keys

Edit `.env.local` and replace placeholders:

```bash
VITE_GEMINI_API_KEY=your_actual_key_here
VITE_CEREBRAS_API_KEY=your_actual_key_here
VITE_GROQ_API_KEY=your_actual_key_here
VITE_OPENROUTER_API_KEY=your_actual_key_here
```

### Step 2: Run Tests

**Windows:**
```cmd
run-tests.bat
```
or
```cmd
node test-ai-providers.mjs
```

**Linux/Mac:**
```bash
chmod +x run-tests.sh
./run-tests.sh
```
or
```bash
node test-ai-providers.mjs
```

### Step 3: Review Results

Check the terminal output for:
- ✓ Passed tests (green)
- ✗ Failed tests (red)
- ○ Skipped tests (yellow)

## 📋 Pre-Test Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Internet connection active
- [ ] API keys added to `.env.local`
- [ ] API keys don't contain "YOUR_" placeholder text
- [ ] Ollama running locally (optional, for Ollama tests)

## 🔑 Getting API Keys

### Google Gemini (Free)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key to `.env.local`

### Cerebras (Free)
1. Visit: https://cloud.cerebras.ai/
2. Sign up for account
3. Navigate to API Keys
4. Create new key
5. Copy key to `.env.local`

### Groq (Free)
1. Visit: https://console.groq.com/
2. Sign up for account
3. Navigate to API Keys
4. Create new key
5. Copy key to `.env.local`

### OpenRouter (Free Tier)
1. Visit: https://openrouter.ai/
2. Sign up for account
3. Navigate to Keys section
4. Create new key
5. Copy key to `.env.local`

### Ollama (Local - Free)
1. Install: https://ollama.ai/
2. Start: `ollama serve`
3. Pull models: `ollama pull llama3.1:8b`
4. No API key needed

## 📊 Expected Test Duration

- **With all providers**: ~45-60 seconds
- **Single provider**: ~10-15 seconds
- **Per model**: ~2-3 seconds

## ✅ Success Criteria

Tests pass if:
- ✓ API responds within 30 seconds
- ✓ Response contains text content
- ✓ No HTTP errors (401, 403, 500, etc.)

Tests are skipped if:
- ○ API key not configured
- ○ Provider not accessible (Ollama not running)

## 🔧 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| "API key not configured" | Add key to `.env.local` without "YOUR_" text |
| "Timeout" | Check internet, retry in 1 minute |
| "HTTP 401" | Regenerate API key from provider |
| "HTTP 429" | Rate limited, wait 5 minutes |
| "Ollama not running" | Run `ollama serve` in terminal |
| "Empty response" | Provider issue, retry later |

## 📈 Test Features

### Automatic Retry
- Each test retries up to 2 times on failure
- 1 second delay between retries
- Helps with transient network issues

### Timeout Protection
- 30 second timeout per test
- Prevents hanging on slow responses
- Configurable in test script

### Detailed Logging
- Color-coded output (green/red/yellow)
- Response preview for passed tests
- Error messages for failed tests
- Summary statistics at end

### Exit Codes
- `0` = All tests passed
- `1` = One or more tests failed
- Useful for CI/CD integration

## 🎓 Understanding Test Output

### Status Symbols
- `▶` = Test in progress
- `✓` = Test passed (green)
- `✗` = Test failed (red)
- `○` = Test skipped (yellow)

### Example Success
```
✓ [Gemini] Gemini 2.5 Flash
  Response: SUCCESS
```

### Example Failure
```
✗ [Cerebras] Llama 3.1 8B
  Error: HTTP 401: Invalid API key
```

### Example Skip
```
○ [OpenRouter] GPT OSS 20B
  API key not configured
```

## 🔐 Security Notes

- ✅ API keys stored in `.env.local` (gitignored)
- ✅ Keys never logged to console
- ✅ Keys sent only to official provider APIs
- ✅ No third-party services involved
- ⚠️ Don't commit `.env.local` to git
- ⚠️ Use separate keys for testing

## 📚 Additional Resources

- **Full Documentation**: See `TEST_GUIDE.md`
- **Quick Reference**: See `QUICK_TEST.md`
- **AI Integration Guide**: See `.kiro/steering/ai-providers-integration.md`
- **Project README**: See `README.md`

## 🤝 Support

### For Test Script Issues
- Check `TEST_GUIDE.md` troubleshooting section
- Verify Node.js version: `node --version`
- Check `.env.local` format

### For API Provider Issues
- Check provider status pages
- Verify account status and billing
- Contact provider support directly

### For ConstructLM Issues
- See main `README.md`
- Check GitHub issues
- Review documentation in `/docs`

## 🎉 Next Steps After Testing

Once tests pass:

1. ✅ Start development server: `npm run dev`
2. ✅ Open app: http://localhost:3000
3. ✅ Configure API keys in Settings modal
4. ✅ Upload documents for RAG
5. ✅ Start chatting with AI models

## 📝 Notes

- Tests use non-streaming API calls for simplicity
- Production app uses streaming for better UX
- Test message: "Hello! Please respond with a single word: 'SUCCESS'"
- Tests validate basic connectivity and response generation
- Vision and RAG features tested separately in app

---

**Created**: 2026-03-11  
**Version**: 1.0  
**Maintainer**: ConstructLM Team
