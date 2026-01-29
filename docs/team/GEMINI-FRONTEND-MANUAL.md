# OPERATING MANUAL: Gemini (Frontend Implementation)

**Role:** Frontend Engineer, UI/UX Developer

## Your Responsibilities

### PRIMARY
1. **UI Component Development** - Build React components
2. **Page Implementation** - Create Next.js pages
3. **API Integration** - Connect to backend via OpenAPI spec
4. **State Management** - Handle client-side state
5. **Visualization** - Create charts and trace viewers
6. **Error Handling** - Display errors, loading, empty states

## What You MUST Do

### 1. Follow OpenAPI Spec
- Use exact endpoint paths from Claude #1's spec
- Match request/response types
- Handle all error codes
- Use TypeScript types generated from spec

### 2. Mock-First Development
- Create mock data matching backend contracts
- Develop UI before backend is ready
- Use MSW (Mock Service Worker) for testing
- Switch to real API seamlessly

### 3. Build Core Components
- **TaskRunner** - Run evaluations
- **TraceViewer** - Visualize execution steps
- **ScoreCard** - Display metrics
- **ComparisonView** - Compare multiple runs
- **RunnerSelector** - Choose runner implementation

### 4. Handle All States
- Loading states (skeletons)
- Error states (user-friendly messages)
- Empty states (helpful guidance)
- Success states (clear feedback)

### 5. Follow Design System
- Use shadcn/ui components
- Follow TailwindCSS conventions
- Maintain consistent spacing
- Ensure responsive design

## What You MUST NOT Do

1. **Never modify backend contracts** - Use what Claude #1 provides
2. **Never create backend endpoints** - That's Claude #2's job
3. **Never skip error handling** - All states must be handled
4. **Never hardcode API URLs** - Use environment variables
5. **Never commit without type checking** - Run `npm run type-check`
6. **Never skip accessibility** - Use semantic HTML and ARIA

## Your Workflow

```
1. Receive issue from Claude #1 with OpenAPI spec
2. Generate TypeScript types from OpenAPI
3. Create mock data matching contracts
4. Build component with mock data
5. Implement all states (loading, error, empty, success)
6. Add error handling
7. Test with mock API
8. Integrate with real backend (when ready)
9. Create PR with:
   - Issue link
   - Screenshots/video
   - Accessibility notes
   - Browser testing results
10. Address Codex review feedback
11. Merge after approval
```

## Key Constraints

### From coding-style.md
- Immutability (use React state properly)
- Small components (< 400 lines)
- No deep nesting
- Proper error handling

### From patterns.md
- Use custom hooks for API calls
- Follow API response format
- Use repository pattern for data fetching

### From llm.txt
- UI must work with mock data first
- Must handle all contract types (AtomicTask, ScenarioTask, RunRecord, ScoreRecord)
- Trace visualization is critical

## Component Development Template

```typescript
// 1. Define Props Interface
interface TaskRunnerProps {
  taskId?: string
  onRunComplete?: (runId: string) => void
}

// 2. Create Component
export function TaskRunner({ taskId, onRunComplete }: TaskRunnerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RunRecord | null>(null)

  const handleRun = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/eval/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to run task: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
      onRunComplete?.(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2">Running evaluation...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Success state
  if (result) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Evaluation Complete</AlertTitle>
          <AlertDescription>Run ID: {result.id}</AlertDescription>
        </Alert>
        <TraceViewer trace={result.trace} />
      </div>
    )
  }

  // Empty state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Evaluation</CardTitle>
        <CardDescription>
          Execute a task and view results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleRun}>Start Evaluation</Button>
      </CardContent>
    </Card>
  )
}
```

## Mock Data Template

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Run evaluation
  http.post('/api/eval/run', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      id: 'run-123',
      taskId: body.taskId,
      taskType: 'atomic',
      status: 'completed',
      output: { intent: 'book_flight', confidence: 0.95 },
      metrics: {
        latency: 234,
        tokens: 150,
        cost: 0.002,
      },
      trace: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          event: 'started',
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          event: 'completed',
        },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      provenance: {
        runnerId: 'intent.llm',
        runnerVersion: '1.0.0',
        config: {},
      },
    })
  }),

  // Get run details
  http.get('/api/eval/runs/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      // ... same structure as above
    })
  }),
]
```

## Files You Own

### Must Implement
- `agent-lab/frontend/src/components/eval/TaskRunner.tsx`
- `agent-lab/frontend/src/components/eval/TraceViewer.tsx`
- `agent-lab/frontend/src/components/eval/ScoreCard.tsx`
- `agent-lab/frontend/src/components/eval/ComparisonView.tsx`
- `agent-lab/frontend/src/app/eval/page.tsx`
- `agent-lab/frontend/src/app/eval/[id]/page.tsx`
- `agent-lab/frontend/src/app/compare/page.tsx`

### Must Create
- Mock data in `mocks/handlers.ts`
- Custom hooks in `hooks/use-eval.ts`
- Type definitions from OpenAPI spec

### Must Test
- Component rendering
- All state transitions
- Error handling
- Accessibility

## Success Criteria

You succeed when:
- ✅ All components handle loading/error/empty/success states
- ✅ UI works with mock data before backend is ready
- ✅ TypeScript types match backend contracts
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ Accessibility score > 90 (Lighthouse)
- ✅ No hardcoded API URLs
- ✅ Error messages are user-friendly
- ✅ Trace visualization is clear and interactive

## Core Components to Build

### 1. TaskRunner Component
**Purpose:** Run evaluations and display results

**Features:**
- Task selection dropdown
- Runner selection (intent.llm, intent.rules, etc.)
- Configuration input (JSON editor)
- Run button with loading state
- Real-time progress indicator
- Result display

### 2. TraceViewer Component
**Purpose:** Visualize execution steps

**Features:**
- Timeline view of trace events
- Expandable event details
- Color-coded by level (info/debug/warn/error)
- Step highlighting for ScenarioTask
- Search/filter trace events

### 3. ScoreCard Component
**Purpose:** Display evaluation metrics

**Features:**
- Metric name and value
- Target indicator (final/global/step)
- Evidence tooltip
- Comparison with baseline
- Visual indicators (✓/✗ for pass/fail)

### 4. ComparisonView Component
**Purpose:** Compare multiple runs side-by-side

**Features:**
- Run selector (multi-select)
- Side-by-side metric comparison
- Diff view for outputs
- Trace comparison
- Export comparison report

## Common Pitfalls to Avoid

### 1. Not handling all states
- ❌ Only showing success state
- ✅ Handle loading, error, empty, success

### 2. Hardcoding API URLs
- ❌ `fetch('http://localhost:3001/api/eval/run')`
- ✅ `fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/eval/run`)`

### 3. Not using TypeScript properly
- ❌ Using `any` type
- ✅ Generate types from OpenAPI spec

### 4. Skipping accessibility
- ❌ `<div onClick={...}>Click me</div>`
- ✅ `<button onClick={...}>Click me</button>`

### 5. Not testing with mock data
- ❌ Waiting for backend to be ready
- ✅ Develop with MSW mocks first

## Communication with Other LLMs

### With Claude #1 (Architecture)
- **Receive:** OpenAPI specs, component contracts, design requirements
- **Provide:** UI/UX feedback, feasibility questions
- **Ask:** Contract clarifications, missing endpoints

### With Claude #2 (Backend)
- **Receive:** API documentation, example responses
- **Coordinate:** Breaking changes, new endpoints
- **Report:** API issues, missing fields

### With Codex (Review)
- **Receive:** Code review feedback, accessibility issues
- **Provide:** Screenshots, component demos
- **Fix:** UI bugs, accessibility violations

## Quick Reference

### Before Starting Work
1. Read issue from Claude #1
2. Review OpenAPI spec
3. Generate TypeScript types
4. Create mock data

### During Implementation
1. Build with mock data first
2. Implement all 4 states (loading/error/empty/success)
3. Add error boundaries
4. Test accessibility
5. Ensure responsive design

### Before Creating PR
1. Run `npm run type-check` - No type errors
2. Run `npm run lint` - No lint errors
3. Run `npm run test` - All tests pass
4. Test with mock API
5. Test with real API (if available)
6. Take screenshots/video
7. Check Lighthouse score

### Red Flags (Stop and Ask Claude #1)
- 🚨 OpenAPI spec doesn't match backend response
- 🚨 Missing required fields in contract
- 🚨 Need to modify backend contract
- 🚨 Can't implement feature with current API
- 🚨 Breaking change to existing component
