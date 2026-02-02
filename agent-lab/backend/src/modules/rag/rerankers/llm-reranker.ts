import type { LLMClient } from '../../../lib/llm/client.js'
import type { LLMRequest, LLMMessage } from '../../../types/llm.js'

export type RerankChunk = {
  chunkId: string
  text: string
  score: number
  rank: number
}

export class LLMReranker {
  constructor(private readonly llmClient: LLMClient) {}

  async rerank(chunks: RerankChunk[], query: string): Promise<RerankChunk[]> {
    const content = await this.requestLLM(chunks, query)
    const scores = this.parseScores(content, chunks.length)

    const ranked = chunks.map((chunk, index) => ({
      ...chunk,
      score: scores[index] ?? 0
    }))

    ranked.sort((a, b) => b.score - a.score)

    return ranked.map((chunk, index) => ({
      ...chunk,
      rank: index + 1
    }))
  }

  private async requestLLM(chunks: RerankChunk[], query: string): Promise<string> {
    const prompt = this.buildPrompt(chunks, query)
    const messages: LLMMessage[] = [{ role: 'system', content: prompt }]
    const request: LLMRequest = {
      messages,
      temperature: 0,
      maxTokens: 256
    }
    const response = await this.llmClient.chat(request)
    return response.content
  }

  private buildPrompt(chunks: RerankChunk[], query: string): string {
    const lines = chunks.map((chunk, i) => `${i}: ${chunk.text}`).join('\n')
    return `You are a reranker. Given a query and chunks, output JSON with scores array in the same order.
Query: ${query}
Chunks:\n${lines}
Return ONLY JSON: {"scores": [number, ...]}`
  }

  private parseScores(content: string, expected: number): number[] {
    try {
      const parsed = JSON.parse(content) as { scores?: number[] }
      if (!Array.isArray(parsed.scores)) {
        throw new Error('Missing scores')
      }
      if (parsed.scores.length !== expected) {
        throw new Error('Scores length mismatch')
      }
      return parsed.scores.map(value => (typeof value === 'number' ? value : 0))
    } catch (error) {
      try {
        const repaired = JSON.parse(content) as { scores?: number[] }
        if (Array.isArray(repaired.scores)) {
          return repaired.scores.map(value => (typeof value === 'number' ? value : 0))
        }
      } catch {
        // fallthrough
      }
      throw new Error(`Failed to parse LLM rerank response as JSON: ${content}`)
    }
  }
}
