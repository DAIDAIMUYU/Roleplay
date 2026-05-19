import type { ProviderType } from "./provider.types";

/**
 * ProviderPreset — 预设 API Provider 配置。
 *
 * 用户选择 Provider 后自动填入 Base URL 和模型列表。
 * 模型以预设列表为主，也支持自定义手动输入。
 */

export type PresetCompatibility =
  | "native_deepseek"
  | "openai_compatible"
  | "native_anthropic"
  | "native_gemini"
  | "not_supported_yet";

export interface PresetModel {
  id: string;
  label: string;
  description?: string;
  contextWindow?: number;
  recommended?: boolean;
  legacy?: boolean;
  supportsThinking?: boolean;
  supportsVision?: boolean;
}

export type PresetStatus =
  | "available"
  | "partial"
  | "needs_adapter"
  | "coming_soon";

export interface ProviderPreset {
  id: ProviderType;
  name: string;
  description: string;
  compatibility: PresetCompatibility;
  baseUrl: string;
  docsUrl?: string;
  authHeaderType: "bearer";
  defaultModel: string;
  models: PresetModel[];
  supportsHostedEncrypted: boolean;
  supportsLocalDevice: boolean;
  supportsSessionOnly: boolean;
  status: PresetStatus;
  notes?: string;
}

const ALL_PRESETS: ProviderPreset[] = [
  {
    id: "mock",
    name: "本地预览",
    description: "网页本地模式的预览回复，不调用真实模型，不消耗 API。",
    compatibility: "not_supported_yet",
    baseUrl: "",
    authHeaderType: "bearer",
    defaultModel: "mock",
    models: [{ id: "mock", label: "Mock (本地预览)", description: "不调用真实 API 的本地模拟回复" }],
    supportsHostedEncrypted: false,
    supportsLocalDevice: false,
    supportsSessionOnly: false,
    status: "available",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek API，高性价比中文模型。",
    compatibility: "native_deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    docsUrl: "https://api-docs.deepseek.com/",
    authHeaderType: "bearer",
    defaultModel: "deepseek-v4-flash",
    models: [
      { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", description: "项目推荐默认模型 · 快速高性价比", recommended: true },
      { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", description: "更强推理能力，适合复杂剧情", supportsThinking: true },
      { id: "deepseek-chat", label: "DeepSeek Chat (old)", description: "旧模型别名 · 建议切换到 V4 系列", legacy: true },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (old)", description: "旧推理模型 · 建议切换到 V4 Pro", legacy: true },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI API，GPT 系列模型。",
    compatibility: "openai_compatible",
    baseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/docs/",
    authHeaderType: "bearer",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o", description: "多模态旗舰模型", recommended: true, supportsVision: true },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "轻量快速" },
      { id: "gpt-4.1", label: "GPT-4.1", description: "最新旗舰" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", description: "轻量最新" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "OpenRouter 聚合平台，可访问多种模型。",
    compatibility: "openai_compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/docs/",
    authHeaderType: "bearer",
    defaultModel: "deepseek/deepseek-chat",
    models: [
      { id: "deepseek/deepseek-chat", label: "DeepSeek V3 (OpenRouter)", description: "通过 OpenRouter 的 DeepSeek", recommended: true },
      { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", description: "Anthropic Claude" },
      { id: "openai/gpt-4o", label: "GPT-4o", description: "OpenAI" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Google Gemini" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
    notes: "通过 OpenRouter 访问的模型可能产生额外费用。",
  },
  {
    id: "siliconflow",
    name: "SiliconFlow (硅基流动)",
    description: "硅基流动平台，提供多种开源和商用模型。",
    compatibility: "openai_compatible",
    baseUrl: "https://api.siliconflow.cn/v1",
    docsUrl: "https://docs.siliconflow.cn/",
    authHeaderType: "bearer",
    defaultModel: "deepseek-ai/DeepSeek-V3",
    models: [
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", recommended: true },
      { id: "deepseek-ai/DeepSeek-R1", label: "DeepSeek R1" },
      { id: "Qwen/Qwen3-235B-A22B", label: "Qwen3 235B" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi (月之暗面)",
    description: "月之暗面 Kimi 平台，中文推理表现出色。",
    compatibility: "openai_compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    docsUrl: "https://platform.moonshot.cn/docs/",
    authHeaderType: "bearer",
    defaultModel: "moonshot-v1-8k",
    models: [
      { id: "moonshot-v1-8k", label: "Moonshot v1 8K", recommended: true },
      { id: "moonshot-v1-32k", label: "Moonshot v1 32K" },
      { id: "moonshot-v1-128k", label: "Moonshot v1 128K" },
      { id: "kimi-latest", label: "Kimi Latest", description: "最新 Kimi 模型" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "qwen",
    name: "通义千问 (Alibaba Qwen)",
    description: "阿里云通义千问模型，通过 DashScope 或 OpenAI 兼容接口。",
    compatibility: "openai_compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    docsUrl: "https://help.aliyun.com/zh/model-studio/",
    authHeaderType: "bearer",
    defaultModel: "qwen-plus",
    models: [
      { id: "qwen-plus", label: "Qwen Plus", recommended: true },
      { id: "qwen-max", label: "Qwen Max" },
      { id: "qwen-turbo", label: "Qwen Turbo" },
      { id: "qwen3-235b-a22b", label: "Qwen3 235B" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Google Gemini 系列模型。当前需要专用适配器才能使用。",
    compatibility: "not_supported_yet",
    baseUrl: "",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    authHeaderType: "bearer",
    defaultModel: "gemini-2.5-pro",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", recommended: true },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: false,
    supportsLocalDevice: false,
    supportsSessionOnly: false,
    status: "needs_adapter",
    notes: "Gemini 使用专用 API 格式，当前暂未接入。建议通过 OpenRouter 中转使用。",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description: "Anthropic Claude 系列模型。当前需要专用适配器才能使用。",
    compatibility: "not_supported_yet",
    baseUrl: "",
    docsUrl: "https://docs.anthropic.com/",
    authHeaderType: "bearer",
    defaultModel: "claude-sonnet-4-6",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", recommended: true },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: false,
    supportsLocalDevice: false,
    supportsSessionOnly: false,
    status: "needs_adapter",
    notes: "Anthropic 使用专用 Messages API，当前暂未接入。建议通过 OpenRouter 中转使用。",
  },
  {
    id: "grok",
    name: "xAI Grok",
    description: "xAI Grok 模型，通过 OpenAI 兼容接口。",
    compatibility: "openai_compatible",
    baseUrl: "https://api.x.ai/v1",
    docsUrl: "https://docs.x.ai/",
    authHeaderType: "bearer",
    defaultModel: "grok-3",
    models: [
      { id: "grok-3", label: "Grok 3", recommended: true },
      { id: "grok-3-mini", label: "Grok 3 Mini" },
      { id: "__custom__", label: "自定义模型", description: "手动输入模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
  },
  {
    id: "openai_compatible",
    name: "自定义 OpenAI Compatible",
    description: "兼容 OpenAI API 格式的任意服务商，需要手动填写 Base URL 和模型。",
    compatibility: "openai_compatible",
    baseUrl: "",
    authHeaderType: "bearer",
    defaultModel: "",
    models: [
      { id: "__custom__", label: "手动输入模型", description: "需要自行填写模型名称" },
    ],
    supportsHostedEncrypted: true,
    supportsLocalDevice: true,
    supportsSessionOnly: true,
    status: "available",
    notes: "适用于任何兼容 OpenAI API 格式的服务。",
  },
];

const presetMap = new Map<string, ProviderPreset>();
ALL_PRESETS.forEach((p) => presetMap.set(p.id, p));

export function getPreset(id: ProviderType): ProviderPreset | undefined {
  return presetMap.get(id);
}

export function getAllPresets(): ProviderPreset[] {
  return ALL_PRESETS;
}

export function getAvailablePresets(): ProviderPreset[] {
  return ALL_PRESETS.filter(
    (p) => p.status === "available" || p.status === "partial",
  );
}

export function getPresetModels(id: ProviderType): PresetModel[] {
  return getPreset(id)?.models ?? [];
}

export function getDefaultModel(id: ProviderType): string {
  return getPreset(id)?.defaultModel ?? "";
}

export function getBaseUrl(id: ProviderType): string {
  return getPreset(id)?.baseUrl ?? "";
}

export function getCompatibilityAdapterType(id: ProviderType): ProviderType {
  const preset = getPreset(id);
  if (!preset) return "openai_compatible";
  switch (preset.compatibility) {
    case "native_deepseek": return "deepseek";
    case "openai_compatible": return "openai_compatible";
    default: return "openai_compatible";
  }
}

export function isPresetUsable(id: ProviderType): boolean {
  const preset = getPreset(id);
  if (!preset) return false;
  return preset.status === "available" || preset.status === "partial";
}

export function isModelLegacy(presetId: ProviderType, modelId: string): boolean {
  const models = getPresetModels(presetId);
  const model = models.find((m) => m.id === modelId);
  return model?.legacy ?? false;
}

export function getPresetName(id: ProviderType): string {
  const preset = getPreset(id);
  return preset?.name ?? id;
}
