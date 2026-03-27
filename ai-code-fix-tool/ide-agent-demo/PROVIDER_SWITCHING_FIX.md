# Provider Switching Fix

## Bug Identified

The server was **HARDCODED to always use Groq API**, even when you selected Gemini in the frontend!

### Symptoms
- Selected "Gemini" in settings
- Entered valid Gemini API key
- Got error: "Invalid API Key"
- Server logs showed: "Groq API Error: Invalid API Key"

### Root Cause
Both `runAgentic()` and `runSemantic()` functions had hardcoded Groq API calls:

```js
// BEFORE (BROKEN)
const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  // Always called Groq, ignored provider parameter!
});
```

The `provider` parameter was passed to the function but **completely ignored**!

## Fix Applied

### 1. Added Provider Detection in Agentic Mode

```js
// AFTER (FIXED)
if (provider === 'gemini') {
  apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;
  headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': keyToUse  // Gemini uses header-based auth
  };
  
  // Convert OpenAI format to Gemini format
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));
  
  requestBody = {
    contents: geminiMessages,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000
    }
  };
} else {
  // Groq (default)
  apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  headers = {
    'Authorization': `Bearer ${keyToUse}`,
    'Content-Type': 'application/json'
  };
  // ... Groq request body
}
```

### 2. Added Provider Detection in Semantic Mode

Same pattern applied to `runSemantic()` function.

### 3. Handle Different Response Formats

**Groq:** Streams responses (SSE format)
```js
// Groq streaming
const reader = r.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  // Parse SSE chunks
}
```

**Gemini:** Returns complete response (no streaming)
```js
// Gemini non-streaming
const data = await r.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

// Simulate streaming for UX
const words = text.split(' ');
for (let i = 0; i < words.length; i++) {
  fullAnswer += (i > 0 ? ' ' : '') + words[i];
  yield { type: 'final_answer_chunk', content: fullAnswer };
  await new Promise(resolve => setTimeout(resolve, 40));
}
```

### 4. Added Debug Logging

```js
console.log(`[API CALL] Using ${provider} at ${apiUrl}`);
console.log(`[SEMANTIC API] Using ${provider} at ${apiUrl}`);
```

Now you can see which provider is actually being used!

## Key Differences: Groq vs Gemini

| Feature | Groq | Gemini |
|---------|------|--------|
| **API Format** | OpenAI-compatible | Google native |
| **Streaming** | ✅ Yes (SSE) | ❌ No (full response) |
| **Auth** | Bearer token | Header: x-goog-api-key |
| **Message Format** | `{role, content}` | `{role, parts: [{text}]}` |
| **System Prompt** | In messages array | Separate `systemInstruction` |
| **Tool Calling** | ✅ Supported | ⚠️ Not implemented yet |

## Testing

1. **Test Groq:**
   - Select "Groq" in settings
   - Enter Groq API key
   - Run query
   - Check logs: `[API CALL] Using groq at https://api.groq.com...`

2. **Test Gemini:**
   - Select "Gemini" in settings
   - Enter Gemini API key
   - Run query (semantic mode only for now)
   - Check logs: `[SEMANTIC API] Using gemini at https://generativelanguage.googleapis.com...`

## Known Limitations

### Agentic Mode with Gemini
Gemini doesn't support tool calling in the same way as Groq, so agentic mode will fail with Gemini. The agent will try to call tools but Gemini won't understand the format.

**Workaround:** Use semantic mode with Gemini, or use Groq for agentic mode.

**Future Fix:** Implement Gemini function calling format or use prompt-based tool simulation.

## Summary

✅ Provider selection now works correctly
✅ Groq and Gemini both supported in semantic mode
✅ Debug logging shows which provider is used
✅ Different response formats handled properly
⚠️ Agentic mode only works with Groq (tool calling limitation)

The bug where Gemini API key showed "Invalid API Key" while logs said "Groq API Error" is now fixed!
