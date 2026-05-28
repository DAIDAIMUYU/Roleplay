# 17_API密钥跨设备同步与加密托管设计

## 一、为什么单独设计

用户真实使用角色酒馆时会配置自己的 Provider/API Key。第一版如果只保存到浏览器，可以快速实现 BYOK，但无法多设备互通。

因此，API Key 存储必须拆成两个阶段：

- 阶段 3：本地 BYOK，解决“能用”。
- 阶段 7B：加密托管，解决“多设备同步”。

该能力涉及用户密钥安全，不能作为普通设置字段草率实现。

## 二、阶段 3：本地 BYOK

阶段 3 只允许实现：

1. 临时保存：仅当前页面会话有效。
2. 本设备保存：保存在当前浏览器，不上传服务器。

阶段 3 必须明确提示：

> 当前 API Key 仅保存在本设备浏览器中，不会上传服务器。更换设备或清理浏览器数据后需要重新配置。

阶段 3 禁止：

- 禁止把用户 API Key 明文存入数据库。
- 禁止创建 `api_key` 明文字段。
- 禁止在日志、错误消息、context_runs 中记录 Key。
- 禁止 Admin 或 Owner 后台显示完整 Key。

## 三、阶段 7B：账号加密托管 API Key

阶段 7B 的目标：

用户在电脑端配置 API Key 后，手机端登录同一账号也可以使用该 Provider，不需要重新输入。

实现原则：

1. API Key 只能以密文形式保存在服务端。
2. 前端不直接读取完整明文 Key。
3. Provider Gateway 在服务端受控解密并调用模型。
4. 用户可以删除、轮换、重新测试连接。
5. 所有敏感操作写入审计日志。
6. 备份导出默认不包含托管 API Key。

## 四、数据模型草案

表名：`user_api_credentials`

字段建议：

- `id`
- `user_id`
- `provider`
- `label`
- `base_url`
- `encrypted_api_key`
- `key_hint`
- `storage_mode`
- `is_default`
- `enabled`
- `last_tested_at`
- `last_used_at`
- `created_at`
- `updated_at`
- `deleted_at`

`encrypted_api_key` 必须是密文。`key_hint` 只能显示安全提示，例如最后 4 位或用户自定义标签。

## 五、权限边界

### 普通用户

- 只能管理自己的 credential。
- 可以新增、测试、禁用、删除、轮换自己的 API Key。
- 不能读取其他用户 credential。

### Admin

- 默认不能读取普通用户 credential。
- 默认不能解密普通用户 API Key。
- 可以查看汇总状态，例如“某用户配置了 Provider”，但不能看到 Key。

### Owner

- 也不应通过后台查看完整明文 Key。
- 如需排查，只能通过审计日志、连接状态、错误码定位问题。
- 解密调用应发生在服务端 Provider Gateway 内部，不进入 UI。

## 六、Provider Gateway 调用流程

```text
用户发起聊天
  ↓
前端发送 session_id / credential_id / model settings
  ↓
Provider Gateway 校验 JWT 和 user_id
  ↓
读取该用户自己的 user_api_credentials
  ↓
服务端受控解密
  ↓
调用对应 Provider
  ↓
返回流式结果
  ↓
记录 usage / audit，不记录明文 Key
```

## 七、审计日志

阶段 7B 必须记录：

- 创建 credential
- 测试连接
- 调用 Provider
- 失败错误码
- 删除 credential
- 轮换 credential
- 设为默认 credential

审计日志不得记录完整 API Key。

## 八、备份与迁移策略

默认完整数据备份不包含 `encrypted_api_key`。原因：

- 密钥迁移需要额外加密方案。
- 用户不一定希望 API Key 被包含在备份里。
- 避免备份文件泄漏造成 Provider Key 泄漏。

后期如果做 credential 迁移，必须单独设计“加密凭据迁移包”。

## 九、验收标准

阶段 7B 完成时必须满足：

- [ ] 用户可选择将 API Key 加密托管到账号。
- [ ] 同账号在不同设备登录后可使用同一 Provider。
- [ ] 前端不显示完整明文 Key。
- [ ] 数据库中不存在明文 API Key。
- [ ] Admin 默认不能读取用户 Key。
- [ ] Owner 后台不显示用户完整 Key。
- [ ] 用户可删除和轮换 Key。
- [ ] 连接测试可用。
- [ ] 审计日志可追踪敏感操作。
- [ ] 默认备份不导出 Key。

## 十、阶段结论

跨设备 API Key 同步已经正式纳入阶段 7B。

阶段 3 只解决“用户可以使用自己的 API”。
阶段 7B 才解决“用户的 API 配置可以跨设备同步”。
