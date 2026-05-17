import type { CharacterRow } from "../types/database";

export interface CharacterCardData {
  identity: string;
  appearance: string;
  personality: string;
  background: string;
  speaking_style: string;
  relationship: string;
  relationship_stage: string;
  user_nickname: string;
  greeting: string;
  forbidden_rules: string;
  likes: string;
  extra_settings: Record<string, unknown>;
}

export function parseCharacterCard(c: CharacterRow): CharacterCardData {
  const j = (c.card_json ?? {}) as Record<string, unknown>;
  return {
    identity: String(j.identity ?? ""),
    appearance: String(j.appearance ?? ""),
    personality: String(j.personality ?? ""),
    background: String(j.background ?? ""),
    speaking_style: String(j.speaking_style ?? ""),
    relationship: String(j.relationship ?? ""),
    relationship_stage: String(j.relationship_stage ?? ""),
    user_nickname: String(j.user_nickname ?? ""),
    greeting: String(j.greeting ?? ""),
    forbidden_rules: String(j.forbidden_rules ?? ""),
    likes: String(j.likes ?? ""),
    extra_settings: (j.extra_settings as Record<string, unknown>) ?? {},
  };
}

export function packCharacterCard(data: CharacterCardData): Record<string, unknown> {
  return {
    identity: data.identity,
    appearance: data.appearance,
    personality: data.personality,
    background: data.background,
    speaking_style: data.speaking_style,
    relationship: data.relationship,
    relationship_stage: data.relationship_stage,
    user_nickname: data.user_nickname,
    greeting: data.greeting,
    forbidden_rules: data.forbidden_rules,
    likes: data.likes,
    extra_settings: data.extra_settings,
  };
}

export const EMPTY_CARD: CharacterCardData = {
  identity: "", appearance: "", personality: "", background: "",
  speaking_style: "", relationship: "", relationship_stage: "",
  user_nickname: "", greeting: "", forbidden_rules: "", likes: "",
  extra_settings: {},
};

// Build the FULL system prompt sent to Provider.
// Phase 5: merges character card + template content with variable substitution.
export function buildCharacterSystemPrompt(
  c: CharacterRow,
  templateContent?: string,
): string | null {
  const card = parseCharacterCard(c);

  if (!card.identity && !card.personality && !templateContent) return null;

  // Build role base prompt
  const roleParts: string[] = [];
  roleParts.push(`你正在扮演「${c.name}」`);
  if (card.identity) roleParts.push(`身份：${card.identity}`);
  if (card.personality) roleParts.push(`性格：${card.personality}`);
  if (card.appearance) roleParts.push(`外貌：${card.appearance}`);
  if (card.background) roleParts.push(`背景：${card.background}`);
  if (card.speaking_style) roleParts.push(`说话风格：${card.speaking_style}`);
  if (card.relationship) {
    roleParts.push(`与用户的关系：${card.relationship}`);
    if (card.relationship_stage) roleParts.push(`当前阶段：${card.relationship_stage}`);
  }
  if (card.user_nickname) roleParts.push(`称呼用户为：${card.user_nickname}`);
  if (card.likes) roleParts.push(`喜欢：${card.likes}`);
  if (card.forbidden_rules) roleParts.push(`必须遵守：${card.forbidden_rules}`);
  roleParts.push("请始终保持在角色设定内回复，不要跳出角色。");

  const rolePrompt = roleParts.join("\n");

  // If template is provided, merge it WITH the role prompt
  if (templateContent) {
    const templateWithVars = templateContent
      .replace(/\{\{character_name\}\}/g, c.name)
      .replace(/\{\{user_name\}\}/g, card.user_nickname || "用户")
      .replace(/\{\{current_scene\}\}/g, "（当前场景将在后续阶段动态注入）")
      .replace(/\{\{relationship_stage\}\}/g, card.relationship_stage || "未设定")
      .replace(/\{\{speaking_style\}\}/g, card.speaking_style || "自然对话")
      .replace(/\{\{greeting\}\}/g, card.greeting || "");

    return `${templateWithVars}\n\n---\n角色基础设定（参考）：\n${rolePrompt}`;
  }

  return rolePrompt;
}

// Session metadata helper: store/read template binding via system_prompt JSON
export const SESSION_META_VERSION = 1;

export interface SessionMeta {
  _template_id?: string;
  _meta_version: number;
}

export function parseSessionMeta(systemPrompt: string | null): SessionMeta {
  if (!systemPrompt) return { _meta_version: SESSION_META_VERSION };
  try {
    const parsed = JSON.parse(systemPrompt);
    if (parsed && typeof parsed === "object" && parsed._meta_version) {
      return parsed as SessionMeta;
    }
  } catch { /* not JSON, treat as empty */ }
  return { _meta_version: SESSION_META_VERSION };
}

export function buildSessionMeta(templateId: string | null): string {
  const meta: SessionMeta = {
    _meta_version: SESSION_META_VERSION,
    _template_id: templateId ?? undefined,
  };
  return JSON.stringify(meta);
}
