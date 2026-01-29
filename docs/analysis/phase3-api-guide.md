# Phase 3 API 使用指南

## 快速开始

### 启动服务器

```bash
cd agent-lab/backend
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### 1. 执行单个任务评测

**POST** `/api/eval/run`

执行单个 AtomicTask 并返回完整的评测结果。

#### 请求示例 - Intent 识别

```bash
curl -X POST http://localhost:3001/api/eval/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "task-1",
      "name": "Test Intent Recognition",
      "type": "intent",
      "input": {
        "text": "Hello, how are you doing today?"
      },
      "expected": {
        "intent": "greeting",
        "confidence": 0.8
      },
      "metadata": {
        "tags": ["greeting", "test"]
      }
    },
    "runnerId": "intent.llm",
    "config": {
      "intents": ["greeting", "question", "complaint", "farewell"],
      "examples": {
        "greeting": ["hello", "hi", "good morning"],
        "question": ["how do I", "what is", "can you explain"]
      },
      "temperature": 0.3,
      "maxTokens": 100
    },
    "evaluatorIds": ["intent.metrics"]
  }'
```

#### 请求示例 - Dialogue 对话

```bash
curl -X POST http://localhost:3001/api/eval/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "task-2",
      "name": "Test Dialogue",
      "type": "dialogue",
      "input": {
        "message": "I need help with my account",
        "history": []
      },
      "expected": {
        "responseContains": ["account", "help"],
        "minResponseLength": 50
      },
      "metadata": {}
    },
    "runnerId": "dialogue.llm",
    "config": {
      "maxHistoryLength": 10,
      "temperature": 0.7,
      "maxTokens": 150
    },
    "evaluatorIds": ["dialogue.metrics"]
  }'
```

#### 请求示例 - Memory 提取

```bash
curl -X POST http://localhost:3001/api/eval/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "task-3",
      "name": "Test Memory Extract",
      "type": "memory",
      "input": {
        "operation": "extract",
        "message": "My name is John, I am 30 years old, and I love programming."
      },
      "expected": {
        "operation": "extract",
        "minMemoryCount": 2,
        "requiredKeys": ["name", "age"]
      },
      "metadata": {}
    },
    "runnerId": "memory.llm",
    "config": {
      "maxMemorySize": 100,
      "temperature": 0.5,
      "maxTokens": 200
    },
    "evaluatorIds": ["memory.metrics"]
  }'
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "run": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "taskId": "task-1",
      "taskType": "atomic",
      "status": "completed",
      "output": {
        "intent": "greeting",
        "confidence": 0.95,
        "reasoning": "User is saying hello"
      },
      "metrics": {
        "latency": 523,
        "tokens": 70,
        "cost": 0.00014
      },
      "trace": [
        {
          "timestamp": "2026-01-29T12:00:00.000Z",
          "level": "info",
          "event": "config_validated",
          "data": { "intents": ["greeting", "question", "complaint", "farewell"] }
        },
        {
          "timestamp": "2026-01-29T12:00:00.100Z",
          "level": "info",
          "event": "input_validated",
          "data": { "textLength": 30 }
        },
        {
          "timestamp": "2026-01-29T12:00:00.200Z",
          "level": "info",
          "event": "llm_request_start",
          "data": { "temperature": 0.3, "maxTokens": 100 }
        },
        {
          "timestamp": "2026-01-29T12:00:00.700Z",
          "level": "info",
          "event": "llm_response_received",
          "data": { "latency": 500, "contentLength": 120 }
        },
        {
          "timestamp": "2026-01-29T12:00:00.800Z",
          "level": "info",
          "event": "response_parsed",
          "data": { "intent": "greeting", "confidence": 0.95 }
        }
      ],
      "startedAt": "2026-01-29T12:00:00.000Z",
      "completedAt": "2026-01-29T12:00:01.000Z",
      "provenance": {
        "runnerId": "intent.llm",
        "runnerVersion": "1.0.0",
        "config": {
          "intents": ["greeting", "question", "complaint", "farewell"],
          "temperature": 0.3,
          "maxTokens": 100
        }
      }
    },
    "scores": [
      {
        "id": "score-1",
        "runId": "550e8400-e29b-41d4-a716-446655440000",
        "metric": "accuracy",
        "value": 1,
        "target": "final",
        "evidence": {
          "explanation": "Intent correctly identified as \"greeting\"",
          "alignment": {
            "expected": "greeting",
            "actual": "greeting"
          }
        },
        "evaluatorId": "intent.metrics",
        "createdAt": "2026-01-29T12:00:01.000Z"
      },
      {
        "id": "score-2",
        "runId": "550e8400-e29b-41d4-a716-446655440000",
        "metric": "confidence",
        "value": 0.95,
        "target": "final",
        "evidence": {
          "explanation": "Model confidence: 0.95",
          "snippets": ["User is saying hello"]
        },
        "evaluatorId": "intent.metrics",
        "createdAt": "2026-01-29T12:00:01.000Z"
      },
      {
        "id": "score-3",
        "runId": "550e8400-e29b-41d4-a716-446655440000",
        "metric": "latency",
        "value": 523,
        "target": "global",
        "evidence": {
          "explanation": "Execution took 523ms"
        },
        "evaluatorId": "intent.metrics",
        "createdAt": "2026-01-29T12:00:01.000Z"
      }
    ]
  }
}
```

### 2. 批量执行任务

**POST** `/api/eval/batch`

批量执行多个任务。

```bash
curl -X POST http://localhost:3001/api/eval/batch \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "task-1",
        "name": "Test 1",
        "type": "intent",
        "input": { "text": "Hello!" },
        "expected": { "intent": "greeting" },
        "metadata": {}
      },
      {
        "id": "task-2",
        "name": "Test 2",
        "type": "intent",
        "input": { "text": "How do I reset my password?" },
        "expected": { "intent": "question" },
        "metadata": {}
      },
      {
        "id": "task-3",
        "name": "Test 3",
        "type": "intent",
        "input": { "text": "This is not working!" },
        "expected": { "intent": "complaint" },
        "metadata": {}
      }
    ],
    "runnerId": "intent.llm",
    "config": {
      "intents": ["greeting", "question", "complaint", "farewell"],
      "temperature": 0.3,
      "maxTokens": 100
    },
    "evaluatorIds": ["intent.metrics"]
  }'
```

### 3. 获取运行记录

**GET** `/api/eval/runs/:id`

```bash
curl http://localhost:3001/api/eval/runs/550e8400-e29b-41d4-a716-446655440000
```

### 4. 获取评分记录

**GET** `/api/eval/runs/:id/scores`

```bash
curl http://localhost:3001/api/eval/runs/550e8400-e29b-41d4-a716-446655440000/scores
```

### 5. 获取完整结果

**GET** `/api/eval/runs/:id/result`

获取运行记录和评分记录的组合。

```bash
curl http://localhost:3001/api/eval/runs/550e8400-e29b-41d4-a716-446655440000/result
```

### 6. 列出运行记录

**GET** `/api/eval/runs`

支持过滤和分页。

```bash
# 列出所有运行
curl http://localhost:3001/api/eval/runs

# 按任务 ID 过滤
curl http://localhost:3001/api/eval/runs?taskId=task-1

# 按状态过滤
curl http://localhost:3001/api/eval/runs?status=completed

# 分页
curl http://localhost:3001/api/eval/runs?limit=10&offset=0
```

### 7. 对比两次运行

**POST** `/api/eval/compare`

对比两次运行的结果，计算指标差异。

```bash
curl -X POST http://localhost:3001/api/eval/compare \
  -H "Content-Type: application/json" \
  -d '{
    "runId1": "550e8400-e29b-41d4-a716-446655440000",
    "runId2": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "run1": {
      "run": { ... },
      "scores": [ ... ]
    },
    "run2": {
      "run": { ... },
      "scores": [ ... ]
    },
    "comparison": [
      {
        "metric": "accuracy",
        "value1": 1,
        "value2": 0.8,
        "diff": -0.2,
        "improved": false
      },
      {
        "metric": "latency",
        "value1": 523,
        "value2": 450,
        "diff": -73,
        "improved": true
      }
    ]
  }
}
```

### 8. 列出所有 Runners

**GET** `/api/eval/runners`

```bash
curl http://localhost:3001/api/eval/runners
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "intent.llm",
      "type": "intent",
      "version": "1.0.0"
    },
    {
      "id": "dialogue.llm",
      "type": "dialogue",
      "version": "1.0.0"
    },
    {
      "id": "memory.llm",
      "type": "memory",
      "version": "1.0.0"
    }
  ]
}
```

### 9. 列出所有 Evaluators

**GET** `/api/eval/evaluators`

```bash
curl http://localhost:3001/api/eval/evaluators
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "intent.metrics",
      "metrics": ["accuracy", "confidence", "latency"]
    },
    {
      "id": "dialogue.metrics",
      "metrics": ["relevance", "length", "latency"]
    },
    {
      "id": "memory.metrics",
      "metrics": ["accuracy", "memory_count", "latency"]
    }
  ]
}
```

## 错误处理

所有 API 在出错时返回统一的错误格式:

```json
{
  "success": false,
  "error": "Error message here"
}
```

常见错误:
- `400 Bad Request` - 请求参数错误
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器错误

## 完整示例: 端到端评测流程

```bash
#!/bin/bash

# 1. 列出可用的 Runners
echo "=== Available Runners ==="
curl -s http://localhost:3001/api/eval/runners | jq

# 2. 列出可用的 Evaluators
echo -e "\n=== Available Evaluators ==="
curl -s http://localhost:3001/api/eval/evaluators | jq

# 3. 执行评测
echo -e "\n=== Running Evaluation ==="
RESULT=$(curl -s -X POST http://localhost:3001/api/eval/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "task-1",
      "name": "Test Intent",
      "type": "intent",
      "input": { "text": "Hello!" },
      "expected": { "intent": "greeting" },
      "metadata": {}
    },
    "runnerId": "intent.llm",
    "config": {
      "intents": ["greeting", "question"],
      "temperature": 0.3,
      "maxTokens": 100
    }
  }')

echo $RESULT | jq

# 4. 提取 runId
RUN_ID=$(echo $RESULT | jq -r '.data.run.id')
echo -e "\n=== Run ID: $RUN_ID ==="

# 5. 获取完整结果
echo -e "\n=== Full Result ==="
curl -s http://localhost:3001/api/eval/runs/$RUN_ID/result | jq

# 6. 列出所有运行
echo -e "\n=== All Runs ==="
curl -s http://localhost:3001/api/eval/runs | jq '.data | length'
```

## 环境变量

在 `.env` 文件中配置:

```env
# LLM 配置
OPENAI_API_KEY=your-api-key-here
LLM_MODEL=gpt-4

# 服务器配置
PORT=3001
NODE_ENV=development

# CORS 配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 下一步

1. **测试 API** - 使用 Postman 或 curl 测试所有端点
2. **前端集成** - 更新前端调用新 API
3. **性能测试** - 测试并发和大批量场景
4. **文档完善** - 添加更多示例和最佳实践

查看 `phase3-completion-report.md` 了解更多详情。
