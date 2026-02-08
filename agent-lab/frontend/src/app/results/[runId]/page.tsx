"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Database,
    FileCode2,
    Fingerprint,
    Loader2,
    Scale,
    Workflow,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
    formatDateTime,
    formatLatency,
    formatScoreValue,
    getRunnerLabel,
} from "@/lib/eval-format";
import type {
    ApiEnvelope,
    EvalResult,
    EvalRunRecord,
    EvalRunnerSummary,
} from "@/types/eval";

function safeJson(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "<unserializable>";
    }
}

function extractFingerprint(run: EvalRunRecord): string | null {
    const raw = run.provenance.fingerprint ?? run.provenance.config?.fingerprint;
    return typeof raw === "string" ? raw : null;
}

function statusClass(status: EvalRunRecord["status"]): string {
    if (status === "completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "running" || status === "pending") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
}

export default function RunDetailPage() {
    const params = useParams<{ runId: string | string[] }>();
    const rawRunId = params?.runId;
    const runId = Array.isArray(rawRunId) ? rawRunId[0] : rawRunId;

    const [result, setResult] = useState<EvalResult | null>(null);
    const [runnerMap, setRunnerMap] = useState<Record<string, EvalRunnerSummary>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!runId) return;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [resultResponse, runnersResponse] = await Promise.all([
                    apiClient.getEvalRunResult(runId),
                    apiClient.getEvalRunners(),
                ]);

                const evalResult = (resultResponse as ApiEnvelope<EvalResult>).data;
                const runnerData = Array.isArray((runnersResponse as ApiEnvelope<unknown>).data)
                    ? (runnersResponse as ApiEnvelope<EvalRunnerSummary[]>).data
                    : [];

                setResult(evalResult ?? null);
                setRunnerMap(Object.fromEntries(runnerData.map((runner) => [runner.id, runner])));
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "加载运行详情失败");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [runId]);

    const run = result?.run;
    const scoreMetrics = (result?.scores ?? []).map((score) => ({
        ...score,
        valueText: formatScoreValue(score.value),
    }));

    if (!runId) {
        return (
            <div className="glass-card border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                无效的运行 ID。
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Link
                        href="/results"
                        className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        返回结果列表
                    </Link>
                    <h1 className="text-3xl font-bold text-white font-outfit">Run Detail</h1>
                    <p className="mt-2 text-slate-400">运行 ID: {runId}</p>
                </div>
                <Link
                    href={`/results/compare?runId1=${encodeURIComponent(runId)}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
                >
                    <Scale className="h-4 w-4" />
                    与另一运行对比
                </Link>
            </div>

            {loading && (
                <div className="glass-card p-10 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    正在加载真实 RunRecord / Scores...
                </div>
            )}

            {!loading && error && (
                <div className="glass-card border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    加载失败：{error}
                </div>
            )}

            {!loading && !error && run && (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">状态</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold">
                                <span className={cn("rounded-full border px-3 py-1", statusClass(run.status))}>
                                    {run.status}
                                </span>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Latency</p>
                            <p className="mt-3 text-2xl font-semibold text-white">{formatLatency(run.metrics.latency)}</p>
                            <p className="mt-1 text-xs text-slate-500">Tokens {run.metrics.tokens ?? "-"}</p>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Runner</p>
                            <p className="mt-3 text-sm font-semibold text-white">{getRunnerLabel(run, runnerMap)}</p>
                            <p className="mt-1 text-xs text-slate-500">version {run.provenance.runnerVersion}</p>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Task</p>
                            <p className="mt-3 text-sm font-semibold text-white">{run.taskId}</p>
                            <p className="mt-1 text-xs text-slate-500">type {run.taskType}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <Workflow className="h-5 w-5 text-indigo-300" />
                            <h2 className="text-lg font-semibold text-white">评分指标（Scores）</h2>
                        </div>

                        {scoreMetrics.length === 0 ? (
                            <p className="text-sm text-slate-400">该运行暂无评分记录。</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10 text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-2">Metric</th>
                                            <th className="px-3 py-2">Value</th>
                                            <th className="px-3 py-2">Target</th>
                                            <th className="px-3 py-2">Evaluator</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {scoreMetrics.map((score) => (
                                            <tr key={score.id}>
                                                <td className="px-3 py-3 text-slate-200">{score.metric}</td>
                                                <td className="px-3 py-3 font-semibold text-white">{score.valueText}</td>
                                                <td className="px-3 py-3 text-slate-300">{score.target}</td>
                                                <td className="px-3 py-3 text-slate-400">{score.evaluatorId}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="glass-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <FileCode2 className="h-5 w-5 text-indigo-300" />
                                <h2 className="text-lg font-semibold text-white">Report / Output</h2>
                            </div>
                            <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-zinc-950 p-4 text-xs leading-relaxed text-slate-200">
                                {safeJson(run.output ?? { message: "No output" })}
                            </pre>
                        </div>

                        <div className="glass-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Fingerprint className="h-5 w-5 text-indigo-300" />
                                <h2 className="text-lg font-semibold text-white">Provenance</h2>
                            </div>

                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Run Time</p>
                                    <p className="mt-1">Started: {formatDateTime(run.startedAt)}</p>
                                    <p className="mt-1">Completed: {formatDateTime(run.completedAt)}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Fingerprint</p>
                                    <p className="mt-1 break-all font-mono text-xs text-slate-200">
                                        {extractFingerprint(run) ?? "(B 合并前可能为空)"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Config Snapshot</p>
                                    <pre className="mt-2 max-h-40 overflow-auto text-xs text-slate-300">
                                        {safeJson(run.provenance.configSnapshot ?? run.provenance.config)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Database className="h-5 w-5 text-indigo-300" />
                            <h2 className="text-lg font-semibold text-white">Trace</h2>
                        </div>

                        {run.trace.length === 0 ? (
                            <p className="text-sm text-slate-400">暂无 trace 事件。</p>
                        ) : (
                            <div className="space-y-3">
                                {run.trace.map((event, index) => (
                                    <div
                                        key={`${event.timestamp}-${event.event}-${index}`}
                                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase">{event.level}</span>
                                            <span>{formatDateTime(event.timestamp)}</span>
                                            {event.step && <span>step: {event.step}</span>}
                                        </div>
                                        <p className="mt-2 text-sm font-medium text-white">{event.event}</p>
                                        {event.data !== undefined && (
                                            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-slate-300">
                                                {safeJson(event.data)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {run.error && (
                        <div className="glass-card border border-red-500/20 bg-red-500/5 p-6">
                            <div className="flex items-center gap-2 text-red-300">
                                <AlertCircle className="h-4 w-4" />
                                运行错误
                            </div>
                            <p className="mt-2 text-sm text-red-200">{run.error.message}</p>
                            {run.error.step && <p className="mt-1 text-xs text-red-200">Step: {run.error.step}</p>}
                            {run.error.stack && (
                                <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-red-500/20 bg-black/30 p-3 text-xs text-red-100">
                                    {run.error.stack}
                                </pre>
                            )}
                        </div>
                    )}
                </>
            )}

            {!loading && !error && !run && (
                <div className="glass-card border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    未找到该运行记录。
                </div>
            )}
        </div>
    );
}
