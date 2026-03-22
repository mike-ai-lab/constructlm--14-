/**
 * embeddingService.ts
 * Proxy service that communicates with Web Worker for embeddings
 * Keeps UI responsive by running Transformers.js in a separate thread
 */

type ModelStatus = 'not-loaded' | 'downloading' | 'ready';
type StatusListener = (status: ModelStatus) => void;

type WorkerMessage = 
  | { type: 'load' }
  | { type: 'embed', text: string, id: number }
  | { type: 'embedBatch', texts: string[], id: number }
  | { type: 'getStatus' };

type WorkerResponse =
  | { type: 'status', status: ModelStatus }
  | { type: 'loadComplete' }
  | { type: 'loadError', error: string }
  | { type: 'embedResult', embedding: number[], id: number }
  | { type: 'embedBatchResult', embeddings: number[][], id: number }
  | { type: 'embedBatchProgress', current: number, total: number, id: number }
  | { type: 'embedError', error: string, id: number };

class EmbeddingService {
  private worker: Worker | null = null;
  private status: ModelStatus = 'not-loaded';
  private listeners: Set<StatusListener> = new Set();
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    onProgress?: (current: number, total: number) => void;
  }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL('./embeddingWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (error) => {
        console.error('[EmbeddingService] Worker error:', error);
        this.setStatus('not-loaded');
      };

      // Don't request status - worker will send it automatically after initialization
    } catch (error) {
      console.error('[EmbeddingService] Failed to create worker:', error);
      this.setStatus('not-loaded');
    }
  }

  private handleWorkerMessage(message: WorkerResponse) {
    switch (message.type) {
      case 'status':
        console.log('[EmbeddingService] Status update:', message.status);
        this.setStatus(message.status);
        break;

      case 'loadComplete':
        console.log('[EmbeddingService] Model loaded successfully');
        break;

      case 'loadError':
        console.error('[EmbeddingService] Model load error:', message.error);
        break;

      case 'embedResult': {
        const request = this.pendingRequests.get(message.id);
        if (request) {
          request.resolve(message.embedding);
          this.pendingRequests.delete(message.id);
        }
        break;
      }

      case 'embedBatchResult': {
        const request = this.pendingRequests.get(message.id);
        if (request) {
          request.resolve(message.embeddings);
          this.pendingRequests.delete(message.id);
        }
        break;
      }

      case 'embedBatchProgress': {
        const request = this.pendingRequests.get(message.id);
        if (request && request.onProgress) {
          request.onProgress(message.current, message.total);
        }
        break;
      }

      case 'embedError': {
        const request = this.pendingRequests.get(message.id);
        if (request) {
          request.reject(new Error(message.error));
          this.pendingRequests.delete(message.id);
        }
        break;
      }
    }
  }

  getStatus(): ModelStatus {
    return this.status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: ModelStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => listener(status));
    }
  }

  async loadModel(): Promise<void> {
    if (this.status === 'ready') return;
    
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      // Listen for load complete
      const checkStatus = () => {
        if (this.status === 'ready') {
          this.pendingRequests.delete(id);
          resolve();
        } else if (this.status === 'not-loaded') {
          this.pendingRequests.delete(id);
          reject(new Error('Model failed to load'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      this.worker!.postMessage({ type: 'load' } as WorkerMessage);
      checkStatus();
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({ 
        type: 'embed', 
        text, 
        id 
      } as WorkerMessage);
    });
  }

  async getEmbeddings(
    texts: string[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<number[][]> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject, onProgress });
      this.worker!.postMessage({ 
        type: 'embedBatch', 
        texts, 
        id 
      } as WorkerMessage);
    });
  }

  // Cleanup method
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
    this.listeners.clear();
  }
}

export const embeddingService = new EmbeddingService();
