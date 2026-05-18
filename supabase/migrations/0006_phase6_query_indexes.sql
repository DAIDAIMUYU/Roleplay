-- Phase 6 performance indexes for roleplay initial loads and context queries.
-- Non-destructive: no table shape or data changes.

create index if not exists idx_sessions_user_status_updated
  on public.sessions(user_id, status, updated_at desc)
  where deleted_at is null;

create index if not exists idx_messages_session_created
  on public.messages(session_id, created_at)
  where deleted_at is null;

create index if not exists idx_characters_user_active_updated
  on public.characters(user_id, updated_at desc)
  where deleted_at is null and archived_at is null;

create index if not exists idx_prompt_templates_user_updated
  on public.prompt_templates(user_id, updated_at desc);

create index if not exists idx_worldbooks_user_updated
  on public.worldbooks(user_id, updated_at desc);

create index if not exists idx_worldbook_entries_enabled_priority
  on public.worldbook_entries(worldbook_id, enabled, priority desc);

create index if not exists idx_memories_user_status_salience
  on public.memories(user_id, status, salience desc);

create index if not exists idx_session_participants_session_character
  on public.session_participants(session_id, character_id)
  where participant_type = 'character';
