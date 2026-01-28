"use client";

import { useState } from "react";
import {
    ClipboardList,
    Plus,
    Play,
    MoreVertical,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
    {
        id: "1",
        name: "电商核心意图测试集",
        type: "intent",
        casesCount: 50,
        lastRun: "2024-01-20",
        status: "completed",
        successRate: "98%"
    },
    {
        id: "2",
        name: "机票预订多轮对话测试",
        type: "dialogue",
        casesCount: 20,
        lastRun: "2024-01-18",
        status: "failed",
        successRate: "85%"
    },
    {
        id: "3",
        name: "用户画像记忆召回测试",
        type: "memory",
        casesCount: 15,
        lastRun: "从未运行",
        status: "pending",
        successRate: "-"
    },
];

export default function TasksPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-outfit">测试任务</h1>
                    <p className="mt-2 text-slate-400">设计测试用例并执行 Agent 评测</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all">
                    <Plus className="h-4 w-4" /> 新建任务
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">任务名称</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">类型</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">用例数</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">最后运行</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{task.name}</p>
                                                <p className="text-xs text-slate-500">ID: {task.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            task.type === "intent" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                                                task.type === "dialogue" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        )}>
                                            {task.type === "intent" ? "意图识别" :
                                                task.type === "dialogue" ? "多轮对话" : "记忆"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            <span className="text-sm text-white font-medium">{task.casesCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            {task.lastRun}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {task.status === "completed" ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" /> {task.successRate}
                                                </div>
                                            ) : task.status === "failed" ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                                                    <AlertCircle className="h-4 w-4" /> {task.successRate}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                    <Clock className="h-4 w-4" /> 待运行
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="rounded-lg bg-indigo-500 p-2 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all">
                                                <Play className="h-4 w-4 fill-current" />
                                            </button>
                                            <button className="rounded-lg bg-white/5 p-2 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/5 to-transparent">
                    <h3 className="text-lg font-semibold text-white mb-2">如何设计高质量用例？</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        一个好的测试集应该包含正向用例、边界用例以及对抗性用例。对于意图识别，建议每个意图至少准备 10 个不同的表达方式。
                    </p>
                    <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        查看最佳实践 <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
                <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/5 to-transparent">
                    <h3 className="text-lg font-semibold text-white mb-2">批量导入用例</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        您可以直接上传 JSON 或 CSV 文件来批量导入测试用例。我们支持标准的测试数据格式，方便您从其他平台迁移。
                    </p>
                    <button className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                        下载模板 <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
