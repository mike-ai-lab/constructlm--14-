// OpenRouter AI Service
// Endpoint: https://openrouter.ai/api/v1/chat/completions
// Authentication: Authorization: Bearer {key} + attribution headers

export const OPENROUTER_MODELS = [
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B", vision: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5-Air", vision: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large", vision: false, context: "131K", tags: ["TEXT", "REASONING"] },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B VL", vision: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", vision: true, context: "131K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B", vision: true, context: "33K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-4b-it:free", name: "Gemma 3 4B", vision: true, context: "33K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B", vision: false, context: "256K", tags: ["TEXT", "AGENTS"] },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron Nano 9B V2", vision: false, context: "128K", tags: ["TEXT", "AGENTS"] },
  { id: "google/gemma-3n-e2b-it:free", name: "Gemma 3N E2B", vision: false, context: "33K", tags: ["TEXT", "COMPACT"] },
  { id: "google/gemma-3n-e4b-it:free", name: "Gemma 3N E4B", vision: false, context: "33K", tags: ["TEXT", "COMPACT"] }
];

// Uses current app's streaming approach (SSE parsing)
export async function callOpenRouterAPI(prompt, apiKey, model = "openai/gpt-oss-20b:free") {
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "AI Code Fix Pro"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      max_tokens: 8000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
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
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content || '';
              const reasoning = delta?.reasoning || delta?.reasoning_content || '';
              
              if (reasoning) {
                // If reasoning is separate, wrap it so parseAIResponse can find it
                if (!fullResponse.includes('<think>')) fullResponse += '<think>';
                fullResponse += reasoning;
              } else if (content) {
                // If we were reasoning and now got content, close the think tag if needed
                if (fullResponse.includes('<think>') && !fullResponse.includes('</think>')) {
                  fullResponse += '</think>\n\n';
                }
                fullResponse += content;
              }

              if (content || reasoning) {
                const parsedResponse = parseAIResponse(fullResponse);
                aiMessageBubble.innerHTML = formatAIResponse(parsedResponse, fullResponse);
              }
            } catch (e) {
              console.warn('Token rendering error:', e.message);
            }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}
