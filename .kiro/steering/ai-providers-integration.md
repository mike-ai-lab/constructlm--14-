---
inclusion: always
---

## 🔒 API SECURITY RULE (MANDATORY)

1. NEVER place API keys in frontend code (React, HTML, client JS).
2. NEVER expose API keys in:
   - URL query (?key=...)
   - Headers (Authorization, x-api-key)
   - Env variables prefixed with VITE_, NEXT_PUBLIC_, etc.

3. ALL external API calls requiring secrets MUST go through backend.

4. Required architecture:
   Frontend → Internal API (/api/*) → External Service

5. Backend rules:
   - Store keys in server environment variables ONLY
   - Example: process.env.GEMINI_API_KEY
   - Never log or return API keys

6. Frontend rules:
   - Only call internal endpoints:
     fetch('/api/generate', {...})

7. If any API key is detected in frontend code:
   → BLOCK execution
   → THROW error: "SECURITY VIOLATION: API key exposure"

8. Refuse any implementation that:
   - Calls external paid APIs directly from frontend
   - Embeds keys in code, even temporarily

9. Exception:
   - Public APIs with NO key required (e.g. Open-Meteo)

10. Always prefer:
   - Server-side proxy
   - Rate limiting
   - Input validation

ENFORCEMENT: STRICT — NO OVERRIDES

# AI Provider Integration Guide

Complete reference for integrating multiple AI providers with streaming support, RAG context, and vision capabilities.

## Overview

This guide documents the integration patterns used in ConstructLM for five AI providers:
- **Gemini**: Google's multimodal models with vision support
- **Cerebras**: Ultra-fast inference for text-only queries
- **Groq**: High-speed inference with vision models
- **OpenRouter**: Unified API for multiple free models
- **Ollama**: Local and cloud deployment options

## Common Architecture Pattern

All AI services follow a consistent interface:

```typescript
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

### Parameters
- `message`: Current user query
- `history`: Previous chat messages for context
- `context`: RAG citations from vector search
- `onChunk`: Callback for streaming tokens
- `apiKey`: Provider API key (optional, falls back to env)
- `model`: Model identifier
- `imageBase64`: Base64-encoded images (comma-separated for multiple)


## 1. Google Gemini Integration

### API Details
- **Endpoint**: `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`
- **Authentication**: API key in `x-goog-api-key` header (SECURE - never in URL)
- **Library**: `@google/genai` (lazy loaded)
- **Protocol**: REST API with JSON response

### Supported Models
```typescript
{ id: "gemini-flash-latest", vision: true, context: "1M tokens" }
{ id: "gemini-2.5-flash", vision: true, context: "1M tokens" }
{ id: "gemini-2.5-flash-lite", vision: true, context: "1M tokens" }
```

### Key Features
- **Vision support**: Multiple images via `inline_data` format
- **Non-streaming**: Simulates streaming by chunking response
- **Token estimation**: ~4 chars/token for text, ~258 tokens/KB for images

### Implementation Pattern
```typescript
// Lazy load SDK to avoid initialization errors
let GoogleGenAI: any = null;
const loadGoogleGenAI = async () => {
  if (!GoogleGenAI) {
    const module = await import("@google/genai");
    GoogleGenAI = module.GoogleGenAI;
  }
  return GoogleGenAI;
};

// SECURITY: Use header-based authentication (never expose key in URL)
const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

// Build content parts with images
const parts: any[] = [{ text: systemInstruction + "\n\n" + fullPrompt }];
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

const requestBody = {
  contents: [{ parts }],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 8192,
  }
};

const response = await fetch(url, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-goog-api-key': key  // API key in secure header
  },
  body: JSON.stringify(requestBody)
});
```

### Response Handling
```typescript
const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

// Simulate streaming (3 chars at a time)
for (let i = 0; i < text.length; i += 3) {
  onChunk(text.slice(i, i + 3));
}
```


## 2. Cerebras Integration

### API Details
- **Endpoint**: `https://api.cerebras.ai/v1/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Protocol**: OpenAI-compatible streaming API
- **Version**: API v2 (X-Cerebras-Version-Patch: 2)

### Supported Models
```typescript
{ id: "llama3.1-8b", context: "128K tokens", reasoning: false }
{ id: "llama-3.3-70b", context: "128K tokens", reasoning: false }
```

### Key Features
- **Ultra-fast inference**: Optimized for speed
- **Text-only**: No vision support
- **Reasoning detection**: Parses `<think>` and `<reasoning>` tags
- **True streaming**: Server-Sent Events (SSE)

### Implementation Pattern
```typescript
const response = await fetch(CEREBRAS_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
    "X-Cerebras-Version-Patch": "2"
  },
  body: JSON.stringify({
    model: model,
    messages,
    stream: true,
    max_tokens: 8000,
    temperature: 0.7
  })
});
```

### Streaming Parser
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

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
          onChunk(reasoningBuffer, true); // Send as reasoning
          reasoningBuffer = '';
          continue;
        }
        
        if (isInReasoningBlock) {
          reasoningBuffer += content;
        } else {
          onChunk(content, false); // Regular content
        }
      }
    }
  }
}
```


## 3. Groq Integration

### API Details
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Protocol**: OpenAI-compatible streaming API

### Supported Models

**Chat Completion Models (10):**
```typescript
{ id: "llama-3.3-70b-versatile", context: "128K", tags: ["TEXT", "VERSATILE"] }
{ id: "llama-3.1-8b-instant", context: "128K", tags: ["TEXT", "FAST"] }
{ id: "meta-llama/llama-4-scout-17b-16e-instruct", context: "16K", tags: ["TEXT", "ADVANCED"] }
{ id: "qwen/qwen3-32b", context: "32K", tags: ["TEXT", "REASONING"] }
{ id: "openai/gpt-oss-120b", context: "128K", tags: ["TEXT", "LARGE"] }
{ id: "openai/gpt-oss-20b", context: "128K", tags: ["TEXT", "GENERAL"] }
{ id: "moonshotai/kimi-k2-instruct", context: "128K", tags: ["TEXT", "INSTRUCT"] }
{ id: "moonshotai/kimi-k2-instruct-0905", context: "128K", tags: ["TEXT", "INSTRUCT"] }
{ id: "groq/compound", context: "128K", tags: ["TEXT", "COMPOUND"] }
{ id: "groq/compound-mini", context: "128K", tags: ["TEXT", "COMPACT"] }
```

**Vision Models (2):**
```typescript
{ id: "llama-3.2-90b-vision-preview", vision: true, context: "128K", tags: ["VISION", "MULTIMODAL"] }
{ id: "llama-3.2-11b-vision-preview", vision: true, context: "128K", tags: ["VISION", "MULTIMODAL"] }
```

**Safety & Moderation Models (4):**
```typescript
{ id: "meta-llama/llama-guard-4-12b", context: "8K", tags: ["SAFETY", "MODERATION"] }
{ id: "meta-llama/llama-prompt-guard-2-22m", context: "8K", tags: ["SAFETY", "GUARD"] }
{ id: "meta-llama/llama-prompt-guard-2-86m", context: "8K", tags: ["SAFETY", "GUARD"] }
{ id: "openai/gpt-oss-safeguard-20b", context: "128K", tags: ["SAFETY", "MODERATION"] }
```

**Speech-to-Text Models (2 - for future implementation):**
```typescript
{ id: "whisper-large-v3", tags: ["SPEECH", "TRANSCRIPTION"], speechToText: true }
{ id: "whisper-large-v3-turbo", tags: ["SPEECH", "TRANSCRIPTION", "FAST"], speechToText: true }
```

### Key Features
- **High-speed inference**: Optimized for low latency
- **Vision models**: Llama 3.2 90B/11B support images
- **Buffer management**: Handles incomplete SSE chunks

### Vision Implementation
```typescript
// Check if model supports vision
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
```

### Streaming with Buffer
```typescript
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
```


## 4. OpenRouter Integration

### API Details
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Authentication**: Bearer token in Authorization header
- **Protocol**: OpenAI-compatible streaming API
- **Additional Headers**: HTTP-Referer, X-Title (for attribution)

### Supported Models (Free Tier)
```typescript
{ id: "openai/gpt-oss-20b:free", context: "131K", tags: ["GENERAL"] }
{ id: "liquid/lfm-2.5-1.2b-thinking:free", context: "32K", tags: ["REASONING"] }
{ id: "nvidia/nemotron-nano-12b-v2-vl:free", vision: true, context: "128K" }
{ id: "google/gemma-3-27b-it:free", vision: true, context: "131K" }
{ id: "arcee-ai/trinity-large-preview:free", context: "131K", tags: ["REASONING"] }
```

### Key Features
- **Unified API**: Access to 15+ free models
- **Model diversity**: General, reasoning, vision, agents, compact
- **Attribution**: Requires referer and title headers

### Implementation Pattern
```typescript
const response = await fetch(OPENROUTER_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
    "HTTP-Referer": window.location.origin,
    "X-Title": "ConstructLM"
  },
  body: JSON.stringify({
    model,
    messages,
    stream: true,
    max_tokens: 8000,
    temperature: 0.7
  })
});
```

### Vision Support
```typescript
// Check model capabilities
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
}
```

### Model Registry Pattern
```typescript
export const OPENROUTER_MODELS = [
  { 
    id: "openai/gpt-oss-20b:free", 
    name: "GPT OSS 20B", 
    vision: false, 
    text: true, 
    multimodal: false, 
    context: "131K", 
    tags: ["TEXT", "GENERAL"] 
  },
  // ... more models
];
```


## 5. Ollama Integration

### API Details
- **Local Endpoint**: `http://localhost:11434/api/chat`
- **Cloud Endpoint**: `https://ollama.com/api/chat` (via proxy)
- **Authentication**: Optional for local, required for cloud
- **Protocol**: Native Ollama streaming format

### Supported Models

**Local Models:**
```typescript
{ id: "llama3.1:8b", context: "8K", tags: ["LOCAL", "TEXT"] }
{ id: "llama3.1:70b", context: "8K", tags: ["LOCAL", "TEXT"] }
{ id: "deepseek-r1:7b", context: "64K", tags: ["LOCAL", "REASONING"] }
{ id: "deepseek-r1:70b", context: "64K", tags: ["LOCAL", "REASONING"] }
{ id: "mistral:7b", context: "32K", tags: ["LOCAL", "TEXT"] }
{ id: "mixtral:8x7b", context: "32K", tags: ["LOCAL", "TEXT"] }
```

**Cloud Models:**
```typescript
{ id: "gpt-oss:120b-cloud", context: "32K", tags: ["CLOUD", "TEXT"] }
{ id: "deepseek-v3.1:671b-cloud", context: "128K", tags: ["CLOUD", "REASONING"] }
{ id: "qwen3-vl:235b-cloud", vision: true, context: "32K", tags: ["CLOUD", "VISION"] }
{ id: "glm-4.6:cloud", context: "128K", tags: ["CLOUD", "REASONING"] }
```

### Key Features
- **Dual mode**: Local and cloud deployment
- **CORS proxy**: Backend proxy for cloud API
- **Native format**: Different from OpenAI format
- **Connection testing**: Built-in connectivity check

### Local Implementation
```typescript
const apiUrl = `${ollamaBaseUrl}/api/chat`;

const requestBody = {
  model: model,
  messages,
  stream: true,
  temperature: 0.7,
};

const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody)
});
```

### Cloud Implementation (via Proxy)
```typescript
// Backend proxy to bypass CORS
const apiUrl = "http://localhost:3001/api/ollama-proxy";

const requestBody = {
  model: model,
  messages,
  stream: true,
  temperature: 0.7,
  apiKey: apiKey
};

const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody)
});
```

### Streaming Parser (Native Format)
```typescript
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
      if (chunk) {
        onChunk(chunk);
      }
    } catch (e) {
      console.error("Error parsing stream line:", line, e);
    }
  }
}

// Process remaining buffer
if (buffer.trim()) {
  const data = JSON.parse(buffer);
  const chunk = data.message?.content || "";
  if (chunk) onChunk(chunk);
}
```

### Connection Test Utility
```typescript
export const testConnection = async (
  baseUrl: string = "http://localhost:11434",
  isCloud: boolean = false,
  apiKey?: string
): Promise<{ success: boolean; message: string; models?: string[] }> => {
  try {
    const url = isCloud 
      ? "https://ollama.com/api/tags"
      : `${baseUrl}/api/tags`;

    const headers: Record<string, string> = {};
    if (isCloud && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return {
        success: false,
        message: `Connection failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    const models = isCloud 
      ? data.data?.map((m: any) => m.id) || []
      : data.models?.map((m: any) => m.name) || [];
    
    return {
      success: true,
      message: isCloud ? "Connected to Ollama Cloud" : `Connected to local Ollama`,
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


## RAG Context Integration

All providers receive RAG context in a standardized format:

### Context Formatting
```typescript
const contextString = context.map((c, i) => 
  `[SOURCE ${i + 1} - ${c.docName}]
${c.text}
[END SOURCE ${i + 1}]
---`
).join('\n');
```

### System Instruction Template
```typescript
const systemInstruction = `You are ConstructLM, an intelligent research assistant.

CRITICAL INSTRUCTIONS FOR CITATIONS:
1. You have been provided with ${context.length} SOURCES from DIFFERENT FILES below
2. Each source is clearly marked with [SOURCE N - filename]
3. You MUST review ALL sources before answering
4. When referencing information from sources, use this EXACT format:
   {{citation:filename|location|quote}}

CITATION FORMAT SPECIFICATION:
- filename: The exact document name (e.g., "Market Pricing Survey.pdf")
- location: Page number or section (e.g., "Page 3", "Section 2.1")
- quote: The exact text from the source (keep concise, max 100 chars)

EXAMPLES OF CORRECT FORMAT:
✅ "The supplier is {{citation:Market Pricing Survey.pdf|Page 3|AlSarif Group (Riyadh)}}"
✅ "The unit is {{citation:pricing.pdf|Section 2|Terrazzo Tile, 30×30×3 cm}}"

CITATION RULES:
- Always include page/section number
- Always include exact quote from source
- Use filename exactly as provided in sources
- One citation per fact
- No nested citations

Keep responses professional, objective, and concise.

Context Information:
${contextString}`;
```

### Message History Formatting
```typescript
const messages = [
  { role: "system", content: systemInstruction },
  ...history
    .filter(h => !h.isStreaming)
    .map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.content
    })),
  { role: "user", content: message }
];
```


## Canvas Component Generation

All providers include instructions for generating React components:

### Canvas System Prompt
```typescript
CANVAS COMPONENT GENERATION:
When users ask for UI components, layouts, dashboards, or pages, generate React components for immediate Canvas rendering.

DO NOT INCLUDE:
- ❌ "Create a new React project" or "Save this as..."
- ❌ "Run npm install" or setup instructions
- ❌ Folder structures or multiple files
- ❌ package.json or build instructions

REQUIRED FORMAT:
1. Single self-contained React component
2. Functional component with default export
3. Imports at top: React, hooks, Framer Motion, Wouter, Lucide React
4. Tailwind CSS for styling
5. Realistic content (not Lorem ipsum)
6. Responsive and production-ready

RESPONSE STRUCTURE:
Brief explanation → Single code block → Optional notes

EXAMPLE:
\`\`\`tsx
import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        {/* Component content */}
      </div>
    </div>
  );
}
\`\`\`

Canvas renders this immediately - no setup needed.
```


## Error Handling Patterns

### API Key Validation
```typescript
const key = apiKey || (import.meta as any).env?.VITE_PROVIDER_API_KEY;

if (!key) {
  throw new Error("Provider API key not configured");
}
```

### Response Validation
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('API error details:', errorText);
  throw new Error(`API error (${response.status}): ${response.statusText} - ${errorText}`);
}
```

### Stream Reader Safety
```typescript
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

### Parse Error Handling
```typescript
try {
  const parsed = JSON.parse(data);
  const content = parsed.choices?.[0]?.delta?.content;
  if (content) onChunk(content);
} catch (e) {
  console.warn("Skipping malformed chunk:", data.substring(0, 50));
}
```


## Provider Comparison Matrix

| Feature | Gemini | Cerebras | Groq | OpenRouter | Ollama |
|---------|--------|----------|------|------------|--------|
| **Vision Support** | ✅ All models | ❌ None | ✅ Llama 3.2 | ✅ Select models | ✅ Cloud only |
| **Streaming** | ❌ Simulated | ✅ Native SSE | ✅ Native SSE | ✅ Native SSE | ✅ Native |
| **Max Context** | 1M-2M tokens | 128K tokens | 128K tokens | 256K tokens | 128K tokens |
| **Reasoning** | ❌ No | ✅ Tag-based | ❌ No | ✅ Select models | ✅ DeepSeek-R1 |
| **Free Tier** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ 15+ models | ✅ Local |
| **Speed** | Medium | Ultra-fast | Very fast | Varies | Varies |
| **Setup** | API key | API key | API key | API key | Local install |
| **CORS** | ✅ Direct | ✅ Direct | ✅ Direct | ✅ Direct | ⚠️ Proxy needed |

## Token Estimation

### Text Tokens
```typescript
// ~4 characters per token (rough estimate)
const textTokens = Math.ceil(text.length / 4);
```

### Image Tokens
```typescript
// Gemini: ~258 tokens per KB
const imageBytes = imageBase64.length / 1.33; // Base64 to bytes
const imageTokens = Math.ceil((imageBytes / 1024) * 258);
```

### Combined Estimation
```typescript
export const estimateTokens = (text: string, imageBase64?: string): number => {
  const textTokens = Math.ceil(text.length / 4);
  const imageTokens = imageBase64 
    ? Math.ceil((imageBase64.length / 1.33) / 1024 * 258 / 1024) 
    : 0;
  return textTokens + imageTokens;
};
```


## Integration Checklist

When adding a new AI provider:

### 1. Create Service File
- [ ] Create `services/newProviderService.ts`
- [ ] Export model registry array
- [ ] Implement `streamChatResponse()` function
- [ ] Add error handling and validation
- [ ] Include token estimation if applicable

### 2. Define Models
```typescript
export const PROVIDER_MODELS = [
  { 
    id: "model-id", 
    name: "Display Name", 
    vision: boolean,
    text: boolean,
    multimodal: boolean,
    context: "128K tokens", 
    tags: ["TAG1", "TAG2"],
    reasoning: boolean // optional
  }
];
```

### 3. Update App.tsx
- [ ] Import service: `import * as NewProviderService from './services/newProviderService'`
- [ ] Add to provider type: `'gemini' | 'cerebras' | ... | 'newprovider'`
- [ ] Add state for API key
- [ ] Load/save API key from localStorage
- [ ] Add to model dropdown
- [ ] Add to `handleSendMessage` switch

### 4. Update SettingsModal
- [ ] Add API key input field
- [ ] Add to save handler
- [ ] Add connection test button (optional)

### 5. Update Types
```typescript
// types.ts
export interface ChatSession {
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama' | 'newprovider';
}
```

### 6. Test Integration
- [ ] API key validation
- [ ] Streaming response
- [ ] RAG context injection
- [ ] Vision support (if applicable)
- [ ] Error handling
- [ ] Model switching
- [ ] Session persistence


## Best Practices

### 1. Lazy Loading
Load heavy SDKs only when needed:
```typescript
let GoogleGenAI: any = null;
const loadGoogleGenAI = async () => {
  if (!GoogleGenAI) {
    const module = await import("@google/genai");
    GoogleGenAI = module.GoogleGenAI;
  }
  return GoogleGenAI;
};
```

### 2. Environment Variables
Support both runtime and build-time configuration:
```typescript
const key = apiKey || (import.meta as any).env?.VITE_PROVIDER_API_KEY;
```

### 3. Buffer Management
Handle incomplete SSE chunks properly:
```typescript
let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || ''; // Keep incomplete line
  
  // Process complete lines
}
```

### 4. Model Capability Checks
Validate features before use:
```typescript
const modelInfo = MODELS.find(m => m.id === model);
if (imageBase64 && !modelInfo?.vision) {
  console.warn('Model does not support vision');
  // Handle gracefully
}
```

### 5. Consistent Error Messages
Provide actionable error information:
```typescript
throw new Error(`${provider} API error (${response.status}): ${response.statusText}`);
```

### 6. Streaming Callback Pattern
Use optional parameters for extended features:
```typescript
onChunk: (text: string, isReasoning?: boolean) => void
```

### 7. CORS Handling
For local APIs, use backend proxy:
```typescript
// Frontend calls proxy
const response = await fetch('http://localhost:3001/api/proxy', {
  method: 'POST',
  body: JSON.stringify({ ...requestData, apiKey })
});

// Backend forwards to actual API
app.post('/api/proxy', async (req, res) => {
  const { apiKey, ...data } = req.body;
  const response = await fetch(ACTUAL_API_URL, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(data)
  });
  response.body.pipe(res);
});
```


## Complete Service Template

Use this template when creating a new provider service:

```typescript
import { ChatMessage, Citation } from "../types";

const API_URL = "https://api.provider.com/v1/chat/completions";

// Model registry
export const PROVIDER_MODELS = [
  { 
    id: "model-id", 
    name: "Model Name", 
    vision: false, 
    text: true, 
    context: "128K tokens", 
    tags: ["TEXT", "FAST"] 
  }
];

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string, isReasoning?: boolean) => void,
  apiKey?: string,
  model: string = "default-model",
  imageBase64?: string
) => {
  // 1. Validate API key
  const key = apiKey || (import.meta as any).env?.VITE_PROVIDER_API_KEY;
  if (!key) {
    throw new Error("Provider API key not configured");
  }

  // 2. Format RAG context
  const contextString = context.map((c, i) => 
    `[SOURCE ${i + 1} - ${c.docName}]\n${c.text}\n[END SOURCE ${i + 1}]\n---`
  ).join('\n');

  // 3. Build system instruction
  const systemInstruction = `You are ConstructLM, an intelligent assistant.

CRITICAL INSTRUCTIONS:
1. Review all ${context.length} sources provided
2. Use citation format: {{citation:filename|location|quote}}
3. Generate React components for Canvas when requested

Context Information:
${contextString}`;

  // 4. Build messages array
  const messages = [
    { role: "system", content: systemInstruction },
    ...history
      .filter(h => !h.isStreaming)
      .map(h => ({
        role: h.role === "model" ? "assistant" : h.role,
        content: h.content
      })),
    { role: "user", content: message }
  ];

  // 5. Make API request
  const response = await fetch(API_URL, {
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

  // 6. Validate response
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider API error: ${errorText}`);
  }

  // 7. Stream response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch (e) {
            console.warn("Parse error:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

// Optional: Token estimation
export const estimateTokens = (text: string, imageBase64?: string): number => {
  const textTokens = Math.ceil(text.length / 4);
  const imageTokens = imageBase64 ? 500 : 0; // Adjust per provider
  return textTokens + imageTokens;
};
```


## Troubleshooting Guide

### Issue: CORS Errors
**Symptoms**: `Access-Control-Allow-Origin` errors in console

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
**Symptoms**: Chunks cut off mid-word, missing content

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

```typescript
// Debug API key
console.log('API Key present:', !!apiKey);
console.log('API Key length:', apiKey?.length);
```

### Issue: Vision Not Working
**Symptoms**: Images ignored or error

**Solutions**:
1. Check model supports vision
2. Verify base64 format (no `data:` prefix in some APIs)
3. Ensure MIME type is correct
4. Check image size limits

```typescript
// Validate vision support
const modelInfo = MODELS.find(m => m.id === model);
if (!modelInfo?.vision) {
  throw new Error('Model does not support vision');
}
```

### Issue: Slow Streaming
**Symptoms**: Delayed token delivery

**Solutions**:
1. Remove artificial delays
2. Increase chunk size (3-10 chars)
3. Check network latency
4. Verify provider's rate limits

```typescript
// Fast streaming (no delays)
for (let i = 0; i < text.length; i += 5) {
  onChunk(text.slice(i, i + 5));
}
```

### Issue: Parse Errors
**Symptoms**: JSON parse errors in console

**Solutions**:
1. Wrap JSON.parse in try-catch
2. Log malformed chunks for debugging
3. Handle `[DONE]` marker
4. Skip empty lines

```typescript
try {
  const parsed = JSON.parse(data);
  // Process
} catch (e) {
  console.warn("Skipping malformed chunk:", data.substring(0, 50));
}
```


## Testing Strategies

### 1. Unit Testing Service Functions
```typescript
// Test API key validation
test('throws error when API key missing', async () => {
  await expect(
    streamChatResponse('test', [], [], () => {}, undefined, 'model')
  ).rejects.toThrow('API key not configured');
});

// Test streaming callback
test('calls onChunk for each token', async () => {
  const chunks: string[] = [];
  await streamChatResponse(
    'test', 
    [], 
    [], 
    (chunk) => chunks.push(chunk),
    'test-key',
    'model'
  );
  expect(chunks.length).toBeGreaterThan(0);
});
```

### 2. Integration Testing
```typescript
// Test with real API (use test key)
test('streams response from API', async () => {
  const response: string[] = [];
  await streamChatResponse(
    'Hello',
    [],
    [],
    (chunk) => response.push(chunk),
    process.env.TEST_API_KEY,
    'test-model'
  );
  
  expect(response.join('')).toContain('Hello');
}, 30000); // 30s timeout
```

### 3. Manual Testing Checklist
- [ ] API key validation (empty, invalid, valid)
- [ ] Streaming response (check console for chunks)
- [ ] RAG context injection (verify sources in response)
- [ ] Vision support (upload image, check analysis)
- [ ] Error handling (invalid model, network error)
- [ ] Model switching (change model mid-session)
- [ ] Session persistence (reload page, check history)
- [ ] Token estimation (verify counts are reasonable)

### 4. Performance Testing
```typescript
// Measure streaming latency
const startTime = Date.now();
let firstChunkTime = 0;

await streamChatResponse(
  'test',
  [],
  [],
  (chunk) => {
    if (firstChunkTime === 0) {
      firstChunkTime = Date.now() - startTime;
      console.log('Time to first chunk:', firstChunkTime, 'ms');
    }
  },
  apiKey,
  model
);

const totalTime = Date.now() - startTime;
console.log('Total streaming time:', totalTime, 'ms');
```


## Security Considerations

### 1. API Key Storage
```typescript
// Store in localStorage (client-side only)
localStorage.setItem('provider_api_key', apiKey);

// Never log API keys
console.log('API Key:', apiKey.substring(0, 8) + '...');

// Clear on logout
const clearApiKeys = () => {
  localStorage.removeItem('gemini_api_key');
  localStorage.removeItem('cerebras_api_key');
  // ... other providers
};
```

### 2. Input Validation
```typescript
// Sanitize user input
const sanitizeMessage = (msg: string): string => {
  return msg.trim().substring(0, 10000); // Max length
};

// Validate model selection
const isValidModel = (model: string): boolean => {
  return PROVIDER_MODELS.some(m => m.id === model);
};
```

### 3. Rate Limiting
```typescript
// Client-side rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

const checkRateLimit = (): boolean => {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    throw new Error('Rate limit exceeded. Please wait.');
  }
  lastRequestTime = now;
  return true;
};
```

### 4. Content Filtering
```typescript
// Basic content validation
const validateContent = (text: string): boolean => {
  // Check for malicious patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(text));
};
```

### 5. HTTPS Enforcement
```typescript
// Ensure HTTPS in production
if (import.meta.env.PROD && window.location.protocol !== 'https:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}
```


## Advanced Features

### 1. Reasoning Model Support
Detect and display thinking process:

```typescript
let isInReasoningBlock = false;
let reasoningBuffer = '';

// Detect reasoning tags
if (content.includes('<think>') || content.includes('<reasoning>')) {
  isInReasoningBlock = true;
  reasoningBuffer += content.replace(/<think>|<reasoning>/g, '');
  return;
}

if (content.includes('</think>') || content.includes('</reasoning>')) {
  isInReasoningBlock = false;
  onChunk(reasoningBuffer, true); // isReasoning = true
  reasoningBuffer = '';
  return;
}

if (isInReasoningBlock) {
  reasoningBuffer += content;
} else {
  onChunk(content, false);
}
```

### 2. Multi-Image Support
Handle multiple images in single request:

```typescript
// Split comma-separated base64 strings
const images = imageBase64.split(',');

// Add to message content
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
```

### 3. Citation Validation
Validate and fix citation format:

```typescript
import { validateAndFixCitations } from "./citationValidator";

export const validateResponseCitations = (text: string): string => {
  const { text: fixedText, result } = validateAndFixCitations(text);
  
  if (result.fixedText) {
    console.warn('[Provider] Citations auto-fixed:', result.errors);
  }
  
  return fixedText;
};
```

### 4. Model Auto-Selection
Choose best model based on query:

```typescript
const selectOptimalModel = (
  query: string, 
  hasImages: boolean,
  needsReasoning: boolean
): string => {
  if (hasImages) {
    return MODELS.find(m => m.vision)?.id || MODELS[0].id;
  }
  
  if (needsReasoning) {
    return MODELS.find(m => m.reasoning)?.id || MODELS[0].id;
  }
  
  // Default to fastest model
  return MODELS.find(m => m.tags.includes('FAST'))?.id || MODELS[0].id;
};
```

### 5. Retry Logic
Handle transient failures:

```typescript
const streamWithRetry = async (
  maxRetries: number = 3,
  ...args: Parameters<typeof streamChatResponse>
): Promise<void> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await streamChatResponse(...args);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};
```


## Quick Reference

### API Endpoints
```
Gemini:      https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
Cerebras:    https://api.cerebras.ai/v1/chat/completions
Groq:        https://api.groq.com/openai/v1/chat/completions
OpenRouter:  https://openrouter.ai/api/v1/chat/completions
Ollama:      http://localhost:11434/api/chat (local)
             https://ollama.com/api/chat (cloud)
```

### Authentication Headers
```typescript
Gemini:      x-goog-api-key: {apiKey} (SECURE - in header, NOT URL)
Cerebras:    Authorization: Bearer {apiKey}
Groq:        Authorization: Bearer {apiKey}
OpenRouter:  Authorization: Bearer {apiKey}
             HTTP-Referer: {origin}
             X-Title: {appName}
Ollama:      Authorization: Bearer {apiKey} (cloud only)
```

### Streaming Formats
```typescript
Gemini:      Non-streaming (simulate with chunking)
Cerebras:    SSE: data: {"choices":[{"delta":{"content":"..."}}]}
Groq:        SSE: data: {"choices":[{"delta":{"content":"..."}}]}
OpenRouter:  SSE: data: {"choices":[{"delta":{"content":"..."}}]}
Ollama:      Native: {"message":{"content":"..."}}
```

### Model Selection Examples
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
"liquid/lfm-2.5-1.2b-thinking:free" (OpenRouter)

// Large context
"gemini-2.5-pro" (2M tokens)
"deepseek-v3.1:671b-cloud" (128K tokens)
```

### Common Pitfalls
1. ❌ Forgetting to handle `[DONE]` marker
2. ❌ Not buffering incomplete SSE lines
3. ❌ Logging full API keys
4. ❌ Assuming all models support vision
5. ❌ Not validating model selection
6. ❌ Hardcoding API endpoints
7. ❌ Missing error handling in stream loop
8. ❌ Not releasing reader lock

### Performance Tips
1. ✅ Lazy load heavy SDKs
2. ✅ Use streaming for better UX
3. ✅ Chunk responses (3-10 chars)
4. ✅ Implement client-side caching
5. ✅ Batch similar requests
6. ✅ Use fastest model for simple queries
7. ✅ Compress large contexts
8. ✅ Monitor token usage

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-11  
**Maintainer**: ConstructLM Team
