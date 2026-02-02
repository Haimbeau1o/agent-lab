import { describe, it, expect } from 'vitest'
import { SimpleReranker } from './simple-reranker.js'

describe('SimpleReranker', () => {
  it('reorders chunks by text length descending and updates rank', () => {
    const reranker = new SimpleReranker()
    const input = [
      { chunkId: 'c1', text: 'short', score: 0.9, rank: 1 },
      { chunkId: 'c2', text: 'a much longer chunk', score: 0.2, rank: 2 }
    ]

    const output = reranker.rerank(input)

    expect(output.map(c => c.chunkId)).toEqual(['c2', 'c1'])
    expect(output.map(c => c.rank)).toEqual([1, 2])
  })
})
