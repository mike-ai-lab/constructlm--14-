import { ChatMessage, Citation } from "../types";

// Using text-embedding-004 as it is a standard stable model.
const EMBEDDING_MODEL = "text-embedding-004";
const CHAT_MODEL = "gemini-3-flash-preview";

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
  apiKey?: string
) => {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  
  if (!key) {
    throw new Error("Gemini API key not configured");
  }

  const GenAI = await loadGoogleGenAI();
  const ai = new GenAI({ apiKey: key });
  // Format context for the system instruction
  const contextString = context.map((c, i) => 
    `[SOURCE ${i + 1} - ${c.docName}]
${c.text}
[END SOURCE ${i + 1}]
---`
  ).join('\n');

  const systemInstruction = `
You are ConstructLM, an intelligent research assistant.

CRITICAL INSTRUCTIONS:
1. You have been provided with ${context.length} SOURCES from DIFFERENT FILES below
2. Each source is clearly marked with [SOURCE N - filename]
3. You MUST review ALL sources before answering
4. If information exists in ANY source, use it - don't say you don't have information if it's in one of the sources
5. When citing, mention the source number AND filename (e.g., "According to Source 2 (technical_spec.txt)...")
6. If multiple sources have relevant info, synthesize them together
7. Only say you don't know if the information is truly not in ANY of the provided sources

Keep responses professional, objective, and concise.
  `;

  const fullPrompt = `
Context Information:
${contextString}

User Question: ${message}
  `;

  // Filter history to simple format for the API
  const chatHistory = history
    .filter(h => !h.isStreaming) // Skip current streaming
    .map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    }));

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: systemInstruction,
    },
    history: chatHistory
  });

  const result = await chat.sendMessageStream({
    message: fullPrompt
  });

  for await (const chunk of result) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
};