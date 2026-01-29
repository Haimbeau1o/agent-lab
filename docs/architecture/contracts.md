# Agent Lab - 核心契约定义

## 契约哲学

契约是系统的地基，一旦冻结就不能随意修改。所有组件必须严格遵守契约。

**变更规则：**
任何修改以下契约必须单独开 Issue 并经过团队讨论：
- Task Schema
- RunRecord Schema
- ScoreRecord Schema
- Pipeline 顺序
- Scenario 机制

## 1. Task Contract（任务契约）

系统只认两种任务：AtomicTask 和 ScenarioTask

### 1.1 AtomicTask（原子任务）

用于评测单一能力。

```typescript
interface AtomicTask {
  // 核心字段（不可变）
  id: string                    // 任务唯一标识
  name: string                  // 任务名称
  type: string                  // 能力类型（如 "intent", "dialogue"）

  // 输入输出
  input: unknown                // 任务输入（类型由模块定义）
  expected?: unknown            // 期望输出（用于评估）

  // 上下文
  context?: Record<string, unknown>  // 额外上下文信息

  // 元数据
  metadata: {
    tags?: string[]             // 标签（用于分类）
    priority?: number           // 优先级
    timeout?: number            // 超时时间（毫秒）
  }

  // 扩展点（模块自定义字段必须放这里）
  extensions?: Record<string, unknown>
}
```

**示例：**
```typescript
const intentTask: AtomicTask = {
  id: 'task-001',
  name: '识别订票意图',
  type: 'intent',
  input: '我想订一张明天去北京的机票',
  expected: {
    intent: 'book_flight',
    confidence: 0.9
  },
  metadata: {
    tags: ['intent', 'booking'],
    priority: 1,
    timeout: 5000
  }
}
```

### 1.2 ScenarioTask（场景任务）

用于评测多能力组合链路。

```typescript
interface ScenarioTask {
  // 基本信息
  id: string
  name: string
  description: string

  // 步骤定义
  steps: AtomicTask[]           // 按顺序执行的原子任务

  // 数据流定义（显式声明步骤间的数据传递）
  input_map: {
    [stepName: string]: {
      from: string              // 数据来源："step:previous" 或 "input:field"
      to: string                // 目标字段
    }[]
  }

  // 元数据
  metadata: Record<string, unknown>
}
```

**示例：**
```typescript
const multiTurnScenario: ScenarioTask = {
  id: 'scenario-001',
  name: '多轮对话订票流程',
  description: '测试意图识别 → 对话管理 → 记忆存储的完整链路',
  steps: [
    {
      id: 'step-1',
      name: 'recognize_intent',
      type: 'intent',
      input: '我想订机票',
      expected: { intent: 'book_flight' },
      metadata: {}
    },
    {
      id: 'step-2',
      name: 'manage_dialogue',
      type: 'dialogue',
      input: {
        intent: null,  // 将从 step-1 注入
        message: '请问您要去哪里？'
      },
      metadata: {}
    },
    {
      id: 'step-3',
      name: 'store_memory',
      type: 'memory',
      input: {
        conversation: null  // 将从 step-2 注入
      },
      metadata: {}
    }
  ],
  input_map: {
    'step-2': [
      { from: 'step:step-1.output.intent', to: 'input.intent' }
    ],
    'step-3': [
      { from: 'step:step-2.output.conversation', to: 'input.conversation' }
    ]
  },
  metadata: {}
}
```

## 2. RunRecord Contract（执行记录契约）

记录任务执行的完整过程。

```typescript
interface RunRecord {
  // 基本信息
  id: string
  taskId: string
  taskType: 'atomic' | 'scenario'

  // 执行状态
  status: 'pending' | 'running' | 'completed' | 'failed'

  // 结果
  output?: unknown
  error?: {
    message: string
    step?: string               // 失败的步骤（Scenario 专用）
    stack?: string
  }

  // 性能指标
  metrics: {
    latency: number             // 执行耗时（毫秒）
    tokens?: number             // Token 消耗
    cost?: number               // 成本（美元）
  }

  // Trace（一等公民，必须字段）
  trace: TraceEvent[]

  // Scenario 专用
  steps?: StepSummary[]         // 步骤摘要

  // 时间戳
  startedAt: Date
  completedAt?: Date

  // 可复现性保证
  provenance: {
    runnerId: string            // 使用的 Runner ID
    runnerVersion: string       // Runner 版本
    config: Record<string, unknown>  // 运行时配置
  }
}
```

### 2.1 TraceEvent（追踪事件）

```typescript
interface TraceEvent {
  timestamp: Date
  level: 'info' | 'debug' | 'warn' | 'error'
  step?: string                 // 所属步骤（Scenario 专用）
  event: string                 // 事件名称
  data?: unknown                // 事件数据
}
```

**示例：**
```typescript
const trace: TraceEvent[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    level: 'info',
    event: 'started'
  },
  {
    timestamp: new Date('2024-01-01T10:00:01Z'),
    level: 'debug',
    event: 'llm_call',
    data: { model: 'gpt-4', prompt: '...' }
  },
  {
    timestamp: new Date('2024-01-01T10:00:02Z'),
    level: 'info',
    event: 'completed',
    data: { output: { intent: 'book_flight' } }
  }
]
```

### 2.2 StepSummary（步骤摘要）

```typescript
interface StepSummary {
  stepId: string
  stepName: string
  status: 'completed' | 'failed' | 'skipped'
  latency: number
  output?: unknown
  error?: string
}
```

## 3. ScoreRecord Contract（评分记录契约）

记录评估结果。

```typescript
interface ScoreRecord {
  // 基本信息
  id: string
  runId: string                 // 关联的 RunRecord ID

  // 指标
  metric: string                // 指标名称（如 "accuracy", "latency"）
  value: number | boolean | string  // 指标值

  // 评估目标
  target: 'final' | 'global' | `step:${string}`
  // - final: 评估最终输出
  // - global: 评估整体过程
  // - step:xxx: 评估特定步骤

  // 证据（可解释性）
  evidence?: {
    explanation?: string        // 评分解释
    snippets?: string[]         // 相关片段
    alignment?: Record<string, unknown>  // 对齐数据
  }

  // 评估器信息
  evaluatorId: string

  // 时间戳
  createdAt: Date
}
```

**示例：**
```typescript
const scores: ScoreRecord[] = [
  {
    id: 'score-001',
    runId: 'run-123',
    metric: 'accuracy',
    value: 0.95,
    target: 'final',
    evidence: {
      explanation: '输出意图与期望意图匹配',
      snippets: ['expected: book_flight', 'actual: book_flight']
    },
    evaluatorId: 'intent.metrics',
    createdAt: new Date()
  },
  {
    id: 'score-002',
    runId: 'run-123',
    metric: 'latency',
    value: 234,
    target: 'global',
    evaluatorId: 'intent.metrics',
    createdAt: new Date()
  }
]
```

## 4. Runner Interface（执行器接口）

```typescript
interface Runner {
  id: string                    // Runner 唯一标识
  type: string                  // 能力类型
  version: string               // 版本号

  execute(
    task: AtomicTask,
    config: unknown
  ): Promise<RunRecord>
}
```

## 5. Evaluator Interface（评估器接口）

```typescript
interface Evaluator {
  id: string                    // Evaluator 唯一标识
  metrics: string[]             // 支持的指标列表

  evaluate(
    run: RunRecord,
    task: AtomicTask
  ): Promise<ScoreRecord[]>
}
```

## 契约使用规范

### 规范 1：模块自定义字段必须放在 extensions
```typescript
// ❌ 错误：直接添加字段
interface AtomicTask {
  id: string
  intentSpecificField: string  // 不允许！
}

// ✅ 正确：使用 extensions
const task: AtomicTask = {
  id: 'task-001',
  type: 'intent',
  extensions: {
    intentSpecificField: 'value'
  }
}
```

### 规范 2：Trace 必须记录所有关键步骤
```typescript
// ❌ 错误：没有 Trace
async execute(task: AtomicTask): Promise<RunRecord> {
  const output = await this.process(task.input)
  return { output }
}

// ✅ 正确：完整 Trace
async execute(task: AtomicTask): Promise<RunRecord> {
  const trace: TraceEvent[] = []

  trace.push({ timestamp: new Date(), level: 'info', event: 'started' })

  try {
    const output = await this.process(task.input)
    trace.push({ timestamp: new Date(), level: 'info', event: 'completed' })
    return { output, trace }
  } catch (error) {
    trace.push({
      timestamp: new Date(),
      level: 'error',
      event: 'failed',
      data: { error: error.message }
    })
    throw error
  }
}
```

### 规范 3：错误必须包含步骤上下文
```typescript
// ❌ 错误：没有步骤信息
return {
  status: 'failed',
  error: { message: 'Validation failed' }
}

// ✅ 正确：包含步骤信息
return {
  status: 'failed',
  error: {
    message: 'Validation failed',
    step: 'validate-input'
  }
}
```

## 下一步

参考 [module-guide.md](./module-guide.md) 了解如何基于这些契约开发新模块。
