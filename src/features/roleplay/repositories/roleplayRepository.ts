import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileRow,
  CharacterRow,
  SessionRow,
  BranchRow,
  MessageRow,
  PromptTemplateRow,
  WorldbookRow,
  WorldbookEntryRow,
  MemoryRow,
  ModelPresetRow,
  ContextRunRow,
} from "../types/database";
import type {
  CreateCharacter,
  UpdateCharacter,
  CreateSession,
  UpdateSession,
  CreateMessage,
  CreatePromptTemplate,
  UpdatePromptTemplate,
  CreateWorldbookEntry,
  UpdateWorldbookEntry,
  CreateMemory,
  UpdateMemory,
  CreateModelPreset,
  UpdateModelPreset,
  AppSettings,
} from "../types/roleplay";

// ============================================================
//  Repository 层 — 所有 Supabase 数据访问必须经过此层
//  组件禁止直接使用 supabase.from() 查询数据库
// ============================================================

// ---------- profiles ----------

export async function getCurrentProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as ProfileRow | null;
}

export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  overrides?: Partial<Pick<ProfileRow, "handle" | "display_name">>,
): Promise<ProfileRow> {
  const existing = await getCurrentProfile(supabase, userId);
  if (existing) return existing;

  const { data } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: overrides?.display_name ?? null,
      handle: overrides?.handle ?? null,
    })
    .select()
    .single();
  return data as ProfileRow;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Pick<ProfileRow, "handle" | "display_name" | "avatar_path">>,
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  return data as ProfileRow | null;
}

// ---------- characters ----------

export async function listCharacters(
  supabase: SupabaseClient,
  userId: string,
): Promise<CharacterRow[]> {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  return (data as CharacterRow[]) ?? [];
}

export async function getCharacter(
  supabase: SupabaseClient,
  characterId: string,
): Promise<CharacterRow | null> {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();
  return data as CharacterRow | null;
}

export async function createCharacter(
  supabase: SupabaseClient,
  userId: string,
  input: CreateCharacter,
): Promise<CharacterRow | null> {
  const { data } = await supabase
    .from("characters")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as CharacterRow | null;
}

export async function updateCharacter(
  supabase: SupabaseClient,
  characterId: string,
  userId: string,
  input: UpdateCharacter,
): Promise<CharacterRow | null> {
  const { data } = await supabase
    .from("characters")
    .update(input)
    .eq("id", characterId)
    .eq("user_id", userId)
    .select()
    .single();
  return data as CharacterRow | null;
}

export async function archiveCharacter(
  supabase: SupabaseClient,
  characterId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("characters")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("user_id", userId);
}

export async function deleteCharacter(
  supabase: SupabaseClient,
  characterId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("characters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("user_id", userId);
}

// ---------- sessions ----------

export async function listSessions(
  supabase: SupabaseClient,
  userId: string,
): Promise<SessionRow[]> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  return (data as SessionRow[]) ?? [];
}

export async function getSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  return data as SessionRow | null;
}

export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  input: CreateSession,
): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("sessions")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as SessionRow | null;
}

export async function updateSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  input: UpdateSession,
): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("sessions")
    .update(input)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();
  return data as SessionRow | null;
}

export async function archiveSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("sessions")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

export async function deleteSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("sessions")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

// ---------- messages ----------

export async function listMessages(
  supabase: SupabaseClient,
  sessionId: string,
  branchId?: string,
): Promise<MessageRow[]> {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data } = await query;
  return (data as MessageRow[]) ?? [];
}

export async function createMessage(
  supabase: SupabaseClient,
  userId: string,
  input: CreateMessage,
): Promise<MessageRow | null> {
  const { data } = await supabase
    .from("messages")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as MessageRow | null;
}

export async function deleteMessage(
  supabase: SupabaseClient,
  messageId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", userId);
}

export async function clearSessionMessages(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("messages")
    .update({ deleted_at: now })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
}

// ---------- branches ----------

export async function listBranches(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<BranchRow[]> {
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  return (data as BranchRow[]) ?? [];
}

// ---------- prompt templates ----------

export async function listPromptTemplates(
  supabase: SupabaseClient,
  userId?: string,
): Promise<PromptTemplateRow[]> {
  let query = supabase.from("prompt_templates").select("*");
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data } = await query.order("updated_at", { ascending: false });
  return (data as PromptTemplateRow[]) ?? [];
}

export async function createPromptTemplate(
  supabase: SupabaseClient,
  userId: string,
  input: CreatePromptTemplate,
): Promise<PromptTemplateRow | null> {
  const { data } = await supabase
    .from("prompt_templates")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as PromptTemplateRow | null;
}

export async function updatePromptTemplate(
  supabase: SupabaseClient,
  templateId: string,
  input: UpdatePromptTemplate,
): Promise<PromptTemplateRow | null> {
  const { data } = await supabase
    .from("prompt_templates")
    .update(input)
    .eq("id", templateId)
    .select()
    .single();
  return data as PromptTemplateRow | null;
}

export async function deletePromptTemplate(
  supabase: SupabaseClient,
  templateId: string,
): Promise<void> {
  await supabase.from("prompt_templates").delete().eq("id", templateId);
}

// ---------- worldbooks ----------

export async function listWorldbooks(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorldbookRow[]> {
  const { data } = await supabase
    .from("worldbooks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data as WorldbookRow[]) ?? [];
}

// ---------- worldbook entries ----------

export async function listWorldbookEntries(
  supabase: SupabaseClient,
  worldbookId: string,
): Promise<WorldbookEntryRow[]> {
  const { data } = await supabase
    .from("worldbook_entries")
    .select("*")
    .eq("worldbook_id", worldbookId)
    .order("priority", { ascending: false });
  return (data as WorldbookEntryRow[]) ?? [];
}

export async function createWorldbookEntry(
  supabase: SupabaseClient,
  userId: string,
  input: CreateWorldbookEntry,
): Promise<WorldbookEntryRow | null> {
  const { data } = await supabase
    .from("worldbook_entries")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as WorldbookEntryRow | null;
}

export async function updateWorldbookEntry(
  supabase: SupabaseClient,
  entryId: string,
  input: UpdateWorldbookEntry,
): Promise<WorldbookEntryRow | null> {
  const { data } = await supabase
    .from("worldbook_entries")
    .update(input)
    .eq("id", entryId)
    .select()
    .single();
  return data as WorldbookEntryRow | null;
}

export async function deleteWorldbookEntry(
  supabase: SupabaseClient,
  entryId: string,
): Promise<void> {
  await supabase.from("worldbook_entries").delete().eq("id", entryId);
}

// ---------- memories ----------

export async function listMemories(
  supabase: SupabaseClient,
  userId: string,
  sessionId?: string,
): Promise<MemoryRow[]> {
  let query = supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data } = await query;
  return (data as MemoryRow[]) ?? [];
}

export async function createMemory(
  supabase: SupabaseClient,
  userId: string,
  input: CreateMemory,
): Promise<MemoryRow | null> {
  const { data } = await supabase
    .from("memories")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as MemoryRow | null;
}

export async function updateMemory(
  supabase: SupabaseClient,
  memoryId: string,
  userId: string,
  input: UpdateMemory,
): Promise<MemoryRow | null> {
  const { data } = await supabase
    .from("memories")
    .update(input)
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select()
    .single();
  return data as MemoryRow | null;
}

export async function deleteMemory(
  supabase: SupabaseClient,
  memoryId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("memories")
    .update({ status: "deleted" })
    .eq("id", memoryId)
    .eq("user_id", userId);
}

// ---------- model presets ----------

export async function listModelPresets(
  supabase: SupabaseClient,
  userId?: string,
): Promise<ModelPresetRow[]> {
  let query = supabase.from("model_presets").select("*");
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data } = await query.order("created_at", { ascending: false });
  return (data as ModelPresetRow[]) ?? [];
}

export async function createModelPreset(
  supabase: SupabaseClient,
  userId: string,
  input: CreateModelPreset,
): Promise<ModelPresetRow | null> {
  const { data } = await supabase
    .from("model_presets")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  return data as ModelPresetRow | null;
}

export async function updateModelPreset(
  supabase: SupabaseClient,
  presetId: string,
  input: UpdateModelPreset,
): Promise<ModelPresetRow | null> {
  const { data } = await supabase
    .from("model_presets")
    .update(input)
    .eq("id", presetId)
    .select()
    .single();
  return data as ModelPresetRow | null;
}

export async function deleteModelPreset(
  supabase: SupabaseClient,
  presetId: string,
): Promise<void> {
  await supabase.from("model_presets").delete().eq("id", presetId);
}

// ---------- context runs ----------

export async function listContextRuns(
  supabase: SupabaseClient,
  userId: string,
  sessionId?: string,
): Promise<ContextRunRow[]> {
  let query = supabase
    .from("context_runs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data } = await query;
  return (data as ContextRunRow[]) ?? [];
}

export async function createContextRun(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<ContextRunRow | null> {
  const { data } = await supabase
    .from("context_runs")
    .insert({ user_id: userId, session_id: sessionId })
    .select()
    .single();
  return data as ContextRunRow | null;
}

// ---------- app settings ----------

const DEFAULT_SETTINGS: AppSettings = {
  default_provider: "deepseek",
  default_model: "deepseek-chat",
  max_context_tokens: 8000,
  demo_mode_enabled: true,
};

export function getAppSettings(): AppSettings {
  return DEFAULT_SETTINGS;
}

export function updateAppSettings(
  _updates: Partial<AppSettings>,
): AppSettings {
  // Stage 1: local-only settings. Will persist to DB in later stages.
  return { ...DEFAULT_SETTINGS, ..._updates };
}
