import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

// Local Ollama models (commonly available)
export const OLLAMA_LOCAL_MODELS = [
  { id: "llama2", name: "Llama 2 7B", context: "4K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama2:13b", name: "Llama 2 13B", context: "4K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama2:70b", name: "Llama 2 70B", context: "4K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama3", name: "Llama 3 8B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama3:70b", name: "Llama 3 70B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "mistral", name: "Mistral 7B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "neural-chat", name: "Neural Chat 7B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "starling-lm", name: "Starling LM 7B", context: "4K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "dolphin-mixtral", name: "Dolphin Mixtral 8x7B", context: "32K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "openchat", name: "OpenChat 3.5", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "zephyr", name: "Zephyr 7B", context: "4K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "orca-mini", name: "Orca Mini 3B", context: "4K tokens", tags: ["LOCAL", "COMPACT"], vision: false },
  { id: "phi", name: "Phi 2.7B", context: "2K tokens", tags: ["LOCAL", "COMPACT"], vision: false },
  { id: "tinyllama", name: "TinyLlama 1.1B", context: "2K tokens", tags: ["LOCAL", "COMPACT"], vision: false },
];

// Cloud Ollama models (via Ollama Cloud API)
export const OLLAMA_CLOUD_MODELS = [
  { id: "llama2", name: "Llama 2 7B", context: "4K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "llama2:13b", name: "Llama 2 13B", context: "4K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "llama3", name: "Llama 3 8B", context: "8K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "llama3:70b", name: "Llama 3 70B", context: "8K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "mistral", name: "Mistral 7B", context: "8K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "mixtral", name: "Mixtral 8x7B", context: "32K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "neural-chat", name: "Neural Chat 7B", context: "8K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "starling-lm", name: "Starling LM 7B", context: "4K tokens", tags: ["CLOUD", "TEXT"], vision: false },
];

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string, isReasoning?: boolean) => void,
  apiKey?: string,
  model: string = "llama2",
  imageBase64?: string,
  ollamaBaseUrl: string = "http://localhost:11434",
  isCloud: boolean = false
) => {
  // For cloud Ollama, API key is required
  if (isCloud && !apiKey) {
    throw new Error("Ollama Cloud API key not configured");
  }

  // Format context for the system instruction
  const contextString = context.map((c, i) => 
    `[SOURCE ${i + 1} - ${c.docName}]
${c.text}
[END SOURCE ${i + 1}]
---`
  ).join('\n');

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
✅ "According to {{citation:document.pdf|Page 5|the pricing data}}, the cost is..."

EXAMPLES OF WRONG FORMAT:
❌ "According to Source 1..."
❌ "{{citation:file.pdf}}" (missing location and quote)
❌ "[cite:file.pdf]"
❌ "{{citation:file.pdf|Page 3}}" (missing quote)

CITATION RULES:
- Always include page/section number
- Always include exact quote from source
- Use filename exactly as provided in sources
- One citation per fact
- No nested citations
- If multiple sources support same fact, cite the most relevant one

Keep responses professional, objective, and concise.

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

Context Information:
${contextString}`;

  // Build messages array
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

  // Determine API endpoint
  const apiUrl = isCloud 
    ? "https://api.ollama.ai/v1/chat/completions"
    : `${ollamaBaseUrl}/api/chat`;

  // Prepare request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (isCloud && apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Prepare request body
  const requestBody = isCloud
    ? {
        model: model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 8000,
      }
    : {
        model: model,
        messages,
        stream: true,
        temperature: 0.7,
      };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ollama API error details:', errorText);
    throw new Error(`Ollama API error (${response.status}): ${response.statusText} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          // Handle both streaming formats
          let data;
          if (isCloud) {
            // OpenAI-compatible format
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;
              data = JSON.parse(jsonStr);
              const chunk = data.choices?.[0]?.delta?.content || "";
              if (chunk) {
                onChunk(chunk);
              }
            }
          } else {
            // Ollama native format
            data = JSON.parse(line);
            const chunk = data.message?.content || "";
            if (chunk) {
              onChunk(chunk);
            }
          }
        } catch (e) {
          console.error("Error parsing stream line:", line, e);
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        if (isCloud) {
          if (buffer.startsWith("data: ")) {
            const jsonStr = buffer.slice(6);
            if (jsonStr !== "[DONE]") {
              const data = JSON.parse(jsonStr);
              const chunk = data.choices?.[0]?.delta?.content || "";
              if (chunk) {
                onChunk(chunk);
              }
            }
          }
        } else {
          const data = JSON.parse(buffer);
          const chunk = data.message?.content || "";
          if (chunk) {
            onChunk(chunk);
          }
        }
      } catch (e) {
        console.error("Error parsing final buffer:", buffer, e);
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const estimateTokens = (text: string, imageBase64?: string): number => {
  // Rough estimation: ~4 characters per token
  let tokens = Math.ceil(text.length / 4);
  
  // Add tokens for image if present
  if (imageBase64) {
    // Rough estimate: ~500 tokens per image
    tokens += 500;
  }
  
  return tokens;
};

export const testConnection = async (
  baseUrl: string = "http://localhost:11434",
  isCloud: boolean = false,
  apiKey?: string
): Promise<{ success: boolean; message: string; models?: string[] }> => {
  try {
    const url = isCloud 
      ? "https://api.ollama.ai/v1/models"
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
    
    if (isCloud) {
      const models = data.data?.map((m: any) => m.id) || [];
      return {
        success: true,
        message: "Connected to Ollama Cloud",
        models
      };
    } else {
      const models = data.models?.map((m: any) => m.name) || [];
      return {
        success: true,
        message: `Connected to local Ollama at ${baseUrl}`,
        models
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
