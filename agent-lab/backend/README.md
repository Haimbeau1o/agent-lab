# Agent Lab Backend

Agent 能力边界测试平台的后端 API 服务。

## 项目简介

本项目提供了一个完整的后端 API，用于测试和评估 LLM Agent 在不同场景下的表现。支持三个核心模块：

- **意图识别（Intent Recognition）** - 识别用户输入的意图类别
- **多轮对话（Multi-turn Dialogue）** - 管理多轮对话上下文
- **记忆（Memory）** - 存储和检索重要信息

## 核心功能

✅ **Agent 模板管理** - 创建、配置和管理不同类型的 Agent
✅ **测试任务创建** - 定义测试用例和评测标准
✅ **异步测试执行** - 后台运行测试，支持大规模测试
✅ **自动化评测** - 计算准确率、F1、延迟等指标
✅ **智能报告生成** - AI 生成总结、问题分析和改进建议
✅ **API Key 管理** - 加密存储，支持多个 LLM 提供商

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite + Prisma ORM
- **Language**: TypeScript
- **Validation**: Zod
- **Testing**: Vitest
- **LLM**: OpenAI API (兼容格式)

## 快速开始

### 1. 安装依赖

```bash
cd agent-lab/backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并创建 `.env`:

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY=your_32_character_encryption_key_here
ENCRYPTION_SALT=your_32_hex_character_salt_here
```

必填安全配置说明：

- `ENCRYPTION_KEY`：至少 32 个字符（建议使用高熵随机字符串）
- `ENCRYPTION_SALT`：至少 32 位十六进制字符（即 >= 16 bytes）

可用以下命令生成：

```bash
node -e "const crypto=require('crypto'); console.log('ENCRYPTION_KEY=' + crypto.randomBytes(24).toString('hex')); console.log('ENCRYPTION_SALT=' + crypto.randomBytes(16).toString('hex'));"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充示例数据（可选）
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 5. 验证安装

执行以下 smoke 命令：

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/eval/runners
curl http://localhost:3001/api/eval/definitions
```

期望：

- `/health` 返回 `status: "ok"`
- `/api/eval/runners` 返回 `success: true` 且 `data` 为数组
- `/api/eval/definitions` 返回 `success: true` 且 `data` 包含可用定义

### 6. 受限环境替代验证（无法监听端口）

如果在 CI/sandbox 中无法绑定 `localhost:3001`，可执行以下替代验证：

```bash
# 1) 校验 ENCRYPTION_* 的格式约束
ENCRYPTION_KEY="${ENCRYPTION_KEY:-12345678901234567890123456789012}" \
ENCRYPTION_SALT="${ENCRYPTION_SALT:-0123456789abcdef0123456789abcdef}" \
node -e "const key=process.env.ENCRYPTION_KEY||''; const salt=process.env.ENCRYPTION_SALT||''; if(key.length<32) throw new Error('ENCRYPTION_KEY must be at least 32 chars'); if(!/^[0-9a-fA-F]{32,}$/.test(salt)) throw new Error('ENCRYPTION_SALT must be hex and >=32 chars'); console.log('ENCRYPTION_* format check passed');"

# 2) 静态检查关键路由是否存在
rg "app.get\\('/health'" src/index.ts
rg "router.get\\('/runners'" src/api/eval/index.ts
rg "router.get\\('/definitions'" src/api/eval/index.ts

# 3) 类型构建检查
npm run build
```

完整说明见：[`docs/RUNTIME_SMOKE_GUIDE.md`](./docs/RUNTIME_SMOKE_GUIDE.md)

## API 文档

完整的 API 文档请查看：[API.md](./docs/api/API.md)

### 主要端点

| 端点 | 说明 |
|------|------|
| `GET /api/agents` | 获取所有 Agent |
| `POST /api/agents` | 创建新 Agent |
| `GET /api/tasks` | 获取所有任务 |
| `POST /api/tasks` | 创建新任务 |
| `POST /api/test-runs` | 执行测试 |
| `GET /api/test-runs/:id/report` | 获取测试报告 |
| `POST /api/settings/api-config` | 配置 API Key |

## 项目结构

```
backend/
├── src/
│   ├── api/                    # API 路由
│   │   ├── agents/            # Agent 管理
│   │   ├── tasks/             # 任务管理
│   │   ├── datasets/          # 数据集管理
│   │   ├── test-runs/         # 测试运行
│   │   └── settings/          # 设置
│   ├── lib/                   # 核心库
│   │   ├── llm/               # LLM 客户端
│   │   ├── agents/            # Agent 模块
│   │   │   ├── intent.ts      # 意图识别
│   │   │   ├── dialogue.ts    # 多轮对话
│   │   │   └── memory.ts      # 记忆管理
│   │   ├── evaluator/         # 评测系统
│   │   └── prisma.ts          # 数据库客户端
│   ├── types/                 # TypeScript 类型定义
│   └── index.ts               # 应用入口
├── prisma/
│   ├── schema.prisma          # 数据库 Schema
│   └── seed.ts                # 初始数据
├── tests/                     # 测试文件
└── docs/                      # 文档

```

## 开发指南

### 运行测试

```bash
# 运行所有测试（会自动准备 prisma/test.db）
npm test

# 运行存储层测试（先执行最小化迁移）
npm run test:storage

# 仅准备测试数据库（调试时可单独执行）
npm run test:prepare-db

# 运行测试并查看覆盖率
npm run test:coverage

# 监听模式
npm test -- --watch
```

`npm run test:prepare-db` 会删除并重建 `prisma/test.db`，再执行 `prisma/schema.prisma` 下全部迁移，保证 `score_records` 等测试表一致。

### 分层质量门禁

```bash
# Run-Priority（PR 默认门禁）
npm run gate:run-priority

# Strict-Green（升级门禁）
npm run gate:strict-green
```

- `gate:run-priority`: `build + storage 基线测试`
- `gate:strict-green`: `gate:run-priority + 全量 vitest`

### 数据库操作

```bash
# 查看数据库（Prisma Studio）
npm run prisma:studio

# 创建新迁移
npm run prisma:migrate -- --name migration_name

# 重置数据库
npx prisma migrate reset
```

### 构建生产版本

```bash
npm run build
npm start
```

## 使用示例

### 1. 配置 API Key

```bash
curl -X POST http://localhost:3001/api/settings/api-config \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenAI GPT-4",
    "provider": "openai",
    "apiKey": "sk-proj-xxxxx",
    "baseUrl": "https://api.openai.com/v1",
    "modelName": "gpt-4",
    "isDefault": true
  }'
```

### 2. 创建测试任务

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "意图识别测试",
    "type": "intent",
    "description": "测试客服意图识别",
    "testCases": [
      {
        "input": "我要退款",
        "expected": {
          "intent": "refund",
          "confidence": 0.9
        }
      }
    ]
  }'
```

### 3. 执行测试

```bash
curl -X POST http://localhost:3001/api/test-runs \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_id_here",
    "taskId": "task_id_here",
    "apiConfigId": "api_config_id_here"
  }'
```

### 4. 获取测试报告

```bash
curl http://localhost:3001/api/test-runs/{test_run_id}/report
```

## 核心模块说明

### 意图识别模块

识别用户输入的意图类别，支持：
- 多意图分类
- Few-shot 示例
- 置信度评分
- 混淆矩阵分析

### 多轮对话模块

管理多轮对话上下文，支持：
- 自动上下文管理
- 历史消息截断
- 对话状态追踪
- 连贯性评估

### 记忆模块

存储和检索重要信息，支持：
- 自动信息提取
- 重要性权重
- 关键词检索
- 记忆大小管理

## 评测指标

### 意图识别
- 准确率（Accuracy）
- 精确率（Precision）
- 召回率（Recall）
- F1 分数
- 平均置信度
- 响应延迟

### 多轮对话
- 连贯性评分
- 话题漂移次数
- 上下文保留率
- 任务完成率
- 平均轮次
- 每轮延迟

### 记忆
- 召回准确率
- 存储效率
- 检索相关性
- 更新延迟
- 记忆大小
- 检索时间

## 安全性

- ✅ API Key 使用 AES-256-CBC 加密存储
- ✅ 输入验证使用 Zod
- ✅ 错误信息不暴露敏感数据
- ⚠️ 生产环境请使用 HTTPS
- ⚠️ 生产环境请更改默认加密密钥

## 性能优化

- 测试异步执行，不阻塞主线程
- 支持批量测试
- 数据库索引优化
- 可扩展到 PostgreSQL

## 故障排除

### 数据库连接失败

确保 DATABASE_URL 正确配置，并运行：
```bash
npm run prisma:generate
```

### LLM API 调用失败

1. 检查 API Key 是否正确
2. 验证 Base URL 是否可访问
3. 使用测试连接功能：`POST /api/settings/api-config/:id/test`

### 测试执行超时

- 检查 LLM API 响应时间
- 减少测试用例数量
- 调整超时设置

## 贡献指南

欢迎提交 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循 TypeScript 最佳实践
- 所有新功能需要测试
- 保持测试覆盖率 > 80%
- 使用有意义的提交信息

## 许可证

MIT

## 联系方式

如有问题或建议，请提交 Issue。

---

**注意**: 本项目当前为开发版本，不建议直接用于生产环境。
