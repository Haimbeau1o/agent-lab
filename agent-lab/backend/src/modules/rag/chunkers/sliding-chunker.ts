import { makeChunk, type Chunk } from './chunker.js'

export const slidingChunk = (text: string, size: number, overlap: number): Chunk[] => {
  if (size <= 0) return []
  if (text.length === 0) return []
  if (text.length <= size) return [makeChunk(text, 0)]

  const step = Math.max(1, overlap)
  const chunks: Chunk[] = []

  for (let i = 0; i + size <= text.length; i += step) {
    chunks.push(makeChunk(text.slice(i, i + size), chunks.length))
  }

  return chunks
}
