/**
 * DialogueLLMRunner 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DialogueLLMRunner } from './dialogue-llm-runner.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('DialogueLLMRunner', () => {
  let runner: DialogueLLMRunner
  let mockLLMClient: LLMClient

  beforeEach(() => {
    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    runner = new DialogueLLMRunner(mockLLMClient)
  })

  describe('metadata', () => {
    it('should have correct id, type, and version', () => {
      expect(runner.id).toBe('dialogue.llm')
      expect(runner.type).toBe('dialogue')
      expect(runner.version).toBe('1.0.0')
    })
  })

  describe('execute', () => {
    const validTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Dialogue',
      type: 'dialogue',
      input: {
        message: 'Hello, how are you?'
      },
      metadata: {}
    }

    const validConfig = {
      maxHistoryLength: 10,
      temperature: 0.7,
      maxTokens: 150
    }

    it('should successfully execute and return RunRecord', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'I am doing well, thank you for asking!',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 300
      })

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('completed')
      expect(result.output).toHaveProperty('response')
      expect(result.output).toHaveProperty('history')
      expect((result.output as any).history).toHaveLength(2) // user + assistant
      expect(result.metrics.latency).toBeGreaterThanOrEqual(0)
      expect(result.trace.length).toBeGreaterThan(0)
    })

    it('should handle dialogue with existing history', async () => {
      const taskWithHistory: AtomicTask = {
        ...validTask,
        input: {
          message: 'What did I just say?',
          history: [
            { role: 'user', content: 'Hello', timestamp: new Date() },
            { role: 'assistant', content: 'Hi there!', timestamp: new Date() }
          ]
        }
      }

      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'You said "Hello"',
        usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
        latency: 300
      })

      const result = await runner.execute(taskWithHistory, validConfig)

      expect(result.status).toBe('completed')
      expect((result.output as any).history).toHaveLength(4) // 2 existing + user + assistant
    })

    it('should truncate history when exceeds maxHistoryLength', async () => {
      const longHistory = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }))

      const taskWithLongHistory: AtomicTask = {
        ...validTask,
        input: {
          message: 'New message',
          history: longHistory as any
        }
      }

      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
        latency: 300
      })

      const result = await runner.execute(taskWithLongHistory, { maxHistoryLength: 10 })

      expect(result.status).toBe('completed')
      // Should have 10 (truncated) + 1 (new user) + 1 (assistant) = 12
      // But truncation happens after adding user message, so: 11 (truncated to 10) + 1 (assistant) = 11
      expect((result.output as any).history.length).toBeLessThanOrEqual(11)
    })

    it('should handle empty config', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 300
      })

      const result = await runner.execute(validTask, {})

      expect(result.status).toBe('completed')
      expect(mockLLMClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7, // default
          maxTokens: 150 // default
        })
      )
    })

    it('should handle invalid input - missing message', async () => {
      const invalidTask: AtomicTask = {
        ...validTask,
        input: {}
      }

      const result = await runner.execute(invalidTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('non-empty message field')
    })

    it('should handle LLM errors', async () => {
      vi.mocked(mockLLMClient.chat).mockRejectedValue(
        new Error('LLM API error')
      )

      const result = await runner.execute(validTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toBe('LLM API error')
    })
  })
})
