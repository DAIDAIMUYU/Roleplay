-- V4.2 Stage 7B draft: encrypted hosted API credentials
-- This migration is a design draft for Stage 7B.
-- Do NOT implement hosted user API key storage in Stage 3.
-- Never store plaintext API keys.

create table if not exists public.user_api_credentials (
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
  deleted_at timestamptz,
  constraint user_api_credentials_storage_mode_check check (storage_mode in ('hosted_encrypted'))
);

create index if not exists idx_user_api_credentials_user_id on public.user_api_credentials(user_id);
create index if not exists idx_user_api_credentials_provider on public.user_api_credentials(user_id, provider);
create index if not exists idx_user_api_credentials_default on public.user_api_credentials(user_id, is_default) where deleted_at is null;

alter table public.user_api_credentials enable row level security;

-- Users can manage only their own encrypted credentials.
create policy "Users can select own api credentials"
  on public.user_api_credentials for select
  using (auth.uid() = user_id);

create policy "Users can insert own api credentials"
  on public.user_api_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update own api credentials"
  on public.user_api_credentials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own api credentials"
  on public.user_api_credentials for delete
  using (auth.uid() = user_id);

-- Important: Admin is intentionally not granted a default policy to read private credentials.
-- Owner/Admin management should use aggregate status views or audited server-side functions, never plaintext key display.
