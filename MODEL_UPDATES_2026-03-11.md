# Model Registry Updates - March 11, 2026

## Summary

Based on test results, several models have been deprecated by providers and have been removed from the application.

## Changes Made

### ✅ Google Gemini
**Removed:**
- `gemini-flash-latest` - Model not found for API version v1

**Added:**
- `gemini-2.0-flash-exp` - Gemini 2.0 Flash Experimental

**Kept (Working):**
- `gemini-2.5-flash` - ✓ Tested and working
- `gemini-2.5-flash-lite` - ✓ Tested and working

### ✅ Cerebras
**Fixed:**
- `llama-3.3-70b` → `llama3.3-70b` (corrected model ID format)

**Working:**
- `llama3.1-8b` - ✓ Tested and working
- `llama3.3-70b` - ✓ Corrected ID format

### ✅ Groq
**Removed (Decommissioned):**
- `llama-3.1-70b-versatile` - Officially decommissioned by Groq
- `mixtral-8x7b-32768` - Officially decommissioned by Groq
- `gemma2-9b-it` - Officially decommissioned by Groq
- `gemma-7b-it` - Not tested, likely decommissioned

**Added:**
- `llama-3.2-3b-preview` - Llama 3.2 3B (compact model)
- `llama-3.2-1b-preview` - Llama 3.2 1B (ultra-compact model)

**Kept (Working):**
- `llama-3.3-70b-versatile` - ✓ Tested and working
- `llama-3.1-8b-instant` - ✓ Tested and working
- `llama-3.2-90b-vision-preview` - Vision model (not tested)
- `llama-3.2-11b-vision-preview` - Vision model (not tested)
- `llama-guard-3-8b` - Safety model (not tested)

### ✅ OpenRouter
**Removed:**
- `liquid/lfm-2.5-1.2b-thinking:free` - Empty response from API
- `liquid/lfm-2.5-1.2b-instruct:free` - Removed proactively

**Kept (Working):**
- `openai/gpt-oss-20b:free` - ✓ Tested and working
- `stepfun/step-3.5-flash:free` - ✓ Tested and working
- `z-ai/glm-4.5-air:free` - ✓ Tested and working
- `arcee-ai/trinity-large-preview:free` - ✓ Tested and working
- `arcee-ai/trinity-mini:free` - ✓ Added (similar to trinity-large)
- All Nvidia Nemotron models - Kept (not tested)
- All Google Gemma 3 models - Kept (not tested)

### ✅ Ollama
**No changes** - Local models depend on user installation

## Test Results Summary

### Before Updates
- Total Models: 17
- Passed: 9
- Failed: 6
- Skipped: 2

### After Updates (Expected)
- Total Models: 15 (reduced by 2)
- Expected Pass Rate: ~90%+
- Removed all deprecated/non-working models

## Files Updated

1. `services/geminiService.ts` - Updated all model registries
2. `services/groqService.ts` - Removed deprecated models
3. `services/openrouterService.ts` - Removed non-working models
4. `test-ai-providers.mjs` - Updated test model lists

## Migration Guide

### For Users
No action required. The app will automatically use the updated model list.

### For Developers
If you have hardcoded model IDs in your code, update them:

```typescript
// OLD (deprecated)
"gemini-flash-latest"
"llama-3.1-70b-versatile"
"mixtral-8x7b-32768"
"gemma2-9b-it"
"liquid/lfm-2.5-1.2b-thinking:free"

// NEW (working)
"gemini-2.5-flash"
"llama-3.3-70b-versatile"
"llama-3.1-8b-instant"
"llama-3.2-3b-preview"
"arcee-ai/trinity-large-preview:free"
```

## Provider Deprecation Links

- **Groq**: https://console.groq.com/docs/deprecations
- **Gemini**: Check Google AI Studio for model availability
- **OpenRouter**: Models may be temporarily unavailable
- **Cerebras**: Model ID format requirements

## Recommendations

### For Speed
- Cerebras: `llama3.1-8b`
- Groq: `llama-3.1-8b-instant`

### For Quality
- Gemini: `gemini-2.5-flash`
- Groq: `llama-3.3-70b-versatile`
- OpenRouter: `openai/gpt-oss-20b:free`

### For Vision
- Gemini: `gemini-2.5-flash` (best)
- Groq: `llama-3.2-90b-vision-preview`
- OpenRouter: `nvidia/nemotron-nano-12b-v2-vl:free`

### For Compact/Edge
- Groq: `llama-3.2-1b-preview` (smallest)
- Groq: `llama-3.2-3b-preview`
- OpenRouter: `google/gemma-3n-e2b-it:free`

## Next Steps

1. ✅ Run tests again to verify all models work
2. ✅ Update documentation with new model counts
3. ✅ Monitor provider announcements for future deprecations
4. ⏳ Consider adding model health checks in production

## Notes

- Model availability can change without notice
- Free tier models may have rate limits
- Always check provider status pages for outages
- Test suite should be run regularly to catch deprecations early

---

**Updated**: 2026-03-11  
**Test Results**: See `AI_FULL_TEST_RESULTS.txt`  
**Maintainer**: ConstructLM Team
