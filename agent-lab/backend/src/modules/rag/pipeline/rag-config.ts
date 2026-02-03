export type RagPipelineConfig = {
  chunking: {
    strategy: 'doc' | 'sentence' | 'fixed' | 'sliding'
  }
  retriever: {
    type: 'bm25' | 'vector' | 'hybrid'
  }
  reranker?: {
    enabled: boolean
    type: 'simple' | 'llm'
  }
  generator: {
    type: 'template' | 'llm'
  }
}

const defaultConfig: RagPipelineConfig = {
  chunking: { strategy: 'doc' },
  retriever: { type: 'bm25' },
  reranker: { enabled: false, type: 'simple' },
  generator: { type: 'template' }
}

export const buildRagConfig = (partial: Partial<RagPipelineConfig>): RagPipelineConfig => {
  return {
    chunking: { ...defaultConfig.chunking, ...partial.chunking },
    retriever: { ...defaultConfig.retriever, ...partial.retriever },
    reranker: partial.reranker
      ? { ...defaultConfig.reranker, ...partial.reranker }
      : defaultConfig.reranker,
    generator: { ...defaultConfig.generator, ...partial.generator }
  }
}
