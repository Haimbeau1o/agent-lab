/**
 * MemoryLLMRunner 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryLLMRunner } from './memory-llm-runner.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('MemoryLLMRunner', () => {
  let runner: MemoryLLMRunner
  let mockLLMClient: LLMClient

  beforeEach(() => {
    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    runner = new MemoryLLMRunner(mockLLMClient)
  })

  describe('metadata', () => {
    it('should have correct id, type, and version', () => {
      expect(runner.id).toBe('memory.llm')
      expect(runner.type).toBe('memory')
      expect(runner.version).toBe('1.0.0')
    })
  })

  describe('execute - extract', () => {
    const extractTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Memory Extract',
      type: 'memory',
      input: {
        operation: 'extract',
        message: 'My name is John and I am 30 years old. I love programming.'
      },
      metadata: {}
    }

    const validConfig = {
      maxMemorySize: 100,
      temperature: 0.5,
      maxTokens: 200
    }

    it('should successfully extract memories', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: JSON.stringify({
          memories: [
            { key: 'name', value: 'John', importance: 0.9 },
            { key: 'age', value: 30, importance: 0.7 },
            { key: 'interest', value: 'programming', importance: 0.8 }
          ]
        }),
        usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
        latency: 400
      })

      const result = await runner.execute(extractTask, validConfig)

      expect(result.status).toBe('completed')
      expect((result.output as any).operation).toBe('extract')
      expect((result.output as any).memories).toHaveLength(3)
      expect((result.output as any).memories[0]).toHaveProperty('timestamp')
    })

    it('should handle empty extraction result', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: JSON.stringify({ memories: [] }),
        usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 },
        latency: 300
      })

      const result = await runner.execute(extractTask, validConfig)

      expect(result.status).toBe('completed')
      expect((result.output as any).memories).toHaveLength(0)
    })

    it('should handle invalid JSON response', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Not a JSON response',
        usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 },
        latency: 300
      })

      const result = await runner.execute(extractTask, validConfig)

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('Failed to parse')
    })
  })

  describe('execute - retrieve', () => {
    const retrieveTask: AtomicTask = {
      id: 'task-2',
      name: 'Test Memory Retrieve',
      type: 'memory',
      input: {
        operation: 'retrieve',
        message: 'What is my name?',
        existingMemories: [
          { key: 'name', value: 'John', importance: 0.9 },
          { key: 'age', value: 30, importance: 0.7 },
          { key: 'city', value: 'New York', importance: 0.6 }
        ]
      },
      metadata: {}
    }

    it('should successfully retrieve relevant memories', async () => {
      const result = await runner.execute(retrieveTask, {})

      expect(result.status).toBe('completed')
      expect((result.output as any).operation).toBe('retrieve')
      expect((result.output as any).memories.length).toBeGreaterThan(0)
      // Should find 'name' memory
      expect((result.output as any).memories.some((m: any) => m.key === 'name')).toBe(true)
    })

    it('should sort memories by importance', async () => {
      const result = await runner.execute(retrieveTask, {})

      const memories = (result.output as any).memories
      if (memories.length > 1) {
        for (let i = 0; i < memories.length - 1; i++) {
          expect(memories[i].importance).toBeGreaterThanOrEqual(memories[i + 1].importance ?? 0)
        }
      }
    })

    it('should handle empty existing memories', async () => {
      const emptyTask: AtomicTask = {
        ...retrieveTask,
        input: {
          operation: 'retrieve',
          message: 'What is my name?',
          existingMemories: []
        }
      }

      const result = await runner.execute(emptyTask, {})

      expect(result.status).toBe('completed')
      expect((result.output as any).memories).toHaveLength(0)
    })

    it('should handle no matching memories', async () => {
      const noMatchTask: AtomicTask = {
        ...retrieveTask,
        input: {
          operation: 'retrieve',
          message: 'unrelated query xyz',
          existingMemories: [
            { key: 'name', value: 'John', importance: 0.9 }
          ]
        }
      }

      const result = await runner.execute(noMatchTask, {})

      expect(result.status).toBe('completed')
      expect((result.output as any).memories).toHaveLength(0)
    })
  })

  describe('validation', () => {
    it('should handle invalid operation', async () => {
      const invalidTask: AtomicTask = {
        id: 'task-3',
        name: 'Invalid',
        type: 'memory',
        input: {
          operation: 'invalid',
          message: 'test'
        },
        metadata: {}
      }

      const result = await runner.execute(invalidTask, {})

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('operation must be')
    })

    it('should handle missing message', async () => {
      const invalidTask: AtomicTask = {
        id: 'task-4',
        name: 'Invalid',
        type: 'memory',
        input: {
          operation: 'extract'
        },
        metadata: {}
      }

      const result = await runner.execute(invalidTask, {})

      expect(result.status).toBe('failed')
      expect(result.error?.message).toContain('non-empty message field')
    })
  })
})
