import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Key,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../auth";
import { ProviderStatusDot } from "./ProviderStatusDot";
import { ProviderConfigCard } from "./ProviderConfigCard";
import type { ApiConfigEntry } from "../../storage/apiProviderConfigStorage";
import {
  deleteConfig,
  getEnabledConfig,
  listConfigs,
  markUsed,
  saveConfig,
  setEnabled,
  setTestResult,
  updateConfig,
} from "../../storage/apiProviderConfigStorage";
import type { ApiKeyStorageMode, ProviderType, TestResult } from "../../providers/provider.types";
import { AVAILABLE_PROVIDERS } from "../../providers/provider.types";
import {
  getAllPresets,
  getBaseUrl,
  getDefaultModel,
  getPresetModels,
  getPresetName,
  isModelLegacy,
  isPresetUsable,
} from "../../providers/providerPresets";
import {
  buildConfigFromStorage,
  testProviderConnection,
} from "../../providers/providerGateway";
import {
  clearApiKey,
  getStorageModeDescription,
  getStorageModeLabel,
  hasStoredApiKey,
  loadApiKey,
  saveApiKeyLocalDevice,
  saveApiKeySession,
} from "../../storage/apiKeyStorage";
import {
  deleteHostedCredential,
  listHostedCredentials,
  saveHostedCredential,
  saveHostedCredentialSelection,
  selectionFromCredential,
} from "../../services/hostedCredentialsService";
import type { ProviderCredentialRow } from "../../types/database";

const storageModes: ApiKeyStorageMode[] = ["session_only", "local_device", "hosted_encrypted"];

export function ProviderPresetSelector() {
  const { isGuestOrDemo, user } = useAuth();
  const userId = user?.id ?? null;
  const hostedAvailable = !isGuestOrDemo && !!userId;

  // Form state
  const [provider, setProvider] = useState<ProviderType>("deepseek");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [baseURL, setBaseURL] = useState("https://api.deepseek.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [storageMode, setStorageMode] = useState<ApiKeyStorageMode>("session_only");
  const [label, setLabel] = useState("");
  const [customModel, setCustomModel] = useState(false);
  const [customModelValue, setCustomModelValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [setDefault, setSetDefault] = useState(true);

  // Action state
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResultState] = useState<TestResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Lists
  const [configs, setConfigs] = useState<ApiConfigEntry[]>([]);
  const [enabledConfig, setEnabledConfig] = useState<ApiConfigEntry | null>(null);
  const [hostedCredentials, setHostedCredentials] = useState<ProviderCredentialRow[]>([]);
  const [hostedLoading, setHostedLoading] = useState(false);
  const [selectedHostedId, setSelectedHostedId] = useState<string | null>(null);

  const presets = getAllPresets();
  const preset = presets.find((p) => p.id === provider);
  const presetModels = getPresetModels(provider);

  const refreshHostedCredentials = async () => {
    if (!hostedAvailable) return;
    setHostedLoading(true);
    try {
      const creds = await listHostedCredentials();
      setHostedCredentials(creds);
    } catch {
      // ignore
    } finally {
      setHostedLoading(false);
    }
  };

  const refreshConfigs = () => {
    setConfigs(listConfigs());
    setEnabledConfig(getEnabledConfig());
  };

  useEffect(() => {
    refreshConfigs();
    if (hostedAvailable) void refreshHostedCredentials();
  }, [hostedAvailable]);

  useEffect(() => {
    if (storageMode !== "hosted_encrypted") {
      setSelectedHostedId(null);
    }
  }, [storageMode]);

  const currentConfigForEdit = useMemo<ApiConfigEntry | null>(() => {
    return configs.find((c) => c.provider === provider && c.storageMode === storageMode) ?? null;
  }, [configs, provider, storageMode]);

  function handleProviderChange(nextProvider: ProviderType) {
    setProvider(nextProvider);
    setTestResultState(null);
    setMessage(null);

    const base = getBaseUrl(nextProvider);
    const defModel = getDefaultModel(nextProvider);
    setBaseURL(base);
    setModel(defModel);
    setCustomModel(false);
    setCustomModelValue("");

    // Check for existing config
    const existing = configs.find(
      (c) => c.provider === nextProvider && c.storageMode === storageMode,
    );
    if (existing) {
      setModel(existing.model);
      if (existing.baseURL) setBaseURL(existing.baseURL);
      setLabel(existing.label);
    }

    // Load existing API key for this provider/mode
    if (storageMode !== "hosted_encrypted") {
      const stored = loadApiKey(nextProvider, storageMode);
      setApiKey(stored?.apiKey ?? "");
      if (stored) {
        setModel(stored.model);
        setBaseURL(stored.baseURL);
      }
    } else {
      setApiKey("");
    }
  }

  function handleModelChange(value: string) {
    if (value === "__custom__") {
      setCustomModel(true);
      setModel("");
    } else {
      setCustomModel(false);
      setModel(value);
    }
  }

  async function handleSave() {
    setMessage(null);
    setTestResultState(null);

    const finalModel = customModel ? customModelValue.trim() : model.trim();

    if (storageMode === "hosted_encrypted") {
      if (!hostedAvailable) {
        setMessage("托管加密需要先登录。");
        return;
      }
      if (!apiKey.trim()) {
        setMessage("请输入 API Key。");
        return;
      }
      setSaving(true);
      try {
        const credential = await saveHostedCredential({
          label: label.trim() || `${preset?.name ?? String(provider)} 托管凭据`,
          provider_type: provider as Exclude<ProviderType, "mock">,
          base_url: baseURL.trim(),
          default_model: finalModel,
          api_key: apiKey.trim(),
          set_default: setDefault,
        });
        setSelectedHostedId(credential.id);
        setApiKey("");
        setShowKey(false);

        // Save to configs list
        saveConfig({
          label: label.trim() || (preset?.name ?? provider),
          provider,
          model: finalModel,
          baseURL: baseURL.trim(),
          storageMode: "hosted_encrypted",
          credentialId: credential.id,
        });
        setMessage("托管加密凭据已保存。明文 Key 不会再显示在前端。");
        refreshConfigs();
        await refreshHostedCredentials();
      } catch (error) {
        setMessage(`保存失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!apiKey.trim()) {
      setMessage("请输入 API Key。");
      return;
    }

    // Save API key to storage
    if (storageMode === "local_device") {
      saveApiKeyLocalDevice(provider, apiKey.trim(), finalModel, baseURL.trim());
    } else {
      saveApiKeySession(provider, apiKey.trim(), finalModel, baseURL.trim());
    }

    // Save to configs list
    const existing = configs.find(
      (c) => c.provider === provider && c.storageMode === storageMode,
    );
    if (existing) {
      updateConfig(existing.id, {
        model: finalModel,
        baseURL: baseURL.trim(),
        label: label.trim() || undefined,
      });
    } else {
      saveConfig({
        label: label.trim() || (preset?.name ?? provider),
        provider,
        model: finalModel,
        baseURL: baseURL.trim(),
        storageMode,
      });
    }

    setMessage("配置已保存。");
    refreshConfigs();
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    setTestResultState(null);

    try {
      if (storageMode === "hosted_encrypted") {
        if (!selectedHostedId && !currentConfigForEdit?.credentialId) {
          setTestResultState({
            ok: false,
            error: {
              type: "missing_key",
              title: "缺少托管凭据",
              status: 0,
              detail: "请先选择或保存托管凭据",
              provider,
              retryable: false,
            },
          });
          return;
        }
      }

      const finalModel = customModel ? customModelValue.trim() : model.trim();
      const config = buildConfigFromStorage(
        provider,
        storageMode === "hosted_encrypted" ? "" : apiKey.trim(),
        storageMode,
        finalModel,
        baseURL.trim(),
        currentConfigForEdit?.credentialId ?? null,
      );

      const result = await testProviderConnection(config);
      setTestResultState(result);

      // Update storage status
      const targetConfig = configs.find(
        (c) => c.provider === provider && c.storageMode === storageMode,
      );
      if (targetConfig) {
        setTestResult(
          targetConfig.id,
          result.ok ? "ok" : "failed",
          result.latencyMs,
          result.error?.detail,
        );
        refreshConfigs();
      }
    } catch (error) {
      setMessage(`测试失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleEnable(id: string) {
    const config = configs.find((c) => c.id === id);
    if (!config) return;

    if (config.testStatus === "untested") {
      if (!window.confirm("该配置尚未测试，确定要启用吗？")) return;
    }
    if (config.testStatus === "failed") {
      if (!window.confirm("该配置最近测试失败，确定要启用吗？")) return;
    }

    setEnablingId(id);
    try {
      setEnabled(id);
      markUsed(id);
      refreshConfigs();
      setMessage("已切换启用配置。");
    } catch {
      setMessage("启用失败，请重试。");
    } finally {
      setEnablingId(null);
    }
  }

  async function handleTestConfig(id: string) {
    const config = configs.find((c) => c.id === id);
    if (!config) return;

    setTestingId(id);
    try {
      let apiKeyOrCredential = "";

      if (config.storageMode === "hosted_encrypted") {
        // Use hosted credential test
        if (!config.credentialId) {
          setTestResult(id, "failed", undefined, "缺少托管凭据 ID");
          refreshConfigs();
          return;
        }
      } else {
        const stored = loadApiKey(config.provider, config.storageMode);
        apiKeyOrCredential = stored?.apiKey ?? "";
      }

      const cfg = buildConfigFromStorage(
        config.provider,
        apiKeyOrCredential,
        config.storageMode,
        config.model,
        config.baseURL,
        config.credentialId,
      );

      const result = await testProviderConnection(cfg);
      setTestResult(
        id,
        result.ok ? "ok" : "failed",
        result.latencyMs,
        result.error?.detail,
      );
      refreshConfigs();
    } catch (error) {
      setTestResult(id, "failed", undefined, String(error));
      refreshConfigs();
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    const config = configs.find((c) => c.id === id);
    if (!config) return;

    const msg = config.enabled
      ? "这是当前启用的配置，删除后需要重新选择启用配置。确定删除？"
      : "确定删除这个 API 配置？";

    if (!window.confirm(msg)) return;

    // Clear stored API key
    if (config.storageMode !== "hosted_encrypted") {
      clearApiKey(config.provider, config.storageMode);
    }
    if (config.storageMode === "hosted_encrypted" && config.credentialId) {
      try {
        await deleteHostedCredential(config.credentialId);
      } catch {
        // ignore
      }
    }

    deleteConfig(id);
    refreshConfigs();
    setMessage("配置已删除。");
  }

  function handleClearLocal() {
    clearApiKey(provider, storageMode);
    setApiKey("");
    setTestResultState(null);
    setMessage("当前浏览器中的本地 API 配置已清除。");
  }

  // Model display options
  const modelOptions = presetModels.length > 0
    ? presetModels
    : [{ id: "__custom__", label: "手动输入模型" }];

  const legacyWarning = !customModel && isModelLegacy(provider, model)
    ? "此模型名称已过时，建议切换到新预设模型"
    : null;

  const usable = isPresetUsable(provider);
  const notUsable = !usable && provider !== "mock";

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-brand-500" />
        <h3 className="text-sm font-semibold text-ink-700">API Provider 配置</h3>
      </div>

      {/* Current enabled config summary */}
      {enabledConfig ? (
        <div className="rounded-card border border-brand-100 bg-brand-50/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">当前启用</span>
            <ProviderStatusDot status={enabledConfig.testStatus} />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {enabledConfig.label || getPresetName(enabledConfig.provider)} · {enabledConfig.model || "未选择模型"} · {getStorageModeLabel(enabledConfig.storageMode)}
          </p>
          {enabledConfig.lastTestedAt ? (
            <p className="text-[11px] text-ink-400">最近测试：{new Date(enabledConfig.lastTestedAt).toLocaleString()}</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-card border border-amber-100 bg-amber-light/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <p className="text-xs text-amber-700">
              尚未启用任何 API 配置。请先添加并启用一个配置，才能在聊天中调用真实模型。
            </p>
          </div>
        </div>
      )}

      {/* Saved configs list */}
      {configs.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">已保存的配置</h4>
          {configs.map((config) => (
            <ProviderConfigCard
              key={config.id}
              config={config}
              testing={testingId === config.id}
              enabling={enablingId === config.id}
              onTest={() => void handleTestConfig(config.id)}
              onEnable={(id) => void handleEnable(id)}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      ) : null}

      {/* New/Edit config form */}
      <details className="group" open={configs.length === 0}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500 group-open:hidden">
            <Plus className="h-3.5 w-3.5" />
            新增 API 配置
          </div>
        </summary>

        <div className="mt-4 space-y-4 border-t border-surface-100 pt-4">
          {/* Credential mode */}
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-500">凭据保存位置</label>
            <div className="space-y-2">
              {storageModes.map((mode) => {
                const disabled = mode === "hosted_encrypted" && !hostedAvailable;
                const localExisting = mode !== "hosted_encrypted" && hasStoredApiKey(provider, mode);
                return (
                  <label
                    key={mode}
                    className={`flex items-start gap-3 rounded-card border p-3 transition-colors ${
                      storageMode === mode ? "border-brand-300 bg-brand-50/30" : "border-surface-100 bg-white hover:border-surface-200"
                    } ${disabled ? "opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="storageMode"
                      value={mode}
                      checked={storageMode === mode}
                      disabled={disabled}
                      onChange={() => {
                        setStorageMode(mode);
                        setTestResultState(null);
                        setMessage(null);
                        if (mode === "hosted_encrypted") {
                          setApiKey("");
                        } else {
                          const existing = loadApiKey(provider, mode);
                          setApiKey(existing?.apiKey ?? "");
                          if (existing) {
                            setModel(existing.model);
                            setBaseURL(existing.baseURL);
                          }
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink-700">{getStorageModeLabel(mode)}</span>
                        {localExisting ? <span className="text-[11px] text-emerald-600">已保存</span> : null}
                        {disabled ? <span className="text-[11px] text-ink-400">需要登录</span> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">{getStorageModeDescription(mode)}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Provider selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-500">Provider</label>
            <select
              value={provider}
              onChange={(event) => handleProviderChange(event.target.value as ProviderType)}
              className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
            >
              {AVAILABLE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled}>
                  {p.label}
                </option>
              ))}
            </select>
            {preset ? <p className="mt-1 text-xs text-ink-400">{preset.description}</p> : null}
            {notUsable ? (
              <div className="mt-1 rounded-card border border-amber-100 bg-amber-light/20 px-3 py-2 text-xs text-amber-700">
                {preset?.notes ?? "当前暂未接入此 Provider，建议通过 OpenRouter 或自定义 OpenAI Compatible 中转使用。"}
              </div>
            ) : null}
          </div>

          {usable || provider === "mock" ? (
            <>
              {/* Model selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">模型</label>
                <select
                  value={customModel ? "__custom__" : model}
                  onChange={(event) => handleModelChange(event.target.value)}
                  className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
                >
                  {modelOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}{m.legacy ? " (旧)" : ""}{m.recommended ? " · 推荐" : ""}
                    </option>
                  ))}
                </select>
                {modelOptions.length > 0 && !customModel ? (
                  <p className="mt-1 text-xs text-ink-400">
                    {modelOptions.find((m) => m.id === model)?.description ?? ""}
                  </p>
                ) : null}
                {legacyWarning ? (
                  <p className="mt-1 text-xs text-amber-600">{legacyWarning}</p>
                ) : null}
              </div>

              {/* Custom model input */}
              {customModel ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">自定义模型名称</label>
                  <input
                    type="text"
                    value={customModelValue}
                    onChange={(event) => setCustomModelValue(event.target.value)}
                    placeholder="输入模型 ID..."
                    className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
                  />
                </div>
              ) : null}

              {/* Base URL */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Base URL</label>
                <input
                  type="text"
                  value={baseURL}
                  onChange={(event) => setBaseURL(event.target.value)}
                  placeholder={getBaseUrl(provider) || "https://api.example.com/v1"}
                  className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 font-mono text-sm text-ink-900"
                />
              </div>

              {/* Hosted credential selector */}
              {storageMode === "hosted_encrypted" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">凭据名称</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="例如：我的 DeepSeek 主账号"
                    className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
                  />
                </div>
              ) : null}

              {/* API Key */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      setMessage(null);
                      setTestResultState(null);
                    }}
                    placeholder={storageMode === "hosted_encrypted" ? "保存后不会再次展示明文 Key" : "sk-..."}
                    className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 pr-16 font-mono text-sm text-ink-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-ink-400 hover:text-ink-600"
                  >
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
              </div>

              {/* Hosted set default */}
              {storageMode === "hosted_encrypted" ? (
                <label className="flex items-start gap-3 rounded-card border border-surface-100 bg-surface-50 px-4 py-3">
                  <input type="checkbox" checked={setDefault} onChange={(event) => setSetDefault(event.target.checked)} className="mt-1" />
                  <div>
                    <p className="text-sm font-medium text-ink-700">保存后设为默认托管凭据</p>
                    <p className="mt-1 text-xs text-ink-400">后续在已登录设备上可以更快选中它。</p>
                  </div>
                </label>
              ) : null}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void handleSave()}
                  disabled={saving || (storageMode === "hosted_encrypted" && !hostedAvailable)}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {storageMode === "hosted_encrypted" ? "保存到托管加密" : "保存配置"}
                </button>
                <button
                  onClick={() => void handleTest()}
                  disabled={testing}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {testing ? "测试中..." : "测试连接"}
                </button>
                {storageMode !== "hosted_encrypted" ? (
                  <button
                    onClick={handleClearLocal}
                    className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    清除本地配置
                  </button>
                ) : null}
              </div>

              {/* Test result */}
              {testResult ? (
                <div className={`rounded-card border p-3 ${testResult.ok ? "border-emerald-100 bg-emerald-light/30" : "border-rose-100 bg-rose-light/30"}`}>
                  <div className="mb-1 flex items-center gap-2">
                    {testResult.ok ? (
                      <>
                        <Wifi className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">连接成功</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-rose-600" />
                        <span className="text-sm font-medium text-rose-700">连接失败</span>
                      </>
                    )}
                    {testResult.latencyMs != null ? (
                      <span className="ml-auto text-xs text-ink-400">{testResult.latencyMs}ms</span>
                    ) : null}
                  </div>
                  {testResult.ok ? (
                    <p className="text-xs text-emerald-700">测试成功不代表已启用，请点击"设为启用"。</p>
                  ) : (
                    <p className="text-xs text-rose-600 leading-relaxed">{testResult.error?.detail || "请检查配置后重试。"}</p>
                  )}
                </div>
              ) : null}

              {/* Message */}
              {message ? (
                <p className={`text-sm ${message.includes("失败") ? "text-rose-600" : "text-emerald-600"}`}>{message}</p>
              ) : null}
            </>
          ) : null}

          {/* Not usable notice */}
          {notUsable ? (
            <div className="rounded-card border border-amber-100 bg-amber-light/20 px-4 py-3 text-xs text-amber-700">
              <p>此 Provider 当前需要专用适配器才能使用。建议通过 OpenRouter 或自定义 OpenAI Compatible 中转，或等待后续版本接入。</p>
            </div>
          ) : null}
        </div>
      </details>

      {/* Hosted credentials list */}
      {storageMode === "hosted_encrypted" ? (
        <div className="space-y-3 border-t border-surface-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-ink-700">已保存的托管凭据</h4>
              <p className="mt-1 text-xs text-ink-400">这里只显示元数据，不显示明文 API Key。</p>
            </div>
            <button onClick={() => void refreshHostedCredentials()} disabled={hostedLoading} className="btn-ghost text-xs disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </button>
          </div>

          {!hostedAvailable ? (
            <p className="text-sm text-ink-500">托管加密需要先登录。</p>
          ) : hostedCredentials.filter((c) => c.status !== "deleted" && !c.deleted_at).length === 0 ? (
            <p className="text-sm text-ink-400">还没有托管加密凭据。</p>
          ) : (
            <div className="space-y-3">
              {hostedCredentials
                .filter((c) => c.status !== "deleted" && !c.deleted_at)
                .map((cred) => (
                  <div
                    key={cred.id}
                    className={`rounded-card border px-4 py-3 ${cred.id === selectedHostedId ? "border-brand-300 bg-brand-50/20" : "border-surface-100 bg-surface-50"}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-semibold text-ink-700">{cred.label || "未命名托管凭据"}</h5>
                          {cred.is_default ? <span className="rounded-full bg-emerald-light px-2 py-0.5 text-[10px] text-emerald-700">默认</span> : null}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {cred.provider_type === "deepseek" ? "DeepSeek" : cred.provider_type} / {cred.default_model || "未设置模型"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setSelectedHostedId(cred.id);
                            saveHostedCredentialSelection(selectionFromCredential(cred));
                            setMessage("已切换当前托管凭据。");
                          }}
                          className="btn-ghost text-xs"
                        >
                          设为当前使用
                        </button>
                        <button
                          onClick={() => void deleteHostedCredential(cred.id)}
                          className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
