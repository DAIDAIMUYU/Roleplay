import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Database,
  Eye,
  Info,
  Key,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  User,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import {
  AVAILABLE_PROVIDERS,
  type ApiKeyStorageMode,
  type ProviderType,
  type TestResult,
} from "../features/roleplay/providers";
import { buildConfigFromStorage, testProviderConnection } from "../features/roleplay/providers/providerGateway";
import {
  clearApiKey,
  getStorageModeDescription,
  getStorageModeLabel,
  hasStoredApiKey,
  loadApiKey,
  saveApiKeyLocalDevice,
  saveApiKeySession,
} from "../features/roleplay/storage/apiKeyStorage";
import {
  deleteHostedCredential,
  listHostedCredentials,
  saveHostedCredential,
  saveHostedCredentialSelection,
  selectionFromCredential,
  setDefaultHostedCredential,
  testHostedCredential,
} from "../features/roleplay/services/hostedCredentialsService";
import type { ProviderCredentialRow } from "../features/roleplay/types/database";

const storageModes: ApiKeyStorageMode[] = ["session_only", "local_device", "hosted_encrypted"];

const otherSections = [
  { icon: <Database className="h-5 w-5" />, title: "数据管理", desc: "备份、恢复、导入、导出、回收站", to: "/settings/data", stage: "阶段 8" },
  { icon: <User className="h-5 w-5" />, title: "账号设置", desc: "个人信息、显示名称、头像", to: null, stage: "阶段 9" },
  { icon: <Eye className="h-5 w-5" />, title: "外观设置", desc: "夜间模式、字体大小、气泡宽度", to: null, stage: "阶段 9" },
  { icon: <Smartphone className="h-5 w-5" />, title: "移动端设置", desc: "离线草稿、设备体验", to: null, stage: "后续阶段" },
  { icon: <Shield className="h-5 w-5" />, title: "安全设置", desc: "访问策略、凭据状态、设备同步", to: null, stage: "阶段 8.1" },
];

function formatTime(value: string | null): string {
  if (!value) return "未记录";
  return new Date(value).toLocaleString();
}

function ApiProviderCard() {
  const { isGuestOrDemo, user } = useAuth();
  const userId = user?.id ?? null;

  const [provider, setProvider] = useState<ProviderType>("deepseek");
  const [model, setModel] = useState("deepseek-chat");
  const [baseURL, setBaseURL] = useState("https://api.deepseek.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [storageMode, setStorageMode] = useState<ApiKeyStorageMode>("session_only");
  const [setDefault, setSetDefault] = useState(true);
  const [showKey, setShowKey] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hostedCredentials, setHostedCredentials] = useState<ProviderCredentialRow[]>([]);
  const [hostedLoading, setHostedLoading] = useState(false);
  const [selectedHostedCredentialId, setSelectedHostedCredentialId] = useState<string | null>(null);
  const [busyCredentialId, setBusyCredentialId] = useState<string | null>(null);

  const meta = AVAILABLE_PROVIDERS.find((item) => item.id === provider);
  const selectedHostedCredential = hostedCredentials.find((credential) => credential.id === selectedHostedCredentialId) ?? null;

  const hostedByProvider = useMemo(
    () => hostedCredentials.filter((credential) => credential.provider_type === provider && credential.status === "active" && !credential.deleted_at),
    [hostedCredentials, provider],
  );

  async function refreshHostedCredentials() {
    if (!userId || isGuestOrDemo) return;
    setHostedLoading(true);
    try {
      const credentials = await listHostedCredentials();
      setHostedCredentials(credentials);
      const activeSelection = credentials.find((credential) => credential.id === selectedHostedCredentialId && credential.status === "active" && !credential.deleted_at);
      if (activeSelection) {
        saveHostedCredentialSelection(selectionFromCredential(activeSelection));
        return;
      }
      const fallback = credentials.find((credential) => credential.is_default && credential.status === "active" && !credential.deleted_at)
        ?? credentials.find((credential) => credential.status === "active" && !credential.deleted_at)
        ?? null;
      setSelectedHostedCredentialId(fallback?.id ?? null);
      if (fallback) {
        const selection = selectionFromCredential(fallback);
        saveHostedCredentialSelection(selection);
        setProvider(selection.provider);
        setModel(selection.model || (selection.provider === "deepseek" ? "deepseek-chat" : ""));
        setBaseURL(selection.baseURL || (selection.provider === "deepseek" ? "https://api.deepseek.com/v1" : ""));
      }
    } catch (error) {
      setMessage(`读取托管凭据失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setHostedLoading(false);
    }
  }

  useEffect(() => {
    if (!userId || isGuestOrDemo) return;
    void refreshHostedCredentials();
  }, [isGuestOrDemo, userId]);

  useEffect(() => {
    if (storageMode !== "hosted_encrypted") return;
    if (selectedHostedCredential) {
      setProvider(selectedHostedCredential.provider_type);
      setModel(selectedHostedCredential.default_model || "");
      setBaseURL(selectedHostedCredential.base_url || "");
      setLabel(selectedHostedCredential.label || "");
    } else if (hostedByProvider.length === 1) {
      setSelectedHostedCredentialId(hostedByProvider[0].id);
    }
  }, [hostedByProvider, selectedHostedCredential, storageMode]);

  function handleProviderChange(nextProvider: ProviderType) {
    setProvider(nextProvider);
    setSaved(false);
    setTestResult(null);
    setMessage(null);

    const nextMeta = AVAILABLE_PROVIDERS.find((item) => item.id === nextProvider);
    if (nextMeta) {
      setModel(nextMeta.defaultModel);
      setBaseURL(nextMeta.defaultBaseURL);
    }

    if (storageMode === "hosted_encrypted") {
      const firstHosted = hostedCredentials.find((credential) => credential.provider_type === nextProvider && credential.status === "active" && !credential.deleted_at);
      setSelectedHostedCredentialId(firstHosted?.id ?? null);
      if (!firstHosted) {
        setLabel("");
      }
      setApiKey("");
      return;
    }

    const existing = loadApiKey(nextProvider, storageMode);
    if (existing) {
      setApiKey(existing.apiKey);
      setModel(existing.model);
      setBaseURL(existing.baseURL);
      setSaved(true);
    } else {
      setApiKey("");
    }
  }

  async function handleSave() {
    setMessage(null);
    setTestResult(null);
    if (storageMode === "hosted_encrypted") {
      if (!apiKey.trim()) {
        setMessage("请输入要托管保存的 API Key。");
        return;
      }
      setSaving(true);
      try {
        const credential = await saveHostedCredential({
          label: label.trim() || `${provider} 托管凭据`,
          provider_type: provider as Exclude<ProviderType, "mock">,
          base_url: baseURL.trim(),
          default_model: model.trim(),
          api_key: apiKey.trim(),
          set_default: setDefault,
        });
        setSelectedHostedCredentialId(credential.id);
        setApiKey("");
        setShowKey(false);
        setSaved(true);
        setMessage("托管加密凭据已保存，明文 Key 不会再次展示。");
        await refreshHostedCredentials();
      } catch (error) {
        setMessage(`托管保存失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!apiKey.trim()) {
      setMessage("请输入 API Key。");
      return;
    }

    const finalModel = model || meta?.defaultModel || "";
    const finalBaseURL = baseURL || meta?.defaultBaseURL || "";
    if (storageMode === "local_device") {
      saveApiKeyLocalDevice(provider, apiKey, finalModel, finalBaseURL);
    } else {
      saveApiKeySession(provider, apiKey, finalModel, finalBaseURL);
    }
    setSaved(true);
    setMessage("本地 BYOK 配置已保存。");
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    setTestResult(null);
    try {
      if (storageMode === "hosted_encrypted") {
        if (!selectedHostedCredentialId) {
          setMessage("请先选择或保存托管凭据。");
          return;
        }
        const result = await testHostedCredential(selectedHostedCredentialId);
        setTestResult(result);
        return;
      }

      if (!apiKey.trim()) {
        setTestResult({
          ok: false,
          error: {
            type: "missing_key",
            title: "缺少 API Key",
            status: 0,
            detail: "请先输入 API Key。",
            provider,
            retryable: false,
          },
        });
        return;
      }

      const result = await testProviderConnection(
        buildConfigFromStorage(provider, apiKey.trim(), storageMode, model, baseURL),
      );
      setTestResult(result);
    } catch (error) {
      setMessage(`测试失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleHostedDelete(credentialId: string) {
    const confirmed = window.confirm("删除后该托管凭据将不能继续使用，确定删除吗？");
    if (!confirmed) return;
    setBusyCredentialId(credentialId);
    setMessage(null);
    try {
      await deleteHostedCredential(credentialId);
      if (selectedHostedCredentialId === credentialId) {
        setSelectedHostedCredentialId(null);
      }
      setMessage("托管凭据已删除。");
      await refreshHostedCredentials();
    } catch (error) {
      setMessage(`删除凭据失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusyCredentialId(null);
    }
  }

  async function handleHostedSetDefault(credentialId: string) {
    setBusyCredentialId(credentialId);
    setMessage(null);
    try {
      const credential = await setDefaultHostedCredential(credentialId);
      setSelectedHostedCredentialId(credential.id);
      setMessage("默认托管凭据已更新。");
      await refreshHostedCredentials();
    } catch (error) {
      setMessage(`设置默认凭据失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusyCredentialId(null);
    }
  }

  function handleClearLocal() {
    clearApiKey(provider, storageMode);
    setApiKey("");
    setSaved(false);
    setTestResult(null);
    setMessage("本地配置已清除。");
  }

  if (isGuestOrDemo) {
    return (
      <div className="card">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-ink-300 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">API Provider</h3>
            <p className="text-xs text-ink-400 mt-1">当前是 Demo 模式，只走 Mock Provider，不会调用真实 API。</p>
            <p className="text-xs text-ink-300 mt-1">登录后可配置本地 BYOK 或托管加密凭据。</p>
          </div>
          <span className="text-xs text-amber-600 bg-amber-light rounded-full px-2 py-0.5 font-medium">Demo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-brand-500" />
        <h3 className="text-sm font-semibold text-ink-700">API Provider 设置</h3>
      </div>

      <div className={`rounded-card border px-3 py-2 ${storageMode === "hosted_encrypted" ? "bg-sky-50 border-sky-100" : "bg-amber-light/30 border-amber-100"}`}>
        <p className={`text-xs leading-relaxed ${storageMode === "hosted_encrypted" ? "text-sky-700" : "text-amber-700"}`}>
          {storageMode === "hosted_encrypted"
            ? "API Key 将在服务端加密保存，用于多设备同步。保存后无法查看明文，只能测试、替换或删除。托管模式当前通过 Edge Function 代理请求，暂不支持逐字流式输出，回复会在生成完成后一次性显示。"
            : "当前 API Key 只保存在本次会话或当前设备浏览器中，不会上送服务端。"}
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-500 mb-2">保存模式</label>
        <div className="space-y-2">
          {storageModes.map((mode) => {
            const localExisting = mode !== "hosted_encrypted" && hasStoredApiKey(provider, mode);
            return (
              <label
                key={mode}
                className={`flex items-start gap-3 rounded-card border p-3 transition-colors ${
                  storageMode === mode
                    ? "border-brand-300 bg-brand-50/30"
                    : "border-surface-100 bg-white hover:border-surface-200"
                }`}
              >
                <input
                  type="radio"
                  name="storageMode"
                  value={mode}
                  checked={storageMode === mode}
                  onChange={() => {
                    setStorageMode(mode);
                    setTestResult(null);
                    setMessage(null);
                    if (mode !== "hosted_encrypted") {
                      const existing = loadApiKey(provider, mode);
                      setApiKey(existing?.apiKey ?? "");
                      setSaved(!!existing);
                    } else {
                      setApiKey("");
                      setSaved(false);
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-ink-700">
                    {getStorageModeLabel(mode)}
                    {localExisting && <span className="ml-1.5 text-xs text-emerald-600">已保存</span>}
                  </span>
                  <p className="text-xs text-ink-300 mt-0.5">{getStorageModeDescription(mode)}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Provider</label>
        <select
          value={provider}
          onChange={(event) => handleProviderChange(event.target.value as ProviderType)}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900"
        >
          {AVAILABLE_PROVIDERS.filter((item) => item.id !== "mock").map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        {meta && <p className="text-xs text-ink-300 mt-1">{meta.description}</p>}
      </div>

      {storageMode === "hosted_encrypted" && (
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">凭据名称</label>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="例如：我的 DeepSeek 主账号"
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Model</label>
        <input
          type="text"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder={meta?.defaultModel || "model name"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Base URL</label>
        <input
          type="text"
          value={baseURL}
          onChange={(event) => setBaseURL(event.target.value)}
          placeholder={meta?.defaultBaseURL || "https://api.example.com/v1"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">API Key</label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value);
              setSaved(false);
              setTestResult(null);
              setMessage(null);
            }}
            placeholder={storageMode === "hosted_encrypted" ? "保存后不会再展示明文" : "sk-..."}
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 pr-16 text-sm text-ink-900 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-600 px-2 py-1"
          >
            {showKey ? "隐藏" : "显示"}
          </button>
        </div>
        {saved && storageMode !== "hosted_encrypted" && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> 已保存
          </p>
        )}
      </div>

      {storageMode === "hosted_encrypted" && (
        <label className="flex items-start gap-3 rounded-card border border-surface-100 bg-surface-50 px-4 py-3">
          <input type="checkbox" checked={setDefault} onChange={(event) => setSetDefault(event.target.checked)} className="mt-1" />
          <div>
            <p className="text-sm font-medium text-ink-700">设为默认托管凭据</p>
            <p className="text-xs text-ink-400 mt-1">新设备登录后可自动发现这个默认凭据，无需重新输入 Key。</p>
          </div>
        </label>
      )}

      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <button onClick={() => void handleSave()} disabled={saving} className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50">
          <Zap className="h-3.5 w-3.5" />
          {storageMode === "hosted_encrypted" ? "保存到托管加密" : "保存配置"}
        </button>
        <button onClick={() => void handleTest()} disabled={testing || (storageMode !== "hosted_encrypted" && !apiKey.trim())} className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50">
          {testing ? "测试中..." : "测试连接"}
        </button>
        {storageMode === "hosted_encrypted" ? (
          <button
            onClick={() => selectedHostedCredentialId && void handleHostedDelete(selectedHostedCredentialId)}
            disabled={!selectedHostedCredentialId || !!busyCredentialId}
            className="btn-ghost text-xs flex items-center gap-1.5 text-rose-600 hover:bg-rose-light/50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除凭据
          </button>
        ) : (
          <button onClick={handleClearLocal} className="btn-ghost text-xs flex items-center gap-1.5 text-rose-600 hover:bg-rose-light/50">
            <Trash2 className="h-3.5 w-3.5" />
            清除
          </button>
        )}
      </div>

      {message && <p className={`text-sm ${message.includes("失败") ? "text-rose-600" : "text-emerald-600"}`}>{message}</p>}

      {testResult && (
        <div className={`rounded-card border p-3 ${testResult.ok ? "bg-emerald-light/30 border-emerald-100" : "bg-rose-light/30 border-rose-100"}`}>
          <div className="flex items-center gap-2 mb-1">
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
            {testResult.latencyMs != null && <span className="text-xs text-ink-300 ml-auto">{testResult.latencyMs}ms</span>}
          </div>
          {testResult.error && <p className="text-xs text-rose-600 leading-relaxed">{testResult.error.detail}</p>}
          {testResult.models && testResult.models.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-ink-400 mb-1">可用模型：</p>
              <div className="flex flex-wrap gap-1">
                {testResult.models.slice(0, 10).map((item) => (
                  <span key={item} className="text-xs bg-white rounded-full px-2 py-0.5 text-ink-500 border border-surface-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {storageMode === "hosted_encrypted" && (
        <div className="space-y-3 border-t border-surface-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-ink-700">已保存托管凭据</h4>
              <p className="text-xs text-ink-400 mt-1">仅显示元数据，不展示明文 Key。</p>
            </div>
            <button onClick={() => void refreshHostedCredentials()} disabled={hostedLoading} className="btn-ghost text-xs disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </button>
          </div>
          {hostedCredentials.length === 0 ? (
            <p className="text-sm text-ink-400">暂无托管加密凭据。</p>
          ) : (
            <div className="space-y-3">
              {hostedCredentials.filter((credential) => credential.status !== "deleted" && !credential.deleted_at).map((credential) => (
                <div
                  key={credential.id}
                  className={`rounded-card border px-4 py-3 ${credential.id === selectedHostedCredentialId ? "border-brand-300 bg-brand-50/20" : "border-surface-100 bg-surface-50"}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-semibold text-ink-700">{credential.label || "未命名托管凭据"}</h5>
                        {credential.is_default && <span className="text-[10px] rounded-full bg-emerald-light px-2 py-0.5 text-emerald-700">默认</span>}
                        {credential.id === selectedHostedCredentialId && <span className="text-[10px] rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">当前使用</span>}
                      </div>
                      <p className="text-xs text-ink-400 mt-1">
                        {credential.provider_type} · {credential.default_model || "未设置模型"} · {credential.base_url || "默认 Base URL"}
                      </p>
                      <p className="text-xs text-ink-300 mt-1">
                        最后测试：{formatTime(credential.last_tested_at)} · 最后使用：{formatTime(credential.last_used_at)}
                      </p>
                      {credential.last_error && <p className="text-xs text-rose-600 mt-1">最近错误：{credential.last_error}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedHostedCredentialId(credential.id);
                          saveHostedCredentialSelection(selectionFromCredential(credential));
                          setProvider(credential.provider_type);
                          setModel(credential.default_model || "");
                          setBaseURL(credential.base_url || "");
                          setLabel(credential.label || "");
                        }}
                        className="btn-ghost text-xs"
                      >
                        设为当前使用
                      </button>
                      <button
                        onClick={async () => {
                          setBusyCredentialId(credential.id);
                          setSelectedHostedCredentialId(credential.id);
                          const result = await testHostedCredential(credential.id);
                          setTestResult(result);
                          setBusyCredentialId(null);
                          await refreshHostedCredentials();
                        }}
                        disabled={busyCredentialId === credential.id}
                        className="btn-secondary text-xs disabled:opacity-50"
                      >
                        测试
                      </button>
                      {!credential.is_default && (
                        <button
                          onClick={() => void handleHostedSetDefault(credential.id)}
                          disabled={busyCredentialId === credential.id}
                          className="btn-primary text-xs disabled:opacity-50"
                        >
                          设为默认
                        </button>
                      )}
                      <button
                        onClick={() => void handleHostedDelete(credential.id)}
                        disabled={busyCredentialId === credential.id}
                        className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50 disabled:opacity-50"
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
      )}
    </div>
  );
}

export function SettingsPage() {
  const { isGuestOrDemo } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-ink-100 text-ink-500 flex items-center justify-center">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">设置中心</h1>
        </div>
        <ModeBadge />
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-ink-300 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">当前 API 状态</h3>
            <p className="text-xs text-ink-300 mt-1">
              {isGuestOrDemo
                ? "Demo 模式 · 使用 Mock AI · 不调用真实 Provider"
                : "已支持本地 BYOK 与托管加密同步。托管模式通过 Edge Function 代理请求，前端不再持有明文 Key。"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ApiProviderCard />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide px-1">其他设置</h3>
        {otherSections.map(({ icon, title, desc, to, stage }) =>
          to ? (
            <Link key={title} to={to} className="card flex items-start gap-4 hover:bg-surface-50 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-surface-100 text-ink-400 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
                <p className="text-xs text-ink-300 mt-0.5">{desc}</p>
              </div>
              <span className="text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5 flex-shrink-0">{stage}</span>
            </Link>
          ) : (
            <div key={title} className="card flex items-start gap-4 hover:bg-surface-50 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-surface-100 text-ink-400 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
                <p className="text-xs text-ink-300 mt-0.5">{desc}</p>
              </div>
              <span className="text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5 flex-shrink-0">{stage}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
