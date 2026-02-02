import { describe, it, expect, vi } from 'vitest'
import type { LLMClient } from '../../../lib/llm/client.js'
import { RagLLMGenerator } from './llm-generator.js'

describe('RagLLMGenerator', () => {
  const retrievedChunks = [
    { chunkId: 'c1', text: 'Alpha document.' },
    { chunkId: 'c2', text: 'Beta document.' }
  ]

  it('parses valid JSON response into rag.generated output', async () => {
    const mockLLMClient = {
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          answer: 'Alpha answer.',
          sentences: [
            { sentenceId: 's1', text: 'Alpha answer.', citations: [{ chunkId: 'c1' }] }
          ]
        })
      })
    } as unknown as LLMClient

    const generator = new RagLLMGenerator(mockLLMClient)

    const output = await generator.generate({
      query: 'What is Alpha?',
      retrievedChunks
    })

    expect(output.answer).toBe('Alpha answer.')
    expect(output.generatorType).toBe('llm')
    expect(output.sentences).toHaveLength(1)
    expect(output.sentences[0].citations?.[0].chunkId).toBe('c1')
    expect(output.sourcesUsed).toEqual(['c1'])
  })

  it('repairs once when initial response is invalid JSON', async () => {
    const mockLLMClient = {
      chat: vi
        .fn()
        .mockResolvedValueOnce({ content: 'not json' })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            answer: 'Beta answer.',
            sentences: [
              { sentenceId: 's1', text: 'Beta answer.', citations: [{ chunkId: 'c2' }] }
            ]
          })
        })
    } as unknown as LLMClient

    const generator = new RagLLMGenerator(mockLLMClient)

    const output = await generator.generate({
      query: 'What is Beta?',
      retrievedChunks
    })

    expect(output.answer).toBe('Beta answer.')
    expect(mockLLMClient.chat).toHaveBeenCalledTimes(2)
  })

  it('throws when repair also fails', async () => {
    const mockLLMClient = {
      chat: vi
        .fn()
        .mockResolvedValueOnce({ content: 'bad json' })
        .mockResolvedValueOnce({ content: 'still bad json' })
    } as unknown as LLMClient

    const generator = new RagLLMGenerator(mockLLMClient)

    await expect(
      generator.generate({
        query: 'What is Alpha?',
        retrievedChunks
      })
    ).rejects.toThrow('Failed to parse LLM response as JSON')
  })
})
