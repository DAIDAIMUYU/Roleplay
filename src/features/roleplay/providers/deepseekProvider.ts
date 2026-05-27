import type {
  ProviderAdapter,
  ProviderType,
  ModelProviderConfig,
  TestResult,
  ChatMessage,
  ChatResult,
  ChatStreamChunk,
  AppProblem,
} from "./provider.types";
import { translateError } from "./providerErrors";
import { normalizeProviderUsage } from "./usage";

export const deepseekProvider: ProviderAdapter = {
  id: "deepseek" as ProviderType,

  async testConnection(config: ModelProviderConfig): Promise<TestResult> {
    const start = performance.now();
    if (!config.apiKey) {
      return {
        ok: false,
        error: {
          type: "missing_key", title: "缺少 API Key", status: 0,
          detail: "请输入 DeepSeek API Key",
          provider: "deepseek", retryable: false,
        },
      };
    }
    try {
      const resp = await fetch(`${config.baseURL}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${config.apiKey}`, Accept: "application/json" },
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        return { ok: false, latencyMs, error: translateError({ status: resp.status, message: body }, "deepseek") };
      }
      const data = await resp.json();
      const models = data?.data?.map((m: { id: string }) => m.id) ?? [];
      return { ok: true, latencyMs, models };
    } catch (err) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: translateError(err, "deepseek") };
    }
  },

  async chat(config: ModelProviderConfig, messages: ChatMessage[]): Promise<ChatResult> {
    if (!config.apiKey) throw new Error("缺少 API Key");
    const resp = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model || "deepseek-chat",
        messages,
        temperature: config.temperature ?? 0.8,
        max_tokens: config.maxTokens ?? 1200,
        stream: false,
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw translateError({ status: resp.status, message: errBody }, "deepseek");
    }
    const data = await resp.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      usage: normalizeProviderUsage("deepseek", data.usage),
    };
  },

  async *chatStream(
    config: ModelProviderConfig,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamChunk> {
    if (!config.apiKey) throw new Error("缺少 API Key");

    const resp = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model || "deepseek-chat",
        messages,
        temperature: config.temperature ?? 0.8,
        max_tokens: config.maxTokens ?? 1200,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal,
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw translateError({ status: resp.status, message: errBody }, "deepseek");
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("Stream not supported");

    const decoder = new TextDecoder();
    let buffer = "";
    let finalUsage = normalizeProviderUsage("deepseek", null);

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          yield { content: "", done: true };
          return;
        }

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
            yield { content: "", done: true, usage: finalUsage };
            return;
          }
          try {
            const json = JSON.parse(data);
            if (json.usage) {
              finalUsage = normalizeProviderUsage("deepseek", json.usage);
            }
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              yield { content: delta, done: false };
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield {
      content: "",
      done: true,
      usage: finalUsage.usageAvailable
        ? finalUsage
        : {
            ...finalUsage,
            usageUnavailableReason: "本次流式响应未返回完整用量，费用可能无法估算。",
          },
    };
  },

  normalizeError(err: unknown, provider: string): AppProblem {
    return translateError(err, provider);
  },
};
