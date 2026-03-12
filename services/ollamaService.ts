import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

// Local Ollama models (commonly available - 2026)
export const OLLAMA_LOCAL_MODELS = [
  { id: "llama3.1:8b", name: "Llama 3.1 8B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama3.1:70b", name: "Llama 3.1 70B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "llama3.1:405b", name: "Llama 3.1 405B", context: "128K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "deepseek-r1:7b", name: "DeepSeek-R1 7B", context: "64K tokens", tags: ["LOCAL", "REASONING"], vision: false },
  { id: "deepseek-r1:32b", name: "DeepSeek-R1 32B", context: "64K tokens", tags: ["LOCAL", "REASONING"], vision: false },
  { id: "deepseek-r1:70b", name: "DeepSeek-R1 70B", context: "64K tokens", tags: ["LOCAL", "REASONING"], vision: false },
  { id: "llama3.2:1b", name: "Llama 3.2 1B", context: "8K tokens", tags: ["LOCAL", "COMPACT"], vision: false },
  { id: "llama3.2:3b", name: "Llama 3.2 3B", context: "8K tokens", tags: ["LOCAL", "COMPACT"], vision: false },
  { id: "gemma3:9b", name: "Gemma 3 9B", context: "8K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "mistral:7b", name: "Mistral 7B", context: "32K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "mixtral:8x7b", name: "Mixtral 8x7B", context: "32K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "qwen2:7b", name: "Qwen 2 7B", context: "32K tokens", tags: ["LOCAL", "TEXT"], vision: false },
  { id: "nomic-embed-text", name: "Nomic Embed Text", context: "8K tokens", tags: ["LOCAL", "EMBEDDING"], vision: false },
];

// Cloud Ollama models (via Ollama Cloud API - 2026)
export const OLLAMA_CLOUD_MODELS = [
  { id: "gpt-oss:120b-cloud", name: "GPT-OSS 120B Cloud", context: "32K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "gpt-oss:20b-cloud", name: "GPT-OSS 20B Cloud", context: "32K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "deepseek-v3.1:671b-cloud", name: "DeepSeek V3.1 671B Cloud", context: "128K tokens", tags: ["CLOUD", "REASONING"], vision: false },
  { id: "qwen3-coder:480b-cloud", name: "Qwen3 Coder 480B Cloud", context: "32K tokens", tags: ["CLOUD", "CODING"], vision: false },
  { id: "qwen3-vl:235b-cloud", name: "Qwen3 VL 235B Cloud", context: "32K tokens", tags: ["CLOUD", "VISION"], vision: true },
  { id: "minimax-m2:cloud", name: "MiniMax M2 Cloud", context: "32K tokens", tags: ["CLOUD", "TEXT"], vision: false },
  { id: "glm-4.6:cloud", name: "GLM 4.6 Cloud", context: "128K tokens", tags: ["CLOUD", "REASONING"], vision: false },
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

# ===== CRITICAL: RESPONSE FORMAT RULES =====

## COMPONENT GENERATION (HIGHEST PRIORITY)
When users ask for ANY UI component, dashboard, portfolio, layout, or page:

### DO THIS - EXACT STRUCTURE:
1. Write 2-3 sentences describing what it does
2. Write ONE SINGLE \`\`\`jsx code block with COMPLETE working component
3. Optional: Add 2-3 sentences of tips (NOT in code)

### NEVER DO THIS:
- ❌ Split code across multiple blocks
- ❌ Import from external files (./components, ./pages, etc)
- ❌ Reference files that don't exist
- ❌ Use incomplete snippets
- ❌ Scatter code in explanations
- ❌ Mix explanations with code

### CODE BLOCK RULES (MANDATORY):
✅ MUST HAVE:
- Default export
- Self-contained (no external imports except React, lucide-react, Tailwind)
- All state, functions, data INSIDE the component
- Complete and ready to render immediately
- Production-quality HTML/JSX
- Realistic content (not Lorem ipsum placeholders)

✅ EXAMPLE - CORRECT FORMAT:
This is a beautiful portfolio component with sections for projects, services, and contact.

\`\`\`jsx
import React, { useState } from 'react';
import { Menu, X, Mail, Phone, MapPin } from 'lucide-react';

export default function Portfolio() {
  const [isOpen, setIsOpen] = useState(false);
  
  // All data and logic inside
  const projects = [
    { id: 1, name: 'Project 1', desc: 'Description' },
    // ... more projects
  ];
  
  return (
    <div className="min-h-screen bg-white">
      {/* Complete HTML/JSX here - NO external imports */}
    </div>
  );
}
\`\`\`

Tips: You can customize colors using Tailwind classes. Add more projects to the array as needed.

### CRITICAL RULES FOR CODE BLOCKS:
1. Use \`\`\`jsx with jsx identifier
2. ALL imports on first 2 lines (React, lucide-react only)
3. NO import from './components' or './pages'
4. NO import from external packages except React and lucide-react
5. Component data must be INSIDE the component function
6. Export default the component
7. Complete HTML structure (not snippets)
8. No comments except essential ones (max 3 lines)

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

  // Determine max_tokens based on model type
  const isSafetyModel = model.includes('guard') || model.includes('safeguard');
  const maxTokens = isSafetyModel ? 512 : 8000;

  // Determine API endpoint
  if (isCloud) {
    // Use backend proxy to bypass CORS
    const apiUrl = "http://localhost:3001/api/ollama-proxy";

    const requestBody = {
      model: model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: maxTokens,
      apiKey: apiKey
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama proxy error details:', errorText);
      throw new Error(`Ollama proxy error (${response.status}): ${response.statusText} - ${errorText}`);
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

      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          const chunk = data.message?.content || "";
          if (chunk) {
            onChunk(chunk);
          }
        } catch (e) {
          console.error("Error parsing final buffer:", buffer, e);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return;
  }

  // Local Ollama endpoint
  const apiUrl = `${ollamaBaseUrl}/api/chat`;

  // Prepare request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prepare request body
  const requestBody = {
    model: model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: maxTokens,
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
          // Ollama uses native format for both local and cloud
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

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        const chunk = data.message?.content || "";
        if (chunk) {
          onChunk(chunk);
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

/**
 * Fix code that has errors - minimal tokens, patch-mode only
 */
export const fixCodeError = async (
  code: string,
  errorMessage: string,
  apiKey?: string,
  model: string = "llama3.1:8b",
  baseUrl: string = "http://localhost:11434",
  isCloud: boolean = false
): Promise<string | null> => {
  try {
    const url = isCloud 
      ? "https://api.ollama.ai/v1/chat/completions"
      : `${baseUrl}/api/chat`;

    const body = isCloud
      ? {
          model: model,
          messages: [
            {
              role: "user",
              content: `You are a code fixer. Fix ONLY the error in this React component. Return ONLY the corrected code in a single \`\`\`jsx block.

ERROR: ${errorMessage}

CODE:
\`\`\`jsx
${code}
\`\`\`

Fix the error and return the corrected component.`
            }
          ],
          max_tokens: 1000
        }
      : {
          model: model,
          messages: [
            {
              role: "user",
              content: `You are a code fixer. Fix ONLY the error in this React component. Return ONLY the corrected code in a single \`\`\`jsx block.

ERROR: ${errorMessage}

CODE:
\`\`\`jsx
${code}
\`\`\`

Fix the error and return the corrected component.`
            }
          ],
          stream: false
        };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (isCloud && apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = isCloud
      ? data.choices?.[0]?.message?.content || ''
      : data.message?.content || '';
    
    // Extract code from response
    const codeMatch = content.match(/```(?:jsx|tsx|js)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    console.error('[Ollama] Error fixing code:', error);
    throw error;
  }
};
