import type { LLMRequest, LLMResponse, LLMError } from '../../types/llm.js'
import type { ApiConfig } from '../../types/api-config.js'

export class LLMClient {
  private readonly apiConfig: ApiConfig
  private readonly maxRetries: number = 3
  private readonly retryDelay: number = 1000

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(request)
        const latency = Date.now() - startTime

        return {
          content: response.choices[0].message.content,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          },
          latency,
          model: response.model,
          finishReason: response.choices[0].finish_reason
        }
      } catch (error) {
        lastError = error as Error

        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.retryDelay * (attempt + 1))
        }
      }
    }

    throw lastError || new Error('Failed to call LLM API')
  }

  private async makeRequest(request: LLMRequest): Promise<unknown> {
    const url = `${this.apiConfig.baseUrl}/chat/completions`

    const body = {
      model: this.apiConfig.modelName,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stream: request.stream || false
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiConfig.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json()
      const error: LLMError = {
        code: errorData.error?.code || 'unknown_error',
        message: errorData.error?.message || 'Unknown error occurred',
        status: response.status
      }
      throw new Error(error.message)
    }

    const data = await response.json()
    this.validateResponse(data)

    return data
  }

  private validateResponse(response: Record<string, unknown>): void {
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new Error('Invalid response: missing or empty choices array')
    }

    const firstChoice = response.choices[0] as Record<string, unknown>
    if (!firstChoice.message || typeof (firstChoice.message as Record<string, unknown>).content !== 'string') {
      throw new Error('Invalid response: missing message content')
    }

    if (!response.usage) {
      throw new Error('Invalid response: missing usage information')
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 工厂函数：根据 provider 创建对应的客户端
export function createLLMClient(apiConfig: ApiConfig): LLMClient {
  // 目前只支持 OpenAI 格式，未来可以扩展到其他 provider
  return new LLMClient(apiConfig)
}
