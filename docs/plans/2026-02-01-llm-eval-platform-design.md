# LLM 应用组件评测平台 - 底层框架设计（RAG 作为 Canonical Task）

日期：2026-02-01

## 目标与定位

- 目标：为 LLM 应用组件提供可解释、可复现、可扩展的评测平台。
- 定位：不是分数排行榜，而是调试内核（debug kernel）。
- 入口：Task-first 视角（同一任务上不同方法/流程对比），同时支持 Method-first 与 Run-first 切换。

## 核心原则

- Config-first：YAML/JSON 为唯一事实来源；SDK 负责扩展；UI 仅为配置编辑器。
- 可复现：每次运行保存完整配置快照与指纹。
- 可解释优先级：解释性 > 正确性 > 稳定性 > 鲁棒性 > 性能成本。
- Local-first 默认：SQLite + 本地文件，存储/队列/执行器可插拔升级。

## 三元抽象（主轴清晰）

- Task：语义主轴（评测入口）。
- Workflow：执行主轴（步骤编排）。
- Method：可插拔策略（实现与模型）。

整体结构：Task × Workflow × Method，但以 Task 为索引入口。

## 配置与复现

- Config Layer 生成 `config_hash` / `run_fingerprint`，包含：task / workflow / method / dataset / model / env。
- 支持 overrides，但必须写入快照，保证回归与复跑一致。

## 注册与契约

Registry/SDK 可注册对象：

- Task / Workflow / Method / Metric / Reporter / Adapter
- ArtifactSchema（关键护城河）

约束：

- 每个 Workflow/Method 必须声明 inputs/outputs 产物契约。
- ArtifactSchema 统一字段建议：
  - source_id
  - span
  - score
  - provenance
  - alignment_id（用于引用与回答对齐）

## 执行与可观测性

- Execution 层按 Workflow 执行，生成 Artifacts。
- 强制 Trace：prompt、retrieval、tool I/O、state diff。
- 每个 step 必须有稳定 `step_id`，Artifact 必须标注 `produced_by_step_id`。

## 评测与解释机制

- 规则：先解释后打分。
- Reporters 产出：error taxonomy / failure clustering / trace linking。
- Metrics 必须引用 Reporter 产物，禁止直接从最终 Answer 打分。

## 持久化默认方案

- 默认 SQLite + filesystem（JSONL/Parquet）。
- 可切换 Postgres + 对象存储。

## 视角与主键

- 主键：task_id
- 对比维度：method_id / workflow_id
- Run 作为实例（seed / commit / time 等）

## Canonical Task：RAG（抽象成立性证明）

RAG 覆盖全部关键对象，可作为抽象正确性的最小证明实例：

### Task

- 输入：Question (+ optional context)
- 输出：Answer + Citations
- Success Criteria：Citation Precision / Hallucination Rate / Accuracy
- Negative Success Criteria：no-evidence / wrong-evidence / hallucination / partial-answer

### Workflow

- Retrieve -> (Optional) Rerank -> Generate
- 每步有稳定 step_id

### Method

- Strategy vs Implementation 分离：
  - Retriever Strategy: embedding / bm25 / hybrid
  - Implementation: bge-large / text-embedding-3
  - Reranker Strategy: cross-encoder
  - Generator Strategy: LLM + prompt template

### ArtifactSchema

- RetrievedChunks / RerankedChunks / FinalCitations / AnswerDraft
- 统一字段：source_id / span / score / provenance / alignment_id

### Evaluation

- Reporters：evidence linking / error taxonomy / failure clustering
- Metrics：Recall@k / CitationPrecision / AnswerFaithfulness

## 扩展映射（RAG 的退化子集）

- 意图识别：RAG without retrieval（证据为空）
- 工具调用：RAG with tool I/O as evidence
- 记忆管理：RAG over memory store
- 多轮对话：RAG + state

## 下一步

- 若确认进入实现阶段，使用 writing-plans 产出实现计划。
- 以 RAG 作为第一批 Task 实现，建立 ArtifactSchema/Reporter/Metric 的基线。
