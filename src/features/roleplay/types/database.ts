// Database row types matching supabase/migrations/0001_initial_schema_draft.sql

export type Visibility = "private" | "demo" | "shared" | "system" | "admin";

export interface ProfileRow {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_path: string | null;
  default_mode: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: "user" | "owner" | "admin" | "support_readonly";
  granted_by: string | null;
  granted_at: string;
}

export interface ModelPresetRow {
  id: string;
  user_id: string | null;
  name: string;
  provider: string;
  model: string;
  base_url: string | null;
  temperature: number;
  top_p: number | null;
  max_output_tokens: number;
  context_message_limit: number;
  visibility: Visibility;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  summary: string | null;
  card_json: Record<string, unknown>;
  avatar_path: string | null;
  avatar_emoji: string | null;
  tags: string[];
  visibility: Visibility;
  is_favorite: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterRevisionRow {
  id: string;
  character_id: string;
  user_id: string;
  snapshot_json: Record<string, unknown>;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  title: string;
  mode: "single" | "group" | "narration" | "story";
  status: "active" | "archived" | "deleted";
  provider: string | null;
  model: string | null;
  active_branch_id: string | null;
  primary_character_id: string | null;
  current_scene: string | null;
  story_summary: string | null;
  system_prompt: string | null;
  style_rules: string | null;
  tags: string[];
  visibility: Visibility;
  last_message_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BranchRow {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  from_message_id: string | null;
  created_at: string;
}

export interface SessionParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  participant_type: "user" | "character" | "narrator" | "system";
  character_id: string | null;
  sort_order: number;
  speaking_mode: string;
  is_active: boolean;
  created_at: string;
}

export interface MessageRow {
  id: string;
  user_id: string;
  session_id: string;
  branch_id: string;
  character_id: string | null;
  role: "user" | "assistant" | "system" | "narrator" | "tool";
  sender_name: string | null;
  content_text: string;
  content_json: Record<string, unknown>;
  parent_id: string | null;
  edited_from_id: string | null;
  token_count: number | null;
  hidden: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface PromptTemplateRow {
  id: string;
  user_id: string | null;
  title: string;
  category: string;
  content: string;
  description: string | null;
  tags: string[];
  visibility: Visibility;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorldbookRow {
  id: string;
  user_id: string;
  name: string;
  scope: string;
  description: string | null;
  tags: string[];
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface WorldbookEntryRow {
  id: string;
  worldbook_id: string;
  user_id: string;
  title: string;
  category: string;
  content: string;
  triggers: string[];
  priority: number;
  enabled: boolean;
  scope: "global" | "character" | "session" | "persona";
  token_estimate: number | null;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: string;
  user_id: string;
  session_id: string | null;
  character_id: string | null;
  memory_type:
    | "short_term"
    | "long_term"
    | "summary"
    | "event"
    | "relationship"
    | "user_preference"
    | "character_preference";
  title: string | null;
  content: string;
  source_message_id: string | null;
  salience: number;
  status: "suggested" | "active" | "disabled" | "deleted";
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContextRunRow {
  id: string;
  user_id: string;
  session_id: string;
  message_id: string | null;
  provider: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_hit_tokens: number | null;
  latency_ms: number | null;
  cost_usd: number | null;
  components_json: unknown[];
  dropped_json: unknown[];
  debug_enabled: boolean;
  created_at: string;
}

export interface TrashItemRow {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  snapshot_json: Record<string, unknown>;
  deleted_at: string;
  purge_after: string | null;
}

export interface BackupArtifactRow {
  id: string;
  user_id: string;
  scope: string;
  format: string;
  storage_path: string;
  checksum: string | null;
  schema_version: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface AuditEventRow {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_hash: string | null;
  ua_hash: string | null;
  meta_json: Record<string, unknown>;
  created_at: string;
}
