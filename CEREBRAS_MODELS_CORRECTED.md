# Cerebras Models - Corrected Information

## ✅ Production Models (Fully Supported)

### 1. Llama 3.1 8B
- **Model ID**: `llama3.1-8b`
- **Parameters**: 8 billion
- **Speed**: ~2,200 tokens/second
- **Status**: Production-ready
- **Precision**: FP16

### 2. OpenAI GPT OSS 120B
- **Model ID**: `gpt-oss-120b`
- **Parameters**: 120 billion
- **Speed**: ~3,000 tokens/second
- **Status**: Production-ready
- **Precision**: FP16/FP8 (weights only)

---

## ⚠️ Preview Models (Evaluation Only - May Be Discontinued)

### 3. Qwen 3 235B Instruct
- **Model ID**: `qwen-3-235b-a22b-instruct-2507`
- **Parameters**: 235 billion
- **Speed**: ~1,400 tokens/second
- **Status**: Preview (not for production)
- **Precision**: FP16/FP8 (weights only)

### 4. Z.ai GLM 4.7
- **Model ID**: `zai-glm-4.7`
- **Parameters**: 355 billion
- **Speed**: ~1,000 tokens/second
- **Status**: Preview (not for production)
- **Precision**: FP16/FP8 (weights only)

---

## 🔍 Test Results Analysis

### Your Test Results:
```
✓ gpt-oss-120b - AVAILABLE
✗ llama-3.3-70b - 404 (Model does not exist)
✗ qwen-3-235b-a22b-instruct-2507 - 404 (Model does not exist or no access)
✗ zai-glm-4.7 - 404 (Model does not exist or no access)
```

### Issues Found:

1. **llama-3.3-70b** ❌
   - You used: `llama-3.3-70b`
   - **This model doesn't exist on Cerebras**
   - Cerebras only has `llama3.1-8b` (not 3.3 70B)
   - Llama 3.3 70B is available on Groq and OpenRouter, but NOT Cerebras

2. **qwen-3-235b-a22b-instruct-2507** ⚠️
   - Model ID is correct
   - But it's a **PREVIEW model** - may require special access
   - Not recommended for production use
   - May be discontinued with short notice

3. **zai-glm-4.7** ⚠️
   - Model ID is correct
   - But it's a **PREVIEW model** - may require special access
   - Not recommended for production use
   - May be discontinued with short notice

---

## 📋 Recommended Cerebras Models for ConstructLM

### Use Only Production Models:

```json
{
  "provider": "cerebras",
  "apiKeyEnv": "VITE_CEREBRAS_API_KEY",
  "models": [
    {
      "id": "llama3.1-8b",
      "name": "Llama 3.1 8B • Cerebras",
      "context": 8192,
      "speed": "~2,200 tokens/s",
      "parameters": "8B",
      "free": true,
      "status": "production",
      "description": "Ultra-fast 8B model, perfect for real-time chat"
    },
    {
      "id": "gpt-oss-120b",
      "name": "GPT OSS 120B • Cerebras",
      "context": 32768,
      "speed": "~3,000 tokens/s",
      "parameters": "120B",
      "free": true,
      "status": "production",
      "description": "Largest production model, reasoning support"
    }
  ]
}
```

### Optional: Add Preview Models (with warnings)

```json
{
  "id": "qwen-3-235b-a22b-instruct-2507",
  "name": "Qwen 3 235B • Cerebras (Preview)",
  "context": 20000,
  "speed": "~1,400 tokens/s",
  "parameters": "235B",
  "free": true,
  "status": "preview",
  "warning": "Preview model - may be discontinued",
  "description": "Alibaba's powerful model (evaluation only)"
},
{
  "id": "zai-glm-4.7",
  "name": "ZAI GLM 4.7 • Cerebras (Preview)",
  "context": 65000,
  "speed": "~1,000 tokens/s",
  "parameters": "355B",
  "free": true,
  "status": "preview",
  "warning": "Preview model - may be discontinued",
  "description": "Largest model with huge context (evaluation only)"
}
```

---

## 🎯 Recommendations

### For ConstructLM Production:

1. **Use only the 2 production models**:
   - `llama3.1-8b` - Fast, reliable, 8B parameters
   - `gpt-oss-120b` - Powerful, 120B parameters

2. **Remove from your list**:
   - `llama-3.3-70b` - Doesn't exist on Cerebras
   - Use Groq's `llama-3.3-70b-versatile` instead

3. **Preview models** (optional):
   - Add with clear "Preview" badge in UI
   - Show warning: "Evaluation only - may be discontinued"
   - Don't make them default options

---

## 🔄 Updated Test Script

```javascript
const CEREBRAS_MODELS = [
  // Production models (recommended)
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', status: 'production' },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B', status: 'production' },
  
  // Preview models (optional - may require special access)
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', status: 'preview' },
  { id: 'zai-glm-4.7', name: 'ZAI GLM 4.7', status: 'preview' }
];
```

---

## 📊 Comparison: Where to Get Llama 3.3 70B

Since Cerebras doesn't have Llama 3.3 70B, here's where you CAN get it:

| Provider | Model ID | Free | Speed | Context |
|----------|----------|------|-------|---------|
| **Groq** | `llama-3.3-70b-versatile` | ✅ Yes | Ultra-fast | 131K |
| **OpenRouter** | `meta-llama/llama-3.3-70b-instruct:free` | ✅ Yes | Fast | 131K |
| **Cerebras** | ❌ Not available | - | - | - |

---

## 💡 Summary

**What went wrong:**
- You tried to use `llama-3.3-70b` on Cerebras, but it doesn't exist there
- Preview models may require special API access or permissions

**What to do:**
1. Update Cerebras models to only use production models
2. For Llama 3.3 70B, use Groq or OpenRouter instead
3. Add OpenRouter for access to 24 free models including Llama 3.3 70B

**Final Cerebras lineup:**
- ✅ `llama3.1-8b` (8B, ultra-fast)
- ✅ `gpt-oss-120b` (120B, powerful)
- ⚠️ Preview models (optional, with warnings)

---

*Source: [Cerebras Inference Documentation](https://inference-docs.cerebras.ai/models/overview)*
