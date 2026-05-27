import type { ProviderCostEstimate, ProviderUsage } from "../provider.types";

export const DEEPSEEK_PRICING_VERSION = "deepseek-pricing-2026-05-27";
export const DEEPSEEK_PRICING_UPDATED_AT = "2026-05-27";

export const deepseekPricingTable = {
  provider: "deepseek",
  version: DEEPSEEK_PRICING_VERSION,
  updatedAt: DEEPSEEK_PRICING_UPDATED_AT,
  source: "DeepSeek official pricing page",
  currency: "USD",
  models: {
    "deepseek-v4-flash": {
      cacheHitInputPer1M: 0.0028,
      cacheMissInputPer1M: 0.14,
      outputPer1M: 0.28,
    },
    "deepseek-v4-pro": {
      cacheHitInputPer1M: 0.003625,
      cacheMissInputPer1M: 0.435,
      outputPer1M: 0.87,
    },
  },
} as const;

function resolveDeepSeekPricingModel(model: string) {
  const normalized = model.trim().toLowerCase();
  if (normalized === "deepseek-v4-pro") {
    return {
      pricingModel: "deepseek-v4-pro" as const,
      warning: undefined,
    };
  }
  if (normalized === "deepseek-chat" || normalized === "deepseek-reasoner") {
    return {
      pricingModel: "deepseek-v4-flash" as const,
      warning: "旧模型名按 deepseek-v4-flash 兼容估算。",
    };
  }
  return {
    pricingModel: "deepseek-v4-flash" as const,
    warning: normalized === "deepseek-v4-flash" || normalized.length === 0
      ? undefined
      : `未找到 ${model} 的专属价格，按 deepseek-v4-flash 兼容估算。`,
  };
}

function roundUsd(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number(value.toFixed(8));
}

export function estimateDeepSeekCost(
  usage: ProviderUsage,
  model: string,
): ProviderCostEstimate | null {
  if (!usage.usageAvailable) return null;

  const { pricingModel, warning } = resolveDeepSeekPricingModel(model);
  const pricing = deepseekPricingTable.models[pricingModel];

  const outputTokens = usage.outputTokens ?? 0;
  const outputCost = roundUsd((outputTokens / 1_000_000) * pricing.outputPer1M);

  let cacheHitInputCost: number | undefined;
  let cacheMissInputCost: number | undefined;
  let estimateWarning = warning;

  if (usage.cacheHitInputTokens !== undefined || usage.cacheMissInputTokens !== undefined) {
    cacheHitInputCost = roundUsd(((usage.cacheHitInputTokens ?? 0) / 1_000_000) * pricing.cacheHitInputPer1M);
    cacheMissInputCost = roundUsd(((usage.cacheMissInputTokens ?? 0) / 1_000_000) * pricing.cacheMissInputPer1M);
  } else if (usage.inputTokens !== undefined) {
    cacheMissInputCost = roundUsd((usage.inputTokens / 1_000_000) * pricing.cacheMissInputPer1M);
    estimateWarning = estimateWarning
      ? `${estimateWarning} 未返回缓存明细，输入费用按未命中价格保守估算。`
      : "未返回缓存明细，输入费用按未命中价格保守估算。";
  }

  const inputCost = roundUsd((cacheHitInputCost ?? 0) + (cacheMissInputCost ?? 0));
  const totalCost = roundUsd((inputCost ?? 0) + (outputCost ?? 0));

  return {
    provider: "deepseek",
    currency: "USD",
    cacheHitInputCost,
    cacheMissInputCost,
    inputCost,
    outputCost,
    totalCost,
    pricingVersion: deepseekPricingTable.version,
    pricingUpdatedAt: deepseekPricingTable.updatedAt,
    isEstimated: true,
    estimateWarning,
  };
}
