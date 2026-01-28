// 测试运行状态
export type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed'

// 测试运行
export interface TestRun {
  id: string
  agentId: string
  taskId: string
  datasetId?: string
  status: TestRunStatus
  startedAt: Date
  completedAt?: Date
  results?: TestResult[]
}

// 测试结果
export interface TestResult {
  id: string
  testRunId: string
  input: unknown
  output: unknown
  expected?: unknown
  latency: number
  tokenCount?: number
  metrics: Record<string, unknown>
  isCorrect?: boolean
  createdAt: Date
}

// 创建测试运行 DTO
export interface CreateTestRunDto {
  agentId: string
  taskId: string
  datasetId?: string
}

// 意图识别指标
export interface IntentMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix?: number[][]
  avgConfidence: number
  latency: number
}

// 多轮对话指标
export interface DialogueMetrics {
  coherenceScore: number
  topicDriftCount: number
  contextRetention: number
  taskCompletionRate: number
  avgTurnsToComplete: number
  repeatRate: number
  latencyPerTurn: number
}

// 记忆指标
export interface MemoryMetrics {
  recallAccuracy: number
  storageEfficiency: number
  retrievalRelevance: number
  updateLatency: number
  memorySize: number
  avgRetrievalTime: number
}

// 自动化报告
export interface EvaluationReport {
  testRunId: string
  summary: string
  metrics: IntentMetrics | DialogueMetrics | MemoryMetrics
  issues: string[]
  recommendations: string[]
  createdAt: Date
}
