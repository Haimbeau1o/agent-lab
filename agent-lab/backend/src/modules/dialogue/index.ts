/**
 * Dialogue Module - 对话管理模块
 *
 * 导出 Runner 和 Evaluator 实现
 */

export { DialogueLLMRunner } from './runners/dialogue-llm-runner.js'
export type {
  DialogueRunnerConfig,
  DialogueMessage,
  DialogueInput,
  DialogueOutput
} from './runners/dialogue-llm-runner.js'

export { DialogueMetricsEvaluator } from './evaluators/dialogue-metrics-evaluator.js'
export type { DialogueExpected } from './evaluators/dialogue-metrics-evaluator.js'
