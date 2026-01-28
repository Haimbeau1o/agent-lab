"use client";

import { useState } from "react";
import {
    Bot,
    MessageSquare,
    Brain,
    Search,
    Filter,
    Plus,
    ArrowRight,
    ShieldCheck,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const agentTypes = [
    { id: "all", name: "全部", icon: Bot },
    { id: "intent", name: "意图识别", icon: Search },
    { id: "dialogue", name: "多轮对话", icon: MessageSquare },
    { id: "memory", name: "长短期记忆", icon: Brain },
];

const agents = [
    {
        id: "1",
        name: "电商意图识别专家",
        type: "intent",
        description: "专门针对电商场景优化的意图识别 Agent，支持退款、查单、投诉等 20+ 种意图。",
        isBuiltin: true,
        accuracy: "98.2%"
    },
    {
        id: "2",
        name: "智能客服对话流",
        type: "dialogue",
        description: "具备多轮上下文理解能力的对话 Agent，能够引导用户完成复杂的业务流程。",
        isBuiltin: true,
        accuracy: "95.5%"
    },
    {
        id: "3",
        name: "个性化记忆助手",
        type: "memory",
        description: "能够从历史对话中提取并存储用户信息，并在后续对话中精准召回。",
        isBuiltin: false,
        accuracy: "92.8%"
    },
];

export default function AgentsPage() {
    const [activeType, setActiveType] = useState("all");

    const filteredAgents = activeType === "all"
        ? agents
        : agents.filter(a => a.type === activeType);

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-outfit">Agent 管理</h1>
                    <p className="mt-2 text-zinc-400">查看和管理您的智能体配置</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all">
                    <Plus className="h-4 w-4" /> 创建 Agent
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
                {agentTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setActiveType(type.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all",
                            activeType === type.id
                                ? "bg-indigo-500 text-white shadow-md"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        )}
                    >
                        <type.icon className="h-4 w-4" />
                        {type.name}
                    </button>
                ))}
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents.map((agent) => (
                    <div key={agent.id} className="glass-card group flex flex-col overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    agent.type === "intent" ? "bg-cyan-500/10 text-cyan-400" :
                                        agent.type === "dialogue" ? "bg-indigo-500/10 text-indigo-400" :
                                            "bg-emerald-500/10 text-emerald-400"
                                )}>
                                    {agent.type === "intent" ? <Search className="h-6 w-6" /> :
                                        agent.type === "dialogue" ? <MessageSquare className="h-6 w-6" /> :
                                            <Brain className="h-6 w-6" />}
                                </div>
                                {agent.isBuiltin && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                                        <ShieldCheck className="h-3 w-3" /> 内置
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{agent.name}</h3>
                            <p className="mt-2 text-sm text-zinc-400 leading-relaxed line-clamp-2">
                                {agent.description}
                            </p>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-medium text-zinc-500">平均准确率</div>
                                    <div className="text-sm font-bold text-white">{agent.accuracy}</div>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-400">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between group-hover:bg-indigo-500/5 transition-colors">
                            <button className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                                <Info className="h-3.5 w-3.5" /> 详情
                            </button>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                配置参数 <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New Agent Card */}
                <button className="glass-card border-dashed border-zinc-800 flex flex-col items-center justify-center p-8 hover:bg-zinc-900/50 hover:border-indigo-500/50 transition-all group">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-all">
                        <Plus className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-400 group-hover:text-white">创建自定义 Agent</p>
                    <p className="mt-1 text-xs text-zinc-600">基于您的 Prompt 和模型配置</p>
                </button>
            </div>
        </div>
    );
}
