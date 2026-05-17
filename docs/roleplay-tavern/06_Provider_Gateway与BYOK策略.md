# 06_Provider_Gateway与BYOK策略

## 总原则

真实模型调用必须统一经过 Provider Gateway。前端不直接散落调用 DeepSeek/OpenAI-compatible API。

## BYOK 策略

第一版推荐：会话级临时 BYOK。

- 用户登录后粘贴 API Key。
- 只在当前会话/浏览器运行时使用。
- 不长期存入数据库。
- 不写入日志。
- 不展示完整 key，只展示是否已配置。

中期可选：加密托管 API Key。

- 服务端加密存储。
- UI 只显示 label 与 last4。
- 必须有删除、轮换、测试连接。
- 必须记录审计。

Owner 模式：站主私钥只在服务端环境变量/Secrets 中使用。



## API Key 保存等级与阶段边界（V4.2 明确）

API Key 存储必须拆成三个等级，不能在早期为了方便直接把用户 Key 明文存入数据库。

### Level 1：临时保存

- 仅当前页面会话有效。
- 页面刷新、关闭或退出后可能丢失。
- 适合连接测试和临时体验。
- 不支持跨设备。

### Level 2：本设备保存

- 保存在当前浏览器本地。
- 不上传服务器。
- 不支持跨设备。
- 阶段 3 实现。
- UI 必须明确提示：API Key 仅保存在本设备浏览器中，更换设备需要重新配置。

### Level 3：账号加密托管

- API Key 由服务端加密后保存。
- 同账号多设备可用。
- 前端不直接读取完整明文 Key。
- 用户可删除、轮换、重新测试连接。
- 必须有审计记录。
- 放入阶段 7B 实现，不允许阶段 3 提前做成明文入库。

### 阶段边界

- 阶段 3：只做 Level 1 / Level 2，即临时保存和本设备保存。
- 阶段 7B：再做 Level 3，即服务端加密托管与多设备同步。

### 严格禁止

- 禁止在阶段 3 创建 `api_key` 明文字段。
- 禁止把用户 API Key 写入 `localStorage` 后又同步到数据库。
- 禁止 Admin 查看普通用户 API Key。
- 禁止 Owner/Admin 后台显示完整明文 Key。
- 禁止把 Key 打进日志、错误消息、context_runs、usage_events 或备份明文里。

## Provider Gateway 职责

1. 验证 JWT 与运行模式。
2. 判断 Demo / BYOK / Owner / Admin。
3. 解析 Provider 配置。
4. 调用 contextBuilder。
5. 执行 token 预算与成本上限。
6. 调用 Provider Adapter。
7. 统一流式输出。
8. 记录 context_runs、usage、audit_events。
9. 规范化错误。

## ProviderAdapter 接口

```ts
interface ProviderAdapter {
  id: 'deepseek' | 'openai' | 'openai-compatible' | 'mock';
  testConnection(input: TestInput): Promise<TestResult>;
  listModels(input: CredentialInput): Promise<ModelSummary[]>;
  chat(input: NormalizedChatRequest): AsyncIterable<NormalizedChunk>;
  estimate?(input: EstimateInput): Promise<TokenEstimate>;
  normalizeError(err: unknown): AppProblem;
}
```

## 必须支持的 Provider

阶段 3：

- mock provider
- deepseek provider
- openai-compatible provider 配置结构

后期：

- OpenAI
- Claude-compatible 代理
- Gemini-compatible
- 本地模型接口

## 连接测试

用户填 Key 后必须有“测试连接”：

- 401：Key 错误
- 402：余额不足
- 404/422：模型或 baseURL 错误
- 429：限流
- 5xx：Provider 故障
- Network error：网络或代理问题

错误必须翻译成人话。
