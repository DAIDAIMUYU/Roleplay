# 07_数据库Schema与RLS要点

## 设计原则

1. 所有私有业务表必须有 `user_id`。
2. 核心数据优先软删除或进入回收站，不直接物理删除。
3. 所有表保留 `created_at`、`updated_at`，关键表增加 `archived_at`、`deleted_at`。
4. 所有导入导出数据带 `schema_version`。
5. 复杂权限封装到 `has_role()` 等函数，避免每条 policy 写复杂 exists。

## 核心表

- profiles
- user_roles
- provider_credentials，可选后期
- model_presets
- characters
- character_revisions
- sessions
- session_participants
- branches
- messages
- prompt_templates
- worldbooks
- worldbook_entries
- memories
- context_runs
- trash_items
- backup_artifacts
- audit_events

## RLS 验收

必须写测试验证：

- 用户 A 无法读取用户 B 的角色。
- 用户 A 无法读取用户 B 的消息。
- 用户 A 无法通过 session_id 枚举消息。
- 用户 A 无法读取用户 B 的导出备份。
- Demo 数据只读。
- Admin 默认不能直接读原始私聊。

## Storage 策略

建议分桶：

- demo-public：公开 Demo 资源
- avatars-private：用户头像/角色头像，按 owner 控制
- exports-private：导出备份，只允许本人下载
- admin-artifacts：管理后台产物

## Migration 策略

不建议只放一个 `schema.sql`。应使用：

```text
supabase/migrations/0001_initial_schema_draft.sql
supabase/migrations/0002_add_context_runs.sql
supabase/migrations/0003_add_backup_artifacts.sql
```

每个 migration 必须有目的说明和回滚考虑。


---

## V4.1：RLS 权限边界修订

V4.1 明确区分 Owner 与 Admin：

- Owner 是最高权限角色，可用于站主管理与紧急排障，但敏感访问必须审计。
- Admin 是运营角色，默认只能管理 Demo、System、Admin 分区内容，不能默认读取普通用户 private 数据。
- User 只能访问自己的 private 数据。
- Guest 不进入正式数据库写入路径，只访问 Demo Mode 的只读展示数据或前端 Mock 数据。

### 建议函数

```sql
public.has_role(role text)
public.is_owner()
public.is_admin()
public.can_manage_public_content() -- owner or admin
```

### 敏感表默认策略

以下表默认不允许 Admin 读取其他用户数据：

- sessions
- branches
- session_participants
- messages
- memories
- context_runs
- backup_artifacts
- trash_items
- character_revisions

这些表的基础原则是：

```sql
user_id = auth.uid() OR public.is_owner()
```

Admin 如需协助排障，只能通过后续设计的 break-glass 流程，且必须写入 audit_events。

### 运营内容表策略

以下表可允许 Admin 管理 demo/system/admin 分区内容：

- characters
- prompt_templates
- worldbooks
- worldbook_entries
- model_presets
- announcements，后期表
- demo_scenarios，后期表

策略原则：

```sql
user_id = auth.uid()
OR visibility IN ('demo', 'system', 'shared') -- 只读公开/共享内容
OR public.is_owner()
OR (public.is_admin() AND visibility IN ('demo', 'system', 'admin'))
```

写入时必须限制 Admin 只能写 demo/system/admin，不得把内容写入他人 private 分区。


## V4.2：user_api_credentials（阶段 7B 草案）

`user_api_credentials` 只属于阶段 7B：加密托管 API Key 与跨设备同步。阶段 3 不允许提前实现该表的真实写入逻辑，更不允许明文保存 API Key。

建议字段：

```sql
create table if not exists user_api_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  label text not null,
  base_url text,
  encrypted_api_key text not null,
  key_hint text,
  storage_mode text not null default 'hosted_encrypted',
  is_default boolean not null default false,
  enabled boolean not null default true,
  last_tested_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

设计约束：

- `encrypted_api_key` 必须是服务端加密后的密文，不允许存明文。
- 前端只显示 `label`、`provider`、`key_hint`、连接状态、最后使用时间。
- `key_hint` 只能是安全提示，例如最后 4 位或用户自定义标签，不得泄漏完整 Key。
- RLS：普通用户只能管理自己的 credential。
- Admin 默认不能读取、解密或导出普通用户 credential。
- Owner 也不应通过后台查看完整明文 Key；如需服务端调用，应通过受控函数短暂解密使用，不进入 UI。
- 备份导出默认不包含 `encrypted_api_key`，除非后期明确设计“加密凭据迁移包”。

RLS 原则：

```sql
-- user_id = auth.uid()
-- select/insert/update/delete only own rows
-- admin 不默认拥有读取 private credentials 的策略
```

该表配套 migration 草案见：

```text
supabase/migrations/0003_v42_user_api_credentials.sql
```
