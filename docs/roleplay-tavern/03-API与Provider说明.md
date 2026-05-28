# API 与 Provider 说明

## 1. Provider 类型

当前主要支持 DeepSeek 与 OpenAI-compatible Provider。Gemini 和 Claude 需要专用 adapter，当前建议通过 OpenRouter 等兼容层使用。

## 2. API Key 保存模式

| 模式 | 保存位置 | 跨设备 | 说明 |
| --- | --- | --- | --- |
| `session_only` | 当前网页会话内存 | 否 | 临时使用，关闭或刷新后可能失效。 |
| `local_device` | 当前浏览器本地 | 否 | 不上传云端，换设备需重新配置。 |
| `hosted_encrypted` | 服务端加密托管凭据 | 是 | 登录后可跨设备使用，前端不展示明文 Key。 |

## 3. DeepSeek 支持情况

- 基础用量统计：支持。
- 缓存命中统计：支持。
- 费用估算：支持。
- 余额查询：支持，需要本地 Key 或部署 `hosted-provider-balance`。
- 流式 usage：支持读取 include_usage 返回，依赖 Provider 实际响应。

DeepSeek 价格表当前按项目内置版本估算，实际扣费以官方账单为准。

## 4. OpenAI Compatible 支持情况

- 基础聊天：支持。
- 基础 usage：如果 Provider 返回 usage，则显示。
- 缓存命中：暂未统一适配。
- 费用估算：暂未适配。
- 余额查询：暂未适配。

## 5. 托管加密凭据

托管模式下，API Key 明文只在保存或替换时进入 Edge Function。之后聊天由 Edge Function 解密后代理调用 Provider，前端不读取明文 Key。

## 6. 用量 usage

通用字段：

- `prompt_tokens` → 输入 token
- `completion_tokens` → 输出 token
- `total_tokens` → 总 token

Provider 不返回 usage 时，UI 显示“未返回本次用量”，不会用本地估算冒充真实 usage。

## 7. DeepSeek 缓存命中与费用

DeepSeek 支持：

- 命中输入 token
- 未命中输入 token
- 命中率
- 输入/输出费用估算

缓存命中越高，输入成本越低。缓存效果取决于请求前缀是否稳定。

## 8. 余额查询

- DeepSeek local_device / session_only：可使用当前 Key 查询。
- DeepSeek hosted_encrypted：必须通过 `hosted-provider-balance`。
- 非 DeepSeek：当前阶段不做余额查询。

## 9. 当前限制

- 不做非 DeepSeek 价格估算。
- 不做全 Provider 余额查询。
- Gemini / Claude 未接原生 adapter。
- hosted_encrypted 的 Edge Function 变更需要手动部署。

## 10. 后续扩展计划

详见 [第二阶段执行计划](06-第二阶段执行计划.md) 的 D 阶段。
