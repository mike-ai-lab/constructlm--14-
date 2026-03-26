// Ollama AI Service (Local/Cloud)
// Endpoint: http://localhost:11434/api/chat (local) or cloud endpoint
// Authentication: Optional for local, required for cloud

export const OLLAMA_LOCAL_MODELS = [
  { id: "llama3.1:8b", name: "Llama 3.1 8B", vision: false, context: "8K", tags: ["LOCAL", "TEXT"] },
  { id: "llama3.1:70b", name: "Llama 3.1 70B", vision: false, context: "8K", tags: ["LOCAL", "TEXT"] },
  { id: "llama3.1:405b", name: "Llama 3.1 405B", vision: false, context: "128K", tags: ["LOCAL", "TEXT"] },
  { id: "deepseek-r1:7b", name: "DeepSeek-R1 7B", vision: false, context: "64K", tags: ["LOCAL", "REASONING"] },
  { id: "deepseek-r1:32b", name: "DeepSeek-R1 32B", vision: false, context: "64K", tags: ["LOCAL", "REASONING"] },
  { id: "deepseek-r1:70b", name: "DeepSeek-R1 70B", vision: false, context: "64K", tags: ["LOCAL", "REASONING"] },
  { id: "llama3.2:1b", name: "Llama 3.2 1B", vision: false, context: "8K", tags: ["LOCAL", "COMPACT"] },
  { id: "llama3.2:3b", name: "Llama 3.2 3B", vision: false, context: "8K", tags: ["LOCAL", "COMPACT"] },
  { id: "gemma3:9b", name: "Gemma 3 9B", vision: false, context: "8K", tags: ["LOCAL", "TEXT"] },
  { id: "mistral:7b", name: "Mistral 7B", vision: false, context: "32K", tags: ["LOCAL", "TEXT"] },
  { id: "mixtral:8x7b", name: "Mixtral 8x7B", vision: false, context: "32K", tags: ["LOCAL", "TEXT"] },
  { id: "qwen2:7b", name: "Qwen 2 7B", vision: false, context: "32K", tags: ["LOCAL", "TEXT"] },
  { id: "nomic-embed-text", name: "Nomic Embed Text", vision: false, context: "8K", tags: ["LOCAL", "EMBEDDING"] }
];

export const OLLAMA_CLOUD_MODELS = [
  { id: "gpt-oss:120b-cloud", name: "GPT-OSS 120B Cloud", vision: false, context: "32K", tags: ["CLOUD", "TEXT"] },
  { id: "gpt-oss:20b-cloud", name: "GPT-OSS 20B Cloud", vision: false, context: "32K", tags: ["CLOUD", "TEXT"] },
  { id: "deepseek-v3.1:671b-cloud", name: "DeepSeek V3.1 671B Cloud", vision: false, context: "128K", tags: ["CLOUD", "REASONING"] },
  { id: "qwen3-coder:480b-cloud", name: "Qwen3 Coder 480B Cloud", vision: false, context: "32K", tags: ["CLOUD", "CODING"] },
  { id: "qwen3-vl:235b-cloud", name: "Qwen3 VL 235B Cloud", vision: true, context: "32K", tags: ["CLOUD", "VISION"] },
  { id: "minimax-m2:cloud", name: "MiniMax M2 Cloud", vision: false, context: "32K", tags: ["CLOUD", "TEXT"] },
  { id: "glm-4.6:cloud", name: "GLM 4.6 Cloud", vision: false, context: "128K", tags: ["CLOUD", "REASONING"] }
];

// Uses current app's streaming approach (native Ollama format)
export async function callOllamaAPI(prompt, apiKey, model = "llama3.1:8b", baseUrl = "http://localhost:11434") {
  const headers = { "Content-Type": "application/json" };
  
  // Add API key for cloud mode
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      options: {
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
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
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          const content = data.message?.content || '';
          const reasoning = data.message?.reasoning || data.thought || '';
          
          if (reasoning) {
            if (!fullResponse.includes('<think>')) fullResponse += '<think>';
            fullResponse += reasoning;
          } else if (content) {
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
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

// Test connection to Ollama
export async function testConnection(baseUrl = "http://localhost:11434") {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      return {
        success: false,
        message: `Connection failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    const models = data.models?.map(m => m.name) || [];
    
    return {
      success: true,
      message: `Connected to Ollama`,
      models
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error.message}`
    };
  }
}
