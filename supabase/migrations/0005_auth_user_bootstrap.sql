-- 0005_auth_user_bootstrap.sql
-- 自动为新注册用户创建 profiles 和 user_roles (role='user')
-- 同时 backfill 已存在的 auth.users

-- ============================================
-- 1. handle_new_user 函数 (security definer)
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Auto-create profile if not exists
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;

  -- Auto-assign role='user' if not exists
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- ============================================
-- 2. Trigger: after insert on auth.users
-- ============================================
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- 3. Backfill: 补历史用户
-- ============================================

-- Backfill profiles for existing auth users who are missing one
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', u.email)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- Backfill user_roles for existing auth users who are missing one
insert into public.user_roles (user_id, role)
select
  u.id,
  'user'
from auth.users u
where not exists (
  select 1 from public.user_roles ur where ur.user_id = u.id and ur.role = 'user'
)
on conflict (user_id, role) do nothing;
