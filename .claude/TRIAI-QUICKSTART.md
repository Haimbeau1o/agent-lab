# Tri-AI 原生开发：快速入门指南

## 🎯 你的开发范式

```
Gemini 2.0 Flash     →  Claude Sonnet      →  Codex           →  Claude Code
   UI/UX生成            后端逻辑实现           调试与修复           编排与质检
   快速创意             可靠TDD开发           上下文感知          质量把关
   (Antigravity)        (CLI)               (CLI)              (CLI)
```

## 💻 实际工作环境配置

**你的工具栈：**
- **前端开发（Gemini）**：使用 Antigravity 编辑器，快速生成 UI 组件
- **后端开发（Claude）**：使用 Claude Code CLI，TDD 驱动后端逻辑
- **调试修复（Codex）**：使用 CLI 端，精准定位和修复错误
- **总编排（Claude Code）**：使用 CLI，协调整体工作流和质量把关

**工作流程切换：**
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

# 4. 如果遇到错误，使用 Codex（CLI）
/triai-debug "错误信息..."
```

## 🚀 快速参考

| 命令             | 用途       | 使用场景   |
| ------------ | -------- | ------ |
| `/plan`       | 架构决策     | 开始新功能时 |
| `/tdd`        | 测试驱动开发   | 所有后端代码 |
| `/code-review` | 质量检查     | 代码变更后  |
| `/e2e`        | 端到端测试    | 集成测试时  |
| `/build-fix`   | 修复构建错误   | 构建失败时  |

## 🛠️ 推荐技术栈

### Web 应用
```
Next.js 14 + TypeScript + TailwindCSS + Prisma
   ↓           ↓            ↓             ↓
 Web框架      类型         样式         数据库
            (Claude)     (Gemini)     (Claude)
```

### 桌面应用（强烈推荐 Tauri 🚀）
```
Tauri + React + TypeScript + Rust
  ↓      ↓       ↓            ↓
桌面   前端     类型         后端
框架   (Gemini)  (Claude)    (Claude)
```

**为什么推荐 Tauri：**
- ✅ 轻量：应用体积 ~5-10 MB（Electron ~100-200 MB）
- ✅ 安全：Rust 内存安全 + 系统权限控制
- ✅ 性能：低内存占用，启动快
- ✅ 跨平台：Windows, macOS, Linux
- ✅ AI 友好：Claude 擅长写 Rust，Gemini 擅长写前端

**适用场景：**
- 需要系统级功能（文件系统、系统托盘、快捷键）
- 需要离线工作
- 需要原生性能
- 工具类应用（编辑器、开发工具、效率工具）

### 移动端应用
```
React Native + TypeScript + Expo
      ↓           ↓            ↓
   移动框架      类型         开发工具
              (Claude)
```

## 📋 从 0 到 1 的 7 步流程

### 示例：构建"市场预测"功能

```bash
# 第 1 步：规划（Claude Opus）
/plan "构建市场预测功能，用户可以：
- 浏览活跃市场
- 对结果进行预测
- 追踪预测准确率
- 查看预测历史
技术栈：Next.js 14 + TypeScript + Prisma + PostgreSQL"

# → 输出：详细的实施计划（分阶段）

# 第 2 步：API 契约（手动 + Claude）
# 创建 types/api.ts
export interface Market {
  id: string
  question: string
  endsAt: Date
  status: 'active' | 'closed'
}

export interface Prediction {
  id: string
  marketId: string
  outcome: boolean
  confidence: number
}

# 第 3 步：后端开发（Claude Sonnet + TDD）
/tdd "创建市场 API：
- GET /api/markets - 列出所有市场
- GET /api/markets/:id - 获取单个市场
- POST /api/markets - 创建市场（仅管理员）
- POST /api/predictions - 进行预测
使用 Prisma，添加身份验证和速率限制"

# → 输出：经过测试的后端，覆盖率 80%+

# 第 4 步：前端开发（切换到 Antigravity + Gemini）
# 打开 Antigravity 编辑器
# 在 Antigravity 中向 Gemini 发送以下 prompt：

"生成市场浏览的 React 组件：
1. MarketList 组件 - 卡片网格布局
2. MarketCard 组件 - 单个市场卡片
3. MarketDetail 组件 - 完整市场视图
4. PredictionForm 组件 - 预测表单

技术要求：
- Next.js 14 使用 App Router
- TailwindCSS 样式
- 支持暗色模式
- 响应式设计（移动端优先）
- TypeScript 严格类型
- 无障碍访问（WCAG 2.1 AA）
- 加载和错误状态
- 使用 SWR 进行数据获取"

# → Gemini 在 Antigravity 中生成完整的 React 组件
# → 将生成的组件文件保存到 src/components/market/

# 第 5 步：代码审查（Claude Sonnet）
/code-review src/components/market/
/code-review src/app/api/markets/

# → 输出：发现并修复问题

# 第 6 步：集成（Claude Sonnet）
/plan "连接前端和后端：
- 更新 MarketList 从 /api/markets 获取数据
- 更新 PredictionForm POST 到 /api/predictions
- 添加错误处理
- 添加乐观更新"

# 第 7 步：测试与调试
# 如果测试失败，直接告诉 Claude
"测试失败了：[粘贴错误]，帮我修复"

# E2E 测试
/e2e "用户旅程：浏览市场 → 查看详情 → 进行预测 → 看到确认"

# 第 8 步：安全审查
/plan "对市场功能运行 security-reviewer"

# 第 9 步：部署
# 准备上线！🚀
```

## 🔑 核心原则

### 1. API 契约优先
在构建之前定义接口：
```typescript
// ✅ 好的做法：契约优先
interface Market {
  id: string
  question: string
}

// 然后构建匹配的后端
// 然后构建消费契约的前端
```

### 2. 后端使用 TDD
永远不要跳过测试：
```bash
/tdd "实现功能，覆盖率 80%+"
```

### 3. 审查所有代码
始终审查 AI 生成的代码：
```bash
/code-review [文件]
```

### 4. 系统化调试
遇到错误时：
```bash
# 直接告诉 Claude
"帮我调试这个错误：[完整错误上下文]"
```

## 📦 完整项目模板

### 文件结构
```
my-ai-native-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── markets/
│   │   │   │   ├── route.ts          # 后端（TDD）
│   │   │   │   └── route.test.ts     # 测试先行
│   │   │   └── predictions/
│   │   │       ├── route.ts
│   │   │       └── route.test.ts
│   │   ├── markets/
│   │   │   └── page.tsx              # 前端（Gemini）
│   │   └── layout.tsx
│   ├── components/
│   │   ├── market/
│   │   │   ├── MarketList.tsx        # UI（Gemini）
│   │   │   ├── MarketCard.tsx
│   │   │   └── MarketDetail.tsx
│   │   └── ui/
│   │       └── Button.tsx
│   ├── lib/
│   │   ├── db.ts                     # 数据库
│   │   └── utils.ts
│   └── types/
│       └── api.ts                    # 契约
├── tests/
│   └── e2e/
│       └── markets.spec.ts           # E2E 测试
└── prisma/
    └── schema.prisma
```

## 💡 典型工作流

### 添加新功能
```bash
# 1. 规划
/plan "添加 [功能名称]"

# 2. 定义类型（手动）
# 编辑 src/types/api.ts

# 3. 构建后端（TDD）
/tdd "为 [功能] 创建 API"

# 4. 生成前端（Gemini）
"为 [功能] 创建 React 组件"

# 5. 审查与集成
/code-review
/plan "连接前端和后端"

# 6. 测试
/e2e "测试 [功能] 用户旅程"

# 7. 安全检查
/plan "运行安全审查"
```

### 修复 Bug
```bash
# 1. 理解问题
阅读相关文件
重现错误

# 2. 调试（直接告诉 Claude）
"帮我调试：[错误上下文]"

# 3. 应用修复
根据建议编辑文件

# 4. 验证
npm test
npm run type-check

# 5. 添加回归测试
/tdd "为 [bug 场景] 添加测试"
```

### 重构
```bash
# 1. 代码审查
/code-review

# 2. 识别问题
# 审查输出

# 3. 带测试重构
/tdd "重构 [组件/函数] 同时保持测试"

# 4. 验证没有破坏性变更
npm test
/e2e "运行完整 E2E 测试套件"
```

## 🛡️ 质量关卡

每个功能必须通过：

- [ ] `/plan` 创建了详细计划
- [ ] `/tdd` 用于后端开发
- [ ] 80%+ 测试覆盖率
- [ ] `/code-review` 通过
- [ ] `/e2e` 测试通过
- [ ] 安全审查通过
- [ ] 无控制台错误
- [ ] TypeScript 严格模式
- [ ] 性能优化完成
- [ ] 文档完整

## 📚 资源库

### 内置技能
- `frontend-patterns` - React/Next.js 模式
- `backend-patterns` - API/数据库模式
- `tdd-workflow` - 测试驱动开发
- `security-review` - 安全检查清单
- `coding-standards` - 代码风格指南

### 代理（Agents）
- `planner` - 实施规划
- `architect` - 系统设计
- `code-reviewer` - 质量审查
- `security-reviewer` - 安全审计
- `tdd-guide` - TDD 强制执行
- `tri-ai-orchestrator` - **你的工作流协调器**

### 命令
- `/plan` - 规划模式
- `/tdd` - 测试驱动开发
- `/code-review` - 代码审查
- `/e2e` - E2E 测试
- `/build-fix` - 修复构建错误

## 🎓 学习路径

### 第 1 周：基础
- 用小功能练习
- 学习 TDD 工作流
- 熟悉代码审查

### 第 2 周：集成
- 构建全栈功能
- 连接前端和后端
- 掌握 E2E 测试

### 第 3 周：优化
- 性能调优
- 安全加固
- 错误处理

### 第 4 周：生产
- 监控设置
- 错误追踪
- 部署工作流

## ⚡ 专业技巧

1. **从小处着手** - 不要一次性构建所有功能
2. **测试先行** - 始终在实现之前编写测试
3. **频繁审查** - 不要批量代码审查
4. **记录决策** - 记录为什么，而不仅仅是做什么
5. **频繁提交** - 小而原子化的提交
6. **测量性能** - 优化前先分析
7. **安全第一** - 永远不要跳过安全审查
8. **从错误中学习** - 每个 bug 都是一课

## 🚨 常见陷阱

❌ **不要：**
- 跳过规划阶段
- 不写测试就写后端
- 不审查就使用 Gemini 生成的代码
- 忽略 TypeScript 错误
- 跳过安全审查
- 批量大量变更
- 绕过错误而不是修复

✅ **要：**
- 始终从 `/plan` 开始
- 所有后端代码使用 `/tdd`
- 审查所有 AI 生成的代码
- 立即修复类型错误
- 合并前运行安全检查
- 频繁提交并写清楚提交信���
- 遇到错误直接告诉 Claude 调试

## 🎯 成功指标

当你达到以下标准就是成功：
- ✅ 所有测试通过（单元、集成、E2E）
- ✅ 80%+ 代码覆盖率
- ✅ 严格模式下类型检查通过
- ✅ 无控制台错误或警告
- ✅ 安全审查通过
- ✅ 性能基准达标
- ✅ 文档完整
- ✅ 准备上线

---

**今天就开始构建你的 AI 原生产品！** 🚀

记住：Tri-AI 范式利用每个 AI 的优势：
- **Gemini** 用于快速、创意的 UI 生成（在 Antigravity 中使用）
- **Claude** 用于可靠、经过测试的后端逻辑（在 CLI 中使用）
- **Codex** 用于上下文感知的调试（在 CLI 中使用）
- **Claude Code** 用于编排和质量把控（在 CLI 中使用）

你是协调者。为任务选择合适的工具。

---

## 🛠️ Antigravity + Gemini 工作流详解

### 前端开发的完整流程

**1. 打开 Antigravity 编辑器**
```bash
# 启动 Antigravity
# 或者在你的项目中打开 Antigravity
```

**2. 准备好你的 Gemini Prompt**

在 Antigravity 中使用 Gemini 生成组件时，使用以下模板：

```
作为前端专家，生成一个 [组件名称]：

## 功能需求
- [详细描述功能]

## 技术栈
- 框架：Next.js 14 (App Router)
- 样式：TailwindCSS
- 类型：TypeScript (strict mode)
- 状态：React Hooks / Zustand / SWR
- 动画：Framer Motion（如需要）

## 组件要求
1. **Props 接口**：完整的 TypeScript 类型定义
2. **响应式设计**：移动端优先，支持 320px - 1920px
3. **暗色模式**：使用 Tailwind 的 dark: 前缀
4. **可访问性**：
   - 语义化 HTML 标签
   - ARIA 标签（如需要）
   - 键盘导航支持
   - 焦点管理
5. **状态管理**：
   - 加载状态（显示骨架屏或 spinner）
   - 错误状态（友好的错误提示）
   - 空状态（无数据时的提示）
6. **性能优化**：
   - 使用 React.memo 避免不必要的重渲染
   - 使用 useMemo 缓存计算结果
   - 使用 useCallback 稳定函数引用

## API 集成
- API 端点：[API 端点路径]
- 请求方法：[GET/POST/PUT/DELETE]
- 数据格式：[TypeScript 接口定义]

## 样式要求
- 使用 TailwindCSS utility classes
- 颜色方案：[指定颜色]
- 圆角：统一使用 rounded-lg
- 阴影：subtle shadows
- 过渡：all transitions 应该有 duration-200

请提供：
1. 完整的组件代码（带注释）
2. Props 接口定义
3. 使用示例
4. 建议的测试用例
```

**3. 在 Antigravity 中生成代码**

- 在 Antigravity 编辑器中打开或创建组件文件
- 调用 Gemini，粘贴上面的 prompt
- Gemini 会直接在编辑器中生成代码

**4. 保存并回到 Claude Code CLI**

```bash
# 保存 Antigravity 中的文件后，回到 CLI
# 运行代码审查
/code-review src/components/[component-name]

# 如果需要修复
/plan "根据审查结果修复组件问题"
```

### Antigravity 优势

**为什么在 Antigravity 中使用 Gemini：**
- ✅ **实时生成**：Gemini 直接在编辑器中生成代码
- ✅ **上下文感知**：Gemini 看到你的整个文件结构
- ✅ **快速迭代**：可以立即看到结果并要求修改
- ✅ **多文件支持**：可以同时生成相关的多个文件
- ✅ **无缝集成**：生成的代码直接保存，无需复制粘贴

### 典型的前端开发会话

```bash
# Step 1: 在 Claude Code CLI 中规划
/plan "创建用户设置页面，包含：
- 个人信息表单
- 偏好设置
- 密码修改
- 账户删除"

# Step 2: 切换到 Antigravity
# 打开 Antigravity 编辑器
# 对 Gemini 说："生成用户设置页面组件"
# Gemini 生成所有需要的组件

# Step 3: 回到 Claude Code CLI
/code-review src/components/settings/
npm run type-check
npm run lint

# Step 4: 如果有问题，回到 Antigravity 修改
# 或者在 Claude Code 中直接修复

# Step 5: 集成和测试
/plan "集成设置页面到应用路由"
npm test
```

---

## 🔄 CLI 和 Antigravity 的切换时机

### 在 CLI 中（Claude Code）做这些：
- ✅ 功能规划和架构设计
- ✅ 后端 API 开发（TDD）
- ✅ 代码审查和质量检查
- ✅ 集成和连接组件
- ✅ 调试和错误修复
- ✅ 测试编写和运行
- ✅ Git 操作和提交
- ✅ 安全审查

### 在 Antigravity 中做这些：
- ✅ UI 组件生成
- ✅ 样式调整和优化
- ✅ 组件重构和美化
- ✅ 动画和交互效果
- ✅ 响应式布局调整
- ✅ 暗色模式实现
- ✅ 可访问性改进

### 工具选择决策树

```
需要做什么？
├─ 生成新的 UI 组件？
│  └─→ Antigravity + Gemini
├─ 创建 API 接口？
│  └─→ Claude Code CLI + TDD
├─ 修复 bug？
│  └─→ Claude Code CLI + Codex
├─ 审查代码质量？
│  └─→ Claude Code CLI
├─ 调整样式和布局？
│  └─→ Antigravity + Gemini
└─ 集成前后端？
   └─→ Claude Code CLI
```

---

## 💡 效率提示

**1. 保持两个终端/窗口打开**
- 终端 1：Claude Code CLI
- 窗口 2：Antigravity 编辑器

**2. 使用快捷键快速切换**
- 在终端和编辑器之间快速切换
- 复制粘贴错误信息和代码片段

**3. 统一的项目结构**
- CLI 和 Antigravity 访问同一个项目目录
- 文件更改实时同步

**4. 版本控制**
- 在 CLI 中使用 Git 提交代码
- 清晰的提交消息记录每次变更

**5. 错误处理流程**
```bash
# 如果 Gemini 生成的代码有错误
# 1. 复制错误信息
# 2. 在 CLI 中直接告诉 Claude
"帮我修复这个错误：[粘贴错误]"

# 3. 应用修复
# 4. 如果是前端问题，可以告诉 Gemini 在 Antigravity 中修复
# 5. 如果是后端问题，在 CLI 中直接修复
```
