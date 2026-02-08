import { describe, expect, it } from 'vitest'
import {
  MethodDefinitionRegistry,
  TaskDefinitionRegistry,
  WorkflowDefinitionRegistry
} from '../../core/registry/definition-registry.js'
import { registerRagDefinitions } from './definitions.js'

describe('registerRagDefinitions', () => {
  it('registers task/workflow/method definitions', () => {
    const taskRegistry = new TaskDefinitionRegistry()
    const workflowRegistry = new WorkflowDefinitionRegistry()
    const methodRegistry = new MethodDefinitionRegistry()

    registerRagDefinitions(taskRegistry, workflowRegistry, methodRegistry)

    expect(taskRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.qa', type: 'rag' })
    ])
    expect(workflowRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.retrieve-generate' })
    ])
    expect(methodRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.bm25.template' })
    ])
  })

  it('throws when registering duplicate definitions', () => {
    const taskRegistry = new TaskDefinitionRegistry()
    const workflowRegistry = new WorkflowDefinitionRegistry()
    const methodRegistry = new MethodDefinitionRegistry()

    registerRagDefinitions(taskRegistry, workflowRegistry, methodRegistry)

    expect(() => {
      registerRagDefinitions(taskRegistry, workflowRegistry, methodRegistry)
    }).toThrow('already registered')
  })
})
