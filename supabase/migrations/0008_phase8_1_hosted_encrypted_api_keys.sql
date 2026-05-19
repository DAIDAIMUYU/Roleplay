-- 0008_phase8_1_hosted_encrypted_api_keys.sql
-- Stage 8.1: hosted encrypted API credentials for cross-device sync
-- Keep metadata and encrypted secrets in separate tables.

create table if not exists public.provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  provider_type text not null check (provider_type in ('deepseek', 'openai_compatible')),
  base_url text,
  default_model text,
  storage_mode text not null default 'hosted_encrypted' check (storage_mode in ('hosted_encrypted')),
  status text not null default 'active' check (status in ('active', 'disabled', 'deleted')),
  is_default boolean not null default false,
  last_tested_at timestamptz,
  last_used_at timestamptz,
  last_error text,
  key_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.provider_credential_secrets (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.provider_credentials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_api_key text not null,
  encryption_iv text not null,
  encryption_alg text not null default 'AES-GCM',
  encryption_key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_provider_credentials_user_status_updated
  on public.provider_credentials(user_id, status, updated_at desc);

create index if not exists idx_provider_credentials_user_default
  on public.provider_credentials(user_id, is_default);

create index if not exists idx_provider_credential_secrets_credential
  on public.provider_credential_secrets(credential_id);

create index if not exists idx_provider_credential_secrets_user
  on public.provider_credential_secrets(user_id);

alter table public.provider_credentials enable row level security;
alter table public.provider_credential_secrets enable row level security;

drop policy if exists provider_credentials_owner_select on public.provider_credentials;
drop policy if exists provider_credentials_owner_insert on public.provider_credentials;
drop policy if exists provider_credentials_owner_update on public.provider_credentials;
drop policy if exists provider_credentials_owner_delete on public.provider_credentials;

create policy provider_credentials_owner_select
  on public.provider_credentials
  for select
  using (auth.uid() = user_id or public.is_owner());

create policy provider_credentials_owner_insert
  on public.provider_credentials
  for insert
  with check (auth.uid() = user_id or public.is_owner());

create policy provider_credentials_owner_update
  on public.provider_credentials
  for update
  using (auth.uid() = user_id or public.is_owner())
  with check (auth.uid() = user_id or public.is_owner());

create policy provider_credentials_owner_delete
  on public.provider_credentials
  for delete
  using (auth.uid() = user_id or public.is_owner());

-- Intentionally do not create read policies for provider_credential_secrets.
-- Browser clients must never be able to select encrypted secrets directly.
