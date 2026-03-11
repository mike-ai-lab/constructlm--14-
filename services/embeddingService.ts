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

// Try alternative CDN if HuggingFace is blocked/slow
env.backends.onnx.wasm.proxy = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const TIMEOUT_MS = 30000; // 30 second timeout for model download

class EmbeddingService {
  private pipeline: any = null;
  private isLoading: boolean = false;

  async loadModel(): Promise<void> {
    if (this.pipeline) return;
    if (this.isLoading) {
      // Wait for existing load to complete
      console.log('⏳ Waiting for model to finish loading...');
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;
    console.log('🔄 Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    console.log('📊 This may take 30-60 seconds on first load (downloading ~90MB model)...');
    console.log('🌐 Downloading from HuggingFace CDN...');
    
    try {
      const startTime = Date.now();
      
      // Add timeout wrapper
      const loadPromise = pipeline('feature-extraction', MODEL_NAME);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model download timeout - check your internet connection')), TIMEOUT_MS)
      );
      
      this.pipeline = await Promise.race([loadPromise, timeoutPromise]);
      
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Embedding model loaded successfully in ${loadTime}s`);
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      console.error('💡 Possible causes:');
      console.error('   1. Internet connection issue');
      console.error('   2. HuggingFace CDN blocked/slow');
      console.error('   3. Firewall blocking model download');
      console.error('💡 Solution: Check your internet connection and try again');
      throw new Error(`Failed to load embedding model: ${error.message}. Please check your internet connection.`);
    } finally {
      this.isLoading = false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.pipeline) await this.loadModel();

    try {
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true
      });

      return Array.from(output.data);
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async getEmbeddings(
    texts: string[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<number[][]> {
    if (!this.pipeline) await this.loadModel();

    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.generateEmbedding(texts[i]);
        embeddings.push(embedding);
        
        // Report progress every chunk
        if (onProgress) {
          onProgress(i + 1, texts.length);
        }
      } catch (error) {
        console.error('Embedding error:', error);
        embeddings.push([]);
      }
    }

    return embeddings;
  }
}

export const embeddingService = new EmbeddingService();
