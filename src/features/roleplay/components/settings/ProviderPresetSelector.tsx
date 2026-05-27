import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
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
import { buildConfigFromStorage, testProviderConnection } from "../../providers/providerGateway";
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

function SoftSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`neo-input flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-sm text-ink-900 transition-all duration-[240ms] ${open ? "neo-button-pressed" : ""}`}
      >
        <span className="truncate">{selected?.label || placeholder || "请选择"}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform duration-[240ms] ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="neo-panel absolute left-0 right-0 top-[calc(100%+10px)] z-30 max-h-72 overflow-y-auto rounded-[24px] p-2 scrollbar-none">
          <div className="space-y-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full rounded-[18px] px-4 py-3 text-left text-sm transition-all duration-[220ms] ${
                  value === option.value ? "neo-button-pressed text-brand-700" : "neo-button text-ink-600"
                } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProviderPresetSelector() {
  const { isGuestOrDemo, user } = useAuth();
  const userId = user?.id ?? null;
  const hostedAvailable = !isGuestOrDemo && !!userId;

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

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResultState] = useState<TestResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enablingId, setEnablingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [configs, setConfigs] = useState<ApiConfigEntry[]>([]);
  const [enabledConfig, setEnabledConfig] = useState<ApiConfigEntry | null>(null);
  const [hostedCredentials, setHostedCredentials] = useState<ProviderCredentialRow[]>([]);
  const [hostedLoading, setHostedLoading] = useState(false);
  const [selectedHostedId, setSelectedHostedId] = useState<string | null>(null);

  const presets = getAllPresets();
  const preset = presets.find((item) => item.id === provider);
  const presetModels = getPresetModels(provider);
  const modelOptions = presetModels.length > 0 ? presetModels : [{ id: "__custom__", label: "手动输入模型" }];

  const providerOptions = useMemo(
    () =>
      AVAILABLE_PROVIDERS.map((item) => ({
        value: item.id,
        label: item.label,
        disabled: !item.enabled,
      })),
    [],
  );

  const modelSelectOptions = useMemo(
    () =>
      modelOptions.map((item) => ({
        value: item.id,
        label: `${item.label}${item.legacy ? "（旧）" : ""}${item.recommended ? " · 推荐" : ""}`,
      })),
    [modelOptions],
  );

  const refreshConfigs = () => {
    setConfigs(listConfigs());
    setEnabledConfig(getEnabledConfig());
  };

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

  useEffect(() => {
    refreshConfigs();
    if (hostedAvailable) {
      void refreshHostedCredentials();
    }
  }, [hostedAvailable]);

  useEffect(() => {
    if (storageMode !== "hosted_encrypted") {
      setSelectedHostedId(null);
    }
  }, [storageMode]);

  const currentConfigForEdit = useMemo(
    () => configs.find((item) => item.provider === provider && item.storageMode === storageMode) ?? null,
    [configs, provider, storageMode],
  );

  function handleProviderChange(nextProvider: ProviderType) {
    setProvider(nextProvider);
    setTestResultState(null);
    setMessage(null);

    const nextBase = getBaseUrl(nextProvider);
    const nextModel = getDefaultModel(nextProvider);
    setBaseURL(nextBase);
    setModel(nextModel);
    setCustomModel(false);
    setCustomModelValue("");

    const existing = configs.find((item) => item.provider === nextProvider && item.storageMode === storageMode);
    if (existing) {
      setModel(existing.model);
      if (existing.baseURL) setBaseURL(existing.baseURL);
      setLabel(existing.label);
    }

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
      return;
    }
    setCustomModel(false);
    setModel(value);
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

        saveConfig({
          label: label.trim() || (preset?.name ?? provider),
          provider,
          model: finalModel,
          baseURL: baseURL.trim(),
          storageMode: "hosted_encrypted",
          credentialId: credential.id,
        });

        refreshConfigs();
        await refreshHostedCredentials();
        setMessage("托管加密凭据已保存，前端不会再显示明文 Key。");
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

    if (storageMode === "local_device") {
      saveApiKeyLocalDevice(provider, apiKey.trim(), finalModel, baseURL.trim());
    } else {
      saveApiKeySession(provider, apiKey.trim(), finalModel, baseURL.trim());
    }

    const existing = configs.find((item) => item.provider === provider && item.storageMode === storageMode);
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

    refreshConfigs();
    setMessage("配置已保存。");
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    setTestResultState(null);

    try {
      if (storageMode === "hosted_encrypted" && !selectedHostedId && !currentConfigForEdit?.credentialId) {
        setTestResultState({
          ok: false,
          error: {
            type: "missing_key",
            title: "缺少托管凭据",
            status: 0,
            detail: "请先保存或选择托管凭据。",
            provider,
            retryable: false,
          },
        });
        return;
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

      const targetConfig = configs.find((item) => item.provider === provider && item.storageMode === storageMode);
      if (targetConfig) {
        setTestResult(targetConfig.id, result.ok ? "ok" : "failed", result.latencyMs, result.error?.detail);
        refreshConfigs();
      }
    } catch (error) {
      setMessage(`测试失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleEnable(id: string) {
    const config = configs.find((item) => item.id === id);
    if (!config) return;

    if (config.testStatus === "untested" && !window.confirm("这个配置还没有测试，确定要启用吗？")) {
      return;
    }
    if (config.testStatus === "failed" && !window.confirm("这个配置最近测试失败，确定仍然启用吗？")) {
      return;
    }

    setEnablingId(id);
    try {
      setEnabled(id);
      markUsed(id);
      refreshConfigs();
      setMessage("已切换为当前启用配置。");
    } catch {
      setMessage("启用失败，请重试。");
    } finally {
      setEnablingId(null);
    }
  }

  async function handleTestConfig(id: string) {
    const config = configs.find((item) => item.id === id);
    if (!config) return;

    setTestingId(id);
    try {
      let keyValue = "";
      if (config.storageMode === "hosted_encrypted") {
        if (!config.credentialId) {
          setTestResult(id, "failed", undefined, "缺少托管凭据 ID");
          refreshConfigs();
          return;
        }
      } else {
        const stored = loadApiKey(config.provider, config.storageMode);
        keyValue = stored?.apiKey ?? "";
      }

      const cfg = buildConfigFromStorage(
        config.provider,
        keyValue,
        config.storageMode,
        config.model,
        config.baseURL,
        config.credentialId,
      );

      const result = await testProviderConnection(cfg);
      setTestResult(id, result.ok ? "ok" : "failed", result.latencyMs, result.error?.detail);
      refreshConfigs();
    } catch (error) {
      setTestResult(id, "failed", undefined, String(error));
      refreshConfigs();
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    const config = configs.find((item) => item.id === id);
    if (!config) return;

    const msg = config.enabled
      ? "这是当前启用的配置，删除后需要重新选择启用配置。确定删除吗？"
      : "确定删除这个 API 配置吗？";
    if (!window.confirm(msg)) return;

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

  const legacyWarning = !customModel && isModelLegacy(provider, model)
    ? "当前模型名称已经过时，建议切换到新的推荐模型。"
    : null;

  const usable = isPresetUsable(provider);
  const notUsable = !usable && provider !== "mock";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-brand-500" />
        <h3 className="text-sm font-semibold text-ink-700">API Provider 配置</h3>
      </div>

      {enabledConfig ? (
        <div className="neo-panel-soft rounded-[28px] px-4 py-4">
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
        <div className="rounded-[28px] border border-amber-100/80 bg-amber-light/20 px-4 py-3 shadow-[0_14px_40px_rgba(251,191,36,0.12)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <p className="text-xs text-amber-700">
              还没有启用任何 API 配置。先保存并启用一个配置，聊天页才能调用真实模型。
            </p>
          </div>
        </div>
      )}

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

      <details className="group" open={configs.length === 0}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500 group-open:hidden">
            <Plus className="h-3.5 w-3.5" />
            新增 API 配置
          </div>
        </summary>

        <div className="mt-4 space-y-5 border-t border-white/55 pt-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-500">凭据保存位置</label>
            <div className="space-y-2">
              {storageModes.map((mode) => {
                const disabled = mode === "hosted_encrypted" && !hostedAvailable;
                const localExisting = mode !== "hosted_encrypted" && hasStoredApiKey(provider, mode);

                return (
                  <label
                    key={mode}
                    className={`flex items-start gap-3 rounded-[24px] p-3.5 transition-all duration-[240ms] ${
                      storageMode === mode
                        ? "neo-button-pressed ring-1 ring-brand-200/60"
                        : "neo-panel-soft hover:-translate-y-0.5"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-700">{getStorageModeLabel(mode)}</span>
                        {localExisting ? <span className="neo-pill bg-emerald-light text-[11px] text-emerald-700">已保存</span> : null}
                        {disabled ? <span className="neo-pill bg-surface-100 text-[11px] text-ink-400">需要登录</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">{getStorageModeDescription(mode)}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-500">Provider</label>
            <SoftSelect
              value={provider}
              onChange={(next) => handleProviderChange(next as ProviderType)}
              options={providerOptions}
              placeholder="选择 Provider"
            />
            {preset ? <p className="mt-1 text-xs text-ink-400">{preset.description}</p> : null}
            {notUsable ? (
              <div className="mt-2 rounded-[24px] border border-amber-100/80 bg-amber-light/20 px-3 py-2 text-xs text-amber-700 shadow-[0_10px_30px_rgba(251,191,36,0.12)]">
                {preset?.notes ?? "当前 Provider 还需要专用适配器，建议先通过 OpenRouter 或自定义 OpenAI Compatible 使用。"}
              </div>
            ) : null}
          </div>

          {usable || provider === "mock" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">模型</label>
                <SoftSelect
                  value={customModel ? "__custom__" : model}
                  onChange={handleModelChange}
                  options={modelSelectOptions}
                  placeholder="选择模型"
                />
                {modelOptions.length > 0 && !customModel ? (
                  <p className="mt-1 text-xs text-ink-400">
                    {modelOptions.find((item) => item.id === model)?.description ?? ""}
                  </p>
                ) : null}
                {legacyWarning ? <p className="mt-1 text-xs text-amber-600">{legacyWarning}</p> : null}
              </div>

              {customModel ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">自定义模型名称</label>
                  <input
                    type="text"
                    value={customModelValue}
                    onChange={(event) => setCustomModelValue(event.target.value)}
                    placeholder="输入模型 ID"
                    className="neo-input w-full rounded-input px-3 py-2.5 text-sm text-ink-900"
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Base URL</label>
                <input
                  type="text"
                  value={baseURL}
                  onChange={(event) => setBaseURL(event.target.value)}
                  placeholder={getBaseUrl(provider) || "https://api.example.com/v1"}
                  className="neo-input w-full rounded-input px-3 py-2.5 font-mono text-sm text-ink-900 break-all"
                />
              </div>

              {storageMode === "hosted_encrypted" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">凭据名称</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="例如：我的 DeepSeek 主账号"
                    className="neo-input w-full rounded-input px-3 py-2.5 text-sm text-ink-900"
                  />
                </div>
              ) : null}

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
                    placeholder={storageMode === "hosted_encrypted" ? "保存后前端不会再展示明文 Key" : "sk-..."}
                    className="neo-input w-full rounded-input px-3 py-2.5 pr-16 font-mono text-sm text-ink-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((current) => !current)}
                    className="neo-button absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-xs text-ink-500"
                  >
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
              </div>

              {storageMode === "hosted_encrypted" ? (
                <label className="neo-panel-soft flex items-start gap-3 rounded-[24px] px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={setDefault}
                    onChange={(event) => setSetDefault(event.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink-700">保存后设为默认托管凭据</p>
                    <p className="mt-1 text-xs text-ink-400">之后在已登录设备上可以更快选中它。</p>
                  </div>
                </label>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void handleSave()}
                  disabled={saving || (storageMode === "hosted_encrypted" && !hostedAvailable)}
                  className="neo-button flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs text-ink-700 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {storageMode === "hosted_encrypted" ? "保存到托管加密" : "保存配置"}
                </button>
                <button
                  onClick={() => void handleTest()}
                  disabled={testing}
                  className="neo-button-primary flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {testing ? "测试中..." : "测试连接"}
                </button>
                {storageMode !== "hosted_encrypted" ? (
                  <button
                    onClick={handleClearLocal}
                    className="neo-button flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    清除本地配置
                  </button>
                ) : null}
              </div>

              {testResult ? (
                <div
                  className={`rounded-[24px] border p-3 shadow-[0_12px_34px_rgba(148,163,184,0.10)] ${
                    testResult.ok ? "border-emerald-100 bg-emerald-light/30" : "border-rose-100 bg-rose-light/30"
                  }`}
                >
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
                    <p className="text-xs text-emerald-700">测试成功不代表已经启用，请点击“设为启用”。</p>
                  ) : (
                    <p className="text-xs leading-relaxed text-rose-600">
                      {testResult.error?.detail || "请检查配置后重试。"}
                    </p>
                  )}
                </div>
              ) : null}

              {message ? (
                <p className={`text-sm ${message.includes("失败") ? "text-rose-600" : "text-emerald-600"}`}>{message}</p>
              ) : null}
            </>
          ) : null}

          {notUsable ? (
            <div className="rounded-[24px] border border-amber-100/80 bg-amber-light/20 px-4 py-3 text-xs text-amber-700 shadow-[0_10px_30px_rgba(251,191,36,0.12)]">
              当前 Provider 还需要专用适配器，建议先通过 OpenRouter 或自定义 OpenAI Compatible 中转，或等待后续接入。
            </div>
          ) : null}
        </div>
      </details>

      {storageMode === "hosted_encrypted" ? (
        <div className="space-y-3 border-t border-white/55 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-ink-700">已保存的托管凭据</h4>
              <p className="mt-1 text-xs text-ink-400">这里只显示元数据，不显示明文 API Key。</p>
            </div>
            <button
              onClick={() => void refreshHostedCredentials()}
              disabled={hostedLoading}
              className="neo-button flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-ink-600 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </button>
          </div>

          {!hostedAvailable ? (
            <p className="text-sm text-ink-500">托管加密需要先登录。</p>
          ) : hostedCredentials.filter((item) => item.status !== "deleted" && !item.deleted_at).length === 0 ? (
            <p className="text-sm text-ink-400">还没有托管加密凭据。</p>
          ) : (
            <div className="space-y-3">
              {hostedCredentials
                .filter((item) => item.status !== "deleted" && !item.deleted_at)
                .map((cred) => (
                  <div
                    key={cred.id}
                    className={`${cred.id === selectedHostedId ? "neo-button-pressed ring-1 ring-brand-200/60" : "neo-panel-soft"} rounded-[24px] px-4 py-3`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-sm font-semibold text-ink-700">{cred.label || "未命名托管凭据"}</h5>
                          {cred.is_default ? (
                            <span className="neo-pill bg-emerald-light px-2 py-0.5 text-[10px] text-emerald-700">
                              默认
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {cred.provider_type === "deepseek" ? "DeepSeek" : cred.provider_type} / {cred.default_model || "未设置模型"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedHostedId(cred.id);
                            saveHostedCredentialSelection(selectionFromCredential(cred));
                            setMessage("已切换当前托管凭据。");
                          }}
                          className="neo-button rounded-full px-3.5 py-2 text-xs text-ink-600"
                        >
                          设为当前使用
                        </button>
                        <button
                          onClick={() => void deleteHostedCredential(cred.id)}
                          className="neo-button rounded-full px-3.5 py-2 text-xs text-rose-600"
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
