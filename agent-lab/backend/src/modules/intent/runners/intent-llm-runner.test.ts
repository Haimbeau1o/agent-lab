/**
 * IntentLLMRunner 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntentLLMRunner } from './intent-llm-runner.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('IntentLLMRunner', () => {
  let runner: IntentLLMRunner
  let mockLLMClient: LLMClient

  beforeEach(() => {
    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    runner = new IntentLLMRunner(mockLLMClient)
  })

  describe('metadata', () => {
    it('should have correct id, type, and version', () => {
      expect(runner.id).toBe('intent.llm')
      expect(runner.type).toBe('intent')
      expect(runner.version).toBe('1.0.0')
    })
  })

  describe('execute', () => {
    const validTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Intent Recognition',
      type: 'intent',
      input: {
        text: 'Hello there!'
      },
      expected: {
        intent: 'greeting',
        confidence: 0.8
      },
      metadata: {}
    }

    const validConfig = {
      intents: ['greeting', 'question', 'complaint', 'farewell'],
      examples: {
        greeting: ['hello', 'hi', 'good morning'],
        question: ['how do I', 'what is', 'can you explain']
      },
      temperature: 0.3,
      maxTokens: 100
    }

    it('should successfully execute and return RunRecord', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95, "reasoning": "User is saying hello"}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.id).toBeDefined()
      expect(result.taskId).toBe('task-1')
      expect(result.taskType).toBe('atomic')
      expect(result.status).toBe('completed')
      expect(result.output).toEqual({
        intent: 'greeting',
        confidence: 0.95,
        reasoning: 'User is saying hello'
      })
      expect(result.metrics.latency).toBeGreaterThanOrEqual(0)
      expect(result.metrics.tokens).toBe(70)
      expect(result.metrics.cost).toBeCloseTo(0.00014, 5)
      expect(result.trace).toHaveLength(6)
      expect(result.startedAt).toBeInstanceOf(Date)
      expect(result.completedAt).toBeInstanceOf(Date)
      expect(result.provenance.runnerId).toBe('intent.llm')
      expect(result.provenance.runnerVersion).toBe('1.0.0')
    })

    it('should record trace events', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'info',
          event: 'config_validated'
        })
      )
      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'info',
          event: 'input_validated'
        })
      )
      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'info',
          event: 'llm_request_start'
        })
      )
      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'info',
          event: 'llm_response_received'
        })
      )
      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'info',
          event: 'response_parsed'
        })
      )
    })

    it('should handle invalid config', async () => {
      const invalidConfig = {
        intents: [] // Empty intents array
      }

      const result = await runner.execute(validTask, invalidConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('non-empty intents array')
      expect(result.trace).toContainEqual(
        expect.objectContaining({
          level: 'error',
          event: 'execution_failed'
        })
      )
    })

    it('should handle invalid input', async () => {
      const invalidTask: AtomicTask = {
        ...validTask,
        input: {
          text: '' // Empty text
        }
      }

      const result = await runner.execute(invalidTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('non-empty text field')
    })

    it('should handle LLM errors', async () => {
      vi.mocked(mockLLMClient.chat).mockRejectedValue(
        new Error('LLM API error')
      )

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toBe('LLM API error')
      expect(result.metrics.latency).toBeGreaterThanOrEqual(0)
    })

    it('should handle invalid JSON response', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'This is not JSON',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('Failed to parse LLM response as JSON')
    })

    it('should handle intent not in allowed list', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "unknown_intent", "confidence": 0.95}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('not in allowed list')
    })

    it('should handle missing confidence in response', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting"}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('confidence field')
    })

    it('should use default temperature and maxTokens', async () => {
      const configWithoutDefaults = {
        intents: ['greeting']
      }

      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      await runner.execute(validTask, configWithoutDefaults)

      expect(mockLLMClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 100
        })
      )
    })

    it('should include examples in system prompt when provided', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      await runner.execute(validTask, validConfig)

      const callArgs = vi.mocked(mockLLMClient.chat).mock.calls[0][0]
      const systemMessage = callArgs.messages[0].content

      expect(systemMessage).toContain('Examples for each intent')
      expect(systemMessage).toContain('greeting: hello, hi, good morning')
    })

    it('should not include examples section when not provided', async () => {
      const configWithoutExamples = {
        intents: ['greeting'],
        temperature: 0.3,
        maxTokens: 100
      }

      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"intent": "greeting", "confidence": 0.95}',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        latency: 500
      })

      await runner.execute(validTask, configWithoutExamples)

      const callArgs = vi.mocked(mockLLMClient.chat).mock.calls[0][0]
      const systemMessage = callArgs.messages[0].content

      expect(systemMessage).not.toContain('Examples for each intent')
    })
  })
})
