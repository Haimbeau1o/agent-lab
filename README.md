# Agent Lab 🤖

<div align="center">

**A Professional Platform for Testing and Evaluating LLM Agent Capabilities**

**一个专业的 LLM Agent 能力测试与评估平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[English](#english) | [中文](#chinese)

</div>

---

## <a id="english"></a>📖 English Documentation

### 🎯 What is Agent Lab?

Agent Lab is a comprehensive testing platform designed to evaluate and optimize LLM-powered agents across different scenarios. It provides automated testing, metrics calculation, and intelligent reporting to help developers understand their agents' capabilities and limitations.

### ✨ Key Features

#### 🔹 Three Core Agent Types
- **Intent Recognition** - Classify user intents with confidence scoring
- **Multi-turn Dialogue** - Manage conversational context across turns
- **Memory Management** - Store and retrieve important information intelligently

#### 🔹 Comprehensive Testing System
- ✅ **Automated Test Execution** - Asynchronous batch testing
- ✅ **Real-time Monitoring** - Track test progress and status
- ✅ **Detailed Metrics** - Accuracy, F1, latency, and more
- ✅ **Smart Reports** - AI-generated insights and recommendations

#### 🔹 Developer-Friendly
- 📊 **Visual Dashboard** - Monitor agent performance at a glance
- 🔧 **RESTful API** - Easy integration with any frontend
- 📚 **Complete Documentation** - API docs, guides, and examples
- 🧪 **TDD Approach** - 80%+ test coverage

### 🛠️ Tech Stack

**Backend:**
- Node.js 18+ & Express.js
- TypeScript (Strict Mode)
- Prisma ORM + SQLite
- Vitest for Testing
- Zod for Validation

**Frontend:**
- Next.js 14 (App Router)
- React 18 & TypeScript
- TailwindCSS + shadcn/ui
- Recharts for Visualization

**AI/ML:**
- OpenAI API Compatible
- Support for Custom LLM Providers

### 🚀 Quick Start

#### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Haimbeau1o/agent-lab.git
cd agent-lab
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env and set your ENCRYPTION_KEY
```

4. **Initialize database**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **Start backend server**
```bash
npm run dev
# Server running at http://localhost:3001
```

6. **Install frontend dependencies** (in a new terminal)
```bash
cd ../frontend
npm install
```

7. **Start frontend dev server**
```bash
npm run dev
# Frontend running at http://localhost:3000
```

#### Verify Installation
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 📁 Project Structure

```
agent-lab/
├── backend/                    # Backend API Server
│   ├── src/
│   │   ├── api/               # REST API Routes
│   │   │   ├── agents/        # Agent management
│   │   │   ├── tasks/         # Task management
│   │   │   ├── datasets/      # Dataset management
│   │   │   ├── test-runs/     # Test execution
│   │   │   └── settings/      # API configurations
│   │   ├── lib/               # Core Libraries
│   │   │   ├── llm/           # LLM client
│   │   │   ├── agents/        # Agent modules
│   │   │   │   ├── intent.ts      # Intent recognition
│   │   │   │   ├── dialogue.ts    # Multi-turn dialogue
│   │   │   │   └── memory.ts      # Memory management
│   │   │   └── evaluator/     # Metrics & reporting
│   │   └── types/             # TypeScript definitions
│   ├── prisma/                # Database schema & seeds
│   ├── docs/                  # API documentation
│   └── tests/                 # Unit tests
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   └── lib/               # Utils & API client
│   └── public/                # Static assets
│
└── README.md                   # This file
```

### 📊 Evaluation Metrics

#### Intent Recognition
- **Accuracy** - Overall classification accuracy
- **Precision & Recall** - Per-intent performance
- **F1 Score** - Harmonic mean of precision and recall
- **Confidence** - Average prediction confidence
- **Latency** - Response time per request

#### Multi-turn Dialogue
- **Coherence Score** - Conversation flow quality
- **Context Retention** - Information preservation
- **Task Completion Rate** - Goal achievement rate
- **Average Turns** - Efficiency metric
- **Latency per Turn** - Response time

#### Memory Management
- **Recall Accuracy** - Information retrieval correctness
- **Storage Efficiency** - Relevant vs irrelevant data
- **Retrieval Relevance** - Search result quality
- **Memory Size** - Storage usage
- **Retrieval Time** - Search performance

### 📚 Documentation

- **[Backend API Documentation](./backend/docs/api/API.md)** - Complete API reference
- **[Frontend Integration Guide](./backend/docs/FRONTEND_GUIDE.md)** - How to integrate with backend
- **[Quick Reference](./backend/docs/QUICK_REFERENCE.md)** - Common operations
- **[Backend README](./backend/README.md)** - Backend setup and development

### 🗓️ Roadmap

#### ✅ Phase 1: Core Platform (Completed)
- [x] Backend API with 3 agent types
- [x] SQLite database with Prisma
- [x] Automated testing & evaluation
- [x] AI-powered report generation
- [x] API key encryption & security
- [x] Unit tests (80%+ coverage)

#### 🚧 Phase 2: Frontend & UX (Current - Q1 2026)
- [ ] Dashboard with key metrics
- [ ] Agent management interface
- [ ] Task creation & editing UI
- [ ] Real-time test progress visualization
- [ ] Interactive result charts (Recharts)
- [ ] Settings & API configuration page

#### 🔮 Phase 3: Advanced Features (Q2-Q3 2026)
- [ ] Custom agent type support
- [ ] Batch testing with datasets
- [ ] A/B testing between agents
- [ ] Export results (CSV, JSON, PDF)
- [ ] Historical trend analysis
- [ ] Multi-user support & authentication
- [ ] PostgreSQL migration for production
- [ ] Docker containerization

#### 🌟 Phase 4: Enterprise & Ecosystem (Q4 2026)
- [ ] Plugin system for custom evaluators
- [ ] Integration with LangChain/LangGraph
- [ ] Cloud deployment (AWS/Azure/GCP)
- [ ] Real-time collaboration features
- [ ] Advanced analytics & ML insights
- [ ] Enterprise SSO & role-based access
- [ ] API rate limiting & quotas
- [ ] Webhook notifications

### 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

#### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features (80%+ coverage)
- Use conventional commits format
- Update documentation when needed

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI API](https://openai.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

## <a id="chinese"></a>📖 中文文档

### 🎯 什么是 Agent Lab？

Agent Lab 是一个专业的 LLM Agent 能力测试与评估平台，帮助开发者全面评估和优化 AI Agent 在不同场景下的表现。提供自动化测试、指标计算和智能报告，深入了解 Agent 的能力边界和优化方向。

### ✨ 核心功能

#### 🔹 三大 Agent 模块
- **意图识别** - 准确识别用户意图并给出置信度
- **多轮对话** - 智能管理对话上下文和状态
- **记忆管理** - 自动提取、存储和检索关键信息

#### 🔹 完善的测试系统
- ✅ **自动化测试执行** - 异步批量测试，高效可靠
- ✅ **实时进度监控** - 测试状态实时追踪
- ✅ **详细指标计算** - 准确率、F1、延迟等多维度评估
- ✅ **智能分析报告** - AI 生成问题分析和优化建议

#### 🔹 开发者友好
- 📊 **可视化仪表盘** - 一目了然的性能监控
- 🔧 **RESTful API** - 易于集成的后端接口
- 📚 **完整文档** - API 文档、使用指南和示例
- 🧪 **TDD 开发** - 80%+ 测试覆盖率保证质量

### 🛠️ 技术栈

**后端:**
- Node.js 18+ & Express.js
- TypeScript (严格模式)
- Prisma ORM + SQLite
- Vitest 测试框架
- Zod 参数校验

**前端:**
- Next.js 14 (App Router)
- React 18 & TypeScript
- TailwindCSS + shadcn/ui
- Recharts 图表库

**AI/ML:**
- 兼容 OpenAI API 格式
- 支持自定义 LLM 提供商

### 🚀 快速开始

#### 环境要求
```bash
node >= 18.0.0
npm >= 9.0.0
```

#### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/Haimbeau1o/agent-lab.git
cd agent-lab
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，设置 ENCRYPTION_KEY
```

4. **初始化数据库**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **启动后端服务**
```bash
npm run dev
# 服务运行在 http://localhost:3001
```

6. **安装前端依赖**（新开终端）
```bash
cd ../frontend
npm install
```

7. **启动前端开发服务器**
```bash
npm run dev
# 前端运行在 http://localhost:3000
```

#### 验证安装
```bash
curl http://localhost:3001/health
# 应返回: {"status":"ok","timestamp":"..."}
```

### 📁 项目结构

```
agent-lab/
├── backend/                    # 后端 API 服务
│   ├── src/
│   │   ├── api/               # REST API 路由
│   │   │   ├── agents/        # Agent 管理
│   │   │   ├── tasks/         # 任务管理
│   │   │   ├── datasets/      # 数据集管理
│   │   │   ├── test-runs/     # 测试执行
│   │   │   └── settings/      # API 配置
│   │   ├── lib/               # 核心库
│   │   │   ├── llm/           # LLM 客户端
│   │   │   ├── agents/        # Agent 模块
│   │   │   │   ├── intent.ts      # 意图识别
│   │   │   │   ├── dialogue.ts    # 多轮对话
│   │   │   │   └── memory.ts      # 记忆管理
│   │   │   └── evaluator/     # 指标计算与报告
│   │   └── types/             # TypeScript 类型定义
│   ├── prisma/                # 数据库 Schema 和种子数据
│   ├── docs/                  # API 文档
│   └── tests/                 # 单元测试
│
├── frontend/                   # Next.js 前端应用
│   ├── src/
│   │   ├── app/               # App Router 页面
│   │   ├── components/        # React 组件
│   │   └── lib/               # 工具函数和 API 客户端
│   └── public/                # 静态资源
│
└── README.md                   # 本文件
```

### 📊 评测指标

#### 意图识别
- **准确率 (Accuracy)** - 整体分类准确性
- **精确率 & 召回率** - 每个意图的性能
- **F1 分数** - 精确率和召回率的调和平均
- **置信度** - 平均预测置信度
- **延迟** - 单次请求响应时间

#### 多轮对话
- **连贯性评分** - 对话流畅度
- **上下文保留** - 信息保持能力
- **任务完成率** - 目标达成率
- **平均轮次** - 效率指标
- **单轮延迟** - 响应时间

#### 记忆管理
- **召回准确率** - 信息检索正确性
- **存储效率** - 相关信息占比
- **检索相关性** - 搜索结果质量
- **记忆大小** - 存储使用量
- **检索时间** - 搜索性能

### 📚 文档

- **[后端 API 文档](./backend/docs/api/API.md)** - 完整接口参考
- **[前端集成指南](./backend/docs/FRONTEND_GUIDE.md)** - 如何对接后端
- **[快速参考](./backend/docs/QUICK_REFERENCE.md)** - 常用操作
- **[后端 README](./backend/README.md)** - 后端配置和开发

### 🗓️ 迭代规划

#### ✅ 第一阶段：核心平台（已完成）
- [x] 后端 API 及 3 种 Agent 类型
- [x] SQLite 数据库 + Prisma ORM
- [x] 自动化测试与评估系统
- [x] AI 驱动的报告生成
- [x] API Key 加密存储
- [x] 单元测试（80%+ 覆盖率）

#### 🚧 第二阶段：前端与用户体验（进行中 - 2026 Q1）
- [ ] 数据概览仪表盘
- [ ] Agent 管理界面
- [ ] 任务创建与编辑 UI
- [ ] 测试进度实时可视化
- [ ] 交互式结果图表 (Recharts)
- [ ] 设置和 API 配置页面

#### 🔮 第三阶段：高级功能（2026 Q2-Q3）
- [ ] 自定义 Agent 类型支持
- [ ] 数据集批量测试
- [ ] Agent A/B 对比测试
- [ ] 结果导出 (CSV, JSON, PDF)
- [ ] 历史趋势分析
- [ ] 多用户支持与权限管理
- [ ] PostgreSQL 生产环境迁移
- [ ] Docker 容器化部署

#### 🌟 第四阶段：企业级与生态（2026 Q4）
- [ ] 插件系统支持自定义评估器
- [ ] 集成 LangChain/LangGraph
- [ ] 云端部署 (AWS/Azure/GCP)
- [ ] 实时协作功能
- [ ] 高级分析与 ML 洞察
- [ ] 企业 SSO 和基于角色的访问控制
- [ ] API 速率限制与配额管理
- [ ] Webhook 通知系统

### 🤝 参与贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

#### 开发规范
- 遵循 TypeScript 最佳实践
- 为新功能编写测试（80%+ 覆盖率）
- 使用约定式提交格式
- 必要时更新文档

### 📄 开源许可

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

### 🙏 致谢

- 基于 [Next.js](https://nextjs.org/) 构建
- 由 [OpenAI API](https://openai.com/) 驱动
- UI 组件来自 [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">

**Made with ❤️ by Haimbeau1o**

⭐ Star this repo if you find it helpful!

</div>
