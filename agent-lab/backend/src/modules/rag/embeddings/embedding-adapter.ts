export interface EmbeddingAdapter {
  embed(texts: string[]): Promise<number[][]>
}
