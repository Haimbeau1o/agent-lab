'use client';

import {
  Bot,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Settings
} from "lucide-react";
import { TaskRunner } from "../components/TaskRunner";
import { TraceViewer } from "../components/TraceViewer";
import { TestResults } from "../components/TestResults";
import { useTestRun } from "../hooks/useTestRun";

const stats = [
  { name: "已配置 Agent", value: "12", icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "测试任务", value: "48", icon: ClipboardList, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { name: "平均准确率", value: "94.2%", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "平均延迟", value: "1.2s", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
];

export default function Dashboard() {
  const { testRun, report, status, startTest } = useTestRun();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-outfit">欢迎回来, Agent 开发者</h1>
          <p className="mt-2 text-indigo-100 max-w-xl">
            这是您的 Agent 能力评测中心。在这里，您可以管理您的智能体、设计复杂的测试用例，并获取深度的性能分析报告。
          </p>
          <div className="mt-6 flex gap-4">
            <button className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition-all hover:bg-indigo-50">
              开始新测试
            </button>
            <button className="rounded-xl bg-indigo-500/20 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm border border-white/10 transition-all hover:bg-indigo-500/30">
              查看文档
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        <Zap className="absolute right-12 top-1/2 -translate-y-1/2 h-32 w-32 text-white/5 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6 transition-all">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Task Runner & Results */}
        <div className="lg:col-span-2 space-y-8">
          <TaskRunner onRun={startTest} isRunning={status === 'running'} />

          {(status !== 'idle') && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">测试结果</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                    status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-red-500/10 text-red-400'
                  }`}>
                  {status === 'running' ? '运行中' : status === 'completed' ? '已完成' : '失败'}
                </span>
              </div>

              <TestResults report={report} />
              <TraceViewer testRun={testRun} />
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Recent */}
        <div className="space-y-8">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">快速操作</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between rounded-xl bg-zinc-900 p-4 text-sm font-medium text-white border border-zinc-800 hover:bg-zinc-800 transition-all">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  创建新 Agent
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </button>
              <button className="w-full flex items-center justify-between rounded-xl bg-zinc-900 p-4 text-sm font-medium text-white border border-zinc-800 hover:bg-zinc-800 transition-all">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-cyan-400" />
                  设计测试集
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </button>
              <button className="w-full flex items-center justify-between rounded-xl bg-zinc-900 p-4 text-sm font-medium text-white border border-zinc-800 hover:bg-zinc-800 transition-all">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-amber-400" />
                  API 配置
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
