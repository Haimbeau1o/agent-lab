import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntentRecognizer } from './intent.js'
import type { IntentConfig, IntentResult } from '../../types/agent.js'
import type { LLMClient } from '../llm/client.js'

describe('IntentRecognizer', () => {
  let recognizer: IntentRecognizer
  let mockLLMClient: LLMClient
  let config: IntentConfig

  beforeEach(() => {
    config = {
      intents: ['greeting', 'question', 'complaint', 'farewell'],
      examples: {
        greeting: ['hello', 'hi', 'good morning'],
        question: ['how do I', 'what is', 'can you explain'],
        complaint: ['not working', 'problem with', 'error'],
        farewell: ['goodbye', 'bye', 'see you']
      },
      temperature: 0.3,
      maxTokens: 100
    }

    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    recognizer = new IntentRecognizer(mockLLMClient, config)
  })

  describe('recognize', () => {
    it('should recognize greeting intent', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95, "reasoning": "User is saying hello"}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result: IntentResult = await recognizer.recognize('Hello there!')

      expect(result.intent).toBe('greeting')
      expect(result.confidence).toBe(0.95)
      expect(result.reasoning).toContain('saying hello')
    })

    it('should recognize question intent', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "question", "confidence": 0.88, "reasoning": "User is asking a question"}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await recognizer.recognize('How do I reset my password?')

      expect(result.intent).toBe('question')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should handle ambiguous input with lower confidence', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "question", "confidence": 0.45, "reasoning": "Unclear intent"}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await recognizer.recognize('Hmm...')

      expect(result.confidence).toBeLessThan(0.6)
    })

    it('should include examples in system prompt', async () => {
      await recognizer.recognize('Test input')

      expect(mockLLMClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('greeting: hello, hi, good morning')
            })
          ])
        })
      )
    })

    it('should handle malformed LLM response', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'This is not JSON',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      await expect(recognizer.recognize('Test')).rejects.toThrow('Failed to parse LLM response')
    })

    it('should validate intent is in allowed list', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "unknown_intent", "confidence": 0.9}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      await expect(recognizer.recognize('Test')).rejects.toThrow('Intent not in allowed list')
    })
  })

  describe('buildSystemPrompt', () => {
    it('should include all configured intents', () => {
      const prompt = recognizer['buildSystemPrompt']()

      expect(prompt).toContain('greeting')
      expect(prompt).toContain('question')
      expect(prompt).toContain('complaint')
      expect(prompt).toContain('farewell')
    })

    it('should include examples if provided', () => {
      const prompt = recognizer['buildSystemPrompt']()

      expect(prompt).toContain('hello')
      expect(prompt).toContain('how do I')
      expect(prompt).toContain('not working')
    })

    it('should work without examples', () => {
      const configWithoutExamples: IntentConfig = {
        intents: ['test1', 'test2'],
        temperature: 0.3
      }

      const recognizerWithoutExamples = new IntentRecognizer(mockLLMClient, configWithoutExamples)
      const prompt = recognizerWithoutExamples['buildSystemPrompt']()

      expect(prompt).toContain('test1')
      expect(prompt).toContain('test2')
      expect(prompt).not.toContain('Examples:')
    })
  })
})
