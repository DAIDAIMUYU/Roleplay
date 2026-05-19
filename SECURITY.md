# Security Policy

## Supported Versions

当前项目处于活跃开发阶段（MVP）。安全更新将应用于 `main` 分支的最新版本。

| 版本 | 支持状态 |
|------|---------|
| main 分支最新提交 | 支持 |

## Reporting a Vulnerability

如果你发现安全漏洞，**请勿公开提交 Issue**。

请通过 GitHub 的 [Security Advisories](https://github.com/13632924803/Roleplay/security/advisories/new) 或邮件联系项目维护者。

请在报告中包含：
- 漏洞描述
- 复现步骤
- 影响范围
- 建议修复方案（如有）

我们会尽快确认并响应。

## Security Boundaries

### 数据存储

- **本地模式**：数据存储在浏览器 IndexedDB，数据安全取决于用户设备和浏览器安全。
- **云端模式**：数据存储在 Supabase，受 Supabase RLS 保护。
- **API Key (local_device)**：明文存储在浏览器 localStorage，**存在 XSS 风险**。如果页面存在 XSS 漏洞，攻击者可以读取 API Key。
- **API Key (hosted_encrypted)**：通过 Supabase Edge Function 使用 AES-256-GCM 加密存储，前端不保存明文。

### API Key 安全

- API Key 不会写入导出 JSON
- API Key 不会写入 context_runs
- API Key 不会通过业务数据同步传输
- API Key 不会出现在 console 日志中

### Supabase 安全

- 所有数据表启用 RLS（Row Level Security）
- Edge Functions 使用 Supabase Auth 验证
- 不暴露 service_role key 到前端

### 不建议报告的类型

以下情况通常不被视为安全漏洞：
- 缺少 SPF/DKIM/DMARC 等邮件安全配置（本项目不发送邮件）
- 点击劫持攻击仅影响无状态操作的场景
- 自动化扫描器的低信息量报告
- local_device 模式下 API Key 存在 localStorage 的事实（这是设计决策，已在文档中说明风险）

## Security Headers

部署到生产环境时，建议配置以下安全 Headers（通过 vercel.json 或部署平台配置）：

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

CSP 建议保守配置，先以 Report-Only 模式部署测试，避免破坏应用功能。

## Known Risks

| 风险 | 等级 | 说明 |
|------|------|------|
| localStorage API Key XSS | P1 | local_device 模式 API Key 存在 localStorage 明文，需用户理解风险 |
| IndexedDB 数据未加密 | P2 | 本地数据可在浏览器 DevTools 查看，物理设备安全由用户负责 |
| hosted_encrypted 非流式 | P2 | 当前托管模式不支持流式响应 |

## 致谢

感谢报告安全问题的每一位贡献者。
