-- V4.3 product completion draft tables
-- These tables support Stage 8-9 capabilities: global tags, public sharing, feedback, usage limits, announcements, and user preferences.
-- Execute only after reviewing Stage 8/9 requirements. Do not implement unrelated UI early.

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  color text,
  visibility text not null default 'private' check (visibility in ('private','demo','shared','system','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.tag_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  entity_type text not null check (entity_type in ('character','session','message','worldbook','worldbook_entry','memory','prompt_template','share')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique(tag_id, entity_type, entity_id)
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('character','prompt_template','worldbook','worldbook_entry','demo_session')),
  entity_id uuid not null,
  slug text unique not null,
  title text not null,
  description text,
  visibility text not null default 'shared' check (visibility in ('shared','unlisted','disabled')),
  copied_count int not null default 0,
  expires_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'general',
  status text not null default 'open' check (status in ('open','triaged','in_progress','resolved','closed')),
  title text not null,
  content text not null,
  page_url text,
  meta_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text,
  model text,
  event_type text not null,
  input_tokens int,
  output_tokens int,
  cost_usd numeric,
  status text,
  meta_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  font_scale numeric not null default 1,
  bubble_width text not null default 'normal',
  show_avatars boolean not null default true,
  show_timestamps boolean not null default true,
  mobile_layout text not null default 'app',
  settings_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tags_user on public.tags(user_id);
create index if not exists idx_tag_links_entity on public.tag_links(entity_type, entity_id);
create index if not exists idx_share_links_user on public.share_links(user_id, created_at desc);
create index if not exists idx_share_links_slug on public.share_links(slug);
create index if not exists idx_feedback_status on public.feedback_items(status, created_at desc);
create index if not exists idx_usage_events_user_time on public.usage_events(user_id, created_at desc);

alter table public.tags enable row level security;
alter table public.tag_links enable row level security;
alter table public.share_links enable row level security;
alter table public.feedback_items enable row level security;
alter table public.system_announcements enable row level security;
alter table public.usage_events enable row level security;
alter table public.user_preferences enable row level security;

-- Users manage their own private tags and tag links. Demo/system/admin tag management belongs to Owner/Admin.
create policy tags_select on public.tags
  for select using (user_id = auth.uid() or visibility in ('demo','system','shared') or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));
create policy tags_write on public.tags
  for all using (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')))
  with check (user_id = auth.uid() or public.is_owner() or (public.is_admin() and visibility in ('demo','system','admin')));

create policy tag_links_owner_all on public.tag_links
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());

create policy share_links_select on public.share_links
  for select using (user_id = auth.uid() or visibility = 'shared' or public.is_owner() or public.is_admin());
create policy share_links_write on public.share_links
  for all using (user_id = auth.uid() or public.is_owner()) with check (user_id = auth.uid() or public.is_owner());

create policy feedback_insert_any_authenticated on public.feedback_items
  for insert with check (auth.uid() = user_id or user_id is null);
create policy feedback_select_self_or_staff on public.feedback_items
  for select using (user_id = auth.uid() or public.is_owner() or public.is_admin());
create policy feedback_staff_update on public.feedback_items
  for update using (public.is_owner() or public.is_admin()) with check (public.is_owner() or public.is_admin());

create policy announcements_select_published on public.system_announcements
  for select using (status = 'published' or public.is_owner() or public.is_admin());
create policy announcements_staff_write on public.system_announcements
  for all using (public.is_owner() or public.is_admin()) with check (public.is_owner() or public.is_admin());

create policy usage_events_select_self_or_staff on public.usage_events
  for select using (user_id = auth.uid() or public.is_owner() or public.is_admin());
create policy usage_events_insert_self_or_staff on public.usage_events
  for insert with check (user_id = auth.uid() or public.is_owner() or public.is_admin());

create policy user_preferences_owner_all on public.user_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
