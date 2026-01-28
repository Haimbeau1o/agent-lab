# API 快速参考

## Base URL
```
http://localhost:3001/api
```

## 核心 API 端点

### 1. API 配置
```bash
# 创建 API 配置
POST /api/settings/api-config
{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "apiKey": "sk-proj-xxxxx",
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-4",
  "isDefault": true
}

# 测试连接
POST /api/settings/api-config/:id/test

# 获取所有配置
GET /api/settings/api-config
```

### 2. Agent 管理
```bash
# 获取所有 Agent
GET /api/agents?type=intent

# 获取单个 Agent
GET /api/agents/:id

# 创建 Agent
POST /api/agents
{
  "name": "我的Agent",
  "type": "intent",
  "description": "描述",
  "config": { ... },
  "systemPrompt": "..."
}
```

### 3. 任务管理
```bash
# 获取所有任务
GET /api/tasks?type=intent

# 创建任务
POST /api/tasks
{
  "name": "测试任务",
  "description": "描述",
  "type": "intent",
  "testCases": [
    {
      "input": "我要退款",
      "expected": { "intent": "refund" }
    }
  ]
}
```

### 4. 测试运行
```bash
# 执行测试（异步）
POST /api/test-runs
{
  "agentId": "xxx",
  "taskId": "xxx",
  "apiConfigId": "xxx"
}
# 返回 202 Accepted

# 获取测试状态
GET /api/test-runs/:id

# 获取测试报告
GET /api/test-runs/:id/report
```

## 完整工作流

```bash
# 1. 配置 API Key
curl -X POST http://localhost:3001/api/settings/api-config \
  -H "Content-Type: application/json" \
  -d '{"name":"OpenAI","provider":"openai","apiKey":"sk-...","baseUrl":"https://api.openai.com/v1","modelName":"gpt-4","isDefault":true}'

# 2. 查看可用 Agent
curl http://localhost:3001/api/agents

# 3. 创建任务
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","type":"intent","description":"测试","testCases":[{"input":"你好","expected":{"intent":"greeting"}}]}'

# 4. 执行测试
curl -X POST http://localhost:3001/api/test-runs \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID","taskId":"TASK_ID","apiConfigId":"API_CONFIG_ID"}'

# 5. 轮询状态
curl http://localhost:3001/api/test-runs/TEST_RUN_ID

# 6. 获取报告
curl http://localhost:3001/api/test-runs/TEST_RUN_ID/report
```

## 数据格式

### 意图识别测试用例
```json
{
  "input": "用户输入文本",
  "expected": {
    "intent": "意图名称",
    "confidence": 0.9
  }
}
```

### 多轮对话测试用例
```json
{
  "input": {
    "turns": [
      { "role": "user", "content": "消息" },
      { "role": "assistant", "content": "回复" }
    ]
  },
  "expected": {
    "slots": { "key": "value" }
  }
}
```

### 记忆测试用例
```json
{
  "input": {
    "history": [
      { "role": "user", "content": "我叫张三" }
    ],
    "query": "你还记得我的名字吗？"
  },
  "expected": {
    "recall": ["user_name"]
  }
}
```

## 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 202 | 已接受（异步任务）|
| 204 | 成功（无内容）|
| 400 | 请求错误 |
| 403 | 禁止操作 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 响应格式

### 成功
```json
{
  "data": { ... }
}
```

### 错误
```json
{
  "error": {
    "message": "错误信息",
    "details": []
  }
}
```

## 测试状态

| 状态 | 说明 |
|------|------|
| pending | 等待执行 |
| running | 执行中 |
| completed | 已完成 |
| failed | 失败 |
