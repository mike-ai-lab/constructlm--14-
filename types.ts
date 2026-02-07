export interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: number;
  status: 'processing' | 'ready' | 'error';
  tokenCount?: number;
}

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
