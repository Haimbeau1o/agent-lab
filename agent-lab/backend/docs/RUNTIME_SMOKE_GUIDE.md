# 运行时配置与 Smoke 指南（INT-006）

本文档用于统一后端启动说明、标准 smoke 命令，以及受限环境下的替代验证流程。

## 1. 必填环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

必须配置以下变量（缺一不可）：

```env
ENCRYPTION_KEY=your_32_character_encryption_key_here
ENCRYPTION_SALT=your_32_hex_character_salt_here
```

约束规则：

- `ENCRYPTION_KEY`：长度 >= 32 字符
- `ENCRYPTION_SALT`：十六进制字符串，长度 >= 32（至少 16 bytes）

快速生成示例：

```bash
node -e "const crypto=require('crypto'); console.log('ENCRYPTION_KEY=' + crypto.randomBytes(24).toString('hex')); console.log('ENCRYPTION_SALT=' + crypto.randomBytes(16).toString('hex'));"
```

## 2. 标准启动步骤

```bash
cd agent-lab/backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

默认服务地址：`http://localhost:3001`

## 3. 标准 Smoke 命令（验收口径）

后端启动后，执行以下 3 条命令：

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/eval/runners
curl http://localhost:3001/api/eval/definitions
```

期望结果：

- `/health` 返回 `{"status":"ok",...}`
- `/api/eval/runners` 返回 `success: true` 且 `data` 为非空数组
- `/api/eval/definitions` 返回 `success: true` 且 `data` 包含定义数据

## 4. 受限环境替代验证（无法监听 localhost:3001）

如果运行环境无法开放监听端口（常见于沙箱/受限 CI），可改用以下替代验证：

```bash
cd agent-lab/backend

# 1) 校验 ENCRYPTION_* 格式
ENCRYPTION_KEY="${ENCRYPTION_KEY:-12345678901234567890123456789012}" \
ENCRYPTION_SALT="${ENCRYPTION_SALT:-0123456789abcdef0123456789abcdef}" \
node -e "const key=process.env.ENCRYPTION_KEY||''; const salt=process.env.ENCRYPTION_SALT||''; if(key.length<32) throw new Error('ENCRYPTION_KEY must be at least 32 chars'); if(!/^[0-9a-fA-F]{32,}$/.test(salt)) throw new Error('ENCRYPTION_SALT must be hex and >=32 chars'); console.log('ENCRYPTION_* format check passed');"

# 2) 静态检查关键路由声明
rg "app.get\\('/health'" src/index.ts
rg "router.get\\('/runners'" src/api/eval/index.ts
rg "router.get\\('/definitions'" src/api/eval/index.ts

# 3) 编译检查（确认 TS 构建通过）
npm run build
```

说明：替代验证不依赖端口监听，但可覆盖配置合法性、关键路由存在性和编译可用性三项风险。

## 5. 常见失败与排查

- `ENCRYPTION_KEY environment variable must be set...`：密钥长度不足或为空
- `ENCRYPTION_SALT environment variable must be set...`：salt 非 hex 或长度不足
- `curl` 连接失败：后端未启动、端口冲突或受限环境禁止监听
- `/api/eval/definitions` 返回 404：当前分支未包含 definitions 路由，需要同步集成分支

## 6. Merge 前运行记录模板

为避免交接时缺少验收证据，建议在 PR merge 汇总中使用统一模板：

- 模板路径：[`docs/templates/MERGE_SUMMARY_TEMPLATE.md`](../../../docs/templates/MERGE_SUMMARY_TEMPLATE.md)
- 模板内已固定引用本指南：`agent-lab/backend/docs/RUNTIME_SMOKE_GUIDE.md`
