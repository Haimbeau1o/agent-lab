import { AgentType } from './agent.js'

// 测试用例基础类型
export interface BaseTestCase {
  id?: string
  input: string | Record<string, unknown>
  expected?: unknown
}

// 意图识别测试用例
export interface IntentTestCase extends BaseTestCase {
  input: string
  expected: {
    intent: string
    confidence?: number
  }
}

// 多轮对话测试用例
export interface DialogueTestCase extends BaseTestCase {
  input: {
    turns: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
  }
  expected?: {
    intent?: string
    slots?: Record<string, unknown>
    coherenceScore?: number
  }
}

// 记忆测试用例
export interface MemoryTestCase extends BaseTestCase {
  input: {
    history: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    query: string
  }
  expected: {
    recall: string[]
    responseContains?: string[]
  }
}

// 任务类型
export interface Task {
  id: string
  name: string
  description: string
  type: AgentType
  testCases: BaseTestCase[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskDto {
  name: string
  description: string
  type: AgentType
  testCases: BaseTestCase[]
}

export interface UpdateTaskDto {
  name?: string
  description?: string
  testCases?: BaseTestCase[]
}
