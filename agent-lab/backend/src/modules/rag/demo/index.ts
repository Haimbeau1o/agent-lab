import type { AtomicTask } from '../../../core/contracts/task.js'

export type RagDemoDocument = {
  id: string
  text: string
}

export type RagDemoDataset = {
  id: string
  name: string
  documents: RagDemoDocument[]
}

export type RagDemoConfig = {
  seed: number
  embedding: 'mock'
  dataset: {
    documents: RagDemoDocument[]
  }
  chunking: {
    strategy: 'doc'
  }
  retriever: {
    type: 'bm25'
    impl: 'wink'
    topK: number
  }
  generator: {
    type: 'template'
  }
}

export const RAG_DEMO_DATASET: RagDemoDataset = {
  id: 'rag.demo.v1',
  name: 'RAG Demo Dataset v1',
  documents: [
    {
      id: 'doc.alpha',
      text: 'Alpha is the first Greek letter and often marks the beginning of a sequence.'
    },
    {
      id: 'doc.beta',
      text: 'Beta follows Alpha and is commonly used to label second versions or test releases.'
    },
    {
      id: 'doc.gamma',
      text: 'Gamma is the third Greek letter and appears in mathematics and physics contexts.'
    }
  ]
}

export const RAG_DEMO_TASK: AtomicTask = {
  id: 'rag.demo.task.v1',
  name: 'RAG Demo Retrieval Task',
  type: 'rag',
  input: {
    query: 'What is Alpha?',
    retrieval: { topK: 1 }
  },
  metadata: {
    tags: ['demo', 'reproducible']
  }
}

export function buildRagDemoConfig(
  overrides: Partial<Omit<RagDemoConfig, 'dataset'>> & {
    dataset?: Partial<RagDemoConfig['dataset']>
  } = {}
): RagDemoConfig {
  return {
    seed: overrides.seed ?? 20260208,
    embedding: 'mock',
    dataset: {
      documents: overrides.dataset?.documents ?? RAG_DEMO_DATASET.documents
    },
    chunking: {
      strategy: 'doc'
    },
    retriever: {
      type: 'bm25',
      impl: 'wink',
      topK: overrides.retriever?.topK ?? 1
    },
    generator: {
      type: 'template'
    }
  }
}

export function buildRagDemoTask(overrides: Partial<AtomicTask> = {}): AtomicTask {
  return {
    ...RAG_DEMO_TASK,
    ...overrides,
    input: {
      ...((RAG_DEMO_TASK.input as Record<string, unknown>) ?? {}),
      ...((overrides.input as Record<string, unknown>) ?? {})
    },
    metadata: {
      ...((RAG_DEMO_TASK.metadata as Record<string, unknown>) ?? {}),
      ...((overrides.metadata as Record<string, unknown>) ?? {})
    }
  }
}
