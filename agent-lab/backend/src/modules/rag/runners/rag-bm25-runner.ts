import { randomUUID } from 'crypto'
import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record.js'
import type { ArtifactRecord } from '../../../core/contracts/artifact.js'
import bm25 from 'wink-bm25-text-search'
import winkTokenizer from 'wink-tokenizer'
import type { RagGeneratedOutput } from '../schemas.js'
import { sentenceChunk } from '../chunkers/sentence-chunker.js'
import { fixedChunk } from '../chunkers/fixed-chunker.js'
import { slidingChunk } from '../chunkers/sliding-chunker.js'

const tokenizer = winkTokenizer().tokenize

type RagInput = {
  query: string
  retrieval?: { topK?: number }
}

type RagRunnerConfig = {
  dataset: { documents: Array<{ id: string; text: string }> }
  chunking?: { strategy: 'doc' | 'sentence' | 'fixed' | 'sliding'; size?: number; overlap?: number }
  retriever: { type: 'bm25' | 'hybrid'; impl: 'wink'; topK?: number }
  generator: { type: 'template' | 'llm' }
  reranker?: { enabled: boolean; type: 'simple' | 'llm' }
}

type RagLLMGeneratorLike = {
  generate: (input: {
    query: string
    retrievedChunks: Array<{ chunkId: string; text: string; score: number; rank: number }>
  }) => Promise<RagGeneratedOutput>
}

type RagRerankerLike = {
  rerank: (chunks: Array<{ chunkId: string; text: string; score: number; rank: number }>) => Array<{
    chunkId: string
    text: string
    score: number
    rank: number
  }>
}

type RagHybridRetrieverLike = {
  search: (
    query: string,
    docs: Array<{ id: string; text: string }>,
    topK: number
  ) => Promise<Array<{ chunkId: string; score: number; rank: number }>>
}

export class RagBm25Runner implements Runner {
  id = 'rag.bm25'
  type = 'rag'
  version = '0.1.0'

  constructor(
    private readonly options: {
      llmGenerator?: RagLLMGeneratorLike
      reranker?: RagRerankerLike
      hybridRetriever?: RagHybridRetrieverLike
    } = {}
  ) {}

  async execute(task: AtomicTask, config: RagRunnerConfig): Promise<RunRecord> {
    const startedAt = new Date()
    const trace: TraceEvent[] = []
    const runId = randomUUID()

    const input = task.input as RagInput
    const query = input.query
    const topKOverride = input.retrieval?.topK

    const topKUsed = topKOverride ?? config.retriever.topK ?? 5

    const chunking = config.chunking ?? { strategy: 'doc' }
    const chunks = this.buildChunks(config.dataset.documents, chunking)

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'retrieve',
      event: 'start',
      data: { topK: topKUsed, strategy: config.retriever.type }
    })

    const retrievedChunks =
      config.retriever.type === 'hybrid'
        ? await this.retrieveHybrid(query, chunks, topKUsed)
        : this.retrieveBm25(query, chunks, topKUsed)

    const retrievedArtifact: ArtifactRecord = {
      schemaId: 'rag.retrieved',
      producedByStepId: 'retrieve',
      payload: {
        query,
        topKUsed,
        chunks: retrievedChunks
      }
    }

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'retrieve',
      event: 'end',
      data: {
        topK: topKUsed,
        numDocs: chunks.length,
        numResults: retrievedChunks.length
      }
    })

    let finalChunks = retrievedChunks
    let rerankedArtifact: ArtifactRecord | undefined

    if (config.reranker?.enabled) {
      if (!this.options.reranker) {
        throw new Error('Reranker not provided')
      }

      trace.push({
        timestamp: new Date(),
        level: 'info',
        step: 'rerank',
        event: 'start',
        data: { rerankerType: config.reranker.type }
      })

      finalChunks = this.options.reranker.rerank(retrievedChunks)

      rerankedArtifact = {
        schemaId: 'rag.reranked',
        producedByStepId: 'rerank',
        payload: {
          chunks: finalChunks
        }
      }

      trace.push({
        timestamp: new Date(),
        level: 'info',
        step: 'rerank',
        event: 'end',
        data: { rerankerType: config.reranker.type, numResults: finalChunks.length }
      })
    }

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'generate',
      event: 'start',
      data: { generatorType: config.generator.type }
    })

    let generatedOutput: RagGeneratedOutput

    if (config.generator.type === 'llm') {
      if (!this.options.llmGenerator) {
        throw new Error('LLM generator not provided')
      }
      generatedOutput = await this.options.llmGenerator.generate({
        query,
        retrievedChunks: finalChunks
      })
    } else {
      const sentences = finalChunks.map((chunk, index) => ({
        sentenceId: `s${index + 1}`,
        text: chunk.text,
        citations: [{ chunkId: chunk.chunkId }]
      }))

      const answer = sentences.map(sentence => sentence.text).join(' ')

      generatedOutput = {
        answer,
        sentences,
        generatorType: config.generator.type,
        sourcesUsed: Array.from(
          new Set(sentences.flatMap(sentence => sentence.citations?.map(c => c.chunkId) ?? []))
        )
      }
    }

    const generatedArtifact: ArtifactRecord = {
      schemaId: 'rag.generated',
      producedByStepId: 'generate',
      payload: generatedOutput
    }

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'generate',
      event: 'end',
      data: {
        generatorType: config.generator.type,
        sentenceCount: generatedOutput.sentences.length
      }
    })

    const completedAt = new Date()

    return {
      id: runId,
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: generatedOutput,
      metrics: {
        latency: completedAt.getTime() - startedAt.getTime()
      },
      trace,
      artifacts: [retrievedArtifact, rerankedArtifact, generatedArtifact].filter(
        Boolean
      ) as ArtifactRecord[],
      startedAt,
      completedAt,
      provenance: {
        runnerId: this.id,
        runnerVersion: this.version,
        config
      }
    }
  }

  private buildChunks(
    docs: Array<{ id: string; text: string }>,
    chunking: { strategy: 'doc' | 'sentence' | 'fixed' | 'sliding'; size?: number; overlap?: number }
  ): Array<{ id: string; text: string }> {
    if (chunking.strategy === 'doc') {
      return docs.map(doc => ({ id: doc.id, text: doc.text }))
    }

    const chunks: Array<{ id: string; text: string }> = []
    docs.forEach(doc => {
      const localChunks =
        chunking.strategy === 'sentence'
          ? sentenceChunk(doc.text)
          : chunking.strategy === 'fixed'
            ? fixedChunk(doc.text, chunking.size ?? 200)
            : slidingChunk(doc.text, chunking.size ?? 200, chunking.overlap ?? 50)

      localChunks.forEach((chunk, index) => {
        chunks.push({ id: `${doc.id}:${index + 1}`, text: chunk.text })
      })
    })

    return chunks
  }

  private retrieveBm25(
    query: string,
    docs: Array<{ id: string; text: string }>,
    topK: number
  ): Array<{ chunkId: string; text: string; score: number; rank: number }> {
    const engine = bm25()
    engine.defineConfig({ fldWeights: { text: 1 } })
    engine.definePrepTasks([tokenizer])

    docs.forEach((doc, idx) => {
      engine.addDoc({ text: doc.text }, idx)
    })
    engine.consolidate()

    const results = engine.search(query, topK)
    return results.map((result, index) => {
      const docIndex = result[0] as number
      const score = result[1] as number
      const doc = docs[docIndex]
      return {
        chunkId: doc.id,
        text: doc.text,
        score,
        rank: index + 1
      }
    })
  }

  private async retrieveHybrid(
    query: string,
    docs: Array<{ id: string; text: string }>,
    topK: number
  ): Promise<Array<{ chunkId: string; text: string; score: number; rank: number }>> {
    if (!this.options.hybridRetriever) {
      throw new Error('Hybrid retriever not provided')
    }

    const results = await this.options.hybridRetriever.search(query, docs, topK)
    const docMap = new Map(docs.map(doc => [doc.id, doc.text]))

    return results.map(result => ({
      chunkId: result.chunkId,
      text: docMap.get(result.chunkId) ?? '',
      score: result.score,
      rank: result.rank
    }))
  }
}
