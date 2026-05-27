export type ProviderType =
  | "mock"
  | "deepseek"
  | "openai"
  | "openrouter"
  | "siliconflow"
  | "moonshot"
  | "qwen"
  | "gemini"
  | "claude"
  | "grok"
  | "openai_compatible";

export type ApiKeyStorageMode =
  | "session_only"
  | "local_device"
  | "hosted_encrypted";

export type ProviderRuntimeMode =
  | "demo_mock"
  | "byok_session"
  | "byok_local_device"
  | "hosted_encrypted";

export interface ModelProviderConfig {
  provider: ProviderType;
  model: string;
  baseURL: string;
  apiKey: string;
  credentialId?: string | null;
  apiKeyStorageMode: ApiKeyStorageMode;
  temperature: number;
  maxTokens: number;
  contextMessageLimit: number;
  streamEnabled: boolean;
}

export const DEFAULT_PROVIDER_CONFIG: Omit<ModelProviderConfig, "apiKey"> = {
  provider: "deepseek",
  model: "deepseek-v4-flash",
  baseURL: "https://api.deepseek.com/v1",
  apiKeyStorageMode: "session_only",
  temperature: 0.8,
  maxTokens: 1200,
  contextMessageLimit: 20,
  streamEnabled: true,
};

export interface ProviderMeta {
  id: ProviderType;
  label: string;
  description: string;
  defaultBaseURL: string;
  defaultModel: string;
  requiresBaseURL: boolean;
  enabled: boolean;
}

export const AVAILABLE_PROVIDERS: ProviderMeta[] = [
  { id: "mock", label: "本地预览", description: "不调用真实模型，也不会消耗 API。", defaultBaseURL: "", defaultModel: "mock", requiresBaseURL: false, enabled: true },
  { id: "deepseek", label: "DeepSeek", description: "DeepSeek API · 高性价比中文模型", defaultBaseURL: "https://api.deepseek.com/v1", defaultModel: "deepseek-v4-flash", requiresBaseURL: false, enabled: true },
  { id: "openai", label: "OpenAI", description: "OpenAI API · GPT 系列模型", defaultBaseURL: "https://api.openai.com/v1", defaultModel: "gpt-4o", requiresBaseURL: false, enabled: true },
  { id: "openrouter", label: "OpenRouter", description: "聚合平台，可访问多种模型", defaultBaseURL: "https://openrouter.ai/api/v1", defaultModel: "deepseek/deepseek-chat", requiresBaseURL: false, enabled: true },
  { id: "siliconflow", label: "SiliconFlow (硅基流动)", description: "多种开源和商用模型", defaultBaseURL: "https://api.siliconflow.cn/v1", defaultModel: "deepseek-ai/DeepSeek-V3", requiresBaseURL: false, enabled: true },
  { id: "moonshot", label: "Moonshot / Kimi", description: "月之暗面 Kimi 平台", defaultBaseURL: "https://api.moonshot.cn/v1", defaultModel: "moonshot-v1-8k", requiresBaseURL: false, enabled: true },
  { id: "qwen", label: "通义千问 (Qwen)", description: "阿里云通义千问模型", defaultBaseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-plus", requiresBaseURL: false, enabled: true },
  { id: "grok", label: "xAI Grok", description: "xAI Grok 模型 · OpenAI 兼容接口", defaultBaseURL: "https://api.x.ai/v1", defaultModel: "grok-3", requiresBaseURL: false, enabled: true },
  { id: "gemini", label: "Google Gemini", description: "需要专用适配器 · 建议通过 OpenRouter 中转", defaultBaseURL: "", defaultModel: "gemini-2.5-pro", requiresBaseURL: false, enabled: false },
  { id: "claude", label: "Anthropic Claude", description: "需要专用适配器 · 建议通过 OpenRouter 中转", defaultBaseURL: "", defaultModel: "claude-sonnet-4-6", requiresBaseURL: false, enabled: false },
  { id: "openai_compatible", label: "自定义 OpenAI Compatible", description: "兼容 OpenAI API 格式的任意服务商", defaultBaseURL: "", defaultModel: "", requiresBaseURL: true, enabled: true },
];

export interface AppProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  provider: string;
  retryable: boolean;
  rawMessage?: string;
}

export interface TestResult {
  ok: boolean;
  latencyMs?: number;
  error?: AppProblem;
  models?: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheHitInputTokens?: number;
  cacheMissInputTokens?: number;
  cacheHitRate?: number;
  reasoningTokens?: number;
  rawUsage?: unknown;
  sourceProvider?: string;
  usageAvailable: boolean;
  usageUnavailableReason?: string;
}

export interface ProviderCostEstimate {
  provider: "deepseek";
  currency: "USD";
  cacheHitInputCost?: number;
  cacheMissInputCost?: number;
  inputCost?: number;
  outputCost?: number;
  totalCost?: number;
  pricingVersion: string;
  pricingUpdatedAt: string;
  isEstimated: true;
  estimateWarning?: string;
}

export interface ProviderBalanceInfo {
  currency: string;
  totalBalance: string;
  grantedBalance: string;
  toppedUpBalance: string;
}

export interface ProviderBalanceSnapshot {
  provider: "deepseek";
  isAvailable: boolean;
  balances: ProviderBalanceInfo[];
  fetchedAt: string;
}

export interface ChatResult {
  content: string;
  usage?: ProviderUsage;
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
  usage?: ProviderUsage;
}

export interface ProviderAdapter {
  readonly id: ProviderType;
  testConnection(config: ModelProviderConfig): Promise<TestResult>;
  chat(config: ModelProviderConfig, messages: ChatMessage[]): Promise<ChatResult>;
  chatStream(
    config: ModelProviderConfig,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamChunk>;
  normalizeError(err: unknown, provider: string): AppProblem;
}
