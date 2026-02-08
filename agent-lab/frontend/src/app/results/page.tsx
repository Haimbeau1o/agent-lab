"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    Loader2,
    Scale,
    SquareArrowOutUpRight,
    Workflow,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
    formatDateTime,
    formatLatency,
    getRunnerLabel,
} from "@/lib/eval-format";
import type {
    ApiEnvelope,
    EvalRunRecord,
    EvalRunnerSummary,
} from "@/types/eval";

function statusMeta(status: EvalRunRecord["status"]) {
    if (status === "completed") {
        return {
            label: "已完成",
            icon: CheckCircle2,
            className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        };
    }

    if (status === "running" || status === "pending") {
        return {
            label: status === "running" ? "运行中" : "排队中",
            icon: Loader2,
            className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        };
    }

    return {
        label: "失败",
        icon: AlertTriangle,
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
    };
}

export default function ResultsPage() {
    const [runs, setRuns] = useState<EvalRunRecord[]>([]);
    const [runnerMap, setRunnerMap] = useState<Record<string, EvalRunnerSummary>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [runsResponse, runnersResponse] = await Promise.all([
                    apiClient.getEvalRuns({ limit: 50 }),
                    apiClient.getEvalRunners(),
                ]);

                const runData = Array.isArray((runsResponse as ApiEnvelope<unknown>).data)
                    ? (runsResponse as ApiEnvelope<EvalRunRecord[]>).data
                    : [];

                const runnerData = Array.isArray((runnersResponse as ApiEnvelope<unknown>).data)
                    ? (runnersResponse as ApiEnvelope<EvalRunnerSummary[]>).data
                    : [];

                setRuns(runData);
                setRunnerMap(Object.fromEntries(runnerData.map((runner) => [runner.id, runner])));
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "加载评测结果失败");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const latestCompletedRun = useMemo(
        () => runs.find((run) => run.status === "completed") ?? runs[0] ?? null,
        [runs]
    );

    const compareHref = selectedRunIds.length === 2
        ? `/results/compare?runId1=${encodeURIComponent(selectedRunIds[0])}&runId2=${encodeURIComponent(selectedRunIds[1])}`
        : "/results/compare";

    const toggleCompare = (runId: string) => {
        setSelectedRunIds((current) => {
            if (current.includes(runId)) {
                return current.filter((id) => id !== runId);
            }

            if (current.length >= 2) {
                return [current[1], runId];
            }

            return [...current, runId];
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-outfit">评测结果</h1>
                    <p className="mt-2 text-slate-400">基于 RunRecord / Scores 的真实结果流</p>
                </div>
                <Link
                    href={compareHref}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors",
                        selectedRunIds.length === 2
                            ? "bg-indigo-500 text-white hover:bg-indigo-400"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Scale className="h-4 w-4" />
                    对比所选运行
                </Link>
            </div>

            {loading && (
                <div className="glass-card p-10 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    正在加载真实评测数据...
                </div>
            )}

            {!loading && error && (
                <div className="glass-card border border-red-500/20 bg-red-500/5 p-6">
                    <p className="text-sm text-red-300">加载失败：{error}</p>
                </div>
            )}

            {!loading && !error && latestCompletedRun && (
                <div className="glass-card p-8 bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-indigo-500/30 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                                <Workflow className="h-4 w-4" />
                                最新运行
                            </div>
                            <h2 className="text-xl font-bold text-white md:text-2xl">{latestCompletedRun.id}</h2>
                            <p className="mt-2 text-sm text-slate-300">
                                Task: {latestCompletedRun.taskId} · Runner: {getRunnerLabel(latestCompletedRun, runnerMap)}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-200">
                                <span className="rounded-lg bg-white/10 px-3 py-1">
                                    Latency {formatLatency(latestCompletedRun.metrics.latency)}
                                </span>
                                <span className="rounded-lg bg-white/10 px-3 py-1">
                                    Tokens {latestCompletedRun.metrics.tokens ?? "-"}
                                </span>
                                <span className="rounded-lg bg-white/10 px-3 py-1">
                                    Started {formatDateTime(latestCompletedRun.startedAt)}
                                </span>
                            </div>
                        </div>
                        <Link
                            href={`/results/${latestCompletedRun.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
                        >
                            查看 Run Detail
                            <SquareArrowOutUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            )}

            {!loading && !error && runs.length === 0 && (
                <div className="glass-card p-10 text-center text-slate-400">
                    暂无运行记录，请先通过 /api/eval/run 或 /api/eval/scenario 触发一次运行。
                </div>
            )}

            {!loading && !error && runs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-white">历史记录</h3>
                        <p className="text-xs text-slate-500">已选择 {selectedRunIds.length}/2 个用于 Compare</p>
                    </div>

                    <div className="space-y-3">
                        {runs.map((run) => {
                            const meta = statusMeta(run.status);
                            const StatusIcon = meta.icon;
                            const isSelected = selectedRunIds.includes(run.id);

                            return (
                                <div key={run.id} className="glass-card group transition-all hover:bg-white/5">
                                    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                                        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">{run.id}</p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Task {run.taskId} · {getRunnerLabel(run, runnerMap)}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1", meta.className)}>
                                                    <StatusIcon className={cn("h-3.5 w-3.5", run.status === "running" ? "animate-spin" : "")} />
                                                    {meta.label}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-slate-300">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    {formatLatency(run.metrics.latency)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-slate-300">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDateTime(run.startedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleCompare(run.id)}
                                                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent"
                                                />
                                                参与对比
                                            </label>
                                            <Link
                                                href={`/results/${run.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                详情
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
