/**
 * EvalEngine - 核心评测引擎
 *
 * 固定 Pipeline: Execute → Trace → Evaluate → Store
 * 不理解业务逻辑，只提供通用评测基础设施
 */

import type { AtomicTask, ScenarioTask } from '../contracts/task.js'
import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'
import type { Evaluator } from '../contracts/evaluator.js'
import type { RunnerRegistry } from '../registry/runner-registry.js'
import type { EvaluatorRegistry } from '../registry/evaluator-registry.js'
import type { ReporterRegistry } from '../registry/reporter-registry.js'
import type { Storage } from './storage.js'
import { ScenarioExecutor } from './scenario-executor.js'
import { createConfigHash, createRunFingerprint } from '../../lib/utils/config-hash.js'
import type { ReportRecord } from '../contracts/report.js'

/**
 * EvalEngine 配置
 */
export interface EvalEngineConfig {
  runnerRegistry: RunnerRegistry
  evaluatorRegistry: EvaluatorRegistry
  reporterRegistry?: ReporterRegistry
  storage: Storage
}

/**
 * 评测结果
 */
export interface EvalResult {
  run: RunRecord
  scores: ScoreRecord[]
}

/**
 * EvalEngine - 核心评测引擎
 */
export class EvalEngine {
  private readonly runnerRegistry: RunnerRegistry
  private readonly evaluatorRegistry: EvaluatorRegistry
  private readonly reporterRegistry?: ReporterRegistry
  private readonly storage: Storage
  private readonly scenarioExecutor: ScenarioExecutor

  constructor(config: EvalEngineConfig) {
    this.runnerRegistry = config.runnerRegistry
    this.evaluatorRegistry = config.evaluatorRegistry
    this.reporterRegistry = config.reporterRegistry
    this.storage = config.storage
    this.scenarioExecutor = new ScenarioExecutor()
  }

  /**
   * 执行 AtomicTask 评测
   *
   * 固定 Pipeline:
   * 1. Execute - 通过 Runner 执行任务
   * 2. Trace - Runner 自动记录 trace
   * 3. Evaluate - 通过 Evaluators 评估结果
   * 4. Store - 保存 RunRecord 和 ScoreRecords
   *
   * @param task - 原子任务
   * @param runnerId - Runner ID
   * @param config - Runner 配置
   * @param evaluatorIds - Evaluator IDs（可选，默认使用所有可用的）
   * @returns 评测结果
   */
  async evaluateTask(
    task: AtomicTask,
    runnerId: string,
    config: unknown,
    evaluatorIds?: string[]
  ): Promise<EvalResult> {
    // 1. Execute - 获取 Runner 并执行
    const runner = this.runnerRegistry.get(runnerId)
    if (!runner) {
      throw new Error(`Runner not found: ${runnerId}`)
    }

    // 验证 Runner 类型与 Task 类型匹配
    if (runner.type !== task.type) {
      throw new Error(
        `Runner type mismatch: runner.type="${runner.type}", task.type="${task.type}"`
      )
    }

    const runRecord = await runner.execute(task, config)

    const configSnapshot = { task, runnerId, config }
    runRecord.provenance.configSnapshot = configSnapshot
    runRecord.provenance.configHash = createConfigHash(configSnapshot)
    runRecord.provenance.runFingerprint = createRunFingerprint(configSnapshot)

    // 2. Trace - 已由 Runner 自动记录

    // 3. Evaluate - 获取 Evaluators 并评估
    const reports = await this.runReporters(runRecord)
    runRecord.reports = reports

    const evaluators = this.getEvaluators(evaluatorIds)
    const allScores: ScoreRecord[] = []

    for (const evaluator of evaluators) {
      try {
        const scores = await evaluator.evaluate(runRecord, task, reports)
        allScores.push(...scores)
      } catch (error) {
        // 评估失败不应该影响整个流程
        console.error(`Evaluator ${evaluator.id} failed:`, error)
      }
    }

    // 4. Store - 保存结果
    await this.storage.saveRun(runRecord)
    if (allScores.length > 0) {
      await this.storage.saveScores(allScores)
    }

    return {
      run: runRecord,
      scores: allScores
    }
  }

  /**
   * 批量执行多个任务
   *
   * @param tasks - 任务数组
   * @param runnerId - Runner ID
   * @param config - Runner 配置
   * @param evaluatorIds - Evaluator IDs
   * @returns 评测结果数组
   */
  async evaluateBatch(
    tasks: AtomicTask[],
    runnerId: string,
    config: unknown,
    evaluatorIds?: string[]
  ): Promise<EvalResult[]> {
    const results: EvalResult[] = []

    for (const task of tasks) {
      try {
        const result = await this.evaluateTask(task, runnerId, config, evaluatorIds)
        results.push(result)
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error)
        // 继续执行其他任务
      }
    }

    return results
  }

  /**
   * 执行 ScenarioTask 评测
   *
   * 固定 Pipeline:
   * 1. Execute - 通过 ScenarioExecutor 执行场景
   * 2. Trace - ScenarioExecutor 自动记录 trace
   * 3. Evaluate - 通过 Evaluators 评估结果（支持 step-level 和 global-level）
   * 4. Store - 保存 RunRecord 和 ScoreRecords
   *
   * @param scenario - 场景任务
   * @param config - 每个步骤的配置（stepId -> { runnerId, ...config }）
   * @param evaluatorIds - Evaluator IDs（可选）
   * @returns 评测结果
   */
  async evaluateScenario(
    scenario: ScenarioTask,
    config: Record<string, { runnerId: string; [key: string]: unknown }>,
    evaluatorIds?: string[]
  ): Promise<EvalResult> {
    // 1. Execute - 执行场景
    const runRecord = await this.scenarioExecutor.execute(
      scenario,
      this.runnerRegistry,
      config
    )

    // 2. Trace - 已由 ScenarioExecutor 自动记录

    // 3. Evaluate - 评估结果
    const reports = await this.runReporters(runRecord)
    runRecord.reports = reports

    const evaluators = this.getEvaluators(evaluatorIds)
    const allScores: ScoreRecord[] = []

    // 对整个场景进行评估（global-level）
    for (const evaluator of evaluators) {
      try {
        // 将 ScenarioTask 转换为 AtomicTask 格式用于评估
        // 评估器会根据 runRecord.taskType 判断是否为场景
        const pseudoTask: AtomicTask = {
          id: scenario.id,
          name: scenario.name,
          type: 'scenario', // 特殊类型
          input: scenario.metadata,
          metadata: {}
        }

        const scores = await evaluator.evaluate(runRecord, pseudoTask, reports)
        allScores.push(...scores)
      } catch (error) {
        // 评估失败不应该影响整个流程
        console.error(`Evaluator ${evaluator.id} failed:`, error)
      }
    }

    // 4. Store - 保存结果
    await this.storage.saveRun(runRecord)
    if (allScores.length > 0) {
      await this.storage.saveScores(allScores)
    }

    return {
      run: runRecord,
      scores: allScores
    }
  }

  /**
   * 获取运行记录
   */
  async getRun(runId: string): Promise<RunRecord | null> {
    return this.storage.getRun(runId)
  }

  /**
   * 获取评分记录
   */
  async getScores(runId: string): Promise<ScoreRecord[]> {
    return this.storage.getScores(runId)
  }

  /**
   * 获取运行详情（Run + Scores）
   */
  async getRunDetail(runId: string): Promise<EvalResult | null> {
    return this.getEvalResult(runId)
  }

  /**
   * 列出运行记录
   */
  async listRuns(options?: {
    taskId?: string
    taskType?: 'atomic' | 'scenario'
    status?: 'pending' | 'running' | 'completed' | 'failed'
    limit?: number
    offset?: number
  }): Promise<RunRecord[]> {
    return this.storage.listRuns(options)
  }

  /**
   * 获取完整的评测结果（包括评分）
   */
  async getEvalResult(runId: string): Promise<EvalResult | null> {
    const run = await this.storage.getRun(runId)
    if (!run) return null

    const scores = await this.storage.getScores(runId)

    return {
      run,
      scores
    }
  }

  /**
   * 对比两次运行
   *
   * @param runId1 - 第一次运行 ID
   * @param runId2 - 第二次运行 ID
   * @returns 对比结果
   */
  async compareRuns(runId1: string, runId2: string): Promise<{
    run1: EvalResult
    run2: EvalResult
    comparison: {
      metric: string
      value1: number | boolean | string
      value2: number | boolean | string
      diff?: number
      improved?: boolean
    }[]
  } | null> {
    const result1 = await this.getEvalResult(runId1)
    const result2 = await this.getEvalResult(runId2)

    if (!result1 || !result2) return null

    // 对比相同指标的评分
    const comparison: {
      metric: string
      value1: number | boolean | string
      value2: number | boolean | string
      diff?: number
      improved?: boolean
    }[] = []

    for (const score1 of result1.scores) {
      const score2 = result2.scores.find(s => s.metric === score1.metric)
      if (!score2) continue

      const item: any = {
        metric: score1.metric,
        value1: score1.value,
        value2: score2.value
      }

      // 如果是数值类型，计算差异
      if (typeof score1.value === 'number' && typeof score2.value === 'number') {
        item.diff = score2.value - score1.value

        // 判断是否改进（对于 latency 等指标，越小越好）
        if (score1.metric === 'latency' || score1.metric === 'cost') {
          item.improved = item.diff < 0
        } else {
          item.improved = item.diff > 0
        }
      }

      comparison.push(item)
    }

    return {
      run1: result1,
      run2: result2,
      comparison
    }
  }

  /**
   * 获取 Evaluators
   */
  private getEvaluators(evaluatorIds?: string[]): Evaluator[] {
    if (evaluatorIds && evaluatorIds.length > 0) {
      // 使用指定的 Evaluators
      return evaluatorIds
        .map(id => this.evaluatorRegistry.get(id))
        .filter((e): e is Evaluator => e !== null)
    } else {
      // 使用所有注册的 Evaluators
      return this.evaluatorRegistry.listAll()
    }
  }

  private async runReporters(run: RunRecord): Promise<ReportRecord[]> {
    if (!this.reporterRegistry) return []

    const reporters = this.reporterRegistry.list()
    if (reporters.length === 0) return []

    const reports: ReportRecord[] = []
    for (const reporter of reporters) {
      try {
        const result = await reporter.run(run.id, {
          runOutput: run.output,
          artifacts: run.artifacts,
          trace: run.trace
        })
        reports.push(...result)
      } catch (error) {
        console.error(`Reporter ${reporter.id} failed:`, error)
      }
    }

    return reports
  }
}
