export type Chunk = {
  chunkId: string
  text: string
  metadata?: Record<string, unknown>
}

export const makeChunk = (text: string, index: number): Chunk => ({
  chunkId: `c${index + 1}`,
  text
})
