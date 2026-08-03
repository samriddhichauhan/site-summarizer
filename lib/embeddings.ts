import ollama from "ollama";

/**
 * Computes Cosine Similarity between two vector arrays of numbers.
 * Returns a value between -1.0 and 1.0 (higher = semantically closer).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates vector embeddings for a given text using local Ollama.
 * Falls back to a deterministic term-frequency vector if Ollama embedding model is offline.
 */
export async function generateEmbedding(text: string, modelName?: string): Promise<number[]> {
  const modelToUse = modelName || process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
  const cleanText = text.slice(0, 4000).trim();

  if (!cleanText) return [];

  try {
    const res = await ollama.embeddings({
      model: modelToUse,
      prompt: cleanText,
    });

    if (res && Array.isArray(res.embedding) && res.embedding.length > 0) {
      return res.embedding;
    }
  } catch {
    // Try fallback default model if specific embed model not pulled
    try {
      const fallbackRes = await ollama.embeddings({
        model: process.env.OLLAMA_MODEL || "phi:latest",
        prompt: cleanText,
      });

      if (fallbackRes && Array.isArray(fallbackRes.embedding) && fallbackRes.embedding.length > 0) {
        return fallbackRes.embedding;
      }
    } catch {
      // Ignore and use local fallback vectorizer
    }
  }

  // Fallback: Generate local 128-dimensional term frequency hash vector
  return generateFallbackVector(cleanText);
}

/**
 * Lightweight 128-dimensional hash vector for local semantic term matching.
 */
function generateFallbackVector(text: string): number[] {
  const vector = new Array(128).fill(0);
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 128;
    vector[idx] += 1;
  });

  // Normalize vector length to unit norm
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}
