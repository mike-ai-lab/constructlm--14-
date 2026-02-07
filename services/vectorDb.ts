import { TextChunk, FileDocument, Citation } from "../types";
import { embeddingService } from "./embeddingService";

// --- Constants ---
const DB_NAME = "ConstructLM_DB";
const DB_VERSION = 1;
const CHUNK_SIZE = 500; // characters approx, simple chunking
const OVERLAP = 50;

// --- IDB Helper ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chunks')) {
        const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
        chunkStore.createIndex('docId', 'docId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Vector Math ---
const dotProduct = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
};

const magnitude = (a: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
  return Math.sqrt(sum);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};

// --- Processing Logic ---

const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
};

export const processFile = async (
  file: File, 
  onProgress: (status: string) => void
): Promise<FileDocument> => {
  const fileId = crypto.randomUUID();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        
        onProgress("Chunking content...");
        const rawChunks = chunkText(text);
        
        onProgress(`Embedding ${rawChunks.length} chunks...`);
        const vectors = await embeddingService.getEmbeddings(rawChunks);
        
        const chunks: TextChunk[] = rawChunks.map((chunk, i) => ({
          id: crypto.randomUUID(),
          docId: fileId,
          text: chunk,
          vector: vectors[i],
          startIndex: i * (CHUNK_SIZE - OVERLAP),
          endIndex: i * (CHUNK_SIZE - OVERLAP) + chunk.length
        }));

        onProgress("Indexing...");
        const db = await openDB();
        const tx = db.transaction(['files', 'chunks'], 'readwrite');
        
        const docData: FileDocument = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: Date.now(),
          status: 'ready',
          tokenCount: text.length / 4 // Rough estimate
        };

        tx.objectStore('files').add(docData);
        chunks.forEach(chunk => tx.objectStore('chunks').add(chunk));

        tx.oncomplete = () => resolve(docData);
        tx.onerror = () => reject(tx.error);
        
      } catch (err) {
        reject(err);
      }
    };
    
    // Naive text handling for demo. 
    // In production, we'd use pdf.js for PDFs, etc.
    reader.readAsText(file);
  });
};

export const searchVectors = async (query: string, limit = 5): Promise<Citation[]> => {
  // 1. Embed query using local model
  const queryVector = await embeddingService.generateEmbedding(query);
  if (!queryVector || queryVector.length === 0) return [];

  const db = await openDB();
  
  // 2. Get all chunks (Full scan is fine for < 10MB text in browser)
  const allChunks = await new Promise<TextChunk[]>((resolve, reject) => {
    const request = db.transaction('chunks', 'readonly').objectStore('chunks').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const allFiles = await new Promise<FileDocument[]>((resolve, reject) => {
    const request = db.transaction('files', 'readonly').objectStore('files').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  console.log(`Searching across ${allChunks.length} chunks from ${allFiles.length} files`);
  
  const fileMap = new Map(allFiles.map(f => [f.id, f.name]));

  // 3. Calculate Sim
  const scored = allChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector)
  }));

  // 4. Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // 5. Diversify results - ensure we get chunks from different files
  const topK: typeof scored = [];
  const filesUsed = new Set<string>();
  const maxPerFile = Math.ceil(limit / Math.min(allFiles.length, 3)); // Max 2-3 chunks per file
  
  // First pass: get best chunk from each file
  for (const item of scored) {
    if (topK.length >= limit) break;
    if (!filesUsed.has(item.docId)) {
      topK.push(item);
      filesUsed.add(item.docId);
    }
  }
  
  // Second pass: fill remaining slots with best scores
  for (const item of scored) {
    if (topK.length >= limit) break;
    if (!topK.includes(item)) {
      const fileCount = topK.filter(t => t.docId === item.docId).length;
      if (fileCount < maxPerFile) {
        topK.push(item);
      }
    }
  }
  
  console.log('Top results (diversified):', topK.map(c => ({ 
    file: fileMap.get(c.docId), 
    score: c.score.toFixed(3),
    preview: c.text.substring(0, 50) 
  })));

  return topK.map(chunk => ({
    docId: chunk.docId,
    docName: fileMap.get(chunk.docId) || 'Unknown',
    text: chunk.text,
    similarity: chunk.score
  }));
};

export const getAllFiles = async (): Promise<FileDocument[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files', 'readonly').objectStore('files').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFile = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['files', 'chunks'], 'readwrite');
  
  tx.objectStore('files').delete(id);
  
  // Delete chunks efficiently? IDB doesn't support deleteByQuery easily without cursor
  // Using cursor for correctness
  const chunkStore = tx.objectStore('chunks');
  const index = chunkStore.index('docId');
  const request = index.openCursor(IDBKeyRange.only(id));
  
  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
