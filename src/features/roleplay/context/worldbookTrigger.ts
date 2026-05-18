import type { WorldbookEntryRow } from "../types/database";

export interface TriggeredEntry {
  entry: WorldbookEntryRow;
  matchedKeywords: string[];
  injected: boolean;
  skipReason?: string;
}

export interface SkippedEntry {
  entry: WorldbookEntryRow;
  reason: string;
}

export interface TriggerResult {
  triggered: TriggeredEntry[];
  skipped: SkippedEntry[];
}

type EntryWithKeywordAliases = WorldbookEntryRow & {
  keywords?: unknown;
  keyword?: unknown;
};

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[.,!?;:'"()[\]{}<>/\\|`~@#$%^&*_+=，。！？；：“”‘’（）【】《》、…—-]/g, "");
}

export function parseKeywords(raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const keywords = values.flatMap((value) =>
    String(value)
      .split(/[,，、\n\r;；]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
  return [...new Set(keywords)];
}

export function getEntryKeywords(entry: WorldbookEntryRow): string[] {
  const withAliases = entry as EntryWithKeywordAliases;
  return parseKeywords(withAliases.triggers ?? withAliases.keywords ?? withAliases.keyword);
}

export function matchKeywords(input: string, keywordsRaw: unknown): string[] {
  const normalizedInput = normalizeForMatch(input);
  if (!normalizedInput) return [];

  return parseKeywords(keywordsRaw).filter((keyword) => {
    const normalizedKeyword = normalizeForMatch(keyword);
    return normalizedKeyword.length > 0 && normalizedInput.includes(normalizedKeyword);
  });
}

export function triggerWorldbookEntries(
  entries: WorldbookEntryRow[],
  userMessage: string,
  recentMessages: string[],
  activeCharacterName: string | null,
  _activeSessionId: string | null,
  budgetAllocatedIds: Set<string>,
): TriggerResult {
  const triggered: TriggeredEntry[] = [];
  const skipped: SkippedEntry[] = [];
  const triggerText = [userMessage, ...recentMessages.slice(-8), activeCharacterName ?? ""]
    .filter(Boolean)
    .join(" ");

  for (const entry of entries) {
    if (!entry.enabled) {
      skipped.push({ entry, reason: "条目已禁用" });
      continue;
    }

    if (entry.scope === "character" && !activeCharacterName) {
      skipped.push({ entry, reason: "角色范围条目需要绑定角色" });
      continue;
    }

    const matchedKeywords = matchKeywords(triggerText, getEntryKeywords(entry));
    if (matchedKeywords.length === 0) {
      skipped.push({ entry, reason: "无关键词命中" });
      continue;
    }

    const injected = budgetAllocatedIds.has(entry.id);
    if (!injected) {
      skipped.push({ entry, reason: `Token 预算超限（优先级 ${entry.priority}）` });
    }

    triggered.push({
      entry,
      matchedKeywords,
      injected,
      skipReason: injected ? undefined : "Token 预算超限",
    });
  }

  return { triggered, skipped };
}
