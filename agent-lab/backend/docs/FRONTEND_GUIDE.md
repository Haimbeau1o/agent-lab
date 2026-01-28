# 前端对接指南

## 概述

本文档专门为前端开发者提供后端 API 的对接说明。后端已完成所有接口开发和测试，你可以直接开始前端开发。

## 后端状态

✅ **已完成**:
- 所有 REST API 接口
- 数据库 Schema 和迁移
- 三个核心 Agent 模块（意图识别、多轮对话、记忆）
- LLM 客户端封装
- 评测系统和报告生成
- API Key 加密存储
- 内置示例数据

## 快速启动后端

```bash
cd agent-lab/backend

# 安装依赖
npm install

# 配置环境变量（复制 .env.example 为 .env）
cp .env.example .env

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run dev
```

后端将在 `http://localhost:3001` 运行。

## API Base URL

```
http://localhost:3001/api
```

## 核心业务流程

### 流程 1：配置 API Key

用户首次使用需要配置 LLM API Key：

```typescript
// POST /api/settings/api-config
const createApiConfig = async (config: {
  name: string
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  modelName: string
  isDefault?: boolean
}) => {
  const response = await fetch('http://localhost:3001/api/settings/api-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  return response.json()
}
```

**测试连接**:
```typescript
// POST /api/settings/api-config/:id/test
const testConnection = async (configId: string) => {
  const response = await fetch(
    `http://localhost:3001/api/settings/api-config/${configId}/test`,
    { method: 'POST' }
  )
  return response.json() // { success: true/false, message: "..." }
}
```

### 流程 2：查看可用 Agent

```typescript
// GET /api/agents
const getAgents = async (type?: 'intent' | 'dialogue' | 'memory') => {
  const url = new URL('http://localhost:3001/api/agents')
  if (type) url.searchParams.set('type', type)

  const response = await fetch(url)
  const { data } = await response.json()
  return data // Agent[] 数组
}
```

**响应数据结构**:
```typescript
interface Agent {
  id: string
  name: string
  type: 'intent' | 'dialogue' | 'memory'
  description: string
  config: {
    intents?: string[]          // 意图列表（intent 类型）
    examples?: Record<string, string[]>
    maxHistoryLength?: number   // 历史长度（dialogue 类型）
    maxMemorySize?: number      // 记忆大小（memory 类型）
    temperature?: number
    maxTokens?: number
  }
  systemPrompt: string
  isBuiltin: boolean
  createdAt: string
  updatedAt: string
}
```

### 流程 3：创建测试任务

```typescript
// POST /api/tasks
const createTask = async (task: {
  name: string
  description: string
  type: 'intent' | 'dialogue' | 'memory'
  testCases: TestCase[]
}) => {
  const response = await fetch('http://localhost:3001/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })
  return response.json()
}
```

**测试用例格式**:

#### 意图识别测试用例
```typescript
interface IntentTestCase {
  input: string
  expected?: {
    intent: string
    confidence?: number
  }
}

// 示例
const intentTestCases = [
  {
    input: "我要退款",
    expected: {
      intent: "refund",
      confidence: 0.9
    }
  },
  {
    input: "订单在哪里",
    expected: {
      intent: "order_status",
      confidence: 0.85
    }
  }
]
```

#### 多轮对话测试用例
```typescript
interface DialogueTestCase {
  input: {
    turns: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
  }
  expected?: {
    slots?: Record<string, unknown>
    coherenceScore?: number
  }
}

// 示例
const dialogueTestCases = [
  {
    input: {
      turns: [
        { role: 'user', content: '我想订一张去北京的机票' },
        { role: 'assistant', content: '好的，请问您什么时候出发？' },
        { role: 'user', content: '下周三' }
      ]
    },
    expected: {
      slots: {
        destination: '北京',
        date: 'next_wednesday'
      }
    }
  }
]
```

#### 记忆测试用例
```typescript
interface MemoryTestCase {
  input: {
    history: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    query: string
  }
  expected?: {
    recall: string[]
    responseContains?: string[]
  }
}

// 示例
const memoryTestCases = [
  {
    input: {
      history: [
        { role: 'user', content: '我叫张三，今年30岁' },
        { role: 'assistant', content: '你好张三' }
      ],
      query: '你还记得我的年龄吗？'
    },
    expected: {
      recall: ['user_age'],
      responseContains: ['30']
    }
  }
]
```

### 流程 4：执行测试

```typescript
// POST /api/test-runs
const runTest = async (params: {
  agentId: string
  taskId: string
  apiConfigId: string
  datasetId?: string  // 可选，使用数据集
}) => {
  const response = await fetch('http://localhost:3001/api/test-runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  return response.json() // { data: { id, status: 'running', startedAt }, message }
}
```

**注意**: 测试是异步执行的，返回 202 状态码。

### 流程 5：轮询测试状态

```typescript
// GET /api/test-runs/:id
const getTestRun = async (testRunId: string) => {
  const response = await fetch(`http://localhost:3001/api/test-runs/${testRunId}`)
  const { data } = await response.json()
  return data
}

// 轮询直到完成
const pollTestRun = async (testRunId: string): Promise<TestRun> => {
  const testRun = await getTestRun(testRunId)

  if (testRun.status === 'running' || testRun.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 2000)) // 等待 2 秒
    return pollTestRun(testRunId)
  }

  return testRun
}
```

**TestRun 数据结构**:
```typescript
interface TestRun {
  id: string
  agentId: string
  taskId: string
  datasetId?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  agent: Agent
  task: Task
  dataset?: Dataset
  results: TestResult[]
}

interface TestResult {
  id: string
  testRunId: string
  input: unknown          // 测试输入
  output: unknown         // Agent 输出
  expected?: unknown      // 期望输出
  latency: number         // 延迟（毫秒）
  tokenCount?: number     // Token 使用量
  metrics: Record<string, unknown>  // 模块特定指标
  isCorrect?: boolean     // 是否正确
  createdAt: string
}
```

### 流程 6：获取评测报告

```typescript
// GET /api/test-runs/:id/report
const getReport = async (testRunId: string) => {
  const response = await fetch(`http://localhost:3001/api/test-runs/${testRunId}/report`)
  const { data } = await response.json()
  return data
}
```

**Report 数据结构**:
```typescript
interface EvaluationReport {
  testRunId: string
  summary: string          // AI 生成的总结段落
  metrics: IntentMetrics | DialogueMetrics | MemoryMetrics
  issues: string[]         // 发现的问题
  recommendations: string[] // 改进建议
  createdAt: string
}

// 意图识别指标
interface IntentMetrics {
  accuracy: number        // 准确率 (0-1)
  precision: number       // 精确率 (0-1)
  recall: number          // 召回率 (0-1)
  f1Score: number         // F1 分数 (0-1)
  avgConfidence: number   // 平均置信度 (0-1)
  latency: number         // 平均延迟（毫秒）
}

// 多轮对话指标
interface DialogueMetrics {
  coherenceScore: number      // 连贯性评分 (0-1)
  topicDriftCount: number     // 话题漂移次数
  contextRetention: number    // 上下文保留率 (0-1)
  taskCompletionRate: number  // 任务完成率 (0-1)
  avgTurnsToComplete: number  // 平均完成轮数
  repeatRate: number          // 重复内容比例 (0-1)
  latencyPerTurn: number      // 每轮平均延迟（毫秒）
}

// 记忆指标
interface MemoryMetrics {
  recallAccuracy: number      // 召回准确率 (0-1)
  storageEfficiency: number   // 存储效率 (0-1)
  retrievalRelevance: number  // 检索相关性 (0-1)
  updateLatency: number       // 更新延迟（毫秒）
  memorySize: number          // 记忆大小（条数）
  avgRetrievalTime: number    // 平均检索时间（毫秒）
}
```

## 完整示例：React Hook

```typescript
import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3001/api'

export function useTestRun(agentId: string, taskId: string, apiConfigId: string) {
  const [testRun, setTestRun] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startTest = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. 启动测试
      const response = await fetch(`${API_BASE}/test-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, taskId, apiConfigId })
      })

      const { data } = await response.json()
      const testRunId = data.id

      // 2. 轮询测试状态
      let currentTestRun = data
      while (currentTestRun.status === 'running' || currentTestRun.status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const statusResponse = await fetch(`${API_BASE}/test-runs/${testRunId}`)
        const statusData = await statusResponse.json()
        currentTestRun = statusData.data

        setTestRun(currentTestRun)
      }

      // 3. 获取报告
      if (currentTestRun.status === 'completed') {
        const reportResponse = await fetch(`${API_BASE}/test-runs/${testRunId}/report`)
        const reportData = await reportResponse.json()
        setReport(reportData.data)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { testRun, report, loading, error, startTest }
}

// 使用示例
function TestPage() {
  const { testRun, report, loading, startTest } = useTestRun(
    'agent_id',
    'task_id',
    'api_config_id'
  )

  return (
    <div>
      <button onClick={startTest} disabled={loading}>
        {loading ? '测试中...' : '开始测试'}
      </button>

      {testRun && (
        <div>
          <h3>状态: {testRun.status}</h3>
          <p>成功率: {testRun.results.filter(r => r.isCorrect).length}/{testRun.results.length}</p>
        </div>
      )}

      {report && (
        <div>
          <h3>评测报告</h3>
          <p>{report.summary}</p>
          <h4>指标:</h4>
          <pre>{JSON.stringify(report.metrics, null, 2)}</pre>

          {report.issues.length > 0 && (
            <>
              <h4>发现的问题:</h4>
              <ul>
                {report.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </>
          )}

          {report.recommendations.length > 0 && (
            <>
              <h4>改进建议:</h4>
              <ul>
                {report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

## 可视化图表数据

### 意图识别 - 混淆矩阵

```typescript
// 从测试结果中提取混淆矩阵数据
const buildConfusionMatrix = (results: TestResult[], intents: string[]) => {
  const matrix: number[][] = Array(intents.length)
    .fill(0)
    .map(() => Array(intents.length).fill(0))

  results.forEach(result => {
    const actual = result.output.intent
    const expected = result.expected?.intent

    if (actual && expected) {
      const actualIndex = intents.indexOf(actual)
      const expectedIndex = intents.indexOf(expected)

      if (actualIndex >= 0 && expectedIndex >= 0) {
        matrix[expectedIndex][actualIndex]++
      }
    }
  })

  return matrix
}
```

### 延迟分布直方图

```typescript
const getLatencyDistribution = (results: TestResult[]) => {
  const buckets = [0, 500, 1000, 1500, 2000, 3000, 5000, Infinity]
  const distribution = new Array(buckets.length - 1).fill(0)

  results.forEach(result => {
    for (let i = 0; i < buckets.length - 1; i++) {
      if (result.latency >= buckets[i] && result.latency < buckets[i + 1]) {
        distribution[i]++
        break
      }
    }
  })

  return {
    labels: ['0-500ms', '500-1000ms', '1000-1500ms', '1500-2000ms', '2000-3000ms', '3000-5000ms', '5000ms+'],
    data: distribution
  }
}
```

### 置信度散点图

```typescript
const getConfidenceData = (results: TestResult[]) => {
  return results.map((result, index) => ({
    x: index,
    y: result.metrics.confidence || 0,
    correct: result.isCorrect
  }))
}
```

## 错误处理

```typescript
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || '请求失败')
  }
  return response.json()
}

// 使用示例
try {
  const response = await fetch(`${API_BASE}/agents`)
  const data = await handleApiError(response)
  // ...
} catch (error) {
  console.error('API 错误:', error.message)
  // 显示错误提示给用户
}
```

## 常见问题

### Q: 后端 CORS 已配置吗？
A: 是的，后端已配置 CORS，允许所有来源访问（开发环境）。

### Q: API Key 如何存储？
A: 后端使用 AES-256-CBC 加密存储，前端只需传递原始 API Key，加密由后端处理。

### Q: 测试执行需要多久？
A: 取决于测试用例数量和 LLM 响应速度，单个测试约 1-3 秒。建议显示实时进度。

### Q: 可以同时执行多个测试吗？
A: 可以，后端支持并发测试。但注意 LLM API 的速率限制。

### Q: 如何处理测试失败？
A: 检查 `testRun.status === 'failed'`，并查看 `results` 中的错误信息。

## 下一步

1. **安装前端依赖** - Next.js, React, TailwindCSS, shadcn/ui
2. **创建页面** - Dashboard, Agents, Tasks, Results, Settings
3. **集成图表库** - Recharts 或 Chart.js
4. **实现实时更新** - 使用轮询或 WebSocket（后续支持）
5. **添加用户体验** - Loading 状态、错误提示、成功通知

## 联系方式

如有疑问，请随时询问！

---

**祝你前端开发顺利！🚀**
