import type { LLMClient } from '../llm/client.js'
import type { DialogueConfig, DialogueMessage } from '../../types/agent.js'
import type { LLMRequest, LLMMessage } from '../../types/llm.js'

export class DialogueManager {
  private readonly llmClient: LLMClient
  private readonly config: DialogueConfig
  private history: DialogueMessage[] = []

  constructor(llmClient: LLMClient, config: DialogueConfig) {
    this.llmClient = llmClient
    this.config = config
  }

  async processMessage(input: string): Promise<string> {
    // 添加用户消息到历史
    const userMessage: DialogueMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    this.history.push(userMessage)

    // 管理历史长度
    this.truncateHistory()

    // 构建 LLM 请求
    const messages: LLMMessage[] = this.history.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const request: LLMRequest = {
      messages,
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 150
    }

    const response = await this.llmClient.chat(request)

    // 添加助手响应到历史
    const assistantMessage: DialogueMessage = {
      role: 'assistant',
      content: response.content,
      timestamp: new Date()
    }
    this.history.push(assistantMessage)

    // 管理历史长度（包含 assistant 消息）
    this.truncateHistory()

    return response.content
  }

  getHistory(): DialogueMessage[] {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  getContext(): DialogueMessage[] {
    return this.getHistory()
  }

  private truncateHistory(): void {
    const maxLength = this.config.maxHistoryLength || 10

    if (this.history.length > maxLength) {
      // 保留最近的 maxLength 条消息
      this.history = this.history.slice(-maxLength)
    }
  }
}
