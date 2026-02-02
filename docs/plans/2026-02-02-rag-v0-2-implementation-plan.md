# RAG v0.2+ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add vector retrieval and LLM generator paths while keeping artifacts and reporter/metrics contracts stable.

**Architecture:** Implement EmbeddingAdapter + MockEmbedding, a minimal in-memory vector index (cosine topK), and an LLM generator with strict JSON sentence output + single repair. Keep `rag.retrieved`/`rag.generated` unchanged and add optional `rag.reranked` without breaking Reporter.

**Tech Stack:** Node.js 18+, TypeScript, Vitest, Prisma, OpenAI SDK (existing), wink-bm25-text-search (existing)

---

### Task 1: EmbeddingAdapter contract + MockEmbedding

**Files:**
- Create: `agent-lab/backend/src/modules/rag/embeddings/embedding-adapter.ts`
- Create: `agent-lab/backend/src/modules/rag/embeddings/mock-embedding.ts`
- Test: `agent-lab/backend/src/modules/rag/embeddings/mock-embedding.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { MockEmbedding } from './mock-embedding.js'

describe('MockEmbedding', () => {
  it('returns deterministic vectors for same input', async () => {
    const embedder = new MockEmbedding()
    const first = await embedder.embed(['alpha'])
    const second = await embedder.embed(['alpha'])
    expect(first).toEqual(second)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/embeddings/mock-embedding.test.ts --run`

Expected: FAIL with "Cannot find module './mock-embedding.js'".

**Step 3: Write minimal implementation**

```ts
// embedding-adapter.ts
export interface EmbeddingAdapter {
  embed(texts: string[]): Promise<number[][]>
}
```

```ts
// mock-embedding.ts
import type { EmbeddingAdapter } from './embedding-adapter.js'

export class MockEmbedding implements EmbeddingAdapter {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(t => {
      const sum = Array.from(t).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      return [sum % 7, sum % 11, sum % 13]
    })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/embeddings/mock-embedding.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/embeddings/embedding-adapter.ts \
  agent-lab/backend/src/modules/rag/embeddings/mock-embedding.ts \
  agent-lab/backend/src/modules/rag/embeddings/mock-embedding.test.ts
git commit -m "feat: add embedding adapter and mock embedding"
```

---

### Task 2: In-memory vector index (cosine topK)

**Files:**
- Create: `agent-lab/backend/src/modules/rag/retrievers/vector-index.ts`
- Test: `agent-lab/backend/src/modules/rag/retrievers/vector-index.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { InMemoryVectorIndex } from './vector-index.js'

it('returns topK most similar vectors', () => {
  const index = new InMemoryVectorIndex()
  index.add('d1', [1, 0, 0])
  index.add('d2', [0, 1, 0])
  const results = index.search([1, 0, 0], 1)
  expect(results[0].id).toBe('d1')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/retrievers/vector-index.test.ts --run`

Expected: FAIL with "Cannot find module './vector-index.js'".

**Step 3: Write minimal implementation**

```ts
// vector-index.ts
export class InMemoryVectorIndex {
  private items: Array<{ id: string; vector: number[] }> = []

  add(id: string, vector: number[]): void {
    this.items.push({ id, vector })
  }

  search(query: number[], topK: number): Array<{ id: string; score: number }> {
    const score = (a: number[], b: number[]) => {
      const dot = a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0)
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
      return normA === 0 || normB === 0 ? 0 : dot / (normA * normB)
    }

    return this.items
      .map(item => ({ id: item.id, score: score(query, item.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/retrievers/vector-index.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/retrievers/vector-index.ts \
  agent-lab/backend/src/modules/rag/retrievers/vector-index.test.ts
git commit -m "feat: add in-memory vector index"
```

---

### Task 3: Vector Retriever Method (adapter + index)

**Files:**
- Create: `agent-lab/backend/src/modules/rag/retrievers/vector-retriever.ts`
- Modify: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts` (support retriever.type = vector)
- Test: `agent-lab/backend/src/modules/rag/retrievers/vector-retriever.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { VectorRetriever } from './vector-retriever.js'
import { MockEmbedding } from '../embeddings/mock-embedding.js'

it('returns topK chunk ids from vector index', async () => {
  const retriever = new VectorRetriever(new MockEmbedding())
  const docs = [
    { id: 'd1', text: 'alpha' },
    { id: 'd2', text: 'beta' }
  ]
  const results = await retriever.search('alpha', docs, 1)
  expect(results[0].chunkId).toBe('d1')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/retrievers/vector-retriever.test.ts --run`

Expected: FAIL with "Cannot find module './vector-retriever.js'".

**Step 3: Write minimal implementation**

```ts
// vector-retriever.ts
import { InMemoryVectorIndex } from './vector-index.js'
import type { EmbeddingAdapter } from '../embeddings/embedding-adapter.js'

export class VectorRetriever {
  constructor(private readonly embedder: EmbeddingAdapter) {}

  async search(query: string, docs: Array<{ id: string; text: string }>, topK: number) {
    const vectors = await this.embedder.embed(docs.map(d => d.text))
    const index = new InMemoryVectorIndex()
    docs.forEach((doc, i) => index.add(doc.id, vectors[i]))
    const queryVec = (await this.embedder.embed([query]))[0]
    const results = index.search(queryVec, topK)
    return results.map((r, idx) => ({ chunkId: r.id, score: r.score, rank: idx + 1 }))
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/retrievers/vector-retriever.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/retrievers/vector-retriever.ts \
  agent-lab/backend/src/modules/rag/retrievers/vector-retriever.test.ts
git commit -m "feat: add vector retriever"
```

---

### Task 4: LLM Generator with strict JSON output + single repair

**Files:**
- Create: `agent-lab/backend/src/modules/rag/generators/llm-generator.ts`
- Test: `agent-lab/backend/src/modules/rag/generators/llm-generator.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { LlmGenerator } from './llm-generator.js'

it('rejects invalid output after one repair attempt', async () => {
  const generator = new LlmGenerator({ client: { chat: async () => ({ content: 'invalid' }) } as any })
  await expect(generator.generate('q', [])).rejects.toThrow('Invalid generator output')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/generators/llm-generator.test.ts --run`

Expected: FAIL with "Cannot find module './llm-generator.js'".

**Step 3: Write minimal implementation**

```ts
// llm-generator.ts
export class LlmGenerator {
  constructor(private readonly options: { client: { chat: (req: any) => Promise<{ content: string }> } }) {}

  async generate(query: string, chunks: Array<{ chunkId: string; text: string }>) {
    const response = await this.options.client.chat({ messages: [] })
    const parsed = this.tryParse(response.content)
    if (parsed) return parsed
    // single repair attempt
    const repair = await this.options.client.chat({ messages: [] })
    const repaired = this.tryParse(repair.content)
    if (repaired) return repaired
    throw new Error('Invalid generator output')
  }

  private tryParse(raw: string) {
    try {
      const json = JSON.parse(raw)
      if (!json.answer || !Array.isArray(json.sentences)) return null
      return json
    } catch {
      return null
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/generators/llm-generator.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/generators/llm-generator.ts \
  agent-lab/backend/src/modules/rag/generators/llm-generator.test.ts
git commit -m "feat: add llm generator with repair"
```

---

### Task 5: RAG Runner supports generator.type = llm

**Files:**
- Modify: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts`
- Test: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.llm.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

it('uses llm generator when configured', async () => {
  const runner = new RagBm25Runner({
    llmGenerator: { generate: async () => ({ answer: 'ok', sentences: [], generatorType: 'llm', sourcesUsed: [] }) }
  } as any)
  const task: AtomicTask = { id: 't', name: 't', type: 'rag', input: { query: 'alpha' }, metadata: {} }
  const run = await runner.execute(task, {
    dataset: { documents: [{ id: 'd1', text: 'alpha' }, { id: 'd2', text: 'beta' }, { id: 'd3', text: 'gamma' }] },
    retriever: { type: 'bm25', impl: 'wink', topK: 1 },
    generator: { type: 'llm' }
  })
  expect(run.output?.generatorType).toBe('llm')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/runners/rag-bm25-runner.llm.test.ts --run`

Expected: FAIL with "llm generator not invoked".

**Step 3: Write minimal implementation**

Update runner to accept optional `llmGenerator` in ctor and branch on `config.generator.type`.

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/runners/rag-bm25-runner.llm.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts \
  agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.llm.test.ts
git commit -m "feat: add llm generator path in rag runner"
```

---

### Task 6: Optional rerank (workflow extension)

**Files:**
- Create: `agent-lab/backend/src/modules/rag/rerankers/simple-reranker.ts`
- Modify: `agent-lab/backend/src/modules/rag/runners/rag-bm25-runner.ts`
- Test: `agent-lab/backend/src/modules/rag/rerankers/simple-reranker.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { SimpleReranker } from './simple-reranker.js'

it('sorts by score descending', () => {
  const reranker = new SimpleReranker()
  const reranked = reranker.rerank([
    { chunkId: 'c1', score: 0.2 },
    { chunkId: 'c2', score: 0.8 }
  ])
  expect(reranked[0].chunkId).toBe('c2')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/rerankers/simple-reranker.test.ts --run`

Expected: FAIL with "Cannot find module './simple-reranker.js'".

**Step 3: Write minimal implementation**

```ts
// simple-reranker.ts
export class SimpleReranker {
  rerank(items: Array<{ chunkId: string; score: number }>) {
    return [...items].sort((a, b) => b.score - a.score)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/rerankers/simple-reranker.test.ts --run`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag/rerankers/simple-reranker.ts \
  agent-lab/backend/src/modules/rag/rerankers/simple-reranker.test.ts
git commit -m "feat: add simple reranker"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-02-rag-v0-2-implementation-plan.md`. Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate, using executing-plans)

Which approach?
