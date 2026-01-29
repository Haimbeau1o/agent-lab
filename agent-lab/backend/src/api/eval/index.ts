/**
 * Eval API - 新的评测 API 端点
 *
 * 使用 Core Engine 执行评测
 */

import express from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { EvalEngine, PrismaStorage } from '../../core/engine/index.js'
import { RunnerRegistry } from '../../core/registry/runner-registry.js'
import { EvaluatorRegistry } from '../../core/registry/evaluator-registry.js'
import { LLMClient } from '../../lib/llm/client.js'
import { logger } from '../../lib/utils/logger.js'
import type { AtomicTask, ScenarioTask } from '../../core/contracts/task.js'
import {
  IntentLLMRunner,
  IntentMetricsEvaluator,
  DialogueLLMRunner,
  DialogueMetricsEvaluator,
  MemoryLLMRunner,
  MemoryMetricsEvaluator
} from '../../modules/index.js'

const router = express.Router()

// 初始化 Prisma Client
const prisma = new PrismaClient()

// 初始化 Engine
const storage = new PrismaStorage(prisma)
const runnerRegistry = new RunnerRegistry()
const evaluatorRegistry = new EvaluatorRegistry()

// 初始化 LLM Client
const llmClient = new LLMClient({
  id: 'default',
  name: 'Default OpenAI Config',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: 'https://api.openai.com/v1',
  modelName: process.env.LLM_MODEL || 'gpt-4',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// 注册所有 Runners
runnerRegistry.register(new IntentLLMRunner(llmClient))
runnerRegistry.register(new DialogueLLMRunner(llmClient))
runnerRegistry.register(new MemoryLLMRunner(llmClient))

// 注册所有 Evaluators
evaluatorRegistry.register(new IntentMetricsEvaluator())
evaluatorRegistry.register(new DialogueMetricsEvaluator())
evaluatorRegistry.register(new MemoryMetricsEvaluator())

// 创建 Engine
const engine = new EvalEngine({
  runnerRegistry,
  evaluatorRegistry,
  storage
})

// 验证 schema
const runTaskSchema = z.object({
  task: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    input: z.unknown(),
    expected: z.unknown().optional(),
    context: z.record(z.unknown()).optional(),
    metadata: z.object({
      tags: z.array(z.string()).optional(),
      priority: z.number().optional(),
      timeout: z.number().optional()
    }).default({})
  }),
  runnerId: z.string(),
  config: z.unknown(),
  evaluatorIds: z.array(z.string()).optional()
})

/**
 * POST /api/eval/run
 * 执行单个任务评测
 */
router.post('/run', async (req, res) => {
  try {
    // 验证输入
    const validated = runTaskSchema.parse(req.body)

    // 执行评测
    const result = await engine.evaluateTask(
      validated.task as AtomicTask,
      validated.runnerId,
      validated.config,
      validated.evaluatorIds
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Eval run failed', { error })
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/eval/batch
 * 批量执行任务评测
 */
router.post('/batch', async (req, res) => {
  try {
    const schema = z.object({
      tasks: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        input: z.unknown(),
        expected: z.unknown().optional(),
        context: z.record(z.unknown()).optional(),
        metadata: z.object({
          tags: z.array(z.string()).optional(),
          priority: z.number().optional(),
          timeout: z.number().optional()
        }).default({})
      })),
      runnerId: z.string(),
      config: z.unknown(),
      evaluatorIds: z.array(z.string()).optional()
    })

    const validated = schema.parse(req.body)

    // 批量执行
    const results = await engine.evaluateBatch(
      validated.tasks as AtomicTask[],
      validated.runnerId,
      validated.config,
      validated.evaluatorIds
    )

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    logger.error('Batch eval failed', { error })
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ScenarioTask 验证 schema
const scenarioTaskSchema = z.object({
  scenario: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      input: z.unknown(),
      expected: z.unknown().optional(),
      context: z.record(z.unknown()).optional(),
      metadata: z.object({
        tags: z.array(z.string()).optional(),
        priority: z.number().optional(),
        timeout: z.number().optional()
      }).default({})
    })),
    input_map: z.record(z.array(z.object({
      from: z.string(),
      to: z.string()
    }))),
    metadata: z.record(z.unknown()).default({})
  }),
  runnerId: z.string(),
  config: z.unknown(),
  evaluatorIds: z.array(z.string()).optional()
})

/**
 * POST /api/eval/scenario
 * 执行场景任务评测
 */
router.post('/scenario', async (req, res) => {
  try {
    // 验证输入
    const validated = scenarioTaskSchema.parse(req.body)

    // 构建每个步骤的配置
    const stepConfigs: Record<string, { runnerId: string; [key: string]: unknown }> = {}

    // 为每个步骤使用相同的 runnerId 和 config
    for (const step of validated.scenario.steps) {
      stepConfigs[step.id] = {
        runnerId: validated.runnerId,
        ...validated.config as Record<string, unknown>
      }
    }

    // 执行场景评测
    const result = await engine.evaluateScenario(
      validated.scenario as ScenarioTask,
      stepConfigs,
      validated.evaluatorIds
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Scenario eval failed', { error })
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/eval/runs/:id
 * 获取运行记录
 */
router.get('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params

    const run = await engine.getRun(id)

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run not found'
      })
    }

    res.json({
      success: true,
      data: run
    })
  } catch (error) {
    logger.error('Get run failed', { error })
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/eval/runs/:id/scores
 * 获取运行的评分记录
 */
router.get('/runs/:id/scores', async (req, res) => {
  try {
    const { id } = req.params

    const scores = await engine.getScores(id)

    res.json({
      success: true,
      data: scores
    })
  } catch (error) {
    logger.error('Get scores failed', { error })
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/eval/runs/:id/result
 * 获取完整的评测结果（包括评分）
 */
router.get('/runs/:id/result', async (req, res) => {
  try {
    const { id } = req.params

    const result = await engine.getEvalResult(id)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Run not found'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Get eval result failed', { error })
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/eval/runs
 * 列出运行记录
 */
router.get('/runs', async (req, res) => {
  try {
    const schema = z.object({
      taskId: z.string().optional(),
      taskType: z.enum(['atomic', 'scenario']).optional(),
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
      limit: z.coerce.number().int().positive().optional(),
      offset: z.coerce.number().int().nonnegative().optional()
    })

    const validated = schema.parse(req.query)

    const runs = await engine.listRuns(validated)

    res.json({
      success: true,
      data: runs,
      meta: {
        total: runs.length,
        limit: validated.limit,
        offset: validated.offset
      }
    })
  } catch (error) {
    logger.error('List runs failed', { error })
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/eval/compare
 * 对比两次运行
 */
router.post('/compare', async (req, res) => {
  try {
    const schema = z.object({
      runId1: z.string(),
      runId2: z.string()
    })

    const validated = schema.parse(req.body)

    const comparison = await engine.compareRuns(
      validated.runId1,
      validated.runId2
    )

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'One or both runs not found'
      })
    }

    res.json({
      success: true,
      data: comparison
    })
  } catch (error) {
    logger.error('Compare runs failed', { error })
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/eval/runners
 * 列出所有注册的 Runners
 */
router.get('/runners', (_req, res) => {
  const runners = runnerRegistry.listAll()

  res.json({
    success: true,
    data: runners.map(r => ({
      id: r.id,
      type: r.type,
      version: r.version
    }))
  })
})

/**
 * GET /api/eval/evaluators
 * 列出所有注册的 Evaluators
 */
router.get('/evaluators', (_req, res) => {
  const evaluators = evaluatorRegistry.listAll()

  res.json({
    success: true,
    data: evaluators.map(e => ({
      id: e.id,
      metrics: e.metrics
    }))
  })
})

export default router
