# Complete Example: Building a Task Management App

## Project: TaskFlow

A simple task management app to demonstrate the Tri-AI workflow.

---

## 🎯 Phase 0: Requirements

**User Story:**
> As a user, I want to create, read, update, and delete tasks, so I can track my work.

**Features:**
- Create task with title and description
- Mark tasks as complete/incomplete
- Delete tasks
- Filter tasks by status
- Responsive UI with dark mode

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Prisma + SQLite (dev)
- Zod for validation

---

## 📋 Phase 1: Planning

```bash
/plan "Build a task management app with:
- CRUD operations for tasks
- Task list with filtering
- Task creation form
- Dark mode support
- Mobile responsive
Tech stack: Next.js 14 + TypeScript + Prisma + TailwindCSS"
```

**Planner Agent Output:**
```markdown
# Implementation Plan: Task Management App

## Overview
Build a complete task management system with backend API and frontend UI.

## Requirements
- Create tasks (title, description, completed status)
- Read all tasks with filtering
- Update task status and details
- Delete tasks
- Responsive dark mode UI

## Architecture Changes
- prisma/schema.ts: Add Task model
- src/app/api/tasks/route.ts: CRUD endpoints
- src/components/task/: UI components
- src/types/api.ts: API contracts

## Implementation Steps

### Phase 1: Database & Types
1. **Setup Prisma** (prisma/schema.prisma)
   - Add Task model with fields
   - Run migration

### Phase 2: Backend (TDD)
2. **Create API endpoints** (src/app/api/tasks/)
   - GET /api/tasks - List tasks
   - POST /api/tasks - Create task
   - PUT /api/tasks/:id - Update task
   - DELETE /api/tasks/:id - Delete task

### Phase 3: Frontend
3. **Generate UI components** (Gemini)
   - TaskList component
   - TaskItem component
   - TaskForm component
   - FilterBar component

### Phase 4: Integration
4. **Connect frontend to backend**
   - Wire up API calls
   - Add error handling
   - Add loading states

### Phase 5: Testing
5. **E2E tests**
   - Create task flow
   - Update task flow
   - Delete task flow
   - Filter tasks flow

## Success Criteria
- [ ] All CRUD operations working
- [ ] 80%+ test coverage
- [ ] E2E tests passing
- [ ] Mobile responsive
- [ ] Dark mode working
- [ ] Security review passed
```

---

## 📝 Phase 2: Define API Contracts

**Manual file creation:**

```typescript
// src/types/api.ts
export interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
}

export interface TaskListFilters {
  status?: 'all' | 'active' | 'completed'
}

export interface ApiResponse<T> {
  data: T
  error?: string
}
```

---

## 🔧 Phase 3: Backend with TDD

```bash
/tdd "Create tasks API with Prisma:
- GET /api/tasks - List tasks with optional filter
- POST /api/tasks - Create task with Zod validation
- PUT /api/tasks/[id] - Update task
- DELETE /api/tasks/[id] - Delete task

Requirements:
- Prisma for database operations
- Zod schemas for validation
- Error handling with proper status codes
- Unit tests for all operations
- Integration tests for API routes
- Minimum 80% coverage"
```

**TDD Process:**

**Step 1: Write failing tests (RED)**
```typescript
// src/app/api/tasks/route.test.ts
import { POST } from './route'
import { prisma } from '@/lib/db'

describe('POST /api/tasks', () => {
  it('should create task with valid data', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Task',
          description: 'Test Description'
        })
      })
    )

    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.title).toBe('Test Task')
    expect(data.data.completed).toBe(false)
  })

  it('should reject task without title', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title' })
      })
    )

    expect(response.status).toBe(400)
    expect(data.error).toContain('title')
  })
})
```

**Step 2: Implement minimal code (GREEN)**
```typescript
// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = createTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: result.data
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where = status === 'completed'
    ? { completed: true }
    : status === 'active'
    ? { completed: false }
    : {}

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ data: tasks })
}
```

**Step 3: Run and verify**
```bash
npm test
# ✅ All tests passing!
# Coverage: 85%
```

---

## 🎨 Phase 4: Frontend with Gemini

**Switch to Gemini with this prompt:**

```
Generate React components for a task management app:

COMPONENTS NEEDED:

1. TaskList Component
   - Display list of tasks
   - Filter controls (All/Active/Completed)
   - Empty state illustration
   - Loading skeleton
   - Error message display

2. TaskItem Component
   - Display task title and description
   - Checkbox for completion status
   - Delete button
   - Strikethrough when completed
   - Smooth animations

3. TaskForm Component
   - Input field for title
   - Textarea for description
   - Submit button
   - Validation errors
   - Loading state
   - Success feedback

4. FilterBar Component
   - Filter buttons (All/Active/Completed)
   - Active state styling
   - Task count display

TECHNICAL REQUIREMENTS:
- Next.js 14 with App Router
- TypeScript with strict types
- TailwindCSS for styling
- Dark mode support (class-based)
- SWR for data fetching
- Framer Motion for animations

API INTEGRATION:
- GET /api/tasks?status=filter
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

TYPES:
interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
}

ACCESSIBILITY:
- WCAG 2.1 AA compliant
- ARIA labels for buttons
- Keyboard navigation
- Focus indicators
- Screen reader support

RESPONSIVE:
- Mobile-first approach
- Breakpoints: 320px, 640px, 1024px
- Touch-friendly (44px min tap targets)

Please provide:
1. Complete component code with TypeScript
2. Proper imports and exports
3. Inline comments for complex logic
4. Usage examples
5. Suggested test cases
```

**Gemini Output (example):**

```typescript
// src/components/task/TaskList.tsx
'use client'

import { useTasks } from '@/hooks/useTasks'
import { TaskItem } from './TaskItem'
import { FilterBar } from './FilterBar'
import { TaskForm } from './TaskForm'
import { motion, AnimatePresence } from 'framer-motion'

export function TaskList() {
  const { tasks, loading, error, filter, setFilter, createTask, updateTask, deleteTask } = useTasks()

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Tasks</h1>

      <TaskForm onSubmit={createTask} />

      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        count={tasks.length}
      />

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <motion.div layout>
          <AnimatePresence>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ filter }: { filter: string }) {
  const messages = {
    all: "No tasks yet. Create one above!",
    active: "No active tasks. Good job!",
    completed: "No completed tasks yet."
  }

  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <p className="text-lg">{messages[filter]}</p>
    </div>
  )
}
```

---

## ✅ Phase 5: Code Review

```bash
/code-review src/components/task/
```

**Review Output:**
```markdown
## Code Review Results

### Issues Found:
1. [Critical] Missing error boundary
2. [Medium] No keyboard navigation for filter buttons
3. [Minor] Missing loading state for delete operation

### Recommendations:
1. Wrap TaskList in ErrorBoundary
2. Add proper focus management
3. Add optimistic updates for better UX
4. Add unit tests for components

### Action Items:
- [ ] Add ErrorBoundary component
- [ ] Implement keyboard shortcuts
- [ ] Add component tests
- [ ] Test with screen reader
```

**Fix the issues:**

```bash
/plan "Fix code review issues:
1. Add ErrorBoundary to TaskList
2. Add keyboard navigation to FilterBar
3. Add optimistic updates
4. Create component tests"
```

---

## 🧪 Phase 6: E2E Testing

```bash
/e2e "Complete task management workflow:
1. User visits /tasks
2. User creates a new task
3. Task appears in list
4. User marks task as complete
5. User filters by completed
6. User deletes task
7. Task is removed from list"
```

**E2E Test Generated:**

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks')
  })

  test('should create and display task', async ({ page }) => {
    await page.fill('[name="title"]', 'My First Task')
    await page.fill('[name="description"]', 'This is a test task')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=My First Task')).toBeVisible()
    await expect(page.locator('text=This is a test task')).toBeVisible()
  })

  test('should mark task as complete', async ({ page }) => {
    // Create task first
    await page.fill('[name="title"]', 'Task to Complete')
    await page.click('button[type="submit"]')

    // Mark as complete
    await page.click('[data-testid="task-checkbox"]')

    // Verify completed state
    const task = page.locator('[data-testid="task-item"]')
    await expect(task).toHaveClass(/completed/)
  })

  test('should filter tasks by status', async ({ page }) => {
    // Create active and completed tasks
    await page.fill('[name="title"]', 'Active Task')
    await page.click('button[type="submit"]')

    await page.fill('[name="title"]', 'Completed Task')
    await page.click('button[type="submit"]')
    await page.click('[data-testid="task-checkbox"]')

    // Filter by completed
    await page.click('button:has-text("Completed")')
    await expect(page.locator('text=Completed Task')).toBeVisible()
    await expect(page.locator('text=Active Task')).not.toBeVisible()
  })

  test('should delete task', async ({ page }) => {
    await page.fill('[name="title"]', 'Task to Delete')
    await page.click('button[type="submit"]')

    await page.click('[data-testid="delete-button"]')

    await expect(page.locator('text=Task to Delete')).not.toBeVisible()
  })
})
```

**Run tests:**
```bash
npm run test:e2e
# ✅ All 4 tests passed
```

---

## 🔒 Phase 7: Security Review

```bash
/plan "Run security-reviewer on task app"
```

**Security Review Output:**
```markdown
## Security Audit Results

### ✅ Passed Checks:
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- XSS protection (React escaping)
- CSRF protection (Next.js built-in)
- Proper error messages (no data leakage)

### ⚠️ Recommendations:
1. Add rate limiting to POST /api/tasks
2. Add authentication/authorization
3. Sanitize task descriptions (HTML prevention)
4. Add CSP headers
5. Implement request size limits

### Fixed:
Added rate limiting middleware, input sanitization, and security headers.
```

---

## 🐛 Phase 8: Debug Session

**Encountered error:**
```
Error: Task deletion is not updating the UI
```

**Debug workflow:**

```bash
/triai-debug "Error: Task deletion not updating UI

CONTEXT:
- File: src/components/task/TaskItem.tsx
- Function: handleDelete
- Action: Clicking delete button removes task from DB but UI doesn't update

CODE:
const handleDelete = async () => {
  await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
  // Missing: await onDelete(task.id)
}

EXPECTED:
- Task should disappear from list
- List should re-render

ACTUAL:
- Task is deleted from database
- UI still shows task

RECENT CHANGES:
- Just added delete functionality

Please help:
1. Identify the bug
2. Explain why UI doesn't update
3. Provide fix
4. Suggest how to prevent this"
```

**Codex Solution:**
```
The issue is that you're calling the API but not triggering a state update.
The parent component needs to know to refresh the task list.

FIX:
Option 1: Use SWR's mutate to invalidate cache
Option 2: Call onDelete callback to update local state
Option 3: Revalidate after deletion

Recommended: Option 2 (callback) is simplest for this case
```

**Apply fix:**
```typescript
const handleDelete = async () => {
  await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
  onDelete(task.id) // ✅ Added callback
}
```

**Verify:**
```bash
npm test
# ✅ All tests passing
# Manual test: Task deletion now works!
```

---

## ��� Phase 9: Final Checklist

Before considering complete:

- [x] Backend tests passing (85% coverage)
- [x] Frontend components reviewed
- [x] E2E tests passing (4/4)
- [x] Security review passed
- [x] No TypeScript errors
- [x] No console warnings
- [x] Mobile responsive tested
- [x] Dark mode working
- [x] Accessibility verified (Lighthouse: 95)
- [x] Performance optimized (Lighthouse: 96)
- [x] Documentation complete
- [x] Ready for deployment

---

## 🚀 Phase 10: Deploy

```bash
# Build for production
npm run build

# Test production build
npm run start

# Deploy to Vercel
vercel --prod
```

**Live:** https://taskflow-demo.vercel.app ✅

---

## 📊 Results

### Metrics
- **Development Time:** 3 hours
- **Lines of Code:** ~800
- **Test Coverage:** 85%
- **E2E Tests:** 4 scenarios
- **Performance:** 96/100
- **Accessibility:** 95/100
- **Security:** All checks passed

### What Each AI Did

**Gemini 2.0 Flash:**
- Generated 5 React components in < 2 minutes
- Created responsive layouts
- Added animations and interactions
- Saved ~2 hours of frontend development

**Claude Sonnet (with TDD):**
- Created 4 API endpoints with tests
- Achieved 85% code coverage
- Ensured type safety and error handling
- Saved ~3 hours of backend development

**Codex:**
- Fixed 3 bugs during development
- Debugged type errors
- Solved integration issues
- Saved ~1 hour of debugging

**Claude Code (Orchestrator):**
- Created detailed implementation plan
- Reviewed all code for quality
- Ran security audits
- Coordinated the workflow
- Enforced best practices

### Time Saved vs Traditional Development
- **Traditional:** ~12 hours
- **With Tri-AI:** ~3 hours
- **Speed:** 4x faster

---

## 🎓 Key Learnings

1. **Planning is critical** - The `/plan` phase prevented 3 potential issues
2. **TDD works** - Caught 2 bugs before they reached production
3. **Code review is essential** - Found accessibility issues we would have missed
4. **E2E tests save time** - Caught a breaking change we didn't notice
5. **Security first** - Prevented potential XSS vulnerabilities

---

## 🔄 Next Steps

**Potential enhancements:**
```bash
/plan "Add advanced features:
1. Task due dates
2. Task priorities
3. Task categories/tags
4. Search functionality
5. User authentication
6. Real-time updates with WebSockets
7. Task sharing/collaboration"
```

---

**This is how you build an AI-native product from 0 to 1!** 🚀

Each AI has its strength. Your job is to orchestrate them effectively.
