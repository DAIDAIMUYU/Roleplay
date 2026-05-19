import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  HardDrive,
  Info,
  Key,
  Laptop,
  Paintbrush,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  User,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { DataSyncPanel } from "../features/roleplay/components/settings/DataSyncPanel";
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
  loadHostedCredentialSelection,
  saveHostedCredential,
  saveHostedCredentialSelection,
  selectionFromCredential,
  setDefaultHostedCredential,
  testHostedCredential,
} from "../features/roleplay/services/hostedCredentialsService";
import type { ProviderCredentialRow } from "../features/roleplay/types/database";

const storageModes: ApiKeyStorageMode[] = ["session_only", "local_device", "hosted_encrypted"];

function formatTime(value: string | null): string {
  if (!value) return "未记录";
  return new Date(value).toLocaleString();
}

function getProviderDisplayName(provider: ProviderType): string {
  switch (provider) {
    case "deepseek":
      return "DeepSeek";
    case "openai_compatible":
      return "OpenAI Compatible";
    default:
      return "本地预览";
  }
}

function getCurrentCredentialSummary() {
  const hosted = loadHostedCredentialSelection();
  if (hosted) {
    return {
      title: "托管加密",
      detail: `当前启用 ${getProviderDisplayName(hosted.provider)} / ${hosted.model || "未选择模型"}，API Key 通过服务端加密保存在云端凭据库中。`,
    };
  }

  const providers: ProviderType[] = ["deepseek", "openai_compatible"];
  for (const provider of providers) {
    const local = loadApiKey(provider, "local_device");
    if (local) {
      return {
        title: "本地设备",
        detail: `当前设备已保存 ${getProviderDisplayName(provider)} / ${local.model || "未选择模型"}，不会上传云端。`,
      };
    }
  }

  for (const provider of providers) {
    const session = loadApiKey(provider, "session_only");
    if (session) {
      return {
        title: "临时会话",
        detail: `当前网页会话已填写 ${getProviderDisplayName(provider)} / ${session.model || "未选择模型"}，关闭页面或刷新后可能需要重新填写。`,
      };
    }
  }

  return {
    title: "未配置",
    detail: "尚未配置 API，当前无法调用真实模型。",
  };
}

function SectionCard({
  icon,
  title,
  description,
  status,
  to,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status?: string;
  to?: string | null;
}) {
  const content = (
    <>
      <div className="h-10 w-10 rounded-xl bg-surface-50 text-ink-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
          {status ? (
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
              {status}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-400">{description}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card flex items-start gap-4 transition-colors hover:bg-surface-50">
        {content}
      </Link>
    );
  }

  return <div className="card flex items-start gap-4">{content}</div>;
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
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [hostedCredentials, setHostedCredentials] = useState<ProviderCredentialRow[]>([]);
  const [selectedHostedCredentialId, setSelectedHostedCredentialId] = useState<string | null>(null);
  const [hostedLoading, setHostedLoading] = useState(false);
  const [busyCredentialId, setBusyCredentialId] = useState<string | null>(null);

  const meta = AVAILABLE_PROVIDERS.find((item) => item.id === provider);
  const selectedHostedCredential = hostedCredentials.find((item) => item.id === selectedHostedCredentialId) ?? null;
  const hostedAvailable = !isGuestOrDemo && !!userId;

  const hostedByProvider = useMemo(
    () =>
      hostedCredentials.filter(
        (credential) =>
          credential.provider_type === provider &&
          credential.status === "active" &&
          !credential.deleted_at,
      ),
    [hostedCredentials, provider],
  );

  async function refreshHostedCredentials() {
    if (!hostedAvailable) return;
    setHostedLoading(true);
    try {
      const credentials = await listHostedCredentials();
      setHostedCredentials(credentials);

      const activeSelection =
        credentials.find(
          (credential) =>
            credential.id === selectedHostedCredentialId &&
            credential.status === "active" &&
            !credential.deleted_at,
        ) ?? null;

      if (activeSelection) {
        saveHostedCredentialSelection(selectionFromCredential(activeSelection));
        return;
      }

      const persisted = loadHostedCredentialSelection();
      const persistedMatch =
        credentials.find(
          (credential) =>
            credential.id === persisted?.credentialId &&
            credential.status === "active" &&
            !credential.deleted_at,
        ) ?? null;

      const fallback =
        persistedMatch ??
        credentials.find((credential) => credential.is_default && credential.status === "active" && !credential.deleted_at) ??
        credentials.find((credential) => credential.status === "active" && !credential.deleted_at) ??
        null;

      setSelectedHostedCredentialId(fallback?.id ?? null);
      if (fallback) {
        const selection = selectionFromCredential(fallback);
        saveHostedCredentialSelection(selection);
        setProvider(selection.provider);
        setModel(selection.model || "");
        setBaseURL(selection.baseURL || "");
        setLabel(selection.label || "");
      }
    } catch (error) {
      setMessage(`读取托管凭据失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setHostedLoading(false);
    }
  }

  useEffect(() => {
    if (!hostedAvailable) return;
    void refreshHostedCredentials();
  }, [hostedAvailable]);

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
    setTestResult(null);
    setMessage(null);

    const nextMeta = AVAILABLE_PROVIDERS.find((item) => item.id === nextProvider);
    if (nextMeta) {
      setModel(nextMeta.defaultModel);
      setBaseURL(nextMeta.defaultBaseURL);
    }

    if (storageMode === "hosted_encrypted") {
      const firstHosted =
        hostedCredentials.find(
          (credential) =>
            credential.provider_type === nextProvider &&
            credential.status === "active" &&
            !credential.deleted_at,
        ) ?? null;
      setSelectedHostedCredentialId(firstHosted?.id ?? null);
      setApiKey("");
      if (!firstHosted) setLabel("");
      return;
    }

    const existing = loadApiKey(nextProvider, storageMode);
    setApiKey(existing?.apiKey ?? "");
    if (existing) {
      setModel(existing.model);
      setBaseURL(existing.baseURL);
    }
  }

  async function handleSave() {
    setMessage(null);
    setTestResult(null);

    if (storageMode === "hosted_encrypted") {
      if (!hostedAvailable) {
        setMessage("托管加密需要先登录，登录后才可以把 API Key 加密保存到云端。");
        return;
      }
      if (!apiKey.trim()) {
        setMessage("请输入要保存的 API Key。");
        return;
      }

      setSaving(true);
      try {
        const credential = await saveHostedCredential({
          label: label.trim() || `${getProviderDisplayName(provider)} 托管凭据`,
          provider_type: provider as Exclude<ProviderType, "mock">,
          base_url: baseURL.trim(),
          default_model: model.trim(),
          api_key: apiKey.trim(),
          set_default: setDefault,
        });
        setSelectedHostedCredentialId(credential.id);
        setApiKey("");
        setShowKey(false);
        setMessage("托管加密凭据已保存。明文 API Key 不会再显示在前端。");
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

    const finalModel = model.trim() || meta?.defaultModel || "";
    const finalBaseURL = baseURL.trim() || meta?.defaultBaseURL || "";

    if (storageMode === "local_device") {
      saveApiKeyLocalDevice(provider, apiKey.trim(), finalModel, finalBaseURL);
    } else {
      saveApiKeySession(provider, apiKey.trim(), finalModel, finalBaseURL);
    }

    setMessage("当前配置已保存。");
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
        await refreshHostedCredentials();
        return;
      }

      if (!apiKey.trim()) {
        setTestResult({
          ok: false,
          error: {
            type: "missing_key",
            title: "缺少 API Key",
            status: 0,
            detail: "请先填写 API Key。",
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

  function handleClearLocal() {
    clearApiKey(provider, storageMode);
    setApiKey("");
    setTestResult(null);
    setMessage("当前浏览器中的本地 API 配置已清除。");
  }

  async function handleHostedDelete(credentialId: string) {
    if (!window.confirm("删除后，这个托管凭据将不能继续使用。确定删除吗？")) return;
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
      setMessage(`删除托管凭据失败：${error instanceof Error ? error.message : String(error)}`);
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

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-brand-500" />
        <h3 className="text-sm font-semibold text-ink-700">API Provider</h3>
      </div>

      <div className={`rounded-card border px-3 py-3 text-xs leading-relaxed ${storageMode === "hosted_encrypted" ? "border-sky-100 bg-sky-50 text-sky-700" : "border-amber-100 bg-amber-light/30 text-amber-800"}`}>
        {storageMode === "hosted_encrypted"
          ? "托管加密会把 API Key 交给服务端加密保存。前端不会再展示明文 Key，适合跨设备使用。删除托管凭据后，对应 Key 将不可再用。"
          : "当前选择的是本地保存模式。API Key 只会留在当前网页会话或当前浏览器本地，不会上传到云端。"}
      </div>

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
                    setTestResult(null);
                    setMessage(null);
                    if (mode === "hosted_encrypted") {
                      setApiKey("");
                      return;
                    }
                    const existing = loadApiKey(provider, mode);
                    setApiKey(existing?.apiKey ?? "");
                    if (existing) {
                      setModel(existing.model);
                      setBaseURL(existing.baseURL);
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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-500">Provider</label>
        <select
          value={provider}
          onChange={(event) => handleProviderChange(event.target.value as ProviderType)}
          className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
        >
          {AVAILABLE_PROVIDERS.filter((item) => item.id !== "mock").map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        {meta ? <p className="mt-1 text-xs text-ink-400">{meta.description}</p> : null}
      </div>

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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-500">模型</label>
        <input
          type="text"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder={meta?.defaultModel || "model"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-500">Base URL</label>
        <input
          type="text"
          value={baseURL}
          onChange={(event) => setBaseURL(event.target.value)}
          placeholder={meta?.defaultBaseURL || "https://api.example.com/v1"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 px-3 py-2 font-mono text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-500">API Key</label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value);
              setMessage(null);
              setTestResult(null);
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

      {storageMode === "hosted_encrypted" ? (
        <label className="flex items-start gap-3 rounded-card border border-surface-100 bg-surface-50 px-4 py-3">
          <input type="checkbox" checked={setDefault} onChange={(event) => setSetDefault(event.target.checked)} className="mt-1" />
          <div>
            <p className="text-sm font-medium text-ink-700">保存后设为默认托管凭据</p>
            <p className="mt-1 text-xs text-ink-400">后续在已登录设备上可以更快选中它，但不会自动替你启用聊天配置。</p>
          </div>
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => void handleSave()}
          disabled={saving || (storageMode === "hosted_encrypted" && !hostedAvailable)}
          className="btn-secondary text-xs disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5" />
          {storageMode === "hosted_encrypted" ? "保存到托管加密" : "保存配置"}
        </button>
        <button
          onClick={() => void handleTest()}
          disabled={
            testing ||
            (storageMode === "hosted_encrypted"
              ? !selectedHostedCredentialId
              : !apiKey.trim())
          }
          className="btn-primary text-xs disabled:opacity-50"
        >
          {testing ? "测试中..." : "测试连接"}
        </button>
        {storageMode === "hosted_encrypted" ? (
          <button
            onClick={() => selectedHostedCredentialId && void handleHostedDelete(selectedHostedCredentialId)}
            disabled={!selectedHostedCredentialId || !!busyCredentialId}
            className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除凭据
          </button>
        ) : (
          <button
            onClick={handleClearLocal}
            className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清除本地配置
          </button>
        )}
      </div>

      {message ? (
        <p className={`text-sm ${message.includes("失败") ? "text-rose-600" : "text-emerald-600"}`}>{message}</p>
      ) : null}

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
            <p className="text-xs text-emerald-700">当前配置可用。测试成功不会自动启用聊天配置。</p>
          ) : (
            <p className="text-xs text-rose-600 leading-relaxed">{testResult.error?.detail || "请检查当前配置后重试。"}</p>
          )}
        </div>
      ) : null}

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
            <div className="rounded-card border border-surface-100 bg-surface-50 px-4 py-3 text-sm text-ink-500">
              托管加密需要先登录。登录后可在多设备之间复用同一个托管凭据。
            </div>
          ) : hostedCredentials.filter((credential) => credential.status !== "deleted" && !credential.deleted_at).length === 0 ? (
            <p className="text-sm text-ink-400">还没有托管加密凭据。</p>
          ) : (
            <div className="space-y-3">
              {hostedCredentials
                .filter((credential) => credential.status !== "deleted" && !credential.deleted_at)
                .map((credential) => (
                  <div
                    key={credential.id}
                    className={`rounded-card border px-4 py-3 ${credential.id === selectedHostedCredentialId ? "border-brand-300 bg-brand-50/20" : "border-surface-100 bg-surface-50"}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-semibold text-ink-700">{credential.label || "未命名托管凭据"}</h5>
                          {credential.is_default ? (
                            <span className="rounded-full bg-emerald-light px-2 py-0.5 text-[10px] text-emerald-700">默认</span>
                          ) : null}
                          {credential.id === selectedHostedCredentialId ? (
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">当前选择</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {getProviderDisplayName(credential.provider_type)} / {credential.default_model || "未设置模型"} / {credential.base_url || "默认 Base URL"}
                        </p>
                        <p className="mt-1 text-xs text-ink-300">
                          最近测试：{formatTime(credential.last_tested_at)} / 最近使用：{formatTime(credential.last_used_at)}
                        </p>
                        {credential.last_error ? (
                          <p className="mt-1 text-xs text-rose-600">最近错误：{credential.last_error}</p>
                        ) : null}
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
                            setMessage("已切换当前托管凭据。");
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
                        {!credential.is_default ? (
                          <button
                            onClick={() => void handleHostedSetDefault(credential.id)}
                            disabled={busyCredentialId === credential.id}
                            className="btn-primary text-xs disabled:opacity-50"
                          >
                            设为默认
                          </button>
                        ) : null}
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
      ) : null}
    </div>
  );
}

export function SettingsPage() {
  const { isGuestOrDemo, user } = useAuth();
  const currentCredential = getCurrentCredentialSummary();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
          <Settings className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink-900">设置中心</h1>
          <p className="mt-1 text-sm text-ink-400">
            在这里管理 API 凭据、数据备份、本地存储风险与同步状态。
          </p>
        </div>
        <ModeBadge />
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-ink-300" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">当前状态</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">当前客户端</p>
                <p className="mt-1 text-sm font-medium text-ink-700">网页模式</p>
                <p className="mt-1 text-xs text-ink-400">当前 MVP 默认通过浏览器访问。桌面模式与移动 App 模式暂未推出。</p>
              </div>
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">数据保存位置</p>
                <p className="mt-1 text-sm font-medium text-ink-700">{user ? "云端同步模式" : "本地数据模式"}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {user
                    ? "云端数据库保存主数据，当前设备会保留本地镜像。"
                    : "数据仅保存在当前浏览器中，不会上传云端。"}
                </p>
              </div>
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">API 凭据状态</p>
                <p className="mt-1 text-sm font-medium text-ink-700">{currentCredential.title}</p>
                <p className="mt-1 text-xs text-ink-400">{currentCredential.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ApiProviderCard />
      </div>

      <div className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-ink-500">其他设置</h2>
        <SectionCard
          icon={<Database className="h-5 w-5" />}
          title="数据管理"
          description="查看本地备份、导入恢复、回收站和数据统计。导出文件不会包含 API Key、密文、IV 或其他 Secrets。"
          status="本地可用"
          to="/settings/data"
        />
        <DataSyncPanel userId={user?.id ?? null} isLoggedIn={!!user} />
        <SectionCard
          icon={<HardDrive className="h-5 w-5" />}
          title="本地存储"
          description="网页模式下，角色、会话、世界书、记忆等数据默认保存在当前浏览器的本地数据库中。清除浏览器网站数据、无痕模式结束、更换浏览器或更换设备后，本地数据可能无法恢复。"
          status="风险已说明"
        />
        <SectionCard
          icon={<User className="h-5 w-5" />}
          title="账号设置"
          description={user ? "查看当前登录账号，并准备后续的同步、个人资料和设备管理。" : "登录后可以启用云端同步；如果你不想上传本地数据，也可以继续只使用本地模式。"}
          status={user ? "已登录" : "可选"}
        />
        <SectionCard
          icon={<Paintbrush className="h-5 w-5" />}
          title="外观设置"
          description="准备承接后续的主题、字号、卡片密度和移动端展示优化。"
          status="暂未推出"
        />
        <SectionCard
          icon={<Shield className="h-5 w-5" />}
          title="安全与备份说明"
          description="安全状态已经融入 API 凭据保存位置、数据同步方式和数据备份规则中，不再单独放一个空泛的安全入口。"
          status="已整合"
        />
        <SectionCard
          icon={<Laptop className="h-5 w-5" />}
          title="暂未推出功能"
          description="桌面模式、移动 App 模式和更多设备形态会在后续版本补齐；当前手机浏览器访问仍然属于网页模式。"
          status="暂未推出"
        />
      </div>

      {isGuestOrDemo ? (
        <div className="mt-6 rounded-card border border-amber-100 bg-amber-light/20 px-4 py-3 text-xs leading-relaxed text-amber-800">
          你当前处于网页本地模式。现在就可以继续浏览、预览和配置本地 API；登录后才会开启云端同步与托管加密凭据。
        </div>
      ) : null}
    </div>
  );
}
