import { useState } from "react";
import {
  Settings,
  User,
  Key,
  Database,
  Eye,
  Shield,
  Smartphone,
  Zap,
  Wifi,
  WifiOff,
  Trash2,
  Check,
  Info,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import {
  AVAILABLE_PROVIDERS,
  type ProviderType,
  type ApiKeyStorageMode,
  type TestResult,
} from "../features/roleplay/providers";
import {
  buildConfigFromStorage,
  testProviderConnection,
} from "../features/roleplay/providers/providerGateway";
import {
  saveApiKeySession,
  saveApiKeyLocalDevice,
  loadApiKey,
  clearApiKey,
  getStorageModeLabel,
  getStorageModeDescription,
  hasStoredApiKey,
} from "../features/roleplay/storage/apiKeyStorage";

// ---------- API Provider Settings Card ----------

function ApiProviderCard() {
  const { isGuestOrDemo } = useAuth();

  const [provider, setProvider] = useState<ProviderType>("deepseek");
  const [model, setModel] = useState("deepseek-chat");
  const [baseURL, setBaseURL] = useState("https://api.deepseek.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [storageMode, setStorageMode] = useState<ApiKeyStorageMode>("session_only");
  const [showKey, setShowKey] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const meta = AVAILABLE_PROVIDERS.find((p) => p.id === provider);

  function handleProviderChange(newProvider: ProviderType) {
    setProvider(newProvider);
    setTestResult(null);
    setSaved(false);

    const newMeta = AVAILABLE_PROVIDERS.find((p) => p.id === newProvider);
    if (newMeta) {
      setModel(newMeta.defaultModel);
      setBaseURL(newMeta.defaultBaseURL);

      // Try to load previously saved key for this provider
      const existing = loadApiKey(newProvider, storageMode);
      if (existing) {
        setApiKey(existing.apiKey);
        setModel(existing.model);
        setBaseURL(existing.baseURL);
        setSaved(true);
      } else {
        setApiKey("");
      }
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) return;

    const finalModel = model || meta?.defaultModel || "";
    const finalBaseURL = baseURL || meta?.defaultBaseURL || "";

    if (storageMode === "local_device") {
      saveApiKeyLocalDevice(provider, apiKey, finalModel, finalBaseURL);
    } else {
      saveApiKeySession(provider, apiKey, finalModel, finalBaseURL);
    }
    setSaved(true);
    setTestResult(null);
  }

  async function handleTest() {
    if (!apiKey.trim()) {
      setTestResult({
        ok: false,
        error: {
          type: "missing_key",
          title: "缺少 API Key",
          status: 0,
          detail: "请先输入 API Key",
          provider,
          retryable: false,
        },
      });
      return;
    }

    const config = buildConfigFromStorage(provider, apiKey, storageMode, model, baseURL);

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testProviderConnection(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        ok: false,
        error: {
          type: "unknown",
          title: "测试失败",
          status: 0,
          detail: String(err),
          provider,
          retryable: true,
        },
      });
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    clearApiKey(provider, storageMode);
    setApiKey("");
    setTestResult(null);
    setSaved(false);
  }

  if (isGuestOrDemo) {
    return (
      <div className="card">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-ink-300 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">API Provider</h3>
            <p className="text-xs text-ink-400 mt-1">
              当前为 Demo 模式，使用 Mock AI，不调用真实 API。
            </p>
            <p className="text-xs text-ink-300 mt-1">
              登录后即可配置自己的 DeepSeek 或 OpenAI 兼容 API Key。
            </p>
          </div>
          <span className="text-xs text-amber-600 bg-amber-light rounded-full px-2 py-0.5 font-medium">
            Demo
          </span>
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

      {/* Security notice */}
      <div className="rounded-card bg-amber-light/30 border border-amber-100 px-3 py-2">
        <p className="text-xs text-amber-700 leading-relaxed">
          当前 API Key 仅保存在本设备浏览器中，不会上传服务器。更换设备或清理浏览器数据后需要重新配置。你的 Key 不会被后台管理员查看。
        </p>
      </div>

      {/* Provider select */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Provider</label>
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {AVAILABLE_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {meta && (
          <p className="text-xs text-ink-300 mt-1">{meta.description}</p>
        )}
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Model</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={meta?.defaultModel || "model name"}
          disabled={provider === "mock"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
        />
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Base URL</label>
        <input
          type="text"
          value={baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
          placeholder={meta?.defaultBaseURL || "https://api.example.com/v1"}
          disabled={provider === "mock"}
          className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900 placeholder:text-ink-300 font-mono focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
        />
        {provider === "openai_compatible" && (
          <p className="text-xs text-sky-600 mt-1">OpenAI Compatible 模式需要提供 Base URL</p>
        )}
      </div>

      {/* API Key */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-1.5">API Key</label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
              setTestResult(null);
            }}
            placeholder={saved ? "已保存（密钥已隐藏）" : "sk-..."}
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 pr-16 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-600 px-2 py-1"
          >
            {showKey ? "隐藏" : "显示"}
          </button>
        </div>
        {saved && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> 已保存
          </p>
        )}
      </div>

      {/* Storage mode */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-2">保存模式</label>
        <div className="space-y-2">
          {(["session_only", "local_device", "hosted_encrypted_future"] as ApiKeyStorageMode[]).map(
            (mode) => {
              const disabled = mode === "hosted_encrypted_future";
              const hasExisting = !disabled && hasStoredApiKey(provider, mode);

              return (
                <label
                  key={mode}
                  className={`flex items-start gap-3 rounded-card border p-3 transition-colors ${
                    disabled
                      ? "opacity-50 cursor-not-allowed bg-surface-50"
                      : storageMode === mode
                        ? "border-brand-300 bg-brand-50/30 cursor-pointer"
                        : "border-surface-100 bg-white cursor-pointer hover:border-surface-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="storageMode"
                    value={mode}
                    checked={storageMode === mode}
                    onChange={() => !disabled && setStorageMode(mode)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-ink-700">
                      {getStorageModeLabel(mode)}
                      {hasExisting && (
                        <span className="ml-1.5 text-xs text-emerald-600">· 已有保存</span>
                      )}
                      {disabled && (
                        <span className="ml-1.5 text-xs text-ink-300">· 后续阶段 8 实现</span>
                      )}
                    </span>
                    <p className="text-xs text-ink-300 mt-0.5">
                      {getStorageModeDescription(mode)}
                    </p>
                  </div>
                </label>
              );
            },
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5" />
          保存配置
        </button>

        <button
          onClick={handleTest}
          disabled={testing || !apiKey.trim() || provider === "mock"}
          className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          {testing ? "测试中..." : "测试连接"}
        </button>

        <button
          onClick={handleClear}
          className="btn-ghost text-xs flex items-center gap-1.5 text-rose-600 hover:bg-rose-light/50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          清除
        </button>
      </div>

      {/* Connection status */}
      {testResult && (
        <div
          className={`rounded-card border p-3 ${
            testResult.ok
              ? "bg-emerald-light/30 border-emerald-100"
              : "bg-rose-light/30 border-rose-100"
          }`}
        >
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
            {testResult.latencyMs != null && (
              <span className="text-xs text-ink-300 ml-auto">{testResult.latencyMs}ms</span>
            )}
          </div>

          {testResult.error && (
            <p className="text-xs text-rose-600 leading-relaxed">{testResult.error.detail}</p>
          )}

          {testResult.models && testResult.models.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-ink-400 mb-1">可用模型：</p>
              <div className="flex flex-wrap gap-1">
                {testResult.models.slice(0, 10).map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-white rounded-full px-2 py-0.5 text-ink-500 border border-surface-100"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Other settings cards (placeholder) ----------

const otherSections = [
  { icon: <User className="h-5 w-5" />, title: "账号设置", desc: "个人信息、显示名称、头像", stage: "阶段 2 预留" },
  { icon: <Database className="h-5 w-5" />, title: "数据管理", desc: "备份、恢复、导入、导出", stage: "阶段 7 实现" },
  { icon: <Eye className="h-5 w-5" />, title: "外观设置", desc: "夜间模式、字体大小、气泡宽度", stage: "阶段 9 实现" },
  { icon: <Smartphone className="h-5 w-5" />, title: "移动端设置", desc: "离线草稿、PWA 安装", stage: "阶段 8-9" },
  { icon: <Shield className="h-5 w-5" />, title: "安全设置", desc: "API Key 管理、设备管理、访问日志", stage: "阶段 8 实现" },
];

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

      {/* API Status summary */}
      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-ink-300 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">当前 API 状态</h3>
            <p className="text-xs text-ink-300 mt-1">
              {isGuestOrDemo
                ? "Demo 模式 · 使用 Mock AI · 不调用真实 Provider"
                : "BYOK 本地版 · API Key 保存在本设备浏览器中 · 不上传服务器"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`h-2 w-2 rounded-full ${isGuestOrDemo ? "bg-amber-400" : "bg-emerald-400"}`}
              />
              <span className="text-xs font-medium text-ink-500">
                {isGuestOrDemo ? "Demo / Mock" : "BYOK 本地版"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Provider: primary interactive section */}
      <div className="mb-8">
        <ApiProviderCard />
      </div>

      {/* Other settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide px-1">
          其他设置
        </h3>
        {otherSections.map(({ icon, title, desc, stage }) => (
          <div
            key={title}
            className="card flex items-start gap-4 hover:bg-surface-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-surface-100 text-ink-400 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
              <p className="text-xs text-ink-300 mt-0.5">{desc}</p>
            </div>
            <span className="text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5 flex-shrink-0">
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
