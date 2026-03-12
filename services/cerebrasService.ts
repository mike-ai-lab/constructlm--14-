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
      max_tokens: maxTokens,
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

/**
 * Fix code that has errors - minimal tokens, patch-mode only
 */
export const fixCodeError = async (
  code: string,
  errorMessage: string,
  apiKey?: string,
  model: string = "llama3.1-8b"
): Promise<string | null> => {
  const key = apiKey || (import.meta as any).env?.VITE_CEREBRAS_API_KEY;
  
  if (!key) {
    throw new Error("Cerebras API key not configured");
  }

  try {
    const response = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
        stream: false,
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
      throw new Error(`Cerebras API error: ${response.statusText}`);
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
    console.error('[Cerebras] Error fixing code:', error);
    throw error;
  }
};
