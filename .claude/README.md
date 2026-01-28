# 阿东的 VibeCoding 开发范式

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Claude Code](https://img.shields.io/badge/Claude-Code-CC9C73?logo=anthropic&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.0-4285F4?logo=google&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)

**基于 Claude Code 冠军配置的 Tri-AI 开发范式基础模板**

Gemini（前端）+ Claude（后端）+ Codex（调试）的高效 AI Native 开发工作流

---

## 🎯 核心理念

```
Gemini 2.0 Flash     →  Claude Sonnet      →  Claude Code
   UI/UX生成            后端逻辑实现           编排与质检
   (Antigravity)        (CLI TDD)            (CLI)
   快速创意             可靠TDD开发           质量把关
```

**每个 AI 做最擅长的事：**
- **Gemini** - 在 Antigravity 中快速生成 UI 组件
- **Claude** - 在 CLI 中用 TDD 开发可靠的后端
- **Claude Code** - 在 CLI 中协调整个工作流和质量把关

---

## 🚀 快速开始

### 1. 阅读 Tri-AI 快速入门

```bash
cat TRIAI-QUICKSTART.md
```

了解完整的工作流程、工具切换和最佳实践。

### 2. 查看实战案例

```bash
cat examples/triai-workflow-example.md
```

看一个完整的项目是如何从 0 到 1 构建的。

### 3. 开始你的项目

```bash
# 规划
/plan "我要开发..."

# 后端（TDD）
/tdd "创建 API..."

# 前端（切换到 Antigravity）
# 在 Antigravity 中用 Gemini 生成组件

# 审查
/code-review

# 测试
/e2e "测试用户流程"
```

---

## 📚 文档导航

### 核心文档
- **[TRIAI-QUICKSTART.md](TRIAI-QUICKSTART.md)** - 快速入门指南（必读）
- **[目录结构说明.md](目录结构说明.md)** - 配置目录详解
- **[Tauri快速入门.md](Tauri快速入门.md)** - Tauri 桌面应用开发

### 实战案例
- **[examples/triai-workflow-example.md](examples/triai-workflow-example.md)** - 完整的 Todo 应用开发案例

### 技术栈推荐

**Web 应用：**
```
Next.js 14 + TypeScript + TailwindCSS + Prisma
```

**桌面应用（推荐 Tauri）：**
```
Tauri + React + TypeScript + Rust
```

---

## 📦 项目结构

```
adong-vibecoding/
├── agents/           # AI 代理（专家团队）
├── commands/         # 斜杠命令
├── skills/           # 技能库（最佳实践）
├── rules/            # 强制规则（必须遵守）
├── hooks/            # 自动化钩子
├── scripts/          # Node.js 脚本
├── mcp-configs/      # MCP 服务器配置
├── contexts/         # 动态上下文
├── examples/         # 示例和案例
├── tests/            # 测试套件
├── TRIAI-QUICKSTART.md           # 快速入门（中文）
├── 目录结构说明.md               # 结构详解（中文）
├── Tauri快速入门.md              # Tauri 指南（中文）
└── README.md                    # 本文档
```

详细说明请查看 [目录结构说明.md](目录结构说明.md)

---

## 🛠️ 核心命令

| 命令 | 用途 | 使用场景 |
|------|------|----------|
| `/plan` | 架构决策 | 开始新功能时 |
| `/tdd` | 测试驱动开发 | 所有后端代码 |
| `/code-review` | 质量检查 | 代码变更后 |
| `/e2e` | 端到端测试 | 集成测试时 |
| `/build-fix` | 修复构建错误 | 构建失败时 |

---

## 💻 工作环境配置

### 你的工具栈

- **前端开发** - Antigravity 编辑器 + Gemini 2.0 Flash
- **后端开发** - Claude Code CLI + TDD
- **调试修复** - Claude Code CLI
- **总编排** - Claude Code CLI

### 工作流程

```bash
# 1. 在 Claude Code CLI 中规划和构建后端
/plan "规划功能..."
/tdd "构建后端 API..."

# 2. 切换到 Antigravity + Gemini
# 打开 Antigravity 编辑器
# 使用 Gemini 生成前端组件

# 3. 回到 Claude Code CLI 进行审查和集成
/code-review src/components/
/plan "集成前后端..."

# 4. 如果遇到错误
"帮我调试这个错误：..."
```

---

## 🔧 安装与使用

### 方式 1：作为插件安装（推荐）

```bash
# 添加为 marketplace
cd /path/to/your/project
git clone https://github.com/你的用户名/adong-vibecoding.git .claude

# 或者直接复制配置
cp -r adong-vibecoding/* ~/.claude/
```

### 方式 2：手动复制

```bash
# 复制 agents
cp adong-vibecoding/agents/*.md ~/.claude/agents/

# 复制 commands
cp adong-vibecoding/commands/*.md ~/.claude/commands/

# 复制 skills
cp -r adong-vibecoding/skills/* ~/.claude/skills/

# 复制 rules
cp adong-vibecoding/rules/*.md ~/.claude/rules/
```

---

## 🎓 学习路径

### 第 1 周：基础
- 阅读 [TRIAI-QUICKSTART.md](TRIAI-QUICKSTART.md)
- 用小功能练习完整工作流
- 熟悉 `/plan`, `/tdd`, `/code-review` 命令

### 第 2 周：实战
- 跟着 [examples/triai-workflow-example.md](examples/triai-workflow-example.md) 做一个完整项目
- 掌握工具切换（CLI ↔ Antigravity）
- 理解 TDD 工作流

### 第 3 周：优化
- 学习 [skills/](skills/) 中的最佳实践
- 性能调优和安全加固
- 尝试 Tauri 桌面应用

### 第 4 周：生产
- 部署到生产环境
- 设置监控和告警
- 持续优化迭代

---

## 🌟 核心特性

### 1. Tri-AI 协同
充分发挥每个 AI 的优势，开发效率提升 4x

### 2. TDD 强制
所有后端代码必须先写测试，保证代码质量

### 3. 代码审查
自动化的代码质量检查和安全审查

### 4. 安全第一
内置安全规则，防止常见漏洞

### 5. 跨平台支持
支持 Windows, macOS, Linux

---

## 📊 推荐技术栈

### Web 应用
- **框架**：Next.js 14
- **语言**：TypeScript
- **样式**：TailwindCSS
- **数据库**：Prisma + PostgreSQL
- **状态管理**：Zustand / SWR

### 桌面应用（Tauri）
- **框架**：Tauri + React
- **后端**：Rust
- **前端**：TypeScript + TailwindCSS
- **优势**：轻量（~5-10 MB）、安全、快速

### 移动应用
- **框架**：React Native
- **语言**：TypeScript
- **开发工具**：Expo

---

## 🤝 贡献指南

欢迎贡献！如果你有：
- 更好的 agents 或 skills
- 巧妙的 hooks
- 更优的 MCP 配置
- 改进的 rules

请提交 PR！

### 贡献想法

- 特定语言的 skills（Python, Go, Rust）
- 框架特定配置（Django, Rails, Laravel）
- DevOps agents（Kubernetes, Terraform）
- 测试策略（不同框架）
- 领域知识（ML, 数据工程, 移动端）

---

## 📝 重要说明

### 上下文窗口管理

**重要：** 不要同时启用所有 MCP。200k 的上下文可能会因为太多工具而缩水到 70k。

经验法则：
- 配置 20-30 个 MCP
- 每个项目启用 < 10 个
- 保持 < 80 个活跃工具

### 定制化

这些配置是为我的工作流优化的。你应该：
1. 从符合你的部分开始
2. 根据你的技术栈修改
3. 删除你不用的
4. 添加你自己的模式

---

## 🔗 相关资源

### 原始项目
基于 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) 改造

### 工具文档
- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [Tauri 官方文档](https://tauri.app/v1/guides/)
- [Antigravity](https://antigravity.com/)（AI 编辑器）

---

## 📜 许可证

MIT - 自由使用，按需修改，尽可能回馈社区

---

## 🙏 致谢

- [affaan-m](https://github.com/affaan-m) - 原始配置作者，Anthropic 黑客松冠军
- [Anthropic](https://www.anthropic.com/) - Claude Code
- [Google](https://ai.google.dev/) - Gemini 2.0 Flash

---

**Star 这个仓库如果对你有帮助。从 0 到 1 构建 AI Native 产品！** 🚀
