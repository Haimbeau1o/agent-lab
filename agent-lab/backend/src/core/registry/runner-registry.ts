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
  private runners: Map<string, Runner>

  constructor() {
    this.runners = new Map()
  }

  /**
   * 注册 Runner
   * @param runner - Runner 实例
   * @throws Error 如果已存在相同 type 的 Runner
   */
  register(runner: Runner): void {
    if (this.runners.has(runner.type)) {
      throw new Error(
        `Runner with type "${runner.type}" is already registered. ` +
        `Existing: ${this.runners.get(runner.type)?.id}, ` +
        `New: ${runner.id}`
      )
    }

    this.runners.set(runner.type, runner)
  }

  /**
   * 根据 type 获取 Runner
   * @param type - Runner 类型
   * @returns Runner 实例
   * @throws Error 如果找不到对应的 Runner
   */
  get(type: string): Runner {
    const runner = this.runners.get(type)

    if (!runner) {
      throw new Error(
        `No runner registered for type "${type}". ` +
        `Available types: ${Array.from(this.runners.keys()).join(', ')}`
      )
    }

    return runner
  }

  /**
   * 列出所有已注册的 Runner
   * @returns Runner 数组（不可变副本）
   */
  list(): Runner[] {
    return Array.from(this.runners.values())
  }

  /**
   * 检查是否已注册指定 type 的 Runner
   * @param type - Runner 类型
   * @returns 是否已注册
   */
  has(type: string): boolean {
    return this.runners.has(type)
  }

  /**
   * 获取已注册的 Runner 数量
   * @returns Runner 数量
   */
  size(): number {
    return this.runners.size
  }
}
