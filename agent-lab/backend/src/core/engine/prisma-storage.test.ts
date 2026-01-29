/**
 * PrismaStorage 测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaStorage } from './prisma-storage.js'
import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'

describe('PrismaStorage', () => {
  let prisma: PrismaClient
  let storage: PrismaStorage

  beforeEach(async () => {
    // 使用测试数据库
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./test.db'
        }
      }
    })
    storage = new PrismaStorage(prisma)

    // 清空测试数据
    await prisma.scoreRecord.deleteMany()
    await prisma.runRecord.deleteMany()
  })

  afterEach(async () => {
    // 清理并断开连接
    await prisma.scoreRecord.deleteMany()
    await prisma.runRecord.deleteMany()
    await prisma.$disconnect()
  })

  describe('saveRun & getRun', () => {
    it('应该保存并获取运行记录', async () => {
      const run: RunRecord = {
        id: 'run-1',
        taskId: 'task-1',
        taskType: 'atomic',
        status: 'completed',
        output: { intent: 'greeting', confidence: 0.95 },
        metrics: {
          latency: 500,
          tokens: 100,
          cost: 0.001
        },
        trace: [
          {
            timestamp: new Date('2026-01-29T12:00:00Z'),
            level: 'info',
            event: 'start',
            data: { taskId: 'task-1' }
          }
        ],
        startedAt: new Date('2026-01-29T12:00:00Z'),
        completedAt: new Date('2026-01-29T12:00:01Z'),
        provenance: {
          runnerId: 'intent.llm',
          runnerVersion: '1.0.0',
          config: { temperature: 0.3 }
        }
      }

      await storage.saveRun(run)
      const retrieved = await storage.getRun('run-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('run-1')
      expect(retrieved?.taskId).toBe('task-1')
      expect(retrieved?.status).toBe('completed')
      expect(retrieved?.output).toEqual({ intent: 'greeting', confidence: 0.95 })
      expect(retrieved?.metrics.latency).toBe(500)
      expect(retrieved?.trace).toHaveLength(1)
      expect(retrieved?.provenance.runnerId).toBe('intent.llm')
    })

    it('应该保存带有错误的运行记录', async () => {
      const run: RunRecord = {
        id: 'run-2',
        taskId: 'task-2',
        taskType: 'atomic',
        status: 'failed',
        error: {
          message: 'LLM request failed',
          stack: 'Error: LLM request failed\n  at ...'
        },
        metrics: {
          latency: 100
        },
        trace: [],
        startedAt: new Date('2026-01-29T12:00:00Z'),
        provenance: {
          runnerId: 'intent.llm',
          runnerVersion: '1.0.0',
          config: {}
        }
      }

      await storage.saveRun(run)
      const retrieved = await storage.getRun('run-2')

      expect(retrieved).toBeDefined()
      expect(retrieved?.status).toBe('failed')
      expect(retrieved?.error?.message).toBe('LLM request failed')
      expect(retrieved?.error?.stack).toContain('Error: LLM request failed')
    })

    it('应该保存 Scenario 类型的运行记录', async () => {
      const run: RunRecord = {
        id: 'run-3',
        taskId: 'task-3',
        taskType: 'scenario',
        status: 'completed',
        output: { finalResult: 'success' },
        metrics: {
          latency: 1000
        },
        trace: [],
        steps: [
          {
            stepId: 'step-1',
            stepName: 'First Step',
            status: 'completed',
            latency: 500,
            output: { result: 'ok' }
          },
          {
            stepId: 'step-2',
            stepName: 'Second Step',
            status: 'completed',
            latency: 500,
            output: { result: 'ok' }
          }
        ],
        startedAt: new Date('2026-01-29T12:00:00Z'),
        completedAt: new Date('2026-01-29T12:00:01Z'),
        provenance: {
          runnerId: 'scenario.runner',
          runnerVersion: '1.0.0',
          config: {}
        }
      }

      await storage.saveRun(run)
      const retrieved = await storage.getRun('run-3')

      expect(retrieved).toBeDefined()
      expect(retrieved?.taskType).toBe('scenario')
      expect(retrieved?.steps).toHaveLength(2)
      expect(retrieved?.steps?.[0].stepId).toBe('step-1')
    })

    it('当运行记录不存在时应该返回 null', async () => {
      const retrieved = await storage.getRun('non-existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('listRuns', () => {
    beforeEach(async () => {
      // 创建测试数据
      const runs: RunRecord[] = [
        {
          id: 'run-1',
          taskId: 'task-1',
          taskType: 'atomic',
          status: 'completed',
          metrics: { latency: 100 },
          trace: [],
          startedAt: new Date('2026-01-29T12:00:00Z'),
          completedAt: new Date('2026-01-29T12:00:01Z'),
          provenance: { runnerId: 'intent.llm', runnerVersion: '1.0.0', config: {} }
        },
        {
          id: 'run-2',
          taskId: 'task-1',
          taskType: 'atomic',
          status: 'failed',
          metrics: { latency: 50 },
          trace: [],
          startedAt: new Date('2026-01-29T12:01:00Z'),
          provenance: { runnerId: 'intent.llm', runnerVersion: '1.0.0', config: {} }
        },
        {
          id: 'run-3',
          taskId: 'task-2',
          taskType: 'scenario',
          status: 'completed',
          metrics: { latency: 200 },
          trace: [],
          startedAt: new Date('2026-01-29T12:02:00Z'),
          completedAt: new Date('2026-01-29T12:02:01Z'),
          provenance: { runnerId: 'scenario.runner', runnerVersion: '1.0.0', config: {} }
        }
      ]

      for (const run of runs) {
        await storage.saveRun(run)
      }
    })

    it('应该列出所有运行记录', async () => {
      const runs = await storage.listRuns()
      expect(runs).toHaveLength(3)
      // 应该按时间倒序排列（最新的在前）
      expect(runs[0].id).toBe('run-3')
      expect(runs[1].id).toBe('run-2')
      expect(runs[2].id).toBe('run-1')
    })

    it('应该按 taskId 过滤', async () => {
      const runs = await storage.listRuns({ taskId: 'task-1' })
      expect(runs).toHaveLength(2)
      expect(runs.every(r => r.taskId === 'task-1')).toBe(true)
    })

    it('应该按 taskType 过滤', async () => {
      const runs = await storage.listRuns({ taskType: 'atomic' })
      expect(runs).toHaveLength(2)
      expect(runs.every(r => r.taskType === 'atomic')).toBe(true)
    })

    it('应该按 status 过滤', async () => {
      const runs = await storage.listRuns({ status: 'completed' })
      expect(runs).toHaveLength(2)
      expect(runs.every(r => r.status === 'completed')).toBe(true)
    })

    it('应该支持分页', async () => {
      const page1 = await storage.listRuns({ limit: 2, offset: 0 })
      expect(page1).toHaveLength(2)
      expect(page1[0].id).toBe('run-3')

      const page2 = await storage.listRuns({ limit: 2, offset: 2 })
      expect(page2).toHaveLength(1)
      expect(page2[0].id).toBe('run-1')
    })

    it('应该支持组合过滤', async () => {
      const runs = await storage.listRuns({
        taskId: 'task-1',
        status: 'completed'
      })
      expect(runs).toHaveLength(1)
      expect(runs[0].id).toBe('run-1')
    })
  })

  describe('saveScores & getScores', () => {
    beforeEach(async () => {
      // 先创建一个运行记录
      const run: RunRecord = {
        id: 'run-1',
        taskId: 'task-1',
        taskType: 'atomic',
        status: 'completed',
        metrics: { latency: 100 },
        trace: [],
        startedAt: new Date('2026-01-29T12:00:00Z'),
        completedAt: new Date('2026-01-29T12:00:01Z'),
        provenance: { runnerId: 'intent.llm', runnerVersion: '1.0.0', config: {} }
      }
      await storage.saveRun(run)
    })

    it('应该保存并获取评分记录', async () => {
      const scores: ScoreRecord[] = [
        {
          id: 'score-1',
          runId: 'run-1',
          metric: 'accuracy',
          value: 1,
          target: 'final',
          evidence: {
            explanation: 'Perfect match',
            alignment: { expected: 'greeting', actual: 'greeting' }
          },
          evaluatorId: 'intent.metrics',
          createdAt: new Date('2026-01-29T12:00:01Z')
        },
        {
          id: 'score-2',
          runId: 'run-1',
          metric: 'confidence',
          value: 0.95,
          target: 'final',
          evaluatorId: 'intent.metrics',
          createdAt: new Date('2026-01-29T12:00:01Z')
        }
      ]

      await storage.saveScores(scores)
      const retrieved = await storage.getScores('run-1')

      expect(retrieved).toHaveLength(2)
      expect(retrieved[0].metric).toBe('accuracy')
      expect(retrieved[0].value).toBe(1)
      expect(retrieved[0].evidence?.explanation).toBe('Perfect match')
      expect(retrieved[1].metric).toBe('confidence')
      expect(retrieved[1].value).toBe(0.95)
    })

    it('应该支持不同类型的值', async () => {
      const scores: ScoreRecord[] = [
        {
          id: 'score-1',
          runId: 'run-1',
          metric: 'accuracy',
          value: 0.95, // number
          target: 'final',
          evaluatorId: 'test',
          createdAt: new Date()
        },
        {
          id: 'score-2',
          runId: 'run-1',
          metric: 'passed',
          value: true, // boolean
          target: 'final',
          evaluatorId: 'test',
          createdAt: new Date()
        },
        {
          id: 'score-3',
          runId: 'run-1',
          metric: 'grade',
          value: 'A+', // string
          target: 'final',
          evaluatorId: 'test',
          createdAt: new Date()
        }
      ]

      await storage.saveScores(scores)
      const retrieved = await storage.getScores('run-1')

      expect(retrieved).toHaveLength(3)
      expect(typeof retrieved[0].value).toBe('number')
      expect(typeof retrieved[1].value).toBe('boolean')
      expect(typeof retrieved[2].value).toBe('string')
    })

    it('应该支持不同的 target 类型', async () => {
      const scores: ScoreRecord[] = [
        {
          id: 'score-1',
          runId: 'run-1',
          metric: 'accuracy',
          value: 1,
          target: 'final',
          evaluatorId: 'test',
          createdAt: new Date()
        },
        {
          id: 'score-2',
          runId: 'run-1',
          metric: 'latency',
          value: 100,
          target: 'global',
          evaluatorId: 'test',
          createdAt: new Date()
        },
        {
          id: 'score-3',
          runId: 'run-1',
          metric: 'step_accuracy',
          value: 0.9,
          target: 'step:step-1',
          evaluatorId: 'test',
          createdAt: new Date()
        }
      ]

      await storage.saveScores(scores)
      const retrieved = await storage.getScores('run-1')

      expect(retrieved).toHaveLength(3)
      expect(retrieved[0].target).toBe('final')
      expect(retrieved[1].target).toBe('global')
      expect(retrieved[2].target).toBe('step:step-1')
    })

    it('当没有评分记录时应该返回空数组', async () => {
      const scores = await storage.getScores('run-1')
      expect(scores).toEqual([])
    })

    it('应该保存空数组而不报错', async () => {
      await expect(storage.saveScores([])).resolves.not.toThrow()
    })
  })

  describe('deleteRun', () => {
    it('应该删除运行记录及其评分', async () => {
      // 创建运行记录
      const run: RunRecord = {
        id: 'run-1',
        taskId: 'task-1',
        taskType: 'atomic',
        status: 'completed',
        metrics: { latency: 100 },
        trace: [],
        startedAt: new Date(),
        completedAt: new Date(),
        provenance: { runnerId: 'test', runnerVersion: '1.0.0', config: {} }
      }
      await storage.saveRun(run)

      // 创建评分记录
      const scores: ScoreRecord[] = [
        {
          id: 'score-1',
          runId: 'run-1',
          metric: 'accuracy',
          value: 1,
          target: 'final',
          evaluatorId: 'test',
          createdAt: new Date()
        }
      ]
      await storage.saveScores(scores)

      // 验证数据存在
      expect(await storage.getRun('run-1')).toBeDefined()
      expect(await storage.getScores('run-1')).toHaveLength(1)

      // 删除运行记录
      await storage.deleteRun('run-1')

      // 验证数据已删除
      expect(await storage.getRun('run-1')).toBeNull()
      expect(await storage.getScores('run-1')).toEqual([])
    })

    it('删除不存在的运行记录应该抛出错误', async () => {
      await expect(storage.deleteRun('non-existent')).rejects.toThrow()
    })
  })
})
