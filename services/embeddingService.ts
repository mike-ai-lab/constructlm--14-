/**
 * embeddingService.ts
 * LOCAL EMBEDDINGS using Transformers.js (Xenova)
 * 100% privacy-first, zero API costs, runs in browser
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js for browser use
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

class EmbeddingService {
  private pipeline: any = null;
  private isLoading: boolean = false;

  async loadModel(): Promise<void> {
    if (this.pipeline) return;
    if (this.isLoading) {
      // Wait for existing load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;
    console.log('🔄 Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    
    try {
      this.pipeline = await pipeline('feature-extraction', MODEL_NAME);
      console.log('✅ Embedding model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.pipeline) await this.loadModel();

    const output = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data);
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.pipeline) await this.loadModel();

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      try {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      } catch (error) {
        console.error('Embedding error:', error);
        embeddings.push([]);
      }
    }

    return embeddings;
  }
}

export const embeddingService = new EmbeddingService();
