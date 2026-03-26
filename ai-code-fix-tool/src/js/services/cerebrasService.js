// Cerebras AI Service
// Endpoint: https://api.cerebras.ai/v1/chat/completions
// Authentication: Authorization: Bearer {key}

export const CEREBRAS_MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", vision: false, context: "128K", tags: ["TEXT", "FAST"] }
];

// Uses current app's streaming approach (SSE parsing)
export async function callCerebrasAPI(prompt, apiKey, model = "llama3.1-8b") {
  if (!apiKey) {
    throw new Error("Cerebras API key not configured");
  }

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 8000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Cerebras API error: ${response.status}`);
  }

  return response;
}

// Handles streaming response using current app's pattern
export async function handleStreamingResponse(response, aiMessageBubble, parseAIResponse, formatAIResponse) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

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
