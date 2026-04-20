# CLAUDE.md — Trading Review Wiki

## 项目概述

**Trading Review Wiki** — A股交易复盘知识库应用。LLM 自动从交易资料（研报、交割单、笔记）构建结构化知识库，支持对话查询、知识图谱、Deep Research、交易订单导入与 FIFO 盈亏计算。

**仓库**: https://github.com/ymj8903668-droid/trading-review-wiki
**版本**: 0.6.x（遵循 semver）
**许可证**: GNU GPL v3.0

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Tauri v2 (Rust 后端) |
| 前端 | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v4 + CVA |
| 编辑器 | Milkdown (ProseMirror) |
| 图表/图谱 | sigma.js + graphology + ForceAtlas2 |
| 状态管理 | Zustand |
| 国际化 | react-i18next |

---

## 开发命令

```bash
# 前端热重载开发
npm run dev

# 完整桌面应用开发（Rust 后端 + 前端）
npm run tauri dev

# 生产构建（生成可执行文件）
npm run tauri build

# 仅前端构建（dist/）
npm run build

# 单元测试
npm run test

# TypeScript 类型检查
npx tsc --noEmit
```

**首次设置**:
```bash
npm install
# Tauri CLI 环境自动检测，会提示安装 Rust（如果未安装）
```

---

## 代码规范

### 目录结构
```
src/                    # React 前端源码
  commands/             # Tauri 命令封装（Rust IPC 调用）
  components/           # React 组件（按功能分组）
  i18n/                 # 国际化文案
  lib/                  # 工具函数、辅助逻辑
  stores/               # Zustand 状态存储
  types/                # TypeScript 类型定义
src-tauri/              # Rust 后端（Tauri 核心逻辑）
  src/
    commands.rs         # Tauri 命令实现（文件读写、进程调用）
```

### 组件规范
- **组件文件**: PascalCase，如 `ChatMessage.tsx`
- **Store 文件**: `<name>-store.ts`，如 `activity-store.ts`
- **工具函数**: camelCase，如 `format-date.ts`
- **组件放在 `components/`** 按功能/页面组织，不要扁平堆叠

### TypeScript
- 严格模式：启用 `strict: true`
- 优先使用 `interface`，类型推导能推断时不写类型注解
- API 响应结构定义在 `types/` 目录
- 避免 `any`，用 `unknown` + 类型守卫

### Tailwind CSS
- 使用 Tailwind v4（CSS-first 配置，在 `index.css` 中用 `@theme` 定义设计系统变量）
- 颜色、间距、圆角优先用 design token（CSS 变量），不用硬编码值
- 使用 CVA（class-variance-authority）管理组件多变体

---

## 版本管理

### 语义化版本（semver）
- **MAJOR**: 不兼容的 API 变更（如 Tauri v1 → v2 级别）
- **MINOR**: 新增功能（向后兼容）
- **PATCH**: Bug 修复（向后兼容）

### CHANGELOG 规范（必须遵守）
文件：`CHANGELOG.md`，语言：**中文**

格式：
```markdown
## v0.6.6 — 2026-04-19

### 修复（Bug Fix）
- **修复 XXX 问题**：[文件] 问题描述。已修复描述。

### 改进（Improvement）
- **优化 XXX**：[文件] 改进内容

### 新功能（Feature）
- **新增 XXX**：功能描述

---

## Git 工作流

### 分支命名
```
feature/<功能名>        # 新功能，如 feature/vector-search
fix/<问题描述>          # Bug 修复，如 fix/save-to-wiki-loop
chore/<任务>           # 杂项，如 chore/update-deps
```

### 提交信息（Conventional Commits）
```
fix: 修复 Save to Wiki 无限循环
feat: 新增向量语义搜索（可选）
chore: 升级依赖到 React 19
docs: 更新 README
```

### 发布流程
1. 在 `CHANGELOG.md` 顶部添加新版本条目（版本号 + 日期 + 变更说明）
2. `npm run tauri build` 生成安装包（Windows: `.msi`，macOS: `.dmg`）
3. Git tag: `git tag v0.6.7 && git push origin v0.6.7`
4. GitHub Actions 自动构建并发布到 Releases

**注意**: 不要在 CHANGELOG.md 的小标题里写英文缩写（如 `fix`），全用中文。

---

## 常见任务参考

### 修复 Bug
1. 用 `npm run tauri dev` 本地复现
2. 定位问题文件（优先看 `src/` 下相关组件/Store）
3. 修复后手动验证
4. 更新 CHANGELOG.md（修复条目）
5. Commit → Push →（必要时）打 tag 发布

### 新增功能
1. 在 `src/` 相关目录添加组件/逻辑
2. 用 `npm run tauri dev` 验证 UI
3. 添加对应 i18n 文案（`src/i18n/`）
4. 更新 CHANGELOG.md（新功能条目）
5. Commit → Push → 打 tag

### 上传到 GitHub
```bash
git add .
git commit -m "fix: 修复 Save to Wiki 无限循环"
git push origin main
# 如果有 tag 需要同步：
git push origin v0.6.7
```

---

## 重要项目约定

- **Wiki 输出目录使用中文命名**：写入 `wiki/股票/`、`wiki/概念/`、`wiki/查询/` 等中文目录，不创建英文目录
- **文件路径标准化**：所有路径用 `normalizePath()` 统一处理（避免 Windows `\` 和 `/` 混乱）
- **Rust 后端文件操作**：优先用 Tauri 命令（`commands.rs`），不要在前端直接 fs 操作
- **auto-ingest 异步处理**：耗时操作通过队列串行处理，支持取消和重试
- **对话持久化**：Chat 历史存在 `.llm-wiki/chats/` 下，重启不丢失

---

## 项目特定背景（给 AI 的上下文）

这个 Wiki 应用是杰哥的 A股交易复盘工具。核心用户是杰哥本人，背景：
- A股多年实战经验，有完整交易体系
- 关注情绪周期、龙头战法、仓位管理
- 知识库内容来源：公众号文章、朋友圈、群聊消息、研报、交割单

这意味着：
- 界面语言默认中文
- 生成的 Wiki 页面要有交易视角（股票、板块、情绪、策略）
- FIFO 盈亏计算要精确（浮点精度用 Rust 后端保证 4 位小数）
