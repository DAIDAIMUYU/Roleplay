import { Check, Trash2, Zap } from "lucide-react";
import type { ApiConfigEntry } from "../../storage/apiProviderConfigStorage";
import { getPresetName } from "../../providers/providerPresets";
import { getStorageModeLabel } from "../../storage/apiKeyStorage";
import { ProviderStatusDot } from "./ProviderStatusDot";

function formatTime(value: string | null): string {
  if (!value) return "未记录";
  return new Date(value).toLocaleString();
}

export function ProviderConfigCard({
  config,
  testing,
  enabling,
  onTest,
  onEnable,
  onDelete,
}: {
  config: ApiConfigEntry;
  testing: boolean;
  enabling: boolean;
  onTest: (id: string) => void;
  onEnable: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const providerName = getPresetName(config.provider);
  const storageLabel = getStorageModeLabel(config.storageMode);
  const testError = config.testStatus === "failed" && config.lastTestError ? (
    <p className="mt-1 truncate text-xs text-rose-600">{config.lastTestError}</p>
  ) : null;

  return (
    <div className={`neo-panel-soft px-4 py-3 ${config.enabled ? "ring-1 ring-brand-200/60" : ""}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-semibold text-ink-700">{config.label || providerName}</h5>
            <ProviderStatusDot status={config.testStatus} showLabel />
            <span className={`neo-pill px-2 py-0.5 text-[10px] ${config.enabled ? "bg-brand-100/75 text-brand-700" : "bg-surface-100/80 text-ink-400"}`}>
              {config.enabled ? "已启用" : "未启用"}
            </span>
          </div>
          <p className="mt-1 break-all text-xs text-ink-400 line-clamp-1">
            {providerName} / {config.model || "未选择模型"} · {storageLabel}
            {config.storageMode === "hosted_encrypted" && config.credentialId ? " · 托管凭据" : ""}
          </p>
          <p className="text-xs text-ink-300">
            最近测试：{formatTime(config.lastTestedAt)}
            {config.lastTestedLatencyMs != null ? ` · ${config.lastTestedLatencyMs}ms` : ""}
            {config.lastUsedAt ? ` · 最近使用：${formatTime(config.lastUsedAt)}` : ""}
          </p>
          {testError}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onTest(config.id)} disabled={testing} className="neo-button rounded-[18px] px-3 py-2 text-xs text-ink-600 disabled:opacity-50">
            <Zap className="h-3.5 w-3.5" />
            {testing ? "测试中..." : "测试连接"}
          </button>
          {!config.enabled ? (
            <button onClick={() => onEnable(config.id)} disabled={enabling} className="neo-button-primary rounded-[18px] px-3 py-2 text-xs disabled:opacity-50">
              <Check className="h-3.5 w-3.5" />
              设为启用
            </button>
          ) : null}
          <button onClick={() => onDelete(config.id)} className="neo-button rounded-[18px] px-3 py-2 text-xs text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
