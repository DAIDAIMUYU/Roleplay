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

export const openAICompatibleProvider: ProviderAdapter = {
  id: "openai_compatible" as ProviderType,

  async testConnection(config: ModelProviderConfig): Promise<TestResult> {
    const start = performance.now();
    if (!config.apiKey) {
      return {
        ok: false,
        error: {
          type: "missing_key", title: "缺少 API Key", status: 0,
          detail: "请输入 API Key",
          provider: "openai_compatible", retryable: false,
        },
      };
    }
    if (!config.baseURL) {
      return {
        ok: false,
        error: {
          type: "missing_base_url", title: "缺少 Base URL", status: 0,
          detail: "OpenAI Compatible 模式需要提供 Base URL",
          provider: "openai_compatible", retryable: false,
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
        return { ok: false, latencyMs, error: translateError({ status: resp.status, message: body }, "openai_compatible") };
      }
      const data = await resp.json();
      const models = data?.data?.map((m: { id: string }) => m.id) ?? [];
      return { ok: true, latencyMs, models };
    } catch (err) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: translateError(err, "openai_compatible") };
    }
  },

  async chat(config: ModelProviderConfig, messages: ChatMessage[]): Promise<ChatResult> {
    if (!config.apiKey) throw new Error("缺少 API Key");
    if (!config.baseURL) throw new Error("缺少 Base URL");
    if (!config.model) throw new Error("缺少 Model 名称");

    const resp = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.8,
        max_tokens: config.maxTokens ?? 1200,
        stream: false,
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw translateError({ status: resp.status, message: errBody }, "openai_compatible");
    }
    const data = await resp.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
  },

  async *chatStream(
    config: ModelProviderConfig,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamChunk> {
    if (!config.apiKey) throw new Error("缺少 API Key");
    if (!config.baseURL) throw new Error("缺少 Base URL");
    if (!config.model) throw new Error("缺少 Model 名称");

    const resp = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.8,
        max_tokens: config.maxTokens ?? 1200,
        stream: true,
      }),
      signal,
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw translateError({ status: resp.status, message: errBody }, "openai_compatible");
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("Stream not supported");

    const decoder = new TextDecoder();
    let buffer = "";
    let totalOutput = 0;
    let totalInput = 0;

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
            yield { content: "", done: true, inputTokens: totalInput, outputTokens: totalOutput };
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              totalOutput += delta.length;
              yield { content: delta, done: false };
            }
            if (json.usage?.prompt_tokens) totalInput = json.usage.prompt_tokens;
          } catch {
            // skip malformed SSE
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: "", done: true, inputTokens: totalInput, outputTokens: totalOutput };
  },

  normalizeError(err: unknown, provider: string): AppProblem {
    return translateError(err, provider);
  },
};
