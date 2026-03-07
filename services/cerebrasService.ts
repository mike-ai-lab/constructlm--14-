import { ChatMessage, Citation } from "../types";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
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

CRITICAL INSTRUCTIONS:
1. You have been provided with ${context.length} SOURCES from DIFFERENT FILES below
2. Each source is clearly marked with [SOURCE N - filename]
3. You MUST review ALL sources before answering
4. If information exists in ANY source, use it - don't say you don't have information if it's in one of the sources
5. When citing, mention the source number AND filename (e.g., "According to Source 2 (technical_spec.txt)...")
6. If multiple sources have relevant info, synthesize them together
7. Only say you don't know if the information is truly not in ANY of the provided sources

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
      "Authorization": `Bearer ${key}`
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
    throw new Error(`Cerebras API error: ${response.statusText}`);
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
