import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryManager } from './memory.js'
import type { MemoryConfig, MemoryItem } from '../../types/agent.js'
import type { LLMClient } from '../llm/client.js'

describe('MemoryManager', () => {
  let manager: MemoryManager
  let mockLLMClient: LLMClient
  let config: MemoryConfig

  beforeEach(() => {
    config = {
      storageType: 'json',
      maxMemorySize: 100,
      temperature: 0.5
    }

    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    manager = new MemoryManager(mockLLMClient, config)
  })

  describe('extractAndStore', () => {
    it('should extract key information from message', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"memories": [{"key": "user_name", "value": "张三", "importance": 0.9}]}',
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('我叫张三，今年30岁')

      const memories = manager.getAllMemories()
      expect(memories).toHaveLength(1)
      expect(memories[0].key).toBe('user_name')
      expect(memories[0].value).toBe('张三')
    })

    it('should extract multiple pieces of information', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: `{
          "memories": [
            {"key": "user_name", "value": "张三", "importance": 0.9},
            {"key": "user_age", "value": 30, "importance": 0.8}
          ]
        }`,
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('我叫张三，今年30岁')

      const memories = manager.getAllMemories()
      expect(memories).toHaveLength(2)
    })

    it('should handle messages with no important information', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"memories": []}',
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('嗯嗯')

      const memories = manager.getAllMemories()
      expect(memories).toHaveLength(0)
    })

    it('should update existing memory if key exists', async () => {
      vi.mocked(mockLLMClient.chat)
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "user_age", "value": 30, "importance": 0.8}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "user_age", "value": 31, "importance": 0.9}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })

      await manager.extractAndStore('我今年30岁')
      await manager.extractAndStore('我今年31岁了')

      const memories = manager.getAllMemories()
      expect(memories).toHaveLength(1)
      expect(memories[0].value).toBe(31)
    })
  })

  describe('retrieve', () => {
    beforeEach(async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: `{
          "memories": [
            {"key": "user_name", "value": "张三", "importance": 0.9},
            {"key": "user_age", "value": 30, "importance": 0.8},
            {"key": "user_hobby", "value": "科幻电影", "importance": 0.7}
          ]
        }`,
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('我叫张三，今年30岁，喜欢看科幻电影')
    })

    it('should retrieve relevant memories based on query', async () => {
      const results = await manager.retrieve('他多大了')

      expect(results).toHaveLength(1)
      expect(results[0].key).toBe('user_age')
      expect(results[0].value).toBe(30)
    })

    it('should retrieve multiple relevant memories', async () => {
      const results = await manager.retrieve('告诉我关于用户的信息')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should return empty array when no relevant memories found', async () => {
      const results = await manager.retrieve('今天天气怎么样')

      expect(results).toEqual([])
    })

    it('should return memories sorted by importance', async () => {
      const results = await manager.retrieve('用户')

      const importances = results.map(m => m.importance || 0)
      const sorted = [...importances].sort((a, b) => b - a)
      expect(importances).toEqual(sorted)
    })
  })

  describe('getAllMemories', () => {
    it('should return all stored memories', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"memories": [{"key": "test", "value": "value", "importance": 0.5}]}',
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('Test message')

      const memories = manager.getAllMemories()
      expect(memories).toHaveLength(1)
      expect(memories[0].key).toBe('test')
    })

    it('should return empty array when no memories', () => {
      const memories = manager.getAllMemories()
      expect(memories).toEqual([])
    })
  })

  describe('clearMemories', () => {
    it('should clear all memories', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: '{"memories": [{"key": "test", "value": "value", "importance": 0.5}]}',
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latency: 500
      })

      await manager.extractAndStore('Test message')
      expect(manager.getAllMemories()).toHaveLength(1)

      manager.clearMemories()
      expect(manager.getAllMemories()).toHaveLength(0)
    })
  })

  describe('memory size management', () => {
    it('should respect maxMemorySize limit', async () => {
      const smallConfig: MemoryConfig = {
        maxMemorySize: 2,
        temperature: 0.5
      }
      const smallManager = new MemoryManager(mockLLMClient, smallConfig)

      vi.mocked(mockLLMClient.chat)
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "key1", "value": "value1", "importance": 0.5}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "key2", "value": "value2", "importance": 0.6}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "key3", "value": "value3", "importance": 0.9}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })

      await smallManager.extractAndStore('Message 1')
      await smallManager.extractAndStore('Message 2')
      await smallManager.extractAndStore('Message 3')

      const memories = smallManager.getAllMemories()
      expect(memories.length).toBeLessThanOrEqual(2)
    })

    it('should keep most important memories when pruning', async () => {
      const smallConfig: MemoryConfig = {
        maxMemorySize: 2,
        temperature: 0.5
      }
      const smallManager = new MemoryManager(mockLLMClient, smallConfig)

      vi.mocked(mockLLMClient.chat)
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "low", "value": "value", "importance": 0.3}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "high", "value": "value", "importance": 0.9}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })
        .mockResolvedValueOnce({
          content: '{"memories": [{"key": "medium", "value": "value", "importance": 0.6}]}',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latency: 500
        })

      await smallManager.extractAndStore('Message 1')
      await smallManager.extractAndStore('Message 2')
      await smallManager.extractAndStore('Message 3')

      const memories = smallManager.getAllMemories()
      expect(memories.some(m => m.key === 'high')).toBe(true)
      expect(memories.some(m => m.key === 'low')).toBe(false)
    })
  })
})
