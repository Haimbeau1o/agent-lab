# v0.4 轻量化清理执行记录

## 背景

Issue E 要求先列出非主路径内容，再在不影响主路径功能的前提下进行清理。

## 清理清单（已执行）

| 路径 | 删除理由 | 依赖评估 |
| --- | --- | --- |
| `agent-lab/backend/src/core/engine/debug-scenario.ts` | 临时调试脚本，未被任何生产代码或测试引用。 | 删除后不影响 `EvalEngine` 与 API 主链路。 |
| `docs/plans/intent-module-implementation-plan.md` | 旧 Intent 模块专项计划，已不属于当前 v0.4 主路径。 | 仅文档资产，不影响运行时。 |
| `docs/analysis/gap-analysis.md` | 早期差距分析，内容已被后续实现覆盖。 | 仅历史分析文档，不影响代码。 |
| `docs/analysis/phase2-completion-report.md` | 阶段性完成报告（历史状态）。 | 仅历史文档，不影响主路径。 |
| `docs/analysis/phase2-usage-guide.md` | 阶段性使用说明（历史状态）。 | 仅历史文档，不影响主路径。 |
| `docs/analysis/phase3-api-guide.md` | 旧 API 迁移阶段文档，已过时。 | 仅历史文档，不影响主路径。 |
| `docs/analysis/phase3-completion-report.md` | 阶段性完成报告（历史状态）。 | 仅历史文档，不影响主路径。 |
| `docs/analysis/phase4-completion-report.md` | 阶段性完成报告（历史状态）。 | 仅历史文档，不影响主路径。 |
| `docs/team/CLAUDE-1-ARCHITECTURE-MANUAL.md` | 团队分工手册（历史协作流程）。 | 非运行时内容，不影响主路径。 |
| `docs/team/CLAUDE-2-BACKEND-MANUAL.md` | 团队分工手册（历史协作流程）。 | 非运行时内容，不影响主路径。 |
| `docs/team/CODEX-REVIEW-MANUAL.md` | 团队分工手册（历史协作流程）。 | 非运行时内容，不影响主路径。 |
| `docs/team/GEMINI-FRONTEND-MANUAL.md` | 团队分工手册（历史协作流程）。 | 非运行时内容，不影响主路径。 |

## 验证

- 执行 `npm run build`（`agent-lab/backend`）后失败，报错集中在已有类型问题（`api/settings`、`api/test-runs`、`lib/llm/client`、`rag` 类型声明等），与本次删除文件无直接耦合。
- 执行 `npm run lint`（`agent-lab/frontend`）后失败，报错集中在已有 `no-explicit-any`、`react-hooks/set-state-in-effect`、`JSX` 语法错误等历史问题，与本次删除文件无直接耦合。
- 通过 `grep -RIn` 检查，已删除文件名仅在本清理记录中出现，不存在残留代码引用。

## 备注

- 本次清理保持“轻量化”原则，只删除无运行时依赖的历史文档与调试脚本。
- 未触碰 `agent-lab/backend/src/api/eval` 与 `agent-lab/frontend/src/app/results` 主路径实现。
