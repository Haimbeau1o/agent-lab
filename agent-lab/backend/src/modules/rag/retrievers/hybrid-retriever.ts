import bm25 from 'wink-bm25-text-search'
import winkTokenizer from 'wink-tokenizer'
import type { EmbeddingAdapter } from '../embeddings/embedding-adapter.js'
import { InMemoryVectorIndex } from './vector-index.js'

const tokenizer = winkTokenizer().tokenize

type HybridRetrieverConfig = {
  bm25Weight: number
  vectorWeight: number
  embedder: EmbeddingAdapter
}

type Doc = { id: string; text: string }

type RetrievedChunk = { chunkId: string; score: number; rank: number }

export class HybridRetriever {
  constructor(private readonly config: HybridRetrieverConfig) {}

  async search(query: string, docs: Doc[], topK: number): Promise<RetrievedChunk[]> {
    const bm25Scores = this.computeBm25Scores(query, docs)
    const vectorScores = await this.computeVectorScores(query, docs)

    const combined = docs.map(doc => {
      const bm25Score = bm25Scores.get(doc.id) ?? 0
      const vectorScore = vectorScores.get(doc.id) ?? 0
      const score = this.config.bm25Weight * bm25Score + this.config.vectorWeight * vectorScore
      return { chunkId: doc.id, score, rank: 0 }
    })

    const sorted = combined.sort((a, b) => b.score - a.score).slice(0, topK)

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }))
  }

  private computeBm25Scores(query: string, docs: Doc[]): Map<string, number> {
    const engine = bm25()
    engine.defineConfig({ fldWeights: { text: 1 } })
    engine.definePrepTasks([tokenizer])

    docs.forEach((doc, idx) => engine.addDoc({ text: doc.text }, idx))
    engine.consolidate()

    const results = engine.search(query, docs.length)
    const scoreMap = new Map<string, number>()

    results.forEach(result => {
      const docIndex = result[0] as number
      const score = result[1] as number
      scoreMap.set(docs[docIndex].id, score)
    })

    return scoreMap
  }

  private async computeVectorScores(query: string, docs: Doc[]): Promise<Map<string, number>> {
    const vectors = await this.config.embedder.embed(docs.map(d => d.text))
    const index = new InMemoryVectorIndex()
    docs.forEach((doc, i) => index.add(doc.id, vectors[i]))
    const queryVec = (await this.config.embedder.embed([query]))[0]
    const results = index.search(queryVec, docs.length)

    const scoreMap = new Map<string, number>()
    results.forEach(result => scoreMap.set(result.id, result.score))
    return scoreMap
  }
}
