-- 0002_v41_owner_admin_policy_patch.sql
-- V4.1：明确 Owner / Admin 权限边界。
-- 目标：Admin 管理 demo/system/admin 运营内容，但不默认读取普通用户 private 数据。



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


drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists model_presets_owner_all on public.model_presets;
drop policy if exists characters_owner_all on public.characters;
drop policy if exists character_revisions_owner_all on public.character_revisions;
drop policy if exists sessions_owner_all on public.sessions;
drop policy if exists branches_owner_all on public.branches;
drop policy if exists session_participants_owner_all on public.session_participants;
drop policy if exists messages_owner_all on public.messages;
drop policy if exists prompt_templates_owner_all on public.prompt_templates;
drop policy if exists worldbooks_owner_all on public.worldbooks;
drop policy if exists worldbook_entries_owner_all on public.worldbook_entries;
drop policy if exists memories_owner_all on public.memories;
drop policy if exists context_runs_owner_all on public.context_runs;
drop policy if exists trash_items_owner_all on public.trash_items;
drop policy if exists backup_artifacts_owner_all on public.backup_artifacts;
drop policy if exists user_roles_admin_select on public.user_roles;
drop policy if exists user_roles_admin_write on public.user_roles;
drop policy if exists audit_events_admin_select on public.audit_events;
drop policy if exists audit_events_insert on public.audit_events;
drop policy if exists profiles_self_or_staff_select on public.profiles;
drop policy if exists model_presets_select on public.model_presets;
drop policy if exists model_presets_write on public.model_presets;
drop policy if exists characters_select on public.characters;
drop policy if exists characters_write on public.characters;
drop policy if exists prompt_templates_select on public.prompt_templates;
drop policy if exists prompt_templates_write on public.prompt_templates;
drop policy if exists worldbooks_select on public.worldbooks;
drop policy if exists worldbooks_write on public.worldbooks;
drop policy if exists worldbook_entries_select on public.worldbook_entries;
drop policy if exists worldbook_entries_write on public.worldbook_entries;
drop policy if exists user_roles_select on public.user_roles;
drop policy if exists user_roles_owner_write on public.user_roles;
drop policy if exists audit_events_select on public.audit_events;

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

