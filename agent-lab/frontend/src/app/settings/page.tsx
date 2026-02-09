"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    CheckCircle2,
    ExternalLink,
    Key,
    Globe,
    Server
} from "lucide-react";

type Provider = "openai" | "anthropic" | "custom";

interface Config {
    id: string;
    name: string;
    provider: Provider;
    model: string;
    isDefault: boolean;
}

export default function SettingsPage() {
    const [configs] = useState<Config[]>([
        { id: "1", name: "GPT-4o Production", provider: "openai", model: "gpt-4o", isDefault: true },
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white font-outfit">系统设置</h1>
                <p className="mt-2 text-zinc-400">管理您的 LLM API 配置和平台偏好</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white">API 配置</h2>
                            <button className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-all">
                                <Plus className="h-4 w-4" /> 添加配置
                            </button>
                        </div>
                        <div className="divide-y divide-zinc-800">
                            {configs.map((config) => (
                                <div key={config.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-indigo-400">
                                                {config.provider === "openai" ? "O" : "A"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white">{config.name}</h3>
                                                    {config.isDefault && (
                                                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
                                                            默认
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-zinc-500 mt-0.5">{config.model} • {config.provider}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all">
                                                <ExternalLink className="h-4 w-4" />
                                            </button>
                                            <button className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
                                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> 状态
                                            </div>
                                            <p className="text-sm font-semibold text-white">已连接</p>
                                        </div>
                                        <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
                                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
                                                <Clock className="h-3.5 w-3.5 text-indigo-400" /> 平均延迟
                                            </div>
                                            <p className="text-sm font-semibold text-white">450ms</p>
                                        </div>
                                        <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
                                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
                                                <Zap className="h-3 w-3 text-amber-400" /> Token 消耗
                                            </div>
                                            <p className="text-sm font-semibold text-white">1.2M</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Config Form (Mockup) */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">新增 API 配置</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">配置名称</label>
                                    <input
                                        type="text"
                                        placeholder="例如: GPT-4o 测试环境"
                                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">服务商</label>
                                    <select className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none">
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Base URL (可选)</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">
                                    保存配置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">安全说明</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-1 rounded-full bg-indigo-500/10 p-1">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                                </div>
                                <p className="text-sm text-zinc-400">您的 API Key 将使用 AES-256-CBC 加密存储在后端数据库中。</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-1 rounded-full bg-indigo-500/10 p-1">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                                </div>
                                <p className="text-sm text-zinc-400">前端仅在配置时传递原始 Key，后续请求均由后端处理。</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-1 rounded-full bg-indigo-500/10 p-1">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                                </div>
                                <p className="text-sm text-zinc-400">建议为评测平台创建具有额度限制的专用 API Key。</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                        <h2 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
                            <Server className="h-5 w-5" /> 后端状态
                        </h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">API 服务</span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> 运行中
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">数据库</span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> 已连接
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">评测引擎</span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> 就绪
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icons for stats
function Clock({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function Zap({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}
