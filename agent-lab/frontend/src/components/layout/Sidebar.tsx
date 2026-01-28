"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Bot,
    ClipboardList,
    BarChart3,
    Settings,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "总览", href: "/", icon: LayoutDashboard },
    { name: "Agent 管理", href: "/agents", icon: Bot },
    { name: "测试任务", href: "/tasks", icon: ClipboardList },
    { name: "评测结果", href: "/results", icon: BarChart3 },
    { name: "系统设置", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-zinc-900 border-r border-zinc-800">
            <div className="flex h-16 items-center px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text">Agent Lab</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400"
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 p-4 border border-zinc-800">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">当前版本</p>
                    <p className="mt-1 text-sm text-zinc-300 font-medium">v0.1.0 Beta</p>
                </div>
            </div>
        </div>
    );
}
