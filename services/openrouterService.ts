import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter model registry - all verified working models
export const OPENROUTER_MODELS = [
  // General
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash", vision: false, text: true, multimodal: false, context: "256K", tags: ["TEXT", "GENERAL"] },
  { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5-Air", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "GENERAL"] },
  
  // Reasoning
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "REASONING"] },
  { id: "arcee-ai/trinity-mini:free", name: "Arcee Trinity Mini", vision: false, text: true, multimodal: false, context: "131K", tags: ["TEXT", "REASONING"] },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "LFM 2.5 Thinking", vision: false, text: true, multimodal: false, context: "32K", tags: ["TEXT", "REASONING"] },
  { id: "liquid/lfm-2.5-1.2b-instruct:free", name: "LFM 2.5 Instruct", vision: false, text: true, multimodal: false, context: "32K", tags: ["TEXT", "REASONING"] },
  
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
      max_tokens: 8000,
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
