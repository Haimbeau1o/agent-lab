# Agent Lab Backend API 文档

## 基础信息

**Base URL**: `http://localhost:3001/api`

**认证**: 当前版本无需认证

**数据格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "data": { ... }
}
```

### 错误响应
```json
{
  "error": {
    "message": "错误信息",
    "details": [] // 可选，验证错误时包含详细信息
  }
}
```

---

## API Endpoints

### 1. Agent 管理

#### 1.1 获取所有 Agent

```http
GET /api/agents
```

**Query Parameters**:
- `type` (optional): 筛选 Agent 类型 (`intent` | `dialogue` | `memory`)

**响应示例**:
```json
{
  "data": [
    {
      "id": "clx1234567",
      "name": "基础意图识别",
      "type": "intent",
      "description": "识别用户输入的基本意图类别",
      "config": {
        "intents": ["greeting", "question", "complaint"],
        "temperature": 0.3,
        "maxTokens": 100
      },
      "systemPrompt": "You are an intent recognition system...",
      "isBuiltin": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 1.2 获取单个 Agent

```http
GET /api/agents/:id
```

**响应**: 同上，返回单个 Agent 对象

#### 1.3 创建 Agent

```http
POST /api/agents
```

**请求体**:
```json
{
  "name": "我的意图识别器",
  "type": "intent",
  "description": "自定义意图识别器",
  "config": {
    "intents": ["greeting", "question"],
    "temperature": 0.3
  },
  "systemPrompt": "You are...",
  "isBuiltin": false
}
```

**响应**: 返回创建的 Agent 对象 (201 Created)

#### 1.4 更新 Agent

```http
PUT /api/agents/:id
```

**请求体**: 与创建类似，所有字段可选

**注意**: 无法修改内置 Agent (`isBuiltin: true`)

#### 1.5 删除 Agent

```http
DELETE /api/agents/:id
```

**响应**: 204 No Content

**注意**: 无法删除内置 Agent

---

### 2. 任务管理

#### 2.1 获取所有任务

```http
GET /api/tasks
```

**Query Parameters**:
- `type` (optional): 筛选任务类型

**响应示例**:
```json
{
  "data": [
    {
      "id": "clx1234567",
      "name": "客服意图识别测试",
      "description": "测试客服场景下的意图识别",
      "type": "intent",
      "testCases": [
        {
          "input": "我要退款",
          "expected": {
            "intent": "refund",
            "confidence": 0.9
          }
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2.2 获取单个任务

```http
GET /api/tasks/:id
```

#### 2.3 创建任务

```http
POST /api/tasks
```

**请求体**:
```json
{
  "name": "我的测试任务",
  "description": "任务描述",
  "type": "intent",
  "testCases": [
    {
      "input": "测试输入",
      "expected": {
        "intent": "greeting"
      }
    }
  ]
}
```

**测试用例格式**:

**Intent 类型**:
```json
{
  "input": "用户输入文本",
  "expected": {
    "intent": "意图名称",
    "confidence": 0.9
  }
}
```

**Dialogue 类型**:
```json
{
  "input": {
    "turns": [
      { "role": "user", "content": "用户消息" },
      { "role": "assistant", "content": "助手回复" },
      { "role": "user", "content": "用户消息" }
    ]
  },
  "expected": {
    "slots": {
      "key": "value"
    }
  }
}
```

**Memory 类型**:
```json
{
  "input": {
    "history": [
      { "role": "user", "content": "我叫张三" },
      { "role": "assistant", "content": "你好张三" }
    ],
    "query": "你还记得我的名字吗？"
  },
  "expected": {
    "recall": ["user_name"],
    "responseContains": ["张三"]
  }
}
```

#### 2.4 更新任务

```http
PUT /api/tasks/:id
```

#### 2.5 删除任务

```http
DELETE /api/tasks/:id
```

---

### 3. 数据集管理

#### 3.1 获取所有数据集

```http
GET /api/datasets
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "clx1234567",
      "name": "意图识别数据集",
      "type": "intent",
      "description": "包含100条测试用例",
      "data": [ /* 测试数据数组 */ ],
      "size": 100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 3.2 创建数据集

```http
POST /api/datasets
```

**请求体**:
```json
{
  "name": "我的数据集",
  "type": "intent",
  "description": "数据集描述",
  "data": [
    { "input": "test1" },
    { "input": "test2" }
  ]
}
```

#### 3.3 更新/删除数据集

与任务 API 类似

---

### 4. API 配置管理

#### 4.1 获取所有 API 配置

```http
GET /api/settings/api-config
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "clx1234567",
      "name": "OpenAI GPT-4",
      "provider": "openai",
      "apiKey": "sk-proj...xxxx", // 部分隐藏
      "baseUrl": "https://api.openai.com/v1",
      "modelName": "gpt-4",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 4.2 创建 API 配置

```http
POST /api/settings/api-config
```

**请求体**:
```json
{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "apiKey": "sk-proj-xxxxxxxxxxxx",
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-4",
  "isDefault": true
}
```

**Providers**:
- `openai`: OpenAI API
- `anthropic`: Anthropic API (Claude)
- `custom`: 自定义兼容 OpenAI 格式的 API

#### 4.3 更新 API 配置

```http
PUT /api/settings/api-config/:id
```

**注意**: 如果设置 `isDefault: true`，会自动将其他配置的 `isDefault` 设为 `false`

#### 4.4 测试 API 连接

```http
POST /api/settings/api-config/:id/test
```

**响应**:
```json
{
  "success": true,
  "message": "API connection successful"
}
```

或

```json
{
  "success": false,
  "message": "API connection failed",
  "status": 401
}
```

---

### 5. 测试运行

#### 5.1 获取所有测试运行

```http
GET /api/test-runs
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "clx1234567",
      "agentId": "clx11111",
      "taskId": "clx22222",
      "datasetId": null,
      "status": "completed",
      "startedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z",
      "agent": { /* Agent 对象 */ },
      "task": { /* Task 对象 */ },
      "dataset": null,
      "results": [ /* TestResult 数组 */ ]
    }
  ]
}
```

**Status 值**:
- `pending`: 等待执行
- `running`: 执行中
- `completed`: 已完成
- `failed`: 执行失败

#### 5.2 获取单个测试运行详情

```http
GET /api/test-runs/:id
```

**响应**: 包含完整的 Agent、Task、Results 信息

#### 5.3 创建并执行测试运行

```http
POST /api/test-runs
```

**请求体**:
```json
{
  "agentId": "clx1234567",
  "taskId": "clx7654321",
  "datasetId": "clx9999999", // 可选
  "apiConfigId": "clx8888888"
}
```

**响应** (202 Accepted):
```json
{
  "data": {
    "id": "clx_new_test_run",
    "status": "running",
    "startedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Test run started"
}
```

**注意**: 测试在后台异步执行，通过轮询 GET /api/test-runs/:id 查看状态

#### 5.4 获取测试报告

```http
GET /api/test-runs/:id/report
```

**前提**: 测试运行状态必须为 `completed`

**响应示例**:
```json
{
  "data": {
    "testRunId": "clx1234567",
    "summary": "Intent Recognition Test completed with 8/10 successful recognitions (80% accuracy)...",
    "metrics": {
      "accuracy": 0.8,
      "precision": 0.8,
      "recall": 0.8,
      "f1Score": 0.8,
      "avgConfidence": 0.75,
      "latency": 1200
    },
    "issues": [
      "Low confidence scores (avg 75%) - Model is uncertain about predictions"
    ],
    "recommendations": [
      "Add more few-shot examples to improve intent discrimination",
      "Consider using a more powerful model for better understanding"
    ],
    "createdAt": "2024-01-01T00:05:00.000Z"
  }
}
```

**指标说明**:

**Intent Metrics**:
- `accuracy`: 准确率 (0-1)
- `precision`: 精确率 (0-1)
- `recall`: 召回率 (0-1)
- `f1Score`: F1 分数 (0-1)
- `avgConfidence`: 平均置信度 (0-1)
- `latency`: 平均延迟（毫秒）

**Dialogue Metrics**:
- `coherenceScore`: 连贯性评分 (0-1)
- `topicDriftCount`: 话题漂移次数
- `contextRetention`: 上下文保留率 (0-1)
- `taskCompletionRate`: 任务完成率 (0-1)
- `avgTurnsToComplete`: 平均完成轮数
- `repeatRate`: 重复内容比例 (0-1)
- `latencyPerTurn`: 每轮平均延迟（毫秒）

**Memory Metrics**:
- `recallAccuracy`: 召回准确率 (0-1)
- `storageEfficiency`: 存储效率 (0-1)
- `retrievalRelevance`: 检索相关性 (0-1)
- `updateLatency`: 更新延迟（毫秒）
- `memorySize`: 记忆大小（条数）
- `avgRetrievalTime`: 平均检索时间（毫秒）

---

## 错误码

| HTTP Status | 说明 |
|------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 202 | 已接受（异步任务已启动）|
| 204 | 成功（无内容返回）|
| 400 | 请求参数错误 |
| 403 | 禁止操作（如修改内置 Agent）|
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用流程示例

### 完整测试流程

1. **配置 API Key**
```bash
POST /api/settings/api-config
{
  "name": "My OpenAI",
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-4",
  "isDefault": true
}
```

2. **查看可用 Agent**
```bash
GET /api/agents?type=intent
```

3. **创建测试任务**
```bash
POST /api/tasks
{
  "name": "我的意图测试",
  "type": "intent",
  "testCases": [...]
}
```

4. **执行测试**
```bash
POST /api/test-runs
{
  "agentId": "agent_id",
  "taskId": "task_id",
  "apiConfigId": "api_config_id"
}
```

5. **轮询测试状态**
```bash
GET /api/test-runs/:id
```

6. **获取测试报告**
```bash
GET /api/test-runs/:id/report
```

---

## 开发说明

### 环境变量

创建 `.env` 文件：
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY=your_32_character_key_here
ENCRYPTION_SALT=your_32_hex_character_salt_here
```

- `ENCRYPTION_KEY`：至少 32 字符
- `ENCRYPTION_SALT`：至少 32 位十六进制字符（>= 16 bytes）

### 本地运行

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 运行 seed（创建内置数据）
npm run prisma:seed

# 启动开发服务器
npm run dev

# smoke 验证
curl http://localhost:3001/health
curl http://localhost:3001/api/eval/runners
curl http://localhost:3001/api/eval/definitions
```

受限环境替代验证请参考：[`../RUNTIME_SMOKE_GUIDE.md`](../RUNTIME_SMOKE_GUIDE.md)

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage
```

---

## 前端集成建议

### 使用 Axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取所有 Agent
const getAgents = async () => {
  const response = await api.get('/agents')
  return response.data.data
}

// 执行测试
const runTest = async (agentId: string, taskId: string, apiConfigId: string) => {
  const response = await api.post('/test-runs', {
    agentId,
    taskId,
    apiConfigId
  })
  return response.data.data
}

// 轮询测试状态
const pollTestStatus = async (testRunId: string): Promise<TestRun> => {
  const response = await api.get(`/test-runs/${testRunId}`)
  const testRun = response.data.data

  if (testRun.status === 'running' || testRun.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return pollTestStatus(testRunId)
  }

  return testRun
}
```

### 类型定义

参考 `src/types/` 目录下的 TypeScript 类型定义文件

---

## 注意事项

1. **API Key 安全**: API Key 使用 AES-256-CBC 加密存储，但请确保：
   - 生产环境使用强加密密钥
   - 不在客户端代码中硬编码 API Key
   - 使用 HTTPS

2. **测试执行**: 测试在后台异步执行，避免阻塞主线程

3. **数据库**: 默认使用 SQLite，生产环境建议迁移到 PostgreSQL

4. **性能**: 大量测试用例可能导致执行时间较长，建议分批测试

---

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (Prisma ORM)
- **Language**: TypeScript
- **Validation**: Zod
- **Testing**: Vitest

---

## 联系方式

如有问题或建议，请提交 Issue。
