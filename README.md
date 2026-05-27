# Roleplay Tavern — 本地优先的 AI 角色酒馆

一个**本地优先**、可选云端同步、支持多 Provider API 的 AI 角色扮演工作台。

**不登录也能完整使用本地模式**，登录后可开启多设备云端同步。

## 为什么选择 Roleplay Tavern

- **本地优先** — 不登录即可使用全部功能，数据保存在浏览器本地 IndexedDB
- **数据可控** — 数据在你自己手里，可随时导出备份，不会被锁定在某个服务里
- **可选云端同步** — 登录后**手动**选择上传或下载，不静默上传，不静默覆盖
- **自带 API Key** — 使用你自己的 DeepSeek / OpenAI / OpenRouter / SiliconFlow 等 API Key
- **角色扮演原生工具** — 角色卡、提示词模板、世界书、记忆系统、上下文控制台、版本历史
- **安全边界明确** — API Key 不进入导出数据、不进入同步数据、不进入日志

## 当前能力

| 功能 | 本地模式 | 云端同步模式 |
|------|---------|------------|
| 角色卡创作 | 可用 | 可用 |
| 提示词模板 | 可用 | 可用 |
| 世界书与词条 | 可用 | 可用 |
| 记忆系统 | 可用 | 可用 |
| AI 聊天 | 可用（需自配 API） | 可用 |
| 消息版本历史 | 可用 | 可用 |
| 本地预览回复 | 可用（无需 API） | — |
| 数据导出/导入 | 可用 | 可用 |
| 多设备同步 | — | 可用 |
| 本地↔云端上传下载 | — | 可用 |
| 托管加密 API Key | — | 可用 |

### API Provider 支持

| Provider | 状态 | 流式 |
|----------|------|------|
| DeepSeek (deepseek-v4-flash) | 推荐 | 是 |
| OpenAI (GPT-4o 等) | 可用 | 是 |
| OpenRouter | 可用 | 是 |
| SiliconFlow (硅基流动) | 可用 | 是 |
| Moonshot / Kimi | 可用 | 是 |
| 通义千问 (Qwen) | 可用 | 是 |
| xAI Grok | 可用 | 是 |
| 自定义 OpenAI Compatible | 可用 | 是 |
| Google Gemini | 需要适配器 | — |
| Anthropic Claude | 需要适配器 | — |

详细见 [Provider 支持矩阵](docs/roleplay-tavern/Provider支持矩阵.md)。

## 数据保存位置与 API Key 模式

### 数据保存

- **本地模式**：角色、会话、世界书、记忆等保存在当前浏览器的 IndexedDB 中。刷新/重启通常保留。
- **云端模式**：登录后数据保存在 Supabase，当前设备同时保留本地镜像。

> 清除浏览器网站数据、更换浏览器/设备、使用无痕模式会**永久丢失**本地数据。建议定期导出备份或登录开启云端同步。

### API Key 三种保存方式

| 模式 | 保存位置 | 风险 |
|------|---------|------|
| 仅本次会话 (session_only) | 浏览器内存 | 刷新后清除 |
| 当前设备 (local_device) | 浏览器 localStorage | 存在 XSS 风险，需自行理解 |
| 托管加密 (hosted_encrypted) | Supabase Edge Function 加密保存 | 前端不展示明文，当前非流式 |

> local_device 不是"加密保存"——只是存在 localStorage。如果有人能在你的浏览器执行 JS，就能读到你的 Key。托管加密模式可以降低这个风险。

详见 [安全与隐私说明](docs/roleplay-tavern/安全与隐私说明.md)。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选 — 本地模式无需 Supabase 也能体验）
cp .env.example .env
# 编辑 .env 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 3. 启动开发服务器
npm run dev
```

**不需要 Supabase** 也可以体验大部分功能：本地模式支持角色创作、世界书、记忆、本地预览回复。配置自己的 API Key 后可以真实聊天。Supabase 只在需要**云端同步**和**托管加密 API Key**时才需要。

## 部署

```bash
npm run build   # 产出 dist/
```

部署到 Vercel / Netlify / Cloudflare Pages 等静态托管平台，设置环境变量即可。

详见 [部署上线指南](docs/roleplay-tavern/部署上线指南.md)。

## 文档

### 帮助中心
- [用户使用指南](docs/roleplay-tavern/用户使用指南.md)
- [数据备份与恢复指南](docs/roleplay-tavern/数据备份与恢复指南.md)
- [安全与隐私说明](docs/roleplay-tavern/安全与隐私说明.md)
- [Provider 支持矩阵](docs/roleplay-tavern/Provider支持矩阵.md)

### 开发者文档
- [部署上线指南](docs/roleplay-tavern/部署上线指南.md)
- [开发者指南](docs/roleplay-tavern/开发者指南.md)
- [架构说明](docs/roleplay-tavern/架构说明.md)
- [安全审计记录](docs/roleplay-tavern/安全审计记录.md)

### 历史开发记录
- [开发历史归档](docs/roleplay-tavern/archive/)

## 技术栈

- **前端**：Vite 5 + React 18 + TypeScript 5 + Tailwind CSS 3
- **路由**：React Router 6
- **后端服务**：Supabase (Auth + Database + RLS + Edge Functions)
- **本地存储**：IndexedDB (本地仓库 + 本地镜像)
- **AI Provider**：DeepSeek / OpenAI-compatible 多 Provider Gateway

## 项目状态

**MVP 可用版本**，持续活跃开发中。

当前版本已支持完整的本地优先工作流、云端同步、多 Provider API 配置和全功能角色扮演工具链。

## License

本仓库当前**尚未确定开源许可证**。在正式确定许可证之前，默认保留所有权利。

如果你打算在本项目基础上二次开发或公开部署，请先阅读 [开源许可选择建议](docs/roleplay-tavern/开源许可选择建议.md) 并自行选择合适的许可证。

## 贡献与安全

- 提交问题或建议请通过 GitHub Issues
- 安全漏洞请勿公开提交，参考 [SECURITY.md](SECURITY.md)
- API Key / 密码 / Secrets 不要提交到仓库
