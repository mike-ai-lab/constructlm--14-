import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter model registry - all verified working models
export const OPENROUTER_MODELS = [
  // General
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5-Air", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  
  // Reasoning
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "REASONING"] },
  
  // Multimodal
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B VL", vision: true, text: true, multimodal: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", vision: true, text: true, multimodal: true, context: "131K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B", vision: true, text: true, multimodal: true, context: "33K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "google/gemma-3-4b-it:free", name: "Gemma 3 4B", vision: true, text: true, multimodal: true, context: "33K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  
  // Agents
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B", vision: false, text: true, multimodal: false, context: "256K", tags: ["TEXT", "AGENTS"] },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron Nano 9B V2", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "AGENTS"] },
  
  // Compact
  { id: "google/gemma-3n-e2b-it:free", name: "Gemma 3N E2B", vision: false, text: true, multimodal: false, context: "33K", tags: ["TEXT", "COMPACT"] },
  { id: "google/gemma-3n-e4b-it:free", name: "Gemma 3N E4B", vision: false, text: true, multimodal: false, context: "33K", tags: ["TEXT", "COMPACT"] }
];

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "openai/gpt-oss-20b:free",
  imageBase64?: string
) => {
  const key = apiKey || (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  
  if (!key) {
    throw new Error("OpenRouter API key not configured");
  }

  // Format context
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

Context Information:
${contextString}`;

  // Build messages
  const messages: any[] = [
    { role: "system", content: systemInstruction }
  ];

  // Add history
  history
    .filter(h => !h.isStreaming)
    .forEach(h => {
      messages.push({
        role: h.role === "model" ? "assistant" : h.role,
        content: h.content
      });
    });

  // Add current message with optional image
  if (imageBase64 && OPENROUTER_MODELS.find(m => m.id === model)?.vision) {
    // Vision models support images
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

  // Determine max_tokens based on model type
  const isSafetyModel = model.includes('guard') || model.includes('safeguard');
  const maxTokens = isSafetyModel ? 512 : 8000;

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
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          console.error("Parse error:", e);
        }
      }
    }
  }
};

/**
 * Validate and fix response citations
 * Called after streaming completes to ensure consistency
 */
export const validateResponseCitations = (text: string): string => {
  const { text: fixedText, result } = validateAndFixCitations(text);
  
  // Log validation for monitoring
  logCitationValidation(fixedText, 'OpenRouter');
  
  // If there were fixes, log them
  if (result.fixedText) {
    console.warn('[OpenRouter] Citations were auto-fixed:', result.errors);
  }
  
  return fixedText;
};

/**
 * Fix code that has errors - minimal tokens, patch-mode only
 */
export const fixCodeError = async (
  code: string,
  errorMessage: string,
  apiKey?: string,
  model: string = "openai/gpt-oss-20b:free"
): Promise<string | null> => {
  const key = apiKey || (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  
  if (!key) {
    throw new Error("OpenRouter API key not configured");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "ConstructLM",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
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
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract code from response
    const codeMatch = content.match(/```(?:jsx|tsx|js)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    console.error('[OpenRouter] Error fixing code:', error);
    throw error;
  }
};
