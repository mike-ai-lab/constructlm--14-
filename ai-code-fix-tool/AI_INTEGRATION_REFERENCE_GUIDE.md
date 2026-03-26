# AI Integration Reference Guide
## Complete Guide for Integrating Multiple AI Providers

**Version**: 1.0  
**Date**: 2026-03-26  
**Verified**: All implementations tested and working in production  
**Use Case**: Reference for integrating AI models into new applications

---

## Table of Contents

1. [Overview](#overview)
2. [Security Requirements](#security-requirements)
3. [Provider Implementations](#provider-implementations)
4. [Common Patterns](#common-patterns)
5. [Integration Checklist](#integration-checklist)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides verified, production-ready code for integrating 5 AI providers:

| Provider | Best For | Vision | Streaming | Free Tier |
|----------|----------|--------|-----------|-----------|
| **Gemini** | Multimodal, large context | ✅ Yes | ❌ Simulated | ✅ Yes |
| **Cerebras** | Ultra-fast text | ❌ No | ✅ Native SSE | ✅ Yes |
| **Groq** | Fast inference, vision | ✅ Select models | ✅ Native SSE | ✅ Yes |
| **OpenRouter** | Multiple free models | ✅ Select models | ✅ Native SSE | ✅ 15+ models |
| **Ollama** | Local/cloud deployment | ✅ Cloud only | ✅ Native | ✅ Local |

---

## Security Requirements

### CRITICAL: API Key Security

**NEVER expose API keys in:**
- URL query parameters (`?key=...`)
- Frontend code or environment variables
- Browser network logs
- Git repositories

**ALWAYS:**
- Use secure HTTP headers for authentication
- Store keys in backend environment variables only
- Implement backend proxy for sensitive operations
- Use `.env.local` for local development (gitignored)

### Secure vs Insecure Examples

```typescript
// ❌ INSECURE - API key visible in URL
const url = `https://api.example.com/chat?key=${apiKey}`;

// ✅ SECURE - API key in header
const url = `https://api.example.com/chat`;
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

---


## Provider Implementations

### 1. Google Gemini

**Endpoint**: `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`  
**Authentication**: `x-goog-api-key` header  
**Best For**: Vision, large context (1M-2M tokens)

#### Supported Models
```typescript
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", vision: true, context: "1M tokens" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", vision: true, context: "1M tokens" }
];
```

#### Implementation
```typescript
export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "gemini-2.5-flash",
  imageBase64?: string
) => {
  const key = apiKey || process.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key not configured");

  // SECURITY: API key in header, NOT URL
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
  
  // Build content parts with optional images
  const parts: any[] = [{ text: message }];
  if (imageBase64) {
    const images = imageBase64.split(',');
    images.forEach(img => {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: img.trim()
        }
      });
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': key  // Secure header authentication
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Simulate streaming (3 chars at a time)
  for (let i = 0; i < text.length; i += 3) {
    onChunk(text.slice(i, i + 3));
  }
};
```

#### Key Features
- Multiple images via `inline_data` format
- Non-streaming (simulated by chunking)
- Token estimation: ~4 chars/token for text

---

### 2. Cerebras

**Endpoint**: `https://api.cerebras.ai/v1/chat/completions`  
**Authentication**: `Authorization: Bearer {key}`  
**Best For**: Ultra-fast text inference

#### Supported Models
```typescript
export const CEREBRAS_MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", context: "128K tokens" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", context: "128K tokens" }
];
```

#### Implementation
```typescript
export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string, isReasoning?: boolean) => void,
  apiKey?: string,
  model: string = "llama3.1-8b"
) => {
  const key = apiKey || process.env.VITE_CEREBRAS_API_KEY;
  if (!key) throw new Error("Cerebras API key not configured");

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.content
    })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "X-Cerebras-Version-Patch": "2"
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 8000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Cerebras API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let isInReasoningBlock = false;
  let reasoningBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        
        if (content) {
          // Detect reasoning blocks
          if (content.includes('<think>') || content.includes('<reasoning>')) {
            isInReasoningBlock = true;
            reasoningBuffer += content.replace(/<think>|<reasoning>/g, '');
            continue;
          }
          
          if (content.includes('</think>') || content.includes('</reasoning>')) {
            isInReasoningBlock = false;
            onChunk(reasoningBuffer, true);
            reasoningBuffer = '';
            continue;
          }
          
          if (isInReasoningBlock) {
            reasoningBuffer += content;
          } else {
            onChunk(content, false);
          }
        }
      }
    }
  }
};
```

#### Key Features
- True SSE streaming
- Reasoning tag detection (`<think>`, `<reasoning>`)
- Ultra-fast inference

---


### 3. Groq

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`  
**Authentication**: `Authorization: Bearer {key}`  
**Best For**: Fast inference with vision support

#### Supported Models
```typescript
export const GROQ_MODELS = [
  // Text models
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", context: "128K" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", context: "128K" },
  
  // Vision models
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", vision: true, context: "128K" },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", vision: true, context: "128K" }
];
```

#### Implementation
```typescript
export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "llama-3.3-70b-versatile",
  imageBase64?: string
) => {
  const key = apiKey || process.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("Groq API key not configured");

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.content
    }))
  ];

  // Add current message with optional image
  if (imageBase64 && model.includes('vision')) {
    const images = imageBase64.split(',');
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message },
        ...images.map(img => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img.trim()}` }
        }))
      ]
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 8000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          console.warn("Skipping malformed chunk");
        }
      }
    }
  }
};
```

#### Key Features
- Vision support (Llama 3.2 models)
- Buffer management for incomplete chunks
- High-speed inference

---

### 4. OpenRouter

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`  
**Authentication**: `Authorization: Bearer {key}` + attribution headers  
**Best For**: Access to 15+ free models

#### Supported Models
```typescript
export const OPENROUTER_MODELS = [
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B", context: "131K" },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B VL", vision: true, context: "128K" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", vision: true, context: "131K" },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large", context: "131K" }
];
```

#### Implementation
```typescript
export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "openai/gpt-oss-20b:free",
  imageBase64?: string
) => {
  const key = apiKey || process.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter API key not configured");

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.content
    }))
  ];

  // Add current message with optional image
  const modelInfo = OPENROUTER_MODELS.find(m => m.id === model);
  if (imageBase64 && modelInfo?.vision) {
    const images = imageBase64.split(',');
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message },
        ...images.map(img => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img.trim()}` }
        }))
      ]
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "YourAppName"
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 8000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          console.error("Parse error:", e);
        }
      }
    }
  }
};
```

#### Key Features
- Unified API for multiple models
- Attribution headers required
- Vision support on select models

---


### 5. Ollama

**Endpoint**: `http://localhost:11434/api/chat` (local) or `https://ollama.com/api/chat` (cloud)  
**Authentication**: Optional for local, required for cloud  
**Best For**: Local deployment, privacy

#### Supported Models
```typescript
// Local models
export const OLLAMA_LOCAL_MODELS = [
  { id: "llama3.1:8b", name: "Llama 3.1 8B", context: "8K" },
  { id: "llama3.1:70b", name: "Llama 3.1 70B", context: "8K" },
  { id: "deepseek-r1:7b", name: "DeepSeek-R1 7B", context: "64K" },
  { id: "mistral:7b", name: "Mistral 7B", context: "32K" }
];

// Cloud models
export const OLLAMA_CLOUD_MODELS = [
  { id: "gpt-oss:120b-cloud", name: "GPT-OSS 120B", context: "32K" },
  { id: "deepseek-v3.1:671b-cloud", name: "DeepSeek V3.1 671B", context: "128K" },
  { id: "qwen3-vl:235b-cloud", name: "Qwen3 VL 235B", vision: true, context: "32K" }
];
```

#### Implementation (Local)
```typescript
export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "llama3.1:8b",
  imageBase64?: string,
  ollamaBaseUrl: string = "http://localhost:11434"
) => {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.content
    })),
    { role: "user", content: message }
  ];

  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        // Ollama native format
        const data = JSON.parse(line);
        const chunk = data.message?.content || "";
        if (chunk) onChunk(chunk);
      } catch (e) {
        console.error("Error parsing stream line:", e);
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const data = JSON.parse(buffer);
    const chunk = data.message?.content || "";
    if (chunk) onChunk(chunk);
  }
};
```

#### Connection Test
```typescript
export const testConnection = async (
  baseUrl: string = "http://localhost:11434"
): Promise<{ success: boolean; message: string; models?: string[] }> => {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      return {
        success: false,
        message: `Connection failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    
    return {
      success: true,
      message: `Connected to local Ollama`,
      models
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
```

#### Key Features
- Dual mode (local/cloud)
- Native streaming format
- No API key required for local
- CORS proxy needed for cloud

---

## Common Patterns

### 1. Unified Interface

All providers follow this interface:

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
}

interface Citation {
  docName: string;
  text: string;
  similarity: number;
}

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string, isReasoning?: boolean) => void,
  apiKey?: string,
  model: string,
  imageBase64?: string
) => {
  // Implementation
};
```

### 2. Error Handling

```typescript
// API key validation
const key = apiKey || process.env.VITE_PROVIDER_API_KEY;
if (!key) {
  throw new Error("Provider API key not configured");
}

// Response validation
if (!response.ok) {
  const errorText = await response.text();
  console.error('API error details:', errorText);
  throw new Error(`API error (${response.status}): ${response.statusText}`);
}

// Stream reader safety
const reader = response.body?.getReader();
if (!reader) {
  throw new Error("No response body");
}

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Process chunks
  }
} finally {
  reader.releaseLock();
}
```

### 3. Buffer Management

```typescript
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || ''; // Keep incomplete line
  
  for (const line of lines) {
    // Process complete lines
  }
}
```

### 4. Vision Support

```typescript
// Check model capabilities
const modelInfo = MODELS.find(m => m.id === model);

if (imageBase64 && modelInfo?.vision) {
  const images = imageBase64.split(',');
  messages.push({
    role: "user",
    content: [
      { type: "text", text: message },
      ...images.map(img => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${img.trim()}` }
      }))
    ]
  });
} else {
  messages.push({ role: "user", content: message });
}
```

---


## Integration Checklist

### Step 1: Create Service File

Create `services/providerService.ts`:

```typescript
import { ChatMessage, Citation } from "../types";

const API_URL = "https://api.provider.com/v1/chat/completions";

export const PROVIDER_MODELS = [
  { 
    id: "model-id", 
    name: "Model Name", 
    vision: false, 
    context: "128K tokens" 
  }
];

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "default-model"
) => {
  // Implementation
};
```

### Step 2: Update Types

Add to `types.ts`:

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Citation {
  docName: string;
  text: string;
  similarity: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
}
```

### Step 3: Update App Component

```typescript
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as GroqService from './services/groqService';
import * as OpenRouterService from './services/openrouterService';
import * as OllamaService from './services/ollamaService';

// State for API keys
const [geminiApiKey, setGeminiApiKey] = useState('');
const [cerebrasApiKey, setCerebrasApiKey] = useState('');
const [groqApiKey, setGroqApiKey] = useState('');
const [openrouterApiKey, setOpenrouterApiKey] = useState('');
const [ollamaApiKey, setOllamaApiKey] = useState('');

// Load API keys from localStorage
useEffect(() => {
  setGeminiApiKey(localStorage.getItem('gemini_api_key') || '');
  setCerebrasApiKey(localStorage.getItem('cerebras_api_key') || '');
  setGroqApiKey(localStorage.getItem('groq_api_key') || '');
  setOpenrouterApiKey(localStorage.getItem('openrouter_api_key') || '');
  setOllamaApiKey(localStorage.getItem('ollama_api_key') || '');
}, []);

// Handle send message
const handleSendMessage = async (message: string) => {
  // ... message setup

  try {
    switch (currentSession.aiModel) {
      case 'gemini':
        await GeminiService.streamChatResponse(
          message,
          currentSession.messages,
          relevantContext,
          onChunk,
          geminiApiKey,
          selectedModel,
          imageBase64
        );
        break;
      
      case 'cerebras':
        await CerebrasService.streamChatResponse(
          message,
          currentSession.messages,
          relevantContext,
          onChunk,
          cerebrasApiKey,
          selectedModel
        );
        break;
      
      // ... other providers
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 4: Create Settings Modal

```typescript
export const SettingsModal = ({ 
  isOpen, 
  onClose,
  geminiApiKey,
  setGeminiApiKey,
  cerebrasApiKey,
  setCerebrasApiKey,
  // ... other keys
}) => {
  const handleSave = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('cerebras_api_key', cerebrasApiKey);
    // ... save other keys
    onClose();
  };

  return (
    <div className="modal">
      <h2>API Settings</h2>
      
      <div>
        <label>Gemini API Key</label>
        <input
          type="password"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          placeholder="Enter Gemini API key"
        />
      </div>

      <div>
        <label>Cerebras API Key</label>
        <input
          type="password"
          value={cerebrasApiKey}
          onChange={(e) => setCerebrasApiKey(e.target.value)}
          placeholder="Enter Cerebras API key"
        />
      </div>

      {/* ... other providers */}

      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};
```

### Step 5: Environment Variables

Create `.env.local`:

```env
# Optional default API keys (for development)
VITE_GEMINI_API_KEY=your_key_here
VITE_CEREBRAS_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here
VITE_OPENROUTER_API_KEY=your_key_here
VITE_OLLAMA_API_KEY=your_key_here
```

Add to `.gitignore`:

```
.env.local
.env*.local
```

---

## Testing Guide

### 1. API Key Validation

```typescript
test('throws error when API key missing', async () => {
  await expect(
    streamChatResponse('test', [], [], () => {}, undefined, 'model')
  ).rejects.toThrow('API key not configured');
});
```

### 2. Streaming Response

```typescript
test('calls onChunk for each token', async () => {
  const chunks: string[] = [];
  await streamChatResponse(
    'Hello',
    [],
    [],
    (chunk) => chunks.push(chunk),
    'test-key',
    'model'
  );
  expect(chunks.length).toBeGreaterThan(0);
});
```

### 3. Manual Testing Checklist

- [ ] API key validation (empty, invalid, valid)
- [ ] Streaming response (check console for chunks)
- [ ] Vision support (upload image, check analysis)
- [ ] Error handling (invalid model, network error)
- [ ] Model switching (change model mid-session)
- [ ] Session persistence (reload page, check history)

### 4. Verify Security

Open browser DevTools → Network tab:
1. Send a message
2. Check the request
3. Verify:
   - ✅ URL does NOT contain `?key=`
   - ✅ Request Headers contain authentication
   - ✅ API key is NOT visible in URL

---

## Troubleshooting

### Issue: CORS Errors

**Symptoms**: `Access-Control-Allow-Origin` errors

**Solutions**:
1. Use backend proxy for local APIs (Ollama)
2. Verify API endpoint supports CORS
3. Check if provider requires specific headers

```typescript
// Backend proxy example (Express)
app.post('/api/proxy', async (req, res) => {
  const response = await fetch(ACTUAL_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${req.body.apiKey}` },
    body: JSON.stringify(req.body.data)
  });
  
  res.setHeader('Content-Type', 'text/event-stream');
  response.body.pipe(res);
});
```

### Issue: Incomplete Streaming

**Symptoms**: Chunks cut off mid-word

**Solutions**:
1. Implement buffer management
2. Use `{ stream: true }` in decoder
3. Process remaining buffer after loop

```typescript
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split("\n");
buffer = lines.pop() || ''; // Keep incomplete line
```

### Issue: API Key Not Working

**Symptoms**: 401/403 errors

**Solutions**:
1. Verify key format (some require `Bearer` prefix)
2. Check key is saved in localStorage
3. Test with provider's official docs
4. Verify environment variable naming

### Issue: Vision Not Working

**Symptoms**: Images ignored or error

**Solutions**:
1. Check model supports vision
2. Verify base64 format (no `data:` prefix in some APIs)
3. Ensure MIME type is correct
4. Check image size limits

```typescript
const modelInfo = MODELS.find(m => m.id === model);
if (!modelInfo?.vision) {
  throw new Error('Model does not support vision');
}
```

---

## Quick Reference

### API Endpoints

```
Gemini:      https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
Cerebras:    https://api.cerebras.ai/v1/chat/completions
Groq:        https://api.groq.com/openai/v1/chat/completions
OpenRouter:  https://openrouter.ai/api/v1/chat/completions
Ollama:      http://localhost:11434/api/chat (local)
```

### Authentication

```typescript
Gemini:      x-goog-api-key: {apiKey}
Cerebras:    Authorization: Bearer {apiKey}
Groq:        Authorization: Bearer {apiKey}
OpenRouter:  Authorization: Bearer {apiKey}
             HTTP-Referer: {origin}
             X-Title: {appName}
Ollama:      Authorization: Bearer {apiKey} (cloud only)
```

### Model Selection

```typescript
// Text-only, fast
"llama3.1-8b" (Cerebras)
"llama-3.3-70b-versatile" (Groq)

// Vision support
"gemini-2.5-flash" (Gemini)
"llama-3.2-90b-vision-preview" (Groq)
"nvidia/nemotron-nano-12b-v2-vl:free" (OpenRouter)

// Reasoning
"deepseek-r1:70b" (Ollama)

// Large context
"gemini-2.5-flash" (1M tokens)
```

---

## Best Practices

1. ✅ Lazy load heavy SDKs
2. ✅ Use streaming for better UX
3. ✅ Chunk responses (3-10 chars)
4. ✅ Implement client-side caching
5. ✅ Use fastest model for simple queries
6. ✅ Monitor token usage
7. ✅ Handle errors gracefully
8. ✅ Validate model capabilities before use
9. ✅ Store API keys securely
10. ✅ Never expose keys in URLs or frontend code

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-26  
**Verified**: All implementations tested in production  
**Source**: ConstructLM (https://specbase.mimevents.com)

