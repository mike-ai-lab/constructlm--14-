import { ChatMessage, Citation } from "../types";
import { validateAndFixCitations, logCitationValidation } from "./citationValidator";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string, isReasoning?: boolean) => void,
  apiKey?: string,
  model: string = "llama3.1-8b",
  imageBase64?: string // Accept but ignore (Cerebras doesn't support vision)
) => {
  const key = apiKey || (import.meta as any).env?.VITE_CEREBRAS_API_KEY;
  
  if (!key) {
    throw new Error("Cerebras API key not configured");
  }

  // Warn if image provided (not supported)
  if (imageBase64) {
    console.warn('Cerebras does not support vision. Switch to Gemini for image analysis.');
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

  const response = await fetch(CEREBRAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "X-Cerebras-Version-Patch": "2" // API version 2 (default since July 2026)
    },
    body: JSON.stringify({
      model: model,
      messages,
      stream: true,
      max_tokens: 8000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cerebras API error details:', errorText);
    throw new Error(`Cerebras API error (${response.status}): ${response.statusText} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let isInReasoningBlock = false;
  let reasoningBuffer = '';
  let answerBuffer = '';

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
            // Check for reasoning markers (common patterns in reasoning models)
            if (content.includes('<think>') || content.includes('<reasoning>')) {
              isInReasoningBlock = true;
              reasoningBuffer += content.replace(/<think>|<reasoning>/g, '');
              continue;
            }
            
            if (content.includes('</think>') || content.includes('</reasoning>')) {
              isInReasoningBlock = false;
              reasoningBuffer += content.replace(/<\/think>|<\/reasoning>/g, '');
              // Send accumulated reasoning
              if (reasoningBuffer.trim()) {
                onChunk(reasoningBuffer, true);
                reasoningBuffer = '';
              }
              continue;
            }
            
            if (isInReasoningBlock) {
              reasoningBuffer += content;
            } else {
              // Regular content
              onChunk(content, false);
            }
          }
        } catch (e) {
          console.error("Parse error:", e);
        }
      }
    }
  }
  
  // Flush any remaining reasoning
  if (reasoningBuffer.trim()) {
    onChunk(reasoningBuffer, true);
  }
};

/**
 * Validate and fix response citations
 * Called after streaming completes to ensure consistency
 */
export const validateResponseCitations = (text: string): string => {
  const { text: fixedText, result } = validateAndFixCitations(text);
  
  // Log validation for monitoring
  logCitationValidation(fixedText, 'Cerebras');
  
  // If there were fixes, log them
  if (result.fixedText) {
    console.warn('[Cerebras] Citations were auto-fixed:', result.errors);
  }
  
  return fixedText;
};
