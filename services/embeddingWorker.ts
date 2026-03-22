/**
 * embeddingWorker.ts
 * Web Worker for running Transformers.js embeddings off the main thread
 * Prevents UI freezing during embedding generation
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js for browser use
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.proxy = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const TIMEOUT_MS = 60000;
const MODEL_DB_NAME = 'ConstructLM_Models';
const MODEL_DB_VERSION = 1;
const MODEL_STORE_NAME = 'model_files';

// IndexedDB for persistent model storage
const openModelDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODEL_DB_NAME, MODEL_DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MODEL_STORE_NAME)) {
        db.createObjectStore(MODEL_STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeModelFile = async (url: string, data: ArrayBuffer): Promise<void> => {
  const db = await openModelDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE_NAME, 'readwrite');
    const store = tx.objectStore(MODEL_STORE_NAME);
    store.put({ url, data, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getModelFile = async (url: string): Promise<ArrayBuffer | null> => {
  const db = await openModelDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE_NAME, 'readonly');
    const store = tx.objectStore(MODEL_STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
};

const persistentFetch = async (url: string): Promise<Response> => {
  const cached = await getModelFile(url);
  if (cached) {
    console.log(`[Worker] Loading model file from persistent storage: ${url.split('/').pop()}`);
    return new Response(cached, {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }

  console.log(`[Worker] Downloading model file: ${url.split('/').pop()}`);
  // Use originalFetch to avoid infinite loop
  const response = await originalFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const data = await response.arrayBuffer();
  await storeModelFile(url, data);
  console.log(`[Worker] Saved to persistent storage: ${url.split('/').pop()}`);

  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/octet-stream' }
  });
};

// Override fetch for Transformers.js
const originalFetch = globalThis.fetch;
const setupPersistentCache = () => {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (url.includes('huggingface.co') && (url.includes('.onnx') || url.includes('.json') || url.includes('config'))) {
      try {
        return await persistentFetch(url);
      } catch (error) {
        console.warn('[Worker] Persistent cache failed, falling back to normal fetch:', error);
        return originalFetch(input, init);
      }
    }
    
    return originalFetch(input, init);
  };
};

setupPersistentCache();

// Worker state
let embeddingPipeline: any = null;
let isLoading = false;
let initialStatusChecked = false;

// Check if model is already cached in IndexedDB
async function checkModelCached(): Promise<boolean> {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MODEL_STORE_NAME, 'readonly');
      const store = tx.objectStore(MODEL_STORE_NAME);
      const request = store.count();
      request.onsuccess = () => {
        // If we have any cached files, model is available
        resolve(request.result > 0);
      };
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
}

// Message types
type WorkerMessage = 
  | { type: 'load' }
  | { type: 'embed', text: string, id: number }
  | { type: 'embedBatch', texts: string[], id: number }
  | { type: 'getStatus' };

type WorkerResponse =
  | { type: 'status', status: 'not-loaded' | 'downloading' | 'ready' }
  | { type: 'loadComplete' }
  | { type: 'loadError', error: string }
  | { type: 'embedResult', embedding: number[], id: number }
  | { type: 'embedBatchResult', embeddings: number[][], id: number }
  | { type: 'embedBatchProgress', current: number, total: number, id: number }
  | { type: 'embedError', error: string, id: number };

// Load model
async function loadModel() {
  if (embeddingPipeline) {
    postMessage({ type: 'status', status: 'ready' } as WorkerResponse);
    return;
  }
  
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isLoading = true;
  
  // Check if model is cached
  const isCached = await checkModelCached();
  if (isCached) {
    console.log('[Worker] Loading cached model from IndexedDB...');
    postMessage({ type: 'status', status: 'ready' } as WorkerResponse);
  } else {
    console.log('[Worker] Downloading model for first time...');
    postMessage({ type: 'status', status: 'downloading' } as WorkerResponse);
  }
  
  try {
    const startTime = Date.now();
    
    const loadPromise = pipeline('feature-extraction', MODEL_NAME);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Model download timeout')), TIMEOUT_MS)
    );
    
    embeddingPipeline = await Promise.race([loadPromise, timeoutPromise]);
    
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Worker] Model loaded in ${loadTime}s`);
    
    postMessage({ type: 'status', status: 'ready' } as WorkerResponse);
    postMessage({ type: 'loadComplete' } as WorkerResponse);
  } catch (error) {
    console.error('[Worker] Failed to load model:', error);
    postMessage({ 
      type: 'loadError', 
      error: error instanceof Error ? error.message : String(error) 
    } as WorkerResponse);
    postMessage({ type: 'status', status: 'not-loaded' } as WorkerResponse);
  } finally {
    isLoading = false;
  }
}

// Generate single embedding
async function generateEmbedding(text: string, id: number) {
  if (!embeddingPipeline) {
    await loadModel();
  }

  try {
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true
    });

    const embedding = Array.from(output.data);
    postMessage({ type: 'embedResult', embedding, id } as WorkerResponse);
  } catch (error) {
    postMessage({ 
      type: 'embedError', 
      error: error instanceof Error ? error.message : String(error),
      id 
    } as WorkerResponse);
  }
}

// Generate batch of embeddings with progress
async function generateEmbeddingBatch(texts: string[], id: number) {
  if (!embeddingPipeline) {
    await loadModel();
  }

  try {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const output = await embeddingPipeline(texts[i], {
        pooling: 'mean',
        normalize: true
      });
      
      embeddings.push(Array.from(output.data));
      
      // Send progress update
      postMessage({ 
        type: 'embedBatchProgress', 
        current: i + 1, 
        total: texts.length,
        id 
      } as WorkerResponse);
    }
    
    postMessage({ type: 'embedBatchResult', embeddings, id } as WorkerResponse);
  } catch (error) {
    postMessage({ 
      type: 'embedError', 
      error: error instanceof Error ? error.message : String(error),
      id 
    } as WorkerResponse);
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  
  switch (message.type) {
    case 'load':
      await loadModel();
      break;
      
    case 'embed':
      await generateEmbedding(message.text, message.id);
      break;
      
    case 'embedBatch':
      await generateEmbeddingBatch(message.texts, message.id);
      break;
      
    case 'getStatus':
      const status = embeddingPipeline ? 'ready' : isLoading ? 'downloading' : 'not-loaded';
      postMessage({ type: 'status', status } as WorkerResponse);
      break;
  }
};

// Initialize: Check if model is cached and send appropriate initial status
(async () => {
  const isCached = await checkModelCached();
  if (isCached) {
    console.log('[Worker] Model files found in cache - ready to load');
    postMessage({ type: 'status', status: 'ready' } as WorkerResponse);
  } else {
    console.log('[Worker] No cached model files found');
    postMessage({ type: 'status', status: 'not-loaded' } as WorkerResponse);
  }
  initialStatusChecked = true;
})();
