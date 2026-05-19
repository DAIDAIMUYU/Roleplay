# 角色酒馆 (Roleplay Tavern) v4.3

AI 角色扮演聊天应用，支持 DeepSeek / OpenAI-compatible 等多 Provider，具备角色卡、提示词模板、世界书、记忆系统、消息版本历史、数据导出导入等完整产品功能。

## 技术栈

- **前端**: Vite 5 + React 18 + TypeScript 5 + Tailwind CSS 3
- **路由**: React Router 6
- **后端服务**: Supabase (Auth + Database + RLS + Edge Functions)
- **AI Provider**: DeepSeek / OpenAI-compatible (BYOK) + 托管加密 (Edge Function 代理)

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build
```

## 运行模式

| 模式 | 说明 |
|------|------|
| Demo 访客 | 不登录即可体验 Mock AI，不写库不调真实 API |
| 用户登录 | 使用自己的 API Key（本地 BYOK 或托管加密） |
| Admin | 运营管理（预留） |
| Owner | 站主最高权限（预留） |

## API 配置模式

- **仅本次会话**: API Key 保存在内存中，关闭标签页后清除
- **当前设备**: API Key 加密保存在浏览器 localStorage
- **托管加密 / 跨设备同步**: API Key 在服务端 AES-GCM 加密保存，通过 Edge Function 代理调用，多设备自动同步

## 项目结构

```
src/
  app/          App Shell + Router
  pages/        9 个路由页面
  features/
    auth/       Supabase Auth + AuthProvider
    roleplay/
      providers/     Provider Gateway (Mock/DeepSeek/OpenAI)
      hooks/         核心聊天 Hook (useChatSession)
      components/    聊天 UI / Studio 编辑器 / Context Preview
      repositories/  数据库访问层 (Repository 模式)
      services/      数据管理 / 托管凭据服务
      storage/       API Key 本地存储
supabase/
  migrations/   8 个 SQL 迁移文件 (0001-0008)
  functions/    6 个 Edge Functions
docs/
  roleplay-tavern/  产品文档 / 阶段验收 / 执行记录
```

## 文档索引

- [部署上线指南](docs/roleplay-tavern/部署上线指南.md)
- [用户使用指南](docs/roleplay-tavern/用户使用指南.md)
- [阶段验收清单](docs/roleplay-tavern/19_阶段验收清单_阶段0-10.md)
- [阶段路线](docs/roleplay-tavern/12_阶段路线_阶段0-10_最终明确版.md)

## 开发约定

- 组件不直接调用 Supabase，必须经过 Repository 层
- API Key 不入库、不上传服务器（BYOK 模式）
- Demo 模式不写库、不调用真实 AI
- 不删除 docs/ supabase/ README.md .env.example
