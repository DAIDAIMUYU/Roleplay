# Provider 支持矩阵

## 当前支持状态

| Provider | 状态 | Base URL 预设 | 模型预设 | session_only | local_device | hosted_encrypted | 流式 | 备注 |
|----------|------|:---:|:---:|:---:|:---:|:---:|:---:|------|
| DeepSeek | **推荐** | 是 | 是 | 是 | 是 | 是 | 是 | 默认模型 deepseek-v4-flash |
| OpenAI | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | GPT-4o / GPT-4o-mini |
| OpenRouter | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | 聚合平台，可访问多模型 |
| SiliconFlow | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | 硅基流动平台 |
| Moonshot / Kimi | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | moonshot-v1 系列 |
| 通义千问 (Qwen) | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | DashScope 兼容接口 |
| xAI Grok | 可用 | 是 | 是 | 是 | 是 | 是 | 是 | grok-3 / grok-3-mini |
| 自定义 OpenAI Compatible | 可用 | 手动 | 手动 | 是 | 是 | 是 | 是 | 任意 OpenAI 兼容服务 |
| Google Gemini | 需要适配器 | — | — | — | — | — | — | 专用 API 格式，暂未接入 |
| Anthropic Claude | 需要适配器 | — | — | — | — | — | — | 专用 Messages API，暂未接入 |

## 使用建议

- **推荐**：DeepSeek — 高性价比中文模型，快速流畅，预设完整
- **多模型聚合**：OpenRouter — 一个 API Key 访问多种模型
- **国产平台**：SiliconFlow / Moonshot / Qwen — 国内访问更快
- **自定义**：如果你使用的服务兼容 OpenAI API 格式，选择"自定义 OpenAI Compatible"手动配置

## 兼容性说明

标为"可用"的 Provider 均通过 **OpenAI-compatible API** 接入。这意味着：
- 支持 `/chat/completions` 端点
- 支持流式响应（streaming）
- 支持标准 Bearer Token 认证
- 模型列表为预设推荐值，实际可用模型取决于服务商

## 需要适配器的 Provider

Gemini 和 Claude 使用各自的专用 API 格式，与 OpenAI-compatible 不兼容。当前暂未接入专用适配器。

如果你想使用这些模型，建议通过 **OpenRouter** 中转——OpenRouter 提供了 Gemini 和 Claude 的 OpenAI-compatible 接口。

## 如何新增 Provider

如果你是开发者，想新增 Provider 预设或适配器，请参考[开发者指南](开发者指南.md)中的"Provider 新增流程"章节。
