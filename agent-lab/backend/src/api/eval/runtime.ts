import { PrismaClient } from '@prisma/client'
import { EvalEngine, PrismaStorage } from '../../core/engine/index.js'
import type { Storage } from '../../core/engine/storage.js'
import { RunnerRegistry } from '../../core/registry/runner-registry.js'
import { EvaluatorRegistry } from '../../core/registry/evaluator-registry.js'
import { ReporterRegistry } from '../../core/registry/reporter-registry.js'
import {
  MethodDefinitionRegistry,
  TaskDefinitionRegistry,
  WorkflowDefinitionRegistry
} from '../../core/registry/definition-registry.js'
import { LLMClient } from '../../lib/llm/client.js'
import {
  IntentLLMRunner,
  IntentMetricsEvaluator,
  DialogueLLMRunner,
  DialogueMetricsEvaluator,
  MemoryLLMRunner,
  MemoryMetricsEvaluator,
  RagBm25Runner,
  RagMetricsEvaluator,
  RagEvidenceReporter,
  registerRagDefinitions
} from '../../modules/index.js'

export interface EvalRuntime {
  engine: EvalEngine
  runnerRegistry: RunnerRegistry
  evaluatorRegistry: EvaluatorRegistry
  reporterRegistry: ReporterRegistry
  taskDefinitionRegistry: TaskDefinitionRegistry
  workflowDefinitionRegistry: WorkflowDefinitionRegistry
  methodDefinitionRegistry: MethodDefinitionRegistry
}

export interface CreateEvalRuntimeOptions {
  prisma?: PrismaClient
  storage?: Storage
  llmClient?: LLMClient
}

const createDefaultLLMClient = (): LLMClient => {
  return new LLMClient({
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
}

export const createEvalRuntime = (options: CreateEvalRuntimeOptions = {}): EvalRuntime => {
  const runnerRegistry = new RunnerRegistry()
  const evaluatorRegistry = new EvaluatorRegistry()
  const reporterRegistry = new ReporterRegistry()
  const taskDefinitionRegistry = new TaskDefinitionRegistry()
  const workflowDefinitionRegistry = new WorkflowDefinitionRegistry()
  const methodDefinitionRegistry = new MethodDefinitionRegistry()

  const llmClient = options.llmClient ?? createDefaultLLMClient()

  runnerRegistry.register(new IntentLLMRunner(llmClient))
  runnerRegistry.register(new DialogueLLMRunner(llmClient))
  runnerRegistry.register(new MemoryLLMRunner(llmClient))
  runnerRegistry.register(new RagBm25Runner())

  evaluatorRegistry.register(new IntentMetricsEvaluator())
  evaluatorRegistry.register(new DialogueMetricsEvaluator())
  evaluatorRegistry.register(new MemoryMetricsEvaluator())
  evaluatorRegistry.register(new RagMetricsEvaluator())

  reporterRegistry.register(new RagEvidenceReporter())

  registerRagDefinitions(
    taskDefinitionRegistry,
    workflowDefinitionRegistry,
    methodDefinitionRegistry
  )

  const storage =
    options.storage ?? new PrismaStorage(options.prisma ?? new PrismaClient())

  const engine = new EvalEngine({
    runnerRegistry,
    evaluatorRegistry,
    reporterRegistry,
    storage
  })

  return {
    engine,
    runnerRegistry,
    evaluatorRegistry,
    reporterRegistry,
    taskDefinitionRegistry,
    workflowDefinitionRegistry,
    methodDefinitionRegistry
  }
}
