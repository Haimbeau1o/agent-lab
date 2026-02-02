import { InMemoryVectorIndex } from './vector-index.js'
import type { EmbeddingAdapter } from '../embeddings/embedding-adapter.js'

export class VectorRetriever {
  constructor(private readonly embedder: EmbeddingAdapter) {}

  async search(query: string, docs: Array<{ id: string; text: string }>, topK: number) {
    const vectors = await this.embedder.embed(docs.map(d => d.text))
    const index = new InMemoryVectorIndex()
    docs.forEach((doc, i) => index.add(doc.id, vectors[i]))
    const queryVec = (await this.embedder.embed([query]))[0]
    const results = index.search(queryVec, topK)
    return results.map((r, idx) => ({ chunkId: r.id, score: r.score, rank: idx + 1 }))
  }
}
