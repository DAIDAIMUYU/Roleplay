import type { CharacterRow, MemoryRow, PromptTemplateRow, WorldbookEntryRow } from "../types/database";
import type { ChatMessage } from "../providers/provider.types";
import { buildCharacterSystemPrompt } from "../utils/characterPrompt";
import { buildBudget, type BudgetAllocation } from "./tokenBudget";
import { triggerWorldbookEntries, type TriggerResult } from "./worldbookTrigger";

export interface ContextBuildInput {
  character: CharacterRow | null;
  template: PromptTemplateRow | null;
  worldbookEntries: WorldbookEntryRow[];
  memories: MemoryRow[];
  sessionSummary: string | null;
  userMessage: string;
  recentMessages: ChatMessage[];
  activeSessionId: string | null;
}

export interface ContextBuildOutput {
  systemPrompt: string;
  providerMessages: ChatMessage[];
  budget: BudgetAllocation;
  triggerResult: TriggerResult;
  debugInfo: DebugInfo;
  estimatedTokens: number;
  sessionSummaryInjected: boolean;
}

export interface DebugInfo {
  characterName: string | null;
  templateTitle: string | null;
  worldbookHits: number;
  worldbookSkipped: number;
  memoryHits: number;
  memorySkipped: number;
  summaryInjected: boolean;
  buildTimeMs: number;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function buildContext(input: ContextBuildInput): ContextBuildOutput {
  const start = nowMs();
  const {
    character,
    template,
    worldbookEntries,
    memories,
    sessionSummary,
    userMessage,
    recentMessages,
    activeSessionId,
  } = input;

  const characterPrompt = character ? buildCharacterSystemPrompt(character, template?.content) : "";
  const templatePrompt = template?.content ?? "";
  const summary = sessionSummary?.trim() ?? "";
  const recentTexts = recentMessages.map((message) => message.content);

  const enabledEntries = worldbookEntries.filter((entry) => entry.enabled);
  const wbForBudget = enabledEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    priority: entry.priority,
  }));

  const activeMemories = memories.filter((memory) => memory.status === "active");
  const memForBudget = activeMemories.map((memory) => ({
    id: memory.id,
    title: memory.title || "未命名记忆",
    content: memory.content,
    salience: memory.salience,
  }));

  const budget = buildBudget(
    characterPrompt,
    templatePrompt,
    wbForBudget,
    memForBudget,
    summary,
    recentTexts,
  );

  const budgetedIds = new Set(budget.worldbookEntries.map((entry) => entry.id));
  const triggerResult = triggerWorldbookEntries(
    enabledEntries,
    userMessage,
    recentTexts,
    character?.name ?? null,
    activeSessionId,
    budgetedIds,
  );

  const parts: string[] = [];
  if (characterPrompt) parts.push(characterPrompt);
  if (summary) parts.push(`---\n[会话摘要]\n${summary}`);

  const injectedWorldbookEntries = triggerResult.triggered.filter((hit) => hit.injected);
  if (injectedWorldbookEntries.length > 0) {
    parts.push(
      "---\n[世界书参考]\n" +
        injectedWorldbookEntries
          .map((hit) => {
            const keywords = hit.matchedKeywords.length > 0
              ? `\n命中关键词：${hit.matchedKeywords.join("、")}`
              : "";
            return `【${hit.entry.title}】${keywords}\n${hit.entry.content}`;
          })
          .join("\n\n"),
    );
  }

  if (budget.memories.length > 0) {
    parts.push(
      "---\n[相关记忆]\n" +
        budget.memories
          .map((memory) => `【${memory.title}】\n${memory.content}`)
          .join("\n\n"),
    );
  }

  const systemPrompt = parts.join("\n\n").trim();
  const providerMessages: ChatMessage[] = [];
  if (systemPrompt) {
    providerMessages.push({ role: "system", content: systemPrompt });
  }

  const added = new Set<number>();
  for (const text of budget.recentMessages) {
    const index = recentMessages.findIndex((message, i) => !added.has(i) && message.content === text);
    if (index >= 0) {
      providerMessages.push(recentMessages[index]);
      added.add(index);
    }
  }
  if (userMessage) {
    providerMessages.push({ role: "user", content: userMessage });
  }

  const debugInfo: DebugInfo = {
    characterName: character?.name ?? null,
    templateTitle: template?.title ?? null,
    worldbookHits: injectedWorldbookEntries.length,
    worldbookSkipped: triggerResult.skipped.length,
    memoryHits: budget.memories.length,
    memorySkipped: Math.max(0, memForBudget.length - budget.memories.length),
    summaryInjected: !!summary,
    buildTimeMs: Math.round(nowMs() - start),
  };

  return {
    systemPrompt,
    providerMessages,
    budget,
    triggerResult,
    debugInfo,
    estimatedTokens: budget.totalEstimated,
    sessionSummaryInjected: !!summary,
  };
}

export function collectActiveEntries(entries: WorldbookEntryRow[]): WorldbookEntryRow[] {
  return entries.filter((entry) => entry.enabled);
}
