import { TextChunk, FileDocument, Citation } from "../types";
import { embeddingService } from "./embeddingService";
import { parsePDF } from "./pdfParser";

// --- Constants ---
const DB_NAME = "ConstructLM_DB";
const DB_VERSION = 1;
const CHUNK_SIZE = 1000; // Increased from 500 to 1000 characters for better context
const OVERLAP = 200; // Increased from 50 to 200 characters for better continuity

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

  return new Promise(async (resolve, reject) => {
    try {
      let text: string;
      
      // Handle different file types
      if (file.type === 'application/pdf') {
        onProgress("Parsing PDF...");
        text = await parsePDF(file);
      } else {
        // Handle text-based files
        const reader = new FileReader();
        text = await new Promise<string>((resolveText, rejectText) => {
          reader.onload = (e) => resolveText(e.target?.result as string);
          reader.onerror = () => rejectText(new Error('Failed to read file'));
          reader.readAsText(file);
        });
      }
      
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
        tokenCount: text.length / 4, // Rough estimate
        isEnabled: true // Default to enabled
      };

      tx.objectStore('files').add(docData);
      chunks.forEach(chunk => tx.objectStore('chunks').add(chunk));

      tx.oncomplete = () => resolve(docData);
      tx.onerror = () => reject(tx.error);
      
    } catch (err) {
      reject(err);
    }
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
  
  // Filter to only enabled files (default to true for backward compatibility)
  const enabledFileIds = new Set(
    allFiles
      .filter(f => f.isEnabled !== false)
      .map(f => f.id)
  );
  
  // Filter chunks to only include those from enabled files
  const enabledChunks = allChunks.filter(chunk => enabledFileIds.has(chunk.docId));
  
  console.log(`Searching across ${enabledChunks.length} chunks from ${enabledFileIds.size} enabled files (${allFiles.length} total)`);
  
  const fileMap = new Map(allFiles.map(f => [f.id, f.name]));

  // 3. Calculate Sim (only on enabled chunks)
  const scored = enabledChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector)
  }));

  // 4. Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Debug: Show top scores before filtering with full text preview
  console.log('Top 10 scores before filtering:');
  scored.slice(0, 10).forEach((c, i) => {
    console.log(`  ${i+1}. ${fileMap.get(c.docId)} (score: ${c.score.toFixed(3)})`);
    console.log(`     Text: "${c.text.substring(0, 150)}${c.text.length > 150 ? '...' : ''}"`);
  });
  
  // 5. Filter by minimum relevance threshold first
  const RELEVANCE_THRESHOLD = 0.15; // Lowered from 0.25 - embedding models can have lower scores
  const relevantChunks = scored.filter(chunk => chunk.score >= RELEVANCE_THRESHOLD);
  
  console.log(`Found ${relevantChunks.length} relevant chunks (threshold: ${RELEVANCE_THRESHOLD})`);
  
  // If no relevant chunks found, return top results anyway (fallback)
  if (relevantChunks.length === 0) {
    console.warn('No chunks above threshold - returning top results as fallback');
    return scored.slice(0, Math.min(limit, scored.length)).map(chunk => ({
      docId: chunk.docId,
      docName: fileMap.get(chunk.docId) || 'Unknown',
      text: chunk.text,
      similarity: chunk.score
    }));
  }
  
  // 6. Diversify among relevant results only
  const topK: typeof scored = [];
  const filesUsed = new Set<string>();
  const maxPerFile = 3; // Allow up to 3 chunks from same file if highly relevant
  
  // First pass: get best chunk from each file (only if relevant)
  for (const item of relevantChunks) {
    if (topK.length >= limit) break;
    if (!filesUsed.has(item.docId)) {
      topK.push(item);
      filesUsed.add(item.docId);
    }
  }
  
  // Second pass: fill remaining slots with best scores (prioritize quality over diversity)
  for (const item of relevantChunks) {
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

export const updateFileEnabled = async (id: string, isEnabled: boolean): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const file = getRequest.result;
      if (file) {
        file.isEnabled = isEnabled;
        store.put(file);
      }
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
