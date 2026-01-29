/**
 * RunnerRegistry - Runner 注册中心
 *
 * 负责管理所有 Runner 的注册和检索
 * 确保 Core Engine 不依赖具体的 Runner 实现
 */

import type { Runner } from '../contracts/runner.js'

/**
 * RunnerRegistry - Runner 注册中心
 */
export class RunnerRegistry {
  private runners: Map<string, Runner>  // key: runner.id
  private runnersByType: Map<string, Runner[]>  // key: runner.type

  constructor() {
    this.runners = new Map()
    this.runnersByType = new Map()
  }

  /**
   * 注册 Runner
   * @param runner - Runner 实例
   * @throws Error 如果已存在相同 ID 的 Runner
   */
  register(runner: Runner): void {
    if (this.runners.has(runner.id)) {
      throw new Error(
        `Runner with ID "${runner.id}" is already registered.`
      )
    }

    this.runners.set(runner.id, runner)

    // 按类型索引
    const typeRunners = this.runnersByType.get(runner.type) ?? []
    typeRunners.push(runner)
    this.runnersByType.set(runner.type, typeRunners)
  }

  /**
   * 根据 ID 获取 Runner
   * @param id - Runner ID
   * @returns Runner 实例或 null
   */
  get(id: string): Runner | null {
    return this.runners.get(id) ?? null
  }

  /**
   * 根据 type 列出所有 Runner
   * @param type - Runner 类型
   * @returns Runner 数组
   */
  listByType(type: string): Runner[] {
    return this.runnersByType.get(type) ?? []
  }

  /**
   * 列出所有已注册的 Runner
   * @returns Runner 数组（不可变副本）
   */
  listAll(): Runner[] {
    return Array.from(this.runners.values())
  }

  /**
   * 检查是否已注册指定 ID 的 Runner
   * @param id - Runner ID
   * @returns 是否已注册
   */
  has(id: string): boolean {
    return this.runners.has(id)
  }

  /**
   * 获取已注册的 Runner 数量
   * @returns Runner 数量
   */
  size(): number {
    return this.runners.size
  }
}
