export type HostedProviderType = "deepseek" | "openai_compatible";

export interface HostedProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HostedProviderUsage {
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

export interface ProviderCredentialRecord {
  id: string;
  user_id: string;
  label: string | null;
  provider_type: HostedProviderType;
  base_url: string | null;
  default_model: string | null;
  storage_mode: "hosted_encrypted";
  status: "active" | "disabled" | "deleted";
  is_default: boolean;
  last_tested_at: string | null;
  last_used_at: string | null;
  last_error: string | null;
  key_fingerprint: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProviderSecretRecord {
  id: string;
  credential_id: string;
  user_id: string;
  encrypted_api_key: string;
  encryption_iv: string;
  encryption_alg: string;
  encryption_key_version: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function normalizeBaseUrl(providerType: HostedProviderType, baseUrl: string | null | undefined): string {
  const trimmed = (baseUrl ?? "").trim();
  if (trimmed) return trimmed.replace(/\/+$/, "");
  if (providerType === "deepseek") return "https://api.deepseek.com/v1";
  return "";
}

export function validateProviderInput(input: {
  provider_type?: string;
  base_url?: string | null;
  default_model?: string | null;
  api_key?: string;
}) {
  if (input.provider_type !== "deepseek" && input.provider_type !== "openai_compatible") {
    throw new Error("仅支持 DeepSeek 或 OpenAI Compatible 托管凭据。");
  }

  if (input.provider_type === "openai_compatible" && !normalizeBaseUrl("openai_compatible", input.base_url)) {
    throw new Error("OpenAI Compatible 模式必须提供 Base URL。");
  }

  if (!input.default_model?.trim()) {
    throw new Error("请输入默认模型名称。");
  }

  if ("api_key" in input && !input.api_key?.trim()) {
    throw new Error("请输入 API Key。");
  }
}

export async function providerListModels(config: {
  providerType: HostedProviderType;
  baseUrl: string;
  apiKey: string;
}): Promise<string[]> {
  const response = await fetch(`${config.baseUrl}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ProviderHttpError(response.status, "模型列表请求失败");
  }

  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload?.data)
    ? payload.data
        .map((item: { id?: string }) => item?.id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    : [];
}

export async function providerChat(config: {
  providerType: HostedProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: HostedProviderMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; usage: HostedProviderUsage }> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: config.messages,
      temperature: config.temperature ?? 0.8,
      max_tokens: config.maxTokens ?? 1200,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new ProviderHttpError(response.status, "聊天请求失败");
  }

  const payload = await response.json().catch(() => ({}));
  return {
    content: payload?.choices?.[0]?.message?.content ?? "",
    usage: normalizeHostedProviderUsage(config.providerType, payload?.usage),
  };
}

/**
 * Stream chat completion via SSE.
 * Returns a ReadableStream of SSE events — the CALLER is responsible for
 * wrapping it in a Response with appropriate headers (Content-Type, CORS, etc.).
 *
 * SSE events emitted:
 *   event: delta  data: {"text":"..."}
 *   event: usage  data: {"usage":{...HostedProviderUsage...}}
 *   event: done   data: {}
 *   event: error  data: {"message":"..."}
 */
export async function providerChatStream(config: {
  providerType: HostedProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: HostedProviderMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const isDeepSeek = config.providerType === "deepseek";

  const body: Record<string, unknown> = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature ?? 0.8,
    max_tokens: config.maxTokens ?? 1200,
    stream: true,
  };

  if (isDeepSeek) {
    body.stream_options = { include_usage: true };
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new ProviderHttpError(response.status, errText || "聊天请求失败");
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        const err = sseEvent("error", { message: "Provider 未返回流式响应。" });
        controller.enqueue(encoder.encode(err));
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let finalUsage: HostedProviderUsage | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              // Send usage before done if we captured it
              if (finalUsage) {
                controller.enqueue(encoder.encode(sseEvent("usage", { usage: finalUsage })));
              }
              controller.enqueue(encoder.encode(sseEvent("done", {})));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              if (json.usage) {
                finalUsage = normalizeHostedProviderUsage(config.providerType, json.usage);
              }
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(sseEvent("delta", { text: delta })));
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "流式读取失败";
        controller.enqueue(encoder.encode(sseEvent("error", { message })));
        controller.close();
        return;
      } finally {
        try { reader.releaseLock(); } catch { /* ignore */ }
      }

      // Stream ended without [DONE]
      if (finalUsage) {
        controller.enqueue(encoder.encode(sseEvent("usage", { usage: finalUsage })));
      }
      controller.enqueue(encoder.encode(sseEvent("done", {})));
      controller.close();
    },
  });

  return stream;
}

function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function providerFetchBalance(config: {
  providerType: HostedProviderType;
  baseUrl: string;
  apiKey: string;
}): Promise<{
  provider: "deepseek";
  isAvailable: boolean;
  balances: Array<{
    currency: string;
    totalBalance: string;
    grantedBalance: string;
    toppedUpBalance: string;
  }>;
  fetchedAt: string;
}> {
  if (config.providerType !== "deepseek") {
    throw new ProviderHttpError(400, "当前阶段仅支持 DeepSeek 余额查询。");
  }

  const response = await fetch("https://api.deepseek.com/user/balance", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ProviderHttpError(response.status, "余额请求失败");
  }

  const payload = await response.json().catch(() => ({}));
  return {
    provider: "deepseek",
    isAvailable: Boolean(payload?.is_available),
    balances: Array.isArray(payload?.balance_infos)
      ? payload.balance_infos.map((item: Record<string, unknown>) => ({
          currency: String(item?.currency ?? "USD"),
          totalBalance: String(item?.total_balance ?? "0"),
          grantedBalance: String(item?.granted_balance ?? "0"),
          toppedUpBalance: String(item?.topped_up_balance ?? "0"),
        }))
      : [],
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeHostedProviderUsage(
  provider: HostedProviderType,
  rawUsage: unknown,
): HostedProviderUsage {
  const usage = rawUsage && typeof rawUsage === "object" ? (rawUsage as Record<string, unknown>) : null;
  if (!usage) {
    return {
      usageAvailable: false,
      usageUnavailableReason: "当前 Provider 未返回本次用量。",
      rawUsage: null,
      sourceProvider: provider,
    };
  }

  const inputTokens = toNumber(usage.prompt_tokens);
  const outputTokens = toNumber(usage.completion_tokens);
  const totalTokens = toNumber(usage.total_tokens);
  const cacheHitInputTokens = provider === "deepseek" ? toNumber(usage.prompt_cache_hit_tokens) : undefined;
  const cacheMissInputTokens = provider === "deepseek" ? toNumber(usage.prompt_cache_miss_tokens) : undefined;
  const reasoningTokens =
    provider === "deepseek" &&
    usage.completion_tokens_details &&
    typeof usage.completion_tokens_details === "object"
      ? toNumber((usage.completion_tokens_details as Record<string, unknown>).reasoning_tokens)
      : undefined;

  const cacheTotal =
    (cacheHitInputTokens ?? 0) + (cacheMissInputTokens ?? 0) > 0
      ? (cacheHitInputTokens ?? 0) + (cacheMissInputTokens ?? 0)
      : undefined;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cacheHitInputTokens,
    cacheMissInputTokens,
    cacheHitRate: cacheTotal ? (cacheHitInputTokens ?? 0) / cacheTotal : undefined,
    reasoningTokens,
    rawUsage: usage,
    sourceProvider: provider,
    usageAvailable: [inputTokens, outputTokens, totalTokens, cacheHitInputTokens, cacheMissInputTokens, reasoningTokens].some(
      (value) => typeof value === "number",
    ),
    usageUnavailableReason: [inputTokens, outputTokens, totalTokens].every((value) => typeof value !== "number")
      ? "当前 Provider 未返回本次用量。"
      : undefined,
  };
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export class ProviderHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

export function mapProviderError(error: unknown): { status: number; detail: string } {
  if (error instanceof ProviderHttpError) {
    switch (error.status) {
      case 401:
        return { status: 401, detail: "托管凭据校验失败，请检查 API Key 是否有效。" };
      case 403:
        return { status: 403, detail: "服务商拒绝访问，请检查密钥权限或账号状态。" };
      case 404:
        return { status: 404, detail: "Base URL 或模型不存在，请检查设置。" };
      case 429:
        return { status: 429, detail: "请求过于频繁或额度不足，请稍后重试。" };
      default:
        if (error.status >= 500) {
          return { status: error.status, detail: "服务商暂时不可用，请稍后重试。" };
        }
        return { status: error.status, detail: "托管 Provider 请求失败。" };
    }
  }

  if (error instanceof Error) {
    if (/fetch|network|timeout|dns|ENOTFOUND/i.test(error.message)) {
      return { status: 503, detail: "无法连接到 Provider，请检查 Base URL 或网络。" };
    }
  }

  return { status: 500, detail: "托管 Provider 调用失败。" };
}
