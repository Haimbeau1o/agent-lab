# RAG Task Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Task-first, config-first evaluation framework with reporter-first evaluation and a canonical RAG task implementation that proves the Task/Workflow/Method/ArtifactSchema contract.

**Architecture:** Extend core contracts (Task/Workflow/Method/Artifact/Report), add registries, persist config fingerprints and artifacts, run Reporters before Metrics, and ship a minimal RAG module (schemas + reporter + evaluator + mock runner) to validate the abstraction.

**Tech Stack:** Node.js 18, TypeScript, Vitest, Prisma (SQLite), Express

---

### Task 1: Deterministic Config Hash + Run Fingerprint utilities

**Files:**
- Create: `agent-lab/backend/src/lib/utils/stable-stringify.ts`
- Create: `agent-lab/backend/src/lib/utils/config-hash.ts`
- Test: `agent-lab/backend/src/lib/utils/config-hash.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { createConfigHash, createRunFingerprint } from './config-hash.js'

describe('config hash', () => {
  it('is stable across key order', () => {
    const a = { task: { id: 't1', type: 'rag' }, model: { name: 'gpt' } }
    const b = { model: { name: 'gpt' }, task: { type: 'rag', id: 't1' } }
    expect(createConfigHash(a)).toBe(createConfigHash(b))
  })

  it('changes when values change', () => {
    const a = { task: { id: 't1' } }
    const b = { task: { id: 't2' } }
    expect(createConfigHash(a)).not.toBe(createConfigHash(b))
  })

  it('run fingerprint includes env overrides', () => {
    const base = { task: { id: 't1' }, env: { llm: 'gpt-5' } }
    const other = { task: { id: 't1' }, env: { llm: 'gpt-4' } }
    expect(createRunFingerprint(base)).not.toBe(createRunFingerprint(other))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/lib/utils/config-hash.test.ts`

Expected: FAIL with “Cannot find module './config-hash.js'”.

**Step 3: Write minimal implementation**

```ts
// stable-stringify.ts
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    return `{${keys.map(k => JSON.stringify(k) + ':' + stableStringify(record[k])).join(',')}}`
  }
  return JSON.stringify(value)
}
```

```ts
// config-hash.ts
import { createHash } from 'crypto'
import { stableStringify } from './stable-stringify.js'

export function createConfigHash(snapshot: Record<string, unknown>): string {
  const normalized = stableStringify(snapshot)
  return createHash('sha256').update(normalized).digest('hex')
}

export function createRunFingerprint(snapshot: Record<string, unknown>): string {
  return createConfigHash(snapshot)
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/lib/utils/config-hash.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/lib/utils/stable-stringify.ts \
  agent-lab/backend/src/lib/utils/config-hash.ts \
  agent-lab/backend/src/lib/utils/config-hash.test.ts
git commit -m "feat: add deterministic config hash utilities"
```

---

### Task 2: Contracts for ArtifactSchema + Reporters (with runtime validation)

**Files:**
- Create: `agent-lab/backend/src/core/contracts/artifact.ts`
- Create: `agent-lab/backend/src/core/contracts/report.ts`
- Create: `agent-lab/backend/src/core/contracts/definitions.ts`
- Modify: `agent-lab/backend/src/core/contracts/index.ts`
- Test: `agent-lab/backend/src/core/contracts/artifact.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { assertArtifactRecord } from './artifact.js'

describe('artifact validation', () => {
  it('requires schemaId and producedByStepId when provided', () => {
    expect(() => assertArtifactRecord({} as any)).toThrow('schemaId')
    expect(() => assertArtifactRecord({ schemaId: 'rag.retrieved' } as any)).toThrow('producedByStepId')
  })

  it('accepts minimal valid record', () => {
    const record = {
      schemaId: 'rag.retrieved',
      producedByStepId: 'retrieve',
      payload: { chunks: [] }
    }
    expect(() => assertArtifactRecord(record)).not.toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/core/contracts/artifact.test.ts`

Expected: FAIL with “Cannot find module './artifact.js'”.

**Step 3: Write minimal implementation**

```ts
// artifact.ts
export interface ArtifactSchema {
  id: string
  name: string
  version: string
  description?: string
}

export interface ArtifactRecord {
  schemaId: string
  producedByStepId: string
  payload: Record<string, unknown>
  metadata?: {
    source_id?: string
    span?: string
    score?: number
    provenance?: string
    alignment_id?: string
  }
}

export function assertArtifactRecord(record: ArtifactRecord): void {
  if (!record.schemaId) throw new Error('schemaId is required')
  if (!record.producedByStepId) throw new Error('producedByStepId is required')
}
```

```ts
// report.ts
export interface ReportRecord {
  id: string
  runId: string
  type: string
  payload: Record<string, unknown>
  producedAt: Date
}

export interface Reporter {
  id: string
  types: string[]
  run(runId: string, context: {
    runOutput?: unknown
    artifacts?: ArtifactRecord[]
    trace?: unknown[]
  }): Promise<ReportRecord[]>
}
```

```ts
// definitions.ts
export interface TaskDefinition {
  id: string
  name: string
  type: string
  successCriteria?: string[]
  errorTaxonomy?: string[]
}

export interface WorkflowDefinition {
  id: string
  name: string
  steps: Array<{ stepId: string; name: string }>
}

export interface MethodDefinition {
  id: string
  name: string
  strategy: string
  implementation: string
}
```

Update `index.ts` exports to include new contracts.

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/core/contracts/artifact.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/core/contracts/artifact.ts \
  agent-lab/backend/src/core/contracts/report.ts \
  agent-lab/backend/src/core/contracts/definitions.ts \
  agent-lab/backend/src/core/contracts/index.ts \
  agent-lab/backend/src/core/contracts/artifact.test.ts
git commit -m "feat: add artifact and reporter contracts"
```

---

### Task 3: Registries for ArtifactSchema + Reporter + Definitions

**Files:**
- Create: `agent-lab/backend/src/core/registry/artifact-schema-registry.ts`
- Create: `agent-lab/backend/src/core/registry/reporter-registry.ts`
- Create: `agent-lab/backend/src/core/registry/definition-registry.ts`
- Modify: `agent-lab/backend/src/core/registry/index.ts`
- Test: `agent-lab/backend/src/core/registry/artifact-schema-registry.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { ArtifactSchemaRegistry } from './artifact-schema-registry.js'

const schema = { id: 'rag.retrieved', name: 'RetrievedChunks', version: '1.0.0' }

describe('ArtifactSchemaRegistry', () => {
  it('registers and retrieves schema', () => {
    const registry = new ArtifactSchemaRegistry()
    registry.register(schema)
    expect(registry.get('rag.retrieved')).toEqual(schema)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/core/registry/artifact-schema-registry.test.ts`

Expected: FAIL with “Cannot find module './artifact-schema-registry.js'”.

**Step 3: Write minimal implementation**

```ts
// artifact-schema-registry.ts
import type { ArtifactSchema } from '../contracts/artifact.js'

export class ArtifactSchemaRegistry {
  private readonly schemas = new Map<string, ArtifactSchema>()

  register(schema: ArtifactSchema): void {
    if (this.schemas.has(schema.id)) {
      throw new Error(`ArtifactSchema "${schema.id}" is already registered`)
    }
    this.schemas.set(schema.id, schema)
  }

  get(id: string): ArtifactSchema {
    const schema = this.schemas.get(id)
    if (!schema) throw new Error(`No ArtifactSchema registered for "${id}"`)
    return schema
  }
}
```

```ts
// reporter-registry.ts
import type { Reporter } from '../contracts/report.js'

export class ReporterRegistry {
  private readonly reporters = new Map<string, Reporter>()

  register(reporter: Reporter): void {
    if (this.reporters.has(reporter.id)) {
      throw new Error(`Reporter "${reporter.id}" is already registered`)
    }
    this.reporters.set(reporter.id, reporter)
  }

  list(): Reporter[] {
    return Array.from(this.reporters.values())
  }
}
```

```ts
// definition-registry.ts
import type { TaskDefinition, WorkflowDefinition, MethodDefinition } from '../contracts/definitions.js'

export class TaskDefinitionRegistry {
  private readonly tasks = new Map<string, TaskDefinition>()
  register(def: TaskDefinition): void { if (this.tasks.has(def.id)) throw new Error('Task already registered'); this.tasks.set(def.id, def) }
  list(): TaskDefinition[] { return Array.from(this.tasks.values()) }
}

export class WorkflowDefinitionRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>()
  register(def: WorkflowDefinition): void { if (this.workflows.has(def.id)) throw new Error('Workflow already registered'); this.workflows.set(def.id, def) }
  list(): WorkflowDefinition[] { return Array.from(this.workflows.values()) }
}

export class MethodDefinitionRegistry {
  private readonly methods = new Map<string, MethodDefinition>()
  register(def: MethodDefinition): void { if (this.methods.has(def.id)) throw new Error('Method already registered'); this.methods.set(def.id, def) }
  list(): MethodDefinition[] { return Array.from(this.methods.values()) }
}
```

Update `registry/index.ts` exports to include these registries.

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/core/registry/artifact-schema-registry.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/core/registry/artifact-schema-registry.ts \
  agent-lab/backend/src/core/registry/reporter-registry.ts \
  agent-lab/backend/src/core/registry/definition-registry.ts \
  agent-lab/backend/src/core/registry/index.ts \
  agent-lab/backend/src/core/registry/artifact-schema-registry.test.ts
git commit -m "feat: add artifact/report/definition registries"
```

---

### Task 4: RunRecord/ScoreRecord extensions for fingerprint + artifacts + reports

**Files:**
- Modify: `agent-lab/backend/src/core/contracts/run-record.ts`
- Modify: `agent-lab/backend/src/core/contracts/score-record.ts`
- Modify: `agent-lab/backend/src/core/engine/eval-engine.ts`
- Test: `agent-lab/backend/src/core/engine/eval-engine.test.ts`

**Step 1: Write the failing test**

```ts
// add to eval-engine.test.ts
it('adds configHash and runFingerprint to run provenance', async () => {
  const result = await engine.evaluateTask(task, 'mock.runner', { mode: 'test' })
  expect(result.run.provenance.configHash).toBeDefined()
  expect(result.run.provenance.runFingerprint).toBeDefined()
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/core/engine/eval-engine.test.ts`

Expected: FAIL with “configHash is undefined”.

**Step 3: Write minimal implementation**

```ts
// run-record.ts (add fields)
export interface RunRecord {
  // ...existing fields...
  artifacts?: import('./artifact.js').ArtifactRecord[]
  reports?: import('./report.js').ReportRecord[]
  provenance: {
    runnerId: string
    runnerVersion: string
    config: Record<string, unknown>
    configHash?: string
    runFingerprint?: string
    configSnapshot?: Record<string, unknown>
    overrides?: Record<string, unknown>
  }
}
```

```ts
// score-record.ts (ensure evidence can reference reports)
export interface ScoreRecord {
  // ...existing fields...
  evidence?: {
    explanation?: string
    snippets?: string[]
    alignment?: Record<string, unknown>
    reportRefs?: string[]
  }
}
```

```ts
// eval-engine.ts (inject fingerprint)
import { createConfigHash, createRunFingerprint } from '../../lib/utils/config-hash.js'

// inside evaluateTask after runRecord created
const configSnapshot = { task, runnerId, config }
runRecord.provenance.configSnapshot = configSnapshot
runRecord.provenance.configHash = createConfigHash(configSnapshot)
runRecord.provenance.runFingerprint = createRunFingerprint({
  task,
  runnerId,
  config
})
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/core/engine/eval-engine.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/core/contracts/run-record.ts \
  agent-lab/backend/src/core/contracts/score-record.ts \
  agent-lab/backend/src/core/engine/eval-engine.ts \
  agent-lab/backend/src/core/engine/eval-engine.test.ts
git commit -m "feat: add run fingerprints and report refs"
```

---

### Task 5: Persistence for config fingerprint + artifacts + reports

**Files:**
- Modify: `agent-lab/backend/prisma/schema.prisma`
- Modify: `agent-lab/backend/src/core/engine/prisma-storage.ts`
- Test: `agent-lab/backend/src/core/engine/storage.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { InMemoryStorage } from './storage.js'

it('preserves artifacts and reports on save/get', async () => {
  const storage = new InMemoryStorage()
  const run = {
    id: 'run-1',
    taskId: 'task-1',
    taskType: 'atomic',
    status: 'completed',
    metrics: { latency: 1 },
    trace: [],
    startedAt: new Date(),
    provenance: { runnerId: 'r', runnerVersion: '1', config: {}, configHash: 'x', runFingerprint: 'y' },
    artifacts: [{ schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: {} }],
    reports: [{ id: 'rep-1', runId: 'run-1', type: 'rag.evidence', payload: {}, producedAt: new Date() }]
  }
  await storage.saveRun(run as any)
  const saved = await storage.getRun('run-1')
  expect(saved?.artifacts?.length).toBe(1)
  expect(saved?.reports?.length).toBe(1)
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/core/engine/storage.test.ts`

Expected: FAIL with “Cannot find module './storage.test.ts'”.

**Step 3: Write minimal implementation**

- Add new test file `storage.test.ts` and no changes to `InMemoryStorage` (it already stores RunRecord). Ensure RunRecord typing allows artifacts/reports.
- Update Prisma schema for RunRecord:
  - `configHash String?`
  - `runFingerprint String?`
  - `configSnapshot String?`
  - `overrides String?`
  - `artifacts String?`
  - `reports String?`
- Update PrismaStorage mapping to read/write new fields.

```prisma
// RunRecord additions
configHash     String?
runFingerprint String?
configSnapshot String?
overrides      String?
artifacts      String?
reports        String?
```

```ts
// prisma-storage.ts (saveRun)
configHash: run.provenance.configHash ?? null,
runFingerprint: run.provenance.runFingerprint ?? null,
configSnapshot: run.provenance.configSnapshot ? JSON.stringify(run.provenance.configSnapshot) : null,
overrides: run.provenance.overrides ? JSON.stringify(run.provenance.overrides) : null,
artifacts: run.artifacts ? JSON.stringify(run.artifacts) : null,
reports: run.reports ? JSON.stringify(run.reports) : null,
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/core/engine/storage.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/prisma/schema.prisma \
  agent-lab/backend/src/core/engine/prisma-storage.ts \
  agent-lab/backend/src/core/engine/storage.test.ts
git commit -m "feat: persist run fingerprints and artifacts"
```

---

### Task 6: Reporter-first evaluation pipeline

**Files:**
- Modify: `agent-lab/backend/src/core/contracts/evaluator.ts`
- Modify: `agent-lab/backend/src/core/engine/eval-engine.ts`
- Modify: `agent-lab/backend/src/core/engine/index.ts`
- Modify: `agent-lab/backend/src/api/eval/index.ts`
- Test: `agent-lab/backend/src/core/engine/eval-engine.reporter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { EvalEngine } from './eval-engine.js'
import { InMemoryStorage } from './storage.js'
import { RunnerRegistry } from '../registry/runner-registry.js'
import { EvaluatorRegistry } from '../registry/evaluator-registry.js'
import { ReporterRegistry } from '../registry/reporter-registry.js'

// mock reporter + evaluator
// evaluator should see reportRefs on evidence

it('runs reporters before evaluators', async () => {
  // setup registries + engine with reporter
  // expect scores to reference reportRefs
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/core/engine/eval-engine.reporter.test.ts`

Expected: FAIL with “Cannot find module './eval-engine.reporter.test.ts'”.

**Step 3: Write minimal implementation**

```ts
// evaluator.ts
import type { ReportRecord } from './report.js'

export interface Evaluator {
  id: string
  metrics: string[]
  evaluate(run: RunRecord, task: AtomicTask, reports?: ReportRecord[]): Promise<ScoreRecord[]>
}
```

```ts
// eval-engine.ts (inject reporter registry and run it)
import type { ReporterRegistry } from '../registry/reporter-registry.js'
import type { ReportRecord } from '../contracts/report.js'

export interface EvalEngineConfig {
  runnerRegistry: RunnerRegistry
  evaluatorRegistry: EvaluatorRegistry
  reporterRegistry?: ReporterRegistry
  storage: Storage
}

// inside evaluateTask
const reports: ReportRecord[] = this.reporterRegistry
  ? await this.runReporters(runRecord)
  : []
runRecord.reports = reports

for (const evaluator of evaluators) {
  const scores = await evaluator.evaluate(runRecord, task, reports)
  allScores.push(...scores)
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/core/engine/eval-engine.reporter.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/core/contracts/evaluator.ts \
  agent-lab/backend/src/core/engine/eval-engine.ts \
  agent-lab/backend/src/core/engine/index.ts \
  agent-lab/backend/src/api/eval/index.ts \
  agent-lab/backend/src/core/engine/eval-engine.reporter.test.ts
git commit -m "feat: run reporters before metrics"
```

---

### Task 7: Canonical RAG module (schemas + reporter + evaluator + mock runner)

**Files:**
- Create: `agent-lab/backend/src/modules/rag/index.ts`
- Create: `agent-lab/backend/src/modules/rag/schemas.ts`
- Create: `agent-lab/backend/src/modules/rag/reporters/rag-evidence-reporter.ts`
- Create: `agent-lab/backend/src/modules/rag/evaluators/rag-metrics-evaluator.ts`
- Create: `agent-lab/backend/src/modules/rag/runners/rag-mock-runner.ts`
- Modify: `agent-lab/backend/src/modules/index.ts`
- Test: `agent-lab/backend/src/modules/rag/rag-evidence-reporter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { RagEvidenceReporter } from './reporters/rag-evidence-reporter.js'

it('links citations to retrieved chunks', async () => {
  const reporter = new RagEvidenceReporter()
  const reports = await reporter.run('run-1', {
    artifacts: [
      { schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: { chunks: [{ id: 'c1', text: 'hello' }] } },
      { schemaId: 'rag.citations', producedByStepId: 'generate', payload: { citations: [{ chunkId: 'c1' }] } }
    ]
  })
  expect(reports[0].type).toBe('rag.evidence')
})
```

**Step 2: Run test to verify it fails**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/rag-evidence-reporter.test.ts`

Expected: FAIL with “Cannot find module './reporters/rag-evidence-reporter.js'”.

**Step 3: Write minimal implementation**

```ts
// schemas.ts
export const RagArtifactSchemas = {
  retrieved: { id: 'rag.retrieved', name: 'RetrievedChunks', version: '1.0.0' },
  citations: { id: 'rag.citations', name: 'FinalCitations', version: '1.0.0' }
}
```

```ts
// rag-evidence-reporter.ts
import type { Reporter, ReportRecord } from '../../../core/contracts/report.js'

export class RagEvidenceReporter implements Reporter {
  id = 'rag.evidence'
  types = ['rag.evidence']

  async run(runId: string, context: { artifacts?: any[] }): Promise<ReportRecord[]> {
    return [{ id: `rep-${runId}`, runId, type: 'rag.evidence', payload: { linked: true }, producedAt: new Date() }]
  }
}
```

```ts
// rag-metrics-evaluator.ts
import type { Evaluator } from '../../../core/contracts/evaluator.js'
import type { ReportRecord } from '../../../core/contracts/report.js'

export class RagMetricsEvaluator implements Evaluator {
  id = 'rag.metrics'
  metrics = ['citation_precision']

  async evaluate(run: any, task: any, reports?: ReportRecord[]) {
    return [{
      id: `score-${run.id}`,
      runId: run.id,
      metric: 'citation_precision',
      value: 1,
      target: 'final',
      evidence: { reportRefs: reports?.map(r => r.id) ?? [] },
      evaluatorId: this.id,
      createdAt: new Date()
    }]
  }
}
```

```ts
// rag-mock-runner.ts
import { randomUUID } from 'crypto'
import type { Runner } from '../../../core/contracts/runner.js'

export class RagMockRunner implements Runner {
  id = 'rag.mock'
  type = 'rag'
  version = '0.1.0'

  async execute(task: any): Promise<any> {
    return {
      id: randomUUID(),
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: { answer: 'ok' },
      metrics: { latency: 1 },
      trace: [],
      artifacts: [
        { schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: { chunks: [] } },
        { schemaId: 'rag.citations', producedByStepId: 'generate', payload: { citations: [] } }
      ],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: { runnerId: this.id, runnerVersion: this.version, config: {} }
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd agent-lab/backend && npm test -- src/modules/rag/rag-evidence-reporter.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add agent-lab/backend/src/modules/rag \
  agent-lab/backend/src/modules/index.ts
git commit -m "feat: add canonical RAG module skeleton"
```

---

### Task 8: Wire RAG into API registry (optional, gated)

**Files:**
- Modify: `agent-lab/backend/src/api/eval/index.ts`

**Step 1: Write the failing test**

- Optional: if API has integration tests, add one for `rag.mock` runner registration.

**Step 2: Run test to verify it fails**

- Optional: run API tests if present.

**Step 3: Write minimal implementation**

```ts
// register new runner/evaluator/reporter
runnerRegistry.register(new RagMockRunner())
evaluatorRegistry.register(new RagMetricsEvaluator())
reporterRegistry.register(new RagEvidenceReporter())
```

**Step 4: Run test to verify it passes**

- Optional: API tests.

**Step 5: Commit**

```bash
git add agent-lab/backend/src/api/eval/index.ts
git commit -m "feat: register rag mock pipeline"
```

---

## Execution Notes

- After schema changes, run:
  - `cd agent-lab/backend && npm run prisma:generate`
  - `cd agent-lab/backend && npm run prisma:migrate`
- Ensure `EvalEngine` instantiation includes `ReporterRegistry`.
- Keep new fields optional to avoid breaking existing modules.

