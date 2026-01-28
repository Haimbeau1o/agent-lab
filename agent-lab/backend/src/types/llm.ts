// LLM 请求和响应类型
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stream?: boolean
}

export interface LLMUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface LLMResponse {
  content: string
  usage: LLMUsage
  latency: number
  model?: string
  finishReason?: string
}

export interface LLMError {
  code: string
  message: string
  status?: number
}
