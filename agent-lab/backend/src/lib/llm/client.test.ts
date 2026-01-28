import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LLMClient } from './client.js'
import type { LLMRequest, LLMResponse } from '../../types/llm.js'
import type { ApiConfig } from '../../types/api-config.js'

describe('LLMClient', () => {
  let client: LLMClient
  let mockApiConfig: ApiConfig

  beforeEach(() => {
    mockApiConfig = {
      id: 'test-id',
      name: 'Test OpenAI',
      provider: 'openai',
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
      modelName: 'gpt-4',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    client = new LLMClient(mockApiConfig)
  })

  describe('chat', () => {
    it('should successfully call LLM API and return response', async () => {
      const request: LLMRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      }

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Hi there!' },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 5,
            total_tokens: 25
          },
          model: 'gpt-4'
        })
      })

      const response: LLMResponse = await client.chat(request)

      expect(response.content).toBe('Hi there!')
      expect(response.usage.totalTokens).toBe(25)
      expect(response.latency).toBeGreaterThan(0)
      expect(response.finishReason).toBe('stop')
    })

    it('should handle API errors gracefully', async () => {
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }]
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
            code: 'invalid_api_key'
          }
        })
      })

      await expect(client.chat(request)).rejects.toThrow('Invalid API key')
    })

    it('should handle network errors with retry', async () => {
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }]
      }

      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        })
      })

      const response = await client.chat(request)

      expect(callCount).toBe(3)
      expect(response.content).toBe('Success')
    })

    it('should fail after max retries', async () => {
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }]
      }

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(client.chat(request)).rejects.toThrow('Network error')
    })

    it('should measure latency correctly', async () => {
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }]
      }

      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        }), 100))
      )

      const response = await client.chat(request)

      expect(response.latency).toBeGreaterThanOrEqual(100)
      expect(response.latency).toBeLessThan(200)
    })

    it('should include all request parameters in API call', async () => {
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        maxTokens: 50,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
      })

      await client.chat(request)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }),
          body: expect.stringContaining('"temperature":0.5')
        })
      )
    })
  })

  describe('validateResponse', () => {
    it('should validate correct response structure', () => {
      const validResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      }

      expect(() => client['validateResponse'](validResponse)).not.toThrow()
    })

    it('should throw error for invalid response structure', () => {
      const invalidResponse = {
        choices: []
      }

      expect(() => client['validateResponse'](invalidResponse)).toThrow()
    })
  })
})
