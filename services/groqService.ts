import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq model registry - all verified working models
export const GROQ_MODELS = [
  // Chat Completion Models
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "VERSATILE"] },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "FAST"] },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", vision: false, text: true, multimodal: false, context: "16K", tags: ["TEXT", "ADVANCED"] },
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B", vision: false, text: true, multimodal: false, context: "32K", tags: ["TEXT", "REASONING"] },
  { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "LARGE"] },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "GENERAL"] },
  { id: "moonshotai/kimi-k2-instruct", name: "Kimi K2 Instruct", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "INSTRUCT"] },
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2 Instruct 0905", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "INSTRUCT"] },
  { id: "groq/compound", name: "Groq Compound", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "COMPOUND"] },
  { id: "groq/compound-mini", name: "Groq Compound Mini", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "COMPACT"] },
  
  // Vision Models
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", vision: true, text: true, multimodal: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", vision: true, text: true, multimodal: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  
  // Safety & Moderation Models (utility only - not for chat)
  { id: "meta-llama/llama-guard-4-12b", name: "Llama Guard 4 12B", vision: false, text: true, multimodal: false, context: "8K", tags: ["SAFETY", "MODERATION"], utilityOnly: true },
  { id: "meta-llama/llama-prompt-guard-2-22m", name: "Llama Prompt Guard 2 22M", vision: false, text: true, multimodal: false, context: "8K", tags: ["SAFETY", "GUARD"], utilityOnly: true },
  { id: "meta-llama/llama-prompt-guard-2-86m", name: "Llama Prompt Guard 2 86M", vision: false, text: true, multimodal: false, context: "8K", tags: ["SAFETY", "GUARD"], utilityOnly: true },
  { id: "openai/gpt-oss-safeguard-20b", name: "GPT OSS Safeguard 20B", vision: false, text: true, multimodal: false, context: "128K", tags: ["SAFETY", "MODERATION"], utilityOnly: true },
  
  // Speech-to-Text Models (for future implementation)
  { id: "whisper-large-v3", name: "Whisper Large V3", vision: false, text: false, multimodal: false, context: "N/A", tags: ["SPEECH", "TRANSCRIPTION"], speechToText: true },
  { id: "whisper-large-v3-turbo", name: "Whisper Large V3 Turbo", vision: false, text: false, multimodal: false, context: "N/A", tags: ["SPEECH", "TRANSCRIPTION", "FAST"], speechToText: true }
];

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = "llama-3.3-70b-versatile",
  imageBase64?: string
) => {
  const key = apiKey || (import.meta as any).env?.VITE_GROQ_API_KEY;
  
  // Sync API key to localStorage for standalone tools
  if (key && typeof window !== 'undefined') {
    try {
      localStorage.setItem('groq_api_key', key);
    } catch (e) {
      console.warn('Could not sync API key to localStorage:', e);
    }
  }
  
  if (!key) {
    throw new Error("Groq API key not configured");
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

CANVAS COMPONENT GENERATION:
When users ask for UI components, generate React components for immediate Canvas rendering.

DO NOT INCLUDE:
- Setup instructions or npm commands
- Multiple files or folder structures
- package.json or build configs

REQUIRED FORMAT:
1. Single self-contained React component
2. Functional component with default export
3. Imports: React, hooks, Framer Motion, Wouter, Lucide React
4. Tailwind CSS for styling
5. Realistic content
6. Responsive and production-ready

Context Information:
${contextString}`;

  // Determine max_tokens and streaming based on model type
  const isSafetyModel = model.includes('guard') || model.includes('safeguard');
  const maxTokens = isSafetyModel ? 512 : 8000;
  const useStreaming = !isSafetyModel; // Safety models don't support streaming

  // Build messages array
  let messages: any[];
  
  if (isSafetyModel) {
    // Safety models require single user message only (no system, no history)
    messages = [{ role: "user", content: message }];
  } else {
    // Regular models get full context
    messages = [
      { role: "system", content: systemInstruction },
      ...history
        .filter(h => !h.isStreaming)
        .map(h => ({
          role: h.role === "model" ? "assistant" : h.role,
          content: h.content
        }))
    ];

    // Add current message with optional image
    if (imageBase64 && model.includes('vision')) {
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
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: useStreaming,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${errorText}`);
  }

  // Handle non-streaming response for safety models
  if (!useStreaming) {
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Send in chunks to simulate streaming
    for (let i = 0; i < text.length; i += 5) {
      onChunk(text.slice(i, i + 5));
    }
    return;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Silently ignore parse errors from incomplete chunks
          console.warn("Skipping malformed chunk:", data.substring(0, 50));
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
  logCitationValidation(fixedText, 'Groq');
  
  // If there were fixes, log them
  if (result.fixedText) {
    console.warn('[Groq] Citations were auto-fixed:', result.errors);
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
  model: string = "llama-3.1-8b-instant"
): Promise<string | null> => {
  const key = apiKey || (import.meta as any).env?.VITE_GROQ_API_KEY;
  
  if (!key) {
    throw new Error("Groq API key not configured");
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
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
      throw new Error(`Groq API error: ${response.statusText}`);
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
    console.error('[Groq] Error fixing code:', error);
    throw error;
  }
};
