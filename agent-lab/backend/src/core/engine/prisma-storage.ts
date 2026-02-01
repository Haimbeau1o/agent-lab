/**
 * PrismaStorage - Prisma 数据库存储实现
 *
 * 实现 Storage 接口，将 RunRecord 和 ScoreRecord 持久化到数据库
 */

import { PrismaClient } from '@prisma/client'
import type { Storage } from './storage.js'
import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'

/**
 * PrismaStorage - 数据库存储实现
 */
export class PrismaStorage implements Storage {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存运行记录
   */
  async saveRun(run: RunRecord): Promise<void> {
    await this.prisma.runRecord.create({
      data: {
        id: run.id,
        taskId: run.taskId,
        taskType: run.taskType,
        status: run.status,
        output: run.output ? JSON.stringify(run.output) : null,
        errorMessage: run.error?.message ?? null,
        errorStep: run.error?.step ?? null,
        errorStack: run.error?.stack ?? null,
        latency: run.metrics.latency,
        tokens: run.metrics.tokens ?? null,
        cost: run.metrics.cost ?? null,
        trace: JSON.stringify(run.trace),
        steps: run.steps ? JSON.stringify(run.steps) : null,
        startedAt: run.startedAt,
        completedAt: run.completedAt ?? null,
        runnerId: run.provenance.runnerId,
        runnerVersion: run.provenance.runnerVersion,
        config: JSON.stringify(run.provenance.config),
        configHash: run.provenance.configHash ?? null,
        runFingerprint: run.provenance.runFingerprint ?? null,
        configSnapshot: run.provenance.configSnapshot
          ? JSON.stringify(run.provenance.configSnapshot)
          : null,
        overrides: run.provenance.overrides ? JSON.stringify(run.provenance.overrides) : null,
        artifacts: run.artifacts ? JSON.stringify(run.artifacts) : null,
        reports: run.reports ? JSON.stringify(run.reports) : null
      }
    })
  }

  /**
   * 获取运行记录
   */
  async getRun(runId: string): Promise<RunRecord | null> {
    const record = await this.prisma.runRecord.findUnique({
      where: { id: runId }
    })

    if (!record) {
      return null
    }

    return this.mapToRunRecord(record)
  }

  /**
   * 列出所有运行记录
   */
  async listRuns(options?: {
    taskId?: string
    taskType?: 'atomic' | 'scenario'
    status?: 'pending' | 'running' | 'completed' | 'failed'
    limit?: number
    offset?: number
  }): Promise<RunRecord[]> {
    const records = await this.prisma.runRecord.findMany({
      where: {
        taskId: options?.taskId,
        taskType: options?.taskType,
        status: options?.status
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: options?.limit,
      skip: options?.offset
    })

    return records.map(record => this.mapToRunRecord(record))
  }

  /**
   * 保存评分记录
   */
  async saveScores(scores: ScoreRecord[]): Promise<void> {
    if (scores.length === 0) return

    await this.prisma.scoreRecord.createMany({
      data: scores.map(score => ({
        id: score.id,
        runId: score.runId,
        metric: score.metric,
        valueNumber: typeof score.value === 'number' ? score.value : null,
        valueBoolean: typeof score.value === 'boolean' ? score.value : null,
        valueString: typeof score.value === 'string' ? score.value : null,
        target: score.target,
        explanation: score.evidence?.explanation ?? null,
        snippets: score.evidence?.snippets ? JSON.stringify(score.evidence.snippets) : null,
        alignment: score.evidence?.alignment ? JSON.stringify(score.evidence.alignment) : null,
        evaluatorId: score.evaluatorId,
        createdAt: score.createdAt
      }))
    })
  }

  /**
   * 获取运行的所有评分
   */
  async getScores(runId: string): Promise<ScoreRecord[]> {
    const records = await this.prisma.scoreRecord.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' }
    })

    return records.map(record => this.mapToScoreRecord(record))
  }

  /**
   * 删除运行记录（包括关联的评分）
   */
  async deleteRun(runId: string): Promise<void> {
    // Prisma 会自动级联删除关联的 ScoreRecord（因为 schema 中定义了 onDelete: Cascade）
    await this.prisma.runRecord.delete({
      where: { id: runId }
    })
  }

  /**
   * 将数据库记录映射为 RunRecord
   */
  private mapToRunRecord(record: any): RunRecord {
    const typedRecord: {
      id: string
      taskId: string
      taskType: string
      status: string
      output: string | null
      errorMessage: string | null
      errorStep: string | null
      errorStack: string | null
      latency: number
      tokens: number | null
      cost: number | null
      trace: string
      steps: string | null
      startedAt: Date
      completedAt: Date | null
      runnerId: string
      runnerVersion: string
      config: string
      configHash: string | null
      runFingerprint: string | null
      configSnapshot: string | null
      overrides: string | null
      artifacts: string | null
      reports: string | null
    } = record

    return {
      id: typedRecord.id,
      taskId: typedRecord.taskId,
      taskType: typedRecord.taskType as 'atomic' | 'scenario',
      status: typedRecord.status as 'pending' | 'running' | 'completed' | 'failed',
      output: typedRecord.output ? JSON.parse(typedRecord.output) : undefined,
      error: typedRecord.errorMessage
        ? {
            message: typedRecord.errorMessage,
            step: typedRecord.errorStep ?? undefined,
            stack: typedRecord.errorStack ?? undefined
          }
        : undefined,
      metrics: {
        latency: typedRecord.latency,
        tokens: typedRecord.tokens ?? undefined,
        cost: typedRecord.cost ?? undefined
      },
      trace: JSON.parse(typedRecord.trace),
      steps: typedRecord.steps ? JSON.parse(typedRecord.steps) : undefined,
      startedAt: typedRecord.startedAt,
      completedAt: typedRecord.completedAt ?? undefined,
      provenance: {
        runnerId: typedRecord.runnerId,
        runnerVersion: typedRecord.runnerVersion,
        config: JSON.parse(typedRecord.config),
        configHash: typedRecord.configHash ?? undefined,
        runFingerprint: typedRecord.runFingerprint ?? undefined,
        configSnapshot: typedRecord.configSnapshot
          ? JSON.parse(typedRecord.configSnapshot)
          : undefined,
        overrides: typedRecord.overrides ? JSON.parse(typedRecord.overrides) : undefined
      },
      artifacts: typedRecord.artifacts ? JSON.parse(typedRecord.artifacts) : undefined,
      reports: typedRecord.reports ? JSON.parse(typedRecord.reports) : undefined
    }
  }

  /**
   * 将数据库记录映射为 ScoreRecord
   */
  private mapToScoreRecord(record: any): ScoreRecord {
    const typedRecord: {
      id: string
      runId: string
      metric: string
      valueNumber: number | null
      valueBoolean: boolean | null
      valueString: string | null
      target: string
      explanation: string | null
      snippets: string | null
      alignment: string | null
      evaluatorId: string
      createdAt: Date
    } = record

    // 确定 value 的类型
    let value: number | boolean | string
    if (typedRecord.valueNumber !== null) {
      value = typedRecord.valueNumber
    } else if (typedRecord.valueBoolean !== null) {
      value = typedRecord.valueBoolean
    } else if (typedRecord.valueString !== null) {
      value = typedRecord.valueString
    } else {
      throw new Error(`ScoreRecord ${typedRecord.id} has no value`)
    }

    return {
      id: typedRecord.id,
      runId: typedRecord.runId,
      metric: typedRecord.metric,
      value,
      target: typedRecord.target as 'final' | 'global' | `step:${string}`,
      evidence:
        typedRecord.explanation || typedRecord.snippets || typedRecord.alignment
          ? {
              explanation: typedRecord.explanation ?? undefined,
              snippets: typedRecord.snippets ? JSON.parse(typedRecord.snippets) : undefined,
              alignment: typedRecord.alignment ? JSON.parse(typedRecord.alignment) : undefined
            }
          : undefined,
      evaluatorId: typedRecord.evaluatorId,
      createdAt: typedRecord.createdAt
    }
  }
}
