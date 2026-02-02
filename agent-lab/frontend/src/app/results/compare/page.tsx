import { MethodCompareTable } from '../../../components/rag/MethodCompareTable'

async function fetchRuns() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/eval/runs`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data?.data ?? []
}

async function fetchScores(runId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/eval/runs/${runId}/scores`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data?.data ?? []
}

export default async function ComparePage() {
  const runs = await fetchRuns()
  const summaries = await Promise.all(
    runs.map(async (run: any) => ({
      id: run.id,
      runnerId: run.provenance?.runnerId ?? 'unknown',
      scores: await fetchScores(run.id)
    }))
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Method Compare</h1>
        <p className="text-sm text-slate-400">Compare runs by method</p>
      </div>

      <MethodCompareTable runs={summaries} />
    </div>
  )
}
