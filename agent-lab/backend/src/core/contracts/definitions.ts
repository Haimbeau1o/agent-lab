export interface TaskDefinition {
  id: string
  name: string
  type: string
  successCriteria?: string[]
  errorTaxonomy?: string[]
}

export interface WorkflowDefinition {
  id: string
  name: string
  steps: Array<{ stepId: string; name: string }>
}

export interface MethodDefinition {
  id: string
  name: string
  strategy: string
  implementation: string
}
