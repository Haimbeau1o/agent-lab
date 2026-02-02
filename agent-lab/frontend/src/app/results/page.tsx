"use client";

import { useState } from "react";
import {
    BarChart3,
    Calendar,
    Bot,
    ClipboardList,
    CheckCircle2,
    XCircle,
    ChevronRight,
    TrendingUp,
    FileText,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const testRuns = [
    {
        id: "TR-001",
        agent: "电商意图识别专家",
        task: "电商核心意图测试集",
        date: "2024-01-20 14:30",
        status: "completed",
        accuracy: 0.982,
        latency: "1.1s"
    },
    {
        id: "TR-002",
        agent: "智能客服对话流",
        task: "机票预订多轮对话测试",
        date: "2024-01-18 09:15",
        status: "completed",
        accuracy: 0.855,
        latency: "2.4s"
    },
    {
        id: "TR-003",
        agent: "电商意图识别专家",
        task: "双十一压力测试",
        date: "2024-01-15 22:00",
        status: "failed",
        accuracy: 0.621,
        latency: "5.8s"
    },
];

export default function ResultsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white font-outfit">评测结果</h1>
                <p className="mt-2 text-slate-400">分析 Agent 的历史表现与深度报告</p>
            </div>

            {/* Latest Report Summary */}
            <div className="glass-card p-8 bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-indigo-500/30 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">
                            <TrendingUp className="h-4 w-4" /> 最新报告
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">电商意图识别专家 - 表现优异</h2>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                            在最近的评测中，该 Agent 展现了极高的准确率（98.2%）。特别是在“退款处理”和“物流查询”两个核心意图中，召回率达到了 100%。建议进一步优化“模糊咨询”场景下的置信度阈值。
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                                <span className="text-xs text-slate-500">准确率</span>
                                <span className="text-sm font-bold text-emerald-400">98.2%</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                                <span className="text-xs text-slate-500">平均延迟</span>
                                <span className="text-sm font-bold text-white">1.1s</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                                <span className="text-xs text-slate-500">Token 效率</span>
                                <span className="text-sm font-bold text-indigo-400">高</span>
                            </div>
                        </div>
                    </div>
                    <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-all whitespace-nowrap">
                        查看详细报告
                    </button>
                </div>
                <BarChart3 className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-white/5 -rotate-12" />
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white px-2">历史记录</h3>
                <div className="space-y-3">
                    {testRuns.map((run) => (
                        <a href="/results/${run.id}" className="glass-card group hover:bg-white/5 transition-all cursor-pointer">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                                    run.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    {run.status === "completed" ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Agent / 任务</p>
                                        <p className="text-sm font-bold text-white truncate">{run.agent}</p>
                                        <p className="text-xs text-slate-400 truncate">{run.task}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">运行时间</p>
                                        <div className="flex items-center gap-1.5 text-xs text-white">
                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                            {run.date}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">性能指标</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase">准确率</span>
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    run.accuracy > 0.9 ? "text-emerald-400" : run.accuracy > 0.7 ? "text-amber-400" : "text-red-400"
                                                )}>{(run.accuracy * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase">延迟</span>
                                                <span className="text-sm font-bold text-white">{run.latency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                            <FileText className="h-4 w-4" /> 报告 <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analytics Insight */}
            <div className="glass-card p-6 border-dashed border-white/10 bg-transparent">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                        <TrendingUp className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">趋势分析</h3>
                </div>
                <p className="text-sm text-slate-400">
                    在过去 30 天内，您的 Agent 平均准确率提升了 <span className="text-emerald-400 font-bold">15.4%</span>，这主要归功于对 Prompt 结构的优化。
                </p>
                <div className="mt-6 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 w-[75%]" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>上月: 62%</span>
                    <span>目标: 95%</span>
                </div>
            </div>
        </div>
    );
}
