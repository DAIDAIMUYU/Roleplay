import { Check, Trash2, Zap } from "lucide-react";
import { ProviderStatusDot } from "./ProviderStatusDot";
import type { ApiConfigEntry } from "../../storage/apiProviderConfigStorage";
import { getPresetName } from "../../providers/providerPresets";
import { getStorageModeLabel } from "../../storage/apiKeyStorage";

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
  const enabledBadge = config.enabled ? (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">已启用</span>
  ) : (
    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] text-ink-400">未启用</span>
  );

  const testError = config.testStatus === "failed" && config.lastTestError ? (
    <p className="mt-1 text-xs text-rose-600 truncate">{config.lastTestError}</p>
  ) : null;

  const providerName = getPresetName(config.provider);
  const storageLabel = getStorageModeLabel(config.storageMode);

  return (
    <div
      className={`rounded-card border px-4 py-3 ${
        config.enabled ? "border-brand-200 bg-brand-50/20" : "border-surface-100 bg-surface-50"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-semibold text-ink-700">
              {config.label || providerName}
            </h5>
            <ProviderStatusDot status={config.testStatus} showLabel />
            {enabledBadge}
          </div>
          <p className="mt-1 text-xs text-ink-400 break-all line-clamp-1">
            {providerName} / {config.model || "未选择模型"} · {storageLabel}
            {config.storageMode === "hosted_encrypted" && config.credentialId
              ? " · 托管凭据"
              : ""}
          </p>
          <p className="text-xs text-ink-300">
            最近测试：{formatTime(config.lastTestedAt)}
            {config.lastTestedLatencyMs != null ? ` · ${config.lastTestedLatencyMs}ms` : ""}
            {config.lastUsedAt ? ` · 最近使用：${formatTime(config.lastUsedAt)}` : ""}
          </p>
          {testError}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTest(config.id)}
            disabled={testing}
            className="btn-secondary text-xs disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {testing ? "测试中..." : "测试连接"}
          </button>
          {!config.enabled ? (
            <button
              onClick={() => onEnable(config.id)}
              disabled={enabling}
              className="btn-primary text-xs disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              设为启用
            </button>
          ) : null}
          <button
            onClick={() => onDelete(config.id)}
            className="btn-ghost text-xs text-rose-600 hover:bg-rose-light/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
