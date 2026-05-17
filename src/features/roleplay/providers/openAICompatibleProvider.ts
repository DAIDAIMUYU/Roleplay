import type {
  ProviderAdapter,
  ProviderType,
  ModelProviderConfig,
  TestResult,
  ChatMessage,
  ChatResult,
  AppProblem,
} from "./provider.types";
import { translateError } from "./providerErrors";

// OpenAI-compatible Provider — BYOK, Phase 3.
// For any service with an OpenAI-compatible API (/v1/chat/completions).
// API Key is NEVER logged, stored in DB, or sent to any server except the configured baseURL.

export const openAICompatibleProvider: ProviderAdapter = {
  id: "openai_compatible" as ProviderType,

  async testConnection(config: ModelProviderConfig): Promise<TestResult> {
    const start = performance.now();

    if (!config.apiKey) {
      return {
        ok: false,
        error: {
          type: "missing_key",
          title: "缺少 API Key",
          status: 0,
          detail: "请输入 API Key",
          provider: "openai_compatible",
          retryable: false,
        },
      };
    }

    if (!config.baseURL) {
      return {
        ok: false,
        error: {
          type: "missing_base_url",
          title: "缺少 Base URL",
          status: 0,
          detail: "OpenAI Compatible 模式需要提供 Base URL",
          provider: "openai_compatible",
          retryable: false,
        },
      };
    }

    try {
      const resp = await fetch(`${config.baseURL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        const error = translateError(
          { status: resp.status, message: body },
          "openai_compatible",
        );
        return { ok: false, latencyMs, error };
      }

      const data = await resp.json();
      const models = data?.data?.map((m: { id: string }) => m.id) ?? [];

      return { ok: true, latencyMs, models };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const error = translateError(err, "openai_compatible");
      return { ok: false, latencyMs, error };
    }
  },

  async chat(
    config: ModelProviderConfig,
    messages: ChatMessage[],
  ): Promise<ChatResult> {
    if (!config.apiKey) throw new Error("缺少 API Key");
    if (!config.baseURL) throw new Error("缺少 Base URL");
    if (!config.model) throw new Error("缺少 Model 名称");

    const body = {
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.8,
      max_tokens: config.maxTokens ?? 1200,
      stream: false,
    };

    const resp = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw translateError(
        { status: resp.status, message: errBody },
        "openai_compatible",
      );
    }

    const data = await resp.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
  },

  normalizeError(err: unknown, provider: string): AppProblem {
    return translateError(err, provider);
  },
};
