// Vector Store implementation for AI-powered search and matching
// This module provides vector database functionality for resume and job matching

interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface SearchResult {
  document: VectorDocument;
  score: number;
}

export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    // Initialize in-memory vector store
    // In production, this would connect to a proper vector database like Pinecone, Weaviate, or Chroma
  }

  /**
   * Add a document to the vector store
   */
  async addDocument(document: VectorDocument): Promise<void> {
    try {
      // Store the document
      this.documents.set(document.id, document);

      // Generate embedding if not provided
      if (!document.embedding) {
        document.embedding = await this.generateEmbedding(document.content);
      }

      // Store the embedding
      this.embeddings.set(document.id, document.embedding);
    } catch (error) {
      console.error('Error adding document to vector store:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Calculate similarity scores
      const results: SearchResult[] = [];

      for (const [id, embedding] of this.embeddings.entries()) {
        const document = this.documents.get(id);
        if (!document) continue;

        const score = this.cosineSimilarity(queryEmbedding, embedding);
        results.push({ document, score });
      }

      // Sort by score and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching vector store:', error);
      return [];
    }
  }

  /**
   * Remove a document from the vector store
   */
  async removeDocument(id: string): Promise<void> {
    this.documents.delete(id);
    this.embeddings.delete(id);
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Generate embedding for text (mock implementation)
   * In production, this would use OpenAI embeddings, Sentence Transformers, or similar
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - creates a simple hash-based vector
    // In production, replace with actual embedding API call
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding dimension

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      
      for (let j = 0; j < embedding.length; j++) {
        embedding[j] += Math.sin(hash + j) * 0.1;
      }
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Simple hash function for mock embedding generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear all documents from the vector store
   */
  async clear(): Promise<void> {
    this.documents.clear();
    this.embeddings.clear();
  }

  /**
   * Get the total number of documents in the store
   */
  getDocumentCount(): number {
    return this.documents.size;
  }
}

/**
 * Create and return a new vector store instance
 */
export function createVectorStore(): VectorStore {
  return new VectorStore();
}

// Export a singleton instance for global use
export const vectorStore = new VectorStore();
export default vectorStore;