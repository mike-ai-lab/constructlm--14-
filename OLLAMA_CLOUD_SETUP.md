# Ollama Cloud Setup - Complete Guide

## Problem
ConstructLM runs on Vite dev server (port 3000) with no backend. Ollama Cloud API has CORS restrictions, so direct browser calls fail.

## Solution
Separate proxy server on port 3001 that:
- Accepts requests from ConstructLM (port 3000)
- Forwards to Ollama Cloud API
- Bypasses CORS completely
- Streams responses back

## Setup Instructions

### Step 1: Start the Proxy Server

In a NEW terminal window:

```bash
node proxy-server.js
```

You should see:
```
✅ Ollama Cloud Proxy running on http://localhost:3001
📍 Endpoint: POST http://localhost:3001/api/ollama-proxy
```

### Step 2: Start ConstructLM (in another terminal)

```bash
npm run dev
```

ConstructLM will run on `http://localhost:3000`

### Step 3: Configure Ollama Cloud in ConstructLM

1. Open ConstructLM in browser: `http://localhost:3000`
2. Click Settings (gear icon)
3. Go to "Ollama Configuration"
4. Click "CLOUD" button
5. Enter your Ollama Cloud API key
6. Click "SAVE"

### Step 4: Select Cloud Model

1. Click the model dropdown in the header
2. Look for "Ollama (Cloud)" section
3. Select a cloud model (e.g., llama3.1:8b)
4. Type a message and send

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ ConstructLM (Vite Dev Server)                               │
│ http://localhost:3000                                       │
│                                                             │
│ Browser sends request to:                                  │
│ POST http://localhost:3001/api/ollama-proxy                │
│ Body: { model, messages, apiKey, ... }                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (same machine, no CORS)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Proxy Server (Node.js)                                      │
│ http://localhost:3001                                       │
│                                                             │
│ Receives request, forwards to:                             │
│ POST https://ollama.com/api/chat                           │
│ Headers: Authorization: Bearer {apiKey}                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (server-to-server, no CORS)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Ollama Cloud API                                            │
│ https://ollama.com/api/chat                                │
│                                                             │
│ Processes request, streams response back                   │
└─────────────────────────────────────────────────────────────┘
```

## Files

### proxy-server.js (NEW)
- Standalone Node.js proxy server
- Listens on port 3001
- Forwards requests to Ollama Cloud
- Handles streaming responses

### services/ollamaService.ts (UPDATED)
- Changed proxy URL from `/api/ollama-proxy` to `http://localhost:3001/api/ollama-proxy`
- Now points to separate proxy server, not Vite dev server

## Running Both Servers

**Terminal 1 - Proxy Server:**
```bash
node proxy-server.js
```

**Terminal 2 - ConstructLM:**
```bash
npm run dev
```

Both must be running for Ollama Cloud to work.

## Available Cloud Models

- llama3.1:8b
- llama3.1:70b
- llama3.1:405b
- deepseek-r1:7b
- deepseek-r1:32b
- deepseek-r1:70b
- gemma3:9b
- mistral:7b
- mixtral:8x7b

## Troubleshooting

**Error: "Cannot GET /api/ollama-proxy"**
- Proxy server not running
- Run: `node proxy-server.js` in a new terminal

**Error: "Missing Ollama Cloud API key"**
- API key not saved in Settings
- Go to Settings → Ollama Configuration → Add key → SAVE

**Error: "Ollama Cloud API error"**
- Invalid API key
- Check your Ollama Cloud account
- Verify API key is correct

**No response from proxy**
- Check proxy server is running: `http://localhost:3001/health`
- Should return: `{"status":"ok","service":"ollama-proxy"}`

## Security

✅ API key is sent only to proxy server (not exposed in browser)
✅ Proxy forwards to Ollama Cloud with proper auth
✅ CORS is completely bypassed
✅ No API key stored in browser localStorage

## Production Deployment

For production, deploy proxy-server.js to a server and update the URL in ollamaService.ts:

```typescript
const apiUrl = "https://your-proxy-server.com/api/ollama-proxy";
```

Or use environment variables:

```typescript
const PROXY_URL = process.env.VITE_OLLAMA_PROXY_URL || "http://localhost:3001";
const apiUrl = `${PROXY_URL}/api/ollama-proxy`;
```
