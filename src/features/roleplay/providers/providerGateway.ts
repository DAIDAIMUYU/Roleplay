import type {
  ProviderAdapter,
  ProviderMeta,
  ProviderType,
  ProviderRuntimeMode,
  ModelProviderConfig,
  TestResult,
  ChatMessage,
  ChatResult,
  AppProblem,
} from "./provider.types";
import { AVAILABLE_PROVIDERS, DEFAULT_PROVIDER_CONFIG } from "./provider.types";
import { mockProvider } from "./mockProvider";
import { deepseekProvider } from "./deepseekProvider";
import { openAICompatibleProvider } from "./openAICompatibleProvider";
import { loadApiKey } from "../storage/apiKeyStorage";
import { configError } from "./providerErrors";

// Provider Gateway — single entry point for all model calls.
// Routes between Mock (Guest/Demo) and real providers (BYOK).
// Phase 3: test connection + basic chat. Streaming in Phase 4.

const adapters = new Map<ProviderType, ProviderAdapter>([
  ["mock", mockProvider],
  ["deepseek", deepseekProvider],
  ["openai_compatible", openAICompatibleProvider],
]);

function getAdapter(provider: ProviderType): ProviderAdapter {
  const adapter = adapters.get(provider);
  if (!adapter) throw new Error(`Unknown provider: ${provider}`);
  return adapter;
}

// ---------- public API ----------

export function getAvailableProviders(): ProviderMeta[] {
  return AVAILABLE_PROVIDERS.filter((p) => p.enabled);
}

export function getProviderMeta(provider: ProviderType): ProviderMeta | undefined {
  return AVAILABLE_PROVIDERS.find((p) => p.id === provider);
}

export function resolveRuntimeMode(
  isGuestOrDemo: boolean,
  storageMode: ModelProviderConfig["apiKeyStorageMode"],
): ProviderRuntimeMode {
  if (isGuestOrDemo) return "demo_mock";
  if (storageMode === "session_only") return "byok_session";
  if (storageMode === "local_device") return "byok_local_device";
  return "hosted_encrypted_future";
}

export function buildConfig(overrides: {
  provider: ProviderType;
  model: string;
  baseURL: string;
  apiKey: string;
  storageMode: ModelProviderConfig["apiKeyStorageMode"];
  temperature?: number;
  maxTokens?: number;
  streamEnabled?: boolean;
}): ModelProviderConfig {
  return {
    ...DEFAULT_PROVIDER_CONFIG,
    provider: overrides.provider,
    model: overrides.model,
    baseURL: overrides.baseURL,
    apiKey: overrides.apiKey,
    apiKeyStorageMode: overrides.storageMode,
    temperature: overrides.temperature ?? DEFAULT_PROVIDER_CONFIG.temperature,
    maxTokens: overrides.maxTokens ?? DEFAULT_PROVIDER_CONFIG.maxTokens,
    streamEnabled: overrides.streamEnabled ?? false,
  };
}

export function buildConfigFromStorage(
  provider: ProviderType,
  apiKey: string,
  storageMode: ModelProviderConfig["apiKeyStorageMode"],
  model?: string,
  baseURL?: string,
): ModelProviderConfig {
  const meta = getProviderMeta(provider);
  return buildConfig({
    provider,
    model: model || meta?.defaultModel || "",
    baseURL: baseURL || meta?.defaultBaseURL || "",
    apiKey,
    storageMode,
  });
}

export function tryLoadApiKey(
  provider: ProviderType,
  storageMode: ModelProviderConfig["apiKeyStorageMode"],
): string | null {
  if (provider === "mock") return "mock-no-key-needed";
  const stored = loadApiKey(provider, storageMode);
  return stored?.apiKey ?? null;
}

export function validateConfig(config: ModelProviderConfig): AppProblem | null {
  if (config.provider === "mock") return null;

  if (!config.apiKey) {
    return configError("缺少 API Key");
  }

  if (config.provider === "openai_compatible" && !config.baseURL) {
    return configError("OpenAI Compatible 模式需要提供 Base URL");
  }

  if (!config.model) {
    return configError("缺少 Model 名称");
  }

  return null;
}

export async function testProviderConnection(
  config: ModelProviderConfig,
): Promise<TestResult> {
  const validationError = validateConfig(config);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const adapter = getAdapter(config.provider);
  return adapter.testConnection(config);
}

export async function sendProviderRequest(
  isGuestOrDemo: boolean,
  config: ModelProviderConfig,
  messages: ChatMessage[],
): Promise<ChatResult> {
  // Guest/Demo always uses Mock, regardless of config
  if (isGuestOrDemo) {
    return mockProvider.chat(config, messages);
  }

  const validationError = validateConfig(config);
  if (validationError) {
    throw validationError;
  }

  const adapter = getAdapter(config.provider);
  return adapter.chat(config, messages);
}
