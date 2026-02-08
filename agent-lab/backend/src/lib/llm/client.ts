import type { LLMRequest, LLMResponse, LLMError } from '../../types/llm.js'
import type { ApiConfig } from '../../types/api-config.js'

type ChatCompletionChoice = {
  message: {
    content: string
  }
  finish_reason?: string | null
}

type ChatCompletionUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

type ChatCompletionResponse = {
  choices: ChatCompletionChoice[]
  usage: ChatCompletionUsage
  model?: string
}

type LLMApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

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
        const latency = Math.max(1, Date.now() - startTime)

        return {
          content: response.choices[0].message.content,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          },
          latency,
          model: response.model,
          finishReason: response.choices[0].finish_reason ?? undefined
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

  private async makeRequest(request: LLMRequest): Promise<ChatCompletionResponse> {
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
        Authorization: `Bearer ${this.apiConfig.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = (await response.json()) as unknown
      const payload: LLMApiErrorPayload = isRecord(errorData)
        ? (errorData as LLMApiErrorPayload)
        : {}
      const error: LLMError = {
        code: payload.error?.code || 'unknown_error',
        message: payload.error?.message || 'Unknown error occurred',
        status: response.status
      }
      throw new Error(error.message)
    }

    const data = (await response.json()) as unknown
    return this.validateResponse(data)
  }

  private validateResponse(response: unknown): ChatCompletionResponse {
    if (!isRecord(response)) {
      throw new Error('Invalid response: expected object')
    }

    const { choices, usage, model } = response

    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('Invalid response: missing or empty choices array')
    }

    const firstChoice = choices[0]
    if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
      throw new Error('Invalid response: missing choice message')
    }

    const content = firstChoice.message.content
    if (typeof content !== 'string') {
      throw new Error('Invalid response: missing message content')
    }

    if (!isRecord(usage)) {
      throw new Error('Invalid response: missing usage information')
    }

    const promptTokens = usage.prompt_tokens
    const completionTokens = usage.completion_tokens
    const totalTokens = usage.total_tokens

    if (
      typeof promptTokens !== 'number' ||
      typeof completionTokens !== 'number' ||
      typeof totalTokens !== 'number'
    ) {
      throw new Error('Invalid response: malformed usage fields')
    }

    return {
      choices: [
        {
          message: { content },
          finish_reason:
            typeof firstChoice.finish_reason === 'string' || firstChoice.finish_reason === null
              ? firstChoice.finish_reason
              : undefined
        }
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      },
      model: typeof model === 'string' ? model : undefined
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
