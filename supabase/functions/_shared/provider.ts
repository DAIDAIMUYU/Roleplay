export type HostedProviderType = "deepseek" | "openai_compatible";

export interface HostedProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
}): Promise<{ content: string; inputTokens?: number; outputTokens?: number }> {
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
    inputTokens: payload?.usage?.prompt_tokens,
    outputTokens: payload?.usage?.completion_tokens,
  };
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
