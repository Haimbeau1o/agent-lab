import { describe, it, expect } from 'vitest'
import { sentenceChunk } from './sentence-chunker.js'
import { fixedChunk } from './fixed-chunker.js'
import { slidingChunk } from './sliding-chunker.js'

describe('chunkers', () => {
  it('splits text into sentence chunks', () => {
    const chunks = sentenceChunk('A. B. C.')
    expect(chunks.map(c => c.text)).toEqual(['A.', 'B.', 'C.'])
  })

  it('splits text into fixed chunks', () => {
    const chunks = fixedChunk('abcdef', 2)
    expect(chunks.map(c => c.text)).toEqual(['ab', 'cd', 'ef'])
  })

  it('splits text into sliding chunks', () => {
    const chunks = slidingChunk('abcdef', 3, 1)
    expect(chunks.map(c => c.text)).toEqual(['abc', 'bcd', 'cde', 'def'])
  })
})
