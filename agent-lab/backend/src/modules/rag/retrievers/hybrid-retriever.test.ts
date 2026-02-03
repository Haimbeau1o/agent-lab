import { describe, it, expect } from 'vitest'
import { HybridRetriever } from './hybrid-retriever.js'
import { MockEmbedding } from '../embeddings/mock-embedding.js'

const docs = [
  { id: 'd1', text: 'alpha only' },
  { id: 'd2', text: 'beta only' },
  { id: 'd3', text: 'gamma only' }
]

describe('HybridRetriever', () => {
  it('merges bm25 + vector scores with weights', async () => {
    const retriever = new HybridRetriever({
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      embedder: new MockEmbedding({
        'alpha only': [1, 0],
        'beta only': [0, 1],
        'gamma only': [0.5, 0.5],
        alpha: [1, 0]
      })
    })

    const results = await retriever.search('alpha', docs, 2)

    expect(results).toHaveLength(2)
    expect(results[0].rank).toBe(1)
  })
})
