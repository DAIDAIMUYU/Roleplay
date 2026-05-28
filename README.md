# Roleplay Tavern

本地优先的 AI 角色酒馆。你可以创建角色、提示词模板、世界书、记忆和长会话；不登录也能在当前浏览器本地使用，登录后可选择开启云端同步。

项目仓库：[https://github.com/DAIDAIMUYU/Roleplay.git](https://github.com/DAIDAIMUYU/Roleplay.git)

## 适合做什么

- 设计角色卡，管理身份、性格、说话风格、开场白和关系阶段。
- 用世界书保存背景设定、地点、组织、关键词触发条目。
- 用记忆保存长期事实和关系进展，候选记忆需要用户确认后才会注入。
- 在聊天房间里查看上下文控制台、Token 用量、DeepSeek 缓存命中和费用估算。
- 导出本地 JSON 备份，也可以登录后把创作数据同步到云端。

## 数据保存在哪里

- **本地模式**：未登录也可用，数据保存在当前浏览器的 IndexedDB 中。刷新、关闭浏览器、重启设备后通常仍会保留。
- **云端同步**：登录后可手动上传/下载数据，角色、会话、世界书、记忆等会保存到云端数据库，当前设备也保留本地镜像。
- **重要提醒**：清除浏览器网站数据、Cookie/站点数据、IndexedDB、无痕模式关闭、更换浏览器、更换设备或格式化设备，可能导致本地数据无法恢复。建议定期导出备份。

## API Key 保存方式

| 模式 | 保存位置 | 是否跨设备 | 说明 |
| --- | --- | --- | --- |
| session_only | 当前网页会话内存 | 否 | 关闭或刷新后可能需要重新填写，不上传云端。 |
| local_device | 当前浏览器本地 | 否 | 只在本设备可用，清除网站数据或换设备后需要重新配置。 |
| hosted_encrypted | 服务端加密托管凭据 | 是 | 登录后可跨设备使用，前端不显示明文 Key。 |

导出备份不会包含 API Key、密文、IV 或 Secrets。

## 快速开始

```bash
npm install
npm run dev
```

打开开发服务器后，按页面引导完成三步：

1. 进入设置中心配置 API。未配置 API 时可以先熟悉本地创建流程，但不会调用真实模型。
2. 进入创作工坊创建角色卡。
3. 进入聊天房间，选择角色并创建会话。

## 构建

```bash
npm run build
npx tsc -b
```

## 用户帮助

- 应用内帮助中心：`/help`
- 数据管理：`/settings/data`
- Provider 支持矩阵：[docs/roleplay-tavern/Provider支持矩阵.md](docs/roleplay-tavern/Provider支持矩阵.md)
- 部署上线指南：[docs/roleplay-tavern/部署上线指南.md](docs/roleplay-tavern/部署上线指南.md)

## 技术栈

- Vite 5 + React 18 + TypeScript 5
- React Router
- Tailwind CSS
- Supabase Auth / Database / Edge Functions
- IndexedDB 本地仓库与本地镜像
- DeepSeek / OpenAI-compatible Provider Gateway

## 安全边界

- 不要提交 `.env`、`.env.local`、API Key 或任何 secret。
- API Key 不写入导出备份、context runs、日志或调试面板。
- hosted_encrypted 模式下，前端不会读取托管 API Key 明文。

## 贡献与反馈

提交问题或建议请使用 GitHub Issues：
[https://github.com/DAIDAIMUYU/Roleplay.git](https://github.com/DAIDAIMUYU/Roleplay.git)
