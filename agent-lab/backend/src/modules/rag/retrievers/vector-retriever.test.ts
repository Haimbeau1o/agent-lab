import { describe, it, expect } from 'vitest'
import { VectorRetriever } from './vector-retriever.js'
import { MockEmbedding } from '../embeddings/mock-embedding.js'

describe('VectorRetriever', () => {
  it('returns topK chunk ids from vector index', async () => {
    const retriever = new VectorRetriever(new MockEmbedding())
    const docs = [
      { id: 'd1', text: 'alpha' },
      { id: 'd2', text: 'beta' }
    ]
    const results = await retriever.search('alpha', docs, 1)
    expect(results[0].chunkId).toBe('d1')
  })
})
