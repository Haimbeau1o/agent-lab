import { RunEvidencePanel } from '../../../components/rag/RunEvidencePanel'

async function fetchRunDetail(runId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/eval/runs/${runId}/detail`, {
    cache: 'no-store'
  })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export default async function RunDetailPage({ params }: { params: { runId: string } }) {
  const detail = await fetchRunDetail(params.runId)
  const payload = detail?.data?.run?.reports?.[0]?.payload ?? null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Run Detail</h1>
        <p className="text-sm text-slate-400">Run ID: {params.runId}</p>
      </div>

      <RunEvidencePanel payload={payload} />
    </div>
  )
}
