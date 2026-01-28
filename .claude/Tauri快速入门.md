# Tauri + Tri-AI 工作流：桌面应用开发指南

## 🎯 为什么选择 Tauri？

### 对比 Electron

| 特性 | Tauri | Electron |
|------|-------|----------|
| **应用体积** | ~5-10 MB | ~100-200 MB |
| **内存占用** | ~50-100 MB | ~200-500 MB |
| **后端语言** | Rust | Node.js |
| **安全性** | 高（默认安全） | 中（需手动配置） |
| **启动速度** | 快 | 较慢 |
| **学习曲线** | 需学 Rust | 熟悉 Node.js |
| **AI 代码生成** | Claude 擅长 Rust | Claude 擅长 JS/TS |

**结论：** Tauri 更现代、更轻量、更安全，完美适合 AI Native 开发！

---

## 🚀 快速开始

### 安装 Tauri CLI

```bash
# 使用 cargo（Rust 包管理器）
cargo install tauri-cli

# 或使用 npm（推荐）
npm install -g @tauri-apps/cli
```

### 创建新项目

```bash
# 使用 create-tauri-app
npm create tauri-app

# 选择模板：
# - React + TypeScript
# - Vue + TypeScript
# - Svelte + TypeScript
```

---

## 📋 Tri-AI 工作流（Tauri 版）

### 完整开发流程

```bash
# ═════════════════════════════════════════
# 第 1 步：规划（Claude Code CLI）
# ═════════════════════════════════════════
/plan "用 Tauri 构建笔记应用：
- 系统托盘图标
- 全局快捷键（Ctrl+Shift+N）
- Markdown 编辑器
- 本地 SQLite 存储
- 自动保存
- 导出 PDF

技术栈：
- 前端：React + TypeScript + TailwindCSS
- 后端：Rust + Tauri API + SQLite
- 构建工具：Vite"

# 输出：详细的实施计划

# ═════════════════════════════════════════
# 第 2 步：后端开发 - Rust（CLI + TDD）
# ═════════════════════════════════════════
/tdd "创建 Tauri 后端命令：

1. 文件操作
   - 读取笔记文件
   - 保存笔记内容
   - 创建/删除笔记
   - 扫描笔记目录

2. 数据库操作
   - SQLite 初始化
   - CRUD 操作
   - 搜索索引

3. 系统集成
   - 系统托盘菜单
   - 全局快捷键注册
   - 系统通知

技术要求：
- 使用 Rust
- Tauri 2.0 API
- serde 序列化
- 错误处理（thiserror）
- 单元测试（覆盖所有函数）
- 集成测试（测试 Tauri 命令）"

# 输出：经过测试的 Rust 后端代码

# ═════════════════════════════════════════
# 第 3 步：前端开发 - Web（Antigravity + Gemini）
# ═════════════════════════════════════════
# 切换到 Antigravity 编辑器

# 向 Gemini 发送 prompt：
"生成 Tauri + React 笔记应用前端组件：

1. 主窗口布局
   - 侧边栏（笔记列表）
   - 编辑器区域
   - 预览面板

2. 组件要求：
   - App.tsx - 主布局
   - Sidebar.tsx - 笔记列表
   - Editor.tsx - Markdown 编辑器
   - Preview.tsx - Markdown 预览
   - Toolbar.tsx - 工具栏

技术要求：
- React 18 + TypeScript
- TailwindCSS 样式
- react-markdown Markdown 渲染
- Tauri invoke API 调用后端
- 自动保存（防抖）
- 快捷键支持
- 暗色模式

3. Tauri 集成：
   - import { invoke } from '@tauri-apps/api/core'
   - 调用 Rust 后端命令
   - 错误处理
   - Loading 状态

请提供：
- 完整组件代码
- TypeScript 类型定义
- Tauri API 调用示例
- 样式配置"

# 输出：完整的前端组件

# ═════════════════════════════════════════
# 第 4 步：代码审查（CLI）
# ═════════════════════════════════════════
/code-review src-tauri/src/
/code-review src/

# ═════════════════════════════════════════
# 第 5 步：集成和测试（CLI）
# ═════════════════════════════════════════
/plan "集成前后端：
- 连接前端和 Rust 后端
- 实现自动保存
- 添加错误处理
- 实现全局快捷键
- 添加系统托盘"

# ═════════════════════════════════════════
# 第 6 步：构建和调试
# ═════════════════════════════════════════
# 开发模式
npm run tauri dev

# 如果遇到错误
"帮我修复这个 Tauri 错误：[粘贴错误]"

# ═════════════════════════════════════════
# 第 7 步：构建发布版本
# ═════════════════════════════════════════
# 构建应用
npm run tauri build

# 输出：
# src-tauri/target/release/bundle/
#   ├── dmg/          # macOS 安装包
#   ├── msi/          # Windows 安装包
#   └── deb/          # Linux 安装包

# 🎉 完成！
```

---

## 📁 项目结构

```
my-tauri-app/
├── src/                    # 前端代码（React）
│   ├── components/
│   │   ├── Editor.tsx      # Markdown 编辑器（Gemini 生成）
│   │   ├── Sidebar.tsx     # 侧边栏（Gemini 生成）
│   │   └── Preview.tsx     # 预览面板（Gemini 生成）
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # 后端代码（Rust）
│   ├── src/
│   │   ├── commands.rs     # Tauri 命令（Claude + TDD）
│   │   ├── db.rs          # 数据库操作（Claude + TDD）
│   │   └── lib.rs         # 主入口
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── package.json
└── tsconfig.json
```

---

## 💡 Tauri 后端示例（Rust）

### 定义命令

```rust
// src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub updated_at: i64,
}

#[tauri::command]
pub async fn read_note(note_path: PathBuf) -> Result<Note, String> {
    // 读取笔记文件
    let content = fs::read_to_string(&note_path)
        .map_err(|e| e.to_string())?;

    // 解析笔记
    let note = Note {
        id: uuid::Uuid::new_v4().to_string(),
        title: "Note Title".to_string(),
        content,
        updated_at: chrono::Utc::now().timestamp(),
    };

    Ok(note)
}

#[tauri::command]
pub async fn save_note(note: Note) -> Result<(), String> {
    // 保存笔记到文件
    fs::write("note.md", note.content)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn list_notes() -> Result<Vec<Note>, String> {
    // 扫描笔记目录
    let notes = vec![
        // ... 返回笔记列表
    ];

    Ok(notes)
}
```

### 注册命令

```rust
// src-tauri/src/lib.rs
mod commands;
mod db;

use commands::{read_note, save_note, list_notes};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_note,
            save_note,
            list_notes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 🎨 前端调用示例（React）

```typescript
// src/components/Editor.tsx
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: number;
}

export function Editor() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  // 读取笔记
  const loadNote = async (id: string) => {
    setLoading(true);
    try {
      const result = await invoke<Note>('read_note', {
        notePath: `/notes/${id}.md`
      });
      setNote(result);
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存笔记
  const saveNote = async (content: string) => {
    if (!note) return;

    try {
      await invoke('save_note', {
        note: { ...note, content }
      });
      console.log('Note saved!');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return (
    <div className="editor">
      {loading ? (
        <div>Loading...</div>
      ) : note ? (
        <textarea
          value={note.content}
          onChange={(e) => saveNote(e.target.value)}
          className="w-full h-screen p-4"
        />
      ) : null}
    </div>
  );
}
```

---

## 🧪 测试策略

### 后端测试（Rust）

```rust
// src-tauri/src/commands_tests.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_read_note() {
        let note = read_note(PathBuf::from("test.md")).await;
        assert!(note.is_ok());
    }

    #[tokio::test]
    async fn test_save_note() {
        let note = Note {
            id: "1".to_string(),
            title: "Test".to_string(),
            content: "Content".to_string(),
            updated_at: 0,
        };

        let result = save_note(note).await;
        assert!(result.is_ok());
    }
}
```

### 前端测试（React）

```bash
# 使用 React Testing Library
npm test -- Editor.test.tsx
```

---

## 🚀 构建和发布

### 开发模式

```bash
npm run tauri dev
```

### 生产构建

```bash
# 构建所有平台
npm run tauri build

# 只构建当前平台
npm run tauri build -- --target universal-apple-darwin  # macOS
npm run tauri build -- --target x86_64-pc-windows-msvc # Windows
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### 输出文件

```
src-tauri/target/release/bundle/
├── dmg/              # macOS .dmg 文件
│   └── My App_1.0.0_x64.dmg
├── msi/              # Windows .msi 文件
│   └── My App_1.0.0_x64_en-US.msi
└── deb/              # Linux .deb 文件
    └── my-app_1.0.0_amd64.deb
```

---

## 🎯 最佳实践

### 1. 安全性

```rust
// ✅ 使用 Tauri 的权限系统
"tauri": {
  "allowlist": {
    "fs": {
      "scope": ["$APPDATA/notes/*"]  // 只允许访问特定目录
    }
  }
}

// ❌ 不要允许任意文件访问
"allowlist": {
  "fs": {
    "all": true,  // 危险！
  }
}
```

### 2. 错误处理

```rust
// ✅ 返回详细的错误信息
#[tauri::command]
pub async fn save_note(note: Note) -> Result<(), String> {
    fs::write("note.md", note.content)
        .map_err(|e| format!("Failed to save note: {}", e))?;

    Ok(())
}
```

### 3. 性能优化

```typescript
// ✅ 使用防抖避免频繁保存
import { debounce } from 'lodash';

const debouncedSave = debounce(saveNote, 500);

// 用户输入时调用
onChange={(e) => debouncedSave(e.target.value)}
```

---

## 📚 学习资源

- [Tauri 官方文档](https://tauri.app/v1/guides/)
- [Rust 入门](https://www.rust-lang.org/learn)
- [Tauri + React 示例](https://github.com/tauri-apps/tauri/tree/dev/examples/api)

---

## 🎉 总结

**Tauri + Tri-AI 的优势：**

1. **轻量快速** - 应用体积小，启动快
2. **安全可靠** - Rust 内存安全
3. **AI 友好** - Claude 擅长 Rust，Gemini 擅长前端
4. **跨平台** - 一套代码，多平台运行
5. **现代化** - 2024 年最佳选择

**开始用 Tauri 构建你的 AI Native 桌面应用吧！** 🚀
