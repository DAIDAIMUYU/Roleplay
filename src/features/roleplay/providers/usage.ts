import type { ProviderType, ProviderUsage } from "./provider.types";

type OpenAIUsageLike = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function normalizeProviderUsage(
  provider: ProviderType,
  rawUsage: unknown,
): ProviderUsage {
  if (!rawUsage || typeof rawUsage !== "object") {
    return {
      usageAvailable: false,
      usageUnavailableReason: "当前 Provider 未返回本次用量。",
      rawUsage: null,
      sourceProvider: provider,
    };
  }

  const usage = rawUsage as OpenAIUsageLike;
  const inputTokens = toNumber(usage.prompt_tokens);
  const outputTokens = toNumber(usage.completion_tokens);
  const totalTokens = toNumber(usage.total_tokens)
    ?? ((inputTokens ?? 0) + (outputTokens ?? 0) || undefined);
  const cacheHitInputTokens = provider === "deepseek" ? toNumber(usage.prompt_cache_hit_tokens) : undefined;
  const cacheMissInputTokens = provider === "deepseek" ? toNumber(usage.prompt_cache_miss_tokens) : undefined;
  const cacheTotal = (cacheHitInputTokens ?? 0) + (cacheMissInputTokens ?? 0);
  const cacheHitRate = cacheTotal > 0 && cacheHitInputTokens !== undefined
    ? cacheHitInputTokens / cacheTotal
    : undefined;
  const reasoningTokens = provider === "deepseek"
    ? toNumber(usage.completion_tokens_details?.reasoning_tokens)
    : undefined;

  const usageAvailable = [
    inputTokens,
    outputTokens,
    totalTokens,
    cacheHitInputTokens,
    cacheMissInputTokens,
    reasoningTokens,
  ].some((value) => value !== undefined);

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cacheHitInputTokens,
    cacheMissInputTokens,
    cacheHitRate,
    reasoningTokens,
    rawUsage,
    sourceProvider: provider,
    usageAvailable,
    usageUnavailableReason: usageAvailable ? undefined : "当前 Provider 未返回本次用量。",
  };
}
