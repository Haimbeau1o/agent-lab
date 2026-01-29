/**
 * Storage Interface - 存储适配器接口
 *
 * 负责持久化 RunRecord 和 ScoreRecord
 */

import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'

/**
 * Storage - 存储接口
 */
export interface Storage {
  /**
   * 保存运行记录
   */
  saveRun(run: RunRecord): Promise<void>

  /**
   * 获取运行记录
   */
  getRun(runId: string): Promise<RunRecord | null>

  /**
   * 列出所有运行记录
   */
  listRuns(options?: {
    taskId?: string
    taskType?: 'atomic' | 'scenario'
    status?: 'pending' | 'running' | 'completed' | 'failed'
    limit?: number
    offset?: number
  }): Promise<RunRecord[]>

  /**
   * 保存评分记录
   */
  saveScores(scores: ScoreRecord[]): Promise<void>

  /**
   * 获取运行的所有评分
   */
  getScores(runId: string): Promise<ScoreRecord[]>

  /**
   * 删除运行记录（包括关联的评分）
   */
  deleteRun(runId: string): Promise<void>
}

/**
 * InMemoryStorage - 内存存储实现
 * 用于开发和测试
 */
export class InMemoryStorage implements Storage {
  private runs: Map<string, RunRecord> = new Map()
  private scores: Map<string, ScoreRecord[]> = new Map()

  async saveRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, run)
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.runs.get(runId) ?? null
  }

  async listRuns(options?: {
    taskId?: string
    taskType?: 'atomic' | 'scenario'
    status?: 'pending' | 'running' | 'completed' | 'failed'
    limit?: number
    offset?: number
  }): Promise<RunRecord[]> {
    let runs = Array.from(this.runs.values())

    // 过滤
    if (options?.taskId) {
      runs = runs.filter(r => r.taskId === options.taskId)
    }
    if (options?.taskType) {
      runs = runs.filter(r => r.taskType === options.taskType)
    }
    if (options?.status) {
      runs = runs.filter(r => r.status === options.status)
    }

    // 排序（最新的在前）
    runs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

    // 分页
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? runs.length

    return runs.slice(offset, offset + limit)
  }

  async saveScores(scores: ScoreRecord[]): Promise<void> {
    if (scores.length === 0) return

    const runId = scores[0].runId
    const existing = this.scores.get(runId) ?? []
    this.scores.set(runId, [...existing, ...scores])
  }

  async getScores(runId: string): Promise<ScoreRecord[]> {
    return this.scores.get(runId) ?? []
  }

  async deleteRun(runId: string): Promise<void> {
    this.runs.delete(runId)
    this.scores.delete(runId)
  }

  /**
   * 清空所有数据（仅用于测试）
   */
  clear(): void {
    this.runs.clear()
    this.scores.clear()
  }

  /**
   * 获取统计信息（仅用于调试）
   */
  getStats(): { runs: number; scores: number } {
    return {
      runs: this.runs.size,
      scores: Array.from(this.scores.values()).reduce((sum, arr) => sum + arr.length, 0)
    }
  }
}
