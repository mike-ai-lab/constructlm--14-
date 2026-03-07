# Free-Tier AI Models Analysis & Recommendations

## 🔍 Current Status

### ✅ Working Models (Groq)
All 11 Groq models are available and working

### ⚠️ Cerebras Issues
Only `gpt-oss-120b` works. The other 3 models failed:
- `llama3.3-70b` - FAILED
- `qwen-3-235b-a22b-instruct-2507` - FAILED  
- `zai-glm-4.7` - FAILED

---

## 🎯 HIGH PRIORITY: Missing Free-Tier Providers

### 1. **OpenRouter** ⭐⭐⭐ HIGHEST PRIORITY
**Why**: Single API for 24+ free models, no credit card required

**Free Models Available** (February 2026):
- **Gemini 2.0 Flash Exp** - 1M context, multimodal
- **Llama 3.1 405B** - Largest open source model
- **DeepSeek R1** - Strong reasoning
- **Mistral Small 3.1** - 128K context
- **GPT-OSS 120B** - OpenAI's open model
- **Qwen3-Coder** - 480B MoE for coding
- **Devstral 2** - State-of-art coding
- **MiMo-V2-Flash** - 309B MoE, #1 on SWE-bench
- **Nemotron 3 Nano** - NVIDIA's agentic AI
- **GLM-4.5-Air** - Multilingual support
- **Gemma 3 27B/12B** - Multimodal vision
- **Arcee Trinity Large/Mini** - Reasoning models
- 12 more models...

**API Format**: OpenAI-compatible
**Rate Limits**: Generous for free tier
**Setup**: Single API key for all models

**Implementation**:
```typescript
// services/openrouterService.ts
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

export async function* streamChat(
  messages: Message[],
  model: string,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'ConstructLM',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model, // e.g., 'google/gemini-2.0-flash-exp:free'
      messages,
      stream: true
    })
  });
  // ... streaming logic
}
```

---

### 2. **Hugging Face Inference API** ⭐⭐
**Why**: Access to 200+ models, rate-limited free tier

**Free Tier**:
- ~Few hundred requests per hour
- No credit card required
- Access to popular open-source models

**Popular Free Models**:
- Llama models
- Mistral models
- Falcon models
- BLOOM models
- Many specialized models

**API Format**: Custom but simple
**Rate Limits**: ~100-300 requests/hour (free)
**Upgrade**: $9/month for PRO (higher limits)

**Implementation**:
```typescript
// services/huggingfaceService.ts
const HF_API = 'https://api-inference.huggingface.co/models/';

export async function* streamChat(
  messages: Message[],
  model: string,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(`${HF_API}${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: formatMessagesForHF(messages),
      parameters: { max_new_tokens: 2048, stream: true }
    })
  });
  // ... streaming logic
}
```

---

### 3. **Together AI** ⭐
**Why**: Freemium model with good performance

**Free Tier**:
- Limited free credits on signup
- Access to open-source models
- Good for testing and development

**Models**:
- Llama 3.1 models
- Mistral models
- Qwen models
- Code-specific models

**API Format**: OpenAI-compatible
**Rate Limits**: Credit-based

---

## 📊 Recommended Model Registry Update

### Priority 1: Add OpenRouter (24 free models)
```json
{
  "provider": "openrouter",
  "apiKeyEnv": "OPENROUTER_API_KEY",
  "models": [
    {
      "id": "google/gemini-2.0-flash-exp:free",
      "name": "Gemini 2.0 Flash • OpenRouter",
      "context": 1000000,
      "free": true,
      "features": ["multimodal"],
      "description": "1M context, fast, multimodal"
    },
    {
      "id": "meta-llama/llama-3.1-405b-instruct:free",
      "name": "Llama 3.1 405B • OpenRouter",
      "context": 131072,
      "free": true,
      "description": "Largest open source model"
    },
    {
      "id": "deepseek/deepseek-r1:free",
      "name": "DeepSeek R1 • OpenRouter",
      "context": 164000,
      "free": true,
      "features": ["reasoning"],
      "description": "Strong reasoning capabilities"
    },
    {
      "id": "mistralai/mistral-small-3.1:free",
      "name": "Mistral Small 3.1 • OpenRouter",
      "context": 128000,
      "free": true,
      "description": "Extended context, general purpose"
    },
    {
      "id": "qwen/qwen3-coder:free",
      "name": "Qwen3 Coder • OpenRouter",
      "context": 262000,
      "free": true,
      "features": ["coding"],
      "description": "480B MoE for code generation"
    },
    {
      "id": "mistralai/devstral-2:free",
      "name": "Devstral 2 • OpenRouter",
      "context": 262000,
      "free": true,
      "features": ["coding"],
      "description": "State-of-art coding model"
    },
    {
      "id": "nvidia/nemotron-3-nano:free",
      "name": "Nemotron 3 Nano • OpenRouter",
      "context": 256000,
      "free": true,
      "features": ["agents"],
      "description": "30B MoE for agentic AI"
    },
    {
      "id": "google/gemma-3-27b:free",
      "name": "Gemma 3 27B • OpenRouter",
      "context": 131072,
      "free": true,
      "features": ["multimodal"],
      "description": "Vision-language support"
    }
  ]
}
```

### Priority 2: Add Hugging Face
```json
{
  "provider": "huggingface",
  "apiKeyEnv": "HUGGINGFACE_API_KEY",
  "models": [
    {
      "id": "meta-llama/Meta-Llama-3.1-70B-Instruct",
      "name": "Llama 3.1 70B • HF",
      "context": 131072,
      "free": true,
      "rateLimit": "~300 req/hour"
    },
    {
      "id": "mistralai/Mistral-7B-Instruct-v0.3",
      "name": "Mistral 7B • HF",
      "context": 32768,
      "free": true,
      "rateLimit": "~300 req/hour"
    }
  ]
}
```

### Priority 3: Fix Cerebras Models
Only keep the working model:
```json
{
  "provider": "cerebras",
  "models": [
    {
      "id": "gpt-oss-120b",
      "name": "GPT OSS 120B • Cerebras",
      "context": 32768,
      "free": true,
      "description": "Largest model, reasoning support"
    }
  ]
}
```

---

## 🚀 Implementation Plan

### Phase 1: OpenRouter Integration (Highest Impact)
1. Create `services/openrouterService.ts`
2. Add OpenRouter models to model registry
3. Update SettingsModal to include OpenRouter API key
4. Test with free models
5. **Impact**: +24 free models with single API key

### Phase 2: Hugging Face Integration
1. Create `services/huggingfaceService.ts`
2. Add HF models to registry
3. Handle rate limiting gracefully
4. **Impact**: +200 models (rate-limited)

### Phase 3: Clean Up Cerebras
1. Remove non-working models from registry
2. Update documentation
3. **Impact**: Better user experience, no failed requests

---

## 💡 User Experience Improvements

### Model Selector Enhancements
```typescript
// Group models by provider and show free badge
interface ModelGroup {
  provider: string;
  models: Model[];
}

// Show free tier limits
interface Model {
  id: string;
  name: string;
  free: boolean;
  rateLimit?: string; // "Unlimited" | "~300 req/hour"
  features?: string[]; // ["multimodal", "coding", "reasoning"]
}
```

### Settings Modal Updates
```typescript
// Add new API key fields
- OpenRouter API Key (24 free models)
- Hugging Face API Key (200+ models, rate-limited)
- Groq API Key (11 free models, unlimited)
- Cerebras API Key (1 free model, unlimited)
- Gemini API Key (paid)
```

---

## 📈 Expected Outcomes

### Before
- 2 providers (Groq, Cerebras)
- ~15 models total
- 3 Cerebras models failing

### After
- 4 providers (Groq, OpenRouter, Hugging Face, Cerebras)
- 50+ models available
- All models tested and working
- Better free tier coverage
- Single API key (OpenRouter) gives 24 models

---

## 🎯 Recommendation Summary

**MUST ADD**:
1. ✅ OpenRouter - 24 free models, no credit card, single API
2. ✅ Hugging Face - 200+ models, rate-limited free tier

**SHOULD FIX**:
3. ✅ Remove broken Cerebras models (keep only gpt-oss-120b)

**NICE TO HAVE**:
4. Together AI - Freemium with credits
5. Replicate - Pay-per-use with free credits

---

## 📝 Next Steps

1. Run test script to confirm Cerebras failures
2. Implement OpenRouter service (highest priority)
3. Update model registry with OpenRouter models
4. Test OpenRouter integration
5. Add Hugging Face support
6. Update documentation

---

*Analysis based on February 2026 data from [OpenRouter](https://openrouter.ai/collections/free-models), [Hugging Face](https://huggingface.co/docs/api-inference/pricing), and [Together AI](https://www.together.ai/pricing)*
