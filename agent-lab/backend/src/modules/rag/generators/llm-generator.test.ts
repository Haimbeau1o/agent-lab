import { describe, it, expect } from 'vitest'
import { LlmGenerator } from './llm-generator.js'

describe('LlmGenerator', () => {
  it('rejects invalid output after one repair attempt', async () => {
    const generator = new LlmGenerator({ client: { chat: async () => ({ content: 'invalid' }) } as any })
    await expect(generator.generate('q', [])).rejects.toThrow('Invalid generator output')
  })
})
