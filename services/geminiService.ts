import { ChatMessage, Citation } from "../types";

// Updated to use correct Gemini 2.5 models
const EMBEDDING_MODEL = "models/text-embedding-004"; // Add models/ prefix
const DEFAULT_CHAT_MODEL = "gemini-2.5-flash"; // Updated to working model

// Model options available to users - VERIFIED WORKING MODELS ONLY
export const GEMINI_MODELS = [
  { id: "gemini-flash-latest", name: "Gemini Flash (Latest)", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "FAST"] },
];

export const CEREBRAS_MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", vision: false, text: true, multimodal: false, context: "128K tokens", tags: ["TEXT", "FAST"], reasoning: false },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", vision: false, text: true, multimodal: false, context: "128K tokens", tags: ["TEXT", "ADVANCED"], reasoning: false },
];

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", context: "128K tokens", tags: ["TEXT", "FAST"] },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B Versatile", context: "128K tokens", tags: ["TEXT", "FAST"] },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", context: "128K tokens", tags: ["TEXT", "INSTANT"] },
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", context: "128K tokens", tags: ["VISION", "ADVANCED"], vision: true },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", context: "128K tokens", tags: ["VISION"], vision: true },
  { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B", context: "128K tokens", tags: ["TEXT", "COMPACT"] },
  { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B", context: "128K tokens", tags: ["TEXT", "COMPACT"] },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", context: "32K tokens", tags: ["TEXT", "MOE"] },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", context: "8K tokens", tags: ["TEXT"] },
  { id: "gemma-7b-it", name: "Gemma 7B", context: "8K tokens", tags: ["TEXT"] },
  { id: "llama-guard-3-8b", name: "Llama Guard 3 8B", context: "8K tokens", tags: ["SAFETY"] },
];

export const OPENROUTER_MODELS = [
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B", context: "131K tokens", tags: ["GENERAL"] },
  { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash", context: "256K tokens", tags: ["GENERAL"] },
  { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5-Air", context: "131K tokens", tags: ["GENERAL"] },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large", context: "131K tokens", tags: ["REASONING"] },
  { id: "arcee-ai/trinity-mini:free", name: "Arcee Trinity Mini", context: "131K tokens", tags: ["REASONING"] },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "LFM 2.5 Thinking", context: "32K tokens", tags: ["REASONING"], reasoning: true },
  { id: "liquid/lfm-2.5-1.2b-instruct:free", name: "LFM 2.5 Instruct", context: "32K tokens", tags: ["REASONING"] },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B VL", context: "128K tokens", tags: ["MULTIMODAL"], vision: true },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", context: "131K tokens", tags: ["MULTIMODAL"] },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B", context: "33K tokens", tags: ["MULTIMODAL"] },
  { id: "google/gemma-3-4b-it:free", name: "Gemma 3 4B", context: "33K tokens", tags: ["MULTIMODAL"] },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B", context: "256K tokens", tags: ["AGENTS"] },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron Nano 9B V2", context: "128K tokens", tags: ["AGENTS"] },
  { id: "google/gemma-3n-e2b-it:free", name: "Gemma 3N E2B", context: "33K tokens", tags: ["COMPACT"] },
  { id: "google/gemma-3n-e4b-it:free", name: "Gemma 3N E4B", context: "33K tokens", tags: ["COMPACT"] },
];

// Lazy load GoogleGenAI to avoid initialization errors
let GoogleGenAI: any = null;
const loadGoogleGenAI = async () => {
  if (!GoogleGenAI) {
    const module = await import("@google/genai");
    GoogleGenAI = module.GoogleGenAI;
  }
  return GoogleGenAI;
};

export const getEmbeddings = async (texts: string[], apiKey?: string): Promise<number[][]> => {
  const key = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!key) {
    throw new Error("Gemini API key not configured");
  }

  const GenAI = await loadGoogleGenAI();
  const ai = new GenAI({ apiKey: key });
  
  if (!texts.length) return [];
  
  const embeddings: number[][] = [];
  // Use a small batch size for parallel requests
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    
    const chunkPromises = chunk.map(text => 
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: { parts: [{ text }] }
      })
      .then(response => {
        // The API returns 'embeddings' which is an array of ContentEmbedding.
        // Since we send one content, we take the first embedding.
        if (response.embeddings?.[0]?.values) {
          return response.embeddings[0].values;
        }
        console.warn("Empty embedding returned");
        return [];
      })
      .catch(error => {
        console.error("Embedding error:", error);
        return [];
      })
    );

    const results = await Promise.all(chunkPromises);
    embeddings.push(...results);
  }
  return embeddings;
};

export const streamChatResponse = async (
  message: string,
  history: ChatMessage[],
  context: Citation[],
  onChunk: (text: string) => void,
  apiKey?: string,
  model: string = DEFAULT_CHAT_MODEL,
  imageBase64?: string // Add image support
) => {
  const key = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!key) {
    throw new Error("Gemini API key not configured");
  }

  // Use REST API for better compatibility with vision
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
  
  // Format context for the system instruction
  const contextString = context.map((c, i) => 
    `[SOURCE ${i + 1} - ${c.docName}]\n${c.text}\n[END SOURCE ${i + 1}]\n---`
  ).join('\n');

  const systemInstruction = `You are ConstructLM, an intelligent assistant for construction professionals.

CRITICAL INSTRUCTIONS:
1. You have been provided with ${context.length} SOURCES from DIFFERENT FILES below
2. Each source is clearly marked with [SOURCE N - filename]
3. You MUST review ALL sources before answering
4. If information exists in ANY source, use it
5. When citing, mention the source number AND filename
6. If multiple sources have relevant info, synthesize them together
7. For construction images: analyze materials, techniques, safety, code compliance
8. For blueprints: identify dimensions, systems, potential issues

Keep responses professional, objective, and detailed for construction context.

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

Canvas renders this immediately - no setup needed.`;

  const fullPrompt = contextString 
    ? `Context Information:\n${contextString}\n\nUser Question: ${message}`
    : message;

  // Build content parts
  const parts: any[] = [{ text: systemInstruction + "\n\n" + fullPrompt }];
  
  // Add images if provided (handle multiple images separated by commas)
  if (imageBase64) {
    const images = imageBase64.split(',');
    images.forEach(img => {
      if (img.trim()) {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: img.trim()
          }
        });
      }
    });
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Stream character by character without delays
  for (let i = 0; i < text.length; i += 3) {
    onChunk(text.slice(i, i + 3));
  }
};

// Token estimation utility
export const estimateTokens = (text: string, imageBase64?: string): number => {
  // Text: ~4 chars per token
  const textTokens = Math.ceil(text.length / 4);
  
  // Image: base64 length / 1.33 to get bytes, then ~258 tokens per image
  const imageTokens = imageBase64 ? Math.ceil((imageBase64.length / 1.33) / 1024 * 258 / 1024) : 0;
  
  return textTokens + imageTokens;
};