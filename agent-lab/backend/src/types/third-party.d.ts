declare module 'wink-bm25-text-search' {
  type SearchResult = [number, number]

  interface Bm25Engine {
    defineConfig(config: { fldWeights: Record<string, number> }): void
    definePrepTasks(tasks: Array<(input: string) => unknown>): void
    addDoc(doc: Record<string, string>, id: number): void
    consolidate(): void
    search(query: string, limit: number): SearchResult[]
  }

  export default function bm25(): Bm25Engine
}

declare module 'wink-tokenizer' {
  interface Tokenizer {
    tokenize(input: string): unknown
  }

  export default function winkTokenizer(): Tokenizer
}
