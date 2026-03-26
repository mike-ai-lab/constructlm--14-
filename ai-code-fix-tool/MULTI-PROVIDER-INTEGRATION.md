# Multi-Provider AI Integration

## Overview

AI Code Fix Pro V3 now supports **5 AI providers** with seamless switching and configuration.

## Supported Providers

| Provider | Models | Vision | Speed | Free Tier |
|----------|--------|--------|-------|-----------|
| **Groq** | Llama 3.3 70B, 3.1 8B, 3.2 Vision | ✅ Select | ⚡ Fast | ✅ Yes |
| **Gemini** | 2.0 Flash, 1.5 Flash, 1.5 Pro | ✅ All | 🔄 Medium | ✅ Yes |
| **Cerebras** | Llama 3.1 8B, 3.3 70B | ❌ No | ⚡⚡ Ultra-Fast | ✅ Yes |
| **OpenRouter** | GPT-4o Mini, Gemini, Llama, Phi-3 | ✅ Select | 🔄 Medium | ✅ 15+ models |
| **Ollama** | Local models | ❌ Local only | 🔄 Varies | ✅ Local |

## Features

### ✅ Implemented

- **Multi-provider support** - Switch between 5 AI providers
- **Settings modal** - Configure API keys and select models
- **Provider badge** - Shows current active provider
- **Model selection** - Choose specific models per provider
- **API key management** - Secure storage in localStorage + .env.local
- **Backward compatibility** - Existing Groq integration preserved
- **Service architecture** - Clean, modular provider services

### 🎯 Current Behavior

- **Streaming**: Uses current app's streaming approach (SSE parsing)
- **Error handling**: Matches existing error detection workflow
- **UI/UX**: Preserves all existing features (diff, chat, preview)
- **Prompt format**: Same code-fixing prompt for all providers

## Configuration

### 1. Environment Variables (.env.local)

```env
VITE_GROQ_API_KEY=gsk_...
VITE_GEMINI_API_KEY=AIza...
VITE_CEREBRAS_API_KEY=csk-...
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_OLLAMA_API_KEY=optional_for_cloud
```

### 2. Settings Modal

Click the **Settings** button (⚙️) in the header to:
- Select AI provider
- Choose model
- Configure API keys
- Set Ollama base URL (for local)

### 3. localStorage

Settings are persisted in localStorage:
- `selected_provider` - Current provider
- `selected_model` - Current model
- `{provider}_api_key` - API keys per provider
- `ollama_base_url` - Ollama endpoint

## Usage

### Basic Workflow

1. **Open Settings** → Click ⚙️ button
2. **Select Provider** → Choose from dropdown
3. **Select Model** → Pick specific model
4. **Add API Key** → Enter your key
5. **Save** → Keys stored securely
6. **Use AI Fix** → Works with selected provider

### Provider-Specific Notes

#### Groq
- **Best for**: Fast inference, default choice
- **Models**: Llama 3.3 70B (recommended), 3.1 8B (faster)
- **Get Key**: https://console.groq.com/keys

#### Gemini
- **Best for**: Large context (1M-2M tokens), vision
- **Models**: 2.0 Flash (recommended), 1.5 Pro (largest)
- **Get Key**: https://aistudio.google.com/app/apikey
- **Note**: Non-streaming (simulated chunks)

#### Cerebras
- **Best for**: Ultra-fast responses
- **Models**: Llama 3.3 70B (recommended), 3.1 8B
- **Get Key**: https://cloud.cerebras.ai/

#### OpenRouter
- **Best for**: Access to multiple free models
- **Models**: GPT-4o Mini, Gemini 2.0, Llama 3.2, Phi-3
- **Get Key**: https://openrouter.ai/keys

#### Ollama
- **Best for**: Local deployment, privacy
- **Models**: Any locally installed model
- **Setup**: Install Ollama, pull models
- **URL**: http://localhost:11434 (default)

## Architecture

### File Structure

```
src/js/
├── services/
│   ├── groqService.js       # Groq API integration
│   ├── geminiService.js     # Gemini API integration
│   ├── cerebrasService.js   # Cerebras API integration
│   ├── openrouterService.js # OpenRouter API integration
│   └── ollamaService.js     # Ollama API integration
├── aiService.js             # Main AI service (multi-provider)
├── state.js                 # State management (API keys)
├── settings.js              # Settings modal
└── app.js                   # Application initialization
```

### Service Pattern

Each provider service exports:

```javascript
// Model definitions
export const PROVIDER_MODELS = [
  { id: "model-id", name: "Model Name", context: "128K" }
];

// API call function
export async function callProviderAPI(prompt, apiKey, model) {
  // Returns fetch response
}

// Streaming handler
export async function handleStreamingResponse(
  response, 
  aiMessageBubble, 
  parseAIResponse, 
  formatAIResponse
) {
  // Handles streaming, returns full response
}
```

### State Management

```javascript
state = {
  selectedProvider: 'groq',
  selectedModel: 'llama-3.3-70b-versatile',
  apiKeys: {
    groq: '',
    gemini: '',
    cerebras: '',
    openrouter: '',
    ollama: ''
  },
  ollamaBaseUrl: 'http://localhost:11434'
}
```

## Security

### ✅ Best Practices

- API keys in **headers**, not URLs
- Keys stored in **localStorage** (client-side only)
- Server provides keys from **.env.local** (gitignored)
- No hardcoded credentials
- CORS configured for local development

### ⚠️ Important

- Never commit `.env.local` to git
- Don't share API keys publicly
- Use environment variables in production
- Keys only sent to respective provider APIs

## Testing

### Quick Test

1. Start server: `npm start`
2. Open http://localhost:8001
3. Click Settings → Add Groq API key
4. Paste code with errors
5. Click "Detect Errors"
6. Click "AI Fix"
7. Verify streaming response
8. Accept/reject diff

### Test Multiple Providers

1. Add API keys for multiple providers
2. Switch provider in Settings
3. Run AI Fix with each provider
4. Verify all work correctly

## Troubleshooting

### "API key not configured"
- Open Settings
- Add API key for selected provider
- Click Save

### "API error: 401"
- Check API key is correct
- Verify key has not expired
- Get new key from provider

### "No response body"
- Check internet connection
- Verify provider API is accessible
- Try different provider

### Ollama connection failed
- Ensure Ollama is running: `ollama serve`
- Check base URL is correct
- Verify model is installed: `ollama list`

## Future Enhancements

### Planned Features

- [ ] Advanced streaming (better chunk handling)
- [ ] Vision support (image upload for vision models)
- [ ] Model comparison (test multiple providers)
- [ ] Usage tracking (token counting)
- [ ] Rate limit handling (automatic retry)
- [ ] Provider health check (test connection)
- [ ] Custom system prompts per provider
- [ ] Response caching

### Streaming Improvements

Current implementation uses provider-specific streaming. Future version will implement:
- Unified streaming interface
- Better buffer management
- Chunk size optimization
- Progress indicators
- Cancellation support

## Migration Guide

### From Single Provider (Groq)

No changes needed! The app:
- ✅ Defaults to Groq
- ✅ Uses existing API key from .env.local
- ✅ Preserves all existing functionality
- ✅ Backward compatible

### Adding New Providers

To add a new provider:

1. Create `src/js/services/newProviderService.js`
2. Export `PROVIDER_MODELS`, `callProviderAPI`, `handleStreamingResponse`
3. Import in `src/js/aiService.js`
4. Add case in `startAIFix()` switch statement
5. Add case in `getProviderService()` function
6. Add case in `getAvailableModels()` function
7. Update Settings modal HTML
8. Add API key to state.js
9. Update server.js to provide key

## Support

### Get API Keys

- **Groq**: https://console.groq.com/keys
- **Gemini**: https://aistudio.google.com/app/apikey
- **Cerebras**: https://cloud.cerebras.ai/
- **OpenRouter**: https://openrouter.ai/keys
- **Ollama**: https://ollama.com/download

### Documentation

- **Reference Guide**: AI_INTEGRATION_REFERENCE_GUIDE.md
- **Product Overview**: See steering rules (product.md)
- **Architecture**: See steering rules (structure.md)

---

**Version**: 1.0  
**Date**: 2026-03-26  
**Status**: Production Ready ✅
