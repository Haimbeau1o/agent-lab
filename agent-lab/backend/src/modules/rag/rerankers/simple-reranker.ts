export type RerankChunk = {
  chunkId: string
  text: string
  score: number
  rank: number
}

export class SimpleReranker {
  rerank(chunks: RerankChunk[]): RerankChunk[] {
    const sorted = [...chunks].sort((a, b) => {
      const lengthDiff = b.text.length - a.text.length
      if (lengthDiff !== 0) return lengthDiff
      return b.score - a.score
    })

    return sorted.map((chunk, index) => ({
      ...chunk,
      rank: index + 1
    }))
  }
}
