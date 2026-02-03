# RAG v0.3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 RAG v0.3（chunking + span 对齐 + hybrid + 强 rerank + UI Run 详情/Method 对比），并在 runtime/config 层实现清晰、可扩展、契约稳定的执行链路。

**Architecture:** 先重构运行时/配置体系，确保 Method/Workflow 插件化；随后实现 RAG 0.3 核心能力；最后落地 UI（Run 详情 → Method 对比）。Reporter 只产解释产物，Evaluator 计算指标，Artifact 契约 append-only。

**Tech Stack:** Node/TS (backend), vitest, Next.js (frontend), existing LLMClient, BM25 + Vector retriever

---

### Task 1: 运行时/配置体系统一（RAG pipeline config）

**Files:**
- Create: `agent-lab/backend/src/modules/rag/pipeline/rag-config.ts`
- Modify: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts`
- Modify: `agent-lab/backend/src/modules/rag/index.ts`
- Test: `agent-lab/backend/src/modules/rag/pipeline/rag-config.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from 'vitest'
import { buildRagConfig } from './rag-config.js'

describe('buildRagConfig', () => {
  it('applies defaults and preserves append-only fields', () => {
    const cfg = buildRagConfig({ generator: { type: 'template' } })
    expect(cfg.chunking.strategy).toBe('doc')
    expect(cfg.retriever.type).toBe('bm25')
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/pipeline/rag-config.test.ts`
Expected: FAIL “module not found”

**Step 3: Write minimal implementation**
```ts
export type RagPipelineConfig = { /* chunking/retriever/reranker/generator defaults */ }
export const buildRagConfig = (partial: Partial<RagPipelineConfig>) => ({ /* merge defaults */ })
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/pipeline/rag-config.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/pipeline/rag-config.ts src/modules/rag/pipeline/rag-config.test.ts src/modules/rag/runners/rag-bm25-runner.ts src/modules/rag/index.ts
git commit -m "feat(rag): add pipeline config defaults"
```

---

### Task 2: Chunking 策略（sentence / fixed / sliding）

**Files:**
- Create: `agent-lab/backend/src/modules/rag/chunkers/chunker.ts`
- Create: `agent-lab/backend/src/modules/rag/chunkers/sentence-chunker.ts`
- Create: `agent-lab/backend/src/modules/rag/chunkers/fixed-chunker.ts`
- Create: `agent-lab/backend/src/modules/rag/chunkers/sliding-chunker.ts`
- Test: `agent-lab/backend/src/modules/rag/chunkers/chunker.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from 'vitest'
import { sentenceChunk } from './sentence-chunker.js'

it('splits text into sentence chunks', () => {
  const chunks = sentenceChunk('A. B. C.')
  expect(chunks.map(c => c.text)).toEqual(['A.', 'B.', 'C.'])
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/chunkers/chunker.test.ts`
Expected: FAIL “module not found”

**Step 3: Write minimal implementation**
```ts
export type Chunk = { chunkId: string; text: string; metadata?: Record<string, unknown> }
export const sentenceChunk = (text: string) => /* naive split */
export const fixedChunk = (text: string, size: number) => /* fixed window */
export const slidingChunk = (text: string, size: number, overlap: number) => /* sliding */
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/chunkers/chunker.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/chunkers
git commit -m "feat(rag): add chunking strategies"
```

---

### Task 3: Span-level alignment（alignment_id / span 字段）

**Files:**
- Modify: `agent-lab/backend/src/modules/rag/schemas.ts`
- Modify: `agent-lab/backend/src/modules/rag/reporters/rag-evidence-reporter.ts`
- Test: `agent-lab/backend/src/modules/rag/rag-evidence-reporter.test.ts`

**Step 1: Write the failing test**
```ts
it('adds span to supported links when strict match hits', async () => {
  // sentence contains token that appears in chunk; expect span.start/end
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/rag-evidence-reporter.test.ts`
Expected: FAIL “span undefined”

**Step 3: Write minimal implementation**
```ts
// schemas.ts: citation supports optional span { start, end } and alignmentId
// reporter: when strict match succeeds, compute first token position in chunk text and add span
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/rag-evidence-reporter.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/schemas.ts src/modules/rag/reporters/rag-evidence-reporter.ts src/modules/rag/rag-evidence-reporter.test.ts
git commit -m "feat(rag): add span alignment fields"
```

---

### Task 4: Hybrid Retriever（BM25 + Vector 融合）

**Files:**
- Create: `agent-lab/backend/src/modules/rag/retrievers/hybrid-retriever.ts`
- Modify: `agent-lab/backend/src/modules/rag/retrievers/index.ts`
- Test: `agent-lab/backend/src/modules/rag/retrievers/hybrid-retriever.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from 'vitest'
import { HybridRetriever } from './hybrid-retriever.js'

it('merges bm25 + vector scores with weights', async () => {
  const retriever = new HybridRetriever({ bm25Weight: 0.5, vectorWeight: 0.5 })
  const results = await retriever.search('q', docs, 2)
  expect(results[0].rank).toBe(1)
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/retrievers/hybrid-retriever.test.ts`
Expected: FAIL “module not found”

**Step 3: Write minimal implementation**
```ts
// Use existing VectorRetriever + BM25 engine, normalize scores, combine weights, re-rank
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/retrievers/hybrid-retriever.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/retrievers/hybrid-retriever.ts src/modules/rag/retrievers/hybrid-retriever.test.ts src/modules/rag/retrievers/index.ts
git commit -m "feat(rag): add hybrid retriever"
```

---

### Task 5: 强 rerank（LLM judge / cross-encoder 形态）

**Files:**
- Create: `agent-lab/backend/src/modules/rag/rerankers/llm-reranker.ts`
- Test: `agent-lab/backend/src/modules/rag/rerankers/llm-reranker.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect, vi } from 'vitest'
import { LLMReranker } from './llm-reranker.js'

it('reranks using LLM scores', async () => {
  const llm = { chat: vi.fn().mockResolvedValue({ content: '{"scores":[1,0]}' }) }
  const reranker = new LLMReranker(llm as any)
  const out = await reranker.rerank(chunks, 'query')
  expect(out[0].rank).toBe(1)
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/rerankers/llm-reranker.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
```ts
// LLM prompt returns scores per chunk, map to rank; one repair attempt on parse
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/rerankers/llm-reranker.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/rerankers/llm-reranker.ts src/modules/rag/rerankers/llm-reranker.test.ts
git commit -m "feat(rag): add llm reranker"
```

---

### Task 6: Runner 接入（chunking/hybrid/rerank）+ 不变量测试

**Files:**
- Modify: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts`
- Test: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.rerank.test.ts`
- Test: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.hybrid.test.ts`

**Step 1: Write the failing test**
```ts
it('uses rag.reranked when enabled and falls back to rag.retrieved', async () => {
  // expect artifacts and input selection invariant
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/modules/rag/runners/rag-bm25-runner.hybrid.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
```ts
// use chunker -> retriever (bm25/hybrid) -> optional rerank -> generator
// maintain artifacts: rag.retrieved always, rag.reranked optional
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/modules/rag/runners/rag-bm25-runner.hybrid.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/modules/rag/runners/rag-bm25-runner.ts src/modules/rag/runners/rag-bm25-runner.hybrid.test.ts
git commit -m "feat(rag): wire chunking/hybrid/rerank in runner"
```

---

### Task 7: API 支撑 UI（Run 详情 + Method 对比）

**Files:**
- Modify: `agent-lab/backend/src/api/eval/index.ts`
- Test: `agent-lab/backend/src/api/eval/e2e.test.ts`

**Step 1: Write the failing test**
```ts
it('returns run detail with artifacts + reports + scores', async () => {
  // call GET /api/eval/runs/:id/detail
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/api/eval/e2e.test.ts`
Expected: FAIL 404

**Step 3: Write minimal implementation**
```ts
// new endpoint: /api/eval/runs/:id/detail
// returns run + artifacts + reports + scores
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/api/eval/e2e.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/api/eval/index.ts src/api/eval/e2e.test.ts
git commit -m "feat(api): add run detail endpoint"
```

---

### Task 8: UI - Run 详情页

**Files:**
- Create: `agent-lab/frontend/src/app/results/[runId]/page.tsx`
- Create: `agent-lab/frontend/src/components/rag/RunEvidencePanel.tsx`
- Modify: `agent-lab/frontend/src/app/results/page.tsx`

**Step 1: Write the failing test (lint-only for frontend)**
Run: `npm run lint` (from `agent-lab/frontend`)
Expected: FAIL if missing route/component

**Step 2: Write minimal implementation**
```tsx
// Run detail page: fetch /api/eval/runs/:id/detail, render evidence chain + metrics
```

**Step 3: Run lint to verify it passes**
Run: `npm run lint`
Expected: PASS

**Step 4: Commit**
```bash
git add src/app/results/[runId]/page.tsx src/components/rag/RunEvidencePanel.tsx src/app/results/page.tsx
git commit -m "feat(ui): add run detail page"
```

---

### Task 9: UI - Method 对比页

**Files:**
- Create: `agent-lab/frontend/src/app/results/compare/page.tsx`
- Create: `agent-lab/frontend/src/components/rag/MethodCompareTable.tsx`
- Modify: `agent-lab/frontend/src/app/results/page.tsx`

**Step 1: Write the failing test (lint-only for frontend)**
Run: `npm run lint`
Expected: FAIL if missing route/component

**Step 2: Write minimal implementation**
```tsx
// Compare page: list runs by method, show metrics summary, link to run detail
```

**Step 3: Run lint to verify it passes**
Run: `npm run lint`
Expected: PASS

**Step 4: Commit**
```bash
git add src/app/results/compare/page.tsx src/components/rag/MethodCompareTable.tsx src/app/results/page.tsx
git commit -m "feat(ui): add method compare page"
```

---

## Execution Handoff
Plan complete and saved to `docs/plans/2026-02-02-rag-v0-3-implementation-plan.md`.

Two execution options:
1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
