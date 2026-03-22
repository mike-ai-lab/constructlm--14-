export interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: number;
  status: 'processing' | 'ready' | 'error';
  tokenCount?: number;
  isEnabled?: boolean; // Default true - controls if file is included in RAG search
  content?: string; // Original file content for preview (text/markdown)
  fileData?: string; // Base64 encoded file data for binary files (PDF, images, etc.)
}

export type ModelStatus = 'not-loaded' | 'downloading' | 'ready';

export interface TextChunk {
  id: string;
  docId: string;
  text: string;
  vector: number[];
  startIndex: number;
  endIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  citations?: Citation[];
  inputTokens?: number;
  outputTokens?: number;
  reasoning?: string; // Thinking/reasoning process for reasoning models
  metadata?: {
    imageBase64?: string;
    activeSources?: string[];
    isErrorFix?: boolean;
    errorCode?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
  canvasState?: {
    isOpen: boolean;
    content: {
      html: string;
      code: string;
      language: string;
      blockId: string;
    } | null;
    showCode: boolean;
    editedCode: string;
    versions?: Array<{ code: string; timestamp: number }>;
    currentVersionIndex?: number;
  };
}

export interface Citation {
  docId: string;
  docName: string;
  text: string;
  similarity: number;
}

export interface ProcessingStats {
  filesProcessed: number;
  totalTokens: number;
}
