import { makeChunk, type Chunk } from './chunker.js'

export const sentenceChunk = (text: string): Chunk[] => {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map(part => part.trim())
    .filter(part => part.length > 0)

  return parts.map((part, index) => makeChunk(part, index))
}
