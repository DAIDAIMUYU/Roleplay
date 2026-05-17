-- Mirror of migrations/0001_initial_schema_draft.sql for quick review. Prefer migrations in real projects.

-- 0001_initial_schema_draft.sql
-- 角色酒馆 V4 初始数据库草案
-- 执行前必须审查。Demo Mode 默认不写正式数据库。

create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_path text,
  default_mode text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','owner','admin','support_readonly')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  unique(user_id, role)
);

create or replace function public.has_role(required_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;



create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.has_role('owner');
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create or replace function public.can_manage_public_content()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.has_role('owner') or public.has_role('admin');
$$;

create table if not exists public.model_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  provider text not null default 'deepseek',
  model text not null default 'deepseek-chat',
  base_url text,
  temperature numeric default 0.8,
  top_p numeric,
  max_output_tokens int default 1200,
  context_message_limit int default 20,
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text,
  summary text,
  card_json jsonb not null default '{}',
  avatar_path text,
  avatar_emoji text,
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  is_favorite boolean default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_revisions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  mode text not null default 'single' check (mode in ('single','group','narration','story')),
  status text not null default 'active' check (status in ('active','archived','deleted')),
  provider text,
  model text,
  active_branch_id uuid,
  primary_character_id uuid references public.characters(id) on delete set null,
  current_scene text,
  story_summary text,
  system_prompt text,
  style_rules text,
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  last_message_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '主线',
  from_message_id uuid,
  created_at timestamptz not null default now()
);

alter table public.sessions
  add constraint sessions_active_branch_fk
  foreign key (active_branch_id) references public.branches(id) on delete set null;

create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_type text not null default 'character' check (participant_type in ('user','character','narrator','system')),
  character_id uuid references public.characters(id) on delete cascade,
  sort_order int not null default 0,
  speaking_mode text default 'manual',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  unique(session_id, character_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  role text not null check (role in ('user','assistant','system','narrator','tool')),
  sender_name text,
  content_text text not null,
  content_json jsonb not null default '{}',
  parent_id uuid references public.messages(id) on delete set null,
  edited_from_id uuid references public.messages(id) on delete set null,
  token_count int,
  hidden boolean default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  category text default 'general',
  content text not null,
  description text,
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worldbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scope text not null default 'private',
  description text,
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worldbook_entries (
  id uuid primary key default gen_random_uuid(),
  worldbook_id uuid not null references public.worldbooks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default 'general',
  content text not null,
  triggers text[] not null default '{}',
  priority int not null default 100,
  enabled boolean default true,
  scope text not null default 'global' check (scope in ('global','character','session','persona')),
  token_estimate int,
  last_triggered_at timestamptz,
  trigger_count int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  memory_type text not null default 'long_term' check (memory_type in ('short_term','long_term','summary','event','relationship','user_preference','character_preference')),
  title text,
  content text not null,
  source_message_id uuid references public.messages(id) on delete set null,
  salience int not null default 50,
  status text not null default 'active' check (status in ('suggested','active','disabled','deleted')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.context_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  provider text,
  model text,
  input_tokens int,
  output_tokens int,
  cache_hit_tokens int,
  latency_ms int,
  cost_usd numeric,
  components_json jsonb not null default '[]',
  dropped_json jsonb not null default '[]',
  debug_enabled boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.trash_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  snapshot_json jsonb not null,
  deleted_at timestamptz not null default now(),
  purge_after timestamptz
);

create table if not exists public.backup_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  format text not null default 'json',
  storage_path text not null,
  checksum text,
  schema_version text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_type text,
  target_id uuid,
  ip_hash text,
  ua_hash text,
  meta_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_characters_user_updated on public.characters(user_id, updated_at desc);
create index if not exists idx_characters_tags on public.characters using gin(tags);
create index if not exists idx_sessions_user_updated on public.sessions(user_id, updated_at desc);
create index if not exists idx_messages_session_branch_time on public.messages(session_id, branch_id, created_at);
create index if not exists idx_worldbook_entries_worldbook_priority on public.worldbook_entries(worldbook_id, priority desc);
create index if not exists idx_worldbook_entries_triggers on public.worldbook_entries using gin(triggers);
create index if not exists idx_memories_session_type on public.memories(session_id, memory_type);
create index if not exists idx_context_runs_user_time on public.context_runs(user_id, created_at desc);
create index if not exists idx_audit_events_actor_time on public.audit_events(actor_user_id, created_at desc);

-- updated_at triggers
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_model_presets_updated_at before update on public.model_presets for each row execute function public.set_updated_at();
create trigger set_characters_updated_at before update on public.characters for each row execute function public.set_updated_at();
create trigger set_sessions_updated_at before update on public.sessions for each row execute function public.set_updated_at();
create trigger set_prompt_templates_updated_at before update on public.prompt_templates for each row execute function public.set_updated_at();
create trigger set_worldbooks_updated_at before update on public.worldbooks for each row execute function public.set_updated_at();
create trigger set_worldbook_entries_updated_at before update on public.worldbook_entries for each row execute function public.set_updated_at();
create trigger set_memories_updated_at before update on public.memories for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.model_presets enable row level security;
alter table public.characters enable row level security;
alter table public.character_revisions enable row level security;
alter table public.sessions enable row level security;
alter table public.branches enable row level security;
alter table public.session_participants enable row level security;
alter table public.messages enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.worldbooks enable row level security;
alter table public.worldbook_entries enable row level security;
alter table public.memories enable row level security;
alter table public.context_runs enable row level security;
alter table public.trash_items enable row level security;
alter table public.backup_artifacts enable row level security;
alter table public.audit_events enable row level security;

-- V4.1 RLS policies: Owner/Admin boundary.
-- Owner has highest system permission. Admin manages demo/system/admin operational content only.
-- Admin does not default-read private user sessions/messages/memories/API-related data.

create policy profiles_self_or_staff_select on public.profiles
  for select using (id = auth.uid() or public.is_owner() or public.is_admin());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_self_insert on public.profiles
  for insert with check (id = auth.uid());

-- Public/operational content tables. Admin can manage demo/system/admin content, but not other users' private data.
create policy model_presets_select on public.model_presets
  for select using (user_id = auth.uid() or visibility in ('demo','system','shared') or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));
create policy model_presets_write on public.model_presets
  for all using (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')))
  with check (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));

create policy characters_select on public.characters
  for select using (user_id = auth.uid() or visibility in ('demo','system','shared') or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));
create policy characters_write on public.characters
  for all using (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')))
  with check (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));

create policy prompt_templates_select on public.prompt_templates
  for select using (user_id = auth.uid() or visibility in ('demo','system','shared') or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));
create policy prompt_templates_write on public.prompt_templates
  for all using (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')))
  with check (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));

create policy worldbooks_select on public.worldbooks
  for select using (user_id = auth.uid() or visibility in ('demo','system','shared') or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));
create policy worldbooks_write on public.worldbooks
  for all using (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')))
  with check (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));

create policy worldbook_entries_select on public.worldbook_entries
  for select using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.worldbooks wb
      where wb.id = worldbook_id
        and (wb.visibility in ('demo','system','shared') or (public.is_admin() and wb.visibility in ('demo','system','admin')))
    )
  );
create policy worldbook_entries_write on public.worldbook_entries
  for all using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.worldbooks wb
      where wb.id = worldbook_id
        and public.is_admin()
        and wb.visibility in ('demo','system','admin')
    )
  ) with check (
    user_id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.worldbooks wb
      where wb.id = worldbook_id
        and public.is_admin()
        and wb.visibility in ('demo','system','admin')
    )
  );

-- Sensitive private tables. Admin is intentionally excluded by default.
create policy character_revisions_owner_all on public.character_revisions
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy sessions_owner_all on public.sessions
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy branches_owner_all on public.branches
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy session_participants_owner_all on public.session_participants
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy messages_owner_all on public.messages
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy memories_owner_all on public.memories
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy context_runs_owner_all on public.context_runs
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy trash_items_owner_all on public.trash_items
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());
create policy backup_artifacts_owner_all on public.backup_artifacts
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());

-- Roles and audit.
create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_owner() or public.is_admin());
create policy user_roles_owner_write on public.user_roles
  for all using (public.is_owner()) with check (public.is_owner());

create policy audit_events_select on public.audit_events
  for select using (actor_user_id = auth.uid() or public.is_owner() or public.is_admin());
create policy audit_events_insert on public.audit_events
  for insert with check (actor_user_id = auth.uid() or public.is_owner() or public.is_admin());

