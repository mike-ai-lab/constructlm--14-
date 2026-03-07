# OpenRouter Testing Guide

## 🎯 Purpose

Before integrating OpenRouter into ConstructLM, we need to validate which models actually work with your API key. This ensures we only add working models and avoid clutter.

---

## 📋 Prerequisites

1. **Get a free OpenRouter API key**:
   - Visit: https://openrouter.ai/keys
   - Sign up (no credit card required)
   - Create an API key (starts with `sk-or-v1-...`)

2. **Add the key to `.env.local`**:
   ```bash
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

---

## 🧪 Testing Methods

### Method 1: Node.js Script (Recommended)

**Run the test:**
```bash
node test-openrouter.mjs
```

**What it tests:**
- 18 recommended free models
- Grouped by category (General, Coding, Reasoning, Multimodal, Agents)
- Shows detailed results with response text and token usage
- Color-coded output for easy reading

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║         OPENROUTER MODEL AVAILABILITY TEST                 ║
╚════════════════════════════════════════════════════════════╝

✓ API Key found: sk-or-v1-xxxxx...

════════════════════════════════════════════════════════════
GENERAL MODELS (5)
════════════════════════════════════════════════════════════

Testing Gemini 2.0 Flash Exp [multimodal, vision]...
  Model ID: google/gemini-2.0-flash-exp:free
  Context: 1M | ✓ AVAILABLE
  Response: "OK"
  Tokens: 15

...
```

---

### Method 2: Browser Test (Alternative)

**Open in browser:**
```bash
# Just open the file in your browser
test-openrouter.html
```

**Steps:**
1. Open `test-openrouter.html` in your browser
2. Enter your OpenRouter API key
3. Click "Test All Models"
4. Wait for results (takes ~2 minutes)

**Features:**
- Visual progress bar
- Real-time results
- Grouped by category
- Summary statistics

---

## 📊 Models Being Tested

### General Purpose (5 models)
- Gemini 2.0 Flash Exp (1M context)
- Llama 3.1 405B (largest open source)
- Llama 3.3 70B
- Mistral Small 3.1
- GPT OSS 120B

### Coding Specialists (3 models)
- Qwen3 Coder (480B MoE)
- Devstral 2 (Mistral's coding model)
- MiMo-V2-Flash (#1 on SWE-bench)

### Reasoning Models (2 models)
- DeepSeek R1
- Arcee Trinity Large

### Multimodal/Vision (2 models)
- Gemma 3 27B
- Qwen 2.5 VL 7B

### AI Agents (2 models)
- Nemotron 3 Nano
- Hermes 3 405B

### Additional Popular (4 models)
- GLM-4.5-Air (multilingual)
- Solar Pro 3 (multilingual)
- Step 3.5 Flash
- Gemma 3 12B

---

## ✅ What to Look For

### Success Indicators
- ✓ Model responds with "OK" or similar
- Token count is shown
- No error messages

### Failure Indicators
- ✗ HTTP 404 - Model doesn't exist or ID changed
- ✗ HTTP 403 - Access denied (may need special permission)
- ✗ HTTP 429 - Rate limited (wait and retry)
- ✗ Other errors - API issue or network problem

---

## 📝 After Testing

### If Most Models Pass (80%+)
✅ **Proceed with integration!**
- Use the passing models in ConstructLM
- Skip any failed models
- Document which models work

### If Many Models Fail (50%+)
⚠️ **Investigate before proceeding:**
- Check if API key is valid
- Verify model IDs haven't changed
- Check OpenRouter status page
- Try again later (might be temporary)

### If All Models Fail
❌ **Don't integrate yet:**
- Verify API key is correct
- Check if account is active
- Contact OpenRouter support
- Try the browser test method

---

## 🔍 Interpreting Results

### Example: Good Results
```
Overall:
  Total Tested: 18
  ✓ Passed: 17
  ✗ Failed: 1
  Success Rate: 94.4%
```
**Action**: Proceed with integration, use the 17 working models

### Example: Mixed Results
```
Overall:
  Total Tested: 18
  ✓ Passed: 12
  ✗ Failed: 6
  Success Rate: 66.7%
```
**Action**: Investigate failures, use only the 12 working models

### Example: Poor Results
```
Overall:
  Total Tested: 18
  ✓ Passed: 3
  ✗ Failed: 15
  Success Rate: 16.7%
```
**Action**: Don't integrate yet, troubleshoot API key/access issues

---

## 🐛 Troubleshooting

### "No OpenRouter API key found"
- Make sure you added the key to `.env.local`
- Use either `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY`
- Restart the terminal after adding the key

### "HTTP 401: Unauthorized"
- API key is invalid or expired
- Get a new key from https://openrouter.ai/keys
- Make sure you copied the full key (starts with `sk-or-v1-`)

### "HTTP 429: Rate Limited"
- You're making requests too fast
- Wait 1-2 minutes and try again
- The script has built-in delays, but manual testing might trigger this

### "fetch failed" or Network Errors
- Check your internet connection
- Try the browser test method instead
- OpenRouter might be temporarily down

### Models Return Empty Responses
- This is normal for some models
- As long as there's no error, the model is available
- The model just chose not to respond to the test prompt

---

## 📈 Next Steps

After successful testing:

1. **Document Results**
   - Save the test output
   - Note which models passed
   - Note any patterns in failures

2. **Update Model Registry**
   - Add only the passing models
   - Use correct model IDs from test
   - Include context sizes and features

3. **Implement Integration**
   - Create `services/openrouterService.ts`
   - Update `SettingsModal.tsx`
   - Add models to UI selector
   - Test in actual app

4. **User Documentation**
   - Update README with OpenRouter info
   - Add setup instructions
   - List available models

---

## 💡 Tips

- **Run tests during off-peak hours** for better results
- **Save the output** for reference during integration
- **Test again before deployment** to catch any changes
- **Start with top 5-10 models** if you want to integrate gradually
- **Monitor OpenRouter's model list** as they add/remove models

---

## 🔗 Resources

- [OpenRouter API Keys](https://openrouter.ai/keys)
- [OpenRouter Free Models](https://openrouter.ai/collections/free-models)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Status](https://status.openrouter.ai/)

---

*Ready to test? Run `node test-openrouter.mjs` or open `test-openrouter.html` in your browser!*
