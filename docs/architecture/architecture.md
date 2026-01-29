# Agent Lab - 系统架构

## 架构哲学

### 核心原则
1. **Core Engine 不懂业务** - 引擎是通用的，不知道 intent/dialogue/memory 是什么
2. **Trace 是一等公民** - 所有执行步骤必须可追溯
3. **扩展靠注册与契约，不靠改 Core** - 新功能通过插件机制接入

## 三层架构模型

```
┌─────────────────────────────────────────────────────────┐
│  Implementations Layer (实现层)                          │
│  - intent.llm (LLM 实现)                                │
│  - intent.rules (规则引擎实现)                           │
│  - dialogue.openai (OpenAI 实现)                        │
│  - memory.vector (向量数据库实现)                        │
└─────────────────────────────────────────────────────────┘
                        ↓ 通过 Registry 注册
┌─────────────────────────────────────────────────────────┐
│  Capability Modules Layer (能力模块层)                   │
│  - intent (意图识别模块)                                 │
│  - dialogue (对话管理模块)                               │
│  - memory (记忆管理模块)                                 │
│  - custom (自定义模块)                                   │
└─────────────────────────────────────────────────────────┘
                        ↓ 使用
┌─────────────────────────────────────────────────────────┐
│  Core Eval Engine (核心评测引擎 - 基础设施层)            │
│  - Pipeline (固定流程)                                   │
│  - Registry (注册中心)                                   │
│  - Storage (存储适配器)                                  │
│  - Executor (执行器)                                     │
└─────────────────────────────────────────────────────────┘
```

### 层级职责

#### A. Core Eval Engine（基础设施层）
**职责：**
- 提供固定 Pipeline
- 调度 Runner
- 记录 Trace
- 调用 Evaluator
- 存储与对比结果

**约束：**
- ❌ 不理解业务能力（不关心 intent/dialogue/memory 是什么）
- ❌ 不包含任何能力特定的逻辑
- ✅ 只提供通用的评测基础设施

#### B. Capability Modules（能力模块层）
**职责：**
- 定义 Task 模板
- 提供 Runner 实现
- 提供默认 Evaluators
- 提供 Demo Dataset + 文档

**约束：**
- ❌ 不得侵入 Core Engine
- ❌ 不得依赖其他模块
- ✅ 通过 Registry 注册

#### C. Implementations（实现层）
**职责：**
- 同一模块的不同实现方式
- 例如：intent.llm, intent.rules, intent.local_service

**约束：**
- ❌ 不得修改模块结构
- ❌ 不得修改 Engine
- ✅ 新增实现 = 新 Runner

## 固定 Pipeline（永远不变）

所有能力、模块、功能都必须走这条闭环：

```
1. Define (定义)
   ↓ 选择 Task / Scenario / Dataset / Runner / Evaluators

2. Execute (执行)
   ↓ 运行 Runner / ScenarioRunner

3. Trace (追踪)
   ↓ 记录步骤 / 工具调用 / 记忆 / 日志 / 错误

4. Evaluate (评估)
   ↓ 内置 + 用户自定义 Evaluators 打分

5. Store (存储)
   ↓ RunRecord / ScoreRecord / Provenance

6. Compare (对比)
   ↓ A/B / 历史回归 / 趋势

7. Report (报告)
   ↓ CLI / API / UI / Export
```

## 扩展点（唯一允许的扩展方式）

任何新功能必须属于以下之一：

### 1. Task Template（新任务结构）
定义新的任务类型和数据结构

### 2. Runner（新实现方式）
实现 `Runner` 接口，提供新的执行逻辑

### 3. Evaluator（新指标/评分逻辑）
实现 `Evaluator` 接口，提供新的评估方法

### 4. Dataset Connector（数据来源）
连接不同的数据源（文件、数据库、API）

### 5. Reporter / UI（展示层）
新的结果展示方式（CLI、Web UI、导出格式）

**禁止：为了某个模块改 Engine 业务逻辑**

## 目录结构

```
agent-lab/
├── backend/
│   └── src/
│       ├── core/                    # 核心引擎（通用）
│       │   ├── contracts/           # 契约定义
│       │   │   ├── task.ts
│       │   │   ├── run-record.ts
│       │   │   └── score-record.ts
│       │   ├── engine/              # 评测引擎
│       │   │   ├── eval-engine.ts
│       │   │   ├── atomic-executor.ts
│       │   │   └── scenario-executor.ts
│       │   ├── registry/            # 注册中心
│       │   │   ├── runner-registry.ts
│       │   │   └── evaluator-registry.ts
│       │   └── storage/             # 存储适配器
│       │       ├── storage-adapter.ts
│       │       └── prisma-adapter.ts
│       │
│       ├── modules/                 # 能力模块（可插拔）
│       │   ├── intent/
│       │   │   ├── runners/
│       │   │   │   ├── llm-runner.ts
│       │   │   │   └── rules-runner.ts
│       │   │   ├── evaluators/
│       │   │   │   └── intent-evaluator.ts
│       │   │   └── index.ts
│       │   ├── dialogue/
│       │   └── memory/
│       │
│       ├── cli/                     # CLI 工具
│       └── api/                     # REST API
│
└── docs/
    ├── architecture/                # 架构文档
    └── team/                        # 团队手册
```

## 数据流

### AtomicTask 执行流程
```
User → Define Task → Engine.run()
                        ↓
                   Registry.get(type)
                        ↓
                   Runner.execute()
                        ↓
                   Collect Trace
                        ↓
                   Evaluator.evaluate()
                        ↓
                   Storage.save()
                        ↓
                   Return RunRecord
```

### ScenarioTask 执行流程
```
User → Define Scenario → Engine.run()
                            ↓
                       For each step:
                         ↓
                       Resolve input_map
                         ↓
                       Execute AtomicTask
                         ↓
                       Collect step trace
                         ↓
                       Continue or fail
                            ↓
                       Aggregate results
                            ↓
                       Evaluate (step + global + final)
                            ↓
                       Storage.save()
                            ↓
                       Return RunRecord
```

## 关键设计决策

### 1. 为什么要三层架构？
- **分离关注点**：基础设施、业务能力、具体实现各司其职
- **可扩展性**：新能力不影响核心引擎
- **可测试性**：每层独立测试

### 2. 为什么 Trace 是一等公民？
- **可调试性**：开发者需要看到每一步发生了什么
- **可解释性**：评测结果需要有证据支撑
- **可复现性**：完整的执行记录是复现的基础

### 3. 为什么用 Registry 而不是直接导入？
- **解耦**：Core Engine 不依赖具体模块
- **动态加载**：运行时选择实现
- **可扩展**：第三方可以注册自己的 Runner

### 4. 为什么区分 AtomicTask 和 ScenarioTask？
- **AtomicTask**：单一能力的独立测试，简单直接
- **ScenarioTask**：多能力组合的端到端测试，模拟真实场景
- **灵活性**：既支持单元测试，也支持集成测试

## 架构约束（三条红线）

### 红线 1：Engine 不懂业务
```typescript
// ❌ 错误：Engine 包含业务逻辑
class EvalEngine {
  async run(task: AtomicTask) {
    if (task.type === 'intent') {
      return this.runIntent(task)  // 业务逻辑！
    }
  }
}

// ✅ 正确：Engine 通用
class EvalEngine {
  async run(task: AtomicTask) {
    const runner = this.registry.get(task.type)
    return runner.execute(task)
  }
}
```

### 红线 2：Trace 是一等公民
```typescript
// ❌ 错误：没有 Trace
interface RunRecord {
  output: unknown
}

// ✅ 正确：Trace 必须存在
interface RunRecord {
  output: unknown
  trace: TraceEvent[]  // 必须字段
}
```

### 红线 3：扩展靠注册，不靠改 Core
```typescript
// ❌ 错误：修改 Core 添加新能力
// core/engine/eval-engine.ts
import { IntentRunner } from '../modules/intent'

// ✅ 正确：通过注册添加新能力
// modules/intent/index.ts
export function registerIntentModule(registry: RunnerRegistry) {
  registry.register(new IntentRunner())
}
```

## 下一步

参考 [contracts.md](./contracts.md) 了解详细的契约定义。
