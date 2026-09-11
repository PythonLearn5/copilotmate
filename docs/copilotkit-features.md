# CopilotKit v2 功能测试文档

## 1. 架构概述

本项目使用 **CopilotKit v2**（`@copilotkit/react-core` `^1.71.0`），通过 Vercel AI Gateway 调用 OpenAI 模型。整体架构分为三层：

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                  │
│  CopilotKit Provider + v2 Hooks + UI Components      │
│  runtimeUrl → /api/copilotkit                         │
├─────────────────────────────────────────────────────┤
│  Backend (Next.js API Route)                          │
│  CopilotRuntime (v2) + BuiltInAgent + HttpAgent     │
│  createCopilotHonoHandler (single-route mode)         │
├─────────────────────────────────────────────────────┤
│  LLM Provider                                         │
│  Vercel AI Gateway (https://ai-gateway.vercel.sh/v1) │
│  Models: openai/gpt-4o, openai/gpt-4o-mini           │
└─────────────────────────────────────────────────────┘
         │
         │ HttpAgent → http://127.0.0.1:8000/copilotkit
         ▼
┌─────────────────────────────────────────────────────┐
│  Python Agent (LangGraph + CopilotKit SDK)           │
│  studybuddy_agent — AI 研究助手                       │
└─────────────────────────────────────────────────────┘
```

### 关键文件

| 文件 | 说明 |
|------|------|
| `src/app/api/copilotkit/route.ts` | 后端 Runtime 端点，注册 Agent |
| `src/components/CopilotKitProvider.tsx` | 前端 Provider 客户端包装组件 |
| `src/app/layout.tsx` | 根布局，加载 Provider 和 CSS |
| `src/app/chat/page.tsx` | 聊天页面 — `CopilotChat` |
| `src/app/todo/page.tsx` | 待办页面 — `CopilotPopup` |
| `src/app/spreadsheet/page.tsx` | 电子表格 — `CopilotSidebar` |
| `src/app/expensetracker/page.tsx` | 费用追踪 — `CopilotPopup` |
| `src/app/study-buddy/page.tsx` | StudyBuddy — 远程 Agent |
| `src/lib/hooks/use-tasks.tsx` | 待办列表 Hook（`useFrontendTool`） |
| `src/components/Spreadsheet/SingleSpreadsheet.tsx` | 电子表格工具 Hook |
| `agent/ai_researcher/model.py` | Python Agent 模型配置 |

---

## 2. 后端 Runtime 配置

### 2.1 端点与 Agent 注册

**文件**: `src/app/api/copilotkit/route.ts`

后端使用 v2 API 创建 Runtime，注册了两个 Agent：

| Agent | 类型 | 说明 |
|-------|------|------|
| `default` | `BuiltInAgent` | 使用 Vercel AI Gateway 的 `openai/gpt-4o` 模型，服务于 chat / todo / spreadsheet / expensetracker 页面 |
| `studybuddy_agent` | `HttpAgent` | 远程 Agent，连接到 Python 后端 `http://127.0.0.1:8000/copilotkit` |

### 2.2 端点处理器

使用 `createCopilotHonoHandler` 创建 Hono 单路由端点：

```typescript
const app = createCopilotHonoHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = handleRequest;
export const GET = handleRequest;
```

### 2.3 测试项

- [ ] `POST /api/copilotkit` 返回 200 且响应包含 agent 信息
- [ ] 未设置 `AI_GATEWAY_API_KEY` 时返回 500 错误
- [ ] Runtime 已注册 `default` 和 `studybuddy_agent` 两个 Agent
- [ ] `studybuddy_agent` 的 `HttpAgent` URL 指向 Python 后端

---

## 3. 前端 Provider 配置

### 3.1 CopilotKitProvider 包装组件

**文件**: `src/components/CopilotKitProvider.tsx`

v2 的 `CopilotKit` 组件使用 `new URL(runtimeUrl)` 构造 URL，因此需要绝对 URL。`CopilotKitProvider` 将相对路径（如 `/api/copilotkit`）转换为绝对路径：

```typescript
const absoluteUrl =
  typeof window !== "undefined" && !runtimeUrl.startsWith("http")
    ? `${window.location.origin}${runtimeUrl.startsWith("/") ? "" : "/"}${runtimeUrl}`
    : runtimeUrl;

<CopilotKit runtimeUrl={absoluteUrl} agentId={agent}>
```

### 3.2 根布局加载

**文件**: `src/app/layout.tsx`

- `CopilotKitProvider` 包裹整个应用，`runtimeUrl="/api/copilotkit"`，不指定 agent（使用 `default`）
- CSS 通过 `<link>` 标签加载 `/copilotkit-v2.css`（静态资源，绕过 PostCSS/Tailwind v3 不兼容 v4 的问题）

### 3.3 测试项

- [ ] `CopilotKitProvider` 正确将 `/api/copilotkit` 转换为 `http://localhost:3000/api/copilotkit`
- [ ] 服务端渲染时不报 `window is not defined` 错误
- [ ] `/copilotkit-v2.css` 成功加载（HTTP 200，非 404）
- [ ] CopilotKit 组件 CSS 样式正确渲染

---

## 4. UI 组件

### 4.1 CopilotChat

**使用页面**: `src/app/chat/page.tsx`

嵌入式聊天组件，直接渲染在页面中。

```tsx
<CopilotChat
  labels={{
    welcomeMessageText: "Hello! I'm your CopilotMate AI Assistant...",
  }}
/>
```

### 4.2 CopilotPopup

**使用页面**: `src/app/todo/page.tsx`、`src/app/expensetracker/page.tsx`

浮动弹出式聊天窗口，默认显示一个触发按钮。

```tsx
<CopilotPopup
  labels={{
    welcomeMessageText: "How can I help you with your to-do list?",
  }}
/>
```

### 4.3 CopilotSidebar

**使用页面**: `src/app/spreadsheet/page.tsx`

侧边栏聊天组件，`defaultOpen={true}` 默认展开。v2 中 `children` 使用 render-prop 模式：

```tsx
<CopilotSidebar defaultOpen={true}>
  {() => <Main />}
</CopilotSidebar>
```

### 4.4 CSS 自定义主题

所有页面通过 CSS 变量自定义 CopilotKit 组件外观：

```typescript
const style = {
  "--copilot-kit-primary-color": "#222222",
  "--copilot-kit-background-color": "#555555",
  "--copilot-kit-response-button-background-color": "#444444",
  "--copilot-kit-response-button-color": "#fff",
  "--copilot-kit-separator-color": "#666666",
  "--copilot-kit-muted-color": "#fff",
} as CSSProperties;
```

### 4.5 测试项

- [ ] **CopilotChat**: 页面加载后显示 `welcomeMessageText` 欢迎消息
- [ ] **CopilotChat**: 输入消息后 AI 正常回复
- [ ] **CopilotPopup**: 点击触发按钮后弹出聊天窗口
- [ ] **CopilotPopup**: 关闭后可重新打开
- [ ] **CopilotSidebar**: `defaultOpen=true` 时侧边栏自动展开
- [ ] **CopilotSidebar**: 内容区域（`Main` 组件）正确渲染
- [ ] **CSS 主题**: 自定义颜色变量正确应用到 CopilotKit 组件

---

## 5. v2 Hooks

### 5.1 useFrontendTool（前端工具）

v1 的 `useCopilotAction` 在 v2 中替换为 `useFrontendTool`，使用 **Zod schema** 定义参数：

```typescript
useFrontendTool({
  name: "addTask",
  description: "Adds a task to the todo list",
  parameters: z.object({
    title: z.string().describe("The title of the task"),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),
  handler: async ({ title, priority }) => {
    // 执行操作
    return "Task added successfully";
  },
  render: () => "Processing...",  // 可选渲染
});
```

#### 已注册的前端工具

| 页面 | 工具名 | 参数 | 说明 |
|------|--------|------|------|
| Todo | `addTask` | `title: string`, `priority?: enum` | 添加任务 |
| Todo | `deleteTask` | `id: number` | 删除任务 |
| Todo | `setTaskStatus` | `id: number`, `status: enum` | 设置任务状态 |
| Todo | `setTaskPriority` | `id: number`, `priority: enum` | 设置任务优先级 |
| Spreadsheet | `createSpreadsheet` | `rows: array`, `title?: string` | 创建电子表格（带预览组件） |
| Spreadsheet | `suggestSpreadsheetOverride` | `rows: array`, `title?: string` | 替换电子表格内容（带预览组件） |
| Spreadsheet | `appendToSpreadsheet` | `rows: array` | 追加行到电子表格 |
| ExpenseTracker | `addExpense` | `name: string`, `amount: number`, `date: string` | 添加费用 |
| ExpenseTracker | `deleteExpense` | `id: number` | 删除费用 |

### 5.2 useAgentContext（Agent 上下文）

v1 的 `useCopilotReadable` 在 v2 中替换为 `useAgentContext`，向 AI 提供应用状态的上下文信息：

```typescript
useAgentContext({
  description: "The state of the todo list",
  value: JSON.stringify(tasks),
});
```

#### 已注册的上下文

| 页面 | 描述 | 值 |
|------|------|----|
| Todo | "The state of the todo list" | `JSON.stringify(tasks)` |
| Spreadsheet (page) | "Today's date" | `new Date().toLocaleDateString()` |
| Spreadsheet (component) | "The current spreadsheet" | `JSON.stringify(spreadsheet)` |
| ExpenseTracker | "List of user expenses" | `JSON.stringify(expenses)` |

### 5.3 useAgent（Agent 控制）

v1 的 `useCoAgent` 在 v2 中替换为 `useAgent`，用于与远程 Agent 交互：

```typescript
const { agent } = useAgent({ agentId: "studybuddy_agent" });
```

**使用位置**:
- `HomeView.tsx` — 通过 `agent.addMessage()` 添加用户消息，`agent.runAgent()` 启动 Agent
- `ResultsView.tsx` — 通过 `agent.state` 读取 Agent 状态（steps、answer、references）

### 5.4 useConfigureSuggestions（建议配置）

v1 的 `useCopilotChatSuggestions` 在 v2 中替换为 `useConfigureSuggestions`：

```typescript
useConfigureSuggestions({
  instructions: "Suggest the most relevant actions related to spreadsheet.",
});
```

**使用位置**: chat、todo、spreadsheet、expensetracker 页面

### 5.5 测试项

- [ ] **useFrontendTool (addTask)**: 对话中输入"添加任务：买牛奶"后，任务列表出现新任务
- [ ] **useFrontendTool (deleteTask)**: 输入"删除任务 1"后，对应任务被删除
- [ ] **useFrontendTool (setTaskStatus)**: 输入"将任务1标记为完成"后，状态正确更新
- [ ] **useFrontendTool (setTaskPriority)**: 输入"将任务1优先级设为高"后，优先级更新
- [ ] **useFrontendTool (addExpense)**: 输入"添加一笔费用：咖啡 15元 今天"后，费用列表更新
- [ ] **useFrontendTool (deleteExpense)**: 输入"删除费用1"后，对应费用被删除
- [ ] **useFrontendTool (createSpreadsheet)**: 输入"创建一个3x3的电子表格"后，预览组件显示
- [ ] **useFrontendTool (suggestSpreadsheetOverride)**: 输入"将表格内容替换为..."后，预览组件显示
- [ ] **useFrontendTool (appendToSpreadsheet)**: 输入"追加一行数据"后，表格行数增加
- [ ] **useAgentContext**: AI 能感知到当前应用状态（如能回答"我有哪些任务"）
- [ ] **useConfigureSuggestions**: 输入框附近显示相关的建议提示
- [ ] **handler 返回值**: 所有 handler 函数返回 `Promise<unknown>`（v2 类型要求）

---

## 6. 页面级功能测试

### 6.1 Chat 页面 (`/chat`)

**组件**: `CopilotChat` + `useConfigureSuggestions`
**Agent**: `default` (BuiltInAgent + Vercel AI Gateway)

测试流程：
1. 打开 `/chat` 页面
2. 验证欢迎消息显示
3. 输入"你能做什么？"并发送
4. 验证 AI 回复内容与 CopilotMate 功能相关
5. 验证 `useConfigureSuggestions` 生成的建议

- [ ] 页面正常渲染，无控制台错误
- [ ] 聊天消息正常发送和接收
- [ ] AI 回复内容合理

### 6.2 Todo 页面 (`/todo`)

**组件**: `CopilotPopup` + `useFrontendTool` (4个工具) + `useAgentContext`
**Agent**: `default`

测试流程：
1. 打开 `/todo` 页面
2. 验证默认任务列表显示
3. 点击 Copilot Popup 图标打开聊天
4. 输入"添加任务：写报告，优先级高"
5. 验证任务列表新增一条高优先级任务
6. 输入"将任务1标记为完成"
7. 验证任务状态变为完成
8. 输入"我有哪些任务？"
9. 验证 AI 能基于 `useAgentContext` 回答当前任务状态

- [ ] 页面正常渲染
- [ ] 所有 4 个前端工具可被 AI 调用
- [ ] AI 能感知到当前任务列表状态

### 6.3 Spreadsheet 页面 (`/spreadsheet`)

**组件**: `CopilotSidebar` + `useFrontendTool` (3个工具) + `useAgentContext` (2个上下文)
**Agent**: `default`

测试流程：
1. 打开 `/spreadsheet` 页面
2. 验证侧边栏默认展开（`defaultOpen={true}`）
3. 验证电子表格内容区域正确渲染
4. 在侧边栏输入"创建一个包含姓名和年龄列的电子表格"
5. 验证 `PreviewSpreadsheetChanges` 预览组件显示
6. 点击确认后，新电子表格添加到列表
7. 输入"在当前表格追加一行：张三 25"
8. 验证表格行数增加

- [ ] 侧边栏默认展开
- [ ] `createSpreadsheet` 工具的 render 预览正常
- [ ] `suggestSpreadsheetOverride` 工具的 render 预览正常
- [ ] `appendToSpreadsheet` 工具的 render 预览正常
- [ ] AI 能感知当前电子表格内容和日期

### 6.4 ExpenseTracker 页面 (`/expensetracker`)

**组件**: `CopilotPopup` + `useFrontendTool` (2个工具) + `useAgentContext` + `useConfigureSuggestions`
**Agent**: `default`

测试流程：
1. 打开 `/expensetracker` 页面
2. 验证默认费用列表显示
3. 点击 Copilot Popup 打开聊天
4. 输入"添加一笔费用：午餐 30元 2024-10-15"
5. 验证费用列表新增一条记录
6. 输入"删除费用1"
7. 验证对应费用被删除
8. 输入"我的总支出是多少？"
9. 验证 AI 基于 `useAgentContext` 回答费用总额

- [ ] 页面正常渲染
- [ ] `addExpense` 工具正常调用
- [ ] `deleteExpense` 工具正常调用
- [ ] AI 能感知当前费用列表

### 6.5 StudyBuddy 页面 (`/study-buddy`)

**组件**: 独立 `CopilotKit` Provider + `useAgent` (2处) + Python Agent
**Agent**: `studybuddy_agent` (HttpAgent → Python 后端)

**独立 Provider 配置**:

```typescript
<CopilotKit runtimeUrl={runtimeUrl} agentId="studybuddy_agent">
```

测试流程：
1. 确保 Python 后端运行在 `http://127.0.0.1:8000`
2. 打开 `/study-buddy` 页面
3. 验证 `HomeView` 显示，包含输入框和建议列表
4. 在输入框输入"Effective study techniques"并按回车
5. 验证 `agent.addMessage()` 和 `agent.runAgent()` 被调用
6. 等待 Agent 响应，验证 `ResultsView` 显示
7. 验证 `agent.state` 包含 `steps` 和 `answer` 字段
8. 验证进度条（Progress 组件）正确显示研究步骤
9. 验证 Markdown 格式的答案正确渲染
10. 验证参考链接列表正确显示

- [ ] Python 后端连接成功（无 "Agent not found" 错误）
- [ ] `agent.addMessage()` 正确添加用户消息
- [ ] `agent.runAgent()` 正确触发 Agent 运行
- [ ] `agent.state.steps` 正确更新并显示进度
- [ ] `agent.state.answer.markdown` 正确渲染为 Markdown
- [ ] `agent.state.answer.references` 参考链接正确显示
- [ ] "Return" 按钮可返回首页

---

## 7. Python Agent 后端

### 7.1 模型配置

**文件**: `agent/ai_researcher/model.py`

Python 后端使用 LangChain `ChatOpenAI` 通过 Vercel AI Gateway 调用模型，按场景选择不同模型：

| 场景 | 模型 | 用途 |
|------|------|------|
| `planning` | `openai/gpt-4o-mini` | 拆解查询为步骤 |
| `search` | `openai/gpt-4o-mini` | 生成搜索查询 |
| `extract` | `openai/gpt-4o` | 从搜索结果中提取信息 |
| `summarize` | `openai/gpt-4o` | 生成最终摘要 |

### 7.2 Agent 状态结构

StudyBuddy Agent 通过 AG-UI 协议向前端推送状态：

```typescript
type ResearchAgentState = {
  steps?: {
    description?: string;
    status?: "complete" | "done" | "pending";
    updates?: string[];
  }[];
  answer?: {
    markdown?: string;
    references?: { url: string; title: string }[];
  };
};
```

### 7.3 测试项

- [ ] Python 后端启动正常（`http://127.0.0.1:8000`）
- [ ] `AI_GATEWAY_API_KEY` 环境变量已设置
- [ ] Agent 能正确执行研究流程（plan → search → extract → summarize）
- [ ] Agent 状态通过 AG-UI 协议实时推送到前端
- [ ] 各场景使用正确的模型（planning/search 用 4o-mini，extract/summarize 用 4o）

---

## 8. CSS 处理方案

### 8.1 问题

CopilotKit v2 的 CSS 使用 Tailwind v4 语法（`@property`、`@layer properties`），而项目使用 Tailwind v3，PostCSS 无法解析 v4 语法。

### 8.2 解决方案

1. 将 v2 CSS 复制到 `public/copilotkit-v2.css` 作为静态资源
2. 在 `layout.tsx` 中通过 `<link>` 标签加载（绕过 PostCSS）
3. 在 `next.config.mjs` 中使用 `NormalModuleReplacementPlugin` 将 `@copilotkit/react-core/dist/v2/index.css` 的 import 替换为空文件 `src/empty.css`

```javascript
config.plugins.push(
  new webpack.NormalModuleReplacementPlugin(
    /react-core[\\/]dist[\\/]v2[\\/]index\.css$/,
    path.resolve(__dirname, "src/empty.css")
  )
);
```

### 8.3 测试项

- [ ] 构建成功（`npx next build` 无错误）
- [ ] `/copilotkit-v2.css` 可通过 HTTP 访问（状态 200）
- [ ] CopilotKit 组件样式正确渲染（非无样式状态）
- [ ] `src/empty.css` 文件存在
- [ ] `NormalModuleReplacementPlugin` 正确拦截 CSS import

---

## 9. 环境变量

| 变量名 | 用途 | 必填 |
|--------|------|------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API Key（前端 + Python 后端共用） | 是 |
| `COPILOTKIT_REMOTE_ACTION_URL` | Python Agent 后端 URL，默认 `http://127.0.0.1:8000/copilotkit` | 否 |
| `AI_GATEWAY_MODEL` | 覆盖 Python Agent 所有场景使用的模型 | 否 |

---

## 10. v1 → v2 迁移对照表

| v1 | v2 | 说明 |
|----|-----|------|
| `@copilotkit/runtime` | `@copilotkit/runtime/v2` | Runtime 包入口 |
| `OpenAIAdapter` | `BuiltInAgent` + `@ai-sdk/gateway` | LLM 适配器 → Agent 内置模型 |
| `copilotRuntimeNextJSAppRouterEndpoint` | `createCopilotHonoHandler` | 端点处理器 |
| `useCopilotAction` | `useFrontendTool` | 前端工具（参数改用 Zod schema） |
| `useCopilotReadable` | `useAgentContext` | 上下文提供 |
| `useCoAgent` | `useAgent` | 远程 Agent 控制 |
| `useCopilotChatSuggestions` | `useConfigureSuggestions` | 聊天建议 |
| `labels.title` / `labels.initial` | `labels.welcomeMessageText` | 标签配置 |
| `agent` prop | `agentId` prop | Provider Agent 指定 |
| 相对 `runtimeUrl` | 绝对 `runtimeUrl` | v2 使用 `new URL()` 需要绝对路径 |
| `handler: () => {}` | `handler: async () => {}` | v2 要求返回 `Promise<unknown>` |
| `<CopilotSidebar><Main/></CopilotSidebar>` | `<CopilotSidebar>{() => <Main/>}</CopilotSidebar>` | children 改为 render-prop |
| `instructions` prop | 移除 | v2 不再在组件上设置 instructions |
| `@copilotkit/react-core/styles.css` | `/copilotkit-v2.css`（静态资源） | CSS 加载方式变更 |
