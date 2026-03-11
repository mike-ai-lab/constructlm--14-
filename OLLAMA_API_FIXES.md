# Ollama API Configuration - Fixed

## Issue
The initial Ollama integration used incorrect API endpoints that resulted in connection failures:
- ❌ Cloud: `https://api.ollama.ai/v1/models` (incorrect domain)
- ❌ Cloud: `https://api.ollama.ai/v1/chat/completions` (incorrect format)

## Solution
Updated to use the official Ollama API endpoints from [docs.ollama.com](https://docs.ollama.com/api):

### Correct Endpoints

**Local Ollama (Native Format)**
```
Base URL: http://localhost:11434 (default)
Chat Endpoint: POST /api/chat
Tags Endpoint: GET /api/tags
```

**Cloud Ollama (Same Native Format)**
```
Base URL: https://ollama.com/api
Chat Endpoint: POST /chat
Tags Endpoint: GET /tags
```

## Key Changes

### 1. **services/ollamaService.ts**
- Changed cloud chat endpoint from `https://api.ollama.ai/v1/chat/completions` to `https://ollama.com/api/chat`
- Changed cloud tags endpoint from `https://api.ollama.ai/v1/models` to `https://ollama.com/api/tags`
- Unified streaming format: Both local and cloud use the same native Ollama format (not OpenAI-compatible)
- Removed OpenAI-compatible format parsing (was causing errors)

### 2. **components/SettingsModal.tsx**
- Updated cloud connection test endpoint to `https://ollama.com/api/tags`
- Updated documentation link to `https://ollama.com/blog/ollama-cloud`
- Maintained local endpoint: `{baseUrl}/api/tags`

## API Format

Both local and cloud Ollama use the same streaming format:

```json
{
  "model": "llama2",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true,
  "temperature": 0.7
}
```

Response format (streaming):
```json
{
  "model": "llama2",
  "created_at": "2024-01-01T00:00:00Z",
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help?"
  },
  "done": false
}
```

## Authentication

**Local Ollama**: No authentication required

**Cloud Ollama**: Bearer token in Authorization header
```
Authorization: Bearer {api_key}
```

## Testing Connection

The TEST button in Settings now correctly:
1. **Local Mode**: Connects to `http://localhost:11434/api/tags` (or custom URL)
2. **Cloud Mode**: Connects to `https://ollama.com/api/tags` with Bearer token

## Documentation References

- Official Ollama API: https://docs.ollama.com/api
- Ollama Cloud: https://ollama.com/blog/ollama-cloud
- Installation: https://ollama.ai

## Files Modified

1. `services/ollamaService.ts` - API endpoints and streaming logic
2. `components/SettingsModal.tsx` - Connection test and documentation links

## Status

✅ All endpoints corrected
✅ Streaming format unified
✅ Connection testing fixed
✅ Documentation links updated
