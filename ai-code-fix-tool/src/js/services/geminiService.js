// Google Gemini AI Service
// Endpoint: https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
// Authentication: x-goog-api-key header

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", vision: true, context: "1M", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", vision: true, context: "1M", tags: ["VISION", "TEXT", "FAST"] }
];

// Uses current app's streaming approach (SSE-like chunking)
export async function callGeminiAPI(prompt, apiKey, model = "gemini-2.5-flash") {
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  // SECURITY: API key in header, NOT URL
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey  // Secure header authentication
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  return response;
}

// Handles streaming response using current app's pattern
export async function handleStreamingResponse(response, aiMessageBubble, parseAIResponse, formatAIResponse) {
  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  let fullResponse = '';
  
  parts.forEach(part => {
    if (part.thought) {
      fullResponse += `<think>${part.thought}</think>\n\n`;
    }
    if (part.text) {
      fullResponse += part.text;
    }
  });
  
  if (!fullResponse) {
    throw new Error('No response from Gemini');
  }

  // Simulate streaming (matches current app behavior)
  let currentText = '';
  for (let i = 0; i < fullResponse.length; i += 3) {
    currentText += fullResponse.slice(i, i + 3);
    const parsed = parseAIResponse(currentText);
    aiMessageBubble.innerHTML = formatAIResponse(parsed, currentText);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return fullResponse;
}
