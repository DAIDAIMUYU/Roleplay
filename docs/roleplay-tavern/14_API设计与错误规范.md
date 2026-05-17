# 14_API设计与错误规范

## API 原则

应用 API 面向前端，Provider Adapter 面向模型厂商。不要让前端知道各 Provider 的细节。

## 推荐端点

| 端点 | 作用 | 认证 |
|---|---|---|
| GET /api/me/mode | 当前模式、角色、provider 状态 | JWT |
| POST /api/provider/test | 测试 BYOK/Owner Provider | JWT |
| POST /api/provider/models | 获取模型列表 | JWT |
| POST /api/chat/send | 发送消息，构建上下文，流式返回 | Demo 无登录但限流；User JWT |
| POST /api/context/preview | 只构建上下文，不调用模型 | JWT |
| POST /api/characters/import | 导入角色/世界书/模板 | JWT |
| POST /api/branches | 创建分支 | JWT |
| POST /api/backups/export | 导出备份 | JWT |
| GET /api/admin/health | 管理员健康检查 | Admin JWT |

## 错误格式

采用类似 RFC 9457 problem detail 的结构：

```json
{
  "type": "https://roleplay-tavern/errors/provider-rate-limit",
  "title": "Provider rate limit reached",
  "status": 429,
  "detail": "Provider 返回限流，请稍后重试。",
  "instance": "/api/chat/send",
  "requestId": "req_xxx",
  "provider": "deepseek",
  "retryable": true
}
```

## 错误映射

- 400/422：请求参数或 schema 错误
- 401：登录过期或 Provider Key 无效
- 402：Provider 余额不足
- 403：权限不足/RLS 拒绝
- 404：资源不存在或无权访问
- 409：冲突，如导入重复
- 413：请求体过大
- 429：限流
- 5xx：Provider 或服务端故障

## 前端提示原则

错误要翻译成人话：

- “API Key 错误”而不是只显示 401
- “余额不足”而不是只显示 402
- “请求太频繁，请稍后重试”而不是只显示 429
- “当前会话上下文太长，建议减少世界书或更新摘要”而不是只显示超限
