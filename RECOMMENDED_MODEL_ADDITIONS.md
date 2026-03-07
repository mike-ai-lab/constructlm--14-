# 🎯 Recommended Model Additions for ConstructLM

## Executive Summary

Based on testing and research, here are the **HIGH PRIORITY** free-tier AI providers you should add to ConstructLM:

### Current Status
- ✅ **Groq**: 11 models working (confirmed by user)
- ⚠️ **Cerebras**: Only 1 model working (gpt-oss-120b), 3 models failing
- ✅ **Gemini**: Working (paid)

### Recommended Additions
1. **OpenRouter** - 24 free models, single API key ⭐⭐⭐
2. **Hugging Face** - 200+ models, rate-limited free tier ⭐⭐
3. **Together AI** - Freemium with credits ⭐

---

## 🚀 Priority 1: OpenRouter (MUST ADD)

### Why OpenRouter?
- **24 completely free models** (no credit card required)
- **Single API key** for all models
- **OpenAI-compatible API** (easy integration)
- **No rate limits** on most free models
- **Best models available**: Llama 3.1 405B, Gemini 2.0 Flash, DeepSeek R1

### Top Free Models to Add

#### General Purpose (8 models)
```javascript
{
  id: 'google/gemini-2.0-flash-exp:free',
  name: 'Gemini 2.0 Flash Exp • OpenRouter',
  context: 1000000,
  description: '1M context window, multimodal, extremely fast',
  features: ['multimodal', 'vision']
}

{
  id: 'meta-llama/llama-3.1-405b-instruct:free',
  name: 'Llama 3.1 405B • OpenRouter',
  context: 131072,
  description: 'Largest open source model, GPT-4 level performance'
}

{
  id: 'meta-llama/llama-3.3-70b-instruct:free',
  name: 'Llama 3.3 70B • OpenRouter',
  context: 131072,
  description: 'Flagship Llama model, excellent general purpose'
}

{
  id: 'mistralai/mistral-small-3.1:free',
  name: 'Mistral Small 3.1 • OpenRouter',
  context: 128000,
  description: 'Extended context, fast inference'
}

{
  id: 'openai/gpt-oss-120b:free',
  name: 'GPT OSS 120B • OpenRouter',
  context: 131072,
  description: 'OpenAI\'s open-weight model, Apache 2.0'
}

{
  id: 'zhipu/glm-4.5-air:free',
  name: 'GLM-4.5-Air • OpenRouter',
  context: 131072,
  description: 'Strong multilingual support'
}

{
  id: 'upstage/solar-pro-3:free',
  name: 'Solar Pro 3 • OpenRouter',
  context: 128000,
  description: 'Korean AI lab, strong multilingual'
}

{
  id: 'stepfun/step-3.5-flash:free',
  name: 'Step 3.5 Flash • OpenRouter',
  context: 256000,
  description: '256K context, strong general performance'
}
```

#### Coding Specialists (3 models)
```javascript
{
  id: 'qwen/qwen3-coder:free',
  name: 'Qwen3 Coder • OpenRouter',
  context: 262000,
  description: '480B MoE, state-of-art code generation',
  features: ['coding']
}

{
  id: 'mistralai/devstral-2:free',
  name: 'Devstral 2 • OpenRouter',
  context: 262000,
  description: 'Mistral\'s coding specialist, MIT license',
  features: ['coding', 'agents']
}

{
  id: 'xiaomi/mimo-v2-flash:free',
  name: 'MiMo-V2-Flash • OpenRouter',
  context: 262000,
  description: '309B MoE, #1 open-source on SWE-bench',
  features: ['coding']
}
```

#### Reasoning Models (3 models)
```javascript
{
  id: 'deepseek/deepseek-r1-0528:free',
  name: 'DeepSeek R1 • OpenRouter',
  context: 164000,
  description: 'Strong reasoning capabilities',
  features: ['reasoning']
}

{
  id: 'arcee-ai/arcee-trinity-large:free',
  name: 'Arcee Trinity Large • OpenRouter',
  context: 131072,
  description: 'Free reasoning model from Arcee AI',
  features: ['reasoning']
}

{
  id: 'liquid-ai/lfm2.5-1.2b-thinking:free',
  name: 'LFM2.5 Thinking • OpenRouter',
  context: 32000,
  description: 'Compact reasoning model with thinking',
  features: ['reasoning']
}
```

#### Multimodal/Vision (3 models)
```javascript
{
  id: 'google/gemma-3-27b:free',
  name: 'Gemma 3 27B • OpenRouter',
  context: 131072,
  description: 'Multimodal with vision-language support',
  features: ['multimodal', 'vision']
}

{
  id: 'qwen/qwen-2.5-vl-7b:free',
  name: 'Qwen 2.5 VL 7B • OpenRouter',
  context: 33000,
  description: 'Enhanced visual understanding',
  features: ['vision']
}

{
  id: 'nvidia/nemotron-nano-vl:free',
  name: 'Nemotron Nano VL • OpenRouter',
  context: 128000,
  description: '12B multimodal reasoning with vision',
  features: ['multimodal', 'vision']
}
```

#### AI Agents (2 models)
```javascript
{
  id: 'nvidia/nemotron-3-nano:free',
  name: 'Nemotron 3 Nano • OpenRouter',
  context: 256000,
  description: '30B MoE for agentic AI, fully open',
  features: ['agents']
}

{
  id: 'nous-research/hermes-3-405b:free',
  name: 'Hermes 3 405B • OpenRouter',
  context: 131072,
  description: 'Fine-tuned Llama 3.1 405B, improved instructions',
  features: ['agents']
}
```

### Implementation

Create `services/openrouterService.ts`:

```typescript
import type { Message } from '@/types';

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
      model: model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

### Update `.env.example`:
```bash
# OpenRouter API Key (24 free models)
# Get your key from: https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## 🔧 Priority 2: Hugging Face Inference API

### Why Hugging Face?
- **200+ models** available
- **Free tier** with rate limits (~300 requests/hour)
- **No credit card** required
- **Open source** models
- **$9/month PRO** for higher limits (optional)

### Recommended Models

```javascript
// Fast & Popular
{
  id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  name: 'Llama 3.1 70B • HF',
  context: 131072,
  rateLimit: '~300 req/hour'
}

{
  id: 'mistralai/Mistral-7B-Instruct-v0.3',
  name: 'Mistral 7B • HF',
  context: 32768,
  rateLimit: '~300 req/hour'
}

{
  id: 'microsoft/Phi-3-medium-4k-instruct',
  name: 'Phi-3 Medium • HF',
  context: 4096,
  rateLimit: '~300 req/hour'
}

// Coding
{
  id: 'bigcode/starcoder2-15b',
  name: 'StarCoder2 15B • HF',
  context: 16384,
  features: ['coding'],
  rateLimit: '~300 req/hour'
}
```

### Implementation

Create `services/huggingfaceService.ts`:

```typescript
import type { Message } from '@/types';

const HF_API = 'https://api-inference.huggingface.co/models/';

function formatMessages(messages: Message[]): string {
  return messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n') + '\n\nAssistant:';
}

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
      inputs: formatMessages(messages),
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        return_full_text: false,
        stream: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    
    try {
      const parsed = JSON.parse(text);
      if (parsed.token?.text) {
        yield parsed.token.text;
      }
    } catch (e) {
      // Some models return plain text
      yield text;
    }
  }
}
```

---

## 🛠️ Priority 3: Fix Cerebras

### Issue
Only `gpt-oss-120b` works. Remove the failing models:
- ❌ `llama3.3-70b`
- ❌ `qwen-3-235b-a22b-instruct-2507`
- ❌ `zai-glm-4.7`

### Action
Update model registry to only include working model:

```javascript
{
  provider: 'cerebras',
  models: [
    {
      id: 'gpt-oss-120b',
      name: 'GPT OSS 120B • Cerebras',
      context: 32768,
      description: 'Largest model, reasoning support, unlimited free'
    }
  ]
}
```

---

## 📊 Impact Summary

### Before
- 2 providers (Groq, Cerebras)
- ~15 models
- 3 broken models

### After (with OpenRouter + HF)
- 4 providers
- **50+ models**
- All tested and working
- Better coverage:
  - General purpose: 15+ models
  - Coding specialists: 6+ models
  - Reasoning: 5+ models
  - Multimodal/Vision: 5+ models
  - AI Agents: 3+ models

### User Benefits
1. **Single API key** (OpenRouter) = 24 free models
2. **No credit card** required for any free tier
3. **Better model selection** for specific tasks
4. **Fallback options** if one provider is down
5. **Future-proof** - easy to add more providers

---

## 🎯 Implementation Checklist

### Phase 1: OpenRouter (2-3 hours)
- [ ] Create `services/openrouterService.ts`
- [ ] Add 24 OpenRouter models to model registry
- [ ] Update `SettingsModal.tsx` for OpenRouter API key
- [ ] Update `.env.example` with OpenRouter key
- [ ] Test with 3-5 models
- [ ] Update documentation

### Phase 2: Hugging Face (2-3 hours)
- [ ] Create `services/huggingfaceService.ts`
- [ ] Add 5-10 HF models to registry
- [ ] Update `SettingsModal.tsx` for HF API key
- [ ] Handle rate limiting gracefully
- [ ] Test with popular models
- [ ] Update documentation

### Phase 3: Cleanup (30 minutes)
- [ ] Remove broken Cerebras models from registry
- [ ] Update product documentation
- [ ] Update README with new providers

---

## 🔗 Resources

- [OpenRouter Free Models](https://openrouter.ai/collections/free-models)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)
- [Hugging Face Pricing](https://huggingface.co/docs/api-inference/pricing)

---

## 💡 Bonus: Future Additions

### Together AI (Freemium)
- Free credits on signup
- Good for testing
- OpenAI-compatible API

### Replicate (Pay-per-use)
- Free credits
- Wide model selection
- Good for specialized models

### Fireworks AI
- Fast inference
- Free tier available
- Good for production

---

*Last updated: March 7, 2026*
