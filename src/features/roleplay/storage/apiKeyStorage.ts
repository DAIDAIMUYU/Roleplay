import type { ApiKeyStorageMode, ProviderType } from "../providers/provider.types";

const STORAGE_PREFIX = "rp_tavern_";

interface StoredApiConfig {
  apiKey: string;
  provider: ProviderType;
  model: string;
  baseURL: string;
  storageMode: ApiKeyStorageMode;
  savedAt: string;
}

const sessionStore = new Map<string, StoredApiConfig>();

function storageKey(provider: ProviderType): string {
  return `${STORAGE_PREFIX}api_config_${provider}`;
}

export function saveApiKeySession(
  provider: ProviderType,
  apiKey: string,
  model: string,
  baseURL: string,
): void {
  sessionStore.set(storageKey(provider), {
    apiKey,
    provider,
    model,
    baseURL,
    storageMode: "session_only",
    savedAt: new Date().toISOString(),
  });
}

export function saveApiKeyLocalDevice(
  provider: ProviderType,
  apiKey: string,
  model: string,
  baseURL: string,
): void {
  const config: StoredApiConfig = {
    apiKey,
    provider,
    model,
    baseURL,
    storageMode: "local_device",
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(storageKey(provider), JSON.stringify(config));
  } catch (error) {
    console.error("本地保存 API Key 失败", error);
    throw new Error("浏览器存储不可用，请尝试“仅本次会话”保存。");
  }
}

export function loadApiKey(
  provider: ProviderType,
  storageMode: ApiKeyStorageMode,
): StoredApiConfig | null {
  const key = storageKey(provider);

  if (storageMode === "session_only") {
    return sessionStore.get(key) ?? null;
  }

  if (storageMode === "local_device") {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredApiConfig;
      return parsed.storageMode === "local_device" ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function clearApiKey(
  provider: ProviderType,
  storageMode: ApiKeyStorageMode,
): void {
  const key = storageKey(provider);
  if (storageMode === "session_only") {
    sessionStore.delete(key);
    return;
  }
  if (storageMode === "local_device") {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function getStorageModeLabel(mode: ApiKeyStorageMode): string {
  switch (mode) {
    case "session_only":
      return "仅本次会话";
    case "local_device":
      return "当前设备";
    case "hosted_encrypted":
      return "托管加密 / 跨设备同步";
  }
}

export function getStorageModeDescription(mode: ApiKeyStorageMode): string {
  switch (mode) {
    case "session_only":
      return "关闭页面后失效，需要重新输入。";
    case "local_device":
      return "只保存在当前浏览器，不上传服务器。";
    case "hosted_encrypted":
      return "服务端加密保存，前端不再持有明文，可在多设备使用。";
  }
}

export function hasStoredApiKey(
  provider: ProviderType,
  storageMode: ApiKeyStorageMode,
): boolean {
  if (storageMode === "hosted_encrypted") return false;
  return loadApiKey(provider, storageMode) !== null;
}

export function listStoredConfigs(): StoredApiConfig[] {
  const result: StoredApiConfig[] = [];
  sessionStore.forEach((config) => result.push(config));

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const config = JSON.parse(raw) as StoredApiConfig;
      if (config.storageMode === "local_device") result.push(config);
    } catch {
      // skip bad entries
    }
  }

  return result;
}
