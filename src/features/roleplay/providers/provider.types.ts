// Provider type system — Phase 3-4

export type ProviderType = "mock" | "deepseek" | "openai_compatible";

export type ApiKeyStorageMode =
  | "session_only"
  | "local_device"
  | "hosted_encrypted_future";

export type ProviderRuntimeMode =
  | "demo_mock"
  | "byok_session"
  | "byok_local_device"
  | "hosted_encrypted_future";

export interface ModelProviderConfig {
  provider: ProviderType;
  model: string;
  baseURL: string;
  apiKey: string;
  apiKeyStorageMode: ApiKeyStorageMode;
  temperature: number;
  maxTokens: number;
  contextMessageLimit: number;
  streamEnabled: boolean;
}

export const DEFAULT_PROVIDER_CONFIG: Omit<ModelProviderConfig, "apiKey"> = {
  provider: "deepseek",
  model: "deepseek-chat",
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
  {
    id: "mock",
    label: "Mock (Demo)",
    description: "模拟回复，不调用真实 AI，不消耗任何 API",
    defaultBaseURL: "",
    defaultModel: "mock",
    requiresBaseURL: false,
    enabled: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    description: "使用你自己的 DeepSeek API Key",
    defaultBaseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    requiresBaseURL: false,
    enabled: true,
  },
  {
    id: "openai_compatible",
    label: "OpenAI Compatible",
    description: "兼容 OpenAI API 格式的服务商",
    defaultBaseURL: "",
    defaultModel: "",
    requiresBaseURL: true,
    enabled: true,
  },
];

// Error types

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

export interface ChatResult {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

// Phase 4: Streaming

export interface ChatStreamChunk {
  content: string;
  done: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

// Provider Adapter interface

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
