/**
 * apiProviderConfigStorage — 管理多个本地 API 配置，含启用状态和测试状态。
 *
 * 存储位置：localStorage（metadata）+ sessionStore / localStorage（API Key）
 * 原则：
 * - 同一时间只有一个当前启用配置
 * - 测试成功不等于启用
 * - hosted_encrypted 的 secret 不存储在这里
 * - API Key 明文不写入同步数据
 */

import type { ApiKeyStorageMode, ProviderType } from "../providers/provider.types";
import { getPresetName } from "../providers/providerPresets";

const CONFIG_LIST_KEY = "rp_tavern_provider_configs";
const ENABLED_CONFIG_KEY = "rp_tavern_enabled_config_id";

export type ApiConfigTestStatus = "untested" | "ok" | "failed";

export interface ApiConfigEntry {
  id: string;
  label: string;
  provider: ProviderType;
  model: string;
  baseURL: string;
  storageMode: ApiKeyStorageMode;
  credentialId?: string | null; // for hosted_encrypted
  /** Whether this config is the currently enabled one */
  enabled: boolean;
  testStatus: ApiConfigTestStatus;
  lastTestedAt: string | null;
  lastTestedLatencyMs: number | null;
  lastTestError: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConfigSaveInput {
  label?: string;
  provider: ProviderType;
  model: string;
  baseURL: string;
  storageMode: ApiKeyStorageMode;
  credentialId?: string | null;
}

function loadConfigs(): ApiConfigEntry[] {
  try {
    const raw = localStorage.getItem(CONFIG_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApiConfigEntry[];
  } catch {
    return [];
  }
}

function saveConfigs(configs: ApiConfigEntry[]): void {
  try {
    localStorage.setItem(CONFIG_LIST_KEY, JSON.stringify(configs));
  } catch {
    // ignore
  }
}

export function listConfigs(): ApiConfigEntry[] {
  return loadConfigs().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getConfig(id: string): ApiConfigEntry | null {
  return loadConfigs().find((c) => c.id === id) ?? null;
}

export function getEnabledConfig(): ApiConfigEntry | null {
  try {
    const enabledId = localStorage.getItem(ENABLED_CONFIG_KEY);
    if (!enabledId) return null;
    const config = getConfig(enabledId);
    return config ?? null;
  } catch {
    return null;
  }
}

export function saveConfig(input: ApiConfigSaveInput): ApiConfigEntry {
  const now = new Date().toISOString();
  const configs = loadConfigs();

  const entry: ApiConfigEntry = {
    id: crypto.randomUUID(),
    label: input.label ?? getPresetName(input.provider),
    provider: input.provider,
    model: input.model,
    baseURL: input.baseURL,
    storageMode: input.storageMode,
    credentialId: input.credentialId ?? null,
    enabled: configs.length === 0, // First config is auto-enabled
    testStatus: "untested",
    lastTestedAt: null,
    lastTestedLatencyMs: null,
    lastTestError: null,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  configs.push(entry);
  saveConfigs(configs);

  if (entry.enabled) {
    localStorage.setItem(ENABLED_CONFIG_KEY, entry.id);
  }

  return entry;
}

export function updateConfig(
  id: string,
  input: Partial<Pick<ApiConfigEntry, "label" | "model" | "baseURL" | "storageMode" | "credentialId">>,
): ApiConfigEntry | null {
  const configs = loadConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  configs[idx] = { ...configs[idx], ...input, updatedAt: new Date().toISOString() };
  saveConfigs(configs);
  return configs[idx];
}

export function setTestResult(
  id: string,
  status: ApiConfigTestStatus,
  latencyMs?: number,
  error?: string,
): void {
  const configs = loadConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return;
  configs[idx] = {
    ...configs[idx],
    testStatus: status,
    lastTestedAt: new Date().toISOString(),
    lastTestedLatencyMs: latencyMs ?? null,
    lastTestError: error ?? null,
    updatedAt: new Date().toISOString(),
  };
  saveConfigs(configs);
}

export function setEnabled(id: string): ApiConfigEntry | null {
  const configs = loadConfigs();
  const entry = configs.find((c) => c.id === id);
  if (!entry) return null;

  // Disable all others, enable this one
  const updated = configs.map((c) => ({
    ...c,
    enabled: c.id === id,
    updatedAt: c.id === id ? new Date().toISOString() : c.updatedAt,
  }));
  saveConfigs(updated);

  localStorage.setItem(ENABLED_CONFIG_KEY, id);

  const target = updated.find((c) => c.id === id)!;
  // Also mark used
  markUsed(id);

  return target;
}

export function markUsed(id: string): void {
  const configs = loadConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return;
  configs[idx] = { ...configs[idx], lastUsedAt: new Date().toISOString() };
  saveConfigs(configs);
}

export function deleteConfig(id: string): void {
  const configs = loadConfigs().filter((c) => c.id !== id);
  saveConfigs(configs);

  const enabledId = localStorage.getItem(ENABLED_CONFIG_KEY);
  if (enabledId === id) {
    // Auto-enable the first remaining config if any
    if (configs.length > 0) {
      setEnabled(configs[0].id);
    } else {
      localStorage.removeItem(ENABLED_CONFIG_KEY);
    }
  }
}
