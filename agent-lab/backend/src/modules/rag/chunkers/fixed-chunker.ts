import { makeChunk, type Chunk } from './chunker.js'

export const fixedChunk = (text: string, size: number): Chunk[] => {
  if (size <= 0) return []
  const chunks: Chunk[] = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(makeChunk(text.slice(i, i + size), chunks.length))
  }
  return chunks
}
