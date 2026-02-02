import type { EmbeddingAdapter } from './embedding-adapter.js'

export class MockEmbedding implements EmbeddingAdapter {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(text => {
      const sum = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      return [sum % 7, sum % 11, sum % 13]
    })
  }
}
