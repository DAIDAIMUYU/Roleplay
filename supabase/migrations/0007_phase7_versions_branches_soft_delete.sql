-- 0007_phase7_versions_branches_soft_delete.sql
-- Phase 7: Message versions, branches, soft delete, context_runs persistence
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS patterns

-- ============================================================
-- 1. message_revisions — edit version history
-- ============================================================
create table if not exists public.message_revisions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision_no int not null default 1,
  content_text text not null,
  edited_at timestamptz not null default now()
);

create index if not exists idx_message_revisions_message on public.message_revisions(message_id, revision_no desc);

-- ============================================================
-- 2. messages — add versioning + soft-delete columns
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'edited_at') then
    alter table public.messages add column edited_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'revision_no') then
    alter table public.messages add column revision_no int not null default 1;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'superseded_by_message_id') then
    alter table public.messages add column superseded_by_message_id uuid references public.messages(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'deleted_reason') then
    alter table public.messages add column deleted_reason text;
  end if;
end $$;

create index if not exists idx_messages_revision on public.messages(revision_no);
create index if not exists idx_messages_superseded on public.messages(superseded_by_message_id) where superseded_by_message_id is not null;

-- ============================================================
-- 3. branches — add title, parent, fork info, status, timestamps
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'branches' and column_name = 'title') then
    alter table public.branches add column title text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'branches' and column_name = 'parent_branch_id') then
    alter table public.branches add column parent_branch_id uuid references public.branches(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'branches' and column_name = 'forked_from_message_id') then
    alter table public.branches add column forked_from_message_id uuid references public.messages(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'branches' and column_name = 'status') then
    alter table public.branches add column status text not null default 'active' check (status in ('active', 'archived', 'merged'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'branches' and column_name = 'updated_at') then
    alter table public.branches add column updated_at timestamptz not null default now();
  end if;
end $$;

create index if not exists idx_branches_session_status on public.branches(session_id, status);
create index if not exists idx_branches_parent on public.branches(parent_branch_id) where parent_branch_id is not null;

-- ============================================================
-- 4. worldbooks — soft delete columns
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'worldbooks' and column_name = 'deleted_at') then
    alter table public.worldbooks add column deleted_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'worldbooks' and column_name = 'deleted_reason') then
    alter table public.worldbooks add column deleted_reason text;
  end if;
end $$;

create index if not exists idx_worldbooks_not_deleted on public.worldbooks(user_id, updated_at desc) where deleted_at is null;

-- ============================================================
-- 5. worldbook_entries — soft delete columns
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'worldbook_entries' and column_name = 'deleted_at') then
    alter table public.worldbook_entries add column deleted_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'worldbook_entries' and column_name = 'deleted_reason') then
    alter table public.worldbook_entries add column deleted_reason text;
  end if;
end $$;

create index if not exists idx_wbe_not_deleted on public.worldbook_entries(worldbook_id, priority desc) where deleted_at is null;

-- ============================================================
-- 6. prompt_templates — soft delete columns
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'prompt_templates' and column_name = 'deleted_at') then
    alter table public.prompt_templates add column deleted_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'prompt_templates' and column_name = 'deleted_reason') then
    alter table public.prompt_templates add column deleted_reason text;
  end if;
end $$;

create index if not exists idx_pt_not_deleted on public.prompt_templates(user_id, updated_at desc) where deleted_at is null;

-- ============================================================
-- 7. memories — add deleted_at timestamp to complement status='deleted'
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'memories' and column_name = 'deleted_at') then
    alter table public.memories add column deleted_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'memories' and column_name = 'deleted_reason') then
    alter table public.memories add column deleted_reason text;
  end if;
end $$;

create index if not exists idx_memories_not_deleted on public.memories(user_id, updated_at desc) where deleted_at is null;

-- ============================================================
-- 8. context_runs — add detailed context fields
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'branch_id') then
    alter table public.context_runs add column branch_id uuid references public.branches(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'trigger_message_id') then
    alter table public.context_runs add column trigger_message_id uuid references public.messages(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'system_prompt') then
    alter table public.context_runs add column system_prompt text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'provider_messages_json') then
    alter table public.context_runs add column provider_messages_json jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'worldbook_hits_json') then
    alter table public.context_runs add column worldbook_hits_json jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'skipped_entries_json') then
    alter table public.context_runs add column skipped_entries_json jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'injected_memories_json') then
    alter table public.context_runs add column injected_memories_json jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'summary_text') then
    alter table public.context_runs add column summary_text text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'token_budget') then
    alter table public.context_runs add column token_budget int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'context_runs' and column_name = 'estimated_tokens') then
    alter table public.context_runs add column estimated_tokens int;
  end if;
end $$;

create index if not exists idx_context_runs_session_branch on public.context_runs(session_id, branch_id, created_at desc);
create index if not exists idx_context_runs_message on public.context_runs(trigger_message_id);

-- ============================================================
-- 9. RLS policies for message_revisions
-- ============================================================
alter table public.message_revisions enable row level security;

create policy message_revisions_owner_all on public.message_revisions
  for all using (user_id = auth.uid() or public.is_owner())
  with check (user_id = auth.uid() or public.is_owner());

-- ============================================================
-- 10. Update messages RLS to allow superseded_by_message_id updates
-- (Existing policy already covers owner_all, so no change needed)
-- ============================================================

-- ============================================================
-- 11. Ensure existing branch data is consistent
-- Backfill: if a session has no branches, create default 'main' branch
-- and set active_branch_id on the session.
-- ============================================================
do $$
declare
  sess record;
  branch_id uuid;
begin
  for sess in
    select s.id, s.user_id, s.active_branch_id
    from public.sessions s
    where s.deleted_at is null
      and s.status = 'active'
      and s.active_branch_id is null
  loop
    -- Check if session already has a branch
    select b.id into branch_id
    from public.branches b
    where b.session_id = sess.id
    order by b.created_at asc
    limit 1;

    if branch_id is not null then
      update public.sessions set active_branch_id = branch_id where id = sess.id;
    else
      insert into public.branches (session_id, user_id, name, title, status)
      values (sess.id, sess.user_id, 'main', '主线', 'active')
      returning id into branch_id;
      update public.sessions set active_branch_id = branch_id where id = sess.id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- 12. Backfill messages without branch_id
-- Assign orphan messages to the session's active branch (or the first branch)
-- ============================================================
do $$
declare
  sess record;
  target_branch_id uuid;
begin
  for sess in
    select s.id, s.active_branch_id
    from public.sessions s
    where s.deleted_at is null
  loop
    if sess.active_branch_id is null then
      select b.id into target_branch_id
      from public.branches b
      where b.session_id = sess.id
      order by b.created_at asc
      limit 1;
    else
      target_branch_id := sess.active_branch_id;
    end if;

    if target_branch_id is not null then
      update public.messages
      set branch_id = target_branch_id
      where session_id = sess.id
        and (branch_id is null or branch_id not in (
          select b2.id from public.branches b2 where b2.session_id = sess.id
        ));
    end if;
  end loop;
end;
$$;
