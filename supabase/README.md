# Supabase 说明

本目录只提供数据库设计草案与迁移骨架。执行前必须由开发者审查。

原则：

- 所有私有业务表启用 RLS。
- 默认拒绝。
- 用户只能访问 `user_id = auth.uid()` 的数据。
- Demo Mode 默认不写数据库。
- Owner/Admin 通过 `user_roles` 和 `has_role()` 控制。
- API Key 不明文进入普通业务表。
- BYOK 首期建议会话级临时使用，不长期存储。

执行建议：

1. 新建 Supabase 项目。
2. 在 SQL Editor 或 CLI 执行 `migrations/0001_initial_schema_draft.sql`。
3. 审查 RLS。
4. 写 RLS 测试。
5. 再接前端 Repository。


## V4.2 migration note

`migrations/0003_v42_user_api_credentials.sql` is a Stage 7B draft for encrypted hosted API credentials. It must not be used to justify storing plaintext API keys. Stage 3 uses local BYOK only; Stage 7B introduces encrypted account-level credential sync.


## V4.3 migration note

- `0004_v43_product_completion_tables.sql` is a draft migration for Stage 8-9 product completion features.
- It covers global tags, tag links, public share links, feedback, announcements, usage events, and user preferences.
- Do not implement Stage 8-9 UI early just because this migration exists. It is provided so the final product roadmap has explicit data-model support.
