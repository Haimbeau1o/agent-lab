"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Minus,
    Scale,
    TriangleAlert,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
    formatDateTime,
    formatScoreValue,
} from "@/lib/eval-format";
import type {
    ApiEnvelope,
    EvalComparison,
    EvalRunRecord,
} from "@/types/eval";

function toNumber(value: number | boolean | string): number | null {
    if (typeof value === "number") return value;
    return null;
}

function ComparePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [runs, setRuns] = useState<EvalRunRecord[]>([]);
    const [runId1, setRunId1] = useState("");
    const [runId2, setRunId2] = useState("");
    const [comparison, setComparison] = useState<EvalComparison | null>(null);
    const [loadingRuns, setLoadingRuns] = useState(true);
    const [loadingComparison, setLoadingComparison] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRuns = async () => {
            setLoadingRuns(true);
            setError(null);

            try {
                const runsResponse = await apiClient.getEvalRuns({ limit: 100 });
                const runData = Array.isArray((runsResponse as ApiEnvelope<unknown>).data)
                    ? (runsResponse as ApiEnvelope<EvalRunRecord[]>).data
                    : [];
                setRuns(runData);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "加载运行列表失败");
            } finally {
                setLoadingRuns(false);
            }
        };

        void loadRuns();
    }, []);

    useEffect(() => {
        const queryRunId1 = searchParams.get("runId1") ?? "";
        const queryRunId2 = searchParams.get("runId2") ?? "";
        setRunId1(queryRunId1);
        setRunId2(queryRunId2);
    }, [searchParams]);

    useEffect(() => {
        if (!runId1 || !runId2 || runId1 === runId2) {
            setComparison(null);
            return;
        }

        const loadComparison = async () => {
            setLoadingComparison(true);
            setError(null);

            try {
                const response = await apiClient.compareEvalRuns(runId1, runId2);
                const data = (response as ApiEnvelope<EvalComparison>).data;
                setComparison(data ?? null);
            } catch (loadError) {
                setComparison(null);
                setError(loadError instanceof Error ? loadError.message : "加载对比结果失败");
            } finally {
                setLoadingComparison(false);
            }
        };

        void loadComparison();
    }, [runId1, runId2]);

    const runOptions = useMemo(
        () => runs.map((run) => ({
            id: run.id,
            label: `${run.id} · ${run.taskId} · ${formatDateTime(run.startedAt)}`,
        })),
        [runs]
    );

    const handleCompare = () => {
        if (!runId1 || !runId2 || runId1 === runId2) return;

        const params = new URLSearchParams({ runId1, runId2 });
        router.push(`/results/compare?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            <div>
                <Link
                    href="/results"
                    className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回结果列表
                </Link>
                <h1 className="text-3xl font-bold text-white font-outfit">Compare Runs</h1>
                <p className="mt-2 text-slate-400">基于 /api/eval/compare 的真实分数对比</p>
            </div>

            <div className="glass-card p-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-end">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-300">运行 A</span>
                        <select
                            value={runId1}
                            onChange={(event) => setRunId1(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                        >
                            <option value="">请选择运行 A</option>
                            {runOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </label>

                    <div className="flex justify-center pb-2 text-slate-500">
                        <ArrowRight className="h-5 w-5" />
                    </div>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-300">运行 B</span>
                        <select
                            value={runId2}
                            onChange={(event) => setRunId2(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                        >
                            <option value="">请选择运行 B</option>
                            {runOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={handleCompare}
                        disabled={!runId1 || !runId2 || runId1 === runId2}
                        className={cn(
                            "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors",
                            !runId1 || !runId2 || runId1 === runId2
                                ? "cursor-not-allowed bg-white/5 text-slate-500"
                                : "bg-indigo-500 text-white hover:bg-indigo-400"
                        )}
                    >
                        <Scale className="h-4 w-4" />
                        开始对比
                    </button>
                </div>
            </div>

            {loadingRuns && (
                <div className="glass-card p-8 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    正在加载运行列表...
                </div>
            )}

            {!loadingRuns && error && (
                <div className="glass-card border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    <div className="flex items-center gap-2">
                        <TriangleAlert className="h-4 w-4" />
                        {error}
                    </div>
                </div>
            )}

            {!loadingRuns && loadingComparison && (
                <div className="glass-card p-8 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    正在计算对比结果...
                </div>
            )}

            {!loadingRuns && !loadingComparison && comparison && (
                <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">运行 A</p>
                            <p className="mt-2 text-sm font-semibold text-white">{comparison.run1.run.id}</p>
                            <p className="mt-1 text-xs text-slate-400">Task {comparison.run1.run.taskId}</p>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-wider text-slate-500">运行 B</p>
                            <p className="mt-2 text-sm font-semibold text-white">{comparison.run2.run.id}</p>
                            <p className="mt-1 text-xs text-slate-400">Task {comparison.run2.run.taskId}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">真实分数对比</h2>
                        {comparison.comparison.length === 0 ? (
                            <p className="text-sm text-slate-400">没有可对齐的 metric（通常是两次运行使用的 evaluator 不同）。</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10 text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-2">Metric</th>
                                            <th className="px-3 py-2">Run A</th>
                                            <th className="px-3 py-2">Run B</th>
                                            <th className="px-3 py-2">Diff</th>
                                            <th className="px-3 py-2">趋势</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {comparison.comparison.map((item) => {
                                            const numericDiff =
                                                item.diff
                                                ?? (() => {
                                                    const value1 = toNumber(item.value1);
                                                    const value2 = toNumber(item.value2);
                                                    return value1 !== null && value2 !== null ? value2 - value1 : undefined;
                                                })();

                                            return (
                                                <tr key={item.metric}>
                                                    <td className="px-3 py-3 text-slate-200">{item.metric}</td>
                                                    <td className="px-3 py-3 text-white">{formatScoreValue(item.value1)}</td>
                                                    <td className="px-3 py-3 text-white">{formatScoreValue(item.value2)}</td>
                                                    <td className="px-3 py-3 text-slate-300">
                                                        {numericDiff === undefined ? "-" : (numericDiff >= 0 ? `+${numericDiff.toFixed(4)}` : numericDiff.toFixed(4))}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {item.improved === undefined ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                                <Minus className="h-3.5 w-3.5" />
                                                                N/A
                                                            </span>
                                                        ) : item.improved ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Improved
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                                                <TriangleAlert className="h-3.5 w-3.5" />
                                                                Regressed
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


export default function ComparePage() {
    return (
        <Suspense
            fallback={
                <div className="glass-card p-8 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    正在初始化对比页面...
                </div>
            }
        >
            <ComparePageContent />
        </Suspense>
    );
}
