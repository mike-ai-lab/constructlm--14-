// Groq AI Service (Current implementation - preserved)
// Endpoint: https://api.groq.com/openai/v1/chat/completions
// Authentication: Authorization: Bearer {key}

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", vision: false, context: "128K", tags: ["TEXT", "VERSATILE"] },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", vision: false, context: "128K", tags: ["TEXT", "FAST"] },
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", vision: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", vision: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "meta-llama/llama-prompt-guard-2-86m", name: "Llama Prompt Guard 2 86M", vision: false, context: "8K", tags: ["SAFETY", "GUARD"] },
  { id: "openai/gpt-oss-safeguard-20b", name: "GPT OSS Safeguard 20B", vision: false, context: "128K", tags: ["SAFETY", "MODERATION"] },
  { id: "whisper-large-v3", name: "Whisper Large V3", vision: false, context: "N/A", tags: ["SPEECH", "TRANSCRIPTION"] },
  { id: "whisper-large-v3-turbo", name: "Whisper Large V3 Turbo", vision: false, context: "N/A", tags: ["SPEECH", "TRANSCRIPTION", "FAST"] }
];

// Uses current app's streaming approach (SSE parsing)
export async function callGroqAPI(prompt, apiKey, model = "llama-3.3-70b-versatile") {
  if (!apiKey) {
    throw new Error("Groq API key not configured");
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  return response;
}

// Handles streaming response using current app's pattern
export async function handleStreamingResponse(response, aiMessageBubble, parseAIResponse, formatAIResponse) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              const parsedResponse = parseAIResponse(fullResponse);
              aiMessageBubble.innerHTML = formatAIResponse(parsedResponse, fullResponse);
            }
          } catch (e) {
            // Skip malformed chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return fullResponse;
}
