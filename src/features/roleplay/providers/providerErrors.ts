import type { AppProblem } from "./provider.types";

// Maps HTTP status codes and network errors to Chinese user-friendly messages

export function translateError(
  err: unknown,
  provider: string,
): AppProblem {
  if (err instanceof Response || isHttpError(err)) {
    const status = getStatus(err);
    const body = getBody(err);

    switch (status) {
      case 401:
        return {
          type: "https://roleplay-tavern/errors/provider-unauthorized",
          title: "API Key 错误",
          status: 401,
          detail: "API Key 错误或无权限，请检查 Key 是否正确",
          provider,
          retryable: false,
          rawMessage: body,
        };
      case 402:
        return {
          type: "https://roleplay-tavern/errors/provider-payment-required",
          title: "余额不足",
          status: 402,
          detail: "Provider 账户余额不足，请充值后重试",
          provider,
          retryable: false,
          rawMessage: body,
        };
      case 403:
        return {
          type: "https://roleplay-tavern/errors/provider-forbidden",
          title: "访问被拒绝",
          status: 403,
          detail: "Provider 拒绝访问，请检查 Key 权限或账户状态",
          provider,
          retryable: false,
          rawMessage: body,
        };
      case 404:
        return {
          type: "https://roleplay-tavern/errors/provider-not-found",
          title: "接口或模型不存在",
          status: 404,
          detail: "模型或接口地址不存在，请检查 Base URL 和 Model 名称",
          provider,
          retryable: false,
          rawMessage: body,
        };
      case 429:
        return {
          type: "https://roleplay-tavern/errors/provider-rate-limit",
          title: "请求过频或额度不足",
          status: 429,
          detail: "请求过于频繁或 Token 额度不足，请稍后重试",
          provider,
          retryable: true,
          rawMessage: body,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: "https://roleplay-tavern/errors/provider-server-error",
          title: "服务商内部错误",
          status,
          detail: "服务商内部错误，请稍后重试。如持续出现请联系 Provider 支持。",
          provider,
          retryable: true,
          rawMessage: body,
        };
    }
  }

  // Non-HTTP errors
  const msg = getErrorMessage(err);

  if (msg.includes("timeout") || msg.includes("Timeout") || msg.includes("TIMEOUT")) {
    return {
      type: "https://roleplay-tavern/errors/timeout",
      title: "请求超时",
      status: 0,
      detail: "请求超时，请检查网络或稍后重试",
      provider,
      retryable: true,
      rawMessage: msg,
    };
  }

  if (msg.includes("Network") || msg.includes("fetch") || msg.includes("ECONNREFUSED")) {
    return {
      type: "https://roleplay-tavern/errors/network",
      title: "网络连接失败",
      status: 0,
      detail: "网络连接失败，请检查网络或代理设置",
      provider,
      retryable: true,
      rawMessage: msg,
    };
  }

  if (msg.includes("ENOTFOUND") || msg.includes("DNS")) {
    return {
      type: "https://roleplay-tavern/errors/network",
      title: "无法解析地址",
      status: 0,
      detail: "无法连接到 Base URL，请检查地址是否正确",
      provider,
      retryable: false,
      rawMessage: msg,
    };
  }

  return {
    type: "https://roleplay-tavern/errors/unknown",
    title: "未知错误",
    status: 0,
    detail: msg || "发生未知错误，请重试",
    provider,
    retryable: true,
    rawMessage: msg,
  };
}

export function configError(detail: string): AppProblem {
  return {
    type: "https://roleplay-tavern/errors/invalid-config",
    title: "配置不完整",
    status: 0,
    detail,
    provider: "",
    retryable: false,
  };
}

// Error type detection helpers

function isHttpError(err: unknown): boolean {
  return !!getStatus(err);
}

function getStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    return (err as Record<string, unknown>).status as number;
  }
  return 0;
}

function getBody(err: unknown): string | undefined {
  if (err && typeof err === "object" && "message" in err) {
    return (err as Record<string, unknown>).message as string;
  }
  return undefined;
}

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    return String(obj.message ?? obj.error ?? obj.statusText ?? JSON.stringify(err));
  }
  return String(err);
}
