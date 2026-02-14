# Merge 汇总模板（运行时配置与 Smoke）

> 用途：用于 issue5-9 链路合并前的运行记录留档，确保配置、smoke 与受限环境验证证据完整。

## 1) 基本信息

- Issue: `#`
- PR: `#`
- Branch: ``
- 执行日期: `YYYY-MM-DD`
- 执行人: ``

## 2) 必填配置检查

- [ ] `ENCRYPTION_KEY` 已配置且长度 >= 32
- [ ] `ENCRYPTION_SALT` 已配置且为 hex，长度 >= 32

示例（脱敏后）：

```env
ENCRYPTION_KEY=********************************
ENCRYPTION_SALT=********************************
```

## 3) 标准 Smoke 结果

执行命令：

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/eval/runners
curl http://localhost:3001/api/eval/definitions
```

结果记录：

- `/health`: `status=ok` / `timestamp=...`
- `/api/eval/runners`: `success=true` / `data.length=...`
- `/api/eval/definitions`: `success=true` / `definitions=...`

## 4) 受限环境替代验证（如适用）

- [ ] `ENCRYPTION_*` 格式检查通过
- [ ] 路由声明静态检查通过
- [ ] `npm run build` 通过

附：关键输出片段（粘贴日志）

```text
<paste logs here>
```

## 5) 文档引用

- 运行时配置与 Smoke 指南：[`agent-lab/backend/docs/RUNTIME_SMOKE_GUIDE.md`](../../agent-lab/backend/docs/RUNTIME_SMOKE_GUIDE.md)
