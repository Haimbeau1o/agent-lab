import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { LLMClient } from '../../lib/llm/client.js'
import { IntentRecognizer } from '../../lib/agents/intent.js'
import { DialogueManager } from '../../lib/agents/dialogue.js'
import { MemoryManager } from '../../lib/agents/memory.js'
import { decrypt } from '../settings/index.js'
import { generateReport } from '../../lib/evaluator/report.js'
import type { CreateTestRunDto } from '../../types/result.js'
import type { IntentTestCase, DialogueTestCase, MemoryTestCase } from '../../types/task.js'

export const testRunsRouter = Router()

// Validation schema
const createTestRunSchema = z.object({
  agentId: z.string(),
  taskId: z.string(),
  datasetId: z.string().optional(),
  apiConfigId: z.string()
})

// GET /api/test-runs - Get all test runs
testRunsRouter.get('/', async (req, res, next) => {
  try {
    const testRuns = await prisma.testRun.findMany({
      include: {
        agent: true,
        task: true,
        dataset: true,
        results: true
      },
      orderBy: { startedAt: 'desc' }
    })

    res.json({ data: testRuns })
  } catch (error) {
    next(error)
  }
})

// GET /api/test-runs/:id - Get single test run
testRunsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: {
        agent: true,
        task: true,
        dataset: true,
        results: true
      }
    })

    if (!testRun) {
      return res.status(404).json({
        error: { message: 'Test run not found' }
      })
    }

    // Parse JSON fields
    const formatted = {
      ...testRun,
      agent: {
        ...testRun.agent,
        config: JSON.parse(testRun.agent.config)
      },
      task: {
        ...testRun.task,
        testCases: JSON.parse(testRun.task.testCases)
      },
      dataset: testRun.dataset ? {
        ...testRun.dataset,
        data: JSON.parse(testRun.dataset.data)
      } : null,
      results: testRun.results.map(r => ({
        ...r,
        input: JSON.parse(r.input),
        output: JSON.parse(r.output),
        expected: r.expected ? JSON.parse(r.expected) : null,
        metrics: JSON.parse(r.metrics)
      }))
    }

    res.json({ data: formatted })
  } catch (error) {
    next(error)
  }
})

// POST /api/test-runs - Create and execute test run
testRunsRouter.post('/', async (req, res, next) => {
  try {
    const validated = createTestRunSchema.parse(req.body) as CreateTestRunDto & { apiConfigId: string }

    // Get agent, task, and API config
    const agent = await prisma.agentTemplate.findUnique({ where: { id: validated.agentId } })
    const task = await prisma.task.findUnique({ where: { id: validated.taskId } })
    const apiConfig = await prisma.apiConfig.findUnique({ where: { id: validated.apiConfigId } })

    if (!agent) {
      return res.status(404).json({ error: { message: 'Agent not found' } })
    }
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } })
    }
    if (!apiConfig) {
      return res.status(404).json({ error: { message: 'API config not found' } })
    }

    // Check agent type matches task type
    if (agent.type !== task.type) {
      return res.status(400).json({
        error: { message: `Agent type (${agent.type}) does not match task type (${task.type})` }
      })
    }

    // Create test run
    const testRun = await prisma.testRun.create({
      data: {
        agentId: validated.agentId,
        taskId: validated.taskId,
        datasetId: validated.datasetId,
        status: 'running'
      }
    })

    // Execute tests in background
    executeTests(testRun.id, agent, task, apiConfig).catch(async (error) => {
      console.error('Test execution failed:', error)
      await prisma.testRun.update({
        where: { id: testRun.id },
        data: { status: 'failed', completedAt: new Date() }
      })
    })

    res.status(202).json({
      data: testRun,
      message: 'Test run started'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.errors
        }
      })
    }
    next(error)
  }
})

// Execute tests function
async function executeTests(
  testRunId: string,
  agent: Awaited<ReturnType<typeof prisma.agentTemplate.findUnique>>,
  task: Awaited<ReturnType<typeof prisma.task.findUnique>>,
  apiConfig: Awaited<ReturnType<typeof prisma.apiConfig.findUnique>>
) {
  if (!agent || !task || !apiConfig) return

  try {
    // Decrypt API key
    const decryptedApiKey = decrypt(apiConfig.apiKey)
    const decryptedApiConfig = {
      ...apiConfig,
      apiKey: decryptedApiKey
    }

    // Create LLM client
    const llmClient = new LLMClient(decryptedApiConfig)

    // Parse configurations
    const agentConfig = JSON.parse(agent.config)
    const testCases = JSON.parse(task.testCases)

    // Execute based on agent type
    if (agent.type === 'intent') {
      await executeIntentTests(testRunId, llmClient, agentConfig, testCases)
    } else if (agent.type === 'dialogue') {
      await executeDialogueTests(testRunId, llmClient, agentConfig, testCases)
    } else if (agent.type === 'memory') {
      await executeMemoryTests(testRunId, llmClient, agentConfig, testCases)
    }

    // Mark test run as completed
    await prisma.testRun.update({
      where: { id: testRunId },
      data: { status: 'completed', completedAt: new Date() }
    })
  } catch (error) {
    console.error('Test execution error:', error)
    throw error
  }
}

async function executeIntentTests(
  testRunId: string,
  llmClient: LLMClient,
  config: Record<string, unknown>,
  testCases: IntentTestCase[]
) {
  const recognizer = new IntentRecognizer(llmClient, config)

  for (const testCase of testCases) {
    const startTime = Date.now()

    try {
      const result = await recognizer.recognize(testCase.input)
      const latency = Date.now() - startTime

      const isCorrect = result.intent === testCase.expected?.intent

      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify(result),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({
            intent: result.intent,
            confidence: result.confidence,
            reasoning: result.reasoning
          }),
          isCorrect
        }
      })
    } catch (error) {
      const latency = Date.now() - startTime
      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({ error: true }),
          isCorrect: false
        }
      })
    }
  }
}

async function executeDialogueTests(
  testRunId: string,
  llmClient: LLMClient,
  config: Record<string, unknown>,
  testCases: DialogueTestCase[]
) {
  for (const testCase of testCases) {
    const manager = new DialogueManager(llmClient, config)
    const startTime = Date.now()

    try {
      let lastResponse = ''
      const turns = testCase.input.turns

      for (const turn of turns) {
        if (turn.role === 'user') {
          lastResponse = await manager.processMessage(turn.content)
        }
      }

      const latency = Date.now() - startTime
      const history = manager.getHistory()

      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify({ lastResponse, history }),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({
            turnCount: history.length,
            lastResponse
          }),
          isCorrect: null
        }
      })
    } catch (error) {
      const latency = Date.now() - startTime
      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({ error: true }),
          isCorrect: false
        }
      })
    }
  }
}

async function executeMemoryTests(
  testRunId: string,
  llmClient: LLMClient,
  config: Record<string, unknown>,
  testCases: MemoryTestCase[]
) {
  for (const testCase of testCases) {
    const manager = new MemoryManager(llmClient, config)
    const startTime = Date.now()

    try {
      // Process history to build memory
      for (const msg of testCase.input.history) {
        if (msg.role === 'user') {
          await manager.extractAndStore(msg.content)
        }
      }

      // Retrieve based on query
      const recalled = await manager.retrieve(testCase.input.query)
      const latency = Date.now() - startTime

      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify({ recalled }),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({
            recalledCount: recalled.length,
            memories: recalled
          }),
          isCorrect: null
        }
      })
    } catch (error) {
      const latency = Date.now() - startTime
      await prisma.testResult.create({
        data: {
          testRunId,
          input: JSON.stringify(testCase.input),
          output: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          expected: JSON.stringify(testCase.expected),
          latency,
          metrics: JSON.stringify({ error: true }),
          isCorrect: false
        }
      })
    }
  }
}

// GET /api/test-runs/:id/report - Generate evaluation report
testRunsRouter.get('/:id/report', async (req, res, next) => {
  try {
    const { id } = req.params

    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: {
        agent: true,
        results: true
      }
    })

    if (!testRun) {
      return res.status(404).json({
        error: { message: 'Test run not found' }
      })
    }

    if (testRun.status !== 'completed') {
      return res.status(400).json({
        error: { message: 'Test run not yet completed' }
      })
    }

    // Parse results
    const results = testRun.results.map(r => ({
      ...r,
      input: JSON.parse(r.input),
      output: JSON.parse(r.output),
      expected: r.expected ? JSON.parse(r.expected) : null,
      metrics: JSON.parse(r.metrics)
    }))

    // Generate report
    const report = generateReport(id, testRun.agent.type as 'intent' | 'dialogue' | 'memory', results)

    res.json({ data: report })
  } catch (error) {
    next(error)
  }
})
