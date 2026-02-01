/**
 * Registry - 注册中心
 *
 * 统一导出所有注册中心类
 */

export { RunnerRegistry } from './runner-registry.js'
export { EvaluatorRegistry } from './evaluator-registry.js'
export { ArtifactSchemaRegistry } from './artifact-schema-registry.js'
export { ReporterRegistry } from './reporter-registry.js'
export {
  TaskDefinitionRegistry,
  WorkflowDefinitionRegistry,
  MethodDefinitionRegistry
} from './definition-registry.js'
