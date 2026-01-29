/**
 * EvaluatorRegistry - Evaluator 注册中心
 *
 * 负责管理所有 Evaluator 的注册和检索
 * 确保 Core Engine 不依赖具体的 Evaluator 实现
 */

import type { Evaluator } from '../contracts/evaluator.js'

/**
 * EvaluatorRegistry - Evaluator 注册中心
 */
export class EvaluatorRegistry {
  private evaluators: Map<string, Evaluator>

  constructor() {
    this.evaluators = new Map()
  }

  /**
   * 注册 Evaluator
   * @param evaluator - Evaluator 实例
   * @throws Error 如果已存在相同 id 的 Evaluator
   */
  register(evaluator: Evaluator): void {
    if (this.evaluators.has(evaluator.id)) {
      throw new Error(
        `Evaluator with id "${evaluator.id}" is already registered.`
      )
    }

    this.evaluators.set(evaluator.id, evaluator)
  }

  /**
   * 根据 id 获取 Evaluator
   * @param id - Evaluator ID
   * @returns Evaluator 实例
   * @throws Error 如果找不到对应的 Evaluator
   */
  get(id: string): Evaluator {
    const evaluator = this.evaluators.get(id)

    if (!evaluator) {
      throw new Error(
        `No evaluator registered with id "${id}". ` +
        `Available ids: ${Array.from(this.evaluators.keys()).join(', ')}`
      )
    }

    return evaluator
  }

  /**
   * 列出所有已注册的 Evaluator
   * @returns Evaluator 数组（不可变副本）
   */
  list(): Evaluator[] {
    return Array.from(this.evaluators.values())
  }

  /**
   * 列出所有已注册的 Evaluator (别名)
   * @returns Evaluator 数组（不可变副本）
   */
  listAll(): Evaluator[] {
    return this.list()
  }

  /**
   * 根据指标查找 Evaluators
   * @param metric - 指标名称
   * @returns 支持该指标的 Evaluator 数组
   */
  findByMetric(metric: string): Evaluator[] {
    return Array.from(this.evaluators.values()).filter(
      e => e.metrics.includes(metric)
    )
  }

  /**
   * 检查是否已注册指定 id 的 Evaluator
   * @param id - Evaluator ID
   * @returns 是否已注册
   */
  has(id: string): boolean {
    return this.evaluators.has(id)
  }

  /**
   * 获取已注册的 Evaluator 数量
   * @returns Evaluator 数量
   */
  size(): number {
    return this.evaluators.size
  }
}
