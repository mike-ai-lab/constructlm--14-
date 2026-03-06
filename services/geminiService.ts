import { ChatMessage, Citation } from "../types";

// Updated to use correct Gemini 2.5 models
const EMBEDDING_MODEL = "models/text-embedding-004"; // Add models/ prefix
const DEFAULT_CHAT_MODEL = "gemini-2.5-flash"; // Updated to working model

// Model options available to users
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "MULTIMODAL"] },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", vision: true, text: true, multimodal: true, context: "2M tokens", tags: ["VISION", "TEXT", "MULTIMODAL", "ADVANCED"] },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "FAST"] },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", vision: true, text: true, multimodal: true, context: "1M tokens", tags: ["VISION", "TEXT", "MULTIMODAL"] },
];

export const CEREBRAS_MODELS = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", vision: false, text: true, multimodal: false, context: "128K tokens", tags: ["TEXT", "FAST"] },
  { id: "gpt-oss-120b", name: "GPT OSS 120B", vision: false, text: true, multimodal: false, context: "128K tokens", tags: ["TEXT", "ADVANCED"] },
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
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  
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
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  
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

Keep responses professional, objective, and detailed for construction context.`;

  const fullPrompt = contextString 
    ? `Context Information:\n${contextString}\n\nUser Question: ${message}`
    : message;

  // Build content parts
  const parts: any[] = [{ text: systemInstruction + "\n\n" + fullPrompt }];
  
  // Add image if provided
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
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