import type { ApiKeyStorageMode, ProviderType } from "../providers/provider.types";

// Phase 3: session_only + local_device only.
// hosted_encrypted_future is NOT implemented — that is Phase 8.

const STORAGE_PREFIX = "rp_tavern_";

interface StoredApiConfig {
  apiKey: string;
  provider: ProviderType;
  model: string;
  baseURL: string;
  storageMode: ApiKeyStorageMode;
  savedAt: string;
}

// In-memory store (for session_only mode)
const sessionStore = new Map<string, StoredApiConfig>();

function storageKey(provider: ProviderType): string {
  return `${STORAGE_PREFIX}api_config_${provider}`;
}

// ---------- session_only ----------

export function saveApiKeySession(
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
    storageMode: "session_only",
    savedAt: new Date().toISOString(),
  };
  sessionStore.set(storageKey(provider), config);
}

// ---------- local_device (localStorage) ----------

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
    console.warn(
      "API Key 已保存到本设备浏览器 local storage。\n" +
        "当前 API Key 仅保存在本设备浏览器中，不会上传服务器。更换设备或清理浏览器数据后需要重新配置。",
    );
  } catch (e) {
    console.error("本地保存 API Key 失败", e);
    throw new Error("浏览器存储不可用，请尝试「仅本次会话」保存");
  }
}

// ---------- load ----------

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
      if (parsed.storageMode !== "local_device") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  // hosted_encrypted_future — not implemented in Phase 3
  return null;
}

// ---------- clear ----------

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
    return;
  }
}

// ---------- info ----------

export function getStorageModeLabel(mode: ApiKeyStorageMode): string {
  switch (mode) {
    case "session_only":
      return "仅本次会话";
    case "local_device":
      return "保存在当前设备";
    case "hosted_encrypted_future":
      return "加密托管到账号（后续开放）";
  }
}

export function getStorageModeDescription(mode: ApiKeyStorageMode): string {
  switch (mode) {
    case "session_only":
      return "关闭页面后失效，需重新输入";
    case "local_device":
      return "保存在本设备浏览器中，不上传服务器。更换设备后需重新配置";
    case "hosted_encrypted_future":
      return "加密后保存在服务器，同账号多设备可用。将在后续阶段实现";
  }
}

export function hasStoredApiKey(
  provider: ProviderType,
  storageMode: ApiKeyStorageMode,
): boolean {
  return loadApiKey(provider, storageMode) !== null;
}

export function listStoredConfigs(): StoredApiConfig[] {
  const result: StoredApiConfig[] = [];

  // session store
  sessionStore.forEach((config) => result.push(config));

  // localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const config = JSON.parse(raw) as StoredApiConfig;
          if (config.storageMode === "local_device") {
            result.push(config);
          }
        }
      } catch {
        // skip corrupted entries
      }
    }
  }

  return result;
}
