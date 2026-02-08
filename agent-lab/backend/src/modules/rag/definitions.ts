import type {
  MethodDefinition,
  TaskDefinition,
  WorkflowDefinition
} from '../../core/contracts/definitions.js'

export const ragTaskDefinitions: TaskDefinition[] = [
  {
    id: 'rag.qa',
    name: 'RAG Question Answering',
    type: 'rag',
    successCriteria: ['grounded_answer', 'citation_precision']
  }
]

export const ragWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: 'rag.retrieve-generate',
    name: 'Retrieve and Generate',
    steps: [
      { stepId: 'retrieve', name: 'Retrieve relevant chunks' },
      { stepId: 'generate', name: 'Generate grounded answer' }
    ]
  }
]

export const ragMethodDefinitions: MethodDefinition[] = [
  {
    id: 'rag.bm25.template',
    name: 'BM25 Template Generator',
    strategy: 'bm25',
    implementation: 'rag.bm25'
  }
]

type Registry<T> = {
  register: (definition: T) => void
}

export const registerRagDefinitions = (
  taskRegistry: Registry<TaskDefinition>,
  workflowRegistry: Registry<WorkflowDefinition>,
  methodRegistry: Registry<MethodDefinition>
): void => {
  for (const definition of ragTaskDefinitions) {
    taskRegistry.register(definition)
  }

  for (const definition of ragWorkflowDefinitions) {
    workflowRegistry.register(definition)
  }

  for (const definition of ragMethodDefinitions) {
    methodRegistry.register(definition)
  }
}
