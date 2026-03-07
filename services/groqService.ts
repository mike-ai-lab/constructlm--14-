import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq model registry - all verified working models
export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "VERSATILE"] },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B Versatile", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "VERSATILE"] },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "FAST"] },
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", vision: true, text: true, multimodal: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", vision: true, text: true, multimodal: true, context: "128K", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "COMPACT"] },
  { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B", vision: false, text: true, multimodal: false, context: "128K", tags: ["TEXT", "COMPACT"] },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", vision: false, text: true, multimodal: false, context: "32K", tags: ["TEXT", "MOE"] },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", vision: false, text: true, multimodal: false, context: "8K", tags: ["TEXT"] },
  { id: "gemma-7b-it", name: "Gemma 7B", vision: false, text: true, multimodal: false, context: "8K", tags: ["TEXT"] },
  { id: "llama-guard-3-8b", name: "Llama Guard 3 8B", vision: false, text: true, multimodal: false, context: "8K", tags: ["SAFETY", "MODERATION"] }
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
  if (imageBase64 && model.includes('vision')) {
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

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
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
    throw new Error(`Groq API error: ${errorText}`);
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
