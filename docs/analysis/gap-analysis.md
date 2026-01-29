# Agent Lab - 现有代码与新架构差距分析

## 1. 现状分析

### 1.1 当前代码结构

```
agent-lab/backend/src/
├── types/                    # 类型定义
│   ├── agent.ts             # Agent 类型（硬编码 3 种）
│   ├── task.ts              # Task 类型
│   ├── result.ts            # TestRun/TestResult 类型
│   ├── dataset.ts
│   ├── llm.ts
│   └── api-config.ts
├── lib/
│   ├── agents/              # Agent 实现
│   │   ├── intent.ts        # IntentRecognizer 类
│   │   ├── dialogue.ts      # DialogueManager 类
│   │   └── memory.ts        # MemoryManager 类
│   ├── evaluator/           # 评估器
│   │   ├── intent-metrics.ts
│   │   ├── dialogue-metrics.ts
│   │   ├── memory-metrics.ts
│   │   └── report.ts
│   ├── llm/
│   │   └── client.ts        # LLM 客户端
│   ├── utils/
│   │   └── logger.ts
│   └── prisma.ts            # 数据库客户端
└── api/                     # REST API
    ├── agents/
    ├── tasks/
    ├── test-runs/
    ├── datasets/
    └── settings/
```

### 1.2 现有类型定义分析

#### Agent 类型（types/agent.ts）
```typescript
// 硬编码的 3 种类型
export type AgentType = 'intent' | 'dialogue' | 'memory'

// Agent 配置
export interface AgentConfig {
  temperature?: number
  maxTokens?: number
  // ...
}

// Agent 模板
export interface AgentTemplate {
  id: string
  name: string
  type: AgentType  // 硬编码类型
  config: AgentConfig
  systemPrompt: string
  // ...
}
```

**问题：**
- ❌ 类型硬编码，无法扩展
- ❌ 没有 Runner 接口概念
- ❌ 没有版本信息

#### Task 类型（types/task.ts）
```typescript
export interface Task {
  id: string
  name: string
  description: string
  type: AgentType  // 硬编码类型
  testCases: BaseTestCase[]  // 测试用例数组
  // ...
}

export interface BaseTestCase {
  id?: string
  input: string | Record<string, unknown>
  expected?: unknown
}
```

**问题：**
- ❌ 不符合 AtomicTask 契约
- ❌ 没有 ScenarioTask 支持
- ❌ 没有 context 字段
- ❌ 没有 metadata 字段
- ❌ 没有 extensions 扩展点

#### TestRun/TestResult 类型（types/result.ts）
```typescript
export interface TestRun {
  id: string
  agentId: string  // 关联 Agent
  taskId: string
  status: TestRunStatus
  startedAt: Date
  completedAt?: Date
  results?: TestResult[]  // 结果数组
}

export interface TestResult {
  id: string
  testRunId: string
  input: unknown
  output: unknown
  expected?: unknown
  latency: number
  tokenCount?: number
  metrics: Record<string, unknown>  // 松散的 metrics
  isCorrect?: boolean
  // ...
}
```

**问题：**
- ❌ 不符合 RunRecord 契约
- ❌ 没有 Trace 系统
- ❌ 没有 Provenance 信息
- ❌ metrics 是松散的 Record，不是结构化的 ScoreRecord
- ❌ 没有 error 结构（只有 status）
- ❌ 没有 cost 信息

### 1.3 现有实现分析

#### IntentRecognizer 类（lib/agents/intent.ts）
```typescript
export class IntentRecognizer {
  private readonly llmClient: LLMClient
  private readonly config: IntentConfig

  async recognize(input: string): Promise<IntentResult> {
    // 1. 构建 prompt
    // 2. 调用 LLM
    // 3. 解析结果
    // 4. 返回 IntentResult
  }
}
```

**问题：**
- ❌ 不是 Runner 接口实现
- ❌ 没有 Trace 记录
- ❌ 没有返回 RunRecord
- ❌ 没有性能指标收集
- ❌ 没有 Provenance 信息
- ❌ 错误处理不结构化

**优点：**
- ✅ 有基本的错误处理
- ✅ 有配置验证
- ✅ 代码清晰易读

#### 评估器实现（lib/evaluator/intent-metrics.ts）
```typescript
export function calculateIntentMetrics(results: TestResult[]): IntentMetrics {
  // 批量计算指标
  // 返回 IntentMetrics 对象
}
```

**问题：**
- ❌ 不是 Evaluator 接口实现
- ❌ 是批量计算函数，不是单个 RunRecord 的评估
- ❌ 返回 IntentMetrics，不是 ScoreRecord[]
- ❌ 没有 evidence 字段（不可解释）
- ❌ 没有 target 字段（final/global/step）
- ❌ 没有 evaluatorId

**优点：**
- ✅ 有实际的指标计算逻辑（accuracy, precision, recall, f1）
- ✅ 有混淆矩阵计算
- ✅ 代码清晰

### 1.4 API 层分析

#### test-runs API（api/test-runs/index.ts）
```typescript
// 硬编码的类型检查
if (agent.type === 'intent') {
  await executeIntentTests(...)
} else if (agent.type === 'dialogue') {
  await executeDialogueTests(...)
}

// 直接实例化 Agent
const recognizer = new IntentRecognizer(llmClient, config)
```

**问题：**
- ❌ 硬编码类型检查（line 181-187）- 违反扩展性原则
- ❌ 直接实例化 Agent 类 - 应该通过 Registry
- ❌ 没有使用 Core Engine - 在 API 层直接执行
- ❌ 没有 Trace 系统
- ❌ 没有 Provenance 记录
- ❌ 使用 console.log（line 132, 195）- 违反编码规范
- ❌ 错误处理不结构化

**优点：**
- ✅ 有输入验证（Zod）
- ✅ 有基本错误处理
- ✅ 异步执行（后台任务）
- ✅ REST API 设计合理

## 2. 主要差距总结

### 2.1 架构层面

| 新架构要求 | 现有实现 | 差距 |
|-----------|---------|------|
| 三层架构（Core → Modules → Implementations） | 扁平结构（types + lib + api） | ❌ 缺少分层 |
| Core Engine（通用评测引擎） | 无 | ❌ 完全缺失 |
| Registry 机制 | 无 | ❌ 完全缺失 |
| Runner 接口 | Agent 类 | ❌ 不符合接口 |
| Evaluator 接口 | 批量计算函数 | ❌ 不符合接口 |
| 固定 Pipeline | 无 | ❌ 完全缺失 |

### 2.2 契约层面

| 契约 | 新架构要求 | 现有实现 | 差距 |
|-----|-----------|---------|------|
| Task | AtomicTask + ScenarioTask | Task + testCases | ❌ 结构不符 |
| RunRecord | 包含 trace/provenance/metrics | TestRun + TestResult | ❌ 缺少关键字段 |
| ScoreRecord | 结构化评分记录 | 松散的 metrics | ❌ 不符合契约 |
| TraceEvent | 一等公民 | 无 | ❌ 完全缺失 |

### 2.3 功能层面

| 功能 | 新架构要求 | 现有实现 | 差距 |
|-----|-----------|---------|------|
| ScenarioTask | 多步骤组合评测 | 无 | ❌ 完全缺失 |
| Trace 系统 | 完整执行追踪 | 无 | ❌ 完全缺失 |
| Provenance | 可复现性保证 | 无 | ❌ 完全缺失 |
| A/B 对比 | 多次运行对比 | 无 | ❌ 完全缺失 |
| 扩展性 | 通过 Registry 注册 | 硬编码类型 | ❌ 不可扩展 |

### 2.4 代码质量层面

| 规范 | 要求 | 现有实现 | 差距 |
|-----|------|---------|------|
| 不可变性 | 必须 | 部分遵守 | ⚠️ 需检查 |
| 错误处理 | 结构化 | 基本处理 | ⚠️ 需改进 |
| 日志 | 使用 logger | 使用 console.log | ❌ 违反规范 |
| 测试覆盖 | 80%+ | 有部分测试 | ⚠️ 需提升 |

## 3. 可复用的部分

尽管存在架构差距，但现有代码中有一些可以复用的部分：

### 3.1 业务逻辑
- ✅ **IntentRecognizer 的核心逻辑** - prompt 构建、LLM 调用、结果解析
- ✅ **DialogueManager 的对话管理逻辑** - 可以适配到新的 Runner 接口
- ✅ **MemoryManager 的记忆管理逻辑** - 可以适配到新的 Runner 接口
- ✅ **评估器的指标计算逻辑** - accuracy, precision, recall, f1 等

### 3.2 基础设施
- ✅ **LLMClient** - 可以继续使用
- ✅ **Prisma 数据库配置** - 需要更新 schema，但基础设施可用
- ✅ **API 加密/解密逻辑** - 可以继续使用
- ✅ **Zod 验证** - 可以继续使用

### 3.3 测试
- ✅ **现有的单元测试** - 可以作为参考，但需要适配新接口

## 4. 需要重构的部分

### 4.1 完全重写（不可复用）
- ❌ **类型定义** - Task, TestRun, TestResult 需要完全重写为 AtomicTask, RunRecord, ScoreRecord
- ❌ **API 层** - 需要重写为使用 Core Engine
- ❌ **数据库 Schema** - 需要更新以支持新契约

### 4.2 适配改造（可部分复用）
- ⚠️ **Agent 类** - 改造为 Runner 接口实现
- ⚠️ **评估器函数** - 改造为 Evaluator 接口实现
- ⚠️ **测试执行逻辑** - 移到 Core Engine

### 4.3 新增功能（完全缺失）
- ➕ **Core Engine** - 需要从零开发
- ➕ **Registry 机制** - 需要从零开发
- ➕ **Trace 系统** - 需要从零开发
- ➕ **ScenarioTask 支持** - 需要从零开发
- ➕ **Provenance 记录** - 需要从零开发
- ➕ **A/B 对比功能** - 需要从零开发

## 5. 迁移策略

### 5.1 策略选择：渐进式迁移

**推荐方案：并行开发 + 逐步切换**

原因：
1. 现有代码与新架构差距太大，无法原地重构
2. 需要保持现有功能可用（如果有用户在使用）
3. 可以逐步验证新架构的正确性

### 5.2 迁移路径

```
Phase 0: 建立新架构基础（Week 1-2）
  ├── 定义核心契约（Task, RunRecord, ScoreRecord）
  ├── 实现 Registry 机制
  └── 创建目录结构

Phase 1: 实现 Core Engine（Week 3-4）
  ├── 实现 EvalEngine
  ├── 实现 AtomicExecutor
  ├── 实现 ScenarioExecutor
  └── 实现 Storage Adapter

Phase 2: 迁移能力模块（Week 5-6）
  ├── Intent 模块（复用现有逻辑）
  ├── Dialogue 模块（复用现有逻辑）
  └── Memory 模块（复用现有逻辑）

Phase 3: 新 API + 前端（Week 7-8）
  ├── 新 API 端点（/api/eval/*）
  ├── 保留旧 API（/api/test-runs/*）
  └── 前端适配

Phase 4: 数据迁移 + 切换（Week 9）
  ├── 数据库 Schema 更新
  ├── 数据迁移脚本
  └── 废弃旧 API
```

### 5.3 目录结构对比

**现有结构：**
```
backend/src/
├── types/
├── lib/agents/
├── lib/evaluator/
└── api/
```

**新架构结构：**
```
backend/src/
├── core/              # 新增：核心引擎
│   ├── contracts/
│   ├── engine/
│   ├── registry/
│   └── storage/
├── modules/           # 新增：能力模块
│   ├── intent/
│   ├── dialogue/
│   └── memory/
├── cli/               # 新增：CLI 工具
├── api/
│   ├── eval/          # 新增：新 API
│   └── test-runs/     # 保留：旧 API（待废弃）
└── lib/               # 保留：共享工具
    ├── llm/
    └── utils/
```

## 6. 下一步行动建议

### 立即行动（本周）
1. ✅ **已完成：创建架构文档**
   - vision.md
   - architecture.md
   - contracts.md
   - 团队手册（4个）

2. 🔄 **进行中：差距分析**
   - gap-analysis.md（本文档）

3. ⏭️ **下一步：开始 Phase 0**
   - 创建核心契约的 TypeScript 定义
   - 创建 Registry 接口
   - 创建新目录结构

### 建议工作流程

**选项 A：完全重写（推荐）**
- 在新目录结构中从零开发
- 复用现有业务逻辑（IntentRecognizer 等）
- 保留旧代码作为参考
- 逐步切换

**选项 B：原地重构（不推荐）**
- 风险高，容易破坏现有功能
- 难以回滚
- 不适合架构差距如此大的情况

## 7. 总结

### 核心发现
1. **架构差距巨大** - 现有代码是传统单体应用，新架构是可扩展的评测基础设施
2. **契约完全不符** - 需要重新定义所有核心数据结构
3. **有可复用价值** - 业务逻辑（Agent 实现、评估器）可以适配复用
4. **建议并行开发** - 在新目录结构中开发，逐步切换

### 风险评估
- **高风险**：数据迁移、API 兼容性
- **中风险**：业务逻辑适配、测试覆盖
- **低风险**：新功能开发（ScenarioTask, Trace）

### 预期收益
- ✅ 可扩展架构（新能力无需改 Core）
- ✅ 可复现性（Trace + Provenance）
- ✅ 多步骤评测（ScenarioTask）
- ✅ A/B 对比能力
- ✅ 符合 llm.txt 愿景
