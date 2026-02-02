export class InMemoryVectorIndex {
  private items: Array<{ id: string; vector: number[] }> = []

  add(id: string, vector: number[]): void {
    this.items.push({ id, vector })
  }

  search(query: number[], topK: number): Array<{ id: string; score: number }> {
    const score = (a: number[], b: number[]) => {
      const dot = a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0)
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
      return normA === 0 || normB === 0 ? 0 : dot / (normA * normB)
    }

    return this.items
      .map(item => ({ id: item.id, score: score(query, item.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}
