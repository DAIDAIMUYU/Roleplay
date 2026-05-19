import type { ApiConfigTestStatus } from "../../storage/apiProviderConfigStorage";

const STATUS_CONFIG: Record<ApiConfigTestStatus, { color: string; label: string }> = {
  untested: { color: "bg-ink-300", label: "未测试" },
  ok: { color: "bg-emerald-500", label: "测试成功" },
  failed: { color: "bg-rose-500", label: "测试失败" },
};

export function ProviderStatusDot({
  status,
  showLabel,
}: {
  status: ApiConfigTestStatus;
  showLabel?: boolean;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${cfg.color}`} title={cfg.label} />
      {showLabel ? <span className="text-xs text-ink-400">{cfg.label}</span> : null}
    </span>
  );
}
