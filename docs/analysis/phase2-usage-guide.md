# Phase 2 模块使用指南

## 快速开始

### 1. Intent 模块

#### 使用 IntentLLMRunner

```typescript
import { IntentLLMRunner } from './modules/intent'
import type { AtomicTask } from './core/contracts/task'
import { LLMClient } from './lib/llm/client'

// 创建 LLM 客户端
const llmClient = new LLMClient({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4'
})

// 创建 Runner
const runner = new IntentLLMRunner(llmClient)

// 定义任务
const task: AtomicTask = {
  id: 'task-1',
  name: 'Recognize greeting intent',
  type: 'intent',
  input: {
    text: 'Hello, how are you?'
  },
  expected: {
    intent: 'greeting',
    confidence: 0.8
  },
  metadata: {}
}

// 定义配置
const config = {
  intents: ['greeting', 'question', 'complaint', 'farewell'],
  examples: {
    greeting: ['hello', 'hi', 'good morning'],
    question: ['how do I', 'what is', 'can you explain']
  },
  temperature: 0.3,
  maxTokens: 100
}

// 执行任务
const runRecord = await runner.execute(task, config)

console.log('Status:', runRecord.status)
console.log('Output:', runRecord.output)
console.log('Metrics:', runRecord.metrics)
console.log('Trace events:', runRecord.trace.length)
```

#### 使用 IntentMetricsEvaluator

```typescript
import { IntentMetricsEvaluator } from './modules/intent'

// 创建 Evaluator
const evaluator = new IntentMetricsEvaluator()

// 评估运行记录
const scores = await evaluator.evaluate(runRecord, task)

// 查看评分
for (const score of scores) {
  console.log(`${score.metric}: ${score.value}`)
  console.log(`  Explanation: ${score.evidence?.explanation}`)
}

// 输出示例:
// accuracy: 1
//   Explanation: Intent correctly identified as "greeting"
// confidence: 0.95
//   Explanation: Model confidence: 0.95
// latency: 523
//   Explanation: Execution took 523ms
```

### 2. Dialogue 模块

#### 使用 DialogueLLMRunner

```typescript
import { DialogueLLMRunner } from './modules/dialogue'

const runner = new DialogueLLMRunner(llmClient)

// 第一轮对话
const task1: AtomicTask = {
  id: 'task-2',
  name: 'First dialogue turn',
  type: 'dialogue',
  input: {
    message: 'Hello, I need help with my account'
  },
  metadata: {}
}

const config = {
  maxHistoryLength: 10,
  temperature: 0.7,
  maxTokens: 150
}

const run1 = await runner.execute(task1, config)
const output1 = run1.output as DialogueOutput

console.log('Assistant:', output1.response)
console.log('History length:', output1.history.length)

// 第二轮对话 - 带历史
const task2: AtomicTask = {
  id: 'task-3',
  name: 'Second dialogue turn',
  type: 'dialogue',
  input: {
    message: 'What did I just say?',
    history: output1.history  // 传递历史
  },
  metadata: {}
}

const run2 = await runner.execute(task2, config)
const output2 = run2.output as DialogueOutput

console.log('Assistant:', output2.response)
console.log('History length:', output2.history.length)
```

#### 使用 DialogueMetricsEvaluator

```typescript
import { DialogueMetricsEvaluator } from './modules/dialogue'

const evaluator = new DialogueMetricsEvaluator()

// 定义期望输出
const taskWithExpected: AtomicTask = {
  ...task1,
  expected: {
    responseContains: ['account', 'help'],
    minResponseLength: 50,
    maxResponseLength: 200
  }
}

const scores = await evaluator.evaluate(run1, taskWithExpected)

// 查看相关性评分
const relevanceScore = scores.find(s => s.metric === 'relevance')
console.log('Relevance:', relevanceScore?.value)
console.log('Explanation:', relevanceScore?.evidence?.explanation)
```

### 3. Memory 模块

#### 使用 MemoryLLMRunner - 提取记忆

```typescript
import { MemoryLLMRunner } from './modules/memory'

const runner = new MemoryLLMRunner(llmClient)

// 提取记忆
const extractTask: AtomicTask = {
  id: 'task-4',
  name: 'Extract memories',
  type: 'memory',
  input: {
    operation: 'extract',
    message: 'My name is John, I am 30 years old, and I love programming in TypeScript.'
  },
  metadata: {}
}

const config = {
  maxMemorySize: 100,
  temperature: 0.5,
  maxTokens: 200
}

const extractRun = await runner.execute(extractTask, config)
const extractOutput = extractRun.output as MemoryOutput

console.log('Extracted memories:', extractOutput.memories)
// [
//   { key: 'name', value: 'John', importance: 0.9, timestamp: ... },
//   { key: 'age', value: 30, importance: 0.7, timestamp: ... },
//   { key: 'interest', value: 'programming in TypeScript', importance: 0.8, timestamp: ... }
// ]
```

#### 使用 MemoryLLMRunner - 检索记忆

```typescript
// 检索记忆
const retrieveTask: AtomicTask = {
  id: 'task-5',
  name: 'Retrieve memories',
  type: 'memory',
  input: {
    operation: 'retrieve',
    message: 'What is my name?',
    existingMemories: extractOutput.memories  // 传递已提取的记忆
  },
  metadata: {}
}

const retrieveRun = await runner.execute(retrieveTask, config)
const retrieveOutput = retrieveRun.output as MemoryOutput

console.log('Retrieved memories:', retrieveOutput.memories)
// [
//   { key: 'name', value: 'John', importance: 0.9, timestamp: ... }
// ]
```

#### 使用 MemoryMetricsEvaluator

```typescript
import { MemoryMetricsEvaluator } from './modules/memory'

const evaluator = new MemoryMetricsEvaluator()

// 定义期望输出
const taskWithExpected: AtomicTask = {
  ...extractTask,
  expected: {
    operation: 'extract',
    minMemoryCount: 2,
    requiredKeys: ['name', 'age'],
    minImportance: 0.5
  }
}

const scores = await evaluator.evaluate(extractRun, taskWithExpected)

// 查看准确性评分
const accuracyScore = scores.find(s => s.metric === 'accuracy')
console.log('Accuracy:', accuracyScore?.value)

// 查看记忆数量
const countScore = scores.find(s => s.metric === 'memory_count')
console.log('Memory count:', countScore?.value)

// 查看平均重要性
const importanceScore = scores.find(s => s.metric === 'avg_importance')
console.log('Average importance:', importanceScore?.value)
```

## 注册到 Registry

### 注册 Runners

```typescript
import { RunnerRegistry } from './core/registry'
import { IntentLLMRunner, DialogueLLMRunner, MemoryLLMRunner } from './modules'

const runnerRegistry = new RunnerRegistry()

// 注册所有 Runners
runnerRegistry.register(new IntentLLMRunner(llmClient))
runnerRegistry.register(new DialogueLLMRunner(llmClient))
runnerRegistry.register(new MemoryLLMRunner(llmClient))

// 通过 ID 获取 Runner
const intentRunner = runnerRegistry.get('intent.llm')

// 按类型列出 Runners
const intentRunners = runnerRegistry.listByType('intent')
console.log('Intent runners:', intentRunners.map(r => r.id))
```

### 注册 Evaluators

```typescript
import { EvaluatorRegistry } from './core/registry'
import {
  IntentMetricsEvaluator,
  DialogueMetricsEvaluator,
  MemoryMetricsEvaluator
} from './modules'

const evaluatorRegistry = new EvaluatorRegistry()

// 注册所有 Evaluators
evaluatorRegistry.register(new IntentMetricsEvaluator())
evaluatorRegistry.register(new DialogueMetricsEvaluator())
evaluatorRegistry.register(new MemoryMetricsEvaluator())

// 通过 ID 获取 Evaluator
const intentEvaluator = evaluatorRegistry.get('intent.metrics')

// 按指标查找 Evaluators
const accuracyEvaluators = evaluatorRegistry.findByMetric('accuracy')
console.log('Accuracy evaluators:', accuracyEvaluators.map(e => e.id))
```

## 完整示例: 端到端评测

```typescript
import { LLMClient } from './lib/llm/client'
import {
  IntentLLMRunner,
  IntentMetricsEvaluator
} from './modules/intent'
import type { AtomicTask } from './core/contracts/task'

async function runIntentEvaluation() {
  // 1. 初始化
  const llmClient = new LLMClient({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4'
  })

  const runner = new IntentLLMRunner(llmClient)
  const evaluator = new IntentMetricsEvaluator()

  // 2. 定义任务
  const task: AtomicTask = {
    id: 'eval-1',
    name: 'Intent Recognition Test',
    type: 'intent',
    input: {
      text: 'Hello, how are you doing today?'
    },
    expected: {
      intent: 'greeting',
      confidence: 0.8
    },
    metadata: {
      tags: ['greeting', 'test'],
      priority: 1
    }
  }

  // 3. 定义配置
  const config = {
    intents: ['greeting', 'question', 'complaint', 'farewell'],
    examples: {
      greeting: ['hello', 'hi', 'good morning', 'hey there'],
      question: ['how do I', 'what is', 'can you explain', 'where can I']
    },
    temperature: 0.3,
    maxTokens: 100
  }

  // 4. 执行任务
  console.log('Executing task...')
  const runRecord = await runner.execute(task, config)

  // 5. 检查执行状态
  if (runRecord.status === 'failed') {
    console.error('Execution failed:', runRecord.error?.message)
    return
  }

  // 6. 显示结果
  console.log('\n=== Execution Result ===')
  console.log('Status:', runRecord.status)
  console.log('Output:', runRecord.output)
  console.log('Latency:', runRecord.metrics.latency, 'ms')
  console.log('Tokens:', runRecord.metrics.tokens)
  console.log('Cost: $', runRecord.metrics.cost?.toFixed(4))

  // 7. 显示 Trace
  console.log('\n=== Trace Events ===')
  for (const event of runRecord.trace) {
    console.log(`[${event.level}] ${event.event}:`, event.data)
  }

  // 8. 评估结果
  console.log('\n=== Evaluation ===')
  const scores = await evaluator.evaluate(runRecord, task)

  for (const score of scores) {
    console.log(`\n${score.metric}:`, score.value)
    console.log('  Target:', score.target)
    console.log('  Explanation:', score.evidence?.explanation)
    if (score.evidence?.alignment) {
      console.log('  Alignment:', score.evidence.alignment)
    }
  }

  // 9. 返回结果
  return {
    runRecord,
    scores
  }
}

// 运行评测
runIntentEvaluation()
  .then(result => {
    console.log('\n✅ Evaluation completed successfully!')
  })
  .catch(error => {
    console.error('\n❌ Evaluation failed:', error)
  })
```

## 批量评测示例

```typescript
async function runBatchEvaluation() {
  const llmClient = new LLMClient({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4'
  })

  const runner = new IntentLLMRunner(llmClient)
  const evaluator = new IntentMetricsEvaluator()

  // 定义测试用例
  const testCases = [
    { text: 'Hello!', expected: 'greeting' },
    { text: 'How do I reset my password?', expected: 'question' },
    { text: 'This is not working!', expected: 'complaint' },
    { text: 'Goodbye!', expected: 'farewell' }
  ]

  const config = {
    intents: ['greeting', 'question', 'complaint', 'farewell'],
    temperature: 0.3,
    maxTokens: 100
  }

  const results = []

  // 执行所有测试用例
  for (const testCase of testCases) {
    const task: AtomicTask = {
      id: `task-${results.length + 1}`,
      name: `Test: ${testCase.text}`,
      type: 'intent',
      input: { text: testCase.text },
      expected: { intent: testCase.expected },
      metadata: {}
    }

    const runRecord = await runner.execute(task, config)
    const scores = await evaluator.evaluate(runRecord, task)

    results.push({
      input: testCase.text,
      expected: testCase.expected,
      actual: (runRecord.output as any)?.intent,
      accuracy: scores.find(s => s.metric === 'accuracy')?.value,
      confidence: scores.find(s => s.metric === 'confidence')?.value,
      latency: runRecord.metrics.latency
    })
  }

  // 显示汇总
  console.log('\n=== Batch Evaluation Results ===')
  console.table(results)

  // 计算总体指标
  const avgAccuracy = results.reduce((sum, r) => sum + (r.accuracy as number), 0) / results.length
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length

  console.log('\n=== Summary ===')
  console.log('Average Accuracy:', avgAccuracy.toFixed(2))
  console.log('Average Latency:', avgLatency.toFixed(0), 'ms')
  console.log('Total Tests:', results.length)
  console.log('Passed:', results.filter(r => r.accuracy === 1).length)
  console.log('Failed:', results.filter(r => r.accuracy === 0).length)
}

runBatchEvaluation()
```

## 下一步

现在你已经了解了如何使用新的模块系统。接下来:

1. **Phase 3**: 创建新的 API 端点来暴露这些功能
2. **Phase 4**: 更新前端以使用新的 API
3. **扩展**: 添加新的能力模块 (只需实现 Runner 和 Evaluator 接口)

查看 `phase2-completion-report.md` 了解更多详情。
