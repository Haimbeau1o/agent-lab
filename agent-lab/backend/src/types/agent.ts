// Agent 类型定义
export type AgentType = 'intent' | 'dialogue' | 'memory'

export interface AgentConfig {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  [key: string]: unknown
}

export interface AgentTemplate {
  id: string
  name: string
  type: AgentType
  description: string
  config: AgentConfig
  systemPrompt: string
  isBuiltin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateAgentTemplateDto {
  name: string
  type: AgentType
  description: string
  config: AgentConfig
  systemPrompt: string
  isBuiltin?: boolean
}

export interface UpdateAgentTemplateDto {
  name?: string
  description?: string
  config?: AgentConfig
  systemPrompt?: string
}

// 意图识别特定类型
export interface IntentConfig extends AgentConfig {
  intents: string[] // 支持的意图列表
  examples?: Record<string, string[]> // 每个意图的示例
}

export interface IntentResult {
  intent: string
  confidence: number
  reasoning?: string
}

// 多轮对话特定类型
export interface DialogueConfig extends AgentConfig {
  maxHistoryLength?: number // 最大历史记录长度
  contextWindowSize?: number // 上下文窗口大小
}

export interface DialogueMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

// 记忆特定类型
export interface MemoryConfig extends AgentConfig {
  storageType?: 'json' | 'vector' // 存储类型
  maxMemorySize?: number // 最大记忆条数
}

export interface MemoryItem {
  key: string
  value: unknown
  timestamp: Date
  importance?: number // 重要性权重
}
