# Implementation Plan: IntentRunner & IntentEvaluator

**Role:** Claude #2 (Backend Implementation)
**Date:** 2026-01-29
**Status:** AWAITING CONFIRMATION

---

## 1. Requirements Restatement

### What We're Building
Implement the **Intent Recognition Module** following the new three-layer architecture:

1. **IntentRunner** - Executes intent recognition tasks and returns structured RunRecord with full trace
2. **IntentEvaluator** - Evaluates RunRecord against expected output and returns ScoreRecord[]
3. **Registry Integration** - Register both components to make them discoverable
4. **Tests** - Comprehensive TDD approach with 80%+ coverage

### Key Constraints
- ✅ Must follow contracts defined in `docs/architecture/contracts.md`
- ✅ Must implement `Runner` and `Evaluator` interfaces
- ✅ Must collect complete Trace for every execution
- ✅ Must be immutable (no data mutation)
- ✅ Must use TDD workflow (tests first)
- ✅ Core Engine must remain generic (no business logic)
- ✅ Must register via Registry (no hardcoding)

### What We Can Reuse
From existing `lib/agents/intent.ts`:
- ✅ Prompt building logic (`buildSystemPrompt`)
- ✅ LLM interaction pattern
- ✅ JSON parsing and validation
- ✅ Intent validation against allowed list

From existing `lib/evaluator/intent-metrics.ts`:
- ✅ Accuracy calculation logic
- ✅ Confidence averaging
- ✅ Precision/Recall/F1 calculations
- ✅ Confusion matrix logic

---

## 2. Architecture Overview

### Directory Structure
```
agent-lab/backend/src/
├── core/                           # Core Engine (generic)
│   ├── contracts/                  # Contract definitions
│   │   ├── task.ts                # AtomicTask, ScenarioTask
│   │   ├── run-record.ts          # RunRecord, TraceEvent
│   │   ├── score-record.ts        # ScoreRecord
│   │   ├── runner.ts              # Runner interface
│   │   └── evaluator.ts           # Evaluator interface
│   ├── registry/                   # Registration system
│   │   ├── runner-registry.ts
│   │   └── evaluator-registry.ts
│   └── engine/                     # Execution engine
│       └── eval-engine.ts
│
└── modules/                        # Capability modules
    └── intent/                     # Intent module
        ├── runners/
        │   ├── llm-runner.ts      # IntentRunner implementation
        │   └── llm-runner.test.ts
        ├── evaluators/
        │   ├── intent-evaluator.ts
        │   └── intent-evaluator.test.ts
        └── index.ts                # Module registration
```

### Data Flow
```
User → AtomicTask → Registry.get('intent') → IntentRunner.execute()
                                                      ↓
                                              Collect Trace
                                                      ↓
                                              Return RunRecord
                                                      ↓
                                    IntentEvaluator.evaluate()
                                                      ↓
                                              Return ScoreRecord[]
```

---

## 3. Implementation Phases

### Phase 0: Core Contracts (Foundation)
**Estimated Complexity:** MEDIUM
**Dependencies:** None
**Deliverables:**
- `core/contracts/task.ts` - AtomicTask, ScenarioTask interfaces
- `core/contracts/run-record.ts` - RunRecord, TraceEvent interfaces
- `core/contracts/score-record.ts` - ScoreRecord interface
- `core/contracts/runner.ts` - Runner interface
- `core/contracts/evaluator.ts` - Evaluator interface

**Success Criteria:**
- ✅ All contracts match specifications in `docs/architecture/contracts.md`
- ✅ TypeScript strict mode passes
- ✅ No business logic in contracts (pure interfaces)

---

### Phase 1: Registry System
**Estimated Complexity:** LOW
**Dependencies:** Phase 0
**Deliverables:**
- `core/registry/runner-registry.ts` - RunnerRegistry class
- `core/registry/runner-registry.test.ts` - Unit tests
- `core/registry/evaluator-registry.ts` - EvaluatorRegistry class
- `core/registry/evaluator-registry.test.ts` - Unit tests

**Key Features:**
- Register runners by type
- Get runner by type
- List all registered runners
- Prevent duplicate registration
- Thread-safe (if needed)

**Success Criteria:**
- ✅ Can register and retrieve runners
- ✅ Throws error on duplicate registration
- ✅ 80%+ test coverage
- ✅ Immutable operations

---

### Phase 2: IntentRunner Implementation (TDD)
**Estimated Complexity:** MEDIUM
**Dependencies:** Phase 0, Phase 1
**Deliverables:**
- `modules/intent/runners/llm-runner.test.ts` - Tests FIRST
- `modules/intent/runners/llm-runner.ts` - Implementation

**Test Cases (Write First):**
1. ✅ Successfully recognizes intent with valid input
2. ✅ Returns complete RunRecord with all required fields
3. ✅ Collects trace events for all steps
4. ✅ Handles LLM errors gracefully
5. ✅ Handles JSON parsing errors
6. ✅ Validates intent against allowed list
7. ✅ Records latency metrics
8. ✅ Includes provenance information
9. ✅ Returns immutable RunRecord
10. ✅ Handles timeout scenarios

**Implementation Steps:**
1. Write failing tests (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor for clarity (IMPROVE)
4. Verify trace collection
5. Verify immutability

**Success Criteria:**
- ✅ All tests pass
- ✅ 80%+ coverage
- ✅ Trace includes: started, llm_call, completed/failed
- ✅ No data mutation
- ✅ Proper error handling with context

---

### Phase 3: IntentEvaluator Implementation (TDD)
**Estimated Complexity:** LOW
**Dependencies:** Phase 0, Phase 2
**Deliverables:**
- `modules/intent/evaluators/intent-evaluator.test.ts` - Tests FIRST
- `modules/intent/evaluators/intent-evaluator.ts` - Implementation

**Test Cases (Write First):**
1. ✅ Calculates accuracy correctly
2. ✅ Calculates confidence correctly
3. ✅ Calculates latency metric
4. ✅ Returns ScoreRecord[] with all required fields
5. ✅ Includes evidence for explainability
6. ✅ Handles missing expected output
7. ✅ Handles failed runs
8. ✅ Returns immutable ScoreRecord[]
9. ✅ Sets correct target ('final' vs 'global')
10. ✅ Includes evaluatorId

**Metrics to Calculate:**
- `accuracy` - Intent match (boolean → 1.0 or 0.0)
- `confidence` - From LLM output
- `latency` - From RunRecord.metrics
- `match` - Boolean indicating correctness

**Success Criteria:**
- ✅ All tests pass
- ✅ 80%+ coverage
- ✅ Evidence includes explanation
- ✅ No data mutation
- ✅ Handles edge cases

---

### Phase 4: Module Registration
**Estimated Complexity:** LOW
**Dependencies:** Phase 1, Phase 2, Phase 3
**Deliverables:**
- `modules/intent/index.ts` - Registration function
- `modules/intent/index.test.ts` - Integration test

**Implementation:**
```typescript
export function registerIntentModule(
  runnerRegistry: RunnerRegistry,
  evaluatorRegistry: EvaluatorRegistry
): void {
  runnerRegistry.register(new IntentLLMRunner())
  evaluatorRegistry.register(new IntentEvaluator())
}
```

**Success Criteria:**
- ✅ Can register module successfully
- ✅ Registered components are retrievable
- ✅ Integration test passes

---

### Phase 5: Create Pull Request
**Estimated Complexity:** LOW
**Dependencies:** All previous phases
**Deliverables:**
- Pull request with comprehensive description
- Test results screenshot
- Example usage code
- Migration notes (if needed)

**PR Checklist:**
- ✅ All tests pass (`npm test`)
- ✅ 80%+ coverage (`npm run coverage`)
- ✅ No lint errors (`npm run lint`)
- ✅ No type errors (`npm run type-check`)
- ✅ No console.log statements
- ✅ Immutability verified
- ✅ Comprehensive PR description

---

## 4. Detailed Implementation Specifications

### 4.1 IntentRunner Interface Implementation

```typescript
// modules/intent/runners/llm-runner.ts

import type { Runner } from '../../../core/contracts/runner'
import type { AtomicTask } from '../../../core/contracts/task'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record'
import type { LLMClient } from '../../../lib/llm/client'

interface IntentRunnerConfig {
  intents: string[]
  examples?: Record<string, string[]>
  temperature?: number
  maxTokens?: number
}

export class IntentLLMRunner implements Runner {
  readonly id = 'intent.llm'
  readonly type = 'intent'
  readonly version = '1.0.0'

  constructor(private llmClient: LLMClient) {}

  async execute(task: AtomicTask, config: unknown): Promise<RunRecord> {
    const trace: TraceEvent[] = []
    const startTime = Date.now()
    const validatedConfig = this.validateConfig(config)

    try {
      // Trace: Started
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'started',
        data: { taskId: task.id }
      })

      // Build prompt
      const systemPrompt = this.buildSystemPrompt(validatedConfig)

      // Trace: Prompt built
      trace.push({
        timestamp: new Date(),
        level: 'debug',
        event: 'prompt_built',
        data: { promptLength: systemPrompt.length }
      })

      // Call LLM
      const llmRequest = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: String(task.input) }
        ],
        temperature: validatedConfig.temperature || 0.3,
        maxTokens: validatedConfig.maxTokens || 100
      }

      // Trace: LLM call started
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'llm_call_started',
        data: { model: 'configured-model' }
      })

      const response = await this.llmClient.chat(llmRequest)

      // Trace: LLM call completed
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'llm_call_completed',
        data: {
          tokens: response.usage?.totalTokens,
          responseLength: response.content.length
        }
      })

      // Parse response
      const output = this.parseResponse(response.content, validatedConfig.intents)

      // Trace: Completed
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'completed',
        data: { intent: output.intent, confidence: output.confidence }
      })

      return {
        id: this.generateId(),
        taskId: task.id,
        taskType: 'atomic',
        status: 'completed',
        output,
        metrics: {
          latency: Date.now() - startTime,
          tokens: response.usage?.totalTokens,
          cost: this.calculateCost(response.usage?.totalTokens)
        },
        trace,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config: validatedConfig
        }
      }

    } catch (error) {
      // Trace: Failed
      trace.push({
        timestamp: new Date(),
        level: 'error',
        event: 'failed',
        data: {
          error: error instanceof Error ? error.message : String(error),
          step: 'execute'
        }
      })

      return {
        id: this.generateId(),
        taskId: task.id,
        taskType: 'atomic',
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        metrics: {
          latency: Date.now() - startTime
        },
        trace,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config: validatedConfig
        }
      }
    }
  }

  private validateConfig(config: unknown): IntentRunnerConfig {
    // Use Zod for validation
    // Return validated config
  }

  private buildSystemPrompt(config: IntentRunnerConfig): string {
    // Reuse logic from existing intent.ts
  }

  private parseResponse(content: string, allowedIntents: string[]): IntentResult {
    // Parse JSON and validate
  }

  private generateId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateCost(tokens?: number): number | undefined {
    // Calculate cost based on token usage
  }
}
```

### 4.2 IntentEvaluator Interface Implementation

```typescript
// modules/intent/evaluators/intent-evaluator.ts

import type { Evaluator } from '../../../core/contracts/evaluator'
import type { RunRecord } from '../../../core/contracts/run-record'
import type { AtomicTask } from '../../../core/contracts/task'
import type { ScoreRecord } from '../../../core/contracts/score-record'

interface IntentResult {
  intent: string
  confidence: number
  reasoning?: string
}

export class IntentEvaluator implements Evaluator {
  readonly id = 'intent.metrics'
  readonly metrics = ['accuracy', 'confidence', 'latency', 'match']

  async evaluate(run: RunRecord, task: AtomicTask): Promise<ScoreRecord[]> {
    const scores: ScoreRecord[] = []

    // Always include latency
    scores.push({
      id: this.generateId(),
      runId: run.id,
      metric: 'latency',
      value: run.metrics.latency,
      target: 'global',
      evaluatorId: this.id,
      createdAt: new Date()
    })

    // If run failed, return only latency
    if (run.status === 'failed') {
      return scores
    }

    // Extract output
    const output = run.output as IntentResult

    // Confidence score
    if (typeof output.confidence === 'number') {
      scores.push({
        id: this.generateId(),
        runId: run.id,
        metric: 'confidence',
        value: output.confidence,
        target: 'final',
        evidence: {
          explanation: `LLM confidence score: ${output.confidence}`,
          snippets: [`Confidence: ${output.confidence}`]
        },
        evaluatorId: this.id,
        createdAt: new Date()
      })
    }

    // If expected output exists, calculate accuracy
    if (task.expected) {
      const expected = task.expected as { intent: string }
      const isMatch = output.intent === expected.intent

      // Match (boolean)
      scores.push({
        id: this.generateId(),
        runId: run.id,
        metric: 'match',
        value: isMatch,
        target: 'final',
        evidence: {
          explanation: isMatch
            ? `Intent matched: expected "${expected.intent}", got "${output.intent}"`
            : `Intent mismatch: expected "${expected.intent}", got "${output.intent}"`,
          snippets: [
            `Expected: ${expected.intent}`,
            `Actual: ${output.intent}`
          ]
        },
        evaluatorId: this.id,
        createdAt: new Date()
      })

      // Accuracy (1.0 or 0.0)
      scores.push({
        id: this.generateId(),
        runId: run.id,
        metric: 'accuracy',
        value: isMatch ? 1.0 : 0.0,
        target: 'final',
        evidence: {
          explanation: `Binary accuracy: ${isMatch ? 'correct' : 'incorrect'}`
        },
        evaluatorId: this.id,
        createdAt: new Date()
      })
    }

    return scores
  }

  private generateId(): string {
    return `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
```


---

## 5. Test Strategy (TDD Approach)

### 5.1 IntentRunner Test Cases

**File:** `modules/intent/runners/llm-runner.test.ts`

```typescript
describe('IntentLLMRunner', () => {
  describe('execute - success cases', () => {
    it('should return complete RunRecord with all required fields')
    it('should collect trace events for all steps')
    it('should include provenance information')
    it('should calculate latency metrics')
    it('should parse LLM response correctly')
    it('should validate intent against allowed list')
  })

  describe('execute - error cases', () => {
    it('should handle LLM API errors gracefully')
    it('should handle JSON parsing errors')
    it('should handle invalid intent in response')
    it('should handle timeout scenarios')
    it('should include error in trace')
  })

  describe('immutability', () => {
    it('should not mutate input task')
    it('should return new RunRecord object')
  })

  describe('trace collection', () => {
    it('should include started event')
    it('should include llm_call_started event')
    it('should include llm_call_completed event')
    it('should include completed event on success')
    it('should include failed event on error')
  })
})
```

### 5.2 IntentEvaluator Test Cases

**File:** `modules/intent/evaluators/intent-evaluator.test.ts`

```typescript
describe('IntentEvaluator', () => {
  describe('evaluate - with expected output', () => {
    it('should calculate accuracy correctly for match')
    it('should calculate accuracy correctly for mismatch')
    it('should extract confidence from output')
    it('should include latency metric')
    it('should include match boolean')
    it('should provide evidence for all metrics')
  })

  describe('evaluate - without expected output', () => {
    it('should return confidence and latency only')
    it('should not calculate accuracy')
  })

  describe('evaluate - failed runs', () => {
    it('should return only latency for failed runs')
    it('should not throw error on failed runs')
  })

  describe('immutability', () => {
    it('should not mutate input RunRecord')
    it('should not mutate input Task')
    it('should return new ScoreRecord array')
  })

  describe('evidence', () => {
    it('should include explanation for accuracy')
    it('should include snippets for comparison')
    it('should include confidence explanation')
  })
})
```


---

## 6. Dependencies & Risks

### 6.1 Dependencies

| Dependency | Status | Risk Level | Notes |
|------------|--------|------------|-------|
| Core Contracts | ❌ Not implemented | HIGH | Must be implemented first (Phase 0) |
| Registry System | ❌ Not implemented | HIGH | Required for module registration |
| LLMClient | ✅ Exists | LOW | Can reuse existing implementation |
| Zod Validation | ✅ Available | LOW | Already in use |
| Vitest | ✅ Available | LOW | Test framework ready |

### 6.2 Risks

#### HIGH Risk
1. **Contract Changes During Implementation**
   - **Mitigation:** Freeze contracts before starting Phase 2
   - **Owner:** Claude #1 (Architecture)

2. **LLMClient API Incompatibility**
   - **Mitigation:** Review LLMClient interface early
   - **Owner:** Claude #2 (Backend)

#### MEDIUM Risk
3. **Test Coverage Below 80%**
   - **Mitigation:** Write tests first (TDD), verify coverage after each phase
   - **Owner:** Claude #2 (Backend)

4. **Trace Collection Performance Impact**
   - **Mitigation:** Keep trace events lightweight, benchmark if needed
   - **Owner:** Claude #2 (Backend)

#### LOW Risk
5. **ID Generation Collisions**
   - **Mitigation:** Use timestamp + random string, acceptable for MVP
   - **Owner:** Claude #2 (Backend)


---

## 7. Success Criteria & Acceptance

### 7.1 Phase Completion Criteria

#### Phase 0: Core Contracts
- ✅ All contract interfaces defined
- ✅ TypeScript strict mode passes
- ✅ No business logic in contracts
- ✅ Matches `docs/architecture/contracts.md` exactly

#### Phase 1: Registry System
- ✅ Can register and retrieve runners
- ✅ Can register and retrieve evaluators
- ✅ Prevents duplicate registration
- ✅ 80%+ test coverage
- ✅ All tests pass

#### Phase 2: IntentRunner
- ✅ Implements Runner interface correctly
- ✅ Returns complete RunRecord
- ✅ Collects comprehensive trace
- ✅ Handles all error cases
- ✅ 80%+ test coverage
- ✅ All tests pass
- ✅ No data mutation
- ✅ No console.log statements

#### Phase 3: IntentEvaluator
- ✅ Implements Evaluator interface correctly
- ✅ Returns ScoreRecord[] with evidence
- ✅ Calculates all required metrics
- ✅ Handles edge cases
- ✅ 80%+ test coverage
- ✅ All tests pass
- ✅ No data mutation

#### Phase 4: Module Registration
- ✅ Registration function works
- ✅ Components are retrievable from registry
- ✅ Integration test passes

#### Phase 5: Pull Request
- ✅ All tests pass
- ✅ 80%+ coverage verified
- ✅ No lint errors
- ✅ No type errors
- ✅ Comprehensive PR description
- ✅ Example usage included


---

## 8. Example Usage

### 8.1 Using IntentRunner

```typescript
import { IntentLLMRunner } from './modules/intent/runners/llm-runner'
import { LLMClient } from './lib/llm/client'

// Create runner
const llmClient = new LLMClient(apiConfig)
const runner = new IntentLLMRunner(llmClient)

// Define task
const task: AtomicTask = {
  id: 'task-001',
  name: 'Recognize booking intent',
  type: 'intent',
  input: '我想订一张明天去北京的机票',
  expected: {
    intent: 'book_flight',
    confidence: 0.9
  },
  metadata: {
    tags: ['intent', 'booking'],
    priority: 1
  }
}

// Execute
const config = {
  intents: ['book_flight', 'cancel_flight', 'check_status'],
  temperature: 0.3,
  maxTokens: 100
}

const runRecord = await runner.execute(task, config)

console.log('Status:', runRecord.status)
console.log('Output:', runRecord.output)
console.log('Trace events:', runRecord.trace.length)
console.log('Latency:', runRecord.metrics.latency, 'ms')
```

### 8.2 Using IntentEvaluator

```typescript
import { IntentEvaluator } from './modules/intent/evaluators/intent-evaluator'

// Create evaluator
const evaluator = new IntentEvaluator()

// Evaluate run
const scores = await evaluator.evaluate(runRecord, task)

for (const score of scores) {
  console.log(`${score.metric}: ${score.value}`)
  if (score.evidence) {
    console.log(`  Evidence: ${score.evidence.explanation}`)
  }
}
```

### 8.3 Module Registration

```typescript
import { RunnerRegistry } from './core/registry/runner-registry'
import { EvaluatorRegistry } from './core/registry/evaluator-registry'
import { registerIntentModule } from './modules/intent'

// Create registries
const runnerRegistry = new RunnerRegistry()
const evaluatorRegistry = new EvaluatorRegistry()

// Register intent module
registerIntentModule(runnerRegistry, evaluatorRegistry)

// Use via registry
const runner = runnerRegistry.get('intent')
const evaluator = evaluatorRegistry.get('intent.metrics')
```


---

## 9. Migration Notes

### 9.1 Differences from Existing Code

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| Class Name | `IntentRecognizer` | `IntentLLMRunner` |
| Interface | Custom class | Implements `Runner` |
| Return Type | `IntentResult` | `RunRecord` |
| Error Handling | Throws errors | Returns failed RunRecord |
| Trace | None | Complete trace collection |
| Provenance | None | Full provenance info |
| Metrics | None | Latency, tokens, cost |

### 9.2 Breaking Changes

1. **API Changes**
   - Old: `recognizer.recognize(input)` → New: `runner.execute(task, config)`
   - Return type changed from `IntentResult` to `RunRecord`

2. **Configuration**
   - Old: Passed to constructor
   - New: Passed to `execute()` method

3. **Error Handling**
   - Old: Throws exceptions
   - New: Returns RunRecord with status='failed'

### 9.3 Backward Compatibility

**Not backward compatible.** This is a complete architectural change.

**Migration Path:**
1. Keep old code in `lib/agents/intent.ts` (deprecated)
2. Implement new code in `modules/intent/`
3. Update API layer to use new implementation
4. Remove old code after migration complete


---

## 10. Timeline & Effort Estimation

### 10.1 Estimated Effort by Phase

| Phase | Tasks | Estimated Effort | Complexity |
|-------|-------|-----------------|------------|
| Phase 0: Core Contracts | Define 5 contract files | 4-6 hours | MEDIUM |
| Phase 1: Registry System | Implement + test 2 registries | 3-4 hours | LOW |
| Phase 2: IntentRunner | Write tests + implement | 6-8 hours | MEDIUM |
| Phase 3: IntentEvaluator | Write tests + implement | 3-4 hours | LOW |
| Phase 4: Module Registration | Integration + test | 1-2 hours | LOW |
| Phase 5: Pull Request | Documentation + review prep | 2-3 hours | LOW |
| **Total** | | **19-27 hours** | **MEDIUM** |

### 10.2 Critical Path

```
Phase 0 (Contracts) → Phase 1 (Registry) → Phase 2 (Runner) → Phase 4 (Registration) → Phase 5 (PR)
                                         → Phase 3 (Evaluator) ↗
```

**Note:** Phase 2 and Phase 3 can be partially parallelized after Phase 1 completes.


---

## 11. Open Questions & Decisions Needed

### 11.1 Questions for Claude #1 (Architecture)

1. **Contract Finalization**
   - Are the contracts in `docs/architecture/contracts.md` frozen?
   - Any planned changes before implementation starts?

2. **ID Generation Strategy**
   - Is `timestamp + random` acceptable for MVP?
   - Should we use UUID library instead?

3. **Cost Calculation**
   - Should we implement cost calculation in Phase 2?
   - What pricing model to use (per-token rates)?

4. **Trace Event Granularity**
   - Is the proposed trace level (started, llm_call_started, llm_call_completed, completed) sufficient?
   - Should we add more debug-level events?

### 11.2 Questions for Gemini (Frontend)

1. **API Compatibility**
   - Will frontend need to support both old and new API during migration?
   - Timeline for frontend migration?

2. **Trace Visualization**
   - Will frontend display trace events?
   - What format is preferred?

### 11.3 Decisions Made

1. ✅ **Use TDD Approach** - Write tests first for all components
2. ✅ **Reuse Existing Logic** - Adapt prompt building and metrics from old code
3. ✅ **Immutability Required** - All data structures must be immutable
4. ✅ **Comprehensive Trace** - Collect trace for every execution step
5. ✅ **Registry Pattern** - Use registry for all module registration


---

## 12. Next Steps & Action Items

### 12.1 Immediate Actions (Before Starting Implementation)

1. **Review & Approve This Plan**
   - [ ] Claude #1 reviews architectural alignment
   - [ ] Gemini reviews frontend compatibility
   - [ ] Codex reviews code quality standards
   - [ ] User approves overall approach

2. **Freeze Contracts**
   - [ ] Claude #1 confirms contracts are final
   - [ ] No changes allowed during implementation

3. **Setup Development Environment**
   - [ ] Create branch: `feature/intent-module-new-architecture`
   - [ ] Setup test environment
   - [ ] Verify dependencies

### 12.2 Implementation Sequence

**Week 1:**
- Day 1-2: Phase 0 (Core Contracts)
- Day 3-4: Phase 1 (Registry System)
- Day 5: Phase 2 start (IntentRunner tests)

**Week 2:**
- Day 1-2: Phase 2 complete (IntentRunner implementation)
- Day 3: Phase 3 (IntentEvaluator)
- Day 4: Phase 4 (Module Registration)
- Day 5: Phase 5 (PR preparation)

### 12.3 Communication Plan

**Daily Updates:**
- Progress on current phase
- Blockers encountered
- Questions for other team members

**Phase Completion:**
- Demo of working code
- Test coverage report
- Request for review


---

## 13. Summary & Approval Request

### 13.1 What This Plan Delivers

✅ **IntentRunner** - Fully compliant Runner implementation with:
- Complete RunRecord with trace
- Provenance tracking
- Error handling
- Immutable operations

✅ **IntentEvaluator** - Fully compliant Evaluator implementation with:
- Structured ScoreRecord[]
- Evidence for explainability
- Multiple metrics (accuracy, confidence, latency, match)

✅ **Registry Integration** - Pluggable module system:
- No hardcoded dependencies
- Dynamic registration
- Type-safe retrieval

✅ **Comprehensive Tests** - TDD approach:
- 80%+ coverage
- Unit + integration tests
- Error case coverage

### 13.2 Alignment with Architecture

| Requirement | Status |
|-------------|--------|
| Three-layer architecture | ✅ Follows Core → Modules → Implementations |
| Core Engine stays generic | ✅ No business logic in Core |
| Trace is first-class citizen | ✅ Complete trace collection |
| Registry-based extension | ✅ Uses RunnerRegistry/EvaluatorRegistry |
| Contract compliance | ✅ Implements all required interfaces |
| Immutability | ✅ No data mutation |
| TDD workflow | ✅ Tests written first |

### 13.3 Risks & Mitigation

**HIGH Risk:** Contract changes during implementation
- **Mitigation:** Freeze contracts before Phase 2

**MEDIUM Risk:** Test coverage below 80%
- **Mitigation:** TDD approach, verify after each phase

**LOW Risk:** Performance impact from trace collection
- **Mitigation:** Lightweight events, benchmark if needed

---

## 14. APPROVAL REQUEST

**Status:** ⏸️ AWAITING CONFIRMATION

This plan is ready for implementation pending approval from:

1. **User** - Overall approach and timeline
2. **Claude #1 (Architecture)** - Contract alignment and architectural decisions
3. **Gemini (Frontend)** - API compatibility and migration timeline
4. **Codex (Review)** - Code quality standards and testing approach

**Questions to Answer:**
1. Is this plan approved to proceed?
2. Are there any modifications needed?
3. Should we proceed with Phase 0 immediately?

---

**Plan Created By:** Claude #2 (Backend Implementation)  
**Date:** 2026-01-29  
**Version:** 1.0  
**Status:** AWAITING CONFIRMATION

