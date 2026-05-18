// Token budget estimation and trimming — Phase 6
// Uses simple character-based estimation (Chinese-aware).

const DEFAULT_TOTAL_BUDGET = 8000;

export const BUDGET_LIMITS = {
  characterTemplate: 2000,
  worldbook: 2000,
  memory: 1500,
  summary: 800,
  // recentMessages gets the remainder
};

export interface BudgetAllocation {
  characterPrompt: string;
  templatePrompt: string;
  worldbookEntries: { id: string; title: string; content: string; priority: number; tokens: number }[];
  memories: { id: string; title: string; content: string; salience: number; tokens: number }[];
  summary: string;
  recentMessages: string[];
  totalEstimated: number;
  budgetLimit: number;
}

// Simple token estimation: Chinese ~1.5 chars/token, English ~4 chars/token
// We use a conservative 1.5 divisor for mixed content
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 1.5));
}

export function buildBudget(
  characterPrompt: string,
  templatePrompt: string,
  entries: { id: string; title: string; content: string; priority: number }[],
  memories: { id: string; title: string; content: string; salience: number }[],
  summary: string,
  recentMessages: string[],
  totalBudget = DEFAULT_TOTAL_BUDGET,
): BudgetAllocation {
  // Estimate fixed costs
  const charTokens = estimateTokens(characterPrompt);
  const tplTokens = estimateTokens(templatePrompt);
  const summaryTokens = estimateTokens(summary);

  // Allocate worldbook entries by priority (highest first)
  const wbBudget = BUDGET_LIMITS.worldbook;
  const wbAllocated: BudgetAllocation["worldbookEntries"] = [];
  let wbUsed = 0;

  const sortedEntries = [...entries].sort((a, b) => b.priority - a.priority);
  for (const e of sortedEntries) {
    const tokens = estimateTokens(e.content);
    if (wbUsed + tokens <= wbBudget) {
      wbAllocated.push({ ...e, tokens });
      wbUsed += tokens;
    }
    // else: skipped due to budget
  }

  // Allocate memories by salience (highest first)
  const memBudget = BUDGET_LIMITS.memory;
  const memAllocated: BudgetAllocation["memories"] = [];
  let memUsed = 0;

  const sortedMemories = [...memories].sort((a, b) => b.salience - a.salience);
  for (const m of sortedMemories) {
    const tokens = estimateTokens(m.content);
    if (memUsed + tokens <= memBudget) {
      memAllocated.push({ ...m, tokens });
      memUsed += tokens;
    }
  }

  // Calculate total
  const totalEstimated =
    charTokens + tplTokens + wbUsed + memUsed + summaryTokens;

  // Recent messages fill remaining budget
  const remaining = Math.max(0, totalBudget - totalEstimated);
  const allocatedMessages: string[] = [];
  let msgUsed = 0;
  for (const msg of recentMessages.reverse()) {
    const tokens = estimateTokens(msg);
    if (msgUsed + tokens <= remaining) {
      allocatedMessages.unshift(msg);
      msgUsed += tokens;
    } else {
      break;
    }
  }

  return {
    characterPrompt,
    templatePrompt,
    worldbookEntries: wbAllocated,
    memories: memAllocated,
    summary,
    recentMessages: allocatedMessages,
    totalEstimated: totalEstimated + msgUsed,
    budgetLimit: totalBudget,
  };
}
