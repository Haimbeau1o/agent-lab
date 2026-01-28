import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DialogueManager } from './dialogue.js'
import type { DialogueConfig, DialogueMessage } from '../../types/agent.js'
import type { LLMClient } from '../llm/client.js'

describe('DialogueManager', () => {
  let manager: DialogueManager
  let mockLLMClient: LLMClient
  let config: DialogueConfig

  beforeEach(() => {
    config = {
      maxHistoryLength: 10,
      contextWindowSize: 4096,
      temperature: 0.7,
      maxTokens: 150
    }

    mockLLMClient = {
      chat: vi.fn()
    } as unknown as LLMClient

    manager = new DialogueManager(mockLLMClient, config)
  })

  describe('processMessage', () => {
    it('should process user message and return response', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Hello! How can I help you today?',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      const response = await manager.processMessage('Hi there!')

      expect(response).toBe('Hello! How can I help you today?')
      expect(manager.getHistory()).toHaveLength(2) // user + assistant
    })

    it('should maintain conversation history', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await manager.processMessage('First message')
      await manager.processMessage('Second message')
      await manager.processMessage('Third message')

      const history = manager.getHistory()
      expect(history).toHaveLength(6) // 3 user + 3 assistant messages
    })

    it('should truncate history when exceeding maxHistoryLength', async () => {
      const shortConfig: DialogueConfig = {
        maxHistoryLength: 4,
        temperature: 0.7
      }
      const shortManager = new DialogueManager(mockLLMClient, shortConfig)

      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await shortManager.processMessage('Message 1')
      await shortManager.processMessage('Message 2')
      await shortManager.processMessage('Message 3')

      const history = shortManager.getHistory()
      expect(history.length).toBeLessThanOrEqual(4)
    })

    it('should include conversation context in LLM request', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await manager.processMessage('First message')
      await manager.processMessage('Second message')

      expect(mockLLMClient.chat).toHaveBeenLastCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'First message' }),
            expect.objectContaining({ role: 'assistant', content: 'Response' }),
            expect.objectContaining({ role: 'user', content: 'Second message' })
          ])
        })
      )
    })
  })

  describe('getHistory', () => {
    it('should return empty array initially', () => {
      expect(manager.getHistory()).toEqual([])
    })

    it('should return all messages in order', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await manager.processMessage('Message 1')
      await manager.processMessage('Message 2')

      const history = manager.getHistory()
      expect(history[0].role).toBe('user')
      expect(history[0].content).toBe('Message 1')
      expect(history[1].role).toBe('assistant')
      expect(history[2].role).toBe('user')
      expect(history[2].content).toBe('Message 2')
    })
  })

  describe('clearHistory', () => {
    it('should clear all conversation history', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await manager.processMessage('Message 1')
      expect(manager.getHistory()).toHaveLength(2)

      manager.clearHistory()
      expect(manager.getHistory()).toHaveLength(0)
    })
  })

  describe('getContext', () => {
    it('should return formatted context for LLM', async () => {
      vi.mocked(mockLLMClient.chat).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        latency: 500
      })

      await manager.processMessage('Test message')

      const context = manager.getContext()
      expect(context).toHaveLength(2)
      expect(context[0]).toEqual(
        expect.objectContaining({
          role: 'user',
          content: 'Test message'
        })
      )
    })
  })
})
